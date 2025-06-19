// const mongoose = require("mongoose");
require("dotenv").config();

const mongoUri = process.env.MONGODB;

// 👇 Add your actual database name here
const dbName = "leadflow"; // 🔁 change this if your DB has a different name

const initializeDatabase = async () => {
  try {
    await mongoose.connect(mongoUri, {
      dbName: dbName, // ✅ ensures Mongoose uses the correct database
    });
    console.log("✅ Connected to Database");
  } catch (error) {
    console.error("❌ Error connecting to database", error);
  }
};

module.exports = { initializeDatabase };
