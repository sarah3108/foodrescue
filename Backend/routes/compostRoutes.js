const express = require("express");
const CompostRequest = require("../models/CompostRequest");

const router = express.Router();

router.get("/", async (req, res) => {
  try {
    const requests = await CompostRequest.find().sort({ createdAt: -1 });
    res.json(requests);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Unable to load compost requests" });
  }
});

router.post("/", async (req, res) => {
  try {
    const request = await CompostRequest.create(req.body);
    res.status(201).json(request);
  } catch (err) {
    if (err.name === "ValidationError") {
      return res.status(400).json({ message: err.message });
    }

    console.error(err);
    res.status(500).json({ message: "Unable to submit compost request" });
  }
});

module.exports = router;
