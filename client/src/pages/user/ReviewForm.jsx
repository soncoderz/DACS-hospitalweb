import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../utils/api';
import { toast, ToastContainer } from 'react-toastify';
import { FaStar, FaArrowLeft, FaUserMd, FaHospital, FaPaperPlane, FaUser, FaCertificate, FaMapMarkerAlt } from 'react-icons/fa';

const ReviewForm = () => {
  const { id, type } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [appointment, setAppointment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [doctorAvatarError, setDoctorAvatarError] = useState(false);
  const [hospitalLogoError, setHospitalLogoError] = useState(false);
  const [userAvatarError, setUserAvatarError] = useState(false);
  
  const [rating, setRating] = useState(5);
  const [hoverRating, setHoverRating] = useState(0);
  const [content, setContent] = useState('');

  useEffect(() => {
    if (type !== 'doctor' && type !== 'hospital') {
      navigate(`/appointments/${id}/review`);
      return;
    }
    
    fetchAppointmentDetails();
  }, [id, type]);

  const fetchAppointmentDetails = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/appointments/${id}`);
      
      if (response.data.success) {
        setAppointment(response.data.data);
      } else {
        setError('Không thể tải thông tin lịch hẹn. Vui lòng thử lại sau.');
      }
    } catch (error) {
      console.error('Error fetching appointment details:', error);
      setError('Không thể tải thông tin lịch hẹn. Vui lòng thử lại sau.');
    } finally {
      setLoading(false);
    }
  };

  const handleRatingChange = (newRating) => {
    setRating(newRating);
  };

  const handleMouseEnter = (hoveredRating) => {
    setHoverRating(hoveredRating);
  };

  const handleMouseLeave = () => {
    setHoverRating(0);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (rating < 1) {
      toast.error('Vui lòng chọn số sao đánh giá');
      return;
    }
    
    if (content.trim().length < 3) {
      toast.error('Vui lòng nhập nội dung đánh giá (tối thiểu 3 ký tự)');
      return;
    }
    
    try {
      setSubmitting(true);
      
      const reviewData = {
        appointmentId: id,
        rating,
        content
      };
      
      if (type === 'doctor') {
        // Make sure to handle both string IDs and object IDs
        if (typeof appointment.doctorId === 'object') {
          reviewData.doctorId = appointment.doctorId._id;
        } else {
          reviewData.doctorId = appointment.doctorId;
        }
        
        const response = await api.post('/reviews/doctor', reviewData);
        
        if (response.data.success) {
          toast.success('Đánh giá bác sĩ thành công!');
          setTimeout(() => {
            navigate('/appointments');
          }, 2000);
        } else {
          toast.error(response.data.message || 'Không thể đánh giá. Vui lòng thử lại sau.');
        }
      } else if (type === 'hospital') {
        // Make sure to handle both string IDs and object IDs
        if (typeof appointment.hospitalId === 'object') {
          reviewData.hospitalId = appointment.hospitalId._id;
        } else {
          reviewData.hospitalId = appointment.hospitalId;
        }
        
        const response = await api.post('/reviews/hospital', reviewData);
        
        if (response.data.success) {
          toast.success('Đánh giá bệnh viện thành công!');
          setTimeout(() => {
            navigate('/appointments');
          }, 2000);
        } else {
          toast.error(response.data.message || 'Không thể đánh giá. Vui lòng thử lại sau.');
        }
      }
    } catch (error) {
      console.error('Error submitting review:', error);
      
      if (error.response && error.response.data && error.response.data.message) {
        toast.error(error.response.data.message);
      } else {
        toast.error('Đã xảy ra lỗi khi gửi đánh giá. Vui lòng thử lại sau.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  // Get doctor initials for avatar fallback
  const getDoctorInitials = (name) => {
    if (!name || name === 'Bác sĩ') return "BS";
    
    const nameParts = name.split(" ");
    if (nameParts.length > 1) {
      return `${nameParts[0][0]}${nameParts[nameParts.length - 1][0]}`.toUpperCase();
    }
    return nameParts[0][0].toUpperCase();
  };

  // Get hospital initials for logo fallback
  const getHospitalInitials = (name) => {
    if (!name || name === 'Bệnh viện') return "BV";
    
    const words = name.split(" ");
    if (words.length >= 2) {
      // Get first letter of first two significant words
      const filteredWords = words.filter(word => word.length > 1);
      if (filteredWords.length >= 2) {
        return `${filteredWords[0][0]}${filteredWords[1][0]}`.toUpperCase();
      }
    }
    // Fallback to first two letters of the name
    return name.substring(0, 2).toUpperCase();
  };

  // Get user initials for avatar fallback
  const getUserInitials = (name) => {
    if (!name) return "KH";
    
    const nameParts = name.split(" ");
    if (nameParts.length > 1) {
      return `${nameParts[0][0]}${nameParts[nameParts.length - 1][0]}`.toUpperCase();
    }
    return nameParts[0][0].toUpperCase();
  };

  const getReviewTarget = () => {
    if (!appointment) return {};
    
    if (type === 'doctor') {
      let doctorInfo = {};
      
      if (appointment.doctorId && typeof appointment.doctorId === 'object') {
        const doctor = appointment.doctorId;
        doctorInfo = {
          id: doctor._id,
          name: doctor.user?.fullName || doctor.name || appointment.doctorName || 'Bác sĩ',
          avatar: doctor.user?.avatarUrl || doctor.user?.avatar || doctor.avatarUrl || doctor.avatar || null,
          specialty: doctor.specialty?.name || doctor.specialtyName || appointment.specialtyName || ''
        };
      } else {
        doctorInfo = {
          id: appointment.doctorId,
          name: appointment.doctorName || 'Bác sĩ',
          avatar: null,
          specialty: appointment.specialtyName || ''
        };
      }
      
      return {
        name: doctorInfo.name,
        id: doctorInfo.id,
        avatar: doctorInfo.avatar,
        specialty: doctorInfo.specialty,
        type: 'doctor',
        colorClass: 'text-blue-600',
        bgClass: 'bg-blue-100'
      };
    } else {
      let hospitalInfo = {};
      
      if (appointment.hospitalId && typeof appointment.hospitalId === 'object') {
        const hospital = appointment.hospitalId;
        hospitalInfo = {
          id: hospital._id,
          name: hospital.name || appointment.hospitalName || 'Bệnh viện',
          logo: hospital.imageUrl || (hospital.image && hospital.image.secureUrl) || hospital.logo || null,
          hospitalId: hospital._id || ''
        };
      } else if (appointment.hospitalName) {
        hospitalInfo = {
          id: appointment.hospitalId || '',
          name: appointment.hospitalName || 'Bệnh viện',
          logo: appointment.hospitalImageUrl || (appointment.hospitalImage && appointment.hospitalImage.secureUrl) || appointment.hospitalLogo || null,
          hospitalId: appointment.hospitalId || ''
        };
      } else {
        hospitalInfo = {
          id: appointment.hospitalId || '',
          name: appointment.hospitalName || 'Bệnh viện',
          logo: null,
          hospitalId: appointment.hospitalId || ''
        };
      }
      
      return {
        name: hospitalInfo.name,
        id: hospitalInfo.id,
        avatar: hospitalInfo.logo,
        specialty: '',
        type: 'hospital',
        colorClass: 'text-green-600',
        bgClass: 'bg-green-100'
      };
    }
  };

  const getHospitalInfo = (appointment) => {
    if (!appointment) return { name: 'Bệnh viện', logo: null, hospitalId: '' };
    
    // When hospitalId is a full object
    if (appointment.hospitalId && typeof appointment.hospitalId === 'object') {
      const hospital = appointment.hospitalId;
      return {
        name: hospital.name || 'Bệnh viện',
        logo: hospital.imageUrl || hospital.logo || hospital.logoUrl || null,
        hospitalId: hospital._id || ''
      };
    } 
    // When hospital info is in the main appointment object
    else if (appointment.hospitalName) {
      return {
        name: appointment.hospitalName || 'Bệnh viện',
        logo: appointment.hospitalImageUrl || appointment.hospitalLogo || appointment.hospitalLogoUrl || null,
        hospitalId: appointment.hospitalId || ''
      };
    }
    
    return { name: 'Bệnh viện', logo: null, hospitalId: '' };
  };

  useEffect(() => {
    if (appointment) {
      const doctorInfo = getReviewTarget();
      const hospitalInfo = getHospitalInfo(appointment);
      
      setAppointment({
        ...appointment,
        doctorInfo,
        hospitalInfo
      });
    }
  }, [appointment]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white flex items-center justify-center p-4">
        <div className="bg-white rounded-xl shadow-xl p-8 text-center max-w-md mx-auto">
          <div className="w-16 h-16 border-4 border-t-blue-500 border-blue-200 rounded-full animate-spin mx-auto mb-6"></div>
          <p className="text-gray-600 text-lg">Đang tải thông tin...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white flex items-center justify-center p-4">
        <div className="bg-white rounded-xl shadow-xl p-8 text-center max-w-md mx-auto">
          <div className="w-16 h-16 text-red-500 mx-auto mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h3 className="text-xl font-bold text-red-600 mb-2">Đã xảy ra lỗi</h3>
          <p className="text-gray-600 mb-6">{error}</p>
          <Link to="/appointments" className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
            <FaArrowLeft className="mr-2" /> Quay lại danh sách lịch hẹn
          </Link>
        </div>
      </div>
    );
  }

  const target = getReviewTarget();
  const isDoctor = type === 'doctor';
  const userAvatar = user?.avatarUrl || user?.avatar || user?.imageUrl;

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white py-12 px-4">
      <ToastContainer position="top-right" autoClose={5000} />
      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-10">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            {isDoctor ? `Đánh giá bác sĩ ${target.name}` : `Đánh giá ${target.name}`}
          </h1>
          <p className="text-lg text-gray-600">Chia sẻ trải nghiệm của bạn</p>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6 md:p-8">
          <form onSubmit={handleSubmit}>
            <div className="flex flex-col items-center mb-8">
              <div className="mb-4">
                {/* Current User Avatar */}
                <div className="flex items-center mb-6">
                  <div className="flex-shrink-0">
                    <div className="w-14 h-14 rounded-full bg-blue-100 flex items-center justify-center overflow-hidden border-2 border-blue-200">
                      {!userAvatarError && userAvatar ? (
                        <img 
                          src={userAvatar} 
                          alt={user?.fullName || 'Người dùng'} 
                          className="w-full h-full object-cover"
                          onError={() => setUserAvatarError(true)}
                        />
                      ) : (
                        <div className="w-full h-full bg-blue-100 flex items-center justify-center">
                          {getUserInitials(user?.fullName) ? (
                            <span className="text-xl font-bold text-blue-600">{getUserInitials(user?.fullName)}</span>
                          ) : (
                            <FaUser className="text-blue-500 text-xl" />
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="ml-3">
                    <div className="flex items-center">
                      <span className="text-lg font-medium text-gray-900">{user?.fullName || 'Bạn'}</span>
                      <span className="ml-2 px-2 py-0.5 bg-blue-100 text-blue-800 text-xs font-medium rounded-full">
                        Bệnh nhân
                      </span>
                    </div>
                    <div className="text-sm text-gray-500">
                      Đánh giá cho:
                    </div>
                  </div>
                </div>
                
                {/* Target Avatar */}
                <div className="w-24 h-24 rounded-full overflow-hidden mx-auto mb-3 border-4 shadow-md flex items-center justify-center"
                  style={{borderColor: isDoctor ? '#3b82f6' : '#10b981'}}>
                  {isDoctor ? (
                    !doctorAvatarError && target.avatar ? (
                      <img 
                        src={target.avatar} 
                        alt={target.name}
                        className="w-full h-full object-cover"
                        onError={() => setDoctorAvatarError(true)}
                      />
                    ) : (
                      <div className="w-full h-full bg-blue-100 flex items-center justify-center">
                        {getDoctorInitials(target.name) ? (
                          <span className="text-2xl font-bold text-blue-600">{getDoctorInitials(target.name)}</span>
                        ) : (
                          <FaUserMd className="text-blue-600 text-4xl" />
                        )}
                      </div>
                    )
                  ) : (
                    !hospitalLogoError && target.avatar ? (
                      <img 
                        src={target.avatar} 
                        alt={target.name}
                        className="w-full h-full object-cover"
                        onError={() => setHospitalLogoError(true)}
                      />
                    ) : (
                      <div className="w-full h-full bg-green-100 flex items-center justify-center">
                        {getHospitalInitials(target.name) ? (
                          <span className="text-2xl font-bold text-green-600">{getHospitalInitials(target.name)}</span>
                        ) : (
                          <FaHospital className="text-green-600 text-4xl" />
                        )}
                      </div>
                    )
                  )}
                </div>
              </div>
              <h3 className={`text-xl font-semibold mb-1 ${target.colorClass}`}>{target.name}</h3>
              {target.specialty && (
                <div className="flex items-center justify-center text-gray-600">
                  {isDoctor ? (
                    <>
                      <FaCertificate className="text-blue-500 mr-1" />
                      <p className="text-sm">{target.specialty}</p>
                    </>
                  ) : null}
                </div>
              )}
            </div>

            <div className="mb-8">
              <h4 className="text-lg font-semibold text-gray-800 mb-3 text-center">Đánh giá của bạn</h4>
              <div className="flex justify-center items-center gap-2 mb-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button 
                    key={star}
                    type="button"
                    onClick={() => handleRatingChange(star)}
                    onMouseEnter={() => handleMouseEnter(star)}
                    onMouseLeave={handleMouseLeave}
                    className="focus:outline-none transition-transform transform hover:scale-110"
                  >
                    <FaStar 
                      className={`text-3xl ${
                        (hoverRating || rating) >= star 
                          ? 'text-yellow-400' 
                          : 'text-gray-300'
                      }`} 
                    />
                  </button>
                ))}
              </div>
              <p className="text-center font-medium">
                {rating === 1 && 'Rất tệ'}
                {rating === 2 && 'Tệ'}
                {rating === 3 && 'Bình thường'}
                {rating === 4 && 'Tốt'}
                {rating === 5 && 'Rất tốt'}
              </p>
            </div>

            <div className="mb-8">
              <label htmlFor="review-content" className="block text-sm font-medium text-gray-700 mb-2">
                Nhận xét của bạn
              </label>
              <textarea
                id="review-content"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                rows={5}
                placeholder="Chia sẻ trải nghiệm của bạn về dịch vụ (tối thiểu 3 ký tự)"
                required
                minLength={3}
                maxLength={500}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              ></textarea>
              <div className="text-right text-sm text-gray-500">
                {content.length}/500 ký tự
              </div>
            </div>

            <div className="flex flex-col sm:flex-row justify-between gap-4">
              <Link 
                to={`/appointments/${id}/review`} 
                className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors flex items-center justify-center"
              >
                <FaArrowLeft className="mr-2" /> Quay lại
              </Link>
              <button 
                type="submit" 
                disabled={submitting}
                className={`px-6 py-3 rounded-lg text-white flex items-center justify-center transition-colors ${
                  isDoctor
                    ? 'bg-blue-600 hover:bg-blue-700'
                    : 'bg-green-600 hover:bg-green-700'
                } ${submitting ? 'opacity-70 cursor-not-allowed' : ''}`}
              >
                {submitting ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                    Đang gửi...
                  </>
                ) : (
                  <>
                    Gửi đánh giá <FaPaperPlane className="ml-2" />
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ReviewForm;
