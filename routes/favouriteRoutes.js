import express from "express";
import { protect } from "../middleware/authMiddleware.js";
import {
  getMyFavourites,
  addFavourite,
  removeFavourite,
} from "../controllers/favouriteController.js";

const router = express.Router();

router.use(protect);

router.get("/", getMyFavourites);
router.post("/:productId", addFavourite);
router.delete("/:productId", removeFavourite);

export default router;
