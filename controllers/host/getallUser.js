const User = require("../../models/userModel");
const hostModel = require("../../models/hostModel");
const registeredLocationModel = require("../../models/registeredLocationModel");
exports.getAllUserEvents = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    const host = await hostModel.findById(user.host);
    if (!host) {
      return res.status(404).json({ message: "Host not found" });
    }
    const userDetail = await registeredLocationModel
      .find({
        eventLocation: host.locationId,
      })
      .populate("user");
    if (!userDetail) {
      return res.status(404).json({ message: "userDetail not found" });
    }
    res
      .status(200)
      .json({
        success: true,
        users: userDetail,
        message: "User details fetched successfully",
      });
  } catch (error) {
    console.error("Error fetching user details:", error);
    res.status(500).json({ message: "Server error" });
  }
};
