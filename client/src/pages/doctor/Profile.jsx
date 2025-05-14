import React, { useState, useEffect, useRef } from 'react';
import { FaUser, FaEnvelope, FaPhone, FaCalendarAlt, FaIdCard, FaMapMarkerAlt, FaUserMd, FaHospital, FaCamera, FaEdit, FaSave, FaTimes, FaNotesMedical, FaGraduationCap, FaBriefcase, FaLanguage, FaCertificate, FaClipboardList, FaChartLine, FaStar } from 'react-icons/fa';
import api from '../../utils/api';
import { toast } from 'react-hot-toast';

const Profile = () => {
  const [doctor, setDoctor] = useState(null);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [error, setError] = useState(null);
  const [reviewStats, setReviewStats] = useState(null);
  const fileInputRef = useRef(null);

  // Form data state
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phoneNumber: '',
    gender: '',
    dateOfBirth: '',
    address: '',
    title: '',
    description: '',
    education: '',
    experience: '',
    languages: '',
    certifications: ''
  });

  useEffect(() => {
    fetchDoctorProfile();
    fetchDoctorReviews();
  }, []);

  // Helper function to get the best available avatar URL
  const getAvatarUrl = (userData) => {
    if (!userData) return null;
    
    // First priority: Use secure URL from avatar object if available
    if (userData.avatar && userData.avatar.secureUrl) {
      return userData.avatar.secureUrl;
    }
    
    // Second priority: Use URL from avatar object
    if (userData.avatar && userData.avatar.url) {
      return userData.avatar.url;
    }
    
    // Third priority: Use avatarUrl string property
    if (userData.avatarUrl) {
      return userData.avatarUrl;
    }
    
    // No avatar found
    return null;
  };

  const fetchDoctorProfile = async () => {
    setLoading(true);
    try {
      const response = await api.get('/doctors/profile');
      
      if (response.data.success) {
        const doctorData = response.data.data;
        
        // Extract user data from doctor profile
        const userData = doctorData.user || {};
        
        // Set avatar URL in user data
        userData.avatarUrl = getAvatarUrl(userData);
        
        setDoctor(doctorData);
        setUser(userData);
        
        // Initialize form data
        setFormData({
          fullName: userData?.fullName || '',
          email: userData?.email || '',
          phoneNumber: userData?.phoneNumber || '',
          gender: userData?.gender || '',
          dateOfBirth: userData?.dateOfBirth ? 
            new Date(userData.dateOfBirth).toISOString().split('T')[0] : '',
          address: userData?.address || '',
          title: doctorData.title || '',
          description: doctorData.description || '',
          education: doctorData.education || '',
          experience: doctorData.experience?.toString() || '',
          languages: doctorData.languages?.join(', ') || '',
          certifications: doctorData.certifications?.join(', ') || ''
        });
      } else {
        setError("Không thể tải thông tin bác sĩ");
      }
    } catch (error) {
      console.error('Error fetching doctor profile:', error.response?.data || error);
      setError('Đã xảy ra lỗi khi tải thông tin bác sĩ');
    } finally {
      setLoading(false);
    }
  };

  const fetchDoctorReviews = async () => {
    try {
      const response = await api.get('/doctors/reviews');
      
      if (response.data.success) {
        setReviewStats(response.data.stats);
      }
    } catch (error) {
      console.error('Error fetching doctor reviews:', error.response?.data || error);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      // Create the request payload
      const profileData = {
        fullName: formData.fullName,
        phoneNumber: formData.phoneNumber,
        gender: formData.gender,
        dateOfBirth: formData.dateOfBirth,
        address: formData.address,
        title: formData.title,
        description: formData.description,
        education: formData.education,
        experience: parseInt(formData.experience) || 0,
        languages: formData.languages.split(',').map(item => item.trim()).filter(Boolean),
        certifications: formData.certifications.split(',').map(item => item.trim()).filter(Boolean)
      };
      
      const response = await api.put('/doctors/profile', profileData);
      
      if (response.data.success) {
        // Update local state with the response data
        const updatedDoctor = response.data.data;
        setDoctor(updatedDoctor);
        
        // If user data was updated
        if (updatedDoctor.user) {
          const userData = updatedDoctor.user;
          userData.avatarUrl = getAvatarUrl(userData);
          setUser(userData);
        }
        
        setEditing(false);
        toast.success('Cập nhật hồ sơ thành công');
        
        // Refresh doctor profile to get latest data
        fetchDoctorProfile();
      } else {
        toast.error(response.data.message || 'Không thể cập nhật hồ sơ');
      }
    } catch (error) {
      console.error('Error updating profile:', error.response?.data || error.message);
      toast.error(error.response?.data?.message || 'Đã xảy ra lỗi khi cập nhật hồ sơ');
    } finally {
      setLoading(false);
    }
  };

  const handleImageChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedImage(e.target.files[0]);
      setImagePreview(URL.createObjectURL(e.target.files[0]));
    }
  };

  const handleImageUpload = async () => {
    if (!selectedImage) return;
    
    setUploadingImage(true);
    
    try {
      const formData = new FormData();
      formData.append('avatar', selectedImage);
      
      const response = await api.post('/doctors/avatar', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      
      if (response.data.success) {
        // Update user with new avatar URL
        const updatedData = response.data.data;
        
        if (updatedData.user) {
          const avatarUrl = getAvatarUrl(updatedData.user);
          setUser(prev => ({
            ...prev,
            avatarUrl: avatarUrl,
            avatar: updatedData.user.avatar
          }));
        } else if (updatedData.avatarUrl) {
          setUser(prev => ({
            ...prev,
            avatarUrl: updatedData.avatarUrl
          }));
        }
        
        // Reset image state
        setSelectedImage(null);
        setImagePreview(null);
        toast.success('Cập nhật ảnh đại diện thành công');
        
        // Refresh profile
        fetchDoctorProfile();
      } else {
        toast.error(response.data.message || 'Không thể cập nhật ảnh đại diện');
      }
    } catch (error) {
      console.error('Error uploading avatar:', error.response?.data || error.message);
      toast.error('Đã xảy ra lỗi khi tải lên ảnh đại diện');
    } finally {
      setUploadingImage(false);
    }
  };

  const cancelImageUpload = () => {
    setSelectedImage(null);
    setImagePreview(null);
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('vi-VN', {
      year: 'numeric',
      month: 'numeric',
      day: 'numeric'
    }).format(date);
  };

  const formatMoney = (amount) => {
    if (!amount && amount !== 0) return 'N/A';
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(amount);
  };

  const renderProfileForm = () => {
    return (
      <form onSubmit={handleSubmit} className="space-y-8">
        <div className="bg-white p-6 rounded-lg shadow-sm">
          <h3 className="text-lg font-semibold flex items-center text-gray-800 mb-4"><FaUser className="mr-2 text-primary" /> Thông tin cá nhân</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label htmlFor="fullName" className="block text-sm font-medium text-gray-700">Họ và tên</label>
              <input
                type="text"
                id="fullName"
                name="fullName"
                value={formData.fullName}
                onChange={handleInputChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              />
            </div>
            
            <div className="space-y-2">
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">Email</label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                disabled
                className="w-full px-3 py-2 border border-gray-200 rounded-md bg-gray-100 text-gray-500 cursor-not-allowed"
              />
            </div>
            
            <div className="space-y-2">
              <label htmlFor="phoneNumber" className="block text-sm font-medium text-gray-700">Số điện thoại</label>
              <input
                type="tel"
                id="phoneNumber"
                name="phoneNumber"
                value={formData.phoneNumber}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              />
            </div>
            
            <div className="space-y-2">
              <label htmlFor="gender" className="block text-sm font-medium text-gray-700">Giới tính</label>
              <select
                id="gender"
                name="gender"
                value={formData.gender}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              >
                <option value="">-- Chọn giới tính --</option>
                <option value="male">Nam</option>
                <option value="female">Nữ</option>
                <option value="other">Khác</option>
              </select>
            </div>
            
            <div className="space-y-2">
              <label htmlFor="dateOfBirth" className="block text-sm font-medium text-gray-700">Ngày sinh</label>
              <input
                type="date"
                id="dateOfBirth"
                name="dateOfBirth"
                value={formData.dateOfBirth}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              />
            </div>
            
            <div className="space-y-2 md:col-span-2">
              <label htmlFor="address" className="block text-sm font-medium text-gray-700">Địa chỉ</label>
              <textarea
                id="address"
                name="address"
                value={formData.address}
                onChange={handleInputChange}
                rows={2}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              ></textarea>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow-sm">
          <h3 className="text-lg font-semibold flex items-center text-gray-800 mb-4"><FaUserMd className="mr-2 text-primary" /> Thông tin chuyên môn</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label htmlFor="title" className="block text-sm font-medium text-gray-700">Chức danh</label>
              <input
                type="text"
                id="title"
                name="title"
                value={formData.title}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              />
            </div>
            
            <div className="space-y-2">
              <label htmlFor="experience" className="block text-sm font-medium text-gray-700">Kinh nghiệm (số năm)</label>
              <input
                type="number"
                id="experience"
                name="experience"
                value={formData.experience}
                onChange={handleInputChange}
                min="0"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              />
            </div>
            
            <div className="space-y-2 md:col-span-2">
              <label htmlFor="education" className="block text-sm font-medium text-gray-700">Học vấn và đào tạo</label>
              <textarea
                id="education"
                name="education"
                value={formData.education}
                onChange={handleInputChange}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              ></textarea>
            </div>
            
            <div className="space-y-2 md:col-span-2">
              <label htmlFor="description" className="block text-sm font-medium text-gray-700">Giới thiệu</label>
              <textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              ></textarea>
            </div>
            
            <div className="space-y-2">
              <label htmlFor="languages" className="block text-sm font-medium text-gray-700">Ngôn ngữ (phân cách bằng dấu phẩy)</label>
              <input
                type="text"
                id="languages"
                name="languages"
                value={formData.languages}
                onChange={handleInputChange}
                placeholder="Tiếng Việt, Tiếng Anh..."
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              />
            </div>
            
            <div className="space-y-2">
              <label htmlFor="certifications" className="block text-sm font-medium text-gray-700">Chứng chỉ (phân cách bằng dấu phẩy)</label>
              <input
                type="text"
                id="certifications"
                name="certifications"
                value={formData.certifications}
                onChange={handleInputChange}
                placeholder="Bác sĩ chuyên khoa I, ACLS..."
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              />
            </div>
          </div>
        </div>
        
        <div className="flex justify-end space-x-4">
          <button 
            type="button" 
            className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors flex items-center"
            onClick={() => setEditing(false)}
          >
            <FaTimes className="mr-2" /> Hủy
          </button>
          <button 
            type="submit" 
            className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors flex items-center shadow-sm hover:shadow"
            disabled={loading}
          >
            {loading ? 'Đang lưu...' : <><FaSave className="mr-2" /> Lưu thay đổi</>}
          </button>
        </div>
      </form>
    );
  };

  const renderProfileInfo = () => {
    return (
      <div className="space-y-8">
        <div className="bg-white p-6 rounded-lg shadow-sm">
          <h3 className="text-lg font-semibold flex items-center text-gray-800 mb-4"><FaUser className="mr-2 text-primary" /> Thông tin cá nhân</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="flex items-start">
              <FaEnvelope className="mt-1 mr-3 text-lg text-primary" />
              <div>
                <span className="block text-sm text-gray-500">Email</span>
                <span className="block text-gray-800 font-medium">{user?.email || 'Chưa cập nhật'}</span>
              </div>
            </div>
            
            <div className="flex items-start">
              <FaPhone className="mt-1 mr-3 text-lg text-primary" />
              <div>
                <span className="block text-sm text-gray-500">Số điện thoại</span>
                <span className="block text-gray-800 font-medium">{user?.phoneNumber || 'Chưa cập nhật'}</span>
              </div>
            </div>
            
            <div className="flex items-start">
              <FaCalendarAlt className="mt-1 mr-3 text-lg text-primary" />
              <div>
                <span className="block text-sm text-gray-500">Ngày sinh</span>
                <span className="block text-gray-800 font-medium">{user?.dateOfBirth ? formatDate(user.dateOfBirth) : 'Chưa cập nhật'}</span>
              </div>
            </div>
            
            <div className="flex items-start">
              <FaIdCard className="mt-1 mr-3 text-lg text-primary" />
              <div>
                <span className="block text-sm text-gray-500">Giới tính</span>
                <span className="block text-gray-800 font-medium">
                  {user?.gender === 'male' ? 'Nam' : user?.gender === 'female' ? 'Nữ' : user?.gender === 'other' ? 'Khác' : 'Chưa cập nhật'}
                </span>
              </div>
            </div>
            
            <div className="flex items-start md:col-span-2">
              <FaMapMarkerAlt className="mt-1 mr-3 text-lg text-primary" />
              <div>
                <span className="block text-sm text-gray-500">Địa chỉ</span>
                <span className="block text-gray-800 font-medium">{user?.address || 'Chưa cập nhật'}</span>
              </div>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow-sm">
          <h3 className="text-lg font-semibold flex items-center text-gray-800 mb-4"><FaUserMd className="mr-2 text-primary" /> Thông tin chuyên môn</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <span className="block text-sm text-gray-500">Chức danh</span>
              <span className="block text-gray-800 font-medium">{doctor?.title || 'Chưa cập nhật'}</span>
            </div>
            
            <div>
              <span className="block text-sm text-gray-500">Kinh nghiệm</span>
              <span className="block text-gray-800 font-medium">{doctor?.experience ? `${doctor.experience} năm` : 'Chưa cập nhật'}</span>
            </div>
            
            <div>
              <span className="block text-sm text-gray-500">Chuyên khoa</span>
              <span className="block text-gray-800 font-medium">
                {doctor?.specialty?.name || 'Chưa cập nhật'}
              </span>
            </div>
            
            <div>
              <span className="block text-sm text-gray-500">Bệnh viện</span>
              <span className="block text-gray-800 font-medium">
                {doctor?.hospital?.name || 'Chưa cập nhật'}
              </span>
            </div>
            
            <div className="md:col-span-2">
              <span className="block text-sm text-gray-500">Ngôn ngữ</span>
              <span className="block text-gray-800 font-medium">
                {doctor?.languages && doctor.languages.length > 0 
                  ? doctor.languages.join(', ') 
                  : 'Chưa cập nhật'}
              </span>
            </div>
            
            <div className="md:col-span-2">
              <span className="block text-sm text-gray-500">Học vấn và đào tạo</span>
              <div className="text-gray-800 whitespace-pre-line">{doctor?.education || 'Chưa cập nhật'}</div>
            </div>
            
            <div className="md:col-span-2">
              <span className="block text-sm text-gray-500">Giới thiệu</span>
              <div className="text-gray-800 whitespace-pre-line">{doctor?.description || 'Chưa cập nhật'}</div>
            </div>
            
            <div className="md:col-span-2">
              <span className="block text-sm text-gray-500">Chứng chỉ</span>
              <span className="block text-gray-800 font-medium">
                {doctor?.certifications && doctor.certifications.length > 0 
                  ? doctor.certifications.join(', ') 
                  : 'Chưa cập nhật'}
              </span>
            </div>
            
            {/* Phí tư vấn */}
            <div>
              <span className="block text-sm text-gray-500">Phí tư vấn</span>
              <span className="block text-gray-800 font-medium">
                {doctor?.consultationFee 
                  ? formatMoney(doctor.consultationFee)
                  : 'Chưa cập nhật'}
              </span>
            </div>
            
            {/* Đánh giá trung bình */}
            <div>
              <span className="block text-sm text-gray-500">Đánh giá trung bình</span>
              <span className="block text-gray-800 font-medium">
                {reviewStats?.averageRating?.toFixed(1) || '0.0'}
              </span>
            </div>
          </div>
        </div>
        
     
        <button 
          className="inline-flex items-center px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors shadow hover:shadow-md"
          onClick={() => setEditing(true)}
        >
          <FaEdit className="mr-2" /> Chỉnh sửa hồ sơ
        </button>
      </div>
    );
  };

  if (loading && !doctor) {
    return (
      <div className="flex items-center justify-center min-h-[70vh]">
        <div className="text-center">
          <div className="inline-block w-12 h-12 border-4 border-primary/30 border-l-primary rounded-full animate-spin mb-4"></div>
          <p className="text-gray-600">Đang tải thông tin...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 p-6 rounded-lg text-center shadow-sm">
        <div className="text-red-600 text-lg mb-2">Lỗi</div>
        <p className="text-red-700">{error}</p>
        <button 
          onClick={fetchDoctorProfile}
          className="mt-4 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark"
        >
          Thử lại
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <div className="bg-gradient-to-r from-primary-dark to-primary p-6 text-white">
          <h1 className="text-2xl font-bold flex items-center">
            <FaUserMd className="mr-3" /> Hồ sơ cá nhân
          </h1>
        </div>
      </div>
      
      {/* Profile Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Sidebar */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            {/* Avatar Section */}
            <div className="relative">
              <div className="bg-gradient-to-r from-blue-500 to-indigo-600 h-32"></div>
              <div className="relative px-6">
                <div className="absolute -top-16 w-32 h-32 mx-auto">
                  <div className="relative">
                    <img 
                      src={imagePreview || (user && getAvatarUrl(user)) || `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.fullName || 'Doctor')}&background=1AC0FF&color=fff`} 
                      alt={user?.fullName || 'Bác sĩ'} 
                      className="w-32 h-32 rounded-full border-4 border-white shadow-md object-cover bg-white"
                      onError={(e) => {
                        e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.fullName || 'Doctor')}&background=1AC0FF&color=fff`;
                      }}
                    />
                    
                    {!selectedImage && (
                      <button 
                        className="absolute bottom-0 right-0 bg-primary hover:bg-primary-dark text-white p-2 rounded-full shadow-lg transition-colors"
                        onClick={() => fileInputRef.current.click()}
                      >
                        <FaCamera />
                      </button>
                    )}
                    
                    <input 
                      type="file" 
                      ref={fileInputRef}
                      onChange={handleImageChange}
                      accept="image/*"
                      style={{ display: 'none' }}
                    />
                  </div>
                </div>
              </div>
            </div>
            
            {/* Profile Info */}
            <div className="pt-20 pb-6 px-6 text-center">
              <h2 className="text-xl font-bold text-gray-800 mb-1">{user?.fullName}</h2>
              <p className="text-primary text-sm mb-3">{doctor?.title || 'Bác sĩ'}</p>
              
              <div className="flex items-center justify-center space-x-1 text-gray-600 mb-4">
                <FaHospital className="text-primary" />
                <span className="text-sm">
                  {doctor?.hospital?.name || 'Chưa có bệnh viện'}
                </span>
              </div>
              
              {selectedImage && (
                <div className="flex justify-center space-x-3 mt-4">
                  <button 
                    className="px-3 py-1.5 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 transition-colors text-sm flex items-center"
                    onClick={cancelImageUpload}
                    disabled={uploadingImage}
                  >
                    <FaTimes className="mr-1" /> Hủy
                  </button>
                  <button 
                    className="px-3 py-1.5 bg-primary text-white rounded hover:bg-primary-dark transition-colors text-sm flex items-center"
                    onClick={handleImageUpload}
                    disabled={uploadingImage}
                  >
                    {uploadingImage ? 'Đang tải...' : <><FaSave className="mr-1" /> Lưu</>}
                  </button>
                </div>
              )}
              
              {!editing && !selectedImage && (
                <button 
                  className="mt-4 w-full bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white px-4 py-2 rounded-lg transition-all shadow-sm hover:shadow-md flex items-center justify-center"
                  onClick={() => setEditing(true)}
                >
                  <FaEdit className="mr-2" /> Chỉnh sửa hồ sơ
                </button>
              )}
            </div>
          </div>
          
          {/* Quick Stats Card */}
          <div className="mt-6 bg-white rounded-xl shadow-sm overflow-hidden">
            <div className="bg-gradient-to-r from-green-500 to-green-600 px-4 py-3 text-white">
              <h3 className="font-semibold flex items-center">
                <FaChartLine className="mr-2" /> Thống kê
              </h3>
            </div>
            <div className="p-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-blue-50 p-3 rounded-lg text-center">
                  <div className="text-2xl font-bold text-blue-600">
                    {reviewStats?.averageRating?.toFixed(1) || '0.0'}
                  </div>
                  <div className="text-xs text-gray-600">Đánh giá trung bình</div>
                </div>
                <div className="bg-green-50 p-3 rounded-lg text-center">
                  <div className="text-2xl font-bold text-green-600">
                    {reviewStats?.total || 0}
                  </div>
                  <div className="text-xs text-gray-600">Tổng đánh giá</div>
                </div>
                <div className="bg-yellow-50 p-3 rounded-lg text-center">
                  <div className="text-2xl font-bold text-yellow-600">
                    {doctor?.stats?.patientCount || 0}
                  </div>
                  <div className="text-xs text-gray-600">Bệnh nhân</div>
                </div>
                <div className="bg-purple-50 p-3 rounded-lg text-center">
                  <div className="text-2xl font-bold text-purple-600">
                    {doctor?.services?.length || 0}
                  </div>
                  <div className="text-xs text-gray-600">Dịch vụ y tế</div>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Main Content */}
        <div className="lg:col-span-3">
          {editing ? (
            <div className="bg-white rounded-xl shadow-sm overflow-hidden">
              <div className="bg-gradient-to-r from-blue-500 to-blue-600 px-6 py-4 text-white">
                <h3 className="text-lg font-semibold flex items-center">
                  <FaEdit className="mr-2" /> Chỉnh sửa thông tin cá nhân
                </h3>
              </div>
              <div className="p-6">
                {renderProfileForm()}
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-xl shadow-sm overflow-hidden">
              <div className="bg-gradient-to-r from-blue-500 to-blue-600 px-6 py-4 text-white">
                <h3 className="text-lg font-semibold flex items-center">
                  <FaUser className="mr-2" /> Thông tin cá nhân
                </h3>
              </div>
              <div className="p-6">
                {renderProfileInfo()}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Profile;
