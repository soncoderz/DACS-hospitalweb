import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';

const Profile = () => {
  const { user, login } = useAuth();
  const [activeTab, setActiveTab] = useState('info');
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phoneNumber: '',
    dateOfBirth: '',
    gender: '',
    address: '',
    avatarUrl: ''
  });

  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  
  const [passwordErrors, setPasswordErrors] = useState({});
  const [passwordSuccess, setPasswordSuccess] = useState(null);

  const [passwordVisibility, setPasswordVisibility] = useState({
    currentPassword: false,
    newPassword: false,
    confirmPassword: false
  });

  const togglePasswordVisibility = (field) => {
    setPasswordVisibility(prev => ({
      ...prev,
      [field]: !prev[field]
    }));
  };

  useEffect(() => {
    if (user) {
      console.log("Current user in Profile:", user); // Debug
      
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
      
      console.log("FormData after setting:", {
        ...formData, 
        avatarUrl: user.avatarUrl || 'Not provided'
      }); // Debug
    }
  }, [user]);

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
    setPasswordErrors({});
    setPasswordSuccess(null);
    
    // Validate password inputs
    const errors = {};
    
    if (!passwordData.currentPassword) {
      errors.currentPassword = 'Vui lòng nhập mật khẩu hiện tại';
    }
    
    if (!passwordData.newPassword) {
      errors.newPassword = 'Vui lòng nhập mật khẩu mới';
    } else if (passwordData.newPassword.length < 6) {
      errors.newPassword = 'Mật khẩu mới phải có ít nhất 6 ký tự';
    }
    
    if (!passwordData.confirmPassword) {
      errors.confirmPassword = 'Vui lòng xác nhận mật khẩu mới';
    } else if (passwordData.newPassword !== passwordData.confirmPassword) {
      errors.confirmPassword = 'Mật khẩu xác nhận không khớp';
    }
    
    // Check if new password is the same as current password
    if (passwordData.currentPassword && 
        passwordData.newPassword && 
        passwordData.currentPassword === passwordData.newPassword) {
      errors.newPassword = 'Mật khẩu mới không được trùng với mật khẩu hiện tại';
    }
    
    if (Object.keys(errors).length > 0) {
      setPasswordErrors(errors);
      setLoading(false);
      return;
    }
    
    try {
      const response = await api.put('/auth/change-password', {
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword
      });
      
      if (response.data.success) {
        setPasswordSuccess('Đổi mật khẩu thành công');
        // Reset password form
        setPasswordData({
          currentPassword: '',
          newPassword: '',
          confirmPassword: ''
        });
        // Reset password visibility
        setPasswordVisibility({
          currentPassword: false,
          newPassword: false,
          confirmPassword: false
        });
      } else {
        throw new Error(response.data.message || 'Đổi mật khẩu không thành công');
      }
    } catch (error) {
      console.error('Password change error:', error);
      
      if (error.response && error.response.data) {
        if (error.response.data.field) {
          setPasswordErrors({
            [error.response.data.field]: error.response.data.message
          });
        } else {
          setPasswordErrors({
            general: error.response.data.message || 'Đổi mật khẩu không thành công'
          });
        }
      } else {
        setPasswordErrors({
          general: 'Đổi mật khẩu không thành công. Vui lòng thử lại sau.'
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleAvatarUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Giới hạn kích thước file (5MB)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      setError('Kích thước ảnh quá lớn. Vui lòng chọn ảnh nhỏ hơn 5MB.');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      setSuccess(null);
      
      // Hiển thị preview trước khi upload
      const reader = new FileReader();
      reader.onloadend = () => {
        // Chỉ cập nhật preview, không lưu base64 vào state
        const previewContainer = document.getElementById('avatar-preview');
        if (previewContainer) {
          previewContainer.src = reader.result;
        }
      };
      reader.readAsDataURL(file);

      // Tạo FormData để gửi lên server
      const formData = new FormData();
      formData.append('avatar', file);
      
      console.log("Uploading avatar..."); // Debug
      
      // Gọi API upload avatar
      const response = await api.post('/auth/avatar', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      
      console.log("Avatar upload response:", response.data); // Debug
      
      if (response.data.success) {
        // Cập nhật thông tin người dùng trong context với dữ liệu mới từ server
        const updatedUserData = response.data.data;
        console.log("Updating user with new avatar:", updatedUserData); // Debug
        
        login(updatedUserData);
        setSuccess('Cập nhật avatar thành công');
        
        // Cập nhật form data với URL avatar mới từ server
        setFormData(prevData => ({
          ...prevData,
          avatarUrl: updatedUserData.avatarUrl
        }));
      } else {
        throw new Error(response.data.message || 'Lỗi không xác định');
      }
    } catch (error) {
      console.error('Error uploading avatar:', error);
      setError(error.response?.data?.message || 'Không thể tải lên ảnh. Vui lòng thử lại sau.');
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

  return (
    <div className="profile-page">
      <div className="container">
        <div className="profile-container">
          <div className="profile-sidebar">
            <div className="profile-avatar-container">
              <img 
                src={formData.avatarUrl 
                  ? `${import.meta.env.VITE_API_URL.replace('/api', '')}${formData.avatarUrl}` 
                  : "/avatars/default-avatar.png"}
                alt={formData.fullName || "User Avatar"}
                className="profile-avatar"
                id="avatar-preview"
                onError={(e) => {
                  console.log('Avatar failed to load in profile');
                  e.target.src = "/avatars/default-avatar.png";
                }}
              />
              
              {isEditing && (
                <div className="avatar-upload">
                  <label htmlFor="avatar-input" className="avatar-upload-label">
                    <i className="fas fa-camera"></i>
                    <span>Thay đổi ảnh</span>
                  </label>
                  <input
                    type="file"
                    id="avatar-input"
                    className="avatar-input"
                    accept="image/*"
                    onChange={handleAvatarUpload}
                  />
                </div>
              )}
            </div>
            
            <div className="profile-name">
              {formData.fullName || 'Người dùng'}
            </div>
            
            <ul className="profile-tabs">
              <li 
                className={`profile-tab ${activeTab === 'info' ? 'active' : ''}`}
                onClick={() => setActiveTab('info')}
              >
                <i className="fas fa-user"></i>
                <span>Thông tin cá nhân</span>
              </li>
              <li 
                className={`profile-tab ${activeTab === 'medicalRecords' ? 'active' : ''}`}
                onClick={() => setActiveTab('medicalRecords')}
              >
                <i className="fas fa-file-medical"></i>
                <span>Hồ sơ y tế</span>
              </li>
              <li 
                className={`profile-tab ${activeTab === 'prescriptions' ? 'active' : ''}`}
                onClick={() => setActiveTab('prescriptions')}
              >
                <i className="fas fa-prescription-bottle-alt"></i>
                <span>Đơn thuốc</span>
              </li>
              <li 
                className={`profile-tab ${activeTab === 'security' ? 'active' : ''}`}
                onClick={() => setActiveTab('security')}
              >
                <i className="fas fa-lock"></i>
                <span>Bảo mật</span>
              </li>
            </ul>
          </div>

          <div className="profile-content">
            {activeTab === 'info' && (
              <div className="profile-info-tab">
                <div className="profile-header">
                  <h2>Thông tin cá nhân</h2>
                  {!isEditing ? (
                    <button 
                      className="btn btn-primary btn-sm" 
                      onClick={() => setIsEditing(true)}
                    >
                      <i className="fas fa-edit"></i> Chỉnh sửa
                    </button>
                  ) : (
                    <div className="edit-actions">
                      <button 
                        className="btn btn-outline btn-sm" 
                        onClick={handleCancel}
                      >
                        Hủy
                      </button>
                      <button 
                        className="btn btn-primary btn-sm"
                        onClick={handleSubmit}
                        disabled={loading}
                      >
                        {loading ? 'Đang lưu...' : 'Lưu thay đổi'}
                      </button>
                    </div>
                  )}
                </div>

                {error && <div className="alert alert-danger">{error}</div>}
                {success && <div className="alert alert-success">{success}</div>}

                {isEditing ? (
                  <form className="profile-form">
                    <div className="form-group">
                      <label htmlFor="fullName">Họ và tên</label>
                      <input
                        type="text"
                        id="fullName"
                        name="fullName"
                        value={formData.fullName}
                        onChange={handleChange}
                        className="form-control"
                        required
                      />
                    </div>

                    <div className="form-row">
                      <div className="form-group half">
                        <label htmlFor="email">Email</label>
                        <input
                          type="email"
                          id="email"
                          name="email"
                          value={formData.email}
                          onChange={handleChange}
                          className="form-control"
                          required
                          disabled
                        />
                        <small className="form-text text-muted">Email không thể thay đổi</small>
                      </div>

                      <div className="form-group half">
                        <label htmlFor="phoneNumber">Số điện thoại</label>
                        <input
                          type="tel"
                          id="phoneNumber"
                          name="phoneNumber"
                          value={formData.phoneNumber}
                          onChange={handleChange}
                          className="form-control"
                          required
                        />
                      </div>
                    </div>

                    <div className="form-row">
                      <div className="form-group half">
                        <label htmlFor="dateOfBirth">Ngày sinh</label>
                        <input
                          type="date"
                          id="dateOfBirth"
                          name="dateOfBirth"
                          value={formData.dateOfBirth}
                          onChange={handleChange}
                          className="form-control"
                        />
                      </div>

                      <div className="form-group half">
                        <label htmlFor="gender">Giới tính</label>
                        <select
                          id="gender"
                          name="gender"
                          value={formData.gender}
                          onChange={handleChange}
                          className="form-control"
                        >
                          <option value="">Chọn giới tính</option>
                          <option value="male">Nam</option>
                          <option value="female">Nữ</option>
                          <option value="other">Khác</option>
                        </select>
                      </div>
                    </div>

                    <div className="form-group">
                      <label htmlFor="address">Địa chỉ</label>
                      <textarea
                        id="address"
                        name="address"
                        value={formData.address}
                        onChange={handleChange}
                        className="form-control"
                        rows="3"
                      ></textarea>
                    </div>
                  </form>
                ) : (
                  <div className="profile-info">
                    <div className="info-item">
                      <div className="info-label">Họ và tên</div>
                      <div className="info-value">{formData.fullName || 'Chưa cập nhật'}</div>
                    </div>
                    
                    <div className="info-item">
                      <div className="info-label">Email</div>
                      <div className="info-value">{formData.email || 'Chưa cập nhật'}</div>
                    </div>
                    
                    <div className="info-item">
                      <div className="info-label">Số điện thoại</div>
                      <div className="info-value">{formData.phoneNumber || 'Chưa cập nhật'}</div>
                    </div>
                    
                    <div className="info-item">
                      <div className="info-label">Ngày sinh</div>
                      <div className="info-value">{formData.dateOfBirth ? formatDate(formData.dateOfBirth) : 'Chưa cập nhật'}</div>
                    </div>
                    
                    <div className="info-item">
                      <div className="info-label">Giới tính</div>
                      <div className="info-value">{formData.gender ? getGenderLabel(formData.gender) : 'Chưa cập nhật'}</div>
                    </div>
                    
                    <div className="info-item">
                      <div className="info-label">Địa chỉ</div>
                      <div className="info-value">{formData.address || 'Chưa cập nhật'}</div>
                    </div>
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
                    <div className="form-group">
                      <label htmlFor="currentPassword">Mật khẩu hiện tại</label>
                      <div className="password-input-container">
                        <input
                          type={passwordVisibility.currentPassword ? "text" : "password"}
                          id="currentPassword"
                          name="currentPassword"
                          value={passwordData.currentPassword}
                          onChange={handlePasswordInputChange}
                          className="form-control"
                          required
                        />
                        <button 
                          type="button" 
                          className="password-toggle-btn"
                          onClick={() => togglePasswordVisibility('currentPassword')}
                        >
                          <i className={`fas fa-${passwordVisibility.currentPassword ? 'eye-slash' : 'eye'}`}></i>
                        </button>
                      </div>
                      {passwordErrors.currentPassword && <div className="text-danger">{passwordErrors.currentPassword}</div>}
                    </div>

                    <div className="form-group">
                      <label htmlFor="newPassword">Mật khẩu mới</label>
                      <div className="password-input-container">
                        <input
                          type={passwordVisibility.newPassword ? "text" : "password"}
                          id="newPassword"
                          name="newPassword"
                          value={passwordData.newPassword}
                          onChange={handlePasswordInputChange}
                          className="form-control"
                          required
                        />
                        <button 
                          type="button" 
                          className="password-toggle-btn"
                          onClick={() => togglePasswordVisibility('newPassword')}
                        >
                          <i className={`fas fa-${passwordVisibility.newPassword ? 'eye-slash' : 'eye'}`}></i>
                        </button>
                      </div>
                      {passwordErrors.newPassword && <div className="text-danger">{passwordErrors.newPassword}</div>}
                      <small className="form-text text-muted">Mật khẩu phải có ít nhất 6 ký tự</small>
                    </div>

                    <div className="form-group">
                      <label htmlFor="confirmPassword">Xác nhận mật khẩu mới</label>
                      <div className="password-input-container">
                        <input
                          type={passwordVisibility.confirmPassword ? "text" : "password"}
                          id="confirmPassword"
                          name="confirmPassword"
                          value={passwordData.confirmPassword}
                          onChange={handlePasswordInputChange}
                          className="form-control"
                          required
                        />
                        <button 
                          type="button" 
                          className="password-toggle-btn"
                          onClick={() => togglePasswordVisibility('confirmPassword')}
                        >
                          <i className={`fas fa-${passwordVisibility.confirmPassword ? 'eye-slash' : 'eye'}`}></i>
                        </button>
                      </div>
                      {passwordErrors.confirmPassword && <div className="text-danger">{passwordErrors.confirmPassword}</div>}
                    </div>

                    <button type="submit" className="btn btn-primary" disabled={loading}>
                      {loading ? 'Đang xử lý...' : 'Đổi mật khẩu'}
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
    </div>
  );
};

export default Profile; 