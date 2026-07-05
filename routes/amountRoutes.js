import express from "express";
import { protect, admin } from "../middleware/authMiddleware.js";
import {
  getAmount,
  createAmount,
  updateAmount,
} from "../controllers/amountController.js";

const router = express.Router();

router.get("/", protect, getAmount);
router.post("/", protect, admin, createAmount);
router.put("/:id", protect, admin, updateAmount);

export default router;
