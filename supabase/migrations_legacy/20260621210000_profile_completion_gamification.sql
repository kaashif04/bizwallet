-- =============================================================================
-- Profile completion + gamification. Adds optional marketing-relevant profile
-- fields (date of birth, gender, dietary preferences, address, marketing
-- consent) and awards a small one-time loyalty-points bonus the first time
-- each field — including the pre-existing `phone` column, never editable
-- from the profile screen until now — is filled in.
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
-- performs the privileged loyalty_accounts write itself. This mirrors how
-- profiles_protect_role and loyalty_accounts_check_tier already use
-- SECURITY DEFINER triggers for privileged side effects clients can't
-- perform directly (RLS blocks direct client writes to loyalty_*; see PART
-- 2's "these SECURITY DEFINER functions are the ONLY sanctioned way to move
-- money or points" comment in setup.sql).
-- =============================================================================

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

-- -----------------------------------------------------------------------------
-- award_profile_completion_points: +20 loyalty points the first time each of
-- 6 fields is filled in (120 total). Re-uses the existing
-- loyalty_accounts_check_tier trigger (fires on points_earned increase) for
-- tier upgrades via a plain UPDATE — same as every other points-awarding
-- path in this schema; no new tier-upgrade logic needed here.
-- -----------------------------------------------------------------------------
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
