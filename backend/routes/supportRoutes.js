
const express = require("express");
const mongoose = require("mongoose");

const SupportTicket = require("../models/SupportTicket");

const {
  authenticate,
  authorize,
} = require("../middleware/authMiddleware");

const router = express.Router();

router.use(authenticate);

const categories = [
  "Account",
  "Products",
  "Rental Equipment",
  "Land Marketplace",
  "Subscriptions",
  "Payments",
  "Other",
];

function fail(res, error) {
  console.error("Support API:", error);

  return res.status(500).json({
    success: false,
    message: "Support request failed.",
  });
}

function validText(value, max) {
  return (
    typeof value === "string" &&
    value.trim().length > 0 &&
    value.length <= max
  );
}

// FARMER/BUYER: CREATE TICKET

router.post(
  "/tickets",
  authorize("farmer", "buyer"),
  async (req, res) => {
    try {
      const { subject, category, message } = req.body || {};

      if (
        !validText(subject, 150) ||
        !validText(message, 3000) ||
        !categories.includes(category)
      ) {
        return res.status(400).json({
          success: false,
          message: "Enter a valid subject, category and message.",
        });
      }

      const ticket = await SupportTicket.create({
        user: req.user._id,
        subject: subject.trim(),
        category,
        message: message.trim(),
      });

      return res.status(201).json({
        success: true,
        message: "Help request submitted successfully.",
        ticket,
      });
    } catch (error) {
      return fail(res, error);
    }
  }
);

// FARMER/BUYER: VIEW OWN TICKETS

router.get(
  "/tickets/mine",
  authorize("farmer", "buyer"),
  async (req, res) => {
    try {
      const tickets = await SupportTicket.find({
        user: req.user._id,
      })
        .sort({ createdAt: -1 })
        .limit(100)
        .lean();

      return res.json({
        success: true,
        tickets,
      });
    } catch (error) {
      return fail(res, error);
    }
  }
);

// ADMIN: VIEW ALL TICKETS

router.get(
  "/admin/tickets",
  authorize("admin"),
  async (req, res) => {
    try {
      const tickets = await SupportTicket.find()
        .populate("user", "username role status")
        .sort({ updatedAt: -1 })
        .limit(200)
        .lean();

      return res.json({
        success: true,
        tickets,
      });
    } catch (error) {
      return fail(res, error);
    }
  }
);

// ADMIN: SEND REPLY

router.post(
  "/admin/tickets/:id/reply",
  authorize("admin"),
  async (req, res) => {
    try {
      if (!mongoose.isValidObjectId(req.params.id)) {
        return res.status(400).json({
          success: false,
          message: "Invalid ticket ID.",
        });
      }

      const message = req.body?.message;

      if (!validText(message, 3000)) {
        return res.status(400).json({
          success: false,
          message: "Enter a valid reply.",
        });
      }

      const ticket = await SupportTicket.findByIdAndUpdate(
        req.params.id,
        {
          $push: {
            replies: {
              message: message.trim(),
              senderRole: "admin",
              sender: req.user._id,
            },
          },
          $set: {
            status: "In Progress",
          },
        },
        { new: true, runValidators: true }
      );

      if (!ticket) {
        return res.status(404).json({
          success: false,
          message: "Ticket not found.",
        });
      }

      return res.json({
        success: true,
        message: "Reply sent successfully.",
        ticket,
      });
    } catch (error) {
      return fail(res, error);
    }
  }
);

// ADMIN: CHANGE TICKET STATUS

router.patch(
  "/admin/tickets/:id/status",
  authorize("admin"),
  async (req, res) => {
    try {
      if (!mongoose.isValidObjectId(req.params.id)) {
        return res.status(400).json({
          success: false,
          message: "Invalid ticket ID.",
        });
      }

      const { status } = req.body || {};

      if (!["Open", "In Progress", "Resolved"].includes(status)) {
        return res.status(400).json({
          success: false,
          message: "Invalid status.",
        });
      }

      const ticket = await SupportTicket.findByIdAndUpdate(
        req.params.id,
        { $set: { status } },
        { new: true, runValidators: true }
      );

      if (!ticket) {
        return res.status(404).json({
          success: false,
          message: "Ticket not found.",
        });
      }

      return res.json({
        success: true,
        message: "Ticket status updated.",
        ticket,
      });
    } catch (error) {
      return fail(res, error);
    }
  }
);

module.exports = router;
