
const express = require("express");
const crypto = require("crypto");
const jwt = require("jsonwebtoken");
const { promisify } = require("util");
const User = require("../models/User");

const router = express.Router();
const scrypt = promisify(crypto.scrypt);

const allowedRoles = ["farmer", "buyer"];

async function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString("hex");
  const key = await scrypt(password, salt, 64);

  return `scrypt$${salt}$${key.toString("hex")}`;
}

async function verifyPassword(password, storedPassword) {
  if (
    typeof password !== "string" ||
    typeof storedPassword !== "string"
  ) {
    return false;
  }

  if (!storedPassword.startsWith("scrypt$")) {
    return false;
  }

  const parts = storedPassword.split("$");

  if (parts.length !== 3) {
    return false;
  }

  const salt = parts[1];
  const hash = parts[2];

  if (
    !/^[a-f0-9]{32}$/i.test(salt) ||
    !/^[a-f0-9]{128}$/i.test(hash)
  ) {
    return false;
  }

  const storedKey = Buffer.from(hash, "hex");
  const derivedKey = await scrypt(password, salt, 64);

  return crypto.timingSafeEqual(storedKey, derivedKey);
}

function safeUser(user) {
  return {
    _id: user._id,
    username: user.username,
    role: user.role,
    status: user.status || "active",
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
}

function generateToken(user) {
  const secret = process.env.JWT_SECRET;

  if (!secret || Buffer.byteLength(secret, "utf8") < 32) {
    throw new Error("JWT_SECRET is missing or too short");
  }

  return jwt.sign(
    {},
    secret,
    {
      algorithm: "HS256",
      subject: user._id.toString(),
      issuer: "agriverse-ai",
      audience: "agriverse-users",
      expiresIn: "2h",
    }
  );
}

router.post("/register", async (req, res) => {
  try {
    const { username, password, role } = req.body || {};

    if (
      typeof username !== "string" ||
      typeof password !== "string" ||
      typeof role !== "string"
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid registration details",
      });
    }

    const cleanUsername = username.trim();

    if (
      cleanUsername.length < 3 ||
      cleanUsername.length > 50 ||
      password.length < 8 ||
      Buffer.byteLength(password, "utf8") > 128
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid username or password length",
      });
    }

    if (!allowedRoles.includes(role)) {
      return res.status(403).json({
        success: false,
        message: "Invalid registration role",
      });
    }

    if (
      !process.env.JWT_SECRET ||
      Buffer.byteLength(process.env.JWT_SECRET, "utf8") < 32
    ) {
      return res.status(503).json({
        success: false,
        message: "Authentication service unavailable",
      });
    }

    const existingUser = await User.findOne({
      username: cleanUsername,
    });

    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: "Username already exists",
      });
    }

    const hashedPassword = await hashPassword(password);

    const user = await User.create({
      username: cleanUsername,
      password: hashedPassword,
      role,
      status: "active",
    });

    const token = generateToken(user);

    return res.status(201).json({
      success: true,
      user: safeUser(user),
      token,
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: "Username already exists",
      });
    }

    console.error("Registration failed:", error.message);

    return res.status(500).json({
      success: false,
      message: "Registration failed",
    });
  }
});

router.post("/login", async (req, res) => {
  try {
    const { username, password } = req.body || {};

    if (
      typeof username !== "string" ||
      typeof password !== "string" ||
      !username.trim() ||
      username.trim().length > 50 ||
      !password ||
      Buffer.byteLength(password, "utf8") > 128
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid login details",
      });
    }

    if (
      !process.env.JWT_SECRET ||
      Buffer.byteLength(process.env.JWT_SECRET, "utf8") < 32
    ) {
      return res.status(503).json({
        success: false,
        message: "Authentication service unavailable",
      });
    }

    const user = await User.findOne({
      username: username.trim(),
    });

    if (!user || typeof user.password !== "string") {
      return res.status(401).json({
        success: false,
        message: "Invalid username or password",
      });
    }

    let isValid = false;
    let requiresMigration = false;

    if (user.password.startsWith("scrypt$")) {
      isValid = await verifyPassword(
        password,
        user.password
      );
    } else {
      const oldPassword = Buffer.from(
        user.password,
        "utf8"
      );

      const suppliedPassword = Buffer.from(
        password,
        "utf8"
      );

      isValid =
        oldPassword.length === suppliedPassword.length &&
        crypto.timingSafeEqual(
          oldPassword,
          suppliedPassword
        );

      requiresMigration = isValid;
    }

    if (!isValid) {
      return res.status(401).json({
        success: false,
        message: "Invalid username or password",
      });
    }

    if (user.status && user.status !== "active") {
      return res.status(403).json({
        success: false,
        message: "Account is not active",
      });
    }

    if (requiresMigration) {
      const newHash = await hashPassword(password);

      await User.updateOne(
        {
          _id: user._id,
          password: user.password,
        },
        {
          $set: {
            password: newHash,
          },
        }
      );
    }

    await User.updateOne(
      { _id: user._id },
      {
        $set: {
          lastLogin: new Date(),
        },
      }
    );

    const token = generateToken(user);

    return res.status(200).json({
      success: true,
      user: safeUser(user),
      token,
    });
  } catch (error) {
    console.error("Login failed:", error.message);

    return res.status(500).json({
      success: false,
      message: "Login failed",
    });
  }
});

module.exports = router;
