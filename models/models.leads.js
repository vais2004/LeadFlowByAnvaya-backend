const mongoose = require("mongoose");

const leadSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    source: {
      type: String,
      required: true,
      enum: ["Website", "Referral", "Cold Call", "Other"],
    },
    salesAgent: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "SalesAgent",
      required: true,
    },
    status: {
      type: String,
      required: true,
      enum: ["New", "Contacted", "Qualified", "Proposal Sent", "Closed"],
      default: "New",
    },
    tags: {
      type: [String],
      default: [],
    },
    timeToClose: {
      type: Number,
      required: true,
      min: [1, "Time to close must be at least 1 day"],
    },
    priority: {
      type: String,
      required: true,
      enum: ["High", "Medium", "Low"],
      default: "Medium",
    },
    closedAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

leadSchema.pre("save", function (next) {
  if (this.status === "Closed" && !this.closedAt) {
    this.closedAt = new Date();
  }
  next();
});

const Lead = mongoose.model("Lead", leadSchema);
module.exports = Lead;
