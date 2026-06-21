-- =============================================================================
-- Smart Scheduling & Time Slots: outlet operating hours/prep time, and an
-- optional "schedule for later" timestamp on orders (null = ASAP).
-- Safe to run on an existing database (delta migration).
-- =============================================================================

alter table public.outlets
  add column if not exists open_time         time,
  add column if not exists close_time        time,
  add column if not exists prep_time_minutes integer not null default 20
    check (prep_time_minutes >= 0);

alter table public.orders
  add column if not exists scheduled_for timestamptz;

create index if not exists orders_scheduled_for_idx
  on public.orders (scheduled_for)
  where scheduled_for is not null;
