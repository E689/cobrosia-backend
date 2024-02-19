const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
require("dotenv").config();
const swaggerUi = require("swagger-ui-express");
const specs = require("./swagger");

//db
mongoose
  .connect(process.env.DATABASE, {})
  .then(() => console.log("DB connected"))
  .catch((err) => console.log("DB Error => ", err));

const app = express();

//import routes

const billRoutes = require("./routes/bills");
const clientRoutes = require("./routes/clients");
const userRoutes = require("./routes/users");
const emailRoutes = require("./routes/emails");
const flowRoutes = require("./routes/flows");

//app  middlewares
app.use(bodyParser.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());

app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(specs));
//app  middlewares

app.use("/api", billRoutes);
app.use("/api", clientRoutes);
app.use("/api", userRoutes);
app.use("/api", emailRoutes);
app.use("/api", flowRoutes);

const port = process.env.PORT || 8000;

app.listen(port, () => {
  console.log(`cobros-ia server ${port}`);
});
