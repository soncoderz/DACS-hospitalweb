import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import Login from './Login';
import Register from './Register';

const Auth = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [isRegisterMode, setIsRegisterMode] = useState(searchParams.get('mode') === 'register');

  useEffect(() => {
    setIsRegisterMode(searchParams.get('mode') === 'register');
  }, [searchParams]);

  const toggleMode = () => {
    const newMode = !isRegisterMode;
    navigate(`/auth?mode=${newMode ? 'register' : 'login'}`, { replace: true });
    setIsRegisterMode(newMode);
  };

  return (
    <div className="min-h-screen w-full relative">
      {/* Background decoration */}
      <div className="absolute inset-0 z-0">
        {/* Main background image option */}
        <div className="absolute inset-0 bg-cover bg-center bg-no-repeat"
             style={{ backgroundImage: 'url(https://img.freepik.com/free-photo/doctor-with-stethoscope-hands-hospital-background_1423-1.jpg)' }}>
          {/* Overlay to darken and improve contrast */}
          <div className="absolute inset-0 bg-blue-900/40 backdrop-blur-[2px]"></div>
        </div>
      
        {/* Decorative elements */}
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
          {/* Top left decoration */}
          <div className="absolute top-0 left-0 w-96 h-96 bg-blue-300 rounded-full mix-blend-multiply opacity-30 -translate-y-1/2 -translate-x-1/3"></div>
          
          {/* Bottom right decoration */}
          <div className="absolute bottom-0 right-0 w-96 h-96 bg-blue-300 rounded-full mix-blend-multiply opacity-30 translate-y-1/2 translate-x-1/3"></div>
        </div>
      </div>
      
      {/* Main content */}
      <div className="relative z-10 py-12 px-4 sm:px-6 lg:px-8 flex items-center justify-center min-h-screen">
        <div className="max-w-6xl w-full flex flex-col lg:flex-row gap-8 items-center">
          {/* Left side - Branding & Info */}
          <div className="w-full lg:w-5/12 text-center lg:text-left space-y-6">
            <div className="bg-white/85 backdrop-blur-sm p-6 rounded-xl shadow-xl">
              <h1 className="text-4xl font-bold text-blue-800">
                Bệnh Viện 
              </h1>
              <p className="mt-2 text-gray-600">
                Chăm sóc sức khỏe chuyên nghiệp, dễ dàng quản lý và đặt lịch khám
              </p>
                    </div>

            <div className="p-6 bg-white/85 backdrop-blur-sm rounded-xl shadow-xl border border-white/20">
              <h2 className="text-xl font-semibold text-blue-800 mb-4">
                {isRegisterMode ? 'Đăng ký để sử dụng các tiện ích:' : 'Đăng nhập để truy cập:'}
              </h2>
              <ul className="space-y-3">
                <li className="flex items-start">
                  <svg className="h-5 w-5 text-green-500 mr-2 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                  </svg>
                  <span className="text-gray-700">Đặt lịch khám dễ dàng và nhanh chóng</span>
                </li>
                <li className="flex items-start">
                  <svg className="h-5 w-5 text-green-500 mr-2 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                  </svg>
                  <span className="text-gray-700">Theo dõi lịch sử khám bệnh</span>
                </li>
                <li className="flex items-start">
                  <svg className="h-5 w-5 text-green-500 mr-2 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                  </svg>
                  <span className="text-gray-700">Nhận thông báo nhắc lịch khám</span>
                </li>
                <li className="flex items-start">
                  <svg className="h-5 w-5 text-green-500 mr-2 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                  </svg>
                  <span className="text-gray-700">Truy cập kết quả xét nghiệm trực tuyến</span>
                  </li>
              </ul>
              <div className="mt-6 bg-blue-600/10 rounded-lg p-4 border border-blue-200">
                <div className="font-medium text-blue-800">Cần hỗ trợ?</div>
                <div className="text-gray-700 mt-1">Liên hệ hotline: <span className="text-blue-700 font-medium">1900 1234</span></div>
              </div>
            </div>
          </div>
          
          {/* Right side - Auth Forms */}
          <div className="w-full lg:w-7/12 max-w-md">
            <div className="bg-white/90 backdrop-blur-md shadow-2xl rounded-2xl overflow-hidden border border-white/20">
              <div className="px-6 py-8 sm:px-8 sm:py-8">
                {/* Toggle buttons */}
                <div className="flex rounded-lg bg-gray-100 p-1 mb-8">
                  <button
                    onClick={() => !isRegisterMode || toggleMode()}
                    className={`w-1/2 py-2.5 text-sm font-medium rounded-md transition-all
                      ${!isRegisterMode
                        ? "bg-white text-blue-700 shadow"
                        : "text-gray-700 hover:text-blue-700"
                      }`}
                  >
                    Đăng nhập
                  </button>
                  <button
                    onClick={() => isRegisterMode || toggleMode()}
                    className={`w-1/2 py-2.5 text-sm font-medium rounded-md transition-all
                      ${isRegisterMode
                        ? "bg-white text-blue-700 shadow"
                        : "text-gray-700 hover:text-blue-700"
                      }`}
                  >
                    Đăng ký
                  </button>
              </div>
                
                {/* Content */}
                <div className="relative">
                {/* Login form */}
                  <div className={`transition-all duration-300 ${isRegisterMode ? 'opacity-0 absolute inset-0 z-0 pointer-events-none' : 'opacity-100 z-10'}`}>
                  <Login onRegisterClick={toggleMode} />
                </div>
                
                {/* Register form */}
                  <div className={`transition-all duration-300 ${!isRegisterMode ? 'opacity-0 absolute inset-0 z-0 pointer-events-none' : 'opacity-100 z-10'}`}>
                  <Register onLoginClick={toggleMode} />
                  </div>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="mt-6 text-center text-sm text-white">
              © {new Date().getFullYear()} Bệnh Viện . <span className="hidden sm:inline">Bảo lưu mọi quyền.</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Auth; 
