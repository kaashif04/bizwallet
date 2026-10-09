-- =============================================================================
-- POS Menu Hierarchy
-- =============================================================================
-- Architecture: the physical POS is the 100% source of truth for menu
-- categories, items, and modifiers. There is no Next.js admin UI to create or
-- edit any of this data — it only ever enters the database through the
-- sync_full_menu() RPC below, called by POST /api/pos/v1/sync-full-menu.
--
-- Every table here carries external_pos_id so the POS's own identifiers are
-- the upsert key (idempotent re-syncs). menu_items already had
-- external_pos_id + last_synced_at from the initial schema (used by the
-- older, flatter /api/pos/v1/sync-menu route) — this migration adds the
-- category/modifier layers around it.
-- -----------------------------------------------------------------------------

-- -----------------------------------------------------------------------------
-- 1. Categories
-- -----------------------------------------------------------------------------
create table if not exists public.menu_categories (
  id              uuid primary key default gen_random_uuid(),
  outlet_id       uuid not null references public.outlets (id) on delete cascade,
  name            text not null,
  display_order   integer not null default 0,
  is_active       boolean not null default true,
  external_pos_id text,
  last_synced_at  timestamptz,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  unique (outlet_id, external_pos_id)
);

create index if not exists menu_categories_outlet_id_idx on public.menu_categories (outlet_id);

drop trigger if exists set_menu_categories_updated_at on public.menu_categories;
create trigger set_menu_categories_updated_at
  before update on public.menu_categories
  for each row execute function public.set_updated_at();

-- -----------------------------------------------------------------------------
-- 2. menu_items gains category_id. The existing free-text `category` column
-- stays (the customer order flow and menu-variants logic still key off it) —
-- sync_full_menu() keeps both in sync by writing the category's name into it.
-- -----------------------------------------------------------------------------
alter table public.menu_items
  add column if not exists category_id uuid references public.menu_categories (id) on delete set null;

create index if not exists menu_items_category_id_idx on public.menu_items (category_id);

-- -----------------------------------------------------------------------------
-- 3. Modifier groups (e.g. "Size", "Spice level") — owned by one menu item.
-- The POS payload nests modifiers directly under each item, so a group is
-- scoped to a single item rather than shared/reusable across items.
-- -----------------------------------------------------------------------------
create table if not exists public.modifier_groups (
  id              uuid primary key default gen_random_uuid(),
  item_id         uuid not null references public.menu_items (id) on delete cascade,
  name            text not null,
  selection_type  text not null default 'single' check (selection_type in ('single', 'multiple')),
  is_required     boolean not null default false,
  display_order   integer not null default 0,
  is_active       boolean not null default true,
  external_pos_id text,
  last_synced_at  timestamptz,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  unique (item_id, external_pos_id)
);

create index if not exists modifier_groups_item_id_idx on public.modifier_groups (item_id);

drop trigger if exists set_modifier_groups_updated_at on public.modifier_groups;
create trigger set_modifier_groups_updated_at
  before update on public.modifier_groups
  for each row execute function public.set_updated_at();

-- -----------------------------------------------------------------------------
-- 4. Modifier options (e.g. "Large", "Extra shot") — owned by one group.
-- price_delta is added to the item's base price when selected; it's allowed
-- to be negative (e.g. "No rice" style discount modifiers).
-- -----------------------------------------------------------------------------
create table if not exists public.modifier_options (
  id              uuid primary key default gen_random_uuid(),
  group_id        uuid not null references public.modifier_groups (id) on delete cascade,
  name            text not null,
  price_delta     numeric(10,2) not null default 0,
  is_available    boolean not null default true,
  display_order   integer not null default 0,
  external_pos_id text,
  last_synced_at  timestamptz,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  unique (group_id, external_pos_id)
);

create index if not exists modifier_options_group_id_idx on public.modifier_options (group_id);

drop trigger if exists set_modifier_options_updated_at on public.modifier_options;
create trigger set_modifier_options_updated_at
  before update on public.modifier_options
  for each row execute function public.set_updated_at();

-- -----------------------------------------------------------------------------
-- 5. RLS — customers/anyone can read (needed to render the menu); there is no
-- write policy because the only writer is sync_full_menu(), a SECURITY
-- DEFINER function called via the service-role client, which bypasses RLS
-- entirely. This mirrors marketing_campaigns: service-role-only writes, no
-- browser client ever touches these tables directly.
-- -----------------------------------------------------------------------------
alter table public.menu_categories  enable row level security;
alter table public.modifier_groups  enable row level security;
alter table public.modifier_options enable row level security;

drop policy if exists "menu_categories: public read" on public.menu_categories;
create policy "menu_categories: public read"
  on public.menu_categories for select using (true);
drop policy if exists "modifier_groups: public read" on public.modifier_groups;
create policy "modifier_groups: public read"
  on public.modifier_groups for select using (true);
drop policy if exists "modifier_options: public read" on public.modifier_options;
create policy "modifier_options: public read"
  on public.modifier_options for select using (true);

-- -----------------------------------------------------------------------------
-- 6. sync_full_menu(p_outlet_id, p_payload) — the one and only write path.
-- -----------------------------------------------------------------------------
-- p_payload shape:
-- {
--   "categories": [
--     {
--       "external_pos_id": "CAT_DRINKS", "name": "Drinks", "display_order": 1,
--       "items": [
--         {
--           "external_pos_id": "ITEM_LATTE", "name": "Caffe Latte",
--           "description": "...", "price": 12.90, "stock_quantity": 50,
--           "is_available": true,
--           "modifier_groups": [
--             {
--               "external_pos_id": "MOD_SIZE", "name": "Size",
--               "selection_type": "single", "is_required": true,
--               "display_order": 1,
--               "options": [
--                 { "external_pos_id": "OPT_REG", "name": "Regular", "price_delta": 0 },
--                 { "external_pos_id": "OPT_LG",  "name": "Large",   "price_delta": 2.00 }
--               ]
--             }
--           ]
--         }
--       ]
--     }
--   ]
-- }
--
-- Every category/item/group/option in the payload must carry external_pos_id
-- — that's the upsert key at each level, scoped to its parent. Anything of
-- ours NOT present in this sync (and that itself has an external_pos_id, i.e.
-- it's POS-owned data, not something pre-existing/manual) gets soft
-- deactivated rather than deleted: reversible if the next sync brings it
-- back, safe against a partial/buggy payload wiping out the menu.
create or replace function public.sync_full_menu(
  p_outlet_id uuid,
  p_payload   jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_now             timestamptz := now();
  v_category         jsonb;
  v_item             jsonb;
  v_group            jsonb;
  v_option           jsonb;
  v_category_id      uuid;
  v_item_id          uuid;
  v_group_id         uuid;
  v_option_id        uuid;
  v_category_ids     uuid[] := '{}';
  v_item_ids         uuid[] := '{}';
  v_group_ids        uuid[] := '{}';
  v_option_ids       uuid[] := '{}';
  v_categories_count integer := 0;
  v_items_count      integer := 0;
  v_groups_count     integer := 0;
  v_options_count    integer := 0;
  v_categories_deact integer;
  v_items_deact      integer;
  v_groups_deact     integer;
  v_options_deact    integer;
begin
  if not exists (select 1 from public.outlets where id = p_outlet_id) then
    raise exception 'Unknown outlet_id %', p_outlet_id using errcode = '22023';
  end if;

  for v_category in select * from jsonb_array_elements(coalesce(p_payload->'categories', '[]'::jsonb))
  loop
    if v_category->>'external_pos_id' is null or v_category->>'name' is null then
      raise exception 'Each category needs external_pos_id and name' using errcode = '22023';
    end if;

    insert into public.menu_categories (
      outlet_id, external_pos_id, name, display_order, is_active, last_synced_at
    )
    values (
      p_outlet_id,
      v_category->>'external_pos_id',
      v_category->>'name',
      coalesce((v_category->>'display_order')::int, 0),
      true,
      v_now
    )
    on conflict (outlet_id, external_pos_id) do update
      set name           = excluded.name,
          display_order  = excluded.display_order,
          is_active       = true,
          last_synced_at = v_now,
          updated_at     = v_now
    returning id into v_category_id;

    v_category_ids := array_append(v_category_ids, v_category_id);
    v_categories_count := v_categories_count + 1;

    for v_item in select * from jsonb_array_elements(coalesce(v_category->'items', '[]'::jsonb))
    loop
      if v_item->>'external_pos_id' is null or v_item->>'name' is null or v_item->>'price' is null then
        raise exception 'Each item needs external_pos_id, name and price' using errcode = '22023';
      end if;

      insert into public.menu_items (
        outlet_id, category_id, category, external_pos_id, name, description,
        price, stock_quantity, is_available, last_synced_at
      )
      values (
        p_outlet_id,
        v_category_id,
        v_category->>'name',
        v_item->>'external_pos_id',
        v_item->>'name',
        v_item->>'description',
        (v_item->>'price')::numeric,
        coalesce((v_item->>'stock_quantity')::int, 0),
        coalesce((v_item->>'is_available')::boolean, true),
        v_now
      )
      on conflict (outlet_id, external_pos_id) do update
        set category_id    = excluded.category_id,
            category       = excluded.category,
            name           = excluded.name,
            description    = excluded.description,
            price          = excluded.price,
            stock_quantity = excluded.stock_quantity,
            is_available   = excluded.is_available,
            last_synced_at = v_now,
            updated_at     = v_now
      returning id into v_item_id;

      v_item_ids := array_append(v_item_ids, v_item_id);
      v_items_count := v_items_count + 1;

      for v_group in select * from jsonb_array_elements(coalesce(v_item->'modifier_groups', '[]'::jsonb))
      loop
        if v_group->>'external_pos_id' is null or v_group->>'name' is null then
          raise exception 'Each modifier group needs external_pos_id and name' using errcode = '22023';
        end if;

        insert into public.modifier_groups (
          item_id, external_pos_id, name, selection_type, is_required,
          display_order, is_active, last_synced_at
        )
        values (
          v_item_id,
          v_group->>'external_pos_id',
          v_group->>'name',
          coalesce(v_group->>'selection_type', 'single'),
          coalesce((v_group->>'is_required')::boolean, false),
          coalesce((v_group->>'display_order')::int, 0),
          true,
          v_now
        )
        on conflict (item_id, external_pos_id) do update
          set name           = excluded.name,
              selection_type = excluded.selection_type,
              is_required    = excluded.is_required,
              display_order  = excluded.display_order,
              is_active       = true,
              last_synced_at = v_now,
              updated_at     = v_now
        returning id into v_group_id;

        v_group_ids := array_append(v_group_ids, v_group_id);
        v_groups_count := v_groups_count + 1;

        for v_option in select * from jsonb_array_elements(coalesce(v_group->'options', '[]'::jsonb))
        loop
          if v_option->>'external_pos_id' is null or v_option->>'name' is null then
            raise exception 'Each modifier option needs external_pos_id and name' using errcode = '22023';
          end if;

          insert into public.modifier_options (
            group_id, external_pos_id, name, price_delta, is_available,
            display_order, last_synced_at
          )
          values (
            v_group_id,
            v_option->>'external_pos_id',
            v_option->>'name',
            coalesce((v_option->>'price_delta')::numeric, 0),
            coalesce((v_option->>'is_available')::boolean, true),
            coalesce((v_option->>'display_order')::int, 0),
            v_now
          )
          on conflict (group_id, external_pos_id) do update
            set name           = excluded.name,
                price_delta    = excluded.price_delta,
                is_available   = excluded.is_available,
                display_order  = excluded.display_order,
                last_synced_at = v_now,
                updated_at     = v_now
          returning id into v_option_id;

          v_option_ids := array_append(v_option_ids, v_option_id);
          v_options_count := v_options_count + 1;
        end loop;
      end loop;
    end loop;
  end loop;

  -- Soft-deactivate anything POS-owned (external_pos_id is not null) for this
  -- outlet that wasn't in this sync. Hand-seeded/demo rows (external_pos_id
  -- null) are never touched here.
  update public.menu_categories
    set is_active = false, updated_at = v_now
    where outlet_id = p_outlet_id
      and external_pos_id is not null
      and not (id = any(v_category_ids));
  get diagnostics v_categories_deact = row_count;

  update public.menu_items
    set is_available = false, updated_at = v_now
    where outlet_id = p_outlet_id
      and external_pos_id is not null
      and not (id = any(v_item_ids));
  get diagnostics v_items_deact = row_count;

  update public.modifier_groups
    set is_active = false, updated_at = v_now
    where item_id in (select id from public.menu_items where outlet_id = p_outlet_id)
      and external_pos_id is not null
      and not (id = any(v_group_ids));
  get diagnostics v_groups_deact = row_count;

  update public.modifier_options
    set is_available = false, updated_at = v_now
    where group_id in (
        select mg.id from public.modifier_groups mg
        join public.menu_items mi on mi.id = mg.item_id
        where mi.outlet_id = p_outlet_id
      )
      and external_pos_id is not null
      and not (id = any(v_option_ids));
  get diagnostics v_options_deact = row_count;

  return jsonb_build_object(
    'categories_synced', v_categories_count,
    'items_synced', v_items_count,
    'modifier_groups_synced', v_groups_count,
    'modifier_options_synced', v_options_count,
    'categories_deactivated', v_categories_deact,
    'items_deactivated', v_items_deact,
    'modifier_groups_deactivated', v_groups_deact,
    'modifier_options_deactivated', v_options_deact
  );
end;
$$;

revoke all on function public.sync_full_menu(uuid, jsonb) from public;
grant execute on function public.sync_full_menu(uuid, jsonb) to service_role;
