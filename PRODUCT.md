# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users
- **Primary: the diner at the table.** Phone in hand mid-meal in a Malaysian restaurant (mamak, bistro, café), usually arrived by scanning the table QR, often not signed in. Jobs: order, follow the food, call staff or ask for the bill, pay or split the bill, collect points. Speed and one-handed use matter most.
- **Secondary: the regular.** A signed-in member coming back to one restaurant: points, rewards, past orders there, reordering.
- **Walk-in counter customer.** Paid at the till and scans the receipt QR within 12 hours to claim points.
- Owners and staff never use BizWallet; they work in BizPos.

## Product Purpose
BizWallet is the customer side of BizPos: QR ordering, table service, bill splitting and loyalty for each restaurant. Success: diners use it every visit because it is faster and more rewarding than waving for staff, and regulars come back for their points.

## Positioning
Each restaurant stands alone. There is no marketplace or app-wide dashboard: customers arrive through one restaurant's table QR, receipt QR or shared link, and land on that restaurant's own home. Table service (call staff, bill, Wi-Fi, live order progress, split payment) and receipt-QR points for counter customers are built in, not add-ons.

## Operating Context
Mobile browser, opened from the phone camera. Restaurants are often bright and busy at night; the phone is one-handed. Payments are FPX through Billplz (sandbox until live keys). Points are per restaurant company; tiers, rewards and vouchers come from BizPos. Malaysian ringgit (RM), Malaysia time.

## Capabilities and Constraints
- Routes: `/s/<outlet>` restaurant home, `/order/t/<token>` table home (+ `/menu`, `/bill`, `/play`), `/order/p/<outlet>` pickup, `/order/status/<id>`, `/r/<code>` receipt claim, `/customer/dashboard` (Your places), `/customer/orders`, `/customer/profile`, `/login`.
- Shared Supabase database with BizPos; BizPos owns menus, bills and outlets. BizWallet reads through RPCs.
- No wallet credit or top-ups (removed on purpose). No delivery. No lucky draws (Malaysian gaming law); games are skill games.
- Light and dark themes; light by default, chosen in Profile.
- English only for now; copy should leave room for Bahasa Melayu later.

## Brand Commitments
- **The restaurant leads.** Its photos, logo and name own the screen; BizWallet appears only as a small "powered by" mark.
- Plain, warm, short English. No jargon, no hype.

## Evidence on Hand
Real restaurant data in production: A1 Bistro and Kiya's Restaurant (covers, logos, taglines, menus with dish photos, rewards). No real customer testimonials, metrics or press exist; never invent them.

## Product Principles
1. The restaurant is the hero; BizWallet stays out of the way.
2. The table moment comes first: the next useful action is always one thumb away.
3. Make coming back feel rewarding: points, progress and usuals should be visible and motivating, not buried.
4. Fewer, stronger elements: every section earns its place.
5. Honest money: amounts, splits and points are always exact and explained.

## Accessibility & Inclusion
Readable in bright restaurants and at night: strong contrast in both themes, large tap targets, works one-handed.
