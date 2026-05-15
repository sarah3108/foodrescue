const mongoose = require("mongoose");

const donationSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    foodType: { type: String, required: true, trim: true },
    quantity: { type: String, required: true, trim: true },
    location: { type: String, required: true, trim: true },
    contact: { type: String, required: true, trim: true },
    donorId: { type: String, trim: true },
    donorEmail: { type: String, lowercase: true, trim: true },
    status: {
      type: String,
      enum: ["available", "accepted", "delivered"],
      default: "available"
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Donation", donationSchema);
