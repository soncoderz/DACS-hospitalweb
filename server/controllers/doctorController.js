const Doctor = require('../models/Doctor');
const Specialty = require('../models/Specialty');
const mongoose = require('mongoose');
const User = require('../models/User');
const Review = require('../models/Review');
const Appointment = require('../models/Appointment');
const { uploadImage, deleteImage } = require('../config/cloudinary');
const Schedule = require('../models/Schedule');

// GET /api/doctors?specialty=... – Lọc bác sĩ theo chuyên khoa
exports.getDoctors = async (req, res) => {
  try {
    const { 
      specialty, 
      search, // Đổi từ name thành search để phù hợp với tham số
      specialtyId, // Thêm tham số trực tiếp specialtyId
      hospitalId, 
      experience, 
      rating,
      page = 1,
      limit = 10,
      sort = 'averageRating',
      order = 'desc',
      isLocked // Thêm tham số isLocked để lọc bác sĩ theo trạng thái khóa
    } = req.query;
    
    console.log('Request params:', { search, specialtyId, hospitalId, isLocked });

    // Build query
    const query = {};
    
    // Filter by specialty id (ưu tiên specialtyId)
    if (specialtyId && mongoose.Types.ObjectId.isValid(specialtyId)) {
      query.specialtyId = new mongoose.Types.ObjectId(specialtyId);
    } 
    // Nếu không có specialtyId nhưng có specialty name
    else if (specialty) {
      try {
        // Find specialty by name
        const specialtyDoc = await Specialty.findOne({ 
          name: { $regex: new RegExp(specialty, 'i') }
        });
        
        if (specialtyDoc) {
          query.specialtyId = specialtyDoc._id;
        } else {
          return res.status(200).json({
            success: true,
            count: 0,
            data: [],
            message: 'Không tìm thấy chuyên khoa với tên này'
          });
        }
      } catch (error) {
        console.error('Specialty filter error:', error);
      }
    }
    
    // Filter by hospital
    if (hospitalId && mongoose.Types.ObjectId.isValid(hospitalId)) {
      query.hospitalId = new mongoose.Types.ObjectId(hospitalId);
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
    
    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    // Determine sort field and order
    const sortOptions = {};
    sortOptions[sort] = order === 'asc' ? 1 : -1;
    
    let finalQuery = query;
    
    // Xử lý lọc theo trạng thái khóa/mở khóa
    // Nếu là endpoint admin và có tham số isLocked
    if (req.originalUrl.includes('/admin/')) {
      // Tìm user theo trạng thái khóa
      const userQuery = { roleType: 'doctor' };
      
      if (isLocked === 'true' || isLocked === true) {
        userQuery.isLocked = true;
      } else if (isLocked === 'false' || isLocked === false) {
        userQuery.isLocked = false;
      }
      
      // Chỉ áp dụng filter nếu có tham số isLocked cụ thể
      if (isLocked !== undefined) {
        const filteredUserIds = await User.find(userQuery).select('_id');
        finalQuery.user = { $in: filteredUserIds.map(u => u._id) };
      }
    }
    // Nếu là endpoint public (không phải admin) thì luôn lọc bác sĩ chưa bị khóa
    else if (!req.originalUrl.includes('/admin/')) {
      const activeUserIds = await User.find({ 
        roleType: 'doctor',
        isLocked: { $ne: true } 
      }).select('_id');
      
      finalQuery.user = { $in: activeUserIds.map(u => u._id) };
    }
    
    // Tìm kiếm theo tên - nếu có
    if (search) {
      console.log('Searching for doctors with name:', search);
      
      // Tìm user có tên phù hợp (bỏ điều kiện isLocked để có thể tìm cả bác sĩ đã khóa)
      const searchQuery = {
        fullName: { $regex: new RegExp(search, 'i') },
        roleType: 'doctor'
      };
      
      // Nếu có lọc theo trạng thái khóa, áp dụng điều kiện đó vào tìm kiếm
      if (req.originalUrl.includes('/admin/') && isLocked !== undefined) {
        if (isLocked === 'true') {
          searchQuery.isLocked = true;
        } else if (isLocked === 'false') {
          searchQuery.isLocked = false;
        }
      } else if (!req.originalUrl.includes('/admin/')) {
        // Nếu là endpoint public, chỉ tìm bác sĩ chưa bị khóa
        searchQuery.isLocked = { $ne: true };
      }
      
      const users = await User.find(searchQuery).select('_id');
      
      console.log('Found users by name:', users.length);
      
      if (users && users.length > 0) {
        // Cập nhật lại điều kiện user trong finalQuery
        finalQuery.user = { $in: users.map(u => u._id) };
      } else {
        // Không tìm thấy user nào => không có kết quả
        return res.status(200).json({
          success: true,
          count: 0,
          total: 0,
          totalPages: 0,
          currentPage: parseInt(page),
          data: []
        });
      }
    }
    
    console.log('Final query:', JSON.stringify(finalQuery));
    
    // Execute query with pagination and populate
    const doctors = await Doctor.find(finalQuery)
      .populate('user', 'fullName email phoneNumber avatarUrl isLocked lockReason')
      .populate('specialtyId', 'name description icon')
      .populate('hospitalId', 'name address')
      .sort(sortOptions)
      .skip(skip)
      .limit(parseInt(limit));
    
    // Count total matching documents
    const total = await Doctor.countDocuments(finalQuery);
    
    return res.status(200).json({
      success: true,
      count: doctors.length,
      total,
      totalPages: Math.ceil(total / parseInt(limit)),
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
    
    console.log('Finding doctor with ID:', id);
    
    // Kiểm tra xem bác sĩ có tồn tại không
    const doctorExists = await Doctor.findById(id);
    if (!doctorExists) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy bác sĩ với ID này'
      });
    }
    
    // Sử dụng findById với populate đầy đủ
    const doctor = await Doctor.findById(id)
      .populate({
        path: 'user',
        select: 'fullName email phoneNumber avatarUrl isLocked lockReason'
      })
      .populate({
        path: 'specialtyId',
        select: 'name description icon'
      })
      .populate({
        path: 'hospitalId',
        select: 'name address contactInfo workingHours'
      });
    
    // Không trả về danh sách data, chỉ trả về một đối tượng doctor
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
      fullName,
      email,
      password,
      phoneNumber,
      dateOfBirth,
      gender,
      address,
      specialtyId, 
      hospitalId,
      services, // Mảng các dịch vụ
      title,
      description,
      education,
      experience,
      certifications,
      languages,
      consultationFee
    } = req.body;
    
    console.log('Create doctor request:', {
      fullName,
      email,
      phoneNumber,
      specialtyId,
      hospitalId,
      title,
      education,
      certifications: certifications ? certifications.length : 0
    });
    
    // Validate required fields
    if (!fullName || !email || !password || !phoneNumber || !specialtyId || !hospitalId || !title || !education || !certifications || certifications.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng cung cấp đầy đủ thông tin bác sĩ',
        requiredFields: {
          fullName: !fullName,
          email: !email,
          password: !password,
          phoneNumber: !phoneNumber,
          specialtyId: !specialtyId,
          hospitalId: !hospitalId,
          title: !title,
          education: !education,
          certifications: !certifications || certifications.length === 0
        }
      });
    }
    
    // Validate IDs
    if (!mongoose.Types.ObjectId.isValid(specialtyId) || 
        !mongoose.Types.ObjectId.isValid(hospitalId)) {
      return res.status(400).json({
        success: false,
        message: 'ID không hợp lệ',
        details: {
          specialtyIdValid: mongoose.Types.ObjectId.isValid(specialtyId),
          hospitalIdValid: mongoose.Types.ObjectId.isValid(hospitalId)
        }
      });
    }
    
    // Check if user with this email already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'Email này đã được sử dụng bởi tài khoản khác'
      });
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
    
    // Kiểm tra xem bệnh viện có hỗ trợ chuyên khoa này không
    if (hospital.specialties && hospital.specialties.length > 0) {
      const hasSpecialty = hospital.specialties.some(id => id.toString() === specialtyId.toString());
      if (!hasSpecialty) {
        return res.status(400).json({
          success: false,
          message: 'Bệnh viện này không hỗ trợ chuyên khoa đã chọn'
        });
      }
    } else {
      console.log('Hospital has no specialties defined');
    }
    
    // Kiểm tra dịch vụ nếu có
    let validatedServices = [];
    
    // Lấy instance của Service model
    const Service = require('../models/Service');
    
    if (services && Array.isArray(services) && services.length > 0) {
      // Kiểm tra từng ID dịch vụ
      for (const serviceId of services) {
        // Kiểm tra ID có đúng định dạng MongoDB ObjectId
        if (!mongoose.Types.ObjectId.isValid(serviceId)) {
          return res.status(400).json({
            success: false,
            message: `ID dịch vụ không hợp lệ: ${serviceId}`
          });
        }
        
        // Kiểm tra dịch vụ có tồn tại trong database
        const service = await Service.findById(serviceId);
        if (!service) {
          return res.status(404).json({
            success: false,
            message: `Không tìm thấy dịch vụ với ID: ${serviceId}`
          });
        }
        
        // Kiểm tra xem dịch vụ có thuộc chuyên khoa đã chọn không
        if (!service.specialtyId || service.specialtyId.toString() !== specialtyId.toString()) {
          return res.status(400).json({
            success: false,
            message: `Dịch vụ ${service.name} không thuộc chuyên khoa đã chọn`
          });
        }
        
        validatedServices.push(serviceId);
      }
    } else {
      try {
        // Nếu không có dịch vụ được chọn, tự động lấy tất cả dịch vụ từ chuyên khoa
        const specialtyServices = await Service.find({ 
          specialtyId: specialtyId,
          isActive: true 
        });
        
        if (specialtyServices.length > 0) {
          validatedServices = specialtyServices.map(service => service._id);
        }
      } catch (error) {
        console.error('Error fetching specialty services:', error);
      }
    }
    
    console.log('Creating user account...');
    
    // 1. Tạo tài khoản người dùng trước
    const user = await User.create({
      fullName,
      email,
      passwordHash: password, // Sẽ được hash bởi middleware
      phoneNumber,
      dateOfBirth: dateOfBirth || undefined,
      gender: gender || undefined,
      address: address || undefined,
      roleType: 'doctor',
      isVerified: true // Do admin tạo nên mặc định đã xác thực
    });
    
    console.log('User created:', user._id);
    console.log('Creating doctor profile...');
    
    // 2. Sau đó tạo hồ sơ bác sĩ
    const doctor = await Doctor.create({
      user: user._id,
      specialtyId,
      hospitalId,
      services: validatedServices, // Thêm trường services
      title,
      description: description || '',
      education: education,
      experience: experience || 0,
      certifications: certifications || [],
      languages: languages || [],
      consultationFee: consultationFee || 0,
      isAvailable: true
    });
    
    console.log('Doctor profile created:', doctor._id);
    
    // Populate related fields for response
    const populatedDoctor = await Doctor.findById(doctor._id)
      .populate('user', 'fullName email phoneNumber dateOfBirth gender address avatarUrl')
      .populate('specialtyId', 'name')
      .populate('hospitalId', 'name')
      .populate('services', 'name price');
    
    return res.status(201).json({
      success: true,
      data: populatedDoctor,
      message: 'Tạo tài khoản và hồ sơ bác sĩ thành công'
    });
    
  } catch (error) {
    console.error('Create doctor error:', error);
    return res.status(500).json({
      success: false,
      message: 'Lỗi khi tạo tài khoản bác sĩ',
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
 * @desc    Add doctor to favorites
 * @route   POST /api/doctors/:id/favorite
 * @access  Private
 */
exports.addToFavorites = async (req, res) => {
  try {
    const doctorId = req.params.id;
    const userId = req.user.id;
    
    console.log(`Attempting to add doctor ${doctorId} to favorites for user ${userId}`);
    
    if (!mongoose.Types.ObjectId.isValid(doctorId)) {
      return res.status(400).json({
        success: false,
        message: 'ID bác sĩ không hợp lệ'
      });
    }
    
    // Check if doctor exists
    const doctor = await Doctor.findById(doctorId);
    if (!doctor) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy bác sĩ'
      });
    }
    
    console.log(`Found doctor with ID: ${doctor._id}`);
    
    // Add to favorites
    const user = await User.findById(userId);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy người dùng'
      });
    }
    
    // Check if already in favorites
    if (user.favorites && user.favorites.some(id => 
      id.toString() === doctorId.toString()
    )) {
      return res.status(400).json({
        success: false,
        message: 'Bác sĩ đã có trong danh sách yêu thích'
      });
    }
    
    // Add to favorites array
    if (!user.favorites) {
      user.favorites = [];
    }
    
    // Add doctor ID directly to favorites - using mongoose ObjectId reference
    user.favorites.push(doctorId); // Mongoose will handle the conversion to ObjectId
    await user.save();
    
    console.log(`Updated user favorites: ${user.favorites}`);
    
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
    const doctorId = req.params.id;
    const userId = req.user.id;
    
    console.log(`Attempting to remove doctor ${doctorId} from favorites for user ${userId}`);
    
    if (!mongoose.Types.ObjectId.isValid(doctorId)) {
      return res.status(400).json({
        success: false,
        message: 'ID bác sĩ không hợp lệ'
      });
    }
    
    // We don't need to verify the doctor exists - just remove from favorites if it's there
    
    // Get user
    const user = await User.findById(userId);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy người dùng'
      });
    }
    
    // Check if in favorites
    const doctorInFavorites = user.favorites && 
                             user.favorites.some(id => id.toString() === doctorId.toString());
                             
    if (!doctorInFavorites) {
      return res.status(400).json({
        success: false,
        message: 'Bác sĩ không có trong danh sách yêu thích'
      });
    }
    
    // Remove from favorites array - filter by string comparison
    user.favorites = user.favorites.filter(
      id => id.toString() !== doctorId.toString()
    );
    await user.save();
    
    console.log(`Removed doctor ${doctorId} from favorites. Updated list: ${user.favorites}`);
    
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
 * @desc    Update doctor information
 * @route   PUT /api/doctors/:id
 * @access  Private (Admin)
 */
exports.updateDoctor = async (req, res) => {
  try {
    // Kiểm tra quyền
    if (req.user.roleType !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Không có quyền cập nhật thông tin bác sĩ'
      });
    }
    
    const doctorId = req.params.id;
    
    // Kiểm tra ID hợp lệ
    if (!mongoose.Types.ObjectId.isValid(doctorId)) {
      return res.status(400).json({
        success: false,
        message: 'ID bác sĩ không hợp lệ'
      });
    }
    
    // Tìm bác sĩ trong db
    const doctor = await Doctor.findById(doctorId);
    if (!doctor) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy bác sĩ'
      });
    }
    
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
      services,
      title,
      description,
      education,
      experience,
      certifications,
      languages,
      consultationFee,
      isAvailable
    } = req.body;
    
    console.log('Update doctor request for ID:', doctorId, {
      fullName,
      specialtyId,
      hospitalId,
      education,
      certifications: certifications ? certifications.length : 0
    });

    // Validate required fields
    if (!fullName || !phoneNumber || !specialtyId || !hospitalId || !title || !education || !certifications || certifications.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng cung cấp đầy đủ thông tin bác sĩ',
        requiredFields: {
          fullName: !fullName,
          phoneNumber: !phoneNumber,
          specialtyId: !specialtyId,
          hospitalId: !hospitalId,
          title: !title,
          education: !education,
          certifications: !certifications || certifications.length === 0
        }
      });
    }
    
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
    
    // Cập nhật thông tin User nếu có các trường liên quan
    if (fullName || phoneNumber || dateOfBirth || gender || address) {
      // Tìm user liên kết với doctor
      const user = await User.findById(doctor.user);
      if (user) {
        // Cập nhật thông tin người dùng
        if (fullName) user.fullName = fullName;
        if (phoneNumber) user.phoneNumber = phoneNumber;
        if (dateOfBirth) user.dateOfBirth = dateOfBirth;
        if (gender) user.gender = gender;
        if (address) user.address = address;
        
        await user.save();
        console.log(`Updated user information for user ID: ${user._id}`);
      }
    }
    
    // Update doctor
    const updatedDoctor = await Doctor.findByIdAndUpdate(
      doctorId,
      updateData,
      { new: true, runValidators: true }
    )
    .populate('user', 'fullName email phoneNumber dateOfBirth gender address avatarUrl')
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
      status: { $in: ['pending', 'confirmed', 'rescheduled', 'scheduled'] }
    });
    
    if (activeAppointments > 0) {
      return res.status(400).json({
        success: false,
        message: 'Không thể xóa bác sĩ có lịch hẹn đang chờ xử lý hoặc đã xác nhận'
      });
    }
    
    // Lưu userId trước khi xóa bác sĩ
    const userId = doctor.user;
    
    // Delete doctor
    await Doctor.findByIdAndDelete(id);
    console.log(`Đã xóa hồ sơ bác sĩ ID: ${id}`);
    
    // Xóa tài khoản người dùng liên kết
    if (userId) {
      await User.findByIdAndDelete(userId);
      console.log(`Đã xóa tài khoản người dùng ID: ${userId}`);
    }
    
    return res.status(200).json({
      success: true,
      message: 'Xóa bác sĩ và tài khoản liên kết thành công'
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

// Upload doctor avatar
exports.uploadDoctorAvatar = async (req, res) => {
  try {
    console.log('Doctor avatar upload request received');
    
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng tải lên một tệp ảnh'
      });
    }

    console.log('File received:', {
      filename: req.file.originalname,
      size: req.file.size,
      mimetype: req.file.mimetype
    });

    // Check if the request is coming from an admin route
    const isAdminRoute = req.originalUrl.includes('/admin/');
    let doctor;
    let userId;

    if (isAdminRoute) {
      // If request is from admin route, use the doctor ID from params
      const { id } = req.params;
      
      console.log('Admin route detected, doctor ID:', id);
      
      if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({
          success: false,
          message: 'ID bác sĩ không hợp lệ'
        });
      }
      
      doctor = await Doctor.findById(id);
      if (!doctor) {
        return res.status(404).json({
          success: false,
          message: 'Không tìm thấy thông tin bác sĩ'
        });
      }
      
      userId = doctor.user;
      console.log('Found doctor, user ID:', userId);
    } else {
      // For doctor's own profile, use the current user's ID
      if (!req.user || !req.user.id) {
        return res.status(401).json({
          success: false,
          message: 'Không có quyền truy cập'
        });
      }
      
      doctor = await Doctor.findOne({ user: mongoose.Types.ObjectId(req.user.id) });
      console.log('doctor:', doctor);
      if (!doctor) {
        return res.status(400).json({ success: false, message: 'Không tìm thấy bác sĩ' });
      }
      
      userId = req.user.id;
      console.log('Doctor route, current user ID:', userId);
    }

    // Lấy thông tin người dùng
    const user = await User.findById(userId);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy thông tin người dùng'
      });
    }

    console.log('Found user:', user.email);

    // Sử dụng Cloudinary để tải ảnh lên
    const { uploadImage, deleteImage } = require('../config/cloudinary');

    // Xóa ảnh cũ trên Cloudinary nếu có
    if (user.avatar && user.avatar.publicId) {
      console.log('Deleting old avatar:', user.avatar.publicId);
      try {
        await deleteImage(user.avatar.publicId);
      } catch (deleteError) {
        console.error('Error deleting old avatar, continuing with upload:', deleteError);
      }
    }

    // Tạo buffer từ dữ liệu file trong memory
    const buffer = req.file.buffer;
    
    // Tạo base64 string từ buffer để tải lên Cloudinary
    const base64String = `data:${req.file.mimetype};base64,${buffer.toString('base64')}`;

    console.log('Uploading new avatar to Cloudinary...');
    
    // Tải ảnh mới lên Cloudinary sử dụng base64
    const cloudinaryResult = await uploadImage(base64String, `doctors/${doctor._id}`);

    console.log('Upload successful, updating user record');
    
    // Cập nhật thông tin avatar trong DB
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      {
        avatar: cloudinaryResult,
        avatarUrl: cloudinaryResult.secureUrl, // Giữ lại cả avatarUrl để tương thích với code cũ
        avatarData: null // Xóa dữ liệu base64 cũ nếu có
      },
      { new: true }
    ).select('-passwordHash');

    if (!updatedUser) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy người dùng'
      });
    }

    console.log('Doctor avatar updated successfully for:', updatedUser.email);
    
    // Cập nhật doctor để trả về thông tin mới nhất
    const updatedDoctor = await Doctor.findById(doctor._id)
      .populate({
        path: 'user',
        select: 'fullName email phoneNumber avatarUrl avatar'
      })
      .populate('specialtyId', 'name')
      .populate('hospitalId', 'name');
      
    // Gán avatar vào doctor để trả về dễ dàng hơn  
    const responseData = {
      ...updatedDoctor.toObject(),
      avatar: updatedUser.avatarUrl,
      avatarUrl: updatedUser.avatarUrl, // Thêm cả hai trường để đảm bảo tương thích
      fullName: updatedUser.fullName,
      email: updatedUser.email,
      phoneNumber: updatedUser.phoneNumber
    };

    return res.status(200).json({
      success: true,
      data: responseData,
      message: 'Cập nhật ảnh đại diện bác sĩ thành công'
    });

  } catch (error) {
    console.error('Doctor avatar upload error:', error);
    return res.status(500).json({
      success: false,
      message: 'Lỗi khi tải lên ảnh đại diện bác sĩ',
      error: error.message
    });
  }
};

/**
 * @desc    Lock doctor account
 * @route   PUT /api/admin/doctors/:id/lock
 * @access  Private (Admin)
 */
exports.lockDoctorAccount = async (req, res) => {
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
    
    // Get user associated with doctor
    const user = await User.findById(doctor.user);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy tài khoản người dùng liên kết với bác sĩ'
      });
    }
    
    // Update user to locked status
    user.isLocked = true;
    user.lockReason = lockReason;
    await user.save();
    
    return res.status(200).json({
      success: true,
      message: 'Đã khóa tài khoản bác sĩ thành công'
    });
  } catch (error) {
    console.error('Lock doctor account error:', error);
    return res.status(500).json({
      success: false,
      message: 'Lỗi khi khóa tài khoản bác sĩ',
      error: error.message
    });
  }
};

/**
 * @desc    Unlock doctor account
 * @route   PUT /api/admin/doctors/:id/unlock
 * @access  Private (Admin)
 */
exports.unlockDoctorAccount = async (req, res) => {
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
    
    // Get user associated with doctor
    const user = await User.findById(doctor.user);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy tài khoản người dùng liên kết với bác sĩ'
      });
    }
    
    // Update user to unlocked status
    user.isLocked = false;
    user.lockReason = undefined; // Clear the lock reason
    await user.save();
    
    return res.status(200).json({
      success: true,
      message: 'Đã mở khóa tài khoản bác sĩ thành công'
    });
  } catch (error) {
    console.error('Unlock doctor account error:', error);
    return res.status(500).json({
      success: false,
      message: 'Lỗi khi mở khóa tài khoản bác sĩ',
      error: error.message
    });
  }
};

// Cập nhật thông tin hồ sơ bác sĩ
exports.updateDoctorProfile = async (req, res) => {
  try {
    const userId = req.user.id;

    // Tìm doctor record dựa vào user id
    const doctor = await Doctor.findOne({ user: mongoose.Types.ObjectId(req.user.id) });
    if (!doctor) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy thông tin bác sĩ'
      });
    }

    // Thông tin cơ bản từ bảng User
    const userUpdateData = {};
    const doctorUpdateData = {};

    // Cập nhật thông tin cơ bản (bảng User)
    if (req.body.fullName) userUpdateData.fullName = req.body.fullName;
    if (req.body.phoneNumber) userUpdateData.phoneNumber = req.body.phoneNumber;
    if (req.body.gender) userUpdateData.gender = req.body.gender;
    if (req.body.address) userUpdateData.address = req.body.address;
    if (req.body.dateOfBirth) userUpdateData.dateOfBirth = new Date(req.body.dateOfBirth);

    // Cập nhật thông tin mở rộng (bảng Doctor)
    if (req.body.title) doctorUpdateData.title = req.body.title;
    if (req.body.description) doctorUpdateData.description = req.body.description;
    if (req.body.education) doctorUpdateData.education = req.body.education;
    if (req.body.experience) doctorUpdateData.experience = req.body.experience;
    if (req.body.consultationFee) doctorUpdateData.consultationFee = req.body.consultationFee;
    if (req.body.languages) doctorUpdateData.languages = req.body.languages;
    if (req.body.certifications) doctorUpdateData.certifications = req.body.certifications;
    if (req.body.isAvailable !== undefined) doctorUpdateData.isAvailable = req.body.isAvailable;

    // Cập nhật dữ liệu vào cả hai bảng
    const updatedUser = await User.findByIdAndUpdate(userId, userUpdateData, { new: true })
      .select('-passwordHash -verificationToken -verificationTokenExpires -resetPasswordToken -resetPasswordExpires -otpCode -otpExpires');

    const updatedDoctor = await Doctor.findByIdAndUpdate(doctor._id, doctorUpdateData, { new: true })
      .populate('user', 'fullName email phoneNumber dateOfBirth gender address avatarUrl')
      .populate('specialtyId', 'name description')
      .populate('hospitalId', 'name address');

    return res.status(200).json({
      success: true,
      data: {
        _id: doctor._id,
        user: updatedUser,
        ...updatedDoctor.toObject()
      },
      message: 'Cập nhật thông tin bác sĩ thành công'
    });
  } catch (error) {
    console.error('Update doctor profile error:', error);
    return res.status(500).json({
      success: false,
      message: 'Lỗi khi cập nhật thông tin bác sĩ',
      error: error.message
    });
  }
};

// Phản hồi đánh giá từ bệnh nhân
exports.replyToReview = async (req, res) => {
  try {
    const { reviewId } = req.params;
    const { content } = req.body;
    const userId = req.user.id;
    
    if (!content) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng nhập nội dung phản hồi'
      });
    }
    
    // Tìm doctor record dựa vào user id
    const doctor = await Doctor.findOne({ user: mongoose.Types.ObjectId(req.user.id) });
    if (!doctor) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy thông tin bác sĩ'
      });
    }
    
    // Tìm đánh giá cần phản hồi
    const Review = require('../models/Review');
    const review = await Review.findById(reviewId);
    
    if (!review) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy đánh giá'
      });
    }
    
    // Kiểm tra đánh giá có phải của bác sĩ này không
    if (review.doctorId.toString() !== doctor._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Bạn không có quyền phản hồi đánh giá này'
      });
    }
    
    // Cập nhật phản hồi
    review.doctorReply = {
      content,
      createdAt: new Date()
    };
    
    await review.save();
    
    // Get user information for avatar
    const user = await require('../models/User').findById(userId);
    
    // Return the updated review with populated fields
    const updatedReview = await Review.findById(reviewId)
      .populate('userId', 'fullName avatarUrl avatar email')
      .populate('appointmentId', 'appointmentCode appointmentDate bookingCode');
    
    return res.status(200).json({
      success: true,
      data: {
        ...updatedReview.toObject(),
        doctorReply: {
          ...review.doctorReply.toObject(),
          userDetails: {
            _id: userId,
            fullName: user?.fullName,
            avatarUrl: user?.avatarUrl,
            avatar: user?.avatar
          }
        }
      },
      message: 'Phản hồi đánh giá thành công'
    });
  } catch (error) {
    console.error('Reply to review error:', error);
    return res.status(500).json({
      success: false,
      message: 'Lỗi khi phản hồi đánh giá',
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
    
    console.log('Fetching favorites for user:', userId);
    
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({
        success: false,
        message: 'ID người dùng không hợp lệ'
      });
    }
    
    // Get user with favorites
    const user = await User.findById(userId);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy người dùng'
      });
    }
    
    // If user has no favorites, return empty array
    if (!user.favorites || user.favorites.length === 0) {
      console.log('User has no favorites');
      return res.status(200).json({
        success: true,
        count: 0,
        data: []
      });
    }
    
    console.log('User favorites:', user.favorites);
    
    // Filter out any invalid ObjectIds before querying
    const validFavoriteIds = user.favorites.filter(id => 
      mongoose.Types.ObjectId.isValid(id)
    );
    
    if (validFavoriteIds.length === 0) {
      console.log('No valid favorite IDs found');
      return res.status(200).json({
        success: true,
        count: 0,
        data: []
      });
    }
    
    console.log('Valid doctor IDs to fetch:', validFavoriteIds);
    
    // Get doctor information with comprehensive details
    const favoriteDoctors = await Doctor.find({
      _id: { $in: validFavoriteIds }
    })
    .populate({
      path: 'user',
      select: 'fullName email phoneNumber avatarUrl gender dateOfBirth address'
    })
    .populate('specialtyId')
    .populate({
      path: 'hospitalId',
      select: 'name address contactInfo email website description logo coordinates'
    })
    .populate('services')
    .populate('certifications');
    
    console.log(`Found ${favoriteDoctors.length} favorite doctors`);
    
    // Add review statistics for each doctor
    const doctorsWithStats = await Promise.all(favoriteDoctors.map(async (doctor) => {
      const docObj = doctor.toObject();
      
      try {
        const Review = require('../models/Review');
        const reviewStats = await Review.aggregate([
          { $match: { doctorId: doctor._id } },
          { $group: {
              _id: null,
              count: { $sum: 1 },
              averageRating: { $avg: '$rating' }
            }
          }
        ]);
        
        if (reviewStats.length > 0) {
          docObj.reviewCount = reviewStats[0].count;
          docObj.averageRating = reviewStats[0].averageRating.toFixed(1);
        } else {
          docObj.reviewCount = 0;
          docObj.averageRating = "0.0";
        }
      } catch (error) {
        console.error('Error getting review stats:', error);
        docObj.reviewCount = 0;
        docObj.averageRating = "0.0";
      }
      
      return docObj;
    }));
    
    return res.status(200).json({
      success: true,
      count: doctorsWithStats.length,
      data: doctorsWithStats
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
 * @desc    Check if doctor is in favorites
 * @route   GET /api/doctors/:id/favorite
 * @access  Private
 */
exports.checkFavorite = async (req, res) => {
  try {
    const doctorId = req.params.id;
    
    // If user is not authenticated, return false for isFavorite
    if (!req.user) {
      return res.status(200).json({
        success: true,
        data: {
          isFavorite: false
        }
      });
    }
    
    const userId = req.user.id;
    
    console.log(`Checking if doctor ${doctorId} is in favorites for user ${userId}`);
    
    if (!mongoose.Types.ObjectId.isValid(doctorId)) {
      return res.status(400).json({
        success: false,
        message: 'ID bác sĩ không hợp lệ'
      });
    }
    
    // We don't need to check if the doctor exists - just check if it's in favorites
    
    // Get user
    const user = await User.findById(userId);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy người dùng'
      });
    }
    
    // Check if doctor is in favorites
    const isFavorite = user.favorites && 
                       user.favorites.some(id => id.toString() === doctorId.toString());
    
    console.log(`Doctor ${doctorId} is ${isFavorite ? '' : 'not '}in favorites for user ${userId}`);
    
    return res.status(200).json({
      success: true,
      data: {
        isFavorite: !!isFavorite
      }
    });
  } catch (error) {
    console.error('Check favorite error:', error);
    return res.status(500).json({
      success: false,
      message: 'Lỗi khi kiểm tra trạng thái yêu thích',
      error: error.message
    });
  }
};

/**
 * @desc    Lấy thống kê cho trang dashboard của bác sĩ
 * @route   GET /api/doctors/dashboard/stats
 * @access  Private (Doctor only)
 */
exports.getDoctorDashboardStats = async (req, res) => {
  try {
    const doctorId = req.user.id;
    
    // Tìm thông tin bác sĩ
    const doctor = await Doctor.findOne({ user: doctorId });
    if (!doctor) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy thông tin bác sĩ'
      });
    }

    // Lấy ngày hiện tại
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Lấy đánh giá trung bình và số lượng đánh giá
    const reviewStats = await Review.aggregate([
      { $match: { doctorId: doctor._id } },
      { 
        $group: {
          _id: null,
          averageRating: { $avg: '$rating' },
          reviewsCount: { $sum: 1 }
        }
      }
    ]);

    // Lấy số lượng lịch hẹn hôm nay
    const todayAppointments = await Appointment.countDocuments({
      doctorId: doctor._id,
      appointmentDate: { $gte: today, $lt: tomorrow }
    });

    // Lấy số lượng lịch hẹn chờ xác nhận
    const pendingAppointments = await Appointment.countDocuments({
      doctorId: doctor._id,
      status: 'pending'
    });

    // Lấy số lượng lịch hẹn đã hoàn thành
    const completedAppointments = await Appointment.countDocuments({
      doctorId: doctor._id,
      status: 'completed'
    });

    // Lấy tổng số bệnh nhân đã khám (distinct patientId từ completed appointments)
    const totalPatients = await Appointment.distinct('patientId', {
      doctorId: doctor._id
    });

    // Tạo object kết quả
    const stats = {
      averageRating: reviewStats.length > 0 ? reviewStats[0].averageRating : 0,
      reviewsCount: reviewStats.length > 0 ? reviewStats[0].reviewsCount : 0,
      todayAppointments,
      pendingAppointments,
      completedAppointments,
      totalPatients: totalPatients.length
    };

    return res.status(200).json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('Error getting doctor dashboard stats:', error);
    return res.status(500).json({
      success: false,
      message: 'Lỗi khi lấy thống kê trang dashboard',
      error: error.message
    });
  }
};

// GET /api/doctors/:id/services - Dịch vụ của bác sĩ
exports.getDoctorServices = async (req, res) => {
  try {
    const { id } = req.params;
    
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'ID bác sĩ không hợp lệ'
      });
    }
    
    // Find doctor and their services
    const doctor = await Doctor.findById(id);
    
    if (!doctor) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy bác sĩ'
      });
    }
    
    // If doctor has no services
    if (!doctor.services || !Array.isArray(doctor.services) || doctor.services.length === 0) {
      return res.status(200).json({
        success: true,
        message: 'Bác sĩ này không có dịch vụ nào',
        count: 0,
        data: []
      });
    }
    
    // Find services by IDs
    const Service = require('../models/Service');
    const services = await Service.find({
      _id: { $in: doctor.services },
      isActive: true
    }).populate('specialtyId', 'name');
    
    return res.status(200).json({
      success: true,
      count: services.length,
      data: services
    });
    
  } catch (error) {
    console.error('Get doctor services error:', error);
    return res.status(500).json({
      success: false,
      message: 'Lỗi khi lấy danh sách dịch vụ của bác sĩ',
      error: error.message
    });
  }
};

exports.getDoctorProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    
    // Tìm doctor record dựa vào user id với nhiều thông tin hơn
    const doctor = await Doctor.findOne({ user: userId })
      .populate('user', 'fullName email phoneNumber gender dateOfBirth address avatarUrl isVerified role roleType')
      .populate('specialtyId', 'name description icon')
      .populate('hospitalId', 'name address contactInfo email website description logo coordinates')
      .populate('services', 'name price duration description')
      .populate('reviews.patientId', 'fullName avatarUrl');
    
    if (!doctor) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy thông tin bác sĩ'
      });
    }
    
    // Lấy thông tin người dùng
    const user = await User.findById(userId).select('-passwordHash -verificationToken -verificationTokenExpires -resetPasswordToken -resetPasswordExpires -otpCode -otpExpires');
    
    // Lấy thông tin lịch làm việc
    const schedules = await Schedule.find({ doctorId: doctor._id, date: { $gte: new Date() } })
      .sort({ date: 1 })
      .limit(10);
    
    // Lấy số lượng bệnh nhân đã khám
    const patientCount = await Appointment.countDocuments({
      doctorId: doctor._id,
      status: 'completed'
    });
    
    // Lấy số lượng cuộc hẹn sắp tới
    const upcomingAppointments = await Appointment.countDocuments({
      doctorId: doctor._id,
      appointmentDate: { $gte: new Date() },
      status: { $in: ['pending', 'confirmed'] }
    });
    
    // Kết hợp thông tin từ cả bảng User và Doctor
    const doctorProfile = {
      _id: doctor._id,
      user: user,
      title: doctor.title,
      description: doctor.description,
      bio: doctor.bio,
      education: doctor.education,
      experience: doctor.experience,
      languages: doctor.languages,
      certifications: doctor.certifications,
      consultationFee: doctor.consultationFee,
      isAvailable: doctor.isAvailable,
      averageRating: doctor.averageRating,
      totalReviews: doctor.reviews ? doctor.reviews.length : 0,
      specialty: doctor.specialtyId,
      hospital: doctor.hospitalId,
      services: doctor.services,
      stats: {
        patientCount,
        upcomingAppointments,
        completedAppointments: patientCount
      },
      upcomingSchedules: schedules
    };
    
    return res.status(200).json({
      success: true,
      data: doctorProfile
    });
  } catch (error) {
    console.error('Get doctor profile error:', error);
    return res.status(500).json({
      success: false,
      message: 'Lỗi khi lấy thông tin hồ sơ bác sĩ',
      error: error.message
    });
  }
};

/**
 * @desc    Get reviews for the logged-in doctor
 * @route   GET /api/doctors/reviews
 * @access  Private (Doctor only)
 * @query   page, limit, sort, order
 */
exports.getDoctorReviews = async (req, res) => {
  try {
    // Use the doctor data already attached by middleware
    const doctor = req.doctorData;
    
    // Get pagination parameters
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    
    // Get sorting parameters
    const sort = req.query.sort || 'createdAt';
    const order = req.query.order === 'asc' ? 1 : -1;
    
    // Create sort object
    const sortObj = {};
    sortObj[sort] = order;
    
    // Find reviews for this doctor
    const reviews = await Review.find({ doctorId: doctor._id })
      .populate('userId', 'fullName avatarUrl')
      .populate('appointmentId', 'appointmentDate bookingCode')
      .sort(sortObj)
      .skip(skip)
      .limit(limit);
    
    // Get total count for pagination
    const total = await Review.countDocuments({ doctorId: doctor._id });
    
    // Calculate rating statistics
    const ratingStats = await Review.aggregate([
      { $match: { doctorId: doctor._id } },
      { 
        $group: {
          _id: '$rating',
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: -1 } }
    ]);
    
    // Create stats object with counts for each rating (5 to 1)
    const stats = {
      5: 0, 4: 0, 3: 0, 2: 0, 1: 0,
      averageRating: 0,
      total: total
    };
    
    // Fill in actual counts from aggregation
    ratingStats.forEach(item => {
      stats[item._id] = item.count;
    });
    
    // Calculate average
    if (total > 0) {
      const sum = ratingStats.reduce((acc, curr) => acc + (curr._id * curr.count), 0);
      stats.averageRating = parseFloat((sum / total).toFixed(1));
    }
    
    // Populate user information for each reply
    const reviewsWithPopulatedReplies = await Promise.all(reviews.map(async (review) => {
      const reviewObj = review.toObject();
      
      if (reviewObj.replies && reviewObj.replies.length > 0) {
        reviewObj.replies = await Promise.all(reviewObj.replies.map(async (reply) => {
          const user = await User.findById(reply.userId).select('fullName avatarUrl');
          return {
            ...reply,
            user: user ? {
              _id: user._id,
              fullName: user.fullName,
              avatarUrl: user.avatarUrl
            } : null
          };
        }));
      }
      
      return reviewObj;
    }));
    
    return res.status(200).json({
      success: true,
      data: reviewsWithPopulatedReplies,
      stats: stats,
      pagination: {
        total,
        totalPages: Math.ceil(total / limit),
        currentPage: page,
        perPage: limit
      }
    });
    
  } catch (error) {
    console.error('Get doctor reviews error:', error);
    return res.status(500).json({
      success: false,
      message: 'Lỗi khi lấy danh sách đánh giá',
      error: error.message
    });
  }
};

/**
 * @desc    Get list of patients seen by the doctor
 * @route   GET /api/doctors/patients
 * @access  Private (Doctor only)
 * @query   page, limit, search, sort, order
 */
exports.getDoctorPatients = async (req, res) => {
  try {
    // Use doctorData from middleware if available, otherwise fetch
    let doctor;
    if (req.doctorData) {
      doctor = req.doctorData;
    } else {
      doctor = await Doctor.findOne({ user: req.user.id });
      if (!doctor) {
        return res.status(404).json({
          success: false,
          message: 'Không tìm thấy thông tin bác sĩ'
        });
      }
    }
    
    // Get pagination parameters
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    
    // Get search parameter
    const search = req.query.search || '';
    
    // Get sorting parameters
    const sort = req.query.sort || 'lastVisit';
    const order = req.query.order === 'asc' ? 1 : -1;
    
    // Create sort object
    const sortObj = {};
    sortObj[sort] = order;
    
    // Find all completed appointments for this doctor
    const appointments = await Appointment.find({
      doctorId: doctor._id,
      status: 'completed'
    });
    
    // Extract distinct patient IDs
    const patientIds = [...new Set(appointments.map(app => app.patientId.toString()))];
    
    // Prepare search query for patients
    const searchQuery = {
      _id: { $in: patientIds }
    };
    
    // Add search term if provided
    if (search) {
      searchQuery.$or = [
        { fullName: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { phoneNumber: { $regex: search, $options: 'i' } }
      ];
    }
    
    // Find patients
    const patients = await User.find(searchQuery)
      .select('fullName email phoneNumber gender dateOfBirth address avatarUrl')
      .skip(skip)
      .limit(limit);
      
    // Get total count for pagination
    const total = await User.countDocuments(searchQuery);
    
    // Enhance patient data with additional information
    const enhancedPatients = await Promise.all(patients.map(async (patient) => {
      const patientObj = patient.toObject();
      
      // Get last visit date
      const lastAppointment = await Appointment.findOne({
        doctorId: doctor._id,
        patientId: patient._id,
        status: 'completed'
      }).sort({ appointmentDate: -1 });
      
      patientObj.lastVisit = lastAppointment ? lastAppointment.appointmentDate : null;
      
      // Get total visits
      patientObj.visitCount = await Appointment.countDocuments({
        doctorId: doctor._id,
        patientId: patient._id,
        status: 'completed'
      });
      
      // Get upcoming appointment
      const upcomingAppointment = await Appointment.findOne({
        doctorId: doctor._id,
        patientId: patient._id,
        status: { $in: ['pending', 'confirmed'] },
        appointmentDate: { $gte: new Date() }
      }).sort({ appointmentDate: 1 });
      
      patientObj.upcomingAppointment = upcomingAppointment ? {
        _id: upcomingAppointment._id,
        date: upcomingAppointment.appointmentDate,
        status: upcomingAppointment.status,
        bookingCode: upcomingAppointment.bookingCode
      } : null;
      
      return patientObj;
    }));
    
    return res.status(200).json({
      success: true,
      data: enhancedPatients,
      pagination: {
        total,
        totalPages: Math.ceil(total / limit),
        currentPage: page,
        perPage: limit
      }
    });
    
  } catch (error) {
    console.error('Get doctor patients error:', error);
    return res.status(500).json({
      success: false,
      message: 'Lỗi khi lấy danh sách bệnh nhân',
      error: error.message
    });
  }
}; 