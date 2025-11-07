const User = require("../../models/userModel");

// GET /api/auth/profile
exports.getProfile = async (req, res) => {
  try {
    const { expoPushToken, platform } = req.body || {};

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
    res.json({
      message: "Profile fetched successfully",
      user,
    });
  } catch (err) {
    console.error("Error fetching profile:", err);
    res.status(500).json({ message: "Server error" });
  }
};
