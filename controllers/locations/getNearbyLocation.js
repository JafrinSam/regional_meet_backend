const EventLocation = require("../../models/eventLocations"); // Adjust the path to your model

/**
 * @desc    Get nearby event locations
 * @route   GET /api/v1/locations/nearby
 * @access  Private (Assumes user is logged in)
 *
 * This controller finds event locations near the user's location,
 * which is expected to be on `req.user.location`.
 *
 * Query Parameters:
 * ?distance=25   (Distance in kilometers, default: 50)
 * ?limit=10      (Number of results to return, default: 10)
 */
const getNearbyLocations = async (req, res, next) => {
  try {
    // 1. Get user's location from the authenticated user object
    const { location: userLocation } = req.body;

    // 2. Validate the user's location
    if (
      !userLocation ||
      userLocation.type !== "Point" ||
      !userLocation.coordinates
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Invalid or missing user location. Must be a valid GeoJSON Point.",
      });
    }

    // 3. Get coordinates from the user's location
    const [longitude, latitude] = userLocation.coordinates;

    // 4. Get query parameters with defaults
    // Max distance in kilometers (default to 50km)
    const maxDistanceKm = parseFloat(req.query.distance) || 50;
    // Convert kilometers to meters for MongoDB's $geoNear
    const maxDistanceMeters = maxDistanceKm * 1000;

    // Max number of results (default to 10)
    const limit = parseInt(req.query.limit) || 10;

    // 5. Use $geoNear aggregation pipeline
    // This is the most efficient way to query and sort by distance.
    const locations = await EventLocation.aggregate([
      {
        $geoNear: {
          near: {
            type: "Point",
            coordinates: [longitude, latitude],
          },
          // 'distanceField' adds a new field to each document with the calculated distance
          distanceField: "distance",
          // 'maxDistance' filters results to be within this many meters
          maxDistance: maxDistanceMeters,
          // 'spherical' is required for 2dsphere indexes
          spherical: true,
        },
      },
      {
        // Limit the number of results
        $limit: limit,
      },
      {
        // Optional: Clean up the output
        $project: {
          _id: 1,
          name: 1,
          address: 1,
          city: 1,
          state: 1,
          location: 1,
          // Add a new field 'distanceInKm' for easy frontend use
          distanceInKm: { $divide: ["$distance", 1000] },
        },
      },
    ]);
    console.log({ success: true, count: locations.length, data: locations });

    // 6. Send the response
    res.status(200).json({
      success: true,
      count: locations.length,
      data: locations,
    });
  } catch (error) {
    // 7. Pass any errors to the Express error handling middleware
    next(error);
  }
};

module.exports = {
  getNearbyLocations,
};
