import mongoose from "mongoose";
import User from "../models/User.js";
import UserWalletTransaction from "../models/UserWalletTransaction.js";

export class WalletError extends Error {
  constructor(message, statusCode = 400) {
    super(message);
    this.name = "WalletError";
    this.statusCode = statusCode;
  }
}

export async function getAdminUser(session = null) {
  const query = User.findOne({ role: "admin" });

  if (session) {
    query.session(session);
  }

  const admin = await query;

  if (!admin) {
    throw new WalletError("No admin account is configured", 500);
  }

  return admin;
}

export async function getLatestUserBalance(userId, session = null) {
  // No running balance stored — compute balance by aggregating transactions
  const aggregation = UserWalletTransaction.aggregate([
    { $match: { user: new mongoose.Types.ObjectId(userId) } },
    {
      $group: {
        _id: null,
        balance: {
          $sum: {
            $cond: [
              { $eq: ["$type", "CREDIT"] },
              "$amount",
              { $multiply: [-1, "$amount"] },
            ],
          },
        },
      },
    },
  ]);

  if (session) {
    aggregation.session(session);
  }

  const result = await aggregation;
  return result?.[0]?.balance ?? 0;
}

export async function getWalletForUser(userId, session = null) {
  const balance = await getLatestUserBalance(userId, session);
  const query = UserWalletTransaction.findOne({ user: userId }).sort({
    createdAt: -1,
    _id: -1,
  });

  if (session) {
    query.session(session);
  }

  const latestTransaction = await query;

  return {
    _id: userId,
    userId: userId.toString?.() || String(userId),
    balance,
    updatedAt: latestTransaction?.createdAt || null,
    createdAt: latestTransaction?.createdAt || null,
  };
}

export async function getOrCreateWallet(userId, session = null) {
  return getWalletForUser(userId, session);
}

export async function getUserWalletTransactions(userId, session = null) {
  const query = UserWalletTransaction.find({ user: userId }).sort({
    createdAt: -1,
  });

  if (session) {
    query.session(session);
  }

  return query;
}

export async function getAllWallets(session = null) {
  // Compute balances by summing transactions per user
  const aggregation = UserWalletTransaction.aggregate([
    { $sort: { createdAt: 1, _id: 1 } },
    {
      $group: {
        _id: "$user",
        balance: {
          $sum: {
            $cond: [
              { $eq: ["$type", "CREDIT"] },
              "$amount",
              { $multiply: [-1, "$amount"] },
            ],
          },
        },
        updatedAt: { $last: "$createdAt" },
      },
    },
    {
      $lookup: {
        from: "users",
        localField: "_id",
        foreignField: "_id",
        as: "user",
      },
    },
    { $unwind: "$user" },
    {
      $project: {
        _id: 0,
        userId: "$_id",
        balance: 1,
        updatedAt: 1,
        user: {
          _id: "$user._id",
          customerName: "$user.customerName",
          email: "$user.email",
          role: "$user.role",
        },
      },
    },
    { $sort: { updatedAt: -1 } },
  ]);

  if (session) {
    aggregation.session(session);
  }

  const wallets = await aggregation;

  return wallets.map((wallet) => ({
    _id: wallet.userId,
    userId: wallet.userId?.toString?.() || String(wallet.userId),
    balance: wallet.balance,
    updatedAt: wallet.updatedAt,
    user: wallet.user,
  }));
}

async function createWalletTransaction(
  {
    userId,
    orderId = null,
    amount,
    type,
    description,
    category = null,
    counterpartyId = null,
    performedById = null,
  },
  session = null,
) {
  if (amount <= 0) {
    throw new WalletError("Transaction amount must be greater than zero");
  }

  const payload = {
    user: userId,
    order: orderId,
    amount,
    type,
    category,
    description,
    counterparty: counterpartyId,
    performedBy: performedById,
  };

  if (session) {
    return UserWalletTransaction.create([payload], { session }).then(
      (records) => records[0],
    );
  }

  return UserWalletTransaction.create(payload);
}

export async function recordOrderTransactions(
  { customerId, orderId, amount, performedById = null },
  session = null,
) {
  const admin = await getAdminUser(session);
  const orderLabel = `Order #${orderId.toString()}`;

  await createWalletTransaction(
    {
      userId: customerId,
      orderId,
      amount,
      type: "DEBIT",
      category: "order_payment",
      description: `Order payment recorded for ${orderLabel}`,
      counterpartyId: admin._id,
      performedById,
    },
    session,
  );

  await createWalletTransaction(
    {
      userId: admin._id,
      orderId,
      amount,
      type: "CREDIT",
      category: "order_payment",
      description: `Order payment recorded for ${orderLabel}`,
      counterpartyId: customerId,
      performedById,
    },
    session,
  );
}

export async function fundUserWallet(
  { targetUserId, amount, performedById, description },
  session = null,
) {
  const targetUser = session
    ? await User.findById(targetUserId).session(session)
    : await User.findById(targetUserId);

  if (!targetUser) {
    throw new WalletError("User not found", 404);
  }

  const transaction = await createWalletTransaction(
    {
      userId: targetUserId,
      amount,
      type: "CREDIT",
      category: "admin_funding",
      description:
        description?.trim() ||
        `Wallet funded by admin (${targetUser.customerName})`,
      performedById,
    },
    session,
  );

  const balance = await getLatestUserBalance(targetUserId, session);

  return {
    _id: targetUserId,
    userId: targetUserId.toString?.() || String(targetUserId),
    balance,
    updatedAt: transaction.createdAt,
    createdAt: transaction.createdAt,
  };
}

export function formatWallet(wallet, user = null) {
  return {
    _id: wallet._id,
    userId: wallet.userId,
    balance: wallet.balance,
    user: user
      ? {
          _id: user._id,
          customerName: user.customerName,
          email: user.email,
          role: user.role,
        }
      : undefined,
    updatedAt: wallet.updatedAt,
    createdAt: wallet.createdAt,
  };
}

export function formatWalletTransaction(transaction) {
  return {
    _id: transaction._id,
    type: transaction.type.toLowerCase(),
    amount: transaction.amount,
    // balance is computed from transaction history on demand
    category: transaction.category,
    description: transaction.description,
    orderId: transaction.order?.toString?.() || null,
    counterpartyId: transaction.counterparty?.toString?.() || null,
    createdAt: transaction.createdAt,
  };
}

export async function ensureWalletForUser(userId) {
  return getOrCreateWallet(userId);
}
