require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");

const connectDB = require("./config/db");

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

// CONNECT TO DATABASE AND START SERVER
const PORT = process.env.PORT || 5000;

connectDB()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  })
  .catch(err => {
    console.error("Failed to start server:", err);
    process.exit(1);
  });