import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../../utils/api';
import { useAuth } from '../../context/AuthContext';
import { HospitalCard } from '../../components/user';
import { FaHospital, FaSearch, FaMapMarkerAlt, FaPhone, FaCalendarAlt, FaFilter, FaChevronDown, FaTimes, FaBuilding, FaStar } from 'react-icons/fa';

const Branches = () => {
  // Filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLocation, setSelectedLocation] = useState('');
  const [selectedService, setSelectedService] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [selectedRating, setSelectedRating] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  
  // Data states
  const [branches, setBranches] = useState([]);
  const [filteredBranches, setFilteredBranches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [locations, setLocations] = useState([]);
  const [services, setServices] = useState([]);
  const [activeFilters, setActiveFilters] = useState(0);
  
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

  // Fetch branches data
  useEffect(() => {
    const fetchBranches = async () => {
      setLoading(true);
      try {
        const [branchesResponse, servicesResponse] = await Promise.all([
          api.get('/hospitals', { params: { includeServices: true } }),
          api.get('/services')
        ]);
        
        console.log('Branches data:', branchesResponse.data);
        
        // Xử lý cả hai định dạng dữ liệu
        let branchesData = [];
        if (branchesResponse.data) {
          if (Array.isArray(branchesResponse.data.data)) {
            branchesData = branchesResponse.data.data;
          } else if (branchesResponse.data.data && branchesResponse.data.data.hospitals) {
            // Trường hợp cấu trúc mới: { data: { hospitals: [...] } }
            branchesData = branchesResponse.data.data.hospitals;
          }
        }
        
        // Lọc chỉ hiển thị các chi nhánh đang hoạt động (isActive=true)
        branchesData = branchesData.filter(branch => branch.isActive === true);
        
        // Extract unique locations from branch addresses
        const locationSet = new Set();
        branchesData.forEach(branch => {
          if (branch.address) {
            // Extract city or district from address
            const addressParts = branch.address.split(',');
            if (addressParts.length > 1) {
              const location = addressParts[addressParts.length - 2].trim();
              locationSet.add(location);
            }
          }
        });
        setLocations(Array.from(locationSet).sort());
        
        // Get services list
        let servicesData = [];
        if (servicesResponse.data && servicesResponse.data.data) {
          servicesData = Array.isArray(servicesResponse.data.data) 
            ? servicesResponse.data.data 
            : [];
        }
        setServices(servicesData);
        
        setBranches(branchesData);
        setFilteredBranches(branchesData);
        setError(null);
      } catch (err) {
        console.error('Error fetching branches:', err);
        setError('Failed to load branches. Please try again later.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchBranches();
  }, []);

  // Filter branches when filter values change
  useEffect(() => {
    if (!branches.length) return;
    
    const filtered = branches.filter(branch => {
      // Search filter
      const matchesSearch = searchQuery 
        ? (branch.name?.toLowerCase().includes(searchQuery.toLowerCase()) || 
           branch.address?.toLowerCase().includes(searchQuery.toLowerCase()))
        : true;
      
      // Location filter
      const matchesLocation = selectedLocation
        ? branch.address?.includes(selectedLocation)
        : true;
      
      // Service filter
      const matchesService = selectedService
        ? (branch.services?.some(service => 
            service._id === selectedService || service.id === selectedService
          ) || false)
        : true;
      
      // Status filter
      const matchesStatus = selectedStatus
        ? (selectedStatus === 'active' ? branch.isActive !== false : branch.isActive === false)
        : true;
      
      // Rating filter
      let matchesRating = true;
      if (selectedRating) {
        const rating = branch.avgRating || 
                      branch.averageRating || 
                      branch.rating || 0;
                      
        switch(selectedRating) {
          case '4+':
            matchesRating = rating >= 4;
            break;
          case '3+':
            matchesRating = rating >= 3;
            break;
          default:
            matchesRating = true;
        }
      }
      
      return matchesSearch && matchesLocation && matchesService && matchesStatus && matchesRating;
    });
    
    setFilteredBranches(filtered);
  }, [branches, searchQuery, selectedLocation, selectedService, selectedStatus, selectedRating]);

  // Count active filters
  useEffect(() => {
    let count = 0;
    if (selectedLocation) count++;
    if (selectedService) count++;
    if (selectedStatus) count++;
    if (selectedRating) count++;
    setActiveFilters(count);
  }, [selectedLocation, selectedService, selectedStatus, selectedRating]);

  // Handler functions
  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
  };

  const handleLocationChange = (e) => {
    setSelectedLocation(e.target.value);
  };

  const handleServiceChange = (e) => {
    setSelectedService(e.target.value);
  };

  const handleStatusChange = (e) => {
    setSelectedStatus(e.target.value);
  };

  const handleRatingChange = (e) => {
    setSelectedRating(e.target.value);
  };

  const clearFilters = () => {
    setSelectedLocation('');
    setSelectedService('');
    setSelectedStatus('');
    setSelectedRating('');
  };
  
  const toggleFilters = () => {
    setShowFilters(!showFilters);
  };

  const handleAppointmentClick = (branchId) => {
    if (!isAuthenticated) {
      navigate('/auth', { state: { from: `/appointment?branch=${branchId}` } });
      return;
    }
    
    navigate(`/appointment?branch=${branchId}`);
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] py-12">
        <div className="inline-block w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mb-4"></div>
        <p className="text-gray-600">Đang tải danh sách chi nhánh...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-8 text-center max-w-2xl mx-auto my-8">
        <h2 className="text-2xl font-bold text-red-600 mb-3">Đã xảy ra lỗi!</h2>
        <p className="text-gray-700 mb-4">{error}</p>
        <button onClick={() => window.location.reload()} className="bg-primary text-white hover:bg-primary-dark px-4 py-2 rounded-lg font-medium transition-all">
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
            src="https://img.freepik.com/free-photo/hospital-building-modern-parking-lot_1127-3616.jpg"
            alt="Branches background" 
            className="w-full h-full object-cover object-center opacity-20" 
          />
        </div>
        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-3xl mx-auto text-center text-white">
            <h1 className="text-4xl md:text-5xl font-bold mb-4 text-white">Các Chi Nhánh</h1>
            <p className="text-xl opacity-90 mb-8">
              Tìm chi nhánh gần nhất để được chăm sóc sức khỏe chất lượng cao
            </p>
            <div className="relative max-w-xl mx-auto">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <FaSearch className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                className="block w-full bg-white/90 backdrop-blur-sm border-0 pl-10 pr-10 py-4 rounded-full shadow-lg focus:ring-2 focus:ring-primary-light placeholder-gray-500 text-gray-800"
                placeholder="Tìm kiếm theo tên hoặc địa chỉ..."
                value={searchQuery}
                onChange={handleSearchChange}
              />
              {searchQuery && (
                <button 
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-500 hover:text-gray-700"
                  onClick={() => setSearchQuery('')}
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

      {/* Branches List Section */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          {/* Mobile Filter Toggle */}
          <div className="md:hidden mb-4">
            <button 
              onClick={toggleFilters}
              className="w-full py-3 px-4 bg-white rounded-lg shadow-sm border border-gray-200 flex justify-between items-center"
            >
              <div className="flex items-center">
                <FaFilter className="text-primary mr-2" />
                <span className="font-medium">Lọc kết quả</span>
                {activeFilters > 0 && (
                  <span className="ml-2 bg-primary text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                    {activeFilters}
                  </span>
                )}
              </div>
              <FaChevronDown className={`text-gray-500 transition-transform ${showFilters ? 'rotate-180' : ''}`} />
            </button>
          </div>

          {/* Filters */}
          <div className={`${showFilters ? 'block' : 'hidden'} md:block mb-8`}>
            <div className="bg-white rounded-xl shadow-sm p-6">
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
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {/* Location Filter */}
                <div>
                  <label htmlFor="location" className="block text-sm font-medium text-gray-700 mb-2">
                    Khu vực
                  </label>
                  <select 
                    id="location"
                    className="w-full p-2.5 bg-gray-50 border border-gray-300 text-gray-900 rounded-lg focus:ring-primary focus:border-primary"
                    value={selectedLocation}
                    onChange={handleLocationChange}
                  >
                    <option value="">Tất cả khu vực</option>
                    {locations.map((location, index) => (
                      <option key={index} value={location}>
                        {location}
                      </option>
                    ))}
                  </select>
                </div>
                
                {/* Service Filter */}
                <div>
                  <label htmlFor="service" className="block text-sm font-medium text-gray-700 mb-2">
                    Dịch vụ
                  </label>
                  <select 
                    id="service"
                    className="w-full p-2.5 bg-gray-50 border border-gray-300 text-gray-900 rounded-lg focus:ring-primary focus:border-primary"
                    value={selectedService}
                    onChange={handleServiceChange}
                  >
                    <option value="">Tất cả dịch vụ</option>
                    {services.map(service => (
                      <option key={service._id} value={service._id}>
                        {service.name}
                      </option>
                    ))}
                  </select>
                </div>
                
                {/* Status Filter */}
                <div>
                  <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-2">
                    Trạng thái
                  </label>
                  <select 
                    id="status"
                    className="w-full p-2.5 bg-gray-50 border border-gray-300 text-gray-900 rounded-lg focus:ring-primary focus:border-primary"
                    value={selectedStatus}
                    onChange={handleStatusChange}
                  >
                    <option value="">Tất cả trạng thái</option>
                    <option value="active">Đang hoạt động</option>
                    <option value="inactive">Tạm ngưng</option>
                  </select>
                </div>
                
                {/* Rating Filter */}
                <div>
                  <label htmlFor="rating" className="block text-sm font-medium text-gray-700 mb-2">
                    Đánh giá
                  </label>
                  <select 
                    id="rating"
                    className="w-full p-2.5 bg-gray-50 border border-gray-300 text-gray-900 rounded-lg focus:ring-primary focus:border-primary"
                    value={selectedRating}
                    onChange={handleRatingChange}
                  >
                    <option value="">Tất cả đánh giá</option>
                    <option value="4+">4 sao trở lên</option>
                    <option value="3+">3 sao trở lên</option>
                  </select>
                </div>
              </div>
              
              {/* Active Filters */}
              {activeFilters > 0 && (
                <div className="mt-6 flex flex-wrap gap-2">
                  {selectedLocation && (
                    <div className="inline-flex items-center bg-blue-50 text-blue-800 text-xs font-medium rounded-full px-3 py-1.5">
                      {selectedLocation}
                      <button 
                        className="ml-1.5 text-blue-600 hover:text-blue-800"
                        onClick={() => setSelectedLocation('')}
                      >
                        <FaTimes />
                      </button>
                    </div>
                  )}
                  
                  {selectedService && (
                    <div className="inline-flex items-center bg-green-50 text-green-800 text-xs font-medium rounded-full px-3 py-1.5">
                      {services.find(s => s._id === selectedService)?.name || 'Dịch vụ'}
                      <button 
                        className="ml-1.5 text-green-600 hover:text-green-800"
                        onClick={() => setSelectedService('')}
                      >
                        <FaTimes />
                      </button>
                    </div>
                  )}
                  
                  {selectedStatus && (
                    <div className="inline-flex items-center bg-purple-50 text-purple-800 text-xs font-medium rounded-full px-3 py-1.5">
                      {selectedStatus === 'active' ? 'Đang hoạt động' : 'Tạm ngưng'}
                      <button 
                        className="ml-1.5 text-purple-600 hover:text-purple-800"
                        onClick={() => setSelectedStatus('')}
                      >
                        <FaTimes />
                      </button>
                    </div>
                  )}
                  
                  {selectedRating && (
                    <div className="inline-flex items-center bg-yellow-50 text-yellow-800 text-xs font-medium rounded-full px-3 py-1.5">
                      {selectedRating === '4+' ? '4 sao trở lên' : selectedRating === '3+' ? '3 sao trở lên' : 'Đánh giá'}
                      <button 
                        className="ml-1.5 text-yellow-600 hover:text-yellow-800"
                        onClick={() => setSelectedRating('')}
                      >
                        <FaTimes />
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center justify-between mb-8">
            <h2 className="text-3xl font-bold text-gray-800 flex items-center">
              <FaHospital className="text-primary mr-3" />
              Danh sách chi nhánh
            </h2>
            <div className="text-gray-600 flex items-center">
              <span className="bg-primary/10 text-primary px-2 py-0.5 rounded-full text-sm font-medium mr-2">{filteredBranches.length}</span>
              chi nhánh
            </div>
          </div>

          {filteredBranches.length === 0 ? (
            <div className="bg-white rounded-xl p-8 text-center shadow-sm border border-gray-200">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <FaHospital className="text-3xl text-gray-400" />
              </div>
              <h3 className="text-xl font-semibold text-gray-800 mb-2">Không tìm thấy chi nhánh</h3>
              <p className="text-gray-600 mb-6">
                {searchQuery || activeFilters > 0 ? `Không tìm thấy chi nhánh phù hợp với tiêu chí tìm kiếm.` : 'Không có chi nhánh nào.'}
              </p>
              {(searchQuery || activeFilters > 0) && (
                <button 
                  className="bg-primary hover:bg-primary-dark text-white hover:text-white px-6 py-2 rounded-lg font-medium transition-colors inline-flex items-center"
                  onClick={() => {
                    setSearchQuery('');
                    clearFilters();
                  }}
                >
                  <FaTimes className="mr-2" />
                  Xóa tất cả bộ lọc
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {filteredBranches.map(branch => (
                <HospitalCard key={branch._id} hospital={branch} />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Call to Action Section */}
      <section className="py-16 bg-gradient-to-r from-primary to-blue-700 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <svg xmlns="http://www.w3.org/2000/svg" width="100%" height="100%">
            <defs>
              <pattern id="pattern" width="40" height="40" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
                <rect width="100%" height="100%" fill="none"/>
                <circle cx="20" cy="20" r="1.5" fill="currentColor" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#pattern)" />
          </svg>
        </div>
        <div className="container mx-auto px-4 relative">
          <div className="max-w-4xl mx-auto text-center text-white">
            <h2 className="text-3xl md:text-4xl font-bold mb-4 text-white">Cần Tư Vấn Hoặc Đặt Lịch?</h2>
            <p className="text-lg mb-8 opacity-90">Liên hệ với chúng tôi để được hỗ trợ tìm chi nhánh phù hợp nhất với nhu cầu của bạn.</p>
            <div className="flex flex-wrap justify-center gap-4">
              <a href="tel:(028)38221234" className="bg-white text-primary hover:bg-gray-100 hover:text-primary px-6 py-3 rounded-lg font-medium transition-all flex items-center">
                <FaPhone className="mr-2" /> Gọi Hotline
              </a>
              <Link to="/appointment" className="bg-transparent text-white border-2 border-white hover:bg-white hover:text-primary px-6 py-3 rounded-lg font-medium transition-all flex items-center">
                <FaCalendarAlt className="mr-2" /> Đặt Lịch Ngay
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Branches; 
