// routes/index.js

const express = require("express");
const router = express.Router();
const authMiddleware = require("../middleware/authMiddleware");

router.get("/", (req, res) =>
  res.json({ ok: true, service: "Reginal Meet Server" })
);

router.use("/auth", require("./authRoutes"));
router.use("/admin", require("./adminRoutes"));
router.use("/supervisor", require("./supervisor"));
router.use("/host", require("./host"));
router.use("/locations", require("./locationRoutes"));
router.use("/events", require("./eventRoutes"));
module.exports = router;
