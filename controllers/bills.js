const Bills = require("../models/bills");
const Clients = require("../models/clients");
const Users = require("../models/users");
const xlsx = require("xlsx");

exports.createBill = (req, res) => {
  const { amount, date, status, clientId, billId, context } = req.body;
  if (!amount || !date || !status || !clientId || !billId) {
    return res.status(400).json({
      message:
        "Missing parameters. Please enter amount, date, status, clientId",
    });
  }

  const data = {
    amount,
    date,
    status,
    client: clientId,
    billId,
    log: [],
  };

  if (context) {
    data.context = context;
  }

  const newBill = new Bills(data);

  newBill
    .save()
    .then((newBill) => {
      const user = "GPT";
      Bills.find({ status: { $in: ["0", "1"] } })
        .populate("client")
        .then((bills) => {
          bills.forEach(async (bill) => {
            const logEntry = {
              user: user,
              msg: `Estimado ${bill.client.clientName} tiene una factura numero ${bill.billId} por un monto de Q ${bill.amount} pendiente de pago.`,
            };
            fetch(process.env.ULTRAMSG_URL, {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                token: process.env.ULTRAMSG_TOKEN,
                to: `+502${bill.client.phone}`,
                body: `${logEntry.msg}`,
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
              { $push: { log: logEntry } }
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
    })
    .catch((error) => {
      console.log(error);
      return res.status(500).json({
        error,
        message: "Error creating bill",
      });
    });
};

exports.createBillsFromFile = (req, res) => {
  try {
    const userId = req.body.userId;
    if (!userId) {
      return res.status(400).send("User Id is required.");
    }
    if (!req.file) {
      return res.status(400).send("No file provided.");
    }
    if (!req.file.mimetype.includes("excel")) {
      res
        .status(400)
        .send("Unsupported file format. Please upload an Excel file.");
    }

    Users.findOne({ _id: userId }).then((user) => {
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      const newUsersId = newUser._id;
      const newClients = [];
      const newBills = [];

      Clients.find({ user: userId })
        .then((clients) => {
          newClients.push(...clients);

          clients.forEach((client) => {
            Bills.find({ client: client._id })
              .then((bills) => {
                newBills.push(...bills);
                return;
              })
              .catch((error) => {
                console.error("Error fetching bills:", error);
                return res
                  .status(500)
                  .json({ error, message: "Error fetching bills" });
              });
          });
        })
        .catch((error) => {
          console.error("Error fetching clients:", error);
          return res
            .status(500)
            .json({ error, message: "Error fetching clients" });
        });

      const workbook = xlsx.read(req.file.buffer, { type: "buffer" });
      let isFirstRow = true;
      const newClientsSave = [];
      const newBillsSave = [];

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
            const createdClient = new Clients({
              clientName: row[10],
              clientId: row[9],
              user: newUsersId,
            });

            newClients.push(createdClient);
            newClientsSave.push(createdClient);
            latestClientId = newClients[newClients.length - 1]._id;
          }

          const existingBill = newBills.find((bill) => bill.billId === row[4]);

          if (!existingBill) {
            const createdBill = new Bills({
              billId: row[4],
              amount: row[14],
              date: row[0],
              client: existingClient ? existingClientId : latestClientId,
            });
            newBills.push(createdBill);
            newBillsSave.push(createdBill);
          }
        });

        Clients.insertMany(newClientsSave)
          .then((savedClients) => {
            console.log("Clients saved successfully:");
            Bills.insertMany(newBillsSave)
              .then((savedBills) => {
                console.log("Bills saved successfully:");
                return;
              })
              .catch((err) => console.error("Error saving bills:", err));
            return;
          })
          .catch((err) => console.error("Error saving clients:", err));

        return;
      });
      res.status(200).send(`File uploaded and processed successfully.${email}`);
      console.log(
        `File uploaded and processed successfully ${lineCount} rows. email ${email}`
      );
      return;
    });
  } catch (error) {
    console.error(error);
    res.status(500).send(error);
    return;
  }
};

exports.getBill = (req, res) => {};

exports.getBillsByUserId = (req, res) => {
  const userId = req.params.id;
  Clients.find({ user: userId })
    .then((clients) => {
      const clientIds = clients.map((client) => client._id);
      return Bills.find({ client: { $in: clientIds } }).populate("client");
    })
    .then((bills) => {
      const refactoredBills = bills.map((bill) => ({
        billId: bill.billId,
        date: bill.date,
        amount: bill.amount,
        status: bill.status,
        creditDays: bill.client.creditDays,
        clientName: bill.client.clientName,
        clientId: bill.client.clientId,
      }));

      return res.status(200).json({
        bills: refactoredBills,
        message: "bills from client retrieved",
      });
    })
    .catch((error) => {
      return res.status(500).json({
        error,
        message: "Error finding bill",
      });
    });
};

exports.getBillsByClientId = (req, res) => {
  const id = req.params.id;
  Bills.find({ client: id })
    .then((bill) => {
      return res.status(200).json({
        bill,
        message: "bill from client retrieved",
      });
    })
    .catch((error) => {
      return res.status(500).json({
        error,
        message: "Error finding bill",
      });
    });
};

exports.deleteBill = (req, res) => {
  const billId = req.params.id;
  if (!billId) {
    return res.status(400).json({
      message: "Missing parameter. Please provide billId.",
    });
  }
  Bills.findByIdAndDelete(billId)
    .then((deletedBill) => {
      if (!deletedBill) {
        return res.status(404).json({
          message: "Bill not found",
        });
      }
      return res.status(200).json({
        message: "Bill deleted",
        deletedBill,
      });
    })
    .catch((error) => {
      console.log(error);
      return res.status(500).json({
        error,
        message: "Error deleting bill",
      });
    });
};

//modify accept
exports.updateBill = (req, res) => {
  const id = req.params.id;
  const { amount, date, status, clientId, billId, context } = req.body;

  const updateData = {
    amount,
    date,
    status,
    billId,
    client: clientId,
  };

  if (context) {
    updateData.context = context;
  }

  Bills.findByIdAndUpdate(id, updateData, { new: true })
    .then((updatedBill) => {
      if (!updatedBill) {
        return res.status(404).json({
          message: "Bill not found",
        });
      }

      return res.status(200).json({
        message: "Bill updated",
        bill: updatedBill,
      });
    })
    .catch((error) => {
      console.log(error);
      return res.status(500).json({
        error,
        message: "Error updating bill",
      });
    });
};

exports.getLogByBillId = (req, res) => {
  const billId = req.params.id;
  Bills.findById(billId)
    .then((bill) => {
      return res.status(200).json({
        log: bill.log,
        message: "log from bill retrieved",
      });
    })
    .catch((error) => {
      return res.status(500).json({
        error,
        message: "Error finding bill",
      });
    });
};

exports.revisarBills = (req, res) => {
  const user = "GPT";
  Bills.find({ status: { $ne: "collected" } })
    .populate("client")
    .then((bills) => {
      bills.forEach(async (bill) => {
        const logEntry = {
          user: user,
          msg: `Le recuerdo ${bill.client.clientName} que pague la factura ${bill.billId} que vale ${bill.amount}`,
        };
        await Bills.updateOne({ _id: bill._id }, { $push: { log: logEntry } });
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

exports.importBillsFromFile = () => {};
