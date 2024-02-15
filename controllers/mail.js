// const nodemailer = require("nodemailer");
// const transporter = nodemailer.createTransport({
//   service: "gmail",
//   auth: {
//     user: process.env.MAIL,
//     pass: process.env.PASSWORD,
//   },
// });
// exports.sendMails = (req, res) => {
//   const mailOptions = {
//     from: "jp843477@gmail.com",
//     to: "santiagosolorzanopadilla@gmail.com",
//     subject: "Le recuerdo de su pago",
//     text: `pague don.`,
//   };

//   transporter.sendMail(mailOptions, (error, info) => {
//     if (error) {
//       console.error("Error sending email:", error);
//     } else {
//       console.log("Email sent:", info.response);
//     }
//   });
// };

exports.readEmail = (req, res) => {
  console.log(req.body);
  res.send("Thanks!");
};
