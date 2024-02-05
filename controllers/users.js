const jwt = require("jsonwebtoken");
const { expressjwt: ejwt } = require("express-jwt");
const crypto = require("crypto");
const Users = require("../models/users");
const Clients = require("../models/clients");
const Bills = require("../models/bills");
const { sendEmailCloudRegister, sendEmailCloud } = require("../utils/email");

exports.createUser = (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({
      message: "Missing parameters. Please enter email and password.",
    });
  }

  Users.findOne({ email })
    .then((existingUser) => {
      if (existingUser) {
        return res.status(409).json({
          message: "Email is already registered. Please use a different email.",
        });
      }
      const newUser = new Users({ email, password });

      newUser
        .save()
        .then((newUser) => {
          return res.status(201).json({
            message: "User created",
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

exports.createUserWithBill = (req, res) => {
  const { email, billId, amount, date, clientId, clientName } = req.body;
  if (!email || !billId || !amount || !date || !clientId || !clientName) {
    return res.status(400).json({
      message: "Missing parameters.",
    });
  }

  Users.findOne({ email })
    .then((existingUser) => {
      if (existingUser) {
        return res.status(409).json({
          message: "Email is already registered. Please use a different email.",
        });
      }
      const randomBytes = crypto.randomBytes(Math.ceil((8 * 3) / 4));
      const tempPassword = randomBytes.toString("base64").slice(0, 8);

      const newUser = new Users({
        email,
        name: email.split("@")[0],
        password: tempPassword,
      });

      newUser
        .save()
        .then((newUser) => {
          const newClient = new Clients({
            clientName,
            clientId,
            user: newUser._id,
          });

          newClient
            .save()
            .then((newClient) => {
              const data = {
                billId,
                date,
                amount,
                client: newClient._id,
              };

              const newBill = new Bills(data);

              newBill
                .save()
                .then(async (createdBill) => {
                  await sendEmailCloudRegister(email, tempPassword);
                  return res.status(201).json({
                    message: "User created. Check email.",
                  });
                })
                .catch((error) => {
                  console.log(error);
                  return res.status(500).json({
                    error,
                    message: "Error creating bill",
                  });
                });
            })
            .catch((error) => {
              console.log(error);
              return res.status(500).json({
                error,
                message: "Error creating client",
              });
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

  Users.findOne({ email })
    .then((foundUser) => {
      if (!foundUser) {
        console.log("user not found");
        return res.status(400).json({
          error: "User with that email does not exist. Please register first.",
        });
      }
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
        email: foundUser.email,
        type: foundUser.type,
      });
    })
    .catch((err) => {
      console.log(err);
      return res.status(500).json({
        error: `Please try again.`,
      });
    });
};

exports.changePassword = (req, res) => {
  const { email, oldPassword, newPassword } = req.body;

  Users.findOne({ email })
    .then((foundUser) => {
      if (!foundUser) {
        console.log("user not found");
        return res.status(400).json({
          error: "User with that email does not exist. Please register first.",
        });
      }
      if (!foundUser.authenticate(oldPassword)) {
        console.log("worng password");
        return res.status(400).json({
          error: "Incorrect password",
        });
      }

      foundUser.password = newPassword;

      foundUser
        .save()
        .then(() => {
          console.log("Password updated successfully");
          return res.status(200).json({
            message: "Password updated successfully",
          });
        })
        .catch((saveError) => {
          console.log(saveError);
          return res.status(500).json({
            error: "Error updating password",
          });
        });
    })
    .catch((err) => {
      console.log(err);
      return res.status(500).json({
        error: `Please try again.`,
      });
    });
};

exports.forgotPassword = (req, res) => {
  const { email } = req.body;
  Users.findOne({ email })
    .then((user) => {
      const randomBytes = crypto.randomBytes(Math.ceil((8 * 3) / 4));
      const tempPassword = randomBytes.toString("base64").slice(0, 8);

      // const token = jwt.sign(
      //   { _id: user._id },
      //   process.env.JWT_RESET_PASSWORD,
      //   {
      //     expiresIn: "5m",
      //   }
      // );

      user.password = tempPassword;

      user
        .save()
        .then(async (user) => {
          await sendEmailCloud(email, tempPassword);
          return res.status(200).json({
            message: "Email sent",
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
