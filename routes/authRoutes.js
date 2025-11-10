const express = require("express");
const { loginUser } = require("../controllers/Auth/login");
const { registerUser } = require("../controllers/Auth/Register");
const authMiddleware = require("../middleware/authMiddleware");
const { getProfile } = require("../controllers/Auth/profile");

const router = express.Router();
router.post("/profile", authMiddleware({ logLocation: true }), getProfile);

router.post("/register", registerUser);
router.post("/login", loginUser);

module.exports = router;
