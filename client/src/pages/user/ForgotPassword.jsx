import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../../utils/api';

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
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl w-full flex flex-col md:flex-row bg-white rounded-xl shadow-lg overflow-hidden">
        {/* Form Section */}
        <div className="w-full md:w-1/2 p-8">
          <div className="mb-6 text-center">
            <h1 className="text-2xl font-bold text-gray-800">Quên Mật Khẩu</h1>
            <p className="text-gray-600 mt-2">Nhập email của bạn để nhận mã xác nhận</p>
          </div>

          {error && (
            <div className="mb-4 bg-red-50 border-l-4 border-red-500 p-4 rounded">
              <p className="text-red-700">{error}</p>
            </div>
          )}
          
          {success && (
            <div className="mb-4 bg-green-50 border-l-4 border-green-500 p-4 rounded">
              <p className="text-green-700">Mã OTP đã được gửi đến email của bạn. Đang chuyển hướng...</p>
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <label htmlFor="email" className="block text-gray-700 font-medium mb-2">Email</label>
              <input
                type="email"
                id="email"
                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary focus:outline-none ${
                  error ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="Nhập địa chỉ email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={loading || success}
              />
            </div>

            <button 
              type="submit" 
              className={`w-full bg-primary text-white py-2 px-4 rounded-lg font-medium ${
                loading || success
                  ? 'opacity-70 cursor-not-allowed'
                  : 'hover:bg-primary-dark transition-colors'
              }`}
              disabled={loading || success}
            >
              {loading ? 'Đang xử lý...' : 'Gửi Mã Xác Nhận'}
            </button>
          </form>

          <div className="mt-4 text-center">
            <Link to="/login" className="text-primary hover:underline">
              Quay lại đăng nhập
            </Link>
          </div>
        </div>

        {/* Info Section */}
        <div className="hidden md:block w-1/2 bg-gradient-to-r from-primary to-primary-dark text-white p-8">
          <div className="h-full flex flex-col">
            <h2 className="text-xl font-bold mb-6">Hướng Dẫn Đặt Lại Mật Khẩu</h2>
            <ul className="space-y-3 text-white/90 mb-8">
              <li className="flex items-start">
                <span className="inline-flex items-center justify-center h-6 w-6 rounded-full bg-white/20 text-white text-sm mr-3 flex-shrink-0">1</span>
                <span>Nhập email đã đăng ký của bạn</span>
              </li>
              <li className="flex items-start">
                <span className="inline-flex items-center justify-center h-6 w-6 rounded-full bg-white/20 text-white text-sm mr-3 flex-shrink-0">2</span>
                <span>Mã OTP 6 chữ số sẽ được gửi đến email</span>
              </li>
              <li className="flex items-start">
                <span className="inline-flex items-center justify-center h-6 w-6 rounded-full bg-white/20 text-white text-sm mr-3 flex-shrink-0">3</span>
                <span>Nhập mã OTP để xác thực</span>
              </li>
              <li className="flex items-start">
                <span className="inline-flex items-center justify-center h-6 w-6 rounded-full bg-white/20 text-white text-sm mr-3 flex-shrink-0">4</span>
                <span>Đặt lại mật khẩu mới</span>
              </li>
              <li className="flex items-start">
                <span className="inline-flex items-center justify-center h-6 w-6 rounded-full bg-white/20 text-white text-sm mr-3 flex-shrink-0">5</span>
                <span>Mã OTP chỉ có hiệu lực trong vòng 2 phút</span>
              </li>
            </ul>
            
            <div className="mt-auto">
              <h3 className="font-semibold text-lg mb-2">Cần hỗ trợ?</h3>
              <p className="mb-1">Gọi cho chúng tôi tại: <a href="tel:02838221234" className="text-white underline">(028) 3822 1234</a></p>
              <p>Hoặc gửi email đến: <a href="mailto:support@benhvien.com" className="text-white underline">support@benhvien.com</a></p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword; 
