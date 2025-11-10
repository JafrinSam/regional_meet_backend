const mongoose = require("mongoose");

// Define a separate schema for location changes/history within a single day
const LocationHistorySchema = new mongoose.Schema(
  {
    eventLocation: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "EventLocation",
      required: true,
    },
    // The specific time of the update/change
    changedAt: { type: Date, default: Date.now },
    // Reason for the change (e.g., 'SCHEDULE_UPDATE', 'USER_MOVED')
    changeReason: { type: String, trim: true },
  },
  { _id: false }
); // Do not create an ID for sub-documents

const registerLocationSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  // Field for the current or last known location for the day
  eventLocation: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "EventLocation",
    required: true,
  },
  // Array to track historical location changes within the day
  history: [LocationHistorySchema],

  // Current status of this registration:
  // 'ACTIVE' (currently in this location/last recorded location)
  // 'INACTIVE' (registration was overwritten by a newer one, but kept for audit)
  status: {
    type: String,
    enum: ["ACTIVE", "INACTIVE"],
    default: "ACTIVE",
    required: true,
  },

  // The specific date being tracked (normalized to midnight)
  eventDate: {
    type: Date,
    required: true,
    set: (date) => {
      if (date) {
        const d = new Date(date);
        d.setHours(0, 0, 0, 0);
        return d;
      }
      return date;
    },
  },

  // The specific moment the current record was registered/updated
  registeredAt: { type: Date, default: Date.now },
});

// 1. COMPOUND UNIQUE INDEX:
// This index enforces that the combination of 'user' and 'eventDate' must be unique.
// This preserves the one-document-per-day rule.
registerLocationSchema.index({ user: 1, eventDate: 1 }, { unique: true });

module.exports = mongoose.model("RegisteredLocation", registerLocationSchema);
