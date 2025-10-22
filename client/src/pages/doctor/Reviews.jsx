import React, { useState, useEffect } from 'react';
import { FaStar, FaStarHalfAlt, FaRegStar, FaUser, FaReply, FaTrash, FaEllipsisH, FaSearch, FaFilter, FaTimes, FaCommentMedical, FaAngleRight, FaAngleLeft } from 'react-icons/fa';
import api from '../../utils/api';
import { toast } from 'react-hot-toast';

const Reviews = () => {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [rating, setRating] = useState(0);
  const [reviewCount, setReviewCount] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [ratingFilter, setRatingFilter] = useState('all');
  const [replyText, setReplyText] = useState('');
  const [replyingTo, setReplyingTo] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [showDropdown, setShowDropdown] = useState(null);
  const [processingReply, setProcessingReply] = useState(false);
  const [error, setError] = useState(null);
  const [doctorProfile, setDoctorProfile] = useState(null);

  useEffect(() => {
    fetchDoctorProfile();
    fetchReviews();
  }, [currentPage, ratingFilter]);

  const fetchDoctorProfile = async () => {
    try {
      const response = await api.get('/doctors/profile');
      if (response.data.success) {
        setDoctorProfile(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching doctor profile:', error.response?.data || error.message);
    }
  };

  const fetchReviews = async () => {
    setLoading(true);
    try {
      const ratingQuery = ratingFilter !== 'all' ? `&rating=${ratingFilter}` : '';
      const response = await api.get(`/doctors/reviews?page=${currentPage}&limit=10${ratingQuery}`);
      
      if (response.data.success) {
        // Set reviews data based on response format
        let reviewsData = [];
        if (Array.isArray(response.data.data)) {
          reviewsData = response.data.data;
        } else if (response.data.data && Array.isArray(response.data.data.reviews)) {
          reviewsData = response.data.data.reviews;
        }
        setReviews(reviewsData);
        
        // Set rating from stats
        let avgRating = 0;
        let total = 0;
        
        if (response.data.data && response.data.data.ratings) {
          avgRating = response.data.data.ratings.average || 0;
          total = response.data.data.ratings.count || 0;
        } else if (response.data.stats) {
          avgRating = response.data.stats.averageRating || 0;
          total = response.data.stats.total || 0;
        } else if (response.data.data) {
          avgRating = response.data.data.averageRating || 0;
          total = response.data.data.totalReviews || 0;
        }
        
        setRating(avgRating);
        setReviewCount(total);
        
        // Set pagination data
        setTotalPages(response.data.pagination?.totalPages || 1);
      } else {
        setError(response.data.message || 'Không thể tải đánh giá');
      }
    } catch (error) {
      console.error('Error fetching reviews:', error.response?.data || error.message);
      setError('Đã xảy ra lỗi khi tải đánh giá');
    } finally {
      setLoading(false);
    }
  };

  const handleReplySubmit = async (reviewId) => {
    if (!replyText.trim()) {
      toast.error('Vui lòng nhập nội dung phản hồi');
      return;
    }
    
    setProcessingReply(true);

    try {
      const response = await api.post(`/reviews/${reviewId}/reply`, {
        comment: replyText
      });

      if (response.data.success) {
        toast.success('Đã gửi phản hồi thành công');
        
        // Update the reviews with the new reply
        const updatedReviews = reviews.map(review => {
          if (review._id === reviewId) {
            // Make sure replies array exists
            const existingReplies = review.replies || [];
            
            // Add new reply to replies array
            return {
              ...review,
              replies: [
                ...existingReplies,
                {
                  userId: doctorProfile.user || doctorProfile._id,
                  user: {
                    _id: doctorProfile.user?._id || doctorProfile._id,
                    fullName: doctorProfile.user?.fullName || doctorProfile.fullName,
                    avatarUrl: doctorProfile.user?.avatarUrl || doctorProfile.avatarUrl
                  },
                  comment: replyText,
                  createdAt: new Date()
                }
              ]
            };
          }
          return review;
        });

        setReviews(updatedReviews);
        setReplyText('');
        setReplyingTo(null);
        
        // Refresh reviews to get the updated data from server
        fetchReviews();
      } else {
        toast.error(response.data.message || 'Không thể gửi phản hồi');
      }
    } catch (error) {
      console.error('Error posting reply:', error.response?.data || error.message);
      toast.error('Đã xảy ra lỗi khi gửi phản hồi');
    } finally {
      setProcessingReply(false);
    }
  };

  const filteredReviews = reviews.filter(review => {
    // Lọc theo tìm kiếm
    return review.userId?.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
           review.comment?.toLowerCase().includes(searchTerm.toLowerCase());
  });

  const renderStars = (rating) => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating - fullStars >= 0.5;
    
    for (let i = 1; i <= 5; i++) {
      if (i <= fullStars) {
        stars.push(<FaStar key={i} className="text-yellow-400" />);
      } else if (i === fullStars + 1 && hasHalfStar) {
        stars.push(<FaStarHalfAlt key={i} className="text-yellow-400" />);
      } else {
        stars.push(<FaRegStar key={i} className="text-gray-300" />);
      }
    }
    
    return stars;
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('vi-VN', {
      year: 'numeric',
      month: 'numeric',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  // Lấy Avatar URL từ object user hoặc từ thuộc tính trực tiếp
  const getUserAvatarUrl = (user) => {
    if (!user) return null;
    
    // Nếu user là object có chứa avatarUrl
    if (typeof user === 'object') {
      if (user.avatarUrl) {
        return user.avatarUrl;
      }
      
      // Kiểm tra xem có avatar object không
      if (user.avatar) {
        if (user.avatar.secureUrl) return user.avatar.secureUrl;
        if (user.avatar.url) return user.avatar.url;
      }
      
      // Lấy fullName cho placeholder
      const userName = user.fullName || user.name || 'User';
      return `https://ui-avatars.com/api/?name=${encodeURIComponent(userName)}&background=1AC0FF&color=fff`;
    }
    
    // Nếu user là string (ID)
    return `https://ui-avatars.com/api/?name=User&background=1AC0FF&color=fff`;
  };

  const renderReplyContent = (review) => {
    // Check for doctorReply property first (new API format)
    if (review.doctorReply) {
      return (
        <div className="mt-4 bg-blue-50 rounded-lg p-4 border-l-4 border-blue-500">
          <div className="flex items-center mb-2">
            <div className="h-8 w-8 rounded-full overflow-hidden border-2 border-blue-200 mr-3">
              <img 
                src={
                  doctorProfile?.user?.avatarUrl || 
                  doctorProfile?.avatar?.secureUrl ||
                  doctorProfile?.avatar?.url || 
                  doctorProfile?.avatarUrl || 
                  `https://ui-avatars.com/api/?name=${encodeURIComponent(doctorProfile?.user?.fullName || doctorProfile?.fullName || 'Bác sĩ')}&background=1AC0FF&color=fff`
                } 
                alt="Bác sĩ" 
                className="h-full w-full object-cover"
                onError={(e) => {
                  e.target.src = `https://ui-avatars.com/api/?name=Bác sĩ&background=1AC0FF&color=fff`;
                }}
              />
            </div>
            <div>
              <div className="font-medium text-blue-800">Phản hồi của bạn</div>
              <div className="text-xs text-blue-600">{formatDate(review.doctorReply.createdAt)}</div>
            </div>
          </div>
          <div className="text-gray-700 pl-11">
            {review.doctorReply.content}
          </div>
        </div>
      );
    }
    
    // Check for replies array (old API format)
    if (review.replies && review.replies.length > 0) {
      return (
        <div className="mt-4 space-y-3">
          {review.replies.map((reply, index) => {
            // Kiểm tra xem đây có phải phản hồi của bác sĩ không
            const isDoctorReply = doctorProfile && (
              (reply.userId === doctorProfile._id) || 
              (reply.userId?._id === doctorProfile._id) ||
              (reply.userId === doctorProfile.user?._id) || 
              (reply.userId?._id === doctorProfile.user?._id) ||
              (typeof reply.userId === 'object' && reply.userId._id === doctorProfile.user?._id) ||
              (reply.user?._id === doctorProfile.user?._id)
            );

            // Lấy avatar URL của người phản hồi
            let avatarUrl = '';
            const replyUser = reply.user || reply.userId;
            
            if (isDoctorReply) {
              avatarUrl = doctorProfile?.user?.avatarUrl || 
                          doctorProfile?.avatar?.secureUrl ||
                          doctorProfile?.avatar?.url || 
                          doctorProfile?.avatarUrl;
            } else {
              avatarUrl = getUserAvatarUrl(replyUser);
            }
            
            // Fallback nếu không có avatar
            if (!avatarUrl) {
              const userName = typeof replyUser === 'object' ? 
                (replyUser.fullName || replyUser.name || 'User') : 'User';
              avatarUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(userName)}&background=${isDoctorReply ? '1AC0FF' : '2BAB94'}&color=fff`;
            }

            // Lấy tên người phản hồi
            let displayName = '';
            if (isDoctorReply) {
              displayName = "Phản hồi của bạn";
            } else {
              displayName = typeof replyUser === 'object' ? 
                (replyUser.fullName || replyUser.name || "Người dùng") : 
                "Người dùng";
            }
            
            return (
              <div 
                key={index} 
                className={`rounded-lg p-4 ${
                  isDoctorReply 
                  ? "bg-blue-50 border-l-4 border-blue-500" 
                  : "bg-gray-50 border-l-4 border-gray-300"
                }`}
              >
                <div className="flex items-center mb-2">
                  <div className="h-8 w-8 rounded-full overflow-hidden border-2 border-gray-200 mr-3">
                    <img 
                      src={reply.user?.avatarUrl || avatarUrl}
                      alt={displayName}
                      className="h-full w-full object-cover"
                      onError={(e) => {
                        const bgColor = isDoctorReply ? '1AC0FF' : '2BAB94';
                        e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(displayName)}&background=${bgColor}&color=fff`;
                      }}
                    />
                  </div>
                  <div>
                    <div className={`font-medium ${isDoctorReply ? "text-blue-800" : "text-gray-800"}`}>
                      {reply.user?.fullName || displayName}
                    </div>
                    <div className={`text-xs ${isDoctorReply ? "text-blue-600" : "text-gray-500"}`}>
                      {formatDate(reply.createdAt)}
                    </div>
                  </div>
                </div>
                <div className="text-gray-700 pl-11">
                  {reply.comment}
                </div>
              </div>
            );
          })}
        </div>
      );
    }
    
    // If no reply found, return null
    return null;
  };
  
  const hasReplied = (review) => {
    // Check for doctorReply property first (new API format)
    if (review.doctorReply) {
      return true;
    }
    
    // Check for replies array (old API format)
    if (review.replies && review.replies.length > 0) {
      return review.replies.some(reply => 
        doctorProfile && (
          (reply.userId === doctorProfile._id) || 
          (reply.userId?._id === doctorProfile._id) ||
          (reply.userId === doctorProfile.user?._id) || 
          (reply.userId?._id === doctorProfile.user?._id) ||
          (typeof reply.userId === 'object' && reply.userId._id === doctorProfile.user?._id) ||
          (reply.user?._id === doctorProfile.user?._id)
        )
      );
    }
    
    return false;
  };

  const renderReviewCard = (review) => {
    // Lấy avatar URL của người đánh giá
    const reviewerAvatarUrl = getUserAvatarUrl(review.userId);
    
    // Lấy tên người đánh giá
    const reviewerName = typeof review.userId === 'object' ? 
      (review.userId.fullName || review.userId.name || 'Ẩn danh') : 'Ẩn danh';
    
    return (
      <div key={review._id} className="bg-white rounded-xl shadow-sm overflow-hidden">
        <div className="p-6">
          <div className="flex items-start justify-between">
            <div className="flex items-center">
              <div className="h-12 w-12 rounded-full overflow-hidden border-2 border-gray-200 mr-4">
                <img 
                  src={reviewerAvatarUrl}
                  alt={reviewerName} 
                  className="h-full w-full object-cover"
                  onError={(e) => {
                    e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(reviewerName)}&background=1AC0FF&color=fff`;
                  }}
                />
              </div>
              <div>
                <div className="font-medium text-gray-900">{reviewerName}</div>
                <div className="text-sm text-gray-500">{formatDate(review.createdAt)}</div>
              </div>
            </div>
            
            <div className="flex items-center">
              <div className="flex mr-1">
                {renderStars(review.rating)}
              </div>
              <span className="text-lg font-semibold text-gray-900">{review.rating.toFixed(1)}</span>
            </div>
          </div>
          
          <div className="mt-4 bg-gray-50 p-4 rounded-lg text-gray-800">
            {review.comment || 'Không có nội dung đánh giá.'}
          </div>
          
          {review.appointmentId && (
            <div className="mt-3 text-sm text-gray-600 bg-blue-50 rounded-lg px-4 py-2">
              <span className="font-medium">Lịch hẹn:</span> {formatDate(review.appointmentId.appointmentDate)}
              {review.appointmentId.bookingCode && <span className="ml-2 text-primary">#{review.appointmentId.bookingCode}</span>}
            </div>
          )}
          
          {/* Doctor's Reply Section */}
          {renderReplyContent(review)}
          
          {/* Reply Button - always show it to allow multiple replies */}
          <div className="mt-4 flex justify-end">
            <button 
              className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white rounded-lg shadow-sm hover:shadow-md transition-all"
              onClick={() => setReplyingTo(review._id)}
            >
              <FaReply className="mr-2" /> {hasReplied(review) ? 'Phản hồi thêm' : 'Phản hồi đánh giá'}
            </button>
          </div>
          
          {/* Reply Form */}
          {replyingTo === review._id && (
            <div className="mt-4 bg-gray-50 rounded-lg p-4 border border-gray-200">
              <h4 className="font-medium text-gray-700 mb-2">Phản hồi đánh giá này</h4>
              <textarea
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                placeholder="Nhập phản hồi của bạn..."
                rows={3}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all mb-3"
              />
              <div className="flex justify-end space-x-3">
                <button 
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                  onClick={() => {
                    setReplyingTo(null);
                    setReplyText('');
                  }}
                >
                  <FaTimes className="inline mr-1" /> Hủy
                </button>
                <button 
                  className="px-4 py-2 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white rounded-lg shadow-sm hover:shadow-md transition-all"
                  onClick={() => handleReplySubmit(review._id)}
                  disabled={processingReply || !replyText.trim()}
                >
                  {processingReply ? 'Đang gửi...' : <><FaReply className="inline mr-1" /> Gửi phản hồi</>}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };
  
  const renderPagination = () => {
    if (totalPages <= 1) return null;
    
    return (
      <div className="flex justify-center my-6">
        <div className="inline-flex items-center rounded-lg overflow-hidden shadow-sm border border-gray-200">
          <button 
            className="px-3 py-2 bg-white text-gray-700 hover:bg-gray-50 border-r border-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-gray-50 disabled:text-gray-400"
            onClick={() => setCurrentPage(1)}
            disabled={currentPage === 1}
            title="Trang đầu tiên"
          >
            <span className="sr-only">Trang đầu tiên</span>
            &laquo;
          </button>
          
          <button 
            className="px-3 py-2 bg-white text-gray-700 hover:bg-gray-50 border-r border-gray-200 flex items-center transition-colors disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-gray-50 disabled:text-gray-400"
            onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
            disabled={currentPage === 1}
          >
            <FaAngleLeft className="mr-1" /> 
            <span className="hidden sm:inline">Trước</span>
          </button>
          
          <div className="inline-flex items-center">
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              // Show pages around current page
              let pageToShow;
              if (totalPages <= 5) {
                // If 5 or fewer pages, show all pages 1 through totalPages
                pageToShow = i + 1;
              } else if (currentPage <= 3) {
                // If at the beginning, show pages 1-5
                pageToShow = i + 1;
              } else if (currentPage >= totalPages - 2) {
                // If at the end, show the last 5 pages
                pageToShow = totalPages - 4 + i;
              } else {
                // Otherwise show current page and 2 pages on each side
                pageToShow = currentPage - 2 + i;
              }
              
              return (
                <button
                  key={pageToShow}
                  onClick={() => setCurrentPage(pageToShow)}
                  className={`px-4 py-2 ${
                    currentPage === pageToShow 
                    ? 'bg-primary text-white' 
                    : 'bg-white text-gray-700 hover:bg-gray-50'
                  } border-r border-gray-200 transition-colors`}
                >
                  {pageToShow}
                </button>
              );
            })}
          </div>
          
          <button 
            className="px-3 py-2 bg-white text-gray-700 hover:bg-gray-50 border-r border-gray-200 flex items-center transition-colors disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-gray-50 disabled:text-gray-400"
            onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
            disabled={currentPage === totalPages}
          >
            <span className="hidden sm:inline">Sau</span>
            <FaAngleRight className="ml-1" />
          </button>
          
          <button 
            className="px-3 py-2 bg-white text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-gray-50 disabled:text-gray-400"
            onClick={() => setCurrentPage(totalPages)}
            disabled={currentPage === totalPages}
            title="Trang cuối cùng"
          >
            <span className="sr-only">Trang cuối cùng</span>
            &raquo;
          </button>
        </div>
      </div>
    );
  };

  if (loading && reviews.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[70vh]">
        <div className="text-center">
          <div className="inline-block w-12 h-12 border-4 border-primary/30 border-l-primary rounded-full animate-spin mb-4"></div>
          <p className="text-gray-600">Đang tải đánh giá...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 p-6 rounded-lg text-center shadow-sm">
        <div className="text-red-600 text-lg mb-2">Lỗi</div>
        <p className="text-red-700">{error}</p>
        <button 
          onClick={fetchReviews}
          className="mt-4 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark"
        >
          Thử lại
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <div className="bg-gradient-to-r from-primary-dark to-primary p-6 text-white">
          <h1 className="text-2xl font-bold flex items-center">
            <FaCommentMedical className="mr-3" /> Đánh giá từ bệnh nhân
          </h1>
        </div>
      </div>
      
      {/* Rating Summary Card */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <div className="p-6 flex flex-col md:flex-row justify-between gap-6">
          <div className="flex flex-col items-center justify-center text-center mb-6 md:mb-0">
            <div className="text-6xl font-bold text-primary mb-2">{rating.toFixed(1)}</div>
            <div className="flex mb-2">{renderStars(rating)}</div>
            <div className="text-gray-500 text-sm">Dựa trên {reviewCount} đánh giá</div>
          </div>
          
          <div className="flex-grow">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-medium text-gray-700 flex items-center">
                    <FaFilter className="mr-2 text-primary" /> Lọc theo đánh giá
                  </h3>
                </div>
                <select 
                  value={ratingFilter} 
                  onChange={(e) => {
                    setRatingFilter(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="w-full bg-white border border-gray-300 text-gray-700 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary"
                >
                  <option value="all">Tất cả sao</option>
                  <option value="5">5 sao</option>
                  <option value="4">4 sao</option>
                  <option value="3">3 sao</option>
                  <option value="2">2 sao</option>
                  <option value="1">1 sao</option>
                </select>
              </div>
              
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-medium text-gray-700 flex items-center">
                    <FaSearch className="mr-2 text-primary" /> Tìm kiếm đánh giá
                  </h3>
                </div>
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Tìm theo tên hoặc nội dung..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full bg-white border border-gray-300 text-gray-700 rounded-lg pl-10 pr-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary"
                  />
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <FaSearch className="text-gray-400" />
                  </div>
                  {searchTerm && (
                    <button
                      onClick={() => setSearchTerm('')}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center"
                    >
                      <FaTimes className="text-gray-400 hover:text-gray-600" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Reviews List */}
      {filteredReviews.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm p-8 text-center">
          <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <FaCommentMedical className="text-4xl text-gray-400" />
          </div>
          <h3 className="text-xl font-bold text-gray-800 mb-2">Không có đánh giá nào</h3>
          <p className="text-gray-600 mb-4">
            {searchTerm ? 
              `Không có kết quả phù hợp với từ khóa "${searchTerm}"` : 
              ratingFilter !== 'all' ? 
                `Không có đánh giá nào với ${ratingFilter} sao` : 
                'Chưa có đánh giá nào'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6">
          {filteredReviews.map((review) => renderReviewCard(review))}
        </div>
      )}
      
      {/* Pagination */}
      {renderPagination()}
    </div>
  );
};

export default Reviews;
