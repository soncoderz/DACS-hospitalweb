const User = require('../models/User');
const { upload } = require('../middlewares/uploadMiddleware');
const mongoose = require('mongoose');

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
      savedAs: req.file.filename,
      path: req.file.path,
      size: `${(req.file.size / 1024).toFixed(2)} KB`
    });
    
    // Tạo đường dẫn tương đối để lưu vào DB
    const relativePath = `/uploads/avatars/${req.file.filename}`;
    
    // Cập nhật đường dẫn ảnh đại diện trong DB
    const user = await User.findByIdAndUpdate(
      req.user.id,
      { 
        avatarUrl: relativePath,
        avatarData: null  // Xóa dữ liệu base64 cũ nếu có
      },
      { new: true }
    ).select('-passwordHash');
    
    if (!user) {
      return res.status(404).json({ 
        success: false, 
        message: 'Không tìm thấy người dùng' 
      });
    }
    
    console.log('Avatar updated successfully for user:', user.email);
    
    // Trả về toàn bộ thông tin user đã cập nhật
    return res.status(200).json({
      success: true,
      data: user,
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
      order = 'desc'
    } = req.query;
    
    // Xây dựng query
    const query = {};
    
    // Lọc theo vai trò
    if (role) {
      query.roleType = role;
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