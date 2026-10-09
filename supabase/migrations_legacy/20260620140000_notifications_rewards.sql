-- =============================================================================
-- Notifications + Loyalty rewards engine. Safe to run on an existing database.
-- =============================================================================

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
