import test from "node:test";
import assert from "node:assert/strict";
import Product from "../models/Product.js";

const categoriesToTest = ["Motorcycle", "Electrical & Electronics", "3D Printing"];

for (const category of categoriesToTest) {
  test(`accepts the ${category} category`, async () => {
    const product = new Product({
      name: `${category} test item`,
      company: "JeruTech",
      category,
      price: 100,
      description: "Test product for category validation",
      stock: 5,
    });

    await assert.doesNotReject(product.validate());
  });
}
