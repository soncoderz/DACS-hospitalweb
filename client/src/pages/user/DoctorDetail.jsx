import React, { useState, useEffect } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import api from '../../utils/api';
import { useAuth } from '../../context/AuthContext';
import { toast } from 'react-toastify';
import { FaHeart, FaRegHeart, FaReply, FaCalendarCheck, FaHospital, FaStar } from 'react-icons/fa';

const DoctorDetail = () => {
  const { doctorId } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuth();
  
  const [doctor, setDoctor] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [topReviews, setTopReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isFavorite, setIsFavorite] = useState(false);
  const [replyingTo, setReplyingTo] = useState(null);
  const [replyText, setReplyText] = useState('');
  const [submitingReply, setSubmitingReply] = useState(false);

  const refreshFavoriteStatus = async () => {
    try {
      const favoriteRes = await api.get(`/doctors/${doctorId}/favorite`);
      const favoriteFlag = favoriteRes?.data?.data?.isFavorite;
      setIsFavorite(!!favoriteFlag);
    } catch (favoriteErr) {
      console.error('Error checking favorite status:', favoriteErr);
      setIsFavorite(false);
    }
  };

  const getDoctorRating = () => {
    const sources = [
      doctor?.ratings?.average,
      doctor?.averageRating,
      doctor?.rating
    ];
    const firstValid = sources.find((value) => typeof value === 'number' && !Number.isNaN(value));

    if (typeof firstValid === 'number') {
      return Math.min(5, Math.max(0, firstValid));
    }

    if (reviews.length > 0) {
      const total = reviews.reduce((sum, item) => sum + (item.rating || 0), 0);
      return Math.min(5, Math.max(0, total / reviews.length));
    }

    return 0;
  };

  const getReviewCount = () =>
    doctor?.ratings?.count ?? doctor?.reviewCount ?? doctor?.reviewsCount ?? reviews.length;
  
  // Function to fetch public data that doesn't require authentication
  const fetchPublicData = async () => {
    setLoading(true);
    try {
      // Fetch doctor details
      const doctorRes = await api.get(`/doctors/doctors/${doctorId}`, { 
        // Skip adding auth token for this request
        headers: { 'Skip-Auth': 'true' } 
      });
      console.log('Doctor data:', doctorRes.data.data);
      setDoctor(doctorRes.data.data);
      
      // Fetch reviews
      try {
        const reviewsRes = await api.get(`/reviews/doctor/${doctorId}`, {
          // Skip adding auth token for this request
          headers: { 'Skip-Auth': 'true' }
        });
        
        const reviewsData = reviewsRes.data.data || [];
        console.log('Reviews data:', reviewsData);
        
        // Set all reviews and sort by rating
        setReviews(reviewsData);
        
        // Get top 3 reviews by rating
        const sortedReviews = [...reviewsData].sort((a, b) => b.rating - a.rating);
        setTopReviews(sortedReviews.slice(0, 3));
      } catch (reviewErr) {
        console.error('Error fetching reviews:', reviewErr);
        setReviews([]);
        setTopReviews([]);
      }
      
      setError(null);
    } catch (err) {
      console.error('Error fetching doctor data:', err);
      setError('Failed to load doctor information. Please try again later.');
    } finally {
      setLoading(false);
    }
  };
  
  // Function to fetch data that requires authentication
  const fetchAuthenticatedData = async () => {
    if (!isAuthenticated) return;
    
    await refreshFavoriteStatus();
  };
  
  useEffect(() => {
    // Fetch public data first
    fetchPublicData();
    
    // If authenticated, fetch additional data
    if (isAuthenticated) {
      fetchAuthenticatedData();
    }
  }, [doctorId, isAuthenticated]);
  
  const handleAppointmentClick = () => {
    // Extract specialtyId and hospitalId from doctor object
    const specialtyId = doctor?.specialtyId?._id || doctor?.specialtyId;
    const hospitalId = doctor?.hospitalId?._id || doctor?.hospitalId;
    
    // Build URL with all available parameters
    let appointmentUrl = `/appointment?doctor=${doctorId}`;
    
    if (specialtyId) {
      appointmentUrl += `&specialty=${specialtyId}`;
    }
    
    if (hospitalId) {
      appointmentUrl += `&hospital=${hospitalId}`;
    }
    
    // If not authenticated, redirect to login
    if (!isAuthenticated) {
      navigate('/auth', { state: { from: appointmentUrl } });
      return;
    }
    
    // If authenticated, redirect directly to appointment page with all parameters
    navigate(appointmentUrl);
  };

  const toggleFavorite = async () => {
    if (!isAuthenticated) {
      navigate('/auth', { state: { from: `/doctors/${doctorId}` } });
      return;
    }

    try {
      if (isFavorite) {
        await api.delete(`/doctors/${doctorId}/favorite`);
        toast.success('Đã xóa bác sĩ khỏi danh sách yêu thích');
      } else {
        await api.post(`/doctors/${doctorId}/favorite`);
        toast.success('Đã thêm bác sĩ vào danh sách yêu thích');
      }
      await refreshFavoriteStatus();
    } catch (err) {
      console.error('Error toggling favorite:', err);
      const serverMessage = err?.response?.data?.message || '';

      // Nếu server báo đã có trong danh sách yêu thích, coi như trạng thái đang là yêu thích
      if (!isFavorite && serverMessage.toLowerCase().includes('đã có trong danh sách yêu thích')) {
        setIsFavorite(true);
        toast.info('Bác sĩ đã có trong danh sách yêu thích');
        return;
      }

      toast.error('Đã xảy ra lỗi khi cập nhật trạng thái yêu thích');
    }
  };

  const handleReplySubmit = async (reviewId) => {
    if (!isAuthenticated) {
      navigate('/auth', { state: { from: `/doctors/${doctorId}` } });
      return;
    }

    if (!replyText.trim()) {
      toast.error('Vui lòng nhập nội dung trả lời');
      return;
    }

    setSubmitingReply(true);
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
      setSubmitingReply(false);
    }
  };
  
  // Function to render star ratings
  const renderStars = (rating, keyPrefix = 'star') => {
    const safeRating = Number.isFinite(Number(rating)) ? Math.min(5, Math.max(0, Number(rating))) : 0;
    const stars = [];
    const fullStars = Math.floor(safeRating);
    const hasHalfStar = safeRating - fullStars >= 0.5;
    
    // Thêm sao đầy đủ
    for (let i = 0; i < fullStars; i++) {
      stars.push(<span key={`${keyPrefix}-full-${i}`} className="text-yellow-400">★</span>);
    }
    
    // Thêm nửa sao nếu cần
    if (hasHalfStar) {
      stars.push(<span key={`${keyPrefix}-half`} className="text-yellow-400">⭒</span>);
    }
    
    // Thêm sao trống cho đủ 5 sao
    const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);
    for (let i = 0; i < emptyStars; i++) {
      stars.push(<span key={`${keyPrefix}-empty-${i}`} className="text-gray-300">☆</span>);
    }
    
    return stars;
  };
  
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[200px] p-4">
        <div className="inline-block w-10 h-10 border-4 border-gray-200 rounded-full border-l-primary animate-spin"></div>
        <p className="mt-4 text-gray-600">Đang tải thông tin bác sĩ...</p>
      </div>
    );
  }
  
  if (error || !doctor) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-8 text-center max-w-2xl mx-auto my-8">
        <h2 className="text-2xl font-bold text-red-600 mb-3">Đã xảy ra lỗi!</h2>
        <p className="text-gray-700 mb-4">{error || 'Không tìm thấy bác sĩ này'}</p>
        <button 
          onClick={() => navigate('/doctors')} 
          className="bg-primary text-white hover:bg-primary-dark px-4 py-2 rounded font-medium transition-all"
        >
          Quay lại danh sách bác sĩ
        </button>
      </div>
    );
  }

  const doctorRating = getDoctorRating();
  const totalReviewCount = getReviewCount();
  
  return (
    <div className="py-8 bg-gray-50">
      <div className="container mx-auto px-4">
        <div className="bg-white rounded-lg shadow-md p-6 mb-8 flex flex-col md:flex-row gap-6">
          <div className="w-40 h-40 md:w-48 md:h-48 mx-auto md:mx-0 rounded-full overflow-hidden border-4 border-primary/10 flex-shrink-0">
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
          
          <div className="flex-1">
            <h1 className="text-2xl md:text-3xl font-bold text-gray-800 mb-2">BS. {doctor.user?.fullName || "Doctor"}</h1>
            <div className="flex flex-wrap gap-3 mb-3">
              {doctor.specialtyId && (
                <span className="bg-blue-50 text-primary px-3 py-1 rounded-full text-sm font-medium">
                  {doctor.specialtyId.name}
                </span>
              )}
              <span className="bg-gray-100 text-gray-700 px-3 py-1 rounded-full text-sm">
                {doctor.experience || 0} năm kinh nghiệm
              </span>
              <span className="bg-yellow-50 text-yellow-700 px-3 py-1 rounded-full text-sm flex items-center gap-2">
                <span className="flex items-center gap-1">
                  {renderStars(doctorRating, 'doctor-rating-badge')}
                </span>
                <span className="font-semibold">{doctorRating.toFixed(1)}</span>
                <span className="text-xs text-gray-600">
                  ({totalReviewCount} đánh giá)
                </span>
              </span>
            </div>
            
            {doctor.hospitalId && (
              <div className="text-gray-600 mb-4 flex items-center">
                <FaHospital className="mr-2 text-gray-500" />
                <span>{doctor.hospitalId.name}</span>
              </div>
            )}
            
            <div className="flex flex-wrap gap-3 mt-4">
              <button 
                onClick={handleAppointmentClick} 
                className="bg-primary hover:bg-primary-dark text-white px-6 py-3 rounded-md font-medium transition-all flex items-center"
              >
                <FaCalendarCheck className="mr-2" /> Đặt lịch khám
              </button>
              <button 
                onClick={toggleFavorite} 
                className={`flex items-center border px-4 py-3 rounded-md font-medium transition-all ${
                  isFavorite 
                    ? 'border-red-200 bg-red-50 text-red-500' 
                    : 'border-gray-300 hover:bg-gray-50 text-gray-700'
                }`}
                title={isFavorite ? "Xóa khỏi danh sách yêu thích" : "Thêm vào danh sách yêu thích"}
              >
                {isFavorite ? <FaHeart className="mr-2 text-red-500" /> : <FaRegHeart className="mr-2" />}
                <span>{isFavorite ? 'Đã yêu thích' : 'Yêu thích'}</span>
              </button>
            </div>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="md:col-span-2">
            <div className="bg-white rounded-lg shadow-md p-6 mb-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-4 border-b pb-2">Giới thiệu</h2>
              <div className="prose text-gray-700">
                <p>{doctor.description || 'Không có thông tin giới thiệu.'}</p>
              </div>
            </div>
            
            <div className="bg-white rounded-lg shadow-md p-6 mb-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-4 border-b pb-2">Chuyên môn</h2>
              <div className="text-gray-700">
                <ul className="list-disc pl-5 space-y-1">
                  {doctor.certifications?.length > 0 ? 
                    doctor.certifications.map((item, index) => (
                      <li key={index}>{item}</li>
                    )) : 
                    <li>Không có thông tin chuyên môn.</li>
                  }
                </ul>
              </div>
            </div>
            
            <div className="bg-white rounded-lg shadow-md p-6 mb-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-4 border-b pb-2">Trình độ học vấn</h2>
              <div className="text-gray-700">
                <ul className="list-disc pl-5 space-y-1">
                  {(typeof doctor.education === 'string' && doctor.education) ? 
                    <li>{doctor.education}</li> :
                    (doctor.education?.length > 0 ? 
                      doctor.education.map((item, index) => (
                        <li key={index}>{item}</li>
                      )) : 
                      <li>Không có thông tin học vấn.</li>
                    )
                  }
                </ul>
              </div>
            </div>
            
            {reviews.length > 0 && (
              <div className="bg-white rounded-lg shadow-md p-6">
                <h2 className="text-xl font-semibold text-gray-800 mb-4 border-b pb-2">Đánh giá từ bệnh nhân</h2>
                <div className="space-y-4">
                  {reviews.slice(0, 3).map(review => (
                    <div key={review._id} className="border border-gray-100 rounded-lg p-4 hover:shadow-sm transition-shadow">
                      <div className="flex items-start gap-3 mb-3">
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
                          <div className="font-medium text-gray-800">{review.userId?.fullName || 'Ẩn danh'}</div>
                          <div className="flex items-center mb-1">
                            <div className="flex mr-2">
                              {renderStars(review.rating || 0, review._id || `review-${review.createdAt}`)}
                            </div>
                            <div className="text-xs text-gray-500">
                              {review.createdAt ? new Date(review.createdAt).toLocaleDateString('vi-VN') : ''}
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="text-gray-700 text-sm">{review.comment || 'Không có nội dung đánh giá.'}</div>
                      
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
                                      {reply.createdAt ? new Date(reply.createdAt).toLocaleDateString('vi-VN') : ''}
                                    </div>
                                  </div>
                                </div>
                              </div>
                              <div className="text-sm text-gray-700">{reply.comment}</div>
                            </div>
                          ))}
                        </div>
                      )}
                      
                      {user && user._id && (
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
                                  disabled={submitingReply || !replyText.trim()}
                                  className="px-3 py-1 bg-primary text-white rounded text-sm hover:bg-primary-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                  {submitingReply ? 'Đang gửi...' : 'Gửi trả lời'}
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
                  ))}
                  
                  {reviews.length > 3 && (
                    <div className="text-center mt-4">
                      <Link to={`/reviews/doctor/${doctor._id}`} className="text-primary hover:text-primary-dark font-medium inline-flex items-center">
                        <FaStar className="mr-2" />
                        Xem tất cả {reviews.length} đánh giá
                      </Link>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
          
          <div className="md:col-span-1">
            <div className="bg-white rounded-lg shadow-md p-6 mb-6 sticky top-4">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Thông tin liên hệ</h3>
              
              {doctor.hospitalId && (
                <div className="mb-4">
                  <h4 className="text-sm font-medium text-gray-700 mb-1">Bệnh viện:</h4>
                  <p className="text-gray-700">{doctor.hospitalId.name}</p>
                  {doctor.hospitalId.address && (
                    <p className="text-gray-600 text-sm mt-1">{doctor.hospitalId.address}</p>
                  )}
                </div>
              )}
              
              {doctor.specializations && doctor.specializations.length > 0 && (
                <div className="mb-4">
                  <h4 className="text-sm font-medium text-gray-700 mb-1">Lĩnh vực chuyên môn:</h4>
                  <div className="flex flex-wrap gap-1">
                    {doctor.specializations.map((specialization, index) => (
                      <span key={index} className="bg-blue-50 text-blue-600 text-xs px-2 py-1 rounded">
                        {specialization}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              
              <div className="mt-6">
                <button 
                  onClick={handleAppointmentClick} 
                  className="w-full bg-primary hover:bg-primary-dark text-white py-3 rounded-md font-medium transition-all flex items-center justify-center"
                >
                  <FaCalendarCheck className="mr-2" /> Đặt lịch ngay
                </button>
              </div>
            </div>
          </div>
        </div>
        
        {/* Hiển thị đánh giá có rating cao ở dưới phần chi nhánh */}
        {topReviews.length > 0 && (
          <div className="mb-12 bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-6 border-b pb-2">Đánh giá nổi bật</h2>
            
            <div className="space-y-6">
              {topReviews.map((review, index) => (
                <div key={review._id} className="border border-gray-100 hover:border-gray-200 rounded-lg p-4 relative">
                  {index === 0 && (
                    <div className="absolute top-0 right-0 bg-yellow-500 text-white text-xs font-bold px-3 py-1 rounded-bl-lg rounded-tr-lg">
                      Đánh giá cao nhất
                    </div>
                  )}
                  <div className="flex items-start gap-3 mb-3">
                    <div className="flex-shrink-0 w-12 h-12 rounded-full overflow-hidden">
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
                      <div className="font-medium text-gray-800">{review.userId?.fullName || 'Ẩn danh'}</div>
                      <div className="flex items-center">
                        <div className="flex text-yellow-400 mr-2">
                          {renderStars(review.rating || 0, review._id || `top-${index}`)}
                        </div>
                        <div className="text-xs text-gray-500">
                          {review.createdAt ? new Date(review.createdAt).toLocaleDateString('vi-VN') : ''}
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="text-gray-700">{review.comment || 'Không có nội dung đánh giá.'}</div>
                  
                  {/* Display replies for top reviews too */}
                  {review.replies && review.replies.length > 0 && (
                    <div className="mt-3 pl-4 border-l-2 border-gray-100 space-y-3">
                      {review.replies.map((reply, index) => (
                        <div key={index} className="bg-gray-50 rounded-lg p-3">
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
                                  {reply.createdAt ? new Date(reply.createdAt).toLocaleDateString('vi-VN') : ''}
                                </div>
                              </div>
                              <div className="text-sm text-gray-700 mt-1">{reply.comment}</div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
        
        <div className="mb-8">
          <Link to="/doctors" className="inline-flex items-center bg-gray-200 hover:bg-gray-300 text-gray-700 px-4 py-2 rounded transition-colors">
            ← Quay lại danh sách bác sĩ
          </Link>
        </div>
      </div>
    </div>
  );
};

export default DoctorDetail; 
