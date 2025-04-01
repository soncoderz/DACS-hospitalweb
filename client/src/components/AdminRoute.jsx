import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Spinner from './Spinner';

/**
 * Route bảo vệ dành cho Admin - chỉ cho phép admin đã đăng nhập truy cập
 * 
 * @param {Object} props
 * @param {React.ReactNode} props.children - Component con để render nếu admin đã đăng nhập
 * @param {string} [props.requiredPermission] - Quyền cụ thể cần thiết để truy cập route này
 * @param {boolean} [props.superAdminOnly=false] - Nếu true, chỉ cho phép super admin truy cập
 * @returns {React.ReactElement}
 */
const AdminRoute = ({ 
  children, 
  requiredPermission = null,
  superAdminOnly = false 
}) => {
  const { admin, loading, isAdmin, isSuperAdmin, hasPermission } = useAuth();
  const location = useLocation();

  // Hiển thị loading nếu đang kiểm tra trạng thái đăng nhập
  if (loading) {
    return <Spinner />;
  }

  // Kiểm tra xem có phải là admin không
  if (!isAdmin()) {
    // Redirect đến trang đăng nhập admin nếu chưa đăng nhập
    return <Navigate to="/admin/login" state={{ from: location }} replace />;
  }

  // Nếu route chỉ dành cho super admin
  if (superAdminOnly && !isSuperAdmin()) {
    return <Navigate to="/admin/dashboard" state={{ error: "Bạn không có quyền truy cập trang này" }} replace />;
  }

  // Nếu route yêu cầu quyền cụ thể
  if (requiredPermission && !hasPermission(requiredPermission)) {
    return <Navigate to="/admin/dashboard" state={{ error: "Bạn không có quyền truy cập trang này" }} replace />;
  }

  // Nếu qua tất cả các kiểm tra, render component con
  return children;
};

export default AdminRoute; 