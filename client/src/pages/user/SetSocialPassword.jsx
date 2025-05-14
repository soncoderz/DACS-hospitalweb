import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../utils/api';
import { toastSuccess, toastError } from '../../utils/toast';
import { FaGoogle, FaFacebook, FaLock, FaEye, FaEyeSlash, FaExclamationCircle, FaCheckCircle } from 'react-icons/fa';

const SetSocialPassword = () => {
  const navigate = useNavigate();
  const { user, updateUserData } = useAuth();
  
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
  
  // Nếu không có user hoặc user không cần đặt mật khẩu, chuyển hướng về trang chủ
  useEffect(() => {
    if (!user) {
      navigate('/login', { replace: true });
      return;
    }
    
    // Kiểm tra nếu người dùng đã có mật khẩu, chuyển hướng về trang chủ
    if (user.passwordHash) {
      navigate('/', { replace: true });
    }
    
    // Debug thông tin user để xác định loại tài khoản
    console.log('User data in SetSocialPassword:', {
      authProvider: user.authProvider,
      googleId: !!user.googleId,
      facebookId: !!user.facebookId
    });
  }, [user, navigate]);
  
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
      newErrors.password = 'Vui lòng nhập mật khẩu';
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
      const response = await api.post('/auth/set-social-password', {
        password: formData.password
      });
      
      if (response.data.success) {
        setSuccess(true);
        toastSuccess('Đặt mật khẩu thành công!');
        
        // Cập nhật thông tin người dùng trong context, đánh dấu đã có mật khẩu
        updateUserData({ 
          ...user, 
          needPassword: false 
        });
        
        // Chuyển hướng về trang chủ sau 2 giây
        setTimeout(() => {
          navigate('/', { replace: true });
        }, 2000);
      } else {
        setErrors({
          general: response.data.message || 'Đã xảy ra lỗi. Vui lòng thử lại sau.'
        });
        toastError(response.data.message || 'Đã xảy ra lỗi khi đặt mật khẩu');
      }
    } catch (error) {
      console.error('Set social password error:', error);
      
      if (error.response) {
        if (error.response.data.field === 'password') {
          setErrors({
            password: error.response.data.message
          });
          toastError(error.response.data.message);
        } else {
          setErrors({
            general: error.response.data.message || 'Đã xảy ra lỗi. Vui lòng thử lại sau.'
          });
          toastError(error.response.data.message || 'Đã xảy ra lỗi khi đặt mật khẩu');
        }
      } else if (error.request) {
        setErrors({
          general: 'Không thể kết nối đến máy chủ. Vui lòng kiểm tra kết nối mạng.'
        });
        toastError('Không thể kết nối đến máy chủ. Vui lòng kiểm tra kết nối mạng.');
      } else {
        setErrors({
          general: 'Đã xảy ra lỗi. Vui lòng thử lại sau.'
        });
        toastError('Đã xảy ra lỗi. Vui lòng thử lại sau.');
      }
    } finally {
      setLoading(false);
    }
  };
  
  // Determine account provider
  const getAccountProvider = () => {
    if (!user) return '';
    
    // Kiểm tra authProvider trước
    if (user.authProvider === 'google') return 'Google';
    if (user.authProvider === 'facebook') return 'Facebook';
    
    // Kiểm tra ID của Google và Facebook
    if (user.googleId) return 'Google';
    if (user.facebookId) return 'Facebook';
    
    // Nếu không xác định được, trả về giá trị mặc định
    return 'mạng xã hội';
  };

  // Get provider icon
  const getProviderIcon = () => {
    const provider = getAccountProvider().toLowerCase();
    if (provider === 'google') return <FaGoogle className="text-3xl" />;
    if (provider === 'facebook') return <FaFacebook className="text-3xl" />;
    return <FaLock className="text-3xl" />;
  }
  
  // Get provider color
  const getProviderColor = () => {
    const provider = getAccountProvider().toLowerCase();
    if (provider === 'google') return 'bg-red-100 text-red-500';
    if (provider === 'facebook') return 'bg-blue-100 text-blue-500';
    return 'bg-primary/10 text-primary';
  }
  
  // Loading state if user is undefined
  if (!user) {
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
            <div className={`inline-flex items-center justify-center w-16 h-16 rounded-full mb-3 ${getProviderColor()}`}>
              {getProviderIcon()}
            </div>
            <h1 className="text-2xl font-bold text-gray-800">Đặt Mật Khẩu</h1>
            <p className="text-gray-600 mt-2">
              Đặt mật khẩu cho tài khoản {getAccountProvider()} của bạn để đăng nhập dễ dàng hơn trong tương lai
            </p>
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
              <p className="text-green-700">Đặt mật khẩu thành công! Đang chuyển hướng...</p>
            </div>
          )}
          
          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <label htmlFor="password" className="block text-gray-700 font-medium mb-2">Mật Khẩu</label>
              <div className="relative">
                <input
                  type={passwordVisibility.password ? "text" : "password"}
                  id="password"
                  name="password"
                  className={`w-full pl-4 pr-10 py-2 border rounded-lg focus:ring-2 focus:ring-primary focus:outline-none ${
                    errors.password ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="Nhập mật khẩu"
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
                  placeholder="Nhập lại mật khẩu"
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
              {loading ? 'Đang xử lý...' : 'Đặt Mật Khẩu'}
            </button>
            
            <div className="text-center mt-4">
              <Link to="/" className="text-primary hover:underline">
                Bỏ qua, tôi sẽ đặt mật khẩu sau
              </Link>
            </div>
          </form>
        </div>
        
        {/* Info Section */}
        <div className="hidden md:block w-1/2 bg-gradient-to-r from-primary to-primary-dark text-white p-8">
          <div className="h-full flex flex-col">
            <h2 className="text-xl font-bold mb-6">Tại sao cần đặt mật khẩu?</h2>
            <ul className="space-y-3 text-white/90 mb-8">
              <li className="flex items-start">
                <span className="inline-flex items-center justify-center h-6 w-6 rounded-full bg-white/20 text-white text-sm mr-3 flex-shrink-0">1</span>
                <span>Giúp bạn đăng nhập dễ dàng ngay cả khi không có kết nối internet đến Google hoặc Facebook</span>
              </li>
              <li className="flex items-start">
                <span className="inline-flex items-center justify-center h-6 w-6 rounded-full bg-white/20 text-white text-sm mr-3 flex-shrink-0">2</span>
                <span>Cho phép sử dụng đăng nhập bằng email và mật khẩu thông thường</span>
              </li>
              <li className="flex items-start">
                <span className="inline-flex items-center justify-center h-6 w-6 rounded-full bg-white/20 text-white text-sm mr-3 flex-shrink-0">3</span>
                <span>Bảo vệ tài khoản của bạn tốt hơn với lớp bảo mật bổ sung</span>
              </li>
              <li className="flex items-start">
                <span className="inline-flex items-center justify-center h-6 w-6 rounded-full bg-white/20 text-white text-sm mr-3 flex-shrink-0">4</span>
                <span>Giúp khôi phục tài khoản trong trường hợp gặp vấn đề với tài khoản mạng xã hội</span>
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

export default SetSocialPassword; 
