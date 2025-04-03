/**
 * Script để tạo chuyên khoa mới
 * Sử dụng: node scripts/createSpecialty.js
 */

const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
const mongoose = require('mongoose');
const Specialty = require('../models/Specialty');
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
    createSpecialty();
  })
  .catch(err => {
    console.error('Lỗi kết nối đến MongoDB:', err);
    process.exit(1);
  });

// Hàm tạo chuyên khoa
async function createSpecialty() {
  try {
    // Lấy danh sách chuyên khoa hiện có để tham khảo
    const existingSpecialties = await Specialty.find({}, 'name');
    
    if (existingSpecialties.length > 0) {
      console.log('\nDanh sách chuyên khoa hiện có:');
      existingSpecialties.forEach((specialty, index) => {
        console.log(`${index + 1}. ${specialty.name}`);
      });
      console.log('');
    }

    console.log('=== TẠO CHUYÊN KHOA MỚI ===\n');

    // Thu thập thông tin
    const name = await askQuestion('Tên chuyên khoa: ');
    const description = await askQuestion('Mô tả: ');
    const icon = await askQuestion('Icon (URL hoặc tên icon, có thể để trống): ');

    // Kiểm tra trùng tên
    const existingSpecialty = await Specialty.findOne({ name });
    if (existingSpecialty) {
      console.error('\x1b[31m%s\x1b[0m', `Chuyên khoa với tên "${name}" đã tồn tại trong hệ thống.`);
      mongoose.connection.close();
      process.exit(1);
    }

    // Tạo chuyên khoa mới
    const specialty = new Specialty({
      name,
      description,
      icon: icon || undefined
    });

    await specialty.save();
    
    console.log('\x1b[32m%s\x1b[0m', '\nĐã tạo thành công chuyên khoa mới:');
    console.log({
      name: specialty.name,
      description: specialty.description,
      icon: specialty.icon
    });
    
    mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error('\x1b[31m%s\x1b[0m', 'Lỗi khi tạo chuyên khoa:');
    console.error(error);
    
    mongoose.connection.close();
    process.exit(1);
  }
}

// Hàm hỗ trợ cho readline
function askQuestion(question) {
  return new Promise(resolve => {
    rl.question(question, answer => {
      resolve(answer.trim());
    });
  });
}