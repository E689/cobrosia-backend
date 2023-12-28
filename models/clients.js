const mongoose = require("mongoose");
const { ObjectId } = mongoose.Schema;
const Users = require("./users");

const clientsSchema = new mongoose.Schema(
  {
    clientName: {
      type: String,
    },
    contactName: {
      type: String,
    },
    contactlastName: {
      type: String,
    },
    phone: {
      type: String,
    },
    email: {
      type: String,
    },
    user: { type: ObjectId, ref: "Users" },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Clients", clientsSchema);
