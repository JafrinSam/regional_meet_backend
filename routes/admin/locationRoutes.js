const express = require("express");
const router = express.Router();
const EventLocation = require("../../models/eventLocations");

router.post("/add-location", async (req, res) => {
  try {
    const { name, address, city, state, country, latitude, longitude } =
      req.body;

    const newLocation = await EventLocation.create({
      name,
      address,
      city,
      state,
      country,
      location: { type: "Point", coordinates: [longitude, latitude] },
    });

    res.status(201).json({
      message: "Event location added successfully",
      data: newLocation,
    });
  } catch (error) {
    console.error("Add location error:", error);
    res.status(500).json({ message: "Server error while adding location" });
  }
});

module.exports = router;
