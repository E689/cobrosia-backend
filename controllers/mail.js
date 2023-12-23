const nodemailer = require("nodemailer");
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: "jp843477@gmail.com",
    pass: "Hola843477",
  },
});
exports.sendMails = (req, res) => {
  const mailOptions = {
    from: "jp843477@gmail.com",
    to: "santiagosolorzanopadilla@gmail.com",
    subject: "Le recuerdo de su pago",
    text: `pague don.`,
  };

  transporter.sendMail(mailOptions, (error, info) => {
    if (error) {
      console.error("Error sending email:", error);
    } else {
      console.log("Email sent:", info.response);
    }
  });
};
