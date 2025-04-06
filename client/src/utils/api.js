import axios from 'axios';

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
    // Get token from storage if it exists
    const userInfo = 
      JSON.parse(localStorage.getItem('userInfo')) || 
      JSON.parse(sessionStorage.getItem('userInfo'));
    
    if (userInfo && userInfo.token) {
      config.headers.Authorization = `Bearer ${userInfo.token}`;
    }
    
    return config;
  },
  (error) => Promise.reject(error)
);

// Add a response interceptor to handle errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Add global error handling here
    console.error('API Error:', error.response || error.message);

    // Handle 401 Unauthorized errors (token expired)
    if (error.response && error.response.status === 401) {
      // You can add logic here to refresh token or redirect to login
      console.log('Unauthorized request - token may be expired');
    }

    return Promise.reject(error);
  }
);

export default api; 