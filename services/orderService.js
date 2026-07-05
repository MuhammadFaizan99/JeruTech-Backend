import mongoose from "mongoose";
import Cart from "../models/Cart.js";
import Order from "../models/Order.js";
import Product from "../models/Product.js";
import { computeCartTotals, getActivePricingSettings } from "./cartService.js";
import { WalletError, recordOrderTransactions } from "./walletService.js";

export class OrderError extends Error {
  constructor(message, statusCode = 400) {
    super(message);
    this.name = "OrderError";
    this.statusCode = statusCode;
  }
}

export const flattenOrderItemsForPagination = (orders = []) =>
  orders.flatMap((order) =>
    (order.orderItems || []).map((item) => ({
      orderId: order._id,
      productId: item.product,
      name: item.name,
      quantity: item.quantity,
      price: item.price,
      lineTotal: Number((item.price * item.quantity).toFixed(2)),
      purchasedAt: order.createdAt,
      orderStatus: order.orderStatus,
    })),
  );

export async function validateCartStock(cartItems) {
  for (const item of cartItems) {
    const product = await Product.findById(item.product);

    if (!product) {
      throw new OrderError(`${item.name} is no longer available`);
    }

    if (product.stock < item.quantity) {
      throw new OrderError(
        `Insufficient stock for ${product.name}. Only ${product.stock} available.`,
      );
    }
  }
}

export async function deductOrderStock(orderItems, session = null) {
  for (const item of orderItems) {
    const query = Product.findByIdAndUpdate(
      item.product,
      { $inc: { stock: -item.quantity } },
      { new: true, session },
    );

    const product = await query;

    if (!product) {
      throw new OrderError(`${item.name} is no longer available`);
    }

    if (product.stock < 0) {
      throw new OrderError(
        `Insufficient stock for ${item.name}. Only ${product.stock + item.quantity} available.`,
      );
    }
  }
}

export async function restoreOrderStock(orderItems, session = null) {
  for (const item of orderItems) {
    await Product.findByIdAndUpdate(
      item.product,
      { $inc: { stock: item.quantity } },
      { session },
    );
  }
}

export async function createOrderFromCart({
  user,
  paymentMethod = "Cash on Delivery (Cash in Hand)",
}) {
  const session = await mongoose.startSession();

  try {
    session.startTransaction();

    const cart = await Cart.findOne({ user: user._id }).session(session);

    if (!cart || cart.items.length === 0) {
      throw new OrderError("Your cart is empty");
    }

    await validateCartStock(cart.items);

    const { taxRate, deliveryFee } = await getActivePricingSettings();
    const totals = computeCartTotals(cart.items, taxRate, deliveryFee);

    if (totals.total <= 0) {
      throw new OrderError("Order total must be greater than zero");
    }

    const orderItems = cart.items.map((item) => ({
      product: item.product,
      name: item.name,
      quantity: item.quantity,
      price: item.price,
    }));

    const [order] = await Order.create(
      [
        {
          user: user._id,
          customerDetails: {
            customerName: user.customerName,
            phoneNumber: user.phoneNumber,
            address: user.address,
            email: user.email,
          },
          orderItems,
          subtotal: totals.subtotal,
          tax: totals.tax,
          deliveryFee: totals.deliveryFee,
          total: totals.total,
          paymentMethod,
          orderStatus: "pending",
          stockDeducted: false,
        },
      ],
      { session },
    );

    // Wallet transactions are recorded when admin approves the order (processing)

    cart.items = [];
    cart.subtotal = 0;
    cart.tax = 0;
    cart.deliveryFee = 0;
    cart.total = 0;
    await cart.save({ session });

    await session.commitTransaction();

    return order;
  } catch (error) {
    await session.abortTransaction();

    if (error instanceof WalletError || error instanceof OrderError) {
      throw error;
    }

    throw new OrderError(error.message || "Failed to create order", 500);
  } finally {
    session.endSession();
  }
}

const ALLOWED_STATUS_TRANSITIONS = {
  pending: ["processing", "cancelled"],
  processing: ["shipped", "cancelled"],
  shipped: ["delivered", "cancelled"],
  delivered: [],
  cancelled: [],
};

const applyDeliveredCompletion = async ({ order, adminUserId, session }) => {
  if (order.stockDeducted && order.userWalletCreated) {
    return;
  }

  if (!order.stockDeducted) {
    await deductOrderStock(order.orderItems, session);
    order.stockDeducted = true;
  }

  if (!order.userWalletCreated) {
    await recordOrderTransactions(
      {
        customerId: order.user,
        orderId: order._id,
        amount: order.total,
        performedById: adminUserId,
      },
      session,
    );

    order.userWalletCreated = true;
  }
};

export async function updateOrderStatusByAdmin({
  orderId,
  nextStatus,
  adminUserId,
}) {
  const session = await mongoose.startSession();

  try {
    session.startTransaction();

    const order = await Order.findById(orderId).session(session);

    if (!order) {
      throw new OrderError("Order not found", 404);
    }

    if (nextStatus === order.orderStatus) {
      await session.commitTransaction();
      return order;
    }

    const allowed = ALLOWED_STATUS_TRANSITIONS[order.orderStatus] || [];

    if (!allowed.includes(nextStatus)) {
      throw new OrderError(
        `Cannot change order status from "${order.orderStatus}" to "${nextStatus}"`,
      );
    }

    if (nextStatus === "processing") {
      if (order.orderStatus !== "pending") {
        throw new OrderError("Only pending orders can be approved");
      }
    }

    if (nextStatus === "delivered") {
      await applyDeliveredCompletion({
        order,
        adminUserId,
        session,
      });
    }

    if (nextStatus === "cancelled") {
      if (order.orderStatus !== "delivered" && order.stockDeducted) {
        await restoreOrderStock(order.orderItems, session);
        order.stockDeducted = false;
      }
    }

    order.orderStatus = nextStatus;
    await order.save({ session });

    await session.commitTransaction();

    return order;
  } catch (error) {
    await session.abortTransaction();

    if (error instanceof WalletError || error instanceof OrderError) {
      throw error;
    }

    throw new OrderError(error.message || "Failed to update order status", 500);
  } finally {
    session.endSession();
  }
}
