const mongoose = require("mongoose");

const ngoRequestSchema = new mongoose.Schema(
  {
    organizationName: { type: String, required: true, trim: true },
    contactPerson: { type: String, required: true, trim: true },
    email: { type: String, required: true, lowercase: true, trim: true },
    phone: { type: String, required: true, trim: true },
    city: { type: String, required: true, trim: true },
    peopleServed: { type: Number, min: 1, default: 1 },
    requestType: {
      type: String,
      enum: ["daily-meals", "event-surplus", "emergency-support", "partnership"],
      default: "daily-meals"
    },
    notes: { type: String, trim: true },
    status: {
      type: String,
      enum: ["new", "reviewing", "matched"],
      default: "new"
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model("NgoRequest", ngoRequestSchema);
