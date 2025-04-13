const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");

const dotenv = require("dotenv");
dotenv.config();

const authRoutes = require("./routes/auth");
const taskRoutes = require("./routes/tasks");

const app = express();

app.use(express.json());
app.use(cors());

app.use("/api/auth", authRoutes);
app.use("/api/tasks", taskRoutes);

mongoose
  .connect(process.env.MONGO_URI)
  .then(() =>
    app.listen(3001, () => console.log("Servidor corriendo en puerto 3001"))
  )
  .catch((error) => console.log(error));
