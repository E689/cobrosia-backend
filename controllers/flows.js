const Bills = require("../models/bills");
const Clients = require("../models/clients");
const Users = require("../models/users");
const Flows = require("../models/flows");

exports.createFlow = async (req, res) => {
  try {
    const createFields = req.body;
    const { name, userId } = createFields;
    if (!name || !userId) {
      return res.status(400).json({
        message: "Missing parameters. Please enter name, userId.",
      });
    }
    const newFlow = new Flows({ name });
    await newFlow.save();

    const updatedUser = await updatedUser.findByIdAndUpdate(
      userId,
      { $push: { flows: newFlow._id } },
      {
        new: true,
      }
    );

    return res.status(200).json({
      message: "Flow updated",
      user: updatedUser,
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
    const flowId = req.body.id;
    const flow = await Flows.findById(flowId);
    return res.status(200).json({
      message: "Flow found",
      flow,
    });
  } catch (error) {
    return res.status(500).json({
      error,
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
