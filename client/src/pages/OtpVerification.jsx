import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import '../styles/verification.css';

const OtpVerification = () => {
  const { user, updateUserData } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const email = location.state?.email || user?.email;
  
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [timeLeft, setTimeLeft] = useState(120); // 2 minutes in seconds
  const [canResend, setCanResend] = useState(false);
  
  const inputRefs = useRef([]);

  // Redirect if no email
  useEffect(() => {
    if (!email) {
      navigate('/forgot-password', { replace: true });
    }
  }, [email, navigate]);
  
  // Timer for OTP expiration
  useEffect(() => {
    if (timeLeft <= 0) {
      setCanResend(true);
      return;
    }
    
    const timer = setTimeout(() => {
      setTimeLeft(timeLeft - 1);
    }, 1000);
    
    return () => clearTimeout(timer);
  }, [timeLeft]);
  
  // Format time left as MM:SS
  const formatTimeLeft = () => {
    const minutes = Math.floor(timeLeft / 60);
    const seconds = timeLeft % 60;
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };
  
  // Handle OTP input change
  const handleOtpChange = (e, index) => {
    const value = e.target.value;
    
    // Allow only numbers
    if (value && !/^\d+$/.test(value)) {
      return;
    }
    
    const newOtp = [...otp];
    newOtp[index] = value.slice(-1); // Take only the last digit
    setOtp(newOtp);
    
    // Auto-focus next input after filling current one
    if (value && index < 5) {
      inputRefs.current[index + 1].focus();
    }
  };
  
  // Handle key down in OTP inputs
  const handleKeyDown = (e, index) => {
    // Move focus to previous input on backspace
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1].focus();
    }
  };
  
  // Handle pasting OTP
  const handlePaste = (e) => {
    e.preventDefault();
    const pasteData = e.clipboardData.getData('text');
    const pasteDataDigits = pasteData.replace(/\D/g, '').slice(0, 6);
    
    if (pasteDataDigits) {
      const newOtp = [...otp];
      for (let i = 0; i < Math.min(pasteDataDigits.length, 6); i++) {
        newOtp[i] = pasteDataDigits[i];
      }
      setOtp(newOtp);
      
      // Focus last filled input or the next empty one
      const lastIndex = Math.min(pasteDataDigits.length - 1, 5);
      inputRefs.current[lastIndex].focus();
    }
  };
  
  // Verify OTP
  const verifyOtp = async () => {
    const otpValue = otp.join('');
    
    if (otpValue.length !== 6) {
      setError('Vui lòng nhập đầy đủ mã OTP 6 số');
      return;
    }
    
    setLoading(true);
    setError('');
    setSuccess('');
    
    try {
      const response = await api.post('/auth/verify-otp', {
        email: email,
        otp: otpValue
      });
      
      if (response.data.success) {
        setSuccess('Xác thực OTP thành công!');
        
        // Redirect to reset password page with token
        setTimeout(() => {
          navigate('/reset-password', {
            state: {
              email: email,
              resetToken: response.data.resetToken
            }
          });
        }, 1500);
      } else {
        setError(response.data.message || 'Mã OTP không hợp lệ hoặc đã hết hạn');
      }
    } catch (err) {
      console.error('OTP verification error:', err);
      
      if (err.response) {
        // Check for expired OTP
        if (err.response.data.expired) {
          setCanResend(true);
          setTimeLeft(0);
        }
        setError(err.response.data.message || 'Mã OTP không hợp lệ hoặc đã hết hạn');
      } else if (err.request) {
        setError('Không thể kết nối đến máy chủ. Vui lòng kiểm tra kết nối mạng.');
      } else {
        setError('Đã xảy ra lỗi. Vui lòng thử lại sau.');
      }
    } finally {
      setLoading(false);
    }
  };
  
  // Resend OTP
  const resendOtp = async () => {
    if (!canResend && timeLeft > 0) return;
    
    setLoading(true);
    setError('');
    setSuccess('');
    
    try {
      const response = await api.post('/auth/forgot-password', {
        email: email
      });
      
      if (response.data.success) {
        // Clear OTP inputs
        setOtp(['', '', '', '', '', '']);
        
        // Reset timer
        setTimeLeft(120);
        setCanResend(false);
        
        // Focus first input
        inputRefs.current[0].focus();
        
        setSuccess('Mã OTP mới đã được gửi đến email của bạn');
      } else {
        setError(response.data.message || 'Không thể gửi lại mã OTP. Vui lòng thử lại sau.');
      }
    } catch (err) {
      console.error('Resend OTP error:', err);
      
      if (err.response) {
        setError(err.response.data.message || 'Không thể gửi lại mã OTP. Vui lòng thử lại sau.');
      } else if (err.request) {
        setError('Không thể kết nối đến máy chủ. Vui lòng kiểm tra kết nối mạng.');
      } else {
        setError('Đã xảy ra lỗi. Vui lòng thử lại sau.');
      }
    } finally {
      setLoading(false);
    }
  };
  
  // If no email, show loading until redirect happens
  if (!email) {
    return <div className="loading">Đang tải...</div>;
  }
  
  return (
    <div className="verification-container">
      <div className="verification-card">
        <div className="verification-icon">
          <i className="fas fa-lock"></i>
        </div>
        <h1>Xác thực OTP</h1>
        
        {error && <div className="alert alert-danger">{error}</div>}
        {success && <div className="alert alert-success">{success}</div>}
        
        <p>
          Vui lòng nhập mã OTP 6 chữ số đã được gửi đến email <strong>{email}</strong>
        </p>
        
        <div className="otp-inputs" onPaste={handlePaste}>
          {otp.map((digit, index) => (
            <input
              key={index}
              type="text"
              className="otp-input"
              value={digit}
              onChange={(e) => handleOtpChange(e, index)}
              onKeyDown={(e) => handleKeyDown(e, index)}
              ref={(ref) => (inputRefs.current[index] = ref)}
              maxLength={1}
              autoFocus={index === 0}
            />
          ))}
        </div>
        
        <div className="verification-timer">
          {!canResend ? (
            <p>Mã OTP sẽ hết hạn sau: {formatTimeLeft()}</p>
          ) : (
            <p>Mã OTP đã hết hạn</p>
          )}
        </div>
        
        <div className="verification-actions">
          <button
            className="btn-secondary"
            onClick={() => navigate('/forgot-password')}
            disabled={loading}
          >
            Quay lại
          </button>
          <button
            className="btn-primary"
            onClick={verifyOtp}
            disabled={loading || otp.join('').length !== 6}
          >
            {loading ? 'Đang xác thực...' : 'Xác thực'}
          </button>
        </div>
        
        <div className="verification-help">
          <p>
            Không nhận được mã? 
            <button
              className="btn-link"
              onClick={resendOtp}
              disabled={loading || (!canResend && timeLeft > 0)}
            >
              {loading ? 'Đang gửi...' : 'Gửi lại mã OTP'}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};

export default OtpVerification; 