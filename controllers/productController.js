import Product from "../models/Product.js";
import {
  buildPaginatedResponse,
  buildSort,
  parsePagination,
} from "../utils/pagination.js";

const parseBooleanFilter = (value) => {
  if (typeof value === "boolean") {
    return value;
  }

  if (typeof value === "string") {
    const normalized = value.trim().toLowerCase();

    if (["true", "1", "yes", "on"].includes(normalized)) {
      return true;
    }

    if (["false", "0", "no", "off"].includes(normalized)) {
      return false;
    }
  }

  return undefined;
};

const buildProductMeta = (products = []) => {
  const companies = [
    ...new Set(
      products
        .map(
          (product) =>
            product.company || product.name?.split(" ")[0] || "JeruTech",
        )
        .filter((company) => typeof company === "string" && company.trim())
        .map((company) => company.trim()),
    ),
  ].sort((left, right) => left.localeCompare(right));

  return { companies };
};

export const getProducts = async (req, res) => {
  try {
    const { category, company, discount, isDiscounted, search } = req.query;
    const {
      page,
      limit,
      skip,
      search: normalizedSearch,
      sort,
    } = parsePagination(req.query);

    const query = {};

    if (category && category !== "All") {
      query.category = category;
    }

    if (company && company !== "All") {
      query.company = company;
    }

    const discountedFilter = parseBooleanFilter(discount ?? isDiscounted);

    if (discountedFilter === true) {
      query.discount = { $gt: 0 };
    } else if (discountedFilter === false) {
      query.discount = { $lte: 0 };
    }

    if (normalizedSearch) {
      query.$or = [
        { name: { $regex: normalizedSearch, $options: "i" } },
        { company: { $regex: normalizedSearch, $options: "i" } },
        { category: { $regex: normalizedSearch, $options: "i" } },
        { description: { $regex: normalizedSearch, $options: "i" } },
      ];
    }

    const totalItems = await Product.countDocuments(query);
    const maxPage = Math.max(1, Math.ceil(totalItems / limit));
    const safePage = Math.min(page, maxPage);
    const safeSkip = (safePage - 1) * limit;
    const allMatchingProducts = await Product.find(query)
      .sort(buildSort(sort))
      .lean();
    const { companies } = buildProductMeta(allMatchingProducts);
    const products = await Product.find(query)
      .sort(buildSort(sort))
      .skip(safeSkip)
      .limit(limit)
      .lean();

    const payload = buildPaginatedResponse({
      data: products,
      page: safePage,
      limit,
      totalItems,
    });

    res.status(200).json({
      success: true,
      message: "Products retrieved successfully",
      count: products.length,
      categories: [
        "All",
        "Mobile Phones",
        "Laptops",
        "Headphones",
        "Smart Watches",
        "Chargers",
        "Accessories",
        "Other Gadgets",
        "Motorcycle",
        "Electrical & Electronics",
        "3D Printing",
        "Discount",
        "No Discount",
      ],
      companies,
      ...payload,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch products",
      error: error.message,
    });
  }
};

export const getProductById = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    res.status(200).json({
      success: true,
      product,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch product",
      error: error.message,
    });
  }
};

export const createProduct = async (req, res) => {
  try {
    const product = await Product.create(req.body);

    res.status(201).json({
      success: true,
      message: "Product created successfully",
      product,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: "Failed to create product",
      error: error.message,
    });
  }
};

export const updateProduct = async (req, res) => {
  try {
    const product = await Product.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Product updated successfully",
      product,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: "Failed to update product",
      error: error.message,
    });
  }
};

export const deleteProduct = async (req, res) => {
  try {
    const product = await Product.findByIdAndDelete(req.params.id);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Product deleted successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to delete product",
      error: error.message,
    });
  }
};
