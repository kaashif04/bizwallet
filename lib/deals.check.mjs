// Run: node lib/deals.check.mjs
import assert from "node:assert/strict";
import { dealBadge, dealTitle } from "./deals.ts";
import { endsLabel } from "./hours.ts";

assert.equal(dealBadge({ kind: "percent", value: 20 }), "20% off");
assert.equal(dealBadge({ kind: "amount", value: 5 }), "RM5 off");
assert.equal(dealBadge({ kind: "amount", value: 2.5 }), "RM2.50 off");

const item = { id: "1", name: "Ma Po Tofu", image_url: null, price: 15, regular_price: 20 };
const base = { id: "d", title: null, ends_at: null, menu_item_id: "1", category_id: null, category: null, items: [item] };
assert.equal(dealTitle({ ...base, kind: "amount", value: 5 }), "RM5 off Ma Po Tofu");
assert.equal(dealTitle({ ...base, kind: "percent", value: 20, menu_item_id: null, category_id: "c", category: "Tofu" }), "20% off Tofu");
assert.equal(dealTitle({ ...base, kind: "percent", value: 20, title: "Lunch special" }), "Lunch special");

// Wed 11 Nov 2026, 2pm in KL (06:00 UTC).
const now = new Date("2026-11-11T06:00:00Z");
assert.equal(endsLabel(null, now), null);
assert.equal(endsLabel("2026-11-11T11:00:00Z", now), "Ends 7pm", "later today");
assert.equal(endsLabel("2026-11-11T11:30:00Z", now), "Ends 7:30pm");
assert.equal(endsLabel("2026-11-11T16:00:00Z", now), "Ends tonight", "midnight KL");
assert.equal(endsLabel("2026-11-15T15:59:00Z", now), "Ends Sun", "this week");
assert.equal(endsLabel("2026-11-20T04:00:00Z", now), "Ends 20 Nov");
console.log("deals: all checks passed");
