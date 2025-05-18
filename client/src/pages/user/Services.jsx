import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import api from '../../utils/api';
import { FaSearch, FaStethoscope, FaUserMd, FaMoneyBillWave, FaClock, FaCalendarAlt, FaInfoCircle, FaArrowRight, FaFilter, FaChevronDown, FaTimes } from 'react-icons/fa';
import { MdLocalHospital } from 'react-icons/md';
import { useAuth } from '../../context/AuthContext';
import { ServiceCard } from '../../components/user';
import AOS from 'aos';
import 'aos/dist/aos.css';


const Services = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  
  // Filter states
  const [services, setServices] = useState([]);
  const [filteredServices, setFilteredServices] = useState([]);
  const [specialties, setSpecialties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSpecialty, setSelectedSpecialty] = useState('');
  const [selectedPriceRange, setSelectedPriceRange] = useState('');
  const [selectedDuration, setSelectedDuration] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [activeFilters, setActiveFilters] = useState(0);
  
  // Initialize AOS animation library
  useEffect(() => {
    AOS.init({
      duration: 800,
      once: true,
      easing: 'ease-out-cubic'
    });
  }, []);
  
  // Get specialty from URL if available
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const specialtyParam = params.get('specialty');
    if (specialtyParam) {
      setSelectedSpecialty(specialtyParam);
    }
  }, [location.search]);
  
  // Fetch services and specialties data
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [servicesRes, specialtiesRes] = await Promise.all([
          api.get('/services'),
          api.get('/specialties')
        ]);
        
        // Thêm các thuộc tính cần thiết cho ServiceCard nếu API không trả về
        let enhancedServices = (servicesRes.data.data || []).map(service => ({
          ...service,
          features: service.features || service.highlights || []
        }));
        
        // Lọc chỉ hiển thị các dịch vụ đang hoạt động (isActive=true)
        enhancedServices = enhancedServices.filter(service => service.isActive === true);
        
        setServices(enhancedServices);
        setFilteredServices(enhancedServices);
        
        // Ensure specialties is always an array
        let specialtiesData = [];
        if (specialtiesRes.data && specialtiesRes.data.data) {
          if (Array.isArray(specialtiesRes.data.data)) {
            specialtiesData = specialtiesRes.data.data;
          } else if (specialtiesRes.data.data.specialties && Array.isArray(specialtiesRes.data.data.specialties)) {
            specialtiesData = specialtiesRes.data.data.specialties;
          }
        }
        
        // Lọc chỉ hiển thị các chuyên khoa đang hoạt động (isActive=true)
        specialtiesData = specialtiesData.filter(specialty => specialty.isActive === true);
        
        setSpecialties(specialtiesData);
        setError(null);
      } catch (err) {
        console.error('Error fetching data:', err);
        setError('Không thể tải danh sách dịch vụ. Vui lòng thử lại sau.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, []);
  
  // Filter services based on search term and selected filters
  useEffect(() => {
    if (!services.length) return;
    
    const filtered = services.filter(service => {
      // Search filter
      const matchesSearch = searchTerm
        ? service.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (service.description && service.description.toLowerCase().includes(searchTerm.toLowerCase()))
        : true;
      
      // Specialty filter
      const matchesSpecialty = selectedSpecialty
        ? (service.specialtyId?._id === selectedSpecialty || service.specialtyId === selectedSpecialty)
        : true;
      
      // Price range filter
      let matchesPriceRange = true;
      if (selectedPriceRange) {
        const price = service.price || 0;
        
        switch(selectedPriceRange) {
          case 'under-500k':
            matchesPriceRange = price < 500000;
            break;
          case '500k-1m':
            matchesPriceRange = price >= 500000 && price <= 1000000;
            break;
          case '1m-2m':
            matchesPriceRange = price > 1000000 && price <= 2000000;
            break;
          case 'above-2m':
            matchesPriceRange = price > 2000000;
            break;
          default:
            matchesPriceRange = true;
        }
      }
      
      // Duration filter
      let matchesDuration = true;
      if (selectedDuration) {
        const duration = service.duration || 0;
        
        switch(selectedDuration) {
          case 'under-30':
            matchesDuration = duration <= 30;
            break;
          case '30-60':
            matchesDuration = duration > 30 && duration <= 60;
            break;
          case 'above-60':
            matchesDuration = duration > 60;
            break;
          default:
            matchesDuration = true;
        }
      }
      
      return matchesSearch && matchesSpecialty && matchesPriceRange && matchesDuration;
    });
    
    setFilteredServices(filtered);
  }, [services, searchTerm, selectedSpecialty, selectedPriceRange, selectedDuration]);
  
  // Count active filters
  useEffect(() => {
    let count = 0;
    if (selectedSpecialty) count++;
    if (selectedPriceRange) count++;
    if (selectedDuration) count++;
    setActiveFilters(count);
  }, [selectedSpecialty, selectedPriceRange, selectedDuration]);
  
  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
  };
  
  const handleSpecialtyChange = (e) => {
    setSelectedSpecialty(e.target.value);
  };
  
  const handlePriceRangeChange = (e) => {
    setSelectedPriceRange(e.target.value);
  };
  
  const handleDurationChange = (e) => {
    setSelectedDuration(e.target.value);
  };
  
  const toggleFilters = () => {
    setShowFilters(!showFilters);
  };
  
  const clearFilters = () => {
    setSelectedSpecialty('');
    setSelectedPriceRange('');
    setSelectedDuration('');
  };
  
  const handleBookService = (serviceId) => {
    if (!isAuthenticated) {
      navigate('/auth', { state: { from: `/appointment?service=${serviceId}` } });
      return;
    }
    
    navigate(`/appointment?service=${serviceId}`);
  };
  
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[200px] p-4">
        <div className="inline-block w-10 h-10 border-4 border-gray-200 rounded-full border-l-primary animate-spin"></div>
        <p className="mt-4 text-gray-600">Đang tải danh sách dịch vụ...</p>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-8 text-center max-w-2xl mx-auto my-8">
        <h2 className="text-2xl font-bold text-red-600 mb-3">Đã xảy ra lỗi!</h2>
        <p className="text-gray-700 mb-4">{error}</p>
        <button 
          onClick={() => window.location.reload()} 
          className="bg-primary text-white hover:bg-primary-dark px-4 py-2 rounded font-medium transition-all"
        >
          Thử lại
        </button>
      </div>
    );
  }
  
  return (
    <div className="bg-gray-50 min-h-screen">
      {/* Hero Section */}
      <section className="bg-gradient-to-r from-primary to-blue-700 relative py-20 overflow-hidden">
        <div className="absolute inset-0 overflow-hidden">
          <img 
            src="https://img.freepik.com/free-photo/doctor-nurses-special-equipment_23-2148980721.jpg"
            alt="Services background" 
            className="w-full h-full object-cover object-center opacity-20" 
          />
        </div>
        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-3xl mx-auto text-center text-white">
            <h1 className="text-4xl md:text-5xl font-bold mb-4 text-white" data-aos="fade-up">Dịch Vụ Y Tế</h1>
            <p className="text-xl opacity-90 mb-8" data-aos="fade-up" data-aos-delay="100">
              Khám phá các dịch vụ y tế chất lượng cao của chúng tôi, được thiết kế để đáp ứng mọi nhu cầu
            </p>
            <div className="relative max-w-xl mx-auto" data-aos="fade-up" data-aos-delay="200">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <FaSearch className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                className="block w-full bg-white/90 backdrop-blur-sm border-0 pl-10 pr-10 py-4 rounded-full shadow-lg focus:ring-2 focus:ring-primary-light placeholder-gray-500 text-gray-800"
                placeholder="Tìm kiếm dịch vụ..."
                value={searchTerm}
                onChange={handleSearch}
              />
              {searchTerm && (
                <button 
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-500 hover:text-gray-700"
                  onClick={() => setSearchTerm('')}
                >
                  <span className="text-xl">&times;</span>
                </button>
              )}
            </div>
          </div>
        </div>
        <svg className="absolute bottom-0 left-0 w-full text-gray-50" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1440 100">
          <path fill="currentColor" fillOpacity="1" d="M0,32L80,42.7C160,53,320,75,480,74.7C640,75,800,53,960,48C1120,43,1280,53,1360,58.7L1440,64L1440,100L1360,100C1280,100,1120,100,960,100C800,100,640,100,480,100C320,100,160,100,80,100L0,100Z"></path>
        </svg>
      </section>
        
      <div className="container mx-auto px-4 py-12">
        <div className="mb-16">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-blue-50 p-8 rounded-xl text-center shadow-sm border border-gray-100 hover:shadow-md hover:-translate-y-1 transition-all duration-300" data-aos="fade-up">
              <div className="w-16 h-16 bg-gradient-to-r from-blue-600 to-blue-500 rounded-full flex items-center justify-center mx-auto mb-6 text-white text-2xl shadow-md">
                <FaUserMd />
              </div>
              <h3 className="text-xl font-semibold text-blue-900 mb-3">Đội Ngũ Chuyên Gia</h3>
              <p className="text-gray-600 leading-relaxed">
                Đội ngũ y bác sĩ chuyên khoa giàu kinh nghiệm, được đào tạo bài bản
              </p>
            </div>
            
            <div className="bg-blue-50 p-8 rounded-xl text-center shadow-sm border border-gray-100 hover:shadow-md hover:-translate-y-1 transition-all duration-300" data-aos="fade-up" data-aos-delay="100">
              <div className="w-16 h-16 bg-gradient-to-r from-blue-600 to-blue-500 rounded-full flex items-center justify-center mx-auto mb-6 text-white text-2xl shadow-md">
                <MdLocalHospital />
              </div>
              <h3 className="text-xl font-semibold text-blue-900 mb-3">Trang Thiết Bị Hiện Đại</h3>
              <p className="text-gray-600 leading-relaxed">
                Trang bị công nghệ y tế tiên tiến, đảm bảo độ chính xác và hiệu quả cao
              </p>
            </div>
            
            <div className="bg-blue-50 p-8 rounded-xl text-center shadow-sm border border-gray-100 hover:shadow-md hover:-translate-y-1 transition-all duration-300" data-aos="fade-up" data-aos-delay="200">
              <div className="w-16 h-16 bg-gradient-to-r from-blue-600 to-blue-500 rounded-full flex items-center justify-center mx-auto mb-6 text-white text-2xl shadow-md">
                <FaMoneyBillWave />
              </div>
              <h3 className="text-xl font-semibold text-blue-900 mb-3">Giá Cả Hợp Lý</h3>
              <p className="text-gray-600 leading-relaxed">
                Chi phí minh bạch, hợp lý và nhiều gói dịch vụ để lựa chọn
              </p>
            </div>
          </div>
        </div>
        
        {/* Mobile Filter Toggle */}
        <div className="md:hidden mb-4" data-aos="fade-up">
          <button 
            onClick={toggleFilters}
            className="w-full py-3 px-4 bg-white rounded-lg shadow-sm border border-gray-200 flex justify-between items-center"
          >
            <div className="flex items-center">
              <FaFilter className="text-primary mr-2" />
              <span className="font-medium">Lọc dịch vụ</span>
              {activeFilters > 0 && (
                <span className="ml-2 bg-primary text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                  {activeFilters}
                </span>
              )}
            </div>
            <FaChevronDown className={`text-gray-500 transition-transform ${showFilters ? 'rotate-180' : ''}`} />
          </button>
        </div>
        
        {/* Filters Section */}
        <div className={`${showFilters ? 'block' : 'hidden'} md:block mb-10`} data-aos="fade-up">
          <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold text-gray-800 flex items-center">
                <FaFilter className="text-primary mr-2" /> Lọc kết quả
                {activeFilters > 0 && (
                  <span className="ml-2 bg-primary text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                    {activeFilters}
                  </span>
                )}
              </h2>
              {activeFilters > 0 && (
                <button 
                  className="text-sm text-primary hover:text-primary-dark flex items-center"
                  onClick={clearFilters}
                >
                  <FaTimes className="mr-1" />
                  Xóa bộ lọc
                </button>
              )}
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Specialty Filter */}
              <div>
                <label htmlFor="specialty" className="block text-sm font-medium text-gray-700 mb-2">
                  Chuyên khoa
                </label>
                <select 
                  id="specialty"
                  className="w-full p-2.5 bg-gray-50 border border-gray-300 text-gray-900 rounded-lg focus:ring-primary focus:border-primary"
                  value={selectedSpecialty}
                  onChange={handleSpecialtyChange}
                >
                  <option value="">Tất cả chuyên khoa</option>
                  {Array.isArray(specialties) && specialties.map(specialty => (
                    <option key={specialty._id} value={specialty._id}>
                      {specialty.name}
                    </option>
                  ))}
                </select>
              </div>
              
              {/* Price Range Filter */}
              <div>
                <label htmlFor="priceRange" className="block text-sm font-medium text-gray-700 mb-2">
                  Mức giá
                </label>
                <select 
                  id="priceRange"
                  className="w-full p-2.5 bg-gray-50 border border-gray-300 text-gray-900 rounded-lg focus:ring-primary focus:border-primary"
                  value={selectedPriceRange}
                  onChange={handlePriceRangeChange}
                >
                  <option value="">Tất cả mức giá</option>
                  <option value="under-500k">Dưới 500.000₫</option>
                  <option value="500k-1m">500.000₫ - 1.000.000₫</option>
                  <option value="1m-2m">1.000.000₫ - 2.000.000₫</option>
                  <option value="above-2m">Trên 2.000.000₫</option>
                </select>
              </div>
              
              {/* Duration Filter */}
              <div>
                <label htmlFor="duration" className="block text-sm font-medium text-gray-700 mb-2">
                  Thời gian dịch vụ
                </label>
                <select 
                  id="duration"
                  className="w-full p-2.5 bg-gray-50 border border-gray-300 text-gray-900 rounded-lg focus:ring-primary focus:border-primary"
                  value={selectedDuration}
                  onChange={handleDurationChange}
                >
                  <option value="">Tất cả thời gian</option>
                  <option value="under-30">Dưới 30 phút</option>
                  <option value="30-60">30 - 60 phút</option>
                  <option value="above-60">Trên 60 phút</option>
                </select>
              </div>
            </div>
            
            {/* Active Filters */}
            {activeFilters > 0 && (
              <div className="mt-6 flex flex-wrap gap-2">
                {selectedSpecialty && (
                  <div className="inline-flex items-center bg-blue-50 text-blue-800 text-xs font-medium rounded-full px-3 py-1.5">
                    {specialties.find(s => s._id === selectedSpecialty)?.name || 'Chuyên khoa'}
                    <button 
                      className="ml-1.5 text-blue-600 hover:text-blue-800"
                      onClick={() => setSelectedSpecialty('')}
                    >
                      <FaTimes />
                    </button>
                  </div>
                )}
                
                {selectedPriceRange && (
                  <div className="inline-flex items-center bg-green-50 text-green-800 text-xs font-medium rounded-full px-3 py-1.5">
                    {selectedPriceRange === 'under-500k' ? 'Dưới 500.000₫' :
                     selectedPriceRange === '500k-1m' ? '500.000₫ - 1.000.000₫' :
                     selectedPriceRange === '1m-2m' ? '1.000.000₫ - 2.000.000₫' :
                     'Trên 2.000.000₫'}
                    <button 
                      className="ml-1.5 text-green-600 hover:text-green-800"
                      onClick={() => setSelectedPriceRange('')}
                    >
                      <FaTimes />
                    </button>
                  </div>
                )}
                
                {selectedDuration && (
                  <div className="inline-flex items-center bg-purple-50 text-purple-800 text-xs font-medium rounded-full px-3 py-1.5">
                    {selectedDuration === 'under-30' ? 'Dưới 30 phút' :
                     selectedDuration === '30-60' ? '30 - 60 phút' :
                     'Trên 60 phút'}
                    <button 
                      className="ml-1.5 text-purple-600 hover:text-purple-800"
                      onClick={() => setSelectedDuration('')}
                    >
                      <FaTimes />
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
        
        <div className="mb-10">
          <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4" data-aos="fade-up">
            <h2 className="text-2xl font-bold text-gray-800 flex items-center">
              <FaStethoscope className="text-primary mr-2" />
              Danh Sách Dịch Vụ
            </h2>
            <div className="text-gray-600 flex items-center">
              <span className="bg-primary/10 text-primary px-2 py-0.5 rounded-full text-sm font-medium mr-2">{filteredServices.length}</span>
              dịch vụ
            </div>
          </div>
        </div>
        
        {/* Services Grid */}
        {filteredServices.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
            {filteredServices.map((service, index) => (
              <div key={service._id} data-aos="fade-up" data-aos-delay={index % 3 * 100}>
                <ServiceCard service={service} />
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-sm p-12 text-center mb-16">
            <h3 className="text-2xl text-gray-700 mb-4">Không tìm thấy dịch vụ</h3>
            <p className="text-gray-600 mb-8">
              Không tìm thấy dịch vụ nào phù hợp với tiêu chí tìm kiếm của bạn.
            </p>
            <button 
              onClick={() => {
                setSearchTerm('');
                clearFilters();
              }}
              className="bg-primary hover:bg-primary-dark text-white font-medium py-3 px-6 rounded-lg transition-colors flex items-center mx-auto"
            >
              <FaTimes className="mr-2" />
              Xóa bộ lọc
            </button>
          </div>
        )}
        
        {/* CTA Section */}
        <div className="bg-gradient-to-r from-primary to-blue-700 rounded-xl p-8 md:p-12 text-white shadow-lg relative overflow-hidden" data-aos="fade-up" data-aos-delay="100">
          <div className="absolute top-0 right-0 w-64 h-64 -mt-10 -mr-20 opacity-20">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
              <path d="M19.906 9c.382 0 .749.057 1.094.162V9a3 3 0 00-3-3h-3.879a.75.75 0 01-.53-.22L11.47 3.66A2.25 2.25 0 009.879 3H6a3 3 0 00-3 3v3.162A3.756 3.756 0 014.094 9h15.812zM4.094 10.5a2.25 2.25 0 00-2.227 2.568l.857 6A2.25 2.25 0 004.951 21H19.05a2.25 2.25 0 002.227-1.932l.857-6a2.25 2.25 0 00-2.227-2.568H4.094z" />
            </svg>
          </div>
          <div className="relative z-10">
            <h2 className="text-3xl font-bold mb-4 text-white">Cần tư vấn về dịch vụ y tế?</h2>
            <p className="text-lg opacity-90 mb-6 max-w-2xl">
              Chúng tôi cung cấp tư vấn miễn phí để giúp bạn lựa chọn dịch vụ y tế phù hợp nhất với nhu cầu của bạn.
            </p>
            <div className="flex flex-wrap gap-4">
              <Link to="/appointment" className="bg-white text-primary hover:bg-gray-100 px-6 py-3 rounded-lg font-medium transition-all flex items-center">
                <FaCalendarAlt className="mr-2" /> Đặt Lịch Tư Vấn
              </Link>
              <Link to="/contact" className="bg-transparent border-2 border-white text-white hover:bg-white/10 px-6 py-3 rounded-lg font-medium transition-all">
                Liên Hệ Ngay
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Services; 
