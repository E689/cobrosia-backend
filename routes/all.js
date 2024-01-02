const express = require("express");
const router = express.Router();
const OpenAI = require("openai");
const Clients = require("../models/clients");
const openai = new OpenAI({
  apiKey: process.env.OPENAI_KEY,
});
const Bills = require("../models/bills");
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
  getLogByBillId,
  revisarBills,
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

router.get("/log", (req, res) => {
  const user = "GPT";
  Bills.find({ status: { $ne: "2" } })
    .populate("client")
    .then((bills) => {
      bills.forEach(async (bill) => {
        const logEntry = {
          user: user,
          msg: `Le recuerdo ${bill.client.clientName} que me pague la factura ${bill.billId} que vale ${bill.amount}`,
        };
        fetch("https://api.ultramsg.com/instance68922/messages/chat", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            token: "t1byq90j0ln61sw9",
            to: `+502${bill.client.phone}`,
            body: `${logEntry.msg}`,
          }),
        })
          .then((response) => response.json())
          .then((data) => {
            console.log(data);
          })
          .catch((error) => {
            console.error("Fetch error:", error);
          });
        await Bills.updateOne(
          { _id: bill._id },
          { $push: { log: logEntry }, $set: { status: "1" } }
        );
      });

      return res.status(200).json({
        message: "messages for bills sent",
        bills: bills,
      });
    })
    .catch((error) => {
      console.log(error);
      return res.status(500).json({
        error,
        message: "Error messaging for bills bills",
      });
    });
});

const classificationCode = async (text) => {
  const openAiResponse = await openai.chat.completions.create({
    messages: [
      {
        role: "system",
        content: ` You are a debt collector. We have sent a reminder to pay. this is the users response. I need you to respond only the word: one, two, three, four or five, "one" if user has intention to pay on time. "two" if user has paid and sent a confirmation of payment. "three" if user is asking to move payment day. "four" if user is setting a new payment date. "five" if the message has no relation to paying.`,
      },
      { role: "user", content: text },
    ],
    model: "gpt-3.5-turbo",
  });
  const generatedText = openAiResponse.choices[0].message.content;

  console.log("open response", generatedText);
  if (generatedText.toLowerCase() === "one") {
    console.log("dice que va a pagar en tiempo");
    const casoUno = await openai.chat.completions.create({
      messages: [
        {
          role: "system",
          content: ` You are a debt collector. user has intention to pay on time. thank him and tell him to send a proof of payment onces he paid. in spanish`,
        },
        { role: "user", content: text },
      ],
      model: "gpt-3.5-turbo",
    });
    const casoUnoText = casoUno.choices[0].message.content;

    return { text: casoUnoText, options: {} };
  } else if (generatedText.toLowerCase() === "two") {
    console.log("dice que ya pago");
    const casoDos = await openai.chat.completions.create({
      messages: [
        {
          role: "system",
          content: ` You are a debt collector. user has paid. thank him. in spanish`,
        },
        { role: "user", content: text },
      ],
      model: "gpt-3.5-turbo",
    });
    const casoDosText = casoDos.choices[0].message.content;
    return { text: casoDosText, options: { paid: true } };
  } else if (generatedText.toLowerCase() === "three") {
    console.log("dice que si podemos mover la fecha");
    const casoTres = await openai.chat.completions.create({
      messages: [
        {
          role: "system",
          content: ` You are a debt collector. user has said if he can move payment day. Ask him when will he pay. in spanish`,
        },
        { role: "user", content: text },
      ],
      model: "gpt-3.5-turbo",
    });
    const casoTresText = casoTres.choices[0].message.content;
    return { text: casoTresText, options: {} };
  } else if (generatedText.toLowerCase() === "four") {
    console.log("mando nueva fecha");
    const casoCuatro = await openai.chat.completions.create({
      messages: [
        {
          role: "system",
          content: ` You are a debt collector. user has said if he can move payment day. Ask him when will he pay. in spanish`,
        },
        { role: "user", content: text },
      ],
      model: "gpt-3.5-turbo",
    });
    const casoCuatroText = casoCuatro.choices[0].message.content;
    return { text: casoCuatroText, options: {} };
  } else if (generatedText.toLowerCase() === "five") {
    console.log("no dijo nada relevante");
    const casoCinco = await openai.chat.completions.create({
      messages: [
        {
          role: "system",
          content: ` You are a debt collector. we sent a payment reminder and the user has ignored or avoided the question. remind him to pay. polite but angry. in spanish`,
        },
        { role: "user", content: text },
      ],
      model: "gpt-3.5-turbo",
    });
    const casoCincoText = casoCinco.choices[0].message.content;
    return casoCincoText;
  } else {
    console.log("nos se clasifico en nada");
    return { text: "error", options: {} };
  }
};

const classifyMessage = async (msg) => {
  const openAiResponse = await openai.chat.completions.create({
    messages: [
      {
        role: "system",
        content: `usted es un cobrador. Le voy a enviar una respuesta de un usuario ante un recordatorio de pago. respondale pidiendole que page amablemente. no te extiendas mucho.`,
      },
      { role: "user", content: msg },
    ],
    model: "gpt-3.5-turbo",
  });
  const generatedText = openAiResponse.choices[0].message.content;
  return generatedText;
};

const getLogByPhone = (phone, msg) => {
  Clients.findOne({ phone })
    .then((foundClient) => {
      Bills.findOne({ client: foundClient._id }).then(async (bill) => {
        if (bill.status === "2") {
          return;
        }

        const logEntry = {
          user: foundClient.contactName,
          msg,
        };

        // const respuesta = await classifyMessage(
        //   `soy ${foundClient.contactName}, le debo ${bill.amount} y era para el ${bill.dueDate} y le acabo de enviar este mensaje:${msg}`
        // );

        const { text, options } = await classificationCode(msg);

        fetch("https://api.ultramsg.com/instance68922/messages/chat", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            token: "t1byq90j0ln61sw9",
            to: `+502${phone}`,
            body: `${text}`,
          }),
        })
          .then((response) => response.json())
          .then((data) => {
            console.log(data);
          })
          .catch((error) => {
            console.error("Fetch error:", error);
          });

        const logEntry2 = {
          user: "GPT",
          msg: text,
        };
        if (options.paid) {
          Bills.updateOne(
            { _id: bill._id },
            {
              $push: { log: [logEntry, logEntry2] },
              $set: { status: "2" },
            }
          ).then((bill) => {
            return;
          });
        }
        Bills.updateOne(
          { _id: bill._id },
          {
            $push: { log: [logEntry, logEntry2] },
          }
        ).then((bill) => {
          return;
        });
      });
    })
    .catch((error) => {
      console.log(error);
      return;
    });
};

router.post("/mensaje", async (req, res) => {
  const { contactNumber, firstMessage, lastMessage } = req.body;
  console.log("contact number", contactNumber);

  getLogByPhone(contactNumber.slice(3), lastMessage);
  return res.status(200).json({
    message: `fallo exitosamente`,
  });

  // const respuesta = await funcionCatchy(lastMessage);
  // console.log("la respuesta es", respuesta);
  // fetch("https://api.ultramsg.com/instance68922/messages/chat", {
  //   method: "POST",
  //   headers: {
  //     "Content-Type": "application/json",
  //   },
  //   body: JSON.stringify({
  //     token: "t1byq90j0ln61sw9",
  //     to: "+50248274591",
  //     body: respuesta,
  //   }),
  // })
  //   .then((response) => response.json())
  //   .then((data) => {
  //     console.log(data);
  //     return res.status(200).json({
  //       message: `mensaje enviado`,
  //       data,
  //     });
  //   })
  //   .catch((error) => {
  //     console.error("Fetch error:", error);
  //     return res.status(200).json({
  //       message: `fallo exitosamente`,
  //       error,
  //     });
  //   });
});

router.post("/class", async (req, res) => {
  const { text, phone } = req.body;
  const respuesta = await classifyMessage(text);
  return res.status(200).json({
    message: `${respuesta}`,
  });
});

module.exports = router;
