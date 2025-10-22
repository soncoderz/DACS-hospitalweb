import React from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import AdminLayout from './AdminLayout';

const AdminRoute = () => {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return <div className="loading-app">Đang tải...</div>;
  }

  // Kiểm tra xác thực
  if (!user) {
    return <Navigate to="/auth" state={{ from: location }} replace />;
  }

  // Kiểm tra cả role và roleType
  const isAdmin = user.roleType === 'admin' || user.role === 'admin';
  
  if (!isAdmin) {
    console.log('User does not have admin role:', user);
    return <Navigate to="/" state={{ from: location }} replace />;
  }

  return (
    <AdminLayout>
      <Outlet />
    </AdminLayout>
  );
};

export default AdminRoute; 
