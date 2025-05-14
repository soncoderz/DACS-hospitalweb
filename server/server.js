const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const dotenv = require('dotenv');
const cookieParser = require('cookie-parser');
const passport = require('passport');
const http = require('http'); // Add this for Socket.io
require('./config/passport'); // Import passport configuration
const { connectDB, disconnectDB } = require('./config/database');
const jwt = require('jsonwebtoken');
const session = require('express-session');
const { Logger } = require('./models/logger');

// Import routes
const userRoutes = require('./routes/user');
const doctorRoutes = require('./routes/doctor');
const specialtyRoutes = require('./routes/specialty');
const serviceRoutes = require('./routes/service');
const hospitalRoutes = require('./routes/hospital');
const appointmentRoutes = require('./routes/appointmentRoutes');
const paymentRoutes = require('./routes/paymentRoutes');
const statisticsRoutes = require('./routes/statistics');
const logRoutes = require('./routes/log');
const scheduleRoutes = require('./routes/schedule');
const adminRoutes = require('./routes/admin');
const notificationRoutes = require('./routes/notificationRoutes');

// Import các routes còn thiếu
const apiRoutes = require('./routes/api');
const couponRoutes = require('./routes/couponRoutes');
const reviewRoutes = require('./routes/reviewRoutes');
const chatRoutes = require('./routes/chatRoutes');
const doctorAuthRoutes = require('./routes/doctorAuth');
const medicalRecordRoutes = require('./routes/medicalRecordRoutes');
const medicationRoutes = require('./routes/medicationRoutes');

// Load environment variables
console.log('Loading environment variables from .env file');
const result = dotenv.config();
if (result.error) {
  console.error('Error loading .env file:', result.error);
} else {
  console.log('.env file loaded successfully');
  console.log('Environment variables:');
  console.log('- MONGODB_URI:', process.env.MONGODB_URI ? 'Set' : 'Not set');
  console.log('- EMAIL_USER:', process.env.EMAIL_USER);
  console.log('- EMAIL_PASSWORD:', process.env.EMAIL_PASSWORD ? 'Set' : 'Not set');
}

// Import email service after environment variables are loaded
const { initializeEmailTransport } = require('./services/emailService');

// Import cron jobs
const { initCronJobs } = require('./utils/cron');

// Initialize email service with more robust handling
(async () => {
  try {
    console.log('Initializing email service...');
    // false for Gmail, true for Ethereal
    await initializeEmailTransport(false);
    console.log('Email service initialized successfully');
  } catch (error) {
    console.error('Failed to initialize email service:', error);
    console.error('Email notifications will not be available');
  }
})();

// Kiểm tra biến môi trường bắt buộc
if (!process.env.JWT_SECRET) {
  console.error('Cảnh báo: Biến môi trường JWT_SECRET không được định nghĩa!');
  process.exit(1);
}

// Hàm tạo tài khoản admin khi khởi động
const createAdminAccount = async () => {
  try {
    const User = require('./models/User');

    // Kiểm tra nếu đã có tài khoản admin
    const adminExists = await User.findOne({ roleType: 'admin' });
    
    if (adminExists) {
      console.log('Admin account already exists:', adminExists.email);
      return;
    }

    console.log('No admin account found, creating one...');

    // Tạo tài khoản admin mặc định
    const admin = await User.create({
      fullName: 'Administrator',
      email: 'admin@congson.com',
      phoneNumber: '0123456789',
      passwordHash: 'Password123', // Sẽ được hash trong model
      dateOfBirth: new Date('1990-01-01'),
      gender: 'other',
      address: 'Hospital Address',
      roleType: 'admin',
      isVerified: true
    });

    console.log('Created admin account successfully:');
    console.log('- Email: admin@congson.com');
    console.log('- Password: Password123');
    console.log('- ID:', admin._id);
  } catch (error) {
    console.error('Error creating admin account:', error);
  }
};

const app = express();
const server = http.createServer(app); // Create HTTP server

// Initialize Socket.io
const { initializeSocket } = require('./config/socketConfig');
const io = initializeSocket(server);

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || ['http://localhost:3000', 'http://localhost'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());

// Session configuration for passport
app.use(session({
  secret: process.env.JWT_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: { 
    secure: process.env.NODE_ENV === 'production',
    maxAge: 24 * 60 * 60 * 1000 // 1 day
  }
}));

// Initialize Passport
app.use(passport.initialize());
app.use(passport.session());

// Create logger instance
const logger = new Logger();

// Request logger middleware
app.use(logger.createRequestLogger());

// Routes
app.use('/api/auth', userRoutes);
app.use('/api/doctors', doctorRoutes);
app.use('/api/schedules', scheduleRoutes);
app.use('/api/specialties', specialtyRoutes);
app.use('/api/services', serviceRoutes);
app.use('/api/hospitals', hospitalRoutes);
app.use('/api/appointments', appointmentRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/statistics', statisticsRoutes);
app.use('/api/logs', logRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/notifications', notificationRoutes);

// Đăng ký các routes còn thiếu
app.use('/api', apiRoutes);
app.use('/api/coupons', couponRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/doctor-auth', doctorAuthRoutes);
app.use('/api', medicalRecordRoutes);
app.use('/api/medications', medicationRoutes);

// Xử lý callback ở đường dẫn gốc (root URL)
app.get('/', (req, res) => {
  // Kiểm tra nếu có code OAuth từ Google hoặc Facebook
  if (req.query.code) {
    const code = req.query.code;
    const scope = req.query.scope || '';
    const state = req.query.state || '';
    const authuser = req.query.authuser || '';
    const prompt = req.query.prompt || '';
    
    console.log('Received OAuth callback at root URL with parameters:', { 
      code: code.substring(0, 10) + '...',  // Chỉ log một phần của code vì lý do bảo mật
      scope, 
      state, 
      authuser, 
      prompt 
    });
    
    // Tạo URL chuyển hướng với tất cả tham số
    let redirectUrl = `/api/auth/handle-root-callback?code=${encodeURIComponent(code)}&scope=${encodeURIComponent(scope)}`;
    
    if (state) redirectUrl += `&state=${encodeURIComponent(state)}`;
    if (authuser) redirectUrl += `&authuser=${encodeURIComponent(authuser)}`;
    if (prompt) redirectUrl += `&prompt=${encodeURIComponent(prompt)}`;
    
    // Chuyển hướng đến handler thích hợp
    return res.redirect(redirectUrl);
  } else {
    // Nếu không có code, chuyển hướng đến Facebook callback
    res.redirect('/api/auth/facebook-root-callback');
  }
});

// Error logger middleware
app.use(logger.createErrorLogger());

// Default error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.statusCode || 500).json({
    message: err.message || 'Internal Server Error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

const startServer = async () => {
  try {
    // Kết nối đến MongoDB và tạo admin khi kết nối thành công
    await connectDB(createAdminAccount);
    
    // Khởi tạo cron jobs sau khi kết nối thành công
    initCronJobs();
    
    // Khởi động server
    const PORT = process.env.PORT || 5000;
    server.listen(PORT, () => { // Use server instead of app
      console.log(`Server running on port ${PORT}`);
      console.log(`Socket.io initialized and running`);
    });
    
    // Xử lý tắt server
    process.on('SIGINT', async () => {
      console.log('SIGINT signal received: closing HTTP server and MongoDB connection');
      await disconnectDB();
      process.exit(0);
    });
    
    process.on('SIGTERM', async () => {
      console.log('SIGTERM signal received: closing HTTP server and MongoDB connection');
      await disconnectDB();
      process.exit(0);
    });
    
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

// Khởi động server
startServer(); 