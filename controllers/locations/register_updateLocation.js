const RegisteredLocation = require("../../models/registeredLocationModel");

/**
 * Creates a new location registration or updates an existing one for a specific date.
 *
 * This function enforces the "one registration per user per day" rule.
 * 1. If no registration exists for the user on that date, it CREATES a new one.
 * 2. If one *does* exist:
 * - If the location is the same, it does nothing.
 * - If the location is different, it UPDATES the record, pushing the
 * previous location into the 'history' array.
 */
const registerOrUpdateLocation = async (req, res) => {
  // 1. Get user ID from auth middleware
  const userId = req.user.id;

  // 2. Get data from the request body
  const { eventLocationId, eventDate, changeReason } = req.body;

  // 3. Validation
  if (!eventLocationId || !eventDate) {
    return res.status(400).json({
      success: false,
      message: "Both eventLocationId and eventDate are required.",
    });
  }

  try {
    // 4. Normalize the date to midnight (to match the schema index)
    const targetDate = new Date(eventDate);
    targetDate.setHours(0, 0, 0, 0);

    // 5. Find the existing registration for this user on this date
    const existingRegistration = await RegisteredLocation.findOne({
      user: userId,
      eventDate: targetDate,
    });

    // --- CASE 1: A registration for this date ALREADY EXISTS ---
    if (existingRegistration) {
      // 5a. Check if the location is the same. If so, do nothing.
      if (existingRegistration.eventLocation.toString() === eventLocationId) {
        return res.status(200).json({
          success: true,
          message: "You are already registered for this location on this date.",
          schedule: existingRegistration,
        });
      }

      // 5b. It's a NEW location for this date. Update the record.
      const historyEntry = {
        eventLocation: existingRegistration.eventLocation,
        changedAt: new Date(),
        changeReason: changeReason || "USER_LOCATION_UPDATE",
      };

      // Update the existing document
      existingRegistration.eventLocation = eventLocationId;
      existingRegistration.history.push(historyEntry);
      existingRegistration.registeredAt = new Date(); // Update timestamp
      existingRegistration.status = "ACTIVE"; // Ensure it's active

      const updatedRegistration = await existingRegistration.save();

      return res.status(200).json({
        success: true,
        message: "Location registration updated successfully.",
        schedule: updatedRegistration,
      });
    }

    // --- CASE 2: NO registration for this date. CREATE a new one. ---
    const newRegistration = new RegisteredLocation({
      user: userId,
      eventLocation: eventLocationId,
      eventDate: targetDate,
      history: [], // Starts with no history
      status: "ACTIVE",
      registeredAt: new Date(),
    });

    const savedRegistration = await newRegistration.save();

    return res.status(201).json({
      success: true,
      message: "New location registered successfully.",
      schedule: savedRegistration,
    });
  } catch (error) {
    // Handle potential database errors (e.g., validation)
    console.error("Error in registerOrUpdateLocation:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to register location due to a server error.",
      error: error.message,
    });
  }
};

// Export just this function
module.exports = {
  registerOrUpdateLocation,
};
