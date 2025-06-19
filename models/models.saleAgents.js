const mongoose = require("mongoose");

const salesAgentSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const SalesAgent = mongoose.model("SalesAgent", salesAgentSchema);

module.exports = SalesAgent;
