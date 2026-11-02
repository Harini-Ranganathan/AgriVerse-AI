
const express = require("express");
const mongoose = require("mongoose");

const ProductListing = require("../models/ProductListing");
const Order = require("../models/Order");

const {
  authenticate,
  authorize,
} = require("../middleware/authMiddleware");

const router = express.Router();

const usersOnly = [
  authenticate,
  authorize("farmer", "buyer"),
];

const PRODUCT_FIELDS = [
  "productName",
  "quantity",
  "price",
  "location",
  "phone",
  "description",
  "category",
  "image",
  "district",
  "state",
  "unit",
];

const PRIVATE_FIELDS =
  "+buyerRequests +confirmedOrders +shippedOrders +rejectedRequests +unreadBuyerCount";

function validId(value) {
  return mongoose.isValidObjectId(value);
}

function sameId(a, b) {
  return String(a || "") === String(b || "");
}

function itemId(item) {
  return String(item?.id ?? item?._id ?? "");
}

function isPublished(listing) {
  return listing.isPublished !== false;
}

function cleanData(body = {}) {
  const data = {};

  for (const field of PRODUCT_FIELDS) {
    if (
      Object.prototype.hasOwnProperty.call(body, field)
    ) {
      data[field] =
        typeof body[field] === "string"
          ? body[field].trim()
          : body[field];
    }
  }

  return data;
}

function validateProduct(data, editing = false) {
  if (!editing || "productName" in data) {
    if (
      typeof data.productName !== "string" ||
      data.productName.length < 2 ||
      data.productName.length > 200
    ) {
      return "Enter a valid product name.";
    }
  }

  if (!editing || "price" in data) {
    if (
      data.price === "" ||
      data.price == null ||
      !Number.isFinite(Number(data.price)) ||
      Number(data.price) < 0 ||
      Number(data.price) > 1000000000
    ) {
      return "Enter a valid product price.";
    }

    data.price = Number(data.price);
  }

  if (!editing || "quantity" in data) {
    if (
      data.quantity == null ||
      String(data.quantity).trim().length === 0 ||
      String(data.quantity).length > 100
    ) {
      return "Enter a valid quantity.";
    }

    data.quantity = String(data.quantity).trim();
  }

  const textLimits = {
    category: 100,
    unit: 50,
    district: 200,
    state: 200,
    location: 500,
    phone: 30,
    description: 5000,
    image: 2048,
  };

  for (const [field, limit] of Object.entries(textLimits)) {
    if (
      field in data &&
      (
        typeof data[field] !== "string" ||
        data[field].length > limit
      )
    ) {
      return `Invalid ${field}.`;
    }
  }

  if (
    data.image &&
    !/^https:\/\/[^\s]+$/i.test(data.image)
  ) {
    return "Product image must use HTTPS.";
  }

  return null;
}

function publicListing(listing) {
  const data =
    typeof listing.toObject === "function"
      ? listing.toObject()
      : { ...listing };

  delete data.buyerRequests;
  delete data.confirmedOrders;
  delete data.shippedOrders;
  delete data.rejectedRequests;
  delete data.unreadBuyerCount;
  delete data.__v;

  return {
    ...data,
    isPublished: isPublished(data),
  };
}

function handleError(res, error) {
  console.error("Product Listing API:", error);

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
    message: "Unable to process product request.",
  });
}

async function ownedListing(id, userId) {
  return ProductListing.findOne({
    _id: id,
    seller: userId,
  }).select(PRIVATE_FIELDS);
}

// PUBLIC: ONLY PUBLISHED PRODUCTS
router.get("/", async (req, res) => {
  try {
    const listings = await ProductListing.find({
      isPublished: { $ne: false },
    })
      .sort({ createdAt: -1 })
      .lean();

    return res.json(listings.map(publicListing));
  } catch (error) {
    return handleError(res, error);
  }
});

// PRIVATE: ALL MY PRODUCTS, INCLUDING UNPUBLISHED
router.get("/mine", usersOnly, async (req, res) => {
  try {
    const listings = await ProductListing.find({
      seller: req.user._id,
    })
      .sort({ createdAt: -1 })
      .lean();

    return res.json(listings.map(publicListing));
  } catch (error) {
    return handleError(res, error);
  }
});

// PRIVATE: ENQUIRIES RECEIVED
router.get(
  "/seller/requests",
  usersOnly,
  async (req, res) => {
    try {
      const listings = await ProductListing.find({
        seller: req.user._id,
      }).select(PRIVATE_FIELDS);

      const requests = [];

      for (const listing of listings) {
        for (const request of listing.buyerRequests || []) {
          requests.push({
            productId: listing._id,
            productName: listing.productName,
            request,
          });
        }
      }

      return res.json({
        success: true,
        requests,
        listings,
      });
    } catch (error) {
      return handleError(res, error);
    }
  }
);

// SELLER: ALL ENQUIRY ORDERS
router.get(
  "/seller/orders",
  usersOnly,
  async (req, res) => {
    try {
      const listings = await ProductListing.find({
        seller: req.user._id,
      }).select(PRIVATE_FIELDS);

      const orders = [];

      for (const listing of listings) {
        for (const request of listing.buyerRequests || []) {
          orders.push({
            productId: listing._id,
            productName: listing.productName,
            image: listing.image || "",
            unit: listing.unit || "",
            status: "Pending",
            request,
          });
        }

        for (const request of listing.rejectedRequests || []) {
          orders.push({
            productId: listing._id,
            productName: listing.productName,
            image: listing.image || "",
            unit: listing.unit || "",
            status: "Rejected",
            request,
          });
        }

        for (const order of listing.confirmedOrders || []) {
          orders.push({
            productId: listing._id,
            productName: listing.productName,
            image: listing.image || "",
            unit: listing.unit || "",
            status: "Confirmed",
            order,
          });
        }

        for (const order of listing.shippedOrders || []) {
          orders.push({
            productId: listing._id,
            productName: listing.productName,
            image: listing.image || "",
            unit: listing.unit || "",
            status: "Shipped",
            order,
          });
        }
      }

      return res.json({
        success: true,
        orders,
        listings,
      });
    } catch (error) {
      return handleError(res, error);
    }
  }
);

// BUYER: MY SENT ENQUIRIES AND THEIR STATUSES
router.get(
  "/buyer/requests",
  usersOnly,
  async (req, res) => {
    try {
      const listings = await ProductListing.find({
        $or: [
          { "buyerRequests.buyer": req.user._id },
          { "confirmedOrders.buyer": req.user._id },
          { "shippedOrders.buyer": req.user._id },
          { "rejectedRequests.buyer": req.user._id },
        ],
      }).select(PRIVATE_FIELDS);

      const requests = [];

      for (const listing of listings) {
        const groups = [
          ["Pending", listing.buyerRequests || []],
          ["Confirmed", listing.confirmedOrders || []],
          ["Shipped", listing.shippedOrders || []],
          ["Rejected", listing.rejectedRequests || []],
        ];

        for (const [status, entries] of groups) {
          for (const request of entries) {
            if (sameId(request.buyer, req.user._id)) {
              requests.push({
                productId: listing._id,
                productName: listing.productName,
                image: listing.image || "",
                status,
                request,
              });
            }
          }
        }
      }

      return res.json({
        success: true,
        requests,
      });
    } catch (error) {
      return handleError(res, error);
    }
  }
);

// CREATE PRODUCT LISTING
router.post("/add", usersOnly, async (req, res) => {
  try {
    const data = cleanData(req.body || {});
    const problem = validateProduct(data);

    if (problem) {
      return res.status(400).json({
        success: false,
        message: problem,
      });
    }

    const listing = await ProductListing.create({
      ...data,
      seller: req.user._id,
      sellerName:
        req.user.name ||
        req.user.fullName ||
        req.user.username ||
        "",
      sellerType: req.user.role,
      isPublished: true,
    });

    return res.status(201).json({
      success: true,
      message: "Product published successfully.",
      listing: publicListing(listing),
    });
  } catch (error) {
    return handleError(res, error);
  }
});

// PUBLISH OR UNPUBLISH OWN PRODUCT
router.patch(
  "/:id/publication",
  usersOnly,
  async (req, res) => {
    try {
      if (!validId(req.params.id)) {
        return res.status(400).json({
          success: false,
          message: "Invalid product ID.",
        });
      }

      const { isPublished: publish } = req.body || {};

      if (typeof publish !== "boolean") {
        return res.status(400).json({
          success: false,
          message: "isPublished must be true or false.",
        });
      }

      const listing = await ProductListing.findOneAndUpdate(
        {
          _id: req.params.id,
          seller: req.user._id,
        },
        {
          $set: { isPublished: publish },
        },
        {
          new: true,
          runValidators: true,
        }
      );

      if (!listing) {
        return res.status(404).json({
          success: false,
          message: "Product not found or access denied.",
        });
      }

      return res.json({
        success: true,
        message: publish
          ? "Product published successfully."
          : "Product unpublished successfully.",
        listing: publicListing(listing),
      });
    } catch (error) {
      return handleError(res, error);
    }
  }
);

// SEND PRODUCT ENQUIRY
router.post(
  "/:id/requests",
  usersOnly,
  async (req, res) => {
    try {
      if (!validId(req.params.id)) {
        return res.status(400).json({
          success: false,
          message: "Invalid product ID.",
        });
      }

      const listing = await ProductListing.findById(
        req.params.id
      );

      if (!listing) {
        return res.status(404).json({
          success: false,
          message: "Product not found.",
        });
      }

      if (!isPublished(listing)) {
        return res.status(409).json({
          success: false,
          message:
            "This product is unpublished and is not accepting enquiries.",
        });
      }

      if (sameId(listing.seller, req.user._id)) {
        return res.status(403).json({
          success: false,
          message: "You cannot enquire about your own product.",
        });
      }

      const buyerName = String(
        req.body?.buyerName ||
        req.user.name ||
        req.user.username ||
        ""
      ).trim();

      const buyerPhone = String(
        req.body?.buyerPhone || ""
      ).trim();

      const buyerQuantity = String(
        req.body?.buyerQuantity || ""
      ).trim();

      const buyerMessage = String(
        req.body?.buyerMessage || ""
      ).trim();

      if (
        buyerName.length < 2 ||
        buyerName.length > 100 ||
        !/^[+0-9()\s-]{7,30}$/.test(buyerPhone) ||
        !buyerQuantity ||
        buyerQuantity.length > 100 ||
        buyerMessage.length > 2000
      ) {
        return res.status(400).json({
          success: false,
          message: "Enter valid enquiry details.",
        });
      }

      const request = {
        id: Date.now(),
        buyer: req.user._id,
        buyerName,
        buyerPhone,
        buyerQuantity,
        buyerMessage,
        read: false,
      };

      const result = await ProductListing.updateOne(
        {
          _id: listing._id,
          seller: { $ne: req.user._id },
          isPublished: { $ne: false },
        },
        {
          $push: { buyerRequests: request },
          $inc: { unreadBuyerCount: 1 },
        }
      );

      if (!result.modifiedCount) {
        return res.status(409).json({
          success: false,
          message:
            "This product is no longer accepting enquiries.",
        });
      }

      return res.status(201).json({
        success: true,
        message: "Enquiry sent successfully.",
        request,
      });
    } catch (error) {
      return handleError(res, error);
    }
  }
);

// WITHDRAW OWN UNREAD ENQUIRY
router.delete(
  "/:id/requests/:requestId",
  usersOnly,
  async (req, res) => {
    try {
      if (!validId(req.params.id)) {
        return res.status(400).json({
          success: false,
          message: "Invalid product ID.",
        });
      }

      const listing = await ProductListing.findById(
        req.params.id
      ).select(PRIVATE_FIELDS);

      if (!listing) {
        return res.status(404).json({
          success: false,
          message: "Product not found.",
        });
      }

      const request = (listing.buyerRequests || []).find(
        (item) =>
          itemId(item) === req.params.requestId &&
          sameId(item.buyer, req.user._id) &&
          !item.read
      );

      if (!request) {
        return res.status(404).json({
          success: false,
          message: "Unread enquiry not found.",
        });
      }

      const result = await ProductListing.updateOne(
        {
          _id: listing._id,
          buyerRequests: {
            $elemMatch: {
              id: request.id,
              buyer: req.user._id,
              read: false,
            },
          },
        },
        {
          $pull: {
            buyerRequests: {
              id: request.id,
              buyer: req.user._id,
              read: false,
            },
          },
          $inc: { unreadBuyerCount: -1 },
        }
      );

      if (!result.modifiedCount) {
        return res.status(409).json({
          success: false,
          message: "Enquiry was already processed.",
        });
      }

      return res.json({
        success: true,
        message: "Enquiry withdrawn successfully.",
      });
    } catch (error) {
      return handleError(res, error);
    }
  }
);

// REJECT PENDING REQUEST AND PRESERVE ITS HISTORY
router.post(
  "/:id/requests/:requestId/reject",
  usersOnly,
  async (req, res) => {
    try {
      if (!validId(req.params.id)) {
        return res.status(400).json({
          success: false,
          message: "Invalid product ID.",
        });
      }

      const listing = await ownedListing(
        req.params.id,
        req.user._id
      );

      if (!listing) {
        return res.status(404).json({
          success: false,
          message: "Product not found or access denied.",
        });
      }

      const request = (listing.buyerRequests || []).find(
        (entry) =>
          itemId(entry) === String(req.params.requestId)
      );

      if (!request) {
        return res.status(404).json({
          success: false,
          message: "Pending request not found.",
        });
      }

      const rejected = {
        ...request.toObject(),
        rejectedAt: new Date(),
        read: true,
      };

      const changes = {
        $pull: {
          buyerRequests: { id: request.id },
        },
        $push: {
          rejectedRequests: rejected,
        },
      };

      if (!request.read) {
        changes.$inc = {
          unreadBuyerCount: -1,
        };
      }

      const result = await ProductListing.updateOne(
        {
          _id: listing._id,
          seller: req.user._id,
          "buyerRequests.id": request.id,
        },
        changes
      );

      if (!result.modifiedCount) {
        return res.status(409).json({
          success: false,
          message: "Request already processed.",
        });
      }

      return res.json({
        success: true,
        message: "Request rejected.",
        request: rejected,
      });
    } catch (error) {
      return handleError(res, error);
    }
  }
);

// CONFIRM PENDING BUYER ENQUIRY
router.post(
  "/:id/requests/:requestId/confirm",
  usersOnly,
  async (req, res) => {
    try {
      if (!validId(req.params.id)) {
        return res.status(400).json({
          success: false,
          message: "Invalid product ID.",
        });
      }

      const listing = await ownedListing(
        req.params.id,
        req.user._id
      );

      if (!listing) {
        return res.status(404).json({
          success: false,
          message: "Product not found or access denied.",
        });
      }

      const request = (listing.buyerRequests || []).find(
        (item) =>
          itemId(item) === req.params.requestId
      );

      if (!request) {
        return res.status(404).json({
          success: false,
          message: "Enquiry not found.",
        });
      }

      const order = {
        ...request.toObject(),
        confirmedAt: new Date(),
      };

      const update = {
        $pull: {
          buyerRequests: { id: request.id },
        },
        $push: {
          confirmedOrders: order,
        },
      };

      if (!request.read) {
        update.$inc = {
          unreadBuyerCount: -1,
        };
      }

      const result = await ProductListing.updateOne(
        {
          _id: listing._id,
          seller: req.user._id,
          "buyerRequests.id": request.id,
        },
        update
      );

      if (!result.modifiedCount) {
        return res.status(409).json({
          success: false,
          message: "Enquiry was already processed.",
        });
      }

      return res.json({
        success: true,
        message: "Enquiry confirmed successfully.",
        order,
      });
    } catch (error) {
      return handleError(res, error);
    }
  }
);

// MARK CONFIRMED ORDER AS SHIPPED
router.post(
  "/:id/orders/:orderId/ship",
  usersOnly,
  async (req, res) => {
    try {
      if (!validId(req.params.id)) {
        return res.status(400).json({
          success: false,
          message: "Invalid product ID.",
        });
      }

      const listing = await ownedListing(
        req.params.id,
        req.user._id
      );

      if (!listing) {
        return res.status(404).json({
          success: false,
          message: "Product not found or access denied.",
        });
      }

      const order = (listing.confirmedOrders || []).find(
        (item) =>
          itemId(item) === req.params.orderId
      );

      if (!order) {
        return res.status(404).json({
          success: false,
          message: "Confirmed order not found.",
        });
      }

      const shippedOrder = {
        ...order.toObject(),
        shippedAt: new Date(),
      };

      const result = await ProductListing.updateOne(
        {
          _id: listing._id,
          seller: req.user._id,
          "confirmedOrders.id": order.id,
        },
        {
          $pull: {
            confirmedOrders: { id: order.id },
          },
          $push: {
            shippedOrders: shippedOrder,
          },
        }
      );

      if (!result.modifiedCount) {
        return res.status(409).json({
          success: false,
          message: "Order already processed.",
        });
      }

      return res.json({
        success: true,
        message: "Order marked as shipped.",
        order: shippedOrder,
      });
    } catch (error) {
      return handleError(res, error);
    }
  }
);

// UPDATE SHIPMENT TRACKING DETAILS
router.patch(
  "/:id/orders/:orderId/tracking",
  usersOnly,
  async (req, res) => {
    try {
      if (!validId(req.params.id)) {
        return res.status(400).json({
          success: false,
          message: "Invalid product ID.",
        });
      }

      const tracking = String(
        req.body?.tracking ||
        req.body?.trackingNumber ||
        ""
      ).trim();

      const orderId = Number(req.params.orderId);

      if (
        !tracking ||
        tracking.length > 200 ||
        !Number.isSafeInteger(orderId)
      ) {
        return res.status(400).json({
          success: false,
          message: "Invalid tracking information.",
        });
      }

      const result = await ProductListing.updateOne(
        {
          _id: req.params.id,
          seller: req.user._id,
          "shippedOrders.id": orderId,
        },
        {
          $set: {
            "shippedOrders.$.tracking": tracking,
          },
        }
      );

      if (!result.matchedCount) {
        return res.status(404).json({
          success: false,
          message: "Shipped order not found or access denied.",
        });
      }

      return res.json({
        success: true,
        message: "Tracking information updated.",
      });
    } catch (error) {
      return handleError(res, error);
    }
  }
);

// EDIT OWN PRODUCT
router.put(
  "/:id",
  usersOnly,
  async (req, res) => {
    try {
      if (!validId(req.params.id)) {
        return res.status(400).json({
          success: false,
          message: "Invalid product ID.",
        });
      }

      const data = cleanData(req.body || {});

      if (!Object.keys(data).length) {
        return res.status(400).json({
          success: false,
          message: "No changes provided.",
        });
      }

      const problem = validateProduct(data, true);

      if (problem) {
        return res.status(400).json({
          success: false,
          message: problem,
        });
      }

      const listing = await ProductListing.findOneAndUpdate(
        {
          _id: req.params.id,
          seller: req.user._id,
        },
        {
          $set: data,
        },
        {
          new: true,
          runValidators: true,
        }
      );

      if (!listing) {
        return res.status(404).json({
          success: false,
          message: "Product not found or access denied.",
        });
      }

      return res.json({
        success: true,
        message: "Product updated successfully.",
        listing: publicListing(listing),
      });
    } catch (error) {
      return handleError(res, error);
    }
  }
);

// DELETE OWN PRODUCT ONLY IF IT HAS NO ORDER HISTORY
router.delete(
  "/:id",
  usersOnly,
  async (req, res) => {
    try {
      if (!validId(req.params.id)) {
        return res.status(400).json({
          success: false,
          message: "Invalid product ID.",
        });
      }

      const listing = await ownedListing(
        req.params.id,
        req.user._id
      );

      if (!listing) {
        return res.status(404).json({
          success: false,
          message: "Product not found or access denied.",
        });
      }

      const hasEnquiryHistory =
        (listing.buyerRequests || []).length > 0 ||
        (listing.confirmedOrders || []).length > 0 ||
        (listing.shippedOrders || []).length > 0 ||
        (listing.rejectedRequests || []).length > 0;

      if (hasEnquiryHistory) {
        return res.status(409).json({
          success: false,
          message:
            "This product has enquiry or order history. " +
            "Unpublish it instead of deleting it.",
        });
      }

      const hasCheckoutOrders = await Order.exists({
        product: listing._id,
      });

      if (hasCheckoutOrders) {
        return res.status(409).json({
          success: false,
          message:
            "This product has checkout orders. " +
            "Unpublish it to preserve order history.",
        });
      }

      const result = await ProductListing.deleteOne({
        _id: listing._id,
        seller: req.user._id,
        buyerRequests: { $size: 0 },
        confirmedOrders: { $size: 0 },
        shippedOrders: { $size: 0 },
        rejectedRequests: { $size: 0 },
      });

      if (!result.deletedCount) {
        return res.status(409).json({
          success: false,
          message:
            "Product changed or has existing requests. " +
            "It could not be deleted.",
        });
      }

      return res.json({
        success: true,
        message: "Product deleted successfully.",
      });
    } catch (error) {
      return handleError(res, error);
    }
  }
);

module.exports = router;
