import React, { useState, useEffect } from 'react';
import { Link, useLocation, Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { 
  FaTachometerAlt, FaUsers, FaUserMd, FaHospital, 
  FaFileAlt, FaCalendarAlt, FaPercentage, FaCreditCard,
  FaStar, FaProcedures, FaDoorOpen, FaChartBar, FaSignOutAlt,
  FaClock, FaCog, FaSearch, FaBars, FaTimes,
  FaUserShield, FaLock, FaExclamationTriangle, FaMedkit
} from 'react-icons/fa';
import toast from 'react-hot-toast';

const AdminLayout = ({ children }) => {
  const location = useLocation();
  const { user, logout } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // Define routes accessible by different roles
  const adminRoutes = [
    '/admin/dashboard',
    '/admin/users',
    '/admin/doctors',
    '/admin/doctor-schedules',
    '/admin/hospitals',
    '/admin/specialties',
    '/admin/services',
    '/admin/rooms',
    '/admin/appointments',
    '/admin/coupons',
    '/admin/payments',
    '/admin/reviews',
    '/admin/medications',
    '/admin/news',
  ];

  const doctorRoutes = [
    '/doctor/dashboard',
    '/doctor/appointments',
    '/doctor/patients',
    '/doctor/schedule',
    '/doctor/profile',
  ];

  // Check if user has access to current path
  const hasAccess = () => {
    const path = location.pathname;
    
    if (user?.role === 'admin' || user?.roleType === 'admin') {
      return adminRoutes.some(route => path.startsWith(route));
    }
    
    if (user?.role === 'doctor') {
      return doctorRoutes.some(route => path.startsWith(route));
    }
    
    return false;
  };

  // If user doesn't have access, render unauthorized or redirect
  if (!user) {
    return <Navigate to="/auth" replace />;
  }
  
  // If user is trying to access unauthorized route
  if (!hasAccess()) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen text-center px-4 py-10 bg-gray-50">
        <div className="w-full max-w-md p-8 bg-white rounded-xl shadow-lg">
          <div className="text-red-500 text-5xl mb-4">
            <FaLock className="mx-auto" />
          </div>
          <h1 className="text-2xl font-bold text-gray-800 mb-2">Không có quyền truy cập</h1>
          <p className="text-gray-600 mb-6">
            Bạn không có quyền truy cập vào trang này. 
            {user.role === 'admin' && (
              <span> Vui lòng quay lại trang quản trị.</span>
            )}
            {user.role === 'doctor' && (
              <span> Vui lòng quay lại trang bác sĩ.</span>
            )}
          </p>
          <div className="flex space-x-3 justify-center">
            {user.role === 'admin' && (
              <Link 
                to="/admin/dashboard" 
                className="inline-block px-6 py-3 bg-blue-600 text-white font-medium rounded-lg shadow-md hover:bg-blue-700 transition-colors duration-200"
              >
                <FaUserShield className="inline mr-2" />
                Về trang quản trị
              </Link>
            )}
            {user.role === 'doctor' && (
              <Link 
                to="/doctor/dashboard" 
                className="inline-block px-6 py-3 bg-green-600 text-white font-medium rounded-lg shadow-md hover:bg-green-700 transition-colors duration-200"
              >
                <FaUserMd className="inline mr-2" />
                Về trang bác sĩ
              </Link>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Check if current user is admin 
  const isAdmin = user && (user.roleType === 'admin' || user.role === 'admin');

  // Only show admin navigation if user is admin
  const navItems = isAdmin ? [
    { path: '/admin/dashboard', label: 'Tổng quan', icon: <FaTachometerAlt /> },
    { path: '/admin/users', label: 'Người dùng', icon: <FaUsers /> },
    { path: '/admin/doctors', label: 'Bác sĩ', icon: <FaUserMd /> },
    { path: '/admin/doctor-schedules', label: 'Lịch bác sĩ', icon: <FaClock /> },
    { path: '/admin/hospitals', label: 'Cơ sở y tế', icon: <FaHospital /> },
    { path: '/admin/specialties', label: 'Chuyên khoa', icon: <FaFileAlt /> },
    { path: '/admin/services', label: 'Dịch vụ', icon: <FaProcedures /> },
    { path: '/admin/rooms', label: 'Phòng', icon: <FaDoorOpen /> },
    { path: '/admin/medications', label: 'Quản lý thuốc', icon: <FaMedkit /> },
    { path: '/admin/appointments', label: 'Lịch hẹn', icon: <FaCalendarAlt /> },
    { path: '/admin/coupons', label: 'Mã giảm giá', icon: <FaPercentage /> },
    { path: '/admin/payments', label: 'Thanh toán', icon: <FaCreditCard /> },
    { path: '/admin/reviews', label: 'Đánh giá', icon: <FaStar /> },
    { path: '/admin/news', label: 'Tin tức', icon: <FaFileAlt /> },
  ] : [];

  // Group the navigation items for admin
  const groupedNavItems = {
    main: [navItems[0]], // Dashboard
    users: navItems.length > 2 ? [navItems[1], navItems[2]] : [], // Users, Doctors
    scheduling: navItems.length > 9 ? [navItems[3], navItems[9]] : [], // Doctor schedules, Appointments
    facilities: navItems.length > 8 ? [navItems[4], navItems[5], navItems[6], navItems[7], navItems[8]] : [], // Hospitals, Specialties, Services, Rooms, Medications
    business: navItems.length > 13 ? [navItems[10], navItems[11], navItems[12], navItems[13]] : [] // Coupons, Payments, Reviews, News
  };

  // Get the current page name for header
  const getCurrentPageName = () => {
    const currentPath = location.pathname;
    const matchedItem = navItems.find(item => item.path === currentPath);
    return matchedItem?.label || 'Tổng quan';
  };

  // Header user dropdown section
  const headerUserSection = (
    <div className="relative" id="header-user-menu">
      <button 
        className="flex text-sm rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 items-center"
        aria-expanded="false"
        aria-haspopup="true"
      >
        <span className="sr-only">Open user menu</span>
        <div className="h-8 w-8 rounded-full bg-gradient-to-r from-blue-600 to-violet-600 flex items-center justify-center text-white font-medium">
          {user?.fullName?.charAt(0) || 'U'}
        </div>
        <span className="ml-2 text-sm font-medium text-gray-700 hidden sm:block">
          {user?.fullName?.split(' ').slice(-1)[0] || 'User'}
        </span>
        <svg className="ml-1 w-4 h-4 text-gray-500 hidden sm:block" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
          <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
        </svg>
      </button>
    </div>
  );

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Mobile sidebar backdrop */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 z-20 bg-black bg-opacity-50 transition-opacity lg:hidden backdrop-blur-sm"
          onClick={() => setSidebarOpen(false)}
        ></div>
      )}

      {/* Sidebar */}
      <aside className={`fixed inset-y-0 left-0 z-30 w-72 transform bg-gradient-to-br from-blue-900 to-blue-800 transition duration-300 ease-in-out flex flex-col lg:static lg:translate-x-0 ${
        sidebarOpen ? 'translate-x-0 shadow-xl' : '-translate-x-full'
      }`}>
        {/* Logo */}
        <div className="flex items-center justify-between h-16 px-6 bg-blue-950/50 flex-shrink-0 border-b border-blue-700/50">
          <Link to="/" className="flex items-center space-x-3 text-white">
            <FaHospital className="text-2xl text-blue-300" />
            <span className="text-xl font-bold tracking-wide">Admin Portal</span>
          </Link>
          <button 
            className="p-1.5 text-white rounded-full hover:bg-blue-800/50 lg:hidden transition-all duration-200" 
            onClick={() => setSidebarOpen(false)}
          >
            <FaTimes className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation - Scrollable area */}
        <div className="flex-1 flex flex-col overflow-hidden">
          <div className="flex-1 overflow-y-auto py-4 px-2 custom-scrollbar">
            {/* Main */}
            <div className="px-2 mb-6">
              <h3 className="px-4 text-xs font-semibold text-blue-300 uppercase tracking-wider mb-2">
                Tổng quan
              </h3>
              <div className="mt-1 space-y-1">
                {groupedNavItems.main.map((item, index) => (
                  <Link 
                    key={index}
                    to={item.path} 
                    className={`flex items-center px-4 py-3 text-sm rounded-lg transition-all ${
                      location.pathname === item.path
                        ? 'bg-white/10 text-white font-medium shadow-sm'
                        : 'text-blue-100 hover:bg-white/5 hover:text-white'
                    }`}
                  >
                    <span className={`mr-3 ${location.pathname === item.path ? 'text-blue-300' : ''}`}>{item.icon}</span>
                    <span>{item.label}</span>
                  </Link>
                ))}
              </div>
            </div>

            {/* Users */}
            {groupedNavItems.users.length > 0 && (
              <div className="px-2 mb-6">
                <h3 className="px-4 text-xs font-semibold text-blue-300 uppercase tracking-wider mb-2">
                  Người dùng
                </h3>
                <div className="mt-1 space-y-1">
                  {groupedNavItems.users.map((item, index) => (
                    <Link 
                      key={index}
                      to={item.path} 
                      className={`flex items-center px-4 py-3 text-sm rounded-lg transition-all ${
                        location.pathname === item.path
                          ? 'bg-white/10 text-white font-medium shadow-sm'
                          : 'text-blue-100 hover:bg-white/5 hover:text-white'
                      }`}
                    >
                      <span className={`mr-3 ${location.pathname === item.path ? 'text-blue-300' : ''}`}>{item.icon}</span>
                      <span>{item.label}</span>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* Scheduling */}
            {groupedNavItems.scheduling.length > 0 && (
              <div className="px-2 mb-6">
                <h3 className="px-4 text-xs font-semibold text-blue-300 uppercase tracking-wider mb-2">
                  Lịch và hẹn
                </h3>
                <div className="mt-1 space-y-1">
                  {groupedNavItems.scheduling.map((item, index) => (
                    <Link 
                      key={index}
                      to={item.path} 
                      className={`flex items-center px-4 py-3 text-sm rounded-lg transition-all ${
                        location.pathname === item.path
                          ? 'bg-white/10 text-white font-medium shadow-sm'
                          : 'text-blue-100 hover:bg-white/5 hover:text-white'
                      }`}
                    >
                      <span className={`mr-3 ${location.pathname === item.path ? 'text-blue-300' : ''}`}>{item.icon}</span>
                      <span>{item.label}</span>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* Facilities */}
            {groupedNavItems.facilities.length > 0 && (
              <div className="px-2 mb-6">
                <h3 className="px-4 text-xs font-semibold text-blue-300 uppercase tracking-wider mb-2">
                  Cơ sở vật chất
                </h3>
                <div className="mt-1 space-y-1">
                  {groupedNavItems.facilities.map((item, index) => (
                    <Link 
                      key={index}
                      to={item.path} 
                      className={`flex items-center px-4 py-3 text-sm rounded-lg transition-all ${
                        location.pathname === item.path
                          ? 'bg-white/10 text-white font-medium shadow-sm'
                          : 'text-blue-100 hover:bg-white/5 hover:text-white'
                      }`}
                    >
                      <span className={`mr-3 ${location.pathname === item.path ? 'text-blue-300' : ''}`}>{item.icon}</span>
                      <span>{item.label}</span>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* Business */}
            {groupedNavItems.business.length > 0 && (
              <div className="px-2 mb-6">
                <h3 className="px-4 text-xs font-semibold text-blue-300 uppercase tracking-wider mb-2">
                  Kinh doanh
                </h3>
                <div className="mt-1 space-y-1 pb-16">
                  {groupedNavItems.business.map((item, index) => (
                    <Link 
                      key={index}
                      to={item.path} 
                      className={`flex items-center px-4 py-3 text-sm rounded-lg transition-all ${
                        location.pathname === item.path
                          ? 'bg-white/10 text-white font-medium shadow-sm'
                          : 'text-blue-100 hover:bg-white/5 hover:text-white'
                      }`}
                    >
                      <span className={`mr-3 ${location.pathname === item.path ? 'text-blue-300' : ''}`}>{item.icon}</span>
                      <span>{item.label}</span>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* User profile - Fixed at bottom */}
        <div className="flex-shrink-0 bg-blue-950/50 border-t border-blue-700/50 p-4 w-full">
          <div className="flex items-center space-x-3">
            <div className="relative">
              <div className="flex items-center justify-center w-10 h-10 rounded-full bg-gradient-to-r from-blue-500 to-blue-600 text-white text-sm font-semibold">
                {user.fullName?.charAt(0) || user.firstName?.charAt(0) || 'A'}
              </div>
              <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-blue-900 rounded-full"></span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate">{user.fullName || 'Admin'}</p>
              <p className="text-xs text-blue-300 truncate">{user.email}</p>
            </div>
            <button 
              onClick={logout}
              className="p-1.5 rounded-full hover:bg-blue-800/50 transition-colors"
              title="Đăng xuất"
            >
              <FaSignOutAlt className="text-blue-300 hover:text-white w-5 h-5" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-x-hidden">
        {/* Header */}
        <header className="w-full h-16 bg-white shadow-sm flex items-center justify-between px-6 flex-shrink-0 z-10">
          <div className="flex items-center">
            <button 
              onClick={() => setSidebarOpen(true)} 
              className="text-gray-600 hover:text-blue-600 lg:hidden focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500 p-1.5 rounded-md"
            >
              <span className="sr-only">Open sidebar</span>
              <FaBars className="h-6 w-6" />
            </button>
            <h1 className="ml-3 lg:ml-0 text-lg md:text-xl font-semibold text-gray-800">{getCurrentPageName()}</h1>
          </div>

          <div className="flex items-center space-x-4">
            <div className="flex-1 max-w-xs md:max-w-md">
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FaSearch className="h-4 w-4 text-gray-400" />
                </div>
                <input
                  type="text"
                  className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm transition duration-150 ease-in-out"
                  placeholder="Tìm kiếm..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>

            <div className="flex items-center">
              {/* User dropdown */}
              {headerUserSection}

              {/* Logout button */}
              <button 
                onClick={logout}
                className="ml-4 p-2 rounded-full text-gray-500 hover:text-red-500 hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors"
                title="Đăng xuất"
              >
                <FaSignOutAlt className="h-5 w-5" />
              </button>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-50 p-4 md:p-6">
          <div className="max-w-7xl mx-auto">
            {/* Page header */}
            <div className="mb-6 bg-white p-6 rounded-lg shadow-sm border border-gray-100">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-2xl font-semibold text-gray-800">
                    {getCurrentPageName()}
                  </h1>
                  <p className="text-sm text-gray-600 mt-1">
                    {user.role === 'admin' && "Quản lý hệ thống y tế"}
                    {user.role === 'doctor' && "Quản lý lịch và bệnh nhân"}
                  </p>
                </div>
                
                {/* Optional: Add quick actions here if needed */}
              </div>
            </div>

            {/* Page content */}
            <div className="bg-transparent">
              {children}
            </div>
          </div>
        </main>

        {/* Footer */}
        <footer className="bg-white px-6 py-4 border-t border-gray-200 mt-auto">
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-600">
              © {new Date().getFullYear()} Bệnh Viện 
            </p>
            <p className="text-sm text-gray-500">
              Version 1.0.0
            </p>
          </div>
        </footer>
      </div>
    </div>
  );
};

// Add custom scrollbar style
const style = document.createElement('style');
style.textContent = `
  .custom-scrollbar::-webkit-scrollbar {
    width: 4px;
  }
  
  .custom-scrollbar::-webkit-scrollbar-track {
    background: rgba(0, 0, 0, 0.1);
  }
  
  .custom-scrollbar::-webkit-scrollbar-thumb {
    background: rgba(255, 255, 255, 0.2);
    border-radius: 4px;
  }
  
  .custom-scrollbar::-webkit-scrollbar-thumb:hover {
    background: rgba(255, 255, 255, 0.3);
  }
`;
document.head.appendChild(style);

export default AdminLayout;