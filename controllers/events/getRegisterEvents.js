const RegisteredEvent = require("../../models/registeredEventsModel");
const Event = require("../../models/eventModel");

const getRegisteredEvents = async (req, res) => {
  try {
    const userId = req.user.id;

    // 1. Find all event locations the user is registered for
    const registeredEventLocations = await RegisteredEvent.find({ user: userId }).select("event");

    if (!registeredEventLocations || registeredEventLocations.length === 0) {
      return res.status(200).json([]);
    }

    // 2. Extract the location IDs
    const locationIds = registeredEventLocations.map(reg => reg.event);

    // 3. Find all events that are in those locations
    const events = await Event.find({ location: { $in: locationIds } }).populate("location");

    res.status(200).json(events);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

module.exports = getRegisteredEvents;
