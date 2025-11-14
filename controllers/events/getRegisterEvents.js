const RegisteredEvent = require("../../models/registeredEventsModel");
const Event = require("../../models/eventModel");

const getRegisteredEvents = async (req, res) => {
  try {
    const userId = req.user._id;

    // 1. Find all event locations the user is registered for
    const registeredEventLocations = await RegisteredEvent.find({
      user: userId,
    }).select("event");

    if (!registeredEventLocations || registeredEventLocations.length === 0) {
      return res.status(200).json([]);
    }
    console.log(registeredEventLocations);

    // 2. Extract the location IDs
    const eventIds = registeredEventLocations.map((reg) => reg.event);

    // 3. Find all events that are in those locations
    const events = await Event.find({
      _id: { $in: eventIds },
    })
      .populate("location")
      .select(
        "-createdAt -updatedAt -__v -createdBy -attendees -registrations"
      );

    return res.status(200).json({
      success: true,
      message: "Events fetched successfully.",
      events: events,
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

module.exports = getRegisteredEvents;
