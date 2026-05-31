const express = require("express");
const SupportMessage = require("../models/SupportMessage");

const router = express.Router();

router.get("/", async (req, res) => {
  try {
    const messages = await SupportMessage.find().sort({ createdAt: -1 });
    res.json(messages);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Unable to load support messages" });
  }
});

router.post("/", async (req, res) => {
  try {
    const message = await SupportMessage.create(req.body);
    res.status(201).json(message);
  } catch (err) {
    if (err.name === "ValidationError") {
      return res.status(400).json({ message: err.message });
    }

    console.error(err);
    res.status(500).json({ message: "Unable to submit support message" });
  }
});

module.exports = router;
