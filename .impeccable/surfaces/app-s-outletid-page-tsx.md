---
version: 1
slug: "app-s-outletid-page-tsx"
primary_target: "app/s/[outletId]/page.tsx"
related_targets: ["components/order/TableHome.tsx","components/order/BillSplit.tsx","app/r/[code]/page.tsx","app/customer/dashboard/page.tsx","app/customer/orders/page.tsx","components/auth/CustomerLogin.tsx"]
---

# Surface brief: BizWallet customer app (restaurant home, table home, bill, receipt claim, places, orders, login)

Mode: Operate. Audience: the diner at the table, one-handed, often signed out; then the regular. Job: order, follow, call staff, pay or split, collect points, come back.
Constraints: restaurant leads (its photo, logo, name own the screen); English; light by default, dark in Profile; exact money.

## Direction contract

THESIS: Every screen is the restaurant's own order pad. The table, the bill, the points and the receipt are chits: torn-off paper slips with a header band, ruled lines, a double-ruled total and a rubber stamp for state. Refuses the food-app default of white rounded cards with tiny uppercase labels over a soft gradient.

OWN-WORLD: Chits of warm-white paper on a cool grey laminate tabletop, lifted by a real offset shadow; perforated tear edge on top; pink carbon-copy header band; carbon-blue ink for headings, figures and primary buttons; stamp red only for state stamps (PAID, READY, NEW, COLLECTED). Archivo throughout, expanded width for pad headers and totals, three sizes only, rank by weight and case. Dish photos at one fixed square scale. Night theme: carbon-paper navy chits on near-black with luminous carbon-blue ink.

STORY: The diner sees the restaurant first, then their slip: what's ordered, what's owed, what they've earned. The next action sits at the foot of the chit, in thumb reach. Paying or collecting ends with the stamp coming down.

FIRST VIEWPORT: Restaurant photo full-bleed on top (about 40% of the screen), logo and name on it; a chit overlaps the photo's lower edge: pink header band with the restaurant/table, ruled lines with the current state (points or table total), and a carbon-blue action bar pinned to the bottom of the viewport.

FORM: Mamak order chit, candidate 1 of 7 (Impeccable's pick, chosen by the user over the roll); seed key a2a30c24. Signature interaction: the rubber stamp thump (scale 1.6 to 1, slight rotate, ink settles) on paid, ready and collected.

FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance
