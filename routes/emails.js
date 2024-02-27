const express = require("express");
const router = express.Router();

const {
  readEmail,
  readTestChat,
  deleteTestChat,
} = require("../controllers/emails.js");

router.post("/read-email", readEmail);

router.post("/chat/test", readTestChat);

router.delete("/chat/test", deleteTestChat);

module.exports = router;
