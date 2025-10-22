import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  FaUser, FaCalendarAlt, FaMapMarkerAlt, FaFileMedical, 
  FaNotesMedical, FaArrowLeft, FaFileAlt,
  FaClock, FaStethoscope, FaRegHospital, FaInfoCircle,
  FaPhoneAlt, FaEnvelope, FaHome, FaDoorOpen, FaVideo
} from 'react-icons/fa';
import { toast } from 'react-toastify';
import api from '../../utils/api';
import moment from 'moment';
import 'moment/locale/vi';

moment.locale('vi');

const AdminAppointmentDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [appointment, setAppointment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchAppointmentDetail();
  }, [id]);

  const fetchAppointmentDetail = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.get(`/admin/appointments/${id}`);
      if (response.data.success) {
        setAppointment(response.data.data);
      } else {
        setError(response.data.message || 'Không thể tải thông tin lịch hẹn');
        toast.error(response.data.message || 'Không thể tải thông tin lịch hẹn');
      }
    } catch (error) {
      console.error('Lỗi khi tải chi tiết lịch hẹn:', error);
      setError('Đã xảy ra lỗi khi tải thông tin. Vui lòng thử lại sau.');
      toast.error('Đã xảy ra lỗi khi tải thông tin lịch hẹn');
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      pending: { label: 'Chờ xác nhận', color: 'bg-yellow-100 text-yellow-800' },
      confirmed: { label: 'Đã xác nhận', color: 'bg-blue-100 text-blue-800' },
      completed: { label: 'Hoàn thành', color: 'bg-green-100 text-green-800' },
      cancelled: { label: 'Đã hủy', color: 'bg-red-100 text-red-800' },
      rejected: { label: 'Từ chối', color: 'bg-red-100 text-red-800' },
      'no-show': { label: 'Không đến', color: 'bg-gray-100 text-gray-800' },
      rescheduled: { label: 'Đổi lịch', color: 'bg-purple-100 text-purple-800' }
    };

    const config = statusConfig[status] || statusConfig.pending;
    return (
      <span className={`px-3 py-1 rounded-full text-sm font-medium ${config.color}`}>
        {config.label}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error || !appointment) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
          <FaInfoCircle className="mx-auto text-4xl text-red-500 mb-4" />
          <h3 className="text-lg font-semibold text-red-800 mb-2">Lỗi</h3>
          <p className="text-red-600">{error || 'Không tìm thấy thông tin lịch hẹn'}</p>
          <button
            onClick={() => navigate('/admin/appointments')}
            className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
          >
            Quay lại danh sách
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center">
          <button
            onClick={() => navigate('/admin/appointments')}
            className="mr-4 p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <FaArrowLeft className="text-xl text-gray-600" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Chi tiết lịch hẹn</h1>
            <p className="text-gray-600">Mã: {appointment.bookingCode || appointment._id}</p>
          </div>
        </div>
        <div>
          {getStatusBadge(appointment.status)}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Patient Information */}
          <div className="bg-white rounded-xl shadow-md overflow-hidden">
            <div className="px-6 py-4 bg-gradient-to-r from-blue-500 to-blue-600 text-white">
              <h2 className="text-lg font-semibold flex items-center">
                <FaUser className="mr-2" /> Thông tin bệnh nhân
              </h2>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-gray-500 font-medium">Họ và tên</label>
                  <p className="text-gray-900 font-medium">{appointment.patientId?.fullName || 'N/A'}</p>
                </div>
                <div>
                  <label className="text-sm text-gray-500 font-medium flex items-center">
                    <FaPhoneAlt className="mr-1" /> Số điện thoại
                  </label>
                  <p className="text-gray-900">{appointment.patientId?.phoneNumber || 'N/A'}</p>
                </div>
                <div>
                  <label className="text-sm text-gray-500 font-medium flex items-center">
                    <FaEnvelope className="mr-1" /> Email
                  </label>
                  <p className="text-gray-900">{appointment.patientId?.email || 'N/A'}</p>
                </div>
                <div>
                  <label className="text-sm text-gray-500 font-medium flex items-center">
                    <FaHome className="mr-1" /> Địa chỉ
                  </label>
                  <p className="text-gray-900">{appointment.patientId?.address || 'N/A'}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Appointment Details */}
          <div className="bg-white rounded-xl shadow-md overflow-hidden">
            <div className="px-6 py-4 bg-gradient-to-r from-green-500 to-green-600 text-white">
              <h2 className="text-lg font-semibold flex items-center">
                <FaCalendarAlt className="mr-2" /> Thông tin lịch hẹn
              </h2>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-gray-500 font-medium flex items-center">
                    <FaStethoscope className="mr-1" /> Chuyên khoa
                  </label>
                  <p className="text-gray-900">{appointment.specialtyId?.name || 'N/A'}</p>
                </div>
                <div>
                  <label className="text-sm text-gray-500 font-medium flex items-center">
                    <FaFileAlt className="mr-1" /> Dịch vụ
                  </label>
                  <p className="text-gray-900">{appointment.serviceId?.name || 'N/A'}</p>
                </div>
                <div>
                  <label className="text-sm text-gray-500 font-medium flex items-center">
                    <FaCalendarAlt className="mr-1" /> Ngày khám
                  </label>
                  <p className="text-gray-900">
                    {moment(appointment.appointmentDate).format('DD/MM/YYYY')}
                  </p>
                </div>
                <div>
                  <label className="text-sm text-gray-500 font-medium flex items-center">
                    <FaClock className="mr-1" /> Giờ khám
                  </label>
                  <p className="text-gray-900">
                    {appointment.timeSlot?.startTime} - {appointment.timeSlot?.endTime}
                  </p>
                </div>
                <div>
                  <label className="text-sm text-gray-500 font-medium flex items-center">
                    <FaRegHospital className="mr-1" /> Cơ sở y tế
                  </label>
                  <p className="text-gray-900">{appointment.hospitalId?.name || 'N/A'}</p>
                </div>
                <div>
                  <label className="text-sm text-gray-500 font-medium flex items-center">
                    <FaDoorOpen className="mr-1" /> Phòng khám
                  </label>
                  <p className="text-gray-900">{appointment.roomId?.name || 'N/A'}</p>
                </div>
              </div>

              {appointment.symptoms && (
                <div>
                  <label className="text-sm text-gray-500 font-medium flex items-center">
                    <FaNotesMedical className="mr-1" /> Triệu chứng
                  </label>
                  <p className="text-gray-900 mt-1">{appointment.symptoms}</p>
                </div>
              )}

              {appointment.notes && (
                <div>
                  <label className="text-sm text-gray-500 font-medium flex items-center">
                    <FaInfoCircle className="mr-1" /> Ghi chú
                  </label>
                  <p className="text-gray-900 mt-1">{appointment.notes}</p>
                </div>
              )}
            </div>
          </div>

          {/* Medical Record (if completed) */}
          {appointment.status === 'completed' && appointment.medicalRecord && (
            <div className="bg-white rounded-xl shadow-md overflow-hidden">
              <div className="px-6 py-4 bg-gradient-to-r from-purple-500 to-purple-600 text-white">
                <h2 className="text-lg font-semibold flex items-center">
                  <FaFileMedical className="mr-2" /> Hồ sơ khám bệnh
                </h2>
              </div>
              <div className="p-6 space-y-4">
                {appointment.medicalRecord.diagnosis && (
                  <div>
                    <label className="text-sm text-gray-500 font-medium">Chẩn đoán</label>
                    <p className="text-gray-900 mt-1">{appointment.medicalRecord.diagnosis}</p>
                  </div>
                )}
                {appointment.medicalRecord.treatment && (
                  <div>
                    <label className="text-sm text-gray-500 font-medium">Điều trị</label>
                    <p className="text-gray-900 mt-1">{appointment.medicalRecord.treatment}</p>
                  </div>
                )}
                {appointment.medicalRecord.prescription && appointment.medicalRecord.prescription.length > 0 && (
                  <div>
                    <label className="text-sm text-gray-500 font-medium">Đơn thuốc</label>
                    <div className="mt-2 space-y-2">
                      {appointment.medicalRecord.prescription.map((med, index) => (
                        <div key={index} className="bg-gray-50 p-3 rounded-lg">
                          <p className="font-medium text-gray-900">{med.medicine}</p>
                          {med.dosage && <p className="text-sm text-gray-600">Liều lượng: {med.dosage}</p>}
                          {med.usage && <p className="text-sm text-gray-600">Cách dùng: {med.usage}</p>}
                          {med.duration && <p className="text-sm text-gray-600">Thời gian: {med.duration}</p>}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Doctor Information */}
          <div className="bg-white rounded-xl shadow-md overflow-hidden">
            <div className="px-6 py-4 bg-gradient-to-r from-indigo-500 to-indigo-600 text-white">
              <h2 className="text-lg font-semibold">Bác sĩ</h2>
            </div>
            <div className="p-6">
              <div className="text-center mb-4">
                <div className="w-20 h-20 mx-auto bg-indigo-100 rounded-full flex items-center justify-center mb-3">
                  <FaUser className="text-3xl text-indigo-600" />
                </div>
                <h3 className="font-semibold text-gray-900">
                  {appointment.doctorId?.title} {appointment.doctorId?.user?.fullName || 'N/A'}
                </h3>
                <p className="text-sm text-gray-600">{appointment.specialtyId?.name}</p>
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex items-center text-gray-600">
                  <FaPhoneAlt className="mr-2" />
                  <span>{appointment.doctorId?.user?.phoneNumber || 'N/A'}</span>
                </div>
                <div className="flex items-center text-gray-600">
                  <FaEnvelope className="mr-2" />
                  <span>{appointment.doctorId?.user?.email || 'N/A'}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Payment Information */}
          {appointment.fee && (
            <div className="bg-white rounded-xl shadow-md overflow-hidden">
              <div className="px-6 py-4 bg-gradient-to-r from-yellow-500 to-yellow-600 text-white">
                <h2 className="text-lg font-semibold">Thông tin thanh toán</h2>
              </div>
              <div className="p-6 space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">Phí khám:</span>
                  <span className="font-medium">{appointment.fee.consultationFee?.toLocaleString('vi-VN')} đ</span>
                </div>
                {appointment.fee.additionalFees > 0 && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Phí phụ:</span>
                    <span className="font-medium">{appointment.fee.additionalFees?.toLocaleString('vi-VN')} đ</span>
                  </div>
                )}
                {appointment.fee.discount > 0 && (
                  <div className="flex justify-between text-green-600">
                    <span>Giảm giá:</span>
                    <span className="font-medium">-{appointment.fee.discount?.toLocaleString('vi-VN')} đ</span>
                  </div>
                )}
                <div className="border-t pt-3 flex justify-between text-lg font-bold">
                  <span>Tổng cộng:</span>
                  <span className="text-blue-600">{appointment.fee.totalAmount?.toLocaleString('vi-VN')} đ</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminAppointmentDetail;

