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
      
      if (response.data.success) {
        toast.success('Hủy lịch hẹn thành công');
        setShowCancelModal(false);
        // Update the appointment status locally
        setAppointment(prev => ({ ...prev, status: 'cancelled', cancellationReason }));
      } else {
        toast.error(response.data.message || 'Không thể hủy lịch hẹn. Vui lòng thử lại sau.');
      }
    } catch (error) {
      console.error('Error cancelling appointment:', error);
      toast.error('Không thể hủy lịch hẹn. Vui lòng thử lại sau.');
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
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
          <FaCheckCircle className="mr-1" /> Đã thanh toán {method && `(${method === 'paypal' ? 'PayPal' : 'Tiền mặt' || method === 'momo' ? 'MoMo' : 'Chưa thanh toán'})`}
        </span>
      );
    }
    
    return (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
        <FaClock className="mr-1" /> Chưa thanh toán
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
