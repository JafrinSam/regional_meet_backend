const bcrypt = require("bcryptjs");
const crypto = require("crypto");
const User = require("../../models/userModel");
const Host = require("../../models/hostModel");
const LocationLog = require("../../models/locationLogModel");
const RegisteredLocation = require("../../models/registeredLocationModel");
const EventLocation = require("../../models/eventLocations");
const { log } = require("console");

const getAllUsers = async (req, res) => {
  try {
    const users = await User.find({}).select("-password");
    res.json(users);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error fetching users", error: error.message });
  }
};

const getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select("-password");
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Fetch the user's currently registered event location
    const registeredLocation = await RegisteredLocation.findOne({
      user: user._id,
      status: "ACTIVE", // Assuming 'ACTIVE' denotes the current registration
    }).populate("eventLocation");

    const eventLocationId = registeredLocation ? registeredLocation.eventLocation._id : null;

    res.json({ ...user.toObject(), eventLocationId });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error fetching user", error: error.message });
  }
};

const createUser = async (req, res) => {
  try {
    const { fullname, email, password, role, subrole, hostId } = req.body;

    if (!fullname || !email || !password) {
      return res
        .status(400)
        .json({ message: "fullname, email and password are required" });
    }

    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ message: "User already exists" });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const user = new User({
      fullname,
      email,
      password: hashedPassword,
      role: role || "user",
      subrole: subrole || "",
      host: hostId || null,
    });

    await user.save();

    if (hostId) {
      await Host.addMember(hostId, user._id, role || "user");
      // The user object's host and role are updated and saved within Host.addMember
      // No need to re-fetch or save user again here.
    }

    res.status(201).json({
      _id: user._id,
      fullname: user.fullname,
      email: user.email,
      role: user.role,
      subrole: user.subrole,
      host: user.host, // This user object should now reflect changes from Host.addMember
    });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error creating user", error: error.message });
  }
};

const updateUser = async (req, res) => {
  try {
    const { fullname, email, role, subrole, hostId, eventLocationId } = req.body;
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (email && email !== user.email) {
      const existing = await User.findOne({ email });
      if (existing && existing._id.toString() !== user._id.toString()) {
        return res
          .status(400)
          .json({ message: "Email already in use by another account" });
      }
    }

    user.fullname = fullname || user.fullname;
    user.email = email || user.email;
    user.role = role || user.role;
    user.subrole = subrole || user.subrole;

    if (req.body.password) {
      const salt = await bcrypt.genSalt(10);
      user.password = await bcrypt.hash(req.body.password, salt);
    }

    // Save user's direct fields first
    await user.save();

    // Handle host assignment/removal
    if (hostId !== undefined) {
      if (hostId === null || hostId === "") {
        // Remove user from host if they currently have one
        if (user.host) {
          await Host.removeMember(user.host, user._id);
        }
        user.host = null; // This will be updated by Host.removeMember, but setting it here for clarity
      } else if (user.host && user.host.toString() !== hostId) {
        // Change host
        await Host.forceAddMember(hostId, user._id, role || user.role);
        user.host = hostId; // This will be updated by Host.forceAddMember
      } else if (!user.host && hostId) {
        // Add to host
        await Host.addMember(hostId, user._id, role || user.role);
        user.host = hostId; // This will be updated by Host.addMember
      }
    }

    // Handle eventLocationId update via RegisteredLocation
    if (eventLocationId !== undefined) {
      const currentRegisteredLocation = await RegisteredLocation.findOne({
        user: user._id,
        status: "ACTIVE",
      });

      if (eventLocationId === null || eventLocationId === "") {
        // If eventLocationId is explicitly null or empty, deactivate current registration
        if (currentRegisteredLocation) {
          currentRegisteredLocation.status = "INACTIVE";
          await currentRegisteredLocation.save();
        }
      } else if (
        !currentRegisteredLocation ||
        currentRegisteredLocation.eventLocation.toString() !== eventLocationId
      ) {
        // If there's no current registration, or the eventLocationId has changed
        if (currentRegisteredLocation) {
          currentRegisteredLocation.status = "INACTIVE";
          await currentRegisteredLocation.save();
        }

        // Create a new active registration
        const newRegisteredLocation = new RegisteredLocation({
          user: user._id,
          eventLocation: eventLocationId,
          eventDate: new Date(),
          status: "ACTIVE",
        });
        await newRegisteredLocation.save();
      }
    }

    // Re-fetch the user to ensure the response contains the most up-to-date host information
    // and also the eventLocationId if it was updated.
    const updatedUser = await User.findById(req.params.id).select("-password");
    const updatedRegisteredLocation = await RegisteredLocation.findOne({
      user: updatedUser._id,
      status: "ACTIVE",
    });
    const updatedEventLocationId = updatedRegisteredLocation ? updatedRegisteredLocation.eventLocation._id : null;


    res.json({
      _id: updatedUser._id,
      fullname: updatedUser.fullname,
      email: updatedUser.email,
      role: updatedUser.role,
      subrole: updatedUser.subrole,
      host: updatedUser.host,
      eventLocationId: updatedEventLocationId,
    });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error updating user", error: error.message });
  }
};

const deleteUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // If the user is associated with a host, remove them from the host's members array
    if (user.host) {
      await Host.updateOne(
        { _id: user.host },
        { $pull: { members: user._id } }
      );
    }

    await user.deleteOne();
    res.json({ message: "User removed" });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error deleting user", error: error.message });
  }
};

const getUserLocationLog = async (req, res) => {
  try {
    const userId = req.params.id;
    const logs = await LocationLog.find({ user: userId }).sort({
      loggedAt: "asc",
    });
    res.json(logs);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error fetching location logs", error: error.message });
  }
};

const createQrUser = async (req, res) => {
  try {
    const { fullname, email, password, role, hostId, eventLocationId } =
      req.body;
    const creatorRole = req.user ? req.user.role : null; // Assuming req.user is populated by auth middleware
    console.log(req.body);

    if (!fullname || !email || !password || !role || !eventLocationId) {
      return res
        .status(400)
        .json({
          message:
            "Fullname, email, password, role, and eventLocationId are required",
        });
    }
    console.log(password);

    // Role validation based on creator's role
    if (creatorRole === "host") {
      if (!["host", "jury", "user"].includes(role)) {
        return res
          .status(403)
          .json({
            message: "Hosts can only create 'host', 'jury' or 'user' roles",
          });
      }
    } else if (creatorRole === "superadmin") {
      // Superadmins can create any role, no specific restriction here
    } else {
      return res
        .status(403)
        .json({ message: "You are not authorized to create users" });
    }

    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ message: "User already exists" });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const user = new User({
      fullname,
      email,
      password: hashedPassword,
      role,
      host: hostId || null,
      isVerified: true, // QR created users are considered verified
    });

    await user.save();

    if (hostId) {
      await Host.addMember(hostId, user._id, role);
    }

    // Register location for the new user
    const eventLocation = await EventLocation.findById(eventLocationId);
    if (!eventLocation) {
      // If event location is not found, we should probably delete the user or handle this error
      await User.deleteOne({ _id: user._id });
      return res
        .status(404)
        .json({
          message: "Event location not found, user creation rolled back",
        });
    }

    const registeredLocation = new RegisteredLocation({
      user: user._id,
      eventLocation: eventLocationId,
      eventDate: new Date(), // Register for today
      status: "ACTIVE",
    });
    await registeredLocation.save();

    res.status(201).json({
      _id: user._id,
      fullname: user.fullname,
      email: user.email,
      role: user.role,
      host: user.host,
      registeredLocation: registeredLocation._id,
    });
  } catch (error) {
    console.error("Error creating QR user:", error);
    res
      .status(500)
      .json({ message: "Error creating QR user", error: error.message });
  }
};

const updateDailyRegisteredLocation = async (req, res) => {
  try {
    const userId = req.params.id;
    const { eventLocationId } = req.body;

    if (!eventLocationId) {
      return res.status(400).json({ message: "eventLocationId is required" });
    }

    // Normalize today's date to midnight for querying
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let registeredLocation = await RegisteredLocation.findOne({
      user: userId,
      eventDate: today,
      status: "ACTIVE",
    });

    if (registeredLocation) {
      // If the user is already registered to this location, do nothing
      if (registeredLocation.eventLocation.toString() === eventLocationId) {
        return res.status(200).json({ message: "User already registered to this location for today", registeredLocation });
      }

      // Add current location to history before updating
      registeredLocation.history.push({
        eventLocation: registeredLocation.eventLocation,
        changedAt: new Date(),
        changeReason: "HOST_UPDATE",
      });

      registeredLocation.eventLocation = eventLocationId;
      registeredLocation.registeredAt = new Date();
      await registeredLocation.save();
    } else {
      // No active registration for today, create a new one
      registeredLocation = new RegisteredLocation({
        user: userId,
        eventLocation: eventLocationId,
        eventDate: today,
        status: "ACTIVE",
        history: [{
          eventLocation: eventLocationId,
          changedAt: new Date(),
          changeReason: "INITIAL_REGISTRATION_BY_HOST",
        }]
      });
      await registeredLocation.save();
    }

    res.status(200).json({ message: "User daily location updated successfully", registeredLocation });
  } catch (error) {
    console.error("Error updating daily registered location:", error);
    res.status(500).json({ message: "Error updating daily registered location", error: error.message });
  }
};

module.exports = {
  getAllUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
  getUserLocationLog,
  createQrUser,
  updateDailyRegisteredLocation,
};
