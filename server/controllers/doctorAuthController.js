const DoctorAccount = require('../models/DoctorAccount');
const jwt = require('jsonwebtoken');
const { sendVerificationEmail } = require('../services/emailService');

// Generate JWT token for doctor
const generateDoctorToken = async (doctorId) => {
  try {
    // JWT_SECRET được đảm bảo tồn tại vì đã kiểm tra trong server.js
    const token = jwt.sign({ 
      id: doctorId, 
      role: 'doctor' // Gán vai trò doctor
    }, process.env.JWT_SECRET, {
      expiresIn: '30d'
    });
    
    return token;
  } catch (error) {
    console.error('Error generating doctor token:', error);
    // Return a basic token in case of error
    return jwt.sign({ id: doctorId, role: 'doctor' }, process.env.JWT_SECRET, {
      expiresIn: '30d'
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
    
    // Find doctor by email
    const doctor = await DoctorAccount.findOne({ email });
    
    // Check if doctor exists
    if (!doctor) {
      return res.status(401).json({
        success: false,
        field: 'email',
        message: 'Tài khoản bác sĩ không tồn tại'
      });
    }
    
    // Check if email is verified
    if (!doctor.isVerified) {
      // Tạo token xác thực mới nếu token cũ đã hết hạn
      if (!doctor.verificationToken || !doctor.verificationTokenExpires || doctor.verificationTokenExpires < Date.now()) {
        const verificationToken = doctor.generateVerificationToken();
        await doctor.save();
        
        // Gửi lại email xác thực
        try {
          await sendVerificationEmail(doctor.email, verificationToken, doctor.fullName);
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
    const isPasswordCorrect = await doctor.comparePassword(password);
    if (!isPasswordCorrect) {
      return res.status(401).json({
        success: false,
        field: 'password',
        message: 'Mật khẩu không chính xác'
      });
    }
    
    // Generate JWT token
    const token = await generateDoctorToken(doctor._id);
    
    // Return success response
    return res.status(200).json({
      success: true,
      data: {
        _id: doctor._id,
        fullName: doctor.fullName,
        email: doctor.email,
        phoneNumber: doctor.phoneNumber,
        dateOfBirth: doctor.dateOfBirth,
        gender: doctor.gender,
        address: doctor.address,
        roleType: 'doctor',
        isVerified: doctor.isVerified,
        avatarUrl: doctor.avatarUrl,
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
    
    // Check if doctor already exists
    const existingDoctor = await DoctorAccount.findOne({ email });
    if (existingDoctor) {
      return res.status(400).json({
        success: false,
        field: 'email',
        message: 'Email đã được sử dụng'
      });
    }
    
    // Create new doctor
    const newDoctor = new DoctorAccount({
      fullName,
      email,
      passwordHash: password, // Sẽ được hash bởi middleware
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
      languages,
      isVerified: false // Yêu cầu xác thực email
    });
    
    // Tạo token xác thực
    const verificationToken = newDoctor.generateVerificationToken();
    
    // Lưu tài khoản bác sĩ
    await newDoctor.save();
    
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
        _id: newDoctor._id,
        fullName: newDoctor.fullName,
        email: newDoctor.email
      }
    });
    
  } catch (error) {
    console.error('Doctor registration error:', error);
    return res.status(500).json({
      success: false,
      message: 'Lỗi đăng ký tài khoản bác sĩ',
      error: error.message
    });
  }
};

// Get current doctor
exports.getCurrentDoctor = async (req, res) => {
  try {
    const doctor = await DoctorAccount.findById(req.user.id)
      .select('-passwordHash -verificationToken -verificationTokenExpires -resetPasswordToken -resetPasswordExpires -otpCode -otpExpires');
    
    if (!doctor) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy thông tin bác sĩ'
      });
    }
    
    return res.status(200).json({
      success: true,
      data: doctor
    });
  } catch (error) {
    console.error('Get current doctor error:', error);
    return res.status(500).json({
      success: false,
      message: 'Lỗi lấy thông tin bác sĩ',
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
    const doctor = await DoctorAccount.findOne({
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
    const doctorToken = await generateDoctorToken(doctor._id);
    
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