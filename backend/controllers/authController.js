const User = require('../models/User');
const jwt = require('jsonwebtoken');

// Generate JWT token
const generateToken = (userId) => {
  return jwt.sign({ id: userId }, process.env.JWT_SECRET || 'hospital_web_secret_key_2024', {
    expiresIn: '30d'
  });
};

// Register a new user
exports.register = async (req, res) => {
  try {
    const { firstName, lastName, email, phone, password } = req.body;

    // Check if user already exists
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ message: 'Email đã được sử dụng' });
    }

    // Create new user
    const user = await User.create({
      firstName,
      lastName,
      email,
      phone,
      password
    });

    // Generate token
    const token = generateToken(user._id);

    return res.status(201).json({
      _id: user._id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      phone: user.phone,
      role: user.role,
      token
    });

  } catch (error) {
    console.error('Registration error:', error);
    return res.status(500).json({ message: 'Đăng ký không thành công', error: error.message });
  }
};

// Login user
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    
    // Find user by email
    const user = await User.findOne({ email });
    
    // Check if user exists and password is correct
    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({ message: 'Email hoặc mật khẩu không chính xác' });
    }
    
    // Generate token
    const token = generateToken(user._id);
    
    return res.status(200).json({
      _id: user._id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      phone: user.phone,
      role: user.role,
      token
    });
    
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({ message: 'Đăng nhập không thành công', error: error.message });
  }
};

// Get current user profile
exports.getCurrentUser = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    if (!user) {
      return res.status(404).json({ message: 'Không tìm thấy người dùng' });
    }
    
    res.status(200).json(user);
  } catch (error) {
    console.error('Get user profile error:', error);
    res.status(500).json({ message: 'Lỗi khi lấy thông tin người dùng', error: error.message });
  }
}; 