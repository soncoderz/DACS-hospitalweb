import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import api from '../utils/api';

const NeedVerification = () => {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const location = useLocation();
  const email = location.state?.email;

  const handleResendVerification = async () => {
    if (!email) {
      setError('Không có thông tin email. Vui lòng đăng nhập lại.');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess(false);

    try {
      const response = await api.post('/auth/resend-verification', { email });
      
      if (response.data.success) {
        setSuccess(true);
      } else {
        setError(response.data.message || 'Không thể gửi lại email xác thực. Vui lòng thử lại sau.');
      }
    } catch (error) {
      console.error('Resend verification error:', error);
      
      if (error.response) {
        setError(error.response.data.message || 'Không thể gửi lại email xác thực. Vui lòng thử lại sau.');
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
            <h1 className="auth-title">Xác Thực Tài Khoản</h1>
            <p className="auth-subtitle">
              Vui lòng xác thực tài khoản của bạn để tiếp tục sử dụng dịch vụ
            </p>
          </div>
          
          {error && <div className="alert alert-danger">{error}</div>}
          {success && (
            <div className="alert alert-success">
              Email xác thực đã được gửi lại thành công. Vui lòng kiểm tra hộp thư của bạn.
            </div>
          )}
          
          <div className="verification-info">
            <p>
              Chúng tôi đã gửi một email xác thực đến <strong>{email || 'địa chỉ email của bạn'}</strong>. 
              Vui lòng kiểm tra hộp thư và nhấp vào liên kết xác thực để hoàn tất quá trình đăng ký.
            </p>
            
            <div className="verification-steps">
              <h3>Các bước xác thực tài khoản:</h3>
              <ol>
                <li>Kiểm tra hộp thư đến và thư rác trong email của bạn</li>
                <li>Mở email từ "Hệ thống Bệnh viện"</li>
                <li>Nhấp vào nút "Xác nhận tài khoản" trong email</li>
                <li>Đăng nhập lại vào hệ thống sau khi xác thực thành công</li>
              </ol>
            </div>
            
            <p className="mt-4">
              Nếu bạn không nhận được email xác thực, vui lòng kiểm tra thư mục spam 
              hoặc nhấp vào nút bên dưới để gửi lại.
            </p>
          </div>
          
          <button 
            className="btn btn-primary btn-block mt-3" 
            onClick={handleResendVerification}
            disabled={loading || !email}
          >
            {loading ? 'Đang gửi...' : 'Gửi lại email xác thực'}
          </button>
          
          <div className="auth-footer mt-4">
            <p>
              <Link to="/login" className="auth-link">Quay lại đăng nhập</Link>
            </p>
          </div>
        </div>
        
        <div className="auth-info">
          <div className="info-content">
            <h2 className="info-title">Tại sao cần xác thực?</h2>
            <ul className="info-list">
              <li>Đảm bảo email của bạn hợp lệ và hoạt động</li>
              <li>Bảo vệ tài khoản của bạn khỏi việc sử dụng trái phép</li>
              <li>Cho phép bạn nhận thông báo quan trọng về lịch hẹn và dịch vụ</li>
              <li>Cung cấp quyền truy cập đầy đủ vào tất cả tính năng của hệ thống</li>
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

export default NeedVerification; 