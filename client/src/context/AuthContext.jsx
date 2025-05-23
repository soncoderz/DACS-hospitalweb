import React, { createContext, useState, useEffect, useContext, useCallback } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { jwtDecode } from 'jwt-decode';
import api from '../utils/api';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const isAuthenticated = !!user;
  const isAdmin = user && user.roleType === 'admin';

  // Function to check if token is expired
  const isTokenExpired = useCallback((token) => {
    if (!token) return true;
    
    try {
      const decoded = jwtDecode(token);
      const currentTime = Date.now() / 1000;
      return decoded.exp < currentTime;
    } catch (error) {
      console.error('Error decoding token:', error);
      return true;
    }
  }, []);

  // Function to refresh token
  const refreshToken = useCallback(async () => {
    try {
      const response = await api.get('/api/auth/refresh-token');
      
      if (response.data.success && response.data.data.token) {
        // Determine which storage to use
        const storageToUse = localStorage.getItem('userInfo') 
          ? localStorage 
          : sessionStorage;
        
        // Get current user data
        const userInfo = JSON.parse(storageToUse.getItem('userInfo')) || {};
        
        // Update token and user data
        const updatedUserInfo = {
          ...userInfo,
          ...response.data.data.user,
          token: response.data.data.token
        };
        
        // Update storage and state
        storageToUse.setItem('userInfo', JSON.stringify(updatedUserInfo));
        setUser(updatedUserInfo);
        
        // Update axios header
        axios.defaults.headers.common['Authorization'] = `Bearer ${updatedUserInfo.token}`;
        
        return updatedUserInfo;
      }
    } catch (error) {
      console.error('Token refresh error:', error);
      // If refresh fails, logout
      logout(false);
      return null;
    }
  }, []);

  // Set up axios interceptor for token refresh
  useEffect(() => {
    const interceptor = api.interceptors.response.use(
      (response) => response,
      async (error) => {
        if (error.response && error.response.status === 401 && user?.token) {
          // Check if token is expired
          if (isTokenExpired(user.token)) {
            // Try to refresh the token
            const refreshed = await refreshToken();
            if (refreshed) {
              // Retry the original request with new token
              const originalRequest = error.config;
              originalRequest.headers.Authorization = `Bearer ${refreshed.token}`;
              return api(originalRequest);
            }
          }
        }
        return Promise.reject(error);
      }
    );
    
    // Clean up interceptor on unmount
    return () => {
      api.interceptors.response.eject(interceptor);
    };
  }, [user, isTokenExpired, refreshToken]);
  
  // Set up periodic token refresh
  useEffect(() => {
    let refreshInterval;
    
    if (user?.token) {
      // Refresh token every 15 minutes
      refreshInterval = setInterval(async () => {
        // Only refresh if token exists and is about to expire
        const decoded = jwtDecode(user.token);
        const timeUntilExpiry = decoded.exp - Date.now() / 1000;
        
        // If token expires in less than 5 minutes, refresh it
        if (timeUntilExpiry < 300) {
          console.log('Token expiring soon, refreshing...');
          await refreshToken();
        }
      }, 15 * 60 * 1000); // Check every 15 minutes
    }
    
    return () => {
      if (refreshInterval) clearInterval(refreshInterval);
    };
  }, [user, refreshToken]);

  useEffect(() => {
    // Check for user in localStorage or sessionStorage
    const userFromStorage = 
      JSON.parse(localStorage.getItem('userInfo')) || 
      JSON.parse(sessionStorage.getItem('userInfo'));
    
    if (userFromStorage) {
      console.log('User from storage:', userFromStorage); // Debug
      
      // Check if token is expired
      if (isTokenExpired(userFromStorage.token)) {
        console.log('Stored token is expired, attempting to refresh...');
        refreshToken().then(() => {
          setLoading(false);
        }).catch(() => {
          setLoading(false);
        });
      } else {
        setUser(userFromStorage);
        // Set axios default header for future requests
        axios.defaults.headers.common['Authorization'] = `Bearer ${userFromStorage.token}`;
        setLoading(false);
      }
    } else {
      setLoading(false);
    }
  }, [isTokenExpired, refreshToken]);

  // Login handler
  const login = (userData, rememberMe = false, showNotification = false) => {
    console.log('Login userData:', userData); // Kiểm tra dữ liệu người dùng
    console.log('User role:', userData.role);
    console.log('User roleType:', userData.roleType);
    
    // Debug avatar data
    console.log('Avatar data present:', !!userData.avatarData); 
    console.log('Avatar URL present:', !!userData.avatarUrl);

    // Preserve the role from the server
    const role = userData.role || 'user';

    // Nếu là cập nhật profile (không có token mới)
    if (!userData.token) {
      // Get the current token from storage
      const currentUser = JSON.parse(localStorage.getItem('userInfo')) || 
                           JSON.parse(sessionStorage.getItem('userInfo'));
      
      if (currentUser && currentUser.token) {
        // Preserve the token when updating user data
        userData = { ...userData, token: currentUser.token, role: currentUser.role || role };
        console.log('Preserved token during profile update:', userData.token);
      } else {
        console.warn('No token found when updating user profile');
      }
    }
    
    // Đảm bảo giữ lại thông tin avatar khi cập nhật
    if (userData.avatarData || userData.avatarUrl) {
      console.log('Preserving avatar data during login');
    }
    
    console.log('Final userData to store:', {
      ...userData,
      role: userData.role || role,
      avatarData: userData.avatarData ? 'Has avatar data' : 'No avatar data',
      avatarUrl: userData.avatarUrl || 'No avatar URL'
    });
    
    // Determine which storage to use (prefer the one already in use if any)
    let storageToUse;
    if (localStorage.getItem('userInfo')) {
      storageToUse = localStorage;
    } else if (sessionStorage.getItem('userInfo')) {
      storageToUse = sessionStorage;
    } else {
      storageToUse = rememberMe ? localStorage : sessionStorage;
    }
    
    // Cập nhật storage
    storageToUse.setItem('userInfo', JSON.stringify(userData));
    
    // Cập nhật state
    setUser(userData);
    
    // Cập nhật header cho axios
    if (userData && userData.token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${userData.token}`;
    }
    
    // Hiển thị thông báo đăng nhập thành công nếu yêu cầu
    if (showNotification) {
      toast.success(`Đăng nhập thành công! Xin chào, ${userData.fullName || 'bạn'}`);
    }
    
    return userData;
  };

  // Add updateUserData function
  const updateUserData = (userData) => {
    // Get current user from state
    const currentUser = user;
    
    if (!currentUser) {
      console.warn('No user found to update');
      return;
    }
    
    // Merge new data with current user data, preserving the token and role
    const updatedUser = { 
      ...currentUser, 
      ...userData, 
      role: userData.role || currentUser.role || 'user' 
    };
    
    // Determine which storage to use
    const storageToUse = localStorage.getItem('userInfo') 
      ? localStorage 
      : sessionStorage;
    
    // Cập nhật storage
    storageToUse.setItem('userInfo', JSON.stringify(updatedUser));
    
    // Cập nhật state
    setUser(updatedUser);
  };

  // Logout handler
  const logout = (showNotification = true) => {
    // Lưu tên người dùng trước khi đăng xuất để hiển thị trong thông báo
    const userName = user?.fullName || 'bạn';
    
    // Xóa thông tin người dùng khỏi localStorage và sessionStorage
    localStorage.removeItem('userInfo');
    sessionStorage.removeItem('userInfo');
    
    // Xóa người dùng khỏi state
    setUser(null);
    
    // Xóa header xác thực
    delete axios.defaults.headers.common['Authorization'];
    
    // Hiển thị thông báo đăng xuất thành công
    if (showNotification) {
      toast.success(`Đăng xuất thành công! Tạm biệt, ${userName}`);
    }
  };

  // Get auth header
  const getAuthHeader = () => {
    return user ? { Authorization: `Bearer ${user.token}` } : {};
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      loading, 
      isAuthenticated, 
      isAdmin,
      login, 
      logout, 
      updateUserData, 
      refreshToken,
      getAuthHeader 
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext; 
