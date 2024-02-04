const swaggerJsdoc = require("swagger-jsdoc");

const options = {
  swaggerDefinition: {
    info: {
      title: "COBROS IA",
      version: "1.0.0",
      description: "API documentation for COBROS IA",
    },
    basePath: "/api/",
    tags: [
      {
        name: "Users",
        description: "Operations related to user",
      },
      {
        name: "Clients",
        description: "Operations related to clients",
      },
      {
        name: "Contacts",
        description: "Operations related to contacts",
      },
      {
        name: "Bills",
        description: "Operations related to bills",
      },
    ],
    securityDefinitions: {
      apiKeyAuth: {
        type: "apiKey",
        in: "header", // Can be "header", "query", or "cookie"
        name: "Authorization", // Name of the header, query parameter, or cookie to be used
      },
    },
  },
  apis: ["./routes/*.js"],
};

const specs = swaggerJsdoc(options);

module.exports = specs;
