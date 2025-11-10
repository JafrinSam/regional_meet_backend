// File: routes/locationRoutes.js (assuming file name)

const express = require("express");
const authMiddleware = require("../middleware/authMiddleware");

// --- FIX 1: Import all controllers at the top ---
const {
  getRegisteredLocations,
} = require("../controllers/locations/getRegisteredLocations");
const {
  registerOrUpdateLocation,
} = require("../controllers/locations/register_updateLocation");

// --- FIX 2: Import your new controller function ---
const {
  getAllLocationInfo,
} = require("../controllers/locations/getallLocationInfo"); // Corrected path

const router = express.Router();

// --- FIX 3: Use the imported function variable ---
router.get(
  "/map-info",
  authMiddleware(),
  getAllLocationInfo // <-- Use the function here
);

// Other routes
router.get("/getregisteredlocations", authMiddleware(), getRegisteredLocations);
router.post("/registerLocation", authMiddleware(), registerOrUpdateLocation);

module.exports = router;
