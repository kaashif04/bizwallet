-- =============================================================================
-- Backfill profiles/wallets/loyalty_accounts for any auth.users row that
-- never got one — e.g. an account created (or a trigger briefly missing)
-- before on_auth_user_created/handle_new_user() existed in this database.
-- Such users can still log in (auth.users is untouched by this), but every
-- app-side table referencing them comes back empty.
--
-- Mirrors handle_new_user() exactly, minus the welcome notification (these
-- accounts aren't new, so a "Welcome" message would be misleading). Safe to
-- re-run: each insert is guarded by a "row doesn't already exist" join.
-- =============================================================================

insert into public.profiles (id, role, full_name, email, phone, avatar_url, email_verified, phone_verified)
select
  u.id,
  case
    when u.raw_user_meta_data ->> 'role' in ('customer', 'owner')
      then (u.raw_user_meta_data ->> 'role')::public.user_role
    else 'customer'::public.user_role
  end,
  coalesce(u.raw_user_meta_data ->> 'full_name', u.raw_user_meta_data ->> 'name'),
  u.email,
  u.phone,
  coalesce(u.raw_user_meta_data ->> 'avatar_url', u.raw_user_meta_data ->> 'picture'),
  u.email_confirmed_at is not null,
  u.phone_confirmed_at is not null
from auth.users u
left join public.profiles p on p.id = u.id
where p.id is null;

insert into public.wallets (user_id)
select u.id
from auth.users u
left join public.wallets w on w.user_id = u.id
where w.user_id is null;

insert into public.loyalty_accounts (user_id, tier, current_tier_id)
select
  u.id,
  (select name from public.loyalty_tiers where points_required = 0),
  (select id   from public.loyalty_tiers where points_required = 0)
from auth.users u
left join public.loyalty_accounts la on la.user_id = u.id
where la.user_id is null;
