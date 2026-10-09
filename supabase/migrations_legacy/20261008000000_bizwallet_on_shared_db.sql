-- =============================================================================
-- BizWallet on the shared BizPos database (consolidated, replaces everything
-- in supabase/migrations_legacy/).
--
-- BizPos owns outlets, profiles (staff), menu_*, modifiers, transactions,
-- guest_orders, customers, ... — this file never creates, alters or drops
-- those. It only adds BizWallet-owned tables plus one trigger on
-- public.transactions (loyalty on completion), as agreed with BizPos.
--
-- Reuses BizPos's public.set_updated_at().
-- =============================================================================

do $$ begin
  create type public.wallet_txn_type as enum ('credit', 'debit');
exception when duplicate_object then null;
end $$;
do $$ begin
  create type public.loyalty_txn_type as enum ('earn', 'redeem', 'adjust', 'expire');
exception when duplicate_object then null;
end $$;


-- -----------------------------------------------------------------------------
-- Members (wallet customers + BizWallet portal owners). BizPos `profiles` is
-- staff; a member never has a profiles row.
-- -----------------------------------------------------------------------------
create table public.members (
  id                    uuid primary key references auth.users (id) on delete cascade,
  role                  text not null default 'customer' check (role in ('customer', 'owner')),
  full_name             text,
  email                 text,
  phone                 text unique,
  phone_verified        boolean not null default false,
  email_verified        boolean not null default false,
  avatar_url            text,
  date_of_birth         date,
  gender                text,
  dietary_preferences   text[] not null default '{}',
  address               text,
  -- null = not answered yet. The completion bonus is for answering, not for consenting.
  marketing_consent     boolean,
  profile_bonus_claimed text[] not null default '{}',
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now()
);
create index members_role_idx on public.members (role);


-- -----------------------------------------------------------------------------
-- Wallet + ledger
-- -----------------------------------------------------------------------------
create table public.wallets (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null unique references public.members (id) on delete cascade,
  balance    numeric(12,2) not null default 0 check (balance >= 0),
  currency   text not null default 'MYR',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.wallet_transactions (
  id            uuid primary key default gen_random_uuid(),
  wallet_id     uuid not null references public.wallets (id) on delete cascade,
  user_id       uuid not null references public.members (id) on delete cascade,
  type          public.wallet_txn_type not null,
  amount        numeric(12,2) not null check (amount > 0),
  balance_after numeric(12,2) not null,
  description   text,
  created_at    timestamptz not null default now()
);
create index wallet_transactions_user_id_idx on public.wallet_transactions (user_id, created_at desc);


-- -----------------------------------------------------------------------------
-- Loyalty: tiers, accounts, ledger, rewards, vouchers
-- -----------------------------------------------------------------------------
create table public.loyalty_tiers (
  id                  uuid primary key default gen_random_uuid(),
  name                text not null unique,
  points_required     integer not null unique check (points_required >= 0),
  discount_percentage numeric(5,2) not null default 0 check (discount_percentage between 0 and 100),
  theme_color         text not null check (theme_color ~ '^#[0-9A-Fa-f]{6}$'),
  created_at          timestamptz not null default now()
);

insert into public.loyalty_tiers (name, points_required, discount_percentage, theme_color) values
  ('Member', 0,    0,  '#94A3B8'),
  ('Silver', 500,  5,  '#C0C0C0'),
  ('Gold',   1500, 10, '#D4AF37'),
  ('Elite',  3000, 15, '#111827');

create table public.loyalty_accounts (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null unique references public.members (id) on delete cascade,
  points_balance  integer not null default 0 check (points_balance >= 0),
  points_earned   integer not null default 0 check (points_earned >= 0),   -- lifetime, drives tier
  points_redeemed integer not null default 0 check (points_redeemed >= 0),
  tier            text not null default 'Member',                          -- mirror of current tier name
  current_tier_id uuid not null references public.loyalty_tiers (id),
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create table public.loyalty_transactions (
  id             uuid primary key default gen_random_uuid(),
  account_id     uuid not null references public.loyalty_accounts (id) on delete cascade,
  user_id        uuid not null references public.members (id) on delete cascade,
  type           public.loyalty_txn_type not null,
  points         integer not null,
  balance_after  integer not null,
  description    text,
  -- BizPos transactions.id for points earned on a paid order. No FK: BizPos
  -- owns that table. Unique = one award per transaction.
  transaction_id uuid unique,
  created_at     timestamptz not null default now()
);
create index loyalty_transactions_user_id_idx on public.loyalty_transactions (user_id, created_at desc);

create table public.loyalty_rewards (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  description text,
  points_cost integer not null check (points_cost > 0),
  kind        text not null default 'voucher',   -- free_item | voucher
  value       numeric(10,2),
  is_active   boolean not null default true,
  sort_order  integer not null default 0,
  created_at  timestamptz not null default now()
);

insert into public.loyalty_rewards (name, description, points_cost, kind, value, sort_order) values
  ('Free Dessert',         'A sweet treat on the house', 350,  'free_item', null, 0),
  ('Free Signature Drink', 'Any signature drink, on us', 500,  'free_item', null, 1),
  ('RM10 Voucher',         'RM10 off your next order',   1000, 'voucher',   10,   2),
  ('RM25 Voucher',         'RM25 off your next order',   2000, 'voucher',   25,   3);

create table public.vouchers (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references public.members (id) on delete cascade,
  reward_id    uuid references public.loyalty_rewards (id) on delete set null,
  code         text not null unique,
  title        text not null,
  points_spent integer not null,
  status       text not null default 'active',   -- active | used | expired
  created_at   timestamptz not null default now()
);
create index vouchers_user_idx on public.vouchers (user_id, created_at desc);


-- -----------------------------------------------------------------------------
-- Notifications + marketing + promo codes
-- -----------------------------------------------------------------------------
create table public.notifications (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references public.members (id) on delete cascade,
  title      text not null,
  message    text,
  is_read    boolean not null default false,
  created_at timestamptz not null default now()
);
create index notifications_user_idx on public.notifications (user_id, created_at desc);

create table public.marketing_campaigns (
  id              uuid primary key default gen_random_uuid(),
  title           text not null,
  message         text not null,
  audience        text not null check (audience in ('all', 'high_points', 'inactive_30d')),
  recipient_count integer not null default 0,
  created_by      uuid references public.members (id) on delete set null,
  created_at      timestamptz not null default now()
);
create index marketing_campaigns_created_idx on public.marketing_campaigns (created_at desc);

create table public.promo_codes (
  id             uuid primary key default gen_random_uuid(),
  code           text not null unique,
  discount_type  text not null check (discount_type in ('percentage', 'fixed')),
  discount_value numeric(10,2) not null check (discount_value > 0),
  usage_limit    integer check (usage_limit > 0),
  times_used     integer not null default 0 check (times_used >= 0),
  expires_at     timestamptz,
  is_active      boolean not null default true,
  created_by     uuid references public.members (id) on delete set null,
  created_at     timestamptz not null default now(),
  check (discount_type <> 'percentage' or discount_value <= 100)
);


-- -----------------------------------------------------------------------------
-- updated_at
-- -----------------------------------------------------------------------------
create trigger members_set_updated_at          before update on public.members          for each row execute function public.set_updated_at();
create trigger wallets_set_updated_at          before update on public.wallets          for each row execute function public.set_updated_at();
create trigger loyalty_accounts_set_updated_at before update on public.loyalty_accounts for each row execute function public.set_updated_at();


-- -----------------------------------------------------------------------------
-- RLS. The shared DB grants table privileges to authenticated (and anon), so
-- these policies are the only guard. No policy = no access (service role only).
-- -----------------------------------------------------------------------------
alter table public.members              enable row level security;
alter table public.wallets              enable row level security;
alter table public.wallet_transactions  enable row level security;
alter table public.loyalty_tiers        enable row level security;
alter table public.loyalty_accounts     enable row level security;
alter table public.loyalty_transactions enable row level security;
alter table public.loyalty_rewards      enable row level security;
alter table public.vouchers             enable row level security;
alter table public.notifications        enable row level security;
alter table public.marketing_campaigns  enable row level security;
alter table public.promo_codes          enable row level security;

create policy members_select_own on public.members for select to authenticated using (id = auth.uid());
create policy members_update_own on public.members for update to authenticated using (id = auth.uid()) with check (id = auth.uid());

create policy wallets_select_own              on public.wallets              for select to authenticated using (user_id = auth.uid());
create policy wallet_transactions_select_own  on public.wallet_transactions  for select to authenticated using (user_id = auth.uid());
create policy loyalty_accounts_select_own     on public.loyalty_accounts     for select to authenticated using (user_id = auth.uid());
create policy loyalty_transactions_select_own on public.loyalty_transactions for select to authenticated using (user_id = auth.uid());
create policy vouchers_select_own             on public.vouchers             for select to authenticated using (user_id = auth.uid());
create policy notifications_select_own        on public.notifications        for select to authenticated using (user_id = auth.uid());
create policy notifications_update_own        on public.notifications        for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

-- Public catalogs.
create policy loyalty_tiers_read   on public.loyalty_tiers   for select to anon, authenticated using (true);
create policy loyalty_rewards_read on public.loyalty_rewards for select to anon, authenticated using (true);


-- -----------------------------------------------------------------------------
-- Member provisioning
-- -----------------------------------------------------------------------------
-- Creates member + wallet + loyalty account + welcome note for one auth user.
-- Idempotent. Internal: called by the auth trigger and ensure_member().
create or replace function public.provision_member(p_user_id uuid)
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  u auth.users;
begin
  select * into u from auth.users where id = p_user_id;
  if not found then return; end if;

  insert into public.members (id, full_name, email, phone, avatar_url, email_verified, phone_verified)
  values (
    u.id,
    coalesce(u.raw_user_meta_data ->> 'full_name', u.raw_user_meta_data ->> 'name'),
    u.email,
    nullif(u.phone, ''),
    coalesce(u.raw_user_meta_data ->> 'avatar_url', u.raw_user_meta_data ->> 'picture'),
    u.email_confirmed_at is not null,
    u.phone_confirmed_at is not null
  )
  on conflict (id) do nothing;
  if not found then return; end if;   -- already provisioned

  insert into public.wallets (user_id) values (u.id);
  insert into public.loyalty_accounts (user_id, tier, current_tier_id)
  select u.id, name, id from public.loyalty_tiers where points_required = 0;
  insert into public.notifications (user_id, title, message)
  values (u.id, 'Welcome to BizCafé ☕', 'Your wallet and rewards are ready. Top up to start earning points.');
end;
$$;
revoke all on function public.provision_member(uuid) from public, anon, authenticated;

-- Only BizWallet sign-ups become members; BizPos staff sign up with app = 'bizpos'.
-- Role is never taken from metadata (owners are promoted by the super admin).
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  if new.raw_user_meta_data ->> 'app' = 'bizwallet' then
    perform public.provision_member(new.id);
  end if;
  return new;
end;
$$;
revoke all on function public.handle_new_user() from public, anon, authenticated;

create trigger on_auth_user_created_bizwallet
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- OAuth (Google) sign-ups can't carry options.data, so the BizWallet auth
-- callback calls this. Never turns a BizPos staff account into a member; stamps
-- app = 'bizwallet' so BizPos treats the account as a customer.
create or replace function public.ensure_member()
returns boolean
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  if auth.uid() is null then
    raise exception 'Not signed in' using errcode = '42501';
  end if;
  if exists (select 1 from public.members where id = auth.uid()) then
    return true;
  end if;
  if exists (select 1 from public.profiles where id = auth.uid()) then
    return false;
  end if;

  update auth.users
     set raw_user_meta_data = coalesce(raw_user_meta_data, '{}'::jsonb) || '{"app":"bizwallet"}'
   where id = auth.uid()
     and raw_user_meta_data ->> 'app' is null;
  perform public.provision_member(auth.uid());
  return exists (select 1 from public.members where id = auth.uid());
end;
$$;
revoke all on function public.ensure_member() from public, anon;
grant execute on function public.ensure_member() to authenticated;

-- Admin portal gate.
create or replace function public.is_wallet_owner()
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select exists (select 1 from public.members where id = auth.uid() and role = 'owner');
$$;
revoke all on function public.is_wallet_owner() from public, anon;
grant execute on function public.is_wallet_owner() to authenticated;


-- -----------------------------------------------------------------------------
-- Member row guards: no self-promotion; one-time profile completion bonus.
-- -----------------------------------------------------------------------------
create or replace function public.members_before_update()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_bonus  constant integer := 20;
  v_field  text;
  v_filled boolean;
  v_earned integer := 0;
begin
  if coalesce(auth.role(), '') in ('authenticated', 'anon') then
    new.role := old.role;
    new.profile_bonus_claimed := old.profile_bonus_claimed;
  end if;

  foreach v_field in array array['phone', 'date_of_birth', 'gender', 'dietary_preferences', 'address', 'marketing_consent']
  loop
    continue when v_field = any (old.profile_bonus_claimed);
    v_filled := case v_field
      when 'phone'               then coalesce(new.phone, '') <> ''
      when 'date_of_birth'       then new.date_of_birth is not null
      when 'gender'              then coalesce(new.gender, '') <> ''
      when 'dietary_preferences' then coalesce(array_length(new.dietary_preferences, 1), 0) > 0
      when 'address'             then coalesce(new.address, '') <> ''
      when 'marketing_consent'   then new.marketing_consent is not null
    end;
    if v_filled then
      new.profile_bonus_claimed := array_append(new.profile_bonus_claimed, v_field);
      v_earned := v_earned + v_bonus;
    end if;
  end loop;

  if v_earned > 0 then
    update public.loyalty_accounts
       set points_balance = points_balance + v_earned,
           points_earned  = points_earned + v_earned
     where user_id = new.id;
  end if;
  return new;
end;
$$;
revoke all on function public.members_before_update() from public, anon, authenticated;

create trigger members_before_update
  before update on public.members
  for each row execute function public.members_before_update();


-- -----------------------------------------------------------------------------
-- Tiers: promote when lifetime points cross a threshold (never demotes).
-- -----------------------------------------------------------------------------
create or replace function public.check_and_upgrade_tier()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  t public.loyalty_tiers;
begin
  select * into t from public.loyalty_tiers
   where points_required <= new.points_earned
   order by points_required desc limit 1;

  if t.id is not null and t.id is distinct from new.current_tier_id then
    new.current_tier_id := t.id;
    new.tier := t.name;
    insert into public.notifications (user_id, title, message)
    values (new.user_id, 'Tier upgraded 🎉', 'Congrats! You are now ' || t.name || ' tier.');
  end if;
  return new;
end;
$$;
revoke all on function public.check_and_upgrade_tier() from public, anon, authenticated;

create trigger loyalty_accounts_check_tier
  before update of points_earned on public.loyalty_accounts
  for each row when (new.points_earned > old.points_earned)
  execute function public.check_and_upgrade_tier();


-- -----------------------------------------------------------------------------
-- Loyalty on completion: a BizPos transaction that is paid (status
-- 'completed') and linked to a member earns 1 point per whole MYR of total.
-- Fires on member_id too, so a guest who claims after paying still earns.
-- Idempotent per transaction; never writes to transactions.
-- -----------------------------------------------------------------------------
create or replace function public.award_points_for_transaction()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_points  integer := floor(coalesce(new.total, 0))::int;
  v_account public.loyalty_accounts;
begin
  if v_points <= 0 then return null; end if;

  select * into v_account from public.loyalty_accounts where user_id = new.member_id for update;
  if not found then return null; end if;   -- not a BizWallet member

  insert into public.loyalty_transactions
    (account_id, user_id, type, points, balance_after, description, transaction_id)
  values
    (v_account.id, new.member_id, 'earn', v_points, v_account.points_balance + v_points,
     'Earned on your order', new.id)
  on conflict (transaction_id) do nothing;
  if not found then return null; end if;   -- already awarded

  update public.loyalty_accounts
     set points_balance = points_balance + v_points,
         points_earned  = points_earned + v_points
   where id = v_account.id;

  insert into public.notifications (user_id, title, message)
  values (new.member_id, 'You earned ' || v_points || ' points',
          'Thanks for your order. Your points are in your wallet.');
  return null;
end;
$$;
revoke all on function public.award_points_for_transaction() from public, anon, authenticated;

create trigger bizwallet_award_points
  after insert or update of status, member_id on public.transactions
  for each row
  when (new.status = 'completed' and new.member_id is not null)
  execute function public.award_points_for_transaction();


-- -----------------------------------------------------------------------------
-- Money + points RPCs
-- -----------------------------------------------------------------------------
-- Server-only (service role) after a confirmed payment.
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
  v_wallet  public.wallets;
  v_txn_id  uuid;
begin
  if p_amount is null or p_amount <= 0 then
    raise exception 'Top-up amount must be greater than zero' using errcode = '22023';
  end if;

  update public.wallets set balance = balance + p_amount
   where user_id = p_user_id
   returning * into v_wallet;
  if not found then
    raise exception 'Wallet not found' using errcode = 'P0002';
  end if;

  insert into public.wallet_transactions (wallet_id, user_id, type, amount, balance_after, description)
  values (v_wallet.id, p_user_id, 'credit', p_amount, v_wallet.balance, p_description)
  returning id into v_txn_id;

  insert into public.notifications (user_id, title, message)
  values (p_user_id, 'Top-up successful 💳',
          'RM' || to_char(p_amount, 'FM999990.00') || ' added. New balance: RM' ||
          to_char(v_wallet.balance, 'FM999990.00') || '.');

  return jsonb_build_object('wallet_id', v_wallet.id, 'transaction_id', v_txn_id,
                            'amount', p_amount, 'new_balance', v_wallet.balance);
end;
$$;
revoke all on function public.top_up_wallet(uuid, numeric, text) from public, anon, authenticated;
grant execute on function public.top_up_wallet(uuid, numeric, text) to service_role;

create or replace function public.redeem_reward(p_user_id uuid, p_reward_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_reward  public.loyalty_rewards;
  v_account public.loyalty_accounts;
  v_code    text := upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 10));
begin
  if auth.uid() is not null and auth.uid() <> p_user_id then
    raise exception 'Not authorized' using errcode = '42501';
  end if;

  select * into v_reward from public.loyalty_rewards where id = p_reward_id and is_active;
  if not found then
    raise exception 'Reward not found or inactive' using errcode = 'P0002';
  end if;

  select * into v_account from public.loyalty_accounts where user_id = p_user_id for update;
  if not found then
    raise exception 'Loyalty account not found' using errcode = 'P0002';
  end if;
  if v_account.points_balance < v_reward.points_cost then
    raise exception 'Not enough points: have %, need %', v_account.points_balance, v_reward.points_cost
      using errcode = 'P0001';
  end if;

  update public.loyalty_accounts
     set points_balance  = points_balance - v_reward.points_cost,
         points_redeemed = points_redeemed + v_reward.points_cost
   where id = v_account.id
   returning * into v_account;

  insert into public.loyalty_transactions (account_id, user_id, type, points, balance_after, description)
  values (v_account.id, p_user_id, 'redeem', -v_reward.points_cost, v_account.points_balance,
          'Redeemed: ' || v_reward.name);

  insert into public.vouchers (user_id, reward_id, code, title, points_spent)
  values (p_user_id, p_reward_id, v_code, v_reward.name, v_reward.points_cost);

  insert into public.notifications (user_id, title, message)
  values (p_user_id, 'Reward redeemed 🎁', 'You redeemed "' || v_reward.name || '". Voucher code: ' || v_code);

  return jsonb_build_object('code', v_code, 'reward', v_reward.name, 'points_balance', v_account.points_balance);
end;
$$;
revoke all on function public.redeem_reward(uuid, uuid) from public, anon;
grant execute on function public.redeem_reward(uuid, uuid) to authenticated, service_role;


-- -----------------------------------------------------------------------------
-- Owner portal (service role only)
-- -----------------------------------------------------------------------------
create or replace function public.admin_list_customers(
  p_search text default null,
  p_limit  integer default 20,
  p_offset integer default 0
)
returns table (
  id uuid, full_name text, email text, phone text, avatar_url text, role text,
  wallet_balance numeric, points_balance integer, lifetime_spent numeric,
  created_at timestamptz, total_count bigint
)
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select m.id, m.full_name, m.email, m.phone, m.avatar_url, m.role,
         coalesce(w.balance, 0), coalesce(l.points_balance, 0), coalesce(t.spent, 0),
         m.created_at, count(*) over ()
  from public.members m
  left join public.wallets w on w.user_id = m.id
  left join public.loyalty_accounts l on l.user_id = m.id
  left join (
    select member_id, sum(total) as spent from public.transactions
    where status = 'completed' and member_id is not null group by member_id
  ) t on t.member_id = m.id
  where m.role = 'customer'
    and (coalesce(btrim(p_search), '') = ''
         or m.full_name ilike '%' || p_search || '%'
         or m.phone     ilike '%' || p_search || '%'
         or m.email     ilike '%' || p_search || '%')
  order by m.created_at desc
  limit greatest(p_limit, 0) offset greatest(p_offset, 0);
$$;
revoke all on function public.admin_list_customers(text, integer, integer) from public, anon, authenticated;
grant execute on function public.admin_list_customers(text, integer, integer) to service_role;

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
  v_campaign_id uuid;
  v_count       integer;
begin
  if coalesce(btrim(p_title), '') = '' then
    raise exception 'Title is required' using errcode = '22023';
  end if;
  if coalesce(btrim(p_message), '') = '' then
    raise exception 'Message is required' using errcode = '22023';
  end if;
  if p_audience is null or p_audience not in ('all', 'high_points', 'inactive_30d') then
    raise exception 'Unknown audience %', p_audience using errcode = '22023';
  end if;

  insert into public.notifications (user_id, title, message)
  select m.id, p_title, p_message
  from public.members m
  left join public.loyalty_accounts l on l.user_id = m.id
  left join (
    select member_id, max(created_at) as last_at from public.transactions
    where member_id is not null group by member_id
  ) t on t.member_id = m.id
  where m.role = 'customer'
    and case p_audience
          when 'all'          then true
          when 'high_points'  then coalesce(l.points_balance, 0) > 500
          when 'inactive_30d' then t.last_at is null or t.last_at < now() - interval '30 days'
        end;
  get diagnostics v_count = row_count;

  insert into public.marketing_campaigns (title, message, audience, recipient_count, created_by)
  values (p_title, p_message, p_audience, v_count, p_created_by)
  returning id into v_campaign_id;

  return jsonb_build_object('campaign_id', v_campaign_id, 'recipient_count', v_count);
end;
$$;
revoke all on function public.admin_send_broadcast(text, text, text, uuid) from public, anon, authenticated;
grant execute on function public.admin_send_broadcast(text, text, text, uuid) to service_role;
