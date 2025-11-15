const Event = require("../../../models/eventModel");

const adminUpdateEvent = async (req, res) => {
  try {
    const { eventId } = req.params;
    const updateData = req.body;

    const updatedEvent = await Event.findByIdAndUpdate(eventId, updateData, {
      new: true,
      runValidators: true,
    });

    if (!updatedEvent) {
      return res.status(404).json({
        success: false,
        message: "Event not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Event updated successfully",
      event: updatedEvent,
    });
  } catch (error) {
    console.error("Error updating event:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

module.exports = adminUpdateEvent;
