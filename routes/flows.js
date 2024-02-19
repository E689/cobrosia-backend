const express = require("express");
const router = express.Router();

const {
  createFlow,
  getFlow,
  getAllFlowsByUserId,
  updateFlow,
  deleteFlow,
} = require("../controllers/flows");

/**
 * @swagger
 * /flows:
 *   post:
 *     summary: Create flow
 *     description: Create flow
 *     tags:
 *       - Flows
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: The ID of the user.
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Flow created
 *         examples:
 *           application/json:
 *             bills: []
 *             message: Flow created
 *       500:
 *         description: Error finding flow
 *         examples:
 *           application/json:
 *             error: Error finding flow
 *             message: Error finding flow
 */
router.post("/flows", createFlow);
/**
 * @swagger
 * /flows/{id}:
 *   get:
 *     summary: Get flow by id
 *     description: get flow by id
 *     tags:
 *       - Flows
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: The ID of the flow.
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Flow found
 *         examples:
 *           application/json:
 *             message: Flow found
 *       500:
 *         description: Error finding flows
 *         examples:
 *           application/json:
 *             error: Error finding flows
 *             message: Error finding flows
 */
router.get("/flows/:id", getFlow);
/**
 * @swagger
 * /flows/user/{id}:
 *   get:
 *     summary: Get flows by user ID
 *     description: Get flows by user ID
 *     tags:
 *       - Flows
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: The ID of the user.
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Flow from client retrieved
 *         examples:
 *           application/json:
 *             message: Flow from client retrieved
 *       500:
 *         description: Error finding flows
 *         examples:
 *           application/json:
 *             error: Error finding flows
 *             message: Error finding flows
 */
router.get("/flows/user/:id", getAllFlowsByUserId);

router.put("/flows/:id", updateFlow);
router.delete("/flows/:id", deleteFlow);

module.exports = router;
