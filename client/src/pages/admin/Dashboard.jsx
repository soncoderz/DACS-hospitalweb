import React, { useState, useEffect } from 'react';
import { getAdminData } from '../../utils/adminAuth';
import AdminSidebar from './components/AdminSidebar';
import '../../styles/admin/Dashboard.css';

const AdminDashboard = () => {
  const [admin, setAdmin] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Lấy thông tin admin từ localStorage
    const adminData = getAdminData();
    if (adminData) {
      setAdmin(adminData);
    }
    setLoading(false);
  }, []);

  if (loading) {
    return <div className="loading">Đang tải...</div>;
  }

  return (
    <div className="admin-dashboard">
      <AdminSidebar activeTab="dashboard" setActiveTab={() => {}} />
      
      <div className="admin-main-content">
        <div className="admin-header">
          <h1>Quản trị hệ thống</h1>
          <p>Xin chào, {admin?.fullName || 'Admin'}</p>
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
    </div>
  );
};

export default AdminDashboard; 