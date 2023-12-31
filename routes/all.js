const express = require("express");
const router = express.Router();
const OpenAI = require("openai");
const openai = new OpenAI({
  apiKey: process.env.OPENAI_KEY,
});
//controllers
const { createUser, logUser } = require("../controllers/users");

const {
  createClient,
  updateClient,
  deleteClient,
  getClientsByUser,
} = require("../controllers/clients");

const {
  createBill,
  getBillsByUserId,
  deleteBill,
  updateBill,
} = require("../controllers/bills");
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
 * /clients/:id:
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
router.get("/clients/:id", getClientsByUser);
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
 * /clients/:id:
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
router.put("/clients/:id", updateClient);
/**
 * @swagger
 * /clients/:id:
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

const funcionCatchy = async (firstMessage) => {
  const openAiResponse = await openai.chat.completions.create({
    messages: [
      {
        role: "system",
        content: `responde a este mensaje naturalmente como si yo fuera tu: ${firstMessage}`,
      },
    ],
    model: "gpt-3.5-turbo",
  });
  console.log("response del openAI");
  console.log(openAiResponse);
  const generatedText = openAiResponse.choices[0].message.content;
  return generatedText;
};

router.post("/mensaje", (req, res) => {
  const { contactNumber, firstMessage, lastMessage } = req.body;
  console.log("Last message", lastMessage);
  const respuesta = funcionCatchy(lastMessage);
  console.log("la respuesta es", respuesta);
  fetch("https://api.ultramsg.com/instance68922/messages/chat", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      token: "t1byq90j0ln61sw9",
      to: "+50248274591",
      body: respuesta,
    }),
  })
    .then((response) => response.json())
    .then((data) => {
      console.log(data);
      return res.status(200).json({
        message: `mensaje enviado`,
        data,
      });
    })
    .catch((error) => {
      console.error("Fetch error:", error);
      return res.status(200).json({
        message: `fallo exitosamente`,
        error,
      });
    });
});
module.exports = router;
