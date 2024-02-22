const Bills = require("../models/bills");
const Clients = require("../models/clients");
const Users = require("../models/users");
const Flows = require("../models/flows");

exports.createFlow = async (req, res) => {
  try {
    const { userId, flow } = req.body;
    const newFlow = new Flows(flow);
    await newFlow.save();
    const updatedUser = await Users.findByIdAndUpdate(
      userId,
      { $push: { flows: newFlow._id } },
      {
        new: true,
      }
    );
    console.log(updatedUser);
    return res.status(200).json({
      message: "Flow created",
    });
  } catch (error) {
    return res.status(500).json({
      error,
      message: "Error",
    });
  }
};

exports.getFlow = async (req, res) => {
  try {
    const flowId = req.params.id;
    const flow = await Flows.findById(flowId);
    return res.status(200).json({
      message: "Flow found",
      flow,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      message: "Error",
    });
  }
};

exports.getAllFlowsByUserId = async (req, res) => {
  try {
    const userId = req.params.id;
    const user = await Users.findById(userId).populate("flows");
    return res.status(200).json({
      message: "Flow from user",
      flows: user.flows,
    });
  } catch (error) {
    return res.status(500).json({
      error,
      message: "Error",
    });
  }
};

exports.updateFlow = (req, res) => {};
exports.deleteFlow = (req, res) => {};
