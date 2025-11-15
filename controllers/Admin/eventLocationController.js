const EventLocation = require('../../models/eventLocations');

// @desc    Get all event locations
// @route   GET /api/admin/eventlocations
// @access  Superadmin
const getAllEventLocations = async (req, res) => {
    try {
        const locations = await EventLocation.find({});
        res.status(200).json(locations);
    } catch (error) {
        console.error("Error getting all event locations:", error);
        res.status(500).json({ message: "Server error" });
    }
};

// @desc    Get event location by ID
// @route   GET /api/admin/eventlocations/:id
// @access  Superadmin
const getEventLocationById = async (req, res) => {
    try {
        const location = await EventLocation.findById(req.params.id);
        if (!location) {
            return res.status(404).json({ message: "Event location not found" });
        }
        res.status(200).json(location);
    } catch (error) {
        console.error("Error getting event location by ID:", error);
        res.status(500).json({ message: "Server error" });
    }
};

// @desc    Create a new event location
// @route   POST /api/admin/eventlocations
// @access  Superadmin
const createEventLocation = async (req, res) => {
    try {
        const { name, address, city, state, country, range, location } = req.body;

        if (!name || !city || !state || !country || !location || !location.coordinates) {
            return res.status(400).json({ message: "Please enter all required fields: name, city, state, country, location (with coordinates)" });
        }

        const locationExists = await EventLocation.findOne({ name });
        if (locationExists) {
            return res.status(400).json({ message: "Event location with that name already exists" });
        }

        const newLocation = await EventLocation.create({
            name,
            address,
            city,
            state,
            country,
            range,
            location: {
                type: 'Point',
                coordinates: location.coordinates, // Expecting [longitude, latitude]
            },
        });

        if (newLocation) {
            res.status(201).json(newLocation);
        } else {
            res.status(400).json({ message: "Invalid event location data" });
        }

    } catch (error) {
        console.error("Error creating event location:", error);
        res.status(500).json({ message: "Server error" });
    }
};

// @desc    Update an event location
// @route   PUT /api/admin/eventlocations/:id
// @access  Superadmin
const updateEventLocation = async (req, res) => {
    try {
        const { name, address, city, state, country, range, location } = req.body;

        const eventLocation = await EventLocation.findById(req.params.id);

        if (!eventLocation) {
            return res.status(404).json({ message: "Event location not found" });
        }

        eventLocation.name = name || eventLocation.name;
        eventLocation.address = address || eventLocation.address;
        eventLocation.city = city || eventLocation.city;
        eventLocation.state = state || eventLocation.state;
        eventLocation.country = country || eventLocation.country;
        eventLocation.range = range || eventLocation.range;

        if (location && location.coordinates) {
            eventLocation.location = {
                type: 'Point',
                coordinates: location.coordinates,
            };
        }

        const updatedEventLocation = await eventLocation.save();

        res.status(200).json(updatedEventLocation);

    } catch (error) {
        console.error("Error updating event location:", error);
        res.status(500).json({ message: "Server error" });
    }
};

// @desc    Delete an event location
// @route   DELETE /api/admin/eventlocations/:id
// @access  Superadmin
const deleteEventLocation = async (req, res) => {
    try {
        const eventLocation = await EventLocation.findById(req.params.id);

        if (!eventLocation) {
            return res.status(404).json({ message: "Event location not found" });
        }

        await eventLocation.deleteOne();
        res.status(200).json({ message: "Event location removed" });

    } catch (error) {
        console.error("Error deleting event location:", error);
        res.status(500).json({ message: "Server error" });
    }
};

module.exports = {
    getAllEventLocations,
    getEventLocationById,
    createEventLocation,
    updateEventLocation,
    deleteEventLocation
};
