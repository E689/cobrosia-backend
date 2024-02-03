const jwt = require("jsonwebtoken");
const { expressjwt: ejwt } = require("express-jwt");
const Users = require("../models/users");
const { forgotPasswordEmailParams } = require("../utils/email");

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

exports.createUserFromEmail = (req, res) => {
  const { email } = req.body;
  if (!email) {
    return res.status(400).json({
      message: "Missing parameters. Please enter email",
    });
  }

  Users.findOne({ email })
    .then((existingUser) => {
      if (existingUser) {
        return res.status(409).json({
          message: "Email is already registered. Please use a different email.",
        });
      }

      const token = jwt.sign({ email }, process.env.JWT_RESET_PASSWORD, {
        expiresIn: "5m",
      });

      const newUser = new Users({ email, resetPasswordLink: token });

      newUser
        .save()
        .then((newUser) => {
          //sending email with temp password
          forgotPasswordEmailParams(email, token);
          return res.status(201).json({
            message: "Check your email to validate account",
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
        email: foundUser.name,
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
      const token = jwt.sign(
        { _id: user._id },
        process.env.JWT_RESET_PASSWORD,
        {
          expiresIn: "5m",
        }
      );

      user
        .updateOne({ resetPasswordLink: token })
        .then((user) => {
          forgotPasswordEmailParams(email, token);
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
