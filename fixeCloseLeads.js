const mongoose = require("mongoose");
const Lead = require("./models/models.leads");
require("dotenv").config(); // Load MONGODB from .env

async function fixClosedLeads() {
  try {
    await mongoose.connect(process.env.MONGODB, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    const result = await Lead.updateMany(
      { status: "Closed", closedAt: { $exists: false } },
      { $set: { closedAt: new Date() } }
    );

    console.log("✅ Leads fixed:", result.modifiedCount);
  } catch (error) {
    console.error("❌ Error fixing leads:", error.message);
  } finally {
    mongoose.disconnect();
  }
}

fixClosedLeads();
