import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../utils/api';
import { FaStar, FaReply, FaArrowLeft } from 'react-icons/fa';
import { toast } from 'react-toastify';

const HospitalReviews = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuth();
  
  const [hospital, setHospital] = useState(null);
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
        // Fetch hospital details
        const hospitalRes = await api.get(`/hospitals/${id}`);
        setHospital(hospitalRes.data.data);

        // Fetch reviews for this hospital
        const reviewsRes = await api.get(`/reviews/hospital/${id}`);
        
        // Handle different response structures
        let reviewsData = [];
        if (reviewsRes.data.data && reviewsRes.data.data.docs) {
          reviewsData = reviewsRes.data.data.docs;
        } else if (Array.isArray(reviewsRes.data.data)) {
          reviewsData = reviewsRes.data.data;
        }
        
        setReviews(reviewsData);
        setError(null);
      } catch (err) {
        console.error('Error fetching data:', err);
        setError('Không thể tải đánh giá. Vui lòng thử lại sau.');
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchData();
    }
  }, [id]);

  const handleReplySubmit = async (reviewId) => {
    if (!isAuthenticated) {
      navigate('/auth', { state: { from: `/reviews/hospital/${id}` } });
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

  // Enhanced function to render star ratings with better UI
  const renderStars = (rating) => {
    return (
      <div className="flex items-center">
        {[1, 2, 3, 4, 5].map((star) => (
          <FaStar 
            key={star}
            className={`${star <= Math.floor(rating) 
              ? 'text-yellow-500' 
              : star <= Math.ceil(rating) && rating % 1 !== 0 
                ? 'text-yellow-300' 
                : 'text-gray-300'
            } w-4 h-4`}
          />
        ))}
        <span className="ml-2 font-semibold text-gray-700">{rating.toFixed(1)}</span>
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

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-8 text-center max-w-2xl mx-auto my-8">
        <h2 className="text-2xl font-bold text-red-600 mb-3">Đã xảy ra lỗi!</h2>
        <p className="text-gray-700 mb-4">{error}</p>
        <button onClick={() => navigate('/branches')} className="bg-primary text-white hover:bg-primary-dark px-4 py-2 rounded-lg font-medium transition-all">
          Quay lại danh sách chi nhánh
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
            <Link to={`/branches/${id}`} className="inline-flex items-center text-primary hover:text-primary-dark mb-4">
              <FaArrowLeft className="mr-2" /> Quay lại chi tiết chi nhánh
            </Link>
            
            <div className="bg-white rounded-xl shadow-md p-6">
              <h1 className="text-2xl font-bold text-gray-800 mb-2">
                Đánh giá cho {hospital?.name || 'Chi nhánh'}
              </h1>
              
              <div className="flex flex-wrap items-center gap-3 mb-4">
                <div className="bg-blue-50 text-blue-700 px-4 py-2 rounded-lg flex items-center">
                  <div className="flex items-center mr-2">
                    <FaStar className="text-yellow-500 mr-1" />
                    <span className="font-bold">{averageRating.toFixed(1)}</span>
                  </div>
                  <span className="text-sm">({reviews.length} đánh giá)</span>
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
                  <div className="flex items-start">
                    <div className="mr-4">
                      <img 
                        src={review.userId?.avatarUrl || 'https://cdn-icons-png.flaticon.com/512/149/149071.png'} 
                        alt={review.userId?.fullName || 'Ẩn danh'}
                        className="w-12 h-12 rounded-full object-cover border border-gray-200"
                        onError={(e) => {
                          e.target.onerror = null;
                          e.target.src = 'https://cdn-icons-png.flaticon.com/512/149/149071.png';
                        }}
                      />
                    </div>
                    <div className="flex-1">
                      <div className="flex flex-wrap items-center gap-2 mb-1">
                        <h4 className="font-semibold text-gray-800">{review.userId?.fullName || 'Ẩn danh'}</h4>
                        <span className="text-gray-400 text-sm">•</span>
                        <span className="text-gray-500 text-sm">{formatDate(review.createdAt)}</span>
                      </div>
                      <div className="mb-2">
                        {renderStars(review.rating || 0)}
                      </div>
                      <p className="text-gray-700 mb-3">{review.comment || 'Không có nội dung đánh giá.'}</p>
                  
                      {/* Replies */}
                      {review.replies && review.replies.length > 0 && (
                        <div className="mt-3 pl-4 border-l-2 border-gray-100 space-y-3">
                          {review.replies.map((reply, index) => (
                            <div key={index} className="bg-gray-50 rounded-lg p-3">
                              <div className="flex items-center gap-2 mb-1">
                                <img 
                                  src={reply.userId?.avatarUrl || 'https://cdn-icons-png.flaticon.com/512/149/149071.png'} 
                                  alt={reply.userId?.fullName || 'Người dùng'}
                                  className="w-8 h-8 rounded-full"
                                  onError={(e) => {
                                    e.target.onerror = null;
                                    e.target.src = 'https://cdn-icons-png.flaticon.com/512/149/149071.png';
                                  }}
                                />
                                <div>
                                  <div className="font-semibold text-sm text-gray-800">{reply.userId?.fullName || 'Người dùng'}</div>
                                  <div className="text-xs text-gray-500">{formatDate(reply.createdAt)}</div>
                                </div>
                              </div>
                              <p className="text-gray-700 text-sm">{reply.comment}</p>
                            </div>
                          ))}
                        </div>
                      )}
                      
                      {/* Reply button and form */}
                      {isAuthenticated && (
                        <div className="mt-3">
                          {replyingTo === review._id ? (
                            <div className="border border-gray-200 rounded-lg p-3">
                              <textarea
                                value={replyText}
                                onChange={(e) => setReplyText(e.target.value)}
                                placeholder="Nhập trả lời của bạn..."
                                className="w-full border border-gray-200 rounded p-2 text-sm focus:ring-primary focus:border-primary"
                                rows={3}
                                disabled={submittingReply}
                              ></textarea>
                              <div className="flex justify-end gap-2 mt-2">
                                <button
                                  className="px-4 py-1 text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 rounded transition-colors"
                                  onClick={() => {
                                    setReplyingTo(null);
                                    setReplyText('');
                                  }}
                                  disabled={submittingReply}
                                >
                                  Hủy
                                </button>
                                <button
                                  className="px-4 py-1 text-sm bg-primary hover:bg-primary-dark text-white rounded transition-colors"
                                  onClick={() => handleReplySubmit(review._id)}
                                  disabled={submittingReply}
                                >
                                  {submittingReply ? 'Đang gửi...' : 'Gửi trả lời'}
                                </button>
                              </div>
                            </div>
                          ) : (
                            <button
                              className="text-primary hover:text-primary-dark text-sm font-medium flex items-center"
                              onClick={() => setReplyingTo(review._id)}
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
                Chưa có đánh giá nào cho chi nhánh này.
              </div>
            </div>
          )}
          
          {/* Back button */}
          <div className="mt-6 text-center">
            <Link to={`/branches/${id}`} className="inline-flex items-center bg-gray-100 hover:bg-gray-200 text-gray-800 font-medium py-3 px-6 rounded-lg transition-colors">
              <FaArrowLeft className="mr-2" />
              Quay lại chi tiết chi nhánh
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HospitalReviews; 