
const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      minlength: 3,
      maxlength: 50,
    },

    password: {
      type: String,
      required: true,
    },

    role: {
      type: String,
      enum: ["farmer", "buyer", "admin"],
      required: true,
      default: "farmer",
    },

    status: {
      type: String,
      enum: ["active", "suspended", "deactivated"],
      default: "active",
    },

    lastLogin: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Only one document can have role "admin".
// Farmers and buyers are not affected.
userSchema.index(
  { role: 1 },
  {
    unique: true,
    partialFilterExpression: {
      role: "admin",
    },
    name: "single_administrator",
  }
);

userSchema.methods.toJSON = function () {
  const user = this.toObject();

  delete user.password;
  delete user.__v;

  return user;
};

module.exports =
  mongoose.models.User ||
  mongoose.model("User", userSchema);
