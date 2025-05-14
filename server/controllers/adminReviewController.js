const mongoose = require('mongoose');
const Review = require('../models/Review');
const Doctor = require('../models/Doctor');
const User = require('../models/User');
const Hospital = require('../models/Hospital');

/**
 * @desc    Get all reviews (with filters and pagination)
 * @route   GET /api/reviews/admin/all
 * @access  Private (Admin)
 */
exports.getAllReviews = async (req, res) => {
  try {
    const { doctorId, hospitalId, doctorName, hospitalName, status, rating, search, page = 1, limit = 10 } = req.query;
    
    // Build query
    const query = {};
    
    // Add filters to query
    if (doctorId && doctorId !== 'all' && mongoose.Types.ObjectId.isValid(doctorId)) {
      query.doctorId = new mongoose.Types.ObjectId(doctorId);
    }
    
    if (hospitalId && hospitalId !== 'all' && mongoose.Types.ObjectId.isValid(hospitalId)) {
      query.hospitalId = new mongoose.Types.ObjectId(hospitalId);
    }
    
    if (rating && rating !== 'all') {
      query.rating = parseInt(rating);
    }
    
    if (status === 'replied') {
      query['replies.0'] = { $exists: true }; // Has at least one reply
    } else if (status === 'not_replied') {
      query['replies.0'] = { $exists: false }; // Has no replies
    }
    
    // Initialize search conditions array
    const searchConditions = [];
    
    // If there's a general search term
    if (search && search.trim()) {
      searchConditions.push({ comment: { $regex: search, $options: 'i' } });
    }
    
    // If we need to lookup doctors by name
    let doctorIds = [];
    if (doctorName && doctorName.trim()) {
      try {
        // First lookup users by name
        const users = await User.find({ 
          fullName: { $regex: doctorName.trim(), $options: 'i' } 
        }).select('_id');
        
        // Then find doctors associated with these users
        const doctors = await Doctor.find({ 
          user: { $in: users.map(u => u._id) }
        }).select('_id');
        
        doctorIds = doctors.map(doc => doc._id);
        if (doctorIds.length > 0) {
          searchConditions.push({ doctorId: { $in: doctorIds } });
        }
      } catch (error) {
        console.error('Error searching for doctors by name:', error);
        // Don't fail completely, just don't add this filter
      }
    }
    
    // If we need to lookup hospitals by name
    let hospitalIds = [];
    if (hospitalName && hospitalName.trim()) {
      const hospitals = await Hospital.find({ 
        name: { $regex: hospitalName, $options: 'i' } 
      }).select('_id');
      
      hospitalIds = hospitals.map(hospital => hospital._id);
      if (hospitalIds.length > 0) {
        searchConditions.push({ hospitalId: { $in: hospitalIds } });
      }
    }
    
    // Add search conditions to the query
    if (searchConditions.length > 0) {
      query.$or = searchConditions;
    }
    
    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    // Execute query with pagination
    const reviews = await Review.find(query)
      .populate('userId', 'fullName email avatarUrl avatar profileImage')
      .populate({
        path: 'doctorId',
        select: 'fullName specialtyId user',
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
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));
    
    // Get total count for pagination
    const totalReviews = await Review.countDocuments(query);
    
    // Format response
    return res.status(200).json({
      success: true,
      data: {
        reviews,
        total: totalReviews,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(totalReviews / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Error fetching admin reviews:', error);
    return res.status(500).json({
      success: false,
      message: 'Error fetching reviews',
      error: error.message
    });
  }
};

/**
 * @desc    Get review statistics for admin dashboard
 * @route   GET /api/reviews/admin/stats
 * @access  Private (Admin)
 */
exports.getReviewStats = async (req, res) => {
  try {
    // Get total reviews count
    const total = await Review.countDocuments();
    
    // Get counts by rating
    const ratingCounts = await Review.aggregate([
      { $group: { _id: '$rating', count: { $sum: 1 } } }
    ]);
    
    // Format rating counts
    const ratingCountsFormatted = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    ratingCounts.forEach(r => {
      ratingCountsFormatted[r._id] = r.count;
    });
    
    // Calculate average rating
    let averageRating = 0;
    if (total > 0) {
      const ratingSum = 
        ratingCountsFormatted[1] * 1 +
        ratingCountsFormatted[2] * 2 +
        ratingCountsFormatted[3] * 3 +
        ratingCountsFormatted[4] * 4 +
        ratingCountsFormatted[5] * 5;
      
      averageRating = ratingSum / total;
    }
    
    // Count reviews with replies
    const replied = await Review.countDocuments({ 'replies.0': { $exists: true } });
    const notReplied = total - replied;
    
    return res.status(200).json({
      success: true,
      data: {
        total,
        averageRating,
        ratingCounts: ratingCountsFormatted,
        replied,
        notReplied
      }
    });
  } catch (error) {
    console.error('Error fetching review statistics:', error);
    return res.status(500).json({
      success: false,
      message: 'Error fetching review statistics',
      error: error.message
    });
  }
}; 