
const express = require("express");
const mongoose = require("mongoose");

const RentalEquipment = require("../models/RentalEquipment");
const RentalOrder = require("../models/RentalOrder");

const {
  authenticate,
  authorize,
} = require("../middleware/authMiddleware");

const router = express.Router();

const usersOnly = [
  authenticate,
  authorize("farmer", "buyer"),
];

function validId(id) {
  return mongoose.isValidObjectId(id);
}

function sameId(a, b) {
  return String(a || "") === String(b || "");
}

function getOwner(equipment) {
  return (
    equipment.owner ||
    equipment.seller ||
    equipment.createdBy
  );
}

function cleanEquipment(body = {}) {
  const fields = [
    "name",
    "equipmentName",
    "category",
    "rentAmount",
    "rentType",
    "address",
    "location",
    "district",
    "state",
    "description",
    "image",
    "imageUrl",
    "phone",
  ];

  const result = {};

  for (const field of fields) {
    if (
      Object.prototype.hasOwnProperty.call(body, field)
    ) {
      result[field] =
        typeof body[field] === "string"
          ? body[field].trim()
          : body[field];
    }
  }

  return result;
}

function validateEquipment(data, partial = false) {
  if (!partial || "name" in data || "equipmentName" in data) {
    const name = String(
      data.name || data.equipmentName || ""
    ).trim();

    if (name.length < 2 || name.length > 200) {
      return "Enter a valid equipment name.";
    }

    data.name = name;
  }

  if (!partial || "rentAmount" in data) {
    const price = Number(data.rentAmount);

    if (
      data.rentAmount === "" ||
      data.rentAmount == null ||
      !Number.isFinite(price) ||
      price < 0 ||
      price > 1000000000
    ) {
      return "Enter a valid rental amount.";
    }

    data.rentAmount = price;
  }

  if (
    "image" in data &&
    data.image &&
    !/^https:\/\//i.test(data.image)
  ) {
    return "Equipment image must use HTTPS.";
  }

  if (
    "imageUrl" in data &&
    data.imageUrl &&
    !/^https:\/\//i.test(data.imageUrl)
  ) {
    return "Equipment image must use HTTPS.";
  }

  return null;
}

function handleError(res, error) {
  console.error("Rental Equipment API:", error);

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
    message: "Unable to process rental equipment.",
  });
}

// PUBLIC MARKETPLACE
router.get("/", async (req, res) => {
  try {
    const equipment = await RentalEquipment.find()
      .sort({ createdAt: -1 })
      .lean();

    return res.json({
      success: true,
      equipment,
    });
  } catch (error) {
    return handleError(res, error);
  }
});

// CURRENT USER'S EQUIPMENT
router.get("/mine", usersOnly, async (req, res) => {
  try {
    const equipment = await RentalEquipment.find({
      $or: [
        { owner: req.user._id },
        { seller: req.user._id },
        { createdBy: req.user._id },
      ],
    })
      .sort({ createdAt: -1 })
      .lean();

    return res.json({
      success: true,
      equipment,
    });
  } catch (error) {
    return handleError(res, error);
  }
});

// ADD EQUIPMENT
router.post("/add", usersOnly, async (req, res) => {
  try {
    const data = cleanEquipment(req.body);

    const problem = validateEquipment(data);

    if (problem) {
      return res.status(400).json({
        success: false,
        message: problem,
      });
    }

    const equipment = await RentalEquipment.create({
      ...data,
      owner: req.user._id,
      ownerName:
        req.user.fullName ||
        req.user.name ||
        req.user.username ||
        "",
    });

    return res.status(201).json({
      success: true,
      message: "Equipment added successfully.",
      equipment,
    });
  } catch (error) {
    return handleError(res, error);
  }
});

// VIEW A SINGLE EQUIPMENT
router.get("/:id", async (req, res) => {
  try {
    if (!validId(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid equipment ID.",
      });
    }

    const equipment = await RentalEquipment.findById(
      req.params.id
    ).lean();

    if (!equipment) {
      return res.status(404).json({
        success: false,
        message: "Equipment not found.",
      });
    }

    return res.json({
      success: true,
      equipment,
    });
  } catch (error) {
    return handleError(res, error);
  }
});

// EDIT OWN EQUIPMENT
router.put("/:id", usersOnly, async (req, res) => {
  try {
    if (!validId(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid equipment ID.",
      });
    }

    const data = cleanEquipment(req.body);

    if (!Object.keys(data).length) {
      return res.status(400).json({
        success: false,
        message: "No changes provided.",
      });
    }

    const problem = validateEquipment(data, true);

    if (problem) {
      return res.status(400).json({
        success: false,
        message: problem,
      });
    }

    const equipment = await RentalEquipment.findOneAndUpdate(
      {
        _id: req.params.id,
        $or: [
          { owner: req.user._id },
          { seller: req.user._id },
          { createdBy: req.user._id },
        ],
      },
      { $set: data },
      {
        new: true,
        runValidators: true,
      }
    );

    if (!equipment) {
      return res.status(404).json({
        success: false,
        message:
          "Equipment not found or you are not its owner.",
      });
    }

    return res.json({
      success: true,
      message: "Equipment updated successfully.",
      equipment,
    });
  } catch (error) {
    return handleError(res, error);
  }
});

// DELETE OWN EQUIPMENT
router.delete("/:id", usersOnly, async (req, res) => {
  try {
    if (!validId(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid equipment ID.",
      });
    }

    const equipment = await RentalEquipment.findOne({
      _id: req.params.id,
      $or: [
        { owner: req.user._id },
        { seller: req.user._id },
        { createdBy: req.user._id },
      ],
    });

    if (!equipment) {
      return res.status(404).json({
        success: false,
        message:
          "Equipment not found or you are not its owner.",
      });
    }

    const hasOrders = await RentalOrder.exists({
      equipment: equipment._id,
    });

    if (hasOrders) {
      return res.status(409).json({
        success: false,
        message:
          "This equipment has rental orders and cannot be deleted.",
      });
    }

    await RentalEquipment.deleteOne({
      _id: equipment._id,
      $or: [
        { owner: req.user._id },
        { seller: req.user._id },
        { createdBy: req.user._id },
      ],
    });

    return res.json({
      success: true,
      message: "Equipment deleted successfully.",
    });
  } catch (error) {
    return handleError(res, error);
  }
});

module.exports = router;
