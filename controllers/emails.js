const {
  logController,
  mensajeController,
  classController,
} = require("../utils/utilityFile.js");

exports.sendEmail = (req, res) => {
  res.send("sent email");
};

exports.readEmail = (req, res) => {
  console.log(req.body);
  //Exctract email
  //Extract billId
  //Extract incoming message

  //getClient (email)
  //getBill (client Id, bill Id)

  //use Log to generate a response

  //send response

  //log the response

  res.send("Email read and replied");
};
