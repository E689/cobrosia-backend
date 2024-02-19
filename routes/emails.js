const express = require("express");
const router = express.Router();

const { readEmail } = require("../controllers/emails.js");

router.post("/read-email", readEmail);

module.exports = router;
