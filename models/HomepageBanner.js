import mongoose from "mongoose";

const homepageBannerSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    subtitle: {
      type: String,
      trim: true,
      default: "",
    },
    description: {
      type: String,
      required: true,
      trim: true,
    },
    ctaText: {
      type: String,
      default: "Shop Now",
    },
    ctaLink: {
      type: String,
      required: true,
    },
    category: {
      type: String,
      required: true,
      trim: true,
    },
    image: {
      type: String,
      required: true,
    },
    badge: {
      type: String,
      default: "Featured",
    },
    accent: {
      type: String,
      enum: ["cyan", "blue", "purple", "rose", "amber", "emerald"],
      default: "cyan",
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    order: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true },
);

const HomepageBanner = mongoose.model("HomepageBanner", homepageBannerSchema);

export default HomepageBanner;
