// controllers/getallEventDetails.js

const RegisteredLocation = require("../../models/registeredLocationModel");
// Assuming you have an EventLocation model to populate details
// const EventLocation = require('../models/eventLocationModel');

/**
 * Fetches the complete schedule for the authenticated user.
 * * The schedule includes all registered locations across all dates,
 * ordered by the most recent date.
 */
const getRegisteredLocations = async (req, res) => {
  // 1. Get the user ID attached by the authMiddleware
  const userId = req.user.id;

  try {
    // 2. Query the database for all registered locations for this user.
    // The 'RegisteredLocation' documents represent the user's schedule entries.
    const schedule = await RegisteredLocation.find({ user: userId })
      // 3. Populate the actual event details (name, address, etc.)
      .populate("eventLocation")
      // 4. Sort the schedule entries by date, newest first
      .sort({ eventDate: -1 })
      // 5. Select only the necessary fields
      .select("eventLocation registeredAt eventDate history status");

    if (!schedule || schedule.length === 0) {
      return res.status(200).json({
        success: true,
        message: "No events found in your registered schedule.",
        schedule: [],
      });
    }
    console.log({
      success: true,
      message: "Schedule fetched successfully.",
      schedule: schedule,
    });

    // 6. Return the fully populated schedule
    return res.status(200).json({
      success: true,
      message: "Schedule fetched successfully.",
      schedule: schedule,
    });
  } catch (error) {
    console.error("Error fetching user schedule:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to retrieve schedule due to a server error.",
    });
  }
};

module.exports = { getRegisteredLocations };
