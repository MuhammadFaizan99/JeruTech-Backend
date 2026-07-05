import test from "node:test";
import assert from "node:assert/strict";
import HomepageBanner from "../models/HomepageBanner.js";

test("accepts a homepage banner with category-specific content", async () => {
  const banner = new HomepageBanner({
    title: "Mobile Phones",
    subtitle: "Flagship performance",
    description: "Upgrade to the latest mobile experience.",
    ctaText: "Shop Now",
    ctaLink: "/products?category=Mobile%20Phones",
    category: "Mobile Phones",
    image: "https://example.com/mobile-banner.jpg",
    badge: "New Arrival",
    accent: "cyan",
    isActive: true,
    order: 1,
  });

  await assert.doesNotReject(banner.validate());
});
