const express = require("express");
const router = express.Router();

//controllers
const { createUser, logUser } = require("../controllers/users");

const {
  createClient,
  getClient,
  getClients,
} = require("../controllers/clients");

const {
  createContact,
  getContacts,
  getContact,
} = require("../controllers/contacts");

const {
  createBill,
  getBill,
  getBillsByUserId,
} = require("../controllers/bills");

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

router.post("/clients", createClient);
router.get("/clients/:id", getClient);

router.get("/clients", getClients);
router.post("/contacts", createContact);
router.get("/contacts/:id", getContacts);
router.get("/contacts", getContact);

router.post("/bills", createBill);
router.get("/bills/:id", getBillsByUserId);

module.exports = router;
