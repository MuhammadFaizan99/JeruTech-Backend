import test from "node:test";
import assert from "node:assert/strict";
import { buildPaginatedResponse } from "../utils/pagination.js";

test("buildPaginatedResponse returns consistent pagination metadata", () => {
  const response = buildPaginatedResponse([{ id: 1 }, { id: 2 }], {
    page: 10,
    limit: 4,
    totalItems: 7,
  });

  assert.equal(response.currentPage, 2);
  assert.equal(response.totalPages, 2);
  assert.equal(response.totalItems, 7);
  assert.equal(response.limit, 4);
  assert.equal(response.hasNextPage, false);
  assert.equal(response.hasPrevPage, true);
  assert.deepEqual(response.data, [{ id: 1 }, { id: 2 }]);
});
