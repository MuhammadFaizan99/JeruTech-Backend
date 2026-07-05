import Amount from "../models/Amount.js";
import Cart from "../models/Cart.js";
import Product from "../models/Product.js";
import { buildPaginationMeta, parsePagination } from "../utils/pagination.js";

export const getCartKey = (productId, isDiscounted) =>
  `${productId}-${isDiscounted ? "deal" : "regular"}`;

export async function getActivePricingSettings() {
  const amounts = await Amount.find();

  if (!amounts || amounts.length === 0) {
    throw new Error(
      "Amount configuration not found. Please create an amount document first.",
    );
  }

  const active = amounts[0];

  return {
    taxRate: active.TAX_RATE ?? 0,
    deliveryFee: active.DELIVERY_FEE ?? 0,
    taxName: active.name ?? "Standard Tax",
  };
}

export async function getActiveTaxRate() {
  const { taxRate } = await getActivePricingSettings();
  return taxRate;
}

export function normalizeTaxRate(taxRate = 0) {
  const numericTaxRate = Number(taxRate) || 0;
  return numericTaxRate > 1 ? numericTaxRate / 100 : numericTaxRate;
}

export function computeCartTotals(items, taxRate = 0, deliveryFeeAmount = 0) {
  const normalizedTaxRate = normalizeTaxRate(taxRate);
  const subtotal = Number(
    items.reduce((sum, item) => sum + item.price * item.quantity, 0).toFixed(2),
  );
  const cartCount = items.reduce((sum, item) => sum + item.quantity, 0);
  const tax = Number((subtotal * normalizedTaxRate).toFixed(2));
  const deliveryFee =
    items.length > 0 ? Number(Number(deliveryFeeAmount).toFixed(2)) : 0;
  const total =
    subtotal > 0 ? Number((subtotal + tax + deliveryFee).toFixed(2)) : 0;

  return {
    subtotal,
    cartCount,
    tax,
    deliveryFee,
    total,
    taxRate: normalizedTaxRate,
    deliveryFeeAmount: deliveryFee,
  };
}

export function buildCartItemFromProduct(product, quantity) {
  const isDiscounted = Boolean(product.isDiscounted || product.discount > 0);
  const price = product.finalPrice ?? product.price;

  return {
    product: product._id,
    cartKey: getCartKey(product._id.toString(), isDiscounted),
    name: product.name,
    image: product.images?.[0] || "",
    category: product.category,
    price,
    oldPrice: isDiscounted ? product.price : null,
    discounted: isDiscounted,
    discount: product.discount ?? 0,
    quantity: Math.max(1, Number(quantity) || 1),
  };
}

export async function findOrCreateCart(userId) {
  let cart = await Cart.findOne({ user: userId });

  if (!cart) {
    cart = await Cart.create({ user: userId, items: [] });
  }

  return cart;
}

export async function getProductStock(productId) {
  const product = await Product.findById(productId).select("stock");
  return product?.stock ?? 0;
}

export function formatCartItem(item, stock = null) {
  return {
    _id: item._id.toString(),
    productId: item.product?.toString?.() || String(item.product),
    cartKey: item.cartKey,
    name: item.name,
    category: item.category,
    image: item.image,
    price: item.price,
    oldPrice: item.oldPrice ?? null,
    discounted: item.discounted,
    discount: item.discount ?? 0,
    quantity: item.quantity,
    lineTotal: Number((item.price * item.quantity).toFixed(2)),
    stock,
  };
}

export function paginateCartItems(items, query = {}) {
  const { page, limit, skip } = parsePagination(query);
  const paginatedItems = items.slice(skip, skip + limit);
  const totalItems = items.length;
  const pagination = buildPaginationMeta({ page, limit, totalItems });

  return {
    items: paginatedItems,
    pagination,
  };
}

export async function buildCartResponse(cart, query = {}) {
  const { taxRate, deliveryFee: deliveryFeeAmount } =
    await getActivePricingSettings();
  const totals = computeCartTotals(cart.items, taxRate, deliveryFeeAmount);

  const itemsWithStock = await Promise.all(
    cart.items.map(async (item) => {
      const stock = await getProductStock(item.product);
      return formatCartItem(item, stock);
    }),
  );

  const { items: paginatedItems, pagination } = paginateCartItems(
    itemsWithStock,
    query,
  );

  cart.subtotal = totals.subtotal;
  cart.tax = totals.tax;
  cart.deliveryFee = totals.deliveryFee;
  cart.total = totals.total;
  await cart.save();

  return {
    _id: cart._id,
    items: paginatedItems,
    allItems: itemsWithStock,
    ...totals,
    pagination,
  };
}
