const mongoose = require("mongoose");
const RegisteredLocation = require("./registeredLocationModel");
const RegisteredEvent = require("./registeredEventsModel");

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
  },
  endTime: {
    type: Date,
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
  const eventDay = new Date(eventToRegister.date);
  if (isNaN(eventDay.getTime())) {
    throw new Error("Registration failed: The event has an invalid date.");
  }
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
  console.log(eventToRegister.location, userLocationForDay.eventLocation);

  // 6. Compare the event's location to the user's registered location
  // We use .equals() to compare Mongoose ObjectIds
  if (!eventToRegister.location.equals(userLocationForDay.eventLocation)) {
    throw new Error(
      `Registration failed: This event's location does not match your registered location for this day.`
    );
  }

  // --- END OF NEW LOCATION CHECK ---

  // 7. Check for Time Conflicts (Find other events user is registered for)

  const userRegisteredEvents = await RegisteredEvent.find({ user: userId })
    .populate("event")
    .exec();

  for (const regEvent of userRegisteredEvents) {
    const otherEvent = regEvent.event;

    // Skip if no event or missing times, or it's the same event
    if (!otherEvent || !otherEvent.startTime || !otherEvent.endTime) continue;
    if (otherEvent._id.equals(eventToRegister._id)) continue;

    const otherStart = otherEvent.startTime.getTime();
    const otherEnd = otherEvent.endTime.getTime();
    const thisStart = eventToRegister.startTime.getTime();
    const thisEnd = eventToRegister.endTime.getTime();

    // Treat end times as exclusive: if otherEnd === thisStart (or otherStart === thisEnd) it's NOT a conflict
    const isOverlap = otherStart < thisEnd && otherEnd > thisStart;

    if (isOverlap) {
      throw new Error(
        `Registration failed: Time conflict with another registered event (${otherEvent.name}).`
      );
    }
  }

  // 8. All checks passed! Add the user and save.
  eventToRegister.registrations.push(userId);
  await eventToRegister.save();

  // 9. Create a registration document
  await RegisteredEvent.create({
    user: userId,
    event: eventId,
  });

  return eventToRegister;
};

eventSchema.statics.unregisterUser = async function (eventId, userId) {
  const eventToUnregister = await this.findById(eventId);

  if (!eventToUnregister) {
    throw new Error("Event not found.");
  }

  const isRegistered = eventToUnregister.registrations.some((r) =>
    r && typeof r.equals === "function"
      ? r.equals(userId)
      : r.toString() === userId.toString()
  );

  if (!isRegistered) {
    throw new Error(
      "Unregister failed: You are not registered for this event."
    );
  }

  eventToUnregister.registrations = eventToUnregister.registrations.filter(
    (r) =>
      !(r && typeof r.equals === "function"
        ? r.equals(userId)
        : r.toString() === userId.toString())
  );

  if (Array.isArray(eventToUnregister.attendees)) {
    eventToUnregister.attendees = eventToUnregister.attendees.filter(
      (a) =>
        !(a && typeof a.equals === "function"
          ? a.equals(userId)
          : a.toString() === userId.toString())
    );
  }

  await eventToUnregister.save();

  await RegisteredEvent.deleteMany({ user: userId, event: eventId });

  return eventToUnregister;
};

/**
 * [ADMIN] Force-registers a user for an event.
 * - Bypasses all limits: visibility, max seats, and location checks.
 * - Finds all conflicting timed events and auto-unregisters the user from them.
 * - If user is in 'attendees' list, removes them.
 * - Adds the user to the 'registrations' list.
 *
 * @param {string} eventId - The ID of the event to register for.
 * @param {string} userId - The ID of the user registering.
 * @returns {Promise<Object>} An object containing { event: Document, unregisteredFrom: string[], removedFromAttendees: boolean }
 * @throws {Error} Throws an error if event not found or un-registration fails.
 */
eventSchema.statics.adminRegisterUser = async function (eventId, userId) {
  // This array will hold the names of deleted events
  const unregisteredEvents = [];
  // This flag will track if the user was removed from attendees
  let wasRemovedFromAttendees = false;

  // 1. Find the event
  const eventToRegister = await this.findById(eventId);
  if (!eventToRegister) {
    throw new Error("[Admin] Event not found.");
  }

  // 2. Check if user is already registered for this event
  const isAlreadyRegistered = eventToRegister.registrations.some((r) =>
    r && typeof r.equals === "function"
      ? r.equals(userId)
      : r.toString() === userId.toString()
  );

  if (isAlreadyRegistered) {
    console.log(
      `[Admin] User is already registered for '${eventToRegister.name}'.`
    );
    // Return the new object structure, even if no action was taken
    return {
      event: eventToRegister,
      unregisteredFrom: unregisteredEvents, // Will be empty
      removedFromAttendees: wasRemovedFromAttendees, // Will be false
    };
  }

  // 3. Resolve Time Conflicts by un-registering from conflicting events
  if (eventToRegister.startTime && eventToRegister.endTime) {
    console.log(
      `[Admin] New event '${eventToRegister.name}' is timed. Checking for conflicts...`
    );

    const thisStart = eventToRegister.startTime.getTime();
    const thisEnd = eventToRegister.endTime.getTime();

    const userRegisteredEvents = await RegisteredEvent.find({ user: userId })
      .populate("event")
      .exec();

    for (const regEvent of userRegisteredEvents) {
      const otherEvent = regEvent.event;

      if (!otherEvent || !otherEvent.startTime || !otherEvent.endTime) {
        continue;
      }

      const otherStart = otherEvent.startTime.getTime();
      const otherEnd = otherEvent.endTime.getTime();

      const isOverlap = otherStart < thisEnd && otherEnd > thisStart;

      if (isOverlap) {
        console.log(
          `[Admin] Conflict found with '${otherEvent.name}'. Unregistering user...`
        );
        try {
          await this.unregisterUser(otherEvent._id, userId);
          console.log(
            `[Admin] Successfully unregistered from '${otherEvent.name}'.`
          );

          unregisteredEvents.push(otherEvent.name);
        } catch (unregError) {
          console.error(
            `[Admin] Failed to unregister from conflicting event '${otherEvent.name}'.`,
            unregError
          );
          throw new Error(
            `Failed to unregister from conflicting event: ${unregError.message}`
          );
        }
      }
    }
  } else {
    console.log(
      `[Admin] New event '${eventToRegister.name}' is all-day. Skipping conflict check.`
    );
  }

  // 4. --- NEW: Check and remove from 'attendees' if present ---
  if (Array.isArray(eventToRegister.attendees)) {
    // Find the index of the user in the attendees array
    const attendeeIndex = eventToRegister.attendees.findIndex(
      (attendeeId) =>
        attendeeId &&
        typeof attendeeId.equals === "function" &&
        attendeeId.equals(userId)
    );

    if (attendeeIndex > -1) {
      console.log(`[Admin] User was in 'attendees' list. Removing...`);
      eventToRegister.attendees.splice(attendeeIndex, 1); // Remove user from array
      wasRemovedFromAttendees = true;
    }
  }

  // 5. All checks bypassed/resolved. Add the user to 'registrations' and save.
  console.log(
    `[Admin] Adding user to 'registrations' for '${eventToRegister.name}'...`
  );
  eventToRegister.registrations.push(userId);

  try {
    await eventToRegister.save();
  } catch (saveError) {
    console.error(
      `[Admin] Failed to save event after adding registration:`,
      saveError
    );
    throw new Error(`Event save failed: ${saveError.message}`);
  }

  // 6. Create the registration document (if it doesn't exist)
  await RegisteredEvent.updateOne(
    { user: userId, event: eventId },
    { $setOnInsert: { user: userId, event: eventId } }, // Only create if it doesn't exist
    { upsert: true }
  );

  console.log(
    `[Admin] User successfully registered for '${eventToRegister.name}'.`
  );

  // --- MODIFIED RETURN ---
  // Return the event, the list of events that were unregistered, and attendee status
  return {
    event: eventToRegister,
    unregisteredFrom: unregisteredEvents,
    removedFromAttendees: wasRemovedFromAttendees,
  };
};
const Event = mongoose.model("Event", eventSchema);

module.exports = Event;
