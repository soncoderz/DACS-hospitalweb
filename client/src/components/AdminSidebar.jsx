import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import '../styles/admin/AdminSidebar.css';

const AdminSidebar = () => {
  const { user } = useAuth();

  return (
    <div className="admin-sidebar">
      <div className="sidebar-header">
        <div className="sidebar-logo">
          <h1>Hospital Admin</h1>
        </div>
        <div className="admin-info">
          <div className="admin-avatar">
            {user?.avatarUrl ? (
              <img src={user.avatarUrl} alt={user.fullName} />
            ) : (
              <div className="avatar-placeholder">
                {user?.fullName.charAt(0).toUpperCase()}
              </div>
            )}
          </div>
          <div className="admin-name">{user?.fullName}</div>
          <div className="admin-role">Quản trị viên</div>
        </div>
      </div>

      <nav className="sidebar-nav">
        <ul className="nav-list">
          <li className="nav-item">
            <NavLink to="/admin/dashboard" className="nav-link">
              <i className="fas fa-tachometer-alt"></i>
              <span>Tổng quan</span>
            </NavLink>
          </li>
          
          <li className="nav-section">
            <div className="section-title">Quản lý người dùng</div>
            <ul className="section-list">
              <li className="nav-item">
                <NavLink to="/admin/users" className="nav-link">
                  <i className="fas fa-users"></i>
                  <span>Người dùng</span>
                </NavLink>
              </li>
              <li className="nav-item">
                <NavLink to="/admin/doctors" className="nav-link">
                  <i className="fas fa-user-md"></i>
                  <span>Bác sĩ</span>
                </NavLink>
              </li>
              <li className="nav-item">
                <NavLink to="/admin/roles" className="nav-link">
                  <i className="fas fa-user-tag"></i>
                  <span>Vai trò</span>
                </NavLink>
              </li>
              <li className="nav-item">
                <NavLink to="/admin/permissions" className="nav-link">
                  <i className="fas fa-shield-alt"></i>
                  <span>Quyền hạn</span>
                </NavLink>
              </li>
            </ul>
          </li>
          
          <li className="nav-section">
            <div className="section-title">Quản lý dịch vụ</div>
            <ul className="section-list">
              <li className="nav-item">
                <NavLink to="/admin/specialties" className="nav-link">
                  <i className="fas fa-stethoscope"></i>
                  <span>Chuyên khoa</span>
                </NavLink>
              </li>
              <li className="nav-item">
                <NavLink to="/admin/services" className="nav-link">
                  <i className="fas fa-hand-holding-medical"></i>
                  <span>Dịch vụ</span>
                </NavLink>
              </li>
              <li className="nav-item">
                <NavLink to="/admin/hospitals" className="nav-link">
                  <i className="fas fa-hospital"></i>
                  <span>Bệnh viện</span>
                </NavLink>
              </li>
            </ul>
          </li>
          
          <li className="nav-section">
            <div className="section-title">Quản lý hoạt động</div>
            <ul className="section-list">
              <li className="nav-item">
                <NavLink to="/admin/appointments" className="nav-link">
                  <i className="fas fa-calendar-check"></i>
                  <span>Lịch hẹn</span>
                </NavLink>
              </li>
              <li className="nav-item">
                <NavLink to="/admin/payments" className="nav-link">
                  <i className="fas fa-credit-card"></i>
                  <span>Thanh toán</span>
                </NavLink>
              </li>
            </ul>
          </li>
          
          <li className="nav-section">
            <div className="section-title">Báo cáo & Thống kê</div>
            <ul className="section-list">
              <li className="nav-item">
                <NavLink to="/admin/statistics" className="nav-link">
                  <i className="fas fa-chart-line"></i>
                  <span>Thống kê</span>
                </NavLink>
              </li>
              <li className="nav-item">
                <NavLink to="/admin/reports" className="nav-link">
                  <i className="fas fa-file-alt"></i>
                  <span>Báo cáo</span>
                </NavLink>
              </li>
            </ul>
          </li>
          
          <li className="nav-section">
            <div className="section-title">Hệ thống</div>
            <ul className="section-list">
              <li className="nav-item">
                <NavLink to="/admin/settings" className="nav-link">
                  <i className="fas fa-cog"></i>
                  <span>Cài đặt</span>
                </NavLink>
              </li>
              <li className="nav-item">
                <NavLink to="/admin/logs" className="nav-link">
                  <i className="fas fa-history"></i>
                  <span>Nhật ký</span>
                </NavLink>
              </li>
            </ul>
          </li>
        </ul>
      </nav>
    </div>
  );
};

export default AdminSidebar; 