const express = require("express");
const { addUpdateEvents } = require("../../controllers/events/addUpdateEvents");
const router = express.Router();
const adminRegisterUser = require("../../controllers/events/adminRegisterforEvents");

router.post("/add-update", addUpdateEvents);
router.post("/registerforevent/:eventId", adminRegisterUser);
module.exports = router;
