import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import { navigateByRole } from '../utils/roleUtils';

const Login = () => {
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
  const [errors, setErrors] = useState({});
  const [apiError, setApiError] = useState(null);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value
    });
    
    // Xóa lỗi khi người dùng nhập lại
    if (errors[name]) {
      setErrors({
        ...errors,
        [name]: null
      });
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.email.trim()) {
      newErrors.email = 'Vui lòng nhập email';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email không hợp lệ';
    }
    
    if (!formData.password) {
      newErrors.password = 'Vui lòng nhập mật khẩu';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setApiError(null);
    
    if (validateForm()) {
      setLoading(true);
      try {
        const response = await api.post('/auth/login', {
          email: formData.email,
          password: formData.password
        });
        
        if (response.data.success) {
          // Store user data in auth context
          login(response.data.data, formData.rememberMe);
          
          // Use utility function for role-based navigation
          navigateByRole(response.data.data, navigate, from);
        } else {
          setApiError(response.data.message || 'Đăng nhập không thành công');
        }
        
      } catch (error) {
        console.error('Login error:', error);
        
        if (error.response) {
          const { data } = error.response;
          
          // Kiểm tra nếu tài khoản chưa xác thực
          if (data.needVerification) {
            // Chuyển hướng đến trang yêu cầu xác thực với thông tin email
            navigate('/need-verification', { 
              state: { email: formData.email } 
            });
            return;
          }
          
          if (data.field) {
            // Lỗi field cụ thể
            setErrors({
              ...errors,
              [data.field]: data.message
            });
          } else {
            // Lỗi chung
            setApiError(data.message || 'Đăng nhập không thành công');
          }
        } else if (error.request) {
          setApiError('Không thể kết nối đến máy chủ. Vui lòng kiểm tra kết nối mạng.');
        } else {
          setApiError('Đăng nhập không thành công. Vui lòng thử lại sau.');
        }
      } finally {
        setLoading(false);
      }
    }
  };

  return (
    <div className="login-page">
      <div className="auth-container">
        <div className="auth-card">
          <div className="auth-header">
            <h1 className="auth-title">Đăng Nhập</h1>
            <p className="auth-subtitle">Đăng nhập để đặt lịch khám và xem hồ sơ sức khỏe</p>
          </div>

          {apiError && <div className="alert alert-danger">{apiError}</div>}

          <form className="auth-form" onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="email">Email</label>
              <input
                type="email"
                id="email"
                name="email"
                className={`form-control ${errors.email ? 'is-invalid' : ''}`}
                placeholder="Nhập địa chỉ email"
                value={formData.email}
                onChange={handleChange}
              />
              {errors.email && <div className="invalid-feedback">{errors.email}</div>}
            </div>

            <div className="form-group">
              <label htmlFor="password">Mật Khẩu</label>
              <input
                type="password"
                id="password"
                name="password"
                className={`form-control ${errors.password ? 'is-invalid' : ''}`}
                placeholder="Nhập mật khẩu"
                value={formData.password}
                onChange={handleChange}
              />
              {errors.password && <div className="invalid-feedback">{errors.password}</div>}
            </div>

            <div className="form-options">
              <div className="remember-me">
                <input
                  type="checkbox"
                  id="rememberMe"
                  name="rememberMe"
                  checked={formData.rememberMe}
                  onChange={handleChange}
                />
                <label htmlFor="rememberMe">Ghi nhớ đăng nhập</label>
              </div>
              <Link to="/forgot-password" className="forgot-password">Quên mật khẩu?</Link>
            </div>

            <button type="submit" className="btn btn-primary btn-block" disabled={loading}>
              {loading ? 'Đang xử lý...' : 'Đăng Nhập'}
            </button>
          </form>

          <div className="auth-divider">
            <span>Hoặc đăng nhập với</span>
          </div>

          <div className="social-auth">
            <button className="btn btn-social btn-google">
              <i className="social-icon google-icon"></i>
              Google
            </button>
            <button className="btn btn-social btn-facebook">
              <i className="social-icon facebook-icon"></i>
              Facebook
            </button>
          </div>

          <div className="auth-footer">
            <p>Chưa có tài khoản? <Link to="/register" className="auth-link">Đăng ký ngay</Link></p>
          </div>
        </div>

        <div className="auth-info">
          <div className="info-content">
            <h2 className="info-title">Lợi Ích Khi Đăng Nhập</h2>
            <ul className="info-list">
              <li>Đặt lịch khám dễ dàng và nhanh chóng</li>
              <li>Xem lịch sử khám bệnh và hồ sơ sức khỏe</li>
              <li>Nhận thông báo nhắc lịch khám</li>
              <li>Truy cập kết quả xét nghiệm trực tuyến</li>
              <li>Trao đổi với bác sĩ qua tin nhắn</li>
            </ul>
            <div className="auth-support">
              <h3>Cần hỗ trợ?</h3>
              <p>Gọi cho chúng tôi tại: <a href="tel:02838221234" className="support-phone">(028) 3822 1234</a></p>
              <p>Hoặc gửi email đến: <a href="mailto:support@benhvien.com" className="support-email">support@benhvien.com</a></p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login; 