const express = require("express");
const router = express.Router();
const addUpdateLocation =
  require("../../controllers/locations/addUpdateLocation").addUpdateLocation;

router.post("/add-update", addUpdateLocation);

module.exports = router;
