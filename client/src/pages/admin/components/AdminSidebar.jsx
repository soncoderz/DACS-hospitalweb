import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';
import { logoutAdmin } from '../../../utils/adminAuth';

const AdminSidebar = ({ activeTab, setActiveTab }) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [avatarError, setAvatarError] = useState(false);
  // Add ref for tracking mounted state
  const isMounted = useRef(true);

  // Cleanup when component unmounts
  useEffect(() => {
    return () => {
      isMounted.current = false;
    };
  }, []);

  const handleLogout = () => {
    // Sử dụng hàm logoutAdmin từ adminAuth
    logoutAdmin();
    
    // Chuyển hướng về trang đăng nhập admin
    if (isMounted.current) {
      navigate('/admin/login');
    }
  };

  const handleTabClick = (tab) => {
    if (!isMounted.current) return;
    
    setActiveTab(tab);
    
    // Navigate to the appropriate route
    switch (tab) {
      case 'dashboard':
        navigate('/admin');
        break;
      case 'users':
        navigate('/admin/users');
        break;
      case 'doctors':
        navigate('/admin/doctors');
        break;
      case 'branches':
        navigate('/admin/branches');
        break;
      case 'services':
        navigate('/admin/services');
        break;
      case 'appointments':
        navigate('/admin/appointments');
        break;
      default:
        navigate('/admin');
    }
  };

  // Get active tab from current path
  useEffect(() => {
    if (!isMounted.current) return;
    
    const path = location.pathname;
    if (path === '/admin') {
      setActiveTab('dashboard');
    } else if (path.includes('/admin/users')) {
      setActiveTab('users');
    } else if (path.includes('/admin/doctors')) {
      setActiveTab('doctors');
    } else if (path.includes('/admin/branches')) {
      setActiveTab('branches');
    } else if (path.includes('/admin/services')) {
      setActiveTab('services');
    } else if (path.includes('/admin/appointments')) {
      setActiveTab('appointments');
    }
  }, [location.pathname, setActiveTab]);

  useEffect(() => {
    if (!isMounted.current || !user) return;
    
    console.log("AdminSidebar user:", user);
    console.log("Avatar URL:", user.avatarUrl || "No avatar provided");
  }, [user]);

  const handleAvatarError = () => {
    if (!isMounted.current) return;
    
    console.log("Admin avatar image failed to load");
    setAvatarError(true);
  };

  const getUserInitials = () => {
    if (!user || !user.fullName) return "A";
    
    const nameParts = user.fullName.split(" ");
    if (nameParts.length > 1) {
      return `${nameParts[0][0]}${nameParts[nameParts.length - 1][0]}`.toUpperCase();
    }
    return nameParts[0][0].toUpperCase();
  };

  return (
    <div className="admin-sidebar">
      <div className="admin-sidebar-header">
        <div className="admin-logo">
          <i className="fas fa-hospital-user"></i>
          <h2>Admin Portal</h2>
        </div>
        <div className="admin-user-info">
          {user?.avatarUrl && !avatarError ? (
            <img 
              src={user.avatarUrl} 
              alt="Admin" 
              className="admin-avatar"
              onError={handleAvatarError}
            />
          ) : (
            <div className="admin-avatar-fallback">
              {getUserInitials()}
            </div>
          )}
          <div className="admin-user-details">
            <h4>{user?.fullName || "Admin User"}</h4>
            <p>{user?.email || "admin@example.com"}</p>
          </div>
        </div>
      </div>
      
      <div className="admin-navigation">
        <ul>
          <li 
            className={activeTab === 'dashboard' ? 'active' : ''} 
            onClick={() => handleTabClick('dashboard')}
          >
            <i className="fas fa-tachometer-alt"></i>
            <span>Dashboard</span>
          </li>
          <li 
            className={activeTab === 'users' ? 'active' : ''} 
            onClick={() => handleTabClick('users')}
          >
            <i className="fas fa-users"></i>
            <span>User Management</span>
          </li>
          <li 
            className={activeTab === 'doctors' ? 'active' : ''} 
            onClick={() => handleTabClick('doctors')}
          >
            <i className="fas fa-user-md"></i>
            <span>Doctor Management</span>
          </li>
          <li 
            className={activeTab === 'branches' ? 'active' : ''} 
            onClick={() => handleTabClick('branches')}
          >
            <i className="fas fa-hospital"></i>
            <span>Branch Management</span>
          </li>
          <li 
            className={activeTab === 'services' ? 'active' : ''} 
            onClick={() => handleTabClick('services')}
          >
            <i className="fas fa-procedures"></i>
            <span>Service Management</span>
          </li>
          <li 
            className={activeTab === 'appointments' ? 'active' : ''} 
            onClick={() => handleTabClick('appointments')}
          >
            <i className="fas fa-calendar-check"></i>
            <span>Appointments</span>
          </li>
          <li 
            className={activeTab === 'reports' ? 'active' : ''} 
            onClick={() => handleTabClick('reports')}
          >
            <i className="fas fa-chart-bar"></i>
            <span>Reports</span>
          </li>
          <li 
            className={activeTab === 'settings' ? 'active' : ''} 
            onClick={() => handleTabClick('settings')}
          >
            <i className="fas fa-cog"></i>
            <span>System Settings</span>
          </li>
        </ul>
      </div>
      
      <div className="admin-sidebar-footer">
        <button className="logout-button" onClick={handleLogout}>
          <i className="fas fa-sign-out-alt"></i>
          <span>Logout</span>
        </button>
      </div>
    </div>
  );
};

export default AdminSidebar; 