const express = require("express");
const router = express.Router();

//controllers
const { createUser, logUser } = require("../controllers/users");

const {
  createClient,
  getClient,
  getClients,
  getClientsByUser,
} = require("../controllers/clients");

const {
  createContact,
  getContacts,
  getContact,
} = require("../controllers/contacts");

const { createBill, getBillsByClientId } = require("../controllers/bills");

const { sendMails } = require("../controllers/mail");

/**
 * @swagger
 * /users/register:
 *   post:
 *     summary: Create user
 *     description: Register a new user to the db
 *     tags:
 *       - Users
 *     parameters:
 *       - in: body
 *         name: name
 *         required: true
 *         description: name of new user.
 *         schema:
 *           type: string
 *       - in: body
 *         name: email
 *         required: true
 *         description: unique email of new user.
 *         schema:
 *           type: string
 *       - in: body
 *         name: password
 *         required: true
 *         description: plain password.
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
 *       409:
 *         description: Duplicated email
 *       500:
 *         description: Internal error
 *
 */
router.post("/users/register", createUser);
/**
 * @swagger
 * /users/login:
 *   post:
 *     summary: Log in user
 *     description: Verify and log a user.
 *     tags:
 *       - Users
 *     parameters:
 *       - in: body
 *         name: email
 *         required: true
 *         description: email of user.
 *         schema:
 *           type: string
 *       - in: body
 *         name: password
 *         required: true
 *         description: plain password to verify with save hash password.
 *         schema:
 *           type: string
 *     responses:
 *       200:
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
router.post("/users/login", logUser);
/**
 * @swagger
 * /clients:
 *   post:
 *     summary: Create a client with contact
 *     description: Create a client and set its contact
 *     tags:
 *       - Clients
 *     parameters:
 *       - in: body
 *         name: email
 *         required: true
 *         description: email of user.
 *         schema:
 *           type: string
 *       - in: body
 *         name: password
 *         required: true
 *         description: plain password to verify with save hash password.
 *         schema:
 *           type: string
 *     responses:
 *       200:
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
router.post("/clients", createClient);
/**
 * @swagger
 * /clients/:id:
 *   get:
 *     summary: Get clients by user
 *     description: Get all clients by user
 *     tags:
 *       - Clients
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
 *               $ref: '#/models/Contacts'
 *       404:
 *         description: Acceses not found
 *
 */
router.get("/clients/:id", getClientsByUser);

/**
 * @swagger
 * /bills:
 *   post:
 *     summary: Create a bill
 *     description: Create a bill
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
 *         description: dueDate
 *         schema:
 *           type: string
 *        - in: body
 *         name: status
 *         required: true
 *         description: status
 *         schema:
 *           type: string
 *        - in: body
 *         name: clientId
 *         required: true
 *         description: clientId
 *         schema:
 *           type: string
 *     responses:
 *       200:
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
 *     summary: Get bills from client
 *     description:  Get bills from client
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
 *       404:
 *         description: Acceses not found
 *
 */
router.get("/bills/:id", getBillsByClientId);

router.get("/mail", sendMails);

router.get("/clients", getClients);
router.post("/contacts", createContact);
router.get("/contacts/:id", getContacts);
router.get("/contacts", getContact);

module.exports = router;
