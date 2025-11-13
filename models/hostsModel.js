const mongoose = require("mongoose");

const hostSchema = new mongoose.Schema(
  {
    // Organisation Basics
    name: {
      type: String,
      required: true,
      trim: true,
    },
    legalName: {
      type: String,
      trim: true,
      default: "",
    },
    type: {
      type: String, // college, company, ngo, startup, govt, etc.
      trim: true,
      default: "",
    },
    address: {
      type: String,
      trim: true,
      default: "",
    },
    logo: {
      type: String, // URL or file path
      default: "",
    },

    // Organisation Contact Info
    contact: {
      personName: { type: String, trim: true, default: "" },
      role: { type: String, trim: true, default: "" },
      email: {
        type: String,
        trim: true,
        match: [/^[^\s@]+@[^\s@]+\.[^\s@]+$/, "Invalid email"],
        default: "",
      },
      phone: { type: String, trim: true, default: "" },
    },

    // Organisation Address
    address: {
      line1: { type: String, trim: true, default: "" },
      line2: { type: String, trim: true, default: "" },
      city: { type: String, trim: true, default: "" },
      state: { type: String, trim: true, default: "" },
      postalCode: { type: String, trim: true, default: "" },
      country: { type: String, trim: true, default: "" },
    },

    // Legal / Verification Details
    registrationNumber: {
      type: String,
      trim: true,
      default: "",
    }, // GSTIN / CIN / NGO Reg Number
    taxId: {
      type: String,
      trim: true,
      default: "",
    },
    documents: [
      {
        name: { type: String, trim: true },
        fileUrl: { type: String, trim: true },
        uploadedAt: { type: Date, default: Date.now },
      },
    ],

    isVerified: {
      type: Boolean,
      default: false, // Verified by Admin
    },

    // Events Hosted by This Organisation
    hostedEvents: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Event",
      },
    ],

    // Optional: Which users belong to this host/org
    members: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
  },
  { timestamps: true }
);

module.exports = mongoose.models.Host || mongoose.model("Host", hostSchema);
