const mongoose = require("mongoose");
// --- ADD THIS IMPORT ---
// Assumes the file is in the same directory. Update path if needed.
const RegisteredLocation = require("./registeredLocationModel");

const eventSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
  },
  speakers: [
    {
      type: String,
      trim: true,
    },
  ],
  image: {
    type: String,
    trim: true,
  },
  video: {
    type: String,
    trim: true,
  },
  link: {
    type: String,
    trim: true,
  },
  startTime: {
    type: Date,
    required: [true, "Event start time is required"],
  },
  endTime: {
    type: Date,
    required: [true, "Event end time is required"],
    validate: {
      validator: function (value) {
        return this.startTime < value;
      },
      message: "Event end time must be after start time",
    },
  },
  description: {
    type: String,
    trim: true,
  },
  date: {
    // This 'date' field is redundant given 'startTime'
    // but we will keep it as it's in your schema.
    type: Date,
    required: true,
  },
  location: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "EventLocation",
    required: true,
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  attendees: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  ],
  registrations: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  ],
  category: {
    type: String,
    default: "other",
    trim: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  maxseats: {
    type: Number,
    min: 0,
  },
  visible: {
    type: Boolean,
    default: true,
  },
});

/**
 * A static method to handle all business logic for registering a user for an event.
 * This checks visibility, max seats, duplicates, location, and time conflicts.
 *
 * @param {string} eventId - The ID of the event to register for.
 * @param {string} userId - The ID of the user registering.
 * @returns {Promise<Document>} The saved event document.
 * @throws {Error} Throws an error if any registration rule is violated.
 */
eventSchema.statics.registerUser = async function (eventId, userId) {
  // 1. Find the event
  const eventToRegister = await this.findById(eventId);

  // 2. Run all initial event checks
  if (!eventToRegister) {
    throw new Error("Event not found.");
  }
  if (!eventToRegister.visible) {
    throw new Error("This event is not currently open for registration.");
  }
  if (
    eventToRegister.maxseats != null &&
    eventToRegister.registrations.length >= eventToRegister.maxseats
  ) {
    throw new Error("Registration failed: This event is full.");
  }
  if (eventToRegister.registrations.includes(userId)) {
    throw new Error(
      "Registration failed: You are already registered for this event."
    );
  }

  // --- NEW LOCATION CHECK ---

  // 3. Normalize the event's date to midnight
  // This is to match the 'eventDate' field in the RegisteredLocation schema
  const eventDay = new Date(eventToRegister.startTime);
  eventDay.setHours(0, 0, 0, 0);

  // 4. Find the user's *active* registered location for that specific day
  const userLocationForDay = await RegisteredLocation.findOne({
    user: userId,
    eventDate: eventDay,
    status: "ACTIVE", // Ensure we're checking their active location
  });

  // 5. Validate the user's location
  if (!userLocationForDay) {
    throw new Error(
      `Registration failed: You must register your primary location for this date (${eventDay.toDateString()}) before registering for an event.`
    );
  }

  // 6. Compare the event's location to the user's registered location
  // We use .equals() to compare Mongoose ObjectIds
  if (!eventToRegister.location.equals(userLocationForDay.eventLocation)) {
    throw new Error(
      `Registration failed: This event's location does not match your registered location for this day.`
    );
  }

  // --- END OF NEW LOCATION CHECK ---

  // 7. Check for Time Conflicts (Find other events user is registered for)
  // An overlap exists if: (Event1.Start < Event2.End) AND (Event1.End > Event2.Start)
  const conflictingEvent = await this.findOne({
    registrations: userId, // Find events user is already in
    _id: { $ne: eventId }, // Exclude this current event
    startTime: { $lt: eventToRegister.endTime }, // The other event starts *before* this one ends
    endTime: { $gt: eventToRegister.startTime }, // The other event ends *after* this one starts
  });

  if (conflictingEvent) {
    throw new Error(
      `Registration failed: This event's time conflicts with '${conflictingEvent.name}'.`
    );
  }

  // 8. All checks passed! Add the user and save.
  eventToRegister.registrations.push(userId);
  await eventToRegister.save();

  return eventToRegister;
};

const Event = mongoose.model("Event", eventSchema);

module.exports = Event;
