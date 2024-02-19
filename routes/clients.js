const express = require("express");
const router = express.Router();

const {
  createClient,
  updateClient,
  deleteClient,
  getClientsByUser,
  getClientById,
} = require("../controllers/clients");

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
 *         name: clientName
 *         required: true
 *         description: Name of client.
 *         schema:
 *           type: string
 *       - in: body
 *         name: contactName
 *         required: true
 *         description: Name of contact
 *         schema:
 *           type: string
 *       - in: body
 *         name: contactlastName
 *         required: true
 *         description: Lastname of contact
 *         schema:
 *           type: string
 *       - in: body
 *         name: phone
 *         required: true
 *         description: phone of contact
 *         schema:
 *           type: string
 *       - in: body
 *         name: email
 *         required: true
 *         description: email of contact
 *         schema:
 *           type: string
 *       - in: body
 *         name: userId
 *         required: true
 *         description: userId of the user creating the client
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
router.post("/clients", createClient);
/**
 * @swagger
 * /clients/{id}:
 *   get:
 *     summary: Get clients from user
 *     description:  Get clients from user
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
 *               $ref: '#/models/Clients'
 *       500:
 *         description: Internal error
 */
router.get("/clients/user/:id", getClientsByUser);
/**
 * @swagger
 * /clients/{id}:
 *   put:
 *     summary: edit client
 *     description:  edit client
 *     tags:
 *       - Clients
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: The ID of the client.
 *         schema:
 *           type: string
 *       - in: body
 *         name: updateClientRequest
 *         description: Request object for updating a client.
 *         required: true
 *         schema:
 *           type: object
 *           properties:
 *             clientName:
 *               type: string
 *             clientId:
 *               type: string
 *             contactName:
 *               type: string
 *             contactLastName:
 *               type: string
 *             clientCollectionSchedule:
 *               type: string
 *             phone:
 *               type: string
 *             email:
 *               type: string
 *             ai:
 *               type: boolean
 *             creditDays:
 *               type: number
 *             collectionFlow:
 *               type: number
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
router.put("/clients/:id", updateClient);
/**
 * @swagger
 * /clients/{id}:
 *   delete:
 *     summary: delete client
 *     description: delete client
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
 *               $ref: '#/models/Clients'
 *       500:
 *         description: Internal error
 */
router.delete("/clients/:id", deleteClient);
/**
 * @swagger
 * /client/{id}:
 *   get:
 *     summary: Get client from id
 *     description:  Get clients from id
 *     tags:
 *       - Clients
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: The ID of the client.
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Successful response
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/models/Clients'
 *       500:
 *         description: Internal error
 */
router.get("/client/:id", getClientById);
module.exports = router;
