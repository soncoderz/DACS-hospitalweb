const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');
const fs = require('fs');
const session = require('express-session');
const passport = require('./config/passport');
const { connectDB, disconnectDB } = require('./config/database');
const jwt = require('jsonwebtoken');

// Import routes
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/user');
const roleRoutes = require('./routes/role');
const doctorRoutes = require('./routes/doctor');
const specialtyRoutes = require('./routes/specialty');
const serviceRoutes = require('./routes/service');
const hospitalRoutes = require('./routes/hospital');
const appointmentRoutes = require('./routes/appointmentRoutes');
const paymentRoutes = require('./routes/payment');
const statisticsRoutes = require('./routes/statistics');
const logRoutes = require('./routes/log');
const scheduleRoutes = require('./routes/schedule');
const { Logger } = require('./models/logger');

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

// Initialize email service
(async () => {
  try {
    await initializeEmailTransport(false); // false for Gmail, true for Ethereal
  } catch (error) {
    console.error('Failed to initialize email service:', error);
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
    const Role = require('./models/Role');

    // Kiểm tra nếu đã có tài khoản admin
    const adminExists = await User.findOne({ roleType: 'admin' });
    
    if (adminExists) {
      console.log('Admin account already exists:', adminExists.email);
      return;
    }

    console.log('No admin account found, creating one...');

    // Tìm hoặc tạo role admin
    let adminRole = await Role.findOne({ code: 'admin' });
    
    if (!adminRole) {
      console.log('Admin role not found, creating one...');
      adminRole = await Role.create({
        name: 'Admin',
        code: 'admin',
        description: 'Full system access'
      });
      console.log('Created admin role:', adminRole);
    } else {
      console.log('Found existing admin role:', adminRole);
    }

    // Tạo tài khoản admin mặc định
    const admin = await User.create({
      fullName: 'Administrator',
      email: 'admin@congson.com',
      phoneNumber: '0123456789',
      passwordHash: 'Password123', // Sẽ được hash trong model
      dateOfBirth: new Date('1990-01-01'),
      gender: 'other',
      address: 'Hospital Address',
      role: adminRole._id,
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

// Đường dẫn đến thư mục uploads
const uploadDir = path.join(__dirname, 'uploads');
// Tự động tạo thư mục uploads nếu chưa tồn tại
if (!fs.existsSync(uploadDir)) {
  console.log('Creating uploads directory...');
  fs.mkdirSync(uploadDir, { recursive: true });
}

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

// Phục vụ các file tĩnh từ thư mục uploads
app.use('/uploads', express.static(uploadDir));

// Default route for uploads folder access
app.get('/uploads/:filename', (req, res) => {
  const filePath = path.join(uploadDir, req.params.filename);
  if (fs.existsSync(filePath)) {
    res.sendFile(filePath);
  } else {
    res.status(404).send('File not found');
  }
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/roles', roleRoutes);
app.use('/api/doctors', doctorRoutes);
app.use('/api/schedules', scheduleRoutes);
app.use('/api/specialties', specialtyRoutes);
app.use('/api/services', serviceRoutes);
app.use('/api/hospitals', hospitalRoutes);
app.use('/api/appointments', appointmentRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/statistics', statisticsRoutes);
app.use('/api/logs', logRoutes);

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

// Khởi động server
const startServer = async () => {
  try {
    // Kết nối đến MongoDB và tạo admin khi kết nối thành công
    await connectDB(createAdminAccount);
    
    // Khởi tạo cron jobs sau khi kết nối thành công
    initCronJobs();
    
    // Khởi động server
    const PORT = process.env.PORT || 5000;
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
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