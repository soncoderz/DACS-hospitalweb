import React, { useState } from 'react';
import { Link } from 'react-router-dom';

const Register = () => {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    acceptTerms: false
  });

  const [errors, setErrors] = useState({});

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value
    });
  };

  const validateForm = () => {
    const newErrors = {};
    
    // Validate first name
    if (!formData.firstName.trim()) {
      newErrors.firstName = 'Vui lòng nhập họ';
    }
    
    // Validate last name
    if (!formData.lastName.trim()) {
      newErrors.lastName = 'Vui lòng nhập tên';
    }
    
    // Validate email
    if (!formData.email.trim()) {
      newErrors.email = 'Vui lòng nhập email';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email không hợp lệ';
    }
    
    // Validate phone
    if (!formData.phone.trim()) {
      newErrors.phone = 'Vui lòng nhập số điện thoại';
    } else if (!/^[0-9]{10,11}$/.test(formData.phone.replace(/\s/g, ''))) {
      newErrors.phone = 'Số điện thoại không hợp lệ';
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
    
    // Validate terms acceptance
    if (!formData.acceptTerms) {
      newErrors.acceptTerms = 'Bạn phải đồng ý với các điều khoản và điều kiện';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (validateForm()) {
      // Here would be the registration logic - For now just console log the data
      console.log('Registration Data:', formData);
      // Add registration logic here later
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

          <form className="auth-form" onSubmit={handleSubmit}>
            <div className="form-row">
              <div className="form-group half">
                <label htmlFor="firstName">Họ</label>
                <input
                  type="text"
                  id="firstName"
                  name="firstName"
                  className={`form-control ${errors.firstName ? 'is-invalid' : ''}`}
                  placeholder="Nhập họ"
                  value={formData.firstName}
                  onChange={handleChange}
                />
                {errors.firstName && <div className="invalid-feedback">{errors.firstName}</div>}
              </div>

              <div className="form-group half">
                <label htmlFor="lastName">Tên</label>
                <input
                  type="text"
                  id="lastName"
                  name="lastName"
                  className={`form-control ${errors.lastName ? 'is-invalid' : ''}`}
                  placeholder="Nhập tên"
                  value={formData.lastName}
                  onChange={handleChange}
                />
                {errors.lastName && <div className="invalid-feedback">{errors.lastName}</div>}
              </div>
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
              <label htmlFor="phone">Số Điện Thoại</label>
              <input
                type="tel"
                id="phone"
                name="phone"
                className={`form-control ${errors.phone ? 'is-invalid' : ''}`}
                placeholder="Nhập số điện thoại"
                value={formData.phone}
                onChange={handleChange}
              />
              {errors.phone && <div className="invalid-feedback">{errors.phone}</div>}
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

            <div className="form-group terms-group">
              <div className="checkbox-container">
                <input
                  type="checkbox"
                  id="acceptTerms"
                  name="acceptTerms"
                  checked={formData.acceptTerms}
                  onChange={handleChange}
                  className={errors.acceptTerms ? 'is-invalid' : ''}
                />
                <label htmlFor="acceptTerms">
                  Tôi đồng ý với <Link to="/terms" className="terms-link">Điều khoản dịch vụ</Link> và <Link to="/privacy" className="terms-link">Chính sách bảo mật</Link>
                </label>
              </div>
              {errors.acceptTerms && <div className="invalid-feedback">{errors.acceptTerms}</div>}
            </div>

            <button type="submit" className="btn btn-primary btn-block">Đăng Ký</button>
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
            <h2 className="info-title">Tại Sao Nên Tạo Tài Khoản?</h2>
            <ul className="info-list">
              <li>Đặt lịch khám trực tuyến mọi lúc, mọi nơi</li>
              <li>Lưu trữ hồ sơ sức khỏe cá nhân an toàn</li>
              <li>Nhận nhắc nhở lịch khám định kỳ</li>
              <li>Xem kết quả xét nghiệm trực tuyến</li>
              <li>Liên hệ với bác sĩ qua tin nhắn</li>
              <li>Quản lý thông tin sức khỏe gia đình</li>
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