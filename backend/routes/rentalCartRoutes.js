
const express = require("express");
const mongoose = require("mongoose");

const RentalCart = require("../models/RentalCart");
const RentalEquipment = require("../models/RentalEquipment");

const {
  authenticate,
  authorize,
} = require("../middleware/authMiddleware");

const router = express.Router();

router.use(authenticate);
router.use(authorize("farmer", "buyer"));

function validId(id) {
  return mongoose.isValidObjectId(id);
}

function sameId(a, b) {
  return String(a || "") === String(b || "");
}

function equipmentOwner(equipment) {
  const value =
    equipment.owner ||
    equipment.seller ||
    equipment.createdBy;

  if (!value) return null;

  return value._id || value;
}

function handleError(res, error) {
  console.error("Rental Cart Error:", error);

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
    message: "Unable to process rental cart.",
  });
}

async function getCart(userId) {
  return RentalCart.findOne({
    user: userId,
  })
    .populate("items.equipment")
    .lean();
}

function formatCart(cart) {
  if (!cart) {
    return {
      items: [],
      count: 0,
    };
  }

  const items = (cart.items || [])
    .filter((item) => item.equipment)
    .map((item) => {
      const equipment = item.equipment;

      return {
        equipmentId: equipment._id,
        equipment: {
          _id: equipment._id,
          name:
            equipment.name ||
            equipment.equipmentName ||
            "Equipment",
          image:
            equipment.image ||
            equipment.imageUrl ||
            "",
          category: equipment.category || "",
          location:
            equipment.location ||
            equipment.district ||
            "",
          rentAmount:
            equipment.rentAmount ??
            equipment.pricePerDay ??
            equipment.price ??
            0,
          rentType:
            equipment.rentType || "per day",
        },
        addedAt: item.addedAt,
      };
    });

  return {
    items,
    count: items.length,
  };
}

// GET MY CART
router.get("/", async (req, res) => {
  try {
    const cart = await getCart(req.user._id);

    return res.json({
      success: true,
      cart: formatCart(cart),
    });
  } catch (error) {
    return handleError(res, error);
  }
});

// ADD EQUIPMENT TO CART
router.post("/", async (req, res) => {
  try {
    const equipmentId =
      req.body?.equipmentId;

    if (!validId(equipmentId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid equipment ID.",
      });
    }

    const equipment =
      await RentalEquipment.findById(equipmentId);

    if (!equipment) {
      return res.status(404).json({
        success: false,
        message: "Equipment not found.",
      });
    }

    const ownerId = equipmentOwner(equipment);

    if (!ownerId) {
      return res.status(409).json({
        success: false,
        message:
          "This equipment has no verified owner.",
      });
    }

    if (sameId(ownerId, req.user._id)) {
      return res.status(403).json({
        success: false,
        message:
          "You cannot rent your own equipment.",
      });
    }

    let cart = await RentalCart.findOne({
      user: req.user._id,
    });

    if (!cart) {
      try {
        cart = await RentalCart.create({
          user: req.user._id,
          items: [],
        });
      } catch (error) {
        if (error.code !== 11000) {
          throw error;
        }
      }
    }

    const result = await RentalCart.updateOne(
      {
        user: req.user._id,
        "items.equipment": {
          $ne: equipment._id,
        },
      },
      {
        $push: {
          items: {
            equipment: equipment._id,
            addedAt: new Date(),
          },
        },
      }
    );

    const updatedCart = await getCart(req.user._id);

    return res.status(
      result.modifiedCount ? 201 : 200
    ).json({
      success: true,
      message: result.modifiedCount
        ? "Equipment added to cart."
        : "Equipment is already in your cart.",
      cart: formatCart(updatedCart),
    });
  } catch (error) {
    return handleError(res, error);
  }
});

// REMOVE AN EQUIPMENT ITEM
router.delete("/:equipmentId", async (req, res) => {
  try {
    const { equipmentId } = req.params;

    if (!validId(equipmentId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid equipment ID.",
      });
    }

    await RentalCart.updateOne(
      { user: req.user._id },
      {
        $pull: {
          items: {
            equipment:
              new mongoose.Types.ObjectId(equipmentId),
          },
        },
      }
    );

    const cart = await getCart(req.user._id);

    return res.json({
      success: true,
      message: "Equipment removed from cart.",
      cart: formatCart(cart),
    });
  } catch (error) {
    return handleError(res, error);
  }
});

// EMPTY THE ENTIRE CART
router.delete("/", async (req, res) => {
  try {
    await RentalCart.updateOne(
      { user: req.user._id },
      {
        $set: {
          items: [],
        },
      }
    );

    return res.json({
      success: true,
      message: "Rental cart cleared.",
      cart: {
        items: [],
        count: 0,
      },
    });
  } catch (error) {
    return handleError(res, error);
  }
});

module.exports = router;
