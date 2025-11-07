const mongoose = require("mongoose");

const eventLocationSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true, // e.g. "Tech Conference Hall"
    },
    address: {
      type: String,
      required: true, // e.g. "123 Main St, Trichy, India"
    },
    city: {
      type: String,
      required: true,
    },
    state: {
      type: String,
      required: true,
    },
    country: {
      type: String,
      required: true,
      default: "India",
    },
    location: {
      type: {
        type: String,
        enum: ["Point"],
        required: true,
        default: "Point",
      },
      coordinates: {
        type: [Number], // [longitude, latitude]
        required: true,
      },
    },
  },
  { timestamps: true }
);

// Create a geospatial index for location-based queries
eventLocationSchema.index({ location: "2dsphere" });

module.exports = mongoose.models.EventLocation || mongoose.model("EventLocation", eventLocationSchema);
