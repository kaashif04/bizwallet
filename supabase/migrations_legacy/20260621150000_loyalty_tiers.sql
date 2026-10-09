-- =============================================================================
-- Tiered Loyalty / Gamification: loyalty_tiers + auto-upgrade
-- =============================================================================
-- Starbucks/ZUS-style tier status, driven by lifetime points.
--
-- This lives on loyalty_accounts, not profiles. loyalty_accounts already has
-- points_earned (lifetime points — set at signup, only ever incremented in
-- process_wallet_payment, never decremented by redeem_reward) and a `tier`
-- text column that nothing has ever written to (stuck on its 'bronze'
-- default since Part 1). Rather than add a second, parallel points counter
-- on profiles that could drift out of sync with the one that already
-- exists here, this gives `tier` a real backing table and keeps it in sync.
-- profiles.* is left untouched.
-- -----------------------------------------------------------------------------

-- -----------------------------------------------------------------------------
-- 1. loyalty_tiers — admin-defined, publicly readable catalog
-- -----------------------------------------------------------------------------
create table if not exists public.loyalty_tiers (
  id                  uuid primary key default gen_random_uuid(),
  name                text not null unique,
  points_required     integer not null unique check (points_required >= 0),
  discount_percentage numeric(5,2) not null default 0
                         check (discount_percentage >= 0 and discount_percentage <= 100),
  theme_color         text not null check (theme_color ~ '^#[0-9A-Fa-f]{6}$'),
  created_at          timestamptz not null default now()
);

alter table public.loyalty_tiers enable row level security;

drop policy if exists "loyalty_tiers: public read" on public.loyalty_tiers;
create policy "loyalty_tiers: public read"
  on public.loyalty_tiers for select using (true);

-- Seed the 4 default tiers (only if empty, so this is safe to re-run and
-- won't clobber tiers you've since edited/added by hand).
insert into public.loyalty_tiers (name, points_required, discount_percentage, theme_color)
select * from (values
  ('Member', 0,    0::numeric,  '#94A3B8'),
  ('Silver', 500,  5::numeric,  '#C0C0C0'),
  ('Gold',   1500, 10::numeric, '#D4AF37'),
  ('Elite',  3000, 15::numeric, '#111827')
) as v(name, points_required, discount_percentage, theme_color)
where not exists (select 1 from public.loyalty_tiers);


-- -----------------------------------------------------------------------------
-- 2. loyalty_accounts gains current_tier_id. points_earned IS the lifetime-
-- points figure the tier check needs (separate from points_balance, the
-- spendable one) — no new column for that. The legacy `tier` text column
-- stays and is kept in sync below, so the existing admin customer view
-- (which selects it directly) keeps working without changes.
-- -----------------------------------------------------------------------------
alter table public.loyalty_accounts
  add column if not exists current_tier_id uuid references public.loyalty_tiers (id);

create index if not exists loyalty_accounts_current_tier_id_idx
  on public.loyalty_accounts (current_tier_id);

-- Backfill existing accounts from their current points_earned. No
-- notifications here — this is a one-time migration backfill, not a real
-- upgrade event, so it shouldn't blast every existing user with a "tier
-- upgraded" notification the moment this migration runs.
update public.loyalty_accounts la
   set current_tier_id = (
         select lt.id from public.loyalty_tiers lt
         where lt.points_required <= la.points_earned
         order by lt.points_required desc limit 1
       ),
       tier = (
         select lt.name from public.loyalty_tiers lt
         where lt.points_required <= la.points_earned
         order by lt.points_required desc limit 1
       );

alter table public.loyalty_accounts
  alter column current_tier_id set not null;


-- -----------------------------------------------------------------------------
-- 3. New accounts start on the 0-point tier. handle_new_user re-defined to
-- add this; everything else identical to its prior (Part 4) version.
-- -----------------------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, role, full_name, email, phone, avatar_url, email_verified, phone_verified)
  values (
    new.id,
    case
      when new.raw_user_meta_data ->> 'role' in ('customer', 'owner')
        then (new.raw_user_meta_data ->> 'role')::public.user_role
      else 'customer'::public.user_role
    end,
    coalesce(new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'name'),
    new.email,
    new.phone,
    coalesce(new.raw_user_meta_data ->> 'avatar_url', new.raw_user_meta_data ->> 'picture'),
    new.email_confirmed_at is not null,
    new.phone_confirmed_at is not null
  )
  on conflict (id) do nothing;

  insert into public.wallets (user_id) values (new.id) on conflict (user_id) do nothing;

  insert into public.loyalty_accounts (user_id, tier, current_tier_id)
  values (
    new.id,
    (select name from public.loyalty_tiers where points_required = 0),
    (select id   from public.loyalty_tiers where points_required = 0)
  )
  on conflict (user_id) do nothing;

  insert into public.notifications (user_id, title, message)
  values (new.id, 'Welcome to BizCafé ☕',
          'Your wallet and rewards are ready — top up to start earning points!');

  return new;
end;
$$;


-- -----------------------------------------------------------------------------
-- 4. check_and_upgrade_tier(user) — finds the highest tier whose
-- points_required is at or below the account's lifetime points and, if
-- that's above the account's current tier, promotes it + notifies. Lifetime
-- points only ever go up (redemptions spend points_balance, never
-- points_earned), so this can only ever upgrade — there's no downgrade path
-- to guard against, matching the "upgrade if they cross a new threshold" spec.
-- -----------------------------------------------------------------------------
create or replace function public.check_and_upgrade_tier(p_user_id uuid)
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_account_id      uuid;
  v_lifetime_points integer;
  v_current_tier_id uuid;
  v_new_tier_id     uuid;
  v_new_tier_name   text;
begin
  select id, points_earned, current_tier_id
    into v_account_id, v_lifetime_points, v_current_tier_id
  from public.loyalty_accounts
  where user_id = p_user_id
  for update;

  if v_account_id is null then
    return;
  end if;

  select id, name into v_new_tier_id, v_new_tier_name
  from public.loyalty_tiers
  where points_required <= v_lifetime_points
  order by points_required desc
  limit 1;

  if v_new_tier_id is not null and v_new_tier_id is distinct from v_current_tier_id then
    update public.loyalty_accounts
       set current_tier_id = v_new_tier_id,
           tier             = v_new_tier_name
     where id = v_account_id;

    insert into public.notifications (user_id, title, message)
    values (
      p_user_id,
      'Tier upgraded 🎉',
      'Congrats! You are now ' || v_new_tier_name || ' tier.'
    );
  end if;
end;
$$;

revoke all on function public.check_and_upgrade_tier(uuid) from public;
grant execute on function public.check_and_upgrade_tier(uuid) to service_role;


-- -----------------------------------------------------------------------------
-- 5. Trigger: fire check_and_upgrade_tier whenever points_earned increases.
-- process_wallet_payment already increments points_earned on every order, so
-- no order/payment code needs to change — every successful order
-- automatically re-checks tier status. The WHEN clause means the function
-- only runs on a real increase, and the update it performs only touches
-- current_tier_id/tier (never points_earned), so it can't re-trigger itself.
-- -----------------------------------------------------------------------------
create or replace function public.trg_check_tier_on_points_increase()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  perform public.check_and_upgrade_tier(new.user_id);
  return new;
end;
$$;

drop trigger if exists loyalty_accounts_check_tier on public.loyalty_accounts;
create trigger loyalty_accounts_check_tier
  after update of points_earned on public.loyalty_accounts
  for each row
  when (new.points_earned > old.points_earned)
  execute function public.trg_check_tier_on_points_increase();

-- =============================================================================
-- End of Loyalty Tiers
-- =============================================================================
