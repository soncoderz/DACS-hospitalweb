import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import api from '../../utils/api';
import '../../styles/doctor/DoctorDashboard.css';

const DoctorDashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    totalAppointments: 0,
    todayAppointments: 0,
    pendingAppointments: 0,
    completedAppointments: 0
  });
  const [recentAppointments, setRecentAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        
        // Fetch statistics
        const statsResponse = await api.get('/doctor/statistics');
        setStats(statsResponse.data);
        
        // Fetch recent appointments
        const appointmentsResponse = await api.get('/doctor/appointments/recent');
        setRecentAppointments(appointmentsResponse.data);
        
        setLoading(false);
      } catch (err) {
        console.error('Error fetching dashboard data:', err);
        setError('Không thể tải dữ liệu bảng điều khiển. Vui lòng thử lại sau.');
        setLoading(false);
      }
    };
    
    fetchDashboardData();
  }, []);

  if (loading) {
    return <div className="loading">Đang tải...</div>;
  }

  return (
    <div className="doctor-dashboard">
      <div className="dashboard-header">
        <h1>Xin chào, Bác sĩ {user?.name || user?.fullName}</h1>
        <p>Dưới đây là tổng quan về các hoạt động của bạn</p>
      </div>
      
      {error && <div className="alert alert-danger">{error}</div>}
      
      <div className="stats-cards">
        <div className="stat-card">
          <div className="stat-icon">
            <i className="fas fa-calendar-check"></i>
          </div>
          <div className="stat-info">
            <h3>{stats.totalAppointments}</h3>
            <p>Tổng lịch hẹn</p>
          </div>
        </div>
        
        <div className="stat-card">
          <div className="stat-icon today">
            <i className="fas fa-calendar-day"></i>
          </div>
          <div className="stat-info">
            <h3>{stats.todayAppointments}</h3>
            <p>Lịch hẹn hôm nay</p>
          </div>
        </div>
        
        <div className="stat-card">
          <div className="stat-icon pending">
            <i className="fas fa-clock"></i>
          </div>
          <div className="stat-info">
            <h3>{stats.pendingAppointments}</h3>
            <p>Đang chờ xác nhận</p>
          </div>
        </div>
        
        <div className="stat-card">
          <div className="stat-icon completed">
            <i className="fas fa-check-circle"></i>
          </div>
          <div className="stat-info">
            <h3>{stats.completedAppointments}</h3>
            <p>Đã hoàn thành</p>
          </div>
        </div>
      </div>
      
      <div className="dashboard-content">
        <div className="recent-appointments">
          <div className="card-header">
            <h2>Lịch hẹn gần đây</h2>
            <a href="/doctor/appointments" className="view-all">Xem tất cả</a>
          </div>
          
          <div className="appointments-list">
            {recentAppointments.length > 0 ? (
              recentAppointments.map(appointment => (
                <div key={appointment._id} className="appointment-item">
                  <div className="appointment-time">
                    <div className="date">{new Date(appointment.appointmentDate).toLocaleDateString()}</div>
                    <div className="time">{appointment.appointmentTime}</div>
                  </div>
                  
                  <div className="appointment-info">
                    <div className="patient-name">{appointment.patientName}</div>
                    <div className="service">{appointment.serviceName}</div>
                  </div>
                  
                  <div className="appointment-status">
                    <span className={`status status-${appointment.status}`}>
                      {getStatusLabel(appointment.status)}
                    </span>
                  </div>
                  
                  <div className="appointment-actions">
                    <a href={`/doctor/appointments/${appointment._id}`} className="btn-view">
                      <i className="fas fa-eye"></i>
                    </a>
                  </div>
                </div>
              ))
            ) : (
              <div className="no-data">Không có lịch hẹn gần đây</div>
            )}
          </div>
        </div>
        
        <div className="doctor-schedule">
          <div className="card-header">
            <h2>Lịch trình hôm nay</h2>
          </div>
          
          <div className="schedule-content">
            <div className="today-date">
              {new Date().toLocaleDateString('vi-VN', { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })}
            </div>
            
            <div className="schedule-timeline">
              {recentAppointments.length > 0 ? (
                recentAppointments
                  .filter(appointment => {
                    const today = new Date();
                    const appointmentDate = new Date(appointment.appointmentDate);
                    return appointmentDate.toDateString() === today.toDateString();
                  })
                  .sort((a, b) => {
                    return a.appointmentTime.localeCompare(b.appointmentTime);
                  })
                  .map(appointment => (
                    <div key={appointment._id} className="timeline-item">
                      <div className="timeline-time">{appointment.appointmentTime}</div>
                      <div className="timeline-content">
                        <div className="timeline-title">{appointment.patientName}</div>
                        <div className="timeline-subtitle">{appointment.serviceName}</div>
                      </div>
                    </div>
                  ))
              ) : (
                <div className="no-data">Không có lịch hẹn nào hôm nay</div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Helper function to convert status code to display label
const getStatusLabel = (status) => {
  const statusMap = {
    'pending': 'Chờ xác nhận',
    'confirmed': 'Đã xác nhận',
    'completed': 'Đã hoàn thành',
    'cancelled': 'Đã hủy'
  };
  
  return statusMap[status] || status;
};

export default DoctorDashboard; 