// controllers/getEventevent.js
// Import the necessary models
// Import the necessary models
const Event = require("../../models/eventModel"); // Path to your Event model

/**
 * Fetches ALL visible events and adds custom fields for the current user:
 * - `registered` (true/false)
 * - `remainingSeats` (number)
 *
 * @param {Object} req - Express request object (must contain req.user._id)
 * @param {Object} res - Express response object
 */
const getEvent = async (req, res, next) => {
  // Get the user ID from the authenticated request
  const userId = req.user._id;

  try {
    // 1. Query for ALL visible events
    const allEvents = await Event.find({ visible: true }) // Find all visible events
      // 2. Populate the referenced location details
      .populate("location")
      // 3. Sort the events by date (soonest first)
      .sort({ date: 1 })
      // 4. Select all fields needed, including 'registrations' for the check
      .select(
        "name date startTime endTime location category description speakers image visible maxseats registrations"
      );

    // 5. Handle case where there are no events in the system
    if (!allEvents || allEvents.length === 0) {
      return res.status(200).json({
        success: true,
        message: "No events found.",
        events: [],
      });
    }

    // 6. --- NEW: Format the response ---
    // Map over the results to add the new custom fields for the user
    const formattedEvents = allEvents.map((event) => {
      // Calculate remaining seats
      let remainingSeats = null; // Default to null if maxseats isn't set
      if (event.maxseats != null) {
        remainingSeats = event.maxseats - (event.registrations?.length || 0);
      }

      // Check if the user is registered
      // We use .some() and .equals() for efficient ObjectId comparison
      const isRegistered = event.registrations.some((regId) =>
        regId.equals(userId)
      );

      // Convert from Mongoose doc to plain object
      const eventObject = event.toObject();

      return {
        ...eventObject,
        registered: isRegistered, // true or false
        remainingSeats: remainingSeats, // Add the calculated remaining seats
      };
    });

    // 7. Return the list of formatted events
    return res.status(200).json({
      success: true,
      message: "All events fetched successfully.",
      events: formattedEvents, // Send the new formatted array
    });
  } catch (error) {
    // 8. Handle any server errors
    console.error("Error fetching all events:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to retrieve events due to a server error.",
    });
  }
};

module.exports = { getEvent };
