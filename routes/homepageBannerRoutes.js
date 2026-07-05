import express from "express";
import {
  getHomepageBanners,
  createHomepageBanner,
  updateHomepageBanner,
  deleteHomepageBanner,
} from "../controllers/homepageBannerController.js";

const router = express.Router();

router.get("/", getHomepageBanners);
router.post("/", createHomepageBanner);
router.put("/:id", updateHomepageBanner);
router.delete("/:id", deleteHomepageBanner);

export default router;
