-- =============================================================================
-- Owner Dashboard: Customer CRM + Marketing Broadcasts + Promo Codes.
-- Safe to run on an existing database.
-- =============================================================================

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
