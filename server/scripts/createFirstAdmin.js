require('dotenv').config();
const mongoose = require('mongoose');
const Admin = require('../models/Admin');

async function createFirstAdmin() {
  try {
    // Kết nối đến MongoDB
    await mongoose.connect(process.env.MONGO_URI);
    console.log('MongoDB Connected');

    // Kiểm tra xem đã có admin nào chưa
    const adminCount = await Admin.countDocuments();
    if (adminCount > 0) {
      console.log('Admin đã tồn tại trong hệ thống');
      process.exit(0);
    }

    // Tạo admin đầu tiên với quyền super_admin
    const admin = await Admin.create({
      email: 'admin@hospital.com',
      phoneNumber: '0123456789',
      passwordHash: 'admin123456',  // Password sẽ được hash tự động bởi middleware
      fullName: 'Super Admin',
      role: 'super_admin',
      permissions: [
        'manage_users',
        'manage_doctors',
        'manage_hospitals',
        'manage_appointments',
        'manage_services',
        'manage_promotions',
        'view_reports',
        'manage_admins',
        'system_settings'
      ]
    });

    console.log('Tạo admin đầu tiên thành công:');
    console.log('- Email: admin@hospital.com');
    console.log('- Mật khẩu: admin123456');

    process.exit(0);
  } catch (error) {
    console.error('Lỗi tạo admin:', error);
    process.exit(1);
  }
}

createFirstAdmin(); 