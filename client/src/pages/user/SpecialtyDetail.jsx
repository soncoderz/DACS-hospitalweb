import React, { useState, useEffect } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import api from '../../utils/api';
import { useAuth } from '../../context/AuthContext';
import { FaStethoscope, FaUserMd, FaHospital, FaCalendarAlt, FaClock, FaMoneyBillWave, FaInfoCircle, FaArrowRight, FaStar, FaPhoneAlt, FaEnvelope, FaHeartbeat, FaLungs, FaBrain, FaAmbulance, FaBaby, FaTooth, FaEye, FaFileMedicalAlt, FaNotesMedical, FaXRay, FaBone, FaAllergies, FaWheelchair, FaPills, FaProcedures, FaHandHoldingMedical, FaVial, FaDna, FaFirstAid, FaBandAid, FaMicroscope, FaBed, FaVirus, FaTemperatureLow, FaHeadSideMask, FaCapsules, FaSyringe, FaPrescriptionBottle, FaFlask, FaBookMedical, FaIdCard, FaThermometer, FaHospitalUser, FaHospitalAlt, FaClinicMedical, FaHeartBroken } from 'react-icons/fa';
import { GiMedicines, GiDna1, GiMedicalPack, GiHealthNormal, GiHumanEar, GiHeartOrgan, GiChemicalDrop } from 'react-icons/gi';
import { MdLocalHospital, MdMedicalServices, MdBloodtype, MdOutlineVaccines } from 'react-icons/md';
import { IoNutritionOutline } from 'react-icons/io5';

const getSpecialtyColor = (name) => {
  // Use consistent blue color for all specialties
  return '#2563eb';
};

const getSpecialtyIcon = (specialty) => {
  if (!specialty) return <FaStethoscope style={{ fontSize: '3rem' }} />;
  
  // Define the icon mapping
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
    'hospital': FaHospital,
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
    'io-nutrition': IoNutritionOutline,
  };
  
  // If specialty has an icon property, use it
  if (specialty.icon && iconMap[specialty.icon]) {
    const IconComponent = iconMap[specialty.icon];
    return <IconComponent style={{ fontSize: '3rem' }} />;
  }
  
  // Fallback to matching by name if no icon property exists
  const lowerName = specialty.name?.toLowerCase() || '';
  const iconKeys = {
    'da': 'allergies',
    'ngoại': 'procedures',
    'nhi': 'baby',
    'nội': 'stethoscope',
    'sản': 'baby',
    'tai': 'gi-ear',
    'mắt': 'eye',
    'răng': 'tooth',
    'tâm': 'brain',
    'tiêu': 'gi-medicines',
    'tim': 'heartbeat',
    'thần': 'brain',
    'thanh': 'lungs',
    'phục': 'wheelchair',
    'đình': 'hospital-user',
    'truyền': 'vial',
    'phổi': 'lungs',
    'xương': 'bone',
    'hô hấp': 'lungs',
    'thể dục': 'wheelchair',
    'dinh dưỡng': 'io-nutrition',
    'chẩn đoán': 'microscope',
    'thẩm mỹ': 'procedures',
    'ung': 'flask',
    'cấp cứu': 'ambulance',
    'lão': 'hospital-user'
  };
  
  for (const [key, value] of Object.entries(iconKeys)) {
    if (lowerName.includes(key)) {
      const IconComponent = iconMap[value];
      return IconComponent ? <IconComponent style={{ fontSize: '3rem' }} /> : <FaStethoscope style={{ fontSize: '3rem' }} />;
    }
  }
  
  // Default to stethoscope if no match
  return <FaStethoscope style={{ fontSize: '3rem' }} />;
};

const SpecialtyDetail = () => {
  const { specialtyId } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  
  const [specialty, setSpecialty] = useState(null);
  const [doctors, setDoctors] = useState([]);
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Get the appropriate icon component for service display
  const getServiceIcon = (service, specialty) => {
    // If service has its own icon, use it
    if (service.icon) {
      const iconMap = {
        'stethoscope': FaStethoscope,
        'heartbeat': FaHeartbeat,
        'lungs': FaLungs,
        'brain': FaBrain,
        // Add other mappings as needed
      };
      const IconComponent = iconMap[service.icon] || FaStethoscope;
      return <IconComponent className="text-primary text-xl" />;
    }
    
    // Otherwise use the specialty's icon if available
    if (specialty && specialty.icon) {
      const iconMap = {
        'stethoscope': FaStethoscope,
        'heartbeat': FaHeartbeat,
        // Add relevant mappings
      };
      const IconComponent = iconMap[specialty.icon] || FaStethoscope;
      return <IconComponent className="text-primary text-xl" />;
    }
    
    // Default to stethoscope
    return <FaStethoscope className="text-primary text-xl" />;
  };
  
  useEffect(() => {
    const fetchSpecialtyData = async () => {
      setLoading(true);
      try {
        // Fetch specialty details
        const specialtyResponse = await api.get(`/specialties/${specialtyId}`);
        setSpecialty(specialtyResponse.data.data);
        
        // Fetch doctors for this specialty
        const doctorsResponse = await api.get(`/appointments/specialties/${specialtyId}/doctors`);
        setDoctors(doctorsResponse.data.data || []);
        
        // Fetch services for this specialty
        const servicesResponse = await api.get(`/appointments/specialties/${specialtyId}/services`);
        setServices(servicesResponse.data.data || []);
        
        setError(null);
      } catch (err) {
        console.error('Error fetching specialty data:', err);
        setError('Không thể tải thông tin chuyên khoa. Vui lòng thử lại sau.');
      } finally {
        setLoading(false);
      }
    };
    
    if (specialtyId) {
      fetchSpecialtyData();
    }
  }, [specialtyId]);
  
  const handleBookAppointment = (doctorId) => {
    if (!isAuthenticated) {
      navigate('/auth', { state: { from: `/appointment?doctor=${doctorId}` } });
      return;
    }
    
    navigate(`/appointment?doctor=${doctorId}`);
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
        <div className="spinner"></div>
        <p className="mt-4 text-gray-600">Đang tải thông tin chuyên khoa...</p>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-8 text-center max-w-2xl mx-auto my-8">
        <h2 className="text-2xl font-bold text-red-600 mb-3">Đã xảy ra lỗi!</h2>
        <p className="text-gray-700 mb-4">{error}</p>
        <button onClick={() => window.location.reload()} className="bg-primary hover:bg-primary-dark text-white px-4 py-2 rounded font-medium transition-all">
          Thử lại
        </button>
      </div>
    );
  }
  
  if (!specialty) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-8 text-center max-w-2xl mx-auto my-8">
        <h2 className="text-2xl font-bold text-red-600 mb-3">Không tìm thấy chuyên khoa</h2>
        <p className="text-gray-700 mb-4">Chuyên khoa này có thể không tồn tại hoặc đã bị xóa.</p>
        <Link to="/specialties" className="bg-primary hover:bg-primary-dark text-white px-4 py-2 rounded font-medium transition-all inline-block">
          Quay lại danh sách chuyên khoa
        </Link>
      </div>
    );
  }
  
  return (
    <div className="bg-gray-50 py-8">
      <div className="container mx-auto px-4">
        <div className="mb-8">
          <div className="flex flex-col md:flex-row items-center md:items-start gap-6 bg-white rounded-lg shadow-md p-8 transition-all duration-300 hover:shadow-lg">
            <div className="flex-shrink-0">
              {specialty.imageUrl || specialty.image ? (
                <div 
                  className="w-[150px] h-[150px] rounded-full overflow-hidden shadow-lg border-4 border-gray-200 transition-transform duration-300 hover:scale-105"
                >
                  <img 
                    src={specialty.imageUrl || specialty.image} 
                    alt={specialty.name}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.target.onerror = null;
                      // Change to use a div with background and icon
                      const container = e.target.parentNode;
                      container.innerHTML = '';
                      container.style.backgroundColor = getSpecialtyColor(specialty.name);
                      container.style.display = 'flex';
                      container.style.alignItems = 'center';
                      container.style.justifyContent = 'center';
                      
                      // Create icon element
                      const iconWrapper = document.createElement('div');
                      iconWrapper.style.color = 'white';
                      container.appendChild(iconWrapper);
                      
                      // Use React to render the icon
                      const icon = getSpecialtyIcon(specialty);
                      // We need to use a non-React way to add content since we can't use ReactDOM.render in this context
                      iconWrapper.innerHTML = '<div style="font-size: 3rem;"></div>';
                      const iconContainer = iconWrapper.querySelector('div');
                      
                      // Set a class name based on icon type for styling
                      if (specialty.icon) {
                        iconContainer.className = `icon-${specialty.icon}`;
                      } else {
                        iconContainer.className = 'icon-stethoscope';
                      }
                    }}
                  />
                </div>
              ) : (
                <div 
                  className="w-[150px] h-[150px] rounded-full flex items-center justify-center shadow-lg border-4 border-white/40 transition-transform duration-300 hover:scale-105"
                  style={{
                    backgroundColor: getSpecialtyColor(specialty.name)
                  }}
                >
                  {getSpecialtyIcon(specialty)}
                </div>
              )}
            </div>
            
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-gray-800 mb-3 text-center md:text-left flex items-center justify-center md:justify-start">
                {getSpecialtyIcon(specialty).type && (
                  <span className="inline-block mr-3 text-primary" style={{fontSize: "1.75rem"}}>
                    {React.createElement(getSpecialtyIcon(specialty).type, { style: { fontSize: "1.75rem" } })}
                  </span>
                )}
                {specialty.name}
              </h1>
              <p className="text-gray-600 mb-6 text-center md:text-left leading-relaxed">{specialty.description || 'Không có mô tả chi tiết cho chuyên khoa này.'}</p>
              
              <div className="flex flex-wrap gap-4 justify-center md:justify-start">
                <div className="flex items-center gap-2 px-4 py-2 bg-blue-50 rounded-lg text-blue-700 hover:bg-blue-100 transition-colors shadow-sm">
                  <FaUserMd className="text-blue-500" />
                  <span className="font-medium">{doctors.length} bác sĩ</span>
                </div>
                <div className="flex items-center gap-2 px-4 py-2 bg-green-50 rounded-lg text-green-700 hover:bg-green-100 transition-colors shadow-sm">
                  <FaStethoscope className="text-green-500" />
                  <span className="font-medium">{services.length} dịch vụ</span>
                </div>
                <Link to="/appointment" className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors shadow-sm">
                  <FaCalendarAlt />
                  <span className="font-medium">Đặt lịch khám</span>
                </Link>
              </div>
            </div>
          </div>
        </div>
        
        <div className="mb-12 transform transition-all duration-500 hover:translate-x-2">
          <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center">
            <FaUserMd className="mr-3 text-primary" />
            Bác sĩ chuyên khoa {specialty.name}
          </h2>
          
          {doctors.length === 0 ? (
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-8 text-center">
              <p className="text-gray-600">Hiện tại chưa có bác sĩ nào thuộc chuyên khoa này.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {doctors.map(doctor => (
                <div key={doctor._id} className="bg-white rounded-lg shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden transform hover:-translate-y-1">
                  <div className="relative pt-[100%] bg-gray-100">
                    <img 
                      src={doctor.user?.avatarUrl || '/avatars/default-avatar.png'} 
                      alt={doctor.user?.fullName || 'Bác sĩ'} 
                      className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 hover:scale-105" 
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = '/avatars/default-avatar.png';
                      }}
                    />
                  </div>
                  <div className="p-6">
                    <h3 className="text-xl font-semibold text-gray-800 mb-1">{doctor.user?.fullName || 'Bác sĩ'}</h3>
                    <div className="text-primary text-sm font-medium mb-2">{specialty.name}</div>
                    <div className="text-yellow-500 text-sm mb-3 flex items-center">
                      {(() => {
                        // Xử lý tất cả các định dạng đánh giá có thể
                        let rating = null;
                        
                        // Định dạng 1: ratings.average (ƯU TIÊN)
                        if (doctor.ratings && typeof doctor.ratings.average === 'number') {
                          rating = doctor.ratings.average;
                        } 
                        // Định dạng 2: averageRating trực tiếp
                        else if (typeof doctor.averageRating === 'number') {
                          rating = doctor.averageRating;
                        }
                        
                        // Nếu có đánh giá, hiển thị với 1 chữ số thập phân
                        return rating !== null ? (
                          <>
                            <FaStar className="text-yellow-500 mr-1" />
                            <span>{rating.toFixed(1)}</span>
                          </>
                        ) : '';
                      })()}
                      {doctor.experience ? (
                        <span className="ml-2 px-2 py-0.5 bg-blue-50 text-blue-600 rounded-full text-xs">
                          {doctor.experience} năm kinh nghiệm
                        </span>
                      ) : (
                        <span className="ml-2 px-2 py-0.5 bg-blue-50 text-blue-600 rounded-full text-xs">
                          10 năm kinh nghiệm
                        </span>
                      )}
                    </div>
                    <p className="text-gray-600 text-sm mb-6 line-clamp-3">
                      {doctor.description && doctor.description.length > 120
                        ? `${doctor.description.substring(0, 120)}...`
                        : doctor.description || `Bác sĩ có nhiều năm kinh nghiệm trong lĩnh vực ${specialty.name}.`}
                    </p>
                    <Link to={`/doctors/${doctor._id}`} className="block w-full text-center bg-primary text-white hover:bg-primary-dark px-4 py-2 rounded transition-colors">
                      Xem Hồ Sơ & Đặt Lịch
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        
        <div className="mb-12 transform transition-all duration-500 hover:-translate-x-2">
          <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center">
            <FaStethoscope className="mr-3 text-primary" />
            Dịch vụ thuộc chuyên khoa {specialty.name}
          </h2>
          
          {services.length === 0 ? (
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-8 text-center">
              <p className="text-gray-600">Hiện tại chưa có dịch vụ nào thuộc chuyên khoa này.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {services.map(service => (
                <div key={service._id} className="bg-white rounded-lg shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden transform hover:-translate-y-1">
                  <div className="p-5 border-b border-gray-100">
                    <div className="flex items-center">
                      <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mr-4">
                        {React.createElement(
                          getSpecialtyIcon(specialty).type || FaStethoscope,
                          { className: "text-primary text-xl" }
                        )}
                      </div>
                      <h3 className="text-lg font-semibold text-gray-800">{service.name}</h3>
                    </div>
                  </div>
                  
                  <div className="p-5">
                    <p className="text-gray-600 mb-5 line-clamp-3">
                      {service.description && service.description.length > 120
                        ? `${service.description.substring(0, 120)}...`
                        : service.description || 'Không có mô tả chi tiết cho dịch vụ này.'}
                    </p>
                    
                    <div className="flex flex-wrap gap-3 mb-5">
                      {service.price && (
                        <div className="flex items-center text-sm bg-yellow-50 px-3 py-1.5 rounded-full text-yellow-700 shadow-sm">
                          <FaMoneyBillWave className="mr-1.5 text-yellow-500" />
                          <span className="font-medium">
                            {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(service.price)}
                          </span>
                        </div>
                      )}
                      
                      {service.duration && (
                        <div className="flex items-center text-sm bg-blue-50 px-3 py-1.5 rounded-full text-blue-700 shadow-sm">
                          <FaClock className="mr-1.5 text-blue-500" />
                          <span className="font-medium">{service.duration} phút</span>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="px-5 py-4 bg-gray-50 border-t border-gray-100">
                    <div className="flex gap-3">
                      <Link 
                        to={`/services/${service._id}`} 
                        className="flex-1 flex justify-center items-center text-sm border border-primary text-primary hover:bg-primary hover:text-white px-4 py-2 rounded transition-colors"
                      >
                        <FaInfoCircle className="mr-1.5" />
                        <span>Chi tiết</span>
                      </Link>
                      <button 
                        className="flex-1 flex justify-center items-center text-sm bg-primary text-white hover:bg-primary-dark px-4 py-2 rounded transition-colors"
                        onClick={() => handleBookService(service._id)}
                      >
                        <FaCalendarAlt className="mr-1.5" />
                        <span>Đặt lịch</span>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-8 mb-12 shadow-md transform transition-all duration-500 hover:scale-[1.01]">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">Cần tư vấn thêm?</h2>
            <p className="text-gray-600 mb-6">
              Liên hệ với chúng tôi ngay hôm nay để được tư vấn về các dịch vụ y tế thuộc chuyên khoa {specialty.name}.
            </p>
            <div className="flex flex-wrap gap-4 justify-center">
              <a href="tel:+1234567890" className="inline-flex items-center bg-white text-primary hover:bg-gray-50 border border-primary px-6 py-3 rounded-lg font-medium transition-all">
                <FaPhoneAlt className="mr-2" /> Gọi ngay
              </a>
              <Link to="/contact" className="inline-flex items-center bg-primary text-white hover:bg-primary-dark px-6 py-3 rounded-lg font-medium transition-all">
                <FaEnvelope className="mr-2" /> Liên hệ tư vấn
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SpecialtyDetail; 
