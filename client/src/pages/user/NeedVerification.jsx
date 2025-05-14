import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../utils/api';
import { FaEnvelope, FaExclamationTriangle, FaInfoCircle, FaCheckCircle } from 'react-icons/fa';

const NeedVerification = () => {
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [sending, setSending] = useState(false);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState(''); // 'success' or 'error'
  
  // Use email from either the auth context or the location state
  const email = user?.email || location.state?.email;
  
  if (!email) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-8">
          <div className="text-center mb-6">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-red-100 text-red-500 mb-4">
              <FaExclamationTriangle className="text-3xl" />
            </div>
            <h1 className="text-2xl font-bold text-gray-800 mb-2">Không tìm thấy email</h1>
            <p className="text-gray-600">
              Không thể xác định email cần xác thực.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link to="/login" className="px-4 py-2 bg-primary text-white rounded-lg font-medium text-center hover:bg-primary-dark transition-colors">
              Đăng nhập
            </Link>
            <Link to="/register" className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg font-medium text-center hover:bg-gray-200 transition-colors">
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
      setMessageType('');
      
      const response = await api.post('/auth/resend-verification', { email });
      
      if (response.data.success) {
        setMessageType('success');
        setMessage('Email xác thực đã được gửi lại. Vui lòng kiểm tra hộp thư đến của bạn.');
      } else {
        setMessageType('error');
        setMessage(response.data.message || 'Không thể gửi lại email xác thực.');
      }
    } catch (error) {
      console.error('Resend verification error:', error);
      setMessageType('error');
      if (error.response?.data?.message) {
        setMessage(error.response.data.message);
      } else {
        setMessage('Đã xảy ra lỗi. Vui lòng thử lại sau.');
      }
    } finally {
      setSending(false);
    }
  };
  
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-8">
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-blue-100 text-blue-500 mb-4">
            <FaEnvelope className="text-3xl" />
          </div>
          <h1 className="text-2xl font-bold text-gray-800 mb-3">Xác thực Email</h1>
          <p className="text-gray-600 mb-3">
            Tài khoản của bạn cần được xác thực trước khi sử dụng tất cả các tính năng của hệ thống.
          </p>
          <p className="text-gray-600 mb-4">
            Chúng tôi đã gửi một email xác thực đến địa chỉ <strong className="text-gray-800">{email}</strong>. 
            Vui lòng kiểm tra hộp thư đến và làm theo hướng dẫn.
          </p>
          <div className="bg-blue-50 border-l-4 border-blue-400 p-4 text-left rounded-lg flex mb-6">
            <FaInfoCircle className="text-blue-500 mr-2 mt-1 flex-shrink-0" />
            <p className="text-blue-800 text-sm">
              Liên kết xác thực chỉ có hiệu lực trong <strong>5 phút</strong>. 
              Nếu bạn không xác thực trong thời gian này, bạn sẽ cần yêu cầu gửi lại email xác thực.
            </p>
          </div>
        </div>
        
        {message && (
          <div className={`p-4 rounded-lg mb-6 ${
            messageType === 'success' 
              ? 'bg-green-50 border-l-4 border-green-400 text-green-800' 
              : 'bg-red-50 border-l-4 border-red-400 text-red-800'
          }`}>
            <div className="flex">
              {messageType === 'success' ? (
                <FaCheckCircle className="text-green-500 mr-2 mt-0.5 flex-shrink-0" />
              ) : (
                <FaExclamationTriangle className="text-red-500 mr-2 mt-0.5 flex-shrink-0" />
              )}
              <p>{message}</p>
            </div>
          </div>
        )}
        
        <div className="flex flex-col sm:flex-row gap-3">
          <button 
            className={`px-4 py-2 rounded-lg font-medium flex-1 text-center ${
              sending 
                ? 'bg-gray-300 text-gray-600 cursor-not-allowed' 
                : 'bg-primary text-white hover:bg-primary-dark transition-colors'
            }`}
            onClick={handleResendVerification}
            disabled={sending}
          >
            {sending ? 'Đang gửi...' : 'Gửi lại email xác thực'}
          </button>
          <Link to="/" className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg font-medium flex-1 text-center hover:bg-gray-200 transition-colors">
            Quay về trang chủ
          </Link>
        </div>
      </div>
    </div>
  );
};

export default NeedVerification; 
