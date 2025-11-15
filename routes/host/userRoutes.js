const express = require("express");

const authMiddleware = require("../middleware/authMiddleware");

const { getallUser } = require("../controllers/host/getallUser");
const router = express.Router();

router.get("/all-users", authMiddleware({ logLocation: true }), getallUser);

module.exports = router;
