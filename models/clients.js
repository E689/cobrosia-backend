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
    clientCollectionSchedule: {
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
    creditDays: {
      type: Number,
      default: 30,
    },
    expired: {
      type: Number,
    },
    lowExpired: {
      type: Number,
    },
    mediumExpired: {
      type: Number,
    },
    highExpired: {
      type: Number,
    },
    criticalExpired: {
      type: Number,
    },
    lastMessage: {
      type: String,
    },
    ignoredMsgs: {
      type: Number,
    },
    brokenPromises: {
      type: Number,
    },
    collectionFlow: {
      type: String,
    },
    user: { type: ObjectId, ref: "Users" },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Clients", clientsSchema);
