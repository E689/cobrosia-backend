const Bills = require("../models/bills");
const Clients = require("../models/clients");

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
        log: bill.log,
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
