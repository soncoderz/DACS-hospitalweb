import React, { useState, useEffect } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import api from '../../utils/api';
import { useAuth } from '../../context/AuthContext';
import { FaStethoscope, FaUserMd, FaHospital, FaCalendarAlt, FaClock, FaMoneyBillWave, FaInfoCircle, FaArrowRight, FaStar, FaProcedures } from 'react-icons/fa';

import ReactDOM from 'react-dom';

const ServiceDetail = () => {
  const { serviceId } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  
  const [service, setService] = useState(null);
  const [relatedServices, setRelatedServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [doctors, setDoctors] = useState([]);
  
  useEffect(() => {
    const fetchServiceData = async () => {
      setLoading(true);
      try {
        // Fetch service details
        const serviceResponse = await api.get(`/services/${serviceId}`);
        setService(serviceResponse.data.data);
        
        // If service has a specialty, fetch related services and doctors from the same specialty
        if (serviceResponse.data.data.specialtyId) {
          const specId = serviceResponse.data.data.specialtyId._id;
          
          // Fetch related services
          const relatedResponse = await api.get(`/appointments/specialties/${specId}/services`);
          // Filter out the current service and limit to 4 related services
          const filteredRelated = relatedResponse.data.data.filter(
            relatedService => relatedService._id !== serviceId
          ).slice(0, 4);
          setRelatedServices(filteredRelated);
          
          // Fetch doctors for this specialty
          const doctorsResponse = await api.get(`/appointments/specialties/${specId}/doctors`);
          setDoctors(doctorsResponse.data.data || []);
        }
        
        setError(null);
      } catch (err) {
        console.error('Error fetching service data:', err);
        setError('Không thể tải thông tin dịch vụ. Vui lòng thử lại sau.');
      } finally {
        setLoading(false);
      }
    };
    
    if (serviceId) {
      fetchServiceData();
    }
  }, [serviceId]);
  
  const handleBookService = () => {
    if (!isAuthenticated) {
      navigate('/auth', { state: { from: `/appointment?service=${serviceId}` } });
      return;
    }
    
    navigate(`/appointment?service=${serviceId}`);
  };
  
  const handleBookWithDoctor = (doctorId) => {
    if (!isAuthenticated) {
      navigate('/auth', { state: { from: `/appointment?service=${serviceId}&doctor=${doctorId}` } });
      return;
    }
    
    navigate(`/appointment?service=${serviceId}&doctor=${doctorId}`);
  };
  
  // Helper function to translate service type
  const getServiceTypeLabel = (type) => {
    const types = {
      'examination': 'Khám bệnh',
      'diagnostic': 'Chẩn đoán',
      'treatment': 'Điều trị',
      'procedure': 'Thủ thuật',
      'surgery': 'Phẫu thuật',
      'consultation': 'Tư vấn'
    };
    return types[type] || 'Khám bệnh';
  };
  
  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p>Đang tải thông tin dịch vụ...</p>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="error-container">
        <h2>Đã xảy ra lỗi!</h2>
        <p>{error}</p>
        <button onClick={() => window.location.reload()} className="btn btn-primary">
          Thử lại
        </button>
      </div>
    );
  }
  
  if (!service) {
    return (
      <div className="error-container">
        <h2>Không tìm thấy dịch vụ</h2>
        <p>Dịch vụ này có thể không tồn tại hoặc đã bị xóa.</p>
        <Link to="/services" className="btn btn-primary">
          Quay lại danh sách dịch vụ
        </Link>
      </div>
    );
  }
  
  return (
    <div className="service-detail-page animated-page">
      <div className="container">
        <div className="page-header">
          <div className="breadcrumb" style={{
            padding: '1rem 0',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            fontSize: '0.95rem',
            color: '#6b7280',
            flexWrap: 'wrap'
          }}>
            <Link to="/" style={{ color: '#2563eb', textDecoration: 'none' }}>Trang chủ</Link> / 
            <Link to="/services" style={{ color: '#2563eb', textDecoration: 'none' }}>Dịch vụ</Link> / 
            <span>{service.name}</span>
          </div>
          
          <div className="service-header fade-in" style={{
            marginTop: '1.5rem',
            display: 'flex',
            alignItems: 'flex-start',
            gap: '2rem',
            backgroundColor: 'white',
            borderRadius: '1rem',
            padding: '2rem',
            boxShadow: '0 4px 10px rgba(0, 0, 0, 0.05)',
            border: '1px solid #e5e7eb',
            flexWrap: 'wrap'
          }}>
            <div className="service-icon-large pulse-animation" style={{
              width: '120px',
              height: '120px',
              backgroundColor: service.imageUrl || service.image ? 'transparent' : '#2563eb',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white',
              fontSize: '3rem',
              boxShadow: '0 10px 25px rgba(37, 99, 235, 0.25)',
              border: '5px solid rgba(255, 255, 255, 0.5)',
              overflow: 'hidden'
            }}>
              {service.imageUrl || service.image ? (
                <img 
                  src={service.imageUrl || service.image}
                  alt={service.name}
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover'
                  }}
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.style.display = 'none';
                    e.target.parentNode.style.backgroundColor = '#2563eb';
                    e.target.parentNode.style.display = 'flex';
                    e.target.parentNode.style.alignItems = 'center';
                    e.target.parentNode.style.justifyContent = 'center';
                    const iconElement = document.createElement('div');
                    iconElement.style.color = 'white';
                    e.target.parentNode.appendChild(iconElement);
                    ReactDOM.render(<FaStethoscope />, iconElement);
                  }}
                />
              ) : (
                <FaStethoscope />
              )}
            </div>
            
            <div className="service-info" style={{ flex: '1' }}>
              <h1 className="service-name" style={{
                fontSize: '2.2rem',
                color: '#1e3a8a',
                marginBottom: '1.2rem',
                fontWeight: '700',
                lineHeight: '1.2'
              }}>{service.name}</h1>
              
              {service.shortDescription && (
                <p className="text-gray-600 mb-4 text-lg">{service.shortDescription}</p>
              )}
              
              <div className="service-meta" style={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: '1rem',
                marginBottom: '1.5rem'
              }}>
                {service.specialtyId && (
                  <div className="meta-item hover-effect" style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    backgroundColor: 'rgba(37, 99, 235, 0.1)',
                    padding: '0.6rem 1rem',
                    borderRadius: '0.5rem',
                    transition: 'transform 0.2s ease',
                    cursor: 'pointer'
                  }} onClick={() => navigate(`/specialties/${service.specialtyId._id}`)}
                  onMouseOver={(e) => {
                    e.currentTarget.style.transform = 'translateY(-3px)';
                    e.currentTarget.style.boxShadow = '0 4px 8px rgba(0, 0, 0, 0.1)';
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = 'none';
                  }}>
                    <FaUserMd className="meta-icon" style={{ color: '#2563eb' }} />
                    <Link to={`/specialties/${service.specialtyId._id}`} style={{ color: '#2563eb', textDecoration: 'none', fontWeight: '500' }}>
                      <span>{service.specialtyId.name}</span>
                    </Link>
                  </div>
                )}
                
                <div className="meta-item hover-effect" style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  backgroundColor: 'rgba(37, 99, 235, 0.1)',
                  padding: '0.6rem 1rem',
                  borderRadius: '0.5rem',
                  transition: 'transform 0.2s ease'
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.transform = 'translateY(-3px)';
                  e.currentTarget.style.boxShadow = '0 4px 8px rgba(0, 0, 0, 0.1)';
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = 'none';
                }}>
                  <FaMoneyBillWave className="meta-icon" style={{ color: '#2563eb' }} />
                  <span style={{ color: '#2563eb', fontWeight: '500' }}>
                    {new Intl.NumberFormat('vi-VN', {
                      style: 'currency',
                      currency: 'VND'
                    }).format(service.price || 0)}
                  </span>
                </div>
                
                <div className="meta-item hover-effect" style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  backgroundColor: 'rgba(37, 99, 235, 0.1)',
                  padding: '0.6rem 1rem',
                  borderRadius: '0.5rem',
                  transition: 'transform 0.2s ease'
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.transform = 'translateY(-3px)';
                  e.currentTarget.style.boxShadow = '0 4px 8px rgba(0, 0, 0, 0.1)';
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = 'none';
                }}>
                  <FaClock className="meta-icon" style={{ color: '#2563eb' }} />
                  <span style={{ color: '#2563eb', fontWeight: '500' }}>{service.duration || 30} phút</span>
                </div>
                
                {service.type && (
                  <div className="meta-item hover-effect" style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    backgroundColor: 'rgba(37, 99, 235, 0.1)',
                    padding: '0.6rem 1rem',
                    borderRadius: '0.5rem',
                    transition: 'transform 0.2s ease'
                  }}
                  onMouseOver={(e) => {
                    e.currentTarget.style.transform = 'translateY(-3px)';
                    e.currentTarget.style.boxShadow = '0 4px 8px rgba(0, 0, 0, 0.1)';
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = 'none';
                  }}>
                    <FaProcedures className="meta-icon" style={{ color: '#2563eb' }} />
                    <span style={{ color: '#2563eb', fontWeight: '500' }}>{getServiceTypeLabel(service.type)}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
        
        <div className="section description-section slide-in-left" style={{
          marginTop: '2.5rem',
          backgroundColor: 'white',
          borderRadius: '1rem',
          padding: '2rem',
          boxShadow: '0 4px 10px rgba(0, 0, 0, 0.05)',
          border: '1px solid #e5e7eb'
        }}>
          <h2 className="section-title" style={{
            fontSize: '1.5rem',
            color: '#1e3a8a',
            marginBottom: '1.5rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem'
          }}>
            <FaInfoCircle style={{ color: '#2563eb' }} />
            Mô tả dịch vụ
          </h2>
          <div className="section-content">
            <p className="service-description" style={{
              fontSize: '1.05rem',
              color: '#4b5563',
              lineHeight: '1.8',
              whiteSpace: 'pre-line'
            }}>
              {service.description || 'Không có mô tả chi tiết cho dịch vụ này.'}
            </p>
          </div>
        </div>
        
        {service.instructions && (
          <div className="section instructions-section slide-in-right" style={{
            marginTop: '2.5rem',
            backgroundColor: 'white',
            borderRadius: '1rem',
            padding: '2rem',
            boxShadow: '0 4px 10px rgba(0, 0, 0, 0.05)',
            border: '1px solid #e5e7eb'
          }}>
            <h2 className="section-title" style={{
              fontSize: '1.5rem',
              color: '#1e3a8a',
              marginBottom: '1.5rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem'
            }}>
              <FaInfoCircle style={{ color: '#2563eb' }} />
              Hướng dẫn chuẩn bị
            </h2>
            <div className="section-content">
              <div className="service-instructions" style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '1rem'
              }}>
                {service.instructions.split('\n').map((instruction, index) => (
                  instruction.trim() && (
                    <div key={index} className="instruction-item hover-effect" style={{
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: '1rem',
                      padding: '1rem',
                      backgroundColor: 'rgba(37, 99, 235, 0.05)',
                      borderRadius: '0.75rem',
                      transition: 'transform 0.2s ease'
                    }}
                    onMouseOver={(e) => {
                      e.currentTarget.style.transform = 'translateY(-3px)';
                      e.currentTarget.style.boxShadow = '0 4px 8px rgba(0, 0, 0, 0.05)';
                      e.currentTarget.style.backgroundColor = 'rgba(37, 99, 235, 0.08)';
                    }}
                    onMouseOut={(e) => {
                      e.currentTarget.style.transform = 'translateY(0)';
                      e.currentTarget.style.boxShadow = 'none';
                      e.currentTarget.style.backgroundColor = 'rgba(37, 99, 235, 0.05)';
                    }}>
                      <div className="instruction-icon" style={{
                        width: '30px',
                        height: '30px',
                        backgroundColor: '#2563eb',
                        borderRadius: '50%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'white',
                        fontWeight: '600',
                        flexShrink: 0
                      }}>{index + 1}</div>
                      <div className="instruction-text" style={{
                        fontSize: '1rem',
                        color: '#4b5563',
                        lineHeight: '1.6'
                      }}>{instruction}</div>
                    </div>
                  )
                ))}
              </div>
            </div>
          </div>
        )}
        
        {service.specialtyId && (
          <div className="section specialty-section slide-in-left" style={{
            marginTop: '2.5rem',
            backgroundColor: 'white',
            borderRadius: '1rem',
            padding: '2rem',
            boxShadow: '0 4px 10px rgba(0, 0, 0, 0.05)',
            border: '1px solid #e5e7eb'
          }}>
            <h2 className="section-title" style={{
              fontSize: '1.5rem',
              color: '#1e3a8a',
              marginBottom: '1.5rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem'
            }}>
              <FaUserMd style={{ color: '#2563eb' }} />
              Chuyên khoa
            </h2>
            <div className="section-content">
              <div className="specialty-detail hover-card" style={{
                display: 'flex',
                alignItems: 'center',
                gap: '2rem',
                padding: '1.5rem',
                backgroundColor: 'rgba(37, 99, 235, 0.05)',
                borderRadius: '1rem',
                transition: 'transform 0.3s ease, box-shadow 0.3s ease',
                flexWrap: 'wrap'
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.transform = 'translateY(-5px)';
                e.currentTarget.style.boxShadow = '0 10px 20px rgba(0, 0, 0, 0.1)';
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = 'none';
              }}>
                <div className="specialty-image-container" style={{
                  width: '100px',
                  height: '100px',
                  borderRadius: '50%',
                  overflow: 'hidden',
                  flexShrink: 0,
                  boxShadow: '0 4px 10px rgba(0, 0, 0, 0.1)',
                  border: '4px solid rgba(229, 231, 235, 0.5)'
                }}>
                  <img 
                    src={service.specialtyId.imageUrl || '/avatars/default-avatar.png'} 
                    alt={service.specialtyId.name}
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover'
                    }}
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src = 'https://cdn-icons-png.flaticon.com/512/3774/3774299.png';
                    }}
                  />
                </div>
                <div className="specialty-content" style={{ flex: '1' }}>
                  <h3 className="specialty-name" style={{
                    fontSize: '1.3rem',
                    color: '#1e3a8a',
                    marginBottom: '0.75rem',
                    fontWeight: '600'
                  }}>{service.specialtyId.name}</h3>
                  <p className="specialty-description" style={{
                    fontSize: '1rem',
                    color: '#4b5563',
                    lineHeight: '1.6',
                    marginBottom: '1.25rem'
                  }}>
                    {service.specialtyId.description || 'Không có mô tả chi tiết cho chuyên khoa này.'}
                  </p>
                  <Link to={`/specialties/${service.specialtyId._id}`} className="btn btn-outline btn-effect" style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    padding: '0.75rem 1.25rem',
                    borderRadius: '0.5rem',
                    color: '#2563eb',
                    border: '1px solid #2563eb',
                    backgroundColor: 'white',
                    textDecoration: 'none',
                    fontWeight: '500',
                    fontSize: '0.95rem',
                    transition: 'all 0.3s ease'
                  }}
                  onMouseOver={(e) => {
                    e.currentTarget.style.backgroundColor = 'rgba(37, 99, 235, 0.05)';
                    e.currentTarget.style.transform = 'translateY(-2px)';
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.backgroundColor = 'white';
                    e.currentTarget.style.transform = 'translateY(0)';
                  }}>
                    Xem chi tiết chuyên khoa <FaArrowRight />
                  </Link>
                </div>
              </div>
            </div>
          </div>
        )}
        
        {doctors.length > 0 && (
          <div className="section doctors-section slide-in-right" style={{
            marginTop: '2.5rem',
            backgroundColor: 'white',
            borderRadius: '1rem',
            padding: '2rem',
            boxShadow: '0 4px 10px rgba(0, 0, 0, 0.05)',
            border: '1px solid #e5e7eb'
          }}>
            <h2 className="section-title" style={{
              fontSize: '1.5rem',
              color: '#1e3a8a',
              marginBottom: '1.5rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem'
            }}>
              <FaUserMd style={{ color: '#2563eb' }} />
              Bác sĩ chuyên khoa thực hiện dịch vụ
            </h2>
            <div className="doctors-grid" style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
              gap: '1.5rem'
            }}>
              {doctors.map(doctor => (
                <div key={doctor._id} className="doctor-card hover-card" style={{
                  display: 'flex',
                  flexDirection: 'column',
                  borderRadius: '1rem',
                  overflow: 'hidden',
                  transition: 'transform 0.3s ease, box-shadow 0.3s ease',
                  border: '1px solid #e5e7eb',
                  backgroundColor: 'white'
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.transform = 'translateY(-10px)';
                  e.currentTarget.style.boxShadow = '0 15px 30px rgba(0, 0, 0, 0.1)';
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = 'none';
                }}>
                  <div className="doctor-avatar-container" style={{
                    height: '200px',
                    overflow: 'hidden',
                    position: 'relative'
                  }}>
                    <img
                      src={doctor.user?.avatarUrl || '/avatars/default-avatar.png'} 
                      alt={doctor.user?.fullName || 'Bác sĩ'}
                      style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover'
                      }}
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = '/avatars/default-avatar.png';
                      }}
                    />
                  </div>
                  
                  <div className="doctor-info" style={{
                    padding: '1.5rem',
                    flexGrow: '1',
                    display: 'flex',
                    flexDirection: 'column'
                  }}>
                    <h3 className="doctor-name" style={{
                      fontSize: '1.2rem',
                      color: '#1e3a8a',
                      marginBottom: '0.5rem',
                      fontWeight: '600'
                    }}>{doctor.user?.fullName || 'Bác sĩ'}</h3>
                    
                    <div className="doctor-specialty" style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      color: '#2563eb',
                      marginBottom: '0.75rem',
                      fontSize: '0.95rem'
                    }}>
                      <FaStethoscope className="specialty-icon" />
                      <span>{service.specialtyId ? service.specialtyId.name : 'Chuyên khoa'}</span>
                    </div>
                    
                    <div className="doctor-meta" style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '1rem',
                      marginBottom: '1rem',
                      color: '#6b7280',
                      fontSize: '0.9rem'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                        <FaStar style={{ color: '#f59e0b' }} />
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
                          return rating !== null ? <span>{rating.toFixed(1)}</span> : null;
                        })()}
                      </div>
                      
                      {doctor.experience && (
                        <div>{doctor.experience} năm kinh nghiệm</div>
                      )}
                    </div>
                    
                    <p className="doctor-description" style={{
                      fontSize: '0.95rem',
                      color: '#4b5563',
                      lineHeight: '1.6',
                      marginBottom: '1.5rem',
                      flexGrow: '1'
                    }}>
                      {doctor.description && doctor.description.length > 120
                        ? `${doctor.description.substring(0, 120)}...`
                        : doctor.description || `Bác sĩ có nhiều năm kinh nghiệm trong lĩnh vực ${service.specialtyId ? service.specialtyId.name : 'y tế'}.`}
                    </p>
                    
                    <div className="view-profile-btn" style={{ marginTop: 'auto' }}>
                      <Link 
                        to={`/doctors/${doctor._id}`} 
                        className="btn btn-primary btn-profile"
                        style={{
                          display: 'inline-flex',
                          width: '100%',
                          justifyContent: 'center',
                          alignItems: 'center',
                          gap: '0.5rem',
                          padding: '0.75rem',
                          backgroundColor: '#2563eb',
                          color: 'white',
                          borderRadius: '0.5rem',
                          textDecoration: 'none',
                          fontWeight: '500',
                          transition: 'all 0.3s ease',
                          border: 'none',
                          boxShadow: '0 4px 6px rgba(37, 99, 235, 0.25)'
                        }}
                        onMouseOver={(e) => {
                          e.currentTarget.style.backgroundColor = '#1d4ed8';
                          e.currentTarget.style.transform = 'translateY(-2px)';
                          e.currentTarget.style.boxShadow = '0 6px 12px rgba(37, 99, 235, 0.3)';
                        }}
                        onMouseOut={(e) => {
                          e.currentTarget.style.backgroundColor = '#2563eb';
                          e.currentTarget.style.transform = 'translateY(0)';
                          e.currentTarget.style.boxShadow = '0 4px 6px rgba(37, 99, 235, 0.25)';
                        }}
                      >
                        Xem Hồ Sơ & Đặt Lịch
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
        
        {relatedServices.length > 0 && (
          <div className="section related-section slide-in-right" style={{
            marginTop: '2.5rem',
            backgroundColor: 'white',
            borderRadius: '1rem',
            padding: '2rem',
            boxShadow: '0 4px 10px rgba(0, 0, 0, 0.05)',
            border: '1px solid #e5e7eb'
          }}>
            <h2 className="section-title" style={{
              fontSize: '1.5rem',
              color: '#1e3a8a',
              marginBottom: '1.5rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem'
            }}>
              <FaStethoscope style={{ color: '#2563eb' }} />
              Dịch vụ liên quan
            </h2>
            <div className="section-content">
              <div className="related-services" style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
                gap: '1.5rem'
              }}>
                {relatedServices.map(relatedService => (
                  <div key={relatedService._id} className="related-service-item hover-card" style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '1rem',
                    padding: '1.25rem',
                    borderRadius: '0.75rem',
                    backgroundColor: 'rgba(37, 99, 235, 0.05)',
                    transition: 'transform 0.3s ease, box-shadow 0.3s ease',
                    border: '1px solid rgba(37, 99, 235, 0.1)'
                  }}
                  onMouseOver={(e) => {
                    e.currentTarget.style.transform = 'translateY(-5px)';
                    e.currentTarget.style.boxShadow = '0 10px 20px rgba(0, 0, 0, 0.1)';
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = 'none';
                  }}>
                    <div className="service-icon pulse-animation" style={{
                      width: '60px',
                      height: '60px',
                      borderRadius: '50%',
                      backgroundColor: '#2563eb',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'white',
                      fontSize: '1.5rem',
                      flexShrink: 0,
                      boxShadow: '0 4px 10px rgba(37, 99, 235, 0.25)'
                    }}>
                      <FaStethoscope />
                    </div>
                    <div className="related-service-info" style={{ flex: '1' }}>
                      <h3 className="related-service-name" style={{
                        fontSize: '1.1rem',
                        color: '#1e3a8a',
                        marginBottom: '0.5rem',
                        fontWeight: '600'
                      }}>
                        <Link to={`/services/${relatedService._id}`} style={{ 
                          textDecoration: 'none',
                          color: '#1e3a8a'
                        }}>{relatedService.name}</Link>
                      </h3>
                      <div className="related-service-price" style={{
                        fontSize: '0.95rem',
                        color: '#2563eb',
                        marginBottom: '0.75rem',
                        fontWeight: '500'
                      }}>
                        {new Intl.NumberFormat('vi-VN', {
                          style: 'currency',
                          currency: 'VND'
                        }).format(relatedService.price || 0)}
                      </div>
                      <Link 
                        to={`/services/${relatedService._id}`}
                        className="btn btn-outline btn-sm btn-effect"
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.5rem',
                          padding: '0.5rem 0.75rem',
                          borderRadius: '0.5rem',
                          fontSize: '0.85rem',
                          color: '#2563eb',
                          border: '1px solid #2563eb',
                          backgroundColor: 'white',
                          textDecoration: 'none',
                          fontWeight: '500',
                          transition: 'all 0.3s ease'
                        }}
                        onMouseOver={(e) => {
                          e.currentTarget.style.backgroundColor = 'rgba(37, 99, 235, 0.05)';
                        }}
                        onMouseOut={(e) => {
                          e.currentTarget.style.backgroundColor = 'white';
                        }}
                      >
                        Xem chi tiết <FaArrowRight style={{ fontSize: '0.75rem' }} />
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
        
        {/* Preparation Guide Section */}
        {service.preparationGuide && (
          <div className="section preparation-section slide-in-right" style={{
            marginTop: '2.5rem',
            backgroundColor: 'white',
            borderRadius: '1rem',
            padding: '2rem',
            boxShadow: '0 4px 10px rgba(0, 0, 0, 0.05)',
            border: '1px solid #e5e7eb'
          }}>
            <h2 className="section-title" style={{
              fontSize: '1.5rem',
              color: '#1e3a8a',
              marginBottom: '1.5rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem'
            }}>
              <FaInfoCircle style={{ color: '#2563eb' }} />
              Hướng dẫn chuẩn bị
            </h2>
            <div className="section-content">
              <div className="service-instructions" style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '1rem'
              }}>
                {service.preparationGuide.split('\n').map((instruction, index) => (
                  instruction.trim() && (
                    <div key={index} className="instruction-item hover-effect" style={{
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: '1rem',
                      padding: '1rem',
                      backgroundColor: 'rgba(37, 99, 235, 0.05)',
                      borderRadius: '0.75rem',
                      transition: 'transform 0.2s ease'
                    }}
                    onMouseOver={(e) => {
                      e.currentTarget.style.transform = 'translateY(-3px)';
                      e.currentTarget.style.boxShadow = '0 4px 8px rgba(0, 0, 0, 0.05)';
                      e.currentTarget.style.backgroundColor = 'rgba(37, 99, 235, 0.08)';
                    }}
                    onMouseOut={(e) => {
                      e.currentTarget.style.transform = 'translateY(0)';
                      e.currentTarget.style.boxShadow = 'none';
                      e.currentTarget.style.backgroundColor = 'rgba(37, 99, 235, 0.05)';
                    }}>
                      <div className="instruction-icon" style={{
                        width: '30px',
                        height: '30px',
                        backgroundColor: '#2563eb',
                        borderRadius: '50%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'white',
                        fontWeight: '600',
                        flexShrink: 0
                      }}>{index + 1}</div>
                      <div className="instruction-text" style={{
                        fontSize: '1rem',
                        color: '#4b5563',
                        lineHeight: '1.6'
                      }}>{instruction}</div>
                    </div>
                  )
                ))}
              </div>
            </div>
          </div>
        )}
        
        {/* Aftercare Instructions Section */}
        {service.aftercareInstructions && (
          <div className="section aftercare-section slide-in-left" style={{
            marginTop: '2.5rem',
            backgroundColor: 'white',
            borderRadius: '1rem',
            padding: '2rem',
            boxShadow: '0 4px 10px rgba(0, 0, 0, 0.05)',
            border: '1px solid #e5e7eb'
          }}>
            <h2 className="section-title" style={{
              fontSize: '1.5rem',
              color: '#1e3a8a',
              marginBottom: '1.5rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem'
            }}>
              <FaInfoCircle style={{ color: '#2563eb' }} />
              Hướng dẫn chăm sóc sau
            </h2>
            <div className="section-content">
              <div className="service-instructions" style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '1rem'
              }}>
                {service.aftercareInstructions.split('\n').map((instruction, index) => (
                  instruction.trim() && (
                    <div key={index} className="instruction-item hover-effect" style={{
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: '1rem',
                      padding: '1rem',
                      backgroundColor: 'rgba(37, 99, 235, 0.05)',
                      borderRadius: '0.75rem',
                      transition: 'transform 0.2s ease'
                    }}
                    onMouseOver={(e) => {
                      e.currentTarget.style.transform = 'translateY(-3px)';
                      e.currentTarget.style.boxShadow = '0 4px 8px rgba(0, 0, 0, 0.05)';
                      e.currentTarget.style.backgroundColor = 'rgba(37, 99, 235, 0.08)';
                    }}
                    onMouseOut={(e) => {
                      e.currentTarget.style.transform = 'translateY(0)';
                      e.currentTarget.style.boxShadow = 'none';
                      e.currentTarget.style.backgroundColor = 'rgba(37, 99, 235, 0.05)';
                    }}>
                      <div className="instruction-icon" style={{
                        width: '30px',
                        height: '30px',
                        backgroundColor: '#2563eb',
                        borderRadius: '50%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'white',
                        fontWeight: '600',
                        flexShrink: 0
                      }}>{index + 1}</div>
                      <div className="instruction-text" style={{
                        fontSize: '1rem',
                        color: '#4b5563',
                        lineHeight: '1.6'
                      }}>{instruction}</div>
                    </div>
                  )
                ))}
              </div>
            </div>
          </div>
        )}
        
        {/* Required Tests Section */}
        {service.requiredTests && service.requiredTests.length > 0 && (
          <div className="section required-tests-section slide-in-right" style={{
            marginTop: '2.5rem',
            backgroundColor: 'white',
            borderRadius: '1rem',
            padding: '2rem',
            boxShadow: '0 4px 10px rgba(0, 0, 0, 0.05)',
            border: '1px solid #e5e7eb'
          }}>
            <h2 className="section-title" style={{
              fontSize: '1.5rem',
              color: '#1e3a8a',
              marginBottom: '1.5rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem'
            }}>
              <FaInfoCircle style={{ color: '#2563eb' }} />
              Xét nghiệm yêu cầu
            </h2>
            <div className="section-content">
              <div className="flex flex-wrap gap-2">
                {service.requiredTests.map((test, index) => (
                  <div key={index} className="bg-blue-50 text-blue-700 px-4 py-2 rounded-lg text-sm font-medium">
                    {test}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
        
        <div className="section booking-section slide-in-bottom" style={{
          marginTop: '2.5rem',
          marginBottom: '2.5rem'
        }}>
          <div className="booking-cta hover-card" style={{
            padding: '2.5rem',
            borderRadius: '1rem',
            backgroundColor: '#ebf4ff',
            background: 'linear-gradient(135deg, #EBF4FF, #E1F0FF)',
            boxShadow: '0 10px 25px rgba(37, 99, 235, 0.1)',
            textAlign: 'center',
            transition: 'transform 0.3s ease, box-shadow 0.3s ease',
            border: '1px solid #C7D2FE'
          }}
          onMouseOver={(e) => {
            e.currentTarget.style.transform = 'translateY(-5px)';
            e.currentTarget.style.boxShadow = '0 15px 35px rgba(37, 99, 235, 0.15)';
          }}
          onMouseOut={(e) => {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = '0 10px 25px rgba(37, 99, 235, 0.1)';
          }}>
            <h2 className="cta-title" style={{
              fontSize: '1.8rem',
              color: '#1e3a8a',
              marginBottom: '1rem',
              fontWeight: '700'
            }}>Đặt lịch dịch vụ này ngay</h2>
            <p className="cta-description" style={{
              fontSize: '1.1rem',
              color: '#4b5563',
              marginBottom: '2rem',
              maxWidth: '700px',
              margin: '0 auto 2rem'
            }}>
              Đội ngũ y bác sĩ chuyên nghiệp và thiết bị hiện đại sẽ đảm bảo chất lượng dịch vụ tốt nhất cho bạn.
            </p>
            <button 
              className="btn btn-primary btn-lg btn-effect pulse-button"
              onClick={handleBookService}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.75rem',
                padding: '1rem 2.5rem',
                backgroundColor: '#2563eb',
                color: 'white',
                borderRadius: '0.5rem',
                fontSize: '1.1rem',
                fontWeight: '600',
                border: 'none',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                boxShadow: '0 4px 12px rgba(37, 99, 235, 0.35)'
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.backgroundColor = '#1d4ed8';
                e.currentTarget.style.transform = 'translateY(-3px)';
                e.currentTarget.style.boxShadow = '0 8px 20px rgba(37, 99, 235, 0.4)';
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.backgroundColor = '#2563eb';
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 4px 12px rgba(37, 99, 235, 0.35)';
              }}
            >
              Đặt lịch ngay <FaCalendarAlt className="btn-icon" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ServiceDetail; 
