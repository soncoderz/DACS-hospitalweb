import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Navbar = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const handleLogout = () => {
    logout();
    navigate('/');
    setIsMobileMenuOpen(false);
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
              <Link to="/" className="nav-link" onClick={() => setIsMobileMenuOpen(false)}>Trang chủ</Link>
            </li>
            <li className="nav-item">
              <Link to="/doctors" className="nav-link" onClick={() => setIsMobileMenuOpen(false)}>Bác sĩ</Link>
            </li>
            <li className="nav-item">
              <Link to="/branches" className="nav-link" onClick={() => setIsMobileMenuOpen(false)}>Chi nhánh</Link>
            </li>
            <li className="nav-item">
              <Link to="/appointment" className="nav-link appointment-link" onClick={() => setIsMobileMenuOpen(false)}>Đặt lịch khám</Link>
            </li>
          </ul>

          {/* Auth Buttons */}
          <div className="auth-buttons">
            {user ? (
              <>
                <div className="user-menu">
                  <button className="user-menu-button">
                    Xin chào, {user.firstName}
                    <i className="dropdown-icon"></i>
                  </button>
                  <div className="user-dropdown">
                    <Link to="/profile" className="dropdown-item" onClick={() => setIsMobileMenuOpen(false)}>Hồ sơ</Link>
                    <Link to="/appointments" className="dropdown-item" onClick={() => setIsMobileMenuOpen(false)}>Lịch khám</Link>
                    <Link to="/medical-records" className="dropdown-item" onClick={() => setIsMobileMenuOpen(false)}>Hồ sơ y tế</Link>
                    <button onClick={handleLogout} className="dropdown-item logout-button">Đăng xuất</button>
                  </div>
                </div>
              </>
            ) : (
              <>
                <Link to="/login" className="btn btn-outline btn-sm" onClick={() => setIsMobileMenuOpen(false)}>Đăng nhập</Link>
                <Link to="/register" className="btn btn-primary btn-sm" onClick={() => setIsMobileMenuOpen(false)}>Đăng ký</Link>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar; 