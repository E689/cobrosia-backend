const express = require("express");
const router = express.Router();
const multer = require("multer");
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

const {
  logController,
  mensajeController,
  classController,
  fileController,
} = require("../utils/utilityFile");

router.get("/log", logController);

router.post("/mensaje", mensajeController);

router.post("/class", classController);

router.post("/file", upload.single("file"), fileController);

module.exports = router;
