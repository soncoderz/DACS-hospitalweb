/**
 * Script to initialize default roles and permissions
 * Run this script when setting up the application for the first time
 */

require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');
const Role = require('../models/Role');
const Permission = require('../models/Permission');

async function initializeRolesAndPermissions() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('MongoDB Connected');

    // Create default permissions
    console.log('Creating default permissions...');
    const defaultPermissions = [
      { name: 'View Patients', code: 'view_patients', description: 'View patient information' },
      { name: 'Update Medical Records', code: 'update_medical_records', description: 'Edit medical records' },
      { name: 'Schedule Appointments', code: 'schedule_appointments', description: 'Schedule appointments for patients' },
      { name: 'View Own Profile', code: 'view_own_profile', description: 'View own profile information' },
      { name: 'Book Appointments', code: 'book_appointments', description: 'Book appointments with doctors' },
      { name: 'View Own Records', code: 'view_own_records', description: 'View own medical records' },
      { name: 'Manage Users', code: 'manage_users', description: 'Create, update, delete users' },
      { name: 'Manage Roles', code: 'manage_roles', description: 'Create, update, delete roles' },
      { name: 'Manage Permissions', code: 'manage_permissions', description: 'Create, update, delete permissions' }
    ];

    // Create or update permissions
    const permissionPromises = defaultPermissions.map(async perm => {
      const existingPermission = await Permission.findOne({ code: perm.code });
      if (existingPermission) {
        console.log(`Permission ${perm.code} already exists`);
        return existingPermission;
      } else {
        console.log(`Creating permission: ${perm.code}`);
        return await Permission.create(perm);
      }
    });

    const permissions = await Promise.all(permissionPromises);
    
    // Group permissions by role
    const userPermissions = permissions.filter(p => ['view_own_profile', 'book_appointments', 'view_own_records'].includes(p.code)).map(p => p._id);
    const doctorPermissions = permissions.filter(p => ['view_patients', 'update_medical_records', 'schedule_appointments', ...userPermissions.map(p => p.toString())].includes(p.code)).map(p => p._id);
    const adminPermissions = permissions.map(p => p._id); // Admin gets all permissions
    
    // Create default roles
    console.log('Creating default roles...');
    const defaultRoles = [
      { name: 'Admin', code: 'admin', description: 'System administrator with full access', permissions: adminPermissions },
      { name: 'Doctor', code: 'doctor', description: 'Doctor with patient management access', permissions: doctorPermissions },
      { name: 'User', code: 'user', description: 'Regular user with limited access', permissions: userPermissions }
    ];

    // Create or update roles
    const rolePromises = defaultRoles.map(async r => {
      const existingRole = await Role.findOne({ code: r.code });
      if (existingRole) {
        console.log(`Role ${r.code} already exists, updating permissions`);
        existingRole.permissions = r.permissions;
        return await existingRole.save();
      } else {
        console.log(`Creating role: ${r.code}`);
        return await Role.create(r);
      }
    });

    const roles = await Promise.all(rolePromises);
    const roleMap = {};
    roles.forEach(role => {
      roleMap[role.code] = role._id;
    });

    // Update users with the correct role reference
    console.log('Updating user role references...');
    const userUpdates = await User.updateMany(
      { roleType: 'user', role: { $exists: false } },
      { $set: { role: roleMap['user'] } }
    );
    
    const doctorUpdates = await User.updateMany(
      { roleType: 'doctor', role: { $exists: false } },
      { $set: { role: roleMap['doctor'] } }
    );
    
    const adminUpdates = await User.updateMany(
      { roleType: 'admin', role: { $exists: false } },
      { $set: { role: roleMap['admin'] } }
    );
    
    console.log(`Updated ${userUpdates.modifiedCount + doctorUpdates.modifiedCount + adminUpdates.modifiedCount} users with role references`);

    console.log('Roles and permissions initialization completed successfully');
  } catch (error) {
    console.error('Error initializing roles and permissions:', error);
  } finally {
    mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

initializeRolesAndPermissions(); 