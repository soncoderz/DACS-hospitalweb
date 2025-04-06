import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import { toastSuccess, toastError } from '../utils/toast';

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
  
  // Loading state if user is undefined
  if (!user) {
    return <div className="loading">Đang tải...</div>;
  }
  
  return (
    <div className="auth-page">
      <div className="auth-container">
        <div className="auth-card">
          <div className="auth-header">
            <h1 className="auth-title">Đặt Mật Khẩu</h1>
            <p className="auth-subtitle">
              Đặt mật khẩu cho tài khoản {getAccountProvider()} của bạn để đăng nhập dễ dàng hơn trong tương lai
            </p>
          </div>
          
          {errors.general && (
            <div className="alert alert-danger">{errors.general}</div>
          )}
          
          {success && (
            <div className="alert alert-success">
              Đặt mật khẩu thành công! Đang chuyển hướng...
            </div>
          )}
          
          <form className="auth-form" onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="password">Mật Khẩu</label>
              <div className="password-input-container">
                <input
                  type={passwordVisibility.password ? "text" : "password"}
                  id="password"
                  name="password"
                  className={`form-control ${errors.password ? 'is-invalid' : ''}`}
                  placeholder="Nhập mật khẩu"
                  value={formData.password}
                  onChange={handleChange}
                  disabled={loading || success}
                />
                <button 
                  type="button" 
                  className="password-toggle-btn"
                  onClick={() => togglePasswordVisibility('password')}
                  disabled={loading || success}
                >
                  <i className={`fas fa-${passwordVisibility.password ? 'eye-slash' : 'eye'}`}></i>
                </button>
              </div>
              {errors.password && (
                <div className="invalid-feedback">{errors.password}</div>
              )}
              <small className="form-text text-muted">Mật khẩu phải có ít nhất 6 ký tự</small>
            </div>
            
            <div className="form-group">
              <label htmlFor="confirmPassword">Xác Nhận Mật Khẩu</label>
              <div className="password-input-container">
                <input
                  type={passwordVisibility.confirmPassword ? "text" : "password"}
                  id="confirmPassword"
                  name="confirmPassword"
                  className={`form-control ${errors.confirmPassword ? 'is-invalid' : ''}`}
                  placeholder="Nhập lại mật khẩu"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  disabled={loading || success}
                />
                <button 
                  type="button" 
                  className="password-toggle-btn"
                  onClick={() => togglePasswordVisibility('confirmPassword')}
                  disabled={loading || success}
                >
                  <i className={`fas fa-${passwordVisibility.confirmPassword ? 'eye-slash' : 'eye'}`}></i>
                </button>
              </div>
              {errors.confirmPassword && (
                <div className="invalid-feedback">{errors.confirmPassword}</div>
              )}
            </div>
            
            <button
              type="submit"
              className="btn btn-primary btn-block"
              disabled={loading || success}
            >
              {loading ? 'Đang xử lý...' : 'Đặt Mật Khẩu'}
            </button>
            
            <div className="skip-password">
              <Link to="/" className="skip-link">
                Bỏ qua, tôi sẽ đặt mật khẩu sau
              </Link>
            </div>
          </form>
        </div>
        
        <div className="auth-info">
          <div className="info-content">
            <h2 className="info-title">Tại sao cần đặt mật khẩu?</h2>
            <ul className="info-list">
              <li>Giúp bạn đăng nhập dễ dàng ngay cả khi không có kết nối internet đến Google hoặc Facebook</li>
              <li>Cho phép sử dụng đăng nhập bằng email và mật khẩu thông thường</li>
              <li>Bảo vệ tài khoản của bạn tốt hơn với lớp bảo mật bổ sung</li>
              <li>Giúp khôi phục tài khoản trong trường hợp gặp vấn đề với tài khoản mạng xã hội</li>
            </ul>
            <div className="auth-support">
              <h3>Cần hỗ trợ?</h3>
              <p>Gọi cho chúng tôi tại: <a href="tel:02838221234" className="support-phone">(028) 3822 1234</a></p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SetSocialPassword; 