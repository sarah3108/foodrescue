const mongoose = require("mongoose");

const supportMessageSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, lowercase: true, trim: true },
    topic: {
      type: String,
      enum: ["account", "donation", "pickup", "technical", "other"],
      default: "other"
    },
    message: { type: String, required: true, trim: true },
    status: {
      type: String,
      enum: ["open", "in-progress", "closed"],
      default: "open"
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model("SupportMessage", supportMessageSchema);
