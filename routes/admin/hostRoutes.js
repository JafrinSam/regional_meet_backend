const express = require("express");
const { addUpdateEvents } = require("../../controllers/events/addUpdateEvents");
const router = express.Router();
const { addUpdateHost } = require("../../controllers/host/addUpdateHost");

router.post("/add-update", addUpdateHost);

module.exports = router;
