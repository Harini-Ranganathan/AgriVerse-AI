
const express = require("express");
const mongoose = require("mongoose");

const MarketplaceLand = require("../models/MarketplaceLand");
const LandDemoAccess = require("../models/LandDemoAccess");

const {
  authenticate,
} = require("../middleware/authMiddleware");

const router = express.Router();

const isId = mongoose.isValidObjectId;

const userRole = (req) =>
  String(req.user?.role || "").trim().toLowerCase();

const isUser = (req) =>
  ["buyer", "farmer"].includes(userRole(req));

const uid = (req) => String(req.user?._id || "");

function owns(land, req) {
  const ids = [
    land.seller,
    land.owner,
    land.createdBy,
  ]
    .filter(Boolean)
    .map(String);

  if (ids.length) {
    return ids.includes(uid(req));
  }

  return Boolean(
    land.sellerUsername &&
    req.user?.username &&
    land.sellerUsername === req.user.username
  );
}

function publicData(land, reveal = false, owner = false) {
  const obj =
    typeof land.toObject === "function"
      ? land.toObject()
      : { ...land };

  if (!reveal) {
    delete obj.sellerPhone;
    delete obj.sellerName;
  }

  if (!owner) {
    delete obj.buyerRequests;
    delete obj.unreadBuyerCount;
  }

  return {
    ...obj,
    contactUnlocked: Boolean(reveal),
    isOwner: Boolean(owner),
  };
}

async function permittedContact(req, land) {
  if (!req.user) {
    return false;
  }

  if (
    userRole(req) === "farmer" ||
    owns(land, req)
  ) {
    return true;
  }

  if (userRole(req) !== "buyer") {
    return false;
  }

  const access = await LandDemoAccess.findOne({
    buyer: req.user._id,
  }).lean();

  if (!access) {
    return false;
  }

  const subscriptionActive = Boolean(
    access.subscriptionExpiresAt &&
    new Date(
      access.subscriptionExpiresAt
    ).getTime() > Date.now()
  );

  const individualUnlock = (
    access.unlockedLands || []
  ).some(
    (id) => String(id) === String(land._id)
  );

  return subscriptionActive || individualUnlock;
}

function guard(req, res, next) {
  if (!isUser(req)) {
    return res.status(403).json({
      success: false,
      message: "Access denied",
    });
  }

  next();
}

function error(res, err) {
  console.error("Marketplace lands:", err);

  return res.status(500).json({
    success: false,
    message: "Unable to process land request.",
  });
}

function fields(body) {
  const allowed = [
    "title",
    "location",
    "city",
    "state",
    "area",
    "price",
    "water",
    "soil",
    "description",
    "sellerName",
    "sellerPhone",
    "landType",
    "irrigationType",
    "previousCrops",
    "roadAccess",
    "electricity",
    "image",
    "images",
    "isPublished",
  ];

  const obj = {};

  for (const key of allowed) {
    if (
      Object.prototype.hasOwnProperty.call(
        body || {},
        key
      )
    ) {
      obj[key] = body[key];
    }
  }

  if (obj.price !== undefined) {
    obj.price = String(obj.price);
  }

  if (obj.images !== undefined) {
    obj.images = Array.isArray(obj.images)
      ? obj.images.filter(
          (value) => typeof value === "string"
        )
      : [];
  }

  return obj;
}

/* ==================================================
   SUBSCRIPTION STATUS
================================================== */

router.get(
  "/access/me",
  authenticate,
  guard,
  async (req, res) => {
    try {
      const access = await LandDemoAccess.findOne({
        buyer: req.user._id,
      }).lean();

      const active =
        userRole(req) === "buyer" &&
        Boolean(
          access?.subscriptionExpiresAt &&
          new Date(
            access.subscriptionExpiresAt
          ).getTime() > Date.now()
        );

      return res.json({
        success: true,
        role: userRole(req),
        subscriptionActive: active,
        expiresAt: active
          ? access.subscriptionExpiresAt
          : null,
        unlockedLandIds: (
          access?.unlockedLands || []
        ).map(String),
      });
    } catch (err) {
      return error(res, err);
    }
  }
);

/* ==================================================
   ₹500 DEMO SUBSCRIPTION - 30 DAYS
================================================== */

router.post(
  "/access/demo-subscribe",
  authenticate,
  guard,
  async (req, res) => {
    if (userRole(req) !== "buyer") {
      return res.status(403).json({
        success: false,
        message: "Only buyers need subscriptions.",
      });
    }

    try {
      const access = await LandDemoAccess.findOne({
        buyer: req.user._id,
      });

      if (
        access?.subscriptionExpiresAt &&
        new Date(
          access.subscriptionExpiresAt
        ).getTime() > Date.now()
      ) {
        return res.status(409).json({
          success: false,
          message: "Subscription is already active.",
          expiresAt: access.subscriptionExpiresAt,
        });
      }

      const expiresAt = new Date(
        Date.now() + 30 * 24 * 60 * 60 * 1000
      );

      await LandDemoAccess.findOneAndUpdate(
        {
          buyer: req.user._id,
        },
        {
          $set: {
            subscriptionExpiresAt: expiresAt,
          },
        },
        {
          upsert: true,
          new: true,
          setDefaultsOnInsert: true,
        }
      );

      return res.json({
        success: true,
        demo: true,
        amount: 500,
        subscriptionActive: true,
        expiresAt,
      });
    } catch (err) {
      return error(res, err);
    }
  }
);

/* ==================================================
   ₹50 INDIVIDUAL LAND UNLOCK
================================================== */

router.post(
  "/:id/access/demo-unlock",
  authenticate,
  guard,
  async (req, res) => {
    if (userRole(req) !== "buyer") {
      return res.status(403).json({
        success: false,
        message: "Only buyers need paid access.",
      });
    }

    if (!isId(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid land ID.",
      });
    }

    try {
      const land = await MarketplaceLand.findById(
        req.params.id
      );

      if (!land || land.isPublished === false) {
        return res.status(404).json({
          success: false,
          message: "Land not available.",
        });
      }

      if (owns(land, req)) {
        return res.json({
          success: true,
          alreadyUnlocked: true,
        });
      }

      if (await permittedContact(req, land)) {
        return res.json({
          success: true,
          alreadyUnlocked: true,
        });
      }

      await LandDemoAccess.findOneAndUpdate(
        {
          buyer: req.user._id,
        },
        {
          $addToSet: {
            unlockedLands: land._id,
          },
        },
        {
          upsert: true,
          new: true,
          setDefaultsOnInsert: true,
        }
      );

      return res.json({
        success: true,
        demo: true,
        amount: 50,
        landId: String(land._id),
      });
    } catch (err) {
      return error(res, err);
    }
  }
);

/* ==================================================
   MY OWN LAND LISTINGS
================================================== */

router.get(
  "/mine",
  authenticate,
  guard,
  async (req, res) => {
    try {
      const lands = await MarketplaceLand.find({
        $or: [
          { seller: req.user._id },
          { owner: req.user._id },
          { createdBy: req.user._id },
          { sellerUsername: req.user.username },
        ],
      })
        .sort({ createdAt: -1 })
        .lean();

      return res.json(
        lands
          .filter((land) => owns(land, req))
          .map((land) =>
            publicData(land, true, true)
          )
      );
    } catch (err) {
      return error(res, err);
    }
  }
);

/* ==================================================
   BUYER'S SENT LAND REQUESTS

   IMPORTANT:
   This route must appear before GET /:id.
================================================== */

router.get(
  "/buyer/requests",
  authenticate,
  guard,
  async (req, res) => {
    try {
      const lands = await MarketplaceLand.find({
        "buyerRequests.buyer": req.user._id,
      }).lean();

      const requests = [];

      for (const land of lands) {
        for (const request of land.buyerRequests || []) {
          if (
            String(request.buyer) !==
            String(req.user._id)
          ) {
            continue;
          }

          const image =
            land.image ||
            (Array.isArray(land.images)
              ? land.images[0] || ""
              : "");

          requests.push({
            landId: String(land._id),
            landTitle: land.title,
            landName: land.title,
            location: land.location,
            image,
            requestId: request.id,
            status: "Sent",
            buyerName: request.buyerName,
            buyerPhone: request.buyerPhone,
            buyerMessage: request.buyerMessage,
            createdAt: request.createdAt,

            request: {
              id: request.id,
              buyerName: request.buyerName,
              buyerPhone: request.buyerPhone,
              buyerMessage: request.buyerMessage,
              read: request.read,
              createdAt: request.createdAt,
            },
          });
        }
      }

      requests.sort(
        (a, b) =>
          new Date(b.createdAt || 0) -
          new Date(a.createdAt || 0)
      );

      return res.json({
        success: true,
        requests,
      });
    } catch (err) {
      console.error(
        "Error loading sent land requests:",
        err
      );

      return res.status(500).json({
        success: false,
        message: "Unable to load sent land requests.",
      });
    }
  }
);

/* ==================================================
   PUBLIC LAND MARKETPLACE
================================================== */

router.get("/", async (req, res) => {
  try {
    const lands = await MarketplaceLand.find({
      isPublished: { $ne: false },
    })
      .sort({ createdAt: -1 })
      .lean();

    return res.json(
      lands.map((land) =>
        publicData(land, false, false)
      )
    );
  } catch (err) {
    return error(res, err);
  }
});

/* ==================================================
   INDIVIDUAL LAND DETAILS

   Contact information is protected.
================================================== */

router.get("/:id", async (req, res) => {
  if (!isId(req.params.id)) {
    return res.status(400).json({
      success: false,
      message: "Invalid land ID.",
    });
  }

  try {
    const land = await MarketplaceLand.findById(
      req.params.id
    ).lean();

    if (!land) {
      return res.status(404).json({
        success: false,
        message: "Land not found.",
      });
    }

    if (
      land.isPublished === false &&
      !req.headers.authorization
    ) {
      return res.status(404).json({
        success: false,
        message: "Land not found.",
      });
    }

    if (!req.headers.authorization) {
      return res.json({
        success: true,
        land: publicData(land, false, false),
      });
    }

    return authenticate(
      req,
      res,
      async () => {
        try {
          const owner = owns(land, req);

          if (
            land.isPublished === false &&
            !owner
          ) {
            return res.status(404).json({
              success: false,
              message: "Land not found.",
            });
          }

          const unlocked = await permittedContact(
            req,
            land
          );

          return res.json({
            success: true,
            land: publicData(
              land,
              unlocked,
              owner
            ),
          });
        } catch (err) {
          return error(res, err);
        }
      }
    );
  } catch (err) {
    return error(res, err);
  }
});

/* ==================================================
   ADD LAND - FARMER AND BUYER
================================================== */

router.post(
  "/add",
  authenticate,
  guard,
  async (req, res) => {
    const data = fields(req.body);

    if (
      !String(data.title || "").trim() ||
      !String(data.location || "").trim()
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Valid title and location are required.",
      });
    }

    try {
      const land = await MarketplaceLand.create({
        ...data,
        seller: req.user._id,
        owner: req.user._id,
        sellerUsername: req.user.username,
        sellerName:
          data.sellerName ||
          req.user.name ||
          req.user.username,
      });

      return res.status(201).json({
        success: true,
        land: publicData(land, true, true),
      });
    } catch (err) {
      return error(res, err);
    }
  }
);

/* ==================================================
   EDIT OWN LAND
================================================== */

router.put(
  "/:id",
  authenticate,
  guard,
  async (req, res) => {
    if (!isId(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid land ID.",
      });
    }

    try {
      const land = await MarketplaceLand.findById(
        req.params.id
      );

      if (!land || !owns(land, req)) {
        return res.status(404).json({
          success: false,
          message:
            "Land not found or access denied.",
        });
      }

      Object.assign(land, fields(req.body));

      await land.save();

      return res.json({
        success: true,
        land: publicData(land, true, true),
      });
    } catch (err) {
      return error(res, err);
    }
  }
);

/* ==================================================
   SEND LAND VISIT REQUEST

   The buyer ID is saved in MongoDB,
   allowing sent requests to be retrieved.
================================================== */

router.post(
  "/:id/requests",
  authenticate,
  guard,
  async (req, res) => {
    if (!isId(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid land ID.",
      });
    }

    const buyerName = String(
      req.body?.buyerName ||
        req.user.username ||
        ""
    ).trim();

    const buyerPhone = String(
      req.body?.buyerPhone || ""
    ).trim();

    const buyerMessage = String(
      req.body?.buyerMessage || ""
    ).trim();

    if (
      buyerName.length < 2 ||
      !/^[+0-9()\s-]{7,30}$/.test(buyerPhone) ||
      !buyerMessage ||
      buyerMessage.length > 2000
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Enter a valid name, phone number and message.",
      });
    }

    try {
      const land = await MarketplaceLand.findById(
        req.params.id
      );

      if (
        !land ||
        land.isPublished === false
      ) {
        return res.status(404).json({
          success: false,
          message: "Land not available.",
        });
      }

      if (owns(land, req)) {
        return res.status(403).json({
          success: false,
          message:
            "Cannot request your own land.",
        });
      }

      const request = {
        id: Date.now(),
        buyer: req.user._id,
        buyerUsername: req.user.username,
        buyerName,
        buyerPhone,
        buyerMessage,
        read: false,
        createdAt: new Date(),
      };

      const result = await MarketplaceLand.updateOne(
        {
          _id: land._id,
          isPublished: { $ne: false },
        },
        {
          $push: {
            buyerRequests: request,
          },
          $inc: {
            unreadBuyerCount: 1,
          },
        }
      );

      if (!result.modifiedCount) {
        return res.status(409).json({
          success: false,
          message:
            "This land is no longer accepting requests.",
        });
      }

      return res.status(201).json({
        success: true,
        message:
          "Land visit request sent successfully.",
        requestId: request.id,
      });
    } catch (err) {
      return error(res, err);
    }
  }
);

/* ==================================================
   MARK RECEIVED REQUESTS AS READ

   The frontend calls this automatically when
   the landowner opens Received Land Requests.
================================================== */

router.patch(
  "/:id/mark-requests-read",
  authenticate,
  guard,
  async (req, res) => {
    if (!isId(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid land ID.",
      });
    }

    try {
      const land = await MarketplaceLand.findById(
        req.params.id
      );

      if (!land || !owns(land, req)) {
        return res.status(404).json({
          success: false,
          message:
            "Land not found or access denied.",
        });
      }

      land.buyerRequests.forEach((request) => {
        request.read = true;
      });

      land.unreadBuyerCount = 0;

      await land.save();

      return res.json({
        success: true,
        message: "Requests marked as read.",
      });
    } catch (err) {
      return error(res, err);
    }
  }
);

/* ==================================================
   DELETE RECEIVED LAND REQUEST
================================================== */

router.delete(
  "/:id/requests/:requestId",
  authenticate,
  guard,
  async (req, res) => {
    if (!isId(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid land ID.",
      });
    }

    try {
      const land = await MarketplaceLand.findById(
        req.params.id
      );

      if (!land || !owns(land, req)) {
        return res.status(404).json({
          success: false,
          message:
            "Land not found or access denied.",
        });
      }

      const existing = land.buyerRequests.find(
        (request) =>
          String(request.id) ===
          String(req.params.requestId)
      );

      if (!existing) {
        return res.status(404).json({
          success: false,
          message: "Request not found.",
        });
      }

      land.buyerRequests =
        land.buyerRequests.filter(
          (request) =>
            String(request.id) !==
            String(req.params.requestId)
        );

      land.unreadBuyerCount =
        land.buyerRequests.filter(
          (request) => !request.read
        ).length;

      await land.save();

      return res.json({
        success: true,
        message: "Request deleted successfully.",
      });
    } catch (err) {
      return error(res, err);
    }
  }
);

/* ==================================================
   DELETE OWN LAND

   Permanently remove individual ₹50 unlocks
   associated with the deleted listing.
================================================== */

router.delete(
  "/:id",
  authenticate,
  guard,
  async (req, res) => {
    if (!isId(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid land ID.",
      });
    }

    try {
      const land = await MarketplaceLand.findById(
        req.params.id
      );

      if (!land || !owns(land, req)) {
        return res.status(404).json({
          success: false,
          message:
            "Land not found or access denied.",
        });
      }

      await MarketplaceLand.deleteOne({
        _id: land._id,
      });

      await LandDemoAccess.updateMany(
        {},
        {
          $pull: {
            unlockedLands: land._id,
          },
        }
      );

      return res.json({
        success: true,
        message: "Land listing deleted successfully.",
      });
    } catch (err) {
      return error(res, err);
    }
  }
);

module.exports = router;
