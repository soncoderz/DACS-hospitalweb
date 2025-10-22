const mongoose = require('mongoose');
const Coupon = require('../models/Coupon');
const Service = require('../models/Service');
const Specialty = require('../models/Specialty');
const Appointment = require('../models/Appointment');
const ErrorResponse = require('../utils/errorResponse');
const asyncHandler = require('../utils/catchAsync');

/**
 * @desc    Admin tạo mã giảm giá mới
 * @route   POST /api/admin/coupons
 * @access  Private (Admin)
 */
exports.createCoupon = asyncHandler(async (req, res, next) => {
  // Kiểm tra quyền admin
  if (req.user.roleType !== 'admin') {
    return next(new ErrorResponse('Bạn không có quyền thực hiện hành động này', 403));
  }

  // Thêm người tạo
  req.body.createdBy = req.user.id;

  // Validate dữ liệu đầu vào
  const { 
    code, 
    discountType, 
    discountValue, 
    maxDiscount,
    minPurchase,
    startDate, 
    endDate, 
    description,
    usageLimit,
    applicableServices, 
    applicableSpecialties 
  } = req.body;

  // Kiểm tra các trường bắt buộc
  if (!code || !discountType || !discountValue) {
    return next(new ErrorResponse('Vui lòng cung cấp mã, loại và giá trị giảm giá', 400));
  }

  // Kiểm tra định dạng mã
  if (!/^[A-Z0-9]{3,15}$/.test(code.toUpperCase())) {
    return next(new ErrorResponse('Mã giảm giá phải từ 3-15 ký tự và chỉ bao gồm chữ hoa và số', 400));
  }

  // Kiểm tra nếu mã đã tồn tại
  const existingCoupon = await Coupon.findOne({ code: code.toUpperCase() });
  if (existingCoupon) {
    return next(new ErrorResponse('Mã giảm giá này đã tồn tại', 400));
  }

  // Kiểm tra và xác thực loại giảm giá
  if (discountType !== 'percentage' && discountType !== 'fixed') {
    return next(new ErrorResponse('Loại giảm giá phải là percentage hoặc fixed', 400));
  }

  // Kiểm tra giá trị giảm giá
  if (discountType === 'percentage' && (discountValue <= 0 || discountValue > 100)) {
    return next(new ErrorResponse('Phần trăm giảm giá phải nằm trong khoảng 1-100', 400));
  }

  if (discountType === 'fixed' && discountValue <= 0) {
    return next(new ErrorResponse('Giá trị giảm giá phải lớn hơn 0', 400));
  }

  // Kiểm tra ngày bắt đầu và kết thúc
  if (startDate && new Date(startDate) > new Date()) {
    req.body.isActive = false;
  }

  if (endDate && new Date(endDate) < new Date()) {
    return next(new ErrorResponse('Ngày kết thúc không thể ở quá khứ', 400));
  }

  if (startDate && endDate && new Date(startDate) >= new Date(endDate)) {
    return next(new ErrorResponse('Ngày bắt đầu phải trước ngày kết thúc', 400));
  }

  // Kiểm tra dịch vụ áp dụng nếu có
  if (applicableServices && applicableServices.length > 0) {
    for (const serviceId of applicableServices) {
      if (!mongoose.Types.ObjectId.isValid(serviceId)) {
        return next(new ErrorResponse('ID dịch vụ không hợp lệ', 400));
      }
      
      const service = await Service.findById(serviceId);
      if (!service) {
        return next(new ErrorResponse(`Không tìm thấy dịch vụ với ID ${serviceId}`, 404));
      }
    }
  }

  // Kiểm tra chuyên khoa áp dụng nếu có
  if (applicableSpecialties && applicableSpecialties.length > 0) {
    for (const specialtyId of applicableSpecialties) {
      if (!mongoose.Types.ObjectId.isValid(specialtyId)) {
        return next(new ErrorResponse('ID chuyên khoa không hợp lệ', 400));
      }
      
      const specialty = await Specialty.findById(specialtyId);
      if (!specialty) {
        return next(new ErrorResponse(`Không tìm thấy chuyên khoa với ID ${specialtyId}`, 404));
      }
    }
  }

  // Tạo mã giảm giá
  const coupon = await Coupon.create(req.body);

  res.status(201).json({
    success: true,
    data: coupon,
    message: 'Tạo mã giảm giá thành công'
  });
});

/**
 * @desc    Admin cập nhật mã giảm giá
 * @route   PUT /api/admin/coupons/:id
 * @access  Private (Admin)
 */
exports.updateCoupon = asyncHandler(async (req, res, next) => {
  // Kiểm tra quyền admin
  if (req.user.roleType !== 'admin') {
    return next(new ErrorResponse('Bạn không có quyền thực hiện hành động này', 403));
  }

  const { id } = req.params;
  let coupon = await Coupon.findById(id);

  if (!coupon) {
    return next(new ErrorResponse(`Không tìm thấy mã giảm giá với ID ${id}`, 404));
  }

  // Thêm người cập nhật
  req.body.updatedBy = req.user.id;

  const { 
    code, 
    discountType, 
    discountValue, 
    maxDiscount,
    minPurchase,
    startDate, 
    endDate, 
    description,
    usageLimit,
    applicableServices, 
    applicableSpecialties 
  } = req.body;

  // Kiểm tra nếu đổi mã, mã mới đã tồn tại chưa
  if (code && code.toUpperCase() !== coupon.code) {
    const existingCoupon = await Coupon.findOne({ code: code.toUpperCase() });
    if (existingCoupon) {
      return next(new ErrorResponse('Mã giảm giá này đã tồn tại', 400));
    }

    // Kiểm tra định dạng mã
    if (!/^[A-Z0-9]{3,15}$/.test(code.toUpperCase())) {
      return next(new ErrorResponse('Mã giảm giá phải từ 3-15 ký tự và chỉ bao gồm chữ hoa và số', 400));
    }
  }

  // Kiểm tra và xác thực loại giảm giá
  if (discountType && discountType !== 'percentage' && discountType !== 'fixed') {
    return next(new ErrorResponse('Loại giảm giá phải là percentage hoặc fixed', 400));
  }

  // Kiểm tra giá trị giảm giá
  if (discountType === 'percentage' && discountValue && (discountValue <= 0 || discountValue > 100)) {
    return next(new ErrorResponse('Phần trăm giảm giá phải nằm trong khoảng 1-100', 400));
  }

  if (discountType === 'fixed' && discountValue && discountValue <= 0) {
    return next(new ErrorResponse('Giá trị giảm giá phải lớn hơn 0', 400));
  }

  // Kiểm tra ngày bắt đầu và kết thúc
  if (startDate && new Date(startDate) > new Date()) {
    req.body.isActive = false;
  }

  if (endDate && new Date(endDate) < new Date()) {
    return next(new ErrorResponse('Ngày kết thúc không thể ở quá khứ', 400));
  }

  if (startDate && endDate && new Date(startDate) >= new Date(endDate)) {
    return next(new ErrorResponse('Ngày bắt đầu phải trước ngày kết thúc', 400));
  }

  // Kiểm tra dịch vụ áp dụng nếu có
  if (applicableServices && applicableServices.length > 0) {
    for (const serviceId of applicableServices) {
      if (!mongoose.Types.ObjectId.isValid(serviceId)) {
        return next(new ErrorResponse('ID dịch vụ không hợp lệ', 400));
      }
      
      const service = await Service.findById(serviceId);
      if (!service) {
        return next(new ErrorResponse(`Không tìm thấy dịch vụ với ID ${serviceId}`, 404));
      }
    }
  }

  // Kiểm tra chuyên khoa áp dụng nếu có
  if (applicableSpecialties && applicableSpecialties.length > 0) {
    for (const specialtyId of applicableSpecialties) {
      if (!mongoose.Types.ObjectId.isValid(specialtyId)) {
        return next(new ErrorResponse('ID chuyên khoa không hợp lệ', 400));
      }
      
      const specialty = await Specialty.findById(specialtyId);
      if (!specialty) {
        return next(new ErrorResponse(`Không tìm thấy chuyên khoa với ID ${specialtyId}`, 404));
      }
    }
  }

  // Cập nhật mã giảm giá
  coupon = await Coupon.findByIdAndUpdate(id, req.body, {
    new: true,
    runValidators: true
  });

  res.status(200).json({
    success: true,
    data: coupon,
    message: 'Cập nhật mã giảm giá thành công'
  });
});

/**
 * @desc    Admin xóa mã giảm giá
 * @route   DELETE /api/admin/coupons/:id
 * @access  Private (Admin)
 */
exports.deleteCoupon = asyncHandler(async (req, res, next) => {
  // Kiểm tra quyền admin
  if (req.user.roleType !== 'admin') {
    return next(new ErrorResponse('Bạn không có quyền thực hiện hành động này', 403));
  }

  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return next(new ErrorResponse('ID mã giảm giá không hợp lệ', 400));
  }

  // Check if coupon exists
  const coupon = await Coupon.findById(id);
  if (!coupon) {
    return next(new ErrorResponse('Không tìm thấy mã giảm giá', 404));
  }

  // Check if coupon has been used
  const hasBeenUsed = coupon.usedCount > 0;

  // Nếu đã được sử dụng, chỉ đánh dấu là không hoạt động
  if (hasBeenUsed) {
    coupon.isActive = false;
    await coupon.save();
    
    return res.status(200).json({
      success: true,
      message: 'Mã giảm giá đã được đánh dấu là không hoạt động vì đã được sử dụng'
    });
  }

  // Nếu chưa sử dụng, xóa hoàn toàn
  await coupon.remove();

  res.status(200).json({
    success: true,
    data: {},
    message: 'Xóa mã giảm giá thành công'
  });
});

/**
 * @desc    Admin xem danh sách mã giảm giá
 * @route   GET /api/admin/coupons
 * @access  Private (Admin)
 */
exports.getCoupons = asyncHandler(async (req, res, next) => {
  // Kiểm tra quyền admin
  if (req.user.roleType !== 'admin') {
    return next(new ErrorResponse('Bạn không có quyền thực hiện hành động này', 403));
  }

  const { 
    code, 
    isActive, 
    discountType,
    page = 1,
    limit = 20,
    sortBy = 'createdAt',
    order = 'desc'
  } = req.query;

  // Build query
  const query = {};
  
  // Filter by code
  if (code) {
    query.code = { $regex: code, $options: 'i' };
  }
  
  // Filter by active status
  if (isActive !== undefined) {
    query.isActive = isActive === 'true';
  }
  
  // Filter by discount type
  if (discountType) {
    query.discountType = discountType;
  }

  // Sorting
  const sortOptions = {};
  sortOptions[sortBy] = order === 'asc' ? 1 : -1;

  // Pagination
  const skip = (parseInt(page) - 1) * parseInt(limit);

  // Execute query with pagination
  const coupons = await Coupon.find(query)
    .populate('createdBy', 'fullName email')
    .populate('updatedBy', 'fullName email')
    .populate('applicableServices', 'name price')
    .populate('applicableSpecialties', 'name')
    .sort(sortOptions)
    .skip(skip)
    .limit(parseInt(limit));

  // Count total matching documents
  const total = await Coupon.countDocuments(query);

  // Pagination result
  const pagination = {};

  if (skip + parseInt(limit) < total) {
    pagination.next = {
      page: parseInt(page) + 1,
      limit: parseInt(limit)
    };
  }

  if (skip > 0) {
    pagination.prev = {
      page: parseInt(page) - 1,
      limit: parseInt(limit)
    };
  }

  res.status(200).json({
    success: true,
    count: coupons.length,
    total,
    totalPages: Math.ceil(total / parseInt(limit)),
    currentPage: parseInt(page),
    pagination,
    data: coupons
  });
});

/**
 * @desc    Admin xem chi tiết mã giảm giá
 * @route   GET /api/admin/coupons/:id
 * @access  Private (Admin)
 */
exports.getCouponById = async (req, res) => {
  try {
    const couponId = req.params.id;
    
    // Validate the ID format
    if (!mongoose.Types.ObjectId.isValid(couponId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid coupon ID format'
      });
    }
    
    const coupon = await Coupon.findById(couponId)
      .populate('applicableServices', 'name price')
      .populate('applicableSpecialties', 'name');
    
    if (!coupon) {
      return res.status(404).json({
        success: false,
        message: 'Coupon not found'
      });
    }
    
    return res.json({
      success: true,
      data: coupon
    });
  } catch (error) {
    console.error('Error in getCouponById:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

/**
 * @desc    Validate and calculate discount for a given coupon code
 * @route   POST /api/v1/coupons/validate
 * @access  Private
 */
exports.validateCoupon = asyncHandler(async (req, res, next) => {
  const { code, serviceId, specialtyId, amount } = req.body;

  if (!code) {
    return next(new ErrorResponse('Vui lòng cung cấp mã giảm giá', 400));
  }

  // Find valid coupon
  const coupon = await Coupon.findOne({
    code: code.toUpperCase().trim(),
    isActive: true
  });

  if (!coupon) {
    return next(new ErrorResponse('Mã giảm giá không hợp lệ hoặc không tồn tại', 404));
  }

  // Check if coupon is still valid
  if (!coupon.isValid) {
    return next(new ErrorResponse('Mã giảm giá đã hết hạn hoặc đã đạt giới hạn sử dụng', 400));
  }

  // Kiểm tra số tiền tối thiểu nếu amount được cung cấp
  if (amount && coupon.minPurchase > 0 && amount < coupon.minPurchase) {
    return next(new ErrorResponse(`Giá trị đơn hàng tối thiểu phải từ ${coupon.minPurchase.toLocaleString()} VNĐ để sử dụng mã giảm giá này`, 400));
  }

  // Kiểm tra dịch vụ áp dụng
  if (coupon.applicableServices && coupon.applicableServices.length > 0) {
    // Nếu coupon chỉ áp dụng cho một số dịch vụ cụ thể
    if (!serviceId) {
      return next(new ErrorResponse('Vui lòng chọn dịch vụ trước khi áp dụng mã giảm giá này', 400));
    }

    const isServiceApplicable = coupon.applicableServices.some(id => 
      id.toString() === serviceId.toString()
    );

    if (!isServiceApplicable) {
      return next(new ErrorResponse('Mã giảm giá này không áp dụng cho dịch vụ đã chọn', 400));
    }
  }

  // Kiểm tra chuyên khoa áp dụng
  if (coupon.applicableSpecialties && coupon.applicableSpecialties.length > 0) {
    // Nếu coupon chỉ áp dụng cho một số chuyên khoa cụ thể
    if (!specialtyId) {
      return next(new ErrorResponse('Vui lòng chọn chuyên khoa trước khi áp dụng mã giảm giá này', 400));
    }

    const isSpecialtyApplicable = coupon.applicableSpecialties.some(id => 
      id.toString() === specialtyId.toString()
    );

    if (!isSpecialtyApplicable) {
      return next(new ErrorResponse('Mã giảm giá này không áp dụng cho chuyên khoa đã chọn', 400));
    }
  }

  // Tính toán số tiền giảm giá nếu amount được cung cấp
  let discountAmount = 0;
  let finalAmount = amount;
  
  if (amount) {
    if (coupon.discountType === 'percentage') {
      discountAmount = Math.round((amount * coupon.discountValue) / 100);
      
      // Áp dụng giảm giá tối đa nếu có
      if (coupon.maxDiscount && discountAmount > coupon.maxDiscount) {
        discountAmount = coupon.maxDiscount;
      }
    } else {
      // Giảm giá cố định
      discountAmount = coupon.discountValue;
      
      // Giảm giá không thể nhiều hơn tổng số tiền
      if (discountAmount > amount) {
        discountAmount = amount;
      }
    }

    finalAmount = amount - discountAmount;
  }

  res.status(200).json({
    success: true,
    data: {
      code: coupon.code,
      discountType: coupon.discountType,
      discountValue: coupon.discountValue,
      maxDiscount: coupon.maxDiscount,
      originalAmount: amount || 0,
      discountAmount: discountAmount,
      finalAmount: finalAmount
    }
  });
});

/**
 * @desc    Lấy thông tin mã giảm giá
 * @route   GET /api/v1/coupons/validate   
 * @access  Private
 */
exports.getCouponInfo = asyncHandler(async (req, res, next) => {
  const { code, serviceId, specialtyId } = req.query;

  // Kiểm tra xem người dùng đã nhập mã giảm giá chưa
  if (!code) {
    return next(new ErrorResponse('Vui lòng cung cấp mã giảm giá', 400));
  }

  // Tìm mã giảm giá theo mã đã nhập
  const coupon = await Coupon.findOne({
    code: code.toUpperCase().trim(),
    isActive: true
  });

  if (!coupon) {
    return next(new ErrorResponse('Mã giảm giá không hợp lệ hoặc không tồn tại', 404));
  }

  // Kiểm tra nếu mã giảm giá đã hết hạn hoặc đạt giới hạn sử dụng
  if (!coupon.isValid) {
    return next(new ErrorResponse('Mã giảm giá đã hết hạn hoặc đã đạt giới hạn sử dụng', 400));
  }

  // Kiểm tra dịch vụ áp dụng
  if (coupon.applicableServices && coupon.applicableServices.length > 0) {
    // Nếu coupon chỉ áp dụng cho một số dịch vụ cụ thể
    if (!serviceId) {
      return next(new ErrorResponse('Vui lòng chọn dịch vụ trước khi áp dụng mã giảm giá này', 400));
    }

    const isServiceApplicable = coupon.applicableServices.some(id => 
      id.toString() === serviceId.toString()
    );

    if (!isServiceApplicable) {
      return next(new ErrorResponse('Mã giảm giá này không áp dụng cho dịch vụ đã chọn', 400));
    }
  }

  // Kiểm tra chuyên khoa áp dụng
  if (coupon.applicableSpecialties && coupon.applicableSpecialties.length > 0) {
    // Nếu coupon chỉ áp dụng cho một số chuyên khoa cụ thể
    if (!specialtyId) {
      return next(new ErrorResponse('Vui lòng chọn chuyên khoa trước khi áp dụng mã giảm giá này', 400));
    }

    const isSpecialtyApplicable = coupon.applicableSpecialties.some(id => 
      id.toString() === specialtyId.toString()
    );

    if (!isSpecialtyApplicable) {
      return next(new ErrorResponse('Mã giảm giá này không áp dụng cho chuyên khoa đã chọn', 400));
    }
  }

  // Trả về thông tin mã giảm giá cho người dùng
  res.status(200).json({
    success: true,
    data: {
      code: coupon.code,
      discountType: coupon.discountType,
      discountValue: coupon.discountValue,
      maxDiscount: coupon.maxDiscount,
      minPurchase: coupon.minPurchase,
      applicableServices: coupon.applicableServices,
      applicableSpecialties: coupon.applicableSpecialties,
      isValid: coupon.isValid
    }
  });
});

