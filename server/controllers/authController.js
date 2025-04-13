const User = require('../models/User');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { sendOtpEmail, sendVerificationEmail } = require('../services/emailService');
const mongoose = require('mongoose');

// Generate JWT token
const generateToken = (userId) => {
  // JWT_SECRET được đảm bảo tồn tại vì đã kiểm tra trong server.js
  return jwt.sign({ id: userId }, process.env.JWT_SECRET, {
    expiresIn: '30d'
  });
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
      address,
      roleType // Allow roleType to be optionally specified in request
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

    // Check if user already exists with the same phone number
    const phoneExists = await User.findOne({ phoneNumber });
    if (phoneExists) {
      return res.status(400).json({ 
        success: false,
        field: 'phoneNumber',
        message: 'Số điện thoại đã được sử dụng bởi tài khoản khác' 
      });
    }

    // Find user role dynamically
    const Role = require('../models/Role');
    const userRoleType = roleType || 'user';
    let userRole;
    
    try {
      // Try to find the role by code
      userRole = await Role.findOne({ code: userRoleType });
      
      // If role doesn't exist, find any role or create a default one
      if (!userRole) {
        userRole = await Role.findOne() || 
                  await Role.create({ 
                    name: 'User', 
                    code: 'user', 
                    description: 'Regular user with limited access' 
                  });
      }
    } catch (roleError) {
      console.error('Error finding role:', roleError);
      // Create a fallback object with just an _id
      userRole = { _id: new mongoose.Types.ObjectId() };
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
      role: userRole._id, // Use found role ID
      roleType: userRoleType, // Use provided roleType or default to 'user'
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
    const { email, password } = req.body;
    
    // Kiểm tra nếu không có email hoặc password
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng cung cấp đầy đủ email và mật khẩu'
      });
    }
    
    // Find user by email
    const user = await User.findOne({ email });
    
    // Check if user exists
    if (!user) {
      return res.status(401).json({
        success: false,
        field: 'email',
        message: 'Tài khoản không tồn tại'
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
    
    // Generate token
    const token = generateToken(user._id);
    
    console.log("User logging in:", {
      id: user._id,
      email: user.email,
      avatarUrl: user.avatarUrl || "No avatar"
    });
    
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
        avatarUrl: user.avatarUrl,
        role: user.role,
        roleType: user.roleType,
        token
      },
      message: 'Đăng nhập thành công'
    });
    
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({ 
      success: false,
      message: 'Đăng nhập không thành công. Vui lòng thử lại sau.', 
      error: error.message 
    });
  }
};

// Get current user profile
exports.getCurrentUser = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-passwordHash').populate('role');
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy người dùng'
      });
    }
    
    res.status(200).json({
      success: true,
      data: {
        ...user.toObject(),
        roleType: user.roleType
      },
      message: 'Lấy thông tin người dùng thành công'
    });
  } catch (error) {
    console.error('Get user profile error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Lỗi khi lấy thông tin người dùng', 
      error: error.message 
    });
  }
};

// Update user profile
exports.updateProfile = async (req, res) => {
  try {
    const { fullName, phoneNumber, dateOfBirth, gender, address, avatarUrl } = req.body;
    
    // Không cho phép thay đổi email vì email là định danh tài khoản
    if (req.body.email) {
      delete req.body.email;
    }
    
    // Nếu có số điện thoại mới, kiểm tra xem đã tồn tại chưa
    if (phoneNumber) {
      const phoneExists = await User.findOne({ 
        phoneNumber, 
        _id: { $ne: req.user.id } // Loại trừ user hiện tại
      });
      
      if (phoneExists) {
        return res.status(400).json({
          success: false,
          field: 'phoneNumber',
          message: 'Số điện thoại đã được sử dụng bởi tài khoản khác'
        });
      }
    }
    
    // Cập nhật thông tin người dùng
    const updatedUser = await User.findByIdAndUpdate(
      req.user.id,
      { fullName, phoneNumber, dateOfBirth, gender, address, avatarUrl },
      { new: true, runValidators: true }
    ).select('-passwordHash');
    
    if (!updatedUser) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy người dùng'
      });
    }
    
    res.status(200).json({
      success: true,
      data: updatedUser,
      message: 'Cập nhật thông tin thành công'
    });
    
  } catch (error) {
    console.error('Update profile error:', error);
    
    // Xử lý lỗi validation từ Mongoose
    if (error.name === 'ValidationError') {
      const validationErrors = {};
      
      for (let field in error.errors) {
        validationErrors[field] = error.errors[field].message;
      }
      
      return res.status(400).json({
        success: false,
        errors: validationErrors,
        message: 'Thông tin cập nhật không hợp lệ'
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Lỗi khi cập nhật thông tin người dùng',
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
    
    // Lấy file path từ multer
    const avatarUrl = `/uploads/${req.file.filename}`;
    
    // Cập nhật URL ảnh đại diện trong DB
    const user = await User.findByIdAndUpdate(
      req.user.id,
      { avatarUrl },
      { new: true }
    ).select('-passwordHash');
    
    if (!user) {
      return res.status(404).json({ 
        success: false, 
        message: 'Không tìm thấy người dùng' 
      });
    }
    
    // Trả về toàn bộ thông tin user đã cập nhật (không chỉ avatarUrl)
    res.status(200).json({
      success: true,
      data: user,
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

    // Check if OTP is correct
    if (user.otpCode !== otp) {
      return res.status(400).json({
        success: false,
        message: 'Mã OTP không chính xác'
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
    }).select('email resetPasswordToken resetPasswordExpires passwordHash');

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
    const token = generateToken(user._id);

    res.status(200).json({
      success: true,
      message: 'Mật khẩu đã được đặt lại thành công',
      token
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
        message: 'Token xác thực không hợp lệ hoặc đã hết hạn'
      });
    }
    
    // Hash token
    const hashedToken = crypto
      .createHash('sha256')
      .update(token)
      .digest('hex');
      
    // Tìm user với token xác thực
    const user = await User.findOne({
      verificationToken: hashedToken,
      verificationTokenExpires: { $gt: Date.now() }
    });
    
    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'Token xác thực không hợp lệ hoặc đã hết hạn'
      });
    }
    
    // Xác thực tài khoản
    user.isVerified = true;
    user.verificationToken = undefined;
    user.verificationTokenExpires = undefined;
    
    await user.save();
    
    // Generate token cho user đã xác thực
    const authToken = generateToken(user._id);
    
    res.status(200).json({
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
    res.status(500).json({
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