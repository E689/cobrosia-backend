const OpenAI = require("openai");
const openai = new OpenAI({
  apiKey: process.env.OPENAI_KEY,
});
const crypto = require("crypto");
const xlsx = require("xlsx");
const csvParser = require("csv-parser");
const Clients = require("../models/clients");
const Bills = require("../models/bills");
const Users = require("../models/users");

const { sendEmailSES, sendEmailCloudRegister } = require("./email");

const classificationCode = async (text, bill) => {
  console.log("the bill is ", bill);
  const priorityAndOther = `the priority of this bill is: ${bill.context.priority} , if it is 0 is ok, 1 is important for the user to pay, 2 is urgent and we need the payment now.`;
  const priorityOther = `also take into account this:${bill.context.other}`;
  const openAiResponse = await openai.chat.completions.create({
    messages: [
      {
        role: "system",
        content: ` You are a debt collector. We have sent a reminder to pay. this is the users response. I need you to respond only the word: one, two, three, four or five, "one" if user has intention to pay on time. "two" if user has paid and sent a confirmation of payment. "three" if user is asking to move payment day. "four" if user is setting a new payment date. "five" if the message has no relation to paying.`,
      },
      { role: "user", content: text },
    ],
    model: "gpt-3.5-turbo",
  });
  const generatedText = openAiResponse.choices[0].message.content;

  console.log("open response", generatedText);
  if (generatedText.toLowerCase() === "one") {
    console.log("dice que va a pagar en tiempo");
    const casoUno = await openai.chat.completions.create({
      messages: [
        {
          role: "system",
          content: ` You are a debt collector. user has intention to pay on time. thank him and tell him to send a proof of payment onces he paid.${priorityOther} in spanish`,
        },
        { role: "user", content: text },
      ],
      model: "gpt-3.5-turbo",
    });
    const casoUnoText = casoUno.choices[0].message.content;

    return { text: casoUnoText, options: {} };
  } else if (generatedText.toLowerCase() === "two") {
    console.log("dice que ya pago");
    const casoDos = await openai.chat.completions.create({
      messages: [
        {
          role: "system",
          content: ` You are a debt collector. user has paid. thank him. ${priorityOther} in spanish`,
        },
        { role: "user", content: text },
      ],
      model: "gpt-3.5-turbo",
    });
    const casoDosText = casoDos.choices[0].message.content;
    return { text: casoDosText, options: { paid: true } };
  } else if (generatedText.toLowerCase() === "three") {
    console.log("dice que si podemos mover la fecha");
    const casoTres = await openai.chat.completions.create({
      messages: [
        {
          role: "system",
          content: ` You are a debt collector. user has said if he can move payment day. ${
            JSON.parse(bill.context.editDueDate)
              ? "Ask him when will he pay."
              : `Remind him he is not able to move his payment day. ${priorityOther}`
          } in spanish`,
        },
        { role: "user", content: text },
      ],
      model: "gpt-3.5-turbo",
    });
    const casoTresText = casoTres.choices[0].message.content;
    return { text: casoTresText, options: {} };
  } else if (generatedText.toLowerCase() === "four") {
    console.log("mando nueva fecha");
    const casoCuatro = await openai.chat.completions.create({
      messages: [
        {
          role: "system",
          content: ` You are a debt collector. user has said if he can move payment day to a new specified date.  ${
            JSON.parse(bill.context.editDueDate)
              ? "Confirm new payment day only if the date isnt greater than december 31st 2024. and thank him"
              : `Remind him he is not able to move his payment day ${priorityOther}`
          } . in spanish`,
        },
        { role: "user", content: text },
      ],
      model: "gpt-3.5-turbo",
    });
    const casoCuatroText = casoCuatro.choices[0].message.content;
    return { text: casoCuatroText, options: {} };
  } else if (generatedText.toLowerCase() === "five") {
    console.log("no dijo nada relevante");
    const casoCinco = await openai.chat.completions.create({
      messages: [
        {
          role: "system",
          content: ` You are a debt collector. we sent a payment reminder and the user has ignored or avoided the question. remind him to pay. polite but angry.${priorityAndOther} in spanish.be brief in one paragraph.`,
        },
        { role: "user", content: text },
      ],
      model: "gpt-3.5-turbo",
    });
    const casoCincoText = casoCinco.choices[0].message.content;
    return { text: casoCincoText, options: {} };
  } else {
    console.log("nos se clasifico en nada");
    return { text: "error", options: {} };
  }
};

const classifyMessage = async (msg) => {
  const openAiResponse = await openai.chat.completions.create({
    messages: [
      {
        role: "system",
        content: `usted es un cobrador. Le voy a enviar una respuesta de un usuario ante un recordatorio de pago. respondale pidiendole que page amablemente. no te extiendas mucho.`,
      },
      { role: "user", content: msg },
    ],
    model: "gpt-3.5-turbo",
  });
  const generatedText = openAiResponse.choices[0].message.content;
  return generatedText;
};

const getLogByPhone = (phone, msg) => {
  Clients.findOne({ phone })
    .then((foundClient) => {
      Bills.find({
        $and: [{ client: foundClient._id }, { status: { $in: ["0", "1"] } }],
      }).then(async (bills) => {
        bills.forEach(async (bill) => {
          if (bill.status === "2") {
            return;
          }

          const logEntry = {
            user: foundClient.contactName,
            msg,
          };
          console.log("about to classify message");
          // const respuesta = await classifyMessage(
          //   `soy ${foundClient.contactName}, le debo ${bill.amount} y era para el ${bill.date} y le acabo de enviar este mensaje:${msg}`
          // );

          const { text, options } = await classificationCode(msg, bill);

          fetch(process.env.ULTRAMSG_URL, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              token: process.env.ULTRAMSG_TOKEN,
              to: `+502${phone}`,
              body: `${text}`,
            }),
          })
            .then((response) => response.json())
            .then((data) => {
              console.log(data);
            })
            .catch((error) => {
              console.error("Fetch error:", error);
            });

          const logEntry2 = {
            user: "GPT",
            msg: text,
          };
          if (options.paid) {
            Bills.updateOne(
              { _id: bill._id },
              {
                $push: { log: [logEntry, logEntry2] },
                $set: { status: "2" },
              }
            ).then((bill) => {
              return;
            });
          }
          Bills.updateOne(
            { _id: bill._id },
            {
              $push: { log: [logEntry, logEntry2] },
            }
          ).then((bill) => {
            return;
          });
        });
      });
    })
    .catch((error) => {
      console.log(error);
      return;
    });
};

const funcionCatchy = async (firstMessage) => {
  const openAiResponse = await openai.chat.completions.create({
    messages: [
      {
        role: "system",
        content: `responde a este mensaje naturalmente como si yo fuera tu: ${firstMessage}`,
      },
    ],
    model: "gpt-3.5-turbo",
  });
  console.log("response del openAI");
  console.log(openAiResponse);
  const generatedText = openAiResponse.choices[0].message.content;
  return generatedText;
};

const logController = (req, res) => {
  const user = "GPT";
  Bills.find({ status: { $in: ["0", "1"] } })
    .populate("client")
    .then((bills) => {
      bills.forEach(async (bill) => {
        const priorityAndOther = `the priority of this bill is: ${bill.context.priority} , if it is 0 is ok, 1 is important for the user to pay, 2 is urgent and we need the payment now. also take into account this:${bill.context.other}. be brief. include users name: ${bill.client.clientName} ,bill ID:  ${bill.billId} and amount: Q ${bill.amount}. in spanish.`;

        const openAiResponse = await openai.chat.completions.create({
          messages: [
            {
              role: "system",
              content: ` You are a debt collector. ${priorityAndOther}`,
            },
          ],
          model: "gpt-3.5-turbo",
        });
        const generatedText = openAiResponse.choices[0].message.content;

        const logEntry = {
          user: user,
          msg: generatedText,
        };
        fetch(process.env.ULTRAMSG_URL, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            token: process.env.ULTRAMSG_TOKEN,
            to: `+502${bill.client.phone}`,
            body: `${generatedText}`,
          }),
        })
          .then((response) => response.json())
          .then((data) => {
            console.log(data);
          })
          .catch((error) => {
            console.error("Fetch error:", error);
          });
        await Bills.updateOne(
          { _id: bill._id },
          { $push: { log: logEntry }, $set: { status: "1" } }
        );
      });

      return res.status(200).json({
        message: "messages for bills sent",
        bills: bills,
      });
    })
    .catch((error) => {
      console.log(error);
      return res.status(500).json({
        error,
        message: "Error messaging for bills bills",
      });
    });
};

const mensajeController = async (req, res) => {
  const { contactNumber, firstMessage, lastMessage } = req.body;
  console.log("contact number", contactNumber);

  getLogByPhone(contactNumber.slice(3), lastMessage);
  return res.status(200).json({
    message: `fallo exitosamente`,
  });

  // const respuesta = await funcionCatchy(lastMessage);
  // console.log("la respuesta es", respuesta);
  // fetch(process.env.ULTRAMSG_URL, {
  //   method: "POST",
  //   headers: {
  //     "Content-Type": "application/json",
  //   },
  //   body: JSON.stringify({
  //     token: process.env.ULTRAMSG_TOKEN,
  //     to: "+50248274591",
  //     body: respuesta,
  //   }),
  // })
  //   .then((response) => response.json())
  //   .then((data) => {
  //     console.log(data);
  //     return res.status(200).json({
  //       message: `mensaje enviado`,
  //       data,
  //     });
  //   })
  //   .catch((error) => {
  //     console.error("Fetch error:", error);
  //     return res.status(200).json({
  //       message: `fallo exitosamente`,
  //       error,
  //     });
  //   });
};

const classController = async (req, res) => {
  const { text, phone } = req.body;
  const respuesta = await classifyMessage(text);
  return res.status(200).json({
    message: `${respuesta}`,
  });
};

const fileController = async (req, res) => {
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

          workbook.SheetNames.forEach(async (sheetName) => {
            const sheet = workbook.Sheets[sheetName];
            const data = xlsx.utils.sheet_to_json(sheet, { header: 1 });

            data.forEach((row) => {
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
              tempPassword,
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
        } else if (req.file.mimetype.includes("csv")) {
          // Handle CSV file using csv-parser
          const rows = [];

          const bufferString = req.file.buffer.toString("utf8");
          const stream = require("stream");
          const readableStream = new stream.Readable();
          readableStream._read = () => {};
          readableStream.push(bufferString);
          readableStream.push(null);

          readableStream
            .pipe(csvParser())
            .on("data", (row) => {
              if (
                Object.values(row).some(
                  (field) =>
                    field !== "" && field !== null && field !== undefined
                )
              ) {
                const existingClient = newClients.find(
                  (client) => client.clientId === row.nit_comprador
                );
                let existingClientId, latestClientId;

                if (existingClient) {
                  existingClientId = existingClient._id;
                } else {
                  newClients.push(
                    new Clients({
                      clientName: row.nom_comer_comprador,
                      clientId: row.nit_comprador,
                      user: newUsersId,
                    })
                  );
                  latestClientId = newClients[newClients.length - 1]._id;
                }

                const existingBill = newBills.find(
                  (bill) => bill.billId === row.numero_de_documento
                );

                if (!existingBill) {
                  newBills.push(
                    new Bills({
                      billId: row.numero_de_documento,
                      amount: row.total_impuestos,
                      date: row.fecha_registro,
                      client: existingClient
                        ? existingClientId
                        : latestClientId,
                    })
                  );
                }
                lineCount++;
              } else {
                //console.log("Skipped empty row");
              }
            })
            .on("end", () => {
              //   res
              //     .status(200)
              //     .send(`Number of lines read: ${lineCount} and email ${email}`);
              console.log(
                `Number of lines read: ${lineCount} and email ${email}`
              );
            });

          Clients.insertMany(newClients)
            .then((savedClients) => {
              console.log("Clients saved successfully");
              Bills.insertMany(newBills)
                .then((savedBills) => {
                  console.log("Bills saved successfully");
                  return;
                })
                .catch((err) => console.error("Error saving bills:", err));
              return;
            })
            .catch((err) => console.error("Error saving clients:", err));

          await sendEmailSES(
            "santiagosolorzanopadilla@gmail.com",
            tempPassword,
            `Estamos listos para cobrar ${newUser.name} !`
          );
          await sendEmailCloudRegister(newUser.email, tempPassword);
          console.log(`sent email with password : ${tempPassword}`);
          return;
        } else {
          //res.status(400).send("Unsupported file format. Please upload an Excel file.");
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

module.exports = {
  classificationCode,
  getLogByPhone,
  funcionCatchy,
  logController,
  mensajeController,
  classController,
  fileController,
};
