import React from 'react';
import { Link } from 'react-router-dom';

const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-gray-900 text-white">
      <div className="container mx-auto px-6 pt-16 pb-8">
        {/* Top Section with Logo and Gradient Line */}
        <div className="flex flex-col items-center mb-10">
          <Link to="/" className="text-3xl font-bold text-white flex items-center mb-4 group">
            <svg className="w-8 h-8 mr-2 text-primary group-hover:text-primary-light transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
            <span className="group-hover:text-primary-light transition-colors">Bệnh Viện</span>
                </Link>
          <div className="h-1 w-24 bg-gradient-to-r from-primary to-blue-500 rounded-full mb-8"></div>
              </div>

        {/* Main Footer Content */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12">
          {/* About Column */}
          <div>
            <h4 className="text-xl font-bold mb-6 text-white relative inline-block pb-3 after:content-[''] after:absolute after:bottom-0 after:left-0 after:w-12 after:h-0.5 after:bg-primary">Giới Thiệu</h4>
              <p className="text-gray-400 mb-6 leading-relaxed">
                Cung cấp dịch vụ y tế chất lượng cao với đội ngũ y bác sĩ giàu kinh nghiệm và cơ sở vật chất hiện đại.
              </p>
            <div className="flex space-x-3">
                <a href="#" className="w-10 h-10 rounded-full bg-gray-800 flex items-center justify-center hover:bg-primary transition-colors" aria-label="Facebook">
                <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M18.48 2H5.52A3.52 3.52 0 0 0 2 5.52v12.96A3.52 3.52 0 0 0 5.52 22H12v-8.48H9.52v-3.04H12V8.32c0-2.48 1.52-3.84 3.76-3.84.75 0 1.5.08 2.24.24v2.88h-1.52c-1.2 0-1.44.56-1.44 1.44v1.76h2.88l-.4 3.04h-2.48V22h4.96a3.52 3.52 0 0 0 3.52-3.52V5.52A3.52 3.52 0 0 0 18.48 2z"/>
                </svg>
                </a>
                <a href="#" className="w-10 h-10 rounded-full bg-gray-800 flex items-center justify-center hover:bg-primary transition-colors" aria-label="Instagram">
                <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2c-2.714 0-3.055.012-4.122.06-1.064.048-1.79.218-2.427.465a4.88 4.88 0 0 0-1.77 1.153 4.88 4.88 0 0 0-1.153 1.77c-.247.636-.417 1.363-.465 2.427C2.012 8.945 2 9.286 2 12s.012 3.055.06 4.122c.048 1.064.218 1.79.465 2.427a4.88 4.88 0 0 0 1.153 1.77 4.88 4.88 0 0 0 1.77 1.153c.636.247 1.363.417 2.427.465 1.067.048 1.408.06 4.122.06s3.055-.012 4.122-.06c1.064-.048 1.79-.218 2.427-.465a4.88 4.88 0 0 0 1.77-1.153 4.88 4.88 0 0 0 1.153-1.77c.247-.636.417-1.363.465-2.427.048-1.067.06-1.408.06-4.122s-.012-3.055-.06-4.122c-.048-1.064-.218-1.79-.465-2.427a4.88 4.88 0 0 0-1.153-1.77 4.88 4.88 0 0 0-1.77-1.153c-.636-.247-1.363-.417-2.427-.465C15.055 2.012 14.714 2 12 2zm0 1.802c2.67 0 2.986.01 4.04.058.976.044 1.505.207 1.858.344.466.181.8.397 1.15.748.35.35.566.684.747 1.15.137.353.3.882.344 1.857.048 1.055.058 1.37.058 4.041 0 2.67-.01 2.986-.058 4.04-.044.976-.207 1.505-.344 1.858-.181.466-.397.8-.748 1.15-.35.35-.683.566-1.15.747-.352.137-.881.3-1.857.344-1.054.048-1.37.058-4.04.058-2.67 0-2.987-.01-4.04-.058-.976-.044-1.505-.207-1.858-.344a3.09 3.09 0 0 1-1.15-.748 3.09 3.09 0 0 1-.747-1.15c-.137-.352-.3-.881-.344-1.857-.048-1.054-.058-1.37-.058-4.04 0-2.67.01-2.986.058-4.041.044-.976.207-1.505.344-1.858.181-.466.397-.8.748-1.15.35-.35.683-.566 1.15-.747.352-.137.881-.3 1.857-.344 1.055-.048 1.37-.058 4.041-.058z"/>
                  <path d="M12 15.333a3.333 3.333 0 1 1 0-6.665 3.333 3.333 0 0 1 0 6.665zm0-8.447a5.113 5.113 0 1 0 0 10.227 5.113 5.113 0 0 0 0-10.227zm6.665-.184a1.2 1.2 0 1 1-2.398 0 1.2 1.2 0 0 1 2.398 0z"/>
                </svg>
                </a>
                <a href="#" className="w-10 h-10 rounded-full bg-gray-800 flex items-center justify-center hover:bg-primary transition-colors" aria-label="Twitter">
                <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M22 5.8a8.49 8.49 0 0 1-2.36.64 4.13 4.13 0 0 0 1.81-2.27 8.21 8.21 0 0 1-2.61 1 4.1 4.1 0 0 0-7 3.74 11.64 11.64 0 0 1-8.45-4.29 4.16 4.16 0 0 0-.55 2.07 4.09 4.09 0 0 0 1.82 3.41 4.05 4.05 0 0 1-1.86-.51v.05a4.1 4.1 0 0 0 3.3 4 3.93 3.93 0 0 1-1.85.07 4.1 4.1 0 0 0 3.83 2.84A8.22 8.22 0 0 1 2 18.33a11.57 11.57 0 0 0 6.29 1.85 11.57 11.57 0 0 0 11.68-11.64v-.53A8.43 8.43 0 0 0 22 5.8z"/>
                </svg>
                </a>
              </div>
            </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-xl font-bold mb-6 text-white relative inline-block pb-3 after:content-[''] after:absolute after:bottom-0 after:left-0 after:w-12 after:h-0.5 after:bg-primary">Liên Kết Nhanh</h4>
              <ul className="space-y-3">
              <li>
                <Link to="/" className="text-gray-400 hover:text-white transition-colors hover:translate-x-1 inline-block transform">
                  <span className="flex items-center">
                    <svg className="w-3 h-3 mr-2 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                    Trang chủ
                  </span>
                </Link>
              </li>
              <li>
                <Link to="/doctors" className="text-gray-400 hover:text-white transition-colors hover:translate-x-1 inline-block transform">
                  <span className="flex items-center">
                    <svg className="w-3 h-3 mr-2 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                    Bác sĩ
                  </span>
                </Link>
              </li>
              <li>
                <Link to="/branches" className="text-gray-400 hover:text-white transition-colors hover:translate-x-1 inline-block transform">
                  <span className="flex items-center">
                    <svg className="w-3 h-3 mr-2 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                    Chi nhánh
                  </span>
                </Link>
              </li>
              <li>
                <Link to="/appointment" className="text-gray-400 hover:text-white transition-colors hover:translate-x-1 inline-block transform">
                  <span className="flex items-center">
                    <svg className="w-3 h-3 mr-2 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                    Đặt lịch khám
                  </span>
                </Link>
              </li>
              <li>
                <Link to="/contact" className="text-gray-400 hover:text-white transition-colors hover:translate-x-1 inline-block transform">
                  <span className="flex items-center">
                    <svg className="w-3 h-3 mr-2 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                    Liên hệ
                  </span>
                </Link>
              </li>
              </ul>
            </div>

          {/* Specialties */}
          <div>
            <h4 className="text-xl font-bold mb-6 text-white relative inline-block pb-3 after:content-[''] after:absolute after:bottom-0 after:left-0 after:w-12 after:h-0.5 after:bg-primary">Chuyên Khoa</h4>
              <ul className="space-y-3">
              <li>
                <Link to="/specialties" className="text-gray-400 hover:text-white transition-colors hover:translate-x-1 inline-block transform">
                  <span className="flex items-center">
                    <svg className="w-3 h-3 mr-2 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                    Nội Tổng Quát
                  </span>
                </Link>
              </li>
              <li>
                <Link to="/specialties" className="text-gray-400 hover:text-white transition-colors hover:translate-x-1 inline-block transform">
                  <span className="flex items-center">
                    <svg className="w-3 h-3 mr-2 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                    Thần Kinh
                  </span>
                </Link>
              </li>
              <li>
                <Link to="/specialties" className="text-gray-400 hover:text-white transition-colors hover:translate-x-1 inline-block transform">
                  <span className="flex items-center">
                    <svg className="w-3 h-3 mr-2 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                    Nhi Khoa
                  </span>
                </Link>
              </li>
              <li>
                <Link to="/specialties" className="text-gray-400 hover:text-white transition-colors hover:translate-x-1 inline-block transform">
                  <span className="flex items-center">
                    <svg className="w-3 h-3 mr-2 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                    Tim Mạch
                  </span>
                </Link>
              </li>
              </ul>
            </div>

          {/* Contact */}
          <div>
            <h4 className="text-xl font-bold mb-6 text-white relative inline-block pb-3 after:content-[''] after:absolute after:bottom-0 after:left-0 after:w-12 after:h-0.5 after:bg-primary">Liên Hệ</h4>
              <ul className="space-y-4">
                <li className="flex items-start">
                <svg className="w-5 h-5 text-primary mr-3 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                  <span className="text-gray-400">123 Đường Nguyễn Huệ, Quận 1, TP.HCM</span>
                </li>
                <li className="flex items-start">
                <svg className="w-5 h-5 text-primary mr-3 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                </svg>
                  <span className="text-gray-400">(028) 3822 1234</span>
                </li>
                <li className="flex items-start">
                <svg className="w-5 h-5 text-primary mr-3 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                  <span className="text-gray-400">info@benhvien.com</span>
                </li>
                <li className="flex items-start">
                <svg className="w-5 h-5 text-primary mr-3 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                  <span className="text-gray-400">Thứ Hai - Chủ Nhật: 7:00 - 20:00</span>
                </li>
              </ul>
              <div className="mt-6">
              <Link to="/appointment" className="bg-primary hover:bg-primary-dark text-white font-medium py-2 px-4 rounded-lg transition-colors inline-flex items-center">
                <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                Đặt Lịch Ngay
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Copyright */}
      <div className="border-t border-gray-800 py-6">
        <div className="container mx-auto px-6 flex flex-col md:flex-row justify-between items-center">
          <div className="text-gray-500 text-sm mb-4 md:mb-0">
            <p>© {currentYear} Bệnh Viện. Tất cả các quyền được bảo lưu.</p>
          </div>
          <div className="flex space-x-6">
            <Link to="/privacy" className="text-gray-500 hover:text-white text-sm transition-colors">Chính sách bảo mật</Link>
            <Link to="/terms" className="text-gray-500 hover:text-white text-sm transition-colors">Điều khoản sử dụng</Link>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer; 
