const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    fullname: { type: String, required: true },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      match: [
        /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
        "Please enter a valid email address",
      ],
    },
    password: { type: String, required: true, minlength: 6 },
    avatar: { type: String, default: "" },
    role: {
      type: String,
      enum: [
        "user",
        "admin",
        "superadmin",
        "jurry",
        "organiser",
        "host",
        "supervisor",
      ],
      default: "user",
    },
    subrole: {
      type: String,

      default: "",
      enum: ["", "faculty", "poster", "vistor", "exhibitor"],
    },
    host: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Host",
      default: null,
    },
    isVerified: { type: Boolean, default: false },
    expoPushToken: { type: String, default: "" },
    expoPlatform: { type: String, default: "" }, // 🆕 Android / iOS / web
  },
  { timestamps: true }
);

module.exports = mongoose.models.User || mongoose.model("User", userSchema);
