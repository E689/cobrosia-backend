const mongoose = require("mongoose");
const { ObjectId } = mongoose.Schema;
const Clients = require("./clients");

const billsSchema = new mongoose.Schema(
  {
    amount: {
      type: String,
    },
    dueDate: {
      type: String,
    },
    status: {
      type: String,
    },
    client: { type: ObjectId, ref: "Clients" },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Bills", billsSchema);
