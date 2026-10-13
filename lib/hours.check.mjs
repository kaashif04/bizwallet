// Run: node lib/hours.check.mjs
import assert from "node:assert/strict";
import { clock, nextOpening, openLabel } from "./hours.ts";

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
console.log("hours: all checks passed");
