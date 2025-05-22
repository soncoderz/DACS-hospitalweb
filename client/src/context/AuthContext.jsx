import React, { createContext, useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import api from '../utils/api'; // Import API instance với base URL

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [tokenRefreshing, setTokenRefreshing] = useState(false);
  const [sessionExpireNotified, setSessionExpireNotified] = useState(false);
  const isAuthenticated = !!user;
  const isAdmin = user && user.roleType === 'admin';

  // Hàm thông báo hết hạn phiên, đảm bảo chỉ hiển thị một lần
  const notifySessionExpired = () => {
    if (sessionExpireNotified) return; // Đã thông báo rồi, không hiển thị nữa
    
    toast.error('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.');
    setSessionExpireNotified(true);
    
    // Reset flag sau 5 giây để tránh hiển thị quá nhiều nếu người dùng tiếp tục dùng app
    setTimeout(() => {
      setSessionExpireNotified(false);
    }, 5000);
  };

  // Kiểm tra xem token có hết hạn không
  const isTokenExpired = (token) => {
    if (!token) return true;
    
    try {
      // Decode JWT token để kiểm tra thời gian hết hạn
      const base64Url = token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(atob(base64).split('').map((c) => {
        return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
      }).join(''));

      const { exp } = JSON.parse(jsonPayload);
      
      // Nếu thời gian hiện tại lớn hơn thời gian hết hạn của token
      // hoặc thời gian còn lại ít hơn 5 phút, coi như token đã hết hạn
      const currentTime = Date.now() / 1000;
      return !exp || currentTime > exp || (exp - currentTime < 300); // 300 giây = 5 phút
    } catch (e) {
      console.error("Invalid token format:", e);
      return true; // Nếu không parse được, coi như token đã hết hạn
    }
  };

  // Hàm làm mới token
  const refreshToken = async () => {
    if (tokenRefreshing) return null;
    
    try {
      setTokenRefreshing(true);
      
      // Kiểm tra xem có token hiện tại không
      const currentUser = user || 
        JSON.parse(localStorage.getItem('userInfo')) || 
        JSON.parse(sessionStorage.getItem('userInfo'));
      
      if (!currentUser || !currentUser.token) {
        console.warn('No token found to refresh');
        return null;
      }
      
      console.log('Refreshing token...');
      const response = await api.post('/auth/refresh-token', {
        token: currentUser.token,
        refreshToken: currentUser.refreshToken
      });
      
      if (response.data && response.data.success && response.data.token) {
        // Cập nhật thông tin người dùng với token mới
        const updatedUser = { 
          ...currentUser, 
          token: response.data.token,
          refreshToken: response.data.refreshToken || currentUser.refreshToken
        };
        
        // Lưu vào storage và cập nhật state
        const storageToUse = localStorage.getItem('userInfo') ? localStorage : sessionStorage;
        storageToUse.setItem('userInfo', JSON.stringify(updatedUser));
        setUser(updatedUser);
        
        // Cập nhật token cho axios
        axios.defaults.headers.common['Authorization'] = `Bearer ${updatedUser.token}`;
        
        console.log('Token refreshed successfully');
        return updatedUser.token;
      } else {
        console.warn('Failed to refresh token:', response.data);
        return null;
      }
    } catch (error) {
      console.error('Error refreshing token:', error);
      return null;
    } finally {
      setTokenRefreshing(false);
    }
  };
  
  // Thiết lập interceptor cho axios để xử lý token hết hạn
  useEffect(() => {
    const setupAxiosInterceptors = () => {
      axios.interceptors.request.use(
        async (config) => {
          // Kiểm tra và làm mới token trước mỗi request nếu cần
          if (user && user.token && isTokenExpired(user.token)) {
            console.log('Token expired, attempting to refresh');
            const newToken = await refreshToken();
            if (newToken) {
              config.headers.Authorization = `Bearer ${newToken}`;
            } else {
              // Nếu không làm mới được token, đăng xuất người dùng
              console.warn('Could not refresh token, logging out');
              logout(false); // False để không hiển thị thông báo
              notifySessionExpired();
            }
          }
          return config;
        },
        (error) => Promise.reject(error)
      );

      // Xử lý lỗi 401 (Unauthorized) từ response
      axios.interceptors.response.use(
        (response) => response,
        async (error) => {
          const originalRequest = error.config;
          
          // Nếu lỗi 401 và chưa thử làm mới token
          if (error.response && error.response.status === 401 && !originalRequest._retry) {
            originalRequest._retry = true;
            
            try {
              const newToken = await refreshToken();
              if (newToken) {
                // Cập nhật header và thử lại request
                originalRequest.headers.Authorization = `Bearer ${newToken}`;
                return axios(originalRequest);
              } else {
                // Nếu không làm mới được token, đăng xuất người dùng
                console.warn('Could not refresh token on 401, logging out');
                logout(false); // False để không hiển thị thông báo
                notifySessionExpired();
              }
            } catch (refreshError) {
              console.error('Error refreshing token on 401:', refreshError);
              logout(false); // Đăng xuất trong trường hợp lỗi
              notifySessionExpired();
            }
          }
          
          return Promise.reject(error);
        }
      );
    };
    
    setupAxiosInterceptors();
  }, [user]);

  useEffect(() => {
    const initializeAuth = async () => {
      try {
        // Check for user in localStorage or sessionStorage
        const userFromStorage = 
          JSON.parse(localStorage.getItem('userInfo')) || 
          JSON.parse(sessionStorage.getItem('userInfo'));
        
        if (userFromStorage) {
          console.log('User from storage:', userFromStorage); // Debug
          
          // Kiểm tra token hết hạn
          if (isTokenExpired(userFromStorage.token)) {
            console.log('Stored token is expired, attempting to refresh');
            
            // Thử làm mới token
            const newToken = await refreshToken();
            
            if (newToken) {
              // Token đã được làm mới trong hàm refreshToken
              console.log('Token refreshed during initialization');
            } else {
              // Token không thể làm mới, đăng xuất
              console.warn('Could not refresh token during initialization');
              logout(false); // False để không hiển thị thông báo
              toast.info('Vui lòng đăng nhập để tiếp tục'); // Thông báo nhẹ nhàng hơn khi khởi động
            }
          } else {
            // Token còn hạn, sử dụng
            setUser(userFromStorage);
            // Set axios default header for future requests
            axios.defaults.headers.common['Authorization'] = `Bearer ${userFromStorage.token}`;
          }
        }
      } catch (error) {
        console.error('Error during auth initialization:', error);
      } finally {
        setLoading(false);
      }
    };
    
    initializeAuth();
  }, []);

  // Login handler
  const login = (userData, rememberMe = false, showNotification = false) => {
    console.log('Login userData:', userData); // Kiểm tra dữ liệu người dùng
    console.log('User role:', userData.role);
    console.log('User roleType:', userData.roleType);
    
    // Debug avatar data
    console.log('Avatar data present:', !!userData.avatarData); 
    console.log('Avatar URL present:', !!userData.avatarUrl);

    // Kiểm tra xem có token không
    if (!userData.token) {
      console.warn('No token provided during login');
      toast.error('Lỗi xác thực: Thiếu token đăng nhập');
      return null;
    }

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
      role: userData.role || currentUser.role || 'user',
      token: userData.token || currentUser.token,
      refreshToken: userData.refreshToken || currentUser.refreshToken
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
    
    // Hiển thị thông báo đăng xuất thành công nếu yêu cầu
    if (showNotification) {
      toast.success(`Đăng xuất thành công! Tạm biệt, ${userName}`);
    }
  };

  // Get auth header
  const getAuthHeader = () => {
    return user ? { Authorization: `Bearer ${user.token}` } : {};
  };

  // Kiểm tra token hiện tại và làm mới nếu cần
  const checkAndRefreshToken = async () => {
    if (user && user.token && isTokenExpired(user.token)) {
      console.log('Token check requested: Token is expired, refreshing');
      return await refreshToken();
    }
    console.log('Token check requested: Token is still valid');
    return user?.token || null;
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
      getAuthHeader,
      refreshToken,
      checkAndRefreshToken,
      isTokenExpired
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext; 
