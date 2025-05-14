import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../utils/api';
import { DoctorCard } from '../../components/user';
import { FaSearch, FaUserMd, FaHospital, FaStethoscope, FaStar, FaFilter, FaCalendarCheck, FaChevronDown, FaTimes } from 'react-icons/fa';

const Doctors = () => {
  // Filter states
  const [selectedDepartment, setSelectedDepartment] = useState('');
  const [selectedBranch, setSelectedBranch] = useState('');
  const [selectedRating, setSelectedRating] = useState('');
  const [selectedExperience, setSelectedExperience] = useState('');
  const [selectedAvailability, setSelectedAvailability] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Data states
  const [allDoctors, setAllDoctors] = useState([]);
  const [filteredDoctors, setFilteredDoctors] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [branches, setBranches] = useState([]);
  const [activeFilters, setActiveFilters] = useState(0);

  // Add state for debug panel
  const [showDebug, setShowDebug] = useState(false);

  // Fetch data on component mount
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        console.log('Fetching data...');
        
        // Fetch doctors
        const doctorsResponse = await api.get('/doctors');
        console.log('Doctors data:', doctorsResponse.data);
        
        // Fetch specialties (departments)
        const specialtiesResponse = await api.get('/specialties');
        console.log('Specialties data:', specialtiesResponse.data);
        
        // Fetch hospitals (branches)
        const hospitalsResponse = await api.get('/hospitals');
        console.log('Hospitals data:', hospitalsResponse.data);
        
        // Process doctors data
        let doctorsData = [];
        if (doctorsResponse.data) {
          if (Array.isArray(doctorsResponse.data.data)) {
            doctorsData = doctorsResponse.data.data;
          } else if (doctorsResponse.data.data && typeof doctorsResponse.data.data === 'object') {
            if (doctorsResponse.data.data.doctors && Array.isArray(doctorsResponse.data.data.doctors)) {
              doctorsData = doctorsResponse.data.data.doctors;
            } else {
              doctorsData = Object.values(doctorsResponse.data.data);
            }
          }
        }
        console.log('Processed doctors data:', doctorsData);
        
        // Update the fallback doctor data to match with the fallback specialties and branches
        if (doctorsData.length === 0) {
          doctorsData = [
            {
              _id: 'doc1',
              user: { fullName: 'BS. Nguyễn Văn A', avatarUrl: '' },
              specialtyId: { _id: 'sp1', name: 'Khoa Tim Mạch' },
              hospitalId: { _id: 'br1', name: 'Chi nhánh Quận 1' },
              experience: 10,
              rating: 4.5,
              numReviews: 45
            },
            {
              _id: 'doc2',
              user: { fullName: 'BS. Trần Thị B', avatarUrl: '' },
              specialtyId: { _id: 'sp2', name: 'Khoa Nội' },
              hospitalId: { _id: 'br2', name: 'Chi nhánh Quận 3' },
              experience: 8,
              rating: 4.2,
              numReviews: 32
            },
            {
              _id: 'doc3',
              user: { fullName: 'BS. Lê Văn C', avatarUrl: '' },
              specialtyId: { _id: 'sp3', name: 'Khoa Ngoại' },
              hospitalId: { _id: 'br3', name: 'Chi nhánh Quận 7' },
              experience: 15,
              rating: 4.8,
              numReviews: 78
            }
          ];
          console.log('Using fallback doctor data');
        }
        
        setAllDoctors(doctorsData);
        setFilteredDoctors(doctorsData);
        
        // Process specialties data
        let departmentsData = [];
        if (specialtiesResponse.data) {
          if (Array.isArray(specialtiesResponse.data.data)) {
            departmentsData = specialtiesResponse.data.data;
          } else if (specialtiesResponse.data.data && typeof specialtiesResponse.data.data === 'object') {
            if (specialtiesResponse.data.data.specialties && Array.isArray(specialtiesResponse.data.data.specialties)) {
              departmentsData = specialtiesResponse.data.data.specialties;
            } else {
              departmentsData = Object.values(specialtiesResponse.data.data);
            }
          }
        }
        console.log('Processed specialties data:', departmentsData);
        
        // If no specialties data from API, use fallback data
        if (departmentsData.length === 0) {
          departmentsData = [
            { _id: 'sp1', name: 'Khoa Tim Mạch' },
            { _id: 'sp2', name: 'Khoa Nội' },
            { _id: 'sp3', name: 'Khoa Ngoại' },
            { _id: 'sp4', name: 'Khoa Sản' },
            { _id: 'sp5', name: 'Khoa Nhi' }
          ];
          console.log('Using fallback specialty data');
        }
        
        setDepartments(departmentsData);
        
        // Process hospitals data
        let branchesData = [];
        if (hospitalsResponse.data) {
          if (Array.isArray(hospitalsResponse.data.data)) {
            branchesData = hospitalsResponse.data.data;
          } else if (hospitalsResponse.data.data && typeof hospitalsResponse.data.data === 'object') {
            if (hospitalsResponse.data.data.hospitals && Array.isArray(hospitalsResponse.data.data.hospitals)) {
              branchesData = hospitalsResponse.data.data.hospitals;
            } else {
              branchesData = Object.values(hospitalsResponse.data.data);
            }
          }
        }
        console.log('Processed branches data:', branchesData);
        
        // If no branches data from API, use fallback data
        if (branchesData.length === 0) {
          branchesData = [
            { _id: 'br1', name: 'Chi nhánh Quận 1' },
            { _id: 'br2', name: 'Chi nhánh Quận 3' },
            { _id: 'br3', name: 'Chi nhánh Quận 7' },
            { _id: 'br4', name: 'Chi nhánh Tân Bình' },
            { _id: 'br5', name: 'Chi nhánh Bình Thạnh' }
          ];
          console.log('Using fallback branch data');
        }
        
        setBranches(branchesData);
        
        setError(null);
      } catch (err) {
        console.error('Error fetching data:', err);
        
        // Set fallback data in case of error
        setError('Failed to load some data. Using default options for filters.');
        
        // Fallback specialties data
        const fallbackSpecialties = [
          { _id: 'sp1', name: 'Khoa Tim Mạch' },
          { _id: 'sp2', name: 'Khoa Nội' },
          { _id: 'sp3', name: 'Khoa Ngoại' },
          { _id: 'sp4', name: 'Khoa Sản' },
          { _id: 'sp5', name: 'Khoa Nhi' }
        ];
        setDepartments(fallbackSpecialties);
        
        // Fallback branches data
        const fallbackBranches = [
          { _id: 'br1', name: 'Chi nhánh Quận 1' },
          { _id: 'br2', name: 'Chi nhánh Quận 3' },
          { _id: 'br3', name: 'Chi nhánh Quận 7' },
          { _id: 'br4', name: 'Chi nhánh Tân Bình' },
          { _id: 'br5', name: 'Chi nhánh Bình Thạnh' }
        ];
        setBranches(fallbackBranches);
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, []);

  // Apply filters when filter values change
  useEffect(() => {
    if (!allDoctors.length) return;
    
    const filtered = allDoctors.filter(doctor => {
      const matchesDepartment = selectedDepartment ? doctor.specialtyId?._id === selectedDepartment : true;
      const matchesBranch = selectedBranch ? doctor.hospitalId?._id === selectedBranch : true;
      
      // Filter by search query
      const matchesSearch = searchQuery ? 
        (doctor.user?.fullName?.toLowerCase().includes(searchQuery.toLowerCase()) || 
        doctor.specialtyId?.name?.toLowerCase().includes(searchQuery.toLowerCase())) : 
        true;
      
      // Filter by rating
      let matchesRating = true;
      if (selectedRating) {
        const rating = doctor.avgRating || 
                      (doctor.ratings && doctor.ratings.average) || 
                      doctor.rating || 0;
        
        switch(selectedRating) {
          case '4+':
            matchesRating = rating >= 4;
            break;
          case '3+':
            matchesRating = rating >= 3;
            break;
          case 'all':
          default:
            matchesRating = true;
        }
      }
      
      // Filter by experience
      let matchesExperience = true;
      if (selectedExperience) {
        const experience = doctor.experience || 
                          doctor.yearsOfExperience || 
                          (doctor.workExperience ? doctor.workExperience.years : 0);
        
        switch(selectedExperience) {
          case '10+':
            matchesExperience = experience >= 10;
            break;
          case '5+':
            matchesExperience = experience >= 5;
            break;
          case '0+':
          default:
            matchesExperience = true;
        }
      }
      
      // Filter by availability (this would need real availability data)
      let matchesAvailability = true;
      if (selectedAvailability) {
        // This is just a placeholder - real implementation would check actual availability
        matchesAvailability = selectedAvailability === 'all' ? true : (doctor.isAvailable === true);
      }
      
      return matchesDepartment && matchesBranch && matchesSearch && matchesRating && matchesExperience && matchesAvailability;
    });
    
    setFilteredDoctors(filtered);
  }, [selectedDepartment, selectedBranch, searchQuery, selectedRating, selectedExperience, selectedAvailability, allDoctors]);

  // Count active filters
  useEffect(() => {
    let count = 0;
    if (selectedDepartment) count++;
    if (selectedBranch) count++;
    if (selectedRating && selectedRating !== 'all') count++;
    if (selectedExperience && selectedExperience !== '0+') count++;
    if (selectedAvailability && selectedAvailability !== 'all') count++;
    setActiveFilters(count);
  }, [selectedDepartment, selectedBranch, selectedRating, selectedExperience, selectedAvailability]);

  // Handle filter changes
  const handleDepartmentChange = (e) => {
    setSelectedDepartment(e.target.value);
  };

  const handleBranchChange = (e) => {
    setSelectedBranch(e.target.value);
  };

  const handleRatingChange = (e) => {
    setSelectedRating(e.target.value);
  };

  const handleExperienceChange = (e) => {
    setSelectedExperience(e.target.value);
  };

  const handleAvailabilityChange = (e) => {
    setSelectedAvailability(e.target.value);
  };

  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
  };

  // Clear all filters
  const clearFilters = () => {
    setSelectedDepartment('');
    setSelectedBranch('');
    setSelectedRating('');
    setSelectedExperience('');
    setSelectedAvailability('');
    setSearchQuery('');
  };
  
  // Toggle filter visibility on mobile
  const toggleFilters = () => {
    setShowFilters(!showFilters);
  };

  // Function to toggle debug panel
  const toggleDebug = () => {
    setShowDebug(!showDebug);
  };

  // CSS for consistent dropdown styling
  const selectStyles = "w-full p-2.5 bg-gray-50 border border-gray-300 text-gray-900 rounded-lg focus:ring-primary focus:border-primary appearance-none cursor-pointer pr-10";

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh]">
        <div className="w-12 h-12 border-4 border-gray-300 border-t-primary rounded-full animate-spin mb-4"></div>
        <p className="text-gray-600">Đang tải thông tin bác sĩ...</p>
      </div>
    );
  }

  if (error) {
    // Don't show the error message if we're using fallback data
    if (departments.length === 0 && branches.length === 0 && allDoctors.length === 0) {
      return (
        <div className="bg-red-50 border border-red-200 rounded-lg p-8 text-center max-w-2xl mx-auto my-8">
          <h2 className="text-2xl font-bold text-red-600 mb-3">Đã xảy ra lỗi</h2>
          <p className="text-gray-700 mb-4">{error}</p>
          <button 
            onClick={() => window.location.reload()} 
            className="bg-primary text-white hover:bg-primary-dark px-4 py-2 rounded-lg font-medium transition-all"
          >
            Thử lại
          </button>
        </div>
      );
    }
    // Otherwise just continue to render the page with the fallback data
  }

  return (
    <div className="bg-gray-50 min-h-screen">
      {/* Data Source Warning - added condition to check for fallback doctor data too */}
      {error && (departments.length > 0 || branches.length > 0 || allDoctors.length > 0) && (
        <div className="fixed top-0 left-0 right-0 bg-yellow-100 border-b border-yellow-200 text-yellow-800 py-2 px-4 text-center z-50">
          <p className="text-sm">
            Đang sử dụng dữ liệu mẫu cho một số bộ lọc. Dữ liệu thực có thể khác.
            <button 
              onClick={() => window.location.reload()} 
              className="ml-2 text-primary hover:underline"
            >
              Tải lại
            </button>
          </p>
        </div>
      )}

      {/* Hero Section */}
      <section className="bg-gradient-to-r from-primary to-blue-700 relative py-20 overflow-hidden">
        <div className="absolute inset-0 overflow-hidden">
          <img 
            src="https://img.freepik.com/free-photo/team-young-specialist-doctors-standing-corridor-hospital_1303-21199.jpg"
            alt="Doctors background" 
            className="w-full h-full object-cover object-center opacity-20" 
          />
        </div>
        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-3xl mx-auto text-center text-white">
            <h1 className="text-4xl md:text-5xl font-bold mb-4 text-white">Đội Ngũ Bác Sĩ</h1>
            <p className="text-xl opacity-90 mb-8">
              Đội ngũ bác sĩ chuyên nghiệp, giàu kinh nghiệm của chúng tôi luôn sẵn sàng phục vụ quý khách
            </p>
            <div className="relative max-w-xl mx-auto">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <FaSearch className="h-5 w-5 text-gray-400" />
              </div>
              <input 
                type="text" 
                className="block w-full bg-white/90 backdrop-blur-sm border-0 pl-10 pr-10 py-4 rounded-full shadow-lg focus:ring-2 focus:ring-primary-light placeholder-gray-500 text-gray-800"
                placeholder="Tìm kiếm theo tên bác sĩ hoặc chuyên khoa..."
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

      <div className="container mx-auto px-4 py-12">
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
        <div className={`${showFilters ? 'block' : 'hidden'} md:block`}>
          <div className="bg-white rounded-xl shadow-sm p-6 mb-8">
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
              
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
              {/* Department/Specialty Filter */}
              <div>
                <div className="flex justify-between items-center mb-2">
                  <label htmlFor="department" className="block text-sm font-medium text-gray-700">Chuyên khoa</label>
                  {departments.length > 0 && departments[0]._id.startsWith('sp') && (
                    <span className="text-xs text-gray-500 italic">Dữ liệu mẫu</span>
                  )}
                </div>
                <div className="relative">
                  <select 
                    id="department"
                    className={selectStyles}
                    value={selectedDepartment}
                    onChange={handleDepartmentChange}
                  >
                    <option value="">Tất cả chuyên khoa</option>
                    {Array.isArray(departments) && departments.map(dept => (
                      <option key={dept._id} value={dept._id}>
                        {dept.name}
                      </option>
                    ))}
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
                    <FaChevronDown className="h-4 w-4" />
                  </div>
                </div>
              </div>
              
              {/* Branch/Hospital Filter */}
              <div>
                <div className="flex justify-between items-center mb-2">
                  <label htmlFor="branch" className="block text-sm font-medium text-gray-700">Chi nhánh</label>
                  {branches.length > 0 && branches[0]._id.startsWith('br') && (
                    <span className="text-xs text-gray-500 italic">Dữ liệu mẫu</span>
                  )}
                </div>
                <div className="relative">
                  <select 
                    id="branch"
                    className={selectStyles}
                    value={selectedBranch}
                    onChange={handleBranchChange}
                  >
                    <option value="">Tất cả chi nhánh</option>
                    {Array.isArray(branches) && branches.map(branch => (
                      <option key={branch._id} value={branch._id}>
                        {branch.name}
                      </option>
                    ))}
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
                    <FaChevronDown className="h-4 w-4" />
                  </div>
                </div>
              </div>
              
              {/* Rating Filter */}
              <div>
                <div className="flex justify-between items-center mb-2">
                  <label htmlFor="rating" className="block text-sm font-medium text-gray-700">Đánh giá</label>
                </div>
                <div className="relative">
                  <select 
                    id="rating"
                    className={selectStyles}
                    value={selectedRating}
                    onChange={handleRatingChange}
                  >
                    <option value="">Tất cả đánh giá</option>
                    <option value="4+">4 sao trở lên</option>
                    <option value="3+">3 sao trở lên</option>
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
                    <FaChevronDown className="h-4 w-4" />
                  </div>
                </div>
              </div>
              
              {/* Experience Filter */}
              <div>
                <div className="flex justify-between items-center mb-2">
                  <label htmlFor="experience" className="block text-sm font-medium text-gray-700">Kinh nghiệm</label>
                </div>
                <div className="relative">
                  <select 
                    id="experience"
                    className={selectStyles}
                    value={selectedExperience}
                    onChange={handleExperienceChange}
                  >
                    <option value="">Tất cả</option>
                    <option value="10+">Trên 10 năm</option>
                    <option value="5+">Trên 5 năm</option>
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
                    <FaChevronDown className="h-4 w-4" />
                  </div>
                </div>
              </div>
              
              {/* Availability Filter */}
              <div>
                <div className="flex justify-between items-center mb-2">
                  <label htmlFor="availability" className="block text-sm font-medium text-gray-700">Lịch khám</label>
                </div>
                <div className="relative">
                  <select 
                    id="availability"
                    className={selectStyles}
                    value={selectedAvailability}
                    onChange={handleAvailabilityChange}
                  >
                    <option value="">Tất cả</option>
                    <option value="available">Còn lịch hôm nay</option>
                    <option value="week">Còn lịch tuần này</option>
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
                    <FaChevronDown className="h-4 w-4" />
                  </div>
                </div>
              </div>
            </div>
            
            {/* Active Filters */}
            {activeFilters > 0 && (
              <div className="mt-6 flex flex-wrap gap-2">
                {selectedDepartment && (
                  <div className="inline-flex items-center bg-blue-50 text-blue-800 text-xs font-medium rounded-full px-3 py-1.5">
                    {departments.find(d => d._id === selectedDepartment)?.name || 'Chuyên khoa'}
                    <button 
                      className="ml-1.5 text-blue-600 hover:text-blue-800"
                      onClick={() => setSelectedDepartment('')}
                    >
                      <FaTimes />
                    </button>
                  </div>
                )}
                
                {selectedBranch && (
                  <div className="inline-flex items-center bg-green-50 text-green-800 text-xs font-medium rounded-full px-3 py-1.5">
                    {branches.find(b => b._id === selectedBranch)?.name || 'Chi nhánh'}
                    <button 
                      className="ml-1.5 text-green-600 hover:text-green-800"
                      onClick={() => setSelectedBranch('')}
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
                
                {selectedExperience && (
                  <div className="inline-flex items-center bg-purple-50 text-purple-800 text-xs font-medium rounded-full px-3 py-1.5">
                    {selectedExperience === '10+' ? 'Trên 10 năm' : selectedExperience === '5+' ? 'Trên 5 năm' : 'Kinh nghiệm'}
                    <button 
                      className="ml-1.5 text-purple-600 hover:text-purple-800"
                      onClick={() => setSelectedExperience('')}
                    >
                      <FaTimes />
                    </button>
                  </div>
                )}
                
                {selectedAvailability && (
                  <div className="inline-flex items-center bg-indigo-50 text-indigo-800 text-xs font-medium rounded-full px-3 py-1.5">
                    {selectedAvailability === 'available' ? 'Còn lịch hôm nay' : 'Còn lịch tuần này'}
                    <button 
                      className="ml-1.5 text-indigo-600 hover:text-indigo-800"
                      onClick={() => setSelectedAvailability('')}
                    >
                      <FaTimes />
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-800 flex items-center">
            <FaUserMd className="text-primary mr-2" />
            Danh Sách Bác Sĩ
          </h2>
          <div className="text-gray-600 flex items-center">
            <span className="bg-primary/10 text-primary px-2 py-0.5 rounded-full text-sm font-medium mr-2">{filteredDoctors.length}</span>
            bác sĩ
          </div>
        </div>

        {/* Doctors Grid */}
        {Array.isArray(filteredDoctors) && filteredDoctors.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
            {filteredDoctors.map(doctor => (
              <DoctorCard key={doctor._id} doctor={doctor} />
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-sm p-8 text-center mb-12">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <FaUserMd className="text-gray-400 text-2xl" />
            </div>
            <h3 className="text-xl font-semibold text-gray-800 mb-2">Không tìm thấy bác sĩ</h3>
            <p className="text-gray-600 mb-4 max-w-lg mx-auto">Không tìm thấy bác sĩ nào phù hợp với tiêu chí tìm kiếm của bạn. Vui lòng thử lại với các bộ lọc khác.</p>
            <button 
              className="bg-primary hover:bg-primary-dark text-white font-medium py-2 px-4 rounded-lg transition-colors" 
              onClick={clearFilters}
            >
              Xóa bộ lọc
            </button>
          </div>
        )}

        {/* CTA Section */}
        <div className="bg-gradient-to-r from-primary to-blue-700 rounded-xl p-8 md:p-12 text-white shadow-lg relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 -mt-10 -mr-20 opacity-20">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 2a8 8 0 100 16 8 8 0 000-16zm-3.707 6.293a1 1 0 011.414 0L10 10.586l2.293-2.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="relative z-10">
            <h2 className="text-3xl font-bold mb-4 text-white">Cần hỗ trợ thêm?</h2>
            <p className="text-lg opacity-90 mb-6 max-w-2xl">
              Đội ngũ hỗ trợ của chúng tôi luôn sẵn sàng giúp bạn tìm bác sĩ phù hợp nhất với nhu cầu của bạn.
            </p>
            <div className="flex flex-wrap gap-4">
              <Link to="/appointment" className="bg-white text-primary hover:bg-gray-100 px-6 py-3 rounded-lg font-medium transition-all flex items-center">
                Đặt Lịch Khám
              </Link>
              <Link to="/contact" className="bg-transparent border-2 border-white text-white hover:bg-white/10 px-6 py-3 rounded-lg font-medium transition-all">
                Liên Hệ Hỗ Trợ
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Debug Button - Fixed position at the bottom right */}
      <button
        onClick={toggleDebug}
        className="fixed bottom-4 right-4 bg-gray-800 text-white p-2 rounded-full shadow-lg z-50 opacity-70 hover:opacity-100"
        title="Debug Info"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd" />
        </svg>
      </button>

      {/* Debug Panel */}
      {showDebug && (
        <div className="fixed bottom-16 right-4 bg-white p-4 rounded-md shadow-lg z-50 text-xs max-w-sm max-h-96 overflow-auto">
          <h3 className="font-bold mb-2">Debug Info</h3>
          <div className="space-y-2">
            <div>
              <p><strong>Error state:</strong> {error ? 'Yes' : 'No'}</p>
              <p><strong>Loading state:</strong> {loading ? 'Yes' : 'No'}</p>
              <p><strong>Active filters:</strong> {activeFilters}</p>
            </div>
            <div>
              <p><strong>Departments:</strong> {departments.length}</p>
              <p><strong>Branches:</strong> {branches.length}</p>
              <p><strong>All Doctors:</strong> {allDoctors.length}</p>
              <p><strong>Filtered Doctors:</strong> {filteredDoctors.length}</p>
            </div>
            <div>
              <p><strong>Selected Department:</strong> {selectedDepartment || 'None'}</p>
              <p><strong>Selected Branch:</strong> {selectedBranch || 'None'}</p>
              <p><strong>Selected Rating:</strong> {selectedRating || 'None'}</p>
              <p><strong>Selected Experience:</strong> {selectedExperience || 'None'}</p>
              <p><strong>Selected Availability:</strong> {selectedAvailability || 'None'}</p>
            </div>
            <button 
              onClick={toggleDebug}
              className="mt-2 bg-gray-200 px-2 py-1 rounded text-gray-700 hover:bg-gray-300 w-full"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Doctors; 
