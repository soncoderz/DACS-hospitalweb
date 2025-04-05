import axios from 'axios';

// Create an axios instance with the base URL from environment variables
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add a request interceptor to include authorization token
api.interceptors.request.use(
  (config) => {
    // Lấy token từ thông tin người dùng đã lưu
    const userInfo = JSON.parse(localStorage.getItem('userInfo')) || 
                     JSON.parse(sessionStorage.getItem('userInfo'));
    
    // Nếu có thông tin người dùng và token
    if (userInfo && userInfo.token) {
      config.headers.Authorization = `Bearer ${userInfo.token}`;
      // Debug thông tin request
      console.log(`API Request to ${config.url} with auth token`);
    } else {
      console.log(`API Request to ${config.url} without auth token`);
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add a response interceptor to log responses
api.interceptors.response.use(
  (response) => {
    console.log(`API Response from ${response.config.url} status: ${response.status}`);
    return response;
  },
  (error) => {
    console.error(`API Error:`, error.response || error.message);
    return Promise.reject(error);
  }
);

export default api; 