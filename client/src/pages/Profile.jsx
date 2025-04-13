import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import { FaEye, FaEyeSlash } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import '../styles/profile.css';
import dayjs from 'dayjs';
import { Tabs } from 'antd';

const { TabPane } = Tabs;

// Avatar placeholder URL
const DEFAULT_AVATAR = 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyMDAgMjAwIj48cmVjdCB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgZmlsbD0iIzNiODJmNiIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBkb21pbmFudC1iYXNlbGluZT0ibWlkZGxlIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBmb250LWZhbWlseT0ic2Fucy1zZXJpZiIgZm9udC1zaXplPSI4NHB4IiBmb250LXdlaWdodD0iYm9sZCIgZmlsbD0id2hpdGUiPlU8L3RleHQ+PC9zdmc+';

// Compact FormField component
const FormField = ({ 
  label, 
  name, 
  value, 
  onChange, 
  type = 'text', 
  readOnly = false, 
  options = [], 
  rows = 2 
}) => {
  const [showPassword, setShowPassword] = useState(false);
  
  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  if (type === 'select') {
    return (
      <div className="form-group">
        <label className="form-label" htmlFor={name}>{label}</label>
        <select
          id={name}
          name={name}
          value={value || ''}
          onChange={onChange}
          className="form-control"
          disabled={readOnly}
        >
          {options.map(option => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>
    );
  }

  if (type === 'textarea') {
    return (
      <div className="form-group">
        <label className="form-label" htmlFor={name}>{label}</label>
        <textarea
          id={name}
          name={name}
          value={value || ''}
          onChange={onChange}
          className="form-control"
          disabled={readOnly}
          rows={rows}
        />
      </div>
    );
  }

  if (type === 'password') {
    return (
      <div className="form-group">
        <label className="form-label" htmlFor={name}>{label}</label>
        <div className="password-input-container">
          <input
            id={name}
            name={name}
            type={showPassword ? 'text' : 'password'}
            value={value || ''}
            onChange={onChange}
            className="form-control"
            disabled={readOnly}
          />
          <button
            type="button"
            className="password-toggle-btn"
            onClick={togglePasswordVisibility}
          >
            {showPassword ? <FaEyeSlash /> : <FaEye />}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="form-group">
      <label className="form-label" htmlFor={name}>{label}</label>
      <input
        id={name}
        name={name}
        type={type}
        value={value || ''}
        onChange={onChange}
        className="form-control"
        disabled={readOnly}
      />
    </div>
  );
};

// Helper function to get user initials for avatar fallback
const getUserInitials = (name) => {
  if (!name) return "U";
  return name
    .split(" ")
    .map(part => part[0])
    .join("")
    .substring(0, 2)
    .toUpperCase();
};

const Profile = () => {
  const { user, login } = useAuth();
  const [activeTab, setActiveTab] = useState('info');
  const navigate = useNavigate();
  const [isEditing, setIsEditing] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [showImageModal, setShowImageModal] = useState(false);
  const [loading, setLoading] = useState(false);
  
  const [formData, setFormData] = useState({
    fullName: user?.fullName || '',
    email: user?.email || '',
    phoneNumber: user?.phoneNumber || '',
    dateOfBirth: user?.dateOfBirth ? new Date(user.dateOfBirth).toISOString().split('T')[0] : '',
    gender: user?.gender || '',
    address: user?.address || '',
    avatarUrl: user?.avatarUrl || ''
  });

  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  
  const [passwordErrors, setPasswordErrors] = useState({});
  const [passwordSuccess, setPasswordSuccess] = useState(null);

  const [passwordVisible, setPasswordVisible] = useState({
    currentPassword: false,
    newPassword: false,
    confirmPassword: false
  });

  const [avatarPreview, setAvatarPreview] = useState(null);
  const [avatarFile, setAvatarFile] = useState(null);

  // Add avatar error state
  const [avatarError, setAvatarError] = useState(false);

  const togglePasswordVisibility = (field) => {
    setPasswordVisible({
      ...passwordVisible,
      [field]: !passwordVisible[field]
    });
  };

  useEffect(() => {
    if (user) {
      // Format date of birth to YYYY-MM-DD for input[type="date"]
      const formattedDateOfBirth = user.dateOfBirth 
        ? new Date(user.dateOfBirth).toISOString().split('T')[0]
        : '';

      setFormData({
        fullName: user.fullName || '',
        email: user.email || '',
        phoneNumber: user.phoneNumber || '',
        dateOfBirth: formattedDateOfBirth,
        gender: user.gender || '',
        address: user.address || '',
        avatarUrl: user.avatarUrl || ''
      });
    }
  }, [user]);

  useEffect(() => {
    if (!user) {
      navigate('/login');
    }
  }, [user, navigate]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prevData => ({
      ...prevData,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      // Gọi API cập nhật thông tin
      const response = await api.put('/auth/profile', formData);
      
      if (response.data.success) {
        // Cập nhật thông tin người dùng trong context
        login(response.data.data, true);
        
        setSuccess('Cập nhật thông tin thành công');
        setIsEditing(false);
      } else {
        throw new Error(response.data.message || 'Lỗi không xác định');
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      
      // Xử lý lỗi từ API
      if (error.response && error.response.data) {
        if (error.response.data.field) {
          // Lỗi cụ thể cho một trường
          setError(`${error.response.data.field}: ${error.response.data.message}`);
        } else if (error.response.data.errors) {
          // Nhiều lỗi validation
          const errorMessages = Object.entries(error.response.data.errors)
            .map(([field, message]) => `${field}: ${message}`)
            .join(', ');
          setError(errorMessages);
        } else {
          // Lỗi chung
          setError(error.response.data.message || 'Không thể cập nhật thông tin. Vui lòng thử lại sau.');
        }
      } else {
        setError('Không thể cập nhật thông tin. Vui lòng thử lại sau.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    // Reset form data to original user data
    if (user) {
      const formattedDateOfBirth = user.dateOfBirth 
        ? new Date(user.dateOfBirth).toISOString().split('T')[0]
        : '';

      setFormData({
        fullName: user.fullName || '',
        email: user.email || '',
        phoneNumber: user.phoneNumber || '',
        dateOfBirth: formattedDateOfBirth,
        gender: user.gender || '',
        address: user.address || '',
        avatarUrl: user.avatarUrl || ''
      });
    }
    setIsEditing(false);
    setError(null);
    setSuccess(null);
  };

  const handlePasswordInputChange = (e) => {
    const { name, value } = e.target;
    setPasswordData(prev => ({ ...prev, [name]: value }));
    // Clear specific error when user starts typing
    if (passwordErrors[name]) {
      setPasswordErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setError('Mật khẩu mới không khớp');
      setLoading(false);
      return;
    }
    
    try {
      const response = await api.post('/api/users/change-password', {
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword
      });
      
      setSuccess('Đổi mật khẩu thành công');
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
      // Reset password visibility
      setPasswordVisible({
        currentPassword: false,
        newPassword: false,
        confirmPassword: false
      });
    } catch (err) {
      setError(err.response?.data?.message || 'Đổi mật khẩu thất bại');
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordDataChange = (e) => {
    setPasswordData({
      ...passwordData,
      [e.target.id]: e.target.value
    });
  };

  const handleAvatarUpload = async (e) => {
    if (!e.target.files || e.target.files.length === 0) {
      return;
    }
    
    const file = e.target.files[0];
    
    // Check file size (5MB limit)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      setError('Kích thước ảnh quá lớn. Vui lòng chọn ảnh nhỏ hơn 5MB.');
      return;
    }
    
    // Validate file type
    const validTypes = ['image/jpeg', 'image/png', 'image/jpg', 'image/gif'];
    if (!validTypes.includes(file.type)) {
      setError('Định dạng ảnh không hợp lệ. Vui lòng chọn ảnh JPG, PNG hoặc GIF.');
      return;
    }
    
    setAvatarFile(file);
    
    // Create a preview URL
    const previewUrl = URL.createObjectURL(file);
    setAvatarPreview(previewUrl);
    
    try {
      setLoading(true);
      setError(null);
      
      // Create form data for upload
      const formData = new FormData();
      formData.append('avatar', file);
      
      console.log('Uploading avatar to server...');
      
      // Upload avatar to server - using the correct endpoint
      const response = await api.post('/auth/avatar', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      
      console.log('Avatar upload response:', response.data);
      
      if (response.data && response.data.success) {
        // Get the avatar URL from the response
        const avatarUrl = response.data.data.avatarUrl;
        console.log('New avatar URL:', avatarUrl);
        
        // Update user in context with new avatar
        const updatedUser = { ...user, avatarUrl };
        login(updatedUser, true);
        
        setSuccess('Cập nhật ảnh đại diện thành công');
        
        // Clean up preview URL to prevent memory leaks
        URL.revokeObjectURL(previewUrl);
      } else {
        throw new Error(response.data.message || 'Không thể tải lên ảnh đại diện');
      }
    } catch (error) {
      console.error('Error uploading avatar:', error);
      setError(error.response?.data?.message || 'Không thể tải lên ảnh đại diện');
      
      // Restore avatar error state so fallback is shown if upload fails
      setAvatarError(true);
      
      // Keep the preview for the current session
      // setAvatarPreview(null);
      // setAvatarFile(null);
    } finally {
      setLoading(false);
    }
  };

  const getGenderLabel = (gender) => {
    switch (gender) {
      case 'male':
        return 'Nam';
      case 'female':
        return 'Nữ';
      case 'other':
        return 'Khác';
      default:
        return 'Không xác định';
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(dateString).toLocaleDateString('vi-VN', options);
  };

  // Dữ liệu mẫu hồ sơ y tế
  const medicalRecords = [
    {
      id: 'mr1',
      date: '2023-04-10',
      doctor: 'BS. Lê Văn C',
      hospital: 'Bệnh viện Đa khoa Trung ương',
      diagnosis: 'Viêm dạ dày',
      treatment: 'Omeprazole 20mg, uống 1 viên sau ăn sáng và tối trong 14 ngày',
      notes: 'Hạn chế ăn đồ cay nóng, tránh stress'
    },
    {
      id: 'mr2',
      date: '2023-02-15',
      doctor: 'BS. Nguyễn Văn A',
      hospital: 'Bệnh viện Đa khoa Trung ương',
      diagnosis: 'Cao huyết áp giai đoạn 1',
      treatment: 'Amlodipine 5mg, uống 1 viên mỗi sáng',
      notes: 'Kiểm soát huyết áp tại nhà, giảm muối trong khẩu phần ăn'
    }
  ];

  // Dữ liệu mẫu đơn thuốc
  const prescriptions = [
    {
      id: 'p1',
      date: '2023-04-10',
      doctor: 'BS. Lê Văn C',
      hospital: 'Bệnh viện Đa khoa Trung ương',
      medicines: [
        { name: 'Omeprazole 20mg', dosage: '1 viên sau ăn sáng và tối', duration: '14 ngày' },
        { name: 'Domperidone 10mg', dosage: '1 viên trước ăn sáng, trưa, tối', duration: '7 ngày' }
      ],
      notes: 'Hạn chế ăn đồ cay nóng, tránh stress'
    },
    {
      id: 'p2',
      date: '2023-02-15',
      doctor: 'BS. Nguyễn Văn A',
      hospital: 'Bệnh viện Đa khoa Trung ương',
      medicines: [
        { name: 'Amlodipine 5mg', dosage: '1 viên mỗi sáng', duration: '30 ngày' },
        { name: 'Aspirin 81mg', dosage: '1 viên mỗi sáng', duration: '30 ngày' }
      ],
      notes: 'Kiểm soát huyết áp tại nhà, giảm muối trong khẩu phần ăn'
    }
  ];

  // Hàm để mở modal xem ảnh
  const openImageModal = () => {
    setShowImageModal(true);
  };

  // Hàm để đóng modal xem ảnh
  const closeImageModal = () => {
    setShowImageModal(false);
  };

  // Function to format avatar URL
  const getAvatarUrl = (avatarPath) => {
    if (!avatarPath) {
      return DEFAULT_AVATAR;
    }
    
    try {
      // If it's a data URL
      if (avatarPath.startsWith('data:')) {
        return avatarPath;
      }
      
      // If it's a server path
      if (avatarPath.startsWith('/uploads')) {
        // Server port is 5000 from .env file
        const serverBaseUrl = 'http://localhost:5000';
        return `${serverBaseUrl}${avatarPath}`;
      }
      
      // Return original path for external URLs
      return avatarPath;
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error("Error getting avatar URL, using default");
      }
      return DEFAULT_AVATAR;
    }
  };

  // Add reset avatar error function
  const resetAvatarError = () => {
    setAvatarError(false);
  };

  if (!user) {
    return null;
  }

  return (
    <div className="profile-page">
      <div className="container">
        <div className="profile-container">
          <div className="profile-sidebar">
            <div className="profile-avatar-container">
              <div className="avatar-wrapper">
                {avatarPreview ? (
                  <img 
                    src={avatarPreview} 
                    alt={formData.fullName} 
                    className="user-avatar"
                  />
                ) : user?.avatarUrl && !avatarError ? (
                  <img 
                    src={getAvatarUrl(user.avatarUrl)} 
                    alt={user.fullName} 
                    className="user-avatar"
                    onError={(e) => {
                      // Chỉ log khi cần debug
                      if (process.env.NODE_ENV === 'development' && import.meta.env.VITE_DEBUG_AVATAR === 'true') {
                        console.error("Avatar failed to load - using fallback");
                      }
                      setAvatarError(true);
                      e.target.onerror = null; // Ngăn lỗi lặp lại
                    }}
                  />
                ) : (
                  <div className="avatar-placeholder">
                    {getUserInitials(user?.fullName)}
                  </div>
                )}
              </div>
              <div className="avatar-actions">
                <div className="avatar-view">
                  <label className="avatar-view-label" onClick={openImageModal}>
                    <i className="fas fa-eye"></i>
                  </label>
                </div>
                <div className="avatar-upload">
                  <label className="avatar-upload-label" htmlFor="avatar-input">
                    <i className="fas fa-camera"></i>
                  </label>
                  <input 
                    id="avatar-input" 
                    type="file" 
                    className="avatar-input" 
                    accept="image/*"
                    onChange={handleAvatarUpload}
                  />
                </div>
              </div>
            </div>
            
            <h3 className="profile-name">{user?.fullName}</h3>
            
            <ul className="profile-tabs">
              <li className={`profile-tab ${activeTab === 'info' ? 'active' : ''}`} onClick={() => setActiveTab('info')}>
                <i className="fas fa-user"></i>
                Thông tin cá nhân
              </li>
              <li className={`profile-tab ${activeTab === 'medicalRecords' ? 'active' : ''}`} onClick={() => setActiveTab('medicalRecords')}>
                <i className="fas fa-notes-medical"></i>
                Hồ sơ y tế
              </li>
              <li className={`profile-tab ${activeTab === 'prescriptions' ? 'active' : ''}`} onClick={() => setActiveTab('prescriptions')}>
                <i className="fas fa-prescription-bottle-alt"></i>
                Đơn thuốc
              </li>
              <li className={`profile-tab ${activeTab === 'security' ? 'active' : ''}`} onClick={() => setActiveTab('security')}>
                <i className="fas fa-lock"></i>
                Bảo mật
              </li>
            </ul>
          </div>

          <div className="profile-content">
            {activeTab === 'info' && (
              <div className="profile-info-tab">
                <div className="profile-header">
                  <h2>Thông tin cá nhân</h2>
                  {isEditing ? (
                    <div className="profile-actions">
                      <button className="btn btn-secondary" onClick={handleCancel}>Hủy</button>
                      <button className="btn btn-primary" type="submit" onClick={handleSubmit}>Lưu thay đổi</button>
                    </div>
                  ) : (
                    <button className="btn btn-primary" onClick={() => setIsEditing(true)}>
                      <i className="fas fa-edit"></i> Chỉnh sửa
                    </button>
                  )}
                </div>
                
                {error && <div className="alert alert-danger">{error}</div>}
                {success && <div className="alert alert-success">{success}</div>}
                
                {!isEditing ? (
                  <div className="personal-info-section">
                    <div className="personal-info-item">
                      <div className="info-label">Họ và tên:</div>
                      <div className="info-value">{formData.fullName}</div>
                    </div>
                    <div className="personal-info-item">
                      <div className="info-label">Email:</div>
                      <div className="info-value">{formData.email}</div>
                    </div>
                    <div className="personal-info-item">
                      <div className="info-label">Số điện thoại:</div>
                      <div className="info-value">{formData.phoneNumber || 'Chưa cập nhật'}</div>
                    </div>
                    <div className="personal-info-item">
                      <div className="info-label">Ngày sinh:</div>
                      <div className="info-value">{formData.dateOfBirth ? formatDate(formData.dateOfBirth) : 'Chưa cập nhật'}</div>
                    </div>
                    <div className="personal-info-item">
                      <div className="info-label">Giới tính:</div>
                      <div className="info-value">{formData.gender ? getGenderLabel(formData.gender) : 'Chưa cập nhật'}</div>
                    </div>
                    <div className="personal-info-item">
                      <div className="info-label">Địa chỉ:</div>
                      <div className="info-value">{formData.address || 'Chưa cập nhật'}</div>
                    </div>
                  </div>
                ) : (
                  <div className="profile-edit-form">
                    <form onSubmit={handleSubmit}>
                      <FormField 
                        label="Họ và tên"
                        name="fullName"
                        type="text"
                        value={formData.fullName}
                        onChange={handleChange}
                      />
                      <FormField 
                        label="Email"
                        name="email"
                        type="email"
                        value={formData.email}
                        onChange={handleChange}
                        readOnly={true}
                      />
                      <FormField 
                        label="Số điện thoại"
                        name="phoneNumber"
                        type="tel"
                        value={formData.phoneNumber}
                        onChange={handleChange}
                      />
                      <FormField 
                        label="Ngày sinh"
                        name="dateOfBirth"
                        type="date"
                        value={formData.dateOfBirth}
                        onChange={handleChange}
                      />
                      <FormField 
                        label="Giới tính"
                        name="gender"
                        type="select"
                        value={formData.gender}
                        onChange={handleChange}
                        options={[
                          { value: '', label: 'Chọn giới tính' },
                          { value: 'male', label: 'Nam' },
                          { value: 'female', label: 'Nữ' },
                          { value: 'other', label: 'Khác' }
                        ]}
                      />
                      <FormField 
                        label="Địa chỉ"
                        name="address"
                        type="text"
                        value={formData.address}
                        onChange={handleChange}
                      />
                      <FormField 
                        label="Tiền sử bệnh"
                        name="medicalHistory"
                        type="textarea"
                        value={formData.medicalHistory}
                        onChange={handleChange}
                      />
                      <FormField 
                        label="Dị ứng"
                        name="allergies"
                        type="textarea"
                        value={formData.allergies}
                        onChange={handleChange}
                      />
                      <FormField 
                        label="Thuốc đang dùng"
                        name="currentSymptoms"
                        type="textarea"
                        value={formData.currentSymptoms}
                        onChange={handleChange}
                      />
                    </form>
                  </div>
                )}
                
                {isEditing && (
                  <div className="profile-actions">
                    <button type="button" className="btn btn-secondary" onClick={handleCancel}>Hủy</button>
                    <button type="submit" className="btn btn-primary" disabled={loading} onClick={handleSubmit}>
                      {loading ? 'Đang lưu...' : 'Lưu thay đổi'}
                    </button>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'medicalRecords' && (
              <div className="profile-medical-records-tab">
                <div className="profile-header">
                  <h2>Hồ sơ y tế</h2>
                </div>

                {medicalRecords.length > 0 ? (
                  <div className="medical-records-list">
                    {medicalRecords.map(record => (
                      <div key={record.id} className="medical-record-card">
                        <div className="medical-record-header">
                          <div className="medical-record-date">
                            <i className="fas fa-calendar-alt"></i>
                            <span>{formatDate(record.date)}</span>
                          </div>
                          <a href={`/medical-records/${record.id}`} className="btn btn-outline btn-sm">
                            <i className="fas fa-eye"></i> Xem chi tiết
                          </a>
                        </div>

                        <div className="medical-record-body">
                          <div className="medical-record-info">
                            <p><strong>Bác sĩ:</strong> {record.doctor}</p>
                            <p><strong>Bệnh viện:</strong> {record.hospital}</p>
                            <p><strong>Chẩn đoán:</strong> {record.diagnosis}</p>
                            <p><strong>Điều trị:</strong> {record.treatment}</p>
                            {record.notes && <p><strong>Ghi chú:</strong> {record.notes}</p>}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="empty-state">
                    <div className="empty-icon">
                      <i className="fas fa-file-medical"></i>
                    </div>
                    <h3>Không có hồ sơ y tế</h3>
                    <p>Bạn chưa có hồ sơ y tế nào.</p>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'prescriptions' && (
              <div className="profile-prescriptions-tab">
                <div className="profile-header">
                  <h2>Đơn thuốc</h2>
                </div>

                {prescriptions.length > 0 ? (
                  <div className="prescriptions-list">
                    {prescriptions.map(prescription => (
                      <div key={prescription.id} className="prescription-card">
                        <div className="prescription-header">
                          <div className="prescription-date">
                            <i className="fas fa-calendar-alt"></i>
                            <span>{formatDate(prescription.date)}</span>
                          </div>
                          <a href={`/prescriptions/${prescription.id}`} className="btn btn-outline btn-sm">
                            <i className="fas fa-print"></i> In đơn thuốc
                          </a>
                        </div>

                        <div className="prescription-body">
                          <div className="prescription-info">
                            <p><strong>Bác sĩ:</strong> {prescription.doctor}</p>
                            <p><strong>Bệnh viện:</strong> {prescription.hospital}</p>
                          </div>

                          <div className="prescription-medicines">
                            <h4>Danh sách thuốc</h4>
                            <ul className="medicine-list">
                              {prescription.medicines.map((medicine, index) => (
                                <li key={index} className="medicine-item">
                                  <div className="medicine-name">{medicine.name}</div>
                                  <div className="medicine-details">
                                    <span className="medicine-dosage">{medicine.dosage}</span>
                                    <span className="medicine-duration">{medicine.duration}</span>
                                  </div>
                                </li>
                              ))}
                            </ul>
                          </div>
                          
                          {prescription.notes && (
                            <div className="prescription-notes">
                              <p><strong>Ghi chú:</strong> {prescription.notes}</p>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="empty-state">
                    <div className="empty-icon">
                      <i className="fas fa-prescription-bottle-alt"></i>
                    </div>
                    <h3>Không có đơn thuốc</h3>
                    <p>Bạn chưa có đơn thuốc nào.</p>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'security' && (
              <div className="profile-security-tab">
                <div className="profile-header">
                  <h2>Bảo mật</h2>
                </div>

                <div className="security-section">
                  <h3>Đổi mật khẩu</h3>
                  {passwordSuccess && <div className="alert alert-success">{passwordSuccess}</div>}
                  {passwordErrors.general && <div className="alert alert-danger">{passwordErrors.general}</div>}
                  
                  <form className="password-form" onSubmit={handlePasswordChange}>
                    <FormField 
                      id="currentPassword"
                      label="Mật khẩu hiện tại"
                      type="password"
                      value={passwordData.currentPassword}
                      onChange={handlePasswordDataChange}
                      isPassword={true}
                      passwordVisible={passwordVisible.currentPassword}
                      onTogglePassword={() => togglePasswordVisibility('currentPassword')}
                    />

                    <FormField 
                      id="newPassword"
                      label="Mật khẩu mới"
                      type="password"
                      value={passwordData.newPassword}
                      onChange={handlePasswordDataChange}
                      isPassword={true}
                      passwordVisible={passwordVisible.newPassword}
                      onTogglePassword={() => togglePasswordVisibility('newPassword')}
                    />

                    <FormField 
                      id="confirmPassword"
                      label="Xác nhận mật khẩu mới"
                      type="password"
                      value={passwordData.confirmPassword}
                      onChange={handlePasswordDataChange}
                      isPassword={true}
                      passwordVisible={passwordVisible.confirmPassword}
                      onTogglePassword={() => togglePasswordVisibility('confirmPassword')}
                    />

                    <button type="submit" className="btn btn-primary" disabled={loading}>
                      {loading ? 'Đang cập nhật...' : 'Cập nhật mật khẩu'}
                    </button>
                  </form>
                </div>

                <div className="security-section">
                  <h3>Thông báo</h3>
                  <div className="notification-settings">
                    <div className="notification-item">
                      <div className="notification-label">Thông báo qua email</div>
                      <div className="notification-toggle">
                        <input type="checkbox" id="emailNotifications" defaultChecked={true} />
                        <label htmlFor="emailNotifications"></label>
                      </div>
                    </div>
                    
                    <div className="notification-item">
                      <div className="notification-label">Thông báo qua SMS</div>
                      <div className="notification-toggle">
                        <input type="checkbox" id="smsNotifications" defaultChecked={true} />
                        <label htmlFor="smsNotifications"></label>
                      </div>
                    </div>
                    
                    <div className="notification-item">
                      <div className="notification-label">Nhắc nhở lịch hẹn</div>
                      <div className="notification-toggle">
                        <input type="checkbox" id="appointmentReminders" defaultChecked={true} />
                        <label htmlFor="appointmentReminders"></label>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* Image Modal */}
      {showImageModal && user?.avatarUrl && (
        <div className="avatar-modal" onClick={closeImageModal}>
          <div className="avatar-modal-content" onClick={(e) => e.stopPropagation()}>
            <img 
              src={getAvatarUrl(user.avatarUrl)} 
              alt={user.fullName} 
            />
            <button className="avatar-modal-close" onClick={closeImageModal}>
              <i className="fas fa-times"></i>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Profile; 