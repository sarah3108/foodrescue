const express = require("express");
const Donation = require("../models/Donation");

const router = express.Router();

const extractNumber = (value) => {
  const match = String(value || "").match(/\d+(\.\d+)?/);
  return match ? Number(match[0]) : 1;
};

const normalizeKey = (value, fallback) => {
  const text = String(value || fallback).trim();
  return text || fallback;
};

router.get("/", async (req, res) => {
  try {
    const donations = await Donation.find().sort({ createdAt: -1 });
    const delivered = donations.filter((donation) => donation.status === "delivered");
    const active = donations.filter((donation) => donation.status !== "delivered");
    const totalMeals = donations.reduce((sum, donation) => sum + extractNumber(donation.quantity), 0);
    const deliveredMeals = delivered.reduce((sum, donation) => sum + extractNumber(donation.quantity), 0);
    const co2SavedKg = Math.round(deliveredMeals * 2.5);

    const categories = donations.reduce((acc, donation) => {
      const key = normalizeKey(donation.foodType, "Mixed food");
      acc[key] = (acc[key] || 0) + extractNumber(donation.quantity);
      return acc;
    }, {});

    const locations = donations.reduce((acc, donation) => {
      const key = normalizeKey(donation.location, "Unlisted area");
      if (!acc[key]) {
        acc[key] = { location: key, total: 0, available: 0, reserved: 0, delivered: 0 };
      }

      acc[key].total += 1;
      acc[key][donation.status] = (acc[key][donation.status] || 0) + 1;
      return acc;
    }, {});

    const highDemandCategories = Object.entries(categories)
      .map(([foodType, score]) => ({ foodType, score }))
      .sort((a, b) => b.score - a.score)
      .slice(0, 5);

    const deliveryZones = Object.values(locations)
      .sort((a, b) => b.available + b.reserved - (a.available + a.reserved))
      .slice(0, 6);

    const priorityQueue = active.slice(0, 6).map((donation, index) => ({
      id: donation._id,
      foodType: donation.foodType,
      quantity: donation.quantity,
      location: donation.location,
      status: donation.status,
      priority: index < 2 ? "high" : index < 4 ? "medium" : "normal"
    }));

    res.json({
      co2SavedKg,
      mealsRescuedEstimate: deliveredMeals,
      predictedDemand: Math.max(1, Math.ceil((totalMeals || donations.length || 1) * 0.32)),
      highDemandCategories,
      deliveryZones,
      priorityQueue
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Unable to calculate insights" });
  }
});

module.exports = router;
