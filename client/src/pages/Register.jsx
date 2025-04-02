import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';

const Register = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phoneNumber: '',
    password: '',
    confirmPassword: '',
    dateOfBirth: '',
    gender: '',
    address: '',
    acceptTerms: false
  });

  const [errors, setErrors] = useState({});
  const [apiError, setApiError] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value
    });

    // Xóa lỗi khi người dùng nhập lại
    if (errors[name]) {
      setErrors({
        ...errors,
        [name]: null
      });
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    // Validate full name
    if (!formData.fullName.trim()) {
      newErrors.fullName = 'Vui lòng nhập họ và tên';
    }
    
    // Validate email
    if (!formData.email.trim()) {
      newErrors.email = 'Vui lòng nhập email';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email không hợp lệ';
    }
    
    // Validate phone number
    if (!formData.phoneNumber.trim()) {
      newErrors.phoneNumber = 'Vui lòng nhập số điện thoại';
    } else if (!/^[0-9]{10,11}$/.test(formData.phoneNumber.replace(/\s/g, ''))) {
      newErrors.phoneNumber = 'Số điện thoại không hợp lệ';
    }
    
    // Validate password
    if (!formData.password) {
      newErrors.password = 'Vui lòng nhập mật khẩu';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Mật khẩu phải có ít nhất 6 ký tự';
    }
    
    // Validate confirm password
    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Mật khẩu không khớp';
    }

    // Validate date of birth
    if (!formData.dateOfBirth) {
      newErrors.dateOfBirth = 'Vui lòng chọn ngày sinh';
    } else {
      const dob = new Date(formData.dateOfBirth);
      const today = new Date();
      if (dob >= today) {
        newErrors.dateOfBirth = 'Ngày sinh không hợp lệ';
      }
    }

    // Validate gender
    if (!formData.gender) {
      newErrors.gender = 'Vui lòng chọn giới tính';
    }
    
    // Validate terms acceptance
    if (!formData.acceptTerms) {
      newErrors.acceptTerms = 'Bạn phải đồng ý với các điều khoản và điều kiện';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setApiError(null);
    
    if (validateForm()) {
      setLoading(true);
      try {
        console.log('Submitting registration form:', {
          fullName: formData.fullName,
          email: formData.email,
          phoneNumber: formData.phoneNumber,
          dateOfBirth: formData.dateOfBirth,
          gender: formData.gender,
          address: formData.address
        });
        
        const response = await api.post('/auth/register', {
          fullName: formData.fullName,
          email: formData.email,
          phoneNumber: formData.phoneNumber,
          password: formData.password,
          dateOfBirth: formData.dateOfBirth,
          gender: formData.gender,
          address: formData.address
        });
        
        console.log('Registration response:', response.data);
        
        if (response.data.success) {
          // Thay vì tự động đăng nhập, chuyển hướng đến trang xác thực
          navigate('/need-verification', { 
            state: { email: formData.email }
          });
        } else {
          setApiError(response.data.message || 'Đăng ký không thành công');
        }
        
      } catch (error) {
        console.error('Registration error:', error);
        
        if (error.response) {
          console.log('Error response data:', error.response.data);
          const { data } = error.response;
          
          if (data.field) {
            // Lỗi field cụ thể
            setErrors({
              ...errors,
              [data.field]: data.message
            });
          } else if (data.errors) {
            // Nhiều lỗi validation
            setErrors({
              ...errors,
              ...data.errors
            });
          } else {
            // Lỗi chung
            setApiError(data.message || 'Đăng ký không thành công');
          }
        } else if (error.request) {
          setApiError('Không thể kết nối đến máy chủ. Vui lòng kiểm tra kết nối mạng.');
        } else {
          setApiError('Đăng ký không thành công. Vui lòng thử lại sau.');
        }
      } finally {
        setLoading(false);
      }
    }
  };

  return (
    <div className="register-page">
      <div className="auth-container">
        <div className="auth-card">
          <div className="auth-header">
            <h1 className="auth-title">Đăng Ký</h1>
            <p className="auth-subtitle">Tạo tài khoản để đặt lịch khám và quản lý hồ sơ sức khỏe</p>
          </div>

          {apiError && <div className="alert alert-danger">{apiError}</div>}

          <form className="auth-form" onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="fullName">Họ và Tên</label>
              <input
                type="text"
                id="fullName"
                name="fullName"
                className={`form-control ${errors.fullName ? 'is-invalid' : ''}`}
                placeholder="Nhập họ và tên"
                value={formData.fullName}
                onChange={handleChange}
              />
              {errors.fullName && <div className="invalid-feedback">{errors.fullName}</div>}
            </div>

            <div className="form-group">
              <label htmlFor="email">Email</label>
              <input
                type="email"
                id="email"
                name="email"
                className={`form-control ${errors.email ? 'is-invalid' : ''}`}
                placeholder="Nhập địa chỉ email"
                value={formData.email}
                onChange={handleChange}
              />
              {errors.email && <div className="invalid-feedback">{errors.email}</div>}
            </div>

            <div className="form-group">
              <label htmlFor="phoneNumber">Số Điện Thoại</label>
              <input
                type="tel"
                id="phoneNumber"
                name="phoneNumber"
                className={`form-control ${errors.phoneNumber ? 'is-invalid' : ''}`}
                placeholder="Nhập số điện thoại"
                value={formData.phoneNumber}
                onChange={handleChange}
              />
              {errors.phoneNumber && <div className="invalid-feedback">{errors.phoneNumber}</div>}
            </div>

            <div className="form-row">
              <div className="form-group half">
                <label htmlFor="dateOfBirth">Ngày Sinh</label>
                <input
                  type="date"
                  id="dateOfBirth"
                  name="dateOfBirth"
                  className={`form-control ${errors.dateOfBirth ? 'is-invalid' : ''}`}
                  value={formData.dateOfBirth}
                  onChange={handleChange}
                />
                {errors.dateOfBirth && <div className="invalid-feedback">{errors.dateOfBirth}</div>}
              </div>

              <div className="form-group half">
                <label htmlFor="gender">Giới Tính</label>
                <select
                  id="gender"
                  name="gender"
                  className={`form-control ${errors.gender ? 'is-invalid' : ''}`}
                  value={formData.gender}
                  onChange={handleChange}
                >
                  <option value="">-- Chọn --</option>
                  <option value="male">Nam</option>
                  <option value="female">Nữ</option>
                  <option value="other">Khác</option>
                </select>
                {errors.gender && <div className="invalid-feedback">{errors.gender}</div>}
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="address">Địa Chỉ</label>
              <input
                type="text"
                id="address"
                name="address"
                className="form-control"
                placeholder="Nhập địa chỉ (không bắt buộc)"
                value={formData.address}
                onChange={handleChange}
              />
            </div>

            <div className="form-group">
              <label htmlFor="password">Mật Khẩu</label>
              <input
                type="password"
                id="password"
                name="password"
                className={`form-control ${errors.password ? 'is-invalid' : ''}`}
                placeholder="Tạo mật khẩu"
                value={formData.password}
                onChange={handleChange}
              />
              {errors.password && <div className="invalid-feedback">{errors.password}</div>}
            </div>

            <div className="form-group">
              <label htmlFor="confirmPassword">Xác Nhận Mật Khẩu</label>
              <input
                type="password"
                id="confirmPassword"
                name="confirmPassword"
                className={`form-control ${errors.confirmPassword ? 'is-invalid' : ''}`}
                placeholder="Nhập lại mật khẩu"
                value={formData.confirmPassword}
                onChange={handleChange}
              />
              {errors.confirmPassword && <div className="invalid-feedback">{errors.confirmPassword}</div>}
            </div>

            <div className="form-group terms-container">
              <div className="terms-checkbox">
                <input
                  type="checkbox"
                  id="acceptTerms"
                  name="acceptTerms"
                  checked={formData.acceptTerms}
                  onChange={handleChange}
                  className={errors.acceptTerms ? 'is-invalid' : ''}
                />
                <label htmlFor="acceptTerms">
                  Tôi đồng ý với <a href="/terms" className="terms-link">Điều khoản dịch vụ</a> và <a href="/privacy" className="terms-link">Chính sách bảo mật</a>
                </label>
              </div>
              {errors.acceptTerms && <div className="invalid-feedback terms-error">{errors.acceptTerms}</div>}
            </div>

            <button type="submit" className="btn btn-primary btn-block" disabled={loading}>
              {loading ? 'Đang xử lý...' : 'Đăng Ký'}
            </button>
          </form>

          <div className="auth-divider">
            <span>Hoặc đăng ký với</span>
          </div>

          <div className="social-auth">
            <button className="btn btn-social btn-google">
              <i className="social-icon google-icon"></i>
              Google
            </button>
            <button className="btn btn-social btn-facebook">
              <i className="social-icon facebook-icon"></i>
              Facebook
            </button>
          </div>

          <div className="auth-footer">
            <p>Đã có tài khoản? <Link to="/login" className="auth-link">Đăng nhập</Link></p>
          </div>
        </div>

        <div className="auth-info">
          <div className="info-content">
            <h2 className="info-title">Lợi Ích Khi Đăng Ký</h2>
            <ul className="info-list">
              <li>Đặt lịch khám dễ dàng với các bác sĩ hàng đầu</li>
              <li>Nhận thông báo và nhắc nhở cho lịch khám sắp tới</li>
              <li>Truy cập hồ sơ sức khỏe của bạn mọi lúc, mọi nơi</li>
              <li>Theo dõi lịch sử khám chữa bệnh</li>
              <li>Nhận tư vấn trực tuyến từ các bác sĩ chuyên khoa</li>
            </ul>
            <div className="auth-support">
              <h3>Cần hỗ trợ?</h3>
              <p>Gọi cho chúng tôi tại: <a href="tel:02838221234" className="support-phone">(028) 3822 1234</a></p>
              <p>Hoặc gửi email đến: <a href="mailto:support@benhvien.com" className="support-email">support@benhvien.com</a></p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register; 