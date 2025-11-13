// Example in your registerForEvents.js

const registeredEvents = require("../models/registeredregisteredEventssModel");

exports.registerForregisteredEvents = async (req, res) => {
  try {
    const { registeredEventsId } = req.params;
    const userId = req.user.id; // Assuming you have user auth

    // The 'registerUser' method handles all logic
    const updatedregisteredEvents = await registeredEvents.registerUser(
      registeredEventsId,
      userId
    );

    res.status(200).json({
      success: true,
      message: "Successfully registered for the registeredEvents!",
      data: updatedregisteredEvents,
    });
  } catch (error) {
    // This will catch errors from 'registerUser' (e.g., "registeredEvents is full.")
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};
