import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../utils/api';
import AdminSidebar from '../../components/AdminSidebar';
import '../../styles/admin/PermissionManagement.css';

const PermissionManagement = () => {
  const navigate = useNavigate();
  const [permissions, setPermissions] = useState([]);
  const [selectedPermission, setSelectedPermission] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // State for form
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    code: '',
    category: 'user'
  });
  
  // State for modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState('create'); // 'create' or 'edit'
  
  // Fetch permissions on component mount
  useEffect(() => {
    const fetchPermissions = async () => {
      try {
        setLoading(true);
        
        // Fetch permissions
        const response = await api.get('/permissions');
        setPermissions(response.data.data);
        
        setLoading(false);
      } catch (err) {
        console.error('Error fetching permissions:', err);
        setError('Không thể tải dữ liệu quyền. Vui lòng thử lại sau.');
        setLoading(false);
      }
    };
    
    fetchPermissions();
  }, []);
  
  // Handle permission selection
  const handleSelectPermission = (permission) => {
    setSelectedPermission(permission);
  };
  
  // Handle category selection
  const handleCategoryChange = (category) => {
    setSelectedCategory(category);
    setSelectedPermission(null);
  };
  
  // Open modal for creating a new permission
  const handleOpenCreateModal = () => {
    setFormData({
      name: '',
      description: '',
      code: '',
      category: selectedCategory !== 'all' ? selectedCategory : 'user'
    });
    setModalMode('create');
    setIsModalOpen(true);
  };
  
  // Open modal for editing a permission
  const handleOpenEditModal = (permission) => {
    setFormData({
      name: permission.name,
      description: permission.description,
      code: permission.code,
      category: permission.category
    });
    setSelectedPermission(permission);
    setModalMode('edit');
    setIsModalOpen(true);
  };
  
  // Close modal
  const handleCloseModal = () => {
    setIsModalOpen(false);
  };
  
  // Handle form input changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };
  
  // Submit form for creating or editing a permission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      if (modalMode === 'create') {
        // Create a new permission
        const response = await api.post('/permissions', formData);
        
        // Add the new permission to the list
        setPermissions(prevPermissions => [...prevPermissions, response.data.data]);
      } else {
        // Update existing permission
        const response = await api.put(`/permissions/${selectedPermission._id}`, formData);
        
        // Update the permission in the list
        setPermissions(prevPermissions => prevPermissions.map(permission => 
          permission._id === selectedPermission._id ? response.data.data : permission
        ));
      }
      
      // Close the modal
      setIsModalOpen(false);
      setSelectedPermission(null);
      
    } catch (err) {
      console.error('Error submitting permission:', err);
      setError(err.response?.data?.message || 'Có lỗi xảy ra. Vui lòng thử lại.');
    }
  };
  
  // Delete a permission
  const handleDeletePermission = async (permissionId) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa quyền này?')) {
      return;
    }
    
    try {
      await api.delete(`/permissions/${permissionId}`);
      
      // Remove the permission from the list
      setPermissions(prevPermissions => prevPermissions.filter(permission => permission._id !== permissionId));
      
      // Deselect the permission if it was selected
      if (selectedPermission && selectedPermission._id === permissionId) {
        setSelectedPermission(null);
      }
    } catch (err) {
      console.error('Error deleting permission:', err);
      setError(err.response?.data?.message || 'Không thể xóa quyền. Vui lòng thử lại.');
    }
  };
  
  // Filter permissions by selected category
  const filteredPermissions = selectedCategory === 'all'
    ? permissions
    : permissions.filter(permission => permission.category === selectedCategory);
  
  // Get unique categories
  const categories = ['all', ...new Set(permissions.map(permission => permission.category))];
  
  if (loading) {
    return <div className="loading">Đang tải...</div>;
  }
  
  return (
    <div className="admin-layout">
      <AdminSidebar />
      <div className="admin-content">
        <div className="admin-header">
          <h1>Quản lý quyền</h1>
          <button className="btn btn-primary" onClick={handleOpenCreateModal}>
            <i className="fas fa-plus"></i> Thêm quyền mới
          </button>
        </div>
        
        {error && <div className="alert alert-danger">{error}</div>}
        
        <div className="permission-management-content">
          <div className="category-filter">
            <h3>Lọc theo danh mục</h3>
            <div className="category-buttons">
              {categories.map(category => (
                <button
                  key={category}
                  className={`category-button ${selectedCategory === category ? 'active' : ''}`}
                  onClick={() => handleCategoryChange(category)}
                >
                  {category === 'all' ? 'Tất cả' : getCategoryLabel(category)}
                </button>
              ))}
            </div>
          </div>
          
          <div className="permission-list-container">
            <h2>Danh sách quyền</h2>
            <div className="permission-list">
              {filteredPermissions.map(permission => (
                <div 
                  key={permission._id} 
                  className={`permission-item ${selectedPermission && selectedPermission._id === permission._id ? 'active' : ''}`}
                  onClick={() => handleSelectPermission(permission)}
                >
                  <div className="permission-name">{permission.name}</div>
                  <div className="permission-code">{permission.code}</div>
                  <div className="permission-category">{getCategoryLabel(permission.category)}</div>
                  <div className="permission-actions">
                    <button 
                      className="btn-icon" 
                      onClick={(e) => {
                        e.stopPropagation();
                        handleOpenEditModal(permission);
                      }}
                    >
                      <i className="fas fa-edit"></i>
                    </button>
                    <button 
                      className="btn-icon delete" 
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeletePermission(permission._id);
                      }}
                    >
                      <i className="fas fa-trash"></i>
                    </button>
                  </div>
                </div>
              ))}
              
              {filteredPermissions.length === 0 && (
                <div className="no-data">
                  {selectedCategory === 'all'
                    ? 'Chưa có quyền nào'
                    : `Không có quyền nào trong danh mục ${getCategoryLabel(selectedCategory)}`
                  }
                </div>
              )}
            </div>
          </div>
          
          <div className="permission-details-container">
            <h2>Chi tiết quyền</h2>
            {selectedPermission ? (
              <div className="permission-details">
                <div className="permission-info">
                  <h3>{selectedPermission.name}</h3>
                  <div className="permission-meta">
                    <span className="permission-code">Mã: {selectedPermission.code}</span>
                    <span className="permission-category-badge">
                      {getCategoryLabel(selectedPermission.category)}
                    </span>
                  </div>
                  <p className="permission-description">{selectedPermission.description}</p>
                </div>
                
                <div className="permission-metadata">
                  <div className="metadata-item">
                    <span className="metadata-label">Ngày tạo:</span>
                    <span className="metadata-value">
                      {new Date(selectedPermission.createdAt).toLocaleDateString('vi-VN')}
                    </span>
                  </div>
                  <div className="metadata-item">
                    <span className="metadata-label">Cập nhật:</span>
                    <span className="metadata-value">
                      {new Date(selectedPermission.updatedAt).toLocaleDateString('vi-VN')}
                    </span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="no-permission-selected">
                <p>Chọn một quyền để xem chi tiết</p>
              </div>
            )}
          </div>
        </div>
        
        {/* Modal for creating or editing a permission */}
        {isModalOpen && (
          <div className="modal-overlay">
            <div className="modal">
              <div className="modal-header">
                <h2>{modalMode === 'create' ? 'Thêm quyền mới' : 'Chỉnh sửa quyền'}</h2>
                <button className="close-btn" onClick={handleCloseModal}>
                  <i className="fas fa-times"></i>
                </button>
              </div>
              <div className="modal-body">
                <form onSubmit={handleSubmit}>
                  <div className="form-group">
                    <label htmlFor="name">Tên quyền</label>
                    <input
                      type="text"
                      id="name"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      className="form-control"
                      required
                    />
                  </div>
                  
                  <div className="form-group">
                    <label htmlFor="description">Mô tả</label>
                    <textarea
                      id="description"
                      name="description"
                      value={formData.description}
                      onChange={handleChange}
                      className="form-control"
                      rows="3"
                      required
                    ></textarea>
                  </div>
                  
                  <div className="form-group">
                    <label htmlFor="code">Mã quyền</label>
                    <input
                      type="text"
                      id="code"
                      name="code"
                      value={formData.code}
                      onChange={handleChange}
                      className="form-control"
                      required
                      disabled={modalMode === 'edit'} // Cannot change code in edit mode
                    />
                    {modalMode === 'edit' && (
                      <small className="form-text text-muted">Không thể thay đổi mã quyền</small>
                    )}
                  </div>
                  
                  <div className="form-group">
                    <label htmlFor="category">Danh mục</label>
                    <select
                      id="category"
                      name="category"
                      value={formData.category}
                      onChange={handleChange}
                      className="form-control"
                      required
                    >
                      <option value="user">Người dùng</option>
                      <option value="doctor">Bác sĩ</option>
                      <option value="service">Dịch vụ</option>
                      <option value="specialty">Chuyên khoa</option>
                      <option value="appointment">Đặt lịch</option>
                      <option value="payment">Thanh toán</option>
                      <option value="statistic">Thống kê</option>
                      <option value="admin">Quản trị</option>
                      <option value="system">Hệ thống</option>
                    </select>
                  </div>
                  
                  <div className="form-actions">
                    <button type="button" className="btn btn-secondary" onClick={handleCloseModal}>
                      Hủy
                    </button>
                    <button type="submit" className="btn btn-primary">
                      {modalMode === 'create' ? 'Thêm mới' : 'Cập nhật'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// Helper function to convert category code to display label
const getCategoryLabel = (categoryCode) => {
  const categoryMap = {
    'user': 'Người dùng',
    'doctor': 'Bác sĩ',
    'service': 'Dịch vụ',
    'specialty': 'Chuyên khoa',
    'appointment': 'Đặt lịch',
    'payment': 'Thanh toán',
    'statistic': 'Thống kê',
    'admin': 'Quản trị',
    'system': 'Hệ thống'
  };
  
  return categoryMap[categoryCode] || categoryCode;
};

export default PermissionManagement; 