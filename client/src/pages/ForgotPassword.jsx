import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../utils/api';

const ForgotPassword = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate email format
    if (!email.trim()) {
      setError('Vui lòng nhập địa chỉ email');
      return;
    }
    
    if (!/\S+@\S+\.\S+/.test(email)) {
      setError('Email không hợp lệ');
      return;
    }
    
    setError('');
    setLoading(true);
    
    try {
      const response = await api.post('/auth/forgot-password', { email });
      
      if (response.data.success) {
        setSuccess(true);
        // Navigate to OTP verification page with email
        setTimeout(() => {
          navigate('/otp-verification', { state: { email } });
        }, 2000);
      } else {
        setError(response.data.message || 'Có lỗi xảy ra. Vui lòng thử lại sau.');
      }
    } catch (error) {
      console.error('Forgot password error:', error);
      
      if (error.response) {
        setError(error.response.data.message || 'Có lỗi xảy ra. Vui lòng thử lại sau.');
      } else if (error.request) {
        setError('Không thể kết nối đến máy chủ. Vui lòng kiểm tra kết nối mạng.');
      } else {
        setError('Đã xảy ra lỗi. Vui lòng thử lại sau.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-container">
        <div className="auth-card">
          <div className="auth-header">
            <h1 className="auth-title">Quên Mật Khẩu</h1>
            <p className="auth-subtitle">Nhập email của bạn để nhận mã xác nhận</p>
          </div>

          {error && <div className="alert alert-danger">{error}</div>}
          {success && (
            <div className="alert alert-success">
              Mã OTP đã được gửi đến email của bạn. Đang chuyển hướng...
            </div>
          )}

          <form className="auth-form" onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="email">Email</label>
              <input
                type="email"
                id="email"
                className={`form-control ${error ? 'is-invalid' : ''}`}
                placeholder="Nhập địa chỉ email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={loading || success}
              />
            </div>

            <button 
              type="submit" 
              className="btn btn-primary btn-block" 
              disabled={loading || success}
            >
              {loading ? 'Đang xử lý...' : 'Gửi Mã Xác Nhận'}
            </button>
          </form>

          <div className="auth-footer">
            <p>
              <Link to="/login" className="auth-link">Quay lại đăng nhập</Link>
            </p>
          </div>
        </div>

        <div className="auth-info">
          <div className="info-content">
            <h2 className="info-title">Hướng Dẫn Đặt Lại Mật Khẩu</h2>
            <ul className="info-list">
              <li>Nhập email đã đăng ký của bạn</li>
              <li>Mã OTP 4 chữ số sẽ được gửi đến email</li>
              <li>Nhập mã OTP để xác thực</li>
              <li>Đặt lại mật khẩu mới</li>
              <li>Mã OTP chỉ có hiệu lực trong vòng 2 phút</li>
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

export default ForgotPassword; 