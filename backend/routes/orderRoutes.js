
const express = require("express");
const mongoose = require("mongoose");

const Order = require("../models/Order");
const ProductListing = require("../models/ProductListing");

const {
  authenticate,
  authorize,
} = require("../middleware/authMiddleware");

const router = express.Router();

router.use(authenticate);
router.use(authorize("farmer", "buyer"));

const ORDER_STEPS = [
  "Order Placed",
  "Confirmed",
  "Shipped",
  "Delivered",
];

function validId(value) {
  return mongoose.isValidObjectId(value);
}

function sameId(first, second) {
  return String(first || "") === String(second || "");
}

function handleError(res, error) {
  console.error("Product Order API:", error);

  if (
    error.name === "ValidationError" ||
    error.name === "CastError"
  ) {
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }

  return res.status(500).json({
    success: false,
    message: "Unable to process product order.",
  });
}

function getOrderType(order, userId) {
  if (sameId(order.buyer, userId)) {
    return "purchase";
  }

  if (sameId(order.farmer, userId)) {
    return "sale";
  }

  return null;
}

function safeOrder(order, userId, includeDelivery = false) {
  const data =
    typeof order.toObject === "function"
      ? order.toObject()
      : { ...order };

  const result = {
    _id: data._id,
    product: data.product,
    productName: data.productName,
    farmerName: data.farmerName,
    buyerName: data.buyerName,
    buyer: data.buyer,
    farmer: data.farmer,
    quantity: data.quantity,
    totalPrice: data.totalPrice,
    status: data.status,
    createdAt: data.createdAt,
    updatedAt: data.updatedAt,
    orderType: getOrderType(data, userId),
  };

  if (includeDelivery) {
    result.phone = data.phone;
    result.deliveryAddress = data.deliveryAddress;
  }

  return result;
}

// CREATE PRODUCT ORDER
// BOTH FARMERS AND BUYERS CAN PURCHASE
router.post("/", async (req, res) => {
  try {
    const {
      productId,
      buyerName,
      phone,
      quantity,
      deliveryAddress,
    } = req.body || {};

    if (!validId(productId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid product ID.",
      });
    }

    const name = String(buyerName || "").trim();
    const contact = String(phone || "").trim();
    const address = String(deliveryAddress || "").trim();

    const amount = Number(quantity);

    if (name.length < 2 || name.length > 100) {
      return res.status(400).json({
        success: false,
        message: "Enter a valid buyer name.",
      });
    }

    if (!/^[+0-9()\s-]{7,30}$/.test(contact)) {
      return res.status(400).json({
        success: false,
        message: "Enter a valid phone number.",
      });
    }

    if (address.length < 5 || address.length > 1000) {
      return res.status(400).json({
        success: false,
        message: "Enter a valid delivery address.",
      });
    }

    if (
      !Number.isSafeInteger(amount) ||
      amount < 1 ||
      amount > 100000
    ) {
      return res.status(400).json({
        success: false,
        message: "Enter a valid product quantity.",
      });
    }

    // Only products that are still published
    // may receive new checkout orders.
    //
    // $ne: false preserves compatibility with
    // older products that have no isPublished field.
    const product = await ProductListing.findOne({
      _id: productId,
      isPublished: { $ne: false },
    });

    if (!product) {
      const exists = await ProductListing.exists({
        _id: productId,
      });

      return res.status(exists ? 409 : 404).json({
        success: false,
        message: exists
          ? "This product is unpublished and cannot be ordered."
          : "Product not found.",
      });
    }

    if (!product.seller) {
      return res.status(409).json({
        success: false,
        message:
          "This product has no verified seller and cannot be ordered.",
      });
    }

    // Account role does not determine ownership.
    // Farmers and Buyers cannot buy their own listings.
    if (sameId(product.seller, req.user._id)) {
      return res.status(403).json({
        success: false,
        message: "You cannot purchase your own product.",
      });
    }

    const price = Number(product.price);

    if (!Number.isFinite(price) || price < 0) {
      return res.status(409).json({
        success: false,
        message: "Product price is invalid.",
      });
    }

    const availableText = String(
      product.quantity ?? ""
    ).trim();

    if (/^\d+$/.test(availableText)) {
      const available = Number(availableText);

      if (
        Number.isSafeInteger(available) &&
        amount > available
      ) {
        return res.status(409).json({
          success: false,
          message:
            "Requested quantity exceeds available stock.",
        });
      }
    }

    // Calculate the total on the backend.
    // Do not trust prices submitted by the browser.
    const totalPrice = Math.round(
      (price * amount + Number.EPSILON) * 100
    ) / 100;

    if (
      !Number.isFinite(totalPrice) ||
      totalPrice < 0 ||
      totalPrice > Number.MAX_SAFE_INTEGER / 100
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid calculated order total.",
      });
    }

    const order = await Order.create({
      product: product._id,
      buyer: req.user._id,

      // Legacy field name "farmer" represents
      // the seller, whether Farmer or Buyer.
      farmer: product.seller,

      productName:
        product.productName || "Product",

      farmerName:
        product.sellerName || "Seller",

      buyerName: name,
      phone: contact,
      quantity: String(amount),
      totalPrice,
      deliveryAddress: address,
      status: "Order Placed",
    });

    return res.status(201).json({
      success: true,
      message: "Order placed successfully.",
      order: safeOrder(order, req.user._id),
    });
  } catch (error) {
    return handleError(res, error);
  }
});

// ALL PURCHASES AND SALES FOR THE LOGGED-IN USER
router.get("/", async (req, res) => {
  try {
    const orders = await Order.find({
      $or: [
        { buyer: req.user._id },
        { farmer: req.user._id },
      ],
    })
      .sort({ createdAt: -1 })
      .limit(500)
      .lean();

    return res.json({
      success: true,
      orders: orders.map((order) =>
        safeOrder(order, req.user._id)
      ),
    });
  } catch (error) {
    return handleError(res, error);
  }
});

// MY PURCHASES
router.get("/purchases", async (req, res) => {
  try {
    const orders = await Order.find({
      buyer: req.user._id,
    })
      .sort({ createdAt: -1 })
      .limit(500)
      .lean();

    return res.json({
      success: true,
      orders: orders.map((order) =>
        safeOrder(order, req.user._id)
      ),
    });
  } catch (error) {
    return handleError(res, error);
  }
});

// MY SALES
router.get("/sales", async (req, res) => {
  try {
    const orders = await Order.find({
      farmer: req.user._id,
    })
      .sort({ createdAt: -1 })
      .limit(500)
      .lean();

    return res.json({
      success: true,
      orders: orders.map((order) =>
        safeOrder(order, req.user._id)
      ),
    });
  } catch (error) {
    return handleError(res, error);
  }
});

// VIEW AN EXISTING ORDER
// UNPUBLISHING DOES NOT HIDE ORDER HISTORY
router.get("/:id", async (req, res) => {
  try {
    if (!validId(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid order ID.",
      });
    }

    const order = await Order.findOne({
      _id: req.params.id,
      $or: [
        { buyer: req.user._id },
        { farmer: req.user._id },
      ],
    }).select("+phone +deliveryAddress");

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found.",
      });
    }

    return res.json({
      success: true,
      order: safeOrder(
        order,
        req.user._id,
        true
      ),
    });
  } catch (error) {
    return handleError(res, error);
  }
});

// UPDATE EXISTING ORDER STATUS
// ONLY THE ACTUAL SELLER CAN MANAGE THE ORDER
//
// Existing orders remain manageable even if
// the product has been unpublished afterward.
router.patch("/:id/status", async (req, res) => {
  try {
    if (!validId(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid order ID.",
      });
    }

    const { status } = req.body || {};

    if (!ORDER_STEPS.includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Invalid order status.",
      });
    }

    const existingOrder = await Order.findOne({
      _id: req.params.id,
      farmer: req.user._id,
    });

    if (!existingOrder) {
      return res.status(404).json({
        success: false,
        message:
          "Order not found or you are not its seller.",
      });
    }

    const currentIndex = ORDER_STEPS.indexOf(
      existingOrder.status
    );

    if (
      currentIndex < 0 ||
      currentIndex >= ORDER_STEPS.length - 1
    ) {
      return res.status(409).json({
        success: false,
        message:
          "This order cannot be updated further.",
      });
    }

    const nextStatus = ORDER_STEPS[currentIndex + 1];

    if (status !== nextStatus) {
      return res.status(409).json({
        success: false,
        message:
          `The next allowed status is ${nextStatus}.`,
      });
    }

    const updatedOrder = await Order.findOneAndUpdate(
      {
        _id: existingOrder._id,
        farmer: req.user._id,
        status: existingOrder.status,
      },
      {
        $set: { status },
      },
      {
        new: true,
        runValidators: true,
      }
    );

    if (!updatedOrder) {
      return res.status(409).json({
        success: false,
        message:
          "Order status changed. Please reopen My Orders.",
      });
    }

    return res.json({
      success: true,
      message: `Order marked as ${status}.`,
      order: safeOrder(
        updatedOrder,
        req.user._id
      ),
    });
  } catch (error) {
    return handleError(res, error);
  }
});

module.exports = router;
