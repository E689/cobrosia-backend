const Clients = require("../models/clients");
const Bills = require("../models/bills");
const { json } = require("express");
const {
  logController,
  mensajeController,
  classController,
  readEmail,
} = require("../utils/ai");

const { sendEmailSES } = require("../utils/email");
const {
  AI_GENERAL_CONTEXT,
  LOG_ENTRY_TYPE,
  LOG_ROLE,
} = require("../constants");

const OpenAI = require("openai");
const openai = new OpenAI({
  apiKey: process.env.OPENAI_KEY,
});
exports.sendEmail = (req, res) => {
  res.send("sent email");
};

exports.readEmail = async (req, res) => {
  const openAiResponse = await openai.chat.completions.create({
    messages: [
      {
        role: "system",
        content:
          "user will send you 2 texts. first is the Subject of an email. extract the number or numbers you find.next he will send you an email reply text I need you to extract the email. respond on this VALID JSON FORMAT FOR ME TO PARSE IT with email and billId ",
      },
      {
        role: "user",
        content: `text 1 :${req.body.headers.from} + text 2 :${req.body.headers.subject}`,
      },
    ],
    model: "gpt-3.5-turbo",
  });
  const generatedText = openAiResponse.choices[0].message.content;

  console.log(generatedText);

  const { email, billId } = JSON.parse(generatedText);

  const respuesta = await readEmail(
    email.toLowerCase(),
    billId,
    req.body.plain
  );

  const subject = `Seguimiento ${billId}`;
  const content = `<html>
        <body>
        <h1>Estimado cliente,</h1>
        <h3>${respuesta} </h3>
        <h3>atentamente</h3>
        </body></html>`;
  await sendEmailSES(email.toLowerCase(), content, subject);

  res.send("Email read and replied");
};

exports.readTestChat = async (req, res) => {
  const billId = req.body.billId;
  const text = req.body.text;
  console.log(billId);

  const bill = await Bills.findById({ _id: billId }).populate({
    path: "client",
    populate: [{ path: "flow" }, { path: "user" }],
  });

  const context = [
    {
      role: "system",
      content: `${bill.client.user.companyName} ${bill.client.user.businessLogic} ${bill.client.user.assistantContext}`,
    },
  ];

  if (bill.testLog.length < 1) {
    const intentionContext = [
      ...context,
      {
        role: "system",
        content: `You are a debt collector. given the context of the bill send a message to the client`,
      },
    ];

    const agentMessage = await openai.chat.completions.create({
      messages: intentionContext,
      model: "gpt-3.5-turbo",
    });
    const agent = agentMessage.choices[0].message.content;

    bill.testLog.push({
      date: new Date(),
      case: LOG_ENTRY_TYPE.MESSAGE_SENT,
      role: "assistant",
      content: `${agent}`,
    });
  } else {
    const transformedLog = bill.testLog.map((entry) => {
      return {
        role: entry.role,
        content: `on ${entry.date} : ${entry.content}`,
      };
    });

    context.push(...transformedLog);

    const intentionContext = [
      ...context,
      {
        role: "system",
        content: ` You are a debt collector. We have sent a reminder to pay. this is the users response. I need you to respond only the word: one, two, three, four or five, "one" if user has intention to pay on time. "two" if user has paid and sent a confirmation of payment. "three" if user is asking to move payment day. "four" if user is setting a new payment date. "five" if the message has no relation to paying.`,
      },
      { role: "user", content: text },
    ];

    const calssifyResponse = await openai.chat.completions.create({
      messages: intentionContext,
      model: "gpt-3.5-turbo",
    });
    const userIntention = calssifyResponse.choices[0].message.content;

    if (userIntention.toLowerCase() === "one") {
      //paymentConfirmation
      context.push({
        role: "system",
        content: `El usuario dice que va a pagar a tiempo y ${bill.client.flow.paymentConfirmation}, respondele al cliente, a mi y usa todo el contexto anterior de la conversasion`,
      });
    } else if (userIntention.toLowerCase() === "two") {
      //paymentConfirmationVerify
      context.push({
        role: "system",
        content: `El usuario dice que ya pago y ${bill.client.flow.paymentConfirmationVerify}, respondele al cliente, a mi y usa todo el contexto anterior de la conversasion`,
      });
    } else if (userIntention.toLowerCase() === "three") {
      //paymentDelay
      context.push({
        role: "system",
        content: `El usuario dice que se atraso y ${bill.client.flow.paymentDelay}, respondele al cliente, a mi y usa todo el contexto anterior de la conversasion`,
      });
    } else if (userIntention.toLowerCase() === "four") {
      //paymentDelayNewDate
      context.push({
        role: "system",
        content: `El usuario dice nueva fecha de pago ${bill.client.flow.paymentDelayNewDate}, respondele al cliente, a mi y usa todo el contexto anterior de la conversasion`,
      });
    } else if (userIntention.toLowerCase() === "five") {
      //collectionIgnored
      context.push({
        role: "system",
        content: `El usuario nos ignoro, nos dijo algo que no tiene sentido ${bill.client.flow.collectionIgnored}, respondele al cliente, a mi y usa todo el contexto anterior de la conversasion`,
      });
    }
    console.log(`el caso fue ${userIntention.toLowerCase()}`);
    const openAiResponse = await openai.chat.completions.create({
      messages: context,
      model: "gpt-3.5-turbo",
    });
    const generatedText = openAiResponse.choices[0].message.content;

    bill.testLog.push(
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
      }
    );
  }

  const updatedLog = await bill.save();

  res.status(200).send(updatedLog.testLog);
  // guardarlo en un test chat que cuando el user lo reinicia lo borro.
};

exports.deleteTestChat = async (req, res) => {
  const billId = req.body.billId;
  const updatedBill = await Bills.findByIdAndUpdate(
    billId,
    { testLog: [] },
    { new: true }
  );
  res.status(200).send(updatedBill.testLog);
};
