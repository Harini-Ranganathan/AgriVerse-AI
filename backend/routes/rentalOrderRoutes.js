
const express = require("express");
const mongoose = require("mongoose");

const RentalEquipment = require("../models/RentalEquipment");
const RentalOrder = require("../models/RentalOrder");

const {
  authenticate,
  authorize,
} = require("../middleware/authMiddleware");

const router = express.Router();

router.use(authenticate);
router.use(authorize("farmer", "buyer"));

const ACTIVE_BOOKINGS = ["Confirmed", "Active"];

const VALID_STATUSES = [
  "Requested",
  "Confirmed",
  "Active",
  "Completed",
  "Rejected",
  "Cancelled",
];

function validId(id) {
  return mongoose.isValidObjectId(id);
}

function sendError(res, error) {
  console.error("Rental Order API:", error);

  if (error.name === "ValidationError") {
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }

  return res.status(500).json({
    success: false,
    message: "Unable to process rental order.",
  });
}

function validDateOnly(value) {
  if (
    typeof value !== "string" ||
    !/^\d{4}-\d{2}-\d{2}$/.test(value)
  ) {
    return null;
  }

  const date = new Date(`${value}T00:00:00.000Z`);

  if (
    Number.isNaN(date.getTime()) ||
    date.toISOString().slice(0, 10) !== value
  ) {
    return null;
  }

  return date;
}

function parseRentalDates(startInput, endInput, rentType) {
  let startDate;
  let endDate;
  let totalMilliseconds;

  if (rentType === "Per Hour") {
    // Hourly rentals require complete timestamps
    // with an explicit timezone offset or Z.
    const pattern =
      /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(?::\d{2}(?:\.\d{1,3})?)?(?:Z|[+-]\d{2}:\d{2})$/;

    if (
      typeof startInput !== "string" ||
      typeof endInput !== "string" ||
      !pattern.test(startInput) ||
      !pattern.test(endInput)
    ) {
      return null;
    }

    startDate = new Date(startInput);
    endDate = new Date(endInput);

    totalMilliseconds =
      endDate.getTime() - startDate.getTime();
  } else {
    // Date-only bookings count both start and end dates.
    startDate = validDateOnly(startInput);
    const lastDay = validDateOnly(endInput);

    if (!startDate || !lastDay) return null;

    endDate = new Date(lastDay);
    endDate.setUTCDate(endDate.getUTCDate() + 1);

    totalMilliseconds =
      endDate.getTime() - startDate.getTime();
  }

  if (
    !startDate ||
    !endDate ||
    !Number.isFinite(totalMilliseconds) ||
    totalMilliseconds <= 0
  ) {
    return null;
  }

  // Avoid bookings excessively far into the future.
  const now = Date.now();
  const oneDay = 24 * 60 * 60 * 1000;
  const maximumAdvance = 730 * oneDay;
  const maximumDuration = 365 * oneDay;

  if (
    startDate.getTime() < now - oneDay ||
    startDate.getTime() > now + maximumAdvance ||
    totalMilliseconds > maximumDuration
  ) {
    return null;
  }

  return {
    startDate,
    endDate,
    totalMilliseconds,
  };
}

function calculateRentalUnits(milliseconds, rentType) {
  const hour = 60 * 60 * 1000;
  const day = 24 * hour;

  switch (rentType) {
    case "Per Hour":
      return Math.ceil(milliseconds / hour);

    case "Per Day":
      return Math.ceil(milliseconds / day);

    case "Per Week":
      return Math.ceil(milliseconds / (7 * day));

    case "Per Month":
      // Current billing rule: one rental month = 30 days.
      return Math.ceil(milliseconds / (30 * day));

    default:
      return null;
  }
}

function calculateTotal(amount, units) {
  const total = Math.round(
    (Number(amount) * units + Number.EPSILON) * 100
  ) / 100;

  return Number.isSafeInteger(Math.round(total * 100)) &&
    total >= 0
    ? total
    : null;
}

async function hasDateConflict(
  equipmentId,
  startDate,
  endDate,
  excludeOrderId = null
) {
  const filter = {
    equipment: equipmentId,
    status: { $in: ACTIVE_BOOKINGS },
    startDate: { $lt: endDate },
    endDate: { $gt: startDate },
  };

  if (excludeOrderId) {
    filter._id = { $ne: excludeOrderId };
  }

  return Boolean(await RentalOrder.exists(filter));
}

function orderFilterForUser(user) {
  return {
    $or: [
      { renter: user._id },
      { owner: user._id },
    ],
  };
}

function safeOrder(order, userId) {
  const data = order.toObject
    ? order.toObject()
    : { ...order };

  const isOwner = String(data.owner) === String(userId);
  const isRenter = String(data.renter) === String(userId);

  return {
    _id: data._id,
    equipment: data.equipment,
    equipmentName: data.equipmentName,
    owner: data.owner,
    renter: data.renter,
    renterName: data.renterName,
    startDate: data.startDate,
    endDate: data.endDate,
    rentAmount: data.rentAmount,
    rentType: data.rentType,
    rentalUnits: data.rentalUnits,
    totalPrice: data.totalPrice,
    status: data.status,
    paymentStatus: data.paymentStatus,
    renterMessage: data.renterMessage,
    createdAt: data.createdAt,
    updatedAt: data.updatedAt,
    orderType:
      isOwner && !isRenter
        ? "received"
        : "renting",
  };
}

// CREATE A RENTAL REQUEST
router.post("/", async (req, res) => {
  try {
    const {
      equipmentId,
      renterName,
      phone,
      deliveryAddress,
      startDate: startInput,
      endDate: endInput,
      renterMessage,
    } = req.body || {};

    if (!validId(equipmentId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid equipment ID.",
      });
    }

    const name = String(renterName || "").trim();
    const contact = String(phone || "").trim();
    const address = String(deliveryAddress || "").trim();
    const message = String(renterMessage || "").trim();

    if (name.length < 2 || name.length > 100) {
      return res.status(400).json({
        success: false,
        message: "Enter a valid renter name.",
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

    if (message.length > 2000) {
      return res.status(400).json({
        success: false,
        message: "Rental message is too long.",
      });
    }

    const equipment = await RentalEquipment.findOne({
      _id: equipmentId,
      isPublished: true,
      availabilityStatus: "Available",
    });

    if (!equipment) {
      return res.status(404).json({
        success: false,
        message: "Equipment is not available for rent.",
      });
    }

    if (
      String(equipment.owner) === String(req.user._id)
    ) {
      return res.status(403).json({
        success: false,
        message: "You cannot rent your own equipment.",
      });
    }

    const dates = parseRentalDates(
      startInput,
      endInput,
      equipment.rentType
    );

    if (!dates) {
      return res.status(400).json({
        success: false,
        message:
          "Enter valid rental dates. Hourly rentals require " +
          "timestamps with timezone offsets.",
      });
    }

    const rentalUnits = calculateRentalUnits(
      dates.totalMilliseconds,
      equipment.rentType
    );

    const totalPrice = calculateTotal(
      equipment.rentAmount,
      rentalUnits
    );

    if (
      !rentalUnits ||
      totalPrice === null
    ) {
      return res.status(400).json({
        success: false,
        message: "Unable to calculate rental charges.",
      });
    }

    if (
      await hasDateConflict(
        equipment._id,
        dates.startDate,
        dates.endDate
      )
    ) {
      return res.status(409).json({
        success: false,
        message:
          "This equipment is already booked for the selected dates.",
      });
    }

    const order = await RentalOrder.create({
      equipment: equipment._id,
      owner: equipment.owner,
      renter: req.user._id,
      equipmentName: equipment.name,
      renterName: name,
      phone: contact,
      deliveryAddress: address,
      startDate: dates.startDate,
      endDate: dates.endDate,
      rentAmount: equipment.rentAmount,
      rentType: equipment.rentType,
      rentalUnits,
      totalPrice,
      renterMessage: message,
      status: "Requested",
      paymentStatus: "Pending",
    });

    return res.status(201).json({
      success: true,
      message: "Rental request submitted successfully.",
      order: safeOrder(order, req.user._id),
    });
  } catch (error) {
    return sendError(res, error);
  }
});

// GET ALL ORDERS BELONGING TO CURRENT USER
router.get("/", async (req, res) => {
  try {
    const orders = await RentalOrder.find(
      orderFilterForUser(req.user)
    )
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
    return sendError(res, error);
  }
});

// GET RENTALS REQUESTED BY CURRENT USER
router.get("/mine", async (req, res) => {
  try {
    const orders = await RentalOrder.find({
      renter: req.user._id,
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
    return sendError(res, error);
  }
});

// GET RENTAL REQUESTS RECEIVED FOR OWN EQUIPMENT
router.get("/received", async (req, res) => {
  try {
    const orders = await RentalOrder.find({
      owner: req.user._id,
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
    return sendError(res, error);
  }
});

// GET INDIVIDUAL ORDER
router.get("/:id", async (req, res) => {
  try {
    if (!validId(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid rental order ID.",
      });
    }

    const order = await RentalOrder.findOne({
      _id: req.params.id,
      ...orderFilterForUser(req.user),
    });

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Rental order not found.",
      });
    }

    const result = safeOrder(order, req.user._id);

    // Only participants in a booking may see its
    // contact and delivery details.
    const privateOrder = await RentalOrder.findById(
      order._id
    ).select("+phone +deliveryAddress");

    if (privateOrder) {
      result.phone = privateOrder.phone;
      result.deliveryAddress =
        privateOrder.deliveryAddress;
    }

    return res.json({
      success: true,
      order: result,
    });
  } catch (error) {
    return sendError(res, error);
  }
});

// UPDATE RENTAL BOOKING STATUS
router.patch("/:id/status", async (req, res) => {
  try {
    if (!validId(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid rental order ID.",
      });
    }

    const { status } = req.body || {};

    if (!VALID_STATUSES.includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Invalid rental status.",
      });
    }

    const existing = await RentalOrder.findOne({
      _id: req.params.id,
      ...orderFilterForUser(req.user),
    });

    if (!existing) {
      return res.status(404).json({
        success: false,
        message: "Rental order not found.",
      });
    }

    const isOwner =
      String(existing.owner) === String(req.user._id);

    const isRenter =
      String(existing.renter) === String(req.user._id);

    const allowedTransitions = {
      Requested: {
        owner: ["Confirmed", "Rejected"],
        renter: ["Cancelled"],
      },
      Confirmed: {
        owner: ["Active"],
        renter: [],
      },
      Active: {
        owner: ["Completed"],
        renter: [],
      },
      Completed: {
        owner: [],
        renter: [],
      },
      Rejected: {
        owner: [],
        renter: [],
      },
      Cancelled: {
        owner: [],
        renter: [],
      },
    };

    const allowed =
      (isOwner &&
        allowedTransitions[existing.status]?.owner.includes(
          status
        )) ||
      (isRenter &&
        allowedTransitions[existing.status]?.renter.includes(
          status
        ));

    if (!allowed) {
      return res.status(403).json({
        success: false,
        message:
          "You cannot perform this rental status change.",
      });
    }

    if (status === "Confirmed") {
      const equipment = await RentalEquipment.findOne({
        _id: existing.equipment,
        owner: req.user._id,
        isPublished: true,
        availabilityStatus: "Available",
      });

      if (!equipment) {
        return res.status(409).json({
          success: false,
          message: "Equipment is currently unavailable.",
        });
      }

      const conflict = await hasDateConflict(
        existing.equipment,
        existing.startDate,
        existing.endDate,
        existing._id
      );

      if (conflict) {
        return res.status(409).json({
          success: false,
          message:
            "Another booking is confirmed for these dates.",
        });
      }
    }

    // Status must still be the expected previous value.
    // Prevents two updates of the same order overwriting
    // each other.
    const order = await RentalOrder.findOneAndUpdate(
      {
        _id: existing._id,
        status: existing.status,
        ...(isOwner
          ? { owner: req.user._id }
          : { renter: req.user._id }),
      },
      {
        $set: { status },
      },
      {
        new: true,
        runValidators: true,
      }
    );

    if (!order) {
      return res.status(409).json({
        success: false,
        message:
          "Booking changed. Please reopen the order.",
      });
    }

    return res.json({
      success: true,
      message: `Rental order marked as ${status}.`,
      order: safeOrder(order, req.user._id),
    });
  } catch (error) {
    return sendError(res, error);
  }
});

module.exports = router;
