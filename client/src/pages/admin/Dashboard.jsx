import React from 'react';
import { useAuth } from '../../context/AuthContext';

const AdminDashboard = () => {
  const { user } = useAuth();

  return (
    <div className="admin-dashboard">
      <div className="admin-header">
        <h1>Quản trị hệ thống</h1>
        <p>Xin chào, {user.fullName}</p>
      </div>
      
      <div className="admin-content">
        <div className="dashboard-stats">
          <div className="stat-card">
            <h3>Người dùng</h3>
            <p>1,245</p>
          </div>
          <div className="stat-card">
            <h3>Bác sĩ</h3>
            <p>87</p>
          </div>
          <div className="stat-card">
            <h3>Lịch hẹn</h3>
            <p>342</p>
          </div>
          <div className="stat-card">
            <h3>Doanh thu</h3>
            <p>25,800,000 VNĐ</p>
          </div>
        </div>
        
        <div className="dashboard-message">
          <h2>Chào mừng đến với trang quản trị</h2>
          <p>Hệ thống đang trong quá trình phát triển.</p>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard; 