const mongoose = require('mongoose');
const Review = require('../models/Review');
const Doctor = require('../models/Doctor');
const User = require('../models/User');
const Appointment = require('../models/Appointment');
const Hospital = require('../models/Hospital');
const { validationResult } = require('express-validator');
const AppError = require('../utils/appError');

// Simple utility function to format review response
const formatReviewResponse = (review) => {
  if (!review) return null;
  return {
    id: review._id,
    user: review.userId ? {
      id: review.userId._id,
      name: review.userId.fullName,
      avatar: review.userId.avatarUrl || review.userId.avatar
    } : null,
    rating: review.rating,
    comment: review.comment,
    createdAt: review.createdAt,
    type: review.type,
    replies: Array.isArray(review.replies) ? review.replies.map(reply => ({
      id: reply._id,
      user: reply.userId ? {
        id: reply.userId._id,
        name: reply.userId.fullName,
        avatar: reply.userId.avatarUrl || reply.userId.avatar,
        role: reply.userId.roleType
      } : null,
      comment: reply.comment,
      createdAt: reply.createdAt
    })) : []
  };
};

// @desc    Get all reviews (with filters)
// @route   GET /api/admin/reviews
// @access  Private (Admin)
exports.getAllReviews = async (req, res) => {
  try {
    const { doctorId, hospitalId, userId, rating, type, page = 1, limit = 10, sortBy = 'createdAt', sortOrder = 'desc' } = req.query;
    
    const query = {};
    if (doctorId && mongoose.Types.ObjectId.isValid(doctorId)) {
      query.doctorId = doctorId;
    }
    if (hospitalId && mongoose.Types.ObjectId.isValid(hospitalId)) {
      query.hospitalId = hospitalId;
    }
    if (userId && mongoose.Types.ObjectId.isValid(userId)) {
      query.userId = userId;
    }
    if (rating) query.rating = parseInt(rating);
    if (type) query.type = type;

    // Tính skip để phân trang
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const sortOptions = {};
    sortOptions[sortBy] = sortOrder === 'desc' ? -1 : 1;

    // Thực hiện truy vấn
    const reviews = await Review.find(query)
      .populate('userId', 'fullName email avatarUrl avatar profileImage')
      .populate({
        path: 'doctorId',
        select: 'userId specialtyId user', 
        populate: {
          path: 'user',
          select: 'fullName email avatarUrl avatar',
        },
      })
      .populate('hospitalId', 'name address imageUrl logo')
      .populate({
        path: 'replies.userId',
        select: 'fullName email avatarUrl avatar profileImage roleType'
      })
      .sort(sortOptions)
      .skip(skip)
      .limit(parseInt(limit));

    // Đếm tổng số documents để tính tổng số trang
    const total = await Review.countDocuments(query);

    return res.status(200).json({
      success: true,
      message: 'Lấy danh sách đánh giá thành công',
      data: {
        docs: reviews,
        totalDocs: total,
        limit: parseInt(limit),
        totalPages: Math.ceil(total / parseInt(limit)),
        page: parseInt(page),
        pagingCounter: skip + 1,
        hasPrevPage: parseInt(page) > 1,
        hasNextPage: parseInt(page) < Math.ceil(total / parseInt(limit)),
        prevPage: parseInt(page) > 1 ? parseInt(page) - 1 : null,
        nextPage: parseInt(page) < Math.ceil(total / parseInt(limit)) ? parseInt(page) + 1 : null
      }
    });
  } catch (error) {
    console.error('Error getting reviews:', error);
    return res.status(500).json({
      success: false,
      message: 'Lỗi khi lấy danh sách đánh giá',
      error: error.message
    });
  }
};

/**
 * @desc    Lấy chi tiết một đánh giá
 * @route   GET /api/reviews/:id
 * @access  Public
 */
exports.getReviewById = async (req, res) => {
  try {
    const { id } = req.params;

    const review = await Review.findById(id)
      .populate('userId', 'fullName email avatarUrl avatar profileImage')
      .populate({
        path: 'replies.userId', 
        select: 'fullName email avatarUrl avatar profileImage roleType'
      });

    if (!review) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy đánh giá'
      });
    }

    // Populate dựa trên loại đánh giá
    if (review.type === 'doctor' && review.doctorId) {
      await review.populate({
        path: 'doctorId',
        select: 'userId specialtyId',
        populate: {
          path: 'user',
          select: 'fullName email avatarUrl avatar'
        }
      });
    } else if (review.type === 'hospital' && review.hospitalId) {
      await review.populate('hospitalId', 'name address imageUrl logo');
    }

    return res.status(200).json({
      success: true,
      data: review
    });
  } catch (error) {
    console.error('Error getting review:', error);
    return res.status(500).json({
      success: false,
      message: 'Lỗi khi lấy thông tin đánh giá',
      error: error.message
    });
  }
};

// @desc    Delete a review
// @route   DELETE /api/admin/reviews/:id
// @access  Private (Admin)
exports.deleteReview = async (req, res) => {
  try {
    const { id } = req.params;

    const review = await Review.findById(id);
    if (!review) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy đánh giá'
      });
    }

    await Review.findByIdAndDelete(id);

    // Cập nhật rating trung bình
    if (review.type === 'doctor' && review.doctorId) {
      const allReviews = await Review.find({ doctorId: review.doctorId, type: 'doctor' });
    
    if (allReviews.length > 0) {
      const totalRating = allReviews.reduce((sum, review) => sum + review.rating, 0);
      const averageRating = totalRating / allReviews.length;
        await Doctor.findByIdAndUpdate(review.doctorId, { 
          'ratings.average': parseFloat(averageRating.toFixed(1)),
          'ratings.count': allReviews.length
        });
      } else {
        await Doctor.findByIdAndUpdate(review.doctorId, { 
          'ratings.average': 0,
          'ratings.count': 0
        });
      }
    } 
    
    if (review.type === 'hospital' && review.hospitalId) {
      const allReviews = await Review.find({ hospitalId: review.hospitalId, type: 'hospital' });
      
      if (allReviews.length > 0) {
        const totalRating = allReviews.reduce((sum, review) => sum + review.rating, 0);
        const averageRating = totalRating / allReviews.length;
        
        // Cập nhật ratings và xóa đánh giá khỏi các danh sách
        await Hospital.findByIdAndUpdate(review.hospitalId, { 
          'ratings.average': parseFloat(averageRating.toFixed(1)),
          'ratings.count': allReviews.length,
          $pull: { 
            allReviews: review._id,
            featuredReviews: review._id
          }
        });
    } else {
        await Hospital.findByIdAndUpdate(review.hospitalId, { 
          'ratings.average': 0,
          'ratings.count': 0,
          $pull: { 
            allReviews: review._id,
            featuredReviews: review._id
          }
        });
      }
    }

    return res.status(200).json({
      success: true,
      message: 'Xóa đánh giá thành công'
    });
  } catch (error) {
    console.error('Error deleting review:', error);
    return res.status(500).json({
      success: false,
      message: 'Lỗi khi xóa đánh giá',
      error: error.message
    });
  }
};

// @desc    Reply to a review
// @route   POST /api/reviews/:id/reply
// @access  Private (Admin, Doctor, User)
exports.replyToReview = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { id } = req.params;
    const { comment, role = req.user.roleType } = req.body;
    const userId = req.user.id;
    const userRole = req.user.roleType;

    const review = await Review.findById(id);
    if (!review) {
      return res.status(404).json({
        success: false,
        message: 'Review not found'
      });
    }

    // Thêm trả lời
    const reply = {
      userId,
      comment,
      role: role || userRole, // Use provided role or default to user's role
      createdAt: new Date()
    };

    review.replies.push(reply);
    await review.save();

    // Get the updated review with populated user information
    const updatedReview = await Review.findById(id)
      .populate('userId', 'fullName email avatarUrl avatar')
      .populate({
        path: 'replies.userId',
        select: 'fullName email avatarUrl avatar roleType'
      });

    // Get the latest reply with user details
    const latestReply = updatedReview.replies[updatedReview.replies.length - 1];

    return res.status(201).json({
      success: true,
      message: 'Reply added successfully',
      data: {
        review: updatedReview,
        reply: latestReply
      }
    });
  } catch (error) {
    console.error('Error replying to review:', error);
    return res.status(500).json({
      success: false,
      message: 'An error occurred while replying to the review',
      error: error.message
    });
  }
};

/**
 * @desc    Get reviews for a specific doctor
 * @route   GET /api/reviews/doctor/:id
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
    
    // Find doctor by ID
    const doctor = await Doctor.findById(id);
    if (!doctor) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy thông tin bác sĩ'
      });
    }

    // Get reviews for this doctor
    const reviews = await Review.find({ doctorId: id, type: 'doctor' })
      .populate('userId', 'fullName email avatarUrl avatar')
      .populate({
        path: 'replies.userId',
        select: 'fullName email avatarUrl avatar roleType'
      })
      .populate('appointmentId', 'appointmentCode appointmentDate bookingCode')
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: reviews.length,
      data: reviews,
      averageRating: doctor.averageRating || 0
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
 * @desc    Lấy đánh giá của người dùng hiện tại
 * @route   GET /api/reviews/user
 * @access  Private (User)
 */
exports.getUserReviews = async (req, res) => {
  try {
    const userId = req.user.id;
    const { page = 1, limit = 10, sortBy = 'createdAt', sortOrder = 'desc' } = req.query;

    // Tính skip để phân trang
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const sortOptions = {};
    sortOptions[sortBy] = sortOrder === 'desc' ? -1 : 1;

    // Thực hiện truy vấn
    const reviews = await Review.find({ userId })
      .populate({
        path: 'doctorId',
        select: 'userId specialtyId title',
        populate: {
          path: 'user',
          select: 'fullName email avatarUrl avatar'
        }
      })
      .populate('hospitalId', 'name address imageUrl logo')
      .populate({
        path: 'replies.userId',
        select: 'fullName email avatarUrl avatar profileImage roleType'
      })
      .populate('appointmentId', 'appointmentCode appointmentDate bookingCode')
      .sort(sortOptions)
      .skip(skip)
      .limit(parseInt(limit));

    // Đếm tổng số documents để tính tổng số trang
    const total = await Review.countDocuments({ userId });

    return res.status(200).json({
      success: true,
      message: 'Lấy danh sách đánh giá thành công',
      data: {
        docs: reviews,
        totalDocs: total,
        limit: parseInt(limit),
        totalPages: Math.ceil(total / parseInt(limit)),
        page: parseInt(page),
        pagingCounter: skip + 1,
        hasPrevPage: parseInt(page) > 1,
        hasNextPage: parseInt(page) < Math.ceil(total / parseInt(limit)),
        prevPage: parseInt(page) > 1 ? parseInt(page) - 1 : null,
        nextPage: parseInt(page) < Math.ceil(total / parseInt(limit)) ? parseInt(page) + 1 : null
      }
    });
  } catch (error) {
    console.error('Error getting user reviews:', error);
    return res.status(500).json({
      success: false,
      message: 'Lỗi khi lấy danh sách đánh giá',
      error: error.message
    });
  }
};

/**
 * @desc    Tạo đánh giá bác sĩ mới
 * @route   POST /api/reviews
 * @access  Private (User)
 * @note    Chỉ user đã hoàn thành lịch khám mới có quyền đánh giá
 */
exports.createDoctorReview = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { doctorId, appointmentId, rating, content } = req.body;
    const userId = req.user.id;

    // Xác minh appointment tồn tại, thuộc về user, và đã hoàn thành
    const appointment = await Appointment.findOne({ 
      _id: appointmentId, 
      patientId: userId,
      doctorId: doctorId,
      status: 'completed' // Chỉ đánh giá được appointment đã hoàn thành
    });

    if (!appointment) {
      return res.status(400).json({ 
        success: false, 
        message: 'Không thể đánh giá bác sĩ này. Lịch hẹn không tồn tại, chưa hoàn thành, hoặc không thuộc về bạn.' 
      });
    }

    // Kiểm tra user đã đánh giá lịch hẹn này chưa
    const existingReview = await Review.findOne({ 
      appointmentId, 
      userId,
      type: 'doctor'
    });
    
    if (existingReview) {
      return res.status(400).json({ 
        success: false, 
        message: 'Bạn đã đánh giá lịch hẹn này rồi.' 
      });
    }

    // Tạo đánh giá mới
    const review = new Review({
      userId,
      doctorId,
      appointmentId,
      rating,
      comment: content,
      type: 'doctor'
    });

    await review.save();

    // Cập nhật ratings của bác sĩ
    const allReviews = await Review.find({ doctorId, type: 'doctor' });
    const totalRating = allReviews.reduce((sum, review) => sum + review.rating, 0);
    const averageRating = totalRating / allReviews.length;

    await Doctor.findByIdAndUpdate(doctorId, { 
      'ratings.average': parseFloat(averageRating.toFixed(1)),
      'ratings.count': allReviews.length
    });

    return res.status(201).json({
      success: true,
      message: 'Đánh giá bác sĩ thành công',
      data: review
    });
  } catch (error) {
    console.error('Error creating doctor review:', error);
    return res.status(500).json({
      success: false,
      message: 'Lỗi khi tạo đánh giá',
      error: error.message
    });
  }
};

/**
 * @desc    Tạo đánh giá bệnh viện mới
 * @route   POST /api/reviews/hospital
 * @access  Private (User)
 * @note    Chỉ user đã hoàn thành lịch khám mới có quyền đánh giá
 */
exports.createHospitalReview = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { hospitalId, appointmentId, rating, content } = req.body;
    const userId = req.user.id;

    // Xác minh appointment tồn tại, thuộc về user, và đã hoàn thành
    const appointment = await Appointment.findOne({ 
      _id: appointmentId, 
      patientId: userId,
      hospitalId: hospitalId,
      status: 'completed' // Chỉ đánh giá được appointment đã hoàn thành
    });

    if (!appointment) {
      return res.status(400).json({ 
        success: false, 
        message: 'Không thể đánh giá bệnh viện này. Lịch hẹn không tồn tại, chưa hoàn thành, hoặc không thuộc về bạn.' 
      });
    }

    // Kiểm tra user đã đánh giá lịch hẹn này chưa
    const existingReview = await Review.findOne({ 
      appointmentId, 
      userId,
      type: 'hospital'
    });
    
    if (existingReview) {
      return res.status(400).json({ 
        success: false, 
        message: 'Bạn đã đánh giá bệnh viện cho lịch hẹn này rồi.' 
      });
    }

    // Tạo đánh giá mới
    const review = new Review({
      userId,
      hospitalId,
      appointmentId,
      rating,
      comment: content,
      type: 'hospital'
    });

    await review.save();

    // Cập nhật ratings của bệnh viện
    const allReviews = await Review.find({ hospitalId, type: 'hospital' });
    const totalRating = allReviews.reduce((sum, review) => sum + review.rating, 0);
    const averageRating = totalRating / allReviews.length;

    // Chuẩn bị dữ liệu cập nhật cho bệnh viện
    const updateData = {
      'ratings.average': parseFloat(averageRating.toFixed(1)),
      'ratings.count': allReviews.length
    };
    
    // Lấy thông tin bệnh viện
    const hospital = await Hospital.findById(hospitalId);
    
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
        await Hospital.findByIdAndUpdate(hospitalId, {
          $pull: { featuredReviews: oldestReviewId }
        });
        
        // Thêm đánh giá mới vào featuredReviews
        if (!updateData.$push) {
          updateData.$push = {};
        }
        updateData.$push.featuredReviews = review._id;
      }
    }
    
    await Hospital.findByIdAndUpdate(hospitalId, updateData);

    return res.status(201).json({
      success: true,
      message: 'Đánh giá bệnh viện thành công',
      data: review
    });
  } catch (error) {
    console.error('Error creating hospital review:', error);
    return res.status(500).json({
      success: false,
      message: 'Lỗi khi tạo đánh giá',
      error: error.message
    });
  }
};

/**
 * @desc    Lấy thống kê đánh giá
 * @route   GET /api/admin/reviews/stats
 * @access  Private (Admin)
 */
exports.getReviewStats = async (req, res) => {
  try {
    const { type = 'all' } = req.query;
    
    const match = {};
    if (type !== 'all') {
      match.type = type;
    }

    const stats = await Review.aggregate([
      { $match: match },
      { 
        $group: {
          _id: '$rating',
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    const totalReviews = await Review.countDocuments(match);
    
    // Transform to rating distribution object
    const ratingDistribution = {
      1: 0, 2: 0, 3: 0, 4: 0, 5: 0
    };
    
    stats.forEach(item => {
      ratingDistribution[item._id] = item.count;
    });
    
    // Calculate average rating
    let avgRating = 0;
    if (totalReviews > 0) {
      avgRating = (
        (ratingDistribution[1] * 1) +
        (ratingDistribution[2] * 2) +
        (ratingDistribution[3] * 3) +
        (ratingDistribution[4] * 4) +
        (ratingDistribution[5] * 5)
      ) / totalReviews;
    }

    return res.status(200).json({
      success: true,
      data: {
        totalReviews,
        avgRating: avgRating.toFixed(1),
        ratingDistribution
      }
    });
  } catch (error) {
    console.error('Error getting review stats:', error);
    return res.status(500).json({
      success: false,
      message: 'Lỗi khi lấy thống kê đánh giá',
      error: error.message
    });
  }
};

/**
 * @desc    Xóa một trả lời đánh giá (Admin)
 * @route   DELETE /api/admin/reviews/:id/replies/:replyId
 * @access  Private (Admin)
 */
exports.deleteReplyFromReview = async (req, res) => {
  try {
    const { id, replyId } = req.params;
    
    const review = await Review.findById(id);
    if (!review) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy đánh giá'
      });
    }

    // Lọc ra tất cả trả lời ngoại trừ reply cần xóa
    const originalReplyCount = review.replies.length;
    review.replies = review.replies.filter(reply => reply._id.toString() !== replyId);
    
    // Kiểm tra xem có reply nào được xóa không
    if (review.replies.length === originalReplyCount) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy trả lời cần xóa'
      });
    }

    await review.save();

    return res.status(200).json({
      success: true,
      message: 'Xóa trả lời thành công'
    });
  } catch (error) {
    console.error('Error deleting reply:', error);
    return res.status(500).json({
      success: false,
      message: 'Lỗi khi xóa trả lời',
      error: error.message
    });
  }
};

/**
 * @desc    Lấy danh sách đánh giá (có thể lọc)
 * @route   GET /api/reviews
 * @access  Public
 */
exports.getReviews = async (req, res) => {
  try {
    const { doctorId, hospitalId, userId, rating, type = 'doctor', page = 1, limit = 10, sortBy = 'createdAt', sortOrder = 'desc' } = req.query;
    
    const query = {};
    if (type) query.type = type;
    
    if (doctorId && mongoose.Types.ObjectId.isValid(doctorId)) {
      query.doctorId = doctorId;
    }
    if (hospitalId && mongoose.Types.ObjectId.isValid(hospitalId)) {
      query.hospitalId = hospitalId;
    }
    if (userId && mongoose.Types.ObjectId.isValid(userId)) {
      query.userId = userId;
    }
    if (rating) query.rating = parseInt(rating);

    // Tính skip để phân trang
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const sortOptions = {};
    sortOptions[sortBy] = sortOrder === 'desc' ? -1 : 1;

    // Thực hiện truy vấn
    const reviews = await Review.find(query)
      .populate('userId', 'fullName email profileImage avatarUrl')
      .populate('replies.userId', 'fullName profileImage avatarUrl roleType')
      .sort(sortOptions)
      .skip(skip)
      .limit(parseInt(limit));

    // Thêm populate dựa trên loại đánh giá
    if (type === 'doctor') {
      await Promise.all(reviews.map(review => review.populate('doctorId', 'userId specialtyId')));
    } else if (type === 'hospital') {
      await Promise.all(reviews.map(review => review.populate('hospitalId', 'name address')));
    }

    // Đếm tổng số documents để tính tổng số trang
    const total = await Review.countDocuments(query);

    return res.status(200).json({
      success: true,
      message: 'Lấy danh sách đánh giá thành công',
      data: {
        docs: reviews,
        totalDocs: total,
        limit: parseInt(limit),
        totalPages: Math.ceil(total / parseInt(limit)),
        page: parseInt(page),
        pagingCounter: skip + 1,
        hasPrevPage: parseInt(page) > 1,
        hasNextPage: parseInt(page) < Math.ceil(total / parseInt(limit)),
        prevPage: parseInt(page) > 1 ? parseInt(page) - 1 : null,
        nextPage: parseInt(page) < Math.ceil(total / parseInt(limit)) ? parseInt(page) + 1 : null
      }
    });
  } catch (error) {
    console.error('Error getting reviews:', error);
    return res.status(500).json({
      success: false,
      message: 'Lỗi khi lấy danh sách đánh giá',
      error: error.message
    });
  }
};

/**
 * @desc    Lấy đánh giá của một bệnh viện
 * @route   GET /api/reviews/hospital/:id
 * @access  Public
 */
exports.getHospitalReviews = async (req, res) => {
  try {
    const { id } = req.params;
    const { page = 1, limit = 10, sortBy = 'createdAt', sortOrder = 'desc' } = req.query;

    // Kiểm tra ID hợp lệ
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'ID bệnh viện không hợp lệ'
      });
    }

    // Tính skip để phân trang
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const sortOptions = {};
    sortOptions[sortBy] = sortOrder === 'desc' ? -1 : 1;

    // Thực hiện truy vấn với hospitalId là ObjectId
    const reviews = await Review.find({ 
      hospitalId: id,  // Mongoose tự chuyển đổi string ID thành ObjectId
      type: 'hospital' 
    })
      .populate('userId', 'fullName email avatarUrl avatar')
      .populate({
        path: 'replies.userId',
        select: 'fullName email avatarUrl avatar roleType'
      })
      .populate('appointmentId', 'appointmentCode appointmentDate bookingCode')
      .sort(sortOptions)
      .skip(skip)
      .limit(parseInt(limit));

    // Đếm tổng số documents để tính tổng số trang
    const total = await Review.countDocuments({ 
      hospitalId: id, 
      type: 'hospital' 
    });

    // Calculate average rating
    let averageRating = 0;
    if (reviews.length > 0) {
      const totalRating = reviews.reduce((sum, review) => sum + review.rating, 0);
      averageRating = totalRating / reviews.length;
    }

    return res.status(200).json({
      success: true,
      message: 'Lấy đánh giá bệnh viện thành công',
      data: {
        docs: reviews,
        totalDocs: total,
        limit: parseInt(limit),
        totalPages: Math.ceil(total / parseInt(limit)),
        page: parseInt(page),
        pagingCounter: skip + 1,
        hasPrevPage: parseInt(page) > 1,
        hasNextPage: parseInt(page) < Math.ceil(total / parseInt(limit)),
        prevPage: parseInt(page) > 1 ? parseInt(page) - 1 : null,
        nextPage: parseInt(page) < Math.ceil(total / parseInt(limit)) ? parseInt(page) + 1 : null,
        averageRating: averageRating.toFixed(1)
      }
    });
  } catch (error) {
    console.error('Error getting hospital reviews:', error);
    return res.status(500).json({
      success: false,
      message: 'Lỗi khi lấy đánh giá bệnh viện',
      error: error.message
    });
  }
}; 