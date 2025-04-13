import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import api from '../../utils/api';
import '../../styles/doctor/DoctorProfile.css';

const DoctorProfile = () => {
  const { user, updateUserData } = useAuth();
  const [profileData, setProfileData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [activeTab, setActiveTab] = useState('personal');
  
  // Form states
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    specialties: [],
    qualifications: [],
    experience: '',
    bio: '',
    consultationFee: '',
    availableHours: {
      monday: { start: '', end: '', isAvailable: false },
      tuesday: { start: '', end: '', isAvailable: false },
      wednesday: { start: '', end: '', isAvailable: false },
      thursday: { start: '', end: '', isAvailable: false },
      friday: { start: '', end: '', isAvailable: false },
      saturday: { start: '', end: '', isAvailable: false },
      sunday: { start: '', end: '', isAvailable: false }
    },
    password: '',
    confirmPassword: '',
    currentPassword: ''
  });
  
  // Load doctor profile data
  useEffect(() => {
    const fetchProfileData = async () => {
      try {
        setLoading(true);
        const response = await api.get('/doctor/profile');
        setProfileData(response.data);
        
        // Set form data from fetched profile
        setFormData({
          name: response.data.name || '',
          email: response.data.email || '',
          phone: response.data.phone || '',
          address: response.data.address || '',
          specialties: response.data.specialties || [],
          qualifications: response.data.qualifications || [],
          experience: response.data.experience || '',
          bio: response.data.bio || '',
          consultationFee: response.data.consultationFee || '',
          availableHours: response.data.availableHours || {
            monday: { start: '09:00', end: '17:00', isAvailable: false },
            tuesday: { start: '09:00', end: '17:00', isAvailable: false },
            wednesday: { start: '09:00', end: '17:00', isAvailable: false },
            thursday: { start: '09:00', end: '17:00', isAvailable: false },
            friday: { start: '09:00', end: '17:00', isAvailable: false },
            saturday: { start: '09:00', end: '17:00', isAvailable: false },
            sunday: { start: '09:00', end: '17:00', isAvailable: false }
          },
          password: '',
          confirmPassword: '',
          currentPassword: ''
        });
        
        setLoading(false);
      } catch (err) {
        console.error('Error fetching profile:', err);
        setError('Không thể tải thông tin hồ sơ. Vui lòng thử lại sau.');
        setLoading(false);
      }
    };
    
    fetchProfileData();
  }, []);
  
  // Handle input change
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prevState => ({
      ...prevState,
      [name]: value
    }));
  };
  
  // Handle available hours change
  const handleAvailabilityChange = (day, field, value) => {
    setFormData(prevState => ({
      ...prevState,
      availableHours: {
        ...prevState.availableHours,
        [day]: {
          ...prevState.availableHours[day],
          [field]: field === 'isAvailable' ? value : value
        }
      }
    }));
  };
  
  // Handle specialty add/remove
  const [newSpecialty, setNewSpecialty] = useState('');
  
  const handleAddSpecialty = () => {
    if (newSpecialty.trim() !== '' && !formData.specialties.includes(newSpecialty.trim())) {
      setFormData(prevState => ({
        ...prevState,
        specialties: [...prevState.specialties, newSpecialty.trim()]
      }));
      setNewSpecialty('');
    }
  };
  
  const handleRemoveSpecialty = (specialty) => {
    setFormData(prevState => ({
      ...prevState,
      specialties: prevState.specialties.filter(item => item !== specialty)
    }));
  };
  
  // Handle qualification add/remove
  const [newQualification, setNewQualification] = useState({ degree: '', institution: '', year: '' });
  
  const handleQualificationChange = (e) => {
    const { name, value } = e.target;
    setNewQualification(prevState => ({
      ...prevState,
      [name]: value
    }));
  };
  
  const handleAddQualification = () => {
    if (newQualification.degree && newQualification.institution) {
      setFormData(prevState => ({
        ...prevState,
        qualifications: [...prevState.qualifications, { ...newQualification }]
      }));
      setNewQualification({ degree: '', institution: '', year: '' });
    }
  };
  
  const handleRemoveQualification = (index) => {
    setFormData(prevState => ({
      ...prevState,
      qualifications: prevState.qualifications.filter((_, i) => i !== index)
    }));
  };
  
  // Handle profile update
  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    
    try {
      setLoading(true);
      setError(null);
      setSuccess(null);
      
      // Create data object based on active tab
      let dataToUpdate = {};
      
      if (activeTab === 'personal') {
        dataToUpdate = {
          name: formData.name,
          phone: formData.phone,
          address: formData.address,
          bio: formData.bio
        };
      } else if (activeTab === 'professional') {
        dataToUpdate = {
          specialties: formData.specialties,
          qualifications: formData.qualifications,
          experience: formData.experience,
          consultationFee: formData.consultationFee
        };
      } else if (activeTab === 'availability') {
        dataToUpdate = {
          availableHours: formData.availableHours
        };
      } else if (activeTab === 'security') {
        if (!formData.currentPassword) {
          setError('Bạn phải nhập mật khẩu hiện tại');
          setLoading(false);
          return;
        }
        
        if (formData.password !== formData.confirmPassword) {
          setError('Mật khẩu mới và xác nhận mật khẩu không khớp');
          setLoading(false);
          return;
        }
        
        dataToUpdate = {
          currentPassword: formData.currentPassword,
          newPassword: formData.password
        };
      }
      
      // Update profile
      const response = await api.put('/doctor/profile', dataToUpdate);
      
      if (response.data) {
        setProfileData(prevState => ({
          ...prevState,
          ...response.data
        }));
        
        // Update auth context if name was updated
        if (dataToUpdate.name) {
          updateUserData({
            ...user,
            name: dataToUpdate.name
          });
        }
        
        setSuccess('Cập nhật hồ sơ thành công');
        
        // Reset password fields if security tab
        if (activeTab === 'security') {
          setFormData(prevState => ({
            ...prevState,
            password: '',
            confirmPassword: '',
            currentPassword: ''
          }));
        }
      }
      
      setLoading(false);
    } catch (err) {
      console.error('Error updating profile:', err);
      setError(err.response?.data?.message || 'Không thể cập nhật hồ sơ. Vui lòng thử lại sau.');
      setLoading(false);
    }
  };
  
  // Handle avatar upload
  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(null);
  
  const handleAvatarChange = (e) => {
    if (e.target.files[0]) {
      setAvatarFile(e.target.files[0]);
      setAvatarPreview(URL.createObjectURL(e.target.files[0]));
    }
  };
  
  const handleAvatarUpload = async () => {
    if (!avatarFile) return;
    
    try {
      setLoading(true);
      setError(null);
      
      const formData = new FormData();
      formData.append('avatar', avatarFile);
      
      const response = await api.post('/doctor/profile/avatar', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      
      if (response.data) {
        setProfileData(prevState => ({
          ...prevState,
          avatar: response.data.avatar
        }));
        
        // Update auth context
        updateUserData({
          ...user,
          avatar: response.data.avatar
        });
        
        setSuccess('Cập nhật ảnh đại diện thành công');
        setAvatarFile(null);
      }
      
      setLoading(false);
    } catch (err) {
      console.error('Error uploading avatar:', err);
      setError(err.response?.data?.message || 'Không thể cập nhật ảnh đại diện. Vui lòng thử lại sau.');
      setLoading(false);
    }
  };
  
  if (loading && !profileData) {
    return <div className="loading">Đang tải...</div>;
  }
  
  return (
    <div className="doctor-profile-page">
      <div className="profile-header">
        <h1>Hồ sơ bác sĩ</h1>
        <p>Quản lý thông tin cá nhân và chuyên môn của bạn</p>
      </div>
      
      {error && <div className="alert alert-danger">{error}</div>}
      {success && <div className="alert alert-success">{success}</div>}
      
      <div className="profile-container">
        <div className="profile-sidebar">
          <div className="profile-avatar-section">
            <div className="profile-avatar">
              {avatarPreview ? (
                <img src={avatarPreview} alt="Avatar Preview" />
              ) : profileData?.avatar ? (
                <img src={profileData.avatar} alt={profileData.name} />
              ) : (
                <div className="avatar-placeholder">
                  {profileData?.name?.charAt(0).toUpperCase()}
                </div>
              )}
              
              <div className="avatar-upload-overlay">
                <label htmlFor="avatar-upload" className="upload-icon">
                  <i className="fas fa-camera"></i>
                </label>
                <input
                  type="file"
                  id="avatar-upload"
                  accept="image/*"
                  onChange={handleAvatarChange}
                  style={{ display: 'none' }}
                />
              </div>
            </div>
            
            {avatarFile && (
              <div className="avatar-actions">
                <button 
                  type="button" 
                  className="btn-upload"
                  onClick={handleAvatarUpload}
                  disabled={loading}
                >
                  {loading ? 'Đang tải lên...' : 'Lưu ảnh đại diện'}
                </button>
                <button 
                  type="button" 
                  className="btn-cancel"
                  onClick={() => {
                    setAvatarFile(null);
                    setAvatarPreview(null);
                  }}
                >
                  Hủy
                </button>
              </div>
            )}
            
            <div className="doctor-info">
              <h3>{profileData?.name}</h3>
              <p className="doctor-specialties">
                {profileData?.specialties?.join(', ') || 'Chưa có chuyên khoa'}
              </p>
            </div>
          </div>
          
          <div className="profile-tabs">
            <button
              className={`tab-item ${activeTab === 'personal' ? 'active' : ''}`}
              onClick={() => setActiveTab('personal')}
            >
              <i className="fas fa-user"></i>
              <span>Thông tin cá nhân</span>
            </button>
            
            <button
              className={`tab-item ${activeTab === 'professional' ? 'active' : ''}`}
              onClick={() => setActiveTab('professional')}
            >
              <i className="fas fa-stethoscope"></i>
              <span>Thông tin chuyên môn</span>
            </button>
            
            <button
              className={`tab-item ${activeTab === 'availability' ? 'active' : ''}`}
              onClick={() => setActiveTab('availability')}
            >
              <i className="fas fa-calendar-alt"></i>
              <span>Lịch làm việc</span>
            </button>
            
            <button
              className={`tab-item ${activeTab === 'security' ? 'active' : ''}`}
              onClick={() => setActiveTab('security')}
            >
              <i className="fas fa-lock"></i>
              <span>Bảo mật</span>
            </button>
          </div>
        </div>
        
        <div className="profile-content">
          <form onSubmit={handleUpdateProfile}>
            {/* Personal Information Tab */}
            {activeTab === 'personal' && (
              <div className="tab-content">
                <h2>Thông tin cá nhân</h2>
                
                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="name">Họ và tên</label>
                    <input
                      type="text"
                      id="name"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                  
                  <div className="form-group">
                    <label htmlFor="email">Email</label>
                    <input
                      type="email"
                      id="email"
                      name="email"
                      value={formData.email}
                      disabled
                    />
                    <small>Email không thể thay đổi</small>
                  </div>
                </div>
                
                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="phone">Số điện thoại</label>
                    <input
                      type="tel"
                      id="phone"
                      name="phone"
                      value={formData.phone}
                      onChange={handleInputChange}
                    />
                  </div>
                  
                  <div className="form-group">
                    <label htmlFor="address">Địa chỉ</label>
                    <input
                      type="text"
                      id="address"
                      name="address"
                      value={formData.address}
                      onChange={handleInputChange}
                    />
                  </div>
                </div>
                
                <div className="form-group">
                  <label htmlFor="bio">Giới thiệu</label>
                  <textarea
                    id="bio"
                    name="bio"
                    rows="5"
                    value={formData.bio}
                    onChange={handleInputChange}
                    placeholder="Giới thiệu ngắn về bản thân..."
                  ></textarea>
                </div>
              </div>
            )}
            
            {/* Professional Information Tab */}
            {activeTab === 'professional' && (
              <div className="tab-content">
                <h2>Thông tin chuyên môn</h2>
                
                <div className="form-group">
                  <label>Chuyên khoa</label>
                  <div className="specialties-container">
                    {formData.specialties.map((specialty, index) => (
                      <div key={index} className="specialty-tag">
                        <span>{specialty}</span>
                        <button
                          type="button"
                          onClick={() => handleRemoveSpecialty(specialty)}
                          className="btn-remove"
                        >
                          <i className="fas fa-times"></i>
                        </button>
                      </div>
                    ))}
                  </div>
                  
                  <div className="specialty-input">
                    <input
                      type="text"
                      placeholder="Thêm chuyên khoa mới"
                      value={newSpecialty}
                      onChange={(e) => setNewSpecialty(e.target.value)}
                    />
                    <button
                      type="button"
                      onClick={handleAddSpecialty}
                      className="btn-add"
                    >
                      Thêm
                    </button>
                  </div>
                </div>
                
                <div className="form-group">
                  <label>Bằng cấp & Chứng chỉ</label>
                  <div className="qualifications-list">
                    {formData.qualifications.map((qualification, index) => (
                      <div key={index} className="qualification-item">
                        <div className="qualification-details">
                          <div className="qualification-degree">{qualification.degree}</div>
                          <div className="qualification-institution">{qualification.institution}</div>
                          {qualification.year && (
                            <div className="qualification-year">{qualification.year}</div>
                          )}
                        </div>
                        <button
                          type="button"
                          onClick={() => handleRemoveQualification(index)}
                          className="btn-remove"
                        >
                          <i className="fas fa-times"></i>
                        </button>
                      </div>
                    ))}
                  </div>
                  
                  <div className="qualification-form">
                    <div className="form-row">
                      <div className="form-group">
                        <input
                          type="text"
                          name="degree"
                          placeholder="Bằng cấp/Chứng chỉ"
                          value={newQualification.degree}
                          onChange={handleQualificationChange}
                        />
                      </div>
                      
                      <div className="form-group">
                        <input
                          type="text"
                          name="institution"
                          placeholder="Trường/Tổ chức cấp"
                          value={newQualification.institution}
                          onChange={handleQualificationChange}
                        />
                      </div>
                      
                      <div className="form-group">
                        <input
                          type="text"
                          name="year"
                          placeholder="Năm cấp (tùy chọn)"
                          value={newQualification.year}
                          onChange={handleQualificationChange}
                        />
                      </div>
                    </div>
                    
                    <button
                      type="button"
                      onClick={handleAddQualification}
                      className="btn-add"
                    >
                      Thêm bằng cấp/chứng chỉ
                    </button>
                  </div>
                </div>
                
                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="experience">Kinh nghiệm (năm)</label>
                    <input
                      type="number"
                      id="experience"
                      name="experience"
                      value={formData.experience}
                      onChange={handleInputChange}
                      min="0"
                    />
                  </div>
                  
                  <div className="form-group">
                    <label htmlFor="consultationFee">Phí tư vấn (VND)</label>
                    <input
                      type="number"
                      id="consultationFee"
                      name="consultationFee"
                      value={formData.consultationFee}
                      onChange={handleInputChange}
                      min="0"
                      step="10000"
                    />
                  </div>
                </div>
              </div>
            )}
            
            {/* Availability Tab */}
            {activeTab === 'availability' && (
              <div className="tab-content">
                <h2>Lịch làm việc</h2>
                <p className="availability-description">
                  Thiết lập thời gian làm việc của bạn trong tuần.
                </p>
                
                <div className="availability-schedule">
                  {Object.entries(formData.availableHours).map(([day, hours]) => {
                    const displayDay = getDayTranslation(day);
                    
                    return (
                      <div key={day} className="schedule-day">
                        <div className="day-header">
                          <div className="day-name">{displayDay}</div>
                          <label className="toggle-switch">
                            <input
                              type="checkbox"
                              checked={hours.isAvailable}
                              onChange={(e) => 
                                handleAvailabilityChange(day, 'isAvailable', e.target.checked)
                              }
                            />
                            <span className="toggle-slider"></span>
                          </label>
                        </div>
                        
                        {hours.isAvailable && (
                          <div className="time-range">
                            <div className="time-input">
                              <input
                                type="time"
                                value={hours.start}
                                onChange={(e) => 
                                  handleAvailabilityChange(day, 'start', e.target.value)
                                }
                              />
                              <span>đến</span>
                              <input
                                type="time"
                                value={hours.end}
                                onChange={(e) => 
                                  handleAvailabilityChange(day, 'end', e.target.value)
                                }
                              />
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
            
            {/* Security Tab */}
            {activeTab === 'security' && (
              <div className="tab-content">
                <h2>Bảo mật tài khoản</h2>
                
                <div className="form-group">
                  <label htmlFor="currentPassword">Mật khẩu hiện tại</label>
                  <input
                    type="password"
                    id="currentPassword"
                    name="currentPassword"
                    value={formData.currentPassword}
                    onChange={handleInputChange}
                  />
                </div>
                
                <div className="form-group">
                  <label htmlFor="password">Mật khẩu mới</label>
                  <input
                    type="password"
                    id="password"
                    name="password"
                    value={formData.password}
                    onChange={handleInputChange}
                  />
                </div>
                
                <div className="form-group">
                  <label htmlFor="confirmPassword">Xác nhận mật khẩu mới</label>
                  <input
                    type="password"
                    id="confirmPassword"
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleInputChange}
                  />
                </div>
              </div>
            )}
            
            <div className="form-actions">
              <button
                type="submit"
                className="btn-save"
                disabled={loading}
              >
                {loading ? 'Đang lưu...' : 'Lưu thay đổi'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

// Helper function to translate day names
const getDayTranslation = (day) => {
  const translations = {
    monday: 'Thứ hai',
    tuesday: 'Thứ ba',
    wednesday: 'Thứ tư',
    thursday: 'Thứ năm',
    friday: 'Thứ sáu',
    saturday: 'Thứ bảy',
    sunday: 'Chủ nhật'
  };
  
  return translations[day] || day;
};

export default DoctorProfile; 