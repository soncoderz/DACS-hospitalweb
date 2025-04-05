/**
 * Script để tạo các bệnh viện mẫu
 * Sử dụng: node scripts/createDefaultHospitals.js
 */

const path = require('path');
require('dotenv').config();
const mongoose = require('mongoose');
const Hospital = require('../models/Hospital');

// Danh sách bệnh viện mẫu
const DEFAULT_HOSPITALS = [
  {
    name: 'Bệnh viện Đa khoa Trung ương',
    address: {
      street: '16 Phạm Ngũ Lão',
      district: 'Quận 1',
      city: 'TP.HCM'
    },
    phoneNumber: '0283123456',
    email: 'bvdktw@example.com',
    website: 'https://bvtrung-uong.com',
    description: 'Bệnh viện đa khoa hàng đầu với đầy đủ các chuyên khoa và trang thiết bị hiện đại.',
    facilities: [
      'Phòng mổ hiện đại',
      'Phòng xét nghiệm',
      'Phòng chụp X-quang',
      'Phòng chụp MRI',
      'Phòng cấp cứu 24/7'
    ],
    openingHours: {
      monday: { open: '07:30', close: '17:00' },
      tuesday: { open: '07:30', close: '17:00' },
      wednesday: { open: '07:30', close: '17:00' },
      thursday: { open: '07:30', close: '17:00' },
      friday: { open: '07:30', close: '17:00' },
      saturday: { open: '07:30', close: '11:30' },
      sunday: { open: '07:30', close: '11:30' }
    },
    isMainBranch: true
  },
  {
    name: 'Bệnh viện Quốc tế',
    address: {
      street: '45 Lê Lợi',
      district: 'Quận 1',
      city: 'TP.HCM'
    },
    phoneNumber: '0283222333',
    email: 'international@example.com',
    website: 'https://international-hospital.vn',
    description: 'Bệnh viện quốc tế với đội ngũ y bác sĩ có trình độ chuyên môn cao và nhiều năm kinh nghiệm.',
    facilities: [
      'Phòng mổ tiêu chuẩn quốc tế',
      'Phòng xét nghiệm hiện đại',
      'Phòng chụp CT Scan',
      'Phòng điều trị đặc biệt',
      'Dịch vụ khám VIP'
    ],
    openingHours: {
      monday: { open: '08:00', close: '20:00' },
      tuesday: { open: '08:00', close: '20:00' },
      wednesday: { open: '08:00', close: '20:00' },
      thursday: { open: '08:00', close: '20:00' },
      friday: { open: '08:00', close: '20:00' },
      saturday: { open: '08:00', close: '17:00' },
      sunday: { open: '08:00', close: '12:00' }
    },
    isMainBranch: true
  }
];

// In giá trị để kiểm tra
console.log('Mongo URI:', process.env.MONGO_URI);

// Kết nối đến MongoDB
mongoose.connect(process.env.MONGO_URI)
  .then(() => {
    console.log('Đã kết nối đến MongoDB');
    createDefaultHospitals();
  })
  .catch(err => {
    console.error('Lỗi kết nối đến MongoDB:', err);
    process.exit(1);
  });

// Hàm tạo các bệnh viện mẫu
async function createDefaultHospitals() {
  try {
    console.log('=== TẠO CÁC BỆNH VIỆN MẪU ===\n');

    const results = {
      success: [],
      skipped: []
    };

    // Tạo từng bệnh viện trong danh sách
    for (const hospitalData of DEFAULT_HOSPITALS) {
      // Kiểm tra xem bệnh viện đã tồn tại chưa (theo email vì email là unique)
      const existingHospital = await Hospital.findOne({ email: hospitalData.email });
      
      if (existingHospital) {
        console.log(`Bỏ qua: Bệnh viện "${hospitalData.name}" đã tồn tại.`);
        results.skipped.push(hospitalData.name);
        continue;
      }

      // Tạo bệnh viện mới
      const hospital = new Hospital(hospitalData);
      await hospital.save();
      
      console.log(`Đã tạo: Bệnh viện "${hospital.name}"`);
      results.success.push(hospital.name);
    }

    console.log('\n=== KẾT QUẢ ===');
    console.log(`Tổng số: ${DEFAULT_HOSPITALS.length}`);
    console.log(`Thành công: ${results.success.length}`);
    console.log(`Bỏ qua: ${results.skipped.length}`);

    if (results.success.length > 0) {
      console.log('\n\x1b[32m%s\x1b[0m', 'Các bệnh viện đã tạo thành công:');
      results.success.forEach((name, index) => {
        console.log(`${index + 1}. ${name}`);
      });
    }
    
    mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error('\x1b[31m%s\x1b[0m', 'Lỗi khi tạo bệnh viện:');
    console.error(error);
    
    mongoose.connection.close();
    process.exit(1);
  }
} 