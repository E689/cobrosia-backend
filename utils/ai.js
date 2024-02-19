const OpenAI = require("openai");
const openai = new OpenAI({
  apiKey: process.env.OPENAI_KEY,
});

const Clients = require("../models/clients");
const Bills = require("../models/bills");
const Users = require("../models/users");
const { LOG_ENTRY_TYPE } = require("../constants");

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

const mensajeController = async (req, res) => {
  const { contactNumber, firstMessage, lastMessage } = req.body;
  console.log("contact number", contactNumber);

  getLogByPhone(contactNumber.slice(3), lastMessage);
  return res.status(200).json({
    message: `fallo exitosamente`,
  });

  // const respuesta = await funcionCatchy(lastMessage);
  // console.log("la respuesta es", respuesta);
  // fetch(process.env.ULTRAMSG_URL, {
  //   method: "POST",
  //   headers: {
  //     "Content-Type": "application/json",
  //   },
  //   body: JSON.stringify({
  //     token: process.env.ULTRAMSG_TOKEN,
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
};

const classController = async (req, res) => {
  const { text, phone } = req.body;
  const respuesta = await classifyMessage(text);
  return res.status(200).json({
    message: `${respuesta}`,
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

module.exports = {
  classificationCode,
  getLogByPhone,
  funcionCatchy,
  logController,
  mensajeController,
  classController,
};
