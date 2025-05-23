import React, { useState, memo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../utils/api';
import { toast } from 'react-toastify';
import dayjs from 'dayjs';
import { motion } from 'framer-motion';
import { 
  FaEye, FaEyeSlash, FaUser, FaCalendarDay, FaMars, 
  FaMapMarkerAlt, FaEnvelope, FaPhone, FaLock, FaCheck,
  FaArrowLeft, FaArrowRight, FaUserLock
} from 'react-icons/fa';

// Memoized step badge component to prevent re-renders
const StepBadge = memo(({ icon, label, active }) => (
  <div className={`flex flex-col items-center ${active ? 'text-blue-600' : 'text-gray-400'}`}>
    <div 
      className={`w-10 h-10 rounded-full flex items-center justify-center border-2 z-10 shadow-sm ${active ? 'bg-blue-600 border-blue-600' : 'bg-white border-gray-300'}`}
    >
      <span className={active ? 'text-white' : 'text-gray-400'}>
        {icon}
      </span>
    </div>
    <span className="mt-2 text-xs font-medium">{label}</span>
  </div>
));

// Memoized progress indicator to prevent re-renders
const ProgressIndicator = memo(({ step }) => (
  <div className="mb-8">
    <div className="relative">
      <div className="absolute inset-0 flex items-center">
        <div className="w-full bg-gray-200 h-1 rounded-full">
          <div 
            className="bg-blue-600 h-1 rounded-full"
            style={{ width: step === 0 ? '30%' : '100%' }}
          ></div>
        </div>
      </div>
      
      <div className="relative flex justify-between">
        <StepBadge 
          icon={<FaUser className="h-4 w-4" />}
          label="Thông tin cá nhân"
          active={step >= 0}
        />
        <StepBadge 
          icon={<FaUserLock className="h-4 w-4" />}
          label="Thông tin tài khoản"
          active={step >= 1}
        />
      </div>
    </div>
  </div>
));

// Main component
const Register = ({ onLoginClick }) => {
  const navigate = useNavigate();
  const { login } = useAuth();
  
  const [formData, setFormData] = useState({
    fullName: '',
    dateOfBirth: '',
    gender: '',
    address: '',
    email: '',
    phoneNumber: '',
    password: '',
    confirmPassword: '',
    acceptTerms: false
  });
  
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(0);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Handle form input changes
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (formData.password !== formData.confirmPassword) {
      toast.error('Mật khẩu không khớp');
      return;
    }

    if (!formData.acceptTerms) {
      toast.error('Bạn phải đồng ý với các điều khoản và điều kiện');
      return;
    }
    
    setLoading(true);
    
    try {
      const response = await api.post('/auth/register', {
        fullName: formData.fullName,
        dateOfBirth: formData.dateOfBirth ? dayjs(formData.dateOfBirth).format('YYYY-MM-DD') : null,
        gender: formData.gender,
        address: formData.address,
        email: formData.email,
        phoneNumber: formData.phoneNumber,
        password: formData.password
      });
      
      if (response.data.success) {
        toast.success('Đăng ký thành công! Vui lòng xác thực email của bạn.');
        navigate('/need-verification', { 
          state: { email: formData.email }
        });
      } else {
        toast.error(response.data.message || 'Đăng ký không thành công');
      }
    } catch (error) {
      console.error('Registration error:', error);
      
      if (error.response?.data?.field) {
        toast.error(`${error.response.data.field}: ${error.response.data.message}`);
      } else if (error.response?.data?.errors) {
        const errorMessage = Object.values(error.response.data.errors)[0];
        toast.error(errorMessage || 'Vui lòng kiểm tra lại thông tin đăng ký');
      } else if (error.response?.data?.message) {
        toast.error(error.response.data.message);
      } else {
        toast.error('Đăng ký không thành công. Vui lòng thử lại sau.');
      }
    } finally {
      setLoading(false);
    }
  };

  // Move to next step
  const nextStep = (e) => {
    e.preventDefault();
    
    // Validate first step fields
    if (!formData.fullName || !formData.dateOfBirth || !formData.gender) {
      toast.error('Vui lòng điền đầy đủ các trường bắt buộc');
      return;
    }
    
    setStep(1);
  };

  // Return to previous step
  const prevStep = () => {
    setStep(0);
  };

  return (
    <div className="w-full">
      {/* Progress steps - now uses memoized component */}
      <ProgressIndicator step={step} />

      {/* Registration form */}
      {step === 0 ? (
        <div key="step1" className="space-y-4">
          <form onSubmit={nextStep}>
            {/* Personal Information Step */}
            <div className="bg-blue-50 p-6 rounded-lg border border-blue-100 shadow-sm">
              <h3 className="text-lg font-medium text-blue-800 mb-4 pb-2 border-b border-blue-100 flex items-center">
                <FaUser className="mr-2 text-blue-600 h-4 w-4" style={{minWidth: '1rem'}} />
                Thông tin cá nhân
              </h3>
            
              <div className="space-y-4">
                {/* Full Name */}
                <div>
                  <label htmlFor="fullName" className="block text-sm font-medium text-gray-700 mb-1.5">
                    Họ và tên <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                      <FaUser className="text-blue-500 h-4 w-4" style={{minWidth: '1rem'}} />
                    </div>
                    <input
                      id="fullName"
                      name="fullName"
                      type="text"
                      required
                      value={formData.fullName}
                      onChange={handleChange}
                      className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg bg-white shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Nhập họ và tên" 
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Date of birth */}
                  <div>
                    <label htmlFor="dateOfBirth" className="block text-sm font-medium text-gray-700 mb-1.5">
                      Ngày sinh <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                        <FaCalendarDay className="text-blue-500 h-4 w-4" style={{minWidth: '1rem'}} />
                      </div>
                      <input
                        id="dateOfBirth"
                        name="dateOfBirth"
                        type="date"
                        required
                        max={new Date().toISOString().split('T')[0]}
                        value={formData.dateOfBirth}
                        onChange={handleChange}
                        className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg bg-white shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                  </div>

                  {/* Gender */}
                  <div>
                    <label htmlFor="gender" className="block text-sm font-medium text-gray-700 mb-1.5">
                      Giới tính <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                        <FaMars className="text-blue-500 h-4 w-4" style={{minWidth: '1rem'}} />
                      </div>
                      <select
                        id="gender"
                        name="gender"
                        required
                        value={formData.gender}
                        onChange={handleChange}
                        className="block w-full pl-10 pr-10 py-3 border border-gray-300 rounded-lg bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none"
                      >
                        <option value="">Giới Tính</option>
                        <option value="male">Nam</option>
                        <option value="female">Nữ</option>
                        <option value="other">Khác</option>
                      </select>
                      <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none">
                        <svg className="h-4 w-4 text-gray-400" style={{minWidth: '1rem'}} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                        </svg>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Address */}
                <div>
                  <label htmlFor="address" className="block text-sm font-medium text-gray-700 mb-1.5">
                    Địa chỉ
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                      <FaMapMarkerAlt className="text-blue-500 h-4 w-4" style={{minWidth: '1rem'}} />
                    </div>
                    <input
                      id="address"
                      name="address"
                      type="text"
                      value={formData.address}
                      onChange={handleChange}
                      className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg bg-white shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Nhập địa chỉ (không bắt buộc)" 
                    />
                  </div>
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-blue-100">
                <div className="flex items-center">
                  <div className="flex-shrink-0 h-5 w-5 text-blue-500">
                    <FaCheck className="h-4 w-4" style={{minWidth: '1rem'}} />
                  </div>
                  <p className="ml-2 text-sm text-gray-600">
                    Thông tin của bạn được bảo mật và chỉ sử dụng cho mục đích y tế
                  </p>
                </div>
              </div>
            </div>
            
            <div className="flex justify-end mt-4">
              <button
                type="submit"
                className="flex items-center px-6 py-2.5 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all"
              >
                Tiếp tục
                <FaArrowRight className="ml-2 h-4 w-4" style={{minWidth: '1rem'}} />
              </button>
            </div>
          </form>
        </div>
      ) : (
        <div key="step2" className="space-y-4">
          <form onSubmit={handleSubmit}>
            {/* Account Information Step */}
            <div className="bg-green-50 p-6 rounded-lg border border-green-100 shadow-sm">
              <h3 className="text-lg font-medium text-green-800 mb-4 pb-2 border-b border-green-100 flex items-center">
                <FaLock className="mr-2 text-green-600 h-4 w-4" style={{minWidth: '1rem'}} />
                Thông tin tài khoản
              </h3>

              <div className="space-y-4">
                {/* Email */}
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1.5">
                    Email <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                      <FaEnvelope className="text-green-500 h-4 w-4" style={{minWidth: '1rem'}} />
                    </div>
                    <input
                      id="email"
                      name="email"
                      type="email"
                      autoComplete="email"
                      required
                      value={formData.email}
                      onChange={handleChange}
                      className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg bg-white shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      placeholder="your.email@example.com"
                    />
                  </div>
                </div>

                {/* Phone Number */}
                <div>
                  <label htmlFor="phoneNumber" className="block text-sm font-medium text-gray-700 mb-1.5">
                    Số điện thoại <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                      <FaPhone className="text-green-500 h-4 w-4" style={{minWidth: '1rem'}} />
                    </div>
                    <input
                      id="phoneNumber"
                      name="phoneNumber"
                      type="tel"
                      required
                      value={formData.phoneNumber}
                      onChange={handleChange}
                      className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg bg-white shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      placeholder="Nhập số điện thoại" 
                    />
                  </div>
                </div>

                {/* Password */}
                <div>
                  <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1.5">
                    Mật khẩu <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                      <FaLock className="text-green-500 h-4 w-4" style={{minWidth: '1rem'}} />
                    </div>
                    <input
                      id="password"
                      name="password"
                      type={showPassword ? "text" : "password"}
                      required
                      value={formData.password}
                      onChange={handleChange}
                      className="block w-full pl-10 pr-10 py-3 border border-gray-300 rounded-lg bg-white shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      placeholder="••••••••"
                      minLength={6}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-gray-500 hover:text-gray-700 focus:outline-none"
                    >
                      {showPassword ? (
                        <FaEyeSlash className="h-4 w-4" style={{minWidth: '1rem'}} />
                      ) : (
                        <FaEye className="h-4 w-4" style={{minWidth: '1rem'}} />
                      )}
                    </button>
                  </div>
                  <p className="mt-1 text-xs text-gray-500">Mật khẩu phải có ít nhất 6 ký tự</p>
                </div>

                {/* Confirm Password */}
                <div>
                  <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1.5">
                    Xác nhận mật khẩu <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                      <FaLock className="text-green-500 h-4 w-4" style={{minWidth: '1rem'}} />
                    </div>
                    <input
                      id="confirmPassword"
                      name="confirmPassword"
                      type={showConfirmPassword ? "text" : "password"}
                      required
                      value={formData.confirmPassword}
                      onChange={handleChange}
                      className="block w-full pl-10 pr-10 py-3 border border-gray-300 rounded-lg bg-white shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      placeholder="••••••••"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-gray-500 hover:text-gray-700 focus:outline-none"
                    >
                      {showConfirmPassword ? (
                        <FaEyeSlash className="h-4 w-4" style={{minWidth: '1rem'}} />
                      ) : (
                        <FaEye className="h-4 w-4" style={{minWidth: '1rem'}} />
                      )}
                    </button>
                  </div>
                </div>

                {/* Terms & Conditions */}
                <div className="flex items-start mt-6 bg-white p-4 rounded-lg">
                  <div className="flex items-center h-5 mt-0.5">
                    <input
                      id="acceptTerms"
                      name="acceptTerms"
                      type="checkbox"
                      checked={formData.acceptTerms}
                      onChange={handleChange}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                  </div>
                  <div className="ml-3 text-sm">
                    <label htmlFor="acceptTerms" className="font-medium text-gray-700">
                      Tôi đồng ý với <Link to="/terms" className="text-blue-600 hover:text-blue-500 underline">Điều khoản dịch vụ</Link> và <Link to="/privacy" className="text-blue-600 hover:text-blue-500 underline">Chính sách bảo mật</Link>
                    </label>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-between mt-4">
              <button
                type="button"
                onClick={prevStep}
                className="flex items-center px-5 py-2.5 border border-gray-300 shadow-sm rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <FaArrowLeft className="mr-2 h-4 w-4" style={{minWidth: '1rem'}} />
                Quay lại
              </button>
              
              <button
                type="submit"
                disabled={loading}
                className="flex items-center px-6 py-2.5 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Đang xử lý...
                  </>
                ) : (
                  'Đăng ký'
                )}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Sign in link */}
      <div className="mt-8 text-center">
        <button 
          type="button" 
          onClick={onLoginClick}
          className="inline-flex items-center font-medium text-blue-600 hover:text-blue-500 hover:underline focus:outline-none"
        >
          <FaUser className="mr-1.5 h-4 w-4" style={{minWidth: '1rem'}} />
          <span>Đã có tài khoản? Đăng nhập ngay</span>
        </button>
      </div>
    </div>
  );
};

export default Register; 
