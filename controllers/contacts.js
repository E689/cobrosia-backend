const Contacs = require("../models/contacts");

exports.createContact = (req, res) => {
  const { name, lastName, phone, email, clientId } = req.body;
  if (!name || !lastName || !phone || !email || !clientId) {
    return res.status(400).json({
      message:
        "Missing parameters. Please enter name, lastName, phone, email, clientId",
    });
  }

  const newContact = new Contacs({
    name,
    lastName,
    phone,
    email,
    client: clientId,
  });

  newContact
    .save()
    .then((newContact) => {
      return res.status(201).json({
        message: "Contact created",
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
};
//by contactId
exports.getContact = (req, res) => {};

//by clientID
exports.getContacts = (req, res) => {
  const id = req.params.id;
  Contacs.find({ client: id })
    .then((Contacs) => {
      return res.status(200).json({
        Contacs,
        message: "Contacs from client retrieved",
      });
    })
    .catch((error) => {
      return res.status(500).json({
        error,
        message: "Error finding Contacs",
      });
    });
};
