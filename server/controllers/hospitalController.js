const Hospital = require('../models/Hospital');
const mongoose = require('mongoose');
const asyncHandler = require('express-async-handler');

/**
 * @desc    Create new hospital/branch
 * @route   POST /api/admin/branches
 * @access  Private (Admin)
 */
exports.createHospital = async (req, res) => {
  try {
    const {
      name,
      address,
      contactInfo,
      workingHours,
      specialties,
      services,
      facilities,
      description,
      images,
      isMainHospital,
      parentHospital,
      location
    } = req.body;

    // Validate required fields
    if (!name || !address) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng cung cấp tên và địa chỉ của chi nhánh'
      });
    }

    // Kiểm tra độ dài tên bệnh viện
    if (name.length < 3 || name.length > 100) {
      return res.status(400).json({
        success: false,
        message: 'Tên bệnh viện phải có độ dài từ 3 đến 100 ký tự'
      });
    }

    // Kiểm tra tên bệnh viện đã tồn tại chưa
    const existingHospital = await Hospital.findOne({ name });
    if (existingHospital) {
      return res.status(400).json({
        success: false,
        message: 'Tên bệnh viện đã tồn tại trong hệ thống'
      });
    }

    // Kiểm tra thông tin liên hệ
    if (contactInfo) {
      // Kiểm tra số điện thoại
      if (!contactInfo.phone || !/^[0-9]{10,11}$/.test(contactInfo.phone)) {
        return res.status(400).json({
          success: false,
          message: 'Số điện thoại không hợp lệ (phải từ 10-11 số)'
        });
      }

      // Kiểm tra định dạng email nếu có
      if (contactInfo.email && !/^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/.test(contactInfo.email)) {
        return res.status(400).json({
          success: false,
          message: 'Định dạng email không hợp lệ'
        });
      }
    }

    // Kiểm tra mối quan hệ parent-child
    if (isMainHospital && parentHospital) {
      return res.status(400).json({
        success: false,
        message: 'Bệnh viện chính không thể có bệnh viện cha'
      });
    }

    if (parentHospital) {
      if (!mongoose.Types.ObjectId.isValid(parentHospital)) {
        return res.status(400).json({
          success: false,
          message: 'ID bệnh viện cha không hợp lệ'
        });
      }

      const parentExists = await Hospital.findById(parentHospital);
      if (!parentExists) {
        return res.status(400).json({
          success: false,
          message: 'Không tìm thấy bệnh viện cha'
        });
      }

      if (!parentExists.isMainHospital) {
        return res.status(400).json({
          success: false,
          message: 'Bệnh viện cha phải là bệnh viện chính'
        });
      }
    }

    // Kiểm tra tọa độ địa lý
    if (location && location.coordinates) {
      const [longitude, latitude] = location.coordinates;
      
      // Kiểm tra tọa độ hợp lệ (longitude: -180 to 180, latitude: -90 to 90)
      if (longitude < -180 || longitude > 180 || latitude < -90 || latitude > 90) {
        return res.status(400).json({
          success: false,
          message: 'Tọa độ địa lý không hợp lệ'
        });
      }
    }

    // Kiểm tra thời gian làm việc
    if (workingHours) {
      const daysOfWeek = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
      
      for (const day of daysOfWeek) {
        if (workingHours[day]) {
          const { open, close, isOpen } = workingHours[day];
          
          // Nếu ngày đó mở cửa, phải có giờ mở và đóng cửa
          if (isOpen && (!open || !close)) {
            return res.status(400).json({
              success: false,
              message: `Ngày ${day} được đánh dấu là mở cửa nhưng không có giờ mở/đóng cửa`
            });
          }
          
          // Kiểm tra định dạng thời gian (HH:MM)
          if (open && !/^([01]\d|2[0-3]):([0-5]\d)$/.test(open)) {
            return res.status(400).json({
              success: false, 
              message: `Định dạng giờ mở cửa không hợp lệ cho ngày ${day}`
            });
          }
          
          if (close && !/^([01]\d|2[0-3]):([0-5]\d)$/.test(close)) {
            return res.status(400).json({
              success: false,
              message: `Định dạng giờ đóng cửa không hợp lệ cho ngày ${day}`
            });
          }
          
          // Kiểm tra thời gian đóng cửa phải sau thời gian mở cửa
          if (open && close) {
            const openTime = new Date(`1970-01-01T${open}:00`);
            const closeTime = new Date(`1970-01-01T${close}:00`);
            
            if (closeTime <= openTime) {
              return res.status(400).json({
                success: false,
                message: `Thời gian đóng cửa phải sau thời gian mở cửa cho ngày ${day}`
              });
            }
          }
        }
      }
    }

    // Kiểm tra ID chuyên khoa có tồn tại trong database không
    if (specialties && Array.isArray(specialties) && specialties.length > 0) {
      const Specialty = require('../models/Specialty');
      
      // Kiểm tra từng ID chuyên khoa
      for (const specialtyId of specialties) {
        if (!mongoose.Types.ObjectId.isValid(specialtyId)) {
          return res.status(400).json({
            success: false,
            message: `ID chuyên khoa không hợp lệ: ${specialtyId}`
          });
        }
        
        const specialtyExists = await Specialty.findById(specialtyId);
        if (!specialtyExists) {
          return res.status(404).json({
            success: false,
            message: `Không tìm thấy chuyên khoa với ID: ${specialtyId}`
          });
        }
      }
    }
    
    // Kiểm tra dịch vụ nếu có
    if (services && Array.isArray(services) && services.length > 0) {
      const Service = require('../models/Service');
      
      // Kiểm tra từng ID dịch vụ
      for (const serviceId of services) {
        if (!mongoose.Types.ObjectId.isValid(serviceId)) {
          return res.status(400).json({
            success: false,
            message: `ID dịch vụ không hợp lệ: ${serviceId}`
          });
        }
        
        const serviceExists = await Service.findById(serviceId);
        if (!serviceExists) {
          return res.status(404).json({
            success: false,
            message: `Không tìm thấy dịch vụ với ID: ${serviceId}`
          });
        }
      }
    }

    // Create new hospital
    const hospital = await Hospital.create({
      name,
      address,
      contactInfo,
      workingHours,
      specialties,
      services,
      facilities,
      description,
      images
    });
    
    // Sau khi tạo bệnh viện, tạo các phòng khám nếu có yêu cầu
    if (req.body.rooms && Array.isArray(req.body.rooms) && req.body.rooms.length > 0) {
      const Room = require('../models/Room');
      const rooms = [];
      
      for (const roomData of req.body.rooms) {
        // Kiểm tra các trường bắt buộc của phòng
        if (!roomData.name || !roomData.number) {
          continue; // Bỏ qua phòng không có thông tin đầy đủ
        }
        
        // Kiểm tra nếu có specialtyId thì phải tồn tại
        if (roomData.specialtyId) {
          if (!mongoose.Types.ObjectId.isValid(roomData.specialtyId)) {
            continue; // Bỏ qua phòng có specialtyId không hợp lệ
          }
          
          const Specialty = require('../models/Specialty');
          const specialtyExists = await Specialty.findById(roomData.specialtyId);
          if (!specialtyExists) {
            continue; // Bỏ qua phòng có chuyên khoa không tồn tại
          }
        }
        
        // Tạo phòng mới
        const newRoom = await Room.create({
          ...roomData,
          hospitalId: hospital._id
        });
        
        rooms.push(newRoom);
      }
      
      // Nếu có phòng được tạo thành công, trả về thông tin
      if (rooms.length > 0) {
        return res.status(201).json({
          success: true,
          data: { hospital, rooms },
          message: `Tạo chi nhánh mới thành công với ${rooms.length} phòng khám`
        });
      }
    }

    return res.status(201).json({
      success: true,
      data: hospital,
      message: 'Tạo chi nhánh mới thành công'
    });
  } catch (error) {
    console.error('Create hospital error:', error);
    return res.status(500).json({
      success: false,
      message: 'Lỗi khi tạo chi nhánh mới',
      error: error.message
    });
  }
};

/**
 * @desc    Update hospital/branch
 * @route   PUT /api/admin/branches/:id
 * @access  Private (Admin)
 */
exports.updateHospital = async (req, res) => {
  try {
    const { id } = req.params;
    
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'ID chi nhánh không hợp lệ'
      });
    }

    const hospital = await Hospital.findById(id);
    
    if (!hospital) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy chi nhánh'
      });
    }

    // Kiểm tra ID chuyên khoa có tồn tại trong database không
    if (req.body.specialties && Array.isArray(req.body.specialties) && req.body.specialties.length > 0) {
      const Specialty = require('../models/Specialty');
      
      // Kiểm tra từng ID chuyên khoa
      for (const specialtyId of req.body.specialties) {
        if (!mongoose.Types.ObjectId.isValid(specialtyId)) {
          return res.status(400).json({
            success: false,
            message: `ID chuyên khoa không hợp lệ: ${specialtyId}`
          });
        }
        
        const specialtyExists = await Specialty.findById(specialtyId);
        if (!specialtyExists) {
          return res.status(404).json({
            success: false,
            message: `Không tìm thấy chuyên khoa với ID: ${specialtyId}`
          });
        }
      }
    }
    
    // Kiểm tra dịch vụ nếu có
    if (req.body.services && Array.isArray(req.body.services) && req.body.services.length > 0) {
      const Service = require('../models/Service');
      
      // Kiểm tra từng ID dịch vụ
      for (const serviceId of req.body.services) {
        if (!mongoose.Types.ObjectId.isValid(serviceId)) {
          return res.status(400).json({
            success: false,
            message: `ID dịch vụ không hợp lệ: ${serviceId}`
          });
        }
        
        const serviceExists = await Service.findById(serviceId);
        if (!serviceExists) {
          return res.status(404).json({
            success: false,
            message: `Không tìm thấy dịch vụ với ID: ${serviceId}`
          });
        }
      }
    }

    // Update hospital fields
    const updatedHospital = await Hospital.findByIdAndUpdate(
      id,
      { $set: req.body },
      { new: true, runValidators: true }
    );

    // Logic cập nhật dịch vụ & chuyên khoa kèm theo
    if (req.body.specialties || req.body.services) {
      try {
        // Cập nhật bác sĩ có liên quan đến chi nhánh này
        const Doctor = require('../models/Doctor');
        
        // Lưu ý: doctorSchema.specialtyId là một ObjectId đơn lẻ, không phải mảng
        // Không thể đặt một mảng vào specialtyId, các bác sĩ nên chọn một chuyên khoa chính
        
        // Không cập nhật specialtyId của bác sĩ khi cập nhật bệnh viện
        await Doctor.updateMany(
          { hospitalId: id },
          { $set: { 
            services: req.body.services || hospital.services
          }}
        );
      } catch (updateError) {
        console.error('Error updating related doctors:', updateError);
        // Tiếp tục xử lý, không trả về lỗi
      }
    }

    return res.status(200).json({
      success: true,
      data: updatedHospital,
      message: 'Cập nhật chi nhánh thành công'
    });
  } catch (error) {
    console.error('Update hospital error:', error);
    return res.status(500).json({
      success: false,
      message: 'Lỗi khi cập nhật chi nhánh',
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
      details: error.name === 'CastError' ? `Không thể chuyển đổi giá trị cho trường "${error.path}"` : undefined
    });
  }
};

/**
 * @desc    Delete hospital/branch
 * @route   DELETE /api/admin/branches/:id
 * @access  Private (Admin)
 */
exports.deleteHospital = async (req, res) => {
  try {
    const { id } = req.params;
    
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'ID chi nhánh không hợp lệ'
      });
    }

    const hospital = await Hospital.findById(id);
    
    if (!hospital) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy chi nhánh'
      });
    }

    // Check if hospital has associated doctors
    const Doctor = require('../models/Doctor');
    const doctorsCount = await Doctor.countDocuments({ hospitalId: id });
    
    if (doctorsCount > 0) {
      return res.status(400).json({
        success: false,
        message: 'Không thể xóa chi nhánh có bác sĩ liên kết. Vui lòng xóa bác sĩ hoặc chuyển họ sang chi nhánh khác'
      });
    }

    // Check if hospital has associated appointments
    const Appointment = require('../models/Appointment');
    const appointmentsCount = await Appointment.countDocuments({ hospitalId: id });
    
    if (appointmentsCount > 0) {
      return res.status(400).json({
        success: false,
        message: 'Không thể xóa chi nhánh có lịch hẹn. Vui lòng xóa các lịch hẹn trước'
      });
    }

    await Hospital.findByIdAndDelete(id);

    return res.status(200).json({
      success: true,
      message: 'Xóa chi nhánh thành công'
    });
  } catch (error) {
    console.error('Delete hospital error:', error);
    return res.status(500).json({
      success: false,
      message: 'Lỗi khi xóa chi nhánh',
      error: error.message
    });
  }
};

/**
 * @desc    Get all hospitals
 * @route   GET /api/admin/hospitals
 * @access  Private (Admin)
 */
exports.getHospitals = async (req, res) => {
  try {
    const { 
      page = 1,
      limit = 10,
      isActive,
      province = 'all',
      search = ''
    } = req.query;
    
    // Build query
    const query = {};
    
    // Filter by isActive status
    if (isActive !== undefined) {
      query.isActive = isActive === 'true';
    }
    
    // Filter by province
    if (province && province !== 'all') {
      query.province = { $regex: province, $options: 'i' };
    }
    
    // Search by name, address, email
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { address: { $regex: search, $options: 'i' } },
        { 'contactInfo.email': { $regex: search, $options: 'i' } }
      ];
    }
    
    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    // Execute query with pagination
    const hospitals = await Hospital.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));
    
    // Count total matching documents
    const total = await Hospital.countDocuments(query);
    
    // Calculate total pages
    const totalPages = Math.ceil(total / parseInt(limit));
    
    return res.status(200).json({
      success: true,
      data: {
        hospitals,
      total,
        totalPages,
        currentPage: parseInt(page)
      }
    });
  } catch (error) {
    console.error('Get hospitals error:', error);
    return res.status(500).json({
      success: false,
      message: 'Lỗi khi lấy danh sách bệnh viện',
      error: error.message
    });
  }
};

/**
 * @desc    Get hospital/branch by ID
 * @route   GET /api/admin/branches/:id
 * @access  Private (Admin)
 */
exports.getHospitalById = async (req, res) => {
  try {
    const { id } = req.params;
    
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'ID chi nhánh không hợp lệ'
      });
    }
    
    const hospital = await Hospital.findById(id);
    
    if (!hospital) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy chi nhánh'
      });
    }
    
    return res.status(200).json({
      success: true,
      data: hospital
    });
  } catch (error) {
    console.error('Get hospital detail error:', error);
    return res.status(500).json({
      success: false,
      message: 'Lỗi khi lấy thông tin chi tiết chi nhánh',
      error: error.message
    });
  }
};

/**
 * @desc    Upload hospital image
 * @route   POST /api/admin/hospitals/:id/image
 * @access  Private (Admin)
 */
exports.uploadHospitalImage = async (req, res) => {
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
        message: 'ID bệnh viện không hợp lệ'
      });
    }

    // Kiểm tra tệp ảnh
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng tải lên một tệp ảnh'
      });
    }

    // Tìm bệnh viện
    const hospital = await Hospital.findById(id);
    if (!hospital) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy bệnh viện'
      });
    }

    // Import Cloudinary config
    const { uploadImage, deleteImage } = require('../config/cloudinary');

    // Xóa ảnh cũ nếu có
    if (hospital.image && hospital.image.publicId) {
      await deleteImage(hospital.image.publicId);
    }

    // Tạo buffer từ dữ liệu file trong memory
    const buffer = req.file.buffer;
    
    // Tạo base64 string từ buffer để tải lên Cloudinary
    const base64String = `data:${req.file.mimetype};base64,${buffer.toString('base64')}`;

    // Tải ảnh lên Cloudinary
    const cloudinaryResult = await uploadImage(base64String, `hospitals/${hospital._id}`);

    // Cập nhật thông tin ảnh trong database
    const updatedHospital = await Hospital.findByIdAndUpdate(
      id,
      { 
        image: cloudinaryResult,
        imageUrl: cloudinaryResult.secureUrl // Cập nhật cả imageUrl để tương thích với code cũ
      },
      { new: true }
    );

    return res.status(200).json({
      success: true,
      data: updatedHospital,
      message: 'Cập nhật ảnh bệnh viện thành công'
    });

  } catch (error) {
    console.error('Hospital image upload error:', error);
    return res.status(500).json({
      success: false,
      message: 'Lỗi khi tải lên ảnh bệnh viện',
      error: error.message
    });
  }
};

/**
 * @desc    Get featured reviews for a hospital
 * @route   GET /api/hospitals/:id/featured-reviews
 * @access  Public
 */
exports.getFeaturedReviews = async (req, res) => {
  try {
    const { id } = req.params;
    
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'ID bệnh viện không hợp lệ'
      });
    }
    
    // Kiểm tra bệnh viện tồn tại
    const hospital = await Hospital.findById(id);
    if (!hospital) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy bệnh viện'
      });
    }
    
    // Lấy danh sách đánh giá nổi bật
    const Review = require('../models/Review');
    const featuredReviews = await Review.find({ 
      _id: { $in: hospital.featuredReviews || [] },
      isActive: true
    }).populate('userId', 'fullName avatarUrl')
      .sort({ createdAt: -1 });
    
    return res.status(200).json({
      success: true,
      count: featuredReviews.length,
      data: featuredReviews
    });
  } catch (error) {
    console.error('Get featured reviews error:', error);
    return res.status(500).json({
      success: false,
      message: 'Lỗi khi lấy danh sách đánh giá nổi bật',
      error: error.message
    });
  }
};

// Vietnamese provinces data
const provinces = [
  { code: 1, name: "Hà Nội" },
  { code: 2, name: "TP. Hồ Chí Minh" },
  { code: 3, name: "Đà Nẵng" },
  { code: 4, name: "Hải Phòng" },
  { code: 5, name: "Cần Thơ" },
  { code: 6, name: "An Giang" },
  { code: 7, name: "Bà Rịa - Vũng Tàu" },
  { code: 8, name: "Bắc Giang" },
  { code: 9, name: "Bắc Kạn" },
  { code: 10, name: "Bạc Liêu" },
  { code: 11, name: "Bắc Ninh" },
  { code: 12, name: "Bến Tre" },
  { code: 13, name: "Bình Định" },
  { code: 14, name: "Bình Dương" },
  { code: 15, name: "Bình Phước" },
  { code: 16, name: "Bình Thuận" },
  { code: 17, name: "Cà Mau" },
  { code: 18, name: "Cao Bằng" },
  { code: 19, name: "Đắk Lắk" },
  { code: 20, name: "Đắk Nông" },
  { code: 21, name: "Điện Biên" },
  { code: 22, name: "Đồng Nai" },
  { code: 23, name: "Đồng Tháp" },
  { code: 24, name: "Gia Lai" },
  { code: 25, name: "Hà Giang" },
  { code: 26, name: "Hà Nam" },
  { code: 27, name: "Hà Tĩnh" },
  { code: 28, name: "Hải Dương" },
  { code: 29, name: "Hậu Giang" },
  { code: 30, name: "Hòa Bình" },
  { code: 31, name: "Hưng Yên" },
  { code: 32, name: "Khánh Hòa" },
  { code: 33, name: "Kiên Giang" },
  { code: 34, name: "Kon Tum" },
  { code: 35, name: "Lai Châu" },
  { code: 36, name: "Lâm Đồng" },
  { code: 37, name: "Lạng Sơn" },
  { code: 38, name: "Lào Cai" },
  { code: 39, name: "Long An" },
  { code: 40, name: "Nam Định" },
  { code: 41, name: "Nghệ An" },
  { code: 42, name: "Ninh Bình" },
  { code: 43, name: "Ninh Thuận" },
  { code: 44, name: "Phú Thọ" },
  { code: 45, name: "Phú Yên" },
  { code: 46, name: "Quảng Bình" },
  { code: 47, name: "Quảng Nam" },
  { code: 48, name: "Quảng Ngãi" },
  { code: 49, name: "Quảng Ninh" },
  { code: 50, name: "Quảng Trị" },
  { code: 51, name: "Sóc Trăng" },
  { code: 52, name: "Sơn La" },
  { code: 53, name: "Tây Ninh" },
  { code: 54, name: "Thái Bình" },
  { code: 55, name: "Thái Nguyên" },
  { code: 56, name: "Thanh Hóa" },
  { code: 57, name: "Thừa Thiên Huế" },
  { code: 58, name: "Tiền Giang" },
  { code: 59, name: "Trà Vinh" },
  { code: 60, name: "Tuyên Quang" },
  { code: 61, name: "Vĩnh Long" },
  { code: 62, name: "Vĩnh Phúc" },
  { code: 63, name: "Yên Bái" }
];

/**
 * @desc    Get all provinces
 * @route   GET /api/provinces
 * @access  Public
 */
exports.getProvinces = async (req, res) => {
  try {
    return res.status(200).json({
      success: true,
      data: provinces
    });
  } catch (error) {
    console.error('Get provinces error:', error);
    return res.status(500).json({
      success: false,
      message: 'Lỗi khi lấy danh sách tỉnh thành',
      error: error.message
    });
  }
}; 