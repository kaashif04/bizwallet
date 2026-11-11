// Run: node lib/hours.check.mjs
import assert from "node:assert/strict";
import { clock, nextOpening, openLabel, orderingStatus } from "./hours.ts";

assert.equal(clock("02:00"), "2am");
assert.equal(clock("19:30"), "7:30pm");
assert.equal(clock("12:00"), "12pm");
assert.equal(clock("00:00"), "12am");

const week = Array(7).fill({ open: "07:00", close: "02:00" }); // past midnight
const tue6am = new Date(2026, 9, 13, 6, 0); // Tue 13 Oct 2026, 6:00
assert.equal(nextOpening(week, tue6am), "7am", "later today");
const tue3am = new Date(2026, 9, 13, 3, 0);
assert.equal(nextOpening(week, tue3am), "7am", "after last night's close, before today's open");
const closedMon = [null, ...Array(6).fill({ open: "10:00", close: "22:00" })];
const sun11pm = new Date(2026, 9, 18, 23, 0); // Sunday
assert.equal(nextOpening(closedMon, sun11pm), "Tue 10am", "skips a closed day");
const sat11pm = new Date(2026, 9, 17, 23, 0);
assert.equal(nextOpening(closedMon, sat11pm), "tomorrow 10am");
assert.equal(openLabel(true, { open: "07:00", close: "02:00" }, week).text, "Open now · closes 2am");
assert.equal(openLabel(false, null, week, tue6am).text, "Closed · opens 7am");
assert.equal(openLabel(null, null, null), null, "no hours set: no pill");
// Last orders (BizPos cut-off): open, but no longer ordering.
const tue9pm = new Date(2026, 9, 13, 21, 45);
const ten = Array(7).fill({ open: "10:00", close: "22:00" });
const day = { open_now: true, today: ten[1], hours: ten };
assert.equal(orderingStatus(day, tue9pm).open, true, "no cut-off set: open_now decides");
assert.deepEqual(orderingStatus({ ...day, ordering_open: false, last_order_at: "21:30" }, tue9pm),
  { open: false, text: "Last orders were at 9:30pm.", opens: "tomorrow 10am" });
assert.equal(orderingStatus({ ...day, open_now: false, ordering_open: false }, tue6am).text, "Closed · opens 10am", "closed wins");
console.log("hours: all checks passed");
