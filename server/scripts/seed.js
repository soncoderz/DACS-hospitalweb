const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const Specialty = require('../models/Specialty');
const Hospital = require('../models/Hospital');
const Service = require('../models/Service');
const Doctor = require('../models/Doctor');
const Schedule = require('../models/Schedule');
const Room = require('../models/Room');
const Coupon = require('../models/Coupon');
const dotenv = require('dotenv');
const Appointment = require('../models/Appointment');
const Payment = require('../models/Payment');
const Review = require('../models/Review');
const MedicalRecord = require('../models/MedicalRecord');
const Message = require('../models/Message');
const Conversation = require('../models/Conversation');

// Load environment variables
dotenv.config();

// Đảm bảo URI MongoDB không bị trống
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/hospitalweb';
console.log('Connecting to MongoDB at:', MONGODB_URI.replace(/mongodb:\/\/([^:]+):([^@]+)@/, 'mongodb://*****:*****@'));

// Connect to MongoDB với các tùy chọn nâng cao
mongoose.connect(MONGODB_URI, {
  serverSelectionTimeoutMS: 180000, // Tăng thời gian chờ kết nối lên 180 giây
  socketTimeoutMS: 180000, // Tăng thời gian chờ socket lên 180 giây
  connectTimeoutMS: 180000, // Tăng thời gian chờ kết nối lên 180 giây
  heartbeatFrequencyMS: 10000, // Kiểm tra kết nối thường xuyên hơn
  useNewUrlParser: true,
  useUnifiedTopology: true,
  maxPoolSize: 10,
  minPoolSize: 2,
  bufferCommands: true, // Keep default of buffering commands
  bufferTimeoutMS: 180000 // Increase buffer timeout to 180 seconds
})
  .then(() => {
    console.log('MongoDB connected successfully...');
  })
  .catch(err => {
    console.error('MongoDB connection error:', err);
    console.error('Please check your MongoDB connection string and ensure MongoDB server is running');
    process.exit(1);
  });

// Reset all collections
const resetCollections = async () => {
  console.log('Resetting collections...');
  try {
    // Check connection status before attempting operations
    if (mongoose.connection.readyState !== 1) {
      throw new Error('MongoDB connection is not ready. Current state: ' + mongoose.connection.readyState);
    }
    
    // Add retry logic and timeout handling for collection reset
    const resetWithRetry = async (model, name, maxRetries = 3) => {
      let retries = 0;
      while (retries < maxRetries) {
        try {
          await model.deleteMany({});
          console.log(`${name} collection reset`);
          return;
        } catch (error) {
          retries++;
          console.warn(`Failed to reset ${name} collection. Attempt ${retries}/${maxRetries}`);
          if (retries >= maxRetries) {
            throw error;
          }
          // Wait before retrying
          await new Promise(resolve => setTimeout(resolve, 2000));
        }
      }
    };
    
    // Reset each collection with retry logic
    await resetWithRetry(User, 'Users');
    await resetWithRetry(Specialty, 'Specialties');
    await resetWithRetry(Hospital, 'Hospitals');
    await resetWithRetry(Service, 'Services');
    await resetWithRetry(Doctor, 'Doctors');
    await resetWithRetry(Schedule, 'Schedules');
    await resetWithRetry(Room, 'Rooms');
    await resetWithRetry(Coupon, 'Coupons');
    await resetWithRetry(Appointment, 'Appointments');
    await resetWithRetry(Payment, 'Payments');
    await resetWithRetry(Review, 'Reviews');
    await resetWithRetry(MedicalRecord, 'Medical records');
    await resetWithRetry(Message, 'Messages');
    await resetWithRetry(Conversation, 'Conversations');
    
    console.log('All collections reset successfully!');
  } catch (err) {
    console.error('Error resetting collections:', err);
    throw err;
  }
};

// Create admin user
const createAdmin = async () => {
  console.log('Creating admin user...');
  const adminPassword = 'HospitalApp@123';
  const adminUser = await User.create({
    fullName: 'Admin User',
    email: 'admin@example.com',
    phoneNumber: '0987654321',
    passwordHash: adminPassword,
    dateOfBirth: new Date('1990-01-01'),
    gender: 'other',
    address: 'Admin Office, Hospital Building',
    roleType: 'admin',
    isVerified: true
  });
  console.log('Admin user created:', adminUser.email);
  return adminUser;
};

// Create specialties
const createSpecialties = async () => {
  console.log('Creating specialties...');
  const specialties = await Specialty.insertMany([
    {
      name: 'Nội khoa',
      description: 'Khám và điều trị các bệnh lý nội khoa chung',
      icon: 'fa-heartbeat',
      imageUrl: 'https://example.com/specialty/internal.jpg',
      isActive: true
    },
    {
      name: 'Ngoại khoa',
      description: 'Khám và điều trị các bệnh lý cần can thiệp ngoại khoa',
      icon: 'fa-stethoscope',
      imageUrl: 'https://example.com/specialty/surgery.jpg',
      isActive: true
    },
    {
      name: 'Sản khoa',
      description: 'Chăm sóc sức khỏe phụ nữ mang thai và sinh nở',
      icon: 'fa-baby',
      imageUrl: 'https://example.com/specialty/ob.jpg',
      isActive: true
    },
    {
      name: 'Nhi khoa',
      description: 'Chăm sóc sức khỏe trẻ em và điều trị bệnh ở trẻ',
      icon: 'fa-child',
      imageUrl: 'https://example.com/specialty/pediatrics.jpg',
      isActive: true
    },
    {
      name: 'Da liễu',
      description: 'Khám và điều trị các bệnh lý về da',
      icon: 'fa-allergies',
      imageUrl: 'https://example.com/specialty/dermatology.jpg',
      isActive: true
    }
  ]);
  console.log(`${specialties.length} specialties created!`);
  return specialties;
};

// Create hospitals
const createHospitals = async (specialties) => {
  console.log('Creating hospitals...');
  const hospitals = await Hospital.insertMany([
    {
      name: 'Bệnh viện Đa khoa Trung ương',
      address: '1 Đường Trần Nhân Tông, Hai Bà Trưng, Hà Nội',
      contactInfo: {
        phone: '1900 1234',
        email: 'info@bvdktw.vn',
        website: 'www.bvdktw.vn'
      },
      description: 'Bệnh viện đa khoa lớn với đầy đủ các chuyên khoa',
      imageUrl: 'https://example.com/hospital/central.jpg',
      workingHours: {
        monday: { open: '07:00', close: '20:00', isOpen: true },
        tuesday: { open: '07:00', close: '20:00', isOpen: true },
        wednesday: { open: '07:00', close: '20:00', isOpen: true },
        thursday: { open: '07:00', close: '20:00', isOpen: true },
        friday: { open: '07:00', close: '20:00', isOpen: true },
        saturday: { open: '07:00', close: '17:00', isOpen: true },
        sunday: { open: '07:00', close: '12:00', isOpen: true }
      },
      specialties: specialties.map(specialty => specialty._id),
      facilities: ['Phòng mổ hiện đại', 'Phòng chăm sóc đặc biệt', 'Phòng xét nghiệm', 'Chẩn đoán hình ảnh'],
      location: {
        type: 'Point',
        coordinates: [105.8514, 21.0277]
      },
      isActive: true,
      isMainHospital: true
    },
    {
      name: 'Phòng khám đa khoa Hoàn Kiếm',
      address: '15 Hàng Bài, Hoàn Kiếm, Hà Nội',
      contactInfo: {
        phone: '1900 5678',
        email: 'info@pkhoankiem.vn',
        website: 'www.pkhoankiem.vn'
      },
      description: 'Phòng khám đa khoa với các dịch vụ khám chữa bệnh cơ bản',
      imageUrl: 'https://example.com/hospital/hoankiem.jpg',
      workingHours: {
        monday: { open: '08:00', close: '18:00', isOpen: true },
        tuesday: { open: '08:00', close: '18:00', isOpen: true },
        wednesday: { open: '08:00', close: '18:00', isOpen: true },
        thursday: { open: '08:00', close: '18:00', isOpen: true },
        friday: { open: '08:00', close: '18:00', isOpen: true },
        saturday: { open: '08:00', close: '16:00', isOpen: true },
        sunday: { open: '00:00', close: '00:00', isOpen: false }
      },
      specialties: [specialties[0]._id, specialties[1]._id, specialties[3]._id],
      facilities: ['Phòng khám', 'Phòng xét nghiệm cơ bản'],
      location: {
        type: 'Point',
        coordinates: [105.8480, 21.0222]
      },
      isActive: true,
      isMainHospital: false,
      parentHospital: null
    }
  ]);
  console.log(`${hospitals.length} hospitals created!`);
  return hospitals;
};

// Create services
const createServices = async (specialties) => {
  console.log('Creating services...');
  const services = await Service.insertMany([
    {
      name: 'Khám tổng quát',
      description: 'Khám sức khỏe tổng quát theo tiêu chuẩn',
      price: 500000,
      specialtyId: specialties[0]._id,
      duration: 30,
      isActive: true,
      imageUrl: 'https://example.com/service/general.jpg'
    },
    {
      name: 'Khám chuyên khoa nội',
      description: 'Khám chuyên sâu các bệnh nội khoa',
      price: 400000,
      specialtyId: specialties[0]._id,
      duration: 30,
      isActive: true,
      imageUrl: 'https://example.com/service/internal.jpg'
    },
    {
      name: 'Khám thai',
      description: 'Khám thai định kỳ cho phụ nữ mang thai',
      price: 450000,
      specialtyId: specialties[2]._id,
      duration: 40,
      isActive: true,
      imageUrl: 'https://example.com/service/pregnancy.jpg'
    },
    {
      name: 'Tiêm vaccine cho trẻ',
      description: 'Tiêm chủng vaccine theo lịch cho trẻ em',
      price: 350000,
      specialtyId: specialties[3]._id,
      duration: 20,
      isActive: true,
      imageUrl: 'https://example.com/service/vaccine.jpg'
    },
    {
      name: 'Khám da',
      description: 'Khám và tư vấn các vấn đề về da',
      price: 400000,
      specialtyId: specialties[4]._id,
      duration: 30,
      isActive: true,
      imageUrl: 'https://example.com/service/skin.jpg'
    }
  ]);
  console.log(`${services.length} services created!`);
  return services;
};

// Create rooms
const createRooms = async (hospitals) => {
  console.log('Creating rooms...');
  let rooms = [];
  let roomCount = 0;
  
  for (const hospital of hospitals) {
    // Create room entries one by one to ensure pre-save middleware runs properly
    const room1 = await Room.create({
      name: `Phòng 101`,
      number: '101',
      hospitalId: hospital._id,
      floor: '1',
      type: 'examination',
      capacity: 2,
      status: 'active',
      description: 'Phòng khám đa khoa',
      roomId: `R-101-1-${roomCount++}`
    });
    
    const room2 = await Room.create({
      name: `Phòng 102`,
      number: '102',
      hospitalId: hospital._id,
      floor: '1',
      type: 'examination',
      capacity: 2,
      status: 'active',
      description: 'Phòng khám chuyên khoa',
      roomId: `R-102-1-${roomCount++}`
    });
    
    const room3 = await Room.create({
      name: `Phòng 201`,
      number: '201',
      hospitalId: hospital._id,
      floor: '2',
      type: 'procedure',
      capacity: 3,
      status: 'active',
      description: 'Phòng tiểu phẫu',
      roomId: `R-201-2-${roomCount++}`
    });
    
    rooms = [...rooms, room1, room2, room3];
  }
  
  console.log(`${rooms.length} rooms created!`);
  return rooms;
};

// Create doctors and their accounts
const createDoctors = async (specialties, hospitals, services) => {
  console.log('Creating doctors...');
  const doctors = [];
  
  // Hash passwords before insertion
  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash('HospitalApp@123', salt);
  
  // Create user accounts for doctors first
  const doctorUsers = await User.insertMany([
    {
      fullName: 'Bác sĩ Nguyễn Văn A',
      email: 'doctor.a@example.com',
      phoneNumber: '0901234567',
      passwordHash: hashedPassword,
      dateOfBirth: new Date('1980-05-10'),
      gender: 'male',
      address: 'Hà Nội',
      roleType: 'doctor',
      isVerified: true,
      avatarUrl: 'https://example.com/doctor/doctor-a.jpg'
    },
    {
      fullName: 'Bác sĩ Trần Thị B',
      email: 'doctor.b@example.com',
      phoneNumber: '0901234568',
      passwordHash: hashedPassword,
      dateOfBirth: new Date('1985-08-15'),
      gender: 'female',
      address: 'Hà Nội',
      roleType: 'doctor',
      isVerified: true,
      avatarUrl: 'https://example.com/doctor/doctor-b.jpg'
    },
    {
      fullName: 'Bác sĩ Phạm Văn C',
      email: 'doctor.c@example.com',
      phoneNumber: '0901234569',
      passwordHash: hashedPassword,
      dateOfBirth: new Date('1975-03-20'),
      gender: 'male',
      address: 'Hà Nội',
      roleType: 'doctor',
      isVerified: true,
      avatarUrl: 'https://example.com/doctor/doctor-c.jpg'
    },
    {
      fullName: 'Bác sĩ Lê Thị D',
      email: 'doctor.d@example.com',
      phoneNumber: '0901234570',
      passwordHash: hashedPassword,
      dateOfBirth: new Date('1988-11-05'),
      gender: 'female',
      address: 'Hà Nội',
      roleType: 'doctor',
      isVerified: true,
      avatarUrl: 'https://example.com/doctor/doctor-d.jpg'
    }
  ]);
  
  // Create doctor profiles
  for (let i = 0; i < doctorUsers.length; i++) {
    const doctor = await Doctor.create({
      user: doctorUsers[i]._id,
      specialtyId: specialties[i % specialties.length]._id,
      hospitalId: hospitals[0]._id, // Main hospital
      services: [services[i % services.length]._id, services[(i + 1) % services.length]._id],
      title: i % 2 === 0 ? 'BS.CK2' : 'BS.CK1',
      description: `Bác sĩ với hơn ${10 + i} năm kinh nghiệm trong lĩnh vực ${specialties[i % specialties.length].name}`,
      education: 'Đại học Y Hà Nội',
      experience: 10 + i,
      certifications: ['Chứng chỉ hành nghề', 'Chứng nhận chuyên khoa'],
      languages: ['Tiếng Việt', 'Tiếng Anh'],
      consultationFee: 300000 + (i * 50000),
      isAvailable: true
    });
    
    doctors.push(doctor);
  }
  
  console.log(`${doctors.length} doctors created!`);
  return { doctors, doctorUsers };
};

// Create schedules
const createSchedules = async (doctors, hospitals, rooms) => {
  console.log('Creating schedules...');
  
  // Create base schedule templates
  const scheduleTemplates = await Schedule.insertMany([
    {
      name: 'Ca sáng',
      startTime: '08:00',
      endTime: '12:00',
      description: 'Ca làm việc buổi sáng',
      // Add required fields with placeholder values that will be overridden
      doctorId: doctors[0]._id,
      hospitalId: hospitals[0]._id,
      date: new Date()
    },
    {
      name: 'Ca chiều',
      startTime: '13:00',
      endTime: '17:00',
      description: 'Ca làm việc buổi chiều',
      // Add required fields with placeholder values that will be overridden
      doctorId: doctors[0]._id,
      hospitalId: hospitals[0]._id,
      date: new Date()
    }
  ]);
  
  // Create doctor schedules
  const doctorSchedules = [];
  
  // Get the current date
  const today = new Date();
  
  // Create schedules for the next 30 days
  for (let day = 0; day < 30; day++) {
    const date = new Date(today);
    date.setDate(date.getDate() + day);
    
    // Skip weekends for some doctors to create variety
    const dayOfWeek = date.getDay(); // 0 is Sunday, 6 is Saturday
    
    for (let i = 0; i < doctors.length; i++) {
      // Some doctors don't work on weekends
      if ((i % 2 === 0 && dayOfWeek === 0) || (i % 3 === 0 && dayOfWeek === 6)) {
        continue;
      }
      
      // Morning shift for all doctors
      if (day % 3 !== 0 || i % 2 === 0) {
        // Create time slots for morning schedule
        const morningTimeSlots = [
          {
            startTime: '08:00',
            endTime: '09:00',
            isBooked: false,
            roomId: rooms[i % rooms.length]._id
          },
          {
            startTime: '09:00',
            endTime: '10:00',
            isBooked: false,
            roomId: rooms[i % rooms.length]._id
          },
          {
            startTime: '10:00',
            endTime: '11:00',
            isBooked: false,
            roomId: rooms[i % rooms.length]._id
          },
          {
            startTime: '11:00',
            endTime: '12:00',
            isBooked: false,
            roomId: rooms[i % rooms.length]._id
          }
        ];
        
        const morningSchedule = await Schedule.create({
          name: 'Ca sáng',
          doctorId: doctors[i]._id,
          hospitalId: hospitals[0]._id,
          date: date,
          timeSlots: morningTimeSlots,
          isActive: true,
          notes: 'Lịch khám buổi sáng'
        });
        
        doctorSchedules.push(morningSchedule);
      }
      
      // Afternoon shift for some doctors
      if (day % 2 === 0 || i % 3 === 0) {
        // Create time slots for afternoon schedule
        const afternoonTimeSlots = [
          {
            startTime: '13:00',
            endTime: '14:00',
            isBooked: false,
            roomId: rooms[(i + 1) % rooms.length]._id
          },
          {
            startTime: '14:00',
            endTime: '15:00',
            isBooked: false,
            roomId: rooms[(i + 1) % rooms.length]._id
          },
          {
            startTime: '15:00',
            endTime: '16:00',
            isBooked: false,
            roomId: rooms[(i + 1) % rooms.length]._id
          },
          {
            startTime: '16:00',
            endTime: '17:00',
            isBooked: false,
            roomId: rooms[(i + 1) % rooms.length]._id
          }
        ];
        
        const afternoonSchedule = await Schedule.create({
          name: 'Ca chiều',
          doctorId: doctors[i]._id,
          hospitalId: hospitals[0]._id,
          date: date,
          timeSlots: afternoonTimeSlots,
          isActive: true,
          notes: 'Lịch khám buổi chiều'
        });
        
        doctorSchedules.push(afternoonSchedule);
      }
    }
  }
  
  console.log(`${scheduleTemplates.length} schedule templates created!`);
  console.log(`${doctorSchedules.length} doctor schedules created!`);
  return { scheduleTemplates, doctorSchedules };
};

// Create regular users
const createUsers = async () => {
  console.log('Creating regular users...');
  
  // Hash passwords before insertion
  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash('HospitalApp@123', salt);
  
  const users = await User.insertMany([
    {
      fullName: 'Nguyễn Văn Khách',
      email: 'user1@example.com',
      phoneNumber: '0912345678',
      passwordHash: hashedPassword,
      dateOfBirth: new Date('1990-06-15'),
      gender: 'male',
      address: 'Số 10, Đường Lê Lợi, Quận 1, TP.HCM',
      roleType: 'user',
      isVerified: true
    },
    {
      fullName: 'Trần Thị Bệnh',
      email: 'user2@example.com',
      phoneNumber: '0923456789',
      passwordHash: hashedPassword,
      dateOfBirth: new Date('1985-03-20'),
      gender: 'female',
      address: 'Số 25, Đường Nguyễn Huệ, Quận Ba Đình, Hà Nội',
      roleType: 'user',
      isVerified: true
    },
    {
      fullName: 'Lê Văn Người',
      email: 'user3@example.com',
      phoneNumber: '0934567890',
      passwordHash: hashedPassword,
      dateOfBirth: new Date('1995-11-10'),
      gender: 'male',
      address: 'Số 5, Đường Hoàng Diệu, Quận Hải Châu, Đà Nẵng',
      roleType: 'user',
      isVerified: true
    }
  ]);
  
  console.log(`${users.length} regular users created!`);
  return users;
};

// Create coupons
const createCoupons = async (admin) => {
  console.log('Creating coupons...');
  const today = new Date();
  
  const coupons = await Coupon.insertMany([
    {
      code: 'WELCOME2023',
      discountType: 'percentage',
      discountValue: 10,
      minPurchase: 300000,
      maxDiscount: 100000,
      startDate: today,
      endDate: new Date(today.getFullYear(), today.getMonth() + 3, today.getDate()),
      isActive: true,
      usageLimit: 1000,
      usedCount: 0,
      description: 'Giảm 10% cho lần đầu đặt khám',
      createdBy: admin._id
    },
    {
      code: 'HEALTH100K',
      discountType: 'fixed',
      discountValue: 100000,
      minPurchase: 500000,
      maxDiscount: 100000,
      startDate: today,
      endDate: new Date(today.getFullYear(), today.getMonth() + 1, today.getDate()),
      isActive: true,
      usageLimit: 500,
      usedCount: 0,
      description: 'Giảm 100,000đ cho đặt khám từ 500,000đ',
      createdBy: admin._id
    },
    {
      code: 'FAMILY20',
      discountType: 'percentage',
      discountValue: 20,
      minPurchase: 800000,
      maxDiscount: 200000,
      startDate: today,
      endDate: new Date(today.getFullYear(), today.getMonth() + 2, today.getDate()),
      isActive: true,
      usageLimit: 300,
      usedCount: 0,
      description: 'Giảm 20% cho đặt khám gia đình',
      createdBy: admin._id
    },
    {
      code: 'SUMMER2023',
      discountType: 'percentage',
      discountValue: 15,
      minPurchase: 400000,
      maxDiscount: 150000,
      startDate: today,
      endDate: new Date(today.getFullYear(), today.getMonth() + 2, today.getDate()),
      isActive: true,
      usageLimit: 500,
      usedCount: 0,
      description: 'Giảm 15% cho mùa hè 2023',
      createdBy: admin._id
    },
    {
      code: 'NEWPATIENT',
      discountType: 'fixed',
      discountValue: 150000,
      minPurchase: 600000,
      maxDiscount: 150000,
      startDate: today,
      endDate: new Date(today.getFullYear(), today.getMonth() + 3, today.getDate()),
      isActive: true,
      usageLimit: 300,
      usedCount: 0,
      description: 'Giảm 150,000đ cho bệnh nhân mới',
      createdBy: admin._id
    },
    {
      code: 'ELDERLY25',
      discountType: 'percentage',
      discountValue: 25,
      minPurchase: 500000,
      maxDiscount: 250000,
      startDate: today,
      endDate: new Date(today.getFullYear(), today.getMonth() + 6, today.getDate()),
      isActive: true,
      usageLimit: 200,
      usedCount: 0,
      description: 'Giảm 25% cho người cao tuổi (trên 60 tuổi)',
      createdBy: admin._id
    },
    {
      code: 'MONDAYSPECIAL',
      discountType: 'percentage',
      discountValue: 12,
      minPurchase: 400000,
      maxDiscount: 120000,
      startDate: today,
      endDate: new Date(today.getFullYear(), today.getMonth() + 1, today.getDate()),
      isActive: true,
      usageLimit: 400,
      usedCount: 0,
      description: 'Giảm 12% cho đặt khám vào thứ Hai',
      createdBy: admin._id
    }
  ]);
  
  console.log(`${coupons.length} coupons created!`);
  return coupons;
};

// Create appointments and payments
const createAppointments = async (users, doctors, doctorSchedules, services, coupons) => {
  console.log('Creating appointments and payments...');
  const appointments = [];
  const payments = [];
  const today = new Date();
  
  // Tạo lịch sử cuộc hẹn (đã hoàn thành)
  const pastStartDate = new Date(today);
  pastStartDate.setMonth(today.getMonth() - 2);
  
  // Lịch sử cuộc hẹn trong 2 tháng qua
  for (let i = 0; i < 20; i++) {
    const appointmentDate = new Date(pastStartDate);
    appointmentDate.setDate(pastStartDate.getDate() + Math.floor(Math.random() * 60)); // Trong vòng 60 ngày qua
    
    if (appointmentDate > today) continue; // Bỏ qua nếu ngày trong tương lai
    
    const userIndex = Math.floor(Math.random() * users.length);
    const doctorIndex = Math.floor(Math.random() * doctors.length);
    const doctor = doctors[doctorIndex];
    const user = users[userIndex];
    const serviceIndex = Math.floor(Math.random() * doctor.services.length);
    const service = await Service.findById(doctor.services[serviceIndex]);
    const randomSchedule = doctorSchedules[Math.floor(Math.random() * doctorSchedules.length)];
    
    // Select a random time slot from the schedule
    if (randomSchedule.timeSlots.length === 0) continue;
    
    const randomTimeSlotIndex = Math.floor(Math.random() * randomSchedule.timeSlots.length);
    const randomTimeSlot = randomSchedule.timeSlots[randomTimeSlotIndex];
    
    // Đôi khi sử dụng coupon
    const useCoupon = Math.random() > 0.7;
    const couponUsed = useCoupon ? coupons[Math.floor(Math.random() * coupons.length)] : null;
    
    // Tính giá và giảm giá
    const originalAmount = service.price;
    let discount = 0;
    
    if (useCoupon && couponUsed) {
      if (couponUsed.discountType === 'percentage') {
        discount = Math.min((originalAmount * couponUsed.discountValue) / 100, couponUsed.maxDiscount);
      } else {
        discount = couponUsed.discountValue;
      }
    }
    
    const finalAmount = originalAmount - discount;
    
    // Mark the time slot as booked
    randomTimeSlot.isBooked = true;
    await randomSchedule.save();
    
    // Tạo cuộc hẹn
    const appointment = await Appointment.create({
      patientId: user._id,
      doctorId: doctor._id,
      serviceId: service._id,
      specialtyId: doctor.specialtyId,
      scheduleId: randomSchedule._id,
      hospitalId: doctor.hospitalId,
      appointmentDate: appointmentDate,
      timeSlot: {
        startTime: randomTimeSlot.startTime,
        endTime: randomTimeSlot.endTime
      },
      appointmentType: ['first-visit', 'follow-up', 'consultation'][Math.floor(Math.random() * 3)],
      status: 'completed',
      notes: `Cuộc hẹn khám ${service.name}`,
      symptoms: ['Đau đầu', 'Chóng mặt', 'Mệt mỏi'][Math.floor(Math.random() * 3)],
      medicalHistory: 'Không có tiền sử bệnh đặc biệt',
      fee: {
        consultationFee: originalAmount,
        discount: discount,
        totalAmount: finalAmount
      },
      paymentStatus: 'completed',
      createdAt: new Date(appointmentDate.getTime() - 7 * 24 * 60 * 60 * 1000)
    });
    
    // Tạo thanh toán
    const payment = await Payment.create({
      appointmentId: appointment._id,
      userId: user._id,
      doctorId: doctor._id,
      serviceId: service._id,
      amount: finalAmount,
      originalAmount: originalAmount,
      couponId: useCoupon && couponUsed ? couponUsed._id : null,
      discount: discount,
      paymentMethod: ['cash', 'paypal'][Math.floor(Math.random() * 2)],
      paymentStatus: 'completed',
      transactionId: `TX${Date.now()}${Math.floor(Math.random() * 1000)}`,
      paymentDetails: {},
      notes: 'Thanh toán đã hoàn tất'
    });
    
    // Cập nhật thông tin thanh toán vào cuộc hẹn
    appointment.paymentId = payment._id;
    await appointment.save();
    
    // Tăng số lượng sử dụng coupon nếu có
    if (useCoupon && couponUsed) {
      await Coupon.findByIdAndUpdate(couponUsed._id, { $inc: { usedCount: 1 } });
    }
    
    appointments.push(appointment);
    payments.push(payment);
  }
  
  // Tạo các cuộc hẹn sắp tới
  const futureAppointments = [];
  for (let i = 0; i < 15; i++) {
    const futureDate = new Date(today);
    futureDate.setDate(today.getDate() + Math.floor(Math.random() * 14) + 1); // Trong 2 tuần tới
    
    const userIndex = Math.floor(Math.random() * users.length);
    const doctorIndex = Math.floor(Math.random() * doctors.length);
    const doctor = doctors[doctorIndex];
    const user = users[userIndex];
    const serviceIndex = Math.floor(Math.random() * doctor.services.length);
    const service = await Service.findById(doctor.services[serviceIndex]);
    
    // Tìm lịch bác sĩ cho ngày này
    const availableSchedules = doctorSchedules.filter(s => 
      s.doctorId.toString() === doctor._id.toString() && 
      new Date(s.date).toDateString() === futureDate.toDateString()
    );
    
    if (availableSchedules.length === 0) continue;
    
    const selectedSchedule = availableSchedules[Math.floor(Math.random() * availableSchedules.length)];
    
    // Find an available time slot
    const availableTimeSlots = selectedSchedule.timeSlots.filter(slot => !slot.isBooked);
    if (availableTimeSlots.length === 0) continue;
    
    const selectedTimeSlot = availableTimeSlots[Math.floor(Math.random() * availableTimeSlots.length)];
    
    // Đôi khi sử dụng coupon
    const useCoupon = Math.random() > 0.7;
    const couponUsed = useCoupon ? coupons[Math.floor(Math.random() * coupons.length)] : null;
    
    // Tính giá và giảm giá
    const originalAmount = service.price;
    let discount = 0;
    
    if (useCoupon && couponUsed) {
      if (couponUsed.discountType === 'percentage') {
        discount = Math.min((originalAmount * couponUsed.discountValue) / 100, couponUsed.maxDiscount);
      } else {
        discount = couponUsed.discountValue;
      }
    }
    
    const finalAmount = originalAmount - discount;
    
    // Mark the time slot as booked
    selectedTimeSlot.isBooked = true;
    await selectedSchedule.save();
    
    // Tạo cuộc hẹn
    const futureAppointment = await Appointment.create({
      patientId: user._id,
      doctorId: doctor._id,
      serviceId: service._id,
      specialtyId: doctor.specialtyId,
      scheduleId: selectedSchedule._id,
      hospitalId: doctor.hospitalId,
      appointmentDate: futureDate,
      timeSlot: {
        startTime: selectedTimeSlot.startTime,
        endTime: selectedTimeSlot.endTime
      },
      appointmentType: ['first-visit', 'follow-up', 'consultation'][Math.floor(Math.random() * 3)],
      status: Math.random() > 0.8 ? 'confirmed' : 'pending',
      notes: `Cuộc hẹn khám ${service.name}`,
      symptoms: ['Đau đầu', 'Chóng mặt', 'Mệt mỏi', 'Đau bụng', 'Sốt'][Math.floor(Math.random() * 5)],
      medicalHistory: 'Không có tiền sử bệnh đặc biệt',
      fee: {
        consultationFee: originalAmount,
        discount: discount,
        totalAmount: finalAmount
      },
      paymentStatus: 'completed',
      createdAt: new Date(today.getTime() - Math.floor(Math.random() * 3) * 24 * 60 * 60 * 1000)
    });
    
    // Tạo thanh toán (một số chưa thanh toán)
    if (Math.random() > 0.3) {
      const payment = await Payment.create({
        appointmentId: futureAppointment._id,
        userId: user._id,
        doctorId: doctor._id,
        serviceId: service._id,
        amount: finalAmount,
        originalAmount: originalAmount,
        couponId: useCoupon && couponUsed ? couponUsed._id : null,
        discount: discount,
        paymentMethod: ['cash', 'paypal'][Math.floor(Math.random() * 2)],
        paymentStatus: 'completed',
        transactionId: `TX${Date.now()}${Math.floor(Math.random() * 1000)}`,
        paymentDetails: {},
        notes: 'Thanh toán đã hoàn tất'
      });
      
      // Cập nhật thông tin thanh toán vào cuộc hẹn
      futureAppointment.paymentId = payment._id;
      futureAppointment.paymentStatus = 'completed';
      await futureAppointment.save();
      
      // Tăng số lượng sử dụng coupon nếu có
      if (useCoupon && couponUsed) {
        await Coupon.findByIdAndUpdate(couponUsed._id, { $inc: { usedCount: 1 } });
      }
    }
    
    // No longer need to increment bookedAppointments
    // as we directly marked the timeSlot as booked
    
    futureAppointments.push(futureAppointment);
  }
  
  console.log(`${appointments.length} past appointments created!`);
  console.log(`${payments.length} payments created!`);
  console.log(`${futureAppointments.length} future appointments created!`);
  
  return { 
    pastAppointments: appointments, 
    futureAppointments: futureAppointments, 
    payments 
  };
};

// Create medical records
const createMedicalRecords = async (pastAppointments, doctors) => {
  console.log('Creating medical records...');
  const medicalRecords = [];
  
  for (const appointment of pastAppointments) {
    // 80% các cuộc hẹn đã hoàn thành sẽ có bản ghi y tế
    if (Math.random() > 0.2) {
      const diagnoses = [
        'Cảm lạnh thông thường',
        'Viêm đường hô hấp trên',
        'Viêm phế quản',
        'Viêm xoang',
        'Đau nửa đầu',
        'Tăng huyết áp',
        'Rối loạn tiêu hoá',
        'Viêm dạ dày',
        'Dị ứng theo mùa',
        'Stress'
      ];
      
      const treatments = [
        'Nghỉ ngơi, uống nhiều nước, dùng thuốc giảm đau nếu cần',
        'Kê đơn thuốc kháng sinh trong 5 ngày',
        'Kê đơn thuốc giảm đau và viên uống ',
        'Thuốc kháng histamine, tránh tiếp xúc với chất gây dị ứng',
        'Thuốc hạ sốt và nghỉ ngơi nhiều',
        'Thuốc giảm đau đầu và giảm stress'
      ];
      
      const notes = [
        'Theo dõi và tái khám sau 3 ngày nếu triệu chứng không giảm',
        'Tái khám sau 7 ngày hoặc khi có dấu hiệu bất thường',
        'Điều chỉnh chế độ ăn uống, hạn chế thức ăn cay nóng',
        'Nghỉ ngơi đầy đủ và hạn chế hoạt động gắng sức',
        'Uống thuốc đều đặn theo đơn, không bỏ liều',
        'Cần đo huyết áp hàng ngày và ghi chép lại'
      ];
      
      const medicalRecord = await MedicalRecord.create({
        patientId: appointment.patientId,
        doctorId: appointment.doctorId,
        appointmentId: appointment._id,
        date: appointment.appointmentDate,
        diagnosis: diagnoses[Math.floor(Math.random() * diagnoses.length)],
        treatment: treatments[Math.floor(Math.random() * treatments.length)],
        medications: [
          {
            name: ['Paracetamol', 'Amoxicillin', 'Ibuprofen', 'Loratadine', 'Omeprazole'][Math.floor(Math.random() * 5)],
            dosage: ['500mg x 3 lần/ngày', '250mg x 2 lần/ngày', '400mg x 3 lần/ngày'][Math.floor(Math.random() * 3)],
            duration: ['5 ngày', '7 ngày', '10 ngày', '14 ngày'][Math.floor(Math.random() * 4)]
          },
          {
            name: ['Vitamin C', 'Vitamin B Complex', 'Probiotics', 'Calcium', 'Zinc'][Math.floor(Math.random() * 5)],
            dosage: ['1 viên/ngày', '2 viên/ngày'][Math.floor(Math.random() * 2)],
            duration: ['30 ngày', '60 ngày'][Math.floor(Math.random() * 2)]
          }
        ],
        notes: notes[Math.floor(Math.random() * notes.length)],
        attachments: [],
        followUpDate: new Date(appointment.appointmentDate.getTime() + 7 * 24 * 60 * 60 * 1000), // Tái khám sau 1 tuần
        createdBy: appointment.doctorId
      });
      
      medicalRecords.push(medicalRecord);
    }
  }
  
  console.log(`${medicalRecords.length} medical records created!`);
  return medicalRecords;
};

// Create reviews
const createReviews = async (pastAppointments, users, doctors) => {
  console.log('Creating reviews...');
  const reviews = [];
  
  // Chỉ khoảng 60% các cuộc hẹn đã hoàn thành sẽ có đánh giá
  for (const appointment of pastAppointments) {
    if (Math.random() > 0.4) {
      const rating = Math.floor(Math.random() * 3) + 3; // Đánh giá từ 3-5 sao
      const doctor = doctors.find(d => d._id.toString() === appointment.doctorId.toString());
      
      const positiveComments = [
        'Bác sĩ rất tận tình và chuyên nghiệp',
        'Phòng khám sạch sẽ, nhân viên thân thiện',
        'Bác sĩ giải thích rất rõ ràng về tình trạng bệnh',
        'Thời gian chờ đợi ngắn, dịch vụ tốt',
        'Bác sĩ chẩn đoán chính xác và đưa ra phương pháp điều trị hiệu quả',
        'Rất hài lòng với dịch vụ, sẽ quay lại lần sau',
        'Cảm ơn bác sĩ đã tư vấn tận tình'
      ];
      
      const mixedComments = [
        'Bác sĩ khám tốt nhưng thời gian chờ hơi lâu',
        'Chất lượng khám chữa tốt nhưng giá cao',
        'Bác sĩ tư vấn tốt nhưng nhân viên lễ tân chưa thân thiện lắm',
        'Kết quả điều trị tốt nhưng phải đợi khá lâu mới được gặp bác sĩ'
      ];
      
      let comment;
      if (rating >= 5) {
        comment = positiveComments[Math.floor(Math.random() * positiveComments.length)];
      } else {
        comment = mixedComments[Math.floor(Math.random() * mixedComments.length)];
      }
      
      const review = await Review.create({
        userId: appointment.patientId,
        doctorId: appointment.doctorId,
        appointmentId: appointment._id,
        hospitalId: appointment.hospitalId,
        rating: rating,
        comment: comment,
        date: new Date(appointment.appointmentDate.getTime() + Math.floor(Math.random() * 3) * 24 * 60 * 60 * 1000), // 0-3 ngày sau cuộc hẹn
        status: 'approved',
        response: rating < 5 && Math.random() > 0.5 ? {
          text: 'Cảm ơn bạn đã đánh giá. Chúng tôi sẽ cải thiện dịch vụ trong thời gian tới.',
          date: new Date(),
          responderId: doctor.user
        } : null
      });
      
      // Cập nhật đánh giá trung bình cho bác sĩ
      const allDoctorReviews = await Review.find({ doctorId: appointment.doctorId });
      const averageRating = allDoctorReviews.reduce((acc, curr) => acc + curr.rating, 0) / allDoctorReviews.length;
      
      await Doctor.findByIdAndUpdate(appointment.doctorId, {
        $set: {
          'ratings.average': averageRating,
          'ratings.count': allDoctorReviews.length,
          averageRating: averageRating
        },
        $addToSet: { reviews: review._id }
      });
      
      reviews.push(review);
    }
  }
  
  console.log(`${reviews.length} reviews created!`);
  return reviews;
};

// Create conversations and messages
const createConversations = async (users, doctors, appointments) => {
  console.log('Creating conversations and messages...');
  const conversations = [];
  const messages = [];
  
  // Tạo các cuộc hội thoại dựa trên cuộc hẹn
  for (let i = 0; i < 10; i++) {
    const randomAppointment = appointments[Math.floor(Math.random() * appointments.length)];
    const user = await User.findById(randomAppointment.patientId);
    const doctor = doctors.find(d => d._id.toString() === randomAppointment.doctorId.toString());
    const doctorUser = await User.findById(doctor.user);
    
    if (!user || !doctorUser) continue;
    
    // Tạo cuộc hội thoại
    const conversation = await Conversation.create({
      participants: [user._id, doctorUser._id],
      lastMessage: {
        content: 'Cảm ơn bác sĩ đã tư vấn!',
        senderId: user._id,
        timestamp: new Date(randomAppointment.appointmentDate)
      },
      unreadCount: {
        [user._id.toString()]: 0,
        [doctorUser._id.toString()]: 1
      },
      appointmentId: randomAppointment._id,
      isActive: true,
      lastActivity: new Date(randomAppointment.appointmentDate)
    });
    
    // Tạo các tin nhắn
    const messageCount = Math.floor(Math.random() * 10) + 3; // 3-12 tin nhắn
    const baseTime = new Date(conversation.createdAt);
    
    const patientMessages = [
      'Xin chào bác sĩ, tôi muốn hỏi về triệu chứng của mình',
      'Tôi bị đau đầu và chóng mặt mấy ngày nay',
      'Tôi có nên uống thuốc gì không?',
      'Tôi có thể đặt lịch khám vào ngày mai được không?',
      'Cảm ơn bác sĩ đã tư vấn!',
      'Tôi vẫn còn vài câu hỏi về đơn thuốc',
      'Sau khi uống thuốc tôi thấy đỡ hơn nhiều',
      'Tôi sẽ đến tái khám theo lịch'
    ];
    
    const doctorMessages = [
      'Xin chào, tôi có thể giúp gì cho bạn?',
      'Bạn có thể mô tả rõ hơn về triệu chứng không?',
      'Triệu chứng của bạn có thể liên quan đến stress hoặc mệt mỏi',
      'Tôi khuyên bạn nên đến khám trực tiếp để có chẩn đoán chính xác',
      'Bạn có thể đặt lịch vào ngày mai, phòng khám mở cửa từ 8h-17h',
      'Nhớ uống thuốc đúng liều lượng đã kê',
      'Nếu triệu chứng nặng hơn, hãy đến bệnh viện ngay',
      'Rất vui khi nghe bạn đã khỏe hơn!'
    ];
    
    for (let j = 0; j < messageCount; j++) {
      const isPatient = j % 2 === 0;
      const sender = isPatient ? user._id : doctorUser._id;
      const messageContent = isPatient 
        ? patientMessages[Math.floor(Math.random() * patientMessages.length)]
        : doctorMessages[Math.floor(Math.random() * doctorMessages.length)];
      
      // Thời gian tin nhắn tăng dần
      baseTime.setMinutes(baseTime.getMinutes() + Math.floor(Math.random() * 60) + 1);
      
      const message = await Message.create({
        conversationId: conversation._id,
        senderId: sender,
        receiverId: isPatient ? doctorUser._id : user._id,
        content: messageContent,
        messageType: 'text',
        readAt: isPatient ? null : new Date(baseTime)
      });
      
      messages.push(message);
      
      // Cập nhật tin nhắn cuối cùng nếu là tin nhắn cuối
      if (j === messageCount - 1) {
        await Conversation.findByIdAndUpdate(conversation._id, {
          lastMessage: {
            content: messageContent,
            senderId: sender,
            timestamp: message.timestamp
          }
        });
      }
    }
    
    conversations.push(conversation);
  }
  
  console.log(`${conversations.length} conversations created!`);
  console.log(`${messages.length} messages created!`);
  
  return { conversations, messages };
};

// Main function to seed database
const seedDatabase = async () => {
  try {
    console.log('Starting database seeding process...');
    
    // Ensure we have a valid connection before proceeding
    if (mongoose.connection.readyState !== 1) {
      console.log('Waiting for MongoDB connection...');
      await new Promise(resolve => {
        const checkConnection = () => {
          if (mongoose.connection.readyState === 1) {
            console.log('MongoDB connection established');
            resolve();
          } else {
            console.log(`Current connection state: ${mongoose.connection.readyState}. Waiting...`);
            setTimeout(checkConnection, 1000);
          }
        };
        checkConnection();
      });
    }

    // Now proceed with database operations
    await resetCollections();
    const admin = await createAdmin();
    const specialties = await createSpecialties();
    const hospitals = await createHospitals(specialties);
    const services = await createServices(specialties);
    const rooms = await createRooms(hospitals);
    const { doctors, doctorUsers } = await createDoctors(specialties, hospitals, services);
    const { scheduleTemplates, doctorSchedules } = await createSchedules(doctors, hospitals, rooms);
    const users = await createUsers();
    const coupons = await createCoupons(admin);
    const { pastAppointments, futureAppointments, payments } = await createAppointments(users, doctors, doctorSchedules, services, coupons);
    const medicalRecords = await createMedicalRecords(pastAppointments, doctors);
    const reviews = await createReviews(pastAppointments, users, doctors);
    const { conversations, messages } = await createConversations(users, doctors, [...pastAppointments, ...futureAppointments]);

    console.log('Database seeding completed successfully');
    console.log(`
Summary:
- Admin users created: 1
- Specialties created: ${specialties.length}
- Hospitals created: ${hospitals.length}
- Services created: ${services.length}
- Rooms created: ${rooms.length}
- Doctors created: ${doctors.length}
- Schedules created: ${scheduleTemplates.length}
- Regular users created: ${users.length}
- Coupons created: ${coupons.length}
- Past appointments created: ${pastAppointments.length}
- Medical records created: ${medicalRecords.length}
- Reviews created: ${reviews.length}
- Conversations created: ${conversations.length}
- Messages created: ${messages.length}
    `);

    return true;
  } catch (err) {
    console.error('Error seeding database:', err);
    return false;
  }
};

// Wait for connection and run seed process
const runSeedProcess = async () => {
  try {
    // Wait for the connection to be established
    if (mongoose.connection.readyState !== 1) {
      console.log('Waiting for MongoDB connection before starting seed process...');
      await new Promise((resolve, reject) => {
        // Set a timeout to avoid waiting indefinitely
        const timeout = setTimeout(() => {
          reject(new Error('MongoDB connection timeout after 3 minutes'));
        }, 180000);
        
        // Check connection state periodically
        const interval = setInterval(() => {
          if (mongoose.connection.readyState === 1) {
            clearTimeout(timeout);
            clearInterval(interval);
            resolve();
          }
        }, 1000);
        
        // Also listen for connection events
        mongoose.connection.once('connected', () => {
          clearTimeout(timeout);
          clearInterval(interval);
          resolve();
        });
        
        mongoose.connection.once('error', (err) => {
          clearTimeout(timeout);
          clearInterval(interval);
          reject(err);
        });
      });
    }
    
    console.log('MongoDB connection established, starting seed process...');
    
    // Run the seed database function
    const success = await seedDatabase();
    
    // Disconnect from MongoDB after seeding
    console.log('Disconnecting from MongoDB...');
    await mongoose.disconnect();
    console.log('MongoDB disconnected');
    
    // Exit with appropriate code
    process.exit(success ? 0 : 1);
  } catch (err) {
    console.error('Fatal error in seed process:', err);
    
    // Try to disconnect if connection was established
    try {
      if (mongoose.connection.readyState !== 0) {
        await mongoose.disconnect();
        console.log('MongoDB disconnected after error');
      }
    } catch (disconnectErr) {
      console.error('Error disconnecting from MongoDB:', disconnectErr);
    }
    
    process.exit(1);
  }
};

// Run the main process
runSeedProcess();
