import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../utils/api';
import { FaStar, FaReply, FaArrowLeft } from 'react-icons/fa';
import { toast } from 'react-toastify';

const DoctorReviews = () => {
  const { doctorId } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuth();
  
  const [doctor, setDoctor] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [replyingTo, setReplyingTo] = useState(null);
  const [replyText, setReplyText] = useState('');
  const [submittingReply, setSubmittingReply] = useState(false);
  const [sortBy, setSortBy] = useState('newest'); // newest, oldest, highest, lowest

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        // Fetch doctor details
        const doctorRes = await api.get(`/doctors/doctors/${doctorId}`, { 
          headers: { 'Skip-Auth': 'true' } 
        });
        setDoctor(doctorRes.data.data);

        // Fetch reviews for this doctor
        const reviewsRes = await api.get(`/reviews/doctor/${doctorId}`, {
          headers: { 'Skip-Auth': 'true' }
        });
        
        const reviewsData = reviewsRes.data.data || [];
        setReviews(reviewsData);
        setError(null);
      } catch (err) {
        console.error('Error fetching data:', err);
        setError('Không thể tải đánh giá. Vui lòng thử lại sau.');
      } finally {
        setLoading(false);
      }
    };

    if (doctorId) {
      fetchData();
    }
  }, [doctorId]);

  const handleReplySubmit = async (reviewId) => {
    if (!isAuthenticated) {
      navigate('/auth', { state: { from: `/reviews/doctor/${doctorId}` } });
      return;
    }

    if (!replyText.trim()) {
      toast.error('Vui lòng nhập nội dung trả lời');
      return;
    }

    setSubmittingReply(true);
    try {
      const response = await api.post(`/reviews/${reviewId}/reply`, {
        comment: replyText
      });

      // Update the reviews array with the new reply
      const updatedReviews = reviews.map(review => {
        if (review._id === reviewId) {
          return {
            ...review,
            replies: [...(review.replies || []), response.data.data]
          };
        }
        return review;
      });

      setReviews(updatedReviews);
      setReplyText('');
      setReplyingTo(null);
      toast.success('Đã gửi trả lời thành công');
    } catch (err) {
      console.error('Error submitting reply:', err);
      toast.error('Đã xảy ra lỗi khi gửi trả lời');
    } finally {
      setSubmittingReply(false);
    }
  };

  // Function to render star ratings
  const renderStars = (rating) => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating - fullStars >= 0.5;
    
    // Add full stars
    for (let i = 0; i < fullStars; i++) {
      stars.push(<span key={`full-${i}`} className="text-yellow-400">★</span>);
    }
    
    // Add half star if needed
    if (hasHalfStar) {
      stars.push(<span key="half" className="text-yellow-400">⭒</span>);
    }
    
    // Add empty stars to reach 5
    const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);
    for (let i = 0; i < emptyStars; i++) {
      stars.push(<span key={`empty-${i}`} className="text-gray-300">☆</span>);
    }
    
    return (
      <div className="flex items-center">
        <div className="flex">{stars}</div>
        <span className="ml-2 text-gray-700 text-sm">{rating.toFixed(1)}</span>
      </div>
    );
  };

  // Function to format date
  const formatDate = (dateString) => {
    return dateString ? new Date(dateString).toLocaleDateString('vi-VN') : '';
  };

  // Function to sort reviews
  const getSortedReviews = () => {
    if (!reviews.length) return [];
    
    const reviewsCopy = [...reviews];
    
    switch (sortBy) {
      case 'newest':
        return reviewsCopy.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      case 'oldest':
        return reviewsCopy.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
      case 'highest':
        return reviewsCopy.sort((a, b) => b.rating - a.rating);
      case 'lowest':
        return reviewsCopy.sort((a, b) => a.rating - b.rating);
      default:
        return reviewsCopy;
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] py-12">
        <div className="inline-block w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mb-4"></div>
        <p className="text-gray-600">Đang tải đánh giá...</p>
      </div>
    );
  }

  if (error || !doctor) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-8 text-center max-w-2xl mx-auto my-8">
        <h2 className="text-2xl font-bold text-red-600 mb-3">Đã xảy ra lỗi!</h2>
        <p className="text-gray-700 mb-4">{error || 'Không tìm thấy bác sĩ này'}</p>
        <button onClick={() => navigate('/doctors')} className="bg-primary text-white hover:bg-primary-dark px-4 py-2 rounded-lg font-medium transition-all">
          Quay lại danh sách bác sĩ
        </button>
      </div>
    );
  }

  const sortedReviews = getSortedReviews();
  const averageRating = reviews.length 
    ? reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length 
    : 0;
    
  return (
    <div className="bg-gray-50 min-h-screen py-8">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <Link to={`/doctors/${doctorId}`} className="inline-flex items-center text-primary hover:text-primary-dark mb-4">
              <FaArrowLeft className="mr-2" /> Quay lại thông tin bác sĩ
            </Link>
            
            <div className="bg-white rounded-xl shadow-md p-6">
              <div className="flex items-start gap-4">
                <div className="w-16 h-16 rounded-full overflow-hidden flex-shrink-0">
                  <img 
                    src={doctor.user?.avatarUrl || '/avatars/default-avatar.png'} 
                    alt={doctor.user?.fullName || "Doctor"}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src = '/avatars/default-avatar.png';
                    }}
                  />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-gray-800 mb-1">
                    Đánh giá cho BS. {doctor.user?.fullName || "Doctor"}
                  </h1>
                  
                  <div className="flex flex-wrap items-center gap-3 mb-2">
                    {doctor.specialtyId && (
                      <span className="bg-blue-50 text-primary px-3 py-1 rounded-full text-sm font-medium">
                        {doctor.specialtyId.name}
                      </span>
                    )}
                    <div className="bg-yellow-50 text-yellow-700 px-3 py-1 rounded-full text-sm flex items-center">
                      <FaStar className="text-yellow-500 mr-1" />
                      <span className="font-bold">{averageRating.toFixed(1)}</span>
                      <span className="text-sm ml-1">({reviews.length} đánh giá)</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Sort controls */}
          <div className="bg-white rounded-xl shadow-md p-4 mb-6">
            <div className="flex items-center justify-between flex-wrap">
              <div className="font-medium text-gray-700 mb-2 md:mb-0">
                {reviews.length} đánh giá
              </div>
              <div className="flex items-center">
                <span className="text-gray-600 mr-2">Sắp xếp theo:</span>
                <select 
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="border border-gray-300 rounded px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="newest">Mới nhất</option>
                  <option value="oldest">Cũ nhất</option>
                  <option value="highest">Đánh giá cao nhất</option>
                  <option value="lowest">Đánh giá thấp nhất</option>
                </select>
              </div>
            </div>
          </div>
          
          {/* Reviews list */}
          {sortedReviews.length > 0 ? (
            <div className="space-y-4">
              {sortedReviews.map(review => (
                <div key={review._id} className="bg-white rounded-xl shadow-md p-6">
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 w-10 h-10 md:w-12 md:h-12 rounded-full overflow-hidden">
                      <img 
                        src={review.userId?.avatarUrl || 'https://cdn-icons-png.flaticon.com/512/149/149071.png'} 
                        alt={review.userId?.fullName || 'Ẩn danh'}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.target.onerror = null;
                          e.target.src = 'https://cdn-icons-png.flaticon.com/512/149/149071.png';
                        }}
                      />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1 flex-wrap">
                        <div className="font-medium text-gray-800">{review.userId?.fullName || 'Ẩn danh'}</div>
                        <div className="text-xs text-gray-500">
                          {formatDate(review.createdAt)}
                        </div>
                      </div>
                      <div className="flex items-center mb-2">
                        {renderStars(review.rating || 0)}
                      </div>
                      <div className="text-gray-700">{review.comment || 'Không có nội dung đánh giá.'}</div>
                      
                      {/* Display existing replies */}
                      {review.replies && review.replies.length > 0 && (
                        <div className="mt-3 pl-5 border-l-2 border-gray-100 space-y-3">
                          {review.replies.map((reply, index) => (
                            <div key={index} className="bg-gray-50 rounded p-3">
                              <div className="flex items-start gap-2 mb-2">
                                <div className="w-8 h-8 rounded-full overflow-hidden flex-shrink-0">
                                  <img 
                                    src={reply.userId?.avatarUrl || 'https://cdn-icons-png.flaticon.com/512/149/149071.png'} 
                                    alt={reply.userId?.fullName || 'Người dùng'}
                                    className="w-full h-full object-cover"
                                    onError={(e) => {
                                      e.target.onerror = null;
                                      e.target.src = 'https://cdn-icons-png.flaticon.com/512/149/149071.png';
                                    }}
                                  />
                                </div>
                                <div className="flex-1">
                                  <div className="flex items-center justify-between">
                                    <div className="font-medium text-sm text-gray-800">{reply.userId?.fullName || 'Người dùng'}</div>
                                    <div className="text-xs text-gray-500">
                                      {formatDate(reply.createdAt)}
                                    </div>
                                  </div>
                                  <div className="text-sm text-gray-700 mt-1">{reply.comment}</div>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                      
                      {/* Reply form */}
                      {isAuthenticated && (
                        <div className="mt-3">
                          {replyingTo === review._id ? (
                            <div className="mt-2">
                              <textarea
                                value={replyText}
                                onChange={(e) => setReplyText(e.target.value)}
                                placeholder="Nhập trả lời của bạn..."
                                className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none"
                                rows={3}
                              />
                              <div className="flex justify-end gap-2 mt-2">
                                <button
                                  onClick={() => {
                                    setReplyingTo(null);
                                    setReplyText('');
                                  }}
                                  className="px-3 py-1 bg-gray-100 text-gray-700 rounded text-sm hover:bg-gray-200 transition-colors"
                                >
                                  Hủy
                                </button>
                                <button
                                  onClick={() => handleReplySubmit(review._id)}
                                  disabled={submittingReply || !replyText.trim()}
                                  className="px-3 py-1 bg-primary text-white rounded text-sm hover:bg-primary-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                  {submittingReply ? 'Đang gửi...' : 'Gửi trả lời'}
                                </button>
                              </div>
                            </div>
                          ) : (
                            <button
                              onClick={() => setReplyingTo(review._id)}
                              className="text-sm text-primary flex items-center mt-2 hover:text-primary-dark"
                            >
                              <FaReply className="mr-1" /> Trả lời
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-xl shadow-md p-6 text-center">
              <div className="text-gray-500">
                Chưa có đánh giá nào cho bác sĩ này.
              </div>
            </div>
          )}
          
          {/* Back button */}
          <div className="mt-6 text-center">
            <Link to={`/doctors/${doctorId}`} className="inline-flex items-center bg-gray-100 hover:bg-gray-200 text-gray-800 font-medium py-3 px-6 rounded-lg transition-colors">
              <FaArrowLeft className="mr-2" />
              Quay lại thông tin bác sĩ
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DoctorReviews; 