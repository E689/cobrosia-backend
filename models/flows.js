const mongoose = require("mongoose");

const flowsSchema = new mongoose.Schema(
  {
    name: {
      type: String,
    },
    preCollection: {
      type: String,
    },
    paymentConfirmation: {
      type: String,
    },
    paymentDelay: {
      type: String,
    },
    collectionIgnored: {
      type: String,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Flows", flowsSchema);
