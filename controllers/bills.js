const Bills = require("../models/bills");
const Clients = require("../models/clients");

exports.createBill = (req, res) => {
  const { amount, dueDate, status, clientId, billId, context } = req.body;
  if (!amount || !dueDate || !status || !clientId || !billId) {
    return res.status(400).json({
      message:
        "Missing parameters. Please enter amount, dueDate, status, clientId",
    });
  }

  const data = {
    amount,
    dueDate,
    status,
    client: clientId,
    billId,
  };

  if (context) {
    data.context = context;
  }

  const newBill = new Bills(data);

  newBill
    .save()
    .then((newBill) => {
      return res.status(201).json({
        message: "Bill created",
        bill: newBill,
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
      return Bills.find({ client: { $in: clientIds } }).populate(
        "client",
        "clientName"
      );
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
  const { amount, dueDate, status, clientId, billId, context } = req.body;

  const updateData = {
    amount,
    dueDate,
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
