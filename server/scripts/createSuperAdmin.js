require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const Admin = require('../models/adminModel');

/**
 * Script để tạo một tài khoản Super Admin đầu tiên
 * 
 * Chạy: node scripts/createSuperAdmin.js
 */

// Kết nối đến cơ sở dữ liệu
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => console.log('MongoDB connected'))
.catch(err => {
  console.error('MongoDB connection error:', err);
  process.exit(1);
});

// Thông tin Super Admin mặc định
const superAdminInfo = {
  name: 'Super Admin',
  email: 'admin@example.com',
  password: 'Admin123',  // Nhớ đổi mật khẩu sau khi tạo
  role: 'super_admin',
  permissions: [
    'manage_users',
    'manage_doctors',
    'manage_hospitals',
    'manage_appointments',
    'manage_services',
    'manage_promotions',
    'manage_admins'
  ],
  isActive: true
};

// Hàm tạo Super Admin
async function createSuperAdmin() {
  try {
    // Kiểm tra xem đã có Super Admin nào chưa
    const existingSuperAdmin = await Admin.findOne({ role: 'super_admin' });
    
    if (existingSuperAdmin) {
      console.log('Super Admin đã tồn tại:', existingSuperAdmin.email);
      process.exit(0);
    }

    // Kiểm tra xem email đã tồn tại chưa
    const existingAdmin = await Admin.findOne({ email: superAdminInfo.email });
    
    if (existingAdmin) {
      console.log('Email này đã được sử dụng:', superAdminInfo.email);
      process.exit(1);
    }

    // Hash mật khẩu trước khi lưu
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(superAdminInfo.password, salt);

    // Tạo và lưu Super Admin mới
    const superAdmin = new Admin({
      ...superAdminInfo,
      password: hashedPassword
    });

    await superAdmin.save();
    
    console.log('='.repeat(50));
    console.log('Super Admin đã được tạo thành công!');
    console.log('Email:', superAdminInfo.email);
    console.log('Mật khẩu:', superAdminInfo.password);
    console.log('='.repeat(50));
    console.log('Vui lòng đổi mật khẩu sau khi đăng nhập lần đầu tiên!');
    
    process.exit(0);
  } catch (error) {
    console.error('Lỗi khi tạo Super Admin:', error);
    process.exit(1);
  }
}

// Chạy chương trình
createSuperAdmin(); 