/**
 * Script để tạo các vai trò mặc định
 * Sử dụng: node scripts/createDefaultRoles.js
 */

const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
const mongoose = require('mongoose');
const Role = require('../models/Role');

// Danh sách vai trò mặc định
const DEFAULT_ROLES = [
  {
    name: 'Quản trị viên',
    code: 'admin',
    description: 'Quản trị viên hệ thống',
    active: true,
    permissions: []
  },
  {
    name: 'Bác sĩ',
    code: 'doctor',
    description: 'Bác sĩ trong hệ thống',
    active: true,
    permissions: []
  },
  {
    name: 'Người dùng',
    code: 'user',
    description: 'Người dùng thông thường',
    active: true,
    permissions: []
  }
];

// In giá trị để kiểm tra
console.log('Mongo URI:', process.env.MONGO_URI);

// Kết nối đến MongoDB
mongoose.connect(process.env.MONGO_URI)
  .then(() => {
    console.log('Đã kết nối đến MongoDB');
    createDefaultRoles();
  })
  .catch(err => {
    console.error('Lỗi kết nối đến MongoDB:', err);
    process.exit(1);
  });

// Hàm tạo các vai trò mặc định
async function createDefaultRoles() {
  try {
    console.log('=== TẠO CÁC VAI TRÒ MẶC ĐỊNH ===\n');

    const results = {
      success: [],
      skipped: []
    };

    // Tạo từng vai trò trong danh sách
    for (const roleData of DEFAULT_ROLES) {
      // Kiểm tra xem vai trò đã tồn tại chưa
      const existingRole = await Role.findOne({ code: roleData.code });
      
      if (existingRole) {
        console.log(`Bỏ qua: Vai trò "${roleData.name}" (${roleData.code}) đã tồn tại.`);
        results.skipped.push(roleData.name);
        continue;
      }

      // Tạo vai trò mới
      const role = new Role(roleData);
      await role.save();
      
      console.log(`Đã tạo: Vai trò "${role.name}" (${role.code})`);
      results.success.push(role.name);
    }

    console.log('\n=== KẾT QUẢ ===');
    console.log(`Tổng số: ${DEFAULT_ROLES.length}`);
    console.log(`Thành công: ${results.success.length}`);
    console.log(`Bỏ qua: ${results.skipped.length}`);

    if (results.success.length > 0) {
      console.log('\n\x1b[32m%s\x1b[0m', 'Các vai trò đã tạo thành công:');
      results.success.forEach((name, index) => {
        console.log(`${index + 1}. ${name}`);
      });
    }
    
    mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error('\x1b[31m%s\x1b[0m', 'Lỗi khi tạo vai trò:');
    console.error(error);
    
    mongoose.connection.close();
    process.exit(1);
  }
} 