const jwt = require("jsonwebtoken");
const User = require("../models/userModel");
const LocationLog = require("../models/locationLogModel");

const REFRESH_THRESHOLD_SECONDS = 7 * 24 * 60 * 60;

const generateToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET || "your_jwt_secret", {
    expiresIn: process.env.JWT_LIFETIME || "30d",
  });

// Role hierarchy (higher number = more privileges)
const ROLE_LEVELS = {
  superadmin: 100,
  admin: 80,
  supervisor: 60,
  host: 50,
  organiser: 40,
  jurry: 30,
  user: 10,
};

const getLevel = (role) =>
  ROLE_LEVELS[String(role || "user").toLowerCase()] || 0;

const authMiddleware = (options = {}) => {
  // options:
  //  - adminOnly (legacy boolean)
  //  - requiredRole (string)          => only users with that exact role OR superadmin allowed
  //  - minRole (string)               => users with role level >= minRole level OR superadmin allowed
  //  - allowedRoles (array[string])   => any listed role OR superadmin allowed
  //  - logLocation (boolean)
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
      }

      if (options.logLocation) {
        const locationData = req.body.location;
        if (locationData && locationData.latitude && locationData.longitude) {
          try {
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
      }

      req.user = user;

      if (newToken) {
        res.setHeader("X-New-Token", newToken);
      }

      const userRole = String(user.role || "user").toLowerCase();
      const userLevel = getLevel(userRole);

      // Superadmin bypass: always allowed to access and control everything
      const isSuperadmin = userRole === "superadmin";

      // legacy adminOnly option
      if (options.adminOnly) {
        if (!(isSuperadmin || userRole === "admin")) {
          return res
            .status(403)
            .json({ message: "Access denied: Admins only" });
        }
        return next();
      }

      // requiredRole: exact match OR superadmin
      if (options.requiredRole) {
        const required = String(options.requiredRole).toLowerCase();
        if (!(isSuperadmin || userRole === required)) {
          return res.status(403).json({
            message: `Access denied: requires role '${required}'`,
          });
        }
        return next();
      }

      // allowedRoles: array of roles OR superadmin
      if (options.allowedRoles && Array.isArray(options.allowedRoles)) {
        const lowered = options.allowedRoles.map((r) =>
          String(r).toLowerCase()
        );
        if (!(isSuperadmin || lowered.includes(userRole))) {
          return res.status(403).json({
            message: `Access denied: requires one of [${lowered.join(", ")}]`,
          });
        }
        return next();
      }

      // minRole: any user with role level >= minRole level OR superadmin
      if (options.minRole) {
        const min = String(options.minRole).toLowerCase();
        const minLevel = getLevel(min);
        if (!(isSuperadmin || userLevel >= minLevel)) {
          return res.status(403).json({
            message: `Access denied: requires minimum role '${min}'`,
          });
        }
        return next();
      }

      // If no role-based restriction provided, allow by default
      return next();
    } catch (error) {
      console.error("Auth error:", error);
      return res.status(401).json({ message: "Invalid or expired token" });
    }
  };
};

module.exports = authMiddleware;
