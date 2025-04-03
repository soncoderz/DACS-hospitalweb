import React, { useState, useEffect } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { hasPermission, getHomeRouteForRole } from '../utils/roleUtils';

const AdminRoute = () => {
  const { isAuthenticated, user, loading } = useAuth();
  const [adminAuthenticated, setAdminAuthenticated] = useState(false);
  const [adminLoading, setAdminLoading] = useState(true);

  useEffect(() => {
    // Kiểm tra token admin từ localStorage
    const adminToken = localStorage.getItem('adminToken');
    const adminData = localStorage.getItem('adminData');
    
    if (adminToken && adminData) {
      setAdminAuthenticated(true);
    }
    
    setAdminLoading(false);
  }, []);

  // Hiển thị loading khi đang kiểm tra xác thực
  if (loading || adminLoading) {
    return <div className="loading">Đang tải...</div>;
  }

  // Nếu có token admin, cho phép truy cập
  if (adminAuthenticated) {
    return <Outlet />;
  }

  // Kiểm tra xác thực người dùng thông thường
  if (!isAuthenticated) {
    return <Navigate to="/admin/login" replace />;
  }

  // Kiểm tra quyền truy cập vào route dành cho admin
  if (!hasPermission(user, 'admin')) {
    // Nếu không có quyền, chuyển hướng về trang đăng nhập admin
    return <Navigate to="/admin/login" replace />;
  }

  return <Outlet />;
};

export default AdminRoute; 