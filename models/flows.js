const mongoose = require("mongoose");
const flowsSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      default: "Default Flow",
    },
    preCollection: {
      type: String,
      default: "No hacer nada si aun quedan dias credito negativos",
    },
    paymentConfirmation: {
      type: String,
      default:
        "Si tiene intension de pagar, agradecerle y pedirle una confirmacion de deposito o numero de transferencia",
    },
    paymentConfirmationVerify: {
      type: String,
      default:
        "Si dice que ya se puede ir a traerl el pago, o que ya lo envio por aca o por otro medio, le agradecemos e indicamos que esta pendiente de verificacion",
    },
    paymentDelay: {
      type: String,
      default:
        "si dice que va a atrasarse, pedirle cuando podemos esperar el pago",
    },
    paymentDelayNewDate: {
      type: String,
      default:
        "si envia una nueva fecha de cobro le agradecemos y le decimos que es importante que pague a tiempo",
    },
    collectionIgnored: {
      type: String,
      default:
        "si nos ignoro diciendo algo que no tiene relevancia con el cobro. responderle recordandole el cobro con urgencia",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Flows", flowsSchema);
