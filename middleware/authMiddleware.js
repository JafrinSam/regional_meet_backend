const jwt = require("jsonwebtoken");
const User = require("../models/userModel");
// *** IMPORTANT: Assume you import your LocationLog model here ***
const LocationLog = require("../models/locationLogModel");

const REFRESH_THRESHOLD_SECONDS = 7 * 24 * 60 * 60;

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET || "your_jwt_secret", {
    expiresIn: process.env.JWT_LIFETIME || "30d",
  });
};

const authMiddleware = (options = {}) => {
  return async (req, res, next) => {
    try {
      const authHeader = req.headers.authorization;

      if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return res.status(401).json({ message: "No token provided" });
      }

      const token = authHeader.split(" ")[1];
      const decoded = jwt.decode(token);

      if (!decoded || !decoded.id || !decoded.exp) {
        return res.status(401).json({ message: "Malformed token" });
      }

      jwt.verify(token, process.env.JWT_SECRET || "your_jwt_secret");

      const user = await User.findById(decoded.id).select("-password");
      if (!user) {
        return res.status(401).json({ message: "User not found" });
      }

      const currentTime = Math.floor(Date.now() / 1000);
      const timeUntilExpiry = decoded.exp - currentTime;

      let newToken = null;
      if (timeUntilExpiry < REFRESH_THRESHOLD_SECONDS) {
        newToken = generateToken(user.id);
        console.log("Token refreshed for user:", user.id);
      } // ---------------------------------------------------- // 1. LOCATION LOGGING LOGIC - NOW CONDITIONAL // ----------------------------------------------------

      // Only execute logging if the logLocation option is explicitly set to true
      if (options.logLocation) {
        const locationData = req.body.location;

        if (locationData && locationData.latitude && locationData.longitude) {
          try {
            // Log the location asynchronously without blocking the main request
            // **UNCOMMENT THIS BLOCK ONCE LocationLog MODEL IS IMPORTED**
            LocationLog.create({
              user: user._id,
              latitude: locationData.latitude,
              longitude: locationData.longitude,
            });
            console.log(
              `[Location Log] Queuing log for ${user.fullname}: Lat ${locationData.latitude}`
            );
          } catch (logError) {
            console.error(
              "Failed to save location log in middleware:",
              logError
            );
          }
        }
      } // ---------------------------------------------------- // Attach user to request
      req.user = user;
      // console.log(user, req.body.location);

      if (newToken) {
        res.setHeader("X-New-Token", newToken);
      } // Check admin role

      if (options.adminOnly && user.role !== "admin") {
        return res.status(403).json({ message: "Access denied: Admins only" });
      }

      next();
    } catch (error) {
      console.error("Auth error:", error);
      return res.status(401).json({ message: "Invalid or expired token" });
    }
  };
};

module.exports = authMiddleware;
