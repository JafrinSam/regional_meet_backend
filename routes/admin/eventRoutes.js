const express = require("express");
const { addUpdateEvents } = require("../../controllers/events/addUpdateEvents");
const router = express.Router();

router.post("/add-update", addUpdateEvents);

module.exports = router;
