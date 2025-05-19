const User = require('../models/User');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { sendOtpEmail, sendVerificationEmail } = require('../services/emailService');
const mongoose = require('mongoose');
const axios = require('axios');

// Generate JWT token
const generateToken = async (userId) => {
  try {
    // Tìm thông tin user
    const user = await User.findById(userId).select('roleType');
    
    if (!user) {
      throw new Error('User not found');
    }
    
    console.log('Generating token for user:', {
      userId,
      roleType: user.roleType
    });
    
    // JWT_SECRET được đảm bảo tồn tại vì đã kiểm tra trong server.js
    const token = jwt.sign({ 
      id: userId, 
      role: user.roleType, // Sử dụng roleType từ database thay vì 'user'
    }, process.env.JWT_SECRET, {
      expiresIn: '15m' // Changed from 30d to 15m - 15 minutes
    });
    
    // Test decode token để xác nhận thông tin
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log('Verified token contains:', decoded);
    
    return token;
  } catch (error) {
    console.error('Error generating token:', error);
    // Return a basic token in case of error
    return jwt.sign({ id: userId }, process.env.JWT_SECRET, {
      expiresIn: '15m' // Changed from 30d to 15m - 15 minutes
    });
  }
};

// Register a new user
exports.register = async (req, res) => {
  try {
    const { 
      fullName, 
      email, 
      phoneNumber, 
      password, 
      dateOfBirth, 
      gender, 
      address
    } = req.body;

    // Check if user already exists with the same email
    const emailExists = await User.findOne({ email });
    if (emailExists) {
      return res.status(400).json({ 
        success: false,
        field: 'email',
        message: 'Email đã được sử dụng bởi tài khoản khác' 
      });
    }

    // Check if user already exists with the same phone number (chỉ khi có số điện thoại)
    if (phoneNumber) {
      const phoneExists = await User.findOne({ phoneNumber });
      if (phoneExists) {
        return res.status(400).json({ 
          success: false,
          field: 'phoneNumber',
          message: 'Số điện thoại đã được sử dụng bởi tài khoản khác' 
        });
      }
    }

    // Create new user with isVerified = false
    const user = await User.create({
      fullName,
      email,
      phoneNumber,
      passwordHash: password, // Model sẽ tự hash password
      dateOfBirth,
      gender,
      address,
      roleType: 'user', // Always set roleType to 'user'
      isVerified: false // Tài khoản chưa được xác thực
    });

    // Tạo token xác thực
    const verificationToken = user.generateVerificationToken();
    await user.save();

    try {
      // Gửi email xác thực
      await sendVerificationEmail(email, verificationToken, fullName);
      
      return res.status(201).json({
        success: true,
        data: {
          _id: user._id,
          email: user.email,
        },
        message: 'Đăng ký tài khoản thành công. Vui lòng kiểm tra email để xác thực tài khoản.'
      });
    } catch (emailError) {
      console.error('Lỗi gửi email xác thực:', emailError);
      
      // Vẫn tạo tài khoản nhưng thông báo lỗi gửi email
      return res.status(201).json({
        success: true,
        data: {
          _id: user._id,
          email: user.email,
        },
        warning: true,
        message: 'Đăng ký tài khoản thành công nhưng không thể gửi email xác thực. Vui lòng liên hệ với quản trị viên.'
      });
    }

  } catch (error) {
    console.error('Registration error:', error);
    
    // Xử lý lỗi validation từ Mongoose
    if (error.name === 'ValidationError') {
      const validationErrors = {};
      
      for (let field in error.errors) {
        validationErrors[field] = error.errors[field].message;
      }
      
      return res.status(400).json({
        success: false,
        errors: validationErrors,
        message: 'Thông tin đăng ký không hợp lệ'
      });
    }
    
    return res.status(500).json({ 
      success: false,
      message: 'Đăng ký không thành công. Vui lòng thử lại sau.', 
      error: error.message 
    });
  }
};

// Login user
exports.login = async (req, res) => {
  try {
    const { email, password, role } = req.body;
    
    // Kiểm tra nếu không có email hoặc password
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng cung cấp đầy đủ email và mật khẩu'
      });
    }
    
    // Xác định model cần sử dụng dựa vào role (nếu có)
    let user;
    let userModel;
    
    if (role === 'doctor') {
      // Sử dụng model DoctorAccount nếu role là doctor
      const DoctorAccount = require('../models/DoctorAccount');
      userModel = DoctorAccount;
    } else {
      // Mặc định sử dụng model User cho user và admin
      userModel = User;
    }
    
    // Tìm user theo email
    user = await userModel.findOne({ email });
    
    // Kiểm tra nếu user không tồn tại
    if (!user) {
      return res.status(401).json({
        success: false,
        field: 'email',
        message: 'Tài khoản không tồn tại'
      });
    }
    
    // Kiểm tra nếu tài khoản bị khóa
    if (user.isLocked) {
      const lockMessage = user.lockReason 
        ? `Tài khoản của bạn đã bị khóa. Lý do: ${user.lockReason}` 
        : 'Tài khoản của bạn đã bị khóa. Vui lòng liên hệ quản trị viên để được hỗ trợ.';
      
      return res.status(403).json({
        success: false,
        message: lockMessage
      });
    }
    
    // Kiểm tra xem email đã được xác thực chưa
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
    
    // Kiểm tra mật khẩu
    const isPasswordCorrect = await user.comparePassword(password);
    if (!isPasswordCorrect) {
      return res.status(401).json({
        success: false,
        field: 'password',
        message: 'Mật khẩu không chính xác'
      });
    }
    
    // Tạo JWT token dựa vào role
    let token;
    let userRole;
    
    if (role === 'doctor') {
      // Token cho bác sĩ
      token = jwt.sign({ 
        id: user._id, 
        role: 'doctor' 
      }, process.env.JWT_SECRET, {
        expiresIn: '15m'
      });
      userRole = 'doctor';
      
      console.log('Generating token for user:', {
        userId: user._id,
        roleType: 'doctor'
      });
    } else {
      // Token cho user thông thường hoặc admin
      userRole = user.roleType || 'user';
      token = jwt.sign({ 
        id: user._id, 
        role: userRole 
      }, process.env.JWT_SECRET, {
        expiresIn: '15m'
      });
      
      console.log('Generating token for user:', {
        userId: user._id,
        roleType: userRole
      });
    }
    
    // Verify JWT token sau khi tạo
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      console.log('Verified token contains:', decoded);
    } catch (jwtError) {
      console.error('Error verifying token:', jwtError);
    }
    
    // Log user đăng nhập
    console.log('User logging in:', {
      id: user._id,
      email: user.email,
      avatarUrl: user.avatarUrl || 'No avatar'
    });
    
    // Trả về thông tin user và token
    return res.status(200).json({
      success: true,
      data: {
        _id: user._id,
        fullName: user.fullName,
        email: user.email,
        phoneNumber: user.phoneNumber,
        dateOfBirth: user.dateOfBirth,
        gender: user.gender,
        address: user.address,
        roleType: userRole,
        isVerified: user.isVerified,
        avatarUrl: user.avatarUrl || null,
        token
      },
      message: 'Đăng nhập thành công'
    });
    
  } catch (error) {
    console.error('User login error:', error);
    return res.status(500).json({ 
      success: false,
      message: 'Lỗi đăng nhập',
      error: error.message 
    });
  }
};

// Upload avatar
exports.uploadAvatar = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ 
        success: false, 
        message: 'Vui lòng tải lên một tệp ảnh' 
      });
    }
    
    // Log the file information for debugging
    console.log('Avatar upload request received:', {
      filename: req.file.originalname,
      mimetype: req.file.mimetype,
      size: `${(req.file.size / 1024).toFixed(2)} KB`
    });
    
    // Sử dụng Cloudinary để tải ảnh lên
    const { uploadImage, deleteImage } = require('../config/cloudinary');
    
    // Lấy user hiện tại để kiểm tra và xóa ảnh cũ nếu cần
    const user = await User.findById(req.user.id);
    
    // Xóa ảnh cũ trên Cloudinary nếu có
    if (user.avatar && user.avatar.publicId) {
      await deleteImage(user.avatar.publicId);
    }
    
    // Tạo buffer từ dữ liệu file trong memory
    const buffer = req.file.buffer;
    
    // Tạo base64 string từ buffer để tải lên Cloudinary
    const base64String = `data:${req.file.mimetype};base64,${buffer.toString('base64')}`;
    
    // Tải ảnh mới lên Cloudinary sử dụng base64
    const cloudinaryResult = await uploadImage(base64String, `avatars/${req.user.id}`);
    
    // Cập nhật thông tin avatar trong DB
    const updatedUser = await User.findByIdAndUpdate(
      req.user.id,
      { 
        avatar: cloudinaryResult,
        avatarUrl: cloudinaryResult.secureUrl, // Giữ lại cả avatarUrl để tương thích với code cũ
        avatarData: null  // Xóa dữ liệu base64 cũ nếu có
      },
      { new: true }
    ).select('-passwordHash');
    
    if (!updatedUser) {
      return res.status(404).json({ 
        success: false, 
        message: 'Không tìm thấy người dùng' 
      });
    }
    
    console.log('Avatar updated successfully for user:', updatedUser.email);
    
    // Trả về toàn bộ thông tin user đã cập nhật
    res.status(200).json({
      success: true,
      data: {
        _id: updatedUser._id,
        fullName: updatedUser.fullName,
        email: updatedUser.email,
        phoneNumber: updatedUser.phoneNumber,
        dateOfBirth: updatedUser.dateOfBirth,
        gender: updatedUser.gender,
        address: updatedUser.address,
        avatarUrl: updatedUser.avatarUrl,
        avatar: updatedUser.avatar,
        roleType: updatedUser.roleType
      },
      message: 'Tải lên ảnh đại diện thành công'
    });
    
  } catch (error) {
    console.error('Avatar upload error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Lỗi khi tải lên ảnh đại diện', 
      error: error.message 
    });
  }
};

// Forgot password - send OTP
exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng cung cấp địa chỉ email'
      });
    }

    // Thêm log để kiểm tra
    console.log('Forgot password request for email:', email);

    // Check if user exists with select specific fields to avoid issues with role
    const user = await User.findOne({ email }).select('email otpCode otpExpires');
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy tài khoản với địa chỉ email này'
      });
    }

    // Check for existing OTP and log its expiration (for debugging)
    if (user.otpCode && user.otpExpires) {
      const remainingTime = user.otpExpires - Date.now();
      console.log(`Existing OTP found. Expires in: ${Math.max(0, Math.floor(remainingTime / 1000))} seconds`);
      // We'll override it anyway
    }

    // Generate OTP
    const otp = user.generateOTP();
    await user.save();
    
    // Log OTP for development/debugging
    console.log('Generated OTP:', otp);

    try {
      // Send OTP email
      await sendOtpEmail(email, otp);
      
      res.status(200).json({
        success: true,
        message: 'Mã OTP đã được gửi đến email của bạn',
        email: email
      });
    } catch (emailError) {
      console.error('Error sending email:', emailError);
      
      // Vẫn lưu OTP nhưng thông báo người dùng về lỗi gửi email
      res.status(500).json({
        success: false,
        message: 'Không thể gửi email. Vui lòng liên hệ với quản trị viên.',
        error: emailError.message
      });
    }

  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi xử lý yêu cầu đặt lại mật khẩu',
      error: error.message
    });
  }
};

// Verify OTP
exports.verifyOtp = async (req, res) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng cung cấp email và mã OTP'
      });
    }

    // Find user by email and select only needed fields
    const user = await User.findOne({ email }).select('email otpCode otpExpires passwordHash');
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy tài khoản với địa chỉ email này'
      });
    }

    // Check if OTP exists and is valid
    if (!user.otpCode || !user.otpExpires) {
      return res.status(400).json({
        success: false,
        message: 'OTP không tồn tại hoặc đã hết hạn, vui lòng yêu cầu mã mới',
        expired: true
      });
    }

    // Check if OTP is expired
    if (Date.now() > user.otpExpires) {
      return res.status(400).json({
        success: false,
        message: 'Mã OTP đã hết hạn, vui lòng yêu cầu mã mới',
        expired: true
      });
    }

    // Verify JWT token and extract OTP
    try {
      const decodedToken = jwt.verify(user.otpCode, process.env.JWT_SECRET || 'fallback-secret-key');
      
      // Check if the provided OTP matches the one in the token
      if (decodedToken.otp !== otp) {
        return res.status(400).json({
          success: false,
          message: 'Mã OTP không chính xác'
        });
      }
      
      // Check if the user ID in token matches the current user
      if (decodedToken.userId !== user._id.toString()) {
        return res.status(400).json({
          success: false,
          message: 'Token không hợp lệ'
        });
      }
    } catch (jwtError) {
      console.error('JWT verification error:', jwtError);
      return res.status(400).json({
        success: false,
        message: 'Mã OTP không hợp lệ hoặc đã hết hạn',
        expired: true
      });
    }

    // Clear OTP after successful verification
    user.otpCode = undefined;
    user.otpExpires = undefined;

    // Generate a reset token that will be used to validate the reset password request
    const resetToken = user.generatePasswordResetToken();
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Xác thực OTP thành công',
      resetToken: resetToken
    });

  } catch (error) {
    console.error('Verify OTP error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi xác thực mã OTP',
      error: error.message
    });
  }
};

// Reset password after OTP verification
exports.resetPassword = async (req, res) => {
  try {
    const { resetToken, password } = req.body;

    if (!resetToken || !password) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng cung cấp đầy đủ thông tin'
      });
    }

    // Validate password length
    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        field: 'password',
        message: 'Mật khẩu phải có ít nhất 6 ký tự'
      });
    }

    // Find user by hashed reset token
    const hashedToken = crypto
      .createHash('sha256')
      .update(resetToken)
      .digest('hex');

    // Select only necessary fields to avoid role casting issue
    const user = await User.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpires: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'Token không hợp lệ hoặc đã hết hạn'
      });
    }

    // Check if new password is the same as current password
    try {
      const isSamePassword = await user.comparePassword(password);
      if (isSamePassword) {
        return res.status(400).json({
          success: false,
          field: 'password',
          message: 'Mật khẩu mới không được trùng với mật khẩu cũ của bạn'
        });
      }
    } catch (err) {
      console.error('Error comparing passwords:', err);
      // Continue with password reset even if comparison fails
    }

    // Set new password
    user.passwordHash = password;
    
    // Clear reset token fields
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;

    // Save user
    await user.save();

    // Generate a new auth token
    const token = await generateToken(user._id);

    res.status(200).json({
      success: true,
      message: 'Mật khẩu đã được đặt lại thành công',
      token,
      data: {
        _id: user._id,
        fullName: user.fullName,
        email: user.email,
        phoneNumber: user.phoneNumber,
        dateOfBirth: user.dateOfBirth,
        gender: user.gender,
        address: user.address,
        avatarUrl: user.avatarUrl,
        avatarData: user.avatarData,
        roleType: user.roleType
      }
    });

  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi đặt lại mật khẩu',
      error: error.message
    });
  }
};

// Verify email
exports.verifyEmail = async (req, res) => {
  try {
    const { token } = req.body;
    
    if (!token) {
      return res.status(400).json({
        success: false,
        message: 'Token xác thực không được cung cấp'
      });
    }
    
    console.log('Verifying token:', token);
    
    // Hash token để so sánh với token đã lưu trong database
    const hashedToken = crypto
      .createHash('sha256')
      .update(token)
      .digest('hex');
      
    console.log('Hashed token:', hashedToken);
    
    // Tìm user với token xác thực
    const user = await User.findOne({
      verificationToken: hashedToken
    });
    
    if (!user) {
      console.log('User not found with token');
      return res.status(400).json({
        success: false,
        message: 'Token xác thực không hợp lệ'
      });
    }
    
    console.log('Found user:', user.email);
    
    // Kiểm tra thời hạn của token
    if (user.verificationTokenExpires && user.verificationTokenExpires < Date.now()) {
      console.log('Token expired');
      return res.status(400).json({
        success: false,
        message: 'Token xác thực đã hết hạn. Vui lòng yêu cầu gửi lại email xác thực',
        expired: true
      });
    }
    
    // Xác thực tài khoản
    user.isVerified = true;
    user.verificationToken = undefined;
    user.verificationTokenExpires = undefined;
    
    await user.save();
    console.log('User verified successfully');
    
    // Generate token cho user đã xác thực
    const authToken = await generateToken(user._id);
    
    console.log('Sending success response');
    return res.status(200).json({
      success: true,
      message: 'Xác thực email thành công',
      token: authToken,
      user: {
        _id: user._id,
        fullName: user.fullName,
        email: user.email,
        isVerified: user.isVerified,
        roleType: user.roleType
      }
    });
    
  } catch (error) {
    console.error('Email verification error:', error);
    return res.status(500).json({
      success: false,
      message: 'Lỗi xác thực email',
      error: error.message
    });
  }
};

// Resend verification email
exports.resendVerification = async (req, res) => {
  try {
    const { email } = req.body;
    
    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Email là bắt buộc'
      });
    }
    
    // Find user by email
    const user = await User.findOne({ email });
    
    // Check if user exists
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy tài khoản với email này'
      });
    }
    
    // Check if already verified
    if (user.isVerified) {
      return res.status(400).json({
        success: false,
        message: 'Tài khoản này đã được xác thực'
      });
    }
    
    // Generate new verification token
    const verificationToken = user.generateVerificationToken();
    await user.save();
    
    // Send verification email
    try {
      await sendVerificationEmail(email, verificationToken, user.fullName);
      
      return res.status(200).json({
        success: true,
        message: 'Email xác thực đã được gửi lại thành công'
      });
    } catch (emailError) {
      console.error('Lỗi gửi lại email xác thực:', emailError);
      
      return res.status(500).json({
        success: false,
        message: 'Không thể gửi email xác thực. Vui lòng thử lại sau.'
      });
    }
    
  } catch (error) {
    console.error('Resend verification error:', error);
    return res.status(500).json({
      success: false,
      message: 'Đã xảy ra lỗi khi gửi lại email xác thực'
    });
  }
};

// Change password
exports.changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng cung cấp đầy đủ thông tin'
      });
    }

    // Validate new password
    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        field: 'newPassword',
        message: 'Mật khẩu mới phải có ít nhất 6 ký tự'
      });
    }

    // Find user
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy người dùng'
      });
    }

    // Check if current password is correct
    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      return res.status(400).json({
        success: false,
        field: 'currentPassword',
        message: 'Mật khẩu hiện tại không chính xác'
      });
    }

    // Check if new password is the same as current password
    const isSamePassword = await user.comparePassword(newPassword);
    if (isSamePassword) {
      return res.status(400).json({
        success: false,
        field: 'newPassword',
        message: 'Mật khẩu mới không được trùng với mật khẩu hiện tại'
      });
    }

    // Update password
    user.passwordHash = newPassword;
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Thay đổi mật khẩu thành công'
    });

  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi thay đổi mật khẩu',
      error: error.message
    });
  }
};

// Social login success handler
exports.socialLoginSuccess = async (req, res) => {
  try {
    // Generate token for the authenticated user
    const token = await generateToken(req.user._id);
    
    // Get the frontend URL from environment variables
    const frontendURL = process.env.FRONTEND_URL || 'http://localhost:3000';
    
    // Determine if user is new and needs password
    const isNewUser = req.user.createdAt && 
                      new Date().getTime() - new Date(req.user.createdAt).getTime() < 60000; // < 1 minute
    
    // User needs password if they don't have passwordHash and are using social auth
    const needPassword = !req.user.passwordHash && 
                        (req.user.googleId || req.user.facebookId);
    
    // Log user data for debugging
    console.log('Social login user data:', {
      id: req.user._id,
      email: req.user.email,
      avatarUrl: req.user.avatarUrl,
      authProvider: req.user.authProvider,
      isNewUser: isNewUser,
      needPassword: needPassword,
      hasPasswordHash: !!req.user.passwordHash
    });
    
    // Return token as URL parameter for client-side handling
    // Redirect to the frontend with the token and user data
    const userData = {
      _id: req.user._id,
      fullName: req.user.fullName,
      email: req.user.email,
      phoneNumber: req.user.phoneNumber,
      roleType: req.user.roleType,
      avatarUrl: req.user.avatarUrl,
      avatarData: req.user.avatarData,
      googleId: req.user.googleId, // Add googleId to help identify account type
      facebookId: req.user.facebookId, // Add facebookId to help identify account type
      isNewUser: isNewUser,
      needPassword: needPassword,
      token
    };
    
    // Log the successful authentication
    console.log(`Social login successful for user: ${req.user.email} with provider: ${req.user.authProvider}`);
    
    // Encode the data for URL transmission
    const userDataParam = encodeURIComponent(JSON.stringify(userData));
    
    // Redirect to the frontend with the token
    return res.redirect(`${frontendURL}/auth/social-callback?data=${userDataParam}`);
  } catch (error) {
    console.error('Social login success error:', error);
    const frontendURL = process.env.FRONTEND_URL || 'http://localhost:3000';
    res.redirect(`${frontendURL}/login?error=social-login-failed`);
  }
};

// Social login failure handler
exports.socialLoginFailure = (req, res) => {
  res.status(401).json({
    success: false,
    message: 'Đăng nhập mạng xã hội không thành công',
  });
};

// Google token verification
exports.googleTokenVerification = async (req, res) => {
  try {
    const { token } = req.body;
    if (!token) {
      return res.status(400).json({
        success: false,
        message: 'Token không được cung cấp'
      });
    }

    // Verify token with Google's API
    const response = await axios.get(`https://www.googleapis.com/oauth2/v3/tokeninfo?id_token=${token}`);
    const userData = response.data;

    if (!userData.email_verified) {
      return res.status(400).json({
        success: false,
        message: 'Email Google chưa được xác thực'
      });
    }

    // Check if user exists with this Google ID or email
    let user = await User.findOne({ googleId: userData.sub });
    let isNewUser = false;
    
    if (!user) {
      // Check if user exists with this email
      user = await User.findOne({ email: userData.email });
      
      if (user) {
        // Link Google account to existing user
        user.googleId = userData.sub;
        user.authProvider = 'google';
        user.isVerified = true;
        if (!user.avatarUrl && userData.picture) {
          user.avatarUrl = userData.picture;
        }
        await user.save();
      } else {
        // Create new user
        isNewUser = true;
        user = await User.create({
          googleId: userData.sub,
          email: userData.email,
          fullName: userData.name || 'Google User',
          authProvider: 'google',
          isVerified: true,
          roleType: 'user',
          phoneNumber: '0000000000', // Placeholder
          dateOfBirth: new Date('1990-01-01'), // Placeholder
          gender: 'other', // Placeholder
          avatarUrl: userData.picture
        });
      }
    }

    // Determine if user needs to set a password
    const needPassword = !user.passwordHash && user.authProvider === 'google';

    // Generate JWT token
    const jwtToken = await generateToken(user._id);

    // Return user data with token
    return res.status(200).json({
      success: true,
      data: {
        _id: user._id,
        fullName: user.fullName,
        email: user.email,
        phoneNumber: user.phoneNumber,
        dateOfBirth: user.dateOfBirth,
        gender: user.gender,
        address: user.address,
        roleType: user.roleType,
        avatarUrl: user.avatarUrl,
        avatarData: user.avatarData,
        isNewUser: isNewUser,
        needPassword: needPassword,
        token: jwtToken
      }
    });
  } catch (error) {
    console.error('Google token verification error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi xác thực token Google',
      error: error.message
    });
  }
};

// Facebook token verification
exports.facebookTokenVerification = async (req, res) => {
  try {
    const { accessToken, userID } = req.body;
    
    if (!accessToken || !userID) {
      return res.status(400).json({ 
        success: false, 
        message: 'Missing access token or user ID' 
      });
    }
    
    // Verify token with Facebook Graph API
    const response = await axios.get(`https://graph.facebook.com/v19.0/me`, {
      params: {
        access_token: accessToken,
        fields: 'id,name,email,picture'
      }
    });
    
    // Response from Facebook API
    const userData = response.data;
    
    if (userData.id !== userID) {
      return res.status(400).json({
        success: false,
        message: 'User ID mismatch'
      });
    }
    
    // Find or create user
    const User = require('../models/User');
    let user = await User.findOne({ facebookId: userData.id });
    let isNewUser = false;
    
    if (!user) {
      // Check if user exists with this email
      user = await User.findOne({ email: userData.email });
      
      if (user) {
        // Link Facebook account to existing user
        user.facebookId = userData.id;
        user.authProvider = 'facebook';
        user.isVerified = true;
        if (!user.avatarUrl && userData.picture && userData.picture.data && userData.picture.data.url) {
          user.avatarUrl = userData.picture.data.url;
        }
        await user.save();
      } else {
        // Create new user
        isNewUser = true;
        user = await User.create({
          facebookId: userData.id,
          email: userData.email,
          fullName: userData.name || 'Facebook User',
          authProvider: 'facebook',
          isVerified: true,
          roleType: 'user',
          phoneNumber: '0000000000', // Placeholder
          dateOfBirth: new Date('1990-01-01'), // Placeholder
          gender: 'other', // Placeholder
          avatarUrl: userData.picture && userData.picture.data ? userData.picture.data.url : null
        });
      }
    }

    // Determine if user needs to set a password
    const needPassword = !user.passwordHash && user.authProvider === 'facebook';

    // Generate JWT token
    const jwtToken = await generateToken(user._id);

    // Return user data with token
    return res.status(200).json({
      success: true,
      data: {
        _id: user._id,
        fullName: user.fullName,
        email: user.email,
        phoneNumber: user.phoneNumber,
        dateOfBirth: user.dateOfBirth,
        gender: user.gender,
        address: user.address,
        roleType: user.roleType,
        avatarUrl: user.avatarUrl,
        avatarData: user.avatarData,
        isNewUser: isNewUser,
        needPassword: needPassword,
        token: jwtToken
      }
    });
  } catch (error) {
    console.error('Facebook token verification error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi xác thực token Facebook',
      error: error.message
    });
  }
};

// Set password for social login users
exports.setSocialPassword = async (req, res) => {
  try {
    const { password } = req.body;
    const userId = req.user.id;

    if (!password) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng cung cấp mật khẩu',
        field: 'password'
      });
    }

    // Validate password length
    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Mật khẩu phải có ít nhất 6 ký tự',
        field: 'password'
      });
    }

    // Find user
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy người dùng'
      });
    }

    // Check if user already has a password
    if (user.passwordHash && !user.googleId && !user.facebookId) {
      return res.status(400).json({
        success: false,
        message: 'Người dùng đã có mật khẩu, vui lòng sử dụng chức năng thay đổi mật khẩu'
      });
    }

    // Set the password
    user.passwordHash = password;
    await user.save();

    return res.status(200).json({
      success: true,
      message: 'Đặt mật khẩu thành công'
    });
  } catch (error) {
    console.error('Set social password error:', error);
    return res.status(500).json({
      success: false,
      message: 'Lỗi khi đặt mật khẩu',
      error: error.message
    });
  }
};

// Refresh token function
exports.refreshToken = async (req, res) => {
  try {
    // Sử dụng ID người dùng từ request (đã được middleware protect xác thực)
    const userId = req.user._id;
    
    // Tạo token mới
    const token = await generateToken(userId);
    
    // Trả về token mới
    return res.status(200).json({
      success: true,
      data: {
        token,
        user: {
          _id: req.user._id,
          fullName: req.user.fullName,
          email: req.user.email,
          phoneNumber: req.user.phoneNumber,
          roleType: req.user.roleType,
          avatarUrl: req.user.avatarUrl
        }
      },
      message: 'Token đã được làm mới thành công'
    });
  } catch (error) {
    console.error('Refresh token error:', error);
    return res.status(500).json({
      success: false,
      message: 'Lỗi khi làm mới token',
      error: error.message
    });
  }
}; 