import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getHomeRouteForRole } from '../utils/roleUtils';

const Navbar = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const userMenuRef = useRef(null);
  const [avatarError, setAvatarError] = useState(false);

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const toggleUserMenu = () => {
    setIsUserMenuOpen(!isUserMenuOpen);
  };

  const handleLogout = () => {
    logout();
    navigate('/');
    setIsMobileMenuOpen(false);
    setIsUserMenuOpen(false);
  };

  // Log user data when it changes (only in development)
  useEffect(() => {
    if (user && process.env.NODE_ENV === 'development') {
      console.log("Navbar received user:", user);
      console.log("Avatar URL:", user.avatarUrl || "No avatar provided");
      console.log("Avatar Data:", user.avatarData ? "Avatar data present" : "No avatar data");
    }
  }, [user]);

  // Click outside to close user menu
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target)) {
        setIsUserMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Get user initials for avatar fallback
  const getUserInitials = () => {
    if (!user || !user.fullName) return "U";
    
    const nameParts = user.fullName.split(" ");
    if (nameParts.length > 1) {
      return `${nameParts[0][0]}${nameParts[nameParts.length - 1][0]}`.toUpperCase();
    }
    return nameParts[0][0].toUpperCase();
  };

  const handleAvatarError = (e) => {
    console.log("Avatar image failed to load");
    setAvatarError(true);
    // Prevent infinite error loops by removing the src attribute
    if (e && e.target) {
      e.target.onerror = null;
    }
  };

  // Get role-specific dashboard link
  const getDashboardLink = () => {
    if (!user) return '/';
    return getHomeRouteForRole(user);
  };

  // Check if user has admin role
  const isAdmin = user?.roleType === 'admin';
  // Check if user has doctor role
  const isDoctor = user?.roleType === 'doctor';

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
            
            {/* Show different links based on user role */}
            {isAdmin && (
              <li className="nav-item">
                <Link to="/admin/dashboard" className="nav-link" onClick={() => setIsMobileMenuOpen(false)}>
                  Quản trị
                </Link>
              </li>
            )}
            
            {isDoctor && (
              <li className="nav-item">
                <Link to="/doctor/dashboard" className="nav-link" onClick={() => setIsMobileMenuOpen(false)}>
                  Bảng điều khiển
                </Link>
              </li>
            )}
            
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
                <div className="user-menu" ref={userMenuRef}>
                  <button 
                    className="user-avatar-button" 
                    onClick={toggleUserMenu}
                    aria-expanded={isUserMenuOpen}
                  >
                    {user && (user.avatarData || user.avatarUrl) && !avatarError ? (
                      <img 
                        src={user.avatarData || `${import.meta.env.VITE_API_URL.replace('/api', '')}${user.avatarUrl}`} 
                        alt={user.fullName || 'User'} 
                        className="user-avatar"
                        onError={handleAvatarError}
                      />
                    ) : (
                      <div className="user-avatar-fallback">
                        {getUserInitials()}
                      </div>
                    )}
                  </button>
                  
                  {isUserMenuOpen && (
                    <div className="user-dropdown">
                      <div className="user-dropdown-header">
                        <p className="user-name">{user.fullName}</p>
                        <p className="user-email">{user.email}</p>
                        <p className="user-role">{user.roleType === 'admin' ? 'Quản trị viên' : user.roleType === 'doctor' ? 'Bác sĩ' : 'Người dùng'}</p>
                      </div>
                      <div className="user-dropdown-menu">
                        <Link to="/profile" className="dropdown-item" onClick={() => setIsUserMenuOpen(false)}>
                          <i className="fas fa-user icon-user"></i>
                          Thông tin cá nhân
                        </Link>
                        
                        {/* Menu items based on role */}
                        {isAdmin && (
                          <Link to="/admin/dashboard" className="dropdown-item" onClick={() => setIsUserMenuOpen(false)}>
                            <i className="fas fa-user-cog icon-admin"></i>
                            Quản trị hệ thống
                          </Link>
                        )}
                        
                        {isDoctor && (
                          <Link to="/doctor/appointments" className="dropdown-item" onClick={() => setIsUserMenuOpen(false)}>
                            <i className="fas fa-calendar-check icon-appointments"></i>
                            Lịch hẹn bác sĩ
                          </Link>
                        )}
                        
                        {/* For regular users or all roles */}
                        <Link to="/appointments" className="dropdown-item" onClick={() => setIsUserMenuOpen(false)}>
                          <i className="fas fa-calendar-alt icon-calendar"></i>
                          Lịch hẹn của tôi
                        </Link>
                        
                        <Link to="/settings" className="dropdown-item" onClick={() => setIsUserMenuOpen(false)}>
                          <i className="fas fa-cog icon-settings"></i>
                          Cài đặt
                        </Link>
                        <button onClick={handleLogout} className="dropdown-item logout-button">
                          <i className="fas fa-sign-out-alt icon-logout"></i>
                          Đăng xuất
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <>
                <Link to="/auth" className="btn btn-outline btn-sm" onClick={() => setIsMobileMenuOpen(false)}>Đăng nhập</Link>
                <Link to="/auth?mode=register" className="btn btn-primary btn-sm" onClick={() => setIsMobileMenuOpen(false)}>Đăng ký</Link>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar; 