-- =============================================================================
-- Wire orders.scheduled_for (added in 20260621160000) into the real wallet
-- checkout path, so a "Schedule for Later" pick actually lands on the order
-- row, not just the POS dispatch payload. Safe to run on an existing
-- database (delta migration).
-- =============================================================================

-- Must drop first: adding a parameter changes the signature, and
-- create-or-replace cannot widen an argument list in place.
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
