const Event = require("../../../models/eventModel");

const adminGetAllEvents = async (req, res) => {
  try {
    const { location, host } = req.query;

    let filter = {};
    if (location) {
      filter.location = location;
    }
    if (host) {
      // This assumes 'host' is a field in your Event model that references the Host model.
      // This part of the filtering might need adjustment based on your exact schema.
      const eventsByHost = await Event.find({}).populate({
        path: 'host',
        match: { name: new RegExp(host, 'i') } // Case-insensitive search for host name
      });
      const eventIds = eventsByHost.filter(event => event.host).map(event => event._id);
      filter._id = { $in: eventIds };
    }

    const events = await Event.find(filter)
      .populate("location")
      .populate("host")
      .populate({
        path: "registrations",
        populate: {
          path: "user",
          select: "name email", // Select fields from user model
        },
      });

    res.status(200).json({
      success: true,
      events,
    });
  } catch (error) {
    console.error("Error fetching events for admin:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

module.exports = adminGetAllEvents;
