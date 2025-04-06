const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const passport = require('./config/passport');
const session = require('express-session');
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
const { Logger } = require('./models/logger');

// Load environment variables
dotenv.config();

// Create Express app
const app = express();

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI)
  .then(() => {
    console.log('Connected to MongoDB');
    // Kiểm tra và tạo admin user nếu cần
    createAdminAccount();
  })
  .catch(err => console.error('Could not connect to MongoDB', err));

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

// Middleware
app.use(cors({
  origin: ['http://localhost:3000', 'http://localhost'],
  credentials: true
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

// Serve static files from uploads folder
app.use('/uploads', express.static('uploads'));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/roles', roleRoutes);

// Xử lý Facebook callback ở đường dẫn gốc
app.get('/', (req, res) => {
  // Chuyển hướng đến route xử lý Facebook callback
  res.redirect('/api/auth/facebook-root-callback');
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

// Start server
const port = process.env.PORT || 5000;
app.listen(port, () => console.log(`Server running on port ${port}`));