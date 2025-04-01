import React, { useState, useEffect } from 'react';
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import AdminSidebar from './components/AdminSidebar';
import UsersManagement from './UsersManagement';
import BranchesManagement from './BranchesManagement';
import ServicesManagement from './ServicesManagement';
import AppointmentsManagement from './AppointmentsManagement';
import api from '../../utils/api';
import { useLocation } from 'react-router-dom';
import toast from 'react-hot-toast';

const Dashboard = () => {
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalDoctors: 0,
    totalAppointments: 0,
    totalBranches: 0,
    recentAppointments: []
  });
  const [loading, setLoading] = useState(true);
  const location = useLocation();

  useEffect(() => {
    // Check if user is admin, if not redirect to home
    if (currentUser) {
      if (currentUser.role !== 'admin') {
        navigate('/');
      } else {
        fetchDashboardStats();
      }
    } else {
      navigate('/login');
    }
  }, [currentUser, navigate]);

  useEffect(() => {
    // Kiểm tra xem có thông báo lỗi từ AdminRoute không
    if (location.state?.error) {
      toast.error(location.state.error);
      // Xóa thông báo lỗi để không hiển thị lại khi đổi route và quay lại
      history.replaceState({}, document.title);
    }
  }, [location]);

  const fetchDashboardStats = async () => {
    setLoading(true);
    try {
      const response = await api.get('/api/admin/stats');
      if (response.data.success) {
        setStats(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const renderContent = () => {
    return (
      <Routes>
        <Route path="/" element={<DashboardHome stats={stats} loading={loading} />} />
        <Route path="/users" element={<UsersManagement />} />
        <Route path="/branches" element={<BranchesManagement />} />
        <Route path="/services" element={<ServicesManagement />} />
        <Route path="/appointments" element={<AppointmentsManagement />} />
        <Route path="*" element={<Navigate to="/admin" />} />
      </Routes>
    );
  };

  if (!currentUser) return <Navigate to="/login" />;
  if (currentUser.role !== 'admin') return <Navigate to="/" />;

  return (
    <div className="admin-dashboard">
      <AdminSidebar activeTab={activeTab} setActiveTab={setActiveTab} />
      <div className="admin-main-content">
        {renderContent()}
      </div>
    </div>
  );
};

const DashboardHome = ({ stats, loading }) => {
  const getStatusClass = (status) => {
    switch (status) {
      case 'confirmed': return 'status-badge confirmed';
      case 'pending': return 'status-badge pending';
      case 'completed': return 'status-badge completed';
      case 'canceled': return 'status-badge canceled';
      case 'rescheduled': return 'status-badge rescheduled';
      default: return 'status-badge';
    }
  };

  const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  };

  if (loading) {
    return (
      <div className="loading-indicator">
        <i className="fas fa-spinner fa-spin"></i> Loading dashboard data...
      </div>
    );
  }

  return (
    <div className="admin-dashboard-content">
      <h1>Dashboard</h1>
      
      <div className="stats-cards">
        <div className="stat-card">
          <div className="stat-icon users">
            <i className="fas fa-users"></i>
          </div>
          <div className="stat-details">
            <h3>{stats.totalUsers}</h3>
            <p>Total Users</p>
          </div>
        </div>
        
        <div className="stat-card">
          <div className="stat-icon doctors">
            <i className="fas fa-user-md"></i>
          </div>
          <div className="stat-details">
            <h3>{stats.totalDoctors}</h3>
            <p>Doctors</p>
          </div>
        </div>
        
        <div className="stat-card">
          <div className="stat-icon appointments">
            <i className="fas fa-calendar-check"></i>
          </div>
          <div className="stat-details">
            <h3>{stats.totalAppointments}</h3>
            <p>Appointments</p>
          </div>
        </div>
        
        <div className="stat-card">
          <div className="stat-icon branches">
            <i className="fas fa-hospital"></i>
          </div>
          <div className="stat-details">
            <h3>{stats.totalBranches}</h3>
            <p>Branches</p>
          </div>
        </div>
      </div>
      
      <div className="recent-activity">
        <h2>Recent Appointments</h2>
        
        <div className="admin-table-container">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Patient</th>
                <th>Doctor</th>
                <th>Service</th>
                <th>Date</th>
                <th>Time</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {stats.recentAppointments.map(appointment => (
                <tr key={appointment.id}>
                  <td>{appointment.patientName}</td>
                  <td>{appointment.doctorName}</td>
                  <td>{appointment.service}</td>
                  <td>{formatDate(appointment.date)}</td>
                  <td>{appointment.time}</td>
                  <td>
                    <span className={getStatusClass(appointment.status)}>
                      {appointment.status.charAt(0).toUpperCase() + appointment.status.slice(1)}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Dashboard; 