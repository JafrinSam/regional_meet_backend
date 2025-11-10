const express = require("express");
const authMiddleware = require("../middleware/authMiddleware");
const { getEvent } = require("../controllers/events/getEvent");

const router = express.Router();
router.get("/getevent", authMiddleware(), getEvent);

module.exports = router;
