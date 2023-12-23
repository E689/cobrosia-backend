const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
require("dotenv").config();

//db
mongoose
  .connect(process.env.DATABASE, {})
  .then(() => console.log("DB connected"))
  .catch((err) => console.log("DB Error => ", err));

const app = express();

//import routes
const allRoutes = require("./routes/all");

//app  middlewares
app.use(bodyParser.json());
app.use(cors());

//app  middlewares
app.use("/api", allRoutes);

const port = process.env.PORT || 8000;

app.listen(port, () => {
  console.log(`cobros-ia server ${port}`);
});
