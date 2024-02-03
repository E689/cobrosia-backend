const { MessageClient } = require("cloudmailin");

const client = new MessageClient({
  username: process.env.CLOUDMAILIN_USER,
  apiKey: process.env.CLOUDMAILIN_KEY,
});

const AWS = require("aws-sdk");

AWS.config.update({
  accessKeyId: process.env.AWS_ACCESS_KEY,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION,
});
const ses = new AWS.SES({ apiVersion: "2010-12-01" });

exports.forgotPasswordEmailParams = async (email, token) => {
  const response = await client.sendMessage({
    to: email,
    from: "test@example.com",
    plain: "test message",
    html: `<h1>your reset link is: ${token}</h1>`,
    subject: "hello world",
  });
  console.log("email sent");
  return;
};

exports.sendEmailSES = async (email, content, subject) => {
  const params = emailParams(email, content, subject);
  const sendEmailOnRegister = ses.sendEmail(params).promise();
  sendEmailOnRegister
    .then((data) => {
      console.log("email submitted to SES", data);
    })
    .catch((error) => {
      console.log("error ses email on register", error);
    });
  return;
};

const emailParams = (email, content, subject) => {
  return {
    Source: process.env.EMAIL_FROM,
    Destination: {
      ToAddresses: [email],
    },
    ReplyToAddresses: [process.env.EMAIL_TO],
    Message: {
      Body: {
        Html: {
          Charset: "UTF-8",
          Data: `<html>
              <body>
              <h1>Gracias por usar cobros.ai</h1 style="color:red;">
              <h3>Su password temporal es: ${content}</h3>
              <h3>Ingresa con tu correo y password al dashboard</h3>
              </body></html>`,
        },
      },
      Subject: {
        Charset: "UTF-8",
        Data: subject,
      },
    },
  };
};
