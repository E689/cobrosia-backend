const Clients = require("../models/clients");
const Bills = require("../models/bills");
const { updateUserClientBills, countAiOn } = require("../services/bills");
const { LOG_ENTRY_TYPE } = require("../constants");

const { updateClientBills } = require("../services/bills");
exports.createClient = (req, res) => {
  const { clientName, userId, contactName, contactLastName, phone, email } =
    req.body;
  if (
    !clientName ||
    !userId ||
    !contactName ||
    !contactLastName ||
    !phone ||
    !email
  ) {
    return res.status(400).json({
      message:
        "Missing parameters. Please enter clientName, userId, contactName, contactlastName, phone, email",
    });
  }

  const newClient = new Clients({
    clientName,
    contactName,
    contactLastName,
    phone,
    email,
    user: userId,
  });

  newClient
    .save()
    .then((newClient) => {
      return res.status(201).json({
        message: "Client created",
        newClient,
      });
    })
    .catch((error) => {
      console.log(error);
      return res.status(500).json({
        error,
        message: "Error creating client",
      });
    });
};

exports.getClientsByUser = async (req, res) => {
  try {
    const id = req.params.id;

    await updateUserClientBills(id);
    const clients = await Clients.find({ user: id });

    const refactoredClients = clients.map((client) => ({
      clientId: client._id,
      clientName: client.clientName,
      nit: client.clientId,
      creditDays: client.creditDays,
      clientCollectionSchedule: client.clientCollectionSchedule,
      contactName: client.contactName,
      contactLastName: client.contactLastName,
      email: client.email,
      phone: client.phone,
      aIToggle: client.ai,
      expired: client.expired,
      lowExpired: client.lowExpired,
      mediumExpired: client.mediumExpired,
      highExpired: client.highExpired,
      criticalExpired: client.criticalExpired,
      lastMessage: client.lastMessage,
      ignoredMsgs: client.ignoredMsgs,
      brokenPromises: client.brokenPromises,
    }));

    const clientsAiOn = await Clients.countDocuments({ user: id, ai: true });

    return res.status(200).json({
      clients: refactoredClients,
      clientsAiOn,
      message: "Clients from user",
    });
  } catch (error) {
    return res.status(500).json({
      error,
      message: "Error finding Client",
    });
  }
};

exports.getClientById = async (req, res) => {
  try {
    const id = req.params.id;
    const client = await Clients.findOne({ _id: id });

    return res.status(200).json({
      client: {
        clientId: client._id,
        clientName: client.clientName,
        nit: client.clientId,
        creditDays: client.creditDays,
        clientCollectionSchedule: client.clientCollectionSchedule,
        contactName: client.contactName,
        contactLastName: client.contactLastName,
        email: client.email,
        phone: client.phone,
        aIToggle: client.ai,
        flow: client.flow,
      },
      message: "Client from user retrieved",
    });
  } catch (error) {
    return res.status(500).json({
      error,
      message: "Error finding Client",
    });
  }
};

exports.updateClient = async (req, res) => {
  try {
    const clientId = req.params.id;
    const updatedFields = req.body;
    const { ai } = updatedFields;

    if (!clientId) {
      return res.status(400).json({
        message: "Missing clientId parameter",
      });
    }

    const client = await Clients.findById(clientId);
    client.set(updatedFields);
    const updatedClient = await client.save();
    const aiValueChanged = updatedClient.ai !== client.ai;

    const updateObject = aiValueChanged
      ? {
          $set: {
            status: updatedClient.ai ? "Process" : "AIOff",
            ai: updatedClient.ai,
          },
          $push: {
            log: {
              date: new Date(),
              case: updatedClient.ai
                ? LOG_ENTRY_TYPE.AI_ON
                : LOG_ENTRY_TYPE.AI_OFF,
              status: updatedClient.ai ? "Process" : "AIOff",
              role: "system",
              content: `AI turned ${updatedClient.ai ? "on" : "off"}`,
            },
          },
        }
      : undefined;

    if (aiValueChanged && updateObject) {
      await Bills.updateMany({ client: clientId }, updateObject);
    }

    await updateClientBills(clientId);

    return res.status(200).json({
      message: "Client updated",
      updatedClient,
    });
  } catch (error) {
    return res.status(404).json({
      message: "Error updating client",
    });
  }
};

exports.deleteClient = (req, res) => {
  const clientId = req.params.id;
  Bills.find({ client: clientId }).then((bills) => {
    if (bills.length > 0) {
      return res.status(400).json({
        message: "cant delete client with bills. delete bills first",
      });
    } else {
      Clients.findByIdAndDelete({ _id: clientId })
        .then((deletedClient) => {
          return res.status(200).json({
            message: "Client deleted",
            deletedClient,
          });
        })
        .catch((error) => {
          return res.status(500).json({
            error,
            message: "Error deleting Client",
          });
        });
    }
  });
};
