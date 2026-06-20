-- =============================================================================
-- BizWallet — COMPLETE DATABASE SETUP (single, copy-pasteable script)
-- =============================================================================
-- Combines:
--   PART 1 — Schema: tables, indexes, triggers, RLS policies
--   PART 2 — RPC functions: top_up_wallet() + process_wallet_payment()
--   PART 3 — Seed data: 2 outlets + 5 menu items
--
-- HOW TO RUN: paste this whole file into the Supabase Dashboard -> SQL Editor
-- and click Run. Intended for a FRESH project (run once). Order matters and is
-- already correct top-to-bottom.
-- =============================================================================


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
