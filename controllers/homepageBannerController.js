import HomepageBanner from "../models/HomepageBanner.js";

const defaultHomepageBanners = [
  {
    title: "Mobile Phones",
    subtitle: "Flagship phones with premium performance",
    description: "Shop modern devices built for speed, photography, and everyday convenience.",
    ctaText: "Shop Now",
    ctaLink: "/products?category=Mobile%20Phones",
    category: "Mobile Phones",
    image: "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=1400&h=900&fit=crop",
    badge: "New Arrival",
    accent: "cyan",
    isActive: true,
    order: 1,
  },
  {
    title: "Laptops",
    subtitle: "Fast laptops for work, study, and creativity",
    description: "Explore premium laptops with brilliant displays, long battery life, and smooth multitasking.",
    ctaText: "Shop Now",
    ctaLink: "/products?category=Laptops",
    category: "Laptops",
    image: "https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=1400&h=900&fit=crop",
    badge: "Power & Precision",
    accent: "blue",
    isActive: true,
    order: 2,
  },
  {
    title: "Motorcycle",
    subtitle: "Reliable gear for every journey",
    description: "Browse helmets, riding accessories, and gear built for smooth commutes and weekend adventures.",
    ctaText: "Shop Now",
    ctaLink: "/products?category=Motorcycle",
    category: "Motorcycle",
    image: "https://images.unsplash.com/photo-1558981806-ec527fa84c39?w=1400&h=900&fit=crop",
    badge: "Ride Ready",
    accent: "amber",
    isActive: true,
    order: 3,
  },
  {
    title: "Electrical & Electronics",
    subtitle: "Modern tools and devices for home and work",
    description: "Discover high-performance devices, power solutions, and intelligent tech for modern routines.",
    ctaText: "Shop Now",
    ctaLink: "/products?category=Electrical%20%26%20Electronics",
    category: "Electrical & Electronics",
    image: "https://images.unsplash.com/photo-1518770660439-4636190af475?w=1400&h=900&fit=crop",
    badge: "Smart Living",
    accent: "purple",
    isActive: true,
    order: 4,
  },
  {
    title: "3D Printing",
    subtitle: "Precision tools for creators and makers",
    description: "Browse printers, filaments, and accessories crafted for makers, designers, and innovators.",
    ctaText: "Shop Now",
    ctaLink: "/products?category=3D%20Printing",
    category: "3D Printing",
    image: "https://images.unsplash.com/photo-1581092160562-40aa08e78837?w=1400&h=900&fit=crop",
    badge: "Create & Build",
    accent: "emerald",
    isActive: true,
    order: 5,
  },
];

export const getHomepageBanners = async (req, res) => {
  try {
    const banners = await HomepageBanner.find({ isActive: true })
      .sort({ order: 1, createdAt: 1 })
      .lean();

    const payload = banners.length ? banners : defaultHomepageBanners;

    res.status(200).json({
      success: true,
      count: payload.length,
      data: payload,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch homepage banners",
      error: error.message,
    });
  }
};

export const createHomepageBanner = async (req, res) => {
  try {
    const banner = await HomepageBanner.create(req.body);

    res.status(201).json({
      success: true,
      message: "Homepage banner created successfully",
      data: banner,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: "Failed to create homepage banner",
      error: error.message,
    });
  }
};

export const updateHomepageBanner = async (req, res) => {
  try {
    const banner = await HomepageBanner.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    if (!banner) {
      return res.status(404).json({
        success: false,
        message: "Homepage banner not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Homepage banner updated successfully",
      data: banner,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: "Failed to update homepage banner",
      error: error.message,
    });
  }
};

export const deleteHomepageBanner = async (req, res) => {
  try {
    const banner = await HomepageBanner.findByIdAndDelete(req.params.id);

    if (!banner) {
      return res.status(404).json({
        success: false,
        message: "Homepage banner not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Homepage banner deleted successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to delete homepage banner",
      error: error.message,
    });
  }
};
