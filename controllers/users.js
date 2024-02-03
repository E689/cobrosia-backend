const jwt = require("jsonwebtoken");
const { expressjwt: ejwt } = require("express-jwt");
const Users = require("../models/users");
const { forgotPasswordEmailParams } = require("../utils/email");

exports.createUser = (req, res) => {
  const { email, name, password } = req.body;
  if (!email || !name || !password) {
    return res.status(400).json({
      message: "Missing parameters. Please enter email, name, and password.",
    });
  }

  Users.findOne({ email })
    .then((existingUser) => {
      if (existingUser) {
        return res.status(409).json({
          message: "Email is already registered. Please use a different email.",
        });
      }
      const newUser = new Users({ email, name, password });

      newUser
        .save()
        .then((newUser) => {
          return res.status(201).json({
            message: "User created",
            user: { name: newUser.name, id: newUser._id },
          });
        })
        .catch((error) => {
          console.log(error);
          return res.status(500).json({
            error,
            message: "Error creating user",
          });
        });
    })
    .catch((error) => {
      console.log(error);
      return res.status(500).json({
        error,
        message: "Error checking for existing email",
      });
    });
};

exports.logUser = (req, res) => {
  const { email, password } = req.body;
  console.log(JSON.stringify(req.body.username));
  console.log(req.body.password);
  Users.findOne({ email })
    .then((foundUser) => {
      if (!foundUser) {
        console.log("user not found");
        return res.status(400).json({
          error: "User with that email does not exist. Please register first.",
        });
      }
      // authenticate
      if (!foundUser.authenticate(password)) {
        console.log("worng password");
        return res.status(400).json({
          error: "Incorrect password",
        });
      }

      const token = jwt.sign(
        {
          _id: foundUser._id,
          name: foundUser.name,
        },
        process.env.JWT_SECRET,
        {
          expiresIn: "7d",
        }
      );

      return res.status(200).json({
        name: foundUser.name,
        id: foundUser._id.toString(),
        jwt: token,
      });
    })
    .catch((err) => {
      console.log(err);
      return res.status(500).json({
        error: `Please try again.`,
      });
    });
};

exports.activateUser = (req, res) => {};

exports.resetPassword = (req, res) => {
  const { resetPasswordLink, newPassword } = req.body;
  if (resetPasswordLink) {
    jwt.verify(
      resetPasswordLink,
      process.env.JWT_RESET_PASSWORD,
      (err, decoded) => {
        console.log(err);
        if (err) {
          return res.status(401).json({
            error: "Expired link, please try registering again",
          });
        }

        User.findOne({ resetPasswordLink })
          .then((user) => {
            console.log("reset password for user found", user);

            const updatedFields = {
              password: newPassword,
              resetPasswordLink: "",
            };

            user = _.extend(user, updatedFields);

            user
              .save()
              .then((user) => {
                console.log("updated password");
                return res.json({
                  message: "updated password",
                });
              })
              .catch((err) => {
                return res.status(400).json({
                  error: `Please try again.`,
                });
              });
          })
          .catch((err) => {
            console.log(err);
            return res.status(401).json({
              error: `Please try again. Invalid token`,
            });
          });
      }
    );
  }
};

exports.forgotPassword = (req, res) => {
  const { email } = req.body;
  Users.findOne({ email })
    .then((user) => {
      console.log("found user", user);

      const token = jwt.sign(
        { _id: user._id },
        process.env.JWT_RESET_PASSWORD,
        {
          expiresIn: "5m",
        }
      );

      const params = forgotPasswordEmailParams(email, token);
      user
        .updateOne({ resetPasswordLink: token })
        .then((user) => {
          const sendEmail = ses
            .sendEmail(params)
            .promise()
            .then((data) => {
              console.log("ses reset pw ", data);
              return res.json({
                message: `Email sent to ${email}. Click on the link to reset your password`,
              });
            })
            .catch((error) => {
              console.log("error ", error);
              return res.status(400).json({
                message: "Password reset failed",
              });
            });
        })
        .catch((error) => {
          console.log("error ", error);
          return res.status(400).json({
            message: "Password reset failed",
          });
        });
    })
    .catch((error) => {
      console.log(Error);
      return res.status(401).json({
        error: "user not found",
      });
    });
};
