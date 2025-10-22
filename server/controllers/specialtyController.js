const Specialty = require('../models/Specialty');
const mongoose = require('mongoose');

/**
 * @desc    Create new specialty
 * @route   POST /api/admin/specialties
 * @access  Private (Admin)
 */
exports.createSpecialty = async (req, res) => {
  try {
    const { name, description, icon, isActive } = req.body;

    // Validate name
    if (!name) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng cung cấp tên chuyên khoa'
      });
    }

    // Kiểm tra độ dài tên chuyên khoa
    if (name.length < 2 || name.length > 50) {
      return res.status(400).json({
        success: false,
        message: 'Tên chuyên khoa phải có độ dài từ 2 đến 50 ký tự'
      });
    }

    // Kiểm tra định dạng tên chuyên khoa (không chứa ký tự đặc biệt)
    const specialChars = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]+/;
    if (specialChars.test(name)) {
      return res.status(400).json({
        success: false,
        message: 'Tên chuyên khoa không được chứa ký tự đặc biệt'
      });
    }

    // Check if specialty already exists
    const existingSpecialty = await Specialty.findOne({ name });
    if (existingSpecialty) {
      return res.status(400).json({
        success: false,
        message: 'Chuyên khoa này đã tồn tại'
      });
    }

    // Kiểm tra độ dài mô tả nếu có
    if (description && description.length > 1000) {
      return res.status(400).json({
        success: false,
        message: 'Mô tả chuyên khoa không được quá 500 ký tự'
      });
    }

    // Kiểm tra định dạng icon (nếu có)
    if (icon && icon.length > 50) {
      return res.status(400).json({
        success: false,
        message: 'Tên icon không được quá 50 ký tự'
      });
    }

    // Create new specialty
    const specialty = await Specialty.create({
      name,
      description: description || '',
      icon: icon || 'default-specialty-icon',
      isActive: isActive !== undefined ? isActive : true
    });

    return res.status(201).json({
      success: true,
      data: specialty,
      message: 'Tạo chuyên khoa mới thành công'
    });
  } catch (error) {
    console.error('Create specialty error:', error);
    return res.status(500).json({
      success: false,
      message: 'Lỗi khi tạo chuyên khoa mới',
      error: error.message
    });
  }
};

/**
 * @desc    Update specialty
 * @route   PUT /api/admin/specialties/:id
 * @access  Private (Admin)
 */
exports.updateSpecialty = async (req, res) => {
  try {
    const { id } = req.params;
    
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'ID chuyên khoa không hợp lệ'
      });
    }

    const specialty = await Specialty.findById(id);
    
    if (!specialty) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy chuyên khoa'
      });
    }

    // Update specialty fields
    const updatedSpecialty = await Specialty.findByIdAndUpdate(
      id,
      { $set: req.body },
      { new: true, runValidators: true }
    );

    return res.status(200).json({
      success: true,
      data: updatedSpecialty,
      message: 'Cập nhật chuyên khoa thành công'
    });
  } catch (error) {
    console.error('Update specialty error:', error);
    return res.status(500).json({
      success: false,
      message: 'Lỗi khi cập nhật chuyên khoa',
      error: error.message
    });
  }
};

/**
 * @desc    Delete specialty
 * @route   DELETE /api/admin/specialties/:id
 * @access  Private (Admin)
 */
exports.deleteSpecialty = async (req, res) => {
  try {
    const { id } = req.params;
    
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'ID chuyên khoa không hợp lệ'
      });
    }

    const specialty = await Specialty.findById(id);
    
    if (!specialty) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy chuyên khoa'
      });
    }

    // Check if specialty is associated with doctors
    const Doctor = require('../models/Doctor');
    const doctorsCount = await Doctor.countDocuments({ specialtyId: id });
    
    if (doctorsCount > 0) {
      return res.status(400).json({
        success: false,
        message: 'Không thể xóa chuyên khoa đang được sử dụng bởi bác sĩ'
      });
    }

    // Check if specialty is associated with hospitals
    const Hospital = require('../models/Hospital');
    const hospitalsCount = await Hospital.countDocuments({ specialties: id });
    
    if (hospitalsCount > 0) {
      return res.status(400).json({
        success: false,
        message: 'Không thể xóa chuyên khoa đang được sử dụng bởi bệnh viện'
      });
    }

    await Specialty.findByIdAndDelete(id);

    return res.status(200).json({
      success: true,
      message: 'Xóa chuyên khoa thành công'
    });
  } catch (error) {
    console.error('Delete specialty error:', error);
    return res.status(500).json({
      success: false,
      message: 'Lỗi khi xóa chuyên khoa',
      error: error.message
    });
  }
};

/**
 * @desc    Get all specialties
 * @route   GET /api/admin/specialties
 * @access  Private (Admin)
 */
exports.getSpecialties = async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 10, 
      isActive,
      search = ''
    } = req.query;
    
    // Build query
    const query = {};
    
    // Filter by isActive status
    if (isActive !== undefined) {
      query.isActive = isActive === 'true';
    }
    
    // Search by name or description
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }
    
    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    // Execute query with pagination
    const specialties = await Specialty.find(query)
      .sort({ name: 1 })
      .skip(skip)
      .limit(parseInt(limit));
    
    // Count total matching documents
    const total = await Specialty.countDocuments(query);
    
    // Calculate total pages
    const totalPages = Math.ceil(total / parseInt(limit));
    
    return res.status(200).json({
      success: true,
      data: {
        specialties,
        total,
        totalPages,
        currentPage: parseInt(page)
      }
    });
  } catch (error) {
    console.error('Get specialties error:', error);
    return res.status(500).json({
      success: false,
      message: 'Lỗi khi lấy danh sách chuyên khoa',
      error: error.message
    });
  }
};

/**
 * @desc    Get specialty by ID
 * @route   GET /api/admin/specialties/:id
 * @access  Private (Admin)
 */
exports.getSpecialtyById = async (req, res) => {
  try {
    const { id } = req.params;
    
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'ID chuyên khoa không hợp lệ'
      });
    }
    
    const specialty = await Specialty.findById(id);
    
    if (!specialty) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy chuyên khoa'
      });
    }
    
    return res.status(200).json({
      success: true,
      data: specialty
    });
  } catch (error) {
    console.error('Get specialty detail error:', error);
    return res.status(500).json({
      success: false,
      message: 'Lỗi khi lấy thông tin chi tiết chuyên khoa',
      error: error.message
    });
  }
};

/**
 * @desc    Upload specialty image
 * @route   POST /api/admin/specialties/:id/image
 * @access  Private (Admin)
 */
exports.uploadSpecialtyImage = async (req, res) => {
  try {
    // Kiểm tra quyền admin
    if (req.user.roleType !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Bạn không có quyền thực hiện hành động này'
      });
    }

    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'ID chuyên khoa không hợp lệ'
      });
    }

    // Kiểm tra tệp ảnh
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng tải lên một tệp ảnh'
      });
    }

    // Tìm chuyên khoa
    const specialty = await Specialty.findById(id);
    if (!specialty) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy chuyên khoa'
      });
    }

    // Import Cloudinary config
    const { uploadImage, deleteImage } = require('../config/cloudinary');

    // Xóa ảnh cũ nếu có
    if (specialty.image && specialty.image.publicId) {
      await deleteImage(specialty.image.publicId);
    }

    // Tạo buffer từ dữ liệu file trong memory
    const buffer = req.file.buffer;
    
    // Tạo base64 string từ buffer để tải lên Cloudinary
    const base64String = `data:${req.file.mimetype};base64,${buffer.toString('base64')}`;

    // Tải ảnh lên Cloudinary
    const cloudinaryResult = await uploadImage(base64String, `specialties/${specialty._id}`);

    // Cập nhật thông tin ảnh trong database
    const updatedSpecialty = await Specialty.findByIdAndUpdate(
      id,
      { 
        image: cloudinaryResult,
        imageUrl: cloudinaryResult.secureUrl
      },
      { new: true }
    );

    return res.status(200).json({
      success: true,
      data: updatedSpecialty,
      message: 'Cập nhật ảnh chuyên khoa thành công'
    });

  } catch (error) {
    console.error('Specialty image upload error:', error);
    return res.status(500).json({
      success: false,
      message: 'Lỗi khi tải lên ảnh chuyên khoa',
      error: error.message
    });
  }
}; 