const Host = require("../../models/hostModel");

const addUpdateHost = async (req, res) => {
  try {
    const { userId, role, ...hostData } = req.body;

    let host;
    if (hostData._id) {
      host = await Host.findByIdAndUpdate(hostData._id, hostData, {
        new: true,
        runValidators: true,
      });
      if (!host) {
        return res.status(404).json({ message: "Host not found" });
      }
    } else {
      if (!hostData.name || !hostData.locationId) {
        return res
          .status(400)
          .json({ message: "Host name and locationId are required." });
      }
      if (!userId) {
        return res
          .status(400)
          .json({ message: "A userId must be provided to create a new host." });
      }
      host = new Host(hostData);
      await host.save();
    }

    if (userId) {
      try {
        const result = await Host.addMember(host._id, userId, role);
        return res.status(200).json({
          message: "Host saved and user added successfully",
          host: result.host,
          user: result.user,
        });
      } catch (error) {
        // If member addition fails, the host was still created/updated.
        // Decide if this should be a partial success or a failure.
        // For now, returning a specific error message.
        return res.status(400).json({
          message: `Host saved, but failed to add user. Reason: ${error.message}`,
          host,
        });
      }
    }

    res
      .status(201)
      .json({ message: "Host saved successfully", host });
  } catch (error) {
    res.status(500).json({ message: "Error processing request", error: error.message });
  }
};

module.exports = { addUpdateHost };
