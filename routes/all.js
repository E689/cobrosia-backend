const express = require("express");
const router = express.Router();

const {
  logController,
  mensajeController,
  classController,
} = require("../utils/utilityFile");

router.get("/log", logController);

router.post("/mensaje", mensajeController);

router.post("/class", classController);

module.exports = router;
