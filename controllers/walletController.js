import User from "../models/User.js";
import UserWalletTransaction from "../models/UserWalletTransaction.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { sendSuccess, sendError } from "../utils/responseHandler.js";
import { buildPaginatedResponse, parsePagination } from "../utils/pagination.js";
import {
  WalletError,
  ensureWalletForUser,
  formatWallet,
  formatWalletTransaction,
  fundUserWallet,
  getUserWalletTransactions,
  getAllWallets,
  getOrCreateWallet,
} from "../services/walletService.js";

export const getMyWallet = asyncHandler(async (req, res) => {
  const wallet = await getOrCreateWallet(req.user._id);

  sendSuccess(res, 200, "Wallet retrieved successfully", {
    wallet: formatWallet(wallet, req.user),
  });
});

export const getMyWalletTransactions = asyncHandler(async (req, res) => {
  const { page, limit, skip } = parsePagination(req.query);
  const totalItems = await UserWalletTransaction.countDocuments({
    user: req.user._id,
  });
  const maxPage = Math.max(1, Math.ceil(totalItems / limit));
  const safePage = Math.min(page, maxPage);
  const safeSkip = (safePage - 1) * limit;
  const transactions = await UserWalletTransaction.find({ user: req.user._id })
    .sort({ createdAt: -1 })
    .skip(safeSkip)
    .limit(limit);
  const payload = buildPaginatedResponse({
    data: transactions.map(formatWalletTransaction),
    page: safePage,
    limit,
    totalItems,
    extra: { transactions: transactions.map(formatWalletTransaction) },
  });

  sendSuccess(res, 200, "Wallet transactions retrieved successfully", payload);
});

export const fundWallet = asyncHandler(async (req, res) => {
  const { userId, amount, description } = req.body;

  if (!userId) {
    return sendError(res, 400, "User ID is required");
  }

  const parsedAmount = Number(amount);

  if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) {
    return sendError(res, 400, "Amount must be greater than zero");
  }

  try {
    const wallet = await fundUserWallet({
      targetUserId: userId,
      amount: parsedAmount,
      performedById: req.user._id,
      description,
    });

    const targetUser = await User.findById(userId);

    sendSuccess(res, 200, "Wallet funded successfully", {
      wallet: formatWallet(wallet, targetUser),
    });
  } catch (error) {
    if (error instanceof WalletError) {
      return sendError(res, error.statusCode || 400, error.message);
    }

    throw error;
  }
});

export const getUserWalletByAdmin = asyncHandler(async (req, res) => {
  const targetUser = await User.findById(req.params.userId);

  if (!targetUser) {
    return sendError(res, 404, "User not found");
  }

  const wallet = await getOrCreateWallet(targetUser._id);

  sendSuccess(res, 200, "Wallet retrieved successfully", {
    wallet: formatWallet(wallet, targetUser),
  });
});

export const getAllWalletsHandler = asyncHandler(async (req, res) => {
  const wallets = await getAllWallets();

  sendSuccess(res, 200, "Wallets retrieved successfully", {
    wallets: wallets.map((wallet) => formatWallet(wallet, wallet.user)),
  });
});

export const ensureWallet = asyncHandler(async (req, res) => {
  const wallet = await ensureWalletForUser(req.user._id);

  sendSuccess(res, 200, "Wallet ready", {
    wallet: formatWallet(wallet, req.user),
  });
});
