const mongoose = require("mongoose");
const { ObjectId } = mongoose.Schema;
const OpenAI = require("openai");
const openai = new OpenAI({
  apiKey: process.env.OPENAI_KEY,
});

const Clients = require("../models/clients");
const Bills = require("../models/bills");
const Users = require("../models/users");
const {
  AI_GENERAL_CONTEXT,
  LOG_ENTRY_TYPE,
  LOG_ROLE,
} = require("../constants");

const { sendEmailSES } = require("./email");

const mensajeController = async (req, res) => {
  const { contactNumber, firstMessage, lastMessage } = req.body;
  console.log("contact number", contactNumber);

  getLogByPhone(contactNumber.slice(3), lastMessage);
  return res.status(200).json({
    message: `fallo exitosamente`,
  });
};

const getLogByPhone = (phone, msg) => {
  Clients.findOne({ phone })
    .then((foundClient) => {
      Bills.find({
        $and: [{ client: foundClient._id }, { status: { $in: ["0", "1"] } }],
      }).then(async (bills) => {
        bills.forEach(async (bill) => {
          if (bill.status === "2") {
            return;
          }

          const logEntry = {
            user: foundClient.contactName,
            msg,
          };
          console.log("about to classify message");
          // const respuesta = await classifyMessage(
          //   `soy ${foundClient.contactName}, le debo ${bill.amount} y era para el ${bill.date} y le acabo de enviar este mensaje:${msg}`
          // );

          const { text, options } = await classificationCode(msg, bill);

          fetch(process.env.ULTRAMSG_URL, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              token: process.env.ULTRAMSG_TOKEN,
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
      });
    })
    .catch((error) => {
      console.log(error);
      return;
    });
};

const classificationCode = async (text, bill) => {
  console.log("the bill is ", bill);
  const priorityAndOther = `the priority of this bill is: ${bill.context.priority} , if it is 0 is ok, 1 is important for the user to pay, 2 is urgent and we need the payment now.`;
  const priorityOther = `also take into account this:${bill.context.other}`;
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
          content: ` You are a debt collector. user has intention to pay on time. thank him and tell him to send a proof of payment onces he paid.${priorityOther} in spanish`,
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
          content: ` You are a debt collector. user has paid. thank him. ${priorityOther} in spanish`,
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
          content: ` You are a debt collector. user has said if he can move payment day. ${
            JSON.parse(bill.context.editDueDate)
              ? "Ask him when will he pay."
              : `Remind him he is not able to move his payment day. ${priorityOther}`
          } in spanish`,
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
          content: ` You are a debt collector. user has said if he can move payment day to a new specified date.  ${
            JSON.parse(bill.context.editDueDate)
              ? "Confirm new payment day only if the date isnt greater than december 31st 2024. and thank him"
              : `Remind him he is not able to move his payment day ${priorityOther}`
          } . in spanish`,
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
          content: ` You are a debt collector. we sent a payment reminder and the user has ignored or avoided the question. remind him to pay. polite but angry.${priorityAndOther} in spanish.be brief in one paragraph.`,
        },
        { role: "user", content: text },
      ],
      model: "gpt-3.5-turbo",
    });
    const casoCincoText = casoCinco.choices[0].message.content;
    return { text: casoCincoText, options: {} };
  } else {
    console.log("nos se clasifico en nada");
    return { text: "error", options: {} };
  }
};

const logController = (req, res) => {
  const user = "GPT";
  Bills.find({ status: { $in: ["0", "1"] } })
    .populate("client")
    .then((bills) => {
      bills.forEach(async (bill) => {
        const priorityAndOther = `the priority of this bill is: ${bill.context.priority} , if it is 0 is ok, 1 is important for the user to pay, 2 is urgent and we need the payment now. also take into account this:${bill.context.other}. be brief. include users name: ${bill.client.clientName} ,bill ID:  ${bill.billId} and amount: Q ${bill.amount}. in spanish.`;

        const openAiResponse = await openai.chat.completions.create({
          messages: [
            {
              role: "system",
              content: ` You are a debt collector. ${priorityAndOther}`,
            },
          ],
          model: "gpt-3.5-turbo",
        });
        const generatedText = openAiResponse.choices[0].message.content;

        const logEntry = {
          user: user,
          msg: generatedText,
        };
        fetch(process.env.ULTRAMSG_URL, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            token: process.env.ULTRAMSG_TOKEN,
            to: `+502${bill.client.phone}`,
            body: `${generatedText}`,
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
};

const logEvent = async (billId, eventCase, message) => {
  const newLog = {
    date: new Date(),
    case: eventCase,
    message,
  };

  Bills.findByIdAndUpdate(billId, { $push: { log: newLog } }, { new: true })
    .then((updatedBill) => {
      if (!updatedBill) {
        return res.status(404).json({
          message: "Bill not found",
        });
      }

      return res.status(200).json({
        message: "Bill updated",
        bill: updatedBill,
      });
    })
    .catch((error) => {
      console.log(error);
      return res.status(500).json({
        error,
        message: "Error updating bill",
      });
    });
};

const sendEmailsToClients = async (userId) => {
  const clients = await Clients.find({ user: userId }).populate("flow");
  console.log("1");
  for (const client of clients) {
    console.log("2");
    const context = [
      {
        role: "system",
        content: AI_GENERAL_CONTEXT.BUSSINESS_DEFINITION,
      },
    ];
    console.log("3");

    console.log(client);
    console.log(client.flow);
    const flowArray = [
      {
        role: "system",
        content: client.flow.preCollection,
      },
      {
        role: "system",
        content: client.flow.paymentConfirmation,
      },
      {
        role: "system",
        content: client.flow.paymentConfirmationVerify,
      },
      {
        role: "system",
        content: client.flow.paymentDelay,
      },
      {
        role: "system",
        content: client.flow.paymentDelayNewDate,
      },
    ];

    console.log("4");
    if (client.ai) {
      const bills = await Bills.find({ client: client._id });
      //trabajar en el caso en el que es mas de una factura por cliente
      //por ahora vamos a mandar un email por factura en problema

      // const billIdsString = bills.map((bill) => bill.billId).join(", ");

      console.log("5");
      for (const bill of bills) {
        console.log("6");
        if (bill.ai) {
          const transformedLog = bill.log.map((entry) => {
            console.log("7");
            return {
              role: entry.role || "system",
              content: `on ${entry.date} : ${entry.message}`,
            };
          });

          const billContext = [...context, ...flowArray, ...transformedLog];

          console.log("billContext", billContext);

          const openAiResponse = await openai.chat.completions.create({
            messages: billContext,
            model: "gpt-3.5-turbo",
          });
          const generatedText = openAiResponse.choices[0].message.content;
          console.log("8");

          // cuando sean varias facturas juntas?
          //const subject = `Cobro pendiente facturas : ${billIdsString}`;
          const subject = `Cobro pendiente factura ${bill.billId} `;

          const content = `<html>
          <body>
          <h1>Estimado cliente ${client.contactName} de ${client.clientName}</h1>
          <h3>${generatedText}</h3>
          <h3>atentamente</h3>
          </body></html>`;
          console.log("9");
          await sendEmailSES(client.email, content, subject);
          await Bills.findOneAndUpdate(
            { _id: bill._id },
            {
              $push: {
                log: {
                  date: new Date(),
                  case: LOG_ENTRY_TYPE.MESSAGE_SENT,
                  role: "assistant",
                  content: `${generatedText}`,
                },
              },
            },
            { new: true }
          );
        }
      }
      //fin cliente
    }
  }
  return;
};

const readEmail = async (email, billId, text) => {
  try {
    const client = await Clients.findOne({ email }).populate("flow");
    console.log(client);
    const bill = await Bills.findOne({
      billId,
      client: new mongoose.Types.ObjectId(client._id),
    });

    if (!bill) {
      console.log("No bill found");
      return;
    }

    const context = [
      {
        role: "system",
        content: AI_GENERAL_CONTEXT.BUSSINESS_DEFINITION,
      },
    ];

    const transformedLog = bill.log.map((entry) => {
      return {
        role: entry.role,
        content: `on ${entry.date} : ${entry.content}`,
      };
    });

    context.push(transformedLog);

    const intentionContext = [
      ...context,
      {
        role: "system",
        content: ` You are a debt collector. We have sent a reminder to pay. this is the users response. I need you to respond only the word: one, two, three, four or five, "one" if user has intention to pay on time. "two" if user has paid and sent a confirmation of payment. "three" if user is asking to move payment day. "four" if user is setting a new payment date. "five" if the message has no relation to paying.`,
      },
      { role: "user", content: text },
    ];

    console.log(intentionContext);
    const calssifyResponse = await openai.chat.completions.create({
      messages: intentionContext,
      model: "gpt-3.5-turbo",
    });
    const userIntention = calssifyResponse.choices[0].message.content;

    context.push({
      role: "user",
      content: text,
    });

    //push a new system message if necesary
    context.push({
      role: "system",
      content:
        "Dada la conversacion anterior, el cliente respondio y su intencion de pago es la siguiente",
    });

    if (userIntention.toLowerCase() === "one") {
      //paymentConfirmation
      context.push({
        role: "system",
        content: `El usuario dice que va a pagar a tiempo y ${client.flow.paymentConfirmation}`,
      });
    } else if (userIntention.toLowerCase() === "two") {
      //paymentConfirmationVerify
      context.push({
        role: "system",
        content: `El usuario dice que ya pago y ${client.flow.paymentConfirmationVerify}`,
      });
    } else if (userIntention.toLowerCase() === "three") {
      //paymentDelay
      context.push({
        role: "system",
        content: `El usuario dice que se atraso y ${client.flow.paymentDelay}`,
      });
    } else if (userIntention.toLowerCase() === "four") {
      //paymentDelayNewDate
      context.push({
        role: "system",
        content: `El usuario dice nueva fecha de pago ${client.flow.paymentDelayNewDate}`,
      });
    } else if (userIntention.toLowerCase() === "five") {
      //collectionIgnored
      context.push({
        role: "system",
        content: `El usuario nos ignoro, nos dijo algo que no tiene sentido ${client.flow.collectionIgnored}`,
      });
    }
    console.log("about to end response");
    const openAiResponse = await openai.chat.completions.create({
      messages: context,
      model: "gpt-3.5-turbo",
    });
    const generatedText = openAiResponse.choices[0].message.content;

    console.log(generatedText);
    //push generatedText to the log
    await Bills.findOneAndUpdate(
      { _id: bill._id },
      {
        $push: {
          log: [
            {
              date: new Date(),
              case: LOG_ENTRY_TYPE.MESSAGE_RECEIVED,
              role: "user",
              content: `${text}`,
            },
            {
              date: new Date(),
              case: LOG_ENTRY_TYPE.MESSAGE_SENT,
              role: "assistant",
              content: `${generatedText}`,
            },
          ],
        },
      },
      { new: true }
    );
    //send the message back

    return generatedText;
  } catch (error) {
    console.log(error);
    return;
  }
};

const getEmailandBillIdFromEmail = async (emailContent) => {
  const openAiResponse = await openai.chat.completions.create({
    messages: transformedLog,
    model: "gpt-3.5-turbo",
  });
  const generatedText = openAiResponse.choices[0].message.content;
};
module.exports = { sendEmailsToClients, readEmail };
