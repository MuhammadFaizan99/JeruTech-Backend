import Newsletter from "../models/Newsletter.js";
import { isValidEmail } from "../utils/validators.js";
import { sendSuccess, sendError } from "../utils/responseHandler.js";
import { asyncHandler } from "../utils/asyncHandler.js";

export const subscribeToNewsletter = asyncHandler(async (req, res) => {
  const email = req.body?.email?.trim().toLowerCase();

  if (!email) {
    return sendError(res, 400, "Please enter your email address");
  }

  if (!isValidEmail(email)) {
    return sendError(res, 400, "Please enter a valid email address");
  }

  const existing = await Newsletter.findOne({ email });

  if (existing) {
    if (existing.isSubscribed) {
      return sendError(res, 409, "This email is already subscribed");
    }

    existing.isSubscribed = true;
    await existing.save();
    return sendSuccess(res, 200, "Subscribed successfully");
  }

  await Newsletter.create({ email, isSubscribed: true });
  sendSuccess(res, 201, "Subscribed successfully");
});
