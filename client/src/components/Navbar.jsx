import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getHomeRouteForRole } from '../utils/roleUtils';
import '../styles/navbar.css';

// Avatar placeholder URL
const DEFAULT_AVATAR = 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyMDAgMjAwIj48cmVjdCB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgZmlsbD0iIzNiODJmNiIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBkb21pbmFudC1iYXNlbGluZT0ibWlkZGxlIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBmb250LWZhbWlseT0ic2Fucy1zZXJpZiIgZm9udC1zaXplPSI4NHB4IiBmb250LXdlaWdodD0iYm9sZCIgZmlsbD0id2hpdGUiPlU8L3RleHQ+PC9zdmc+';

const Navbar = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const userMenuRef = useRef(null);
  const [avatarError, setAvatarError] = useState(false);

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
    // Close user menu if it's open when toggling mobile menu
    if (isUserMenuOpen) {
      setIsUserMenuOpen(false);
    }
  };

  const toggleUserMenu = (e) => {
    if (e) {
      e.preventDefault(); // Prevent default action
      e.stopPropagation(); // Stop event propagation
    }
    
    // Force it to the opposite state
    setIsUserMenuOpen(prev => !prev);
  };

  const handleLogout = () => {
    logout();
    navigate('/');
    setIsMobileMenuOpen(false);
    setIsUserMenuOpen(false);
  };

  // Close menus when route changes
  useEffect(() => {
    return () => {
      setIsMobileMenuOpen(false);
      setIsUserMenuOpen(false);
    };
  }, [navigate]);

  // Function to get formatted role display name
  const getRoleDisplayName = (roleType) => {
    switch(roleType) {
      case 'admin':
        return 'Quản trị viên';
      case 'doctor':
        return 'Bác sĩ';
      default:
        return 'Bệnh nhân';
    }
  };

  // Log user data when it changes (only in development)
  useEffect(() => {
    // Tắt log Avatar URL mặc định
    // Chỉ log nếu VITE_DEBUG_AVATAR được bật
    const shouldLog = process.env.NODE_ENV === 'development' && 
                      import.meta && 
                      import.meta.env && 
                      import.meta.env.VITE_DEBUG_AVATAR === 'true';
    
    if (user && shouldLog) {
      console.log("Navbar received user:", user);
      console.log("Avatar URL:", user.avatarUrl || "No avatar provided");
      
      // Debug URL construction
      if (user.avatarUrl && user.avatarUrl.startsWith('/uploads')) {
        const serverBaseUrl = 'http://localhost:5000';
        const fullUrl = `${serverBaseUrl}${user.avatarUrl}`;
        console.log("Full avatar URL:", fullUrl);
      }
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

  // Effect to check if menu is actually showing when state changes
  useEffect(() => {
    console.log('User menu open state changed to:', isUserMenuOpen);
  }, [isUserMenuOpen]);

  // Function to get user initials for avatar fallback
  const getUserInitials = (name) => {
    if (!name) return "U";
    return name
      .split(" ")
      .map(part => part[0])
      .join("")
      .substring(0, 2)
      .toUpperCase();
  };

  // Function to format avatar URL
  const getAvatarUrl = (avatarPath) => {
    if (!avatarPath) {
      return DEFAULT_AVATAR;
    }
    
    try {
      // If it's a data URL
      if (avatarPath.startsWith('data:')) {
        return avatarPath;
      }
      
      // If it's a server path
      if (avatarPath.startsWith('/uploads')) {
        // Server port is 5000 from .env file
        const serverBaseUrl = 'http://localhost:5000';
        const fullUrl = `${serverBaseUrl}${avatarPath}`;
        return fullUrl;
      }
      
      // Return original path for external URLs
      return avatarPath;
    } catch (error) {
      console.error("Error getting avatar URL:", error);
      return DEFAULT_AVATAR;
    }
  };

  // Hàm xử lý lỗi khi load ảnh avatar
  const handleAvatarError = (e) => {
    // Tắt error log mặc định
    // Chỉ log nếu cần thiết
    if (process.env.NODE_ENV === 'development' && 
        import.meta && 
        import.meta.env && 
        import.meta.env.VITE_DEBUG_AVATAR === 'true') {
      console.error("Avatar image failed to load, using default");
    }
    
    // Gán lại src là ảnh mặc định
    if (e && e.target) {
      e.target.onerror = null; // Ngăn vòng lặp vô hạn
      e.target.src = DEFAULT_AVATAR;
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
              <div className="user-menu" ref={userMenuRef}>
                <button 
                  className="user-avatar-button" 
                  onClick={toggleUserMenu}
                  aria-expanded={isUserMenuOpen}
                  type="button"
                >
                  {user && user.avatarUrl ? (
                    <img 
                      src={getAvatarUrl(user.avatarUrl)} 
                      alt={user.fullName || 'User'} 
                      className="user-avatar"
                      onError={handleAvatarError}
                    />
                  ) : (
                    <div className="user-avatar-fallback">
                      {getUserInitials(user.fullName)}
                    </div>
                  )}
                  <span className="user-avatar-text">
                    {user.fullName} <i className="fas fa-chevron-down"></i>
                  </span>
                </button>
                
                <div className={`user-dropdown ${isUserMenuOpen ? 'open' : ''}`}>
                  <div className="user-dropdown-header">
                    <h4 className="user-name">{user.fullName}</h4>
                    <p className="user-email">{user.email}</p>
                    <span className="user-role">{getRoleDisplayName(user.roleType)}</span>
                  </div>
                  <div className="user-dropdown-menu">
                    <Link to="/profile" className="dropdown-item" onClick={() => {setIsUserMenuOpen(false); setIsMobileMenuOpen(false);}}>
                      <i className="fas fa-user"></i>
                      Thông tin cá nhân
                    </Link>
                    {user.roleType === 'admin' && (
                      <Link to="/admin/dashboard" className="dropdown-item" onClick={() => {setIsUserMenuOpen(false); setIsMobileMenuOpen(false);}}>
                        <i className="fas fa-tachometer-alt"></i>
                        Quản trị hệ thống
                      </Link>
                    )}
                    {user.roleType === 'doctor' && (
                      <Link to="/doctor/dashboard" className="dropdown-item" onClick={() => {setIsUserMenuOpen(false); setIsMobileMenuOpen(false);}}>
                        <i className="fas fa-stethoscope"></i>
                        Bảng điều khiển
                      </Link>
                    )}
                    <Link to="/appointments" className="dropdown-item" onClick={() => {setIsUserMenuOpen(false); setIsMobileMenuOpen(false);}}>
                      <i className="fas fa-calendar-alt"></i>
                      Lịch hẹn
                    </Link>
                    <Link to="/settings" className="dropdown-item" onClick={() => {setIsUserMenuOpen(false); setIsMobileMenuOpen(false);}}>
                      <i className="fas fa-cog"></i>
                      Cài đặt
                    </Link>
                    <button 
                      className="dropdown-item logout-button" 
                      onClick={handleLogout}
                    >
                      <i className="fas fa-sign-out-alt"></i>
                      Đăng xuất
                    </button>
                  </div>
                </div>
              </div>
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