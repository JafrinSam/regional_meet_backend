const mongoose = require("mongoose");

const registerEventSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  event: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Event",
    required: true,
  },
  attended: { type: Boolean, default: false },

  // The specific moment the current record was registered/updated
  registeredAt: { type: Date, default: Date.now },
});

// 1. COMPOUND UNIQUE INDEX:
// This index enforces that the combination of 'user' and 'eventDate' must be unique.
// This preserves the one-document-per-day rule.
registerEventSchema.index({ user: 1, event: 1 }, { unique: true });

module.exports = mongoose.model("RegisteredEvent", registerEventSchema);

