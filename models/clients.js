const mongoose = require("mongoose");
const { ObjectId } = mongoose.Schema;
const Users = require("./users");

const clientsSchema = new mongoose.Schema(
  {
    clientName: {
      type: String,
    },
    clientId: {
      type: String,
    },
    contactName: {
      type: String,
    },
    contactLastName: {
      type: String,
    },
    phone: {
      type: String,
    },
    email: {
      type: String,
    },
    ai: {
      type: Boolean,
      default: false,
    },
    user: { type: ObjectId, ref: "Users" },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Clients", clientsSchema);
