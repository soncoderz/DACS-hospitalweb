import React, { useState, useEffect } from 'react';
import { CheckCircleOutlined } from '@ant-design/icons';
import { useSearchParams } from 'react-router-dom';
import '../styles/Auth.css';
import Login from './Login';
import Register from './Register';

const Auth = () => {
  const [searchParams] = useSearchParams();
  const [isRegisterMode, setIsRegisterMode] = useState(searchParams.get('mode') === 'register');

  useEffect(() => {
    setIsRegisterMode(searchParams.get('mode') === 'register');
  }, [searchParams]);

  const toggleMode = () => {
    setIsRegisterMode(!isRegisterMode);
  };

  return (
    <div className={`auth-container ${isRegisterMode ? 'register-mode' : ''}`}>
      <div className="form-container">
        <div className="form-wrapper">
          <Login onRegisterClick={toggleMode} />
          <Register onLoginClick={toggleMode} />
        </div>
      </div>
      <div className="auth-info">
        <div className="info-wrapper">
          <div className="login-info">
            <h2>Lợi ích khi đăng nhập</h2>
            <ul>
              <li>
                <CheckCircleOutlined /> Đặt lịch khám dễ dàng và nhanh chóng
              </li>
              <li>
                <CheckCircleOutlined /> Xem lịch sử khám bệnh và hồ sơ sức khỏe
              </li>
              <li>
                <CheckCircleOutlined /> Nhận thông báo nhắc lịch khám
              </li>
              <li>
                <CheckCircleOutlined /> Truy cập kết quả xét nghiệm trực tuyến
              </li>
              <li>
                <CheckCircleOutlined /> Trao đổi với bác sĩ qua tin nhắn
              </li>
            </ul>
          </div>
          <div className="register-info">
            <h2>Lợi ích khi đăng ký</h2>
            <ul>
              <li>
                <CheckCircleOutlined /> Đặt lịch khám dễ dàng với các bác sĩ hàng đầu
              </li>
              <li>
                <CheckCircleOutlined /> Nhận thông báo và nhắc nhở cho lịch khám sắp tới
              </li>
              <li>
                <CheckCircleOutlined /> Truy cập hồ sơ sức khỏe của bạn mọi lúc, mọi nơi
              </li>
              <li>
                <CheckCircleOutlined /> Theo dõi lịch sử khám chữa bệnh
              </li>
              <li>
                <CheckCircleOutlined /> Nhận tư vấn trực tuyến từ các bác sĩ chuyên khoa
              </li>
            </ul>
          </div>
        </div>
        <div className="auth-support">
          <h3>Cần hỗ trợ?</h3>
          <p>Gọi cho chúng tôi tại: (028) 3822 1234</p>
          <p>Hoặc gửi email đến: support@benhvien.com</p>
        </div>
      </div>
    </div>
  );
};

export default Auth; 