import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import '../styles/verification.css';

const NeedVerification = () => {
  const { user } = useAuth();
  const location = useLocation();
  const [sending, setSending] = useState(false);
  const [message, setMessage] = useState('');
  
  // Use email from either the auth context or the location state
  const email = user?.email || location.state?.email;
  
  if (!email) {
    return (
      <div className="verification-container">
        <div className="verification-card">
          <div className="verification-icon error">
            <i className="fas fa-exclamation-triangle"></i>
          </div>
          <h1>Không tìm thấy email</h1>
          <p>
            Không thể xác định email cần xác thực.
          </p>
          <div className="verification-actions">
            <Link to="/login" className="btn-primary">
              Đăng nhập
            </Link>
            <Link to="/register" className="btn-secondary">
              Đăng ký
            </Link>
          </div>
        </div>
      </div>
    );
  }
  
  const handleResendVerification = async () => {
    try {
      setSending(true);
      setMessage('');
      
      const response = await api.post('/auth/resend-verification', { email });
      
      if (response.data.success) {
        setMessage('Email xác thực đã được gửi lại. Vui lòng kiểm tra hộp thư đến của bạn.');
      } else {
        setMessage(response.data.message || 'Không thể gửi lại email xác thực.');
      }
    } catch (error) {
      console.error('Resend verification error:', error);
      setMessage('Đã xảy ra lỗi. Vui lòng thử lại sau.');
    } finally {
      setSending(false);
    }
  };
  
  return (
    <div className="verification-container">
      <div className="verification-card">
        <div className="verification-icon">
          <i className="fas fa-envelope"></i>
        </div>
        <h1>Xác thực Email</h1>
        <p>
          Tài khoản của bạn cần được xác thực trước khi sử dụng tất cả các tính năng của hệ thống.
        </p>
        <p>
          Chúng tôi đã gửi một email xác thực đến địa chỉ <strong>{email}</strong>. 
          Vui lòng kiểm tra hộp thư đến và làm theo hướng dẫn.
        </p>
        <p className="verification-note">
          <i className="fas fa-info-circle"></i> Liên kết xác thực chỉ có hiệu lực trong <strong>5 phút</strong>. 
          Nếu bạn không xác thực trong thời gian này, bạn sẽ cần yêu cầu gửi lại email xác thực.
        </p>
        
        {message && (
          <div className={`verification-message ${message.includes('lỗi') ? 'error' : 'success'}`}>
            {message}
          </div>
        )}
        
        <div className="verification-actions">
          <Link to="/" className="btn-primary">
            Quay về trang chủ
          </Link>
        </div>
        <div className="verification-help">
          <p>
            Không nhận được email? 
            <button 
              className="btn-link" 
              onClick={handleResendVerification}
              disabled={sending}
            >
              {sending ? 'Đang gửi...' : 'Gửi lại email xác thực'}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};

export default NeedVerification; 