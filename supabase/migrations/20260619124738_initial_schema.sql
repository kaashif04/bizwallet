-- =============================================================================
-- BizWallet — Phase 1: Initial Schema
-- Restaurant chain ecosystem (users, wallet, loyalty, menu/inventory, orders)
-- Target: Supabase / PostgreSQL 15+
-- =============================================================================
-- Run order matters: enums -> helper functions -> tables -> triggers -> RLS.
-- Everything is idempotent-ish for first run. Re-running requires a reset.
-- =============================================================================


-- -----------------------------------------------------------------------------
-- 0. Extensions
-- -----------------------------------------------------------------------------
-- gen_random_uuid() ships with pgcrypto. Supabase enables this by default, but
-- we declare it to be safe.
create extension if not exists pgcrypto;


-- -----------------------------------------------------------------------------
-- 1. Enumerated types
-- -----------------------------------------------------------------------------
-- Using enums keeps statuses/roles consistent. To add a value later:
--   alter type order_status add value 'completed';
create type public.user_role        as enum ('customer', 'owner');
create type public.wallet_txn_type  as enum ('credit', 'debit');
create type public.loyalty_txn_type as enum ('earn', 'redeem', 'adjust', 'expire');
create type public.order_status     as enum ('pending', 'preparing', 'ready', 'completed', 'cancelled');


-- -----------------------------------------------------------------------------
-- 2. Shared helper functions
-- -----------------------------------------------------------------------------

-- Auto-maintain updated_at on any table that has the column.
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;


-- -----------------------------------------------------------------------------
-- 3. Outlets (physical store locations)
-- -----------------------------------------------------------------------------
-- Orders, menu items and inventory all hang off an outlet. owner_id lets an
-- owner manage only their own outlets' data via RLS.
create table public.outlets (
  id            uuid primary key default gen_random_uuid(),
  owner_id      uuid references auth.users (id) on delete set null,
  name          text not null,
  address       text,
  phone         text,
  is_active     boolean not null default true,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create index outlets_owner_id_idx on public.outlets (owner_id);


-- -----------------------------------------------------------------------------
-- 4. Profiles (extends Supabase auth.users)
-- -----------------------------------------------------------------------------
-- Supabase already stores auth + email/phone confirmation in auth.users. We
-- mirror the bits the app needs and add app-specific columns. id is BOTH the PK
-- and an FK to auth.users so there is exactly one profile per auth account.
create table public.profiles (
  id              uuid primary key references auth.users (id) on delete cascade,
  role            public.user_role not null default 'customer',
  full_name       text,
  email           text,
  phone           text unique,
  -- OTP / verification status. auth.users tracks the source of truth for
  -- confirmation timestamps; these flags are the convenient app-facing copy.
  phone_verified  boolean not null default false,
  email_verified  boolean not null default false,
  avatar_url      text,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create index profiles_role_idx on public.profiles (role);


-- -----------------------------------------------------------------------------
-- 5. Wallet (store credit) + transaction ledger
-- -----------------------------------------------------------------------------
-- One wallet per user. `balance` is the current cached total; every change is
-- also written to wallet_transactions so you always have an auditable ledger.
create table public.wallets (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null unique references auth.users (id) on delete cascade,
  balance       numeric(12,2) not null default 0 check (balance >= 0),
  currency      text not null default 'MYR',
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create table public.wallet_transactions (
  id              uuid primary key default gen_random_uuid(),
  wallet_id       uuid not null references public.wallets (id) on delete cascade,
  user_id         uuid not null references auth.users (id) on delete cascade,
  type            public.wallet_txn_type not null,           -- credit | debit
  amount          numeric(12,2) not null check (amount > 0), -- always positive
  balance_after   numeric(12,2) not null,                    -- snapshot for audit
  description     text,
  order_id        uuid,                                      -- FK added after orders exists
  created_at      timestamptz not null default now()
);

create index wallet_transactions_wallet_id_idx  on public.wallet_transactions (wallet_id);
create index wallet_transactions_user_id_idx    on public.wallet_transactions (user_id, created_at desc);


-- -----------------------------------------------------------------------------
-- 6. Loyalty account + points ledger
-- -----------------------------------------------------------------------------
-- points_balance = points_earned - points_redeemed (kept consistent in app/
-- function logic). The ledger records each earn/redeem event.
create table public.loyalty_accounts (
  id                uuid primary key default gen_random_uuid(),
  user_id           uuid not null unique references auth.users (id) on delete cascade,
  points_balance    integer not null default 0 check (points_balance >= 0),
  points_earned     integer not null default 0 check (points_earned >= 0),  -- lifetime earned
  points_redeemed   integer not null default 0 check (points_redeemed >= 0),-- lifetime redeemed
  tier              text not null default 'bronze',
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

create table public.loyalty_transactions (
  id              uuid primary key default gen_random_uuid(),
  account_id      uuid not null references public.loyalty_accounts (id) on delete cascade,
  user_id         uuid not null references auth.users (id) on delete cascade,
  type            public.loyalty_txn_type not null,          -- earn | redeem | adjust | expire
  points          integer not null,                          -- +earn / -redeem
  balance_after   integer not null,
  description     text,
  order_id        uuid,                                      -- FK added after orders exists
  created_at      timestamptz not null default now()
);

create index loyalty_transactions_account_id_idx on public.loyalty_transactions (account_id);
create index loyalty_transactions_user_id_idx    on public.loyalty_transactions (user_id, created_at desc);


-- -----------------------------------------------------------------------------
-- 7. Menu items + inventory (will sync with external POS)
-- -----------------------------------------------------------------------------
-- One row per item per outlet, so stock is tracked per location. external_pos_id
-- + last_synced_at are the hooks for your future POS sync. The unique pairing of
-- (outlet_id, external_pos_id) lets the POS upsert by its own identifier.
create table public.menu_items (
  id               uuid primary key default gen_random_uuid(),
  outlet_id        uuid not null references public.outlets (id) on delete cascade,
  name             text not null,
  description      text,
  category         text,
  price            numeric(10,2) not null check (price >= 0),
  currency         text not null default 'MYR',
  image_url        text,
  is_available     boolean not null default true,
  -- Inventory
  track_inventory  boolean not null default true,
  stock_quantity   integer not null default 0 check (stock_quantity >= 0),
  -- External POS sync
  external_pos_id  text,
  last_synced_at   timestamptz,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now(),
  unique (outlet_id, external_pos_id)
);

create index menu_items_outlet_id_idx    on public.menu_items (outlet_id);
create index menu_items_category_idx     on public.menu_items (outlet_id, category);
create index menu_items_available_idx    on public.menu_items (outlet_id, is_available);


-- -----------------------------------------------------------------------------
-- 8. Orders
-- -----------------------------------------------------------------------------
-- `items` is a JSONB snapshot of the cart at checkout (name, qty, unit price,
-- modifiers...). Snapshotting protects historical orders from later menu/price
-- changes. order_number is a friendly human/receipt number.
create table public.orders (
  id                  uuid primary key default gen_random_uuid(),
  order_number        bigint generated always as identity,
  user_id             uuid not null references auth.users (id) on delete restrict,
  outlet_id           uuid not null references public.outlets (id) on delete restrict,
  status              public.order_status not null default 'pending',
  items               jsonb not null default '[]'::jsonb,
  -- Money
  subtotal            numeric(12,2) not null default 0 check (subtotal >= 0),
  discount            numeric(12,2) not null default 0 check (discount >= 0),
  total               numeric(12,2) not null default 0 check (total >= 0),
  -- How it was paid / rewarded
  wallet_amount_used  numeric(12,2) not null default 0 check (wallet_amount_used >= 0),
  loyalty_points_used integer not null default 0 check (loyalty_points_used >= 0),
  loyalty_points_earned integer not null default 0 check (loyalty_points_earned >= 0),
  payment_method      text,
  notes               text,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

create unique index orders_order_number_idx on public.orders (order_number);
create index orders_user_id_idx   on public.orders (user_id, created_at desc);
create index orders_outlet_id_idx on public.orders (outlet_id, status);
create index orders_status_idx    on public.orders (status);
-- GIN index lets you query inside the items JSON, e.g. items @> '[{"id":"..."}]'
create index orders_items_gin_idx on public.orders using gin (items);

-- Now that orders exists, wire up the deferred FKs from the ledgers.
alter table public.wallet_transactions
  add constraint wallet_transactions_order_id_fkey
  foreign key (order_id) references public.orders (id) on delete set null;

alter table public.loyalty_transactions
  add constraint loyalty_transactions_order_id_fkey
  foreign key (order_id) references public.orders (id) on delete set null;


-- -----------------------------------------------------------------------------
-- 9. updated_at triggers
-- -----------------------------------------------------------------------------
create trigger set_outlets_updated_at          before update on public.outlets          for each row execute function public.set_updated_at();
create trigger set_profiles_updated_at         before update on public.profiles         for each row execute function public.set_updated_at();
create trigger set_wallets_updated_at          before update on public.wallets          for each row execute function public.set_updated_at();
create trigger set_loyalty_accounts_updated_at before update on public.loyalty_accounts for each row execute function public.set_updated_at();
create trigger set_menu_items_updated_at       before update on public.menu_items       for each row execute function public.set_updated_at();
create trigger set_orders_updated_at           before update on public.orders           for each row execute function public.set_updated_at();


-- -----------------------------------------------------------------------------
-- 10. Auto-provision profile + wallet + loyalty on signup
-- -----------------------------------------------------------------------------
-- When Supabase Auth inserts into auth.users, create the matching app records so
-- a freshly signed-up user already has a profile, an empty wallet and a loyalty
-- account. Role/name/phone can be passed at signup via user metadata.
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
    -- Only trust an explicit, valid role from signup metadata; default customer.
    case
      when new.raw_user_meta_data ->> 'role' in ('customer', 'owner')
        then (new.raw_user_meta_data ->> 'role')::public.user_role
      else 'customer'::public.user_role
    end,
    -- OAuth providers (e.g. Google) supply full_name or name.
    coalesce(new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'name'),
    new.email,
    new.phone,
    -- Google supplies avatar_url or picture.
    coalesce(new.raw_user_meta_data ->> 'avatar_url', new.raw_user_meta_data ->> 'picture'),
    new.email_confirmed_at is not null,
    new.phone_confirmed_at is not null
  )
  on conflict (id) do nothing;

  -- on conflict guards keep the trigger from ever failing a signup.
  insert into public.wallets (user_id) values (new.id) on conflict (user_id) do nothing;
  insert into public.loyalty_accounts (user_id) values (new.id) on conflict (user_id) do nothing;

  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();


-- -----------------------------------------------------------------------------
-- 11. Row Level Security
-- -----------------------------------------------------------------------------
-- Enable RLS on every public table. With RLS on and no policy, access is denied
-- by default — so each table below gets explicit policies.
alter table public.outlets              enable row level security;
alter table public.profiles             enable row level security;
alter table public.wallets              enable row level security;
alter table public.wallet_transactions  enable row level security;
alter table public.loyalty_accounts     enable row level security;
alter table public.loyalty_transactions enable row level security;
alter table public.menu_items           enable row level security;
alter table public.orders               enable row level security;

-- Helper used by the owner policies below. SECURITY DEFINER + a fixed
-- search_path so it can read `profiles` without triggering recursive policy
-- evaluation. Defined here (after `profiles` exists) so its SQL body validates
-- at creation time.
create or replace function public.is_owner()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'owner'
  );
$$;

-- --- Profiles: a user sees/edits only their own profile -----------------------
create policy "profiles: select own"
  on public.profiles for select using (auth.uid() = id);
create policy "profiles: update own"
  on public.profiles for update using (auth.uid() = id) with check (auth.uid() = id);

-- --- Outlets: public can read active outlets; owners manage their own ---------
create policy "outlets: public read"
  on public.outlets for select using (true);
create policy "outlets: owner manage"
  on public.outlets for all
  using (public.is_owner() and owner_id = auth.uid())
  with check (public.is_owner() and owner_id = auth.uid());

-- --- Wallet + ledger: read-only to the owning user ----------------------------
-- Writes happen through SECURITY DEFINER functions / service role only.
create policy "wallets: select own"
  on public.wallets for select using (auth.uid() = user_id);
create policy "wallet_txns: select own"
  on public.wallet_transactions for select using (auth.uid() = user_id);

-- --- Loyalty + ledger: read-only to the owning user ---------------------------
create policy "loyalty: select own"
  on public.loyalty_accounts for select using (auth.uid() = user_id);
create policy "loyalty_txns: select own"
  on public.loyalty_transactions for select using (auth.uid() = user_id);

-- --- Menu: anyone can browse; owners write items for outlets they own ----------
create policy "menu: public read"
  on public.menu_items for select using (true);
create policy "menu: owner manage"
  on public.menu_items for all
  using (
    public.is_owner()
    and exists (select 1 from public.outlets o where o.id = menu_items.outlet_id and o.owner_id = auth.uid())
  )
  with check (
    public.is_owner()
    and exists (select 1 from public.outlets o where o.id = menu_items.outlet_id and o.owner_id = auth.uid())
  );

-- --- Orders: customers manage their own; owners see/update their outlets' -------
create policy "orders: customer select own"
  on public.orders for select using (auth.uid() = user_id);
create policy "orders: customer insert own"
  on public.orders for insert with check (auth.uid() = user_id);
create policy "orders: owner select outlet"
  on public.orders for select
  using (
    public.is_owner()
    and exists (select 1 from public.outlets o where o.id = orders.outlet_id and o.owner_id = auth.uid())
  );
create policy "orders: owner update outlet"
  on public.orders for update
  using (
    public.is_owner()
    and exists (select 1 from public.outlets o where o.id = orders.outlet_id and o.owner_id = auth.uid())
  );


-- -----------------------------------------------------------------------------
-- 12. Protect the role column (prevent client-side self-escalation)
-- -----------------------------------------------------------------------------
-- "profiles: update own" lets a user edit their own row (e.g. full_name), which
-- would also let them set role = 'owner' from the client. This trigger reverts
-- any role change attempted by an authenticated/anon caller, so role changes are
-- only possible via the service role (super-admin tools) or direct SQL.
create or replace function public.protect_profile_role()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.role is distinct from old.role
     and coalesce(auth.role(), '') in ('authenticated', 'anon') then
    new.role := old.role;
  end if;
  return new;
end;
$$;

drop trigger if exists profiles_protect_role on public.profiles;
create trigger profiles_protect_role
  before update on public.profiles
  for each row execute function public.protect_profile_role();

-- =============================================================================
-- End of Phase 1 schema
-- =============================================================================
