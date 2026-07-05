import Product from "../models/Product.js";
import User from "../models/User.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { sendSuccess, sendError } from "../utils/responseHandler.js";
import { buildPaginatedResponse, parsePagination } from "../utils/pagination.js";

const toProductIdString = (productId) =>
  productId?.toString?.() || String(productId);

export const getMyFavourites = asyncHandler(async (req, res) => {
  const { page, limit, skip } = parsePagination(req.query);
  const user = await User.findById(req.user._id).select("favourites").lean();
  const favouriteIds = (user?.favourites ?? []).map(toProductIdString);
  const totalItems = favouriteIds.length;
  const maxPage = Math.max(1, Math.ceil(totalItems / limit));
  const safePage = Math.min(page, maxPage);
  const safeSkip = (safePage - 1) * limit;
  const pagedIds = favouriteIds.slice(safeSkip, safeSkip + limit);
  const products = await Product.find({ _id: { $in: pagedIds } }).lean();
  const productsById = Object.fromEntries(
    products.map((product) => [toProductIdString(product._id), product]),
  );
  const data = pagedIds.map((id) => productsById[id]).filter(Boolean);
  const payload = buildPaginatedResponse({
    data,
    page: safePage,
    limit,
    totalItems,
  });

  sendSuccess(res, 200, "Favourites retrieved successfully", payload);
});

export const addFavourite = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.productId);

  if (!product) {
    return sendError(res, 404, "Product not found");
  }

  const user = await User.findById(req.user._id);
  const existing = user.favourites?.some(
    (item) => toProductIdString(item) === toProductIdString(product._id),
  );

  if (!existing) {
    user.favourites = [...(user.favourites || []), product._id];
    await user.save();
  }

  sendSuccess(res, 200, "Favourite added successfully", {
    added: true,
    favouritesCount: user.favourites?.length || 0,
  });
});

export const removeFavourite = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.productId);

  if (!product) {
    return sendError(res, 404, "Product not found");
  }

  const user = await User.findById(req.user._id);
  user.favourites = (user.favourites || []).filter(
    (item) => toProductIdString(item) !== toProductIdString(product._id),
  );
  await user.save();

  sendSuccess(res, 200, "Favourite removed successfully", {
    added: false,
    favouritesCount: user.favourites?.length || 0,
  });
});
