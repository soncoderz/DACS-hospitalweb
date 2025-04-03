# Role Management Scripts

This directory contains scripts for managing user roles and permissions in the hospital management system.

## Available Scripts

### 1. Initialize Roles (`initRoles.js`)

This script initializes the `roleType` field for all users in the database to ensure proper role-based routing.

**Usage**:
```bash
npm run init-roles
```

**What it does**:
- Assigns default `roleType` of "user" to any account that doesn't have a roleType set
- Updates email addresses defined as administrators to have the `roleType` of "admin"
- Updates email addresses defined as doctors to have the `roleType` of "doctor"

**Configuration**:
Before running the script, edit the `adminEmails` and `doctorEmails` arrays in the script to include the email addresses of your administrators and doctors.

### 2. Initialize Roles and Permissions (`initRolesAndPermissions.js`)

This script sets up the complete role and permission system in the database. It creates the necessary Role and Permission documents and links them to users.

**Usage**:
```bash
npm run init-roles-permissions
```

**What it does**:
- Creates default permissions for different actions in the system
- Creates default roles (admin, doctor, user) with appropriate permissions
- Links users to their corresponding role documents based on their roleType
- Updates user records to include references to their role documents

**When to use**:
Run this script after setting up the database or when you need to reset/rebuild the permission system.

### 3. Create Admin and Doctor Users (`createUsers.js`)

This script creates default admin and doctor accounts for the system.

**Usage**:
```bash
npm run create-users
```

**What it does**:
- Creates an admin account (if it doesn't already exist)
- Creates a doctor account (if it doesn't already exist)
- Sets up these accounts with appropriate roles and permissions
- The accounts are created as verified accounts so they can be used immediately

**Default Accounts**:
- Admin: admin@benhvien.com / admin123
- Doctor: doctor@benhvien.com / doctor123

### 4. Complete System Setup (`setupSystem.js`)

This script runs all initialization scripts in sequence for a complete system setup.

**Usage**:
```bash
npm run setup
```

**What it does**:
1. Initializes roles and permissions
2. Creates default admin and doctor accounts

**When to use**:
Use this script when setting up the application for the first time or when you need to reset the system to its default state.

## Role-Based Access

The application uses a role-based access control system with three main roles:

1. **Admin** - Full access to all features
2. **Doctor** - Access to doctor dashboard, appointments, and patient management
3. **User** - Access to booking appointments and managing their health records

## Role Hierarchy

- Admins have access to all routes
- Doctors have access to doctor routes and user routes
- Regular users only have access to user routes

## Permission System

The application uses a granular permission system:

1. **Role-based permissions**: Each role has predefined permissions stored in the database
2. **Fallback permissions**: If role lookup fails, permissions are determined by roleType
3. **Default permissions**:
   - Admins have all permissions
   - Doctors can view patients, update medical records, schedule appointments
   - Users can view their own profile, book appointments, view their own records

## Authentication Flow

1. When a user logs in, the `authController.js` will return user data including their `roleType`
2. The frontend `roleUtils.js` uses this roleType to:
   - Determine which dashboard to redirect to after login
   - Check permissions for accessing specific routes
   - Show/hide UI elements based on role

## How to Add New Roles

If you need to add new roles:

1. Update the `roleType` enum in the User model
2. Update the `hasPermission` function in `roleUtils.js`
3. Update the `getHomeRouteForRole` function in `roleUtils.js`
4. Create appropriate route protection components for the new role
5. Update the `hasRole` middleware to handle the new role
6. Add the new role and permissions to the initialization script

Remember to run the initialization scripts after updating the roles to ensure all users have the correct roleType and permissions. 