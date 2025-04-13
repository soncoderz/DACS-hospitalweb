const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');
const fs = require('fs');
const authRoutes = require('./routes/auth');
const adminRoutes = require('./routes/adminRoutes');

// Load environment variables
console.log('Loading environment variables from .env file');
const result = dotenv.config();
if (result.error) {
  console.error('Error loading .env file:', result.error);
} else {
  console.log('.env file loaded successfully');
  console.log('Environment variables:');
  console.log('- MONGO_URI:', process.env.MONGO_URI ? 'Set' : 'Not set');
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
if (!process.env.MONGO_URI) {
  console.error('Cảnh báo: Biến môi trường MONGO_URI không được định nghĩa!');
  process.exit(1);
}

if (!process.env.JWT_SECRET) {
  console.error('Cảnh báo: Biến môi trường JWT_SECRET không được định nghĩa!');
  process.exit(1);
}

const app = express();

// Đảm bảo thư mục uploads tồn tại
const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) {
  console.log('Creating uploads directory...');
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Middleware
app.use(cors());
app.use(express.json());

// Phục vụ các file tĩnh từ thư mục uploads
app.use('/uploads', express.static(uploadDir));
console.log('Serving static files from:', uploadDir);

// Default route for uploads folder access
app.get('/uploads/:filename', (req, res) => {
  const filePath = path.join(uploadDir, req.params.filename);
  console.log('Requested file:', filePath);
  if (fs.existsSync(filePath)) {
    res.sendFile(filePath);
  } else {
    res.status(404).send('File not found');
  }
});

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('MongoDB Connected'))
  .catch(err => {
    console.error('MongoDB Connection Error:', err);
    process.exit(1);
  });

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/roles', require('./routes/roleRoutes'));
app.use('/api/permissions', require('./routes/permissionRoutes'));

// Default route
app.get('/', (req, res) => {
  res.send('Hospital API is running');
});

// Port
const PORT = process.env.PORT || 5001;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
}); 