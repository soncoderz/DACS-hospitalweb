import axios from 'axios';
import { toastWarning } from './toast';

const apiBaseURL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// Create a custom axios instance
const api = axios.create({
  baseURL: apiBaseURL,
  withCredentials: true, // Important for cookies with social authentication
  headers: {
    'Content-Type': 'application/json',
  }
});

// Add a request interceptor to attach auth token when available
api.interceptors.request.use(
  (config) => {
    // Skip attaching auth token for public endpoints
    if (config.headers['Skip-Auth'] === 'true') {
      delete config.headers.Authorization;
      delete config.headers['Skip-Auth'];
      return config;
    }
    
    // Get token from storage if it exists
    const userInfo = 
      JSON.parse(localStorage.getItem('userInfo')) || 
      JSON.parse(sessionStorage.getItem('userInfo'));
    
    if (userInfo && userInfo.token) {
      config.headers.Authorization = `Bearer ${userInfo.token}`;
    }
    
    // Log all requests for debugging during development
    console.log(`[API Request] ${config.method?.toUpperCase() || 'GET'} ${config.url}`, config);
    
    return config;
  },
  (error) => Promise.reject(error)
);

// Add a response interceptor to handle errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('API Error:', error.response || error.message);

    // Handle 401 Unauthorized errors but check specific cases
    if (error.response && error.response.status === 401) {
      // Nếu đang ở trang login thì không xử lý logout
      if (window.location.pathname === '/login') {
        // Không làm gì, để component login xử lý lỗi
        return Promise.reject(error);
      }
      
      // Nếu không phải ở trang login và có token (nghĩa là đã đăng nhập trước đó)
      const userInfo = JSON.parse(localStorage.getItem('userInfo')) || 
                      JSON.parse(sessionStorage.getItem('userInfo'));
      
      if (userInfo && userInfo.token) {
        console.log('Token đã hết hạn - Đang đăng xuất...');
        
        // Clear user data from storage
        localStorage.removeItem('userInfo');
        sessionStorage.removeItem('userInfo');
        
        // Show message to user
        toastWarning('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.');
        
        // Redirect to login page after a short delay
        setTimeout(() => {
          window.location.href = '/login';
        }, 1000);
      }
    }

    return Promise.reject(error);
  }
);

export default api; 