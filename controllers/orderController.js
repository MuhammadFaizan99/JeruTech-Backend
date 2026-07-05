import Order from "../models/Order.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { sendSuccess, sendError } from "../utils/responseHandler.js";
import {
  buildPaginatedResponse,
  buildSort,
  parsePagination,
} from "../utils/pagination.js";
import {
  buildCartResponse,
  findOrCreateCart,
} from "../services/cartService.js";
import {
  createOrderFromCart,
  flattenOrderItemsForPagination,
  OrderError,
  updateOrderStatusByAdmin,
} from "../services/orderService.js";
import { WalletError } from "../services/walletService.js";

const formatOrder = (order) => ({
  _id: order._id,
  userId: order.user?.toString?.() || String(order.user),
  orderItems: order.orderItems.map((item) => ({
    productId: item.product?.toString?.() || String(item.product),
    name: item.name,
    quantity: item.quantity,
    price: item.price,
    lineTotal: Number((item.price * item.quantity).toFixed(2)),
  })),
  customerDetails: order.customerDetails,
  subtotal: order.subtotal,
  tax: order.tax,
  deliveryFee: order.deliveryFee,
  total: order.total,
  paymentMethod: order.paymentMethod,
  orderStatus: order.orderStatus,
  stockDeducted: order.stockDeducted,
  userWalletCreated: order.userWalletCreated,
  createdAt: order.createdAt,
  updatedAt: order.updatedAt,
});

export const createOrder = asyncHandler(async (req, res) => {
  const paymentMethod = "Cash on Delivery (Cash in Hand)";

  try {
    const order = await createOrderFromCart({
      user: req.user,
      paymentMethod,
    });

    const cart = await findOrCreateCart(req.user._id);
    await buildCartResponse(cart);

    sendSuccess(res, 201, "Order placed successfully", {
      order: formatOrder(order),
    });
  } catch (error) {
    if (error instanceof OrderError || error instanceof WalletError) {
      return sendError(res, error.statusCode || 400, error.message);
    }

    throw error;
  }
});

export const getOrders = asyncHandler(async (req, res) => {
  const { page, limit, skip, search, sort } = parsePagination(req.query);
  const filter = req.user.role === "admin" ? {} : { user: req.user._id };

  if (req.query.status) {
    filter.orderStatus = req.query.status;
  }

  if (search) {
    filter.$or = [
      { "customerDetails.customerName": { $regex: search, $options: "i" } },
      { "customerDetails.email": { $regex: search, $options: "i" } },
      { paymentMethod: { $regex: search, $options: "i" } },
      { orderStatus: { $regex: search, $options: "i" } },
      { "orderItems.name": { $regex: search, $options: "i" } },
    ];
  }

  const totalItems = await Order.countDocuments(filter);
  const maxPage = Math.max(1, Math.ceil(totalItems / limit));
  const safePage = Math.min(page, maxPage);
  const safeSkip = (safePage - 1) * limit;
  const orders = await Order.find(filter)
    .sort(buildSort(sort))
    .skip(safeSkip)
    .limit(limit);
  const formattedOrders = orders.map(formatOrder);
  const payload = buildPaginatedResponse({
    data: formattedOrders,
    page: safePage,
    limit,
    totalItems,
  });

  res.status(200).json({
    success: true,
    message: "Orders retrieved successfully",
    ...payload,
  });
});

export const getPurchasedItems = asyncHandler(async (req, res) => {
  const { page, limit, skip } = parsePagination(req.query);
  const orders = await Order.find({ user: req.user._id })
    .sort({ createdAt: -1 })
    .lean();
  const purchasedItems = flattenOrderItemsForPagination(orders);
  const totalItems = purchasedItems.length;
  const maxPage = Math.max(1, Math.ceil(totalItems / limit));
  const safePage = Math.min(page, maxPage);
  const safeSkip = (safePage - 1) * limit;
  const pagedItems = purchasedItems.slice(safeSkip, safeSkip + limit);
  const payload = buildPaginatedResponse({
    data: pagedItems,
    page: safePage,
    limit,
    totalItems,
  });

  sendSuccess(res, 200, "Purchased items retrieved successfully", payload);
});

export const getOrderById = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id);

  if (!order) {
    return sendError(res, 404, "Order not found");
  }

  if (
    req.user.role !== "admin" &&
    order.user.toString() !== req.user._id.toString()
  ) {
    return sendError(res, 403, "Not authorized to view this order");
  }

  sendSuccess(res, 200, "Order retrieved successfully", {
    order: formatOrder(order),
  });
});

export const updateOrderStatus = asyncHandler(async (req, res) => {
  const { orderStatus } = req.body;

  const validStatuses = [
    "pending",
    "processing",
    "shipped",
    "delivered",
    "cancelled",
  ];

  if (!validStatuses.includes(orderStatus)) {
    return sendError(res, 400, "Invalid order status");
  }

  try {
    const order = await updateOrderStatusByAdmin({
      orderId: req.params.id,
      nextStatus: orderStatus,
      adminUserId: req.user._id,
    });

    sendSuccess(res, 200, "Order status updated", {
      order: formatOrder(order),
    });
  } catch (error) {
    if (error instanceof OrderError || error instanceof WalletError) {
      return sendError(res, error.statusCode || 400, error.message);
    }

    throw error;
  }
});

export const approveOrder = asyncHandler(async (req, res) => {
  try {
    const order = await updateOrderStatusByAdmin({
      orderId: req.params.id,
      nextStatus: "processing",
      adminUserId: req.user._id,
    });

    sendSuccess(res, 200, "Order approved successfully", {
      order: formatOrder(order),
    });
  } catch (error) {
    if (error instanceof OrderError || error instanceof WalletError) {
      return sendError(res, error.statusCode || 400, error.message);
    }

    throw error;
  }
});
