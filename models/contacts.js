const mongoose = require("mongoose");
const { ObjectId } = mongoose.Schema;

const Clients = require("./clients");

const contactsSchema = new mongoose.Schema(
  {
    name: {
      type: String,
    },
    lastName: {
      type: String,
    },
    phone: {
      type: String,
    },
    email: {
      type: String,
    },
    client: { type: ObjectId, ref: "Clients" },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Contacts", contactsSchema);
