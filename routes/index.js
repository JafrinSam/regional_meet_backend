// routes/index.js

const express = require("express");
const router = express.Router();

router.get("/", (req, res) =>
  res.json({ ok: true, service: "Reginal Meet Server" })
);

// router.use("/login", require("./authRoutes"));
// router.use("/messages", require("./messages"));
// router.post("/auth", Auth_MiddleWare(), Authenticator);

module.exports = router;
