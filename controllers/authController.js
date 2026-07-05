import User from "../models/User.js";
import Cart from "../models/Cart.js";
import { generateToken } from "../utils/generateToken.js";
import { sendSuccess, sendError } from "../utils/responseHandler.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import {
  validateRegisterInput,
  validateLoginInput,
  validateUpdateProfileInput,
} from "../utils/validators.js";
import { welcomeTemplate } from "../templates/welcomeTemplate.js";
import { ensureWalletForUser } from "../services/walletService.js";

const formatUserResponse = (user) => ({
  _id: user._id,
  customerName: user.customerName,
  phoneNumber: user.phoneNumber,
  address: user.address,
  email: user.email,
  role: user.role,
  createdAt: user.createdAt,
  updatedAt: user.updatedAt,
});

export const registerUser = asyncHandler(async (req, res) => {
  const validation = validateRegisterInput(req.body);

  if (!validation.isValid) {
    return sendError(res, 400, "Validation failed", validation.errors);
  }

  const { customerName, phoneNumber, address, email, password } = req.body;

  const existingUser = await User.findOne({ email: email.toLowerCase() });

  if (existingUser) {
    return sendError(res, 400, "User with this email already exists");
  }

  const userData = {
    customerName,
    phoneNumber,
    address,
    email,
    password,
    role: "customer",
  };

  const user = await User.create(userData);
  await ensureWalletForUser(user._id);

  const token = generateToken(user._id);
  const welcome = welcomeTemplate(user.customerName);

  sendSuccess(res, 201, "User registered successfully", {
    user: formatUserResponse(user),
    token,
    welcome,
  });
});

export const loginUser = asyncHandler(async (req, res) => {
  const validation = validateLoginInput(req.body);

  if (!validation.isValid) {
    return sendError(res, 400, "Validation failed", validation.errors);
  }

  const { email, password } = req.body;

  const user = await User.findOne({ email: email.toLowerCase() }).select(
    "+password",
  );

  if (!user || !(await user.matchPassword(password))) {
    return sendError(res, 401, "Invalid email or password");
  }

  await ensureWalletForUser(user._id);

  const token = generateToken(user._id);

  sendSuccess(res, 200, "Login successful", {
    user: formatUserResponse(user),
    token,
  });
});

export const loginAdmin = asyncHandler(async (req, res) => {
  const validation = validateLoginInput(req.body);

  if (!validation.isValid) {
    return sendError(res, 400, "Validation failed", validation.errors);
  }

  const { email, password } = req.body;

  const user = await User.findOne({ email: email.toLowerCase() }).select(
    "+password",
  );

  if (!user || !(await user.matchPassword(password))) {
    return sendError(res, 401, "Invalid email or password");
  }

  if (user.role !== "admin") {
    return sendError(res, 403, "Admin access only");
  }

  await ensureWalletForUser(user._id);

  const token = generateToken(user._id);

  sendSuccess(res, 200, "Admin login successful", {
    user: formatUserResponse(user),
    token,
  });
});

export const logoutUser = asyncHandler(async (req, res) => {
  sendSuccess(
    res,
    200,
    "Logout successful. Please remove the token from the client.",
  );
});

export const getUserProfile = asyncHandler(async (req, res) => {
  sendSuccess(res, 200, "Profile retrieved successfully", {
    user: formatUserResponse(req.user),
  });
});

export const updateUserProfile = asyncHandler(async (req, res) => {
  const validation = validateUpdateProfileInput(req.body);

  if (!validation.isValid) {
    return sendError(res, 400, "Validation failed", validation.errors);
  }

  const user = await User.findById(req.user._id).select("+password");

  if (!user) {
    return sendError(res, 404, "User not found");
  }

  const { customerName, phoneNumber, address, password } = req.body;

  if (customerName) user.customerName = customerName;
  if (phoneNumber) user.phoneNumber = phoneNumber;
  if (address) user.address = address;
  if (password) user.password = password;

  const updatedUser = await user.save();

  sendSuccess(res, 200, "Profile updated successfully", {
    user: formatUserResponse(updatedUser),
    token: generateToken(updatedUser._id),
  });
});

export const deleteUserAccount = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);

  if (!user) {
    return sendError(res, 404, "User not found");
  }

  await Cart.deleteOne({ user: user._id });
  await user.deleteOne();

  sendSuccess(res, 200, "Account deleted successfully");
});
