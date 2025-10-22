import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../utils/api';
import { FaHospitalAlt, FaUserMd, FaStar, FaCalendarCheck, FaMapMarkerAlt, FaPhone, FaAngleRight, FaChevronLeft, FaChevronRight, FaRegClock, FaHospital } from 'react-icons/fa';
import { Splide, SplideSlide, SplideTrack } from '@splidejs/react-splide';
import '@splidejs/splide/dist/css/splide.min.css';

// Import images later

const Home = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [featuredDoctors, setFeaturedDoctors] = useState([]);
  const [branches, setBranches] = useState([]);
  const [stats, setStats] = useState({
    reviewsCount: 0,
    doctorsCount: 0,
    branchesCount: 0,
    appointmentsCount: 0
  });
  
  useEffect(() => {
    const fetchHomeData = async () => {
      setLoading(true);
      try {
        // Fetch featured doctors
        const doctorsResponse = await api.get('/doctors', {
          params: {
            limit: 6,
            featured: true
          }
        });
        
        // Fetch branches with services data - limit to 6
        const branchesResponse = await api.get('/hospitals', {
          params: {
            includeServices: true,
            limit: 6
          }
        });
        
        // Fetch statistics
        const statsResponse = await api.get('/reviews/all');
        const doctorsStatsResponse = await api.get('/statistics/doctors');
        const appointmentsStatsResponse = await api.get('/statistics/appointments');
        
        console.log('Doctors response:', doctorsResponse.data);
        console.log('Branches response:', branchesResponse.data);
        
        // Xử lý dữ liệu bác sĩ
        let doctorsData = [];
        if (doctorsResponse.data) {
          if (Array.isArray(doctorsResponse.data.data)) {
            doctorsData = doctorsResponse.data.data;
          } else if (doctorsResponse.data.data && doctorsResponse.data.data.doctors) {
            // Trường hợp cấu trúc mới: { data: { doctors: [...] } }
            doctorsData = doctorsResponse.data.data.doctors;
          }
        }
        
        // Lọc bác sĩ theo trạng thái: chỉ hiển thị các bác sĩ đang hoạt động và tài khoản không bị khóa
        doctorsData = doctorsData.filter(doctor => {
          // Kiểm tra tài khoản user không bị khóa (nếu thông tin có sẵn)
          const userActive = doctor.user ? (doctor.user.isLocked === false) : true;
          return userActive;
        });
        
        setFeaturedDoctors(doctorsData);
        
        // Xử lý dữ liệu chi nhánh
        let branchesData = [];
        if (branchesResponse.data) {
          if (Array.isArray(branchesResponse.data.data)) {
            branchesData = branchesResponse.data.data.slice(0, 6);
          } else if (branchesResponse.data.data && branchesResponse.data.data.hospitals) {
            // Trường hợp cấu trúc mới: { data: { hospitals: [...] } }
            branchesData = branchesResponse.data.data.hospitals.slice(0, 6);
          }
        }
        
        // Lọc chỉ hiển thị các chi nhánh đang hoạt động (isActive=true)
        branchesData = branchesData.filter(branch => branch.isActive === true);
        
        setBranches(branchesData);
        
        if (statsResponse.data) {
          setStats({
            reviewsCount: statsResponse.data.data.totalDocs || 0,
            doctorsCount: doctorsStatsResponse.data.data.totalDoctors || 0,
            branchesCount: branchesResponse.data.count || branchesData.length || 0,
            appointmentsCount: appointmentsStatsResponse.data.data.totalAppointments || 0
          });
        }
        
        setError(null);
      } catch (error) {
        console.error('Error fetching data:', error);
        setError('Không thể tải dữ liệu. Vui lòng thử lại sau.');
      } finally {
        setLoading(false);
      }
    };

    fetchHomeData();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
        <span className="ml-3 text-gray-600">Đang tải...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-8 text-center max-w-2xl mx-auto my-8">
        <h2 className="text-2xl font-bold text-red-600 mb-3">Oops! Something went wrong</h2>
        <p className="text-gray-700 mb-4">{error}</p>
        <button onClick={() => window.location.reload()} className="bg-primary hover:bg-primary-dark text-white px-4 py-2 rounded transition-colors">
          Try Again
        </button>
      </div>
    );
  }

  // Helper function to safely render object properties
  const safeGet = (obj, path, defaultValue = '') => {
    try {
      const keys = path.split('.');
      let result = obj;
      for (const key of keys) {
        if (result === undefined || result === null) return defaultValue;
        result = result[key];
      }
      return result === undefined || result === null ? defaultValue : result;
    } catch (e) {
      return defaultValue;
    }
  };

  // Calculate rating and reviews count
  const getRating = (doctor) => {
    if (typeof doctor.avgRating === 'number') {
      return doctor.avgRating;
    } else if (doctor.avgRating && typeof doctor.avgRating.value === 'number') {
      return doctor.avgRating.value;
    } else if (doctor.rating && typeof doctor.rating === 'number') {
      return doctor.rating;
    } else if (doctor.ratings && typeof doctor.ratings.average === 'number') {
      return doctor.ratings.average;
    }
    return 0;
  };
  
  const getBranchRating = (branch) => {
    if (typeof branch.avgRating === 'number') {
      return branch.avgRating;
    } else if (branch.averageRating && typeof branch.averageRating === 'number') {
      return branch.averageRating;
    } else if (branch.rating && typeof branch.rating === 'number') {
      return branch.rating;
    } else if (branch.ratings && typeof branch.ratings.average === 'number') {
      return branch.ratings.average;
    }
    return 0;
  };
  
  const getReviewsCount = (doctor) => {
    return doctor.numReviews || (doctor.ratings && doctor.ratings.count) || 0;
  };
  
  const getBranchReviewsCount = (branch) => {
    return branch.reviewsCount || branch.numReviews || (branch.ratings && branch.ratings.count) || 0;
  };
  
  const getExperience = (doctor) => {
    return doctor.experience || doctor.yearsOfExperience || (Math.floor(Math.random() * 15) + 5);
  };

  // Custom splide arrows
  const customArrows = (splide, prevButton, nextButton) => {
    return (
      <>
        <button
          className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-1/2 z-10 bg-white/80 hover:bg-white text-primary w-10 h-10 flex items-center justify-center rounded-full shadow-md transform transition-transform duration-200 hover:scale-110 focus:outline-none"
          onClick={prevButton}
        >
          <FaChevronLeft />
        </button>
        <button
          className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2 z-10 bg-white/80 hover:bg-white text-primary w-10 h-10 flex items-center justify-center rounded-full shadow-md transform transition-transform duration-200 hover:scale-110 focus:outline-none"
          onClick={nextButton}
        >
          <FaChevronRight />
        </button>
      </>
    );
  };

  return (
    <div className="min-h-screen">
      {/* Hero Banner */}
      <section className="relative bg-gradient-to-r from-primary to-blue-700 overflow-hidden">
        <div className="absolute inset-0 overflow-hidden">
          <img 
            src="https://img.freepik.com/free-photo/team-young-specialist-doctors-standing-corridor-hospital_1303-21199.jpg"
            alt="Hero Background" 
            className="w-full h-full object-cover object-center opacity-30" 
          />
        </div>
        <div className="relative container mx-auto px-4 py-24 md:py-32">
          <div className="max-w-3xl mx-auto text-center text-white">
            <div className="space-y-6">
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold leading-tight text-white">
                Chăm Sóc Sức Khỏe Chất Lượng Cao
              </h1>
              <p className="text-lg md:text-xl opacity-90 max-w-2xl mx-auto">
                Đội ngũ y bác sĩ chuyên môn cao, trang thiết bị hiện đại và dịch vụ chu đáo
              </p>
              <div className="flex flex-wrap justify-center gap-4 pt-4">
                <Link 
                  to="/appointment" 
                  className="bg-white text-primary hover:bg-gray-100 font-semibold px-6 py-3 rounded-lg transition-all duration-300 hover:shadow-lg transform hover:-translate-y-1"
                >
                  Đặt Lịch Khám
                </Link>
                <Link 
                  to="/branches" 
                  className="bg-transparent text-white border-2 border-white hover:bg-white hover:text-primary px-6 py-3 rounded-lg font-semibold transition-all duration-300 hover:shadow-lg transform hover:-translate-y-1"
                >
                  Các Chi Nhánh
                </Link>
              </div>
            </div>
          </div>
        </div>
        <svg className="absolute bottom-0 left-0 w-full text-white" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1440 100">
          <path fill="currentColor" fillOpacity="1" d="M0,32L80,42.7C160,53,320,75,480,74.7C640,75,800,53,960,48C1120,43,1280,53,1360,58.7L1440,64L1440,100L1360,100C1280,100,1120,100,960,100C800,100,640,100,480,100C320,100,160,100,80,100L0,100Z"></path>
        </svg>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-800">
              <span className="inline-block border-b-4 border-primary pb-2">Chất Lượng Tạo Nên Niềm Tin</span>
            </h2>
            <p className="text-gray-600 max-w-3xl mx-auto mt-4 text-lg">
              Chúng tôi cung cấp dịch vụ chăm sóc sức khỏe toàn diện với cơ sở vật chất hiện đại và đội ngũ y bác sĩ giàu kinh nghiệm.
            </p>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mt-12">
            <div className="bg-white p-8 rounded-xl shadow-lg border border-gray-100 text-center transition-all duration-300 hover:-translate-y-2 hover:shadow-xl hover:border-primary/20 group">
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-6 group-hover:bg-primary/20 transition-colors">
                <FaHospitalAlt size={28} className="text-primary" />
              </div>
              <div className="text-4xl font-bold text-primary mb-2 group-hover:scale-110 transition-transform">
                {stats.branchesCount}
              </div>
              <div className="text-gray-600 font-medium">Chi Nhánh</div>
            </div>
            
            <div className="bg-white p-8 rounded-xl shadow-lg border border-gray-100 text-center transition-all duration-300 hover:-translate-y-2 hover:shadow-xl hover:border-primary/20 group">
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-6 group-hover:bg-primary/20 transition-colors">
                <FaUserMd size={28} className="text-primary" />
              </div>
              <div className="text-4xl font-bold text-primary mb-2 group-hover:scale-110 transition-transform">
                {stats.doctorsCount}
              </div>
              <div className="text-gray-600 font-medium">Bác Sĩ</div>
            </div>
            
            <div className="bg-white p-8 rounded-xl shadow-lg border border-gray-100 text-center transition-all duration-300 hover:-translate-y-2 hover:shadow-xl hover:border-primary/20 group">
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-6 group-hover:bg-primary/20 transition-colors">
                <FaStar size={28} className="text-primary" />
              </div>
              <div className="text-4xl font-bold text-primary mb-2 group-hover:scale-110 transition-transform">
                {stats.reviewsCount.toLocaleString()}
              </div>
              <div className="text-gray-600 font-medium">Đánh Giá</div>
            </div>
            
            <div className="bg-white p-8 rounded-xl shadow-lg border border-gray-100 text-center transition-all duration-300 hover:-translate-y-2 hover:shadow-xl hover:border-primary/20 group">
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-6 group-hover:bg-primary/20 transition-colors">
                <FaCalendarCheck size={28} className="text-primary" />
              </div>
              <div className="text-4xl font-bold text-primary mb-2 group-hover:scale-110 transition-transform">
                {stats.appointmentsCount.toLocaleString()}
              </div>
              <div className="text-gray-600 font-medium">Lịch Hẹn</div>
            </div>
          </div>
        </div>
      </section>

      {/* Hospital Building */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="rounded-xl overflow-hidden shadow-2xl relative group">
            <img 
              src="https://img.freepik.com/free-photo/hospital-building-modern-parking-lot_1127-3616.jpg" 
              alt="Tòa Nhà Bệnh Viện" 
              className="w-full h-auto object-cover group-hover:scale-105 transition-transform duration-700"
            />
            <div className="absolute inset-0 bg-primary/40 opacity-0 group-hover:opacity-100 transition-opacity duration-500 flex items-center justify-center">
              <Link to="/branches" className="bg-white text-primary hover:bg-primary hover:text-white px-6 py-3 rounded-lg font-semibold transition-all">
                Xem Chi Nhánh
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Doctors Section */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-800">
              <span className="inline-block border-b-4 border-primary pb-2">Đội Ngũ Y Bác Sĩ</span>
            </h2>
            <p className="text-gray-600 max-w-3xl mx-auto mt-4 text-lg">
              Đội ngũ bác sĩ giàu kinh nghiệm của chúng tôi luôn tận tâm cung cấp dịch vụ chăm sóc sức khỏe chất lượng cao nhất.
            </p>
          </div>

          {Array.isArray(featuredDoctors) && featuredDoctors.length > 0 ? (
            <div className="relative">
              <Splide
                hasTrack={false}
                options={{
                  type: 'loop',
                  perPage: 3,
                  perMove: 1,
                  autoplay: true,
                  interval: 4000,
                  pauseOnHover: true,
                  arrows: true,
                  pagination: true,
                  gap: '1.5rem',
                  speed: 800,
                  easing: 'ease',
                  breakpoints: {
                    1024: { perPage: 2 },
                    640: { perPage: 1 }
                  }
                }}
                className="splide-custom"
              >
                <div className="splide__arrows hidden">
                  <button className="splide__arrow splide__arrow--prev">Prev</button>
                  <button className="splide__arrow splide__arrow--next">Next</button>
                </div>
                
                <SplideTrack>
                  {featuredDoctors.map((doctor, index) => {
                    const rating = getRating(doctor);
                    const reviewsCount = getReviewsCount(doctor);
                    const experience = getExperience(doctor);
                    const specialtyName = safeGet(doctor, 'specialtyId.name', 'Ngoại khoa');
                    
                    return (
                      <SplideSlide key={doctor._id || index}>
                        <div className="bg-white rounded-xl shadow-md overflow-hidden h-full border border-gray-100 hover:shadow-xl transition-all duration-300 hover:-translate-y-1 group">
                          {/* Doctor Image Area */}
                          <div className="relative h-56 overflow-hidden">
                            {/* Rating Badge */}
                            <div className="absolute bottom-2 left-2 bg-yellow-500 text-white text-xs font-bold py-1 px-2 rounded flex items-center">
                              <FaStar className="mr-1" />
                              {rating?.toFixed(1) || '5.0'}
                            </div>
                            
                            {/* Specialty Badge */}
                            <div className="absolute top-2 right-2 bg-white/90 text-primary text-xs font-medium py-1 px-2 rounded-full shadow-sm">
                              {specialtyName}
                            </div>
                            
                            {/* Doctor Image */}
                            <img 
                              src={safeGet(doctor, 'user.avatarUrl') || 'avatars/default-avatar.png'} 
                              alt={safeGet(doctor, 'user.fullName', 'Bác sĩ')}
                              className="w-full h-full object-cover object-center transition-transform duration-300 group-hover:scale-105"
                              onError={(e) => {
                                e.target.onerror = null;
                                e.target.src = 'avatars/default-avatar.png';
                              }}
                            />
                          </div>
                          
                          {/* Doctor Info */}
                          <div className="p-5 flex-grow flex flex-col">
                            <Link to={`/doctors/${doctor._id}`}>
                              <h3 className="font-semibold text-lg text-gray-900 group-hover:text-primary transition-colors">
                                {safeGet(doctor, 'user.fullName', 'Bác sĩ Trần Thị B')}
                              </h3>
                            </Link>
                            
                            <p className="text-gray-600 text-sm mt-1 flex items-center">
                              <FaHospital className="text-primary mr-1" /> {safeGet(doctor, 'hospitalId.name', 'Đa khoa Trung ương')}
                            </p>
                            
                            {/* Rating Stars & Review Count */}
                            <div className="mt-3 flex items-center">
                              <div className="flex items-center">
                                {[1, 2, 3, 4, 5].map((star) => (
                                  <FaStar 
                                    key={star}
                                    className={`w-4 h-4 ${star <= Math.round(rating) 
                                      ? 'text-yellow-400' 
                                      : 'text-gray-300'
                                    }`} 
                                  />
                                ))}
                                <span className="ml-2 font-medium text-yellow-500">
                                  {rating ? rating.toFixed(1) : '0.0'}
                                </span>
                              </div>
                              <span className="mx-2 text-gray-300">•</span>
                              <span className="text-gray-500 text-sm">{reviewsCount || '0'} đánh giá</span>
                            </div>
                            
                            <div className="mt-auto pt-3">
                              <div className="flex justify-between items-center">
                                <span className="text-primary font-medium text-sm">
                                  {experience} năm kinh nghiệm
                                </span>
                                
                                {/* View Details Button */}
                                <Link 
                                  to={`/doctors/${doctor._id}`} 
                                  className="bg-primary/10 text-primary text-xs py-1 px-3 rounded-full hover:bg-primary/20 hover:text-primary transition-colors"
                                >
                                  Xem chi tiết
                                </Link>
                              </div>
                            </div>
                          </div>
                        </div>
                      </SplideSlide>
                    );
                  })}
                </SplideTrack>
                
                {/* Custom Arrows */}
                {customArrows(
                  null,
                  () => document.querySelector('.splide__arrow--prev')?.click(),
                  () => document.querySelector('.splide__arrow--next')?.click()
                )}
              </Splide>
            </div>
          ) : (
            <div className="text-center p-8 bg-gray-50 rounded-lg">
              <p className="text-gray-500 mb-4">Hiện không có thông tin bác sĩ được hiển thị. Vui lòng thử lại sau hoặc liên hệ với quản trị viên.</p>
              <button 
                onClick={() => window.location.reload()} 
                className="bg-primary text-white py-2 px-4 rounded-lg hover:bg-primary-dark transition-colors"
              >
                Tải lại trang
              </button>
            </div>
          )}

          <div className="mt-12 text-center">
            <Link 
              to="/doctors" 
              className="inline-flex items-center bg-white border border-primary text-primary hover:bg-primary hover:text-white !hover:text-white px-6 py-3 rounded-lg font-medium transition-colors mx-2"
            >
              Xem tất cả bác sĩ <FaAngleRight className="ml-2" />
            </Link>
            <Link 
              to="/appointment" 
              className="inline-flex items-center bg-primary hover:bg-primary-dark text-white hover:text-white px-6 py-3 rounded-lg font-medium transition-colors mx-2 mt-4 md:mt-0"
            >
              Đặt lịch khám ngay <FaAngleRight className="ml-2" />
            </Link>
          </div>
        </div>
      </section>

      {/* Branches Section */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-800">
              <span className="inline-block border-b-4 border-primary pb-2">Các Chi Nhánh</span>
            </h2>
            <p className="text-gray-600 max-w-3xl mx-auto mt-4 text-lg">
              Tìm chi nhánh bệnh viện gần nhất với dịch vụ chăm sóc chuyên biệt đáp ứng nhu cầu sức khỏe của bạn.
            </p>
          </div>

          {Array.isArray(branches) && branches.length > 0 ? (
            <div className="relative">
              <Splide
                hasTrack={false}
                options={{
                  type: 'loop',
                  perPage: 3,
                  perMove: 1,
                  autoplay: true,
                  interval: 5000,
                  pauseOnHover: true,
                  arrows: true,
                  pagination: true,
                  gap: '1.5rem',
                  speed: 800,
                  easing: 'ease',
                  breakpoints: {
                    1024: { perPage: 2 },
                    640: { perPage: 1 }
                  }
                }}
                className="splide-custom splide-branches"
              >
                <div className="splide__arrows hidden">
                  <button className="splide__arrow splide__arrow--prev">Prev</button>
                  <button className="splide__arrow splide__arrow--next">Next</button>
                </div>
                
                <SplideTrack>
                  {branches.map((branch, index) => {
                    const rating = getBranchRating(branch);
                    const reviewsCount = getBranchReviewsCount(branch);
                    
                    return (
                      <SplideSlide key={branch._id || index}>
                        <div className="bg-white rounded-xl shadow-lg overflow-hidden h-full border border-gray-100 transition-all duration-300 hover:-translate-y-2 hover:shadow-xl hover:border-primary/20 group">
                          {/* Hospital Image Area */}
                          <div className="relative h-48 overflow-hidden">
                            {/* Rating Badge */}
                            <div className="absolute bottom-2 left-2 bg-yellow-500 text-white text-xs font-bold py-1 px-2 rounded flex items-center">
                              <FaStar className="mr-1" />
                              {rating?.toFixed(1) || '4.0'}
                            </div>
                            
                            {/* Active Status Badge */}
                            <div className="absolute top-2 right-2 bg-green-100 text-green-800 text-xs font-medium py-1 px-2 rounded-full shadow-sm">
                              Đang hoạt động
                            </div>
                            
                            {/* Hospital Image */}
                            <img 
                              src={branch.imageUrl || 'https://img.freepik.com/free-photo/empty-interior-modern-hospital-ward_169016-11125.jpg'} 
                              alt={branch.name || 'Bệnh viện'}
                              className="w-full h-full object-cover object-center transition-transform duration-300 group-hover:scale-105"
                              onError={(e) => {
                                e.target.onerror = null;
                                e.target.src = 'https://img.freepik.com/free-photo/empty-interior-modern-hospital-ward_169016-11125.jpg';
                              }}
                            />
                          </div>
                          
                          {/* Hospital Info */}
                          <div className="p-5">
                            <h3 className="font-bold text-gray-900 text-lg mb-3 group-hover:text-primary transition-colors">
                              {branch.name || 'Bệnh viện Đa khoa Trung ương'}
                            </h3>
                            
                            {/* Address */}
                            <div className="flex mb-3 text-sm">
                              <FaMapMarkerAlt className="text-primary mt-1 mr-2 flex-shrink-0" />
                              <p className="text-gray-600">
                                {branch.address || '1 Đường Trần Nhân Tông, Hai Bà Trưng, Hà Nội'}
                              </p>
                            </div>
                            
                            {/* Rating Stars & Review Count */}
                            <div className="flex items-center mb-4">
                              <div className="flex items-center">
                                {[1, 2, 3, 4, 5].map((star) => (
                                  <FaStar 
                                    key={star}
                                    className={`w-4 h-4 ${star <= Math.round(rating) 
                                      ? 'text-yellow-400' 
                                      : 'text-gray-300'
                                    }`} 
                                  />
                                ))}
                                <span className="ml-2 font-medium text-yellow-500">
                                  {rating ? rating.toFixed(1) : '0.0'}
                                </span>
                              </div>
                              <span className="mx-2 text-gray-300">•</span>
                              <span className="text-gray-500 text-sm">{reviewsCount || '0'} đánh giá</span>
                              {(branch.doctorCount > 0) && (
                                <>
                                  <span className="mx-2 text-gray-300">•</span>
                                  <div className="flex items-center text-gray-500 text-sm">
                                    <FaUserMd className="text-primary mr-1" />
                                    {branch.doctorCount} bác sĩ
                                  </div>
                                </>
                              )}
                            </div>
                            
                            {/* View Details Button */}
                            <div className="flex justify-end mt-4">
                              <Link 
                                to={`/branches/${branch._id}`} 
                                className="bg-primary/10 text-primary text-xs py-1 px-3 rounded-full hover:bg-primary/20 hover:text-primary transition-colors"
                              >
                                Xem chi tiết
                              </Link>
                            </div>
                          </div>
                        </div>
                      </SplideSlide>
                    );
                  })}
                </SplideTrack>
                
                {/* Custom Arrows */}
                {customArrows(
                  null,
                  () => document.querySelector('.splide-branches .splide__arrow--prev')?.click(),
                  () => document.querySelector('.splide-branches .splide__arrow--next')?.click()
                )}
              </Splide>
            </div>
          ) : (
            <div className="text-center p-8 bg-white rounded-lg">
              <p className="text-gray-500">Không tìm thấy thông tin chi nhánh.</p>
            </div>
          )}

          <div className="mt-12 text-center">
            <Link 
              to="/branches" 
              className="inline-flex items-center bg-primary hover:bg-primary-dark text-white hover:text-white px-6 py-3 rounded-lg font-medium transition-colors"
            >
              Xem tất cả chi nhánh <FaAngleRight className="ml-2" />
            </Link>
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-800">
              <span className="inline-block border-b-4 border-primary pb-2">Liên Hệ</span>
            </h2>
            <p className="text-gray-600 max-w-3xl mx-auto mt-4 text-lg">
              Nếu bạn có bất kỳ câu hỏi nào, đừng ngần ngại liên hệ với chúng tôi.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-white p-8 rounded-xl shadow-lg border border-gray-100 text-center transition-all duration-300 hover:-translate-y-2 hover:shadow-xl">
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-6">
                <FaMapMarkerAlt size={24} className="text-primary" />
              </div>
              <h4 className="text-xl font-semibold mb-3 text-gray-800">Địa Chỉ</h4>
              <p className="text-gray-600">123 Đường Nguyễn Huệ, Quận 1, TP.HCM</p>
            </div>
            
            <div className="bg-white p-8 rounded-xl shadow-lg border border-gray-100 text-center transition-all duration-300 hover:-translate-y-2 hover:shadow-xl">
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-6">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              <h4 className="text-xl font-semibold mb-3 text-gray-800">Email</h4>
              <p className="text-gray-600">info@hospital.com</p>
            </div>
            
            <div className="bg-white p-8 rounded-xl shadow-lg border border-gray-100 text-center transition-all duration-300 hover:-translate-y-2 hover:shadow-xl">
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-6">
                <FaPhone size={24} className="text-primary" />
              </div>
              <h4 className="text-xl font-semibold mb-3 text-gray-800">Số Điện Thoại</h4>
              <p className="text-gray-600">(028) 3822 1234</p>
            </div>
          </div>
        </div>
      </section>
      
      {/* Appointment CTA */}
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
            <h2 className="text-3xl md:text-4xl font-bold mb-4 text-white">Đặt Lịch Khám Ngay Hôm Nay</h2>
            <p className="text-lg mb-8 opacity-90">Chúng tôi luôn sẵn sàng phục vụ và chăm sóc sức khỏe của bạn</p>
            <Link 
              to="/appointment" 
              className="bg-white text-primary hover:bg-gray-100 hover:text-primary px-8 py-4 rounded-lg font-bold text-lg transition-all duration-300 hover:shadow-lg inline-block"
            >
              Đặt Lịch Ngay
            </Link>
          </div>
        </div>
      </section>

      {/* Add custom styles for the carousel */}
      <style jsx="true">{`
        .splide-custom {
          padding: 1.5rem 0;
        }
        
        .splide__pagination {
          bottom: -1rem;
        }
        
        .splide__pagination__page {
          background: #ccc;
          opacity: 0.7;
          transition: all 0.3s;
        }
        
        .splide__pagination__page.is-active {
          background: #0d6efd;
          transform: scale(1.4);
          opacity: 1;
        }
      `}</style>
    </div>
  );
};

export default Home; 
