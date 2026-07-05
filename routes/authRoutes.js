import express from "express";
import {
  registerUser,
  loginUser,
  loginAdmin,
  logoutUser,
  getUserProfile,
  updateUserProfile,
  deleteUserAccount,
} from "../controllers/authController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/register", registerUser);
router.post("/login", loginUser);
router.post("/admin/login", loginAdmin);
router.post("/logout", protect, logoutUser);
router
  .route("/profile")
  .get(protect, getUserProfile)
  .put(protect, updateUserProfile)
  .delete(protect, deleteUserAccount);

export default router;
