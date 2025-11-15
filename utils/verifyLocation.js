const RegisteredLocation = require('../models/registeredLocationModel');
const EventLocation = require('../models/eventLocations');
const Event = require('../models/eventModel');

// Haversine formula to calculate distance between two coordinates in meters
function getDistance(lat1, lon1, lat2, lon2) {
  const R = 6371e3; // metres
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c; // in metres
}

const verifyLocation = async (userId, currentLat, currentLon) => {
  console.log('==============================================');
  console.log('====== Starting Location Verification ======');
  console.log('==============================================');
  console.log(`Verifying location for user: ${userId} at [${currentLat}, ${currentLon}]`);

  try {
    // Get today's date at midnight
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    console.log("Querying for registered location for user:", userId, "between", today, "and", tomorrow);

    // Find the user's registered location for today using a range
    const registeredLocation = await RegisteredLocation.findOne({
      user: userId,
      eventDate: { $gte: today, $lt: tomorrow },
      status: 'ACTIVE',
    }).populate('eventLocation');

    if (registeredLocation) {
      console.log(`Found registered location: ${registeredLocation.eventLocation.name}`);
      const { location, range, name } = registeredLocation.eventLocation;
      const [registeredLon, registeredLat] = location.coordinates;
      const distance = getDistance(currentLat, currentLon, registeredLat, registeredLon);
      console.log(`Calculated distance: ${distance} meters, Allowed range: ${range} meters`);

      if (distance <= range) {
        console.log('User is WITHIN range.');
        console.log('====== Ending Location Verification ======');
        return {
          success: true,
          status: 'verified',
          message: `You are at your registered location: ${name}.`,
        };
      } else {
        console.log('User is OUT OF range of registered location.');
        const eventsToday = await Event.find({ date: { $gte: today, $lt: tomorrow } }).select(
          'location'
        );
        const locationIds = eventsToday.map((e) => e.location);
        const allTodaysLocations = await EventLocation.find({ _id: { $in: locationIds } });

        let nearestOtherLocation = null;
        let minDistance = Infinity;

        for (const loc of allTodaysLocations) {
          if (loc._id.equals(registeredLocation.eventLocation._id)) continue;

          const [lon, lat] = loc.location.coordinates;
          const dist = getDistance(currentLat, currentLon, lat, lon);

          if (dist <= loc.range) {
            console.log(`User is WITHIN range of another location: ${loc.name}`);
            return {
              success: false,
              status: 'relocated',
              message: `You are at '${loc.name}', but you are registered for '${name}'. Please ask an organizer to update your location.`,
            };
          }
          if (dist < minDistance) {
            minDistance = dist;
            nearestOtherLocation = loc;
          }
        }

        let message = `You are not in range of your registered location '${name}'.`;
        if (nearestOtherLocation) {
          message += ` The nearest other event location is '${
            nearestOtherLocation.name
          }', approximately ${Math.round(minDistance)} meters away.`;
        }
        message += ' Please ask an organizer for assistance.';
        return { success: false, status: 'out_of_bounds', message };
      }
    } else {
      // NO REGISTERED LOCATION FOR TODAY
      console.log(`No active registered location found for user: ${userId}`);
      const nearestLocation = await EventLocation.findOne({
        location: {
          $near: { $geometry: { type: 'Point', coordinates: [currentLon, currentLat] } },
        },
      });

      if (!nearestLocation) {
        return {
          success: false,
          status: 'no_nearby_events',
          message: 'You do not have a registered location for today and no nearby events were found.',
        };
      }

      const eventToday = await Event.findOne({
        location: nearestLocation._id,
        date: { $gte: today, $lt: tomorrow },
      });

      if (eventToday) {
        const distanceToEvent = getDistance(
          currentLat,
          currentLon,
          nearestLocation.location.coordinates[1],
          nearestLocation.location.coordinates[0]
        );
        return {
          success: false,
          status: 'unregistered_nearby',
          message: `You are not registered for today, but the event '${
            eventToday.name
          }' is happening at nearby location '${
            nearestLocation.name
          }'. You are approximately ${Math.round(
            distanceToEvent
          )} meters away. Please see an organizer to get registered.`,
        };
      } else {
        return {
          success: false,
          status: 'no_event_today_at_nearest',
          message: `You do not have a registered location for today. The nearest event location is '${nearestLocation.name}', but there are no events scheduled there for today.`,
        };
      }
    }
  } catch (error) {
    console.error('Error in verifyLocation:', error);
    return {
      success: false,
      status: 'error',
      message: 'An error occurred during location verification.',
    };
  }
};

module.exports = verifyLocation;