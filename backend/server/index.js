
const path = require("path");

require("dotenv").config({
  path: path.join(__dirname, "../.env"),
});

const express = require("express");
const cors = require("cors");

const connectDB = require("../config/db");

const cropCalendarRoutes = require("../routes/cropCalendarRoutes");
const farmAgentRoutes = require("../routes/farmAgentRoutes");
const cropSuitabilityRoutes = require("../routes/cropSuitabilityRoutes");
const marketPriceRoutes = require("../routes/marketPriceRoutes");
const aiRoutes = require("../routes/aiRoutes");
const diseaseRoutes = require("../routes/diseaseRoutes");
const landRoutes = require("../routes/landRoutes");
const marketplaceLandRoutes = require("../routes/marketplaceLandRoutes");
const uploadRoutes = require("../routes/uploadRoutes");
const productListingRoutes = require("../routes/productListingRoutes");
const orderRoutes = require("../routes/orderRoutes");
const authRoutes = require("../routes/authRoutes");

const rentalEquipmentRoutes = require("../routes/rentalEquipmentRoutes");
const rentalOrderRoutes = require("../routes/rentalOrderRoutes");
const rentalCartRoutes = require("../routes/rentalCartRoutes");
const adminRoutes = require("../routes/adminRoutes");
const {
  authenticate,
} = require("../middleware/authMiddleware");
const supportRoutes = require("../routes/supportRoutes");
const app = express();
const PORT = process.env.PORT || 5000;

connectDB();

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.send("AgriVerse AI backend is running");
});

app.get("/api/session/me", authenticate, (req, res) => {
  res.json({
    success: true,
    user: {
      _id: req.user._id,
      username: req.user.username,
      role: req.user.role,
    },
  });
});

app.use("/api/crop-calendar", cropCalendarRoutes);
app.use("/api/farm-agent", farmAgentRoutes);
app.use("/api/crop-suitability", cropSuitabilityRoutes);
app.use("/api/market-prices", marketPriceRoutes);
app.use("/api/ai", aiRoutes);
app.use("/api/disease", diseaseRoutes);

app.use("/api/lands", landRoutes);
app.use("/api/marketplace-lands", marketplaceLandRoutes);

// Debug image-upload requests BEFORE the upload router.
app.use("/api/upload", (req, res, next) => {
  console.log("UPLOAD REQUEST REACHED BACKEND", {
    method: req.method,
    url: req.originalUrl,
    authorization: Boolean(req.headers.authorization),
  });

  next();
});

app.use("/api/upload", uploadRoutes);

app.use("/api/product-listings", productListingRoutes);
app.use("/api/orders", orderRoutes);

app.use("/api/rental-equipment", rentalEquipmentRoutes);
app.use("/api/rental-orders", rentalOrderRoutes);

app.use("/api/rental-cart", rentalCartRoutes);

app.use("/api/auth", authRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/support", supportRoutes);


app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
