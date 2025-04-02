import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';
import '../styles/verification.css';

const VerifyEmail = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { updateUserData } = useAuth();
  const [status, setStatus] = useState('loading'); // loading, success, error
  const [message, setMessage] = useState('');
  
  useEffect(() => {
    const verifyEmailToken = async () => {
      // Extract token from URL query params
      const searchParams = new URLSearchParams(location.search);
      const token = searchParams.get('token');
      
      if (!token) {
        setStatus('error');
        setMessage('Token xác thực không hợp lệ hoặc đã hết hạn. Vui lòng thử lại.');
        return;
      }
      
      try {
        const response = await api.post('/auth/verify-email', { token });
        
        if (response.data.success) {
          setStatus('success');
          setMessage(response.data.message || 'Email của bạn đã được xác thực thành công!');
          
          // Update user data if available
          if (response.data.user) {
            updateUserData(response.data.user);
          }
          
          // Redirect to home after 3 seconds
          setTimeout(() => {
            navigate('/');
          }, 3000);
        } else {
          setStatus('error');
          setMessage(response.data.message || 'Không thể xác thực email. Vui lòng thử lại.');
        }
      } catch (err) {
        console.error('Email verification error:', err);
        
        setStatus('error');
        if (err.response) {
          setMessage(err.response.data.message || 'Không thể xác thực email. Vui lòng thử lại.');
        } else if (err.request) {
          setMessage('Không thể kết nối đến máy chủ. Vui lòng kiểm tra kết nối mạng.');
        } else {
          setMessage('Đã xảy ra lỗi. Vui lòng thử lại sau.');
        }
      }
    };
    
    verifyEmailToken();
  }, [location.search, navigate, updateUserData]);
  
  const renderContent = () => {
    switch (status) {
      case 'loading':
        return (
          <div className="verification-status">
            <div className="spinner"></div>
            <p>Đang xác thực email của bạn...</p>
          </div>
        );
        
      case 'success':
        return (
          <div className="verification-status success">
            <div className="verification-icon">
              <i className="fas fa-check-circle"></i>
            </div>
            <h2>Xác thực thành công!</h2>
            <p>{message}</p>
            <p>Bạn sẽ được chuyển hướng về trang chủ sau vài giây...</p>
          </div>
        );
        
      case 'error':
        return (
          <div className="verification-status error">
            <div className="verification-icon">
              <i className="fas fa-exclamation-circle"></i>
            </div>
            <h2>Xác thực không thành công</h2>
            <p>{message}</p>
            <div className="verification-actions">
              <button
                className="btn-primary"
                onClick={() => navigate('/need-verification')}
              >
                Yêu cầu xác thực lại
              </button>
              <button
                className="btn-secondary"
                onClick={() => navigate('/')}
              >
                Về trang chủ
              </button>
            </div>
          </div>
        );
        
      default:
        return null;
    }
  };
  
  return (
    <div className="verification-container">
      <div className="verification-card">
        <h1>Xác thực email</h1>
        {renderContent()}
      </div>
    </div>
  );
};

export default VerifyEmail; 