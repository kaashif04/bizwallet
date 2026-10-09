-- =============================================================================
-- BizWallet — Phase 1: Wallet & Loyalty mutation functions
-- =============================================================================
-- These SECURITY DEFINER functions are the ONLY sanctioned way to move money or
-- points. RLS deliberately blocks direct writes to wallets / wallet_transactions
-- / loyalty_* from clients, so all balance changes funnel through here where we
-- can enforce locking, funds checks and atomicity.
--
-- Why SECURITY DEFINER: the function runs as its owner (postgres on Supabase),
-- so it can write the ledger tables even though the calling user can't. auth.uid()
-- STILL returns the caller's id inside the function (it reads the request JWT,
-- not the executing role), so we can authorise per-user.
--
-- Why FOR UPDATE: selecting the wallet row `for update` takes a row lock, so two
-- concurrent payments on the same wallet serialize instead of both reading the
-- old balance and double-spending.
--
-- Atomicity: each function call is one statement => one transaction. Any RAISE
-- aborts it and rolls back every insert/update done so far. Nothing partial.
-- =============================================================================


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
  p_user_id     uuid,
  p_order_total numeric,
  p_outlet_id   uuid,
  p_items       jsonb,
  p_notes       text default null
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
    wallet_amount_used, loyalty_points_earned, payment_method, notes
  )
  values (
    p_user_id, p_outlet_id, 'pending', p_items, p_order_total, p_order_total,
    p_order_total, v_points_earned, 'wallet', p_notes
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
revoke all on function public.process_wallet_payment(uuid, numeric, uuid, jsonb, text) from public;

-- Top-ups only from trusted server code (after a confirmed payment).
grant execute on function public.top_up_wallet(uuid, numeric, text)
  to service_role;

-- Customers may pay; the in-function auth.uid() guard scopes them to their own
-- wallet. service_role may also call it for server-driven checkouts.
grant execute on function public.process_wallet_payment(uuid, numeric, uuid, jsonb, text)
  to authenticated, service_role;
