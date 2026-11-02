
const mongoose = require("mongoose");

const orderSchema = new mongoose.Schema(
  {
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ProductListing",
      required: true,
      immutable: true,
      index: true,
    },

    // The account that purchased the product.
    // Can have either "farmer" or "buyer" role.
    buyer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      immutable: true,
      index: true,
    },

    // Existing field name retained for compatibility.
    // This is the product SELLER, regardless of role.
    farmer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      immutable: true,
      index: true,
    },

    productName: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200,
    },

    farmerName: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
    },

    buyerName: {
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

    quantity: {
      type: String,
      required: true,
      trim: true,
    },

    totalPrice: {
      type: Number,
      required: true,
      min: 0,
    },

    deliveryAddress: {
      type: String,
      required: true,
      trim: true,
      maxlength: 1000,
      select: false,
    },

    status: {
      type: String,
      enum: [
        "Order Placed",
        "Confirmed",
        "Shipped",
        "Delivered",
      ],
      default: "Order Placed",
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

// Quickly retrieve purchases for either account type.
orderSchema.index({
  buyer: 1,
  createdAt: -1,
});

// Quickly retrieve sales for either account type.
orderSchema.index({
  farmer: 1,
  createdAt: -1,
});

// Retrieve orders associated with a product.
orderSchema.index({
  product: 1,
  createdAt: -1,
});

// Prevent users from buying their own products.
orderSchema.pre("validate", function () {
  if (
    this.buyer &&
    this.farmer &&
    String(this.buyer) === String(this.farmer)
  ) {
    throw new Error(
      "You cannot purchase your own product."
    );
  }
});

module.exports = mongoose.model("Order", orderSchema);
