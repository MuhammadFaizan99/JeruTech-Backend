import mongoose from "mongoose";

const productSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    company: {
      type: String,
      required: [true, "Company is required"],
      trim: true,
    },
    category: {
      type: String,
      required: true,
      enum: [
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
      ],
    },
    price: {
      type: Number,
      required: true,
      min: 0,
    },
    isDiscounted: {
      type: Boolean,
      default: false,
    },
    discount: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },
    finalPrice: {
      type: Number,
      default: 0,
    },
    description: {
      type: String,
      required: true,
    },
    images: {
      type: [String],
      default: [],
    },
    specs: {
      type: Map,
      of: String,
      default: {},
    },
    stock: {
      type: Number,
      required: true,
      default: 0,
      min: 0,
    },
  },
  { timestamps: true },
);

productSchema.pre("save", function (next) {
  this.isDiscounted = this.discount > 0;

  this.finalPrice = this.isDiscounted
    ? this.price - (this.price * this.discount) / 100
    : this.price;

  next();
});

productSchema.pre("findOneAndUpdate", async function (next) {
  const update = this.getUpdate();

  const currentProduct = await this.model.findOne(this.getQuery());

  if (!currentProduct) {
    return next();
  }

  const price =
    update.price !== undefined ? update.price : currentProduct.price;

  const discount =
    update.discount !== undefined ? update.discount : currentProduct.discount;

  update.isDiscounted = discount > 0;

  update.finalPrice = update.isDiscounted
    ? price - (price * discount) / 100
    : price;

  this.setUpdate(update);

  next();
});

const Product = mongoose.model("Product", productSchema);

export default Product;
