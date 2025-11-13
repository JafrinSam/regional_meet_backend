const Event = require("../../models/eventModel");

const registerForEvent = async (req, res) => {
  try {
    const { eventId } = req.params;
    const userId = req.user._id;

    if (!eventId) {
      return res.status(400).json({ message: "Event ID is required." });
    }

    const updatedEvent = await Event.registerUser(eventId, userId);

    res.status(200).json({
      message: "Successfully registered for the event.",
      event: updatedEvent,
    });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

module.exports = registerForEvent;
