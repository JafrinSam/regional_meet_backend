const express = require("express");
const authMiddleware = require("../middleware/authMiddleware");
const { getEvent } = require("../controllers/events/getEvent");
const getRegisteredEvents = require("../controllers/events/getRegisterEvents");
const registerForEvent = require("../controllers/events/registerForEvent");
const unregisterForEvent = require("../controllers/events/unregisterForEvent");
const router = express.Router();
router.get("/getevent", authMiddleware(), getEvent);
router.get("/getregisteredevents", authMiddleware(), getRegisteredEvents);
router.post("/:eventId/register", authMiddleware(), registerForEvent);
router.post("/registerforevent/:eventId", authMiddleware(), registerForEvent);
router.delete(
  "/unregisterforevent/:eventId",
  authMiddleware(),
  unregisterForEvent
);

module.exports = router;
