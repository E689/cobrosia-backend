const Clients = require("../models/clients");
const Contacts = require("../models/contacts");

exports.createClient = (req, res) => {
  const { clientName, userId, contactName, contactlastName, phone, email } =
    req.body;
  if (
    !clientName ||
    !userId ||
    !contactName ||
    !contactlastName ||
    !phone ||
    !email
  ) {
    return res.status(400).json({
      message:
        "Missing parameters. Please enter clientName, userId, contactName, contactlastName, phone, email",
    });
  }

  const newClient = new Clients({ name: clientName, user: userId });

  newClient
    .save()
    .then((newClient) => {
      const newContact = new Contacs({
        name: contactName,
        lastName: contactlastName,
        phone,
        email,
        client: newClient._id,
      });

      newContact
        .save()
        .then((newContact) => {
          return res.status(201).json({
            message: "Client created",
            client: { name: newContact.name, id: newContact._id },
          });
        })
        .catch((error) => {
          console.log(error);
          return res.status(500).json({
            error,
            message: "Error creating contact",
          });
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
    const clients = await Clients.find({ user: id });
    const clientsWithContacts = await Promise.all(
      clients.map(async (clientUnique) => {
        const contacts = await Contacts.find({ client: clientUnique._id });
        return { ...clientUnique._doc, contacts };
      })
    );

    return res.status(200).json({
      clients: clientsWithContacts,
      message: "Clients from user retrieved with contacts",
    });
  } catch (error) {
    return res.status(500).json({
      error,
      message: "Error finding Client",
    });
  }
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
