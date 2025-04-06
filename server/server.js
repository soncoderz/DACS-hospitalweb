const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');
const fs = require('fs');
const authRoutes = require('./routes/auth');
const jwt = require('jsonwebtoken');
const passport = require('./config/passport');

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

// Initialize email service
(async () => {
  try {
    await initializeEmailTransport(false); // false for Gmail, true for Ethereal
  } catch (error) {
    console.error('Failed to initialize email service:', error);
  }
})();

// Kiểm tra biến môi trường bắt buộc
if (!process.env.MONGODB_URI) {
  console.error('Cảnh báo: Biến môi trường MONGODB_URI không được định nghĩa!');
  process.exit(1);
}

if (!process.env.JWT_SECRET) {
  console.error('Cảnh báo: Biến môi trường JWT_SECRET không được định nghĩa!');
  process.exit(1);
}

const app = express();

// Đường dẫn đến thư mục uploads
const uploadDir = path.join(__dirname, 'uploads');
// Bỏ qua việc tạo thư mục uploads
// if (!fs.existsSync(uploadDir)) {
//   console.log('Creating uploads directory...');
//   fs.mkdirSync(uploadDir, { recursive: true });
// }

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());

// Phục vụ các file tĩnh từ thư mục uploads (nếu đã tồn tại)
app.use('/uploads', express.static(uploadDir));
// console.log('Serving static files from:', uploadDir);

// Default route for uploads folder access
app.get('/uploads/:filename', (req, res) => {
  const filePath = path.join(uploadDir, req.params.filename);
  // console.log('Requested file:', filePath);
  if (fs.existsSync(filePath)) {
    res.sendFile(filePath);
  } else {
    res.status(404).send('File not found');
  }
});

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI)
  .then(() => {
    console.log('MongoDB Connected');
  })
  .catch(err => {
    console.error('MongoDB Connection Error:', err);
    process.exit(1);
  });

// Routes
app.use('/api/auth', authRoutes);

// Hàm tạo JWT token
const generateToken = (userId) => {
  return jwt.sign({ id: userId }, process.env.JWT_SECRET, {
    expiresIn: '30d'
  });
};

// Default route
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
    // Nếu không có code, đây là request bình thường đến API
    res.send('Hospital API is running');
  }
});

// Port
const PORT = process.env.PORT || 5001;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
}); 