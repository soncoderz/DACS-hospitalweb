import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import api from '../utils/api';

const OtpVerification = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const email = location.state?.email;
  
  const [otp, setOtp] = useState(['', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [timeLeft, setTimeLeft] = useState(120); // 2 minutes in seconds
  const [resending, setResending] = useState(false);
  const [isExpired, setIsExpired] = useState(false);
  
  const inputRefs = [useRef(), useRef(), useRef(), useRef()];
  
  // Redirect if no email is provided
  useEffect(() => {
    if (!email) {
      navigate('/forgot-password', { replace: true });
    }
  }, [email, navigate]);
  
  // Timer countdown
  useEffect(() => {
    if (timeLeft <= 0) {
      setIsExpired(true);
      return;
    }
    
    const timerId = setTimeout(() => {
      setTimeLeft(timeLeft - 1);
    }, 1000);
    
    return () => clearTimeout(timerId);
  }, [timeLeft]);
  
  // Format time as mm:ss
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };
  
  const handleInputChange = (index, value) => {
    // Allow only numbers
    if (!/^\d*$/.test(value)) return;
    
    // Update OTP array
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);
    
    // Auto focus next input if current is filled
    if (value && index < 3) {
      inputRefs[index + 1].current.focus();
    }
  };
  
  const handleKeyDown = (index, e) => {
    // Handle backspace to focus previous input
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs[index - 1].current.focus();
    }
  };
  
  const handleResendOtp = async () => {
    setError('');
    setResending(true);
    
    try {
      const response = await api.post('/auth/forgot-password', { email });
      
      if (response.data.success) {
        // Reset timer and expired state
        setTimeLeft(120);
        setIsExpired(false);
        // Clear inputs
        setOtp(['', '', '', '']);
        // Focus first input
        inputRefs[0].current.focus();
      } else {
        setError(response.data.message || 'Không thể gửi lại mã OTP. Vui lòng thử lại sau.');
      }
    } catch (error) {
      console.error('Resend OTP error:', error);
      setError('Không thể gửi lại mã OTP. Vui lòng thử lại sau.');
    } finally {
      setResending(false);
    }
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Check if OTP is complete
    const otpValue = otp.join('');
    if (otpValue.length !== 4) {
      setError('Vui lòng nhập đầy đủ mã OTP 4 chữ số');
      return;
    }
    
    // Check if OTP is expired
    if (isExpired) {
      setError('Mã OTP đã hết hạn. Vui lòng yêu cầu mã mới.');
      return;
    }
    
    setError('');
    setLoading(true);
    
    try {
      const response = await api.post('/auth/verify-otp', {
        email,
        otp: otpValue
      });
      
      if (response.data.success) {
        // Navigate to reset password page with token
        navigate('/reset-password', {
          state: {
            email,
            resetToken: response.data.resetToken
          }
        });
      } else {
        setError(response.data.message || 'Xác thực OTP không thành công. Vui lòng thử lại.');
      }
    } catch (error) {
      console.error('OTP verification error:', error);
      
      if (error.response) {
        // Check for expired flag in the response
        if (error.response.data.expired) {
          setIsExpired(true);
          setTimeLeft(0);
        }
        
        setError(error.response.data.message || 'Xác thực OTP không thành công. Vui lòng thử lại.');
      } else if (error.request) {
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
    <div className="auth-page">
      <div className="auth-container">
        <div className="auth-card">
          <div className="auth-header">
            <h1 className="auth-title">Xác Thực OTP</h1>
            <p className="auth-subtitle">
              Nhập mã OTP 4 chữ số đã được gửi đến email {email}
            </p>
          </div>
          
          {error && <div className="alert alert-danger">{error}</div>}
          
          <form className="auth-form" onSubmit={handleSubmit}>
            <div className="otp-container">
              {otp.map((digit, index) => (
                <input
                  key={index}
                  ref={inputRefs[index]}
                  type="text"
                  maxLength={1}
                  className="otp-input"
                  value={digit}
                  onChange={(e) => handleInputChange(index, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(index, e)}
                  disabled={loading || isExpired}
                  autoFocus={index === 0}
                />
              ))}
            </div>
            
            <div className="timer-container">
              {timeLeft > 0 ? (
                <p className="timer">
                  Mã OTP sẽ hết hạn sau: <span>{formatTime(timeLeft)}</span>
                </p>
              ) : (
                <p className="timer expired">Mã OTP đã hết hạn</p>
              )}
            </div>
            
            {isExpired ? (
              <div className="expired-actions">
                <p className="expired-message">Mã OTP của bạn đã hết hạn.</p>
                <button
                  type="button"
                  className="btn btn-primary btn-block"
                  onClick={handleResendOtp}
                  disabled={resending}
                >
                  {resending ? 'Đang gửi lại...' : 'Gửi lại mã OTP mới'}
                </button>
              </div>
            ) : (
              <button
                type="submit"
                className="btn btn-primary btn-block"
                disabled={loading || otp.some(digit => !digit)}
              >
                {loading ? 'Đang xử lý...' : 'Xác Nhận'}
              </button>
            )}
            
            {!isExpired && (
              <div className="resend-container">
                <button
                  type="button"
                  className="btn btn-link"
                  onClick={handleResendOtp}
                  disabled={resending || timeLeft > 0}
                >
                  {resending ? 'Đang gửi lại...' : 'Gửi lại mã OTP'}
                </button>
              </div>
            )}
          </form>
          
          <div className="auth-footer">
            <p>
              <Link to="/forgot-password" className="auth-link">Quay lại</Link>
            </p>
          </div>
        </div>
        
        <div className="auth-info">
          <div className="info-content">
            <h2 className="info-title">Lưu Ý Quan Trọng</h2>
            <ul className="info-list">
              <li>Mã OTP chỉ có hiệu lực trong vòng 2 phút</li>
              <li>Vui lòng kiểm tra hộp thư đến và thư rác nếu không nhận được email</li>
              <li>Không tiết lộ mã OTP cho người khác</li>
              <li>Mỗi mã OTP chỉ có thể sử dụng một lần</li>
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

export default OtpVerification; 