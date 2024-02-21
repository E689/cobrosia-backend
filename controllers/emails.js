const Clients = require("../models/clients");
const Bills = require("../models/bills");
const { json } = require("express");
const {
  logController,
  mensajeController,
  classController,
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
          "user is sending you an email address and numbers in this string. reply in valid JSON format, with the email and billId with the numbers you find. If you find more than one numnber add them to an array billId:[number1,number2,...]. need to parse it later",
      },
      {
        role: "user",
        content: req.body.headers.from + req.body.headers.subject,
      },
    ],
    model: "gpt-3.5-turbo",
  });
  const generatedText = openAiResponse.choices[0].message.content;

  console.log(generatedText);

  const { email, billId } = JSON.parse(generatedText);

  const client = await Clients.findOne({ email }).populate("flows");

  const context = [
    {
      role: "system",
      content: AI_GENERAL_CONTEXT.BUSSINESS_DEFINITION,
    },
  ];
  const flowArray = [
    {
      role: "system",
      content: client.flows.preCollection,
    },
    {
      role: "system",
      content: client.flows.paymentConfirmation,
    },
    {
      role: "system",
      content: client.flows.paymentConfirmationVerify,
    },
    {
      role: "system",
      content: client.flows.paymentDelay,
    },
    {
      role: "system",
      content: client.flows.paymentDelayNewDate,
    },
    {
      role: "system",
      content: client.flows.collectionIgnored,
    },
  ];

  if (client.ai) {
    const bill = await Bills.findOne({ client: client._id });

    const transformedLog = bill.log.map((entry) => {
      return {
        role: entry.role || "system",
        content: `on ${entry.date} : ${entry.message}`,
      };
    });

    const billContext = [...context, ...flowArray, ...transformedLog];

    const openAicleanEmail = await openai.chat.completions.create({
      messages: [
        {
          role: "system",
          content:
            "te envio un email. necesito que extraigas el primer texto. todo lo que va despues lo ignoras. Ignora todo el resto de la conversacion. NO modifiques el texto. ",
        },
        {
          role: "system",
          content: req.body.plain,
        },
      ],
      model: "gpt-3.5-turbo",
    });
    const cleanEmail = openAicleanEmail.choices[0].message.content;

    console.log("vino", req.body.plain);
    console.log("limpio", cleanEmail);

    billContext.push({
      role: "user",
      content: cleanEmail,
    });

    const openAiResponse = await openai.chat.completions.create({
      messages: billContext,
      model: "gpt-3.5-turbo",
    });
    const generatedText = openAiResponse.choices[0].message.content;
    const subject = `Seguimiento ${billId}`;
    const content = `<html>
        <body>
        <h1 style="color:blue;">Estimado cliente,</h1>
        <h3>${generatedText} </h3>
        <h3>atentamente</h3>
        </body></html>`;
    await sendEmailSES(email.toLowerCase(), content, subject);

    await Bills.findOneAndUpdate(
      { _id: bill._id },
      {
        $push: {
          log: [
            {
              date: new Date(),
              case: LOG_ENTRY_TYPE.MESSAGE_RECEIVED,
              role: "user",
              content: `${cleanEmail}`,
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
  }
  res.send("Email read and replied");
};
