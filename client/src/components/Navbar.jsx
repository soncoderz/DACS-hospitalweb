import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import NotificationBell from './NotificationBell';

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

  // Reset avatar error state when user changes
  useEffect(() => {
    if (user) {
      setAvatarError(false);
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

  const handleAvatarError = () => {
    setAvatarError(true);
  };

  // Display avatar in user menu
  const displayAvatar = () => {
    if (!user) return null;
    
    // Use initials when avatar fails or isn't available
    if (avatarError || (!user.avatarData && !user.avatarUrl)) {
      return (
        <div className="flex items-center justify-center w-10 h-10 rounded-full bg-gradient-to-r from-primary to-primary-dark text-white font-semibold text-sm">
          {getUserInitials()}
        </div>
      );
    }

    // If we have avatar data or URL
      const avatarSrc = user.avatarData || 
      (user.avatarUrl?.startsWith('http') ? user.avatarUrl : `${import.meta.env.VITE_API_URL}${user.avatarUrl}`);
      
      return (
          <img 
            src={avatarSrc}
            alt={user.fullName || 'User'} 
        className="w-10 h-10 rounded-full object-cover border-2 border-primary-light"
            onError={handleAvatarError}
          />
      );
  };

  return (
    <nav className="bg-white shadow-md sticky top-0 z-50">
      <div className="container mx-auto px-4 py-3">
        <div className="flex justify-between items-center">
          {/* Logo */}
          <Link to="/" className="text-primary font-bold text-xl group flex items-center">
            <svg className="w-8 h-8 mr-2 text-primary group-hover:text-primary-dark transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
            <div>
            <span className="text-primary group-hover:text-primary-dark transition-colors">Bệnh Viện</span>
              <span className="text-gray-600 text-sm ml-2 group-hover:text-gray-800 transition-colors block md:inline-block">Chăm Sóc Sức Khỏe</span>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden lg:flex items-center space-x-8">
            <Link to="/" className="text-gray-800 hover:text-primary font-medium transition-colors">
              Trang chủ
            </Link>
            <Link to="/doctors" className="text-gray-800 hover:text-primary font-medium transition-colors">
              Bác sĩ
            </Link>
            <Link to="/specialties" className="text-gray-800 hover:text-primary font-medium transition-colors">
              Chuyên khoa
            </Link>
            <Link to="/services" className="text-gray-800 hover:text-primary font-medium transition-colors">
              Dịch vụ
            </Link>
            <Link to="/branches" className="text-gray-800 hover:text-primary font-medium transition-colors">
              Chi nhánh
            </Link>
            <Link to="/appointment" className="text-white bg-primary hover:bg-primary-dark hover:text-white px-4 py-2 rounded-full font-medium transition-all hover:shadow-md">
              Đặt lịch khám
          </Link>
        </div>

        {/* Mobile menu button */}
          <div className="lg:hidden flex items-center">
            {user && (
              <div className="mr-4">
                <NotificationBell />
              </div>
            )}
            <button 
              type="button" 
              className="text-gray-600 hover:text-primary focus:outline-none"
              onClick={toggleMobileMenu}
              aria-expanded={isMobileMenuOpen}
              aria-label="Toggle menu"
            >
              <div className="relative w-6 h-5 flex flex-col justify-between">
                <span className={`w-full h-0.5 bg-current transform transition-transform duration-300 ${isMobileMenuOpen ? 'rotate-45 translate-y-2' : ''}`}></span>
                <span className={`w-full h-0.5 bg-current transition-opacity duration-300 ${isMobileMenuOpen ? 'opacity-0' : 'opacity-100'}`}></span>
                <span className={`w-full h-0.5 bg-current transform transition-transform duration-300 ${isMobileMenuOpen ? '-rotate-45 -translate-y-2' : ''}`}></span>
              </div>
            </button>
          </div>

          {/* User Auth (desktop) */}
          <div className="hidden lg:flex items-center space-x-4">
            {user ? (
        <div className="flex items-center space-x-4">
              <NotificationBell />
              <div className="relative" ref={userMenuRef}>
                <button 
                  className="flex items-center focus:outline-none"
                  onClick={toggleUserMenu}
                  aria-expanded={isUserMenuOpen}
                >
                  {displayAvatar()}
                </button>
                
                {isUserMenuOpen && (
                    <div className="absolute right-0 mt-3 w-64 bg-white rounded-xl shadow-xl overflow-hidden z-50 border border-gray-100 animate-fadeIn transition-all transform origin-top">
                      <div className="p-4 border-b border-gray-100 bg-gray-50">
                        <p className="text-sm font-bold text-gray-800 mb-1">{user.fullName}</p>
                        <p className="text-xs text-gray-500 truncate mb-1">{user.email}</p>
                        <span className="inline-block text-xs font-medium px-2 py-0.5 rounded-full bg-primary-light text-primary">
                          {user.role === 'admin' ? 'Quản trị viên' : 'Người dùng'}
                        </span>
                    </div>
                      <div className="py-2">
                        <Link to="/profile" className="flex items-center px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 hover:text-primary transition-colors" onClick={() => setIsUserMenuOpen(false)}>
                          <svg className="w-4 h-4 text-gray-500 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                          </svg>
                        Thông tin cá nhân
                      </Link>
                      
                        <Link to="/appointments" className="flex items-center px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 hover:text-primary transition-colors" onClick={() => setIsUserMenuOpen(false)}>
                          <svg className="w-4 h-4 text-gray-500 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                        Lịch hẹn của tôi
                      </Link>
                      
                      {user.role === 'admin' && (
                          <Link to="/admin/dashboard" className="flex items-center px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 hover:text-primary transition-colors" onClick={() => setIsUserMenuOpen(false)}>
                            <svg className="w-4 h-4 text-gray-500 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                          Quản trị hệ thống
                        </Link>
                      )}
                      
                        {user.role === 'doctor' && (
                          <Link to="/doctor/dashboard" className="flex items-center px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 hover:text-primary transition-colors" onClick={() => setIsUserMenuOpen(false)}>
                            <svg className="w-4 h-4 text-gray-500 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                            </svg>
                            Trang bác sĩ
                          </Link>
                        )}
                        
                        <hr className="my-2 border-gray-100" />
                        
                        <button 
                          onClick={handleLogout} 
                          className="w-full flex items-center px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors"
                        >
                          <svg className="w-4 h-4 text-red-500 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                          </svg>
                        Đăng xuất
                      </button>
                    </div>
                  </div>
                )}
              </div>
              </div>
          ) : (
            <>
                <Link to="/auth" className="text-primary border border-primary hover:bg-primary hover:text-white px-4 py-2 rounded-lg transition-colors duration-300">
                  Đăng nhập
                </Link>
                <Link to="/auth?mode=register" className="bg-primary text-white hover:bg-primary-dark hover:text-white px-4 py-2 rounded-lg transition-colors duration-300">
                  Đăng ký
                </Link>
            </>
          )}
          </div>
        </div>

        {/* Mobile menu */}
        <div className={`lg:hidden fixed inset-0 bg-white z-40 transform transition-transform duration-300 ease-in-out ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}`}>
          <div className="flex flex-col h-full">
            <div className="flex justify-between items-center p-4 border-b border-gray-100">
              <Link to="/" className="text-primary font-bold text-xl" onClick={() => setIsMobileMenuOpen(false)}>
                Bệnh Viện
              </Link>
              <button 
                className="text-gray-600 focus:outline-none" 
                onClick={toggleMobileMenu}
              >
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-4">
              {user && (
                <div className="flex items-center p-4 mb-6 bg-gray-50 rounded-xl">
                  <div className="mr-3">{displayAvatar()}</div>
                  <div>
                    <p className="font-medium text-gray-800">{user.fullName}</p>
                    <p className="text-xs text-gray-500">{user.email}</p>
                  </div>
                </div>
              )}
              
              <div className="space-y-3">
                <Link 
                  to="/"
                  className="block px-4 py-3 text-gray-800 hover:bg-gray-50 rounded-lg transition-colors"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Trang chủ
                </Link>
                <Link 
                  to="/doctors"
                  className="block px-4 py-3 text-gray-800 hover:bg-gray-50 rounded-lg transition-colors"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Bác sĩ
                </Link>
                <Link 
                  to="/specialties"
                  className="block px-4 py-3 text-gray-800 hover:bg-gray-50 rounded-lg transition-colors"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Chuyên khoa
                </Link>
                <Link 
                  to="/services"
                  className="block px-4 py-3 text-gray-800 hover:bg-gray-50 rounded-lg transition-colors"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Dịch vụ
                </Link>
                <Link 
                  to="/branches"
                  className="block px-4 py-3 text-gray-800 hover:bg-gray-50 rounded-lg transition-colors"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Chi nhánh
                </Link>
                <Link 
                  to="/appointment"
                  className="block px-4 py-3 text-white bg-primary hover:bg-primary-dark hover:text-white rounded-lg transition-colors"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Đặt lịch khám
                </Link>
                
                {user ? (
                  <div className="border-t border-gray-100 pt-4 mt-4 space-y-3">
                    <Link 
                      to="/profile"
                      className="block px-4 py-3 text-gray-800 hover:bg-gray-50 rounded-lg transition-colors"
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      Thông tin cá nhân
                    </Link>
                    <Link 
                      to="/appointments"
                      className="block px-4 py-3 text-gray-800 hover:bg-gray-50 rounded-lg transition-colors"
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      Lịch hẹn của tôi
                    </Link>
                    
                    {user.role === 'admin' && (
                      <Link 
                        to="/admin/dashboard"
                        className="block px-4 py-3 text-gray-800 hover:bg-gray-50 rounded-lg transition-colors"
                        onClick={() => setIsMobileMenuOpen(false)}
                      >
                        Quản trị hệ thống
                      </Link>
                    )}
                    
                    {user.role === 'doctor' && (
                      <Link 
                        to="/doctor/dashboard"
                        className="block px-4 py-3 text-gray-800 hover:bg-gray-50 rounded-lg transition-colors"
                        onClick={() => setIsMobileMenuOpen(false)}
                      >
                        Trang bác sĩ
                      </Link>
                    )}
                    
                    <button 
                      onClick={handleLogout}
                      className="block w-full text-left px-4 py-3 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      Đăng xuất
                    </button>
                  </div>
                ) : (
                  <div className="border-t border-gray-100 pt-4 mt-4 space-y-3">
                    <Link 
                      to="/auth"
                      className="block px-4 py-3 text-center text-primary border border-primary hover:bg-primary hover:text-white rounded-lg transition-colors"
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      Đăng nhập
                    </Link>
                    <Link 
                      to="/auth?mode=register"
                      className="block px-4 py-3 text-center bg-primary text-white hover:bg-primary-dark hover:text-white rounded-lg transition-colors"
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      Đăng ký
                    </Link>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar; 
