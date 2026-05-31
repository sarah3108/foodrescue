const mongoose = require("mongoose");

const compostRequestSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, lowercase: true, trim: true },
    wasteType: { type: String, required: true, trim: true },
    quantity: { type: String, required: true, trim: true },
    pickupLocation: { type: String, required: true, trim: true },
    preferredTime: { type: String, trim: true },
    notes: { type: String, trim: true },
    status: {
      type: String,
      enum: ["new", "scheduled", "completed"],
      default: "new"
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model("CompostRequest", compostRequestSchema);
