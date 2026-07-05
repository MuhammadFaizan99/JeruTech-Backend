import mongoose from "mongoose";

const amountSchema = new mongoose.Schema(
  {
    DELIVERY_FEE: {
      type: Number,
      required: true,
      min: 0,
      default: 0,
    },
    TAX_RATE: {
      type: Number,
      required: true,
      min: 0,
      default: 0,
    },
  },
  {
    timestamps: true,
  },
);

const Amount = mongoose.model("Amount", amountSchema);

export default Amount;
