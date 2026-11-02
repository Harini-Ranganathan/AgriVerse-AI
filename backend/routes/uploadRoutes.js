
const express = require("express");
const multer = require("multer");
const cloudinary = require("cloudinary").v2;

const { authenticate } = require("../middleware/authMiddleware");

const router = express.Router();

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const storage = multer.memoryStorage();

const upload = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024,
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = [
      "image/jpeg",
      "image/png",
      "image/webp",
    ];

    if (!allowedTypes.includes(file.mimetype)) {
      return cb(
        new Error("Only JPG, PNG and WEBP images are allowed.")
      );
    }

    cb(null, true);
  },
});

function allowImageUpload(req, res, next) {
  const role = String(req.user?.role || "")
    .trim()
    .toLowerCase();

  if (!["farmer", "buyer"].includes(role)) {
    return res.status(403).json({
      success: false,
      message:
        "Only farmers and buyers can upload images.",
    });
  }

  next();
}

function handleUpload(req, res, next) {
  upload.single("image")(req, res, (error) => {
    if (!error) return next();

    return res.status(400).json({
      success: false,
      message: error.message || "Invalid image upload.",
    });
  });
}

router.post(
  "/image",
  authenticate,
  allowImageUpload,
  handleUpload,
  async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: "Please select an image.",
        });
      }

      const result = await new Promise(
        (resolve, reject) => {
          const stream = cloudinary.uploader.upload_stream(
            {
              folder: "agriverse/products",
              resource_type: "image",
            },
            (error, uploaded) => {
              if (error) {
                reject(error);
              } else {
                resolve(uploaded);
              }
            }
          );

          stream.end(req.file.buffer);
        }
      );

      return res.status(200).json({
        success: true,
        message: "Image uploaded successfully.",
        imageUrl: result.secure_url,
        url: result.secure_url,
        publicId: result.public_id,
      });
    } catch (error) {
      console.error("Image upload error:", error);

      return res.status(500).json({
        success: false,
        message: "Unable to upload image.",
      });
    }
  }
);

module.exports = router;
