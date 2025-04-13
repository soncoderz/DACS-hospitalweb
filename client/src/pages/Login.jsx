import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import { navigateByRole } from '../utils/roleUtils';
import { Form, Button, Input, Checkbox } from 'antd';

const Login = ({ onRegisterClick }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from?.pathname || '/';
  const { login } = useAuth();
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState(null);
  const [form] = Form.useForm();

  const onFinish = async (values) => {
    setApiError(null);
    setLoading(true);
    
    try {
      const response = await api.post('/auth/login', {
        email: values.email,
        password: values.password,
        rememberMe: values.rememberMe
      });
      
      if (response.data.success) {
        login(response.data.data, values.rememberMe);
        navigateByRole(response.data.data, navigate, from);
      } else {
        setApiError(response.data.message || 'Đăng nhập không thành công');
      }
      
    } catch (error) {
      console.error('Login error:', error);
      
      if (error.response) {
        const { data } = error.response;
        
        if (data.needVerification) {
          navigate('/need-verification', { 
            state: { email: values.email } 
          });
          return;
        }
        
        setApiError(data.message || 'Đăng nhập không thành công');
      } else if (error.request) {
        setApiError('Không thể kết nối đến máy chủ. Vui lòng kiểm tra kết nối mạng.');
      } else {
        setApiError('Đăng nhập không thành công. Vui lòng thử lại sau.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="form-section">
      <div className="form-header">
        <h2>Đăng Nhập</h2>
        <p className="form-description">Đăng nhập để đặt lịch khám và xem hồ sơ sức khỏe</p>
      </div>
      
      {apiError && <div className="alert alert-danger">{apiError}</div>}

      <Form
        form={form}
        name="login"
        className="auth-form"
        onFinish={onFinish}
        initialValues={{ rememberMe: false }}
      >
        <div className="form-group">
          <label htmlFor="email">Email</label>
          <Form.Item
            name="email"
            rules={[
              { required: true, message: 'Vui lòng nhập email' },
              { type: 'email', message: 'Email không hợp lệ' }
            ]}
          >
            <Input 
              size="large"
              placeholder="Nhập địa chỉ email"
              className="form-control"
            />
          </Form.Item>
        </div>

        <div className="form-group">
          <label htmlFor="password">Mật Khẩu</label>
          <Form.Item
            name="password"
            rules={[
              { required: true, message: 'Vui lòng nhập mật khẩu' }
            ]}
          >
            <Input.Password 
              size="large"
              placeholder="Nhập mật khẩu"
              className="form-control"
            />
          </Form.Item>
        </div>

        <div className="form-options">
          <Form.Item name="rememberMe" valuePropName="checked">
            <Checkbox>Ghi nhớ đăng nhập</Checkbox>
          </Form.Item>
          <Link to="/forgot-password" className="forgot-password">Quên mật khẩu?</Link>
        </div>

        <Form.Item>
          <Button 
            type="primary" 
            htmlType="submit" 
            className="btn btn-primary btn-block" 
            loading={loading}
            size="large"
          >
            {loading ? 'Đang xử lý...' : 'Đăng Nhập'}
          </Button>
        </Form.Item>
      </Form>

      <div className="social-login">
        <div className="social-login-divider">
          <span>Hoặc đăng nhập với</span>
        </div>
        <div className="social-login-buttons">
          <button type="button" className="social-login-button google-login">
            <i className="fab fa-google"></i>
            Google
          </button>
          <button type="button" className="social-login-button facebook-login">
            <i className="fab fa-facebook-f"></i>
            Facebook
          </button>
        </div>
      </div>

      <div style={{ textAlign: 'center', marginTop: '1rem' }}>
        <span>Chưa có tài khoản? </span>
        <Button type="link" onClick={onRegisterClick} style={{ padding: 0 }}>
          Đăng ký ngay
        </Button>
      </div>
    </div>
  );
};

export default Login; 