import React, { useState } from 'react';
import { Link } from 'react-router-dom';

const Login = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    rememberMe: false
  });

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    // Here would be the login logic - For now just console log the data
    console.log('Login Attempt:', formData);
    // Add authentication logic here later
  };

  return (
    <div className="login-page">
      <div className="auth-container">
        <div className="auth-card">
          <div className="auth-header">
            <h1 className="auth-title">Đăng Nhập</h1>
            <p className="auth-subtitle">Đăng nhập để đặt lịch khám và xem hồ sơ sức khỏe</p>
          </div>

          <form className="auth-form" onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="email">Email</label>
              <input
                type="email"
                id="email"
                name="email"
                className="form-control"
                placeholder="Nhập địa chỉ email"
                value={formData.email}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="password">Mật Khẩu</label>
              <input
                type="password"
                id="password"
                name="password"
                className="form-control"
                placeholder="Nhập mật khẩu"
                value={formData.password}
                onChange={handleChange}
                required
              />
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

            <button type="submit" className="btn btn-primary btn-block">Đăng Nhập</button>
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