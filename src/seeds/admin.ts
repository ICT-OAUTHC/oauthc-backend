import dotenv from "dotenv";
dotenv.config();

import mongoose from "mongoose";
import User from "../models/User";

const seedAdmin = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI as string);
    console.log("Connected to MongoDB");

    const existing = await User.findOne({ email: "admin@oauthc.gov.ng" });
    if (existing) {
      console.log("Admin user already exists");
      process.exit(0);
    }

    await User.create({
      name: "OAUTHC Admin",
      email: "admin@oauthc.gov.ng",
      password: "Admin@12345",
      role: "admin",
      status: "active",
    });

    console.log("Admin user created successfully");
    console.log("Email: admin@oauthc.gov.ng");
    console.log("Password: Admin@12345");
    console.log(">> Change this password immediately after first login! <<");
    process.exit(0);
  } catch (error) {
    console.error("Seed failed:", error);
    process.exit(1);
  }
};

seedAdmin();
