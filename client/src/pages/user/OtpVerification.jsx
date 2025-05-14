import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../utils/api';
import { FaLock, FaArrowLeft, FaExclamationTriangle, FaCheckCircle } from 'react-icons/fa';

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
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex flex-col items-center">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
          <p className="mt-4 text-gray-600">Đang tải...</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-8">
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 text-primary mb-4">
            <FaLock className="text-3xl" />
          </div>
          <h1 className="text-2xl font-bold text-gray-800 mb-2">Xác thực OTP</h1>
        </div>
        
        {error && (
          <div className="mb-4 bg-red-50 border-l-4 border-red-500 p-4 rounded flex">
            <FaExclamationTriangle className="text-red-500 mr-2 mt-0.5 flex-shrink-0" />
            <p className="text-red-700">{error}</p>
          </div>
        )}
        
        {success && (
          <div className="mb-4 bg-green-50 border-l-4 border-green-500 p-4 rounded flex">
            <FaCheckCircle className="text-green-500 mr-2 mt-0.5 flex-shrink-0" />
            <p className="text-green-700">{success}</p>
          </div>
        )}
        
        <p className="text-gray-600 mb-6 text-center">
          Vui lòng nhập mã OTP 6 chữ số đã được gửi đến email <span className="font-medium text-gray-800">{email}</span>
        </p>
        
        <div className="flex justify-center gap-2 mb-6" onPaste={handlePaste}>
          {otp.map((digit, index) => (
            <input
              key={index}
              type="text"
              className="w-12 h-14 text-center text-xl font-bold border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              value={digit}
              onChange={(e) => handleOtpChange(e, index)}
              onKeyDown={(e) => handleKeyDown(e, index)}
              ref={(ref) => (inputRefs.current[index] = ref)}
              maxLength={1}
              autoFocus={index === 0}
            />
          ))}
        </div>
        
        <div className="text-center mb-6">
          {!canResend ? (
            <p className="text-gray-600">Mã OTP sẽ hết hạn sau: <span className="font-semibold text-primary">{formatTimeLeft()}</span></p>
          ) : (
            <p className="text-red-500 font-medium">Mã OTP đã hết hạn</p>
          )}
        </div>
        
        <div className="flex flex-col gap-3">
          <div className="flex flex-col sm:flex-row gap-3">
            <button
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg font-medium hover:bg-gray-300 transition-colors flex-1 flex items-center justify-center"
              onClick={() => navigate('/forgot-password')}
              disabled={loading}
            >
              <FaArrowLeft className="mr-2" /> Quay lại
            </button>
            <button
              className={`px-4 py-2 rounded-lg font-medium flex-1 flex items-center justify-center ${
                loading || otp.join('').length !== 6
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-primary text-white hover:bg-primary-dark transition-colors'
              }`}
              onClick={verifyOtp}
              disabled={loading || otp.join('').length !== 6}
            >
              {loading ? 'Đang xác thực...' : 'Xác thực'}
            </button>
          </div>
          
          <div className="text-center mt-2">
            <p className="text-gray-600">
              Không nhận được mã? 
              <button
                className={`ml-2 ${
                  loading || (!canResend && timeLeft > 0)
                    ? 'text-gray-400 cursor-not-allowed'
                    : 'text-primary hover:text-primary-dark hover:underline'
                }`}
                onClick={resendOtp}
                disabled={loading || (!canResend && timeLeft > 0)}
              >
                {loading ? 'Đang gửi...' : 'Gửi lại mã OTP'}
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OtpVerification; 
