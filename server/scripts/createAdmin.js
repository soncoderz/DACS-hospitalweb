/**
 * Script để tạo tài khoản admin
 * Sử dụng: node scripts/createAdmin.js
 */

const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
const mongoose = require('mongoose');
const Admin = require('../models/Admin');
const readline = require('readline');

// Thiết lập readline interface
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// In giá trị để kiểm tra
console.log('Mongo URI:', process.env.MONGO_URI);

// Kết nối đến MongoDB
mongoose.connect(process.env.MONGO_URI)
  .then(() => {
    console.log('Đã kết nối đến MongoDB');
    createAdmin();
  })
  .catch(err => {
    console.error('Lỗi kết nối đến MongoDB:', err);
    process.exit(1);
  });

// Hàm tạo admin
async function createAdmin() {
  try {
    // Kiểm tra xem đã có super_admin chưa
    const superAdminExists = await Admin.findOne({ role: 'super_admin' });
    
    if (superAdminExists) {
      console.log('\x1b[33m%s\x1b[0m', 'Cảnh báo: Đã tồn tại tài khoản super_admin trong hệ thống!');
      const continueAnswer = await askQuestion('Bạn có muốn tiếp tục tạo admin mới không? (y/n): ');
      
      if (continueAnswer.toLowerCase() !== 'y') {
        console.log('Hủy tạo admin.');
        process.exit(0);
      }
    }

    // Yêu cầu thông tin
    const email = await askQuestion('Email: ');
    const phoneNumber = await askQuestion('Số điện thoại: ');
    const password = await askQuestion('Mật khẩu (ít nhất 6 ký tự): ');
    const fullName = await askQuestion('Họ tên: ');
    const roleOptions = await askQuestion('Vai trò (1: admin, 2: super_admin) [1]: ');
    
    const role = roleOptions === '2' ? 'super_admin' : 'admin';
    
    // Thiết lập permissions dựa trên role
    let permissions = ['manage_users', 'manage_appointments', 'view_reports'];
    
    if (role === 'super_admin') {
      permissions = [
        'manage_users',
        'manage_doctors',
        'manage_hospitals',
        'manage_appointments',
        'manage_services',
        'manage_promotions',
        'view_reports',
        'manage_admins',
        'system_settings'
      ];
    }
    
    // Tạo admin mới
    const newAdmin = new Admin({
      email,
      phoneNumber,
      passwordHash: password, // Sẽ được hash tự động bởi middleware
      fullName,
      role,
      permissions,
      isActive: true,
      lastLogin: null
    });
    
    await newAdmin.save();
    
    console.log('\x1b[32m%s\x1b[0m', `Đã tạo thành công tài khoản ${role}:`);
    console.log({
      email: newAdmin.email,
      fullName: newAdmin.fullName,
      role: newAdmin.role,
      permissions: newAdmin.permissions
    });
    
    mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error('\x1b[31m%s\x1b[0m', 'Lỗi khi tạo admin:');
    console.error(error);
    
    if (error.code === 11000) {
      console.error('\x1b[31m%s\x1b[0m', 'Email đã tồn tại trong hệ thống.');
    }
    
    mongoose.connection.close();
    process.exit(1);
  }
}

// Hàm hỗ trợ cho readline
function askQuestion(question) {
  return new Promise(resolve => {
    rl.question(question, answer => {
      resolve(answer);
    });
  });
} 