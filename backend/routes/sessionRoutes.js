
const express = require("express");
const { authenticate } = require("../middleware/authMiddleware");

const router = express.Router();

router.get("/me", authenticate, (req, res) => {
  const user = req.user;

  return res.status(200).json({
    success: true,
    user: {
      _id: user._id,
      username: user.username,
      role: user.role,
      status: user.status || "active",
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
      lastLogin: user.lastLogin,
    },
  });
});

module.exports = router;
