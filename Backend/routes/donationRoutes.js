const express = require("express");
const router = express.Router();
const Donation = require("../models/Donation");

// ========================
// CREATE
// ========================
router.post("/add", async (req, res) => {
  try {
    const donation = new Donation(req.body);
    await donation.save();
    res.json(donation);
  } catch (err) {
    res.status(500).send(err);
  }
});

// ========================
// READ ALL
// ========================
router.get("/", async (req, res) => {
  try {
    const donations = await Donation.find();
    res.json(donations);
  } catch (err) {
    res.status(500).send(err);
  }
});

// ========================
// READ ONE
// ========================
router.get("/:id", async (req, res) => {
  try {
    const donation = await Donation.findById(req.params.id);
    res.json(donation);
  } catch (err) {
    res.status(500).send(err);
  }
});

// ========================
// UPDATE
// ========================
router.put("/:id", async (req, res) => {
  try {
    const updated = await Donation.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );
    res.json(updated);
  } catch (err) {
    res.status(500).send(err);
  }
});

// ========================
// DELETE
// ========================
router.delete("/:id", async (req, res) => {
  try {
    await Donation.findByIdAndDelete(req.params.id);
    res.send("Deleted successfully");
  } catch (err) {
    res.status(500).send(err);
  }
});

// ========================
// FILTER BY LOCATION
// ========================
router.get("/location/:city", async (req, res) => {
  try {
    const data = await Donation.find({
      location: { $regex: req.params.city, $options: "i" }
    });
    res.json(data);
  } catch (err) {
    res.status(500).send(err);
  }
});

// ========================
// FILTER BY STATUS
// ========================
router.get("/status/:status", async (req, res) => {
  try {
    const data = await Donation.find({
      status: { $regex: req.params.status, $options: "i" }
    });
    res.json(data);
  } catch (err) {
    res.status(500).send(err);
  }
});

// ========================
// ACCEPT DONATION (PUT - real use)
// ========================
router.put("/accept/:id", async (req, res) => {
  try {
    const updated = await Donation.findByIdAndUpdate(
      req.params.id,
      { status: "accepted" },
      { new: true }
    );
    res.json(updated);
  } catch (err) {
    res.status(500).send(err);
  }
});

// ========================
// ACCEPT DONATION (GET - for browser testing)
// ========================
router.get("/accept/:id", async (req, res) => {
  try {
    const updated = await Donation.findByIdAndUpdate(
      req.params.id,
      { status: "accepted" },
      { new: true }
    );
    res.json(updated);
  } catch (err) {
    res.status(500).send(err);
  }
});

// ========================
// COMPLETE (DELETE AFTER PICKUP)
// ========================
router.delete("/complete/:id", async (req, res) => {
  try {
    await Donation.findByIdAndDelete(req.params.id);
    res.send("Donation completed and removed");
  } catch (err) {
    res.status(500).send(err);
  }
});

// ========================
// SEARCH FOOD
// ========================
router.get("/search/:food", async (req, res) => {
  try {
    const data = await Donation.find({
      foodType: { $regex: req.params.food, $options: "i" }
    });
    res.json(data);
  } catch (err) {
    res.status(500).send(err);
  }
});

module.exports = router;