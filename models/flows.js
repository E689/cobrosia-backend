const mongoose = require("mongoose");
const flowsSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      default: "Default Flow",
    },
    preCollection: {
      type: String,
      default: "Do nothing if creditDays are less or equal to 0",
    },
    paymentConfirmation: {
      type: String,
      default:
        "If detected that user is willing to pay on time, thank him and ask him to send you a comprobation of payment",
    },
    paymentConfirmationVerify: {
      type: String,
      default:
        "If detected that user is willing to pay on time, thank him and ask him to send you a comprobation of payment",
    },
    paymentDelay: {
      type: String,
      default: "ask the user for a new date of payment",
    },
    paymentDelayNewDate: {
      type: String,
      default: "ask the user for a new date of payment",
    },
    collectionIgnored: {
      type: String,
      default: "get angrier",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Flows", flowsSchema);
