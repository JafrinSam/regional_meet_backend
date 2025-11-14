// controllers/getEventevent.js
// Import the necessary models
// Import the necessary models
const Event = require("../../models/eventModel"); // Path to your Event model
const RegisteredLocation = require("../../models/registeredLocationModel");

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
    // Get today's date and normalize it to midnight for comparison
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Start of today

    // Find the user's earliest active registered location
    const registeredLocationForToday = await RegisteredLocation.findOne({
      user: userId,
      status: "ACTIVE", // Only consider active registrations
      eventDate: { $gte: today }, // Only consider registrations from today onwards
    }).sort({ eventDate: 1 }); // Sort by date to get the earliest one

    // If the user has no registered location for today, return an empty array
    if (!registeredLocationForToday) {
      return res.status(200).json({
        success: true,
        message: "No events found for your registered location.",
        events: [],
      });
    }

    // Extract the location ID from the registered location
    const userLocationId = registeredLocationForToday.eventLocation;

    // 1. Query for visible events at the user's registered location
    const allEvents = await Event.find({
      visible: true,
      location: userLocationId, // Filter by the user's registered location
    })
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
    console.log({
      success: true,
      message: "All events fetched successfully.",
      events: formattedEvents, // Send the new formatted array
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
