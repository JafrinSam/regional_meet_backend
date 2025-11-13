const Event = require("../../models/eventModel");

const unregisteredEvents = async (req, res) => {
  try {
    const { eventId } = req.params;
    const userId = req.body.userId;
    if (!eventId) {
      return res.status(400).json({ message: "Event ID is required." });
    }

    const updatedEvent = await Event.adminRegisterUser(eventId, userId);

    res.status(200).json({
      message: "Successfully Registered the user for the event.",
      event: updatedEvent,
    });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

module.exports = unregisteredEvents;
