// const mongoose = require("mongoose");

// const salesAgentSchema = new mongoose.Schema({
//   name: {
//     type: String,
//     required: true,
//   },
//   email: {
//     type: String,
//     required: true,
//     unique: true,
//   },
//   createdAt: {
//     type: Date,
//     default: Date.now,
//   },
// });

// const SalesAgent = mongoose.model("SalesAgent", salesAgentSchema);

// module.exports = SalesAgent;


const salesAgentSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
    match: [/.+@.+\..+/, "Please enter a valid email address"],
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});
