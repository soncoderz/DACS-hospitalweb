const path = require('path');
const mongoose = require('mongoose');
const dotenv = require('dotenv');

dotenv.config({ path: path.resolve(__dirname, '../.env') });

const { connectDB, disconnectDB } = require('../config/database');
const User = require('../models/User');
const Specialty = require('../models/Specialty');
const Hospital = require('../models/Hospital');
const Service = require('../models/Service');
const Doctor = require('../models/Doctor');
const Room = require('../models/Room');
const Schedule = require('../models/Schedule');

function buildWorkingHours() {
  return {
    monday: { open: '07:00', close: '17:00', isOpen: true },
    tuesday: { open: '07:00', close: '17:00', isOpen: true },
    wednesday: { open: '07:00', close: '17:00', isOpen: true },
    thursday: { open: '07:00', close: '17:00', isOpen: true },
    friday: { open: '07:00', close: '17:00', isOpen: true },
    saturday: { open: '07:00', close: '12:00', isOpen: true },
    sunday: { open: '00:00', close: '00:00', isOpen: false },
  };
}

function buildTimeSlots(roomId) {
  return [
    ['09:00', '09:30'],
    ['09:30', '10:00'],
    ['10:00', '10:30'],
    ['10:30', '11:00'],
    ['13:30', '14:00'],
    ['14:00', '14:30'],
    ['14:30', '15:00'],
    ['15:00', '15:30'],
  ].map(([startTime, endTime]) => ({
    startTime,
    endTime,
    isBooked: false,
    bookedCount: 0,
    maxBookings: 3,
    appointmentIds: [],
    roomId,
  }));
}

function getUpcomingWeekdays(count = 5) {
  const dates = [];
  const cursor = new Date();
  cursor.setHours(0, 0, 0, 0);
  cursor.setDate(cursor.getDate() + 1);

  while (dates.length < count) {
    const day = cursor.getDay();
    if (day !== 0 && day !== 6) {
      dates.push(new Date(cursor));
    }
    cursor.setDate(cursor.getDate() + 1);
  }

  return dates;
}

async function createUser({
  fullName,
  email,
  phoneNumber,
  password,
  roleType = 'user',
}) {
  return User.create({
    fullName,
    email,
    phoneNumber,
    passwordHash: password,
    dateOfBirth: new Date('1995-01-01'),
    gender: 'other',
    address: 'Selenium Seed Address',
    roleType,
    isVerified: true,
    isLocked: false,
  });
}

async function main() {
  await connectDB();

  try {
    await mongoose.connection.db.dropDatabase();

    const admin = await createUser({
      fullName: 'Admin User',
      email: 'admin@example.com',
      phoneNumber: '0900000001',
      password: 'HospitalApp@123',
      roleType: 'admin',
    });

    const patientUsers = await Promise.all([
      createUser({
        fullName: 'User One',
        email: 'user1@example.com',
        phoneNumber: '0900000002',
        password: 'HospitalApp@123',
      }),
      createUser({
        fullName: 'User Two',
        email: 'user2@example.com',
        phoneNumber: '0900000003',
        password: 'HospitalApp@123',
      }),
      createUser({
        fullName: 'User Three',
        email: 'user3@example.com',
        phoneNumber: '0900000004',
        password: 'HospitalApp@123',
      }),
    ]);

    const specialty = await Specialty.create({
      name: 'Noi khoa',
      description: 'Chuyen khoa noi tong quat phuc vu Selenium CI.',
      icon: 'fa-heartbeat',
      imageUrl: 'https://example.com/specialty/internal.jpg',
      isActive: true,
    });

    const hospital = await Hospital.create({
      name: 'Benh vien Selenium CI',
      address: '1 Selenium Street, Ho Chi Minh City',
      contactInfo: {
        phone: '19001234',
        email: 'ci-hospital@example.com',
        website: 'https://example.com',
      },
      description: 'Du lieu toi gian cho Selenium CI.',
      imageUrl: 'https://example.com/hospital.jpg',
      workingHours: buildWorkingHours(),
      specialties: [specialty._id],
      facilities: ['Phong kham tong quat', 'Xet nghiem co ban'],
      location: {
        type: 'Point',
        coordinates: [106.70098, 10.77689],
      },
      isActive: true,
      isMainHospital: true,
    });

    const service = await Service.create({
      name: 'Kham chuyen khoa noi',
      description: 'Dich vu kham noi khoa cho Selenium CI.',
      shortDescription: 'Kham noi khoa',
      price: 400000,
      specialtyId: specialty._id,
      duration: 30,
      type: 'consultation',
      isActive: true,
      imageUrl: 'https://example.com/service.jpg',
    });

    const doctorUser = await createUser({
      fullName: 'Nguyen Van A',
      email: 'doctor.a@example.com',
      phoneNumber: '0900000005',
      password: 'HospitalApp@123',
      roleType: 'doctor',
    });

    const doctor = await Doctor.create({
      user: doctorUser._id,
      specialtyId: specialty._id,
      hospitalId: hospital._id,
      services: [service._id],
      title: 'Bac si',
      description: 'Bac si mau cho Selenium CI.',
      education: 'Dai hoc Y Duoc',
      experience: 6,
      certifications: ['Chung chi kham benh'],
      languages: ['Vietnamese'],
      consultationFee: 400000,
      isAvailable: true,
    });

    const room = await Room.create({
      name: 'Phong Kham Noi Tong Quat',
      number: '101',
      floor: '1',
      type: 'consultation',
      capacity: 1,
      description: 'Phong kham phuc vu Selenium CI.',
      hospitalId: hospital._id,
      specialtyId: specialty._id,
      status: 'active',
      assignedDoctors: [doctor._id],
      isActive: true,
    });

    const upcomingDates = getUpcomingWeekdays(5);
    const schedules = [];

    for (const scheduleDate of upcomingDates) {
      const schedule = await Schedule.create({
        doctorId: doctor._id,
        hospitalId: hospital._id,
        date: scheduleDate,
        timeSlots: buildTimeSlots(room._id),
        isActive: true,
        notes: 'Selenium CI schedule',
      });
      schedules.push(schedule);
    }

    console.log(JSON.stringify({
      success: true,
      summary: {
        admins: 1,
        users: patientUsers.length,
        specialties: 1,
        hospitals: 1,
        services: 1,
        doctors: 1,
        rooms: 1,
        schedules: schedules.length,
      },
      adminEmail: admin.email,
      patientEmails: patientUsers.map((user) => user.email),
      doctorEmail: doctorUser.email,
      hospitalId: String(hospital._id),
      specialtyId: String(specialty._id),
      serviceId: String(service._id),
      doctorId: String(doctor._id),
    }));
  } finally {
    await disconnectDB();
  }
}

main().catch(async (error) => {
  console.error(error);
  try {
    await disconnectDB();
  } catch (_) {
    // Ignore disconnect errors after a failure.
  }
  process.exit(1);
});
