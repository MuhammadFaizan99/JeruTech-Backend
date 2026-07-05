import Amount from "../models/Amount.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { sendSuccess, sendError } from "../utils/responseHandler.js";

const formatAmount = (amount) => ({
  _id: amount._id,
  DELIVERY_FEE: amount.DELIVERY_FEE,
  TAX_RATE: amount.TAX_RATE,
  createdAt: amount.createdAt,
  updatedAt: amount.updatedAt,
});

export const getAmount = asyncHandler(async (req, res) => {
  const amounts = await Amount.find();

  if (!amounts || amounts.length === 0) {
    return sendError(res, 404, "Amount configuration not found");
  }

  const amount = amounts[0];

  sendSuccess(res, 200, "Amount configuration retrieved successfully", {
    amount: formatAmount(amount),
  });
});

export const createAmount = asyncHandler(async (req, res) => {
  const amounts = await Amount.find();

  if (amounts && amounts.length > 0) {
    return sendError(res, 400, "Amount configuration already exists");
  }

  const { DELIVERY_FEE, TAX_RATE } = req.body;

  if (DELIVERY_FEE === undefined || TAX_RATE === undefined) {
    return sendError(res, 400, "DELIVERY_FEE and TAX_RATE are required");
  }

  const amount = await Amount.create({
    DELIVERY_FEE: Number(DELIVERY_FEE),
    TAX_RATE: Number(TAX_RATE),
  });

  sendSuccess(res, 201, "Amount configuration created successfully", {
    amount: formatAmount(amount),
  });
});

export const updateAmount = asyncHandler(async (req, res) => {
  const amount = await Amount.findById(req.params.id);

  if (!amount) {
    return sendError(res, 404, "Amount configuration not found");
  }

  const { DELIVERY_FEE, TAX_RATE } = req.body;

  if (DELIVERY_FEE !== undefined) {
    amount.DELIVERY_FEE = Number(DELIVERY_FEE);
  }

  if (TAX_RATE !== undefined) {
    amount.TAX_RATE = Number(TAX_RATE);
  }

  await amount.save();

  sendSuccess(res, 200, "Amount configuration updated successfully", {
    amount: formatAmount(amount),
  });
});
