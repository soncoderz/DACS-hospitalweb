import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../utils/api';
import { FaHospitalAlt, FaUserMd, FaStar, FaCalendarCheck, FaMapMarkerAlt, FaPhone, FaAngleRight, FaChevronLeft, FaChevronRight, FaRegClock, FaHospital, FaStethoscope, FaHeartbeat, FaAmbulance, FaBrain, FaLungs, FaFileMedicalAlt, FaBaby, FaTooth, FaEye, FaNotesMedical, FaXRay, FaBone, FaAllergies, FaWheelchair, FaPills, FaProcedures, FaHandHoldingMedical, FaVial, FaDna, FaFirstAid, FaBandAid, FaMicroscope, FaBed, FaVirus, FaTemperatureLow, FaHeadSideMask, FaCapsules, FaSyringe, FaPrescriptionBottle, FaFlask, FaBookMedical, FaIdCard, FaThermometer, FaHospitalUser, FaClinicMedical, FaHeartBroken } from 'react-icons/fa';
import { GiMedicines, GiDna1, GiMedicalPack, GiHealthNormal, GiHumanEar, GiHeartOrgan, GiChemicalDrop } from 'react-icons/gi';
import { MdLocalHospital, MdMedicalServices, MdBloodtype, MdOutlineVaccines } from 'react-icons/md';
import { IoNutritionOutline } from 'react-icons/io5';
import { Splide, SplideSlide, SplideTrack } from '@splidejs/react-splide';
import '@splidejs/splide/dist/css/splide.min.css';
import AOS from 'aos';
import 'aos/dist/aos.css';
import { useInView } from 'react-intersection-observer';
import { motion } from 'framer-motion';

const Home = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [featuredDoctors, setFeaturedDoctors] = useState([]);
  const [branches, setBranches] = useState([]);
  const [specialties, setSpecialties] = useState([]);
  const [stats, setStats] = useState({
    reviewsCount: 0,
    doctorsCount: 0,
    branchesCount: 0,
    appointmentsCount: 0
  });
  const [news, setNews] = useState([]);
  const [newsLoading, setNewsLoading] = useState(true);
  const [newsError, setNewsError] = useState(null);
  const [topReviews, setTopReviews] = useState([]);
  const [reviewsLoading, setReviewsLoading] = useState(true);
  const [reviewsError, setReviewsError] = useState(null);
  
  // Initialize AOS animation library
  useEffect(() => {
    AOS.init({
      duration: 1000,
      once: true,
      easing: 'ease-out-cubic'
    });
  }, []);

  // Import images later
  
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

        // Fetch specialties - limit to 5 featured specialties
        const specialtiesResponse = await api.get('/specialties', {
          params: {
            limit: 5,
            featured: true
          }
        });
        
        // Fetch statistics
        const statsResponse = await api.get('/reviews/all');
        const doctorsStatsResponse = await api.get('/statistics/doctors');
        const appointmentsStatsResponse = await api.get('/statistics/appointments');
        
        console.log('Doctors response:', doctorsResponse.data);
        console.log('Branches response:', branchesResponse.data);
        console.log('Specialties response:', specialtiesResponse.data);
        
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
        
        // Xử lý dữ liệu chuyên khoa
        let specialtiesData = [];
        if (specialtiesResponse.data) {
          if (Array.isArray(specialtiesResponse.data.data)) {
            specialtiesData = specialtiesResponse.data.data;
          } else if (specialtiesResponse.data.data && specialtiesResponse.data.data.specialties) {
            // Trường hợp cấu trúc mới: { data: { specialties: [...] } }
            specialtiesData = specialtiesResponse.data.data.specialties;
          }
        }
        
        // Lọc chỉ hiển thị các chuyên khoa đang hoạt động (isActive=true)
        specialtiesData = specialtiesData.filter(specialty => specialty.isActive === true);
        
        // Giới hạn số lượng hiển thị
        specialtiesData = specialtiesData.slice(0, 5);
        
        setSpecialties(specialtiesData);
        
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

  useEffect(() => {
    const fetchNews = async () => {
      setNewsLoading(true);
      try {
        const response = await api.get('/news/all');
        console.log('News response:', response.data);
        
        // Get news data - handle different API response formats
        let newsData = [];
        if (response.data) {
          if (Array.isArray(response.data.news)) {
            newsData = response.data.news.slice(0, 3); // Get first 3 news items
          } else if (response.data.news && Array.isArray(response.data.news)) {
            newsData = response.data.news.slice(0, 3);
          }
        }
        
        setNews(newsData);
        setNewsError(null);
      } catch (error) {
        console.error('Error fetching news:', error);
        setNewsError('Không thể tải tin tức. Vui lòng thử lại sau.');
      } finally {
        setNewsLoading(false);
      }
    };

    fetchNews();
  }, []);

  useEffect(() => {
    const fetchTopReviews = async () => {
      setReviewsLoading(true);
      try {
        const response = await api.get('/reviews/all', {
          params: {
            limit: 4,
            sort: '-rating', // Sort by highest rating
            page: 1
          }
        });
        
        console.log('Top reviews response:', response.data);
        
        // Get reviews data - handle different API response formats
        let reviewsData = [];
        if (response.data && response.data.success) {
          // Check the actual response structure
          if (response.data.data && Array.isArray(response.data.data.docs)) {
            reviewsData = response.data.data.docs;
          } else if (Array.isArray(response.data.data)) {
            reviewsData = response.data.data;
          } else if (response.data.data && Array.isArray(response.data.data.reviews)) {
            reviewsData = response.data.data.reviews;
          } else if (Array.isArray(response.data.reviews)) {
            reviewsData = response.data.reviews;
          }
        }
        
        // Filter to get only 5-star reviews if possible, otherwise get top rated
        let fiveStarReviews = reviewsData.filter(review => review.rating === 5);
        if (fiveStarReviews.length >= 2) {
          // Use top 2 five-star reviews 
          setTopReviews(fiveStarReviews.slice(0, 2));
        } else {
          // Just use top 2 reviews sorted by rating
          setTopReviews(reviewsData.slice(0, 2));
        }
        
        setReviewsError(null);
      } catch (error) {
        console.error('Error fetching top reviews:', error);
        setReviewsError('Không thể tải đánh giá. Vui lòng thử lại sau.');
      } finally {
        setReviewsLoading(false);
      }
    };

    fetchTopReviews();
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

  // Helper function to map icon strings to FA components
  const getIconComponent = (iconName) => {
    const iconMap = {
      'stethoscope': FaStethoscope,
      'heartbeat': FaHeartbeat,
      'lungs': FaLungs,
      'brain': FaBrain,
      'ambulance': FaAmbulance,
      'baby': FaBaby,
      'tooth': FaTooth,
      'eye': FaEye,
      'file-medical-alt': FaFileMedicalAlt,
      'notes-medical': FaNotesMedical,
      'x-ray': FaXRay,
      'bone': FaBone,
      'allergies': FaAllergies,
      'wheelchair': FaWheelchair,
      'pills': FaPills,
      'procedures': FaProcedures,
      'hand-holding-medical': FaHandHoldingMedical,
      'vial': FaVial,
      'user-md': FaUserMd,
      'hospital': FaHospitalAlt,
      'dna': FaDna,
      'first-aid': FaFirstAid,
      'band-aid': FaBandAid,
      'microscope': FaMicroscope,
      'bed': FaBed,
      'virus': FaVirus,
      'temperature-low': FaTemperatureLow,
      'head-side-mask': FaHeadSideMask,
      'capsules': FaCapsules,
      'syringe': FaSyringe,
      'prescription-bottle': FaPrescriptionBottle,
      'flask': FaFlask,
      'book-medical': FaBookMedical,
      'id-card': FaIdCard,
      'thermometer': FaThermometer,
      'hospital-user': FaHospitalUser,
      'hospital-alt': FaHospitalAlt,
      'clinic-medical': FaClinicMedical,
      'heart-broken': FaHeartBroken,
      'gi-medicines': GiMedicines,
      'gi-dna': GiDna1,
      'gi-medical-pack': GiMedicalPack,
      'gi-health': GiHealthNormal,
      'gi-ear': GiHumanEar,
      'gi-heart': GiHeartOrgan,
      'gi-chemical': GiChemicalDrop,
      'md-hospital': MdLocalHospital,
      'md-medical': MdMedicalServices,
      'md-blood': MdBloodtype,
      'md-vaccines': MdOutlineVaccines,
      'io-nutrition': IoNutritionOutline
    };
    
    // Return the component if it exists in the map, otherwise return a default
    return iconMap[iconName?.toLowerCase()] || FaStethoscope;
  };

  return (
    <div className="min-h-screen">
      {/* Hero Banner */}
      <section className="relative overflow-hidden min-h-[90vh] flex items-center">
        {/* Background Layer with Particles */}
        <div className="absolute inset-0 z-0">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-blue-600"></div>
          <img 
            src="https://img.freepik.com/free-photo/team-young-specialist-doctors-standing-corridor-hospital_1303-21199.jpg" 
            alt="Hospital Background" 
            className="w-full h-full object-cover object-center opacity-20" 
          />
          <div className="absolute inset-0 bg-pattern opacity-10"></div>
        </div>
        
        {/* Animated Shapes */}
        <div className="absolute top-20 left-10 w-64 h-64 bg-blue-500/10 rounded-full filter blur-3xl animate-blob"></div>
        <div className="absolute bottom-20 right-10 w-72 h-72 bg-yellow-300/10 rounded-full filter blur-3xl animate-blob animation-delay-2000"></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-primary/10 rounded-full filter blur-3xl animate-blob animation-delay-4000"></div>
        
        {/* Content */}
        <div className="relative container mx-auto px-6 py-20 z-10">
          <div className="flex flex-col lg:flex-row items-center gap-12 lg:gap-20">
            {/* Left Text Content */}
            <div className="w-full lg:w-1/2 text-white space-y-8 animate-fade-in-up">
              <div className="inline-block bg-blue-500/50 backdrop-blur-md px-5 py-2.5 rounded-full text-sm font-medium mb-2 shadow-lg animate-slide-in-left">
                <span className="flex items-center text-white">
                  <FaHospitalAlt className="mr-2 text-white" /> 
                  Hệ thống y tế chất lượng 
                </span>
              </div>
              
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold leading-tight animate-slide-in-left animation-delay-300 text-white">
                Chăm Sóc Sức Khỏe<br />
                <span className="text-gradient bg-gradient-to-r from-white to-blue-100">Chất Lượng Cao</span>
              </h1>
              
              <p className="text-lg md:text-xl opacity-90 max-w-xl leading-relaxed animate-slide-in-left animation-delay-600">
                Đội ngũ y bác sĩ chuyên môn cao, trang thiết bị hiện đại và dịch vụ chu đáo tạo nên trải nghiệm y tế tuyệt vời cho bạn và gia đình.
              </p>
              
              <div className="flex flex-wrap gap-5 pt-6 animate-slide-in-left animation-delay-900">
                <Link 
                  to="/appointment" 
                  className="bg-blue-600 text-white hover:bg-blue-700 font-semibold px-7 py-4 rounded-lg transition-all duration-300 hover:shadow-lg transform hover:-translate-y-1 flex items-center group"
                >
                  <FaCalendarCheck className="mr-2 group-hover:animate-bounce" /> Đặt Lịch Khám
                </Link>
                <Link 
                  to="/branches" 
                  className="bg-transparent text-white border-2 border-white hover:bg-white hover:text-blue-600 px-7 py-4 rounded-lg font-semibold transition-all duration-300 hover:shadow-lg transform hover:-translate-y-1 flex items-center group"
                >
                  <FaMapMarkerAlt className="mr-2 group-hover:animate-pulse" /> Các Chi Nhánh
                </Link>
              </div>
              

            </div>
            
            {/* Right Image/Card Area - Updated with doctor in white coat */}
            <div className="w-full lg:w-1/2 flex justify-center animate-fade-in-up animation-delay-600">
              <div className="relative z-10">
                {/* Floating Working Hours Card - Changed to Featured Doctor */}
                <div className="absolute -top-8 -left-10 bg-blue-600 rounded-xl shadow-2xl p-4 animate-float z-20">
                  <div className="flex items-center text-white">
                    <FaUserMd className="mr-2 text-xl text-white" />
                    <span className="font-medium">Bác sĩ tiêu biểu</span>
          </div>
        </div>
                
                {/* Main Doctor Image */}
                <div className="bg-gradient-to-br from-blue-400 to-blue-600 p-5 rounded-3xl shadow-2xl rotate-2 transition-transform hover:rotate-0 duration-500 z-10 relative">
                  <div className="bg-white p-3 rounded-2xl overflow-hidden">
                    <div className="flex flex-col">
                      {featuredDoctors && featuredDoctors.length > 0 ? (
                        <>
                          <img 
                            src={safeGet(featuredDoctors[0], 'user.avatarUrl') || 'https://img.freepik.com/free-photo/woman-doctor-wearing-lab-coat-with-stethoscope-isolated_1303-29791.jpg'} 
                            alt={safeGet(featuredDoctors[0], 'user.fullName') || 'Bác sĩ'} 
                            className="w-full h-auto object-contain bg-white transition-transform duration-700 hover:scale-105"
                            style={{maxWidth: '540px', minHeight: '300px'}} 
                            onError={(e) => {
                              e.target.onerror = null;
                              e.target.src = '/avatars/default-avatar.png';
                            }}
                          />
                          <div className="pt-3 pb-1 px-2">
                            <h3 className="font-semibold text-lg text-gray-900">
                              {safeGet(featuredDoctors[0], 'user.fullName', 'Bác sĩ chuyên khoa')}
                            </h3>
                            <p className="text-gray-600 text-sm mt-1 flex items-center">
                              <FaHospital className="text-primary mr-1" /> 
                              {safeGet(featuredDoctors[0], 'hospitalId.name', 'Bệnh viện Đa khoa')}
                            </p>
                            <div className="mt-2 flex items-center">
                              {[1, 2, 3, 4, 5].map((star) => (
                                <FaStar 
                                  key={star}
                                  className={`w-4 h-4 ${star <= Math.round(getRating(featuredDoctors[0])) 
                                    ? 'text-yellow-400' 
                                    : 'text-gray-300'
                                  }`} 
                                />
                              ))}
                              <span className="ml-2 text-sm text-gray-600">
                                {getReviewsCount(featuredDoctors[0]) || '0'} đánh giá
                              </span>
                            </div>
                          </div>
                        </>
                      ) : (
                        <img 
                          src="https://img.freepik.com/free-photo/woman-doctor-wearing-lab-coat-with-stethoscope-isolated_1303-29791.jpg" 
                          alt="Bác sĩ" 
                          className="w-full h-auto object-cover rounded-xl transition-transform duration-700 hover:scale-105"
                          style={{maxWidth: '540px', minHeight: '380px'}} 
                          onError={(e) => {
                            e.target.onerror = null;
                            e.target.src = '/avatars/default-avatar.png';
                          }}
                        />
                      )}
                    </div>
                  </div>
                  
                  {/* Consultation Badge */}
                  <div className="absolute -bottom-4 -right-4 bg-blue-700 text-white rounded-full w-24 h-24 flex items-center justify-center rotate-12 shadow-lg animate-pulse-slow">
                    <div className="text-center">
                      <div className="text-xs font-medium">TƯ VẤN</div>
                      <div className="font-bold text-lg">24/7</div>
                    </div>
                  </div>
                  
                  {/* Appointment Button */}
                  <div className="absolute -left-8 bottom-1/3 transform -translate-y-1/2">
                    <Link
                      to={featuredDoctors && featuredDoctors.length > 0 ? `/appointment?doctorId=${featuredDoctors[0]._id}` : "/appointment"}
                      className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-full shadow-lg transform transition-transform hover:scale-105 animate-bounce-gentle flex items-center"
                    >
                      <FaCalendarCheck className="mr-2" />
                      Đặt lịch ngay
                    </Link>
                  </div>
                </div>
                
                {/* Decorative elements */}
                <div className="absolute -z-10 -top-12 -right-12 w-32 h-32 rounded-full border-4 border-dashed border-white/30 animate-spin-slow"></div>
                <div className="absolute -z-10 -bottom-12 -left-12 w-24 h-24 rounded-full border-4 border-dotted border-yellow-300/30 animate-spin-reverse"></div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Improved Wave Bottom */}
        <svg className="absolute bottom-0 left-0 w-full text-white" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1440 240">
          <path fill="currentColor" fillOpacity="1" d="M0,128L48,122.7C96,117,192,107,288,128C384,149,480,192,576,192C672,192,768,149,864,149.3C960,149,1056,192,1152,202.7C1248,213,1344,192,1392,181.3L1440,171L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z"></path>
        </svg>
      </section>

      {/* Discount Banner */}
      <section className="bg-gradient-to-r from-blue-500 to-blue-600 py-3 relative overflow-hidden">
        <div className="absolute -right-10 -top-10 w-40 h-40 bg-blue-400 rounded-full opacity-30"></div>
        <div className="absolute -left-10 -bottom-10 w-40 h-40 bg-blue-400 rounded-full opacity-30"></div>
        
        <Splide
          options={{
            type: 'loop',
            perPage: 1,
            perMove: 1,
            autoplay: true,
            interval: 4000,
            arrows: false,
            pagination: false,
            speed: 1000,
          }}
          className="container mx-auto promotional-slider"
        >
          <SplideSlide>
            <div className="container mx-auto px-4">
              <div className="flex flex-wrap items-center justify-between">
                <div className="w-full md:w-auto flex items-center text-center md:text-left mb-4 md:mb-0">
                  <span className="bg-white text-blue-600 text-xs font-bold px-2 py-1 rounded mr-3 uppercase">Khuyến mãi</span>
                  <h3 className="text-white font-bold">Giảm 20% cho khách hàng đặt lịch khám sức khỏe định kỳ - Mã: <span className="text-blue-700 bg-white px-2 py-0.5 rounded">HEALTH2023</span></h3>
                </div>
                <div className="w-full md:w-auto text-center">
                  <Link to="/appointment" className="inline-block bg-white text-blue-600 hover:bg-blue-50 font-semibold px-6 py-2 rounded-lg transition-colors">
                    Đặt lịch ngay
                  </Link>
                </div>
              </div>
            </div>
          </SplideSlide>
          
          <SplideSlide>
            <div className="container mx-auto px-4">
              <div className="flex flex-wrap items-center justify-between">
                <div className="w-full md:w-auto flex items-center text-center md:text-left mb-4 md:mb-0">
                  <span className="bg-white text-blue-600 text-xs font-bold px-2 py-1 rounded mr-3 uppercase">Ưu đãi</span>
                  <h3 className="text-white font-bold">Miễn phí tư vấn online với bác sĩ chuyên khoa - Mã: <span className="text-blue-700 bg-white px-2 py-0.5 rounded">ONLINE2023</span></h3>
                </div>
                <div className="w-full md:w-auto text-center">
                  <Link to="/online-consultation" className="inline-block bg-white text-blue-600 hover:bg-blue-50 font-semibold px-6 py-2 rounded-lg transition-colors">
                    Tư vấn ngay
                  </Link>
                </div>
              </div>
            </div>
          </SplideSlide>
          
          <SplideSlide>
            <div className="container mx-auto px-4">
              <div className="flex flex-wrap items-center justify-between">
                <div className="w-full md:w-auto flex items-center text-center md:text-left mb-4 md:mb-0">
                  <span className="bg-white text-blue-600 text-xs font-bold px-2 py-1 rounded mr-3 uppercase">Chương trình</span>
                  <h3 className="text-white font-bold">Gói tầm soát ung thư toàn diện giảm 30% - Mã: <span className="text-blue-700 bg-white px-2 py-0.5 rounded">CANCER30</span></h3>
                </div>
                <div className="w-full md:w-auto text-center">
                  <Link to="/screening-packages" className="inline-block bg-white text-blue-600 hover:bg-blue-50 font-semibold px-6 py-2 rounded-lg transition-colors">
                    Tìm hiểu thêm
                  </Link>
                </div>
              </div>
            </div>
          </SplideSlide>
        </Splide>
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
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-5 mt-12">
            <div className="bg-white border border-gray-200 p-4 rounded-xl shadow-md transition-all duration-300 hover:shadow-lg hover:border-blue-300">
              <div className="flex items-center">
                <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center mr-4">
                  <FaHospitalAlt size={20} className="text-blue-600" />
              </div>
                <div className="text-left">
                  <div className="text-2xl font-bold text-gray-800">
                {stats.branchesCount}
              </div>
                  <div className="text-sm text-gray-500">Chi Nhánh</div>
                </div>
              </div>
            </div>
            
            <div className="bg-white border border-gray-200 p-4 rounded-xl shadow-md transition-all duration-300 hover:shadow-lg hover:border-blue-300">
              <div className="flex items-center">
                <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center mr-4">
                  <FaUserMd size={20} className="text-blue-600" />
              </div>
                <div className="text-left">
                  <div className="text-2xl font-bold text-gray-800">
                {stats.doctorsCount}
              </div>
                  <div className="text-sm text-gray-500">Bác Sĩ</div>
                </div>
              </div>
            </div>
            
            <div className="bg-white border border-gray-200 p-4 rounded-xl shadow-md transition-all duration-300 hover:shadow-lg hover:border-blue-300">
              <div className="flex items-center">
                <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center mr-4">
                  <FaStar size={20} className="text-blue-600" />
              </div>
                <div className="text-left">
                  <div className="text-2xl font-bold text-gray-800">
                {stats.reviewsCount.toLocaleString()}
              </div>
                  <div className="text-sm text-gray-500">Đánh Giá</div>
                </div>
              </div>
            </div>
            
            <div className="bg-white border border-gray-200 p-4 rounded-xl shadow-md transition-all duration-300 hover:shadow-lg hover:border-blue-300">
              <div className="flex items-center">
                <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center mr-4">
                  <FaCalendarCheck size={20} className="text-blue-600" />
              </div>
                <div className="text-left">
                  <div className="text-2xl font-bold text-gray-800">
                {stats.appointmentsCount.toLocaleString()}
              </div>
                  <div className="text-sm text-gray-500">Lịch Hẹn</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Medical Specialties Bento Grid */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12" data-aos="fade-up">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-800">
              <span className="inline-block border-b-4 border-primary pb-2">Chuyên Khoa Nổi Bật</span>
            </h2>
            <p className="text-gray-600 max-w-3xl mx-auto mt-4 text-lg">
              Chúng tôi cung cấp đầy đủ các dịch vụ y tế chuyên sâu với đội ngũ chuyên gia đầu ngành
            </p>
          </div>

          {/* Bento Grid Layout */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {specialties.length > 0 ? (
              <>
            {/* Feature Box 1 - Large Box */}
                {specialties[0] && (
            <div className="col-span-1 md:col-span-2 md:row-span-2 bg-white rounded-2xl shadow-lg overflow-hidden group" data-aos="fade-up">
              <div className="relative h-64 overflow-hidden">
                <img 
                        src={specialties[0].imageUrl || "https://img.freepik.com/free-photo/doctor-with-stethoscope-hands-hospital-background_1423-1.jpg"} 
                        alt={specialties[0].name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        onError={(e) => {
                          e.target.onerror = null;
                          e.target.src = "https://img.freepik.com/free-photo/doctor-with-stethoscope-hands-hospital-background_1423-1.jpg";
                        }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-blue-900/80 to-transparent"></div>
                <div className="absolute bottom-4 left-6">
                  <h3 className="text-white text-2xl font-bold mb-2 flex items-center">
                          {React.createElement(getIconComponent(specialties[0].icon), { className: "mr-2" })} {specialties[0].name}
                  </h3>
                        <p className="text-white/90 line-clamp-2">{specialties[0].description || `Chẩn đoán và điều trị các bệnh lý ${specialties[0].name.toLowerCase()} với đội ngũ chuyên gia hàng đầu`}</p>
                </div>
              </div>
              <div className="p-6">
                <ul className="space-y-2">
                        {specialties[0].commonServices && specialties[0].commonServices.slice(0, 3).map((service, index) => (
                          <li key={index} className="flex items-start">
                            <span className="bg-blue-100 p-1 rounded text-blue-700 mr-3 mt-0.5">
                              {React.createElement(getIconComponent(specialties[0].icon), { className: "w-4 h-4" })}
                            </span>
                            <div>
                              <h4 className="font-medium text-gray-900">{service}</h4>
                              <p className="text-sm text-gray-600">Điều trị chuyên sâu</p>
                            </div>
                          </li>
                        ))}
                        {(!specialties[0].commonServices || specialties[0].commonServices.length === 0) && (
                          <>
                  <li className="flex items-start">
                    <span className="bg-blue-100 p-1 rounded text-blue-700 mr-3 mt-0.5">
                                {React.createElement(getIconComponent(specialties[0].icon), { className: "w-4 h-4" })}
                    </span>
                    <div>
                                <h4 className="font-medium text-gray-900">Khám bệnh</h4>
                                <p className="text-sm text-gray-600">Khám và chẩn đoán</p>
                    </div>
                  </li>
                  <li className="flex items-start">
                    <span className="bg-blue-100 p-1 rounded text-blue-700 mr-3 mt-0.5">
                                {React.createElement(getIconComponent(specialties[0].icon), { className: "w-4 h-4" })}
                    </span>
                    <div>
                                <h4 className="font-medium text-gray-900">Điều trị</h4>
                                <p className="text-sm text-gray-600">Điều trị các bệnh lý</p>
                    </div>
                  </li>
                  <li className="flex items-start">
                    <span className="bg-blue-100 p-1 rounded text-blue-700 mr-3 mt-0.5">
                                {React.createElement(getIconComponent(specialties[0].icon), { className: "w-4 h-4" })}
                    </span>
                    <div>
                                <h4 className="font-medium text-gray-900">Tư vấn</h4>
                                <p className="text-sm text-gray-600">Tư vấn sức khỏe</p>
                    </div>
                  </li>
                          </>
                        )}
                </ul>
                <div className="mt-4 text-right">
                        <Link to={`/specialties/${specialties[0]._id}`} className="text-primary hover:text-primary-dark inline-flex items-center font-medium">
                    Xem thêm <FaAngleRight className="ml-1" />
              </Link>
            </div>
              </div>
            </div>
                )}

            {/* Feature Box 2 */}
                {specialties[1] && (
            <div className="bg-white rounded-2xl shadow-lg overflow-hidden group" data-aos="fade-up" data-aos-delay="100">
              <div className="p-6">
                <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center mb-4">
                        {React.createElement(getIconComponent(specialties[1].icon), { className: "text-green-600 text-xl" })}
                </div>
                      <h3 className="text-xl font-bold text-gray-900 mb-2">{specialties[1].name}</h3>
                      <p className="text-gray-600 mb-4">{specialties[1].description || `Điều trị các bệnh lý ${specialties[1].name.toLowerCase()} với đội ngũ y bác sĩ giàu kinh nghiệm`}</p>
                      <Link to={`/specialties/${specialties[1]._id}`} className="text-primary hover:text-primary-dark inline-flex items-center font-medium">
                  Tìm hiểu thêm <FaAngleRight className="ml-1" />
                </Link>
              </div>
            </div>
                )}

            {/* Feature Box 3 */}
                {specialties[2] && (
            <div className="bg-white rounded-2xl shadow-lg overflow-hidden group" data-aos="fade-up" data-aos-delay="200">
              <div className="p-6">
                <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mb-4">
                        {React.createElement(getIconComponent(specialties[2].icon), { className: "text-red-600 text-xl" })}
                </div>
                      <h3 className="text-xl font-bold text-gray-900 mb-2">{specialties[2].name}</h3>
                      <p className="text-gray-600 mb-4">{specialties[2].description || `Dịch vụ ${specialties[2].name.toLowerCase()} chất lượng cao với trang thiết bị hiện đại`}</p>
                      <Link to={`/specialties/${specialties[2]._id}`} className="text-primary hover:text-primary-dark inline-flex items-center font-medium">
                  Tìm hiểu thêm <FaAngleRight className="ml-1" />
                </Link>
              </div>
            </div>
                )}

            {/* Feature Box 4 */}
                {specialties[3] && (
            <div className="bg-white rounded-2xl shadow-lg overflow-hidden group" data-aos="fade-up" data-aos-delay="100">
              <div className="p-6">
                <div className="w-12 h-12 rounded-full bg-purple-100 flex items-center justify-center mb-4">
                        {React.createElement(getIconComponent(specialties[3].icon), { className: "text-purple-600 text-xl" })}
                </div>
                      <h3 className="text-xl font-bold text-gray-900 mb-2">{specialties[3].name}</h3>
                      <p className="text-gray-600 mb-4">{specialties[3].description || `Chăm sóc toàn diện các bệnh lý ${specialties[3].name.toLowerCase()}`}</p>
                      <Link to={`/specialties/${specialties[3]._id}`} className="text-primary hover:text-primary-dark inline-flex items-center font-medium">
                  Tìm hiểu thêm <FaAngleRight className="ml-1" />
                </Link>
              </div>
            </div>
                )}

            {/* Feature Box 5 */}
                {specialties[4] && (
            <div className="bg-white rounded-2xl shadow-lg overflow-hidden group" data-aos="fade-up" data-aos-delay="200">
              <div className="p-6">
                <div className="w-12 h-12 rounded-full bg-yellow-100 flex items-center justify-center mb-4">
                        {React.createElement(getIconComponent(specialties[4].icon), { className: "text-yellow-600 text-xl" })}
                </div>
                      <h3 className="text-xl font-bold text-gray-900 mb-2">{specialties[4].name}</h3>
                      <p className="text-gray-600 mb-4">{specialties[4].description || `Dịch vụ ${specialties[4].name.toLowerCase()} chất lượng cao với công nghệ tiên tiến`}</p>
                      <Link to={`/specialties/${specialties[4]._id}`} className="text-primary hover:text-primary-dark inline-flex items-center font-medium">
                  Tìm hiểu thêm <FaAngleRight className="ml-1" />
                </Link>
              </div>
            </div>
                )}
              </>
            ) : (
              <>
                {/* Fallback content if no specialties are found */}
                <div className="col-span-1 md:col-span-2 md:row-span-2 bg-white rounded-2xl shadow-lg overflow-hidden group" data-aos="fade-up">
                  <div className="relative h-64 overflow-hidden">
                    <img 
                      src="https://img.freepik.com/free-photo/doctor-with-stethoscope-hands-hospital-background_1423-1.jpg" 
                      alt="Nội khoa" 
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-blue-900/80 to-transparent"></div>
                    <div className="absolute bottom-4 left-6">
                      <h3 className="text-white text-2xl font-bold mb-2 flex items-center">
                        <FaStethoscope className="mr-2" /> Nội Khoa
                      </h3>
                      <p className="text-white/90 line-clamp-2">Chẩn đoán và điều trị các bệnh lý nội khoa với đội ngũ chuyên gia hàng đầu</p>
                    </div>
                  </div>
                  <div className="p-6">
                    <ul className="space-y-2">
                      <li className="flex items-start">
                        <span className="bg-blue-100 p-1 rounded text-blue-700 mr-3 mt-0.5">
                          <FaHeartbeat className="w-4 h-4" />
                        </span>
                        <div>
                          <h4 className="font-medium text-gray-900">Nội Tim Mạch</h4>
                          <p className="text-sm text-gray-600">Chẩn đoán và điều trị các bệnh tim mạch</p>
                        </div>
                      </li>
                      <li className="flex items-start">
                        <span className="bg-blue-100 p-1 rounded text-blue-700 mr-3 mt-0.5">
                          <FaLungs className="w-4 h-4" />
                        </span>
                        <div>
                          <h4 className="font-medium text-gray-900">Nội Hô Hấp</h4>
                          <p className="text-sm text-gray-600">Điều trị các bệnh lý về đường hô hấp</p>
                        </div>
                      </li>
                      <li className="flex items-start">
                        <span className="bg-blue-100 p-1 rounded text-blue-700 mr-3 mt-0.5">
                          <FaBrain className="w-4 h-4" />
                        </span>
                        <div>
                          <h4 className="font-medium text-gray-900">Nội Thần Kinh</h4>
                          <p className="text-sm text-gray-600">Chẩn đoán và điều trị các bệnh lý thần kinh</p>
                        </div>
                      </li>
                    </ul>
                    <div className="mt-4 text-right">
                      <Link to="/specialties" className="text-primary hover:text-primary-dark inline-flex items-center font-medium">
                        Xem thêm <FaAngleRight className="ml-1" />
                      </Link>
                    </div>
                  </div>
                </div>

                {/* Default boxes for when API data is not available */}
                <div className="bg-white rounded-2xl shadow-lg overflow-hidden group" data-aos="fade-up" data-aos-delay="100">
                  <div className="p-6">
                    <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center mb-4">
                      <FaUserMd className="text-green-600 text-xl" />
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 mb-2">Ngoại Khoa</h3>
                    <p className="text-gray-600 mb-4">Phẫu thuật an toàn với các bác sĩ phẫu thuật hàng đầu</p>
                    <Link to="/specialties" className="text-primary hover:text-primary-dark inline-flex items-center font-medium">
                      Tìm hiểu thêm <FaAngleRight className="ml-1" />
                    </Link>
                  </div>
                </div>

                <div className="bg-white rounded-2xl shadow-lg overflow-hidden group" data-aos="fade-up" data-aos-delay="200">
                  <div className="p-6">
                    <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mb-4">
                      <FaAmbulance className="text-red-600 text-xl" />
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 mb-2">Cấp Cứu</h3>
                    <p className="text-gray-600 mb-4">Dịch vụ cấp cứu 24/7 với thiết bị hiện đại</p>
                    <Link to="/specialties" className="text-primary hover:text-primary-dark inline-flex items-center font-medium">
                      Tìm hiểu thêm <FaAngleRight className="ml-1" />
                    </Link>
                  </div>
                </div>
              </>
            )}
          </div>

          <div className="text-center mt-12">
            <Link 
              to="/specialties" 
              className="inline-flex items-center bg-blue-600 text-white hover:bg-blue-700 px-6 py-3 rounded-lg font-medium transition-colors"
            >
              Xem tất cả chuyên khoa <FaAngleRight className="ml-2" />
            </Link>
          </div>
        </div>
      </section>

      

      {/* Doctors Section */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12" data-aos="fade-up">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-800">
              <span className="inline-block border-b-4 border-primary pb-2">Đội Ngũ Y Bác Sĩ</span>
            </h2>
            <p className="text-gray-600 max-w-3xl mx-auto mt-4 text-lg">
              Đội ngũ bác sĩ giàu kinh nghiệm của chúng tôi luôn tận tâm cung cấp dịch vụ chăm sóc sức khỏe chất lượng cao nhất.
            </p>
          </div>

          {Array.isArray(featuredDoctors) && featuredDoctors.length > 0 ? (
            <div className="relative" data-aos="fade-up" data-aos-delay="100">
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
                        <div className="bg-white rounded-xl shadow-md border border-gray-100 hover:shadow-xl transition-all duration-300 hover:-translate-y-1 group">
                          {/* Doctor Image Area */}
                          <div className="relative h-56">
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
                              className="w-full h-full object-contain bg-white"
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
            <div className="text-center p-8 bg-gray-50 rounded-lg" data-aos="fade-up">
              <p className="text-gray-500 mb-4">Hiện không có thông tin bác sĩ được hiển thị. Vui lòng thử lại sau hoặc liên hệ với quản trị viên.</p>
              <button 
                onClick={() => window.location.reload()} 
                className="bg-primary text-white py-2 px-4 rounded-lg hover:bg-primary-dark transition-colors"
              >
                Tải lại trang
              </button>
            </div>
          )}

          <div className="mt-12 text-center" data-aos="fade-up" data-aos-delay="200">
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
          <div className="text-center mb-12" data-aos="fade-up">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-800">
              <span className="inline-block border-b-4 border-primary pb-2">Các Chi Nhánh</span>
            </h2>
            <p className="text-gray-600 max-w-3xl mx-auto mt-4 text-lg">
              Tìm chi nhánh bệnh viện gần nhất với dịch vụ chăm sóc chuyên biệt đáp ứng nhu cầu sức khỏe của bạn.
            </p>
          </div>

          {Array.isArray(branches) && branches.length > 0 ? (
            <div className="relative" data-aos="fade-up" data-aos-delay="100">
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
            <div className="text-center p-8 bg-white rounded-lg" data-aos="fade-up">
              <p className="text-gray-500">Không tìm thấy thông tin chi nhánh.</p>
            </div>
          )}

          <div className="mt-12 text-center" data-aos="fade-up" data-aos-delay="200">
            <Link 
              to="/branches" 
              className="inline-flex items-center bg-primary hover:bg-primary-dark text-white hover:text-white px-6 py-3 rounded-lg font-medium transition-colors"
            >
              Xem tất cả chi nhánh <FaAngleRight className="ml-2" />
            </Link>
          </div>
        </div>
      </section>

      {/* Health Tips & News */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12" data-aos="fade-up">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-800">
              <span className="inline-block border-b-4 border-primary pb-2">Kiến Thức Y Tế và Tin Tức</span>
            </h2>
            <p className="text-gray-600 max-w-3xl mx-auto mt-4 text-lg">
              Cập nhật những thông tin y tế hữu ích và kiến thức chăm sóc sức khỏe cho bạn và gia đình
            </p>
          </div>

          {newsLoading ? (
            <div className="flex justify-center items-center">
              <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
              <span className="ml-3 text-gray-600">Đang tải tin tức...</span>
              </div>
          ) : newsError ? (
            <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center mb-8">
              <p className="text-red-600">{newsError}</p>
              <button 
                onClick={() => window.location.reload()} 
                className="mt-3 bg-primary text-white py-2 px-4 rounded hover:bg-primary-dark transition-colors"
              >
                Thử lại
              </button>
                </div>
          ) : news.length === 0 ? (
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 text-center mb-8">
              <p className="text-gray-600">Hiện tại chưa có tin tức nào.</p>
              </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {news.map((item) => (
                <div key={item._id} className="bg-white rounded-xl shadow-md overflow-hidden" data-aos="fade-up" data-aos-delay="0">
              <div className="relative h-48 overflow-hidden">
                <img 
                      src={item.image?.url || "https://img.freepik.com/free-photo/doctor-offering-medical-advice-patient-clinic_1170-2176.jpg"} 
                      alt={item.title} 
                  className="w-full h-full object-cover transition-transform hover:scale-105 duration-500"
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = "https://img.freepik.com/free-photo/doctor-offering-medical-advice-patient-clinic_1170-2176.jpg";
                      }}
                />
                    <div className="absolute top-3 left-3 bg-blue-600 text-white text-xs py-1 px-2 rounded">
                      {item.category || 'Sức khỏe tổng quát'}
              </div>
              </div>
              <div className="p-6">
                    <h3 className="font-bold text-lg text-gray-900 mb-2">{item.title}</h3>
                <p className="text-gray-600 mb-4 line-clamp-2">
                      {item.summary || 'Không có mô tả.'}
                </p>
                <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-500">
                        {new Date(item.publishDate).toLocaleDateString('vi-VN')}
                      </span>
                  <Link 
                        to={`/news/${item.slug || item._id}`} 
                    className="text-primary hover:text-primary-dark font-medium flex items-center"
                  >
                    Đọc thêm <FaAngleRight className="ml-1" />
                  </Link>
                </div>
              </div>
            </div>
              ))}
          </div>
          )}

          <div className="text-center mt-10">
            <Link 
              to="/news" 
              className="inline-flex items-center border border-blue-600 text-blue-600 hover:bg-blue-600 hover:text-white px-6 py-3 rounded-lg font-medium transition-colors duration-300"
            >
              Xem tất cả bài viết <FaAngleRight className="ml-2" />
            </Link>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-16 bg-gray-50 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-40 bg-gradient-to-b from-white to-transparent"></div>
        <div className="absolute bottom-0 left-0 w-full h-40 bg-gradient-to-t from-white to-transparent"></div>
        
        <div className="container mx-auto px-4 relative z-10">
          <div className="text-center mb-16" data-aos="fade-up">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-800">
              <span className="inline-block border-b-4 border-primary pb-2">Đánh Giá Từ Bệnh Nhân</span>
            </h2>
            <p className="text-gray-600 max-w-3xl mx-auto mt-4 text-lg">
              Những trải nghiệm và cảm nhận thực tế từ bệnh nhân đã điều trị tại bệnh viện
            </p>
          </div>

          {reviewsLoading ? (
            <div className="flex justify-center items-center py-12">
              <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
              <span className="ml-3 text-gray-600">Đang tải đánh giá...</span>
            </div>
          ) : reviewsError ? (
            <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center mb-8 max-w-2xl mx-auto">
              <p className="text-red-600 mb-2">{reviewsError}</p>
              <button 
                onClick={() => window.location.reload()} 
                className="mt-2 bg-primary text-white py-2 px-4 rounded hover:bg-primary-dark transition-colors"
              >
                Thử lại
              </button>
            </div>
          ) : topReviews.length === 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Fallback Testimonial 1 */}
            <div className="bg-white p-8 rounded-xl shadow-lg relative" data-aos="fade-up" data-aos-delay="100">
              <div className="absolute -top-5 left-8 text-6xl text-blue-200">"</div>
              <div className="relative z-10">
                <p className="text-gray-700 italic mb-6 text-lg">
                  "Tôi đã điều trị tại đây với một ca phẫu thuật tim khá phức tạp. Đội ngũ y bác sĩ rất chuyên nghiệp, tận tâm và chu đáo. Tôi đặc biệt cảm kích bác sĩ Nguyễn Văn A đã theo dõi sức khỏe của tôi rất sát sao trong thời gian hậu phẫu. Giờ đây sức khỏe của tôi đã ổn định."
                </p>
                <div className="flex items-center">
                  <img 
                    src="https://randomuser.me/api/portraits/men/32.jpg" 
                    alt="Ông Trần Văn B" 
                    className="w-14 h-14 rounded-full object-cover mr-4"
                  />
                  <div>
                    <h4 className="font-bold text-gray-900">Ông Trần Văn B</h4>
                    <p className="text-gray-600 text-sm">Bệnh nhân phẫu thuật tim, 58 tuổi</p>
                    <div className="flex items-center mt-1">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <FaStar key={star} className="w-4 h-4 text-yellow-400" />
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>

              {/* Fallback Testimonial 2 */}
            <div className="bg-white p-8 rounded-xl shadow-lg relative" data-aos="fade-up" data-aos-delay="200">
              <div className="absolute -top-5 left-8 text-6xl text-blue-200">"</div>
              <div className="relative z-10">
                <p className="text-gray-700 italic mb-6 text-lg">
                  "Tôi đã sinh con tại bệnh viện và rất hài lòng với dịch vụ. Đội ngũ y tá và bác sĩ sản khoa luôn bên cạnh hỗ trợ tôi, giúp tôi vượt cạn thành công. Phòng dịch vụ sạch sẽ, tiện nghi và thái độ phục vụ rất tốt. Tôi sẽ tiếp tục khám thai và sinh con tại đây nếu có bầu lần sau."
                </p>
                <div className="flex items-center">
                  <img 
                    src="https://randomuser.me/api/portraits/women/65.jpg" 
                    alt="Chị Phạm Thị T" 
                    className="w-14 h-14 rounded-full object-cover mr-4"
                  />
                  <div>
                    <h4 className="font-bold text-gray-900">Chị Phạm Thị T</h4>
                    <p className="text-gray-600 text-sm">Bệnh nhân khoa Sản, 32 tuổi</p>
                    <div className="flex items-center mt-1">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <FaStar key={star} className="w-4 h-4 text-yellow-400" />
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {topReviews.map((review, index) => (
                <div key={review._id || index} className="bg-white p-8 rounded-xl shadow-lg relative" data-aos="fade-up" data-aos-delay={index * 100}>
                  <div className="absolute -top-5 left-8 text-6xl text-blue-200">"</div>
                  <div className="relative z-10">
                    <p className="text-gray-700 italic mb-6 text-lg line-clamp-4">
                      "{review.comment}"
                    </p>
                    <div className="flex items-center">
                      <img 
                        src={review.userId?.avatarUrl || review.userId?.avatar?.secureUrl || `https://randomuser.me/api/portraits/${index % 2 === 0 ? 'men' : 'women'}/${20 + index}.jpg`} 
                        alt={review.userId?.fullName || 'Bệnh nhân'}
                        className="w-14 h-14 rounded-full object-cover mr-4"
                        onError={(e) => {
                          e.target.onerror = null;
                          e.target.src = `https://randomuser.me/api/portraits/${index % 2 === 0 ? 'men' : 'women'}/${20 + index}.jpg`;
                        }}
                      />
                      <div>
                        <h4 className="font-bold text-gray-900">{review.userId?.fullName || 'Bệnh nhân'}</h4>
                        <p className="text-gray-600 text-sm">
                          {review.doctorId ? `Bệnh nhân của ${review.doctorId.user?.fullName || 'bác sĩ'}` : 
                            (review.hospitalId ? `Bệnh nhân tại ${review.hospitalId.name || 'bệnh viện'}` : 'Bệnh nhân')}
                        </p>
                        <div className="flex items-center mt-1">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <FaStar 
                              key={star} 
                              className={`w-4 h-4 ${star <= review.rating ? 'text-yellow-400' : 'text-gray-300'}`} 
                            />
                          ))}
          </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
          
          {/* Remove "Xem thêm đánh giá" link as requested */}
        </div>
      </section>

      {/* Contact Section */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12" data-aos="fade-up">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-800">
              <span className="inline-block border-b-4 border-primary pb-2">Liên Hệ</span>
            </h2>
            <p className="text-gray-600 max-w-3xl mx-auto mt-4 text-lg">
              Nếu bạn có bất kỳ câu hỏi nào, đừng ngần ngại liên hệ với chúng tôi.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-white p-8 rounded-xl shadow-lg border border-gray-100 text-center transition-all duration-300 hover:-translate-y-2 hover:shadow-xl" data-aos="fade-up">
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-6">
                <FaMapMarkerAlt size={24} className="text-primary" />
              </div>
              <h4 className="text-xl font-semibold mb-3 text-gray-800">Địa Chỉ</h4>
              <p className="text-gray-600">123 Đường Nguyễn Huệ, Quận 1, TP.HCM</p>
            </div>
            
            <div className="bg-white p-8 rounded-xl shadow-lg border border-gray-100 text-center transition-all duration-300 hover:-translate-y-2 hover:shadow-xl" data-aos="fade-up" data-aos-delay="100">
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-6">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              <h4 className="text-xl font-semibold mb-3 text-gray-800">Email</h4>
              <p className="text-gray-600">info@hospital.com</p>
            </div>
            
            <div className="bg-white p-8 rounded-xl shadow-lg border border-gray-100 text-center transition-all duration-300 hover:-translate-y-2 hover:shadow-xl" data-aos="fade-up" data-aos-delay="200">
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
      <section className="py-16 bg-gradient-to-r from-blue-600 to-blue-800 relative overflow-hidden">
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
        <div className="container mx-auto px-4 relative" data-aos="fade-up">
          <div className="max-w-4xl mx-auto text-center text-white">
            <h2 className="text-3xl md:text-4xl font-bold mb-4 text-white">Đặt Lịch Khám Ngay Hôm Nay</h2>
            <p className="text-lg mb-8 opacity-90">Chúng tôi luôn sẵn sàng phục vụ và chăm sóc sức khỏe của bạn</p>
            <Link 
              to="/appointment" 
              className="bg-white text-blue-600 hover:bg-gray-100 hover:text-blue-700 px-8 py-4 rounded-lg font-bold text-lg transition-all duration-300 hover:shadow-lg inline-block"
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
        
        .promotional-slider .splide__slide {
          overflow: hidden;
        }
        
        .promotional-slider .splide__slide > div {
          animation: slideContent 0.8s ease-out forwards;
        }
        
        @keyframes slideContent {
          from {
            opacity: 0;
            transform: translateX(20px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
      `}</style>

      {/* Add these CSS animations in your CSS file or in a style tag */}
      <style jsx="true">{`
        /* Background pattern */
        .bg-pattern {
          background-image: url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.2'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2V6h4V4H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E");
        }
        
        /* Text gradient */
        .text-gradient {
          background-clip: text;
          -webkit-background-clip: text;
          color: transparent;
        }
        
        /* Animations */
        @keyframes float {
          0% { transform: translateY(0px); }
          50% { transform: translateY(-15px); }
          100% { transform: translateY(0px); }
        }
        
        @keyframes float-delay {
          0% { transform: translateY(0px); }
          50% { transform: translateY(-15px); }
          100% { transform: translateY(0px); }
        }
        
        @keyframes float-delay2 {
          0% { transform: translateY(-50%) translateX(0px); }
          50% { transform: translateY(-50%) translateX(-10px); }
          100% { transform: translateY(-50%) translateX(0px); }
        }
        
        @keyframes pulse-slow {
          0% { transform: scale(1) rotate(12deg); }
          50% { transform: scale(1.05) rotate(12deg); }
          100% { transform: scale(1) rotate(12deg); }
        }
        
        @keyframes bounce-gentle {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-5px); }
        }
        
        @keyframes blob {
          0% { transform: scale(1); }
          33% { transform: scale(1.1); }
          66% { transform: scale(0.9); }
          100% { transform: scale(1); }
        }
        
        @keyframes fade-in-up {
          0% { opacity: 0; transform: translateY(20px); }
          100% { opacity: 1; transform: translateY(0); }
        }
        
        @keyframes slide-in-left {
          0% { opacity: 0; transform: translateX(-20px); }
          100% { opacity: 1; transform: translateX(0); }
        }
        
        @keyframes spin-slow {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        
        @keyframes spin-reverse {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(-360deg); }
        }
        
        @keyframes floating-button {
          0%, 100% { transform: translateY(0) scale(1); box-shadow: 0 5px 15px rgba(0,0,0,0.2); }
          50% { transform: translateY(-5px) scale(1.05); box-shadow: 0 10px 20px rgba(0,0,0,0.3); }
        }
        
        .animate-float {
          animation: float 6s ease-in-out infinite;
        }
        
        .animate-float-delay {
          animation: float-delay 6s ease-in-out infinite;
          animation-delay: 3s;
        }
        
        .animate-float-delay2 {
          animation: float-delay2 7s ease-in-out infinite;
          animation-delay: 2s;
        }
        
        .animate-pulse-slow {
          animation: pulse-slow 3s ease-in-out infinite;
        }
        
        .animate-bounce-gentle {
          animation: bounce-gentle 2s ease-in-out infinite;
        }
        
        .animate-blob {
          animation: blob 7s infinite;
        }
        
        .animate-fade-in-up {
          animation: fade-in-up 1s ease-out forwards;
        }
        
        .animate-slide-in-left {
          animation: slide-in-left 0.8s ease-out forwards;
        }
        
        .animate-spin-slow {
          animation: spin-slow 15s linear infinite;
        }
        
        .animate-spin-reverse {
          animation: spin-reverse 10s linear infinite;
        }
        
        .animation-delay-300 {
          animation-delay: 0.3s;
        }
        
        .animation-delay-600 {
          animation-delay: 0.6s;
        }
        
        .animation-delay-900 {
          animation-delay: 0.9s;
        }
        
        .animation-delay-1200 {
          animation-delay: 1.2s;
        }
        
        .animation-delay-2000 {
          animation-delay: 2s;
        }
        
        .animation-delay-4000 {
          animation-delay: 4s;
        }
        
        /* Floating Action Buttons */
        .floating-action-buttons {
          position: fixed;
          right: 2rem;
          bottom: 2rem;
          z-index: 50;
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }
        
        .fab-main {
          width: 4rem;
          height: 4rem;
          background-color: #0d6efd;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 5px 15px rgba(0,0,0,0.2);
          color: white;
          cursor: pointer;
          transition: all 0.3s;
          animation: floating-button 2s ease-in-out infinite;
        }
        
        .fab-secondary {
          width: 3.5rem;
          height: 3.5rem;
          background-color: white;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 5px 15px rgba(0,0,0,0.1);
          cursor: pointer;
          transition: all 0.3s;
          animation: pulse-slow 3s ease-in-out infinite;
        }
        
        .fab-secondary:hover {
          transform: scale(1.1);
          box-shadow: 0 10px 20px rgba(0,0,0,0.15);
        }
      `}</style>
      
      {/* Floating Action Buttons */}
      <div className="floating-action-buttons">
        <Link to="/appointment" className="fab-main" title="Đặt lịch khám">
          <FaCalendarCheck size={24} />
        </Link>
        <a href="tel:18001008" className="fab-secondary text-blue-600" title="Hotline: 1800 1008">
          <FaPhone size={24} />
        </a>
        <a href="https://zalo.me/your-account" className="fab-secondary text-green-600" title="Chat Zalo">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 26 26" width="24" height="24">
            <path d="M13.5,1C6.6,1,1,5.9,1,12c0,3.8,2,7.2,5.1,9.1c0.2,0.1,0.3,0.4,0.2,0.6c-0.3,0.9-0.7,2.1-0.8,2.4c-0.2,0.7,0.2,0.7,0.7,0.4 c0.9-0.5,3-1.8,3-1.8c0.2-0.1,0.4-0.1,0.6-0.1c1.2,0.3,2.4,0.5,3.7,0.5c6.9,0,12.5-4.9,12.5-11C26,5.9,20.4,1,13.5,1z" fill="currentColor"/>
            <g fill="#FFF">
              <path d="M7.2,10.9H5.8c-0.3,0-0.6,0.3-0.6,0.6s0.3,0.6,0.6,0.6h1.4c0.3,0,0.6-0.3,0.6-0.6S7.6,10.9,7.2,10.9z"/>
              <path d="M11.3,15.3H5.8c-0.3,0-0.6,0.3-0.6,0.6s0.3,0.6,0.6,0.6h5.5c0.3,0,0.6-0.3,0.6-0.6S11.7,15.3,11.3,15.3z"/>
              <path d="M20.2,10.9h-5.5c-0.3,0-0.6,0.3-0.6,0.6s0.3,0.6,0.6,0.6h5.5c0.3,0,0.6-0.3,0.6-0.6S20.6,10.9,20.2,10.9z"/>
              <path d="M20.2,15.3h-4.1c-0.3,0-0.6,0.3-0.6,0.6s0.3,0.6,0.6,0.6h4.1c0.3,0,0.6-0.3,0.6-0.6S20.6,15.3,20.2,15.3z"/>
            </g>
          </svg>
        </a>
      </div>

      {/* Facilities Section */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12" data-aos="fade-up">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-800">
              <span className="inline-block border-b-4 border-primary pb-2">Cơ Sở Vật Chất</span>
            </h2>
            <p className="text-gray-600 max-w-3xl mx-auto mt-4 text-lg">
              Bệnh viện được trang bị những thiết bị y tế hiện đại nhất để phục vụ chẩn đoán và điều trị
            </p>
          </div>

          {/* Bento grid for facilities */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
            {/* Main Feature */}
            <div className="md:col-span-8 bg-white rounded-2xl shadow-lg overflow-hidden" data-aos="fade-right">
              <div className="relative h-72">
                <img 
                  src="https://img.freepik.com/free-photo/female-doctor-hospital-with-tablet_23-2148827853.jpg" 
                  alt="Phòng khám hiện đại" 
                  className="w-full h-full object-cover transition-transform duration-700 hover:scale-105"
                />
                <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black/70 to-transparent">
                  <h3 className="text-white text-xl font-bold">Phòng Khám Tiêu Chuẩn Quốc Tế</h3>
                  <p className="text-white/80 mt-2">Không gian thoáng đãng, sạch sẽ cùng thiết bị hiện đại</p>
                </div>
              </div>
              <div className="p-6">
                <p className="text-gray-600 mb-4">
                  Hệ thống phòng khám được thiết kế với không gian rộng rãi, thoáng đãng, đảm bảo sự riêng tư và thoải mái cho bệnh nhân. 
                  Trang bị đầy đủ các thiết bị y tế hiện đại nhập khẩu từ các nước tiên tiến, giúp quá trình khám và điều trị đạt hiệu quả cao nhất.
                </p>
                <Link to="/facilities" className="text-primary hover:text-primary-dark font-medium inline-flex items-center">
                  Xem thêm <FaAngleRight className="ml-1" />
                </Link>
              </div>
            </div>

            {/* Side Features */}
            <div className="md:col-span-4 space-y-6">
              {/* Equipment */}
              <div className="bg-white rounded-2xl shadow-lg overflow-hidden" data-aos="fade-left" data-aos-delay="100">
                <div className="relative h-48">
                  <img 
                    src="https://img.freepik.com/free-photo/medical-examination-with-ct-scan_23-2149367358.jpg" 
                    alt="Thiết bị y tế" 
                    className="w-full h-full object-cover transition-transform duration-700 hover:scale-105"
                  />
                  <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/70 to-transparent">
                    <h3 className="text-white text-lg font-semibold">Trang Thiết Bị Hiện Đại</h3>
                  </div>
                </div>
                <div className="p-4">
                  <p className="text-gray-600 mb-2">Hệ thống trang thiết bị nhập khẩu từ các nước phát triển</p>
                  <Link to="/facilities" className="text-primary hover:text-primary-dark font-medium flex items-center text-sm">
                    Xem chi tiết <FaAngleRight className="ml-1" />
                  </Link>
                </div>
              </div>

              {/* Facilities */}
              <div className="bg-white rounded-2xl shadow-lg overflow-hidden" data-aos="fade-left" data-aos-delay="200">
                <div className="relative h-48">
                  <img 
                    src="https://img.freepik.com/free-photo/interior-view-operating-room_1170-2254.jpg" 
                    alt="Phòng phẫu thuật" 
                    className="w-full h-full object-cover transition-transform duration-700 hover:scale-105"
                  />
                  <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/70 to-transparent">
                    <h3 className="text-white text-lg font-semibold">Phòng Phẫu Thuật Vô Trùng</h3>
                  </div>
                </div>
                <div className="p-4">
                  <p className="text-gray-600 mb-2">Chuẩn quốc tế về không gian vô trùng và thiết bị theo dõi</p>
                  <Link to="/facilities/surgery" className="text-primary hover:text-primary-dark font-medium flex items-center text-sm">
                    Xem chi tiết <FaAngleRight className="ml-1" />
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home; 
