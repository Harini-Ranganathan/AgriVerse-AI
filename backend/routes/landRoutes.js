
const express = require("express");
const mongoose = require("mongoose");
const Land = require("../models/Land");
const { authenticate, authorize } = require("../middleware/authMiddleware");

const router = express.Router();
router.use(authenticate);
router.use(authorize("farmer"));

const allowedFields = [
  "name", "landName", "crop", "soilType", "area", "location",
  "latitude", "longitude", "irrigation", "sowingDate", "image",
];

function validateLand(data) {
  if (!data || typeof data !== "object" || Array.isArray(data)) return null;
  const fields = Object.keys(data);
  if (fields.some((field) => !allowedFields.includes(field))) return null;

  const land = {};
  for (const field of allowedFields) {
    if (data[field] === undefined) continue;
    if (typeof data[field] !== "string") return null;
    const maxLength = field === "image" ? 2048 : 500;
    const value = data[field].trim();
    if (value.length > maxLength) return null;
    if (field === "landName") land.name = value;
    else land[field] = value;
  }

  if (land.name !== undefined && (!land.name || land.name.length > 200)) return null;
  for (const field of ["crop", "soilType", "irrigation"]) {
    if (land[field] && land[field].length > 200) return null;
  }
  if (land.area && land.area.length > 100) return null;

  for (const [field, min, max] of [
    ["latitude", -90, 90], ["longitude", -180, 180],
  ]) {
    if (land[field] && (!Number.isFinite(Number(land[field])) ||
      Number(land[field]) < min || Number(land[field]) > max)) return null;
  }
  if (land.sowingDate) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(land.sowingDate)) return null;
    const date = new Date(`${land.sowingDate}T00:00:00.000Z`);
    if (Number.isNaN(date.getTime()) || date.toISOString().slice(0, 10) !== land.sowingDate) return null;
  }
  if (land.image && !/^https:\/\/[^\s]+$/i.test(land.image)) return null;
  return land;
}

router.post("/add", async (req, res) => {
  try {
    const landData = validateLand(req.body);
    if (!landData) return res.status(400).json({ success: false, message: "Invalid land details" });
    const newLand = await Land.create({ ...landData, owner: req.user._id });
    return res.status(201).json({ success: true, land: newLand });
  } catch (error) {
    console.error("Add land failed:", error.message);
    return res.status(500).json({ success: false, message: "Unable to add land" });
  }
});

router.get("/", async (req, res) => {
  try {
    const lands = await Land.find({ owner: req.user._id }).sort({ createdAt: -1 });
    return res.status(200).json(lands);
  } catch (error) {
    console.error("Fetch lands failed:", error.message);
    return res.status(500).json({ success: false, message: "Unable to fetch lands" });
  }
});

router.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.isValidObjectId(id)) return res.status(400).json({ success: false, message: "Invalid land ID" });
    const land = await Land.findOne({ _id: id, owner: req.user._id });
    if (!land) return res.status(404).json({ success: false, message: "Land not found" });
    return res.status(200).json(land);
  } catch (error) {
    console.error("Fetch land failed:", error.message);
    return res.status(500).json({ success: false, message: "Unable to fetch land" });
  }
});

router.put("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.isValidObjectId(id)) return res.status(400).json({ success: false, message: "Invalid land ID" });
    const updates = validateLand(req.body);
    if (!updates || Object.keys(updates).length === 0) {
      return res.status(400).json({ success: false, message: "Invalid land details" });
    }
    const land = await Land.findOneAndUpdate(
      { _id: id, owner: req.user._id },
      { $set: updates },
      { new: true, runValidators: true }
    );
    if (!land) return res.status(404).json({ success: false, message: "Land not found" });
    return res.status(200).json({ success: true, land });
  } catch (error) {
    if (error.name === "ValidationError") return res.status(400).json({ success: false, message: "Invalid land details" });
    console.error("Update land failed:", error.message);
    return res.status(500).json({ success: false, message: "Unable to update land" });
  }
});

router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.isValidObjectId(id)) return res.status(400).json({ success: false, message: "Invalid land ID" });
    const deletedLand = await Land.findOneAndDelete({ _id: id, owner: req.user._id });
    if (!deletedLand) return res.status(404).json({ success: false, message: "Land not found or access denied" });
    return res.status(200).json({ success: true, message: "Land deleted successfully" });
  } catch (error) {
    console.error("Delete land failed:", error.message);
    return res.status(500).json({ success: false, message: "Unable to delete land" });
  }
});

module.exports = router;
