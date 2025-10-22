import React, { useEffect } from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import AdminLayout from './AdminLayout';

const AdminRoute = () => {
  const { user, loading } = useAuth();
  const location = useLocation();
  
  // Debug user info for admin route
  useEffect(() => {
    if (user) {
      console.log('Admin Route - User info:', { 
        id: user.id,
        role: user.role, 
        roleType: user.roleType,
        isAdmin: (user.role === 'admin' || user.roleType === 'admin')
      });
    } else {
      console.log('Admin Route - No user logged in');
    }
  }, [user]);

  if (loading) {
    return <div className="loading-app">Đang tải...</div>;
  }

  // Kiểm tra xác thực
  if (!user) {
    console.log('Admin Route - Redirecting to login due to no user');
    return <Navigate to="/auth" state={{ from: location }} replace />;
  }

  // Kiểm tra cả role và roleType
  const isAdmin = user.roleType === 'admin' || user.role === 'admin';
  
  if (!isAdmin) {
    console.log('Admin Route - User does not have admin role:', user.role, user.roleType);
    return <Navigate to="/" state={{ from: location }} replace />;
  }

  console.log('Admin Route - Rendering admin layout');
  return (
    <AdminLayout>
      <Outlet />
    </AdminLayout>
  );
};

export default AdminRoute; 
