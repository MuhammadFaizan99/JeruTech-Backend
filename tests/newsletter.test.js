import test from "node:test";
import assert from "node:assert/strict";
import { isValidEmail } from "../utils/validators.js";

test("accepts standard email addresses", () => {
  assert.equal(isValidEmail("user@example.com"), true);
  assert.equal(isValidEmail("first.last+tag@sub.domain.org"), true);
});

test("rejects invalid email addresses", () => {
  assert.equal(isValidEmail(""), false);
  assert.equal(isValidEmail("not-an-email"), false);
  assert.equal(isValidEmail("user@"), false);
  assert.equal(isValidEmail("@example.com"), false);
});
