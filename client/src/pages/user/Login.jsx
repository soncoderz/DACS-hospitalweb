import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../utils/api';
import { navigateByRole } from '../../utils/roleUtils';
import { toast } from 'react-toastify';
import { motion } from 'framer-motion';
import { 
  FaEye, FaEyeSlash, FaEnvelope, FaLock, 
  FaGoogle, FaFacebookF, FaUserPlus 
} from 'react-icons/fa';

const Login = ({ onRegisterClick }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from?.pathname || '/';
  const { login } = useAuth();
  
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    rememberMe: false
  });
  
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Handle form input changes
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  // Regular login handler
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const response = await api.post('/auth/login', {
        email: formData.email,
        password: formData.password,
        rememberMe: formData.rememberMe
      });
      
      if (response.data.success) {
        login(response.data.data, formData.rememberMe);
        toast.success(`Xin chào, ${response.data.data.fullName || 'bạn'}!`);
        navigateByRole(response.data.data, navigate, from);
      } else {
        toast.error(response.data.message || 'Đăng nhập không thành công');
      }
    } catch (error) {
      console.error('Login error:', error);
      
      if (error.response?.data?.needVerification) {
        toast.info('Email của bạn chưa được xác thực. Vui lòng kiểm tra hòm thư.');
        navigate('/need-verification', { 
          state: { email: formData.email } 
        });
        return;
      }
      
      toast.error(
        error.response?.data?.message || 
        'Đăng nhập không thành công. Vui lòng thử lại.'
      );
    } finally {
      setLoading(false);
    }
  };

  // Handle social login - removed notification
  const handleSocialLogin = (provider) => {
    sessionStorage.setItem('auth_redirect', from);
    window.location.href = `${import.meta.env.VITE_API_URL}/auth/${provider}`;
  };

  return (
    <div className="w-full">
      <motion.form 
        onSubmit={handleSubmit} 
        className="space-y-5"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.4 }}
      >
        {/* Email field */}
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1.5">
            Địa chỉ email
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
              {/* Fixed icon to prevent flickering and blurriness */}
              <FaEnvelope className="text-blue-500 h-4 w-4" style={{minWidth: '1rem'}} />
            </div>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              value={formData.email}
              onChange={handleChange}
              className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg bg-white shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="your.email@example.com"
            />
          </div>
        </div>

        {/* Password field */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label htmlFor="password" className="block text-sm font-medium text-gray-700">
              Mật khẩu
            </label>
            <Link to="/forgot-password" className="text-xs font-medium text-blue-600 hover:text-blue-500 hover:underline">
              Quên mật khẩu?
            </Link>
          </div>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
              {/* Fixed icon to prevent flickering and blurriness */}
              <FaLock className="text-blue-500 h-4 w-4" style={{minWidth: '1rem'}} />
            </div>
            <input
              id="password"
              name="password"
              type={showPassword ? 'text' : 'password'}
              autoComplete="current-password"
              required
              value={formData.password}
              onChange={handleChange}
              className="block w-full pl-10 pr-10 py-3 border border-gray-300 rounded-lg bg-white shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="••••••••"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-gray-500 hover:text-gray-700"
            >
              {showPassword ? (
                <FaEyeSlash className="h-4 w-4" style={{minWidth: '1rem'}} />
              ) : (
                <FaEye className="h-4 w-4" style={{minWidth: '1rem'}} />
              )}
            </button>
          </div>
        </div>

        {/* Remember me checkbox */}
        <div className="flex items-center">
          <input
            id="rememberMe"
            name="rememberMe"
            type="checkbox"
            checked={formData.rememberMe}
            onChange={handleChange}
            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
          />
          <label htmlFor="rememberMe" className="ml-2 block text-sm text-gray-700">
            Ghi nhớ đăng nhập
          </label>
        </div>

        {/* Submit button */}
        <button
          type="submit"
          disabled={loading}
          className="relative w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-200 overflow-hidden"
        >
          <span className="relative z-10 flex items-center">
            {loading && (
              <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            )}
            {loading ? 'Đang đăng nhập...' : 'Đăng nhập'}
          </span>
        </button>
      </motion.form>

      {/* Social login divider */}
      <div className="relative my-6">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-gray-200"></div>
        </div>
        <div className="relative flex justify-center text-sm">
          <span className="px-4 bg-white text-gray-500">hoặc tiếp tục với</span>
        </div>
      </div>

      {/* Social login buttons */}
      <div className="grid grid-cols-2 gap-3">
        {/* Google login */}
        <motion.button 
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          type="button" 
          onClick={() => handleSocialLogin('google')}
          className="group w-full flex items-center justify-center py-2.5 px-4 border border-gray-200 rounded-lg shadow-sm bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-200 transition-all"
        >
          <FaGoogle className="text-red-500 mr-2" style={{minWidth: '1rem'}} />
          Google
        </motion.button>

        {/* Facebook login */}
        <motion.button 
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          type="button" 
          onClick={() => handleSocialLogin('facebook')}
          className="group w-full flex items-center justify-center py-2.5 px-4 border border-transparent rounded-lg shadow-sm bg-[#1877F2] text-sm font-medium text-white hover:bg-[#166fe5] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#1877F2] transition-all"
        >
          <FaFacebookF className="mr-2" style={{minWidth: '1rem'}} />
          Facebook
        </motion.button>
      </div>

      {/* Sign up link */}
      <div className="mt-8 text-center">
        <motion.button 
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
          type="button" 
          onClick={onRegisterClick}
          className="inline-flex items-center font-medium text-blue-600 hover:text-blue-500 hover:underline focus:outline-none"
        >
          <FaUserPlus className="mr-1.5" style={{minWidth: '1rem'}} />
          <span>Chưa có tài khoản? Đăng ký ngay</span>
        </motion.button>
      </div>
    </div>
  );
};

export default Login; 
