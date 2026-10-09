-- =============================================================================
-- BizWallet — dev seed data (2 outlets + 5 menu items)
-- =============================================================================
-- For local development / frontend work only. NOT applied by `supabase db push`;
-- run it manually (SQL Editor or `psql`) — or it runs automatically on
-- `supabase db reset` for the local stack.
--
-- Re-running appends duplicates (outlet names aren't unique), so reset the DB
-- between runs if you want a clean slate.
-- =============================================================================

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
