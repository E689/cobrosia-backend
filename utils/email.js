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

exports.sendEmailCloud = async (email, token) => {
  const response = await client.sendMessage({
    to: email,
    from: "test@uim.com.gt",
    plain: `your reset link is: ${token}`,
    html: `<h1>your reset link is: ${token}</h1>`,
    subject: "Forgot password",
  });
  console.log("email sent from cloudmail");
  return;
};

exports.sendEmailCloudRegister = async (email, token) => {
  const response = await client.sendMessage({
    to: email,
    from: "test@uim.com.gt",
    plain: `Gracias por usar Cobros AI. \n Adjunto tu reporte de Facturas y Clientes. En este podrias ver todas tus facturas y clientes listas para revisar datos y comenzar a utilizar el seguimiento AI.\n Accede al tablero con vistas, tablas y muchos mas. Gratis por una hora. En cobros.ai usa esta direccion de  email y la contraseña temporal de abajo: \n ${token}`,
    html: `<h1> Gracias por usar Cobros AI.</h1> \n <h2> Adjunto tu reporte de Facturas y Clientes. En este podrias ver todas tus facturas y clientes listas para revisar datos y comenzar a utilizar el seguimiento AI.</h2>\n <h2> Accede al tablero con vistas, tablas y muchos mas.</h2> <h2> Gratis por una hora. En cobros.ai usa esta direccion de  email y la contraseña temporal de abajo:</h2> <h1> \n ${token} </h1`,
    subject: "Aqui esta tu reporte Cobros AI",
  });
  console.log("email sent from cloudmail");
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
