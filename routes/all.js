const express = require("express");
const router = express.Router();

//controllers
const { createUser, logUser } = require("../controllers/users");

const {
  createClient,
  getClient,
  getClients,
} = require("../controllers/clients");

const {
  createContact,
  getContacts,
  getContact,
} = require("../controllers/contacts");

const {
  createBill,
  getBill,
  getBillsByUserId,
} = require("../controllers/bills");

router.post("/users/register", createUser);
router.post("/users/login", logUser);

router.post("/clients", createClient);
router.get("/clients/:id", getClient);

router.get("/clients", getClients);
router.post("/contacts", createContact);
router.get("/contacts/:id", getContacts);
router.get("/contacts", getContact);

router.post("/bills", createBill);
router.get("/bills/:id", getBillsByUserId);

module.exports = router;
