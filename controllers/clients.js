const Clients = require("../models/clients");

exports.createClient = (req, res) => {
  const { name, userId } = req.body;
  if (!name || !userId) {
    return res.status(400).json({
      message: "Missing parameters. Please enter name and userId",
    });
  }

  const newClient = new Clients({ name, user: userId });

  newClient
    .save()
    .then((newClient) => {
      return res.status(201).json({
        message: "Client created",
        client: { name: newClient.name, id: newClient._id },
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

exports.getClient = (req, res) => {
  const id = req.params.id;
  Clients.find({ _id: id })
    .then((accessList) => {
      return res.status(200).json({
        accessList,
        message: "Client from user retrieved",
      });
    })
    .catch((error) => {
      return res.status(500).json({
        error,
        message: "Error finding Client",
      });
    });
};

exports.getClients = (req, res) => {
  const id = req.params.id;
  Clients.find({ user: id })
    .then((accessList) => {
      return res.status(200).json({
        accessList,
        message: "Clients from user retrieved",
      });
    })
    .catch((error) => {
      return res.status(500).json({
        error,
        message: "Error finding Clients",
      });
    });
};
