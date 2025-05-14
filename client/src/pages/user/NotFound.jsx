import React from 'react';
import { Link } from 'react-router-dom';

const NotFound = () => {
  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-lg w-full text-center">
        <div className="relative mx-auto w-40 h-40 md:w-56 md:h-56">
          <div className="absolute inset-0 bg-blue-500 rounded-full opacity-5 animate-pulse"></div>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-8xl md:text-9xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-primary to-blue-600">
              404
            </span>
          </div>
        </div>

        <h2 className="mt-8 text-3xl font-extrabold tracking-tight text-gray-800 animate-fade-in">
          Không tìm thấy trang
        </h2>
        
        <p className="mt-4 text-lg text-gray-600 mx-auto max-w-md animate-fade-in-delay">
          Trang bạn đang tìm kiếm không tồn tại hoặc đã bị di chuyển. Vui lòng kiểm tra đường dẫn hoặc quay về trang chủ.
        </p>
        
        <div className="mt-10 flex justify-center gap-4 animate-fade-in-delay-2">
          <Link 
            to="/" 
            className="group relative inline-flex items-center justify-center px-8 py-3 overflow-hidden text-lg font-medium text-white rounded-full bg-gradient-to-r from-primary to-blue-600 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
          >
            <span className="absolute left-0 top-0 w-40 h-40 -mt-10 -ml-3 transition-all duration-700 bg-white opacity-10 rotate-45 group-hover:-translate-x-[60%] ease"></span>
            <span className="relative flex items-center">
              <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                <path fillRule="evenodd" d="M10.293 15.707a1 1 0 010-1.414L14.586 10l-4.293-4.293a1 1 0 111.414-1.414l5 5a1 1 0 010 1.414l-5 5a1 1 0 01-1.414 0z" clipRule="evenodd"></path>
                <path fillRule="evenodd" d="M4.293 15.707a1 1 0 010-1.414L8.586 10 4.293 5.707a1 1 0 011.414-1.414l5 5a1 1 0 010 1.414l-5 5a1 1 0 01-1.414 0z" clipRule="evenodd"></path>
              </svg>
              Quay về trang chủ
            </span>
          </Link>
          <a 
            href="javascript:history.back()" 
            className="group relative inline-flex items-center justify-center px-8 py-3 overflow-hidden text-lg font-medium text-gray-700 rounded-full border border-gray-200 bg-white shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
          >
            <span className="relative flex items-center">
              <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd"></path>
              </svg>
              Quay lại
            </span>
          </a>
        </div>

        <div className="mt-12 text-sm text-gray-500 animate-fade-in-delay-3">
          <p>Nếu bạn tin rằng đây là lỗi, vui lòng liên hệ <a href="mailto:support@benhvien.com" className="text-primary underline hover:text-blue-700">hỗ trợ</a>.</p>
        </div>
      </div>
      
      <style jsx>{`
        @keyframes ping-slow {
          0% { transform: scale(0.8); opacity: 0.3; }
          50% { transform: scale(1.2); opacity: 0.1; }
          100% { transform: scale(0.8); opacity: 0.3; }
        }
        .animate-ping-slow {
          animation: ping-slow 3s cubic-bezier(0, 0, 0.2, 1) infinite;
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in {
          animation: fadeIn 0.6s ease-out forwards;
        }
        .animate-fade-in-delay {
          opacity: 0;
          animation: fadeIn 0.6s ease-out 0.2s forwards;
        }
        .animate-fade-in-delay-2 {
          opacity: 0;
          animation: fadeIn 0.6s ease-out 0.4s forwards;
        }
        .animate-fade-in-delay-3 {
          opacity: 0;
          animation: fadeIn 0.6s ease-out 0.6s forwards;
        }
      `}</style>
    </div>
  );
};

export default NotFound; 
