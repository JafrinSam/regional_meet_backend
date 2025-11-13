const express = require("express");
const authMiddleware = require("../middleware/authMiddleware");
const { getEvent } = require("../controllers/events/getEvent");
const getRegisteredEvents = require("../controllers/events/getRegisterEvents");

const router = express.Router();
router.get("/getevent", authMiddleware(), getEvent);
router.get("/getregisteredevents", authMiddleware(), getRegisteredEvents);

module.exports = router;
