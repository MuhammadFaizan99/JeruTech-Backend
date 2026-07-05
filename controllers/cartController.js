import Cart from "../models/Cart.js";
import Product from "../models/Product.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { sendSuccess, sendError } from "../utils/responseHandler.js";
import {
  buildCartItemFromProduct,
  buildCartResponse,
  findOrCreateCart,
} from "../services/cartService.js";

export const getCart = asyncHandler(async (req, res) => {
  const cart = await findOrCreateCart(req.user._id);
  const formattedCart = await buildCartResponse(cart, req.query);

  sendSuccess(res, 200, "Cart retrieved successfully", { cart: formattedCart });
});

export const addToCart = asyncHandler(async (req, res) => {
  const { productId, quantity = 1 } = req.body;

  if (!productId) {
    return sendError(res, 400, "Product ID is required");
  }

  const product = await Product.findById(productId);

  if (!product) {
    return sendError(res, 404, "Product not found");
  }

  if (product.stock <= 0) {
    return sendError(res, 400, `${product.name} is out of stock`);
  }

  const cart = await findOrCreateCart(req.user._id);
  const newItem = buildCartItemFromProduct(product, quantity);
  const existingItem = cart.items.find(
    (item) => item.cartKey === newItem.cartKey,
  );
  const nextQuantity = existingItem
    ? existingItem.quantity + newItem.quantity
    : newItem.quantity;

  if (nextQuantity > product.stock) {
    return sendError(
      res,
      400,
      `Only ${product.stock} unit${product.stock === 1 ? "" : "s"} available for ${product.name}`,
    );
  }

  if (existingItem) {
    existingItem.quantity = nextQuantity;
    existingItem.price = newItem.price;
    existingItem.oldPrice = newItem.oldPrice;
    existingItem.discounted = newItem.discounted;
    existingItem.discount = newItem.discount;
    existingItem.name = newItem.name;
    existingItem.image = newItem.image;
    existingItem.category = newItem.category;
  } else {
    cart.items.push(newItem);
  }

  await cart.save();
  const formattedCart = await buildCartResponse(cart);

  sendSuccess(res, 200, "Item added to cart", { cart: formattedCart });
});

export const updateCartItem = asyncHandler(async (req, res) => {
  const { itemId } = req.params;
  const { quantity } = req.body;

  if (quantity === undefined || quantity === null) {
    return sendError(res, 400, "Quantity is required");
  }

  const parsedQuantity = Number(quantity);

  if (!Number.isInteger(parsedQuantity) || parsedQuantity < 0) {
    return sendError(res, 400, "Quantity must be a non-negative integer");
  }

  const cart = await findOrCreateCart(req.user._id);
  const item = cart.items.id(itemId);

  if (!item) {
    return sendError(res, 404, "Cart item not found");
  }

  if (parsedQuantity === 0) {
    item.deleteOne();
    await cart.save();
    const formattedCart = await buildCartResponse(cart);
    return sendSuccess(res, 200, "Item removed from cart", {
      cart: formattedCart,
    });
  }

  const product = await Product.findById(item.product);

  if (!product) {
    item.deleteOne();
    await cart.save();
    return sendError(
      res,
      400,
      "Product is no longer available and was removed from your cart",
    );
  }

  if (parsedQuantity > product.stock) {
    return sendError(
      res,
      400,
      `Only ${product.stock} unit${product.stock === 1 ? "" : "s"} available for ${product.name}`,
    );
  }

  const refreshedItem = buildCartItemFromProduct(product, parsedQuantity);
  item.quantity = parsedQuantity;
  item.price = refreshedItem.price;
  item.oldPrice = refreshedItem.oldPrice;
  item.discounted = refreshedItem.discounted;
  item.discount = refreshedItem.discount;
  item.name = refreshedItem.name;
  item.image = refreshedItem.image;
  item.category = refreshedItem.category;

  await cart.save();
  const formattedCart = await buildCartResponse(cart);

  sendSuccess(res, 200, "Cart item updated", { cart: formattedCart });
});

export const removeFromCart = asyncHandler(async (req, res) => {
  const { itemId } = req.params;
  const cart = await findOrCreateCart(req.user._id);
  const item = cart.items.id(itemId);

  if (!item) {
    return sendError(res, 404, "Cart item not found");
  }

  item.deleteOne();
  await cart.save();
  const formattedCart = await buildCartResponse(cart);

  sendSuccess(res, 200, "Item removed from cart", { cart: formattedCart });
});

export const clearCart = asyncHandler(async (req, res) => {
  const cart = await findOrCreateCart(req.user._id);
  cart.items = [];
  await cart.save();
  const formattedCart = await buildCartResponse(cart);

  sendSuccess(res, 200, "Cart cleared", { cart: formattedCart });
});
