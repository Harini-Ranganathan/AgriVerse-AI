
const path = require("path");

require("dotenv").config({
  path: path.join(__dirname, "../.env"),
});

const crypto = require("crypto");
const mongoose = require("mongoose");
const { promisify } = require("util");

const User = require("../models/User");

const scrypt = promisify(crypto.scrypt);

async function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString("hex");
  const key = await scrypt(password, salt, 64);

  return `scrypt$${salt}$${key.toString("hex")}`;
}

async function main() {
  const username = String(
    process.env.ADMIN_USERNAME || ""
  ).trim();

  const password = process.env.ADMIN_PASSWORD || "";

  const mongoURI =
    process.env.MONGO_URI ||
    process.env.MONGODB_URI;

  if (!mongoURI) {
    throw new Error(
      "Set MONGO_URI or MONGODB_URI in backend/.env"
    );
  }

  if (
    username.length < 3 ||
    username.length > 50
  ) {
    throw new Error(
      "ADMIN_USERNAME must contain 3 to 50 characters."
    );
  }

  if (
    password.length < 12 ||
    Buffer.byteLength(password, "utf8") > 128
  ) {
    throw new Error(
      "ADMIN_PASSWORD must contain 12 to 128 bytes."
    );
  }

  await mongoose.connect(mongoURI);

  // Ensure the single-admin unique index exists.
  await User.init();

  const existingAdmin = await User.findOne({
    role: "admin",
  });

  if (existingAdmin) {
    throw new Error(
      "An administrator already exists. Another admin cannot be created."
    );
  }

  const existingUsername = await User.exists({
    username,
  });

  if (existingUsername) {
    throw new Error(
      "This username is already registered."
    );
  }

  const hashedPassword = await hashPassword(password);

  await User.create({
    username,
    password: hashedPassword,
    role: "admin",
    status: "active",
  });

  console.log("Admin account created successfully.");
  console.log(`Admin username: ${username}`);
  console.log("Use the normal login page to sign in.");
}

main()
  .catch((error) => {
    console.error("Admin setup failed:", error.message);
    process.exitCode = 1;
  })
  .finally(async () => {
    await mongoose.disconnect();
  });
