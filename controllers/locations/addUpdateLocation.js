const EventLocation = require("../../models/eventLocations");

const addUpdateLocation = async (req, res) => {
  try {
    const { _id, name, address, city, state, country, latitude, longitude } =
      req.body;

    if (_id) {
      // If _id is provided, attempt to update the existing location
      const updatedLocation = await EventLocation.findByIdAndUpdate(
        _id,
        {
          name,
          address,
          city,
          state,
          country,
          location: { type: "Point", coordinates: [longitude, latitude] },
        },
        { new: true, runValidators: true } // Return the updated document and run schema validators
      );

      if (!updatedLocation) {
        return res.status(404).json({ message: "Location not found." });
      }
      return res
        .status(200)
        .json({
          message: "Event location updated successfully",
          data: updatedLocation,
        });
    }

    // If no _id is provided, create a new location
    const newLocation = await EventLocation.create({
      name,
      address,
      city,
      state,
      country,
      location: { type: "Point", coordinates: [longitude, latitude] },
    });

    res.status(201).json({
      message: "Event location added successfully",
      data: newLocation,
    });
  } catch (error) {
    console.error("Add location error:", error);
    res.status(500).json({ message: "Server error while adding location" });
  }
};

module.exports = { addUpdateLocation };
