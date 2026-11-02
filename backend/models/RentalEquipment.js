
const mongoose = require("mongoose");

const rentalEquipmentSchema = new mongoose.Schema(
  {
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
      immutable: true,
    },

    sellerUsername: {
      type: String,
      trim: true,
      maxlength: 50,
    },

    sellerName: {
      type: String,
      trim: true,
      maxlength: 100,
    },

    name: {
      type: String,
      required: true,
      trim: true,
      minlength: 2,
      maxlength: 200,
    },

    category: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
      default: "Tractor",
    },

    rentAmount: {
      type: Number,
      required: true,
      min: 0,
      max: 1000000000,
    },

    rentType: {
      type: String,
      required: true,
      enum: [
        "Per Hour",
        "Per Day",
        "Per Week",
        "Per Month",
      ],
      default: "Per Day",
    },

    address: {
      type: String,
      trim: true,
      maxlength: 500,
      default: "",
    },

    district: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200,
    },

    state: {
      type: String,
      trim: true,
      maxlength: 200,
      default: "",
    },

    description: {
      type: String,
      trim: true,
      maxlength: 5000,
      default: "",
    },

    image: {
      type: String,
      trim: true,
      maxlength: 2048,
      default: "",
      validate: {
        validator(value) {
          return !value || /^https:\/\/[^\s]+$/i.test(value);
        },
        message: "Equipment image must use a secure HTTPS URL",
      },
    },

    availabilityStatus: {
      type: String,
      enum: [
        "Available",
        "Unavailable",
      ],
      default: "Available",
      index: true,
    },

    isPublished: {
      type: Boolean,
      default: true,
      index: true,
    },

    // Booked dates will be stored in RentalOrder.
    // Availability must later be checked against
    // confirmed bookings, not this status alone.
  },
  {
    timestamps: true,
  }
);

rentalEquipmentSchema.index({
  owner: 1,
  createdAt: -1,
});

rentalEquipmentSchema.index({
  isPublished: 1,
  availabilityStatus: 1,
  createdAt: -1,
});

module.exports = mongoose.model(
  "RentalEquipment",
  rentalEquipmentSchema
);
