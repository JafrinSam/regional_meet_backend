const express = require("express");
const router = express.Router();
const authMiddleware = require("../../middleware/authMiddleware");

router.use(authMiddleware({ minRole: "host" }));


router.get("/", (req, res) => {
  res.json({
    message: "host area — access granted",
    admin: req.user.fullname,
    role: req.user.role,
  });
});

module.exports = router;
