import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';

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
        
        // Auto login user with new credentials
        login({ email, token: response.data.token });
        
        // Redirect to home page after 2 seconds
        setTimeout(() => {
          navigate('/', { replace: true });
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
    return <div className="loading">Đang tải...</div>;
  }
  
  return (
    <div className="auth-page">
      <div className="auth-container">
        <div className="auth-card">
          <div className="auth-header">
            <h1 className="auth-title">Đặt Lại Mật Khẩu</h1>
            <p className="auth-subtitle">Tạo mật khẩu mới cho tài khoản của bạn</p>
          </div>
          
          {errors.general && (
            <div className="alert alert-danger">{errors.general}</div>
          )}
          
          {success && (
            <div className="alert alert-success">
              Đặt lại mật khẩu thành công! Đang đăng nhập...
            </div>
          )}
          
          <form className="auth-form" onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="password">Mật Khẩu Mới</label>
              <div className="password-input-container">
                <input
                  type={passwordVisibility.password ? "text" : "password"}
                  id="password"
                  name="password"
                  className={`form-control ${errors.password ? 'is-invalid' : ''}`}
                  placeholder="Nhập mật khẩu mới"
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
                  placeholder="Nhập lại mật khẩu mới"
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
              {loading ? 'Đang xử lý...' : 'Đặt Lại Mật Khẩu'}
            </button>
          </form>
          
          {!success && (
            <div className="auth-footer">
              <p>
                <Link to="/login" className="auth-link">Quay lại đăng nhập</Link>
              </p>
            </div>
          )}
        </div>
        
        <div className="auth-info">
          <div className="info-content">
            <h2 className="info-title">Hướng Dẫn Tạo Mật Khẩu An Toàn</h2>
            <ul className="info-list">
              <li>Sử dụng ít nhất 6 ký tự</li>
              <li>Kết hợp chữ cái viết hoa và viết thường</li>
              <li>Thêm số và ký tự đặc biệt</li>
              <li>Tránh sử dụng thông tin cá nhân dễ đoán</li>
              <li>Không sử dụng cùng mật khẩu cho nhiều dịch vụ</li>
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

export default ResetPassword; 