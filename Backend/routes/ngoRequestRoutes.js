const express = require("express");
const NgoRequest = require("../models/NgoRequest");

const router = express.Router();

router.get("/", async (req, res) => {
  try {
    const requests = await NgoRequest.find().sort({ createdAt: -1 });
    res.json(requests);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Unable to load NGO requests" });
  }
});

router.post("/", async (req, res) => {
  try {
    const request = await NgoRequest.create(req.body);
    res.status(201).json(request);
  } catch (err) {
    if (err.name === "ValidationError") {
      return res.status(400).json({ message: err.message });
    }

    console.error(err);
    res.status(500).json({ message: "Unable to submit NGO request" });
  }
});

module.exports = router;
