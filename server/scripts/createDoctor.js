/**
 * Script để tạo tài khoản bác sĩ
 * Sử dụng: node scripts/createDoctor.js
 */

const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
const mongoose = require('mongoose');
const Doctor = require('../models/Doctor');
const User = require('../models/User');
const Specialty = require('../models/Specialty');
const Hospital = require('../models/Hospital');
const Role = require('../models/Role');
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
    createDoctor();
  })
  .catch(err => {
    console.error('Lỗi kết nối đến MongoDB:', err);
    process.exit(1);
  });

// Hàm tạo bác sĩ
async function createDoctor() {
  try {
    // Lấy danh sách chuyên khoa
    const specialties = await Specialty.find({});
    if (specialties.length === 0) {
      console.error('\x1b[31m%s\x1b[0m', 'Không có chuyên khoa nào trong hệ thống. Vui lòng tạo chuyên khoa trước.');
      mongoose.connection.close();
      process.exit(1);
    }

    // Lấy vai trò bác sĩ
    const doctorRole = await Role.findOne({ code: 'doctor' });
    if (!doctorRole) {
      console.error('\x1b[31m%s\x1b[0m', 'Không tìm thấy vai trò bác sĩ trong hệ thống.');
      mongoose.connection.close();
      process.exit(1);
    }

    // Lấy danh sách bệnh viện
    const hospitals = await Hospital.find({});
    if (hospitals.length === 0) {
      console.error('\x1b[31m%s\x1b[0m', 'Không có bệnh viện nào trong hệ thống. Vui lòng tạo bệnh viện trước.');
      mongoose.connection.close();
      process.exit(1);
    }

    console.log('\n=== TẠO TÀI KHOẢN BÁC SĨ ===\n');

    // Thu thập thông tin cơ bản
    const email = await askQuestion('Email: ');
    const phoneNumber = await askQuestion('Số điện thoại: ');
    const password = await askQuestion('Mật khẩu (ít nhất 6 ký tự): ');
    const fullName = await askQuestion('Họ tên đầy đủ: ');
    const dateOfBirthStr = await askQuestion('Ngày sinh (dd/mm/yyyy): ');
    const gender = await askQuestion('Giới tính (male/female/other): ');
    const address = await askQuestion('Địa chỉ: ');

    // Kiểm tra email và số điện thoại đã tồn tại chưa
    const existingUser = await User.findOne({
      $or: [{ email }, { phoneNumber }]
    });

    if (existingUser) {
      console.error('\x1b[31m%s\x1b[0m', 'Email hoặc số điện thoại đã tồn tại trong hệ thống.');
      mongoose.connection.close();
      process.exit(1);
    }

    // Hiển thị danh sách chuyên khoa
    console.log('\nDanh sách chuyên khoa:');
    specialties.forEach((specialty, index) => {
      console.log(`${index + 1}. ${specialty.name}`);
    });
    
    const specialtyIndex = parseInt(await askQuestion('Chọn chuyên khoa (nhập số thứ tự): ')) - 1;
    if (specialtyIndex < 0 || specialtyIndex >= specialties.length) {
      console.error('\x1b[31m%s\x1b[0m', 'Lựa chọn không hợp lệ.');
      mongoose.connection.close();
      process.exit(1);
    }
    const selectedSpecialty = specialties[specialtyIndex];

    // Hiển thị danh sách bệnh viện
    console.log('\nDanh sách bệnh viện:');
    hospitals.forEach((hospital, index) => {
      console.log(`${index + 1}. ${hospital.name}`);
    });
    
    const hospitalIndex = parseInt(await askQuestion('Chọn bệnh viện (nhập số thứ tự): ')) - 1;
    if (hospitalIndex < 0 || hospitalIndex >= hospitals.length) {
      console.error('\x1b[31m%s\x1b[0m', 'Lựa chọn không hợp lệ.');
      mongoose.connection.close();
      process.exit(1);
    }
    const selectedHospital = hospitals[hospitalIndex];

    // Thu thập thông tin thêm
    const experience = parseInt(await askQuestion('Số năm kinh nghiệm: '));
    const consultationFee = parseInt(await askQuestion('Phí tư vấn (VND): '));
    const biography = await askQuestion('Tiểu sử bác sĩ: ');
    
    // Xử lý ngày sinh
    const [day, month, year] = dateOfBirthStr.split('/').map(Number);
    const dateOfBirth = new Date(year, month - 1, day);

    // Tạo User trước
    const user = new User({
      email,
      phoneNumber,
      passwordHash: password, // Sẽ được hash tự động bởi middleware
      fullName,
      dateOfBirth,
      gender,
      address,
      role: doctorRole._id,
      roleType: 'doctor',
      isVerified: true // Bác sĩ được tạo bởi admin nên mặc định đã xác thực
    });

    await user.save();

    // Tạo Doctor
    const doctor = new Doctor({
      email,
      phoneNumber,
      passwordHash: password, // Sẽ được hash tự động bởi middleware
      fullName,
      specialtyId: selectedSpecialty._id,
      specialtyName: selectedSpecialty.name,
      hospitalIds: [selectedHospital._id],
      experience,
      biography,
      consultationFee,
      isVerified: true,
      isActive: true,
      userId: user._id,
      workingHours: [
        {
          dayOfWeek: 1, // Thứ 2
          shifts: [{
            startTime: '08:00',
            endTime: '17:00',
            hospitalId: selectedHospital._id
          }]
        },
        {
          dayOfWeek: 2, // Thứ 3
          shifts: [{
            startTime: '08:00',
            endTime: '17:00',
            hospitalId: selectedHospital._id
          }]
        },
        {
          dayOfWeek: 3, // Thứ 4
          shifts: [{
            startTime: '08:00',
            endTime: '17:00',
            hospitalId: selectedHospital._id
          }]
        },
        {
          dayOfWeek: 4, // Thứ 5
          shifts: [{
            startTime: '08:00',
            endTime: '17:00',
            hospitalId: selectedHospital._id
          }]
        },
        {
          dayOfWeek: 5, // Thứ 6
          shifts: [{
            startTime: '08:00',
            endTime: '17:00',
            hospitalId: selectedHospital._id
          }]
        }
      ],
      onlineConsultationHours: [
        {
          dayOfWeek: 1,
          times: [{
            startTime: '19:00',
            endTime: '21:00'
          }]
        },
        {
          dayOfWeek: 3,
          times: [{
            startTime: '19:00',
            endTime: '21:00'
          }]
        },
        {
          dayOfWeek: 5,
          times: [{
            startTime: '19:00',
            endTime: '21:00'
          }]
        }
      ]
    });

    await doctor.save();
    
    console.log('\x1b[32m%s\x1b[0m', '\nĐã tạo thành công tài khoản bác sĩ:');
    console.log({
      email: doctor.email,
      fullName: doctor.fullName,
      specialty: doctor.specialtyName,
      hospital: selectedHospital.name
    });
    
    mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error('\x1b[31m%s\x1b[0m', 'Lỗi khi tạo tài khoản bác sĩ:');
    console.error(error);
    
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