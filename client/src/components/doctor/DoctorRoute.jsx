import React, { useEffect } from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import DoctorLayout from './DoctorLayout';

const DoctorRoute = () => {
  const { user, loading } = useAuth();
  const location = useLocation();

  // Debug user info for doctor route
  useEffect(() => {
    if (user) {
      console.log('Doctor Route - User info:', { 
        id: user.id,
        role: user.role, 
        roleType: user.roleType,
        isDoctor: (user.role === 'doctor' || user.roleType === 'doctor')
      });
    } else {
      console.log('Doctor Route - No user logged in');
    }
  }, [user]);

  if (loading) {
    return <div className="loading-app">Đang tải...</div>;
  }

  // Kiểm tra nếu người dùng đã xác thực
  if (!user) {
    console.log('Doctor Route - Redirecting to login due to no user');
    return <Navigate to="/auth" state={{ from: location }} replace />;
  }

  // Kiểm tra cả hai trường roleType và role
  const isDoctor = user.roleType === 'doctor' || user.role === 'doctor';
  
  if (!isDoctor) {
    console.log('Doctor Route - User does not have doctor role:', user.role, user.roleType);
    return <Navigate to="/" state={{ from: location }} replace />;
  }

  console.log('Doctor Route - Rendering doctor layout');
  // Hiển thị giao diện bác sĩ với các thành phần con
  return (
    <DoctorLayout>
      <Outlet />
    </DoctorLayout>
  );
};

export default DoctorRoute; 
