import React from 'react';
import { Link } from 'react-router-dom';

const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="footer">
      <div className="footer-top">
        <div className="container">
          <div className="footer-grid">
            <div className="footer-col">
              <div className="footer-logo">
                <Link to="/">
                  <span className="footer-logo-text">Bệnh Viện</span>
                </Link>
              </div>
              <p className="footer-description">
                Cung cấp dịch vụ y tế chất lượng cao với đội ngũ y bác sĩ giàu kinh nghiệm và cơ sở vật chất hiện đại.
              </p>
              <div className="social-links">
                <a href="#" className="social-link" aria-label="Facebook">
                  <i className="fab fa-facebook-f"></i>
                </a>
                <a href="#" className="social-link" aria-label="Instagram">
                  <i className="fab fa-instagram"></i>
                </a>
                <a href="#" className="social-link" aria-label="Google">
                  <i className="fab fa-google"></i>
                </a>
                <a href="#" className="social-link" aria-label="LinkedIn">
                  <i className="fab fa-linkedin-in"></i>
                </a>
              </div>
            </div>

            <div className="footer-col">
              <h4 className="footer-title">Trang Chính</h4>
              <ul className="footer-links">
                <li><Link to="/">Trang chủ</Link></li>
                <li><Link to="/doctors">Bác sĩ</Link></li>
                <li><Link to="/branches">Chi nhánh</Link></li>
                <li><Link to="/appointment">Đặt lịch khám</Link></li>
              </ul>
            </div>

            <div className="footer-col">
              <h4 className="footer-title">Chuyên Khoa</h4>
              <ul className="footer-links">
                <li><Link to="/doctors?departmentId=1">Nội Tổng Quát</Link></li>
                <li><Link to="/doctors?departmentId=2">Thần Kinh</Link></li>
                <li><Link to="/doctors?departmentId=3">Nhi Khoa</Link></li>
                <li><Link to="/doctors?departmentId=4">Sản Phụ Khoa</Link></li>
                <li><Link to="/doctors?departmentId=5">Tim Mạch</Link></li>
                <li><Link to="/doctors?departmentId=6">Da Liễu</Link></li>
              </ul>
            </div>

            <div className="footer-col">
              <h4 className="footer-title">Liên Hệ</h4>
              <ul className="footer-contact">
                <li>
                  <i className="contact-icon">📍</i>
                  <span>123 Đường Nguyễn Huệ, Quận 1, TP.HCM</span>
                </li>
                <li>
                  <i className="contact-icon">📞</i>
                  <span>(028) 3822 1234</span>
                </li>
                <li>
                  <i className="contact-icon">✉️</i>
                  <span>info@benhvien.com</span>
                </li>
                <li>
                  <i className="contact-icon">🕒</i>
                  <span>Thứ Hai - Chủ Nhật: 7:00 - 20:00</span>
                </li>
              </ul>
              <div className="appointment-btn">
                <Link to="/appointment" className="btn btn-primary">Đặt Lịch Ngay</Link>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="footer-bottom">
        <div className="container">
          <div className="copyright">
            <p>© {currentYear} Bệnh Viện. Tất cả các quyền được bảo lưu.</p>
          </div>
          <div className="policy-links">
            <Link to="/privacy">Chính sách bảo mật</Link>
            <Link to="/terms">Điều khoản sử dụng</Link>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer; 