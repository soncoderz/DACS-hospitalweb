const Doctor = require('../models/Doctor');
const Specialty = require('../models/Specialty');
const mongoose = require('mongoose');

// GET /api/doctors?specialty=... – Lọc bác sĩ theo chuyên khoa
exports.getDoctors = async (req, res) => {
  try {
    const { 
      specialty, 
      name, 
      hospitalId, 
      experience, 
      rating,
      page = 1,
      limit = 10,
      sort = 'averageRating',
      order = 'desc'
    } = req.query;
    
    // Build query
    const query = { isAvailable: true };
    
    // Filter by specialty
    if (specialty) {
      let specialtyId;
      
      // Check if specialty is a valid ObjectId or a string name
      if (mongoose.Types.ObjectId.isValid(specialty)) {
        specialtyId = specialty;
      } else {
        // Find specialty by name
        const specialtyDoc = await Specialty.findOne({ 
          name: { $regex: specialty, $options: 'i' }
        });
        
        if (specialtyDoc) {
          specialtyId = specialtyDoc._id;
        } else {
          return res.status(404).json({
            success: false,
            message: 'Không tìm thấy chuyên khoa'
          });
        }
      }
      
      query.specialtyId = specialtyId;
    }
    
    // Filter by hospital
    if (hospitalId) {
      if (!mongoose.Types.ObjectId.isValid(hospitalId)) {
        return res.status(400).json({
          success: false,
          message: 'ID bệnh viện không hợp lệ'
        });
      }
      query.hospitalId = hospitalId;
    }
    
    // Filter by experience
    if (experience) {
      const minExperience = parseInt(experience);
      if (!isNaN(minExperience)) {
        query.experience = { $gte: minExperience };
      }
    }
    
    // Filter by rating
    if (rating) {
      const minRating = parseFloat(rating);
      if (!isNaN(minRating)) {
        query.averageRating = { $gte: minRating };
      }
    }
    
    // Process doctors search by name
    let doctorIds = [];
    if (name) {
      // Search for doctors by name in User collection
      const User = require('../models/User');
      const users = await User.find({
        fullName: { $regex: name, $options: 'i' },
        roleType: 'doctor'
      }).select('_id');
      
      // Get doctor IDs related to these users
      if (users.length > 0) {
        const relatedDoctors = await Doctor.find({
          user: { $in: users.map(u => u._id) }
        }).select('_id');
        
        doctorIds = relatedDoctors.map(d => d._id);
        
        if (doctorIds.length > 0) {
          query._id = { $in: doctorIds };
        } else {
          // No doctors found with this name
          return res.status(200).json({
            success: true,
            count: 0,
            data: []
          });
        }
      } else {
        // No users found with this name
        return res.status(200).json({
          success: true,
          count: 0,
          data: []
        });
      }
    }
    
    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    // Determine sort field and order
    const sortOptions = {};
    sortOptions[sort] = order === 'asc' ? 1 : -1;
    
    // Execute query with pagination and populate
    const doctors = await Doctor.find(query)
      .populate('user', 'fullName email phoneNumber avatarUrl')
      .populate('specialtyId', 'name description icon')
      .populate('hospitalId', 'name address.city address.district')
      .sort(sortOptions)
      .skip(skip)
      .limit(parseInt(limit));
    
    // Count total matching documents
    const total = await Doctor.countDocuments(query);
    
    return res.status(200).json({
      success: true,
      count: doctors.length,
      total,
      totalPages: Math.ceil(total / limit),
      currentPage: parseInt(page),
      data: doctors
    });
    
  } catch (error) {
    console.error('Get doctors error:', error);
    return res.status(500).json({
      success: false,
      message: 'Lỗi khi lấy danh sách bác sĩ',
      error: error.message
    });
  }
};

// GET /api/doctors/:id – Chi tiết bác sĩ
exports.getDoctorById = async (req, res) => {
  try {
    const { id } = req.params;
    
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'ID bác sĩ không hợp lệ'
      });
    }
    
    const doctor = await Doctor.findById(id)
      .populate('user', 'fullName email phoneNumber avatarUrl')
      .populate('specialtyId', 'name description icon')
      .populate('hospitalId', 'name address contactInfo workingHours')
      .populate('reviews');
    
    if (!doctor) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy bác sĩ'
      });
    }
    
    return res.status(200).json({
      success: true,
      data: doctor
    });
    
  } catch (error) {
    console.error('Get doctor detail error:', error);
    return res.status(500).json({
      success: false,
      message: 'Lỗi khi lấy thông tin chi tiết bác sĩ',
      error: error.message
    });
  }
};

// Chỉ admin mới có quyền thêm, cập nhật, xóa bác sĩ
exports.createDoctor = async (req, res) => {
  try {
    // Kiểm tra quyền
    if (req.user.roleType !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Không có quyền thêm bác sĩ'
      });
    }
    
    const { 
      userId, 
      specialtyId, 
      hospitalId,
      title,
      description,
      education,
      experience,
      certifications,
      languages,
      consultationFee
    } = req.body;
    
    // Validate required fields
    if (!userId || !specialtyId || !hospitalId || !title) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng cung cấp đầy đủ thông tin bác sĩ'
      });
    }
    
    // Validate IDs
    if (!mongoose.Types.ObjectId.isValid(userId) || 
        !mongoose.Types.ObjectId.isValid(specialtyId) || 
        !mongoose.Types.ObjectId.isValid(hospitalId)) {
      return res.status(400).json({
        success: false,
        message: 'ID không hợp lệ'
      });
    }
    
    // Check if user exists and has role 'doctor'
    const User = require('../models/User');
    const user = await User.findById(userId);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy người dùng'
      });
    }
    
    // Update user role to doctor if not already
    if (user.roleType !== 'doctor') {
      user.roleType = 'doctor';
      await user.save();
    }
    
    // Check if specialty exists
    const specialty = await Specialty.findById(specialtyId);
    
    if (!specialty) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy chuyên khoa'
      });
    }
    
    // Check if hospital exists
    const Hospital = require('../models/Hospital');
    const hospital = await Hospital.findById(hospitalId);
    
    if (!hospital) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy bệnh viện'
      });
    }
    
    // Check if doctor already exists for this user
    const existingDoctor = await Doctor.findOne({ user: userId });
    
    if (existingDoctor) {
      return res.status(400).json({
        success: false,
        message: 'Người dùng này đã là bác sĩ'
      });
    }
    
    // Create new doctor
    const doctor = await Doctor.create({
      user: userId,
      specialtyId,
      hospitalId,
      title,
      description: description || '',
      education: education || '',
      experience: experience || 0,
      certifications: certifications || [],
      languages: languages || [],
      consultationFee: consultationFee || 0,
      isAvailable: true
    });
    
    // Populate related fields for response
    const populatedDoctor = await Doctor.findById(doctor._id)
      .populate('user', 'fullName email phoneNumber avatarUrl')
      .populate('specialtyId', 'name')
      .populate('hospitalId', 'name');
    
    return res.status(201).json({
      success: true,
      data: populatedDoctor,
      message: 'Thêm bác sĩ thành công'
    });
    
  } catch (error) {
    console.error('Create doctor error:', error);
    return res.status(500).json({
      success: false,
      message: 'Lỗi khi thêm bác sĩ',
      error: error.message
    });
  }
};

/**
 * @desc    Get doctor's schedule
 * @route   GET /api/doctors/:id/schedule
 * @access  Public
 */
exports.getDoctorSchedule = async (req, res) => {
  try {
    const { id } = req.params;
    const { startDate, endDate } = req.query;
    
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'ID bác sĩ không hợp lệ'
      });
    }
    
    // Check if doctor exists
    const doctor = await Doctor.findById(id);
    if (!doctor) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy bác sĩ'
      });
    }
    
    // Default to current week if no dates provided
    const start = startDate ? new Date(startDate) : new Date();
    let end = endDate ? new Date(endDate) : new Date();
    
    // Default to 7 days if no end date
    if (!endDate) {
      end.setDate(start.getDate() + 7);
    }
    
    // Validate date range
    if (start > end) {
      return res.status(400).json({
        success: false,
        message: 'Ngày bắt đầu phải trước ngày kết thúc'
      });
    }
    
    // Get doctor's availability for the date range
    const Availability = require('../models/Availability');
    const availability = await Availability.find({
      doctorId: id,
      date: { $gte: start, $lte: end }
    }).sort({ date: 1 });
    
    // Get already booked appointments
    const Appointment = require('../models/Appointment');
    const bookedAppointments = await Appointment.find({
      doctorId: id,
      appointmentDate: { $gte: start, $lte: end },
      status: { $in: ['scheduled', 'confirmed'] }
    }).select('appointmentDate timeSlot');
    
    // Process available slots
    const schedule = availability.map(day => {
      // Find booked slots for this day
      const dayBookings = bookedAppointments.filter(app => 
        app.appointmentDate.toDateString() === day.date.toDateString()
      );
      
      // Get booked time slots
      const bookedSlots = dayBookings.map(booking => booking.timeSlot);
      
      // Filter available slots
      const availableSlots = day.timeSlots.filter(slot => 
        !bookedSlots.includes(slot)
      );
      
      return {
        date: day.date,
        availableSlots
      };
    });
    
    return res.status(200).json({
      success: true,
      data: schedule
    });
  } catch (error) {
    console.error('Get doctor schedule error:', error);
    return res.status(500).json({
      success: false,
      message: 'Lỗi khi lấy lịch của bác sĩ',
      error: error.message
    });
  }
};

/**
 * @desc    Get doctor reviews
 * @route   GET /api/doctors/:id/reviews
 * @access  Public
 */
exports.getDoctorReviews = async (req, res) => {
  try {
    const { id } = req.params;
    
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'ID bác sĩ không hợp lệ'
      });
    }
    
    // Check if doctor exists
    const doctor = await Doctor.findById(id);
    if (!doctor) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy bác sĩ'
      });
    }
    
    // Get reviews for the doctor
    const Review = require('../models/Review');
    const reviews = await Review.find({ doctorId: id })
      .populate('patientId', 'fullName avatarUrl')
      .sort({ createdAt: -1 });
    
    return res.status(200).json({
      success: true,
      count: reviews.length,
      data: reviews
    });
  } catch (error) {
    console.error('Get doctor reviews error:', error);
    return res.status(500).json({
      success: false,
      message: 'Lỗi khi lấy đánh giá của bác sĩ',
      error: error.message
    });
  }
};

/**
 * @desc    Add doctor to favorites
 * @route   POST /api/doctors/:id/favorite
 * @access  Private
 */
exports.addToFavorites = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'ID bác sĩ không hợp lệ'
      });
    }
    
    // Check if doctor exists
    const doctor = await Doctor.findById(id);
    if (!doctor) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy bác sĩ'
      });
    }
    
    // Add to favorites
    const User = require('../models/User');
    const user = await User.findById(userId);
    
    // Check if already in favorites
    if (user.favorites && user.favorites.includes(id)) {
      return res.status(400).json({
        success: false,
        message: 'Bác sĩ đã có trong danh sách yêu thích'
      });
    }
    
    // Add to favorites array
    if (!user.favorites) {
      user.favorites = [];
    }
    user.favorites.push(id);
    await user.save();
    
    return res.status(200).json({
      success: true,
      message: 'Đã thêm bác sĩ vào danh sách yêu thích'
    });
  } catch (error) {
    console.error('Add to favorites error:', error);
    return res.status(500).json({
      success: false,
      message: 'Lỗi khi thêm bác sĩ vào danh sách yêu thích',
      error: error.message
    });
  }
};

/**
 * @desc    Remove doctor from favorites
 * @route   DELETE /api/doctors/:id/favorite
 * @access  Private
 */
exports.removeFromFavorites = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'ID bác sĩ không hợp lệ'
      });
    }
    
    // Remove from favorites
    const User = require('../models/User');
    const user = await User.findById(userId);
    
    // Check if in favorites
    if (!user.favorites || !user.favorites.includes(id)) {
      return res.status(400).json({
        success: false,
        message: 'Bác sĩ không có trong danh sách yêu thích'
      });
    }
    
    // Remove from favorites array
    user.favorites = user.favorites.filter(
      doctorId => doctorId.toString() !== id
    );
    await user.save();
    
    return res.status(200).json({
      success: true,
      message: 'Đã xóa bác sĩ khỏi danh sách yêu thích'
    });
  } catch (error) {
    console.error('Remove from favorites error:', error);
    return res.status(500).json({
      success: false,
      message: 'Lỗi khi xóa bác sĩ khỏi danh sách yêu thích',
      error: error.message
    });
  }
};

/**
 * @desc    Get favorite doctors
 * @route   GET /api/doctors/favorites
 * @access  Private
 */
exports.getFavorites = async (req, res) => {
  try {
    const userId = req.user.id;
    
    // Get user with favorites
    const User = require('../models/User');
    const user = await User.findById(userId).populate({
      path: 'favorites',
      populate: [
        { path: 'user', select: 'fullName avatarUrl' },
        { path: 'specialtyId', select: 'name' },
        { path: 'hospitalId', select: 'name' }
      ]
    });
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy người dùng'
      });
    }
    
    return res.status(200).json({
      success: true,
      count: user.favorites ? user.favorites.length : 0,
      data: user.favorites || []
    });
  } catch (error) {
    console.error('Get favorites error:', error);
    return res.status(500).json({
      success: false,
      message: 'Lỗi khi lấy danh sách bác sĩ yêu thích',
      error: error.message
    });
  }
};

/**
 * @desc    Update doctor information
 * @route   PUT /api/doctors/:id
 * @access  Private (Admin)
 */
exports.updateDoctor = async (req, res) => {
  try {
    const { id } = req.params;
    
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'ID bác sĩ không hợp lệ'
      });
    }
    
    // Check if doctor exists
    const doctor = await Doctor.findById(id);
    if (!doctor) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy bác sĩ'
      });
    }
    
    const { 
      specialtyId,
      hospitalId,
      title,
      description,
      education,
      experience,
      certifications,
      languages,
      consultationFee,
      isAvailable 
    } = req.body;
    
    // Validate specialty and hospital IDs if provided
    if (specialtyId && !mongoose.Types.ObjectId.isValid(specialtyId)) {
      return res.status(400).json({
        success: false,
        message: 'ID chuyên khoa không hợp lệ'
      });
    }
    
    if (hospitalId && !mongoose.Types.ObjectId.isValid(hospitalId)) {
      return res.status(400).json({
        success: false,
        message: 'ID bệnh viện không hợp lệ'
      });
    }
    
    // Prepare update object with only provided fields
    const updateData = {};
    if (specialtyId) updateData.specialtyId = specialtyId;
    if (hospitalId) updateData.hospitalId = hospitalId;
    if (title) updateData.title = title;
    if (description !== undefined) updateData.description = description;
    if (education !== undefined) updateData.education = education;
    if (experience !== undefined) updateData.experience = experience;
    if (certifications) updateData.certifications = certifications;
    if (languages) updateData.languages = languages;
    if (consultationFee !== undefined) updateData.consultationFee = consultationFee;
    if (isAvailable !== undefined) updateData.isAvailable = isAvailable;
    
    // Update doctor
    const updatedDoctor = await Doctor.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    )
    .populate('user', 'fullName email phoneNumber avatarUrl')
    .populate('specialtyId', 'name')
    .populate('hospitalId', 'name');
    
    return res.status(200).json({
      success: true,
      data: updatedDoctor,
      message: 'Cập nhật thông tin bác sĩ thành công'
    });
  } catch (error) {
    console.error('Update doctor error:', error);
    return res.status(500).json({
      success: false,
      message: 'Lỗi khi cập nhật thông tin bác sĩ',
      error: error.message
    });
  }
};

/**
 * @desc    Delete doctor
 * @route   DELETE /api/doctors/:id
 * @access  Private (Admin)
 */
exports.deleteDoctor = async (req, res) => {
  try {
    const { id } = req.params;
    
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'ID bác sĩ không hợp lệ'
      });
    }
    
    // Check if doctor exists
    const doctor = await Doctor.findById(id);
    if (!doctor) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy bác sĩ'
      });
    }
    
    // Check for active appointments
    const Appointment = require('../models/Appointment');
    const activeAppointments = await Appointment.countDocuments({
      doctorId: id,
      status: { $in: ['scheduled', 'confirmed'] }
    });
    
    if (activeAppointments > 0) {
      return res.status(400).json({
        success: false,
        message: 'Không thể xóa bác sĩ có lịch hẹn đang chờ xử lý'
      });
    }
    
    // Delete doctor
    await Doctor.findByIdAndDelete(id);
    
    // Update the associated user's role if needed
    const User = require('../models/User');
    const user = await User.findById(doctor.user);
    if (user) {
      user.roleType = 'user'; // Change back to regular user
      await user.save();
    }
    
    return res.status(200).json({
      success: true,
      message: 'Xóa bác sĩ thành công'
    });
  } catch (error) {
    console.error('Delete doctor error:', error);
    return res.status(500).json({
      success: false,
      message: 'Lỗi khi xóa bác sĩ',
      error: error.message
    });
  }
}; 