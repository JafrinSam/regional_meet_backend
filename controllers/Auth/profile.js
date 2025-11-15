const User = require("../../models/userModel");
const verifyLocation = require("../../utils/verifyLocation");

// GET /api/auth/profile
exports.getProfile = async (req, res) => {
  try {
    const { expoPushToken, platform, location } = req.body || {};

    // if Expo token or platform sent, update it
    if (expoPushToken || platform) {
      await User.findByIdAndUpdate(
        req.user._id,
        {
          ...(expoPushToken && { expoPushToken }),
          ...(platform && { expoPlatform: platform }),
        },
        { new: true }
      );
    }

    const user = await User.findById(req.user._id).select("-password");

    let locationVerification = {};
    if (location && location.latitude && location.longitude) {
      const { latitude, longitude } = location;
      locationVerification = await verifyLocation(
        req.user._id,
        latitude,
        longitude
      );
    }

    res.json({
      message: "Profile fetched successfully",
      user,
      locationVerification,
    });
  } catch (err) {
    console.error("Error fetching profile:", err);
    res.status(500).json({ message: "Server error" });
  }
};
