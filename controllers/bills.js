const Bills = require("../models/bills");
const Clients = require("../models/clients");
const Users = require("../models/users");
const xlsx = require("xlsx");

const { LOG_ENTRY_TYPE } = require("../constants");
const { countAiOn } = require("../services/bills");

exports.createBill = async (req, res) => {
  const { amount, date, clientId, billId, context, clientName, userId } =
    req.body;
  if (!amount || !date || !clientId || !billId) {
    return res.status(400).json({
      message:
        "Missing parameters. Please enter amount, date, status, clientId",
    });
  }
  let client;

  try {
    client = await Clients.findOne({ clientId: clientId });
    if (!client) {
      const clientData = { clientId, user: userId };
      if (clientName) {
        clientData.clientName = clientName;
      }
      client = new Clients(clientData);
      await client.save();
    }
  } catch (error) {
    return res.status(400).json({
      message: "error with client",
    });
  }

  const data = {
    amount,
    date,
    client: client._id,
    billId,
    log: [
      {
        date: new Date(),
        case: LOG_ENTRY_TYPE.BILL_CREATED,
        role: "system",
        content: `bill number ${billId} created`,
      },
    ],
  };

  if (context) {
    data.context = context;
  }

  const newBill = new Bills(data);

  newBill
    .save()
    .then((newBill) => {
      return res.status(200).json({
        message: "bill saved",
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

    Users.findOne({ _id: userId }).then(async (user) => {
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      const newUsersId = user._id;
      const newClients = [];
      const newBills = [];

      const clients = await Clients.find({ user: userId });
      newClients.push(...clients);
      for (const client of clients) {
        const bills = await Bills.find({ client: client._id });
        newBills.push(...bills);
        console.log(`client ${client._id} has ${bills.length} bills`);
      }

      console.log(
        `old clients ${newClients.length} old bills ${newBills.length}`
      );
      const workbook = xlsx.read(req.file.buffer, { type: "buffer" });
      let isFirstRow = true;
      const newClientsSave = [];
      const newBillsSave = [];
      const updateBills = [];

      workbook.SheetNames.forEach(async (sheetName) => {
        const sheet = workbook.Sheets[sheetName];
        const data = xlsx.utils.sheet_to_json(sheet, { header: 1 });

        data.forEach((row) => {
          if (isFirstRow) {
            isFirstRow = false;
            return;
          }

          if (!(row[2] === "FCAM" || row[2] === "FACT")) {
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

          if (
            existingBill &&
            !(row[15] === "Vigente") &&
            existingBill.billStatus === "Vigente"
          ) {
            existingBill.billStatus = row[15];
            existingBill.log.push({
              date: new Date(),
              case: LOG_ENTRY_TYPE.BILL_ANULLED,
              role: "system",
              content: "Bill ANULLED",
            });
            updateBills.push(existingBill);
          }

          if (!existingBill) {
            const createdBill = new Bills({
              billId: row[4],
              amount: row[14],
              date: row[0],
              billStatus: row[15],
              client: existingClient ? existingClientId : latestClientId,
              log: [
                {
                  date: new Date(),
                  case: LOG_ENTRY_TYPE.BILL_CREATED,
                  role: "system",
                  content: `bill number ${row[4]} created`,
                },
              ],
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

        // update many bills updateBills

        return;
      });

      console.log(
        `all clients ${newClients.length} new clients ${newClientsSave.length}`
      );
      console.log(
        `all bills ${newBills.length} new clients ${newBillsSave.length}`
      );
      res.status(200).send(`File uploaded and processed successfully.`);
      console.log(`File uploaded and processed successfully`);
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
        creditDays: bill.creditDays,
        clientName: bill.client.clientName,
        clientId: bill.client.clientId,
        client: bill.client._id,
        log: bill._id,
      }));

      const billsAiOn = bills.filter((bill) => bill.ai === true).length;

      return res.status(200).json({
        billsAiOn,
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

exports.getBillsByClientId = async (req, res) => {
  try {
    const userId = req.body.userId;
    const nit = req.body.nit;

    const clientId = await Clients.find({ user: userId, clientId: nit });

    const bills = await Bills.find({ client: clientId }).populate("client");

    const refactoredBills = bills.map((bill) => ({
      billId: bill.billId,
      date: bill.date,
      amount: bill.amount,
      status: bill.status,
      creditDays: bill.creditDays,
      clientName: bill.client.clientName,
      clientId: bill.client.clientId,
      client: bill.client._id,
      log: bill._id,
    }));

    const billsAiOn = await Bills.countDocuments({
      client: clientId,
      ai: true,
    });

    return res.status(200).json({
      bills: refactoredBills,
      billsAiOn,
      message: "bills from client retrieved",
    });
  } catch (error) {
    return res.status(500).json({
      error,
      message: "Error finding bills",
    });
  }
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

exports.updateBill = (req, res) => {
  const id = req.params.id;
  const { amount, date, status, clientId, billId, context, ai } = req.body;

  if (ai) {
    //push log of ai on or off
  }

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
      const refactoredLog = bill.log.map((entry) => ({
        date: entry.date,
        case: entry.case,
        role: entry.role,
        content: entry.content,
      }));

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
