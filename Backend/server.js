const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
require("dotenv").config();

const app = express();

// middleware
app.use(cors());
app.use(express.json());

// TEST ROUTE (to check server)
app.get("/", (req, res) => {
  res.send("Server is working");
});

// IMPORT ROUTES
const donationRoutes = require("./routes/donationRoutes");

// USE ROUTES (IMPORTANT - must be string, not number)
app.use("/donations", donationRoutes);

// DATABASE CONNECTION
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB Connected"))
  .catch(err => console.log(err));

// START SERVER
app.listen(5000, () => {
  console.log("Server running on port 5000");
});