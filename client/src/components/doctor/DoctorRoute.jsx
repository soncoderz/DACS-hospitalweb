import React from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import DoctorLayout from './DoctorLayout';

const DoctorRoute = () => {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return <div className="loading-app">Đang tải...</div>;
  }

  // Kiểm tra nếu người dùng đã xác thực
  if (!user) {
    // Chuyển hướng đến trang đăng nhập nếu chưa xác thực
    return <Navigate to="/auth" state={{ from: location }} replace />;
  }

  // Kiểm tra cả hai trường roleType và role
  const isDoctor = user.roleType === 'doctor' || user.role === 'doctor';
  
  if (!isDoctor) {
    // Chuyển hướng về trang chủ nếu không phải bác sĩ
    return <Navigate to="/" state={{ from: location }} replace />;
  }

  // Hiển thị giao diện bác sĩ với các thành phần con
  return (
    <DoctorLayout>
      <Outlet />
    </DoctorLayout>
  );
};

export default DoctorRoute; 
