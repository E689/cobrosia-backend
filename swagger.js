const swaggerJsdoc = require("swagger-jsdoc");

const options = {
  swaggerDefinition: {
    info: {
      title: "Cobros AI",
      version: "1.0.0",
      description:
        "Here are listed the available endpoints for User, Client, Bill and AI Billing Flows manipulation.",
    },
    basePath: "/api/",
    tags: [
      {
        name: "Users",
        description: "Create, Update and Read users.",
      },
      {
        name: "Clients",
        description: "Creat, List, Update and Delete clients.",
      },
      {
        name: "Bills",
        description:
          "Create, List, Update and Delete bills belonging to clients.",
      },
      {
        name: "BillingFlows",
        description: "AI billing flows associated to the clients bills.",
      },
      // {
      //   name: "Contacts",
      //   description: "Operations related to contacts",
      // },
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
