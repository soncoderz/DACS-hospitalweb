import React from 'react';
import { Link } from 'react-router-dom';
import PropTypes from 'prop-types';
import { FaUserMd, FaStethoscope, FaStar, FaHeartbeat, FaLungs, FaBrain, FaAmbulance, FaBaby, FaTooth, FaEye, FaFileMedicalAlt, FaNotesMedical, FaXRay, FaBone, FaAllergies, FaWheelchair, FaPills, FaProcedures, FaHandHoldingMedical, FaVial, FaHospital, FaDna, FaFirstAid, FaBandAid, FaMicroscope, FaBed, FaVirus, FaTemperatureLow, FaHeadSideMask, FaCapsules, FaSyringe, FaPrescriptionBottle, FaFlask, FaBookMedical, FaIdCard, FaThermometer, FaHospitalUser, FaHospitalAlt, FaClinicMedical, FaHeartBroken } from 'react-icons/fa';
import { GiMedicines, GiDna1, GiMedicalPack, GiHealthNormal, GiHumanEar, GiHeartOrgan, GiChemicalDrop } from 'react-icons/gi';
import { MdLocalHospital, MdMedicalServices, MdBloodtype, MdOutlineVaccines } from 'react-icons/md';
import { IoNutritionOutline } from 'react-icons/io5';

const SpecialtyCard = ({ specialty }) => {
  // Skip rendering if specialty is not active
  if (specialty.isActive !== true) {
    return null;
  }
  
  // Get doctor count - handle all possible data formats
  const doctorCount = specialty.doctorCount || 
                      specialty.doctors?.length || 
                      (specialty.stats && specialty.stats.doctorCount) ||
                      0;
  
  // Get service count - handle all possible data formats
  const serviceCount = specialty.serviceCount || 
                       specialty.services?.length || 
                       (specialty.stats && specialty.stats.serviceCount) ||
                       0;
  
  // Calculate average rating safely
  const rating = specialty.ratings?.average || specialty.avgRating || specialty.rating || 0;
  
  // Get review count
  const reviewCount = specialty.ratings?.count || specialty.numReviews || specialty.reviewCount || 0;

  // Helper function to get icon component based on icon name
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
      'io-nutrition': IoNutritionOutline
    };
    
    // Return the component if it exists in the map, otherwise return a default
    return iconMap[iconName?.toLowerCase()] || FaStethoscope;
  };
  
  // Get the appropriate icon based on specialty.icon or default to FaStethoscope
  const IconComponent = getIconComponent(specialty.icon);
  
  return (
    <div className="bg-white rounded-xl shadow-lg overflow-hidden border border-gray-100 transition-all duration-300 hover:-translate-y-2 hover:shadow-xl hover:border-primary/20 group">
      <Link to={`/specialties/${specialty._id}`} className="relative block overflow-hidden h-48">
        {specialty.imageUrl ? (
          <img 
            src={specialty.imageUrl.startsWith('http') ? specialty.imageUrl : `${import.meta.env.VITE_API_URL}${specialty.imageUrl}`}
            alt={specialty.name}
            className="w-full h-full object-cover object-center transition duration-500 group-hover:scale-110"
            onError={(e) => {
              e.target.onerror = null;
              e.target.src = 'https://placehold.co/400x400/eee/999?text=Chuyên+Khoa';
            }}
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-r from-primary/20 to-blue-500/20 flex items-center justify-center">
            <div className="flex flex-col items-center">
              <div className="w-16 h-16 rounded-full bg-primary flex items-center justify-center mb-2">
                <IconComponent className="text-white text-3xl" />
              </div>
              <span className="text-xl font-semibold text-primary">
                {specialty.name || 'Chuyên Khoa'}
              </span>
            </div>
          </div>
        )}
        
        {/* Only show badge if rating exists */}
        {rating > 0 && (
          <div className="absolute bottom-2 left-2 bg-yellow-500 text-white text-xs font-bold py-1 px-2 rounded flex items-center">
            <FaStar className="mr-1" />
            {rating.toFixed(1)}
          </div>
        )}
      </Link>
      
      <div className="p-6">
        <h3 className="text-xl font-bold text-gray-800 mb-3 group-hover:text-primary transition-colors flex items-center">
          <IconComponent className="mr-2 text-primary" />
          {specialty.name}
        </h3>
        
        <p className="text-gray-600 text-sm leading-relaxed mb-5 overflow-hidden text-ellipsis whitespace-nowrap">
          {specialty.description || 'Chuyên khoa y tế'}
        </p>
        
        {/* Only show ratings section if ratings exist */}
        {rating > 0 && (
          <div className="flex items-center mb-3">
            <div className="flex items-center text-yellow-500">
              <FaStar />
              <span className="ml-1 font-medium">{rating.toFixed(1)}</span>
            </div>
            <span className="mx-2 text-gray-300">•</span>
            <span className="text-gray-500 text-sm">{reviewCount} đánh giá</span>
          </div>
        )}
        
        {/* Doctor and service counts - always displayed */}
        <div className="flex flex-wrap gap-3 mb-4">
          <div className="inline-flex items-center bg-blue-50 text-blue-700 px-3 py-1.5 rounded-lg text-sm">
            <FaUserMd className="text-primary mr-2" />
            <span className="font-medium">{doctorCount} bác sĩ</span>
          </div>
          <div className="inline-flex items-center bg-green-50 text-green-700 px-3 py-1.5 rounded-lg text-sm">
            <FaStethoscope className="text-primary mr-2" />
            <span className="font-medium">{serviceCount} dịch vụ</span>
          </div>
        </div>
        
        <Link 
          to={`/specialties/${specialty._id}`} 
          className="mt-2 inline-block bg-primary hover:bg-primary-dark text-white hover:text-white w-full py-3 rounded-lg text-center text-sm font-medium transition-colors"
        >
          Xem chi tiết
        </Link>
      </div>
    </div>
  );
};

SpecialtyCard.propTypes = {
  specialty: PropTypes.object.isRequired
};

export default SpecialtyCard; 
