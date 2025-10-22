const mongoose = require('mongoose');
const Service = require('../models/Service');
const Specialty = require('../models/Specialty');
const Doctor = require('../models/Doctor');
const ServicePriceHistory = require('../models/ServicePriceHistory');

/**
 * @desc    Create new service
 * @route   POST /api/admin/services
 * @access  Private (Admin)
 */
exports.createService = async (req, res) => {
  try {
    const { 
      name, 
      description,
      shortDescription,
      price, 
      specialtyId,
      duration,
      type,
      preparationGuide,
      aftercareInstructions,
      requiredTests,
      isActive
    } = req.body;

    // Kiểm tra các trường bắt buộc
    if (!name || !price || !specialtyId) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng cung cấp đầy đủ thông tin dịch vụ'
      });
    }

    // Kiểm tra độ dài tên dịch vụ
    if (name.length < 3 || name.length > 100) {
      return res.status(400).json({
        success: false,
        message: 'Tên dịch vụ phải có độ dài từ 3 đến 100 ký tự'
      });
    }

    // Kiểm tra tên dịch vụ đã tồn tại trong chuyên khoa này chưa
    const existingService = await Service.findOne({ 
      name, 
      specialtyId 
    });
    
    if (existingService) {
      return res.status(400).json({
        success: false,
        message: 'Dịch vụ với tên này đã tồn tại trong chuyên khoa này'
      });
    }

    // Kiểm tra giá dịch vụ
    if (typeof price !== 'number' || price < 0 || price > 100000000) {
      return res.status(400).json({
        success: false,
        message: 'Giá dịch vụ không hợp lệ (phải là số dương và không quá 100 triệu)'
      });
    }

    // Kiểm tra thời lượng dịch vụ
    if (duration) {
      if (typeof duration !== 'number' || duration < 10 || duration > 480) {
        return res.status(400).json({
          success: false,
          message: 'Thời lượng dịch vụ không hợp lệ (phải từ 10 đến 480 phút)'
        });
      }
    }

    // Kiểm tra độ dài mô tả ngắn nếu có
    if (shortDescription && shortDescription.length > 200) {
      return res.status(400).json({
        success: false,
        message: 'Mô tả ngắn không được quá 200 ký tự'
      });
    }

    // Kiểm tra độ dài mô tả nếu có
    if (description && description.length > 2000) {
      return res.status(400).json({
        success: false,
        message: 'Mô tả dịch vụ không được quá 2000 ký tự'
      });
    }

    // Validate specialtyId
    if (!mongoose.Types.ObjectId.isValid(specialtyId)) {
      return res.status(400).json({
        success: false,
        message: 'ID chuyên khoa không hợp lệ'
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

    // Kiểm tra chuyên khoa có đang hoạt động không
    if (specialty.isActive === false) {
      return res.status(400).json({
        success: false,
        message: 'Không thể tạo dịch vụ cho chuyên khoa đã ngừng hoạt động'
      });
    }

    // Create new service
    const service = await Service.create({
      name,
      description: description || '',
      shortDescription: shortDescription || '',
      price,
      specialtyId,
      duration: duration || 30, // Default 30 minutes
      type: type || 'examination',
      preparationGuide: preparationGuide || '',
      aftercareInstructions: aftercareInstructions || '',
      requiredTests: requiredTests || [],
      isActive: isActive !== undefined ? isActive : true
    });

    return res.status(201).json({
      success: true,
      data: service,
      message: 'Tạo dịch vụ khám mới thành công'
    });
  } catch (error) {
    console.error('Create service error:', error);
    return res.status(500).json({
      success: false,
      message: 'Lỗi khi tạo dịch vụ khám mới',
      error: error.message
    });
  }
};

/**
 * @desc    Update service
 * @route   PUT /api/admin/services/:id
 * @access  Private (Admin)
 */
exports.updateService = async (req, res) => {
  try {
    const { id } = req.params;
    
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'ID dịch vụ không hợp lệ'
      });
    }

    const service = await Service.findById(id);
    
    if (!service) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy dịch vụ'
      });
    }

    // If specialtyId is provided, validate it
    if (req.body.specialtyId) {
      if (!mongoose.Types.ObjectId.isValid(req.body.specialtyId)) {
        return res.status(400).json({
          success: false,
          message: 'ID chuyên khoa không hợp lệ'
        });
      }

      // Check if specialty exists
      const Specialty = require('../models/Specialty');
      const specialty = await Specialty.findById(req.body.specialtyId);
      if (!specialty) {
        return res.status(404).json({
          success: false,
          message: 'Không tìm thấy chuyên khoa'
        });
      }
    }

    // Track price change if price is being updated
    if (req.body.price !== undefined && req.body.price !== service.price) {
      // Record in price history
      await ServicePriceHistory.create({
        serviceId: id,
        previousPrice: service.price,
        newPrice: req.body.price,
        changedBy: req.user.id,
        reason: req.body.priceChangeReason || 'Cập nhật giá dịch vụ'
      });
    }

    // Update service fields
    const updatedService = await Service.findByIdAndUpdate(
      id,
      { $set: req.body },
      { new: true, runValidators: true }
    );

    // Update doctors associated with this service
    if (req.body.specialtyId && req.body.specialtyId !== service.specialtyId.toString()) {
      // Logic để cập nhật liên kết với bác sĩ
      const Doctor = require('../models/Doctor');
      // Cập nhật các bác sĩ đang cung cấp dịch vụ này
      await Doctor.updateMany(
        { services: id, specialtyId: { $ne: req.body.specialtyId } },
        { $pull: { services: id } }
      );

      // Thêm dịch vụ cho các bác sĩ thuộc chuyên khoa mới
      await Doctor.updateMany(
        { specialtyId: req.body.specialtyId },
        { $addToSet: { services: id } }
      );
    }

    return res.status(200).json({
      success: true,
      data: updatedService,
      message: 'Cập nhật dịch vụ thành công'
    });
  } catch (error) {
    console.error('Update service error:', error);
    return res.status(500).json({
      success: false,
      message: 'Lỗi khi cập nhật dịch vụ',
      error: error.message
    });
  }
};

/**
 * @desc    Delete service
 * @route   DELETE /api/admin/services/:id
 * @access  Private (Admin)
 */
exports.deleteService = async (req, res) => {
  try {
    const { id } = req.params;
    
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'ID dịch vụ không hợp lệ'
      });
    }

    const service = await Service.findById(id);
    
    if (!service) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy dịch vụ'
      });
    }

    // Check if service is used in appointments
    const Appointment = require('../models/Appointment');
    const appointmentsCount = await Appointment.countDocuments({ serviceId: id });
    
    if (appointmentsCount > 0) {
      return res.status(400).json({
        success: false,
        message: 'Không thể xóa dịch vụ đang được sử dụng trong các lịch hẹn'
      });
    }

    // Remove service from doctors
    const Doctor = require('../models/Doctor');
    await Doctor.updateMany(
      { services: id },
      { $pull: { services: id } }
    );

    // Remove service from hospitals
    const Hospital = require('../models/Hospital');
    await Hospital.updateMany(
      { services: id },
      { $pull: { services: id } }
    );

    await Service.findByIdAndDelete(id);

    return res.status(200).json({
      success: true,
      message: 'Xóa dịch vụ thành công'
    });
  } catch (error) {
    console.error('Delete service error:', error);
    return res.status(500).json({
      success: false,
      message: 'Lỗi khi xóa dịch vụ',
      error: error.message
    });
  }
};

/**
 * @desc    Get all services
 * @route   GET /api/admin/services
 * @access  Private (Admin)
 */
exports.getServices = async (req, res) => {
  try {
    const { 
      name,
      specialtyId,
      minPrice,
      maxPrice,
      isActive,
      page = 1,
      limit = 10
    } = req.query;
    
    // Build query
    const query = {};
    
    // Filter by name
    if (name) {
      query.name = { $regex: name, $options: 'i' };
    }
    
    // Filter by specialty
    if (specialtyId) {
      if (!mongoose.Types.ObjectId.isValid(specialtyId)) {
        return res.status(400).json({
          success: false,
          message: 'ID chuyên khoa không hợp lệ'
        });
      }
      query.specialtyId = specialtyId;
    }
    
    // Filter by price range
    if (minPrice || maxPrice) {
      query.price = {};
      if (minPrice) query.price.$gte = Number(minPrice);
      if (maxPrice) query.price.$lte = Number(maxPrice);
    }
    
    // Filter by active status
    if (isActive !== undefined) {
      query.isActive = isActive === 'true';
    }
    
    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    // Execute query with pagination
    const services = await Service.find(query)
      .populate('specialtyId', 'name')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));
    
    // Count total matching documents
    const total = await Service.countDocuments(query);
    
    return res.status(200).json({
      success: true,
      count: services.length,
      total,
      totalPages: Math.ceil(total / limit),
      currentPage: parseInt(page),
      data: services
    });
  } catch (error) {
    console.error('Get services error:', error);
    return res.status(500).json({
      success: false,
      message: 'Lỗi khi lấy danh sách dịch vụ',
      error: error.message
    });
  }
};

/**
 * @desc    Get service by ID
 * @route   GET /api/admin/services/:id
 * @access  Private (Admin)
 */
exports.getServiceById = async (req, res) => {
  try {
    const { id } = req.params;
    
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'ID dịch vụ không hợp lệ'
      });
    }
    
    const service = await Service.findById(id)
      .populate('specialtyId', 'name description imageUrl');
    
    if (!service) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy dịch vụ'
      });
    }
    
    return res.status(200).json({
      success: true,
      data: service
    });
  } catch (error) {
    console.error('Get service detail error:', error);
    return res.status(500).json({
      success: false,
      message: 'Lỗi khi lấy thông tin chi tiết dịch vụ',
      error: error.message
    });
  }
};

/**
 * @desc    Upload service image
 * @route   POST /api/admin/services/:id/image
 * @access  Private (Admin)
 */
exports.uploadServiceImage = async (req, res) => {
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
        message: 'ID dịch vụ không hợp lệ'
      });
    }

    // Kiểm tra tệp ảnh
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng tải lên một tệp ảnh'
      });
    }

    // Tìm dịch vụ
    const service = await Service.findById(id);
    if (!service) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy dịch vụ'
      });
    }

    // Import Cloudinary config
    const { uploadImage, deleteImage } = require('../config/cloudinary');

    // Xóa ảnh cũ nếu có
    if (service.image && service.image.publicId) {
      await deleteImage(service.image.publicId);
    }

    // Tạo buffer từ dữ liệu file trong memory
    const buffer = req.file.buffer;
    
    // Tạo base64 string từ buffer để tải lên Cloudinary
    const base64String = `data:${req.file.mimetype};base64,${buffer.toString('base64')}`;

    // Tải ảnh lên Cloudinary
    const cloudinaryResult = await uploadImage(base64String, `services/${service._id}`);

    // Cập nhật thông tin ảnh trong database
    const updatedService = await Service.findByIdAndUpdate(
      id,
      { 
        image: cloudinaryResult,
        imageUrl: cloudinaryResult.secureUrl // Cập nhật cả imageUrl để tương thích với code cũ
      },
      { new: true }
    );

    return res.status(200).json({
      success: true,
      data: updatedService,
      message: 'Cập nhật ảnh dịch vụ thành công'
    });

  } catch (error) {
    console.error('Service image upload error:', error);
    return res.status(500).json({
      success: false,
      message: 'Lỗi khi tải lên ảnh dịch vụ',
      error: error.message
    });
  }
};

/**
 * @desc    Get price history for a service
 * @route   GET /api/admin/services/:id/price-history
 * @access  Private (Admin)
 */
exports.getPriceHistory = async (req, res) => {
  try {
    const { id } = req.params;
    
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'ID dịch vụ không hợp lệ'
      });
    }

    // Check if service exists
    const service = await Service.findById(id);
    if (!service) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy dịch vụ'
      });
    }

    // Get price history
    const priceHistory = await ServicePriceHistory.find({ serviceId: id })
      .sort({ createdAt: -1 })
      .populate('changedBy', 'fullName email')
      .lean();

    // Add current price as the latest entry if it's not in the history yet
    const historyWithCurrentPrice = [...priceHistory];
    
    // If there's no history or the latest history's new price is different from current price
    if (
      priceHistory.length === 0 || 
      priceHistory[0].newPrice !== service.price
    ) {
      historyWithCurrentPrice.unshift({
        serviceId: service._id,
        newPrice: service.price,
        previousPrice: priceHistory.length > 0 ? priceHistory[0].newPrice : null,
        createdAt: service.updatedAt || service.createdAt,
        isCurrent: true
      });
    } else {
      // Mark the first entry as current
      historyWithCurrentPrice[0].isCurrent = true;
    }

    // Get price change statistics
    const stats = {
      currentPrice: service.price,
      initialPrice: historyWithCurrentPrice.length > 0 ? 
        historyWithCurrentPrice[historyWithCurrentPrice.length - 1].previousPrice || service.price : 
        service.price,
      priceChangesCount: priceHistory.length,
      averagePriceChange: 0,
      highestPrice: service.price,
      lowestPrice: service.price,
      totalPriceIncrease: 0,
      totalPriceDecrease: 0
    };

    // Calculate statistics
    if (priceHistory.length > 0) {
      const prices = [service.price]; // start with current price
      let totalIncrease = 0;
      let totalDecrease = 0;
      
      for (const entry of priceHistory) {
        prices.push(entry.previousPrice);
        
        const change = entry.newPrice - entry.previousPrice;
        if (change > 0) {
          totalIncrease += change;
        } else {
          totalDecrease += Math.abs(change);
        }
      }
      
      stats.highestPrice = Math.max(...prices);
      stats.lowestPrice = Math.min(...prices);
      stats.totalPriceIncrease = totalIncrease;
      stats.totalPriceDecrease = totalDecrease;
      stats.averagePriceChange = priceHistory.length > 0 ? 
        (totalIncrease - totalDecrease) / priceHistory.length : 0;
    }

    return res.status(200).json({
      success: true,
      data: {
        service: {
          _id: service._id,
          name: service.name,
          currentPrice: service.price,
          createdAt: service.createdAt,
          updatedAt: service.updatedAt
        },
        priceHistory: historyWithCurrentPrice,
        stats
      }
    });
  } catch (error) {
    console.error('Get price history error:', error);
    return res.status(500).json({
      success: false,
      message: 'Lỗi khi lấy lịch sử giá dịch vụ',
      error: error.message
    });
  }
}; 