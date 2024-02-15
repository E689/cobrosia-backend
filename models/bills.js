const mongoose = require("mongoose");
const { ObjectId } = mongoose.Schema;

const billsSchema = new mongoose.Schema(
  {
    billId: {
      type: String,
    },
    amount: {
      type: Number,
    },
    date: {
      type: Date,
    },
    status: {
      type: String,
      default: "AIOff",
    },
    billStatus: {
      type: String,
    },
    context: {
      reminder: {
        type: String,
        default: "",
      },
      editDueDate: {
        type: String,
        default: "",
      },
      priority: {
        type: String,
        default: "",
      },
      other: {
        type: String,
        default: "",
      },
    },
    log: [{ msg: String }],
    ai: {
      type: Boolean,
      default: false,
    },
    client: { type: ObjectId, ref: "Clients" },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Bills", billsSchema);
