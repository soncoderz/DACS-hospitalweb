import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Modal, Button, Form, DatePicker, TimePicker, message } from 'antd';
import { ExclamationCircleOutlined } from '@ant-design/icons';
import moment from 'moment';
import api from '../utils/api';
import '../styles/appointmentDetail.css';

const AppointmentDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [appointment, setAppointment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // State for reschedule modal
  const [isRescheduleModalOpen, setIsRescheduleModalOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState(null);
  const [availableTimeSlots, setAvailableTimeSlots] = useState([]);
  const [selectedTimeSlot, setSelectedTimeSlot] = useState(null);
  const [rescheduleLoading, setRescheduleLoading] = useState(false);
  
  // State for cancel modal
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [cancelLoading, setCancelLoading] = useState(false);
  
  useEffect(() => {
    const fetchAppointmentDetails = async () => {
      try {
        setLoading(true);
        // Trong thực tế, API sẽ gọi theo id
        // const response = await api.get(`/appointments/${id}`);
        // setAppointment(response.data);
        
        // Mock data for demo
        const mockAppointment = {
          id: id,
          doctorName: 'BS. Nguyễn Văn A',
          doctorId: '1',
          doctorSpecialty: 'Tim mạch',
          doctorAvatar: 'https://media.benhvienhathanh.vn/media/doi_ngu_bac_si/nguy%E1%BB%85n_th%E1%BB%8B_v%C3%A2n_uy%C3%AAn.png',
          hospitalName: 'Bệnh viện Đa khoa Trung ương',
          hospitalAddress: '123 Đường Nguyễn Huệ, Quận 1, TP.HCM',
          hospitalPhone: '(028) 3822 1234',
          date: '2023-08-15',
          time: '09:00',
          status: 'confirmed',
          bookingDate: '2023-07-28',
          notes: 'Khám định kỳ',
          symptoms: 'Đau ngực, khó thở',
          patientName: 'Nguyễn Văn Bình',
          patientPhone: '0987654321',
          patientEmail: 'binh.nguyen@email.com',
          patientDob: '1985-05-20',
          patientGender: 'Nam',
        };
        
        setAppointment(mockAppointment);
        setError(null);
      } catch (error) {
        console.error('Error fetching appointment details:', error);
        setError('Không thể tải chi tiết lịch hẹn. Vui lòng thử lại sau.');
      } finally {
        setLoading(false);
      }
    };

    fetchAppointmentDetails();
  }, [id]);

  // Mô phỏng lấy các khung giờ trống khi chọn ngày
  useEffect(() => {
    if (selectedDate) {
      // Trong thực tế, API sẽ gọi để lấy slots trống
      // const date = selectedDate.format('YYYY-MM-DD');
      // const response = await api.get(`/appointments/available-slots?doctorId=${appointment.doctorId}&date=${date}`);
      
      // Mock data
      const mockTimeSlots = [
        { id: 1, time: '08:00', available: true },
        { id: 2, time: '08:30', available: true },
        { id: 3, time: '09:00', available: false },
        { id: 4, time: '09:30', available: true },
        { id: 5, time: '10:00', available: false },
        { id: 6, time: '10:30', available: true },
        { id: 7, time: '11:00', available: true },
        { id: 8, time: '14:00', available: true },
        { id: 9, time: '14:30', available: false },
        { id: 10, time: '15:00', available: true },
        { id: 11, time: '15:30', available: true },
        { id: 12, time: '16:00', available: true },
        { id: 13, time: '16:30', available: true },
        { id: 14, time: '17:00', available: false },
      ];
      
      setAvailableTimeSlots(mockTimeSlots);
    }
  }, [selectedDate]);

  // Xử lý hủy lịch
  const handleCancelAppointment = async () => {
    if (!cancelReason.trim()) {
      message.error('Vui lòng nhập lý do hủy lịch');
      return;
    }
    
    setCancelLoading(true);
    
    try {
      // Gọi API hủy lịch
      // await api.put(`/appointments/${id}/cancel`, { reason: cancelReason });
      
      // Mock for demo
      setTimeout(() => {
        message.success('Hủy lịch hẹn thành công');
        setIsCancelModalOpen(false);
        
        // Cập nhật trạng thái local
        setAppointment(prev => ({
          ...prev,
          status: 'cancelled',
          cancelReason: cancelReason
        }));
        
        setCancelLoading(false);
      }, 1000);
    } catch (error) {
      console.error('Error cancelling appointment:', error);
      message.error('Không thể hủy lịch hẹn. Vui lòng thử lại sau.');
      setCancelLoading(false);
    }
  };

  // Xử lý đổi lịch
  const handleRescheduleAppointment = async () => {
    if (!selectedDate || !selectedTimeSlot) {
      message.error('Vui lòng chọn ngày và giờ mới');
      return;
    }
    
    setRescheduleLoading(true);
    
    try {
      const newDate = selectedDate.format('YYYY-MM-DD');
      
      // Gọi API đổi lịch
      // await api.put(`/appointments/${id}/reschedule`, { 
      //   date: newDate, 
      //   time: selectedTimeSlot 
      // });
      
      // Mock for demo
      setTimeout(() => {
        message.success('Đổi lịch hẹn thành công');
        setIsRescheduleModalOpen(false);
        
        // Cập nhật trạng thái local
        setAppointment(prev => ({
          ...prev,
          date: newDate,
          time: selectedTimeSlot,
          status: 'confirmed'
        }));
        
        // Reset state
        setSelectedDate(null);
        setSelectedTimeSlot(null);
        setRescheduleLoading(false);
      }, 1000);
    } catch (error) {
      console.error('Error rescheduling appointment:', error);
      message.error('Không thể đổi lịch hẹn. Vui lòng thử lại sau.');
      setRescheduleLoading(false);
    }
  };

  // Format date
  const formatDate = (dateString) => {
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(dateString).toLocaleDateString('vi-VN', options);
  };

  // Get status label and class
  const getStatusInfo = (status) => {
    switch (status) {
      case 'confirmed':
        return { text: 'Đã xác nhận', class: 'status-confirmed', icon: 'fas fa-check-circle' };
      case 'pending':
        return { text: 'Chờ xác nhận', class: 'status-pending', icon: 'fas fa-clock' };
      case 'completed':
        return { text: 'Đã hoàn thành', class: 'status-completed', icon: 'fas fa-clipboard-check' };
      case 'cancelled':
        return { text: 'Đã hủy', class: 'status-cancelled', icon: 'fas fa-times-circle' };
      default:
        return { text: 'Không xác định', class: 'status-unknown', icon: 'fas fa-question-circle' };
    }
  };

  // Xử lý disableDates cho DatePicker
  const disabledDate = (current) => {
    // Không cho phép chọn ngày trong quá khứ và sau 30 ngày
    return current && (current < moment().startOf('day') || current > moment().add(30, 'days'));
  };

  return (
    <div className="appointment-detail-page">
      <div className="container">
        <div className="page-header">
          <h1>Chi tiết lịch hẹn</h1>
        </div>

        {loading ? (
          <div className="loading-spinner">
            <div className="spinner"></div>
            <p>Đang tải thông tin lịch hẹn...</p>
          </div>
        ) : error ? (
          <div className="error-message">
            <i className="fas fa-exclamation-circle"></i>
            <p>{error}</p>
            <button className="btn btn-primary" onClick={() => navigate('/appointments')}>
              Quay lại danh sách
            </button>
          </div>
        ) : appointment ? (
          <div className="appointment-detail-container">
            <div className="appointment-status-bar">
              <div className={`status-badge ${getStatusInfo(appointment.status).class}`}>
                <i className={getStatusInfo(appointment.status).icon}></i>
                <span>{getStatusInfo(appointment.status).text}</span>
              </div>
              <div className="appointment-id">
                Mã lịch hẹn: <strong>#{appointment.id}</strong>
              </div>
            </div>
            
            <div className="detail-card">
              <div className="detail-card-header">
                <h2>Thông tin lịch hẹn</h2>
              </div>
              <div className="detail-card-body">
                <div className="appointment-date-time">
                  <div className="detail-icon">
                    <i className="fas fa-calendar-alt"></i>
                  </div>
                  <div className="detail-content">
                    <h3>Ngày và giờ khám</h3>
                    <p className="date">{formatDate(appointment.date)}</p>
                    <p className="time">{appointment.time}</p>
                  </div>
                </div>
                
                <div className="appointment-doctor">
                  <div className="detail-icon">
                    <i className="fas fa-user-md"></i>
                  </div>
                  <div className="detail-content">
                    <h3>Bác sĩ phụ trách</h3>
                    <div className="doctor-info">
                      {appointment.doctorAvatar && (
                        <img src={appointment.doctorAvatar} alt={appointment.doctorName} className="doctor-avatar" />
                      )}
                      <div>
                        <p className="doctor-name">{appointment.doctorName}</p>
                        <p className="doctor-specialty">{appointment.doctorSpecialty}</p>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="appointment-location">
                  <div className="detail-icon">
                    <i className="fas fa-hospital"></i>
                  </div>
                  <div className="detail-content">
                    <h3>Địa điểm khám</h3>
                    <p className="hospital-name">{appointment.hospitalName}</p>
                    <p className="hospital-address">{appointment.hospitalAddress}</p>
                    <p className="hospital-phone">
                      <i className="fas fa-phone-alt"></i> {appointment.hospitalPhone}
                    </p>
                  </div>
                </div>
                
                <div className="appointment-reason">
                  <div className="detail-icon">
                    <i className="fas fa-clipboard-list"></i>
                  </div>
                  <div className="detail-content">
                    <h3>Lý do khám</h3>
                    <p>{appointment.notes || 'Không có ghi chú'}</p>
                    <h3>Triệu chứng</h3>
                    <p>{appointment.symptoms || 'Không có triệu chứng được ghi nhận'}</p>
                  </div>
                </div>
                
                {appointment.status === 'cancelled' && appointment.cancelReason && (
                  <div className="appointment-cancel-reason">
                    <div className="detail-icon">
                      <i className="fas fa-times-circle"></i>
                    </div>
                    <div className="detail-content">
                      <h3>Lý do hủy</h3>
                      <p>{appointment.cancelReason}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
            
            <div className="detail-card">
              <div className="detail-card-header">
                <h2>Thông tin bệnh nhân</h2>
              </div>
              <div className="detail-card-body">
                <div className="patient-info">
                  <div className="detail-row">
                    <div className="detail-label">Họ và tên:</div>
                    <div className="detail-value">{appointment.patientName}</div>
                  </div>
                  <div className="detail-row">
                    <div className="detail-label">Ngày sinh:</div>
                    <div className="detail-value">
                      {appointment.patientDob && formatDate(appointment.patientDob)}
                    </div>
                  </div>
                  <div className="detail-row">
                    <div className="detail-label">Giới tính:</div>
                    <div className="detail-value">{appointment.patientGender}</div>
                  </div>
                  <div className="detail-row">
                    <div className="detail-label">Số điện thoại:</div>
                    <div className="detail-value">{appointment.patientPhone}</div>
                  </div>
                  <div className="detail-row">
                    <div className="detail-label">Email:</div>
                    <div className="detail-value">{appointment.patientEmail}</div>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="booking-info">
              <p>Lịch hẹn được đặt vào: {formatDate(appointment.bookingDate)}</p>
            </div>
            
            <div className="detail-actions">
              <Link to="/appointments" className="btn btn-outline">
                <i className="fas fa-arrow-left"></i> Quay lại
              </Link>
              
              {appointment.status === 'confirmed' && (
                <>
                  <button 
                    className="btn btn-primary"
                    onClick={() => setIsRescheduleModalOpen(true)}
                  >
                    <i className="fas fa-calendar-alt"></i> Đổi lịch hẹn
                  </button>
                  <button 
                    className="btn btn-danger"
                    onClick={() => setIsCancelModalOpen(true)}
                  >
                    <i className="fas fa-times"></i> Hủy lịch hẹn
                  </button>
                </>
              )}
            </div>
          </div>
        ) : (
          <div className="not-found">
            <h2>Không tìm thấy lịch hẹn</h2>
            <p>Lịch hẹn bạn đang tìm kiếm không tồn tại hoặc đã bị xóa.</p>
            <Link to="/appointments" className="btn btn-primary">
              Quay lại danh sách lịch hẹn
            </Link>
          </div>
        )}
      </div>
      
      {/* Modal đổi lịch hẹn */}
      <Modal
        title={<div className="modal-title"><i className="fas fa-calendar-alt"></i> Đổi lịch hẹn</div>}
        open={isRescheduleModalOpen}
        onCancel={() => setIsRescheduleModalOpen(false)}
        footer={null}
        className="reschedule-modal"
      >
        <Form layout="vertical">
          <Form.Item 
            label="Chọn ngày khám mới"
            required
          >
            <DatePicker 
              className="date-picker"
              format="DD/MM/YYYY"
              onChange={setSelectedDate}
              disabledDate={disabledDate}
              placeholder="Chọn ngày"
            />
          </Form.Item>
          
          {selectedDate && (
            <Form.Item 
              label="Chọn giờ khám mới"
              required
            >
              <div className="time-slots-grid">
                {availableTimeSlots.map(slot => (
                  <div 
                    key={slot.id} 
                    className={`time-slot ${!slot.available ? 'unavailable' : ''} ${selectedTimeSlot === slot.time ? 'selected' : ''}`}
                    onClick={() => {
                      if (slot.available) {
                        setSelectedTimeSlot(slot.time);
                      }
                    }}
                  >
                    {slot.time}
                    {!slot.available && <span className="unavailable-label">Đã đặt</span>}
                  </div>
                ))}
              </div>
            </Form.Item>
          )}
          
          <div className="modal-actions">
            <Button onClick={() => setIsRescheduleModalOpen(false)}>
              Hủy bỏ
            </Button>
            <Button 
              type="primary" 
              onClick={handleRescheduleAppointment}
              loading={rescheduleLoading}
              disabled={!selectedDate || !selectedTimeSlot}
            >
              Xác nhận đổi lịch
            </Button>
          </div>
        </Form>
      </Modal>
      
      {/* Modal hủy lịch hẹn */}
      <Modal
        title={<div className="modal-title"><i className="fas fa-exclamation-triangle"></i> Xác nhận hủy lịch hẹn</div>}
        open={isCancelModalOpen}
        onCancel={() => setIsCancelModalOpen(false)}
        footer={null}
        className="cancel-modal"
      >
        <div className="cancel-warning">
          <p>Bạn có chắc chắn muốn hủy lịch hẹn này?</p>
          <p className="note">Lưu ý: Nếu bạn hủy lịch khám trước thời gian khám ít hơn 24 giờ, bệnh viện có thể sẽ tính phí.</p>
        </div>
        
        <Form layout="vertical">
          <Form.Item 
            label="Lý do hủy lịch (bắt buộc)"
            required
          >
            <Form.Item
              name="cancelReason"
              rules={[{ required: true, message: 'Vui lòng nhập lý do hủy lịch' }]}
              noStyle
            >
              <textarea
                className="cancel-reason-input"
                placeholder="Vui lòng cho biết lý do bạn hủy lịch khám..."
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                rows={4}
              ></textarea>
            </Form.Item>
          </Form.Item>
          
          <div className="modal-actions">
            <Button onClick={() => setIsCancelModalOpen(false)}>
              Quay lại
            </Button>
            <Button 
              type="primary" 
              danger
              onClick={handleCancelAppointment}
              loading={cancelLoading}
              disabled={!cancelReason.trim()}
            >
              Xác nhận hủy lịch
            </Button>
          </div>
        </Form>
      </Modal>
    </div>
  );
};

export default AppointmentDetail; 