-- =============================================================================
-- BizWallet — COMPLETE DATABASE SETUP (single, copy-pasteable script)
-- =============================================================================
-- Combines:
--   PART 1 — Schema: tables, indexes, triggers, RLS policies
--   PART 2 — RPC functions: top_up_wallet() + process_wallet_payment()
--   PART 3 — Seed data: 2 outlets + 5 menu items
--   PART 4 — Notifications & Loyalty Rewards
--   PART 5 — Owner Dashboard: CRM + Marketing Broadcasts + Promo Codes
--   PART 6 — POS Menu Hierarchy: categories/items/modifiers + sync_full_menu()
--   PART 7 — Tiered Loyalty / Gamification: loyalty_tiers + auto-upgrade
--   PART 8 — Smart Scheduling: outlet hours/prep time + orders.scheduled_for
--   PART 9 — Live Store Status & Proximity: outlet lat/long + is_accepting_orders
--   PART 10 — Profile completion + gamification: extra profile fields + points
--   PART 11 — Real POS dispatch: outlet_pos_credentials + orders.pos_dispatch_* + sample modifiers
--
-- HOW TO RUN: paste this whole file into the Supabase Dashboard -> SQL Editor
-- and click Run. This is the ONE file you need — it is the complete, current
-- schema; nothing else in supabase/migrations/ needs to be run after it.
-- Intended for a FRESH project, or a project whose public schema was just
-- wiped with `drop schema public cascade; create schema public;`. Order
-- matters and is already correct top-to-bottom.
-- =============================================================================


-- -----------------------------------------------------------------------------
-- Schema-level grants for anon/authenticated/service_role.
--
-- A brand-new Supabase PROJECT gets these pre-wired by the platform via
-- ALTER DEFAULT PRIVILEGES bound to the original public schema's object id —
-- so they normally don't need to be set explicitly. But that binding is by
-- id, not name: if this script is ever run after `drop schema public cascade;
-- create schema public;` (a full reset on an EXISTING project, as opposed to
-- a fresh project), the new schema is a different object and the platform's
-- defaults no longer apply to it. Every table below would then have correct
-- RLS policies that never even get evaluated, because Postgres rejects the
-- query at the coarser table-grant check before RLS runs at all —
-- surfacing as "permission denied for table ...". Setting these explicitly
-- here makes the script work identically in both scenarios.
-- -----------------------------------------------------------------------------
grant usage on schema public to anon, authenticated, service_role;

grant all on all tables    in schema public to anon, authenticated, service_role;
grant all on all sequences in schema public to anon, authenticated, service_role;
grant all on all functions in schema public to anon, authenticated, service_role;

alter default privileges in schema public grant all on tables    to anon, authenticated, service_role;
alter default privileges in schema public grant all on sequences to anon, authenticated, service_role;
alter default privileges in schema public grant all on functions to anon, authenticated, service_role;


-- #############################################################################
-- ## PART 1 — SCHEMA (tables, RLS policies)
-- #############################################################################

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
-- CREATE TYPE has no `IF NOT EXISTS` — guarded with DO blocks so pasting this
-- whole file a second time (e.g. by accident) doesn't error out partway.
do $$ begin
  create type public.user_role as enum ('customer', 'owner');
exception when duplicate_object then null;
end $$;
do $$ begin
  create type public.wallet_txn_type as enum ('credit', 'debit');
exception when duplicate_object then null;
end $$;
do $$ begin
  create type public.loyalty_txn_type as enum ('earn', 'redeem', 'adjust', 'expire');
exception when duplicate_object then null;
end $$;
do $$ begin
  create type public.order_status as enum ('pending', 'preparing', 'ready', 'completed', 'cancelled');
exception when duplicate_object then null;
end $$;


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
  -- Fulfilment (dine-in / takeaway) — bound for the external POS.
  order_type          text not null default 'takeaway' check (order_type in ('dine_in', 'takeaway')),
  table_number        text,
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


-- #############################################################################
-- ## PART 2 — RPC FUNCTIONS (top_up_wallet + process_wallet_payment)
-- #############################################################################
-- These SECURITY DEFINER functions are the ONLY sanctioned way to move money or
-- points. RLS deliberately blocks direct writes to wallets / wallet_transactions
-- / loyalty_* from clients, so all balance changes funnel through here where we
-- can enforce locking, funds checks and atomicity.

-- -----------------------------------------------------------------------------
-- top_up_wallet(user, amount[, description])
-- -----------------------------------------------------------------------------
-- Credits store credit. Intended to be called SERVER-SIDE (service role) after a
-- real payment/webhook is confirmed — NOT directly by the client (otherwise a
-- user could mint themselves free balance). Hence it is granted to service_role
-- only, below.
create or replace function public.top_up_wallet(
  p_user_id     uuid,
  p_amount      numeric,
  p_description text default 'Wallet top-up'
)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_wallet_id   uuid;
  v_new_balance numeric(12,2);
  v_txn_id      uuid;
begin
  if p_amount is null or p_amount <= 0 then
    raise exception 'Top-up amount must be greater than zero' using errcode = '22023';
  end if;

  -- Lock the wallet row so concurrent top-ups/payments serialize on it.
  select id into v_wallet_id
  from public.wallets
  where user_id = p_user_id
  for update;

  if v_wallet_id is null then
    raise exception 'Wallet not found for user %', p_user_id using errcode = 'P0002';
  end if;

  update public.wallets
     set balance = balance + p_amount
   where id = v_wallet_id
   returning balance into v_new_balance;

  insert into public.wallet_transactions
    (wallet_id, user_id, type, amount, balance_after, description)
  values
    (v_wallet_id, p_user_id, 'credit', p_amount, v_new_balance, p_description)
  returning id into v_txn_id;

  return jsonb_build_object(
    'wallet_id',      v_wallet_id,
    'transaction_id', v_txn_id,
    'amount',         p_amount,
    'new_balance',    v_new_balance
  );
end;
$$;


-- -----------------------------------------------------------------------------
-- process_wallet_payment(user, order_total, outlet, items[, notes])
-- -----------------------------------------------------------------------------
-- Atomic checkout paid entirely from wallet store credit. In one transaction it:
--   1. authorises the caller,
--   2. locks the wallet and checks funds (raises -> rollback if short),
--   3. deducts the balance,
--   4. creates the order (items stored as a JSONB snapshot),
--   5. writes the wallet debit to the ledger,
--   6. awards + ledgers loyalty points.
--
-- SECURITY NOTE: this trusts p_order_total. For production you should recompute
-- the total server-side from public.menu_items keyed by p_items, so a tampered
-- client can't send total = 0.01. Left as a trust-the-total for Phase 1.
create or replace function public.process_wallet_payment(
  p_user_id      uuid,
  p_order_total  numeric,
  p_outlet_id    uuid,
  p_items        jsonb,
  p_notes        text default null,
  p_order_type   text default 'takeaway',
  p_table_number text default null
)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_points_rate   constant integer := 1;   -- loyalty points earned per whole MYR
  v_wallet_id     uuid;
  v_balance       numeric(12,2);
  v_new_balance   numeric(12,2);
  v_account_id    uuid;
  v_points_earned integer;
  v_new_points    integer;
  v_order_id      uuid;
  v_order_number  bigint;
begin
  -- ---- authorisation ------------------------------------------------------
  -- Block a signed-in user from spending someone else's wallet. When invoked by
  -- the service role (auth.uid() is null) we trust the server-side caller.
  if auth.uid() is not null and auth.uid() <> p_user_id then
    raise exception 'Not authorized to pay from another user''s wallet'
      using errcode = '42501';
  end if;

  -- ---- input validation ---------------------------------------------------
  if p_order_total is null or p_order_total <= 0 then
    raise exception 'Order total must be greater than zero' using errcode = '22023';
  end if;

  if p_items is null or jsonb_typeof(p_items) <> 'array' or jsonb_array_length(p_items) = 0 then
    raise exception 'Order must contain at least one item' using errcode = '22023';
  end if;

  perform 1 from public.outlets where id = p_outlet_id and is_active;
  if not found then
    raise exception 'Outlet % not found or inactive', p_outlet_id using errcode = 'P0002';
  end if;

  -- ---- lock wallet + funds check -----------------------------------------
  select id, balance into v_wallet_id, v_balance
  from public.wallets
  where user_id = p_user_id
  for update;

  if v_wallet_id is null then
    raise exception 'Wallet not found for user %', p_user_id using errcode = 'P0002';
  end if;

  if v_balance < p_order_total then
    raise exception 'Insufficient wallet balance: have %, need %', v_balance, p_order_total
      using errcode = 'P0001';   -- caught client-side as a "top up" prompt
  end if;

  -- ---- deduct -------------------------------------------------------------
  update public.wallets
     set balance = balance - p_order_total
   where id = v_wallet_id
   returning balance into v_new_balance;

  -- ---- create the order ---------------------------------------------------
  v_points_earned := floor(p_order_total)::int * v_points_rate;

  insert into public.orders (
    user_id, outlet_id, status, items, subtotal, total,
    wallet_amount_used, loyalty_points_earned, payment_method, notes,
    order_type, table_number
  )
  values (
    p_user_id, p_outlet_id, 'pending', p_items, p_order_total, p_order_total,
    p_order_total, v_points_earned, 'wallet', p_notes,
    case when p_order_type in ('dine_in', 'takeaway') then p_order_type else 'takeaway' end,
    p_table_number
  )
  returning id, order_number into v_order_id, v_order_number;

  -- ---- wallet ledger ------------------------------------------------------
  insert into public.wallet_transactions
    (wallet_id, user_id, type, amount, balance_after, description, order_id)
  values
    (v_wallet_id, p_user_id, 'debit', p_order_total, v_new_balance,
     'Order #' || v_order_number, v_order_id);

  -- ---- award loyalty ------------------------------------------------------
  if v_points_earned > 0 then
    select id into v_account_id
    from public.loyalty_accounts
    where user_id = p_user_id
    for update;

    update public.loyalty_accounts
       set points_balance = points_balance + v_points_earned,
           points_earned  = points_earned  + v_points_earned
     where id = v_account_id
     returning points_balance into v_new_points;

    insert into public.loyalty_transactions
      (account_id, user_id, type, points, balance_after, description, order_id)
    values
      (v_account_id, p_user_id, 'earn', v_points_earned, v_new_points,
       'Earned on order #' || v_order_number, v_order_id);
  else
    select points_balance into v_new_points
    from public.loyalty_accounts where user_id = p_user_id;
  end if;

  return jsonb_build_object(
    'order_id',       v_order_id,
    'order_number',   v_order_number,
    'wallet_balance', v_new_balance,
    'points_earned',  v_points_earned,
    'points_balance', v_new_points
  );
end;
$$;


-- -----------------------------------------------------------------------------
-- Execution grants — least privilege
-- -----------------------------------------------------------------------------
-- Strip the default "executable by everyone", then grant deliberately.
revoke all on function public.top_up_wallet(uuid, numeric, text) from public;
revoke all on function public.process_wallet_payment(uuid, numeric, uuid, jsonb, text, text, text) from public;

-- Top-ups only from trusted server code (after a confirmed payment).
grant execute on function public.top_up_wallet(uuid, numeric, text)
  to service_role;

-- Customers may pay; the in-function auth.uid() guard scopes them to their own
-- wallet. service_role may also call it for server-driven checkouts.
grant execute on function public.process_wallet_payment(uuid, numeric, uuid, jsonb, text, text, text)
  to authenticated, service_role;


-- #############################################################################
-- ## PART 3 — SEED DATA (2 outlets + 5 menu items)
-- #############################################################################
-- Demo data so the app has something to show. Safe to delete later. Re-running
-- this PART appends duplicates (outlet names aren't unique).
with new_outlets as (
  insert into public.outlets (name, address, phone, is_active)
  values
    ('BizCafé @ KLCC',    'Lot G-12, Suria KLCC, 50088 Kuala Lumpur', '+60312345678', true),
    ('BizCafé @ Bangsar', '22 Jalan Telawi 3, Bangsar, 59100 KL',     '+60387654321', true)
  returning id, name
)
insert into public.menu_items
  (outlet_id, name, description, category, price, currency, stock_quantity, external_pos_id)
select
  (select id from new_outlets where name = 'BizCafé @ KLCC'),
  v.name, v.description, v.category, v.price, 'MYR', v.stock, v.pos_id
from (values
  ('Signature Latté',   'House espresso blend with velvety steamed milk',   'Coffee', 12.90::numeric, 100, 'POS-LATTE-001'),
  ('Caramel Macchiato', 'Espresso, steamed milk and a caramel drizzle',     'Coffee', 14.50::numeric,  80, 'POS-CMAC-002'),
  ('Spanish Latte',     'Sweet condensed-milk latté served over ice',       'Coffee', 13.90::numeric,  90, 'POS-SPAN-003'),
  ('Iced Americano',    'Double espresso shot poured over ice',             'Coffee', 10.90::numeric, 120, 'POS-AMER-004'),
  ('Matcha Latte',      'Ceremonial-grade matcha whisked with fresh milk',  'Tea',    15.90::numeric,  60, 'POS-MTCH-005')
) as v(name, description, category, price, stock, pos_id);

-- =============================================================================
-- DONE. Next: set role = 'owner' on your profile to manage outlets/menu, e.g.
--   update public.profiles set role = 'owner' where email = 'you@example.com';
-- =============================================================================


-- #############################################################################
-- ## PART 4 — Notifications & Loyalty Rewards (extends everything above)
-- #############################################################################
-- -----------------------------------------------------------------------------
-- Notifications
-- -----------------------------------------------------------------------------
create table if not exists public.notifications (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users (id) on delete cascade,
  title      text not null,
  message    text,
  is_read    boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists notifications_user_idx
  on public.notifications (user_id, created_at desc);

alter table public.notifications enable row level security;

drop policy if exists "notifications: select own" on public.notifications;
create policy "notifications: select own"
  on public.notifications for select using (auth.uid() = user_id);

drop policy if exists "notifications: update own" on public.notifications;
create policy "notifications: update own"
  on public.notifications for update
  using (auth.uid() = user_id) with check (auth.uid() = user_id);
-- Inserts happen via SECURITY DEFINER functions / service role only.


-- -----------------------------------------------------------------------------
-- Loyalty rewards catalog (admin-defined; publicly readable)
-- -----------------------------------------------------------------------------
create table if not exists public.loyalty_rewards (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  description text,
  points_cost integer not null check (points_cost > 0),
  kind        text not null default 'voucher',   -- 'free_item' | 'voucher'
  value       numeric(10,2),                       -- e.g. voucher amount
  is_active   boolean not null default true,
  sort_order  integer not null default 0,
  created_at  timestamptz not null default now()
);

alter table public.loyalty_rewards enable row level security;

drop policy if exists "rewards: public read" on public.loyalty_rewards;
create policy "rewards: public read"
  on public.loyalty_rewards for select using (true);

-- Seed a starter catalog (only if empty).
insert into public.loyalty_rewards (name, description, points_cost, kind, value, sort_order)
select * from (values
  ('Free Dessert',         'A sweet treat on the house',     350,  'free_item', null,        0),
  ('Free Signature Drink', 'Any signature drink, on us',     500,  'free_item', null,        1),
  ('RM10 Voucher',         'RM10 off your next order',       1000, 'voucher',   10::numeric, 2),
  ('RM25 Voucher',         'RM25 off your next order',       2000, 'voucher',   25::numeric, 3)
) as v(name, description, points_cost, kind, value, sort_order)
where not exists (select 1 from public.loyalty_rewards);


-- -----------------------------------------------------------------------------
-- Issued vouchers (the result of a redemption)
-- -----------------------------------------------------------------------------
create table if not exists public.vouchers (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references auth.users (id) on delete cascade,
  reward_id    uuid references public.loyalty_rewards (id) on delete set null,
  code         text not null unique,
  title        text not null,
  points_spent integer not null,
  status       text not null default 'active',     -- active | used | expired
  created_at   timestamptz not null default now()
);

create index if not exists vouchers_user_idx
  on public.vouchers (user_id, created_at desc);

alter table public.vouchers enable row level security;

drop policy if exists "vouchers: select own" on public.vouchers;
create policy "vouchers: select own"
  on public.vouchers for select using (auth.uid() = user_id);
-- Inserts happen via the redeem_reward RPC only.


-- -----------------------------------------------------------------------------
-- redeem_reward(user, reward) — atomic, server-validated point redemption
-- -----------------------------------------------------------------------------
create or replace function public.redeem_reward(
  p_user_id   uuid,
  p_reward_id uuid
)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_reward      public.loyalty_rewards%rowtype;
  v_account_id  uuid;
  v_balance     integer;
  v_new_balance integer;
  v_code        text;
begin
  if auth.uid() is not null and auth.uid() <> p_user_id then
    raise exception 'Not authorized' using errcode = '42501';
  end if;

  -- Cost is read from the DB, never trusted from the client.
  select * into v_reward from public.loyalty_rewards where id = p_reward_id and is_active;
  if not found then
    raise exception 'Reward not found or inactive' using errcode = 'P0002';
  end if;

  select id, points_balance into v_account_id, v_balance
  from public.loyalty_accounts where user_id = p_user_id for update;
  if v_account_id is null then
    raise exception 'Loyalty account not found' using errcode = 'P0002';
  end if;

  if v_balance < v_reward.points_cost then
    raise exception 'Not enough points: have %, need %', v_balance, v_reward.points_cost
      using errcode = 'P0001';
  end if;

  update public.loyalty_accounts
     set points_balance  = points_balance - v_reward.points_cost,
         points_redeemed = points_redeemed + v_reward.points_cost
   where id = v_account_id
   returning points_balance into v_new_balance;

  insert into public.loyalty_transactions
    (account_id, user_id, type, points, balance_after, description)
  values
    (v_account_id, p_user_id, 'redeem', -v_reward.points_cost, v_new_balance,
     'Redeemed: ' || v_reward.name);

  v_code := upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 10));
  insert into public.vouchers (user_id, reward_id, code, title, points_spent)
  values (p_user_id, p_reward_id, v_code, v_reward.name, v_reward.points_cost);

  insert into public.notifications (user_id, title, message)
  values (p_user_id, 'Reward redeemed 🎁',
          'You redeemed "' || v_reward.name || '". Voucher code: ' || v_code);

  return jsonb_build_object(
    'code',           v_code,
    'reward',         v_reward.name,
    'points_balance', v_new_balance
  );
end;
$$;

revoke all on function public.redeem_reward(uuid, uuid) from public;
grant execute on function public.redeem_reward(uuid, uuid) to authenticated, service_role;


-- -----------------------------------------------------------------------------
-- Weave notifications into the existing flows (re-defines the functions).
-- -----------------------------------------------------------------------------

-- Welcome notification on signup.
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
  insert into public.loyalty_accounts (user_id) values (new.id) on conflict (user_id) do nothing;

  insert into public.notifications (user_id, title, message)
  values (new.id, 'Welcome to BizCafé ☕',
          'Your wallet and rewards are ready — top up to start earning points!');

  return new;
end;
$$;

-- Notify on top-up.
create or replace function public.top_up_wallet(
  p_user_id     uuid,
  p_amount      numeric,
  p_description text default 'Wallet top-up'
)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_wallet_id   uuid;
  v_new_balance numeric(12,2);
  v_txn_id      uuid;
begin
  if p_amount is null or p_amount <= 0 then
    raise exception 'Top-up amount must be greater than zero' using errcode = '22023';
  end if;

  select id into v_wallet_id from public.wallets where user_id = p_user_id for update;
  if v_wallet_id is null then
    raise exception 'Wallet not found for user %', p_user_id using errcode = 'P0002';
  end if;

  update public.wallets set balance = balance + p_amount
   where id = v_wallet_id returning balance into v_new_balance;

  insert into public.wallet_transactions
    (wallet_id, user_id, type, amount, balance_after, description)
  values
    (v_wallet_id, p_user_id, 'credit', p_amount, v_new_balance, p_description)
  returning id into v_txn_id;

  insert into public.notifications (user_id, title, message)
  values (p_user_id, 'Top-up successful 💳',
          'RM' || to_char(p_amount, 'FM999990.00') ||
          ' added. New balance: RM' || to_char(v_new_balance, 'FM999990.00') || '.');

  return jsonb_build_object(
    'wallet_id', v_wallet_id, 'transaction_id', v_txn_id,
    'amount', p_amount, 'new_balance', v_new_balance
  );
end;
$$;

revoke all on function public.top_up_wallet(uuid, numeric, text) from public;
grant execute on function public.top_up_wallet(uuid, numeric, text) to service_role;

-- Notify on order placed (keeps the dine-in/takeaway columns from the prior migration).
create or replace function public.process_wallet_payment(
  p_user_id      uuid,
  p_order_total  numeric,
  p_outlet_id    uuid,
  p_items        jsonb,
  p_notes        text default null,
  p_order_type   text default 'takeaway',
  p_table_number text default null
)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_points_rate   constant integer := 1;
  v_wallet_id     uuid;
  v_balance       numeric(12,2);
  v_new_balance   numeric(12,2);
  v_account_id    uuid;
  v_points_earned integer;
  v_new_points    integer;
  v_order_id      uuid;
  v_order_number  bigint;
begin
  if auth.uid() is not null and auth.uid() <> p_user_id then
    raise exception 'Not authorized to pay from another user''s wallet' using errcode = '42501';
  end if;
  if p_order_total is null or p_order_total <= 0 then
    raise exception 'Order total must be greater than zero' using errcode = '22023';
  end if;
  if p_items is null or jsonb_typeof(p_items) <> 'array' or jsonb_array_length(p_items) = 0 then
    raise exception 'Order must contain at least one item' using errcode = '22023';
  end if;
  perform 1 from public.outlets where id = p_outlet_id and is_active;
  if not found then
    raise exception 'Outlet % not found or inactive', p_outlet_id using errcode = 'P0002';
  end if;

  select id, balance into v_wallet_id, v_balance
  from public.wallets where user_id = p_user_id for update;
  if v_wallet_id is null then
    raise exception 'Wallet not found for user %', p_user_id using errcode = 'P0002';
  end if;
  if v_balance < p_order_total then
    raise exception 'Insufficient wallet balance: have %, need %', v_balance, p_order_total
      using errcode = 'P0001';
  end if;

  update public.wallets set balance = balance - p_order_total
   where id = v_wallet_id returning balance into v_new_balance;

  v_points_earned := floor(p_order_total)::int * v_points_rate;

  insert into public.orders (
    user_id, outlet_id, status, items, subtotal, total,
    wallet_amount_used, loyalty_points_earned, payment_method, notes,
    order_type, table_number
  )
  values (
    p_user_id, p_outlet_id, 'pending', p_items, p_order_total, p_order_total,
    p_order_total, v_points_earned, 'wallet', p_notes,
    case when p_order_type in ('dine_in', 'takeaway') then p_order_type else 'takeaway' end,
    p_table_number
  )
  returning id, order_number into v_order_id, v_order_number;

  insert into public.wallet_transactions
    (wallet_id, user_id, type, amount, balance_after, description, order_id)
  values
    (v_wallet_id, p_user_id, 'debit', p_order_total, v_new_balance,
     'Order #' || v_order_number, v_order_id);

  if v_points_earned > 0 then
    select id into v_account_id
    from public.loyalty_accounts where user_id = p_user_id for update;
    update public.loyalty_accounts
       set points_balance = points_balance + v_points_earned,
           points_earned  = points_earned  + v_points_earned
     where id = v_account_id returning points_balance into v_new_points;
    insert into public.loyalty_transactions
      (account_id, user_id, type, points, balance_after, description, order_id)
    values
      (v_account_id, p_user_id, 'earn', v_points_earned, v_new_points,
       'Earned on order #' || v_order_number, v_order_id);
  else
    select points_balance into v_new_points
    from public.loyalty_accounts where user_id = p_user_id;
  end if;

  insert into public.notifications (user_id, title, message)
  values (p_user_id, 'Order #' || v_order_number || ' placed ✅',
          'We have received your order. Track its progress in the app.');

  return jsonb_build_object(
    'order_id',       v_order_id,
    'order_number',   v_order_number,
    'wallet_balance', v_new_balance,
    'points_earned',  v_points_earned,
    'points_balance', v_new_points
  );
end;
$$;

revoke all on function public.process_wallet_payment(uuid, numeric, uuid, jsonb, text, text, text) from public;
grant execute on function public.process_wallet_payment(uuid, numeric, uuid, jsonb, text, text, text)
  to authenticated, service_role;


-- #############################################################################
-- ## PART 5 — Owner Dashboard: CRM + Marketing Broadcasts + Promo Codes
-- #############################################################################

-- -----------------------------------------------------------------------------
-- Marketing campaigns (a log of broadcasts sent — for the admin portal's history)
-- -----------------------------------------------------------------------------
create table if not exists public.marketing_campaigns (
  id              uuid primary key default gen_random_uuid(),
  title           text not null,
  message         text not null,
  audience        text not null check (audience in ('all', 'high_points', 'inactive_30d')),
  recipient_count integer not null default 0,
  created_by      uuid references auth.users (id) on delete set null,
  created_at      timestamptz not null default now()
);

create index if not exists marketing_campaigns_created_idx
  on public.marketing_campaigns (created_at desc);

alter table public.marketing_campaigns enable row level security;
-- No policies: only the owner portal's service-role backend touches this table.


-- -----------------------------------------------------------------------------
-- Promo codes (discount codes generated from the owner portal)
-- -----------------------------------------------------------------------------
create table if not exists public.promo_codes (
  id             uuid primary key default gen_random_uuid(),
  code           text not null unique,
  discount_type  text not null check (discount_type in ('percentage', 'fixed')),
  discount_value numeric(10,2) not null check (discount_value > 0),
  usage_limit    integer check (usage_limit > 0),   -- null = unlimited
  times_used     integer not null default 0 check (times_used >= 0),
  expires_at     timestamptz,
  is_active      boolean not null default true,
  created_by     uuid references auth.users (id) on delete set null,
  created_at     timestamptz not null default now(),
  check (discount_type <> 'percentage' or discount_value <= 100)
);

create index if not exists promo_codes_code_idx on public.promo_codes (code);

alter table public.promo_codes enable row level security;
-- No policies yet: management is owner-only via service role. A customer-facing
-- "validate code at checkout" read policy can be added when that flow is built.


-- -----------------------------------------------------------------------------
-- admin_list_customers(search, limit, offset) — searchable, paginated CRM feed
-- -----------------------------------------------------------------------------
-- Joins wallet balance + loyalty points + lifetime spend per user. Excludes
-- owner-role profiles — this is a customer list, not "every profile." total_count
-- is the same on every returned row (window function) so the caller can build
-- "Showing X-Y of N" without a second round trip. service_role only — the
-- Next.js admin portal calls this from trusted server code, never the browser.
create or replace function public.admin_list_customers(
  p_search text default null,
  p_limit  integer default 20,
  p_offset integer default 0
)
returns table (
  id             uuid,
  full_name      text,
  email          text,
  phone          text,
  avatar_url     text,
  role           text,
  wallet_balance numeric,
  points_balance integer,
  lifetime_spent numeric,
  created_at     timestamptz,
  total_count    bigint
)
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select
    p.id,
    p.full_name,
    p.email,
    p.phone,
    p.avatar_url,
    p.role::text,
    coalesce(w.balance, 0)        as wallet_balance,
    coalesce(l.points_balance, 0) as points_balance,
    coalesce(o.lifetime_spent, 0) as lifetime_spent,
    p.created_at,
    count(*) over() as total_count
  from public.profiles p
  left join public.wallets w on w.user_id = p.id
  left join public.loyalty_accounts l on l.user_id = p.id
  left join (
    select user_id, sum(total) as lifetime_spent
    from public.orders
    where status <> 'cancelled'
    group by user_id
  ) o on o.user_id = p.id
  where
    p.role = 'customer' and (
      p_search is null or btrim(p_search) = '' or
      p.full_name ilike '%' || p_search || '%' or
      p.phone     ilike '%' || p_search || '%' or
      p.email     ilike '%' || p_search || '%'
    )
  order by p.created_at desc
  limit greatest(p_limit, 0)
  offset greatest(p_offset, 0);
$$;

revoke all on function public.admin_list_customers(text, integer, integer) from public;
grant execute on function public.admin_list_customers(text, integer, integer) to service_role;


-- -----------------------------------------------------------------------------
-- admin_send_broadcast(title, message, audience, created_by) — bulk notify
-- -----------------------------------------------------------------------------
-- Resolves the audience server-side (so segment logic lives in one place),
-- bulk-inserts into notifications (instant red-dot for every recipient), and
-- logs the send to marketing_campaigns. service_role only.
create or replace function public.admin_send_broadcast(
  p_title      text,
  p_message    text,
  p_audience   text,
  p_created_by uuid default null
)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_campaign_id     uuid;
  v_targets         uuid[];
  v_recipient_count integer;
begin
  if p_title is null or btrim(p_title) = '' then
    raise exception 'Title is required' using errcode = '22023';
  end if;
  if p_message is null or btrim(p_message) = '' then
    raise exception 'Message is required' using errcode = '22023';
  end if;
  if p_audience not in ('all', 'high_points', 'inactive_30d') then
    raise exception 'Unknown audience %', p_audience using errcode = '22023';
  end if;

  select array_agg(p.id) into v_targets
  from public.profiles p
  left join public.loyalty_accounts l on l.user_id = p.id
  left join (
    select user_id, max(created_at) as last_order_at
    from public.orders
    group by user_id
  ) o on o.user_id = p.id
  where
    p.role = 'customer' and
    case p_audience
      when 'all'          then true
      when 'high_points'  then coalesce(l.points_balance, 0) > 500
      when 'inactive_30d' then o.last_order_at is null or o.last_order_at < now() - interval '30 days'
      else false
    end;

  v_recipient_count := coalesce(array_length(v_targets, 1), 0);

  if v_recipient_count > 0 then
    insert into public.notifications (user_id, title, message)
    select t, p_title, p_message from unnest(v_targets) as t;
  end if;

  insert into public.marketing_campaigns (title, message, audience, recipient_count, created_by)
  values (p_title, p_message, p_audience, v_recipient_count, p_created_by)
  returning id into v_campaign_id;

  return jsonb_build_object(
    'campaign_id',     v_campaign_id,
    'recipient_count', v_recipient_count
  );
end;
$$;

revoke all on function public.admin_send_broadcast(text, text, text, uuid) from public;
grant execute on function public.admin_send_broadcast(text, text, text, uuid) to service_role;


-- #############################################################################
-- ## PART 6 — POS Menu Hierarchy: categories/items/modifiers + sync_full_menu()
-- #############################################################################

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


-- ## PART 7 — Tiered Loyalty / Gamification: loyalty_tiers + auto-upgrade

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
-- automatically re-checks tier status.
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
-- ## PART 8 — Smart Scheduling: outlet hours/prep time + orders.scheduled_for
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. outlets gains operating hours + prep time. Both open_time/close_time are
-- nullable (no default) — an outlet without hours set yet just can't offer
-- "Schedule for Later" until its owner configures them. No RLS change needed:
-- "outlets: public read" / "outlets: owner manage" already cover these columns.
-- -----------------------------------------------------------------------------
alter table public.outlets
  add column if not exists open_time         time,
  add column if not exists close_time        time,
  add column if not exists prep_time_minutes integer not null default 20
    check (prep_time_minutes >= 0);

-- -----------------------------------------------------------------------------
-- 2. orders gains an optional scheduled_for timestamp. NULL = ASAP (the
-- default/existing behavior for every order placed so far). timestamptz (not
-- bare timestamp) to match every other timestamp column in this schema and
-- avoid timezone ambiguity. No RLS change needed: existing "orders: customer
-- insert own" / "select own" policies are row-based, not column-based.
-- -----------------------------------------------------------------------------
alter table public.orders
  add column if not exists scheduled_for timestamptz;

create index if not exists orders_scheduled_for_idx
  on public.orders (scheduled_for)
  where scheduled_for is not null;

-- -----------------------------------------------------------------------------
-- 3. process_wallet_payment gains p_scheduled_for so a "Schedule for Later"
-- pick actually lands on the order row (not just the POS dispatch payload).
-- Validated server-side (must be null or in the future) since this is a
-- security-definer RPC taking client-supplied input, matching the existing
-- p_order_total/p_items guards just above. Notification copy branches on it.
-- -----------------------------------------------------------------------------
drop function if exists public.process_wallet_payment(uuid, numeric, uuid, jsonb, text, text, text);

create or replace function public.process_wallet_payment(
  p_user_id       uuid,
  p_order_total   numeric,
  p_outlet_id     uuid,
  p_items         jsonb,
  p_notes         text default null,
  p_order_type    text default 'takeaway',
  p_table_number  text default null,
  p_scheduled_for timestamptz default null
)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_points_rate   constant integer := 1;
  v_wallet_id     uuid;
  v_balance       numeric(12,2);
  v_new_balance   numeric(12,2);
  v_account_id    uuid;
  v_points_earned integer;
  v_new_points    integer;
  v_order_id      uuid;
  v_order_number  bigint;
begin
  if auth.uid() is not null and auth.uid() <> p_user_id then
    raise exception 'Not authorized to pay from another user''s wallet' using errcode = '42501';
  end if;
  if p_order_total is null or p_order_total <= 0 then
    raise exception 'Order total must be greater than zero' using errcode = '22023';
  end if;
  if p_items is null or jsonb_typeof(p_items) <> 'array' or jsonb_array_length(p_items) = 0 then
    raise exception 'Order must contain at least one item' using errcode = '22023';
  end if;
  if p_scheduled_for is not null and p_scheduled_for < now() then
    raise exception 'Scheduled pickup time must be in the future' using errcode = '22023';
  end if;
  perform 1 from public.outlets where id = p_outlet_id and is_active;
  if not found then
    raise exception 'Outlet % not found or inactive', p_outlet_id using errcode = 'P0002';
  end if;

  select id, balance into v_wallet_id, v_balance
  from public.wallets where user_id = p_user_id for update;
  if v_wallet_id is null then
    raise exception 'Wallet not found for user %', p_user_id using errcode = 'P0002';
  end if;
  if v_balance < p_order_total then
    raise exception 'Insufficient wallet balance: have %, need %', v_balance, p_order_total
      using errcode = 'P0001';
  end if;

  update public.wallets set balance = balance - p_order_total
   where id = v_wallet_id returning balance into v_new_balance;

  v_points_earned := floor(p_order_total)::int * v_points_rate;

  insert into public.orders (
    user_id, outlet_id, status, items, subtotal, total,
    wallet_amount_used, loyalty_points_earned, payment_method, notes,
    order_type, table_number, scheduled_for
  )
  values (
    p_user_id, p_outlet_id, 'pending', p_items, p_order_total, p_order_total,
    p_order_total, v_points_earned, 'wallet', p_notes,
    case when p_order_type in ('dine_in', 'takeaway') then p_order_type else 'takeaway' end,
    p_table_number, p_scheduled_for
  )
  returning id, order_number into v_order_id, v_order_number;

  insert into public.wallet_transactions
    (wallet_id, user_id, type, amount, balance_after, description, order_id)
  values
    (v_wallet_id, p_user_id, 'debit', p_order_total, v_new_balance,
     'Order #' || v_order_number, v_order_id);

  if v_points_earned > 0 then
    select id into v_account_id
    from public.loyalty_accounts where user_id = p_user_id for update;
    update public.loyalty_accounts
       set points_balance = points_balance + v_points_earned,
           points_earned  = points_earned  + v_points_earned
     where id = v_account_id returning points_balance into v_new_points;
    insert into public.loyalty_transactions
      (account_id, user_id, type, points, balance_after, description, order_id)
    values
      (v_account_id, p_user_id, 'earn', v_points_earned, v_new_points,
       'Earned on order #' || v_order_number, v_order_id);
  else
    select points_balance into v_new_points
    from public.loyalty_accounts where user_id = p_user_id;
  end if;

  insert into public.notifications (user_id, title, message)
  values (
    p_user_id,
    'Order #' || v_order_number || ' placed ✅',
    case when p_scheduled_for is not null
      then 'Scheduled for ' || to_char(p_scheduled_for, 'HH12:MI AM') || '. We''ll have it ready then.'
      else 'We have received your order. Track its progress in the app.'
    end
  );

  return jsonb_build_object(
    'order_id',       v_order_id,
    'order_number',   v_order_number,
    'wallet_balance', v_new_balance,
    'points_earned',  v_points_earned,
    'points_balance', v_new_points
  );
end;
$$;

revoke all on function public.process_wallet_payment(uuid, numeric, uuid, jsonb, text, text, text, timestamptz) from public;
grant execute on function public.process_wallet_payment(uuid, numeric, uuid, jsonb, text, text, text, timestamptz)
  to authenticated, service_role;


-- #############################################################################
-- ## PART 9 — Live Store Status & Proximity: outlet lat/long + is_accepting_orders
-- =============================================================================

-- -----------------------------------------------------------------------------
-- latitude/longitude are nullable (no default) — an outlet without coordinates
-- set yet just can't show a distance until its owner configures them.
-- is_accepting_orders is a manual kill switch the POS can flip if the kitchen
-- needs to go offline right now, independent of open_time/close_time. No RLS
-- change needed: "outlets: public read" / "outlets: owner manage" already
-- cover these columns.
-- -----------------------------------------------------------------------------
alter table public.outlets
  add column if not exists latitude  numeric(9,6) check (latitude between -90 and 90),
  add column if not exists longitude numeric(9,6) check (longitude between -180 and 180),
  add column if not exists is_accepting_orders boolean not null default true;


-- #############################################################################
-- ## PART 10 — Profile completion + gamification
-- #############################################################################
-- Optional marketing-relevant profile fields (date of birth, gender, dietary
-- preferences, address, marketing consent) plus a small one-time loyalty-
-- points bonus the first time each field — including the pre-existing
-- `phone` column — is filled in.
--
-- Real phone-number *verification* (OTP) is intentionally out of scope here:
-- it requires an SMS/WhatsApp provider (e.g. Twilio) configured in this
-- project's Auth settings, a separate cost/setup decision. `phone` is just a
-- plain editable field for now, like `full_name`; `phone_verified` is left
-- untouched so it keeps meaning "actually verified" if real OTP is wired up
-- later.
--
-- Points are awarded via a BEFORE UPDATE trigger on profiles — the table
-- clients can already update under RLS ("profiles: update own") — which
-- performs the privileged loyalty_accounts write itself, the same pattern
-- profiles_protect_role and loyalty_accounts_check_tier already use for
-- privileged side effects clients can't perform directly (RLS blocks direct
-- client writes to loyalty_*; see PART 2's "these SECURITY DEFINER
-- functions are the ONLY sanctioned way to move money or points" comment).
-- -----------------------------------------------------------------------------
alter table public.profiles
  add column if not exists date_of_birth date,
  add column if not exists gender text,
  add column if not exists dietary_preferences text[] not null default '{}',
  add column if not exists address text,
  -- null = not yet answered; true/false = answered either way. The bonus
  -- below is awarded for ANSWERING this question, not for consenting —
  -- making points conditional on saying "yes" would make the consent
  -- something other than freely given.
  add column if not exists marketing_consent boolean,
  -- Tracks which fields have already paid out their one-time bonus, so
  -- re-saving the same field (or clearing and refilling it) never re-awards.
  add column if not exists profile_bonus_claimed text[] not null default '{}';

create or replace function public.award_profile_completion_points()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_bonus_points constant integer := 20;
  v_field        text;
  v_filled       boolean;
  v_newly_earned integer := 0;
begin
  foreach v_field in array array[
    'phone', 'date_of_birth', 'gender', 'dietary_preferences', 'address', 'marketing_consent'
  ]
  loop
    if v_field = any (coalesce(old.profile_bonus_claimed, '{}')) then
      continue; -- already claimed for this user, never re-award
    end if;

    v_filled := case v_field
      when 'phone'               then new.phone is not null and new.phone <> ''
      when 'date_of_birth'       then new.date_of_birth is not null
      when 'gender'              then new.gender is not null and new.gender <> ''
      when 'dietary_preferences' then coalesce(array_length(new.dietary_preferences, 1), 0) > 0
      when 'address'             then new.address is not null and new.address <> ''
      when 'marketing_consent'   then new.marketing_consent is not null
      else false
    end;

    if v_filled then
      new.profile_bonus_claimed := array_append(coalesce(new.profile_bonus_claimed, '{}'), v_field);
      v_newly_earned := v_newly_earned + v_bonus_points;
    end if;
  end loop;

  if v_newly_earned > 0 then
    update public.loyalty_accounts
       set points_balance = points_balance + v_newly_earned,
           points_earned  = points_earned + v_newly_earned
     where user_id = new.id;
  end if;

  return new;
end;
$$;

drop trigger if exists profiles_award_completion_points on public.profiles;
create trigger profiles_award_completion_points
  before update on public.profiles
  for each row execute function public.award_profile_completion_points();


-- #############################################################################
-- ## PART 11 — Real POS dispatch + sample modifiers
-- #############################################################################
-- Closes the loop on `dispatchOrderToPOS()`, which used to be a mock: a
-- placed order now actually gets POSTed to the outlet's POS webhook from a
-- server route, and the result (sent / failed / not yet configured) is
-- tracked on the order so the owner dashboard can show it. Also seeds a
-- few of PART 3's demo items with modifier groups, since the modifier
-- picker UI and sync_full_menu() were otherwise fully built but had nothing
-- to show on the seeded demo menu.
-- -----------------------------------------------------------------------------

do $$ begin
  create type public.pos_dispatch_status as enum ('not_configured', 'sent', 'failed');
exception when duplicate_object then null;
end $$;

-- -----------------------------------------------------------------------------
-- 1. Per-outlet POS webhook credentials — a separate table, not columns on
-- outlets, because "outlets: public read" (using (true)) already allows
-- anyone to select every column on that table; a secret stored there would
-- leak to anon. Same posture as marketing_campaigns / promo_codes above:
-- RLS enabled, zero policies, so only service_role (which bypasses RLS) can
-- ever read or write it. No row for an outlet = no real POS configured yet,
-- so dispatch is a safe no-op until you insert one yourself.
-- -----------------------------------------------------------------------------
create table if not exists public.outlet_pos_credentials (
  outlet_id      uuid primary key references public.outlets (id) on delete cascade,
  webhook_url    text not null,
  webhook_secret text not null,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

alter table public.outlet_pos_credentials enable row level security;
-- No policies: only the service-role dispatch route (app/api/pos/v1/dispatch-order)
-- touches this table.

-- -----------------------------------------------------------------------------
-- 2. Dispatch-tracking columns on orders. Not secret, so no RLS change is
-- needed here — same reasoning PART 8/9 already used for their own new
-- nullable columns on existing tables.
-- -----------------------------------------------------------------------------
alter table public.orders
  add column if not exists pos_dispatch_status public.pos_dispatch_status not null default 'not_configured',
  add column if not exists pos_ticket_id        text,
  add column if not exists pos_dispatch_error   text;

-- -----------------------------------------------------------------------------
-- 3. Sample modifiers for 3 of PART 3's 5 seeded demo items (the other 2 are
-- deliberately left bare so both "has modifiers" / "no modifiers" branches
-- of the picker stay exercised). Keyed by name since the seed has no stable
-- literal id, same constraint PART 3 itself works around. external_pos_id is
-- left null throughout — hand-seeded rows never collide with a real
-- sync_full_menu() sync, which always requires a non-null external_pos_id.
-- -----------------------------------------------------------------------------
with target_items as (
  select id, name from public.menu_items
  where name in ('Signature Latté', 'Caramel Macchiato', 'Iced Americano')
),
new_groups as (
  insert into public.modifier_groups (item_id, name, selection_type, is_required, display_order)
  select ti.id, g.name, g.selection_type, g.is_required, g.display_order
  from target_items ti
  cross join (values
    ('Size',        'single', true,  1),
    ('Sugar Level', 'single', false, 2)
  ) as g(name, selection_type, is_required, display_order)
  where not exists (
    select 1 from public.modifier_groups mg
    where mg.item_id = ti.id and mg.name = g.name
  )
  returning id, item_id, name
)
insert into public.modifier_options (group_id, name, price_delta, display_order)
select ng.id, o.name, o.price_delta, o.display_order
from new_groups ng
join (values
  ('Size', 'Regular', 0::numeric,    1),
  ('Size', 'Large',   2.00::numeric, 2),
  ('Sugar Level', '0%',   0::numeric, 1),
  ('Sugar Level', '50%',  0::numeric, 2),
  ('Sugar Level', '100%', 0::numeric, 3)
) as o(group_name, name, price_delta, display_order)
  on o.group_name = ng.name;
