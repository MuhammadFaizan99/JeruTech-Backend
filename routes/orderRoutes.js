import express from "express";
import {
  createOrder,
  getOrders,
  getPurchasedItems,
  getOrderById,
  updateOrderStatus,
  approveOrder,
} from "../controllers/orderController.js";
import { protect, customerOnly, admin } from "../middleware/authMiddleware.js";

const router = express.Router();

router.use(protect);

router.post("/", customerOnly, createOrder);
router.get("/", getOrders);
router.get("/purchased-items", customerOnly, getPurchasedItems);
router.get("/:id", getOrderById);
router.put("/:id/approve", admin, approveOrder);
router.put("/:id/status", admin, updateOrderStatus);

export default router;
