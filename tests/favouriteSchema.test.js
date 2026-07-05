import test from "node:test";
import assert from "node:assert/strict";
import User from "../models/User.js";

test("User schema keeps favourite product ids", () => {
  const user = new User({
    customerName: "Test User",
    phoneNumber: "1234567890",
    address: "123 Test Street",
    email: "favourites-test@example.com",
    password: "password123",
    favourites: ["507f1f77bcf86cd799439011"],
  });

  const plainUser = user.toObject();

  assert.equal(plainUser.favourites[0].toString(), "507f1f77bcf86cd799439011");
});
