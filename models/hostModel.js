const mongoose = require("mongoose");
const User = require("./userModel");

const hostSchema = new mongoose.Schema(
  {
    // Organisation Basics
    name: {
      type: String,
      required: true,
      trim: true,
    },
    legalName: {
      type: String,
      trim: true,
      default: "",
    },
    type: {
      type: String, // college, company, ngo, startup, govt, etc.
      trim: true,
      default: "",
    },
    locationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "EventLocation",
      required: true,
    },

    // Organisation Contact Info
    contact: {
      personName: { type: String, trim: true, default: "" },
      role: { type: String, trim: true, default: "" },
      email: {
        type: String,
        trim: true,
        match: [/^[^\s@]+@[^\s@]+\.[^\s@]+$/, "Invalid email"],
        default: "",
      },
      phone: { type: String, trim: true, default: "" },
    },

    // Legal / Verification Details
    registrationNumber: {
      type: String,
      trim: true,
      default: "",
    }, // GSTIN / CIN / NGO Reg Number
    taxId: {
      type: String,
      trim: true,
      default: "",
    },

    // Events Hosted by This Organisation
    hostedEvents: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Event",
      },
    ],

    // Optional: Which users belong to this host/org
    members: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
  },
  { timestamps: true }
);

hostSchema.statics.addMember = async function (hostId, userId, role = "host") {
  const validRoles = ["host", "organiser", "jurry"];
  if (!validRoles.includes(role)) {
    throw new Error(`Invalid role. Must be one of ${validRoles.join(", ")}`);
  }
  const host = await this.findById(hostId);
  if (!host) {
    throw new Error("Host not found");
  }

  const user = await User.findById(userId);
  if (!user) {
    throw new Error("User not found");
  }

  if (user.host) {
    if (user.host.toString() !== hostId) {
      throw new Error(
        "User is already a member of another host, Ask Supervisor for help"
      );
    } else {
      return { host, user }; // Already a member of this host
    }
  }

  if (!host.members.includes(userId)) {
    host.members.push(userId);
  }
  user.host = hostId;
  user.role = role;

  await host.save();
  await user.save();

  return { host, user };
};

hostSchema.statics.removeMember = async function (hostId, userId) {
  const host = await this.findById(hostId);
  if (!host) {
    throw new Error("Host not found");
  }

  if (host.members.length <= 1) {
    throw new Error("A host must have at least one member.");
  }

  const user = await User.findById(userId);
  if (!user) {
    throw new Error("User not found");
  }

  if (!host.members.includes(userId) && user.host.toString() !== hostId) {
    throw new Error("User is not a member of this host");
  }

  host.members.pull(userId);
  user.host = null;
  user.role = "user";

  await host.save();
  await user.save();

  return { host, user };
};

hostSchema.statics.updateMember = async function (userId, { role, subrole }) {
  const user = await User.findById(userId);
  if (!user) {
    throw new Error("User not found");
  }

  if (role) {
    const validRoles = ["host", "organiser", "jurry"];
    if (!validRoles.includes(role)) {
      throw new Error(`Invalid role. Must be one of ${validRoles.join(", ")}`);
    }
    user.role = role;
  }
  if (subrole) {
    user.subrole = subrole;
  }

  await user.save();
  return user;
};

hostSchema.statics.forceAddMember = async function (
  hostId,
  userId,
  role = "host"
) {
  const validRoles = ["host", "organiser", "jurry"];
  if (!validRoles.includes(role)) {
    throw new Error(`Invalid role. Must be one of ${validRoles.join(", ")}`);
  }
  const user = await User.findById(userId).exec();
  if (!user) {
    throw new Error("User not found");
  }

  const newHost = await this.findById(hostId).exec();
  if (!newHost) {
    throw new Error("New host not found");
  }

  // If user is already in a different host, remove them from it
  if (user.host && user.host.toString() !== hostId) {
    const oldHost = await this.findById(user.host).exec();
    if (oldHost) {
      oldHost.members.pull(userId);
      await oldHost.save();
    }
  }

  // Add user to the new host
  if (!newHost.members.includes(userId)) {
    newHost.members.push(userId);
  }
  user.host = hostId;
  user.role = role;

  await user.save();
  await newHost.save();

  return { host: newHost, user };
};

module.exports = mongoose.models.Host || mongoose.model("Host", hostSchema);
