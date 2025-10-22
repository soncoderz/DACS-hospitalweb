import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../utils/api';
import { FaEye, FaEyeSlash, FaExclamationCircle, FaCheckCircle, FaLock } from 'react-icons/fa';

const ResetPassword = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();
  
  const email = location.state?.email;
  const resetToken = location.state?.resetToken;
  
  const [formData, setFormData] = useState({
    password: '',
    confirmPassword: ''
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [success, setSuccess] = useState(false);
  const [passwordVisibility, setPasswordVisibility] = useState({
    password: false,
    confirmPassword: false
  });
  
  const togglePasswordVisibility = (field) => {
    setPasswordVisibility(prev => ({
      ...prev,
      [field]: !prev[field]
    }));
  };
  
  // Redirect if no token or email is provided
  useEffect(() => {
    if (!resetToken || !email) {
      navigate('/forgot-password', { replace: true });
    }
  }, [resetToken, email, navigate]);
  
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
    
    // Clear error when user types
    if (errors[name]) {
      setErrors({
        ...errors,
        [name]: null
      });
    }
  };
  
  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.password) {
      newErrors.password = 'Vui lòng nhập mật khẩu mới';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Mật khẩu phải có ít nhất 6 ký tự';
    }
    
    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Vui lòng xác nhận mật khẩu';
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Mật khẩu xác nhận không khớp';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    setLoading(true);
    
    try {
      const response = await api.post('/auth/reset-password', {
        resetToken,
        password: formData.password
      });
      
      if (response.data.success) {
        setSuccess(true);
        
        // Chuyển hướng đến trang đăng nhập sau 2 giây
        setTimeout(() => {
          navigate('/login', { 
            replace: true,
            state: { 
              email: email,
              message: 'Đặt lại mật khẩu thành công! Vui lòng đăng nhập với mật khẩu mới của bạn.'
            }
          });
        }, 2000);
      } else {
        setErrors({
          general: response.data.message || 'Đã xảy ra lỗi. Vui lòng thử lại sau.'
        });
      }
    } catch (error) {
      console.error('Reset password error:', error);
      
      if (error.response) {
        if (error.response.data.field === 'password') {
          setErrors({
            password: error.response.data.message
          });
        } else {
          setErrors({
            general: error.response.data.message || 'Đã xảy ra lỗi. Vui lòng thử lại sau.'
          });
        }
      } else if (error.request) {
        setErrors({
          general: 'Không thể kết nối đến máy chủ. Vui lòng kiểm tra kết nối mạng.'
        });
      } else {
        setErrors({
          general: 'Đã xảy ra lỗi. Vui lòng thử lại sau.'
        });
      }
    } finally {
      setLoading(false);
    }
  };
  
  // If no token/email, show loading until redirect happens
  if (!resetToken || !email) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex flex-col items-center">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
          <p className="mt-4 text-gray-600">Đang tải...</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl w-full flex flex-col md:flex-row bg-white rounded-xl shadow-lg overflow-hidden">
        {/* Form Section */}
        <div className="w-full md:w-1/2 p-8">
          <div className="text-center mb-6">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 text-primary mb-3">
              <FaLock className="text-3xl" />
            </div>
            <h1 className="text-2xl font-bold text-gray-800">Đặt Lại Mật Khẩu</h1>
            <p className="text-gray-600 mt-2">Tạo mật khẩu mới cho tài khoản của bạn</p>
          </div>
          
          {errors.general && (
            <div className="mb-4 bg-red-50 border-l-4 border-red-500 p-4 rounded-lg flex">
              <FaExclamationCircle className="text-red-500 mr-2 mt-0.5 flex-shrink-0" />
              <p className="text-red-700">{errors.general}</p>
            </div>
          )}
          
          {success && (
            <div className="mb-4 bg-green-50 border-l-4 border-green-500 p-4 rounded-lg flex">
              <FaCheckCircle className="text-green-500 mr-2 mt-0.5 flex-shrink-0" />
              <p className="text-green-700">Đặt lại mật khẩu thành công! Đang chuyển hướng...</p>
            </div>
          )}
          
          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <label htmlFor="password" className="block text-gray-700 font-medium mb-2">Mật Khẩu Mới</label>
              <div className="relative">
                <input
                  type={passwordVisibility.password ? "text" : "password"}
                  id="password"
                  name="password"
                  className={`w-full pl-4 pr-10 py-2 border rounded-lg focus:ring-2 focus:ring-primary focus:outline-none ${
                    errors.password ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="Nhập mật khẩu mới"
                  value={formData.password}
                  onChange={handleChange}
                  disabled={loading || success}
                />
                <button 
                  type="button" 
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                  onClick={() => togglePasswordVisibility('password')}
                  disabled={loading || success}
                >
                  {passwordVisibility.password ? <FaEyeSlash /> : <FaEye />}
                </button>
              </div>
              {errors.password && (
                <p className="mt-1 text-sm text-red-600">{errors.password}</p>
              )}
              <p className="mt-1 text-xs text-gray-500">Mật khẩu phải có ít nhất 6 ký tự</p>
            </div>
            
            <div className="mb-6">
              <label htmlFor="confirmPassword" className="block text-gray-700 font-medium mb-2">Xác Nhận Mật Khẩu</label>
              <div className="relative">
                <input
                  type={passwordVisibility.confirmPassword ? "text" : "password"}
                  id="confirmPassword"
                  name="confirmPassword"
                  className={`w-full pl-4 pr-10 py-2 border rounded-lg focus:ring-2 focus:ring-primary focus:outline-none ${
                    errors.confirmPassword ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="Nhập lại mật khẩu mới"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  disabled={loading || success}
                />
                <button 
                  type="button" 
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                  onClick={() => togglePasswordVisibility('confirmPassword')}
                  disabled={loading || success}
                >
                  {passwordVisibility.confirmPassword ? <FaEyeSlash /> : <FaEye />}
                </button>
              </div>
              {errors.confirmPassword && (
                <p className="mt-1 text-sm text-red-600">{errors.confirmPassword}</p>
              )}
            </div>
            
            <button
              type="submit"
              className={`w-full py-2 px-4 rounded-lg font-medium ${
                loading || success
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-primary text-white hover:bg-primary-dark transition-colors'
              }`}
              disabled={loading || success}
            >
              {loading ? 'Đang xử lý...' : 'Đặt Lại Mật Khẩu'}
            </button>
            
            {!success && (
              <div className="text-center mt-4">
                <Link to="/login" className="text-primary hover:underline">
                  Quay lại đăng nhập
                </Link>
              </div>
            )}
          </form>
        </div>
        
        {/* Info Section */}
        <div className="hidden md:block w-1/2 bg-gradient-to-r from-primary to-primary-dark text-white p-8">
          <div className="h-full flex flex-col">
            <h2 className="text-xl font-bold mb-6">Hướng Dẫn Tạo Mật Khẩu An Toàn</h2>
            <ul className="space-y-3 text-white/90 mb-8">
              <li className="flex items-start">
                <span className="inline-flex items-center justify-center h-6 w-6 rounded-full bg-white/20 text-white text-sm mr-3 flex-shrink-0">1</span>
                <span>Sử dụng ít nhất 6 ký tự</span>
              </li>
              <li className="flex items-start">
                <span className="inline-flex items-center justify-center h-6 w-6 rounded-full bg-white/20 text-white text-sm mr-3 flex-shrink-0">2</span>
                <span>Kết hợp chữ cái viết hoa và viết thường</span>
              </li>
              <li className="flex items-start">
                <span className="inline-flex items-center justify-center h-6 w-6 rounded-full bg-white/20 text-white text-sm mr-3 flex-shrink-0">3</span>
                <span>Thêm số và ký tự đặc biệt</span>
              </li>
              <li className="flex items-start">
                <span className="inline-flex items-center justify-center h-6 w-6 rounded-full bg-white/20 text-white text-sm mr-3 flex-shrink-0">4</span>
                <span>Tránh sử dụng thông tin cá nhân dễ đoán</span>
              </li>
              <li className="flex items-start">
                <span className="inline-flex items-center justify-center h-6 w-6 rounded-full bg-white/20 text-white text-sm mr-3 flex-shrink-0">5</span>
                <span>Không sử dụng cùng mật khẩu cho nhiều dịch vụ</span>
              </li>
            </ul>
            
            <div className="mt-auto">
              <h3 className="font-semibold text-lg mb-2">Cần hỗ trợ?</h3>
              <p>Gọi cho chúng tôi tại: <a href="tel:02838221234" className="text-white underline">(028) 3822 1234</a></p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResetPassword; 
