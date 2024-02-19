const Users = require("../models/users");
const Clients = require("../models/clients");
const Bills = require("../models/bills");
const moment = require("moment");
const updateBillsCreditDays = async (clientId) => {
  const client = await Clients.findById(clientId);

  if (!client) {
    return false;
  }

  const bills = await Bills.find({ client: clientId });

  for (const bill of bills) {
    const dueDate = moment(bill.date).add(client.creditDays, "days");
    const differenceInDays = moment().diff(dueDate, "days");
    await Bills.findByIdAndUpdate(bill._id, {
      creditDays: differenceInDays,
    });
  }
  console.log("updateBillsCreditDays done");
  return true;
};

const countOverDueBillsfromClient = async (clientId) => {
  const bills = await Bills.find({ client: clientId });

  const overdueCount = { a: 0, b: 0, c: 0, d: 0 };

  for (const bill of bills) {
    if (bill.creditDays > 0) {
      if (bill.creditDays <= 30) {
        overdueCount.a++;
      } else if (bill.creditDays <= 60) {
        overdueCount.b++;
      } else if (bill.creditDays <= 90) {
        overdueCount.c++;
      } else if (bill.creditDays > 90) {
        overdueCount.d++;
      }
    }
  }

  const totalPastDueDateBills =
    overdueCount.a + overdueCount.b + overdueCount.c + overdueCount.d;

  const updatedFields = {
    expired: totalPastDueDateBills,
    lowExpired: overdueCount.a,
    mediumExpired: overdueCount.b,
    highExpired: overdueCount.c,
    criticalExpired: overdueCount.d,
  };

  await Clients.findByIdAndUpdate(clientId, updatedFields);

  console.log("countOverDueBillsfromClient");
  return true;
};

const countAiOn = async (clientId) => {
  return await Bills.countDocuments({ client: clientId, ai: true });
};

//given the id of the client, update all of the bills
const updateClientBills = async (clientId) => {
  if (await !updateBillsCreditDays(clientId)) {
    return res.status(404).json({ message: "Client not found" });
  }

  await countOverDueBillsfromClient(clientId);
  return true;
};

//given the id of the user, update all of the bills
const updateUserClientBills = async (userId) => {
  const clients = await Clients.find({ user: userId });

  for (const client of clients) {
    await updateClientBills(client._id);
  }
  return true;
};

//given a userId send message to all bills that need follow up
const sendEmailsToClients = async (userId) => {
  //validate that for each bill that the user needs.
};

module.exports = {
  updateBillsCreditDays,
  countOverDueBillsfromClient,
  countAiOn,
  updateUserClientBills,
};
