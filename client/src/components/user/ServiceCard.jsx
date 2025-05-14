import React from 'react';
import { Link } from 'react-router-dom';
import PropTypes from 'prop-types';
import { FaClock, FaStar } from 'react-icons/fa';

const ServiceCard = ({ service }) => {
  // Skip rendering if service is not active
  if (service.isActive !== true) {
    return null;
  }
  
  // Format currency to VND
  const formatCurrency = (amount) => {
    if (!amount && amount !== 0) return 'Liên hệ để biết giá';
    return new Intl.NumberFormat('vi-VN', { 
      style: 'currency', 
      currency: 'VND',
      maximumFractionDigits: 0
    }).format(amount);
  };
  
  // Calculate average rating safely
  const rating = service.ratings?.average || service.avgRating || service.rating || 0;
  
  // Get review count
  const reviewCount = service.ratings?.count || service.numReviews || service.reviewCount || 0;

  // Get specialty info safely
  const specialtyName = (() => {
    if (service.specialtyId && service.specialtyId.name) {
      return service.specialtyId.name;
    } else if (service.specialty && service.specialty.name) {
      return service.specialty.name;
    } else if (typeof service.specialtyName === 'string') {
      return service.specialtyName;
    }
    return '';
  })();

  return (
    <div className="bg-white rounded-lg overflow-hidden shadow-md hover:shadow-xl transition-all duration-300 flex flex-col h-full border border-gray-100 hover:-translate-y-1">
      <div className="h-48 overflow-hidden relative">
        <img 
          src={service.imageUrl || '/avatars/default-avatar.png'} 
          alt={service.name || 'Dịch vụ y tế'} 
          className="w-full h-full object-cover transition-transform duration-500 hover:scale-105" 
          onError={(e) => {
            e.target.onerror = null;
            e.target.src = '/avatars/default-avatar.png';
          }}
        />
        {specialtyName && (
          <div className="absolute top-3 right-3 bg-primary text-white text-xs py-1 px-3 rounded-full">
            {specialtyName}
          </div>
        )}
        
        {/* Rating badge */}
        {rating > 0 && (
          <div className="absolute bottom-2 left-2 bg-yellow-500 text-white text-xs font-bold py-1 px-2 rounded flex items-center">
            <FaStar className="mr-1" />
            {rating.toFixed(1)}
          </div>
        )}
      </div>
      <div className="p-6 flex flex-col flex-grow">
        <h3 className="text-xl font-semibold text-gray-800 mb-2">{service.name || 'Dịch vụ y tế'}</h3>
        
        {/* Ratings display */}
        {rating > 0 && (
          <div className="flex items-center mt-1 mb-3">
            <div className="flex items-center text-yellow-500">
              <FaStar />
              <span className="ml-1 font-medium">{rating.toFixed(1)}</span>
            </div>
            <span className="mx-2 text-gray-300">•</span>
            <span className="text-gray-500 text-sm">{reviewCount} đánh giá</span>
          </div>
        )}
        
        <div className="mb-3">
          {service.discountPrice ? (
            <div className="flex items-center">
              <span className="text-primary font-bold text-lg">{formatCurrency(service.discountPrice)}</span>
              <span className="ml-2 text-gray-500 text-sm line-through">{formatCurrency(service.price)}</span>
            </div>
          ) : (
            <span className="text-primary font-bold text-lg">{formatCurrency(service.price)}</span>
          )}
        </div>
        
        {service.shortDescription && (
          <div className="flex items-center text-gray-600 text-sm mb-3">
            <FaClock className="text-primary mr-2" /> Thời gian: {service.duration} phút
          </div>
        )}
        
        <p className="text-gray-600 text-sm leading-relaxed mb-5 overflow-hidden text-ellipsis whitespace-nowrap">
          {service.shortDescription || 'Dịch vụ y tế chất lượng cao, đáp ứng nhu cầu chăm sóc sức khỏe.'}
        </p>
        
        {service.features && service.features.length > 0 && (
          <div className="space-y-2 mb-5">
            {service.features.slice(0, 2).map((feature, index) => (
              <div key={index} className="flex items-start">
                <i className="fas fa-check-circle text-primary mt-1 mr-2"></i>
                <span className="text-sm text-gray-600">{feature}</span>
              </div>
            ))}
          </div>
        )}
        
        <div className="flex gap-3 mt-auto">
          <Link 
            to={`/services/${service._id}`} 
            className="flex-1 text-center text-sm border border-primary text-primary hover:bg-primary hover:text-white !hover:text-white px-4 py-2 rounded transition-colors"
          >
            Xem chi tiết
          </Link>
          <Link 
            to={`/appointment?serviceId=${service._id}`} 
            className="flex-1 text-center text-sm bg-primary text-white hover:bg-primary-dark hover:text-white px-4 py-2 rounded transition-colors"
          >
            Đặt lịch
          </Link>
        </div>
      </div>
    </div>
  );
};

ServiceCard.propTypes = {
  service: PropTypes.object.isRequired
};

export default ServiceCard; 
