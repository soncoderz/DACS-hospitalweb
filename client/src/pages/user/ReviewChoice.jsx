import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../utils/api';
import { toast, ToastContainer } from 'react-toastify';
import { FaCalendarAlt, FaHospital, FaUserMd, FaStar, FaArrowLeft, FaMapMarkerAlt, FaCertificate } from 'react-icons/fa';

const ReviewChoice = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [appointment, setAppointment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [doctorAvatarError, setDoctorAvatarError] = useState(false);
  const [hospitalLogoError, setHospitalLogoError] = useState(false);

  useEffect(() => {
    fetchAppointmentDetails();
  }, [id]);

  const fetchAppointmentDetails = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/appointments/${id}`);
      
      if (response.data.success) {
        setAppointment(response.data.data);
        console.log("Appointment data:", response.data.data);
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

  const getDoctorInfo = (appointment) => {
    if (!appointment) return { name: 'Bác sĩ', avatar: null, specialty: '', doctorId: '' };
    
    // When doctorId is a full object
    if (appointment.doctorId && typeof appointment.doctorId === 'object') {
      const doctor = appointment.doctorId;
      return {
        name: doctor.user?.fullName || doctor.name || 'Bác sĩ',
        avatar: doctor.user?.avatarUrl || doctor.user?.avatar || doctor.avatarUrl || doctor.avatar || doctor.imageUrl || null,
        specialty: doctor.specialty?.name || doctor.specialtyName || appointment.specialtyName || '',
        doctorId: doctor._id || appointment.doctorId
      };
    } 
    // When doctor info is in the main appointment object
    else if (appointment.doctorName) {
      return {
        name: appointment.doctorName || 'Bác sĩ',
        avatar: appointment.doctorAvatar || appointment.doctorAvatarUrl || appointment.doctorImageUrl || null,
        specialty: appointment.specialtyName || '',
        doctorId: appointment.doctorId || ''
      };
    }
    
    return { name: 'Bác sĩ', avatar: null, specialty: '', doctorId: '' };
  };

  const getHospitalInfo = (appointment) => {
    if (!appointment) return { name: 'Bệnh viện', logo: null, hospitalId: '' };
    
    // When hospitalId is a full object
    if (appointment.hospitalId && typeof appointment.hospitalId === 'object') {
      const hospital = appointment.hospitalId;
      return {
        name: hospital.name || 'Bệnh viện',
        logo: hospital.imageUrl || (hospital.image && hospital.image.secureUrl) || hospital.logo || null,
        hospitalId: hospital._id || ''
      };
    } 
    // When hospital info is in the main appointment object
    else if (appointment.hospitalName) {
      return {
        name: appointment.hospitalName || 'Bệnh viện',
        logo: appointment.hospitalImageUrl || (appointment.hospitalImage && appointment.hospitalImage.secureUrl) || appointment.hospitalLogo || null,
        hospitalId: appointment.hospitalId || ''
      };
    }
    
    return { name: 'Bệnh viện', logo: null, hospitalId: '' };
  };

  const handleReviewDoctor = () => {
    navigate(`/appointments/${id}/review/doctor`);
  };

  const handleReviewHospital = () => {
    navigate(`/appointments/${id}/review/hospital`);
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

  const doctorInfo = getDoctorInfo(appointment);
  const hospitalInfo = getHospitalInfo(appointment);

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-10">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">Đánh giá lịch khám</h1>
          <p className="text-lg text-gray-600">Vui lòng chọn đối tượng bạn muốn đánh giá</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-3xl mx-auto mb-12">
          {/* Doctor Review Card */}
          <div 
            onClick={handleReviewDoctor}
            className="bg-white rounded-xl shadow-xl hover:shadow-2xl transform hover:-translate-y-2 transition-all duration-300 overflow-hidden cursor-pointer border border-blue-100 hover:border-blue-300"
          >
            <div className="bg-gradient-to-r from-blue-500 to-blue-600 py-6 px-4 flex justify-center relative">
              <div className="w-28 h-28 rounded-full overflow-hidden flex items-center justify-center bg-white border-4 border-white shadow-lg">
                {!doctorAvatarError && doctorInfo.avatar ? (
                  <img 
                    src={doctorInfo.avatar} 
                    alt={doctorInfo.name}
                    className="w-full h-full object-cover"
                    onError={() => setDoctorAvatarError(true)}
                  />
                ) : (
                  <div className="w-full h-full bg-blue-100 flex items-center justify-center">
                    {getDoctorInitials(doctorInfo.name) ? (
                      <span className="text-2xl font-bold text-blue-600">{getDoctorInitials(doctorInfo.name)}</span>
                    ) : (
                      <FaUserMd className="text-blue-600 text-4xl" />
                    )}
                  </div>
                )}
              </div>
            </div>
            
            <div className="p-6 text-center">
              <h3 className="text-xl font-bold text-gray-800 mb-2">Đánh giá bác sĩ</h3>
              <p className="text-blue-600 font-medium text-lg mb-1">{doctorInfo.name}</p>
              
              {doctorInfo.specialty && (
                <div className="flex items-center justify-center text-gray-600 mb-4">
                  <FaCertificate className="text-blue-500 mr-1" />
                  <p className="text-sm">{doctorInfo.specialty}</p>
                </div>
              )}
              
              <div className="flex justify-center text-yellow-400 space-x-1 mb-5">
                <FaStar className="w-6 h-6" />
                <FaStar className="w-6 h-6" />
                <FaStar className="w-6 h-6" />
                <FaStar className="w-6 h-6" />
                <FaStar className="w-6 h-6" />
              </div>
              
              <button className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 px-4 rounded-lg transition-colors font-medium">
                Chọn để đánh giá
              </button>
            </div>
          </div>

          {/* Hospital Review Card */}
          <div 
            onClick={handleReviewHospital}
            className="bg-white rounded-xl shadow-xl hover:shadow-2xl transform hover:-translate-y-2 transition-all duration-300 overflow-hidden cursor-pointer border border-green-100 hover:border-green-300"
          >
            <div className="bg-gradient-to-r from-green-500 to-green-600 py-6 px-4 flex justify-center">
              <div className="w-28 h-28 rounded-full overflow-hidden flex items-center justify-center bg-white border-4 border-white shadow-lg">
                {!hospitalLogoError && hospitalInfo.logo ? (
                  <img 
                    src={hospitalInfo.logo} 
                    alt={hospitalInfo.name}
                    className="w-full h-full object-cover"
                    onError={() => setHospitalLogoError(true)}
                  />
                ) : (
                  <div className="w-full h-full bg-green-100 flex items-center justify-center">
                    {getHospitalInitials(hospitalInfo.name) ? (
                      <span className="text-2xl font-bold text-green-600">{getHospitalInitials(hospitalInfo.name)}</span>
                    ) : (
                      <FaHospital className="text-green-600 text-4xl" />
                    )}
                  </div>
                )}
              </div>
            </div>
            
            <div className="p-6 text-center">
              <h3 className="text-xl font-bold text-gray-800 mb-2">Đánh giá bệnh viện</h3>
              <p className="text-green-600 font-medium text-lg mb-1">{hospitalInfo.name}</p>
              
              <div className="flex justify-center text-yellow-400 space-x-1 mb-5">
                <FaStar className="w-6 h-6" />
                <FaStar className="w-6 h-6" />
                <FaStar className="w-6 h-6" />
                <FaStar className="w-6 h-6" />
                <FaStar className="w-6 h-6" />
              </div>
              
              <button className="w-full bg-green-600 hover:bg-green-700 text-white py-3 px-4 rounded-lg transition-colors font-medium">
                Chọn để đánh giá
              </button>
            </div>
          </div>
        </div>

        <div className="text-center">
          <Link 
            to="/appointments" 
            className="inline-flex items-center px-6 py-3 bg-white text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 shadow-sm hover:shadow transition-all"
          >
            <FaArrowLeft className="mr-2" /> Quay lại danh sách lịch hẹn
          </Link>
        </div>
      </div>
    </div>
  );
};

export default ReviewChoice;
