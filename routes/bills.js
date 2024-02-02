const express = require("express");
const router = express.Router();

const {
  createBill,
  getBillsByUserId,
  deleteBill,
  updateBill,
  getLogByBillId,
  revisarBills,
} = require("../controllers/bills");

/**
 * @swagger
 * /bills:
 *   post:
 *     summary: Create a client with contact
 *     description: Create a client and set its contact
 *     tags:
 *       - Bills
 *     parameters:
 *       - in: body
 *         name: amount
 *         required: true
 *         description: amount of bill.
 *         schema:
 *           type: string
 *       - in: body
 *         name: dueDate
 *         required: true
 *         description: due date of bill
 *         schema:
 *           type: string
 *       - in: body
 *         name: status
 *         required: true
 *         description: status of bill
 *         schema:
 *           type: string
 *       - in: body
 *         name: clientId
 *         required: true
 *         description: clientId of client that owns the bill
 *         schema:
 *           type: string
 *       - in: body
 *         name: billId
 *         required: true
 *         description: id of bill
 *         schema:
 *           type: string
 *     responses:
 *       201:
 *         description: Successful response
 *         content:
 *           application/json:
 *             schema:
 *               Users
 *       400:
 *         description: Missing parameters
 *       500:
 *         description: Internal error
 *
 */
router.post("/bills", createBill);
/**
 * @swagger
 * /bills/:id:
 *   get:
 *     summary: Get bills from user
 *     description:  Get bills from user
 *     tags:
 *       - Bills
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: The ID of the user.
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Successful response
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/models/Bills'
 *       500:
 *         description: Internal error
 */
router.get("/bills/:id", getBillsByUserId);
/**
 * @swagger
 * /bills/:id:
 *   delete:
 *     summary: delete bill
 *     description:  delete bill
 *     tags:
 *       - Bills
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: The ID of the bill.
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Successful response
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/models/Bills'
 *       500:
 *         description: Internal error
 */
router.delete("/bills/:id", deleteBill);
/**
 * @swagger
 * /bills/:id:
 *   put:
 *     summary: update bill
 *     description:  update bill
 *     tags:
 *       - Bills
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: The ID of the bill.
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Successful response
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/models/Bills'
 *       500:
 *         description: Internal error
 */
router.put("/bills/:id", updateBill);
/**
 * @swagger
 * /bills/log/:id:
 *   get:
 *     summary: Get log from bill
 *     description: billId for log
 *     tags:
 *       - Bills
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: The ID of the bill.
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Successful response
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/models/Bills'
 *       500:
 *         description: Internal error
 */
router.get("/bills/log/:id", getLogByBillId);

module.exports = router;
