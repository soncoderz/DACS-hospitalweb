import React, { useState, useEffect } from 'react';
import api from '../../utils/api';

const ServicesManagement = () => {
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [selectedService, setSelectedService] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');
  
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    duration: '',
    category: '',
    imageUrl: '',
    isActive: true
  });

  // Danh sách các danh mục
  const categories = [
    'Khám tổng quát',
    'Nội khoa',
    'Ngoại khoa',
    'Sản phụ khoa',
    'Nhi khoa',
    'Da liễu',
    'Tai - Mũi - Họng',
    'Mắt',
    'Răng - Hàm - Mặt',
    'Xét nghiệm',
    'Chẩn đoán hình ảnh',
    'Khác'
  ];

  useEffect(() => {
    fetchServices();
  }, []);

  const fetchServices = async () => {
    setLoading(true);
    try {
      // Trong thực tế, gọi API từ server
      // const response = await api.get('/admin/services');
      // setServices(response.data);
      
      // Dữ liệu mẫu
      setServices([
        {
          _id: '1',
          name: 'Khám tổng quát',
          description: 'Gói khám sức khỏe tổng quát bao gồm các xét nghiệm cơ bản và tư vấn của bác sĩ',
          price: 500000,
          duration: 60,
          category: 'Khám tổng quát',
          imageUrl: '/images/services/general-checkup.jpg',
          isActive: true,
          createdAt: '2023-01-10'
        },
        {
          _id: '2',
          name: 'Khám thai định kỳ',
          description: 'Khám thai định kỳ theo dõi sự phát triển của thai nhi và sức khỏe của mẹ',
          price: 300000,
          duration: 45,
          category: 'Sản phụ khoa',
          imageUrl: '/images/services/prenatal-care.jpg',
          isActive: true,
          createdAt: '2023-01-15'
        },
        {
          _id: '3',
          name: 'Khám da liễu',
          description: 'Khám và điều trị các vấn đề về da như mụn, nám, dị ứng, v.v.',
          price: 350000,
          duration: 30,
          category: 'Da liễu',
          imageUrl: '/images/services/dermatology.jpg',
          isActive: true,
          createdAt: '2023-02-01'
        },
        {
          _id: '4',
          name: 'Nội soi dạ dày',
          description: 'Kiểm tra dạ dày và đường tiêu hóa bằng ống nội soi',
          price: 1200000,
          duration: 40,
          category: 'Nội khoa',
          imageUrl: '/images/services/gastroscopy.jpg',
          isActive: false,
          createdAt: '2023-02-20'
        },
        {
          _id: '5',
          name: 'Khám mắt toàn diện',
          description: 'Kiểm tra thị lực, đo nhãn áp và khám tổng quát về mắt',
          price: 400000,
          duration: 45,
          category: 'Mắt',
          imageUrl: '/images/services/eye-examination.jpg',
          isActive: true,
          createdAt: '2023-03-15'
        }
      ]);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching services:', error);
      setError('Không thể tải danh sách dịch vụ. Vui lòng thử lại sau.');
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prevData => ({
      ...prevData,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleImageChange = (e) => {
    // Trong thực tế, sẽ cần upload file lên server và lấy URL
    // Hiện tại chỉ lưu đường dẫn file
    const file = e.target.files[0];
    if (file) {
      setFormData(prevData => ({
        ...prevData,
        imageUrl: URL.createObjectURL(file)
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      if (editMode) {
        // Cập nhật dịch vụ hiện có
        // const response = await api.put(`/admin/services/${selectedService._id}`, formData);
        
        // Cập nhật state
        setServices(prevServices => prevServices.map(service => 
          service._id === selectedService._id ? { ...service, ...formData } : service
        ));
      } else {
        // Tạo dịch vụ mới
        // const response = await api.post('/admin/services', formData);
        
        // Thêm dịch vụ mới vào state với _id giả
        const newService = {
          ...formData,
          _id: Date.now().toString(),
          createdAt: new Date().toISOString().split('T')[0]
        };
        setServices(prevServices => [...prevServices, newService]);
      }

      // Reset form và ẩn form
      resetForm();
      setShowForm(false);
      setError(null);
    } catch (error) {
      console.error('Error saving service:', error);
      setError('Không thể lưu thông tin dịch vụ. Vui lòng thử lại sau.');
    }
  };

  const handleEdit = (service) => {
    setSelectedService(service);
    setFormData({
      name: service.name || '',
      description: service.description || '',
      price: service.price || '',
      duration: service.duration || '',
      category: service.category || '',
      imageUrl: service.imageUrl || '',
      isActive: service.isActive !== undefined ? service.isActive : true
    });
    setEditMode(true);
    setShowForm(true);
  };

  const handleDelete = async (serviceId) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa dịch vụ này?')) {
      return;
    }

    try {
      // Xóa dịch vụ từ API
      // await api.delete(`/admin/services/${serviceId}`);
      
      // Cập nhật state
      setServices(prevServices => prevServices.filter(service => service._id !== serviceId));
    } catch (error) {
      console.error('Error deleting service:', error);
      setError('Không thể xóa dịch vụ. Vui lòng thử lại sau.');
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      price: '',
      duration: '',
      category: '',
      imageUrl: '',
      isActive: true
    });
    setEditMode(false);
    setSelectedService(null);
  };

  const handleAddNew = () => {
    resetForm();
    setShowForm(true);
  };

  const handleCancel = () => {
    resetForm();
    setShowForm(false);
    setError(null);
  };

  // Lọc dịch vụ theo danh mục và từ khóa tìm kiếm
  const filteredServices = services.filter(service => {
    const matchesCategory = filterCategory === 'all' || service.category === filterCategory;
    const matchesSearch = service.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          (service.description || '').toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  // Format tiền tệ
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('vi-VN', { 
      style: 'currency', 
      currency: 'VND',
      maximumFractionDigits: 0
    }).format(amount);
  };

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString('vi-VN');
  };

  return (
    <div className="admin-services-management">
      <div className="admin-section-header">
        <h1>Quản lý dịch vụ</h1>
        <button className="btn btn-primary" onClick={handleAddNew}>
          <i className="fas fa-plus"></i> Thêm dịch vụ mới
        </button>
      </div>

      {error && <div className="alert alert-danger">{error}</div>}

      <div className="admin-filter-section">
        <div className="search-box">
          <input
            type="text"
            placeholder="Tìm kiếm tên dịch vụ, mô tả..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <i className="fas fa-search"></i>
        </div>
        
        <div className="filter-box">
          <label>Danh mục:</label>
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
          >
            <option value="all">Tất cả</option>
            {categories.map((category, index) => (
              <option key={index} value={category}>{category}</option>
            ))}
          </select>
        </div>
      </div>

      {showForm && (
        <div className="admin-form-card">
          <div className="admin-form-header">
            <h2>{editMode ? 'Cập nhật dịch vụ' : 'Thêm dịch vụ mới'}</h2>
            <button className="btn-icon" onClick={handleCancel}>
              <i className="fas fa-times"></i>
            </button>
          </div>
          
          <form onSubmit={handleSubmit} className="admin-form">
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="name">Tên dịch vụ <span className="required">*</span></label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="category">Danh mục <span className="required">*</span></label>
                <select
                  id="category"
                  name="category"
                  value={formData.category}
                  onChange={handleChange}
                  required
                >
                  <option value="">Chọn danh mục</option>
                  {categories.map((category, index) => (
                    <option key={index} value={category}>{category}</option>
                  ))}
                </select>
              </div>
            </div>
            
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="price">Giá (VNĐ) <span className="required">*</span></label>
                <input
                  type="number"
                  id="price"
                  name="price"
                  value={formData.price}
                  onChange={handleChange}
                  min="0"
                  required
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="duration">Thời gian (phút) <span className="required">*</span></label>
                <input
                  type="number"
                  id="duration"
                  name="duration"
                  value={formData.duration}
                  onChange={handleChange}
                  min="0"
                  required
                />
              </div>
            </div>
            
            <div className="form-group">
              <label htmlFor="description">Mô tả</label>
              <textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleChange}
                rows="3"
              ></textarea>
            </div>
            
            <div className="form-group">
              <label htmlFor="imageUpload">Hình ảnh dịch vụ</label>
              <div className="image-upload-container">
                {formData.imageUrl && (
                  <div className="image-preview">
                    <img src={formData.imageUrl} alt="Service preview" />
                    <button 
                      type="button" 
                      className="remove-image" 
                      onClick={() => setFormData(prev => ({ ...prev, imageUrl: '' }))}
                    >
                      <i className="fas fa-times"></i>
                    </button>
                  </div>
                )}
                <input
                  type="file"
                  id="imageUpload"
                  accept="image/*"
                  onChange={handleImageChange}
                />
                <label htmlFor="imageUpload" className="upload-label">
                  <i className="fas fa-cloud-upload-alt"></i> Chọn ảnh
                </label>
              </div>
            </div>
            
            <div className="form-group checkbox-group">
              <input
                type="checkbox"
                id="isActive"
                name="isActive"
                checked={formData.isActive}
                onChange={handleChange}
              />
              <label htmlFor="isActive">Hoạt động</label>
            </div>
            
            <div className="form-actions">
              <button type="button" className="btn btn-outline" onClick={handleCancel}>
                Hủy
              </button>
              <button type="submit" className="btn btn-primary">
                {editMode ? 'Cập nhật' : 'Thêm mới'}
              </button>
            </div>
          </form>
        </div>
      )}

      {loading ? (
        <div className="loading-indicator">Đang tải...</div>
      ) : (
        <div className="admin-services-grid">
          {filteredServices.length > 0 ? (
            filteredServices.map(service => (
              <div key={service._id} className={`service-card ${!service.isActive ? 'inactive' : ''}`}>
                <div className="service-card-header">
                  {service.imageUrl ? (
                    <img
                      src={service.imageUrl}
                      alt={service.name}
                      className="service-image"
                    />
                  ) : (
                    <div className="service-image-placeholder">
                      <i className="fas fa-stethoscope"></i>
                    </div>
                  )}
                  <div className="service-status">
                    <span className={`status-badge ${service.isActive ? 'active' : 'inactive'}`}>
                      {service.isActive ? 'Hoạt động' : 'Không hoạt động'}
                    </span>
                    <span className="service-category">{service.category}</span>
                  </div>
                </div>
                
                <div className="service-card-body">
                  <h3 className="service-name">{service.name}</h3>
                  <p className="service-description">{service.description}</p>
                  
                  <div className="service-details">
                    <div className="service-price">
                      <i className="fas fa-tags"></i>
                      <span>{formatCurrency(service.price)}</span>
                    </div>
                    <div className="service-duration">
                      <i className="far fa-clock"></i>
                      <span>{service.duration} phút</span>
                    </div>
                  </div>
                </div>
                
                <div className="service-card-footer">
                  <div className="service-created-at">
                    <i className="far fa-calendar-alt"></i>
                    <span>Ngày tạo: {formatDate(service.createdAt)}</span>
                  </div>
                  
                  <div className="service-actions">
                    <button 
                      className="btn-icon btn-edit" 
                      onClick={() => handleEdit(service)}
                      title="Chỉnh sửa"
                    >
                      <i className="fas fa-edit"></i>
                    </button>
                    <button 
                      className="btn-icon btn-delete" 
                      onClick={() => handleDelete(service._id)}
                      title="Xóa"
                    >
                      <i className="fas fa-trash-alt"></i>
                    </button>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="no-data-message">
              Không tìm thấy dịch vụ nào
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ServicesManagement; 