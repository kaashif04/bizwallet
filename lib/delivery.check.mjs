// Run: node lib/delivery.check.mjs
import assert from "node:assert/strict";
import { customerFee, e164, km } from "./delivery.ts";

assert.equal(customerFee(8.3, 0, 0), 8.3, "no markup: Lalamove's price");
assert.equal(customerFee(8.3, 1, 0), 9.3, "RM1 markup");
assert.equal(customerFee(8.3, 0, 10), 9.2, "10% markup rounds 9.13 up to 9.20");
assert.equal(customerFee(8.3, 0.5, 10), 9.7, "both");
assert.equal(customerFee(7.01, 0, 0), 7.1, "always rounded up, never down");
assert.equal(e164("012-345 6789"), "+60123456789");
assert.equal(e164("60123456789"), "+60123456789");
assert.equal(e164("+6012 345 6789"), "+60123456789");
assert.ok(Math.abs(km({ lat: 3.1478, lng: 101.6953 }, { lat: 3.1579, lng: 101.7123 }) - 2.2) < 0.1, "Pavilion to KLCC ~2.2km");
console.log("delivery ok");
