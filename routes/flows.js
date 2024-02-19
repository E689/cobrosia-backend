const express = require("express");
const router = express.Router();

const {
  createFlow,
  getFlow,
  getAllFlowsByUserId,
  updateFlow,
  deleteFlow,
} = require("../controllers/flows");

router.post("/flows", createFlow);
router.get("/flows/:id", getFlow);
router.get("/flows/user/:id", getAllFlowsByUserId);
router.put("/flows/:id", updateFlow);
router.delete("/flows/:id", deleteFlow);

module.exports = router;
