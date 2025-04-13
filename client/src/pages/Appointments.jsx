import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import { Link } from 'react-router-dom';
import '../styles/appointments.css';

const Appointments = () => {
  const { user } = useAuth();
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('upcoming');

  // Dữ liệu mẫu để hiển thị nếu API lỗi
  const demoAppointments = [
    {
      _id: '1',
      doctorId: {
        fullName: 'BS. Nguyễn Văn A',
        specialty: 'Tim mạch'
      },
      hospitalName: 'Bệnh viện Đa khoa Trung ương',
      appointmentDate: new Date(Date.now() + 7*24*60*60*1000).toISOString().split('T')[0], // 7 ngày nữa
      timeSlot: '09:00',
      status: 'confirmed',
      note: 'Khám định kỳ',
      symptoms: 'Đau ngực, khó thở'
    },
    {
      _id: '2',
      doctorId: {
        fullName: 'BS. Trần Thị B',
        specialty: 'Da liễu'
      },
      hospitalName: 'Bệnh viện Quốc tế Vinmec',
      appointmentDate: new Date(Date.now() + 5*24*60*60*1000).toISOString().split('T')[0], // 5 ngày nữa
      timeSlot: '14:30',
      status: 'pending',
      note: 'Khám chuyên khoa',
      symptoms: 'Nổi mẩn đỏ, ngứa'
    },
    {
      _id: '3',
      doctorId: {
        fullName: 'BS. Lê Văn C',
        specialty: 'Nội tiêu hóa'
      },
      hospitalName: 'Bệnh viện Đa khoa Trung ương',
      appointmentDate: new Date(Date.now() - 20*24*60*60*1000).toISOString().split('T')[0], // 20 ngày trước
      timeSlot: '10:15',
      status: 'completed',
      note: 'Tái khám',
      symptoms: 'Đau bụng, khó tiêu',
      diagnosis: 'Viêm dạ dày',
      prescription: 'Omeprazole 20mg, uống 1 viên sau ăn sáng và tối'
    },
    {
      _id: '4',
      doctorId: {
        fullName: 'BS. Phạm Thị D',
        specialty: 'Thần kinh'
      },
      hospitalName: 'Bệnh viện Quốc tế Vinmec',
      appointmentDate: new Date(Date.now() - 10*24*60*60*1000).toISOString().split('T')[0], // 10 ngày trước
      timeSlot: '08:00',
      status: 'cancelled',
      cancelReason: 'Bác sĩ có việc đột xuất'
    }
  ];

  useEffect(() => {
    const fetchAppointments = async () => {
      try {
        setLoading(true);
        console.log('Hiển thị danh sách lịch hẹn mẫu');
        
        // Set dữ liệu mẫu ngay lập tức
        setAppointments(demoAppointments);

        // Vẫn thử gọi API để xem lỗi
        try {
          const response = await api.get('/api/appointments/my-appointments');
          console.log('API response:', response);
          if (response.data && response.data.success && response.data.appointments.length > 0) {
            // Nếu API trả về dữ liệu thành công, cập nhật state
            setAppointments(response.data.appointments);
            setError(null);
          }
        } catch (apiError) {
          console.error('API Error details:', apiError);
        }
      } catch (error) {
        console.error('Fallback error:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchAppointments();
  }, []);

  // Filter appointments based on activeTab
  const filteredAppointments = appointments.filter(appointment => {
    const appointmentDate = new Date(appointment.appointmentDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    if (activeTab === 'upcoming') {
      return appointmentDate >= today && ['confirmed', 'pending'].includes(appointment.status);
    } else if (activeTab === 'completed') {
      return appointment.status === 'completed';
    } else if (activeTab === 'cancelled') {
      return appointment.status === 'cancelled';
    }
    return true;
  });

  const getStatusLabel = (status) => {
    switch (status) {
      case 'confirmed':
        return { text: 'Đã xác nhận', class: 'status-confirmed' };
      case 'pending':
        return { text: 'Chờ xác nhận', class: 'status-pending' };
      case 'completed':
        return { text: 'Đã hoàn thành', class: 'status-completed' };
      case 'cancelled':
        return { text: 'Đã hủy', class: 'status-cancelled' };
      default:
        return { text: 'Không xác định', class: 'status-unknown' };
    }
  };

  const formatDate = (dateString) => {
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(dateString).toLocaleDateString('vi-VN', options);
  };

  const handleCancelAppointment = async (id) => {
    if (window.confirm('Bạn có chắc chắn muốn hủy lịch hẹn này?')) {
      try {
        // Gọi API để hủy lịch hẹn với đường dẫn chính xác
        const reason = prompt('Vui lòng nhập lý do hủy lịch:') || 'Hủy bởi người dùng';
        const response = await api.patch(`/api/appointments/${id}/cancel`, { reason });
        
        if (response.data && response.data.success) {
          // Cập nhật state với dữ liệu mới
          const updatedAppointments = appointments.map(appointment => 
            appointment._id === id 
              ? { ...appointment, status: 'cancelled', cancelReason: reason, cancelledAt: new Date() } 
              : appointment
          );
          
          setAppointments(updatedAppointments);
          alert('Hủy lịch hẹn thành công');
        } else {
          alert(response.data?.message || 'Không thể hủy lịch hẹn. Vui lòng thử lại sau.');
        }
      } catch (error) {
        console.error('Error cancelling appointment:', error);
        alert(error.response?.data?.message || 'Không thể hủy lịch hẹn. Vui lòng thử lại sau.');
      }
    }
  };

  const handleReschedule = (id) => {
    // Chuyển hướng đến trang chi tiết lịch hẹn để đổi lịch
    window.location.href = `/appointments/${id}`;
  };

  return (
    <div className="appointments-page">
      <div className="container">
        <div className="page-header">
          <h1>Lịch hẹn của tôi</h1>
          <p>Quản lý tất cả các lịch hẹn khám bệnh của bạn</p>
        </div>

        <div className="appointments-tabs">
          <button 
            className={`tab-button ${activeTab === 'upcoming' ? 'active' : ''}`}
            onClick={() => setActiveTab('upcoming')}
          >
            Sắp tới
          </button>
          <button 
            className={`tab-button ${activeTab === 'completed' ? 'active' : ''}`}
            onClick={() => setActiveTab('completed')}
          >
            Đã hoàn thành
          </button>
          <button 
            className={`tab-button ${activeTab === 'cancelled' ? 'active' : ''}`}
            onClick={() => setActiveTab('cancelled')}
          >
            Đã hủy
          </button>
        </div>

        {loading ? (
          <div className="loading-spinner">
            <div className="spinner"></div>
            <p>Đang tải lịch hẹn...</p>
          </div>
        ) : error ? (
          <div className="error-message">{error}</div>
        ) : filteredAppointments.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">
              <i className="fas fa-calendar-times"></i>
            </div>
            <h3>Không có lịch hẹn</h3>
            <p>Bạn chưa có lịch hẹn nào {activeTab === 'upcoming' ? 'sắp tới' : activeTab === 'completed' ? 'đã hoàn thành' : 'đã hủy'}.</p>
            {activeTab === 'upcoming' && (
              <Link to="/appointment" className="btn btn-primary">
                <i className="fas fa-calendar-plus"></i> Đặt lịch khám
              </Link>
            )}
          </div>
        ) : (
          <div className="appointments-list">
            {filteredAppointments.map((appointment) => (
              <div key={appointment._id} className="appointment-card">
                <div className="appointment-header">
                  <div className="appointment-date">
                    <i className="fas fa-calendar-alt"></i>
                    <span>{formatDate(appointment.appointmentDate)} - {appointment.timeSlot}</span>
                  </div>
                  <div className={`appointment-status ${getStatusLabel(appointment.status).class}`}>
                    <span>{getStatusLabel(appointment.status).text}</span>
                  </div>
                </div>

                <div className="appointment-body">
                  <div className="appointment-doctor">
                    <h3>{appointment.doctorId?.fullName || 'Chưa xác định'}</h3>
                    <p><i className="fas fa-stethoscope"></i> {appointment.doctorId?.specialty || 'Chưa xác định'}</p>
                  </div>
                  
                  <div className="appointment-hospital">
                    <p><i className="fas fa-hospital"></i> {appointment.hospitalName || 'Phòng khám đa khoa'}</p>
                  </div>
                  
                  {appointment.note && (
                    <div className="appointment-notes">
                      <p><strong>Ghi chú:</strong> {appointment.note}</p>
                    </div>
                  )}
                  
                  {appointment.symptoms && (
                    <div className="appointment-symptoms">
                      <p><strong>Triệu chứng:</strong> {appointment.symptoms}</p>
                    </div>
                  )}
                  
                  {appointment.diagnosis && (
                    <div className="appointment-diagnosis">
                      <p><strong>Chẩn đoán:</strong> {appointment.diagnosis}</p>
                    </div>
                  )}
                  
                  {appointment.prescription && (
                    <div className="appointment-prescription">
                      <p><strong>Đơn thuốc:</strong> {appointment.prescription}</p>
                    </div>
                  )}
                  
                  {appointment.cancelReason && (
                    <div className="appointment-cancel-reason">
                      <p><strong>Lý do hủy:</strong> {appointment.cancelReason}</p>
                    </div>
                  )}
                </div>

                <div className="appointment-actions">
                  {appointment.status === 'confirmed' && (
                    <>
                      <button 
                        className="btn btn-outline btn-sm"
                        onClick={() => handleReschedule(appointment._id)}
                      >
                        <i className="fas fa-calendar-alt"></i> Đổi lịch
                      </button>
                      <button 
                        className="btn btn-danger btn-sm"
                        onClick={() => handleCancelAppointment(appointment._id)}
                      >
                        <i className="fas fa-times"></i> Hủy lịch
                      </button>
                    </>
                  )}
                  <Link 
                    to={`/appointments/${appointment._id}`} 
                    className="btn btn-primary btn-sm"
                  >
                    <i className="fas fa-eye"></i> Xem chi tiết
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Appointments; 