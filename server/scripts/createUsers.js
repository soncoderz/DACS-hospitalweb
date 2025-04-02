/**
 * Script to create admin and doctor accounts
 * Run with: npm run create-users
 */

require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const Role = require('../models/Role');

async function createUsers() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('MongoDB Connected');

    // Find role IDs
    const adminRole = await Role.findOne({ code: 'admin' });
    const doctorRole = await Role.findOne({ code: 'doctor' });

    if (!adminRole || !doctorRole) {
      console.error('Admin or Doctor role not found. Please run init-roles-permissions first.');
      return;
    }

    // Admin account data
    const adminData = {
      fullName: 'Admin System',
      email: 'admin@benhvien.com',
      phoneNumber: '0123456789',
      passwordHash: 'admin123',
      dateOfBirth: new Date('1990-01-01'),
      gender: 'male',
      address: 'Ho Chi Minh City',
      role: adminRole._id,
      roleType: 'admin',
      isVerified: true
    };

    // Doctor account data
    const doctorData = {
      fullName: 'Doctor Example',
      email: 'doctor@benhvien.com',
      phoneNumber: '0987654321',
      passwordHash: 'doctor123',
      dateOfBirth: new Date('1985-05-15'),
      gender: 'male',
      address: 'Ho Chi Minh City',
      role: doctorRole._id,
      roleType: 'doctor',
      isVerified: true
    };

    // Check if admin account already exists
    const existingAdmin = await User.findOne({ email: adminData.email });
    if (existingAdmin) {
      console.log(`Admin account with email ${adminData.email} already exists.`);
    } else {
      // Hash password
      const salt = await bcrypt.genSalt(10);
      adminData.passwordHash = await bcrypt.hash(adminData.passwordHash, salt);
      
      // Create admin account
      const admin = await User.create(adminData);
      console.log(`Admin account created with email: ${admin.email}`);
    }

    // Check if doctor account already exists
    const existingDoctor = await User.findOne({ email: doctorData.email });
    if (existingDoctor) {
      console.log(`Doctor account with email ${doctorData.email} already exists.`);
    } else {
      // Hash password
      const salt = await bcrypt.genSalt(10);
      doctorData.passwordHash = await bcrypt.hash(doctorData.passwordHash, salt);
      
      // Create doctor account
      const doctor = await User.create(doctorData);
      console.log(`Doctor account created with email: ${doctor.email}`);
    }

    console.log('User creation completed.');
    console.log('\nAccount Details:');
    console.log('Admin Email: admin@benhvien.com');
    console.log('Admin Password: admin123');
    console.log('Doctor Email: doctor@benhvien.com');
    console.log('Doctor Password: doctor123');

  } catch (error) {
    console.error('Error creating users:', error);
  } finally {
    mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

createUsers(); 