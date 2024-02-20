//LOG type constants
const LOG_ENTRY_TYPE = {
  BILL_CREATED: 0,
  AI_ON: 1,
  AI_OFF: 2,
  MESSAGE_SENT: 3,
  MESSAGE_RECEIVED: 4,
  AI_FINISHED: 5,
  BILL_ANULLED: 6,
};

const LOG_ROLE = {
  SYSTEM: "System",
  AGENT: "Agent",
  USER: "User",
};

const AI_CASES = {
  WILL_PAY: "El cliente tiene intension de pagar a tiempo",
  CHANGE_DATE: "El cliente quiere cambiar de fecha de pago",
  NEW_DATE: "El cliente me dio una nueva fecha",
  PAYMENT_CONFIRMATION:
    "El cliente dice que esta listo para ir a recolectar el pago",
  NOT_RELEVANT: "El cliente me dio una respuesta que no es relevante",
};

const AI_GENERAL_CONTEXT = {
  BUSSINESS_DEFINITION:
    "Somos encargados de varios clientes que tienen facturas pendientes de pago. Cada factura tiene dias credito: <=0 son dias disponibles para pago, >0 son los dias que lleva de retraso de pago. Seguir las siguientes condiciones depende de la respuesta del usuario:",
};

module.exports = {
  LOG_ENTRY_TYPE,
  LOG_ROLE,
  AI_CASES,
  AI_GENERAL_CONTEXT,
};
