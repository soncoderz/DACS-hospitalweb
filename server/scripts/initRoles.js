/**
 * Script to initialize default roles and permissions
 * Run this script when setting up the application for the first time
 */

require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');

async function initializeRoleTypes() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('MongoDB Connected');

    // Update existing users without a roleType
    const result = await User.updateMany(
      { roleType: { $exists: false } }, 
      { $set: { roleType: 'user' } }
    );

    console.log(`Updated ${result.modifiedCount} users without roleType to default 'user' role`);

    // Ensure admin users have the correct roleType
    const adminEmails = ['admin@example.com', 'admin@benhvien.com']; // Add your admin emails
    const adminResult = await User.updateMany(
      { email: { $in: adminEmails } },
      { $set: { roleType: 'admin' } }
    );

    console.log(`Updated ${adminResult.modifiedCount} admin users to have 'admin' roleType`);

    // Ensure doctor users have the correct roleType (if you have a way to identify them)
    // For example, if you have a doctors array or a naming convention
    const doctorEmails = ['doctor@example.com', 'doctor@benhvien.com']; // Add your doctor emails
    const doctorResult = await User.updateMany(
      { email: { $in: doctorEmails } },
      { $set: { roleType: 'doctor' } }
    );

    console.log(`Updated ${doctorResult.modifiedCount} doctor users to have 'doctor' roleType`);

    console.log('Role initialization completed successfully');
  } catch (error) {
    console.error('Error initializing roles:', error);
  } finally {
    mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

initializeRoleTypes(); 