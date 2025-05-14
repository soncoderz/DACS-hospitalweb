const mongoose = require('mongoose');
const Hospital = require('../models/Hospital');
const User = require('../models/User');
const Review = require('../models/Review');
const Appointment = require('../models/Appointment');
const { validationResult } = require('express-validator');
const AppError = require('../utils/appError');
const catchAsync = require('../utils/catchAsync');

/**
 * @desc    Submit a hospital review
 * @route   POST /api/hospitals/:id/reviews
 * @access  Private (Patient only)
 */
exports.createHospitalReview = catchAsync(async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ 
      success: false, 
      errors: errors.array() 
    });
  }

  const { id } = req.params;
  const { rating, comment, appointmentId } = req.body;
  const userId = req.user.id;

  // Validate hospital ID
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return next(new AppError('ID bệnh viện không hợp lệ', 400));
  }

  // Check if hospital exists
  const hospital = await Hospital.findById(id);
  if (!hospital) {
    return next(new AppError('Không tìm thấy bệnh viện', 404));
  }

  // Verify the appointment belongs to this hospital and user
  if (appointmentId) {
    const appointment = await Appointment.findOne({
      _id: appointmentId,
      userId: userId,
      hospitalId: id,
      status: 'completed'
    });

    if (!appointment) {
      return next(new AppError('Bạn không thể đánh giá bệnh viện này do không có cuộc hẹn hoàn thành', 400));
    }

    // Check if user already reviewed this appointment for this hospital
    const existingAppointmentReview = await Review.findOne({ 
      appointmentId, 
      userId, 
      hospitalId: id 
    });
    
    if (existingAppointmentReview) {
      return next(new AppError('Bạn đã đánh giá bệnh viện này cho cuộc hẹn này rồi', 400));
    }
  }

  // Create review
  const review = new Review({
    userId,
    hospitalId: id,
    appointmentId: appointmentId || null,
    rating,
    comment,
    type: 'hospital'
  });

  await review.save();

  // Update hospital's average rating
  const allReviews = await Review.find({ 
    hospitalId: id,
    type: 'hospital',
    isActive: true
  });
  
  const totalRating = allReviews.reduce((sum, review) => sum + review.rating, 0);
  const averageRating = totalRating / allReviews.length;
  
  // Chuẩn bị dữ liệu cập nhật cho bệnh viện
  const updateData = {
    'ratings.average': averageRating,
    'ratings.count': allReviews.length
  };
  
  // Thêm đánh giá mới vào danh sách allReviews
  if (!hospital.allReviews) {
    // Nếu trường allReviews chưa tồn tại, tạo mới
    updateData.allReviews = [review._id];
  } else {
    // Nếu đã tồn tại, thêm vào trường
    updateData.$push = { allReviews: review._id };
  }
  
  // Xử lý featuredReviews
  if (rating >= 4) {
    // Nếu bệnh viện có ít hơn 5 đánh giá nổi bật, thêm vào
    if (!hospital.featuredReviews || hospital.featuredReviews.length < 5) {
      if (!updateData.$push) {
        updateData.$push = {};
      }
      updateData.$push.featuredReviews = review._id;
    } else {
      // Nếu đã có đủ 5 đánh giá nổi bật, thay thế đánh giá cũ nhất
      const oldestReviewId = hospital.featuredReviews[0];
      
      // Xóa đánh giá cũ nhất khỏi featuredReviews
      await Hospital.findByIdAndUpdate(id, {
        $pull: { featuredReviews: oldestReviewId }
      });
      
      // Thêm đánh giá mới vào featuredReviews
      if (!updateData.$push) {
        updateData.$push = {};
      }
      updateData.$push.featuredReviews = review._id;
    }
  }
  
  await Hospital.findByIdAndUpdate(id, updateData);

  return res.status(201).json({
    success: true,
    message: 'Đánh giá bệnh viện thành công',
    data: review
  });
});

/**
 * @desc    Get reviews for a specific hospital
 * @route   GET /api/hospitals/:id/reviews
 * @access  Public
 */
exports.getHospitalReviews = catchAsync(async (req, res, next) => {
  const { id } = req.params;
  const { page = 1, limit = 10, sort = 'newest' } = req.query;

  // Validate hospital ID
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return next(new AppError('ID bệnh viện không hợp lệ', 400));
  }

  // Check if hospital exists
  const hospital = await Hospital.findById(id);
  if (!hospital) {
    return next(new AppError('Không tìm thấy bệnh viện', 404));
  }

  // Set up pagination
  const skip = (parseInt(page) - 1) * parseInt(limit);
  
  // Set up sorting
  let sortOption = {};
  if (sort === 'newest') {
    sortOption = { createdAt: -1 };
  } else if (sort === 'oldest') {
    sortOption = { createdAt: 1 };
  } else if (sort === 'highest') {
    sortOption = { rating: -1 };
  } else if (sort === 'lowest') {
    sortOption = { rating: 1 };
  }

  // Find reviews for this hospital
  const reviews = await Review.find({ 
    hospitalId: id, 
    type: 'hospital',
    isActive: true 
  })
    .populate('userId', 'fullName avatarUrl')
    .sort(sortOption)
    .skip(skip)
    .limit(parseInt(limit));

  // Get total count for pagination
  const totalReviews = await Review.countDocuments({ 
    hospitalId: id, 
    type: 'hospital', 
    isActive: true 
  });

  return res.status(200).json({
    success: true,
    data: {
      reviews,
      pagination: {
        total: totalReviews,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(totalReviews / parseInt(limit))
      },
      averageRating: hospital.ratings.average,
      reviewCount: hospital.ratings.count
    }
  });
});

/**
 * @desc    Reply to a hospital review
 * @route   POST /api/hospitals/reviews/:id/reply
 * @access  Private (Admin, Hospital Staff)
 */
exports.replyToReview = catchAsync(async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ 
      success: false, 
      errors: errors.array() 
    });
  }

  const { id } = req.params;
  const { comment } = req.body;
  const userId = req.user.id;

  // Find the review
  const review = await Review.findOne({ 
    _id: id, 
    type: 'hospital',
    isActive: true 
  });

  if (!review) {
    return next(new AppError('Không tìm thấy đánh giá', 404));
  }

  // Only allow admin or hospital staff to reply
  if (req.user.roleType !== 'admin') {
    return res.status(403).json({
      success: false,
      message: 'Bạn không có quyền thực hiện hành động này'
    });
  }

  // Add reply to review
  review.replies.push({
    userId,
    comment,
    createdAt: new Date()
  });

  await review.save();

  return res.status(200).json({
    success: true,
    message: 'Trả lời đánh giá thành công',
    data: review
  });
});

/**
 * @desc    Delete a hospital review
 * @route   DELETE /api/admin/hospitals/reviews/:id
 * @access  Private (Admin only)
 */
exports.deleteReview = catchAsync(async (req, res, next) => {
  const { id } = req.params;
  const { permanently = false } = req.query;

  // Find the review
  const review = await Review.findOne({ 
    _id: id, 
    type: 'hospital' 
  });

  if (!review) {
    return next(new AppError('Không tìm thấy đánh giá', 404));
  }

  if (permanently === 'true' || permanently === true) {
    // Permanently delete review
    await Review.findByIdAndDelete(id);
  } else {
    // Soft delete by marking as inactive
    review.isActive = false;
    await review.save();
  }

  // Update hospital's average rating
  const allReviews = await Review.find({ 
    hospitalId: review.hospitalId,
    type: 'hospital',
    isActive: true
  });
  
  const hospital = await Hospital.findById(review.hospitalId);
  
  if (allReviews.length > 0) {
    const totalRating = allReviews.reduce((sum, r) => sum + r.rating, 0);
    const averageRating = totalRating / allReviews.length;
    
    hospital.ratings.average = averageRating;
    hospital.ratings.count = allReviews.length;
  } else {
    hospital.ratings.average = 0;
    hospital.ratings.count = 0;
  }
  
  await hospital.save();

  return res.status(200).json({
    success: true,
    message: permanently === 'true' || permanently === true 
      ? 'Đã xóa vĩnh viễn đánh giá' 
      : 'Đã ẩn đánh giá'
  });
});

module.exports = exports; 