import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../utils/api';
import { toast, ToastContainer } from 'react-toastify';

import { FaCalendarAlt, FaClock, FaHospital, FaUserMd, FaNotesMedical, 
         FaMoneyBillWave, FaFileMedical, FaFileDownload, FaTimesCircle, 
         FaCalendarCheck, FaPrint, FaStar, FaArrowLeft, FaMapMarkerAlt, FaRedo, FaCheckCircle, FaExclamationTriangle } from 'react-icons/fa';
import CancelAppointmentModal from '../../components/shared/CancelAppointmentModal';


const AppointmentDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [appointment, setAppointment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancellationReason, setCancellationReason] = useState('');
  const [cancelingAppointment, setCancelingAppointment] = useState(false);

  useEffect(() => {
    fetchAppointmentDetails();
  }, [id]);

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

  const handleCancelAppointment = async () => {
    if (!cancellationReason.trim()) {
      toast.error('Vui lòng nhập lý do hủy lịch hẹn');
      return;
    }

    try {
      setCancelingAppointment(true);
      const response = await api.delete(`/appointments/${id}`, {
        data: { cancellationReason }
      });
      
      if (response.data.success || response.data.status === 'success') {
        // Cập nhật trạng thái lịch hẹn tại chỗ
        setAppointment(prev => ({ ...prev, status: 'cancelled', cancellationReason }));
        
        // Đóng modal hủy lịch
        setShowCancelModal(false);
        
        // Hiển thị thông báo thành công
        toast.success('Hủy lịch hẹn thành công', {
          onClose: () => {
            // Sau khi thông báo đóng, hiển thị thông báo hỏi người dùng
            const userConfirm = window.confirm('Bạn có muốn quay lại danh sách lịch hẹn không?');
            if (userConfirm) {
              navigate('/appointments');
            }
          }
        });
      } else {
        toast.error(response.data.message || 'Không thể hủy lịch hẹn. Vui lòng thử lại sau.');
      }
    } catch (error) {
      console.error('Error cancelling appointment:', error);
      
      // Xử lý lỗi chi tiết hơn
      if (error.response) {
        // Máy chủ trả về lỗi với mã trạng thái
        console.error('Status code:', error.response.status);
        console.error('Error data:', error.response.data);
        toast.error(error.response.data.message || 'Không thể hủy lịch hẹn. Vui lòng thử lại sau.');
      } else if (error.request) {
        // Yêu cầu được gửi nhưng không nhận được phản hồi
        console.error('No response received from server');
        toast.error('Không thể kết nối đến máy chủ. Vui lòng kiểm tra kết nối mạng.');
      } else {
        // Lỗi khác
        console.error('Error:', error.message);
        toast.error('Đã xảy ra lỗi khi hủy lịch hẹn. Vui lòng thử lại sau.');
      }
    } finally {
      setCancelingAppointment(false);
    }
  };

  const handleReschedule = () => {
    navigate(`/appointments/${id}/reschedule`);
  };

  const formatDate = (dateString) => {
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(dateString).toLocaleDateString('vi-VN', options);
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('vi-VN', { 
      style: 'currency', 
      currency: 'VND',
      maximumFractionDigits: 0
    }).format(price);
  };

  // Get status information with colors
  const getStatusInfo = (status) => {
    const statusMap = {
      pending: {
        label: 'Chờ xác nhận',
        color: 'bg-yellow-100 text-yellow-800',
        icon: <FaClock />
      },
      confirmed: {
        label: 'Đã xác nhận',
        color: 'bg-green-100 text-green-800',
        icon: <FaCheckCircle />
      },
      completed: {
        label: 'Đã hoàn thành',
        color: 'bg-blue-100 text-blue-800',
        icon: <FaCalendarCheck />
      },
      cancelled: {
        label: 'Đã hủy',
        color: 'bg-red-100 text-red-800',
        icon: <FaTimesCircle />
      },
      rescheduled: {
        label: 'Đã đổi lịch',
        color: 'bg-purple-100 text-purple-800',
        icon: <FaRedo />
      },
      'no-show': {
        label: 'Không đến khám',
        color: 'bg-gray-100 text-gray-800',
        icon: <FaExclamationTriangle />
      }
    };

    return statusMap[status] || { label: 'Không xác định', color: 'bg-gray-100 text-gray-800', icon: null };
  };

  // Get payment status badge
  const getPaymentStatusBadge = (status, method) => {
    if (status === 'completed' || status === 'paid') {
      // Payment method specific styling
      const methodStyles = {
        paypal: {
          bg: 'bg-blue-50',
          text: 'text-blue-700',
          border: 'border-blue-200',
          icon: <svg className="w-4 h-4 mr-1.5" viewBox="0 0 24 24" fill="currentColor">
            <path d="M19.554 9.488c.121.563.106 1.246-.04 2.051-.582 2.978-2.477 4.466-5.683 4.466h-.442a.666.666 0 0 0-.444.166.72.72 0 0 0-.239.427l-.041.189-.553 3.479-.021.151a.706.706 0 0 1-.247.426.666.666 0 0 1-.447.166H8.874a.395.395 0 0 1-.331-.147.457.457 0 0 1-.09-.352c.061-.385.253-1.542.253-1.542l.483-3.049-.015.091s.255-1.556.311-1.93l.004-.024a.557.557 0 0 1 .227-.376.651.651 0 0 1 .438-.15h.924c1.626 0 2.807-.324 3.518-.984.472-.437.786-1.077.935-1.858a4.76 4.76 0 0 0 .046-1.118 2.81 2.81 0 0 0-.401-1.158c-.105-.167-.238-.324-.391-.475z" />
            <path d="M18.178 6.117c-.32-.45-.855-.815-1.56-1.053-.313-.103-.675-.189-1.09-.258-.42-.069-.901-.123-1.459-.156-.777-.053-1.423-.072-1.956-.072h-5.39c-.38 0-.691.14-.785.407-.284.772-.773 3.597-.862 4.093 0 0-.288 1.839-.327 2.075a.397.397 0 0 0 .095.336.391.391 0 0 0 .335.142h1.656c.152-.005.296-.054.405-.138a.598.598 0 0 0 .223-.329c.084-.3.16-.605.224-.883l.49-3.523.011-.074c.012-.058.028-.239.129-.364a.545.545 0 0 1 .357-.155h3.927c.587 0 1.1.017 1.549.052.449.035.84.091 1.178.167.339.078.631.173.88.284.249.112.456.243.625.393a2.54 2.54 0 0 1 .812 1.714 6.604 6.604 0 0 1-.064 1.456 12.737 12.737 0 0 1-.168.953 1.732 1.732 0 0 0-.524-.486 2.048 2.048 0 0 0-.712-.258 4.388 4.388 0 0 0-.87-.087h-3.019c-.379 0-.72.039-.979.116a1.546 1.546 0 0 0-.659.342 1.46 1.46 0 0 0-.37.524c-.87.212-.122.446-.148.697l-.141.879c-.036.225-.043.447-.032.661a1.1 1.1 0 0 0 .107.493c-.072.178 0 0 0 0 .092.162.204.296.35.406.145.109.325.192.544.252.219.058.487.089.784.089h.988c.34-.008.557-.028.736-.059.179-.032.347-.108.464-.166.116-.058.238-.149.326-.232.088-.082.172-.206.224-.302.051-.096.104-.238.143-.372.039-.135.074-.301.098-.488.023-.187.036-.411.041-.684.004-.273-.007-.577-.04-.925a11.018 11.018 0 0 0-.089-1.061c-.089.09-.24.183-.474.284-.233.101-.543.194-.945.284-.401.091-.874.166-1.431.232a13.423 13.423 0 0 1-1.87.1 10.766 10.766 0 0 1-2.148-.193 6.108 6.108 0 0 1-1.57-.533c-.421-.214-.755-.48-.997-.813-.241-.332-.399-.71-.483-1.128a4.036 4.036 0 0 1-.064-1.333c.05-.433.156-.82.32-1.189a3.547 3.547 0 0 1 .604-.945c.252-.282.563-.53.933-.736.371-.206.798-.368 1.277-.485a9.57 9.57 0 0 1 1.587-.239C7.994 4.963 8.85 4.95 9.834 4.95h4.726a9.045 9.045 0 0 1 1.587.135c.386.064.73.142 1.044.229.313.087.589.18.84.285.251.103.466.212.65.325.184.114.34.232.468.349.129.116.231.232.314.348.252.323.48.771.601 1.323.12.551.179 1.22.168 2.032a11.777 11.777 0 0 1-.104 1.577c-.06.51-.149 1.042-.268 1.614-.118.571-.268 1.174-.437 1.811l-.16.626c-.01.08-.031.172-.052.266-.021.093-.053.196-.082.299-.029.103-.068.217-.112.329a2.323 2.323 0 0 1-.155.335.903.903 0 0 1-.219.271.996.996 0 0 1-.4.192c-.28.065-.61.108-.996.128l-3.859.036a7.27 7.27 0 0 1-1.563-.141 5.97 5.97 0 0 1-.579-.171l-.018-.006a2.365 2.365 0 0 1-.336-.142 9.908 9.908 0 0 1-.322-.175l.043.268c.013.081.017.115.027.176.016.1.039.215.068.338.029.124.066.259.11.403a2.222 2.222 0 0 0 .168.407c.06.119.14.246.232.371a1.5 1.5 0 0 0 .343.329c.143.103.314.19.511.261.197.072.428.126.688.163.259.037.55.056.87.056h4.302c.365 0 .672-.028.919-.084.246-.057.472-.148.629-.274.158-.127.294-.294.365-.505.071-.21.115-.454.115-.731v-.431h.001v-.002l.032-.353c.007-.093.019-.211.031-.342.012-.13.028-.28.043-.438.016-.159.033-.335.051-.526l.047-.468c.081-.888.173-1.895.277-3.01.104-1.118.231-2.391.375-3.72.016-.15.03-.301.044-.453a.698.698 0 0 0-.195-.561 1.354 1.354 0 0 0-.463-.3 3.34 3.34 0 0 0-.701-.19 7.02 7.02 0 0 0-.906-.082h-4.716c-.75 0-1.456.018-2.151.054a6.57 6.57 0 0 0-.981.114H8.95z" />
          </svg>
        },
        momo: {
          bg: 'bg-pink-50',
          text: 'text-pink-700',
          border: 'border-pink-200',
          icon: <svg className="w-4 h-4 mr-1.5" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2C6.477 2 2 6.477 2 12s4.477 10 10 10 10-4.477 10-10S17.523 2 12 2zm-1.24 14.862c-.456 0-.883-.186-1.197-.528a1.91 1.91 0 0 1-.487-1.284c0-.487.171-.93.487-1.285.314-.342.74-.528 1.198-.528.457 0 .883.186 1.197.528.316.355.488.798.488 1.285 0 .486-.172.93-.488 1.284-.314.342-.74.528-1.197.528zm2.688-6.698a4.097 4.097 0 0 0-.256-.468 2.022 2.022 0 0 0-.2-.257 4.425 4.425 0 0 0-.485-.485c-.243-.196-.498-.384-.842-.554-.344-.17-.73-.313-1.186-.428a6.02 6.02 0 0 0-1.387-.17c-.499 0-.997.056-1.484.17-.486.114-.923.285-1.295.485a3.711 3.711 0 0 0-.954.77c-.258.299-.47.627-.627.981a5.28 5.28 0 0 0-.37 1.142c-.085.412-.128.84-.128 1.284v3.966h2.366v-3.966c0-.313.028-.612.114-.882.086-.27.214-.512.385-.712.172-.2.387-.355.627-.469.243-.115.5-.171.784-.171.286 0 .556.056.784.17.228.115.428.27.599.47.17.2.3.427.399.712.1.27.142.57.142.882 0 .214-.014.428-.057.627-.028.2-.086.385-.157.556-.071.17-.157.313-.243.441a7.07 7.07 0 0 1-.242.356c.228.228.485.427.755.584.271.156.543.285.784.384.114-.142.228-.313.342-.485.1-.17.2-.355.271-.54.072-.187.143-.371.187-.57.085-.397.128-.798.128-1.199 0-.441-.043-.882-.13-1.284a4.402 4.402 0 0 0-.369-1.142 5.495 5.495 0 0 0-.27-.513z"/>
          </svg>
        },
        cash: {
          bg: 'bg-green-50',
          text: 'text-green-700',
          border: 'border-green-200',
          icon: <svg className="w-4 h-4 mr-1.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="2" y="6" width="20" height="12" rx="2" />
            <circle cx="12" cy="12" r="4" />
            <path d="M17 12h.01M7 12h.01" />
          </svg>
        }
      };
      
      // Get the appropriate style based on payment method, default to cash style if method not found
      const style = methodStyles[method] || methodStyles.cash;
      
      return (
        <div className="flex items-center">
          <span className={`inline-flex items-center px-3 py-1.5 rounded-md text-sm font-medium ${style.bg} ${style.text} border ${style.border}`}>
            <FaCheckCircle className="mr-1.5" /> 
            Đã thanh toán
          </span>
          {method && (
            <span className={`ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${style.bg} ${style.text}`}>
              {style.icon}
              {method === 'paypal' ? 'PayPal' : method === 'momo' ? 'MoMo' : 'Tiền mặt'}
            </span>
          )}
        </div>
      );
    }
    
    return (
      <span className="inline-flex items-center px-3 py-1.5 rounded-md text-sm font-medium bg-yellow-50 text-yellow-700 border border-yellow-200">
        <FaClock className="mr-1.5" /> Chưa thanh toán
      </span>
    );
  };

  // Helper function to extract service name
  const getServiceName = (appointment) => {
    if (appointment.serviceName) return appointment.serviceName;
    if (appointment.serviceId && typeof appointment.serviceId === 'object' && appointment.serviceId.name) {
      return appointment.serviceId.name;
    }
    return 'Tư vấn khám';
  };

  // Add a function to extract service price
  const getServicePrice = (appointment) => {
    if (appointment.serviceId && typeof appointment.serviceId === 'object' && appointment.serviceId.price) {
      return appointment.serviceId.price;
    }
    return null;
  };

  // Add a function to extract room information
  const getRoomInfo = (appointment) => {
    if (appointment.roomInfo) return appointment.roomInfo;
    if (appointment.roomId && typeof appointment.roomId === 'object') {
      const room = appointment.roomId;
      return `${room.name || 'Phòng'} ${room.number || ''} ${room.floor ? `(Tầng ${room.floor})` : ''}`.trim();
    }
    return 'Chưa phân phòng';
  };

  // Add function to extract doctor information
  const getDoctorInfo = (appointment) => {
    if (appointment.doctorName) return appointment.doctorName;
    if (appointment.doctorId && typeof appointment.doctorId === 'object') {
      if (appointment.doctorId.user && appointment.doctorId.user.fullName) {
        return appointment.doctorId.user.fullName;
      }
      return appointment.doctorId.name || 'Bác sĩ (không có tên)';
    }
    return 'Chưa có thông tin';
  };

  // Add function to extract doctor title/specialty
  const getDoctorTitle = (appointment) => {
    if (appointment.doctorTitle) return appointment.doctorTitle;
    if (appointment.doctorId && typeof appointment.doctorId === 'object') {
      return appointment.doctorId.title || '';
    }
    return '';
  };

  // Add function to extract hospital information
  const getHospitalInfo = (appointment) => {
    if (appointment.hospitalName) return appointment.hospitalName;
    if (appointment.hospitalId && typeof appointment.hospitalId === 'object') {
      return appointment.hospitalId.name || 'Chưa có thông tin';
    }
    return 'Chưa có thông tin';
  };

  // Add function to extract hospital address
  const getHospitalAddress = (appointment) => {
    if (appointment.hospitalAddress) return appointment.hospitalAddress;
    if (appointment.hospitalId && typeof appointment.hospitalId === 'object') {
      return appointment.hospitalId.address || '';
    }
    return '';
  };

  // Add function to extract specialty information
  const getSpecialtyInfo = (appointment) => {
    if (appointment.specialtyName) return appointment.specialtyName;
    if (appointment.doctorId && appointment.doctorId.specialtyId) {
      if (typeof appointment.doctorId.specialtyId === 'object') {
        return appointment.doctorId.specialtyId.name || '';
      }
    }
    if (appointment.specialtyId && typeof appointment.specialtyId === 'object') {
      return appointment.specialtyId.name || '';
    }
    return '';
  };

  if (loading) {
    return (
      <div className="bg-gray-50 min-h-screen py-10">
        <div className="container mx-auto px-4">
          <div className="flex justify-center items-center py-20">
            <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
            <span className="ml-3 text-gray-600">Đang tải thông tin lịch hẹn...</span>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-gray-50 min-h-screen py-10">
        <div className="container mx-auto px-4">
          <div className="bg-red-100 border border-red-200 text-red-800 rounded-lg p-4 mb-4">
            <div className="flex items-center">
              <FaExclamationTriangle className="text-red-500 mr-2" />
              <p>{error}</p>
            </div>
          </div>
          <Link to="/appointments" className="inline-flex items-center text-primary hover:underline">
            <FaArrowLeft className="mr-1" /> Quay lại danh sách lịch hẹn
          </Link>
        </div>
      </div>
    );
  }

  if (!appointment) {
    return (
      <div className="bg-gray-50 min-h-screen py-10">
        <div className="container mx-auto px-4 text-center">
          <p className="text-gray-600 mb-4">Không tìm thấy thông tin lịch hẹn.</p>
          <Link to="/appointments" className="text-primary hover:underline">
            Quay lại danh sách lịch hẹn
          </Link>
        </div>
      </div>
    );
  }

  // Extract data
  const doctorName = getDoctorInfo(appointment);
  const doctorTitle = getDoctorTitle(appointment);
  const hospitalName = getHospitalInfo(appointment);
  const hospitalAddress = getHospitalAddress(appointment);
  const roomInfo = getRoomInfo(appointment);
  const serviceName = getServiceName(appointment);
  const statusInfo = getStatusInfo(appointment.status);

  return (
    <div className="bg-gray-50 min-h-screen py-8">
      <div className="container mx-auto px-4">
        {/* Back button and page title */}
        <div className="mb-6">
          <Link to="/appointments" className="inline-flex items-center text-primary hover:text-primary-dark transition-colors">
            <FaArrowLeft className="mr-2" /> Quay lại danh sách lịch hẹn
          </Link>
          <h1 className="text-2xl font-bold text-gray-800 mt-4">Chi tiết lịch hẹn</h1>
        </div>

        {/* Appointment header */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden mb-6">
          <div className="p-6 border-b border-gray-100">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <div className="flex items-center mb-2">
                  <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${statusInfo.color}`}>
                    {statusInfo.icon && <span className="mr-1">{statusInfo.icon}</span>}
                    {statusInfo.label}
                  </span>
                  {appointment.bookingCode && (
                    <span className="ml-3 text-sm text-gray-500">
                      Mã đặt lịch: <span className="font-medium">{appointment.bookingCode}</span>
                    </span>
                  )}
                </div>
                <h2 className="text-xl font-bold text-gray-800">{serviceName}</h2>
                <div className="mt-2 flex flex-wrap gap-4">
                  <div className="flex items-center text-gray-600">
                    <FaCalendarAlt className="text-primary mr-2" />
                    {formatDate(appointment.appointmentDate)}
                  </div>
                  <div className="flex items-center text-gray-600">
                    <FaClock className="text-primary mr-2" />
                    {appointment.timeSlot?.startTime || ''} - {appointment.timeSlot?.endTime || ''}
                  </div>
                </div>
              </div>
              
              {/* Actions */}
              <div className="flex flex-wrap gap-2">
                {(appointment.status === 'pending' || appointment.status === 'rescheduled') && (
                  <>
                    <button 
                      className="inline-flex items-center bg-blue-100 text-blue-800 hover:bg-blue-200 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                      onClick={handleReschedule}
                    >
                      <FaRedo className="mr-2" /> Đổi lịch
                    </button>
                    <button 
                      className="inline-flex items-center bg-red-100 text-red-800 hover:bg-red-200 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                      onClick={() => setShowCancelModal(true)}
                    >
                      <FaTimesCircle className="mr-2" /> Hủy lịch
                    </button>
                  </>
                )}
                
                {appointment.status === 'confirmed' && (
                  <button 
                    className="inline-flex items-center bg-red-100 text-red-800 hover:bg-red-200 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                    onClick={() => setShowCancelModal(true)}
                  >
                    <FaTimesCircle className="mr-2" /> Hủy lịch
                  </button>
                )}
                
                {appointment.status === 'completed' && !appointment.isReviewed && (
                  <Link 
                    to={`/appointments/${appointment._id}/review`}
                    className="inline-flex items-center bg-yellow-100 text-yellow-800 hover:bg-yellow-200 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                  >
                    <FaStar className="mr-2" /> Đánh giá
                  </Link>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Appointment details */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Doctor and Hospital */}
          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            <div className="p-5 border-b border-gray-100">
              <h3 className="font-semibold text-lg text-gray-800 flex items-center">
                <FaUserMd className="mr-2 text-primary" /> Thông tin bác sĩ
              </h3>
            </div>
            <div className="p-5">
              <div className="mb-4">
                <div className="text-gray-500 text-sm mb-1">Bác sĩ</div>
                <div className="font-medium">{doctorTitle} {doctorName}</div>
              </div>
              <div className="mb-4">
                <div className="text-gray-500 text-sm mb-1">Chuyên khoa</div>
                <div className="font-medium">{getSpecialtyInfo(appointment) || 'Chưa có thông tin'}</div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            <div className="p-5 border-b border-gray-100">
              <h3 className="font-semibold text-lg text-gray-800 flex items-center">
                <FaHospital className="mr-2 text-primary" /> Thông tin bệnh viện
              </h3>
            </div>
            <div className="p-5">
              <div className="mb-4">
                <div className="text-gray-500 text-sm mb-1">Bệnh viện</div>
                <div className="font-medium">{hospitalName}</div>
              </div>
              {hospitalAddress && (
                <div className="mb-4">
                  <div className="text-gray-500 text-sm mb-1">Địa chỉ</div>
                  <div className="font-medium flex items-start">
                    <FaMapMarkerAlt className="text-primary mr-1 mt-1 flex-shrink-0" />
                    <span>{hospitalAddress}</span>
                  </div>
                </div>
              )}
              <div>
                <div className="text-gray-500 text-sm mb-1">Phòng khám</div>
                <div className="font-medium">{roomInfo}</div>
              </div>
            </div>
          </div>

          {/* Payment Information */}
          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            <div className="p-5 border-b border-gray-100">
              <h3 className="font-semibold text-lg text-gray-800 flex items-center">
                <FaMoneyBillWave className="mr-2 text-primary" /> Thông tin thanh toán
              </h3>
            </div>
            <div className="p-5">
              {appointment.fee ? (
                <>
                  {/* Consultation Fee */}
                  <div className="mb-3">
                    <div className="text-gray-500 text-sm mb-1">Phí tư vấn khám</div>
                    <div className="font-medium">{formatPrice(appointment.fee.consultationFee || 0)}</div>
                  </div>
                  
                  {/* Additional Fees */}
                  {(appointment.fee.additionalFees > 0 || appointment.fee.additionalServices) && (
                    <div className="mb-3">
                      <div className="text-gray-500 text-sm mb-1">Phí dịch vụ thêm</div>
                      <div className="font-medium">{formatPrice(appointment.fee.additionalFees || 0)}</div>
                      {appointment.fee.additionalServices && (
                        <div className="text-xs text-gray-500 mt-1">{appointment.fee.additionalServices}</div>
                      )}
                    </div>
                  )}
                  
                  {/* Service Amount (if using old structure) */}
                  {!appointment.fee.consultationFee && appointment.fee.serviceAmount && (
                    <div className="mb-3">
                      <div className="text-gray-500 text-sm mb-1">Phí dịch vụ</div>
                      <div className="font-medium">{formatPrice(appointment.fee.serviceAmount || 0)}</div>
                    </div>
                  )}
                  
                  {/* Discount */}
                  {appointment.fee.discount > 0 && (
                    <div className="mb-3">
                      <div className="text-gray-500 text-sm mb-1">Giảm giá</div>
                      <div className="font-medium text-green-600">- {formatPrice(appointment.fee.discount || 0)}</div>
                    </div>
                  )}
                  
                  {/* Divider line */}
                  <div className="border-t border-dashed border-gray-200 my-3"></div>
                  
                  {/* Total Amount */}
                  <div className="mb-4">
                    <div className="text-gray-500 text-sm mb-1">Tổng thanh toán</div>
                    <div className="text-xl font-bold text-primary">{formatPrice(appointment.fee.totalAmount || 0)}</div>
                  </div>
                  
                  {/* Payment Status */}
                  <div className="mb-4">
                    <div className="text-gray-500 text-sm mb-1">Trạng thái</div>
                    <div>
                      {getPaymentStatusBadge(appointment.paymentStatus, appointment.paymentMethod)}
                    </div>
                  </div>

                  {/* Payment Method */}
                  {appointment.paymentMethod && (
                    <div>
                      <div className="text-gray-500 text-sm mb-1">Phương thức thanh toán</div>
                      <div className="font-medium">
                        {appointment.paymentMethod === 'cash' ? 'Tiền mặt' : 
                         appointment.paymentMethod === 'paypal' ? 'PayPal' : 
                         appointment.paymentMethod === 'momo' ? 'MoMo' :
                         appointment.paymentMethod}
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <p className="text-gray-500">Không có thông tin thanh toán</p>
              )}
            </div>
          </div>
        </div>

        {/* Medical Information */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden mt-6">
          <div className="p-5 border-b border-gray-100">
            <h3 className="font-semibold text-lg text-gray-800 flex items-center">
              <FaNotesMedical className="mr-2 text-primary" /> Thông tin khám bệnh
            </h3>
          </div>
          <div className="p-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <div className="mb-4">
                  <div className="text-gray-500 text-sm mb-1">Dịch vụ</div>
                  <div className="font-medium">{serviceName}</div>
                </div>
                
                <div className="mb-4">
                  <div className="text-gray-500 text-sm mb-1">Loại khám</div>
                  <div className="font-medium">
                    {appointment.appointmentType === 'first-visit' ? 'Khám lần đầu' :
                     appointment.appointmentType === 'follow-up' ? 'Tái khám' :
                     appointment.appointmentType === 'consultation' ? 'Tư vấn' :
                     appointment.appointmentType === 'emergency' ? 'Khẩn cấp' : appointment.appointmentType}
                  </div>
                </div>
              </div>
              
              <div>
                {appointment.symptoms && (
                  <div className="mb-4">
                    <div className="text-gray-500 text-sm mb-1">Triệu chứng</div>
                    <div className="font-medium">{appointment.symptoms}</div>
                  </div>
                )}
                
                {appointment.medicalHistory && (
                  <div className="mb-4">
                    <div className="text-gray-500 text-sm mb-1">Tiền sử bệnh</div>
                    <div className="font-medium">{appointment.medicalHistory}</div>
                  </div>
                )}
                
                {appointment.notes && (
                  <div className="mb-4">
                    <div className="text-gray-500 text-sm mb-1">Ghi chú</div>
                    <div className="font-medium">{appointment.notes}</div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Medical Results if available */}
        {(appointment.diagnosis || appointment.prescription) && appointment.status === 'completed' && (
          <div className="bg-white rounded-xl shadow-sm overflow-hidden mt-6">
            <div className="p-5 border-b border-gray-100">
              <h3 className="font-semibold text-lg text-gray-800 flex items-center">
                <FaFileMedical className="mr-2 text-primary" /> Kết quả khám
              </h3>
            </div>
            <div className="p-5">
              {appointment.diagnosis && (
                <div className="mb-4">
                  <div className="text-gray-500 text-sm mb-1">Chẩn đoán</div>
                  <div className="font-medium">{appointment.diagnosis}</div>
                </div>
              )}
              
              {appointment.prescription && (
                <div>
                  <div className="text-gray-500 text-sm mb-1">Đơn thuốc</div>
                  <div className="font-medium whitespace-pre-line">{appointment.prescription}</div>
                </div>
              )}
            </div>
          </div>
        )}
        
        {/* Actions Footer */}
        <div className="mt-8 flex flex-wrap gap-3 justify-center md:justify-start">
          <Link to="/appointments" className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-lg transition-colors inline-flex items-center">
            <FaArrowLeft className="mr-2" /> Quay lại
          </Link>
          
          {appointment.status === 'completed' && (
            <button className="px-4 py-2 bg-blue-100 hover:bg-blue-200 text-blue-800 rounded-lg transition-colors inline-flex items-center">
              <FaPrint className="mr-2" /> In lịch hẹn
            </button>
          )}
        </div>

        {/* Cancel Appointment Modal */}
        {showCancelModal && (
          <CancelAppointmentModal
            appointment={appointment}
            cancellationReason={cancellationReason}
            setCancellationReason={setCancellationReason}
            onCancel={() => setShowCancelModal(false)}
            onConfirm={handleCancelAppointment}
            isProcessing={cancelingAppointment}
            formatDate={formatDate}
          />
        )}
      </div>
    </div>
  );
};

export default AppointmentDetail; 
