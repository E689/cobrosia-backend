const jwt = require("jsonwebtoken");
const { expressjwt: ejwt } = require("express-jwt");
const crypto = require("crypto");
const xlsx = require("xlsx");
const csvParser = require("csv-parser");
const Users = require("../models/users");
const Clients = require("../models/clients");
const Bills = require("../models/bills");
const {
  sendEmailCloudRegister,
  sendEmailCloud,
  sendEmailSES,
} = require("../utils/email");
const { LOG_ENTRY_TYPE } = require("../constants");
const { sendEmailsToClients } = require("../utils/ai");

const { updateUserClientBills } = require("../services/bills");
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
                log: [
                  {
                    date: new Date(),
                    case: LOG_ENTRY_TYPE.BILL_CREATED,
                    role: "system",
                    content: `bill number ${billId} created`,
                  },
                ],
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

exports.createUserFromFile = async (req, res) => {
  try {
    let lineCount = 0;
    const email = req.body.email;
    if (!email) {
      return res.status(400).send("Email is required.");
    }

    const existingUser = await Users.findOne({ email });

    if (existingUser) {
      return res.status(409).json({
        message: "Email is already registered. Please use a different email.",
      });
    }

    if (!req.file) {
      return res.status(400).send("No file provided.");
    }

    if (
      req.file.mimetype.includes("excel") ||
      req.file.mimetype.includes("csv")
    ) {
      res.status(200).send("File received. Processing started.");
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
      .then(async (newUser) => {
        console.log(`User created ${newUser.name}`);
        const newUsersId = newUser._id;
        const newClients = [];
        const newBills = [];

        if (req.file.mimetype.includes("excel")) {
          const workbook = xlsx.read(req.file.buffer, { type: "buffer" });
          let isFirstRow = true;
          workbook.SheetNames.forEach(async (sheetName) => {
            const sheet = workbook.Sheets[sheetName];
            const data = xlsx.utils.sheet_to_json(sheet, { header: 1 });

            data.forEach((row) => {
              if (isFirstRow) {
                isFirstRow = false;
                return;
              }
              const existingClient = newClients.find(
                (client) => client.clientId === row[9]
              );
              let existingClientId, latestClientId;

              if (existingClient) {
                existingClientId = existingClient._id;
              } else {
                newClients.push(
                  new Clients({
                    clientName: row[10],
                    clientId: row[9],
                    user: newUsersId,
                  })
                );
                latestClientId = newClients[newClients.length - 1]._id;
              }

              const existingBill = newBills.find(
                (bill) => bill.billId === row[4]
              );

              if (!existingBill) {
                newBills.push(
                  new Bills({
                    billId: row[4],
                    amount: row[14],
                    date: row[0],
                    client: existingClient ? existingClientId : latestClientId,
                    log: [
                      {
                        date: new Date(),
                        case: LOG_ENTRY_TYPE.BILL_CREATED,
                        role: "system",
                        content: `bill number ${row[4]} created`,
                      },
                    ],
                  })
                );
              }
              lineCount++;
            });

            Clients.insertMany(newClients)
              .then((savedClients) => {
                console.log("Clients saved successfully:");
                Bills.insertMany(newBills)
                  .then((savedBills) => {
                    console.log("Bills saved successfully:");
                    return;
                  })
                  .catch((err) => console.error("Error saving bills:", err));
                return;
              })
              .catch((err) => console.error("Error saving clients:", err));

            await sendEmailSES(
              "santiagosolorzanopadilla@gmail.com",
              `<html>
              <body>
              <h1>Gracias por usar cobros.ai</h1 style="color:red;">
              <h3>Su password temporal es: ${tempPassword}</h3>
              <h3>Ingresa con tu correo y password al dashboard</h3>
              </body></html>`,
              `Aqui está tu reporte Cobros AI ${newUser.name} !`
            );

            await sendEmailCloudRegister(newUser.email, tempPassword);
            console.log(`sent email with password : ${tempPassword}`);
            return;
          });
          //res.status(200).send(`File uploaded and processed successfully.${email}`);
          console.log(
            `File uploaded and processed successfully ${lineCount} rows. email ${email}`
          );
          return;
        } else {
          res
            .status(400)
            .send("Unsupported file format. Please upload an Excel file.");
        }
      })
      .catch((error) => {
        console.log(`Error creating user ${error}`);
      });
  } catch (error) {
    console.error(error);
    //res.status(500).send("Internal Server Error");
    return;
  }
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

exports.deleteUser = async (req, res) => {
  try {
    const { email } = req.body;

    const user = await Users.findOne({ email });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const clients = await Clients.find({ user: user._id });

    for (const client of clients) {
      await Bills.deleteMany({ client: client._id });

      await Clients.findByIdAndDelete(client._id);
    }

    // Delete the user
    await Users.findByIdAndDelete(user._id);

    return res
      .status(200)
      .json({ message: "User and associated data deleted successfully" });
  } catch (error) {
    return res
      .status(500)
      .json({ error, message: "Error deleting user and associated data" });
  }
};

exports.updateAllBillsByUser = async (req, res) => {
  const userId = req.params.id;
  await updateUserClientBills(userId);

  res.status(200).json({ message: "all updated" });
};

exports.emailAllBillsByUser = async (req, res) => {
  const userId = req.params.id;
  await sendEmailsToClients(userId);
  res.status(200).json({ message: "emails sent" });
};
