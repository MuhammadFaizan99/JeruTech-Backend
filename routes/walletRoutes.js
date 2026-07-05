import express from "express";
import {
  getMyWallet,
  getMyWalletTransactions,
  fundWallet,
  getUserWalletByAdmin,
  getAllWalletsHandler,
  ensureWallet,
} from "../controllers/walletController.js";
import { protect, admin } from "../middleware/authMiddleware.js";

const router = express.Router();

router.use(protect);

router.get("/me", getMyWallet);
router.get("/me/transactions", getMyWalletTransactions);
router.post("/ensure", ensureWallet);

router.get("/", admin, getAllWalletsHandler);
router.get("/users/:userId", admin, getUserWalletByAdmin);
router.post("/fund", admin, fundWallet);

export default router;
