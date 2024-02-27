const express = require("express");
const router = express.Router();

const {
  readEmail,
  readTestChat,
  deleteTestChat,
  getTestChat,
  flowTest,
  getFlowTest,
  deleteFlowTest,
} = require("../controllers/emails.js");

router.post("/read-email", readEmail);

router.post("/chat/test", readTestChat);

router.get("/chat/test/:id", getTestChat);

router.delete("/chat/test", deleteTestChat);

router.get("/flow/test/:id", getFlowTest);
router.post("/flow/test", flowTest);
router.delete("/flow/test/:id", deleteFlowTest);

module.exports = router;
