import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../utils/api';
import AdminSidebar from '../../components/AdminSidebar';
import '../../styles/admin/UserManagement.css';

const UserManagement = () => {
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRoleFilter, setSelectedRoleFilter] = useState('all');
  
  // State for modal
  const [isRoleModalOpen, setIsRoleModalOpen] = useState(false);
  const [selectedRole, setSelectedRole] = useState(null);
  
  // Fetch users and roles on component mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Fetch users
        const usersResponse = await api.get('/admin/users');
        setUsers(usersResponse.data.data);
        
        // Fetch roles
        const rolesResponse = await api.get('/roles');
        setRoles(rolesResponse.data.data);
        
        setLoading(false);
      } catch (err) {
        console.error('Error fetching data:', err);
        setError('Không thể tải dữ liệu. Vui lòng thử lại sau.');
        setLoading(false);
      }
    };
    
    fetchData();
  }, []);
  
  // Handle user selection
  const handleSelectUser = (user) => {
    setSelectedUser(user);
  };
  
  // Handle role filter change
  const handleRoleFilterChange = (roleType) => {
    setSelectedRoleFilter(roleType);
    setSelectedUser(null);
  };
  
  // Open role change modal
  const handleOpenRoleModal = (user) => {
    setSelectedUser(user);
    setSelectedRole(user.role);
    setIsRoleModalOpen(true);
  };
  
  // Close role change modal
  const handleCloseRoleModal = () => {
    setIsRoleModalOpen(false);
  };
  
  // Change user role
  const handleChangeRole = async () => {
    if (!selectedUser || !selectedRole) return;
    
    try {
      const response = await api.put(`/admin/users/${selectedUser._id}/role`, {
        roleId: selectedRole._id
      });
      
      // Update user in the list
      const updatedUser = response.data.data;
      setUsers(prevUsers => prevUsers.map(user => 
        user._id === updatedUser._id ? updatedUser : user
      ));
      
      // Update selected user
      setSelectedUser(updatedUser);
      
      // Close modal
      setIsRoleModalOpen(false);
    } catch (err) {
      console.error('Error changing user role:', err);
      setError(err.response?.data?.message || 'Không thể thay đổi vai trò. Vui lòng thử lại.');
    }
  };
  
  // Handle search
  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
  };
  
  // Filter users based on search term and role filter
  const filteredUsers = users.filter(user => {
    const matchesSearch = user.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.phoneNumber.includes(searchTerm);
                         
    const matchesRoleFilter = selectedRoleFilter === 'all' || user.roleType === selectedRoleFilter;
    
    return matchesSearch && matchesRoleFilter;
  });
  
  if (loading) {
    return <div className="loading">Đang tải...</div>;
  }
  
  return (
    <div className="admin-layout">
      <AdminSidebar />
      <div className="admin-content">
        <div className="admin-header">
          <h1>Quản lý người dùng</h1>
        </div>
        
        {error && <div className="alert alert-danger">{error}</div>}
        
        <div className="search-filter-container">
          <div className="search-container">
            <input
              type="text"
              className="search-input"
              placeholder="Tìm kiếm theo tên, email, số điện thoại..."
              value={searchTerm}
              onChange={handleSearch}
            />
            <i className="fas fa-search search-icon"></i>
          </div>
          
          <div className="role-filter">
            <span className="filter-label">Lọc theo vai trò:</span>
            <div className="role-buttons">
              <button 
                className={`role-filter-btn ${selectedRoleFilter === 'all' ? 'active' : ''}`}
                onClick={() => handleRoleFilterChange('all')}
              >
                Tất cả
              </button>
              <button 
                className={`role-filter-btn ${selectedRoleFilter === 'admin' ? 'active' : ''}`}
                onClick={() => handleRoleFilterChange('admin')}
              >
                Admin
              </button>
              <button 
                className={`role-filter-btn ${selectedRoleFilter === 'doctor' ? 'active' : ''}`}
                onClick={() => handleRoleFilterChange('doctor')}
              >
                Bác sĩ
              </button>
              <button 
                className={`role-filter-btn ${selectedRoleFilter === 'user' ? 'active' : ''}`}
                onClick={() => handleRoleFilterChange('user')}
              >
                Người dùng
              </button>
            </div>
          </div>
        </div>
        
        <div className="user-management-content">
          <div className="user-list-container">
            <h2>Danh sách người dùng</h2>
            <div className="user-list">
              {filteredUsers.map(user => (
                <div 
                  key={user._id} 
                  className={`user-item ${selectedUser && selectedUser._id === user._id ? 'active' : ''}`}
                  onClick={() => handleSelectUser(user)}
                >
                  <div className="user-avatar">
                    {user.avatarUrl ? (
                      <img src={user.avatarUrl} alt={user.fullName} />
                    ) : (
                      <div className="avatar-placeholder">
                        {user.fullName.charAt(0).toUpperCase()}
                      </div>
                    )}
                  </div>
                  <div className="user-info">
                    <div className="user-name">{user.fullName}</div>
                    <div className="user-email">{user.email}</div>
                    <div className="user-role-badge" data-role={user.roleType}>
                      {getRoleLabel(user.roleType)}
                    </div>
                  </div>
                  <div className="user-actions">
                    <button 
                      className="btn-icon change-role" 
                      onClick={(e) => {
                        e.stopPropagation();
                        handleOpenRoleModal(user);
                      }}
                      title="Thay đổi vai trò"
                    >
                      <i className="fas fa-user-tag"></i>
                    </button>
                  </div>
                </div>
              ))}
              
              {filteredUsers.length === 0 && (
                <div className="no-data">
                  {searchTerm ? 'Không tìm thấy người dùng phù hợp' : 'Chưa có người dùng nào'}
                </div>
              )}
            </div>
          </div>
          
          <div className="user-details-container">
            <h2>Chi tiết người dùng</h2>
            {selectedUser ? (
              <div className="user-details">
                <div className="user-header">
                  <div className="user-avatar-large">
                    {selectedUser.avatarUrl ? (
                      <img src={selectedUser.avatarUrl} alt={selectedUser.fullName} />
                    ) : (
                      <div className="avatar-placeholder-large">
                        {selectedUser.fullName.charAt(0).toUpperCase()}
                      </div>
                    )}
                  </div>
                  <div className="user-header-info">
                    <h3>{selectedUser.fullName}</h3>
                    <div className="user-role-badge large" data-role={selectedUser.roleType}>
                      {getRoleLabel(selectedUser.roleType)}
                    </div>
                    <button 
                      className="btn btn-outline-primary btn-sm" 
                      onClick={() => handleOpenRoleModal(selectedUser)}
                    >
                      <i className="fas fa-user-tag"></i> Thay đổi vai trò
                    </button>
                  </div>
                </div>
                
                <div className="user-detail-section">
                  <h4>Thông tin cá nhân</h4>
                  <div className="user-detail-grid">
                    <div className="detail-item">
                      <span className="detail-label">Email</span>
                      <span className="detail-value">{selectedUser.email}</span>
                    </div>
                    <div className="detail-item">
                      <span className="detail-label">Số điện thoại</span>
                      <span className="detail-value">{selectedUser.phoneNumber}</span>
                    </div>
                    <div className="detail-item">
                      <span className="detail-label">Giới tính</span>
                      <span className="detail-value">{getGenderLabel(selectedUser.gender)}</span>
                    </div>
                    <div className="detail-item">
                      <span className="detail-label">Ngày sinh</span>
                      <span className="detail-value">
                        {new Date(selectedUser.dateOfBirth).toLocaleDateString('vi-VN')}
                      </span>
                    </div>
                    <div className="detail-item">
                      <span className="detail-label">Địa chỉ</span>
                      <span className="detail-value">{selectedUser.address || 'Chưa cập nhật'}</span>
                    </div>
                    <div className="detail-item">
                      <span className="detail-label">Ngày đăng ký</span>
                      <span className="detail-value">
                        {new Date(selectedUser.registrationDate).toLocaleDateString('vi-VN')}
                      </span>
                    </div>
                  </div>
                </div>
                
                <div className="user-detail-section">
                  <h4>Trạng thái tài khoản</h4>
                  <div className="user-detail-grid">
                    <div className="detail-item">
                      <span className="detail-label">Trạng thái xác thực</span>
                      <span className={`detail-value ${selectedUser.isVerified ? 'verified' : 'not-verified'}`}>
                        {selectedUser.isVerified ? 'Đã xác thực' : 'Chưa xác thực'}
                      </span>
                    </div>
                    <div className="detail-item">
                      <span className="detail-label">Phương thức xác thực</span>
                      <span className="detail-value">
                        {selectedUser.verificationMethod === 'email' ? 'Email' : 'Số điện thoại'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="no-user-selected">
                <p>Chọn một người dùng để xem chi tiết</p>
              </div>
            )}
          </div>
        </div>
        
        {/* Modal for changing user role */}
        {isRoleModalOpen && (
          <div className="modal-overlay">
            <div className="modal role-modal">
              <div className="modal-header">
                <h2>Thay đổi vai trò người dùng</h2>
                <button className="close-btn" onClick={handleCloseRoleModal}>
                  <i className="fas fa-times"></i>
                </button>
              </div>
              <div className="modal-body">
                <div className="selected-user-info">
                  <p>Thay đổi vai trò cho người dùng: <strong>{selectedUser.fullName}</strong></p>
                  <p>Vai trò hiện tại: <span className="current-role">{getRoleLabel(selectedUser.roleType)}</span></p>
                </div>
                
                <div className="role-selection">
                  <h4>Chọn vai trò mới</h4>
                  <div className="role-options">
                    {roles.map(role => (
                      <div 
                        key={role._id} 
                        className={`role-option ${selectedRole && selectedRole._id === role._id ? 'selected' : ''}`}
                        onClick={() => setSelectedRole(role)}
                      >
                        <div className="role-option-name">{role.name}</div>
                        <div className="role-option-description">{role.description}</div>
                      </div>
                    ))}
                  </div>
                </div>
                
                <div className="form-actions">
                  <button type="button" className="btn btn-secondary" onClick={handleCloseRoleModal}>
                    Hủy
                  </button>
                  <button 
                    type="button" 
                    className="btn btn-primary" 
                    onClick={handleChangeRole}
                    disabled={!selectedRole || (selectedUser.role && selectedUser.role._id === selectedRole._id)}
                  >
                    Cập nhật vai trò
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// Helper function to convert role code to display label
const getRoleLabel = (roleCode) => {
  const roleMap = {
    'admin': 'Quản trị viên',
    'doctor': 'Bác sĩ',
    'user': 'Người dùng'
  };
  
  return roleMap[roleCode] || roleCode;
};

// Helper function to convert gender code to display label
const getGenderLabel = (gender) => {
  const genderMap = {
    'male': 'Nam',
    'female': 'Nữ',
    'other': 'Khác'
  };
  
  return genderMap[gender] || gender;
};

export default UserManagement; 