import express from "express";
import authRoutes from "./authRoutes.js";
import productRoutes from "./productRoutes.js";
import cartRoutes from "./cartRoutes.js";
import orderRoutes from "./orderRoutes.js";
import blogRoutes from "./blogRoutes.js";
import amountRoutes from "./amountRoutes.js";
import walletRoutes from "./walletRoutes.js";
import favouriteRoutes from "./favouriteRoutes.js";
import newsletterRoutes from "./newsletterRoutes.js";
import homepageBannerRoutes from "./homepageBannerRoutes.js";

const router = express.Router();

router.use("/auth", authRoutes);
router.use("/products", productRoutes);
router.use("/cart", cartRoutes);
router.use("/orders", orderRoutes);
router.use("/blogs", blogRoutes);
router.use("/amount", amountRoutes);
router.use("/wallet", walletRoutes);
router.use("/favourites", favouriteRoutes);
router.use("/newsletter", newsletterRoutes);
router.use("/homepage-banners", homepageBannerRoutes);

export default router;
