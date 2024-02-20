const { json } = require("express");
const {
  logController,
  mensajeController,
  classController,
} = require("../utils/ai");

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
          "user is sending you an email address and numbers in this string. reply with this valid json {email,billId}, with the email and billId with the numbers you find. If you find more than one numnber add them to an array billId:[number1,number2,...]",
      },
      {
        role: "user",
        content: req.body.headers.from + req.body.headers.subject,
      },
    ],
    model: "gpt-3.5-turbo",
  });
  const generatedText = openAiResponse.choices[0].message.content;

  console.log("recibi esto", generatedText, req.body.reply_plain);

  const { email } = JSON.parse(generatedText);

  const subject = `Disculpe`;
  const content = `<html>
      <body>
      <h1 style="color:blue;">Estimado cliente,</h1>
      <h3>quien es usted?</h3>
      <h3> y por que me dijo> ${req.body.reply_plain} </h3>
      <h3>atentamente nosotros LA EMPRESA COBRADORA</h3>
      </body></html>`;
  await sendEmailSES(email, content, subject);
  // getClient (email)
  // getBill (client Id, bill Id)

  //use Log to generate a response

  //send response

  //log the response

  res.send("Email read and replied");
};
