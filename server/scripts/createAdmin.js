const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const dotenv = require('dotenv');
const User = require('../models/user');
const Role = require('../models/role');
const Permission = require('../models/permission');

// Load environment variables
dotenv.config();

const createAdmin = async () => {
  try {
    // Connect to database
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');

    // Create default permissions
    const permissions = [
      { name: 'manage_users', code: 'usr_mng', description: 'Create, read, update, delete users', category: 'user' },
      { name: 'view_users', code: 'usr_view', description: 'View user information', category: 'user' },
      { name: 'manage_roles', code: 'rol_mng', description: 'Create, read, update, delete roles', category: 'role' },
      { name: 'view_roles', code: 'rol_view', description: 'View roles information', category: 'role' },
      { name: 'manage_permissions', code: 'perm_mng', description: 'Create, read, update, delete permissions', category: 'permission' },
      { name: 'view_permissions', code: 'perm_view', description: 'View permissions information', category: 'permission' },
      { name: 'manage_doctors', code: 'doc_mng', description: 'Create, read, update, delete doctors', category: 'doctor' },
      { name: 'view_doctors', code: 'doc_view', description: 'View doctor information', category: 'doctor' },
      { name: 'manage_appointments', code: 'appt_mng', description: 'Create, read, update, delete appointments', category: 'appointment' },
      { name: 'view_appointments', code: 'appt_view', description: 'View appointment information', category: 'appointment' },
      { name: 'manage_specialties', code: 'spec_mng', description: 'Create, read, update, delete specialties', category: 'specialty' },
      { name: 'view_specialties', code: 'spec_view', description: 'View specialty information', category: 'specialty' },
      { name: 'manage_services', code: 'serv_mng', description: 'Create, read, update, delete services', category: 'service' },
      { name: 'view_services', code: 'serv_view', description: 'View service information', category: 'service' },
      { name: 'manage_hospitals', code: 'hosp_mng', description: 'Create, read, update, delete hospitals', category: 'hospital' },
      { name: 'view_hospitals', code: 'hosp_view', description: 'View hospital information', category: 'hospital' },
      { name: 'manage_payments', code: 'pay_mng', description: 'Create, read, update, delete payments', category: 'payment' },
      { name: 'view_payments', code: 'pay_view', description: 'View payment information', category: 'payment' },
      { name: 'view_statistics', code: 'stat_view', description: 'View statistics and reports', category: 'report' },
      { name: 'manage_settings', code: 'set_mng', description: 'Manage system settings', category: 'system' },
      { name: 'view_logs', code: 'log_view', description: 'View system logs', category: 'system' },
    ];

    // Insert permissions if they don't exist
    for (const perm of permissions) {
      await Permission.findOneAndUpdate(
        { name: perm.name },
        perm,
        { upsert: true, new: true }
      );
    }
    console.log('Default permissions created successfully');

    // Fetch all permissions for admin role
    const allPermissions = await Permission.find({});
    const permissionIds = allPermissions.map(p => p._id);

    // Create admin role if it doesn't exist
    const adminRole = await Role.findOneAndUpdate(
      { name: 'admin' },
      {
        name: 'admin',
        code: 'admin',
        description: 'Administrator with full access',
        permissions: permissionIds
      },
      { upsert: true, new: true }
    );
    console.log('Admin role created successfully');

    // Create user role if it doesn't exist
    const userPermissions = await Permission.find({
      name: { $in: ['view_doctors', 'view_specialties', 'view_services', 'view_hospitals'] }
    });
    
    const userRole = await Role.findOneAndUpdate(
      { name: 'user' },
      {
        name: 'user',
        code: 'user',
        description: 'Regular user with limited access',
        permissions: userPermissions.map(p => p._id)
      },
      { upsert: true, new: true }
    );
    console.log('User role created successfully');

    // Create doctor role if it doesn't exist
    const doctorPermissions = await Permission.find({
      name: { 
        $in: [
          'view_users', 
          'view_appointments', 
          'manage_appointments', 
          'view_specialties',
          'view_services',
          'view_hospitals'
        ] 
      }
    });
    
    const doctorRole = await Role.findOneAndUpdate(
      { name: 'doctor' },
      {
        name: 'doctor',
        code: 'doctor',
        description: 'Doctor with appointment management access',
        permissions: doctorPermissions.map(p => p._id)
      },
      { upsert: true, new: true }
    );
    console.log('Doctor role created successfully');

    // Create admin user if not exists
    const adminPassword = process.env.ADMIN_PASSWORD || 'admin123';
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(adminPassword, salt);
    
    const defaultDob = new Date();
    defaultDob.setFullYear(defaultDob.getFullYear() - 30); // 30 tuổi

    const adminUser = await User.findOneAndUpdate(
      { email: 'admin@example.com' },
      {
        fullName: 'Admin User',
        email: 'admin@example.com',
        passwordHash: hashedPassword,
        role: adminRole._id,
        roleType: 'admin',
        isVerified: true,
        phoneNumber: '0987654321',
        dateOfBirth: defaultDob,
        gender: 'male',
        address: 'Admin Address'
      },
      { upsert: true, new: true }
    );
    console.log('Admin user created successfully');
    console.log(`Admin credentials: email=admin@example.com, password=${adminPassword}`);

    // Create test user 
    const testUser = await User.findOneAndUpdate(
      { email: 'user@example.com' },
      {
        fullName: 'Test User',
        email: 'user@example.com',
        passwordHash: await bcrypt.hash('user123', salt),
        role: userRole._id,
        roleType: 'user',
        isVerified: true,
        phoneNumber: '0123456789',
        dateOfBirth: defaultDob,
        gender: 'female',
        address: 'User Address'
      },
      { upsert: true, new: true }
    );
    console.log('Test user created successfully');
    console.log('Test user credentials: email=user@example.com, password=user123');

    // Create test doctor 
    const testDoctor = await User.findOneAndUpdate(
      { email: 'doctor@example.com' },
      {
        fullName: 'Test Doctor',
        email: 'doctor@example.com',
        passwordHash: await bcrypt.hash('doctor123', salt),
        role: doctorRole._id,
        roleType: 'doctor',
        isVerified: true,
        phoneNumber: '0123456780',
        dateOfBirth: defaultDob,
        gender: 'male',
        address: 'Doctor Address'
      },
      { upsert: true, new: true }
    );
    console.log('Test doctor created successfully');
    console.log('Test doctor credentials: email=doctor@example.com, password=doctor123');

    console.log('Setup completed successfully!');
  } catch (error) {
    console.error('Error creating admin:', error);
  } finally {
    // Close database connection
    mongoose.connection.close();
    console.log('Disconnected from MongoDB');
  }
};

// Run the script
createAdmin(); 