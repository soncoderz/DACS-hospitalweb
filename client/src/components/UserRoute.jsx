import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { hasPermission, getHomeRouteForRole } from '../utils/roleUtils';

const UserRoute = () => {
  const { isAuthenticated, loading, user } = useAuth();

  // Hiển thị loading khi đang kiểm tra xác thực
  if (loading) {
    return <div className="loading">Đang tải...</div>;
  }

  // Chỉ cho phép người dùng đã đăng nhập truy cập
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Kiểm tra quyền truy cập vào route dành cho user
  if (!hasPermission(user, 'user')) {
    // Nếu không có quyền, chuyển hướng về trang chính của họ
    return <Navigate to={getHomeRouteForRole(user)} replace />;
  }

  return <Outlet />;
};

export default UserRoute; 