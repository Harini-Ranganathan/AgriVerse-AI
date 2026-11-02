
const mongoose = require("mongoose");

const landSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      trim: true,
      maxlength: 200,
      default: "Untitled Land",
    },

    crop: {
      type: String,
      trim: true,
      maxlength: 200,
      default: "",
    },

    soilType: {
      type: String,
      trim: true,
      maxlength: 200,
      default: "",
    },

    area: {
      type: String,
      trim: true,
      maxlength: 100,
      default: "",
    },

    location: {
      type: String,
      trim: true,
      maxlength: 500,
      default: "",
    },

    latitude: {
      type: String,
      trim: true,
      maxlength: 100,
      default: "",
    },

    longitude: {
      type: String,
      trim: true,
      maxlength: 100,
      default: "",
    },

    irrigation: {
      type: String,
      trim: true,
      maxlength: 200,
      default: "",
    },

    sowingDate: {
      type: String,
      trim: true,
      default: "",
    },

    image: {
      type: String,
      default: "",
    },

    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Land", landSchema);
