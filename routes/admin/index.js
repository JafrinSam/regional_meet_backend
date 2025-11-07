const express = require("express");
const router = express.Router();
const authMiddleware = require("../../middleware/authMiddleware");

// Import all admin-specific route modules
const locationRoutes = require("./locationRoutes");

// Apply admin auth middleware to all admin routes
router.use(authMiddleware({ adminOnly: true }));

// Mount admin sub-routes
router.use("/locations", locationRoutes);

// Example admin test route
router.get("/", (req, res) => {
  res.json({
    message: "Admin area — access granted",
    admin: req.user.fullname,
    role: req.user.role,
  });
});

module.exports = router;
