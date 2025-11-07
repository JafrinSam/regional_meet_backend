// routes/index.js

const express = require("express");
const router = express.Router();
const authMiddleware = require("../middleware/authMiddleware");

router.get("/", (req, res) =>
  res.json({ ok: true, service: "Reginal Meet Server" })
);

router.use("/auth", require("./authRoutes"));
router.use("/admin", require("./admin"));

module.exports = router;
