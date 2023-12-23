const express = require("express");
const router = express.Router();

//controllers
const { createUser, logUser } = require("../models/users");

const { createClient, getClient, getClients } = require("../models/clients");

const {
  createContact,
  getContacts,
  getContact,
} = require("../models/contacts");

const { createBill, getBill, getBills } = require("../models/bills");

router.post("/users/register", createUser);
router.post("/users/login", logUser);

router.post("/clients", createClient);
router.get("/clients/:id", getClient);
router.get("/clients", getClients);

router.post("/contacts", createContact);
router.get("/contacts/:id", getContacts);
router.get("/contacts", getContact);

router.post("/bills", createBill);
router.get("/bills/:id", getBill);
router.get("/bills", getBills);

module.exports = router;
