const mongoose = require("mongoose");
const Lead = require("./models/models.leads");

async function fixClosedLeads() {
  await mongoose.connect("your-mongo-uri");
  const result = await Lead.updateMany(
    { status: "Closed", closedAt: { $exists: false } },
    { $set: { closedAt: new Date() } }
  );
  console.log("✅ Leads fixed:", result.modifiedCount);
  mongoose.disconnect();
}

fixClosedLeads();
