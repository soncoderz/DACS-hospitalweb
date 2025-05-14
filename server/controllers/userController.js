const User = require('../models/User');
const { upload } = require('../middlewares/uploadMiddleware');
const mongoose = require('mongoose');
const asyncHandler = require('express-async-handler');

// GET /api/user/profile – Lấy thông tin cá nhân
exports.getUserProfile = async (req, res) => {
  try {
    // Lấy thông tin người dùng hiện tại, bỏ qua mật khẩu
    const user = await User.findById(req.user.id).select('-passwordHash');
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy người dùng'
      });
    }
    
    return res.status(200).json({
      success: true,
      data: user
    });
  } catch (error) {
    console.error('Get user profile error:', error);
    return res.status(500).json({
      success: false,
      message: 'Lỗi khi lấy thông tin người dùng',
      error: error.message
    });
  }
};

// PUT /api/user/profile – Cập nhật thông tin cá nhân
exports.updateUserProfile = async (req, res) => {
  try {
    const { fullName, phoneNumber, dateOfBirth, gender, address } = req.body;
    
    // Không cho phép thay đổi email vì email là định danh tài khoản
    if (req.body.email) {
      delete req.body.email;
    }
    
    // Không cho phép thay đổi vai trò
    if (req.body.roleType) {
      delete req.body.roleType;
    }
    
    // Kiểm tra số điện thoại mới có trùng không
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
      { fullName, phoneNumber, dateOfBirth, gender, address },
      { new: true, runValidators: true }
    ).select('-passwordHash');
    
    if (!updatedUser) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy người dùng'
      });
    }
    
    return res.status(200).json({
      success: true,
      data: updatedUser,
      message: 'Cập nhật thông tin thành công'
    });
  } catch (error) {
    console.error('Update user profile error:', error);
    
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
    
    return res.status(500).json({
      success: false,
      message: 'Lỗi khi cập nhật thông tin người dùng',
      error: error.message
    });
  }
};

// POST /api/user/avatar – Upload ảnh đại diện người dùng
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
    
    // Log Cloudinary environment variables for debugging
    console.log('Cloudinary Config Check:', {
      cloudName: process.env.CLOUDINARY_CLOUD_NAME || 'NOT SET',
      apiKey: process.env.CLOUDINARY_API_KEY ? 'SET' : 'NOT SET',
      apiSecret: process.env.CLOUDINARY_API_SECRET ? 'SET' : 'NOT SET'
    });
    
    // Lấy user hiện tại để kiểm tra và xóa ảnh cũ nếu cần
    const user = await User.findById(req.user.id);
    console.log('User found for avatar update:', user._id);
    
    // Xóa ảnh cũ trên Cloudinary nếu có
    if (user.avatar && user.avatar.publicId) {
      console.log('Deleting old avatar with publicId:', user.avatar.publicId);
      await deleteImage(user.avatar.publicId);
    }
    
    // Tạo buffer từ dữ liệu file trong memory
    const buffer = req.file.buffer;
    
    // Tạo base64 string từ buffer để tải lên Cloudinary
    const base64String = `data:${req.file.mimetype};base64,${buffer.toString('base64')}`;
    
    console.log('Uploading to Cloudinary using base64 data');
    
    // Tải ảnh mới lên Cloudinary sử dụng base64
    const cloudinaryResult = await uploadImage(base64String, `avatars/${req.user.id}`);
    console.log('Cloudinary upload successful:', cloudinaryResult);
    
    // Cập nhật thông tin avatar trong DB
    const updatedUser = await User.findByIdAndUpdate(
      req.user.id,
      { 
        avatar: cloudinaryResult,
        avatarUrl: cloudinaryResult.secureUrl, // Cập nhật đường dẫn với URL từ Cloudinary
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
    return res.status(200).json({
      success: true,
      data: updatedUser,
      message: 'Tải lên ảnh đại diện thành công'
    });
  } catch (error) {
    console.error('Upload avatar error:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Lỗi khi tải lên ảnh đại diện', 
      error: error.message 
    });
  }
};

// GET /api/users - Lấy danh sách người dùng (chỉ admin)
exports.getAllUsers = async (req, res) => {
  try {
    // Kiểm tra quyền admin
    if (req.user.roleType !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Không có quyền truy cập danh sách người dùng'
      });
    }
    
    const { 
      role, 
      verified, 
      search, 
      page = 1, 
      limit = 10,
      sort = 'createdAt',
      order = 'desc',
      roleType,
      isLocked
    } = req.query;
    
    // Xây dựng query
    const query = {};
    
    // Lọc theo vai trò - ưu tiên tham số roleType nếu có
    if (roleType) {
      if (roleType.includes(',')) {
        // Nếu roleType là danh sách các vai trò (vd: 'user,admin')
        query.roleType = { $in: roleType.split(',') };
      } else {
        query.roleType = roleType;
      }
    } else if (role) {
      // Sử dụng tham số role nếu không có roleType
      query.roleType = role;
    }
    
    // Lọc theo trạng thái
    if (isLocked === 'true' || isLocked === true) {
      query.isLocked = true;
    } else if (isLocked === 'false' || isLocked === false) {
      query.isLocked = false;
    }
    
    // Lọc theo trạng thái xác thực
    if (verified === 'true') {
      query.isVerified = true;
    } else if (verified === 'false') {
      query.isVerified = false;
    }
    
    // Tìm kiếm theo tên hoặc email
    if (search) {
      query.$or = [
        { fullName: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { phoneNumber: { $regex: search, $options: 'i' } }
      ];
    }
    
    console.log('Query tìm kiếm người dùng:', query);
    
    // Tính pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    // Xác định field sort và thứ tự
    const sortOptions = {};
    sortOptions[sort] = order === 'asc' ? 1 : -1;
    
    // Thực hiện query
    const users = await User.find(query)
      .select('-passwordHash -verificationToken -verificationTokenExpires -resetPasswordToken -resetPasswordExpires -otpCode -otpExpires')
      .sort(sortOptions)
      .skip(skip)
      .limit(parseInt(limit));
    
    // Đếm tổng số người dùng thỏa mãn điều kiện
    const total = await User.countDocuments(query);
    
    return res.status(200).json({
      success: true,
      count: users.length,
      total,
      totalPages: Math.ceil(total / parseInt(limit)),
      currentPage: parseInt(page),
      data: users
    });
  } catch (error) {
    console.error('Get all users error:', error);
    return res.status(500).json({
      success: false,
      message: 'Lỗi khi lấy danh sách người dùng',
      error: error.message
    });
  }
};

/**
 * @desc    Get user by ID
 * @route   GET /api/users/:id
 * @access  Private (Admin or Own User)
 */
exports.getUserById = async (req, res) => {
  try {
    const userId = req.params.id;

    // Validate userId is a valid MongoDB ID
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({
        success: false,
        message: 'ID người dùng không hợp lệ'
      });
    }

    // Find user by ID (exclude password)
    const user = await User.findById(userId).select('-passwordHash');

    // Check if user exists
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy người dùng'
      });
    }

    // Check if user is admin or the user themselves
    if (req.user.roleType !== 'admin' && req.user.id !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Không có quyền truy cập thông tin người dùng này'
      });
    }

    res.status(200).json({
      success: true,
      data: user
    });
  } catch (error) {
    console.error('Get user by ID error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi lấy thông tin người dùng',
      error: error.message
    });
  }
};

/**
 * @desc    Update user status (activate/deactivate)
 * @route   PUT /api/users/:id/status
 * @access  Private (Admin only)
 */
exports.updateUserStatus = async (req, res) => {
  try {
    const userId = req.params.id;
    const { isActive } = req.body;

    // Validate userId is a valid MongoDB ID
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({
        success: false,
        message: 'ID người dùng không hợp lệ'
      });
    }

    // Validate isActive is a boolean
    if (typeof isActive !== 'boolean') {
      return res.status(400).json({
        success: false,
        message: 'Trạng thái phải là true hoặc false'
      });
    }

    // Find user by ID
    const user = await User.findById(userId);

    // Check if user exists
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy người dùng'
      });
    }

    // Prevent deactivation of admin accounts by non-superadmins
    if (user.roleType === 'admin' && req.user.roleType !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Không thể thay đổi trạng thái tài khoản admin'
      });
    }

    // Update user status
    user.isActive = isActive;
    await user.save();

    res.status(200).json({
      success: true,
      message: `Tài khoản người dùng đã được ${isActive ? 'kích hoạt' : 'vô hiệu hóa'} thành công`,
      data: {
        id: user._id,
        email: user.email,
        isActive: user.isActive
      }
    });
  } catch (error) {
    console.error('Update user status error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi cập nhật trạng thái người dùng',
      error: error.message
    });
  }
};

/**
 * @desc    Delete user
 * @route   DELETE /api/users/:id
 * @access  Private (Admin only)
 */
exports.deleteUser = async (req, res) => {
  try {
    const userId = req.params.id;

    // Validate userId is a valid MongoDB ID
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({
        success: false,
        message: 'ID người dùng không hợp lệ'
      });
    }

    // Find user by ID
    const user = await User.findById(userId);

    // Check if user exists
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy người dùng'
      });
    }

    // Prevent deletion of admin accounts
    if (user.roleType === 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Không thể xóa tài khoản admin'
      });
    }

    // If user is a doctor, handle doctor records
    if (user.roleType === 'doctor') {
      const Doctor = require('../models/Doctor');
      const doctor = await Doctor.findOne({ user: userId });
      
      if (doctor) {
        // Check for existing appointments before deleting
        const Appointment = require('../models/Appointment');
        const appointments = await Appointment.find({ 
          doctorId: doctor._id,
          status: { $in: ['scheduled', 'confirmed'] }
        });

        if (appointments.length > 0) {
          return res.status(400).json({
            success: false,
            message: 'Không thể xóa bác sĩ có lịch hẹn đang chờ xử lý'
          });
        }

        // Delete doctor record
        await Doctor.findByIdAndDelete(doctor._id);
      }
    }

    // Delete user
    await User.findByIdAndDelete(userId);

    res.status(200).json({
      success: true,
      message: 'Xóa người dùng thành công'
    });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi xóa người dùng',
      error: error.message
    });
  }
};

/**
 * @desc    Lock user account
 * @route   PUT /api/admin/users/:id/lock
 * @access  Private (Admin)
 */
exports.lockUserAccount = async (req, res) => {
  try {
    const { id } = req.params;
    const { lockReason } = req.body;
    
    // Yêu cầu bắt buộc phải nhập lý do
    if (!lockReason || lockReason.trim() === '') {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng nhập lý do khóa tài khoản'
      });
    }
    
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'ID người dùng không hợp lệ'
      });
    }
    
    // Check if user exists
    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy người dùng'
      });
    }
    
    // Prevent locking admin accounts
    if (user.roleType === 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Không thể khóa tài khoản quản trị viên'
      });
    }
    
    // Update user to locked status
    user.isLocked = true;
    user.lockReason = lockReason;
    await user.save();
    
    return res.status(200).json({
      success: true,
      message: 'Đã khóa tài khoản người dùng thành công'
    });
  } catch (error) {
    console.error('Lock user account error:', error);
    return res.status(500).json({
      success: false,
      message: 'Lỗi khi khóa tài khoản người dùng',
      error: error.message
    });
  }
};

/**
 * @desc    Unlock user account
 * @route   PUT /api/admin/users/:id/unlock
 * @access  Private (Admin)
 */
exports.unlockUserAccount = async (req, res) => {
  try {
    const { id } = req.params;
    
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'ID người dùng không hợp lệ'
      });
    }
    
    // Check if user exists
    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy người dùng'
      });
    }
    
    // Update user to unlocked status
    user.isLocked = false;
    user.lockReason = undefined; // Clear the lock reason
    await user.save();
    
    return res.status(200).json({
      success: true,
      message: 'Đã mở khóa tài khoản người dùng thành công'
    });
  } catch (error) {
    console.error('Unlock user account error:', error);
    return res.status(500).json({
      success: false,
      message: 'Lỗi khi mở khóa tài khoản người dùng',
      error: error.message
    });
  }
};

/**
 * @desc    Get user avatar
 * @route   GET /api/users/:id/avatar
 * @access  Private (User or Admin)
 */
exports.getUserAvatar = async (req, res) => {
  try {
    const userId = req.params.id;

    // Validate userId is a valid MongoDB ID
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({
        success: false,
        message: 'ID người dùng không hợp lệ'
      });
    }
    
    // Permission check: Only allow if the requester is retrieving their own avatar or is an admin
    if (req.user.id !== userId && req.user.roleType !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Không có quyền truy cập thông tin avatar của người dùng này'
      });
    }

    // Find user and select only avatar fields
    const user = await User.findById(userId).select('avatar avatarUrl');

    // Check if user exists
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy người dùng'
      });
    }

    res.status(200).json({
      success: true,
      data: {
        avatarUrl: user.avatarUrl,
        avatar: user.avatar
      }
    });
  } catch (error) {
    console.error('Get user avatar error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi lấy thông tin avatar người dùng',
      error: error.message
    });
  }
}; 