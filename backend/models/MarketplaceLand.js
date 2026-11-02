
const mongoose = require("mongoose");

const buyerRequestSchema = new mongoose.Schema(
  {
    id: Number,
    buyerUsername: String,
    buyer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    buyerName: String,
    buyerPhone: String,
    buyerMessage: String,
    read: {
      type: Boolean,
      default: false,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: false }
);

const schema = new mongoose.Schema(
  {
    seller: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      index: true,
    },
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      index: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      index: true,
    },
    title: String,
    location: String,
    city: String,
    state: String,
    area: String,
    price: String,
    water: String,
    soil: String,
    description: String,
    sellerName: String,
    sellerPhone: String,
    sellerUsername: String,
    landType: String,
    irrigationType: String,
    previousCrops: String,
    roadAccess: String,
    electricity: String,
    image: String,
    images: [String],
    isPublished: {
      type: Boolean,
      default: true,
    },
    buyerRequests: {
      type: [buyerRequestSchema],
      default: [],
    },
    unreadBuyerCount: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

module.exports =
  mongoose.models.MarketplaceLand ||
  mongoose.model("MarketplaceLand", schema);
