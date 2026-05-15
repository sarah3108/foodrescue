const express = require("express");
const mongoose = require("mongoose");
const Donation = require("../models/Donation");

const router = express.Router();

const sendServerError = (res, err) => {
  console.error(err);
  res.status(500).json({ message: "Unable to process donation request" });
};

const validateId = (req, res, next) => {
  if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
    return res.status(400).json({ message: "Invalid donation id" });
  }

  next();
};

router.post("/", async (req, res) => {
  try {
    const donation = await Donation.create(req.body);
    res.status(201).json(donation);
  } catch (err) {
    if (err.name === "ValidationError") {
      return res.status(400).json({ message: err.message });
    }

    sendServerError(res, err);
  }
});

router.post("/add", async (req, res) => {
  try {
    const donation = await Donation.create(req.body);
    res.status(201).json(donation);
  } catch (err) {
    if (err.name === "ValidationError") {
      return res.status(400).json({ message: err.message });
    }

    sendServerError(res, err);
  }
});

router.get("/", async (req, res) => {
  try {
    const { location, status, search } = req.query;
    const filters = {};

    if (location) {
      filters.location = { $regex: location, $options: "i" };
    }

    if (status && status !== "all") {
      filters.status = status;
    }

    if (search) {
      filters.foodType = { $regex: search, $options: "i" };
    }

    const donations = await Donation.find(filters).sort({ createdAt: -1 });
    res.json(donations);
  } catch (err) {
    sendServerError(res, err);
  }
});

router.get("/location/:city", async (req, res) => {
  try {
    const donations = await Donation.find({
      location: { $regex: req.params.city, $options: "i" }
    }).sort({ createdAt: -1 });
    res.json(donations);
  } catch (err) {
    sendServerError(res, err);
  }
});

router.get("/status/:status", async (req, res) => {
  try {
    const donations = await Donation.find({
      status: req.params.status
    }).sort({ createdAt: -1 });
    res.json(donations);
  } catch (err) {
    sendServerError(res, err);
  }
});

router.get("/search/:food", async (req, res) => {
  try {
    const donations = await Donation.find({
      foodType: { $regex: req.params.food, $options: "i" }
    }).sort({ createdAt: -1 });
    res.json(donations);
  } catch (err) {
    sendServerError(res, err);
  }
});

router.put("/accept/:id", validateId, async (req, res) => {
  try {
    const updated = await Donation.findByIdAndUpdate(
      req.params.id,
      { status: "accepted" },
      { new: true, runValidators: true }
    );

    if (!updated) {
      return res.status(404).json({ message: "Donation not found" });
    }

    res.json(updated);
  } catch (err) {
    sendServerError(res, err);
  }
});

router.delete("/complete/:id", validateId, async (req, res) => {
  try {
    const updated = await Donation.findByIdAndUpdate(
      req.params.id,
      { status: "delivered" },
      { new: true, runValidators: true }
    );

    if (!updated) {
      return res.status(404).json({ message: "Donation not found" });
    }

    res.json(updated);
  } catch (err) {
    sendServerError(res, err);
  }
});

router.get("/:id", validateId, async (req, res) => {
  try {
    const donation = await Donation.findById(req.params.id);

    if (!donation) {
      return res.status(404).json({ message: "Donation not found" });
    }

    res.json(donation);
  } catch (err) {
    sendServerError(res, err);
  }
});

router.put("/:id", validateId, async (req, res) => {
  try {
    const updated = await Donation.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });

    if (!updated) {
      return res.status(404).json({ message: "Donation not found" });
    }

    res.json(updated);
  } catch (err) {
    if (err.name === "ValidationError") {
      return res.status(400).json({ message: err.message });
    }

    sendServerError(res, err);
  }
});

router.delete("/:id", validateId, async (req, res) => {
  try {
    const deleted = await Donation.findByIdAndDelete(req.params.id);

    if (!deleted) {
      return res.status(404).json({ message: "Donation not found" });
    }

    res.json({ message: "Deleted successfully" });
  } catch (err) {
    sendServerError(res, err);
  }
});

module.exports = router;
