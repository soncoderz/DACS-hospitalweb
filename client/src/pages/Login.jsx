import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import { navigateByRole } from '../utils/roleUtils';
import { Form, Button, Input, Checkbox } from 'antd';
import { toastError, toastSuccess, toastGoogleSuccess, toastFacebookSuccess } from '../utils/toast';
import { GoogleOAuthProvider, GoogleLogin } from '@react-oauth/google';
import FacebookLogin from 'react-facebook-login-lite';

const Login = ({ onRegisterClick }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from?.pathname || '/';
  const { login } = useAuth();
  const [loading, setLoading] = useState(false);
  const [form] = Form.useForm();

  useEffect(() => {
    // Load Facebook SDK
    window.fbAsyncInit = function() {
      FB.init({
        appId: '3561947047432184',
        cookie: true,
        xfbml: true,
        version: 'v19.0'
      });
      
      FB.AppEvents.logPageView();
      
      // Check Facebook login status
      FB.getLoginStatus(function(response) {
        console.log('Facebook login status:', response);
      });
    };

    // Load Facebook SDK
    (function(d, s, id) {
      var js, fjs = d.getElementsByTagName(s)[0];
      if (d.getElementById(id)) return;
      js = d.createElement(s); js.id = id;
      js.src = "https://connect.facebook.net/en_US/sdk.js";
      fjs.parentNode.insertBefore(js, fjs);
    }(document, 'script', 'facebook-jssdk'));
  }, []);

  // Regular login handler
  const onFinish = async (values) => {
    setLoading(true);
    
    try {
      const response = await api.post('/auth/login', {
        email: values.email,
        password: values.password,
        rememberMe: values.rememberMe
      });
      
      if (response.data.success) {
        login(response.data.data, values.rememberMe, true);
        navigateByRole(response.data.data, navigate, from);
      } else {
        toastError(response.data.message || 'Đăng nhập không thành công');
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
        
        toastError(data.message || 'Đăng nhập không thành công');
      } else if (error.request) {
        toastError('Không thể kết nối đến máy chủ. Vui lòng kiểm tra kết nối mạng.');
      } else {
        toastError('Đăng nhập không thành công. Vui lòng thử lại sau.');
      }
    } finally {
      setLoading(false);
    }
  };

  // Google login success handler
  const handleGoogleLoginSuccess = async (credentialResponse) => {
    try {
      setLoading(true);
      const response = await api.post('/auth/google-token', {
        token: credentialResponse.credential
      });
      
      if (response.data.success) {
        login(response.data.data, true, false);
        
        toastGoogleSuccess(`Đăng nhập Google thành công! Xin chào, ${response.data.data.fullName}`);
        
        navigateByRole(response.data.data, navigate, from);
      } else {
        toastError(response.data.message || 'Đăng nhập Google không thành công');
      }
    } catch (error) {
      console.error('Google login error:', error);
      toastError('Đăng nhập với Google không thành công');
    } finally {
      setLoading(false);
    }
  };

  // Google login error handler
  const handleGoogleLoginError = () => {
    toastError('Đăng nhập với Google không thành công');
  };

  // Facebook login với phương pháp redirect (không dùng FB.login)
  const handleFacebookLogin = () => {
    // Sử dụng redirect URL thay vì FB.login
    const redirectUri = `${window.location.origin}/facebook-callback`;
    const fbLoginUrl = `https://www.facebook.com/v19.0/dialog/oauth?client_id=3561947047432184&redirect_uri=${encodeURIComponent(redirectUri)}&scope=email,public_profile`;
    
    // Lưu state hiện tại để quay lại sau khi đăng nhập
    sessionStorage.setItem('auth_redirect', from);
    
    // Chuyển hướng đến Facebook
    window.location.href = fbLoginUrl;
  };

  // Xử lý khi đăng nhập Facebook thành công
  const handleFacebookLoginSuccess = async (response) => {
    try {
      setLoading(true);
      // Make API call to backend with access token
      const apiResponse = await api.post('/auth/facebook-token', {
        accessToken: response.authResponse.accessToken,
        userID: response.authResponse.userID
      });
      
      if (apiResponse.data.success) {
        login(apiResponse.data.data, true, false);
        
        toastFacebookSuccess(`Đăng nhập Facebook thành công! Xin chào, ${apiResponse.data.data.fullName}`);
        
        navigateByRole(apiResponse.data.data, navigate, from);
      } else {
        toastError(apiResponse.data.message || 'Đăng nhập Facebook không thành công');
      }
    } catch (error) {
      console.error('Facebook login error:', error);
      toastError('Đăng nhập với Facebook không thành công');
    } finally {
      setLoading(false);
    }
  };

  // Handle direct social login
  const handleSocialLogin = (provider) => {
    window.location.href = `${import.meta.env.VITE_API_URL}/auth/${provider}`;
  };

  return (
    <div className="form-section">
      <div className="form-header">
        <h2>Đăng Nhập</h2>
        <p className="form-description">Đăng nhập để đặt lịch khám và xem hồ sơ sức khỏe</p>
      </div>

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
          <button 
            type="button" 
            className="social-login-button google-login"
            onClick={() => handleSocialLogin('google')}
          >
            <i className="fab fa-google"></i>
            Google
          </button>
          <button 
            type="button" 
            className="social-login-button facebook-login"
            onClick={handleFacebookLogin}
          >
            <i className="fab fa-facebook"></i>
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