import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { 
  FaCalendarAlt, FaUserInjured, FaClipboardList, 
  FaUserMd, FaClock, FaSignOutAlt, FaChartLine, 
  FaTachometerAlt, FaCommentMedical,
  FaBars, FaTimes
} from 'react-icons/fa';

const DoctorLayout = ({ children }) => {
  const location = useLocation();
  const { user, logout } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  if (!user || (user.roleType !== 'doctor' && user.role !== 'doctor')) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen text-center px-4 py-10 bg-gray-50">
        <div className="w-full max-w-md p-8 bg-white rounded-xl shadow-lg transform transition-all">
          <div className="text-red-500 text-5xl mb-6">
            <FaUserMd className="mx-auto animate-pulse" />
          </div>
          <h1 className="text-2xl font-bold text-gray-800 mb-3">Không có quyền truy cập</h1>
          <p className="text-gray-600 mb-8">Bạn cần đăng nhập với tài khoản bác sĩ để truy cập trang này.</p>
          <Link 
            to="/auth" 
            className="inline-block w-full px-6 py-3.5 bg-gradient-to-r from-primary to-blue-600 text-white font-medium rounded-lg shadow-md hover:from-blue-600 hover:to-primary transition-all duration-300"
          >
            Đăng nhập
          </Link>
        </div>
      </div>
    );
  }

  const navItems = [
    { path: '/doctor/dashboard', label: 'Tổng quan', icon: <FaTachometerAlt /> },
    { path: '/doctor/appointments', label: 'Lịch hẹn', icon: <FaCalendarAlt /> },
    { path: '/doctor/patients', label: 'Bệnh nhân', icon: <FaUserInjured /> },
    { path: '/doctor/schedule', label: 'Quản lý lịch trực', icon: <FaClock /> },
    { path: '/doctor/medical-records', label: 'Hồ sơ y tế', icon: <FaClipboardList /> },
    { path: '/doctor/reviews', label: 'Đánh giá', icon: <FaCommentMedical /> },
    { path: '/doctor/profile', label: 'Hồ sơ cá nhân', icon: <FaUserMd /> },
  ];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] min-h-screen bg-gray-50">
      {/* Mobile sidebar backdrop */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-30 lg:hidden backdrop-blur-sm" 
          onClick={toggleSidebar}
        ></div>
      )}

      {/* Sidebar */}
      <aside className={`bg-gradient-to-br from-primary via-blue-600 to-primary-dark text-white flex flex-col fixed lg:sticky top-0 z-40 h-screen w-[280px] shadow-xl transition-all duration-300 transform ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>
        {/* Logo/Brand */}
        <div className="px-6 py-8 border-b border-white/20">
          <Link to="/" className="flex items-center space-x-3 transition-transform hover:scale-105">
            <div className="bg-white/20 p-2 rounded-lg backdrop-blur-sm">
              <FaUserMd className="text-2xl text-white" />
            </div>
            <h2 className="text-xl font-bold tracking-wide">Doctor Portal</h2>
          </Link>
        </div>

        {/* Navigation */}
        <nav className="flex-1 py-6 px-4 overflow-y-auto scrollbar-thin scrollbar-thumb-white/20 scrollbar-track-transparent">
          <ul className="space-y-2">
            {navItems.map((item, index) => (
              <li key={index}>
                <Link 
                  to={item.path} 
                  className={`flex items-center space-x-3 px-4 py-3.5 rounded-xl transition-all duration-200 group ${
                    location.pathname === item.path
                      ? 'bg-white/15 text-white font-medium shadow-sm backdrop-blur-sm'
                      : 'text-white/80 hover:bg-white/10 hover:text-white'
                  }`}
                  onClick={() => setSidebarOpen(false)}
                >
                  <span className={`text-lg ${location.pathname === item.path ? 'text-white' : 'text-white/80 group-hover:text-white'}`}>{item.icon}</span>
                  <span>{item.label}</span>
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        {/* Mobile close button */}
        <button 
          className="absolute top-4 right-4 p-1 rounded-full bg-white/20 text-white lg:hidden"
          onClick={toggleSidebar}
        >
          <FaTimes className="text-lg" />
        </button>

        {/* User profile & logout */}
        <div className="border-t border-white/20 p-4">
          <div className="flex items-center space-x-3 mb-4 p-3 bg-white/10 rounded-xl backdrop-blur-sm">
            <div className="relative">
              <img 
                src={user.avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.fullName || 'Doctor')}&background=1AC0FF&color=fff`} 
                alt={user.fullName}
                className="w-10 h-10 rounded-full border-2 border-white/30 object-cover shadow-md"
                onError={(e) => {
                  e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(user.fullName || 'Doctor')}&background=1AC0FF&color=fff`;
                }}
              />
              <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-primary rounded-full"></span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate">{user.fullName || 'Bác sĩ'}</p>
              <p className="text-xs text-white/70 truncate">{user.email}</p>
            </div>
          </div>
          <button 
            onClick={logout}
            className="w-full flex items-center justify-center space-x-2 px-4 py-3 rounded-xl bg-white/10 text-white hover:bg-white/20 active:bg-white/30 transition-all duration-200"
          >
            <FaSignOutAlt />
            <span>Đăng xuất</span>
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex flex-col min-h-screen">
        {/* Header */}
        <header className="bg-white shadow-sm border-b border-gray-200 px-4 sm:px-6 py-4 sticky top-0 z-20">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              {/* Mobile menu toggle button */}
              <button 
                className="p-2 mr-3 rounded-lg text-gray-600 hover:bg-gray-100 lg:hidden"
                onClick={toggleSidebar}
              >
                <FaBars className="text-xl" />
              </button>
              <h1 className="text-xl font-semibold text-gray-800 hidden sm:block">
                {navItems.find(item => item.path === location.pathname)?.label || 'Dashboard'}
              </h1>
            </div>
            <div className="flex items-center space-x-4">
              <div className="hidden md:block">
                <div className="flex items-center space-x-3 py-1 px-3 bg-gray-100 rounded-full">
                  <img 
                    src={user.avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.fullName || 'Doctor')}&background=1AC0FF&color=fff`} 
                    alt={user.fullName}
                    className="w-8 h-8 rounded-full border border-primary/20"
                  />
                  <span className="text-sm font-medium text-gray-700">{user.fullName || 'Bác sĩ'}</span>
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Content area */}
        <div className="flex-1 p-4 sm:p-6 overflow-auto bg-gray-50">
          <div className="max-w-7xl mx-auto">{children}</div>
        </div>

        {/* Footer */}
        <footer className="bg-gradient-to-r from-gray-100 to-gray-200 border-t border-gray-200 py-6 text-center text-gray-600 text-sm">
          <div className="container mx-auto px-4">
            <p className="flex items-center justify-center flex-wrap">
              <span>© {new Date().getFullYear()} Bệnh Viện</span>
              <span className="mx-2 hidden sm:block">•</span>
              <span>All rights reserved.</span>
            </p>
          </div>
        </footer>
      </main>
    </div>
  );
};

export default DoctorLayout; 
