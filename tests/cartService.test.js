import test from "node:test";
import assert from "node:assert/strict";
import { computeCartTotals, paginateCartItems } from "../services/cartService.js";

test("computeCartTotals treats TAX_RATE values as percentages when provided as whole numbers", () => {
  const totals = computeCartTotals([{ price: 100, quantity: 2 }], 5, 10);

  assert.equal(totals.subtotal, 200);
  assert.equal(totals.tax, 10);
  assert.equal(totals.total, 220);
});

test("computeCartTotals still handles decimal tax rates correctly", () => {
  const totals = computeCartTotals([{ price: 100, quantity: 2 }], 0.05, 10);

  assert.equal(totals.tax, 10);
  assert.equal(totals.total, 220);
});

test("paginateCartItems returns the correct items and pagination metadata", () => {
  const items = [{ id: 1 }, { id: 2 }, { id: 3 }, { id: 4 }];

  const result = paginateCartItems(items, { page: 2, limit: 2 });

  assert.deepEqual(result.items, [{ id: 3 }, { id: 4 }]);
  assert.deepEqual(result.pagination, {
    currentPage: 2,
    totalPages: 2,
    totalItems: 4,
    limit: 2,
    hasNextPage: false,
    hasPrevPage: true,
  });
});
