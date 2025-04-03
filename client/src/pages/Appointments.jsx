import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';

const Appointments = () => {
  const { user } = useAuth();
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('upcoming');

  useEffect(() => {
    const fetchAppointments = async () => {
      try {
        setLoading(true);
        // Trong thực tế, API sẽ lọc theo userId
        const response = await api.get('/appointments');
        setAppointments(response.data);
        setError(null);
      } catch (error) {
        console.error('Error fetching appointments:', error);
        setError('Không thể tải lịch hẹn. Vui lòng thử lại sau.');
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      fetchAppointments();
    }
  }, [user]);

  // Demo appointments data (trong trường hợp API chưa sẵn sàng)
  const demoAppointments = [
    {
      id: '1',
      doctorName: 'BS. Nguyễn Văn A',
      doctorSpecialty: 'Tim mạch',
      hospitalName: 'Bệnh viện Đa khoa Trung ương',
      date: '2023-05-15',
      time: '09:00',
      status: 'confirmed',
      notes: 'Khám định kỳ',
      symptoms: 'Đau ngực, khó thở'
    },
    {
      id: '2',
      doctorName: 'BS. Trần Thị B',
      doctorSpecialty: 'Da liễu',
      hospitalName: 'Bệnh viện Quốc tế Vinmec',
      date: '2023-05-20',
      time: '14:30',
      status: 'pending',
      notes: 'Khám chuyên khoa',
      symptoms: 'Nổi mẩn đỏ, ngứa'
    },
    {
      id: '3',
      doctorName: 'BS. Lê Văn C',
      doctorSpecialty: 'Nội tiêu hóa',
      hospitalName: 'Bệnh viện Đa khoa Trung ương',
      date: '2023-04-10',
      time: '10:15',
      status: 'completed',
      notes: 'Tái khám',
      symptoms: 'Đau bụng, khó tiêu',
      diagnosis: 'Viêm dạ dày',
      prescription: 'Omeprazole 20mg, uống 1 viên sau ăn sáng và tối'
    },
    {
      id: '4',
      doctorName: 'BS. Phạm Thị D',
      doctorSpecialty: 'Thần kinh',
      hospitalName: 'Bệnh viện Quốc tế Vinmec',
      date: '2023-04-05',
      time: '08:00',
      status: 'cancelled',
      cancelReason: 'Bác sĩ có việc đột xuất'
    }
  ];

  // Filter appointments based on activeTab
  const filteredAppointments = demoAppointments.filter(appointment => {
    const appointmentDate = new Date(appointment.date);
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
        // API call to cancel appointment
        // await api.put(`/appointments/${id}/cancel`);
        
        // For demo, just update local state
        const updatedAppointments = demoAppointments.map(appointment => 
          appointment.id === id ? { ...appointment, status: 'cancelled', cancelReason: 'Hủy bởi người dùng' } : appointment
        );
        
        setAppointments(updatedAppointments);
        alert('Hủy lịch hẹn thành công');
      } catch (error) {
        console.error('Error cancelling appointment:', error);
        alert('Không thể hủy lịch hẹn. Vui lòng thử lại sau.');
      }
    }
  };

  const handleReschedule = (id) => {
    // Navigate to reschedule page or open modal
    alert(`Chức năng đổi lịch hẹn ID: ${id} sẽ được cập nhật sau`);
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
              <a href="/appointment" className="btn btn-primary">Đặt lịch khám</a>
            )}
          </div>
        ) : (
          <div className="appointments-list">
            {filteredAppointments.map((appointment) => (
              <div key={appointment.id} className="appointment-card">
                <div className="appointment-header">
                  <div className="appointment-date">
                    <i className="fas fa-calendar-alt"></i>
                    <span>{formatDate(appointment.date)} - {appointment.time}</span>
                  </div>
                  <div className={`appointment-status ${getStatusLabel(appointment.status).class}`}>
                    <span>{getStatusLabel(appointment.status).text}</span>
                  </div>
                </div>

                <div className="appointment-body">
                  <div className="appointment-doctor">
                    <h3>{appointment.doctorName}</h3>
                    <p><i className="fas fa-stethoscope"></i> {appointment.doctorSpecialty}</p>
                  </div>
                  
                  <div className="appointment-hospital">
                    <p><i className="fas fa-hospital"></i> {appointment.hospitalName}</p>
                  </div>
                  
                  {appointment.notes && (
                    <div className="appointment-notes">
                      <p><strong>Ghi chú:</strong> {appointment.notes}</p>
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
                        onClick={() => handleReschedule(appointment.id)}
                      >
                        <i className="fas fa-calendar-day"></i> Đổi lịch
                      </button>
                      <button 
                        className="btn btn-danger btn-sm"
                        onClick={() => handleCancelAppointment(appointment.id)}
                      >
                        <i className="fas fa-times-circle"></i> Hủy lịch
                      </button>
                    </>
                  )}
                  
                  {appointment.status === 'completed' && (
                    <a href={`/medical-records/${appointment.id}`} className="btn btn-primary btn-sm">
                      <i className="fas fa-file-medical"></i> Xem hồ sơ
                    </a>
                  )}
                  
                  {appointment.status === 'pending' && (
                    <button 
                      className="btn btn-danger btn-sm"
                      onClick={() => handleCancelAppointment(appointment.id)}
                    >
                      <i className="fas fa-times-circle"></i> Hủy lịch
                    </button>
                  )}
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