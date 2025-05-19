const User = require('../models/User');
const Doctor = require('../models/Doctor');
const jwt = require('jsonwebtoken');
const { sendVerificationEmail } = require('../services/emailService');
const mongoose = require('mongoose');

// Generate JWT token for doctor
const generateDoctorToken = async (doctorId, userId) => {
  try {
    // JWT_SECRET được đảm bảo tồn tại vì đã kiểm tra trong server.js
    const token = jwt.sign({ 
      id: userId, 
      doctorId: doctorId,
      role: 'doctor' // Gán vai trò doctor
    }, process.env.JWT_SECRET, {
      expiresIn: '15m'
    });
    
    return token;
  } catch (error) {
    console.error('Error generating doctor token:', error);
    // Return a basic token in case of error
    return jwt.sign({ id: userId, doctorId: doctorId, role: 'doctor' }, process.env.JWT_SECRET, {
      expiresIn: '15m'
    });
  }
};

// Doctor login
exports.loginDoctor = async (req, res) => {
  try {
    const { email, password } = req.body;
    
    // Kiểm tra nếu không có email hoặc password
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng cung cấp đầy đủ email và mật khẩu'
      });
    }
    
    // Find user by email with role 'doctor'
    const user = await User.findOne({ email, roleType: 'doctor' });
    
    // Check if user exists
    if (!user) {
      return res.status(401).json({
        success: false,
        field: 'email',
        message: 'Tài khoản bác sĩ không tồn tại'
      });
    }
    
    // Check if account is locked
    if (user.isLocked) {
      const lockMessage = user.lockReason 
        ? `Tài khoản của bạn đã bị khóa. Lý do: ${user.lockReason}` 
        : 'Tài khoản của bạn đã bị khóa. Vui lòng liên hệ quản trị viên để được hỗ trợ.';
      
      return res.status(403).json({
        success: false,
        message: lockMessage
      });
    }
    
    // Check if email is verified
    if (!user.isVerified) {
      // Tạo token xác thực mới nếu token cũ đã hết hạn
      if (!user.verificationToken || !user.verificationTokenExpires || user.verificationTokenExpires < Date.now()) {
        const verificationToken = user.generateVerificationToken();
        await user.save();
        
        // Gửi lại email xác thực
        try {
          await sendVerificationEmail(user.email, verificationToken, user.fullName);
        } catch (emailError) {
          console.error('Lỗi gửi lại email xác thực:', emailError);
        }
      }
      
      return res.status(401).json({
        success: false,
        message: 'Tài khoản chưa được xác thực. Vui lòng kiểm tra email để xác thực tài khoản.',
        needVerification: true
      });
    }
    
    // Check if password is correct
    const isPasswordCorrect = await user.comparePassword(password);
    if (!isPasswordCorrect) {
      return res.status(401).json({
        success: false,
        field: 'password',
        message: 'Mật khẩu không chính xác'
      });
    }
    
    // Find doctor profile
    const doctor = await Doctor.findOne({ user: user._id });
    if (!doctor) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy thông tin bác sĩ'
      });
    }
    
    // Generate JWT token
    const token = await generateDoctorToken(doctor._id, user._id);
    
    // Return success response
    return res.status(200).json({
      success: true,
      data: {
        _id: user._id,
        doctorId: doctor._id,
        fullName: user.fullName,
        email: user.email,
        phoneNumber: user.phoneNumber,
        dateOfBirth: user.dateOfBirth,
        gender: user.gender,
        address: user.address,
        roleType: 'doctor',
        isVerified: user.isVerified,
        avatarUrl: user.avatarUrl,
        token
      },
      message: 'Đăng nhập thành công'
    });
    
  } catch (error) {
    console.error('Doctor login error:', error);
    return res.status(500).json({
      success: false,
      message: 'Lỗi đăng nhập',
      error: error.message
    });
  }
};

// Register doctor
exports.registerDoctor = async (req, res) => {
  try {
    const { 
      fullName, 
      email, 
      password, 
      phoneNumber, 
      dateOfBirth, 
      gender, 
      address,
      specialtyId,
      hospitalId,
      title,
      experience,
      consultationFee,
      description,
      education,
      certifications,
      languages
    } = req.body;
    
    // Check if doctor/user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        field: 'email',
        message: 'Email đã được sử dụng'
      });
    }
    
    // Start a session for transactions
    const session = await mongoose.startSession();
    session.startTransaction();
    
    try {
      // Create new user account
      const newUser = new User({
        fullName,
        email,
        passwordHash: password, // Sẽ được hash bởi middleware
        phoneNumber,
        dateOfBirth,
        gender,
        address,
        roleType: 'doctor',
        isVerified: false // Yêu cầu xác thực email
      });
      
      // Tạo token xác thực
      const verificationToken = newUser.generateVerificationToken();
      
      // Lưu tài khoản user
      await newUser.save({ session });
      
      // Create doctor profile
      const newDoctor = new Doctor({
        user: newUser._id,
        specialtyId,
        hospitalId,
        title,
        experience,
        consultationFee,
        description,
        education,
        certifications,
        languages
      });
      
      // Save doctor profile
      await newDoctor.save({ session });
      
      // Commit the transaction
      await session.commitTransaction();
      session.endSession();
      
      // Gửi email xác thực
      try {
        await sendVerificationEmail(email, verificationToken, fullName);
      } catch (emailError) {
        console.error('Lỗi gửi email xác thực:', emailError);
      }
      
      return res.status(201).json({
        success: true,
        message: 'Đăng ký tài khoản bác sĩ thành công. Vui lòng kiểm tra email để xác thực tài khoản.',
        data: {
          _id: newUser._id,
          doctorId: newDoctor._id,
          fullName: newUser.fullName,
          email: newUser.email
        }
      });
    } catch (error) {
      // Rollback transaction if error occurs
      await session.abortTransaction();
      session.endSession();
      throw error;
    }
    
  } catch (error) {
    console.error('Doctor registration error:', error);
    return res.status(500).json({
      success: false,
      message: 'Lỗi đăng ký tài khoản bác sĩ',
      error: error.message
    });
  }
};



// Verify doctor email
exports.verifyDoctorEmail = async (req, res) => {
  try {
    const { token } = req.body;
    
    if (!token) {
      return res.status(400).json({
        success: false,
        message: 'Token xác thực không được cung cấp'
      });
    }
    
    // Hash token để so sánh với token đã lưu trong database
    const crypto = require('crypto');
    const hashedToken = crypto
      .createHash('sha256')
      .update(token)
      .digest('hex');
    
    // Tìm bác sĩ với token xác thực
    const doctor = await Doctor.findOne({
      verificationToken: hashedToken,
      verificationTokenExpires: { $gt: Date.now() }
    });
    
    if (!doctor) {
      return res.status(400).json({
        success: false,
        message: 'Token xác thực không hợp lệ hoặc đã hết hạn'
      });
    }
    
    // Xác thực tài khoản bác sĩ
    doctor.isVerified = true;
    doctor.verificationToken = undefined;
    doctor.verificationTokenExpires = undefined;
    
    await doctor.save();
    
    // Generate token
    const doctorToken = await generateDoctorToken(doctor._id, doctor.user);
    
    return res.status(200).json({
      success: true,
      message: 'Xác thực email thành công',
      data: {
        _id: doctor._id,
        fullName: doctor.fullName,
        email: doctor.email,
        token: doctorToken
      }
    });
    
  } catch (error) {
    console.error('Verify doctor email error:', error);
    return res.status(500).json({
      success: false,
      message: 'Lỗi xác thực email',
      error: error.message
    });
  }
}; 