const RegisteredEvent = require("../../../models/registeredEventsModel");

const adminGetEventRegistrations = async (req, res) => {
  try {
    const { eventId } = req.params;

    const registrations = await RegisteredEvent.find({ event: eventId })
      .populate("user", "name email"); // Populate user's name and email

    if (!registrations) {
      return res.status(404).json({
        success: false,
        message: "No registrations found for this event",
      });
    }

    res.status(200).json({
      success: true,
      registrations,
    });
  } catch (error) {
    console.error("Error fetching event registrations:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

module.exports = adminGetEventRegistrations;
