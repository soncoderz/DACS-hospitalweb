import React, { createContext, useState, useContext, useEffect } from 'react';
import api from '../utils/api';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [admin, setAdmin] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Kiểm tra trạng thái đăng nhập khi khởi động ứng dụng
    const loadUserFromStorage = async () => {
      setLoading(true);
      const token = localStorage.getItem('token');
      const isAdmin = localStorage.getItem('isAdmin') === 'true';
      
      if (token) {
        // Đặt header cho tất cả các request
        api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        
        try {
          if (isAdmin) {
            // Nếu là admin, gọi API admin/me
            const response = await api.get('/api/admin/me');
            if (response.data.success) {
              setAdmin(response.data.data);
              setUser(null); // Đảm bảo user được xóa khi đăng nhập là admin
            } else {
              logout(); // Nếu API không trả về success, đăng xuất
            }
          } else {
            // Nếu là user thông thường, gọi API auth/me
            const response = await api.get('/api/auth/me');
            if (response.data.success) {
              setUser(response.data.data);
              setAdmin(null); // Đảm bảo admin được xóa khi đăng nhập là user
            } else {
              logout(); // Nếu API không trả về success, đăng xuất
            }
          }
        } catch (error) {
          console.error('Error loading user:', error);
          logout(); // Nếu có lỗi, đăng xuất
        }
      }
      
      setLoading(false);
    };
    
    loadUserFromStorage();
  }, []);

  // Đăng nhập người dùng
  const login = (userData, remember = false) => {
    setUser(userData);
    setAdmin(null); // Đảm bảo admin được xóa khi đăng nhập là user
    
    // Đặt header cho tất cả các request tiếp theo
    api.defaults.headers.common['Authorization'] = `Bearer ${userData.token}`;
    
    // Lưu token nếu remember = true hoặc mặc định
    if (remember) {
      localStorage.setItem('token', userData.token);
      localStorage.setItem('isAdmin', 'false');
    }
  };

  // Đăng nhập admin
  const loginAdmin = (adminData, remember = false) => {
    setAdmin(adminData);
    setUser(null); // Đảm bảo user được xóa khi đăng nhập là admin
    
    // Đặt header cho tất cả các request tiếp theo
    api.defaults.headers.common['Authorization'] = `Bearer ${adminData.token}`;
    
    // Lưu token nếu remember = true hoặc mặc định
    if (remember) {
      localStorage.setItem('token', adminData.token);
      localStorage.setItem('isAdmin', 'true');
    }
  };

  // Đăng xuất
  const logout = () => {
    setUser(null);
    setAdmin(null);
    
    // Xóa header Authorization
    delete api.defaults.headers.common['Authorization'];
    
    // Xóa token từ localStorage
    localStorage.removeItem('token');
    localStorage.removeItem('isAdmin');
  };

  // Cập nhật thông tin người dùng
  const updateUser = (updatedData) => {
    setUser(prevUser => ({
      ...prevUser,
      ...updatedData
    }));
  };

  // Cập nhật thông tin admin
  const updateAdmin = (updatedData) => {
    setAdmin(prevAdmin => ({
      ...prevAdmin,
      ...updatedData
    }));
  };

  // Check if user is authenticated
  const isAuthenticated = () => {
    return !!user || !!admin;
  };

  // Check if user is admin
  const isAdmin = () => {
    return !!admin;
  };

  // Check if user is super admin
  const isSuperAdmin = () => {
    return admin && admin.role === 'super_admin';
  };

  // Check if admin has permission
  const hasPermission = (permission) => {
    if (!admin) return false;
    if (admin.role === 'super_admin') return true;
    return admin.permissions && admin.permissions.includes(permission);
  };

  return (
    <AuthContext.Provider value={{ 
      user,
      admin,
      loading,
      login,
      loginAdmin,
      logout,
      updateUser,
      updateAdmin,
      isAuthenticated,
      isAdmin,
      isSuperAdmin,
      hasPermission
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext; 