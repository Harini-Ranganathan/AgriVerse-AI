
const mongoose = require("mongoose");

const schema = new mongoose.Schema(
  {
    buyer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
      index: true,
    },
    subscriptionExpiresAt: {
      type: Date,
      default: null,
    },
    unlockedLands: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "MarketplaceLand",
      },
    ],
  },
  { timestamps: true }
);

module.exports =
  mongoose.models.LandDemoAccess ||
  mongoose.model("LandDemoAccess", schema);
