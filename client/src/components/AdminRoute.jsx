import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { hasPermission, getHomeRouteForRole } from '../utils/roleUtils';

const AdminRoute = () => {
  const { isAuthenticated, user, loading } = useAuth();

  // Hiển thị loading khi đang kiểm tra xác thực
  if (loading) {
    return <div className="loading">Đang tải...</div>;
  }

  // Kiểm tra xác thực trước
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Kiểm tra quyền truy cập vào route dành cho admin
  if (!hasPermission(user, 'admin')) {
    // Nếu không có quyền, chuyển hướng về trang chính của họ
    return <Navigate to={getHomeRouteForRole(user)} replace />;
  }

  return <Outlet />;
};

export default AdminRoute; 