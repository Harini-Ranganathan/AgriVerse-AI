
const mongoose = require("mongoose");

const rentalOrderSchema = new mongoose.Schema(
  {
    equipment: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "RentalEquipment",
      required: true,
      index: true,
      immutable: true,
    },

    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
      immutable: true,
    },

    renter: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
      immutable: true,
    },

    equipmentName: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200,
    },

    renterName: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
    },

    phone: {
      type: String,
      required: true,
      trim: true,
      maxlength: 30,
      select: false,
    },

    deliveryAddress: {
      type: String,
      required: true,
      trim: true,
      maxlength: 1000,
      select: false,
    },

    startDate: {
      type: Date,
      required: true,
    },

    endDate: {
      type: Date,
      required: true,
      validate: {
        validator(value) {
          return (
            !this.startDate ||
            value > this.startDate
          );
        },
        message: "End date must be after start date.",
      },
    },

    rentAmount: {
      type: Number,
      required: true,
      min: 0,
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
    },

    rentalUnits: {
      type: Number,
      required: true,
      min: 1,
    },

    totalPrice: {
      type: Number,
      required: true,
      min: 0,
    },

    status: {
      type: String,
      enum: [
        "Requested",
        "Confirmed",
        "Active",
        "Completed",
        "Rejected",
        "Cancelled",
      ],
      default: "Requested",
      index: true,
    },

    paymentStatus: {
      type: String,
      enum: [
        "Pending",
        "Paid",
        "Refunded",
      ],
      default: "Pending",
    },

    paymentReference: {
      type: String,
      trim: true,
      maxlength: 200,
      select: false,
      default: "",
    },

    renterMessage: {
      type: String,
      trim: true,
      maxlength: 2000,
      default: "",
    },
  },
  {
    timestamps: true,
  }
);

rentalOrderSchema.index({
  renter: 1,
  createdAt: -1,
});

rentalOrderSchema.index({
  owner: 1,
  createdAt: -1,
});

rentalOrderSchema.index({
  equipment: 1,
  status: 1,
  startDate: 1,
  endDate: 1,
});

// Do not allow the equipment owner to rent
// their own equipment.
rentalOrderSchema.pre("validate", function () {
  if (
    this.owner &&
    this.renter &&
    String(this.owner) === String(this.renter)
  ) {
    throw new Error("You cannot rent your own equipment.");
  }
});

module.exports = mongoose.model(
  "RentalOrder",
  rentalOrderSchema
);
