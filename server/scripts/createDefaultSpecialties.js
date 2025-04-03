/**
 * Script để tạo các chuyên khoa mặc định
 * Sử dụng: node scripts/createDefaultSpecialties.js
 */

const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
const mongoose = require('mongoose');
const Specialty = require('../models/Specialty');

// Danh sách chuyên khoa mặc định
const DEFAULT_SPECIALTIES = [
  {
    name: 'Đa khoa',
    description: 'Khám và điều trị các bệnh thông thường',
    icon: 'stethoscope'
  },
  {
    name: 'Tim mạch',
    description: 'Chuyên khoa tim và hệ tuần hoàn',
    icon: 'heartbeat'
  },
  {
    name: 'Nhi khoa',
    description: 'Chuyên khoa dành cho trẻ em',
    icon: 'baby'
  },
  {
    name: 'Da liễu',
    description: 'Chuyên khoa về da và các bệnh liên quan đến da',
    icon: 'allergies'
  },
  {
    name: 'Thần kinh',
    description: 'Chuyên khoa về hệ thần kinh',
    icon: 'brain'
  },
  {
    name: 'Tiêu hóa',
    description: 'Chuyên khoa về hệ tiêu hóa',
    icon: 'stomach'
  },
  {
    name: 'Chấn thương chỉnh hình',
    description: 'Chuyên khoa về xương khớp và chấn thương',
    icon: 'bone'
  },
  {
    name: 'Tai Mũi Họng',
    description: 'Chuyên khoa về tai, mũi, họng',
    icon: 'ear'
  },
  {
    name: 'Mắt',
    description: 'Chuyên khoa về mắt và thị lực',
    icon: 'eye'
  },
  {
    name: 'Sản phụ khoa',
    description: 'Chuyên khoa về sức khỏe phụ nữ và thai sản',
    icon: 'female'
  }
];

// In giá trị để kiểm tra
console.log('Mongo URI:', process.env.MONGO_URI);

// Kết nối đến MongoDB
mongoose.connect(process.env.MONGO_URI)
  .then(() => {
    console.log('Đã kết nối đến MongoDB');
    createDefaultSpecialties();
  })
  .catch(err => {
    console.error('Lỗi kết nối đến MongoDB:', err);
    process.exit(1);
  });

// Hàm tạo các chuyên khoa mặc định
async function createDefaultSpecialties() {
  try {
    console.log('=== TẠO CÁC CHUYÊN KHOA MẶC ĐỊNH ===\n');

    const results = {
      success: [],
      skipped: []
    };

    // Tạo từng chuyên khoa trong danh sách
    for (const specialtyData of DEFAULT_SPECIALTIES) {
      // Kiểm tra xem chuyên khoa đã tồn tại chưa
      const existingSpecialty = await Specialty.findOne({ name: specialtyData.name });
      
      if (existingSpecialty) {
        console.log(`Bỏ qua: Chuyên khoa "${specialtyData.name}" đã tồn tại.`);
        results.skipped.push(specialtyData.name);
        continue;
      }

      // Tạo chuyên khoa mới
      const specialty = new Specialty(specialtyData);
      await specialty.save();
      
      console.log(`Đã tạo: Chuyên khoa "${specialty.name}"`);
      results.success.push(specialty.name);
    }

    console.log('\n=== KẾT QUẢ ===');
    console.log(`Tổng số: ${DEFAULT_SPECIALTIES.length}`);
    console.log(`Thành công: ${results.success.length}`);
    console.log(`Bỏ qua: ${results.skipped.length}`);

    if (results.success.length > 0) {
      console.log('\n\x1b[32m%s\x1b[0m', 'Các chuyên khoa đã tạo thành công:');
      results.success.forEach((name, index) => {
        console.log(`${index + 1}. ${name}`);
      });
    }
    
    mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error('\x1b[31m%s\x1b[0m', 'Lỗi khi tạo chuyên khoa:');
    console.error(error);
    
    mongoose.connection.close();
    process.exit(1);
  }
} 