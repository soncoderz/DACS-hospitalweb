import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';

const VerifyEmail = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { login } = useAuth();

  useEffect(() => {
    const verifyToken = async () => {
      // Lấy token từ URL query params
      const query = new URLSearchParams(location.search);
      const token = query.get('token');

      if (!token) {
        setError('Liên kết xác thực không hợp lệ');
        setLoading(false);
        return;
      }

      try {
        const response = await api.get(`/auth/verify-email/${token}`);
        
        if (response.data.success) {
          setSuccess(true);
          
          // Đăng nhập tự động nếu xác thực thành công
          if (response.data.token) {
            localStorage.setItem('token', response.data.token);
            // Đợi 2 giây trước khi redirect
            setTimeout(() => {
              login(response.data.token);
              navigate('/');
            }, 2000);
          }
        } else {
          setError(response.data.message || 'Xác thực không thành công');
        }
      } catch (error) {
        console.error('Verify email error:', error);
        
        if (error.response) {
          setError(error.response.data.message || 'Xác thực không thành công');
        } else if (error.request) {
          setError('Không thể kết nối đến máy chủ. Vui lòng kiểm tra kết nối mạng.');
        } else {
          setError('Đã xảy ra lỗi. Vui lòng thử lại sau.');
        }
      } finally {
        setLoading(false);
      }
    };

    verifyToken();
  }, [location, navigate, login]);

  return (
    <div className="auth-page">
      <div className="auth-container">
        <div className="auth-card">
          <div className="auth-header">
            <h1 className="auth-title">Xác Thực Email</h1>
          </div>
          
          {loading && (
            <div className="text-center my-5">
              <div className="spinner"></div>
              <p className="mt-3">Đang xác thực email của bạn...</p>
            </div>
          )}
          
          {error && !loading && (
            <div className="alert alert-danger">{error}</div>
          )}
          
          {success && !loading && (
            <div className="alert alert-success">
              Email của bạn đã được xác thực thành công! Bạn sẽ được chuyển hướng đến trang chủ sau vài giây.
            </div>
          )}
          
          {!loading && (
            <div className="auth-footer">
              <p>
                {success ? (
                  <Link to="/" className="auth-link">Đến trang chủ</Link>
                ) : (
                  <Link to="/login" className="auth-link">Đến trang đăng nhập</Link>
                )}
              </p>
            </div>
          )}
        </div>
        
        <div className="auth-info">
          <div className="info-content">
            <h2 className="info-title">Xác Thực Tài Khoản</h2>
            <ul className="info-list">
              <li>Xác thực email giúp bảo vệ tài khoản của bạn</li>
              <li>Sau khi xác thực, bạn có thể sử dụng đầy đủ các dịch vụ</li>
              <li>Chúng tôi không bao giờ yêu cầu mật khẩu qua email</li>
              <li>Liên kết xác thực chỉ có hiệu lực trong vòng 24 giờ</li>
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

export default VerifyEmail; 