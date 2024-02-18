const express = require("express");
const router = express.Router();

const { readEmail } = require("../controllers/emails.js");
const {
  logController,
  mensajeController,
  classController,
} = require("../utils/utilityFile.js");

router.get("/log", logController);

router.post("/mensaje", mensajeController);

router.post("/class", classController);

router.post("/read-email", readEmail);

module.exports = router;
