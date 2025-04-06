import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const UserRoute = () => {
  const { isAuthenticated, loading } = useAuth();

  // Hiển thị loading khi đang kiểm tra xác thực
  if (loading) {
    return <div className="loading">Đang tải...</div>;
  }

  // Chỉ cho phép người dùng đã đăng nhập truy cập
  if (!isAuthenticated) {
    return <Navigate to="/auth" replace />;
  }

  // Nếu đã đăng nhập, cho phép truy cập các route
  return <Outlet />;
};

export default UserRoute; 