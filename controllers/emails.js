const {
  logController,
  mensajeController,
  classController,
} = require("../utils/ai");

exports.sendEmail = (req, res) => {
  res.send("sent email");
};

exports.readEmail = (req, res) => {
  console.log(req.body.reply_plain.plain);
  console.log("eso fue plain");
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
