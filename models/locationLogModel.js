// models/locationLogModel.js
const mongoose = require("mongoose");

const LocationLogSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  latitude: { type: Number, required: true },
  longitude: { type: Number, required: true },
  loggedAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("LocationLog", LocationLogSchema);
