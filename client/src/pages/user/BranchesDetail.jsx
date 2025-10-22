import React, { useState, useEffect } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../utils/api';

import { FaStar, FaMapMarkerAlt, FaPhone, FaEnvelope, FaClock, FaUser, FaCalendarAlt, FaStethoscope, FaHeartbeat, FaLaptopMedical, FaHospital, FaReply, FaUserMd } from 'react-icons/fa';
import { toast } from 'react-toastify';

const BranchDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const [branch, setBranch] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [specialties, setSpecialties] = useState([]);
  const [services, setServices] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [topReviews, setTopReviews] = useState([]);
  const [replyingTo, setReplyingTo] = useState(null);
  const [replyText, setReplyText] = useState('');
  const [submittingReply, setSubmittingReply] = useState(false);

  useEffect(() => {
    const fetchBranchData = async () => {
      // Check if id is valid before making API calls
      if (!id) {
        setError('Branch ID is missing. Please select a valid branch.');
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        // Fetch branch details
        const branchRes = await api.get(`/hospitals/${id}`);
        console.log('Branch data:', branchRes.data.data);
        setBranch(branchRes.data.data);

        // Fetch reviews for this branch
        const reviewsRes = await api.get(`/reviews/hospital/${id}`);
        console.log('Reviews data:', reviewsRes.data.data);
        
        // Handle paginated response structure
        let reviewsData = [];
        if (reviewsRes.data.data && reviewsRes.data.data.docs) {
          // If response has pagination structure with docs array
          reviewsData = reviewsRes.data.data.docs;
        } else if (Array.isArray(reviewsRes.data.data)) {
          // If response is already an array
          reviewsData = reviewsRes.data.data;
        } else {
          // Default to empty array if no valid data structure
          reviewsData = [];
        }
        
        setReviews(reviewsData);

        // Get top 3 reviews with highest rating
        const sortedReviews = [...reviewsData].sort((a, b) => b.rating - a.rating);
        setTopReviews(sortedReviews.slice(0, 3));

        // Fetch doctors for this branch
        const doctorsRes = await api.get(`/hospitals/${id}/doctors`);
        setDoctors(doctorsRes.data.data || []);

        // Fetch specialties for this branch
        const specialtiesRes = await api.get(`/hospitals/${id}/specialties`);
        setSpecialties(specialtiesRes.data.data || []);

        // Fetch services for this branch
        const servicesRes = await api.get(`/hospitals/${id}/services`);
        setServices(servicesRes.data.data || []);

        setError(null);
      } catch (err) {
        console.error('Error fetching branch data:', err);
        setError('Failed to load branch information. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchBranchData();
  }, [id, navigate]);

  const handleAppointmentClick = () => {
    // If not authenticated, redirect to login
    if (!isAuthenticated) {
      navigate('/auth', { state: { from: `/appointment?branch=${id}` } });
      return;
    }

    // If authenticated, redirect directly to appointment page with branch preselected
    navigate(`/appointment?branch=${id}`);
  };

  const handleReplySubmit = async (reviewId) => {
    if (!isAuthenticated) {
      navigate('/auth', { state: { from: `/branches/${id}` } });
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
      
      // Update top reviews if needed
      const updatedTopReviews = topReviews.map(review => {
        if (review._id === reviewId) {
          return {
            ...review,
            replies: [...(review.replies || []), response.data.data]
          };
        }
        return review;
      });
      
      setTopReviews(updatedTopReviews);
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

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] py-12">
        <div className="inline-block w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mb-4"></div>
        <p className="text-gray-600">Đang tải thông tin chi nhánh...</p>
      </div>
    );
  }

  if (error || !branch) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-8 text-center max-w-2xl mx-auto my-8">
        <h2 className="text-2xl font-bold text-red-600 mb-3">Đã xảy ra lỗi!</h2>
        <p className="text-gray-700 mb-4">{error || 'Không tìm thấy chi nhánh này'}</p>
        <button onClick={() => navigate('/branches')} className="bg-primary text-white hover:bg-primary-dark px-4 py-2 rounded-lg font-medium transition-all">
          Quay lại danh sách chi nhánh
        </button>
      </div>
    );
  }

  // Calculate rating value safely
  const branchRating = (() => {
    if (typeof branch.averageRating === 'number') {
      return branch.averageRating;
    } else if (typeof branch.avgRating === 'number') {
      return branch.avgRating;
    } else if (branch.rating) {
      return branch.rating;
    } else if (branch.ratings && typeof branch.ratings.average === 'number') {
      return branch.ratings.average;
    }
    return 0;
  })();

  const reviewCount = branch.reviewCount || branch.numReviews || reviews.length || 0;
  const doctorCount = doctors.length || branch.doctorCount || 0;

  return (
    <div className="bg-gray-50 min-h-screen pb-12">
      {/* Hero Banner */}
      <section className="bg-gradient-to-r from-primary to-blue-700 relative py-20 overflow-hidden">
        <div className="absolute inset-0 overflow-hidden">
            <img
            src={branch.imageUrl || "https://img.freepik.com/free-photo/hospital-building-modern-parking-lot_1127-3616.jpg"}
            alt={branch.name} 
            className="w-full h-full object-cover object-center opacity-20" 
              onError={(e) => {
                e.target.onerror = null;
              e.target.src = "https://img.freepik.com/free-photo/hospital-building-modern-parking-lot_1127-3616.jpg";
            }}
          />
        </div>
        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-4xl mx-auto text-center text-white">
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4">
              {branch.name}
            </h1>
            <div className="flex items-center justify-center mb-4">
              <div className="flex items-center bg-white/20 backdrop-blur-sm px-4 py-2 rounded-full">
                <div className="flex items-center text-yellow-300 mr-2">
                  <FaStar className="mr-1" />
                  <span className="font-medium">{branchRating.toFixed(1)}</span>
                </div>
                <span className="text-white/80">({reviewCount} đánh giá)</span>
                <span className="mx-2 text-white/50">•</span>
                <div className="flex items-center">
                  <FaUserMd className="mr-1" />
                  <span>{doctorCount} bác sĩ</span>
                </div>
              </div>
            </div>
            <p className="text-xl opacity-90 mb-8">
              {branch.description || 'Chi nhánh bệnh viện với đội ngũ y bác sĩ chuyên nghiệp, trang thiết bị hiện đại'}
            </p>
            <button
              onClick={handleAppointmentClick}
              className="bg-white text-primary hover:bg-gray-100 font-semibold px-6 py-3 rounded-lg transition-all shadow-lg hover:-translate-y-1"
            >
              Đặt Lịch Khám
            </button>
          </div>
        </div>
        <svg className="absolute bottom-0 left-0 w-full text-gray-50" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1440 100">
          <path fill="currentColor" fillOpacity="1" d="M0,32L80,42.7C160,53,320,75,480,74.7C640,75,800,53,960,48C1120,43,1280,53,1360,58.7L1440,64L1440,100L1360,100C1280,100,1120,100,960,100C800,100,640,100,480,100C320,100,160,100,80,100L0,100Z"></path>
        </svg>
      </section>
      
      {/* Rest of branch detail content */}
      <div className="container mx-auto px-4 py-8">
        {/* Branch Info Card */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
          <div className="flex flex-col md:flex-row">
            <div className="md:w-1/2 md:pr-8 mb-6 md:mb-0">
              <h2 className="text-2xl font-bold text-gray-800 mb-4 flex items-center">
                <FaHospital className="text-primary mr-2" />
                Thông tin chi nhánh
              </h2>
              
              <div className="space-y-4">
                <div className="flex items-start">
                  <FaMapMarkerAlt className="text-primary mt-1 mr-3 flex-shrink-0" />
                  <div>
                    <div className="font-medium text-gray-700">Địa chỉ</div>
                    <div className="text-gray-600">{branch.address || "Không có thông tin"}</div>
                  </div>
          </div>

                {branch.phone && (
                  <div className="flex items-start">
                    <FaPhone className="text-primary mt-1 mr-3 flex-shrink-0" />
                    <div>
                      <div className="font-medium text-gray-700">Số điện thoại</div>
                      <div className="text-gray-600">{branch.phone}</div>
                    </div>
                  </div>
                )}
                
                {branch.email && (
                  <div className="flex items-start">
                    <FaEnvelope className="text-primary mt-1 mr-3 flex-shrink-0" />
                    <div>
                      <div className="font-medium text-gray-700">Email</div>
                      <div className="text-gray-600">{branch.email}</div>
                    </div>
                  </div>
                )}
                
                {branch.openingHours && (
                  <div className="flex items-start">
                    <FaClock className="text-primary mt-1 mr-3 flex-shrink-0" />
                    <div>
                      <div className="font-medium text-gray-700">Giờ làm việc</div>
                      <div className="text-gray-600">{branch.openingHours}</div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="md:w-1/2 md:pl-8 md:border-l border-gray-200">
              <h2 className="text-2xl font-bold text-gray-800 mb-4 flex items-center">
                <FaStethoscope className="text-primary mr-2" />
                Tổng quan
              </h2>
              
              <div className="grid grid-cols-2 gap-6">
                <div className="bg-gray-50 p-4 rounded-lg text-center">
                  <div className="text-xl font-bold text-primary mb-1">{doctorCount}</div>
                  <div className="text-gray-600 text-sm">Bác sĩ</div>
                </div>
                
                <div className="bg-gray-50 p-4 rounded-lg text-center">
                  <div className="text-xl font-bold text-primary mb-1">{specialties.length}</div>
                  <div className="text-gray-600 text-sm">Chuyên khoa</div>
                </div>
                
                <div className="bg-gray-50 p-4 rounded-lg text-center">
                  <div className="text-xl font-bold text-primary mb-1">{services.length}</div>
                  <div className="text-gray-600 text-sm">Dịch vụ</div>
                </div>
                
                <div className="bg-gray-50 p-4 rounded-lg text-center">
                  <div className="text-xl font-bold text-primary mb-1">{reviewCount}</div>
                  <div className="text-gray-600 text-sm">Đánh giá</div>
                </div>
              </div>
              
              <button
                onClick={handleAppointmentClick}
                className="mt-6 w-full bg-primary hover:bg-primary-dark text-white py-3 rounded-lg font-medium transition-all flex items-center justify-center"
              >
                <FaCalendarAlt className="mr-2" />
                Đặt lịch khám ngay
              </button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main content - left column (2/3 width on large screens) */}
          <div className="lg:col-span-2">
            {/* About section */}
            <div className="bg-white rounded-xl shadow-sm p-6 mb-8">
              <h2 className="text-2xl font-bold text-gray-800 mb-4">Giới thiệu</h2>
              <p className="text-gray-700 leading-relaxed">
                {branch.description || 'Không có thông tin giới thiệu.'}
              </p>
            </div>

            {/* Specialties section */}
            {specialties.length > 0 && (
              <div className="bg-white rounded-xl shadow-sm p-6 mb-8">
                <h2 className="text-2xl font-bold text-gray-800 mb-4 flex items-center">
                  <FaStethoscope className="text-primary mr-2" />
                  Chuyên khoa
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {specialties.map(specialty => (
                    <div key={specialty._id} className="border border-gray-100 rounded-lg p-4 hover:border-primary/30 hover:shadow-md transition-all">
                      <h3 className="font-semibold text-lg text-gray-800 mb-2">{specialty.name}</h3>
                      <p className="text-gray-600 text-sm mb-3 line-clamp-2">{specialty.description || 'Không có mô tả.'}</p>
                      <Link to={`/specialties/${specialty._id}`} className="text-primary hover:text-primary-dark font-medium text-sm flex items-center">
                          Xem chi tiết
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-1" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                        </svg>
                        </Link>
                      </div>
                    ))}
                  </div>
                <Link to="/specialties" className="mt-4 text-primary hover:text-primary-dark font-medium inline-flex items-center">
                    Xem tất cả chuyên khoa
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-1" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                  </svg>
                  </Link>
              </div>
            )}

            {/* Services section */}
            {services.length > 0 && (
              <div className="bg-white rounded-xl shadow-sm p-6 mb-8">
                <h2 className="text-2xl font-bold text-gray-800 mb-4 flex items-center">
                  <FaHeartbeat className="text-primary mr-2" />
                  Dịch vụ y tế
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {services.map(service => (
                    <div key={service._id} className="border border-gray-100 rounded-lg p-4 hover:border-primary/30 hover:shadow-md transition-all">
                      <h3 className="font-semibold text-lg text-gray-800 mb-2">{service.name}</h3>
                      <p className="text-gray-600 text-sm mb-2 line-clamp-2">{service.description || 'Không có mô tả.'}</p>
                      <div className="text-primary font-medium mb-3">
                        {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(service.price || 0)}
                      </div>
                      <Link to={`/services/${service._id}`} className="text-primary hover:text-primary-dark font-medium text-sm flex items-center">
                          Xem chi tiết
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-1" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                        </svg>
                      </Link>
                      </div>
                    ))}
                </div>
                <Link to="/services" className="mt-4 text-primary hover:text-primary-dark font-medium inline-flex items-center">
                  Xem tất cả dịch vụ
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-1" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                  </svg>
                </Link>
              </div>
            )}

            {/* Reviews section */}
            {reviews.length > 0 && (
              <div className="bg-white rounded-xl shadow-sm p-6 mb-8">
                <h2 className="text-2xl font-bold text-gray-800 mb-4 flex items-center">
                  <FaStar className="text-primary mr-2" />
                  Đánh giá từ bệnh nhân
                </h2>
                <div className="space-y-6">
                  {reviews.slice(0, 3).map(review => (
                    <div key={review._id} className="border-b border-gray-100 pb-6 last:border-0 last:pb-0">
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
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                  
                  {reviews.length > 3 && (
                  <div className="text-center mt-6">
                    <button className="bg-gray-100 hover:bg-gray-200 text-gray-800 px-6 py-2 rounded-lg font-medium transition-colors">
                      Xem thêm đánh giá
                    </button>
                    </div>
                  )}
              </div>
            )}
          </div>

          {/* Sidebar - right column (1/3 width on large screens) */}
          <div className="lg:col-span-1">
            {/* Book appointment card */}
            <div className="bg-white rounded-xl shadow-sm p-6 mb-8 sticky top-4">
              <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center">
                <FaCalendarAlt className="text-primary mr-2" />
                Đặt lịch khám
              </h3>
              <p className="text-gray-600 mb-6">
                Đặt lịch khám tại chi nhánh {branch.name} để được tư vấn và thăm khám với các bác sĩ chuyên môn cao.
              </p>
              <button
                onClick={handleAppointmentClick}
                className="w-full bg-primary hover:bg-primary-dark text-white py-3 px-4 rounded-lg font-medium transition-colors flex items-center justify-center"
              >
                <FaCalendarAlt className="mr-2" /> Đặt lịch ngay
                </button>
            </div>

            {/* Contact info card */}
            <div className="bg-white rounded-xl shadow-sm p-6 mb-8">
              <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center">
                <FaPhone className="text-primary mr-2" />
                Thông tin liên hệ
              </h3>
              <div className="space-y-4">
                <div className="flex items-start">
                  <FaMapMarkerAlt className="text-primary mt-1 mr-3 flex-shrink-0" />
                  <div>
                    <h4 className="font-semibold text-gray-800 mb-1">Địa chỉ</h4>
                    <p className="text-gray-600">{branch.address || 'Chưa có thông tin địa chỉ'}</p>
                  </div>
                </div>
                <div className="flex items-start">
                  <FaPhone className="text-primary mt-1 mr-3 flex-shrink-0" />
                  <div>
                    <h4 className="font-semibold text-gray-800 mb-1">Số điện thoại</h4>
                    <p className="text-gray-600">{branch.phone || 'Không có thông tin'}</p>
            </div>
                </div>
                <div className="flex items-start">
                  <FaEnvelope className="text-primary mt-1 mr-3 flex-shrink-0" />
                  <div>
                    <h4 className="font-semibold text-gray-800 mb-1">Email</h4>
                    <p className="text-gray-600">{branch.email || 'Không có thông tin'}</p>
                  </div>
                </div>
                <div className="flex items-start">
                  <FaClock className="text-primary mt-1 mr-3 flex-shrink-0" />
                  <div>
                    <h4 className="font-semibold text-gray-800 mb-1">Giờ làm việc</h4>
                    {branch.workingHours ? (
                      <div className="space-y-1 text-sm text-gray-600">
                        {Object.entries(branch.workingHours).map(([day, hours]) => {
                          const dayNames = {
                            monday: 'Thứ 2',
                            tuesday: 'Thứ 3',
                            wednesday: 'Thứ 4',
                            thursday: 'Thứ 5',
                            friday: 'Thứ 6',
                            saturday: 'Thứ 7',
                            sunday: 'Chủ nhật'
                          };
                          return hours ? (
                            <div key={day} className="flex justify-between">
                              <span>{dayNames[day]}:</span>
                              <span>{hours.isOpen ? `${hours.open} - ${hours.close}` : 'Đóng cửa'}</span>
                          </div>
                          ) : null;
                        })}
                      </div>
                    ) : (
                      <p className="text-gray-600">8:00 - 17:00, Thứ 2 - Thứ 7</p>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Map card */}
            <div className="bg-white rounded-xl shadow-sm p-6 mb-8">
              <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center">
                <FaMapMarkerAlt className="text-primary mr-2" />
                Bản đồ
              </h3>
              <div className="rounded-lg overflow-hidden border border-gray-200">
                <img 
                  src="https://developers.google.com/static/maps/images/landing/hero_maps_static_api.png" 
                  alt="Map location"
                  className="w-full h-48 object-cover"
                />
                <div className="p-3 bg-gray-50 text-center">
                  <a 
                    href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(branch.address || '')}`}
                    className="text-primary hover:text-primary-dark font-medium text-sm flex items-center justify-center"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <FaMapMarkerAlt className="mr-1" />
                    Xem trên Google Maps
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Top reviews section */}
        {topReviews.length > 0 && (
          <div className="mt-8 mb-12">
            <div className="bg-white rounded-xl shadow-sm p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-800 flex items-center">
                  <FaStar className="text-primary mr-2" />
                  Đánh giá nổi bật
                </h2>
            </div>
            
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {topReviews.map((review, index) => (
                  <div key={review._id} className="border border-gray-100 rounded-lg p-5 relative hover:shadow-md transition-all">
                    {index === 0 && (
                      <div className="absolute -top-3 -right-3 bg-primary text-white text-xs px-2 py-1 rounded-full shadow-md">
                        Đánh giá cao nhất
                      </div>
                    )}
                    <div className="flex items-start mb-3">
                      <img 
                        src={review.userId?.avatarUrl || 'https://cdn-icons-png.flaticon.com/512/149/149071.png'} 
                        alt={review.userId?.fullName || 'Ẩn danh'}
                        className="w-10 h-10 rounded-full mr-3 object-cover border border-gray-200"
                        onError={(e) => {
                          e.target.onerror = null;
                          e.target.src = 'https://cdn-icons-png.flaticon.com/512/149/149071.png';
                        }}
                      />
                      <div>
                        <h4 className="font-semibold text-gray-800">{review.userId?.fullName || 'Ẩn danh'}</h4>
                        <div className="flex items-center">
                          {renderStars(review.rating || 0)}
                    </div>
                        <div className="text-sm text-gray-500 mt-1">{formatDate(review.createdAt)}</div>
                      </div>
                    </div>
                    <p className="text-gray-700 mb-3 line-clamp-3">{review.comment || 'Không có nội dung đánh giá.'}</p>
                  
                    {/* Show number of replies if any */}
                  {review.replies && review.replies.length > 0 && (
                      <div className="text-sm text-primary font-medium">
                        {review.replies.length} phản hồi
                    </div>
                  )}
                </div>
              ))}
              </div>
            </div>
          </div>
        )}

        {/* Back to branches button */}
        <div className="text-center mt-6">
          <Link to="/branches" className="inline-flex items-center justify-center bg-gray-100 hover:bg-gray-200 text-gray-800 font-medium py-3 px-6 rounded-lg transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
            Quay lại danh sách chi nhánh
          </Link>
        </div>
      </div>
    </div>
  );
};

export default BranchDetail; 
