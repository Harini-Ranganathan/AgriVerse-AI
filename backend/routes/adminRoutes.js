
const express = require("express");
const mongoose = require("mongoose");

const User = require("../models/User");
const ProductListing = require("../models/ProductListing");
const RentalEquipment = require("../models/RentalEquipment");
const MarketplaceLand = require("../models/MarketplaceLand");
const LandDemoAccess = require("../models/LandDemoAccess");

const {
  authenticate,
  authorize,
} = require("../middleware/authMiddleware");

const router = express.Router();

router.use(authenticate, authorize("admin"));

const validId = mongoose.isValidObjectId;

function failure(res, error) {
  console.error("Admin API:", error);

  return res.status(500).json({
    success: false,
    message: "Unable to complete the admin request.",
  });
}

function invalidId(res) {
  return res.status(400).json({
    success: false,
    message: "Invalid listing or user ID.",
  });
}

function validVisibility(req, res) {
  if (typeof req.body?.isPublished !== "boolean") {
    res.status(400).json({
      success: false,
      message: "isPublished must be true or false.",
    });

    return false;
  }

  return true;
}

// ==============================
// DASHBOARD OVERVIEW
// ==============================

router.get("/stats", async (req, res) => {
  try {
    const now = new Date();

    const [
      farmers,
      buyers,
      products,
      equipment,
      lands,
      activeSubscriptions,
      suspendedUsers,
      unlockedCounts,
    ] = await Promise.all([
      User.countDocuments({ role: "farmer" }),
      User.countDocuments({ role: "buyer" }),
      ProductListing.countDocuments(),
      RentalEquipment.countDocuments(),
      MarketplaceLand.countDocuments(),
      LandDemoAccess.countDocuments({
        subscriptionExpiresAt: { $gt: now },
      }),
      User.countDocuments({
        role: { $in: ["farmer", "buyer"] },
        status: "suspended",
      }),
      LandDemoAccess.aggregate([
        {
          $project: {
            count: {
              $size: {
                $ifNull: ["$unlockedLands", []],
              },
            },
          },
        },
        {
          $group: {
            _id: null,
            total: { $sum: "$count" },
          },
        },
      ]),
    ]);

    return res.json({
      success: true,
      stats: {
        farmers,
        buyers,
        totalUsers: farmers + buyers,
        products,
        equipment,
        lands,
        activeSubscriptions,
        suspendedUsers,
        landUnlocks: unlockedCounts[0]?.total || 0,
      },
    });
  } catch (error) {
    return failure(res, error);
  }
});

// ==============================
// USER MANAGEMENT
// ==============================

router.get("/users", async (req, res) => {
  try {
    const role = String(req.query.role || "all");
    const search = String(req.query.search || "").trim();

    if (!["all", "farmer", "buyer"].includes(role)) {
      return res.status(400).json({
        success: false,
        message: "Invalid role filter.",
      });
    }

    if (search.length > 100) {
      return res.status(400).json({
        success: false,
        message: "Search is too long.",
      });
    }

    const filter = {
      role: { $in: ["farmer", "buyer"] },
    };

    if (role !== "all") {
      filter.role = role;
    }

    if (search) {
      const escaped = search.replace(
        /[.*+?^${}()|[\]\\]/g,
        "\\$&"
      );

      filter.username = {
        $regex: escaped,
        $options: "i",
      };
    }

    const users = await User.find(filter)
      .select(
        "_id username role status createdAt lastLogin"
      )
      .sort({ createdAt: -1 })
      .limit(200)
      .lean();

    return res.json({
      success: true,
      users: users.map((user) => ({
        ...user,
        status: user.status || "active",
      })),
    });
  } catch (error) {
    return failure(res, error);
  }
});

router.patch("/users/:id/status", async (req, res) => {
  if (!validId(req.params.id)) {
    return invalidId(res);
  }

  const { status } = req.body || {};

  if (!["active", "suspended"].includes(status)) {
    return res.status(400).json({
      success: false,
      message: "Invalid account status.",
    });
  }

  try {
    const user = await User.findOneAndUpdate(
      {
        _id: req.params.id,
        role: { $in: ["farmer", "buyer"] },
      },
      {
        $set: { status },
      },
      {
        new: true,
        runValidators: true,
      }
    ).select(
      "_id username role status createdAt lastLogin"
    );

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found.",
      });
    }

    return res.json({
      success: true,
      message:
        status === "suspended"
          ? "User suspended successfully."
          : "User reactivated successfully.",
      user,
    });
  } catch (error) {
    return failure(res, error);
  }
});

// ==============================
// PRODUCT MANAGEMENT
// ==============================

router.get("/products", async (req, res) => {
  try {
    const products = await ProductListing.find()
      .select(
        "_id productName category price unit quantity image location sellerName seller isPublished createdAt"
      )
      .sort({ createdAt: -1 })
      .limit(200)
      .lean();

    return res.json({
      success: true,
      products,
    });
  } catch (error) {
    return failure(res, error);
  }
});

router.patch(
  "/products/:id/publication",
  async (req, res) => {
    if (!validId(req.params.id)) {
      return invalidId(res);
    }

    if (!validVisibility(req, res)) {
      return;
    }

    try {
      const product =
        await ProductListing.findByIdAndUpdate(
          req.params.id,
          {
            $set: {
              isPublished: req.body.isPublished,
            },
          },
          {
            new: true,
            runValidators: true,
          }
        ).select("_id isPublished");

      if (!product) {
        return res.status(404).json({
          success: false,
          message: "Product not found.",
        });
      }

      return res.json({
        success: true,
        message: product.isPublished
          ? "Product published successfully."
          : "Product unpublished successfully.",
        product,
      });
    } catch (error) {
      return failure(res, error);
    }
  }
);

// ==============================
// RENTAL EQUIPMENT MANAGEMENT
// ==============================

router.get("/equipment", async (req, res) => {
  try {
    const equipment = await RentalEquipment.find()
      .select(
        "_id name category rentAmount rentType district state image owner sellerUsername sellerName availabilityStatus isPublished createdAt"
      )
      .sort({ createdAt: -1 })
      .limit(200)
      .lean();

    return res.json({
      success: true,
      equipment,
    });
  } catch (error) {
    return failure(res, error);
  }
});

router.patch(
  "/equipment/:id/publication",
  async (req, res) => {
    if (!validId(req.params.id)) {
      return invalidId(res);
    }

    if (!validVisibility(req, res)) {
      return;
    }

    try {
      const equipment =
        await RentalEquipment.findByIdAndUpdate(
          req.params.id,
          {
            $set: {
              isPublished: req.body.isPublished,
            },
          },
          {
            new: true,
            runValidators: true,
          }
        ).select("_id isPublished");

      if (!equipment) {
        return res.status(404).json({
          success: false,
          message: "Rental equipment not found.",
        });
      }

      return res.json({
        success: true,
        message: equipment.isPublished
          ? "Equipment published successfully."
          : "Equipment unpublished successfully.",
        equipment,
      });
    } catch (error) {
      return failure(res, error);
    }
  }
);

// ==============================
// LAND MARKETPLACE MANAGEMENT
// ==============================

router.get("/lands", async (req, res) => {
  try {
    const lands = await MarketplaceLand.find()
      .select(
        "_id title location city state price image images sellerName sellerUsername seller isPublished createdAt"
      )
      .sort({ createdAt: -1 })
      .limit(200)
      .lean();

    return res.json({
      success: true,
      lands,
    });
  } catch (error) {
    return failure(res, error);
  }
});

router.patch(
  "/lands/:id/publication",
  async (req, res) => {
    if (!validId(req.params.id)) {
      return invalidId(res);
    }

    if (!validVisibility(req, res)) {
      return;
    }

    try {
      const land =
        await MarketplaceLand.findByIdAndUpdate(
          req.params.id,
          {
            $set: {
              isPublished: req.body.isPublished,
            },
          },
          {
            new: true,
            runValidators: true,
          }
        ).select("_id isPublished");

      if (!land) {
        return res.status(404).json({
          success: false,
          message: "Land listing not found.",
        });
      }

      return res.json({
        success: true,
        message: land.isPublished
          ? "Land published successfully."
          : "Land unpublished successfully.",
        land,
      });
    } catch (error) {
      return failure(res, error);
    }
  }
);

// ==============================
// SUBSCRIPTION MANAGEMENT
// ==============================

router.get("/subscriptions", async (req, res) => {
  try {
    const records = await LandDemoAccess.find()
      .populate("buyer", "username role status")
      .select(
        "buyer subscriptionExpiresAt unlockedLands createdAt updatedAt"
      )
      .sort({ updatedAt: -1 })
      .limit(200)
      .lean();

    const now = Date.now();

    const subscriptions = records.map((record) => ({
      ...record,
      subscriptionActive: Boolean(
        record.subscriptionExpiresAt &&
        new Date(
          record.subscriptionExpiresAt
        ).getTime() > now
      ),
      unlockedLandCount:
        record.unlockedLands?.length || 0,
    }));

    return res.json({
      success: true,
      subscriptions,
    });
  } catch (error) {
    return failure(res, error);
  }
});

module.exports = router;
