const express = require("express");
const router = express.Router();

const {
  readEmail,
  readTestChat,
  deleteTestChat,
  getTestChat,
} = require("../controllers/emails.js");

router.post("/read-email", readEmail);

router.post("/chat/test", readTestChat);

router.get("/chat/test", getTestChat);

router.delete("/chat/test", deleteTestChat);

module.exports = router;
