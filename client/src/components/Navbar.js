import React, { useState } from 'react';
import { Link } from 'react-router-dom';

const Navbar = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  return (
    <nav className="navbar">
      <div className="container flex justify-between items-center">
        <div className="navbar-brand">
          <Link to="/" className="logo">
            <span className="logo-hospital">Bệnh Viện</span>
            <span className="logo-tagline">Chăm Sóc Sức Khỏe Toàn Diện</span>
          </Link>
        </div>

        {/* Mobile menu button */}
        <div className="mobile-menu-btn" onClick={toggleMobileMenu}>
          <span className={`hamburger ${isMobileMenuOpen ? 'open' : ''}`}></span>
        </div>

        {/* Navigation Menu */}
        <div className={`navbar-menu ${isMobileMenuOpen ? 'open' : ''}`}>
          <ul className="navbar-nav">
            <li className="nav-item">
              <Link to="/" className="nav-link">Trang chủ</Link>
            </li>
            <li className="nav-item">
              <Link to="/doctors" className="nav-link">Bác sĩ</Link>
            </li>
            <li className="nav-item">
              <Link to="/branches" className="nav-link">Chi nhánh</Link>
            </li>
            <li className="nav-item">
              <Link to="/appointment" className="nav-link appointment-link">Đặt lịch khám</Link>
            </li>
          </ul>

          {/* Auth Buttons */}
          <div className="auth-buttons">
            <Link to="/login" className="btn btn-outline btn-sm">Đăng nhập</Link>
            <Link to="/register" className="btn btn-primary btn-sm">Đăng ký</Link>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar; 