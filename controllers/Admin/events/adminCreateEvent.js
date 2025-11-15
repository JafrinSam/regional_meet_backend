const Event = require("../../../models/eventModel");

const adminCreateEvent = async (req, res) => {
  try {
    const {
      name,
      date,
      startTime,
      endTime,
      location,
      category,
      description,
      speakers,
      maxseats,
      host,
    } = req.body;

    const newEvent = new Event({
      name,
      date,
      startTime,
      endTime,
      location,
      category,
      description,
      speakers,
      maxseats,
      host,
      visible: true, // Or based on a request body field
    });

    const savedEvent = await newEvent.save();

    res.status(201).json({
      success: true,
      message: "Event created successfully",
      event: savedEvent,
    });
  } catch (error) {
    console.error("Error creating event:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

module.exports = adminCreateEvent;
