const { MessageClient } = require("cloudmailin");

const client = new MessageClient({
  username: process.env.CLOUDMAILIN_USER,
  apiKey: process.env.CLOUDMAILIN_KEY,
});

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
