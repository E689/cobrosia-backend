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

  const respuesta = await readEmail(email, billId, req.body.plain);

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
