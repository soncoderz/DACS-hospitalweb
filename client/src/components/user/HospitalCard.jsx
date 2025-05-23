import React from 'react';
import { Link } from 'react-router-dom';
import PropTypes from 'prop-types';
import { FaStar, FaUserMd, FaMapMarkerAlt, FaPhoneAlt } from 'react-icons/fa';

const HospitalCard = ({ hospital }) => {
  // Skip rendering if hospital is not active
  if (hospital.isActive !== true) {
    return null;
  }

  // Calculate average rating safely
  const rating = (() => {
    if (typeof hospital.avgRating === 'number') {
      return hospital.avgRating;
    } else if (hospital.averageRating) {
      return hospital.averageRating;
    } else if (hospital.rating) {
      return hospital.rating;
    } else if (hospital.ratings && typeof hospital.ratings.average === 'number') {
      return hospital.ratings.average;
    }
    return 0;
  })();

  // Get review count
  const reviewCount = hospital.numReviews || hospital.reviewCount || (hospital.ratings && hospital.ratings.count) || 0;

  // Get doctor count
  const doctorCount = hospital.doctorCount || 0;

  // Render stars
  const renderStars = (rating) => {
    return (
      <div className="flex items-center">
        {[1, 2, 3, 4, 5].map((star) => (
          <FaStar 
            key={star}
            className={`${star <= Math.floor(rating) 
              ? 'text-yellow-500' 
              : star <= Math.ceil(rating) && rating % 1 !== 0 
                ? 'text-yellow-300' 
                : 'text-gray-300'
            } w-3 h-3`}
          />
        ))}
      </div>
    );
  };

  return (
    <div className="bg-white rounded-xl shadow-lg overflow-hidden border border-gray-100 transition-all duration-300 hover:-translate-y-2 hover:shadow-xl hover:border-primary/20 group">
      <Link to={`/branches/${hospital._id}`} className="relative block overflow-hidden h-48">
        <img 
          src={hospital.imageUrl?.startsWith('http') ? hospital.imageUrl : hospital.imageUrl ? `${import.meta.env.VITE_API_URL}${hospital.imageUrl}` : 'https://img.freepik.com/free-photo/empty-interior-modern-hospital-ward_169016-11125.jpg'} 
          alt={hospital.name} 
          className="w-full h-full object-cover object-center transition duration-500 group-hover:scale-110" 
          onError={(e) => {
            e.target.onerror = null;
            e.target.src = 'https://img.freepik.com/free-photo/empty-interior-modern-hospital-ward_169016-11125.jpg';
          }}
        />
        <div className="absolute top-4 right-4 bg-green-100 text-green-800 text-xs font-medium py-1 px-2 rounded-full shadow-sm">
          Đang hoạt động
        </div>
        {/* Rating badge */}
        {rating > 0 && (
          <div className="absolute bottom-2 left-2 bg-yellow-500 text-white text-xs font-bold py-1 px-2 rounded flex items-center">
            <FaStar className="mr-1" />
            {rating.toFixed(1)}
          </div>
        )}
      </Link>
      <div className="p-6">
        <h3 className="text-xl font-bold text-gray-800 mb-1 group-hover:text-primary transition-colors">
          {hospital.name}
        </h3>
        <div className="flex items-start mb-3">
          <FaMapMarkerAlt className="text-primary mt-1 mr-2 flex-shrink-0" />
          <p className="text-gray-600 text-sm leading-relaxed overflow-hidden text-ellipsis whitespace-nowrap">
            {hospital.address || 'Đang cập nhật địa chỉ'}
          </p>
        </div>
        
        {hospital.phone && (
          <div className="flex items-center mb-3">
            <FaPhoneAlt className="text-primary mr-2 flex-shrink-0" />
            <p className="text-gray-600 text-sm">{hospital.phone}</p>
            </div>
          )}
        
        <div className="flex items-center mb-4">
          <div className="flex items-center">
            {renderStars(rating)}
            <span className="ml-2 font-medium text-yellow-500">
              {rating ? rating.toFixed(1) : '0.0'}
            </span>
          </div>
          <span className="mx-2 text-gray-300">•</span>
          <span className="text-gray-500 text-sm">{reviewCount} đánh giá</span>
          {doctorCount > 0 && (
            <>
              <span className="mx-2 text-gray-300">•</span>
              <div className="flex items-center text-gray-500 text-sm">
                <FaUserMd className="text-primary mr-1" />
                {doctorCount} bác sĩ
            </div>
            </>
          )}
        </div>
        
        <Link 
          to={`/branches/${hospital._id}`} 
          className="mt-2 inline-block bg-primary hover:bg-primary-dark text-white hover:text-white w-full py-3 rounded-lg text-center text-sm font-medium transition-colors"
        >
          Xem chi tiết
        </Link>
      </div>
    </div>
  );
};

HospitalCard.propTypes = {
  hospital: PropTypes.object.isRequired
};

export default HospitalCard; 
