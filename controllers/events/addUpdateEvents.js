// controllers/events/addUpdateEvents.js

const Event = require("../../models/eventModel");

/**
 * Adds a new event or updates an existing one.
 * If the request body contains an _id, it updates the event.
 * Otherwise, it creates a new event.
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const addUpdateEvents = async (req, res) => {
  const { _id, ...eventData } = req.body;
  const userId = req.user._id; // from authMiddleware

  try {
    if (_id) {
      // Update existing event
      const updatedEvent = await Event.findByIdAndUpdate(
        _id,
        { ...eventData, createdBy: userId },
        { new: true, runValidators: true }
      );

      if (!updatedEvent) {
        return res.status(404).json({
          success: false,
          message: "Event not found.",
        });
      }

      return res.status(200).json({
        success: true,
        message: "Event updated successfully.",
        event: updatedEvent,
      });
    } else {
      // Create new event
      const newEvent = new Event({
        ...eventData,
        createdBy: userId,
      });

      await newEvent.save();

      return res.status(201).json({
        success: true,
        message: "Event created successfully.",
        event: newEvent,
      });
    }
  } catch (error) {
    console.error("Error adding or updating event:", error);
    // Handle validation errors
    if (error.name === 'ValidationError') {
      return res.status(400).json({
        success: false,
        message: "Validation failed.",
        errors: error.errors,
      });
    }
    return res.status(500).json({
      success: false,
      message: "Failed to process event due to a server error.",
    });
  }
};

module.exports = { addUpdateEvents };
