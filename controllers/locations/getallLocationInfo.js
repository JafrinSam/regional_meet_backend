const RegisteredLocation = require("../../models/registeredLocationModel");
const EventLocation = require("../../models/eventLocations"); // Import the new model

/**
 * @desc    Fetches all location information.
 * @route   GET /api/locations/all-info
 * @access  Private
 *
 * This handler provides two sets of data:
 * 1.  'registeredSchedule': The authenticated user's personal schedule,
 * populated with event details and sorted by date.
 * 2.  'allLocations': A list of all possible event locations available
 * in the database.
 */
const getAllLocationInfo = async (req, res) => {
  // 1. Get the user ID attached by the authMiddleware
  const userId = req.user.id;

  try {
    // 2. Define the query for the user's registered schedule (from your original code)
    // We don't 'await' it yet, we just build the query
    const registeredScheduleQuery = RegisteredLocation.find({ user: userId })
      .populate("eventLocation") // Populate with details from EventLocation model
      .sort({ eventDate: -1 })
      .select("eventLocation registeredAt eventDate history status");

    // 3. Define the query for ALL available event locations
    // We don't 'await' this either
    const allLocationsQuery = EventLocation.find({})
      .sort({ name: 1 }) // Sort alphabetically by name
      .select("name address city state country location"); // Select only relevant fields

    // 4. Execute both queries in parallel using Promise.all
    // This is more efficient than running them one after the other
    const [registeredSchedule, allLocations] = await Promise.all([
      registeredScheduleQuery,
      allLocationsQuery,
    ]);

    // 5. Log success and return the combined data
    // It's okay if 'registeredSchedule' is an empty array; it just means
    // the user hasn't registered for any events yet.
    const responseData = {
      success: true,
      message: "Successfully fetched all location information.",
      data: {
        registeredSchedule: registeredSchedule,
        allLocations: allLocations,
      },
    };

    console.log({
      success: true,
      message: "Location info fetched.",
      user: userId,
      registeredCount: registeredSchedule.length,
      allLocationsCount: allLocations.length,
    });

    return res.status(200).json(responseData);
  } catch (error) {
    // 6. Handle any errors from either database query
    console.error("Error in getAllLocationInfo controller:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to retrieve location data due to a server error.",
    });
  }
};

module.exports = { getAllLocationInfo };
