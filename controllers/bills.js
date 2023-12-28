const Bills = require("../models/bills");
const User = require("../models/users");
const Clients = require("../models/clients");

exports.createBill = (req, res) => {
  const { amount, dueDate, status, clientId } = req.body;
  if (!amount || !dueDate || !status || !clientId) {
    return res.status(400).json({
      message:
        "Missing parameters. Please enter amount, dueDate, status, clientId",
    });
  }

  const newBill = new Bills({
    amount,
    dueDate,
    status,
    client: clientId,
  });

  newBill
    .save()
    .then((newBill) => {
      return res.status(201).json({
        message: "Bill created",
        bill: { name: newBill.name, id: newBill._id },
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

//by user revisar esta mal.
exports.getBillsByUserId = (req, res) => {
  const userId = req.params.id;
  Clients.find({ user: userId })
    .then((clients) => {
      const clientIds = clients.map((client) => client._id);
      return Bills.find({ client: { $in: clientIds } });
    })
    .then((bills) => {
      return res.status(200).json({
        bills,
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
