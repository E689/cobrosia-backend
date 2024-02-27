const Clients = require("../models/clients");
const Bills = require("../models/bills");
const { json } = require("express");
const Flows = require("../models/flows");
const {
  logController,
  mensajeController,
  classController,
  readEmail,
} = require("../utils/ai");

const { sendEmailSES } = require("../utils/email");
const {
  AI_GENERAL_CONTEXT,
  LOG_ENTRY_TYPE,
  LOG_ROLE,
} = require("../constants");

const OpenAI = require("openai");
const openai = new OpenAI({
  apiKey: process.env.OPENAI_KEY,
});
exports.sendEmail = (req, res) => {
  res.send("sent email");
};

exports.readEmail = async (req, res) => {
  const openAiResponse = await openai.chat.completions.create({
    messages: [
      {
        role: "system",
        content:
          "user will send you 2 texts. first is the Subject of an email. extract the number or numbers you find.next he will send you an email reply text I need you to extract the email. respond on this VALID JSON FORMAT FOR ME TO PARSE IT with email and billId ",
      },
      {
        role: "user",
        content: `text 1 :${req.body.headers.from} + text 2 :${req.body.headers.subject}`,
      },
    ],
    model: "gpt-3.5-turbo",
  });
  const generatedText = openAiResponse.choices[0].message.content;

  console.log(generatedText);

  const { email, billId } = JSON.parse(generatedText);

  const respuesta = await readEmail(
    email.toLowerCase(),
    billId,
    req.body.plain
  );

  const subject = `Seguimiento ${billId}`;
  const content = `<html>
        <body>
        <h1>Estimado cliente,</h1>
        <h3>${respuesta} </h3>
        <h3>atentamente</h3>
        </body></html>`;
  await sendEmailSES(email.toLowerCase(), content, subject);

  res.send("Email read and replied");
};

exports.readTestChat = async (req, res) => {
  const billId = req.body.billId;
  const text = req.body.text;
  console.log(billId);

  const bill = await Bills.findById({ _id: billId }).populate({
    path: "client",
    populate: [{ path: "flow" }, { path: "user" }],
  });

  const context = [
    {
      role: "system",
      content: `${bill.client.user.companyName} ${bill.client.user.businessLogic} ${bill.client.user.assistantContext}`,
    },
  ];

  if (bill.testLog.length < 1) {
    const intentionContext = [
      ...context,
      {
        role: "system",
        content: `You are a debt collector. given the context of the bill send a message to the client`,
      },
    ];

    const agentMessage = await openai.chat.completions.create({
      messages: intentionContext,
      model: "gpt-3.5-turbo",
    });
    const agent = agentMessage.choices[0].message.content;

    bill.testLog.push({
      date: new Date(),
      case: LOG_ENTRY_TYPE.MESSAGE_SENT,
      role: "assistant",
      content: `${agent}`,
    });
  } else {
    const transformedLog = bill.testLog.map((entry) => {
      return {
        role: entry.role,
        content: `on ${entry.date} : ${entry.content}`,
      };
    });

    context.push(...transformedLog);

    const intentionContext = [
      ...context,
      {
        role: "system",
        content: ` You are a debt collector. We have sent a reminder to pay. this is the users response. I need you to respond only the word: one, two, three, four or five, "one" if user has intention to pay on time. "two" if user has paid and sent a confirmation of payment. "three" if user is asking to move payment day. "four" if user is setting a new payment date. "five" if the message has no relation to paying.`,
      },
      { role: "user", content: text },
    ];

    const calssifyResponse = await openai.chat.completions.create({
      messages: intentionContext,
      model: "gpt-3.5-turbo",
    });
    const userIntention = calssifyResponse.choices[0].message.content;

    if (userIntention.toLowerCase() === "one") {
      //paymentConfirmation
      context.push({
        role: "system",
        content: `El usuario dice que va a pagar a tiempo y ${bill.client.flow.paymentConfirmation}, respondele al cliente, a mi y usa todo el contexto anterior de la conversasion`,
      });
    } else if (userIntention.toLowerCase() === "two") {
      //paymentConfirmationVerify
      context.push({
        role: "system",
        content: `El usuario dice que ya pago y ${bill.client.flow.paymentConfirmationVerify}, respondele al cliente, a mi y usa todo el contexto anterior de la conversasion`,
      });
    } else if (userIntention.toLowerCase() === "three") {
      //paymentDelay
      context.push({
        role: "system",
        content: `El usuario dice que se atraso y ${bill.client.flow.paymentDelay}, respondele al cliente, a mi y usa todo el contexto anterior de la conversasion`,
      });
    } else if (userIntention.toLowerCase() === "four") {
      //paymentDelayNewDate
      context.push({
        role: "system",
        content: `El usuario dice nueva fecha de pago ${bill.client.flow.paymentDelayNewDate}, respondele al cliente, a mi y usa todo el contexto anterior de la conversasion`,
      });
    } else if (userIntention.toLowerCase() === "five") {
      //collectionIgnored
      context.push({
        role: "system",
        content: `El usuario nos ignoro, nos dijo algo que no tiene sentido ${bill.client.flow.collectionIgnored}, respondele al cliente, a mi y usa todo el contexto anterior de la conversasion`,
      });
    }
    console.log(`el caso fue ${userIntention.toLowerCase()}`);
    const openAiResponse = await openai.chat.completions.create({
      messages: context,
      model: "gpt-3.5-turbo",
    });
    const generatedText = openAiResponse.choices[0].message.content;

    bill.testLog.push(
      {
        date: new Date(),
        case: LOG_ENTRY_TYPE.MESSAGE_RECEIVED,
        role: "user",
        content: `${text}`,
      },
      {
        date: new Date(),
        case: LOG_ENTRY_TYPE.MESSAGE_SENT,
        role: "assistant",
        content: `${generatedText}`,
      }
    );
  }

  const updatedLog = await bill.save();

  res.status(200).send({ testLog: updatedLog.testLog });
  // guardarlo en un test chat que cuando el user lo reinicia lo borro.
};

exports.deleteTestChat = async (req, res) => {
  const billId = req.body.billId;
  const updatedBill = await Bills.findByIdAndUpdate(
    billId,
    { testLog: [] },
    { new: true }
  );
  res.status(200).send({ testLog: updatedBill.testLog });
};

exports.deleteFlowTest = async (req, res) => {
  const flowId = req.params.id;
  const updatedFlow = await Flows.findByIdAndUpdate(
    flowId,
    { testLog: [] },
    { new: true }
  );
  res.status(200).send({ testLog: updatedFlow.testLog });
};

exports.getTestChat = async (req, res) => {
  const billId = req.params.id;
  const bill = await Bills.findById({ _id: billId }).populate({
    path: "client",
    populate: [{ path: "flow" }, { path: "user" }],
  });

  const context = [
    {
      role: "system",
      content: `${bill.client.user.companyName} ${bill.client.user.businessLogic} ${bill.client.user.assistantContext}`,
    },
  ];

  if (bill.testLog.length < 1) {
    const intentionContext = [
      ...context,
      {
        role: "system",
        content: `You are a debt collector. given the context of the bill send a message to the client`,
      },
    ];

    const agentMessage = await openai.chat.completions.create({
      messages: intentionContext,
      model: "gpt-3.5-turbo",
    });
    const agent = agentMessage.choices[0].message.content;

    bill.testLog.push({
      date: new Date(),
      case: LOG_ENTRY_TYPE.MESSAGE_SENT,
      role: "assistant",
      content: `${agent}`,
    });
  }
  const updatedLog = await bill.save();
  res.status(200).send({ testLog: updatedLog.testLog });
};

exports.getFlowTest = async (req, res) => {
  const flowId = req.params.id;
  const flow = await Flows.findById({ _id: flowId });

  if (flow.testLog.length < 1) {
    const intentionContext = [
      {
        role: "system",
        content: `Eres un recolector de deudas de facturas. El usuario acaba de abrir la pestaña del chat. Saluda.`,
      },
    ];

    const response = await openai.chat.completions.create({
      messages: intentionContext,
      model: "gpt-3.5-turbo",
    });
    const agentGreet = response.choices[0].message.content;

    flow.testLog.push({
      date: new Date(),
      case: LOG_ENTRY_TYPE.MESSAGE_SENT,
      role: "assistant",
      content: `${agentGreet}`,
    });
    const updatedFlow = await flow.save();

    res.status(200).send({ testLog: updatedFlow.testLog });
  } else {
    res.status(200).send({ testLog: flow.testLog });
  }
};

exports.flowTest = async (req, res) => {
  try {
    const flowId = req.body.id;
    const text = req.body.text;

    const flow = await Flows.findById({ _id: flowId });

    const context = [
      {
        role: "system",
        content: `Eres un cobrador de deudas. Hemos enviado un recordatorio para pagar. esta es la respuesta de los usuarios. Necesito que respondas sólo la palabra: one, two, three, four o five, "one" si el usuario tiene intención de pagar a tiempo. "two" si el usuario ha pagado y enviado una confirmación de pago. "three" si el usuario solicita cambiar el día de pago. "four" si el usuario está configurando una nueva fecha de pago. "five" si el mensaje no tiene relación con el pago.`,
      },
    ];

    // const transformedLog = flow.testLog.map((entry) => {
    //   return {
    //     role: entry.role,
    //     content: `${entry.content}`,
    //   };
    // });

    // context.push(...transformedLog);
    context.push({ role: "user", content: text });

    const calssifyResponse = await openai.chat.completions.create({
      messages: context,
      model: "gpt-3.5-turbo",
    });
    const userIntention = calssifyResponse.choices[0].message.content;

    const replyContext = [
      {
        role: "system",
        content:
          "soy un agente cobrador. acabo de recibir un mensaje e interprete lo siguiente sobre las respuesta del usuario a un mensaje que le envie.",
      },
    ];

    if (userIntention.toLowerCase() === "one") {
      //paymentConfirmation
      replyContext.push({
        role: "system",
        content: `El usuario dice que va a pagar a tiempo y ${flow.paymentConfirmation}, respondele al cliente, a mi y usa todo el contexto anterior de la conversasion`,
      });
    } else if (userIntention.toLowerCase() === "two") {
      //paymentConfirmationVerify
      replyContext.push({
        role: "system",
        content: `El usuario dice que ya pago y ${flow.paymentConfirmationVerify}, respondele al cliente, a mi y usa todo el contexto anterior de la conversasion`,
      });
    } else if (userIntention.toLowerCase() === "three") {
      //paymentDelay
      replyContext.push({
        role: "system",
        content: `El usuario dice que se atraso y ${flow.paymentDelay}, respondele al cliente, a mi y usa todo el contexto anterior de la conversasion`,
      });
    } else if (userIntention.toLowerCase() === "four") {
      //paymentDelayNewDate
      replyContext.push({
        role: "system",
        content: `El usuario dice nueva fecha de pago ${flow.paymentDelayNewDate}, respondele al cliente, a mi y usa todo el contexto anterior de la conversasion`,
      });
    } else if (userIntention.toLowerCase() === "five") {
      //collectionIgnored
      replyContext.push({
        role: "system",
        content: `El usuario nos ignoro, nos dijo algo que no tiene sentido ${flow.collectionIgnored}, respondele al cliente, a mi y usa todo el contexto anterior de la conversasion`,
      });
    }
    const openAiResponse = await openai.chat.completions.create({
      messages: replyContext,
      model: "gpt-3.5-turbo",
    });
    const generatedText = openAiResponse.choices[0].message.content;

    console.log(`el caso fue ${userIntention.toLowerCase()}`);
    console.log(`el context es `, replyContext);
    console.log(`el respuesta es  fue ${generatedText.toLowerCase()}`);
    flow.testLog.push(
      {
        date: new Date(),
        case: LOG_ENTRY_TYPE.MESSAGE_RECEIVED,
        role: "user",
        content: `${text}`,
      },
      {
        date: new Date(),
        case: LOG_ENTRY_TYPE.MESSAGE_SENT,
        role: "assistant",
        content: `${generatedText}`,
      }
    );
    const updatedLog = await flow.save();

    res.status(200).send({ testLog: updatedLog.testLog });
  } catch (error) {
    console.log(error);
  }
};
