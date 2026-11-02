
const mongoose = require("mongoose");

const buyerRequestSchema = new mongoose.Schema(
  {
    id: Number,
    buyer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    buyerName: String,
    buyerPhone: String,
    buyerQuantity: String,
    buyerMessage: String,
    read: {
      type: Boolean,
      default: false,
    },
    confirmedAt: Date,
    shippedAt: Date,
    tracking: String,
  },
  {
    _id: false,
    timestamps: true,
    strict: false,
  }
);

const productListingSchema = new mongoose.Schema(
  {
    seller: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      immutable: true,
      index: true,
    },

    sellerType: {
      type: String,
      enum: ["farmer", "buyer"],
      required: true,
    },

    sellerName: {
      type: String,
      trim: true,
      required: true,
    },

    productName: {
      type: String,
      required: true,
      trim: true,
    },

    category: {
      type: String,
      trim: true,
      default: "Crop",
    },

    quantity: {
      type: String,
      required: true,
      trim: true,
    },

    unit: {
      type: String,
      trim: true,
      default: "kg",
    },

    price: {
      type: Number,
      required: true,
      min: 0,
    },

    location: {
      type: String,
      trim: true,
      default: "",
    },

    district: {
      type: String,
      trim: true,
      default: "",
    },

    state: {
      type: String,
      trim: true,
      default: "",
    },

    phone: {
      type: String,
      trim: true,
      default: "",
    },

    description: {
      type: String,
      trim: true,
      default: "",
    },

    image: {
      type: String,
      trim: true,
      default: "",
    },

    // The owner controls marketplace visibility.
    isPublished: {
      type: Boolean,
      default: true,
      index: true,
    },

    buyerRequests: {
      type: [buyerRequestSchema],
      default: [],
      select: false,
    },

    confirmedOrders: {
      type: [buyerRequestSchema],
      default: [],
      select: false,
    },

    rejectedRequests: {
      type: [buyerRequestSchema],
      default: [],
      select: false,
    },

    shippedOrders: {
      type: [buyerRequestSchema],
      default: [],
      select: false,
    },

    unreadBuyerCount: {
      type: Number,
      default: 0,
      min: 0,
      select: false,
    },
  },
  {
    timestamps: true,
  }
);

productListingSchema.index({
  seller: 1,
  createdAt: -1,
});

productListingSchema.index({
  isPublished: 1,
  createdAt: -1,
});

module.exports = mongoose.model(
  "ProductListing",
  productListingSchema
);
