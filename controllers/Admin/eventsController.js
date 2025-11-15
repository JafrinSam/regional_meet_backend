const Event = require('../../models/eventModel');
const User = require('../../models/userModel');
const Host = require('../../models/hostModel');
const EventLocation = require('../../models/eventLocations');
const RegisteredEvent = require('../../models/registeredEventsModel');

// Get all events with sorting and filtering
const getAllEvents = async (req, res) => {
  try {
    const { location, host, page = 1, limit = 10 } = req.query;
    const query = {};

    if (location) {
      query.location = location;
    }
    if (host) {
      query.host = host;
    }

    const events = await Event.find(query)
      .populate('location', 'name')
      .populate('host', 'name')
      .sort({ date: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    const totalEvents = await Event.countDocuments(query);

    res.json({
      events,
      totalPages: Math.ceil(totalEvents / limit),
      currentPage: parseInt(page),
    });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching events', error: error.message });
  }
};

// Get a single event by ID
const getEventById = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id)
      .populate('location')
      .populate('host');
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }
    res.json(event);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching event', error: error.message });
  }
};

// Create a new event
const createEvent = async (req, res) => {
  try {
    const { name, description, date, location, host } = req.body;

    // Validate that host and location exist
    const hostExists = await Host.findById(host);
    const locationExists = await EventLocation.findById(location);

    if (!hostExists || !locationExists) {
      return res.status(400).json({ message: 'Invalid host or location ID' });
    }

    const newEvent = new Event({
      name,
      description,
      date,
      location,
      host,
    });

    await newEvent.save();
    res.status(201).json(newEvent);
  } catch (error) {
    res.status(500).json({ message: 'Error creating event', error: error.message });
  }
};

// Update an existing event
const updateEvent = async (req, res) => {
  try {
    const { name, description, date, location, host } = req.body;
    const eventId = req.params.id;

    // Optional: Validate host and location if they are being updated
    if (host && !(await Host.findById(host))) {
      return res.status(400).json({ message: 'Invalid host ID' });
    }
    if (location && !(await EventLocation.findById(location))) {
      return res.status(400).json({ message: 'Invalid location ID' });
    }

    const updatedEvent = await Event.findByIdAndUpdate(
      eventId,
      { name, description, date, location, host },
      { new: true, runValidators: true }
    );

    if (!updatedEvent) {
      return res.status(404).json({ message: 'Event not found' });
    }

    res.json(updatedEvent);
  } catch (error) {
    res.status(500).json({ message: 'Error updating event', error: error.message });
  }
};

// Delete an event
const deleteEvent = async (req, res) => {
  try {
    const eventId = req.params.id;
    const deletedEvent = await Event.findByIdAndDelete(eventId);

    if (!deletedEvent) {
      return res.status(404).json({ message: 'Event not found' });
    }

    // Also remove related registrations
    await RegisteredEvent.deleteMany({ event: eventId });

    res.json({ message: 'Event and all associated registrations deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting event', error: error.message });
  }
};

// Get event attendance
const getEventAttendance = async (req, res) => {
  try {
    const eventId = req.params.id;
    const event = await Event.findById(eventId).lean();

    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    const registrations = await RegisteredEvent.find({ event: eventId })
      .populate('user', 'fullname email')
      .select('status createdAt');

    res.json({
      event: { name: event.name, date: event.date },
      registrations,
    });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching event attendance', error: error.message });
  }
};

module.exports = {
  getAllEvents,
  getEventById,
  createEvent,
  updateEvent,
  deleteEvent,
  getEventAttendance,
};
