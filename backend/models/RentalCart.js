
const mongoose = require("mongoose");

const rentalCartItemSchema = new mongoose.Schema(
  {
    equipment: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "RentalEquipment",
      required: true,
    },

    addedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: false }
);

const rentalCartSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
      index: true,
    },

    items: {
      type: [rentalCartItemSchema],
      default: [],
    },
  },
  { timestamps: true }
);

rentalCartSchema.index({ user: 1 }, { unique: true });

module.exports =
  mongoose.models.RentalCart ||
  mongoose.model("RentalCart", rentalCartSchema);
