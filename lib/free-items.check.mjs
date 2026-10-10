// Run: node lib/free-items.check.mjs
import assert from "node:assert/strict";
import { lineTotals } from "./free-items.ts";

const soup = (q = 1) => ({ lineId: "soup", quantity: q, unitPrice: 8, item: { categoryId: "base", freeFromSpend: 20, freeSpendCategoryIds: ["steamboat"] } });
const beef = (q, price = 10) => ({ lineId: "beef", quantity: q, unitPrice: price, item: { categoryId: "steamboat" } });
const tea = { lineId: "tea", quantity: 5, unitPrice: 6, item: { categoryId: "drinks" } };

assert.equal(lineTotals([soup(), beef(1)]).get("soup"), 8, "RM10 of steamboat: soup charged");
assert.equal(lineTotals([soup(), beef(2)]).get("soup"), 0, "RM20 of steamboat: soup free");
assert.equal(lineTotals([soup(2), beef(2)]).get("soup"), 0, "whole line free");
assert.equal(lineTotals([soup(), tea]).get("soup"), 8, "other categories don't count");
assert.equal(lineTotals([soup(), beef(1, 19.99)]).get("soup"), 8, "just under the threshold");
assert.equal(lineTotals([soup(), beef(2)]).get("beef"), 20, "qualifying items keep their price");
const noCats = { ...soup(), item: { freeFromSpend: 20 } };
assert.equal(lineTotals([noCats, beef(5)]).get("soup"), 8, "no categories: never free");
console.log("free-items: all checks pass");
