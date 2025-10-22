const mongoose = require('mongoose');
const Room = require('../models/Room');

/**
 * @desc    Create new examination room
 * @route   POST /api/admin/rooms
 * @access  Private (Admin)
 */
exports.createRoom = async (req, res) => {
  try {
    const { 
      name, 
      number, 
      floor, 
      type, 
      capacity, 
      description, 
      notes,
      hospitalId, 
      specialtyId, 
      equipment, 
      status, 
      assignedDoctors 
    } = req.body;

    // Validate required fields
    if (!name || !number || !hospitalId) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng cung cấp tên, số phòng và bệnh viện'
      });
    }

    // Kiểm tra độ dài tên phòng
    if (name.length < 2 || name.length > 100) {
      return res.status(400).json({
        success: false,
        message: 'Tên phòng phải có độ dài từ 2 đến 100 ký tự'
      });
    }

    // Kiểm tra định dạng số phòng (chữ và số, không chứa ký tự đặc biệt)
    if (!/^[a-zA-Z0-9\s]{1,10}$/.test(number)) {
      return res.status(400).json({
        success: false,
        message: 'Số phòng không hợp lệ (chỉ chứa chữ, số và không quá 10 ký tự)'
      });
    }

    // Kiểm tra tầng
    if (floor) {
      if (isNaN(Number(floor)) || Number(floor) < 0 || Number(floor) > 50) {
        return res.status(400).json({
          success: false,
          message: 'Số tầng không hợp lệ (phải là số từ 0-50)'
        });
      }
    }

    // Kiểm tra loại phòng
    if (type && !['examination', 'procedure', 'surgery', 'consultation', 'other'].includes(type)) {
      return res.status(400).json({
        success: false,
        message: 'Loại phòng không hợp lệ (phải là một trong: examination, procedure, surgery, consultation, other)'
      });
    }

    // Kiểm tra sức chứa
    if (capacity) {
      if (!Number.isInteger(capacity) || capacity < 1 || capacity > 20) {
        return res.status(400).json({
          success: false,
          message: 'Sức chứa không hợp lệ (phải là số nguyên từ 1-20)'
        });
      }
    }

    // Kiểm tra độ dài mô tả
    if (description && description.length > 500) {
      return res.status(400).json({
        success: false,
        message: 'Mô tả không được vượt quá 500 ký tự'
      });
    }

    // Kiểm tra độ dài ghi chú
    if (notes && notes.length > 500) {
      return res.status(400).json({
        success: false,
        message: 'Ghi chú không được vượt quá 500 ký tự'
      });
    }

    // Kiểm tra trạng thái
    if (status && !['active', 'maintenance', 'inactive'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Trạng thái không hợp lệ (phải là một trong: active, maintenance, inactive)'
      });
    }

    // Kiểm tra thiết bị
    if (equipment && Array.isArray(equipment)) {
      // Kiểm tra độ dài mảng
      if (equipment.length > 20) {
        return res.status(400).json({
          success: false,
          message: 'Danh sách thiết bị không được vượt quá 20 mục'
        });
      }
      
      // Kiểm tra từng thiết bị
      for (const item of equipment) {
        if (typeof item !== 'string' || item.length > 100) {
          return res.status(400).json({
            success: false,
            message: 'Tên thiết bị không hợp lệ hoặc quá dài (tối đa 100 ký tự)'
          });
        }
      }
    }

    // Validate hospitalId
    if (!mongoose.Types.ObjectId.isValid(hospitalId)) {
      return res.status(400).json({
        success: false,
        message: 'ID bệnh viện không hợp lệ'
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

    // Kiểm tra bệnh viện có đang hoạt động không
    if (hospital.isActive === false) {
      return res.status(400).json({
        success: false,
        message: 'Không thể tạo phòng cho bệnh viện đã ngừng hoạt động'
      });
    }

    // Check if specialty exists (if provided)
    if (specialtyId) {
      if (!mongoose.Types.ObjectId.isValid(specialtyId)) {
        return res.status(400).json({
          success: false,
          message: 'ID chuyên khoa không hợp lệ'
        });
      }
      
      const Specialty = require('../models/Specialty');
      const specialty = await Specialty.findById(specialtyId);
      if (!specialty) {
        return res.status(404).json({
          success: false,
          message: 'Không tìm thấy chuyên khoa'
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
        return res.status(400).json({
          success: false,
          message: 'Bệnh viện này chưa có chuyên khoa nào'
        });
      }
    }

    // Validate assignedDoctors if provided
    if (assignedDoctors && assignedDoctors.length > 0) {
      const Doctor = require('../models/Doctor');
      for (const doctorId of assignedDoctors) {
        if (!mongoose.Types.ObjectId.isValid(doctorId)) {
          return res.status(400).json({
            success: false,
            message: 'ID bác sĩ không hợp lệ'
          });
        }
        
        const doctor = await Doctor.findById(doctorId);
        if (!doctor) {
          return res.status(404).json({
            success: false,
            message: `Không tìm thấy bác sĩ với ID: ${doctorId}`
          });
        }
      }
    }

    // Check if room number already exists in the hospital
    const existingRoom = await Room.findOne({ hospitalId, number });
    if (existingRoom) {
      return res.status(400).json({
        success: false,
        message: 'Số phòng đã tồn tại trong bệnh viện này'
      });
    }

    // Create new room
    const room = await Room.create({
      name,
      number,
      floor,
      type: type || 'examination',
      capacity: capacity || 1,
      description,
      notes,
      hospitalId,
      specialtyId,
      equipment,
      status: status || 'active',
      assignedDoctors,
      isActive: true
    });

    // Populate references
    const populatedRoom = await Room.findById(room._id)
      .populate('hospitalId', 'name')
      .populate('specialtyId', 'name')
      .populate('assignedDoctors', 'user');

    return res.status(201).json({
      success: true,
      data: populatedRoom,
      message: 'Tạo phòng khám mới thành công'
    });
  } catch (error) {
    console.error('Create room error:', error);
    return res.status(500).json({
      success: false,
      message: 'Lỗi khi tạo phòng khám mới',
      error: error.message
    });
  }
};

/**
 * @desc    Update examination room
 * @route   PUT /api/admin/rooms/:id
 * @access  Private (Admin)
 */
exports.updateRoom = async (req, res) => {
  try {
    const { id } = req.params;
    
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'ID phòng khám không hợp lệ'
      });
    }

    const room = await Room.findById(id);
    
    if (!room) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy phòng khám'
      });
    }

    // Validate hospitalId if provided
    if (req.body.hospitalId) {
      if (!mongoose.Types.ObjectId.isValid(req.body.hospitalId)) {
        return res.status(400).json({
          success: false,
          message: 'ID bệnh viện không hợp lệ'
        });
      }
      
      const Hospital = require('../models/Hospital');
      const hospital = await Hospital.findById(req.body.hospitalId);
      if (!hospital) {
        return res.status(404).json({
          success: false,
          message: 'Không tìm thấy bệnh viện'
        });
      }
      
      // Nếu cập nhật cả chuyên khoa, kiểm tra bệnh viện có hỗ trợ chuyên khoa không
      if (req.body.specialtyId) {
        if (hospital.specialties && hospital.specialties.length > 0) {
          const hasSpecialty = hospital.specialties.some(id => id.toString() === req.body.specialtyId.toString());
          if (!hasSpecialty) {
            return res.status(400).json({
              success: false,
              message: 'Bệnh viện này không hỗ trợ chuyên khoa đã chọn'
            });
          }
        } else {
          return res.status(400).json({
            success: false,
            message: 'Bệnh viện này chưa có chuyên khoa nào'
          });
        }
      }
    }

    // Nếu chỉ cập nhật chuyên khoa mà không đổi bệnh viện
    if (req.body.specialtyId && !req.body.hospitalId) {
      if (!mongoose.Types.ObjectId.isValid(req.body.specialtyId)) {
        return res.status(400).json({
          success: false,
          message: 'ID chuyên khoa không hợp lệ'
        });
      }
      
      const Specialty = require('../models/Specialty');
      const specialty = await Specialty.findById(req.body.specialtyId);
      if (!specialty) {
        return res.status(404).json({
          success: false,
          message: 'Không tìm thấy chuyên khoa'
        });
      }
      
      // Kiểm tra bệnh viện hiện tại có hỗ trợ chuyên khoa mới không
      const Hospital = require('../models/Hospital');
      const hospital = await Hospital.findById(room.hospitalId);
      
      if (hospital.specialties && hospital.specialties.length > 0) {
        const hasSpecialty = hospital.specialties.some(id => id.toString() === req.body.specialtyId.toString());
        if (!hasSpecialty) {
          return res.status(400).json({
            success: false,
            message: 'Bệnh viện hiện tại không hỗ trợ chuyên khoa đã chọn'
          });
        }
      } else {
        return res.status(400).json({
          success: false,
          message: 'Bệnh viện hiện tại chưa có chuyên khoa nào'
        });
      }
    }

    // If changing room number in the same hospital, check if it exists
    if (req.body.number && req.body.number !== room.number) {
      const hospitalId = req.body.hospitalId || room.hospitalId;
      const existingRoom = await Room.findOne({
        hospitalId,
        number: req.body.number,
        _id: { $ne: id }
      });
      
      if (existingRoom) {
        return res.status(400).json({
          success: false,
          message: 'Số phòng đã tồn tại trong bệnh viện này'
        });
      }
    }

    // Update room fields
    const updatedRoom = await Room.findByIdAndUpdate(
      id,
      { $set: req.body },
      { new: true, runValidators: true }
    )
    .populate('hospitalId', 'name')
    .populate('specialtyId', 'name')
    .populate({
      path: 'assignedDoctors',
      select: 'user title',
      populate: {
        path: 'user',
        select: 'fullName avatarUrl'
      }
    });

    // Update schedules if specialty changes
    if (req.body.specialtyId && room.specialtyId && req.body.specialtyId !== room.specialtyId.toString()) {
      // Logic to update schedules can be added here if needed
    }

    return res.status(200).json({
      success: true,
      data: updatedRoom,
      message: 'Cập nhật phòng khám thành công'
    });
  } catch (error) {
    console.error('Update room error:', error);
    return res.status(500).json({
      success: false,
      message: 'Lỗi khi cập nhật phòng khám',
      error: error.message
    });
  }
};

/**
 * @desc    Delete examination room
 * @route   DELETE /api/admin/rooms/:id
 * @access  Private (Admin)
 */
exports.deleteRoom = async (req, res) => {
  try {
    const { id } = req.params;
    
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'ID phòng khám không hợp lệ'
      });
    }

    const room = await Room.findById(id);
    
    if (!room) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy phòng khám'
      });
    }

    // Check if room is assigned to any active schedules
    const Schedule = require('../models/Schedule');
    const activeSchedules = await Schedule.countDocuments({ 
      'timeSlots.roomId': id,
      date: { $gte: new Date() }
    });
    
    if (activeSchedules > 0) {
      return res.status(400).json({
        success: false,
        message: 'Không thể xóa phòng khám đã được sử dụng trong lịch làm việc'
      });
    }

    // Check if room is used in appointments
    const Appointment = require('../models/Appointment');
    const activeAppointments = await Appointment.countDocuments({ 
      roomId: id,
      appointmentDate: { $gte: new Date() },
      status: { $nin: ['cancelled', 'completed'] }
    });
    
    if (activeAppointments > 0) {
      return res.status(400).json({
        success: false,
        message: 'Không thể xóa phòng khám đã được sử dụng trong lịch hẹn'
      });
    }

    await Room.findByIdAndDelete(id);

    return res.status(200).json({
      success: true,
      message: 'Xóa phòng khám thành công'
    });
  } catch (error) {
    console.error('Delete room error:', error);
    return res.status(500).json({
      success: false,
      message: 'Lỗi khi xóa phòng khám',
      error: error.message
    });
  }
};

/**
 * @desc    Get all examination rooms
 * @route   GET /api/admin/rooms
 * @access  Private (Admin)
 */
exports.getRooms = async (req, res) => {
  try {
    const { 
      hospitalId, 
      specialtyId, 
      type, 
      status,
      number,
      floor, 
      page = 1,
      limit = 10,
      search = ''
    } = req.query;
    
    // Build query
    const query = {};
    
    // Filter by hospital
    if (hospitalId && hospitalId !== 'all') {
      if (!mongoose.Types.ObjectId.isValid(hospitalId)) {
        return res.status(400).json({
          success: false,
          message: 'ID bệnh viện không hợp lệ'
        });
      }
      query.hospitalId = hospitalId;
    }
    
    // Filter by specialty
    if (specialtyId && specialtyId !== 'all') {
      if (!mongoose.Types.ObjectId.isValid(specialtyId)) {
        return res.status(400).json({
          success: false,
          message: 'ID chuyên khoa không hợp lệ'
        });
      }
      query.specialtyId = specialtyId;
    }
    
    // Filter by type
    if (type && type !== 'all') {
      query.type = type;
    }
    
    // Filter by status
    if (status && status !== 'all') {
      query.status = status;
    }
    
    // Filter by number
    if (number) {
      query.number = { $regex: number, $options: 'i' };
    }
    
    // Filter by floor
    if (floor) {
      query.floor = { $regex: floor, $options: 'i' };
    }
    
    // Search by name or description
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { number: { $regex: search, $options: 'i' } }
      ];
    }
    
    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    // Execute query with pagination
    const rooms = await Room.find(query)
      .populate('hospitalId', 'name')
      .populate('specialtyId', 'name')
      .populate({
        path: 'assignedDoctors',
        select: 'user title',
        populate: {
          path: 'user',
          select: 'fullName avatarUrl'
        }
      })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));
    
    // Count total matching documents
    const total = await Room.countDocuments(query);
    
    return res.status(200).json({
      success: true,
      data: {
        rooms,
      count: rooms.length,
      total,
      totalPages: Math.ceil(total / limit),
        currentPage: parseInt(page)
      }
    });
  } catch (error) {
    console.error('Get rooms error:', error);
    return res.status(500).json({
      success: false,
      message: 'Lỗi khi lấy danh sách phòng khám',
      error: error.message
    });
  }
};

/**
 * @desc    Get examination room by ID
 * @route   GET /api/admin/rooms/:id
 * @access  Private (Admin)
 */
exports.getRoomById = async (req, res) => {
  try {
    const { id } = req.params;
    
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'ID phòng khám không hợp lệ'
      });
    }
    
    const room = await Room.findById(id)
      .populate('hospitalId', 'name address')
      .populate('specialtyId', 'name description')
      .populate({
        path: 'assignedDoctors',
        select: 'user title experience',
        populate: {
          path: 'user',
          select: 'fullName avatarUrl email phoneNumber'
        }
      });
    
    if (!room) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy phòng khám'
      });
    }
    
    return res.status(200).json({
      success: true,
      data: room
    });
  } catch (error) {
    console.error('Get room detail error:', error);
    return res.status(500).json({
      success: false,
      message: 'Lỗi khi lấy thông tin chi tiết phòng khám',
      error: error.message
    });
  }
};

/**
 * @desc    Get rooms by hospital
 * @route   GET /api/rooms/hospital/:hospitalId
 * @access  Public
 */
exports.getRoomsByHospital = async (req, res) => {
  try {
    const { hospitalId } = req.params;
    
    if (!mongoose.Types.ObjectId.isValid(hospitalId)) {
      return res.status(400).json({
        success: false,
        message: 'ID bệnh viện không hợp lệ'
      });
    }
    
    const rooms = await Room.find({ 
      hospitalId, 
      status: 'active',
      isActive: true
    })
      .populate('specialtyId', 'name')
      .sort({ floor: 1, number: 1 });
    
    return res.status(200).json({
      success: true,
      count: rooms.length,
      data: rooms
    });
  } catch (error) {
    console.error('Get rooms by hospital error:', error);
    return res.status(500).json({
      success: false,
      message: 'Lỗi khi lấy danh sách phòng khám theo bệnh viện',
      error: error.message
    });
  }
};

/**
 * @desc    Get rooms by doctor
 * @route   GET /api/rooms/doctor/:doctorId
 * @access  Public
 */
exports.getRoomsByDoctor = async (req, res) => {
  try {
    const { doctorId } = req.params;
    
    if (!mongoose.Types.ObjectId.isValid(doctorId)) {
      return res.status(400).json({
        success: false,
        message: 'ID bác sĩ không hợp lệ'
      });
    }
    
    const rooms = await Room.find({ 
      assignedDoctors: doctorId,
      status: 'active',
      isActive: true
    })
      .populate('hospitalId', 'name')
      .populate('specialtyId', 'name')
      .sort({ 'hospitalId.name': 1, floor: 1, number: 1 });
    
    return res.status(200).json({
      success: true,
      count: rooms.length,
      data: rooms
    });
  } catch (error) {
    console.error('Get rooms by doctor error:', error);
    return res.status(500).json({
      success: false,
      message: 'Lỗi khi lấy danh sách phòng khám theo bác sĩ',
      error: error.message
    });
  }
}; 

/**
 * @desc    Upload room image
 * @route   POST /api/admin/rooms/:id/image
 * @access  Private (Admin)
 */
exports.uploadRoomImage = async (req, res) => {
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
        message: 'ID phòng khám không hợp lệ'
      });
    }

    // Kiểm tra tệp ảnh
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng tải lên một tệp ảnh'
      });
    }

    // Tìm phòng
    const room = await Room.findById(id);
    if (!room) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy phòng khám'
      });
    }

    // Import Cloudinary config
    const { uploadImage, deleteImage } = require('../config/cloudinary');

    // Xóa ảnh cũ nếu có
    if (room.image && room.image.publicId) {
      await deleteImage(room.image.publicId);
    }

    // Tạo buffer từ dữ liệu file trong memory
    const buffer = req.file.buffer;
    
    // Tạo base64 string từ buffer để tải lên Cloudinary
    const base64String = `data:${req.file.mimetype};base64,${buffer.toString('base64')}`;

    // Tải ảnh lên Cloudinary
    const cloudinaryResult = await uploadImage(base64String, `rooms/${room._id}`);

    // Cập nhật thông tin ảnh trong database
    const updatedRoom = await Room.findByIdAndUpdate(
      id,
      { 
        image: cloudinaryResult,
        imageUrl: cloudinaryResult.secureUrl
      },
      { new: true }
    );

    return res.status(200).json({
      success: true,
      data: updatedRoom,
      message: 'Cập nhật ảnh phòng khám thành công'
    });

  } catch (error) {
    console.error('Room image upload error:', error);
    return res.status(500).json({
      success: false,
      message: 'Lỗi khi tải lên ảnh phòng khám',
      error: error.message
    });
  }
}; 