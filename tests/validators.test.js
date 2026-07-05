import test from "node:test";
import assert from "node:assert/strict";
import { isValidPhoneNumber } from "../utils/validators.js";

test("accepts common international phone number formats", () => {
  assert.equal(isValidPhoneNumber("+1 (671) 277-5197"), true);
  assert.equal(isValidPhoneNumber("+44 20 7946 0958"), true);
  assert.equal(isValidPhoneNumber("(212) 555-1234"), true);
  assert.equal(isValidPhoneNumber("555-123-4567"), true);
  assert.equal(isValidPhoneNumber("+49 30 12345678"), true);
  assert.equal(isValidPhoneNumber("+234 803 123 4567"), true);
});

test("rejects malformed phone numbers", () => {
  assert.equal(isValidPhoneNumber("abc"), false);
  assert.equal(isValidPhoneNumber("123"), false);
  assert.equal(isValidPhoneNumber("+12abc"), false);
  assert.equal(isValidPhoneNumber(""), false);
});
