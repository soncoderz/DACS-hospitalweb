import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../utils/api';
import AdminSidebar from '../../components/AdminSidebar';
import '../../styles/admin/RoleManagement.css';

const RoleManagement = () => {
  const navigate = useNavigate();
  const [roles, setRoles] = useState([]);
  const [selectedRole, setSelectedRole] = useState(null);
  const [allPermissions, setAllPermissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // State for form
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    code: '',
    permissions: []
  });
  
  // State for modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState('create'); // 'create' or 'edit'
  
  // Fetch roles and permissions on component mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Fetch roles
        const rolesResponse = await api.get('/roles');
        setRoles(rolesResponse.data.data);
        
        // Fetch permissions
        const permissionsResponse = await api.get('/permissions');
        setAllPermissions(permissionsResponse.data.data);
        
        setLoading(false);
      } catch (err) {
        console.error('Error fetching data:', err);
        setError('Không thể tải dữ liệu. Vui lòng thử lại sau.');
        setLoading(false);
      }
    };
    
    fetchData();
  }, []);
  
  // Handle role selection
  const handleSelectRole = (role) => {
    setSelectedRole(role);
  };
  
  // Open modal for creating a new role
  const handleOpenCreateModal = () => {
    setFormData({
      name: '',
      description: '',
      code: '',
      permissions: []
    });
    setModalMode('create');
    setIsModalOpen(true);
  };
  
  // Open modal for editing a role
  const handleOpenEditModal = (role) => {
    setFormData({
      name: role.name,
      description: role.description,
      code: role.code,
      permissions: role.permissions.map(p => p._id)
    });
    setSelectedRole(role);
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
  
  // Handle permission checkbox changes
  const handlePermissionChange = (permissionId) => {
    setFormData(prevData => {
      const permissions = [...prevData.permissions];
      
      if (permissions.includes(permissionId)) {
        return {
          ...prevData,
          permissions: permissions.filter(id => id !== permissionId)
        };
      } else {
        return {
          ...prevData,
          permissions: [...permissions, permissionId]
        };
      }
    });
  };
  
  // Submit form for creating or editing a role
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      if (modalMode === 'create') {
        // Create a new role
        const response = await api.post('/roles', formData);
        
        // Add the new role to the list
        setRoles(prevRoles => [...prevRoles, response.data.data]);
      } else {
        // Update existing role
        const response = await api.put(`/roles/${selectedRole._id}`, formData);
        
        // Update the role in the list
        setRoles(prevRoles => prevRoles.map(role => 
          role._id === selectedRole._id ? response.data.data : role
        ));
      }
      
      // Close the modal
      setIsModalOpen(false);
      setSelectedRole(null);
      
    } catch (err) {
      console.error('Error submitting role:', err);
      setError(err.response?.data?.message || 'Có lỗi xảy ra. Vui lòng thử lại.');
    }
  };
  
  // Delete a role
  const handleDeleteRole = async (roleId) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa vai trò này?')) {
      return;
    }
    
    try {
      await api.delete(`/roles/${roleId}`);
      
      // Remove the role from the list
      setRoles(prevRoles => prevRoles.filter(role => role._id !== roleId));
      
      // Deselect the role if it was selected
      if (selectedRole && selectedRole._id === roleId) {
        setSelectedRole(null);
      }
    } catch (err) {
      console.error('Error deleting role:', err);
      setError(err.response?.data?.message || 'Không thể xóa vai trò. Vui lòng thử lại.');
    }
  };
  
  // Group permissions by category
  const groupedPermissions = allPermissions.reduce((acc, permission) => {
    if (!acc[permission.category]) {
      acc[permission.category] = [];
    }
    acc[permission.category].push(permission);
    return acc;
  }, {});
  
  if (loading) {
    return <div className="loading">Đang tải...</div>;
  }
  
  return (
    <div className="admin-layout">
      <AdminSidebar />
      <div className="admin-content">
        <div className="admin-header">
          <h1>Quản lý vai trò</h1>
          <button className="btn btn-primary" onClick={handleOpenCreateModal}>
            <i className="fas fa-plus"></i> Thêm vai trò mới
          </button>
        </div>
        
        {error && <div className="alert alert-danger">{error}</div>}
        
        <div className="role-management-content">
          <div className="role-list-container">
            <h2>Danh sách vai trò</h2>
            <div className="role-list">
              {roles.map(role => (
                <div 
                  key={role._id} 
                  className={`role-item ${selectedRole && selectedRole._id === role._id ? 'active' : ''}`}
                  onClick={() => handleSelectRole(role)}
                >
                  <div className="role-name">{role.name}</div>
                  <div className="role-code">{role.code}</div>
                  <div className="role-actions">
                    <button 
                      className="btn-icon" 
                      onClick={(e) => {
                        e.stopPropagation();
                        handleOpenEditModal(role);
                      }}
                    >
                      <i className="fas fa-edit"></i>
                    </button>
                    {!role.isDefault && (
                      <button 
                        className="btn-icon delete" 
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteRole(role._id);
                        }}
                      >
                        <i className="fas fa-trash"></i>
                      </button>
                    )}
                  </div>
                </div>
              ))}
              
              {roles.length === 0 && (
                <div className="no-data">Chưa có vai trò nào</div>
              )}
            </div>
          </div>
          
          <div className="role-details-container">
            <h2>Chi tiết vai trò</h2>
            {selectedRole ? (
              <div className="role-details">
                <div className="role-info">
                  <h3>{selectedRole.name}</h3>
                  <div className="role-meta">
                    <span className="role-code">Mã: {selectedRole.code}</span>
                    {selectedRole.isDefault && <span className="default-badge">Mặc định</span>}
                  </div>
                  <p className="role-description">{selectedRole.description}</p>
                </div>
                
                <div className="permission-list">
                  <h4>Quyền hạn</h4>
                  {selectedRole.permissions.length > 0 ? (
                    <div className="permissions-by-category">
                      {Object.entries(
                        selectedRole.permissions.reduce((acc, perm) => {
                          if (!acc[perm.category]) {
                            acc[perm.category] = [];
                          }
                          acc[perm.category].push(perm);
                          return acc;
                        }, {})
                      ).map(([category, permissions]) => (
                        <div key={category} className="permission-category">
                          <h5>{getCategoryLabel(category)}</h5>
                          <ul className="permission-items">
                            {permissions.map(permission => (
                              <li key={permission._id} className="permission-item">
                                <span className="permission-name">{permission.name}</span>
                                <span className="permission-code">({permission.code})</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="no-permissions">Không có quyền nào</div>
                  )}
                </div>
              </div>
            ) : (
              <div className="no-role-selected">
                <p>Chọn một vai trò để xem chi tiết</p>
              </div>
            )}
          </div>
        </div>
        
        {/* Modal for creating or editing a role */}
        {isModalOpen && (
          <div className="modal-overlay">
            <div className="modal">
              <div className="modal-header">
                <h2>{modalMode === 'create' ? 'Thêm vai trò mới' : 'Chỉnh sửa vai trò'}</h2>
                <button className="close-btn" onClick={handleCloseModal}>
                  <i className="fas fa-times"></i>
                </button>
              </div>
              <div className="modal-body">
                <form onSubmit={handleSubmit}>
                  <div className="form-group">
                    <label htmlFor="name">Tên vai trò</label>
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
                    <label htmlFor="code">Mã vai trò</label>
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
                      <small className="form-text text-muted">Không thể thay đổi mã vai trò</small>
                    )}
                  </div>
                  
                  <div className="form-group">
                    <label>Quyền hạn</label>
                    
                    <div className="permissions-container">
                      {Object.entries(groupedPermissions).map(([category, permissions]) => (
                        <div key={category} className="permission-category">
                          <h5>{getCategoryLabel(category)}</h5>
                          <div className="permission-checkboxes">
                            {permissions.map(permission => (
                              <div key={permission._id} className="permission-checkbox">
                                <input
                                  type="checkbox"
                                  id={`permission-${permission._id}`}
                                  checked={formData.permissions.includes(permission._id)}
                                  onChange={() => handlePermissionChange(permission._id)}
                                />
                                <label htmlFor={`permission-${permission._id}`}>
                                  {permission.name}
                                </label>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
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

export default RoleManagement; 