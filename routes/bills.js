const express = require("express");
const router = express.Router();
const multer = require("multer");
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

const {
  createBill,
  getBillsByUserId,
  deleteBill,
  updateBill,
  getLogByBillId,
  createBillsFromFile,
} = require("../controllers/bills");

/**
 * @swagger
 * /bills:
 *   post:
 *     summary: Create a new bill
 *     description: Create a new bill and send messages for pending bills.
 *     tags:
 *       - Bills
 *     consumes:
 *       - application/json
 *     parameters:
 *       - in: body
 *         name: createBillRequest
 *         description: Request object for creating a new bill.
 *         required: true
 *         schema:
 *           type: object
 *           properties:
 *             amount:
 *               type: number
 *             date:
 *               type: string
 *               format: date
 *             status:
 *               type: string
 *             clientId:
 *               type: string
 *             clientName:
 *               type: string
 *             billId:
 *               type: string
 *             context:
 *               type: string
 *     responses:
 *       200:
 *         description: bill saved
 *         examples:
 *           application/json:
 *             message: Messages for bills sent
 *             bills: []
 *       400:
 *         description: Missing required parameters. Please enter amount, date, status, clientId.
 *         examples:
 *           application/json:
 *             message: Missing parameters. Please enter amount, date, status, clientId.
 *       500:
 *         description: Error creating bill or messaging for bills.
 *         examples:
 *           application/json:
 *             error: Error creating bill or messaging for bills.
 *             message: Error creating bill or messaging for bills.
 */
router.post("/bills", createBill);

/**
 * @swagger
 * /bills/file:
 *   post:
 *     summary: Import bills from file
 *     description: once logged in, user can import bills from file.
 *     tags:
 *       - Bills
 *     consumes:
 *       - multipart/form-data
 *     parameters:
 *       - in: formData
 *         name: userId
 *         type: string
 *         required: true
 *         description: id of the user.
 *       - in: formData
 *         name: file
 *         type: file
 *         required: true
 *         description: Excel or CSV file to process.
 *     responses:
 *       200:
 *         description: bills sent
 *         examples:
 *           application/json:
 *             message: bills sent
 *             bills: []
 *       400:
 *         description: Missing parameters. Please enter amount, date, status, clientId.
 *         examples:
 *           application/json:
 *             message: Missing parameters. Please enter amount, date, status, clientId.
 *       500:
 *         description: Error creating bill or messaging for bills.
 *         examples:
 *           application/json:
 *             error: Error creating bill or messaging for bills.
 *             message: Error creating bill or messaging for bills.
 */
router.post("/bills/file", upload.single("file"), createBillsFromFile);

/**
 * @swagger
 * /bills/{id}:
 *   get:
 *     summary: Get bills by user ID
 *     description: Retrieve bills associated with a specific user ID.
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
 *         description: Bills from client retrieved
 *         examples:
 *           application/json:
 *             bills: []
 *             message: Bills from client retrieved
 *       500:
 *         description: Error finding bills
 *         examples:
 *           application/json:
 *             error: Error finding bills
 *             message: Error finding bills
 */
router.get("/bills/:id", getBillsByUserId);

/**
 * @swagger
 * /bills/log/{id}:
 *   get:
 *     summary: Get log by bill ID
 *     description: Retrieve log entries associated with a specific bill ID.
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
 *         description: Log from bill retrieved
 *         examples:
 *           application/json:
 *             log: []
 *             message: Log from bill retrieved
 *       500:
 *         description: Error finding bill
 *         examples:
 *           application/json:
 *             error: Error finding bill
 *             message: Error finding bill
 */
router.get("/bills/log/:id", getLogByBillId);

/**
 * @swagger
 * /bills/{id}:
 *   put:
 *     summary: Update a bill
 *     description: Update details of a specific bill.
 *     tags:
 *       - Bills
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: The ID of the bill.
 *         schema:
 *           type: string
 *       - in: body
 *         name: updateBillRequest
 *         description: Request object for updating a bill.
 *         required: true
 *         schema:
 *           type: object
 *           properties:
 *             amount:
 *               type: number
 *             date:
 *               type: string
 *               format: date
 *             status:
 *               type: string
 *             clientId:
 *               type: string
 *             billId:
 *               type: string
 *             context:
 *               type: string
 *     responses:
 *       200:
 *         description: Bill updated
 *         examples:
 *           application/json:
 *             message: Bill updated
 *             bill: {}
 *       404:
 *         description: Bill not found
 *         examples:
 *           application/json:
 *             message: Bill not found
 *       500:
 *         description: Error updating bill
 *         examples:
 *           application/json:
 *             error: Error updating bill
 *             message: Error updating bill
 */
router.put("/bills/:id", updateBill);

/**
 * @swagger
 * /bills/{id}:
 *   delete:
 *     summary: Delete a bill
 *     description: Delete a specific bill by its ID.
 *     tags:
 *       - Bills
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: The ID of the bill to be deleted.
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Bill deleted
 *         examples:
 *           application/json:
 *             message: Bill deleted
 *             deletedBill: {}
 *       400:
 *         description: Missing parameter. Please provide billId.
 *         examples:
 *           application/json:
 *             message: Missing parameter. Please provide billId.
 *       404:
 *         description: Bill not found
 *         examples:
 *           application/json:
 *             message: Bill not found
 *       500:
 *         description: Error deleting bill
 *         examples:
 *           application/json:
 *             error: Error deleting bill
 *             message: Error deleting bill
 */
router.delete("/bills/:id", deleteBill);

module.exports = router;
