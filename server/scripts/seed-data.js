const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const Doctor = require('../models/Doctor');
const DoctorAccount = require('../models/DoctorAccount');
const Hospital = require('../models/Hospital');
const Schedule = require('../models/Schedule');
const Specialty = require('../models/Specialty');
const DoctorSchedule = require('../models/DoctorSchedule');
require('dotenv').config();

// Kết nối MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/hospital-db')
  .then(() => console.log('Kết nối MongoDB thành công'))
  .catch(err => console.error('Lỗi kết nối MongoDB:', err));

// Xóa dữ liệu cũ
const clearData = async () => {
  try {
    await User.deleteMany({});
    await Doctor.deleteMany({});
    await DoctorAccount.deleteMany({});
    await Hospital.deleteMany({});
    await Schedule.deleteMany({});
    await Specialty.deleteMany({});
    await DoctorSchedule.deleteMany({});
    console.log('Đã xóa dữ liệu cũ');
  } catch (error) {
    console.error('Lỗi khi xóa dữ liệu:', error);
  }
};

// Tạo dữ liệu mẫu
const seedData = async () => {
  try {
    // 1. Tạo chuyên khoa
    const specialties = await Specialty.create([
      {
        name: 'Nhi khoa',
        description: 'Chuyên khoa về trẻ em và sơ sinh',
        icon: 'pediatrics-icon'
      },
      {
        name: 'Tim mạch',
        description: 'Chuyên khoa về tim và hệ tuần hoàn',
        icon: 'cardiology-icon'
      },
      {
        name: 'Da liễu',
        description: 'Chuyên khoa về da và các bệnh liên quan đến da',
        icon: 'dermatology-icon'
      },
      {
        name: 'Thần kinh',
        description: 'Chuyên khoa về hệ thần kinh, não và tủy sống',
        icon: 'neurology-icon'
      }
    ]);
    
    console.log('Đã tạo chuyên khoa');

    // 2. Tạo bệnh viện
    const hospitals = await Hospital.create([
      {
        name: 'Bệnh viện Đa khoa Trung ương',
        address: {
          street: '1 Đường Lê Lợi',
          district: 'Quận 1',
          city: 'TP.HCM',
          country: 'Việt Nam'
        },
        contactInfo: {
          phone: '0281234567',
          email: 'info@bvdktw.com',
          website: 'https://bvdktw.com'
        },
        workingHours: {
          monday: { open: '07:00', close: '20:00' },
          tuesday: { open: '07:00', close: '20:00' },
          wednesday: { open: '07:00', close: '20:00' },
          thursday: { open: '07:00', close: '20:00' },
          friday: { open: '07:00', close: '20:00' },
          saturday: { open: '07:00', close: '17:00' },
          sunday: { open: '08:00', close: '12:00' }
        }
      },
      {
        name: 'Bệnh viện Nhi đồng 1',
        address: {
          street: '341 Sư Vạn Hạnh',
          district: 'Quận 10',
          city: 'TP.HCM',
          country: 'Việt Nam'
        },
        contactInfo: {
          phone: '0283827138',
          email: 'info@nhidong1.org.vn',
          website: 'https://nhidong1.org.vn'
        },
        workingHours: {
          monday: { open: '07:30', close: '19:30' },
          tuesday: { open: '07:30', close: '19:30' },
          wednesday: { open: '07:30', close: '19:30' },
          thursday: { open: '07:30', close: '19:30' },
          friday: { open: '07:30', close: '19:30' },
          saturday: { open: '07:30', close: '17:30' },
          sunday: { open: '08:00', close: '11:30' }
        }
      }
    ]);
    
    console.log('Đã tạo bệnh viện');

    // 3. Tạo người dùng
    // KHÔNG hash mật khẩu ở đây vì model User đã có middleware tự động hash
    // Sử dụng trực tiếp giá trị mật khẩu gốc, middleware trong model User sẽ tự động hash
    
    const users = await User.create([
      {
        fullName: 'Admin Hệ thống',
        email: 'admin@example.com',
        passwordHash: 'Password123!',
        phoneNumber: '0901234567',
        address: '123 Đường ABC, Quận 1, TP.HCM, Việt Nam',
        dateOfBirth: new Date('1985-05-15'),
        gender: 'male',
        roleType: 'admin',
        isActive: true,
        isEmailConfirmed: true
      },
      {
        fullName: 'Nguyễn Văn A',
        email: 'patient@example.com',
        passwordHash: 'Password123!',
        phoneNumber: '0912345678',
        address: '456 Đường XYZ, Quận 2, TP.HCM, Việt Nam',
        dateOfBirth: new Date('1990-01-01'),
        gender: 'male',
        roleType: 'user',
        isActive: true,
        isEmailConfirmed: true
      },
      {
        fullName: 'BS. Trần Thị B',
        email: 'doctor@example.com',
        passwordHash: 'Password123!',
        phoneNumber: '0923456789',
        address: '789 Đường MNO, Quận 3, TP.HCM, Việt Nam',
        dateOfBirth: new Date('1980-10-10'),
        gender: 'female',
        roleType: 'doctor',
        isActive: true,
        isEmailConfirmed: true
      },
      {
        fullName: 'BS. Lê Văn C',
        email: 'doctor2@example.com',
        passwordHash: 'Password123!',
        phoneNumber: '0934567890',
        address: '101 Đường PQR, Quận 10, TP.HCM, Việt Nam',
        dateOfBirth: new Date('1975-03-20'),
        gender: 'male',
        roleType: 'doctor',
        isActive: true,
        isEmailConfirmed: true
      }
    ]);
    
    console.log('Đã tạo người dùng');

    // 4. Tạo thông tin bác sĩ
    const doctors = await Doctor.create([
      {
        user: users[2]._id,
        specialtyId: specialties[0]._id, // Nhi khoa
        hospitalId: hospitals[1]._id, // BV Nhi đồng 1
        title: 'Bác sĩ chuyên khoa II',
        description: 'Chuyên gia về bệnh lý hô hấp ở trẻ em',
        education: 'Đại học Y Dược TP.HCM, Chuyên khoa II Nhi',
        experience: 15,
        certifications: ['Bác sĩ Chuyên khoa II', 'Chứng chỉ hồi sức cấp cứu nhi khoa'],
        languages: ['Tiếng Việt', 'Tiếng Anh'],
        consultationFee: 300000,
        isAvailable: true,
        averageRating: 4.8,
        totalReviews: 120
      },
      {
        user: users[3]._id,
        specialtyId: specialties[1]._id, // Tim mạch
        hospitalId: hospitals[0]._id, // BV Đa khoa TW
        title: 'Bác sĩ chuyên khoa I',
        description: 'Chuyên gia về bệnh tim mạch và mạch máu',
        education: 'Đại học Y Hà Nội, Chuyên khoa I Tim mạch',
        experience: 10,
        certifications: ['Bác sĩ Chuyên khoa I', 'Chứng chỉ siêu âm tim mạch'],
        languages: ['Tiếng Việt', 'Tiếng Anh'],
        consultationFee: 350000,
        isAvailable: true,
        averageRating: 4.5,
        totalReviews: 85
      }
    ]);
    
    console.log('Đã tạo thông tin bác sĩ');
    
    // 4a. Tạo tài khoản bác sĩ trong collection riêng
    const doctorAccounts = await DoctorAccount.create([
      {
        fullName: 'BS. Nguyễn Văn Doctor',
        email: 'doctor_account@example.com',
        passwordHash: 'Password123!', // Sẽ được hash tự động
        phoneNumber: '0945678901',
        dateOfBirth: new Date('1978-05-15'),
        gender: 'male',
        address: '123 Đường Y Khoa, Quận 5, TP.HCM',
        specialtyId: specialties[0]._id, // Nhi khoa
        hospitalId: hospitals[1]._id, // BV Nhi đồng 1
        title: 'Bác sĩ chuyên khoa II',
        experience: 18,
        consultationFee: 350000,
        description: 'Bác sĩ chuyên khoa Nhi với hơn 18 năm kinh nghiệm',
        education: 'Đại học Y Dược TP.HCM, Chuyên khoa II Nhi',
        certifications: ['Bác sĩ Chuyên khoa II', 'Chứng chỉ hồi sức cấp cứu nhi khoa'],
        languages: ['Tiếng Việt', 'Tiếng Anh', 'Tiếng Pháp'],
        isAvailable: true,
        averageRating: 4.9,
        totalReviews: 150,
        isVerified: true
      },
      {
        fullName: 'BS. Trần Thị Doctor',
        email: 'doctor_account2@example.com',
        passwordHash: 'Password123!', // Sẽ được hash tự động
        phoneNumber: '0956789012',
        dateOfBirth: new Date('1982-08-20'),
        gender: 'female',
        address: '456 Đường Y Học, Quận 10, TP.HCM',
        specialtyId: specialties[1]._id, // Tim mạch
        hospitalId: hospitals[0]._id, // BV Đa khoa TW
        title: 'Bác sĩ chuyên khoa I',
        experience: 12,
        consultationFee: 320000,
        description: 'Bác sĩ chuyên khoa Tim mạch với 12 năm kinh nghiệm',
        education: 'Đại học Y Hà Nội, Chuyên khoa I Tim mạch',
        certifications: ['Bác sĩ Chuyên khoa I', 'Chứng chỉ siêu âm tim mạch'],
        languages: ['Tiếng Việt', 'Tiếng Anh'],
        isAvailable: true,
        averageRating: 4.7,
        totalReviews: 95,
        isVerified: true
      }
    ]);
    
    console.log('Đã tạo tài khoản bác sĩ trong collection riêng');

    // 5. Tạo lịch làm việc bác sĩ
    const today = new Date();
    const nextWeek = new Date(today);
    nextWeek.setDate(today.getDate() + 7);
    
    const schedules = [];
    
    // Tạo lịch cho bác sĩ 1
    for (let i = 0; i < 7; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      
      const schedule = await Schedule.create({
        doctorId: doctors[0]._id,
        hospitalId: hospitals[1]._id,
        date,
        timeSlots: [
          { startTime: '08:00', endTime: '08:30', isBooked: false },
          { startTime: '08:30', endTime: '09:00', isBooked: false },
          { startTime: '09:00', endTime: '09:30', isBooked: false },
          { startTime: '09:30', endTime: '10:00', isBooked: false },
          { startTime: '10:00', endTime: '10:30', isBooked: false },
          { startTime: '14:00', endTime: '14:30', isBooked: false },
          { startTime: '14:30', endTime: '15:00', isBooked: false },
          { startTime: '15:00', endTime: '15:30', isBooked: false },
          { startTime: '15:30', endTime: '16:00', isBooked: false }
        ],
        isActive: true
      });
      
      schedules.push(schedule);
    }

    // Tạo lịch cho bác sĩ 2
    for (let i = 0; i < 7; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      
      const schedule = await Schedule.create({
        doctorId: doctors[1]._id,
        hospitalId: hospitals[0]._id,
        date,
        timeSlots: [
          { startTime: '08:00', endTime: '08:30', isBooked: false },
          { startTime: '08:30', endTime: '09:00', isBooked: false },
          { startTime: '09:00', endTime: '09:30', isBooked: false },
          { startTime: '09:30', endTime: '10:00', isBooked: false },
          { startTime: '10:00', endTime: '10:30', isBooked: false },
          { startTime: '13:30', endTime: '14:00', isBooked: false },
          { startTime: '14:00', endTime: '14:30', isBooked: false },
          { startTime: '14:30', endTime: '15:00', isBooked: false },
          { startTime: '15:00', endTime: '15:30', isBooked: false }
        ],
        isActive: true
      });
      
      schedules.push(schedule);
    }
    
    console.log('Đã tạo lịch làm việc bác sĩ');

    // In ra thông tin các ID để sử dụng trong Postman
    console.log('\n----- THÔNG TIN ID CHO POSTMAN -----');
    console.log(`ID người dùng thông thường: ${users[1]._id}`);
    console.log(`ID bác sĩ 1: ${users[2]._id} (User), ${doctors[0]._id} (Doctor)`);
    console.log(`ID bác sĩ 2: ${users[3]._id} (User), ${doctors[1]._id} (Doctor)`);
    console.log(`ID bệnh viện 1: ${hospitals[0]._id}`);
    console.log(`ID bệnh viện 2: ${hospitals[1]._id}`);
    console.log(`ID chuyên khoa Nhi: ${specialties[0]._id}`);
    console.log(`ID chuyên khoa Tim mạch: ${specialties[1]._id}`);
    console.log(`ID lịch khám (bác sĩ 1, ngày đầu tiên): ${schedules[0]._id}`);
    console.log(`ID lịch khám (bác sĩ 2, ngày đầu tiên): ${schedules[7]._id}`);
    console.log(`ID tài khoản bác sĩ collection riêng 1: ${doctorAccounts[0]._id}`);
    console.log(`ID tài khoản bác sĩ collection riêng 2: ${doctorAccounts[1]._id}`);
    console.log('--------------------------------------');

    // In ra thông tin đăng nhập
    console.log('\n----- THÔNG TIN ĐĂNG NHẬP CHO POSTMAN -----');
    console.log('Thông tin đăng nhập cho ADMIN:');
    console.log('Email: admin@example.com');
    console.log('Password: Password123!');
    console.log('\nThông tin đăng nhập cho BỆNH NHÂN:');
    console.log('Email: patient@example.com');
    console.log('Password: Password123!');
    console.log('\nThông tin đăng nhập cho BÁC SĨ 1 (Nhi khoa):');
    console.log('Email: doctor@example.com');
    console.log('Password: Password123!');
    console.log('\nThông tin đăng nhập cho BÁC SĨ 2 (Tim mạch):');
    console.log('Email: doctor2@example.com');
    console.log('Password: Password123!');
    console.log('--------------------------------------');

    console.log('\nThông tin đăng nhập cho TÀI KHOẢN BÁC SĨ COLLECTION RIÊNG:');
    console.log('Email: doctor_account@example.com');
    console.log('Password: Password123!');
    console.log('\nEmail: doctor_account2@example.com');
    console.log('Password: Password123!');
    console.log('--------------------------------------');

    // Đóng kết nối DB sau khi hoàn thành
    mongoose.connection.close();
    console.log('Đã tạo dữ liệu mẫu thành công');
    
  } catch (error) {
    console.error('Lỗi khi tạo dữ liệu mẫu:', error);
    mongoose.connection.close();
  }
};

// Chạy script
const runSeed = async () => {
  await clearData();
  await seedData();
};

runSeed();