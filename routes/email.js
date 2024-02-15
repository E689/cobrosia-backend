const express = require("express");
const router = express.Router();

const { readEmail } = require("../controllers/mail.js");

router.post("/read-email", readEmail);

module.exports = router;
