import mongoose from "mongoose";

const userWalletTransactionSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    order: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Order",
      required: false,
      index: true,
    },
    amount: {
      type: Number,
      required: true,
      min: 0.01,
    },
    type: {
      type: String,
      enum: ["DEBIT", "CREDIT"],
      required: true,
    },
    category: {
      type: String,
      trim: true,
    },
    description: {
      type: String,
      required: true,
      trim: true,
    },
  },
  {
    timestamps: true,
  },
);

const UserWalletTransaction = mongoose.model(
  "UserWalletTransaction",
  userWalletTransactionSchema,
);

export default UserWalletTransaction;
