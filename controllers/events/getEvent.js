// controllers/getEventevent.js

// Import the necessary models
const Event = require("../../models/eventModel"); // Assuming you change the export method of eventModel

/**
 * Fetches the complete event (list of events) for the authenticated user
 * based on their presence in the Event model's 'attendees' array.
 * * @param {Object} req - Express request object (must contain req.user.id)
 * @param {Object} res - Express response object
 */
const getEvent = async (req, res) => {
  // The user ID is attached to the request by the authMiddleware.
  // NOTE: Changed from req.user.id to req.user._id, which is standard Mongoose practice.
  const userId = req.user._id;

  try {
    // 1. Query the database for all events where the user ID exists in the 'attendees' array.
    const event = await Event.find({ attendees: userId })
      // 2. Populate the location details for the event
      .populate("location")
      // 3. Sort the events by date, newest first
      .sort({ date: 1 })
      // 4. Select only the necessary fields
      .select("name date location category description speakers attendees");

    if (!event || event.length === 0) {
      return res.status(200).json({
        success: true,
        message: "There are no upcoming events.",
        event: [],
      });
    }
    console.log({
      success: true,
      message: "Event event fetched successfully.",
      event: event,
    });

    // 5. Return the fully populated event
    return res.status(200).json({
      success: true,
      message: "Event event fetched successfully.",
      schedul,
    });
  } catch (error) {
    console.error("Error fetching user event event:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to retrieve event due to a server error.",
    });
  }
};

module.exports = { getEvent };
