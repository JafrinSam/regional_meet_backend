const EventLocation = require('../../models/eventLocations');

// Get all event locations
const getAllEventLocations = async (req, res) => {
  try {
    const locations = await EventLocation.find({});
    res.json(locations);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching event locations', error: error.message });
  }
};

// Get a single event location by ID
const getEventLocationById = async (req, res) => {
  try {
    const location = await EventLocation.findById(req.params.id);
    if (!location) {
      return res.status(404).json({ message: 'Event location not found' });
    }
    res.json(location);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching event location', error: error.message });
  }
};

// Create a new event location
const createEventLocation = async (req, res) => {
  try {
    const { name, address, capacity } = req.body;

    const location = new EventLocation({
      name,
      address,
      capacity,
    });

    await location.save();
    res.status(201).json(location);
  } catch (error) {
    res.status(500).json({ message: 'Error creating event location', error: error.message });
  }
};

// Update an event location
const updateEventLocation = async (req, res) => {
  try {
    const { name, address, capacity } = req.body;
    const location = await EventLocation.findById(req.params.id);

    if (!location) {
      return res.status(404).json({ message: 'Event location not found' });
    }

    location.name = name || location.name;
    location.address = address || location.address;
    location.capacity = capacity || location.capacity;

    const updatedLocation = await location.save();
    res.json(updatedLocation);
  } catch (error) {
    res.status(500).json({ message: 'Error updating event location', error: error.message });
  }
};

// Delete an event location
const deleteEventLocation = async (req, res) => {
  try {
    const location = await EventLocation.findById(req.params.id);

    if (!location) {
      return res.status(404).json({ message: 'Event location not found' });
    }

    await location.deleteOne();
    res.json({ message: 'Event location removed' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting event location', error: error.message });
  }
};

module.exports = {
  getAllEventLocations,
  getEventLocationById,
  createEventLocation,
  updateEventLocation,
  deleteEventLocation,
};