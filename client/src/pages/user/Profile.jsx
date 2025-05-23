import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import api from '../../utils/api';
import { useNavigate, Link } from 'react-router-dom';
import { toastSuccess, toastError, toastInfo } from '../../utils/toast';
import { Button } from 'antd';
import { UploadOutlined } from '@ant-design/icons';
import { Spin, Modal } from 'antd';
import { getAvatarUrl, handleAvatarError } from '../../utils/avatarUtils';
import { FaCalendarAlt, FaFileAlt, FaNotesMedical, FaPills, FaPrint, FaUserMd, FaHospital, FaHeart } from 'react-icons/fa';

const Profile = () => {
  const { user, login, logout } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('info');
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [userState, setUserState] = useState({
    hasAvatarUrl: false,
    avatarError: false
  });
  
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phoneNumber: '',
    dateOfBirth: '',
    gender: '',
    address: '',
    avatarUrl: '',
    avatarData: ''
  });

  const [originalData, setOriginalData] = useState({
    fullName: '',
    email: '',
    phoneNumber: '',
    dateOfBirth: '',
    gender: '',
    address: '',
    avatarUrl: '',
    avatarData: ''
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

  // Add new state for medical records and prescriptions
  const [medicalRecords, setMedicalRecords] = useState([]);
  const [loadingMedicalRecords, setLoadingMedicalRecords] = useState(false);
  const [medicalRecordsError, setMedicalRecordsError] = useState(null);

  // State for favorite doctors
  const [favoriteDoctors, setFavoriteDoctors] = useState([]);
  const [loadingFavorites, setLoadingFavorites] = useState(false);
  const [favoritesError, setFavoritesError] = useState(null);

  const [avatarLoading, setAvatarLoading] = useState(false);
  const [isAvatarModalVisible, setIsAvatarModalVisible] = useState(false);

  const togglePasswordVisibility = (field) => {
    setPasswordVisibility(prev => ({
      ...prev,
      [field]: !prev[field]
    }));
  };

  useEffect(() => {
    if (user) {
      console.log("Current user in Profile:", user); // Debug
      console.log("User has avatarUrl:", !!user.avatarUrl);
      
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
      setOriginalData({
        fullName: user.fullName || '',
        email: user.email || '',
        phoneNumber: user.phoneNumber || '',
        dateOfBirth: formattedDateOfBirth,
        gender: user.gender || '',
        address: user.address || '',
        avatarUrl: user.avatarUrl || ''
      });
      
      // Set avatar state
      setUserState({
        hasAvatarUrl: !!user.avatarUrl,
        avatarError: false
      });
      
      console.log("FormData after setting:", {
        ...formData, 
        avatarUrl: user.avatarUrl || 'Not provided'
      }); // Debug
    }
  }, [user]);

  useEffect(() => {
    console.log("Current FormData:", {
      ...formData,
      hasAvatarUrl: !!formData.avatarUrl
    });
  }, [formData]);

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

    try {
      // Gọi API cập nhật thông tin
      const response = await api.put('/auth/profile', formData);
      
      if (response.data.success) {
        // Cập nhật thông tin người dùng trong context
        login(response.data.data, true);
        
        toastSuccess('Cập nhật thông tin thành công');
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
          toastError(`${error.response.data.field}: ${error.response.data.message}`);
        } else if (error.response.data.errors) {
          // Nhiều lỗi validation
          const errorMessages = Object.entries(error.response.data.errors)
            .map(([field, message]) => `${field}: ${message}`)
            .join(', ');
          toastError(errorMessages);
        } else {
          // Lỗi chung
          toastError(error.response.data.message || 'Không thể cập nhật thông tin. Vui lòng thử lại sau.');
        }
      } else {
        toastError('Không thể cập nhật thông tin. Vui lòng thử lại sau.');
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
    toastInfo('Đã hủy thay đổi');
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
      const response = await api.put('auth/profile/password', {
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword
      });
      
      if (response.data.success) {
        toastSuccess('Đổi mật khẩu thành công');
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
        
        // Display success message and log out after 2 seconds
        setTimeout(() => {
          // Log user out and redirect to login page
          logout();
          navigate('/login');
        }, 2000);
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
          toastError(error.response.data.message);
        } else {
          setPasswordErrors({
            general: error.response.data.message || 'Đổi mật khẩu không thành công'
          });
          toastError(error.response.data.message || 'Đổi mật khẩu không thành công');
        }
      } else {
        setPasswordErrors({
          general: 'Đổi mật khẩu không thành công. Vui lòng thử lại sau.'
        });
        toastError('Đổi mật khẩu không thành công. Vui lòng thử lại sau.');
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
      toastError('Kích thước ảnh quá lớn. Vui lòng chọn ảnh nhỏ hơn 5MB.');
      return;
    }

    // Kiểm tra loại file
    const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml'];
    if (!validTypes.includes(file.type)) {
      toastError('Định dạng file không hỗ trợ. Vui lòng chọn ảnh JPEG, PNG, GIF, WebP hoặc SVG.');
      return;
    }

    try {
      setLoading(true);
      setAvatarLoading(true);
      
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
      
      console.log("Đang tải ảnh lên máy chủ...", {
        fileName: file.name,
        fileType: file.type,
        fileSize: `${(file.size / 1024).toFixed(2)} KB`
      });
      
      // Gọi API upload avatar
      const response = await api.post('/auth/profile/avatar', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      
      if (response.data.success) {
        // Cập nhật thông tin người dùng trong context với dữ liệu mới từ server
        const updatedUserData = response.data.data;
        console.log("Cập nhật avatar thành công:", { 
          avatarUrl: updatedUserData.avatarUrl
        });
        
        login(updatedUserData);
        toastSuccess('Cập nhật avatar thành công');
        
        // Cập nhật form data với avatar URL mới từ server
        setFormData(prevData => ({
          ...prevData,
          avatarUrl: updatedUserData.avatarUrl
        }));
        
        // Cập nhật state hiển thị ảnh
        setUserState(prevState => ({
          ...prevState,
          hasAvatarUrl: !!updatedUserData.avatarUrl,
          avatarError: false
        }));
      } else {
        throw new Error(response.data.message || 'Lỗi không xác định');
      }
    } catch (error) {
      console.error('Lỗi khi tải ảnh lên:', error);
      
      // Reset preview về ảnh cũ nếu có lỗi
      const previewContainer = document.getElementById('avatar-preview');
      if (previewContainer) {
        previewContainer.src = getAvatarUrl(formData.avatarUrl);
      }
      
      toastError(
        error.response?.data?.message || 
        error.message || 
        'Không thể tải lên ảnh. Vui lòng thử lại sau.'
      );
    } finally {
      setLoading(false);
      setAvatarLoading(false);
      // Xóa giá trị input file để cho phép người dùng tải lại cùng một file nếu cần
      e.target.value = null;
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

  // Fetch medical records when the user changes or when the medical records tab is activated
  useEffect(() => {
    if (user && activeTab === 'medical-records') {
      fetchMedicalRecords();
    }
  }, [user, activeTab]);

  // Function to fetch medical records from API
  const fetchMedicalRecords = async () => {
    if (!user) return;
    
    setLoadingMedicalRecords(true);
    setMedicalRecordsError(null);
    
    try {
      const response = await api.get(`/doctors/patients/${user._id}/medical-records`);
      
      if (response.data.success) {
        setMedicalRecords(response.data.data || []);
      } else {
        setMedicalRecordsError('Không thể tải hồ sơ y tế. Vui lòng thử lại sau.');
      }
    } catch (error) {
      console.error('Error fetching medical records:', error);
      setMedicalRecordsError('Không thể tải hồ sơ y tế. Vui lòng thử lại sau.');
    } finally {
      setLoadingMedicalRecords(false);
    }
  };

  // Update prescription and medical record rendering function
  const renderMedicalRecordsSection = () => {
    if (loadingMedicalRecords) {
      return (
        <div className="flex justify-center items-center py-8">
          <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-primary"></div>
          <p className="ml-4 text-gray-600">Đang tải hồ sơ y tế...</p>
        </div>
      );
    }

    if (medicalRecordsError) {
      return <div className="p-4 bg-red-50 text-red-600 rounded-lg">{medicalRecordsError}</div>;
    }

    if (!medicalRecords || medicalRecords.length === 0) {
      return (
        <div className="py-12 px-4 text-center">
          <div className="inline-flex justify-center items-center w-16 h-16 bg-gray-100 rounded-full mb-4">
            <FaFileAlt className="text-gray-400 text-xl" />
          </div>
          <h3 className="text-xl font-semibold text-gray-800 mb-2">Không có hồ sơ y tế</h3>
          <p className="text-gray-600 mb-6">Bạn chưa có hồ sơ y tế nào trong hệ thống của chúng tôi.</p>
          <Link to="/appointment" className="bg-primary hover:bg-primary-dark text-white px-4 py-2 rounded-lg transition-colors hover:text-white">
            Đặt lịch khám ngay
          </Link>
        </div>
      );
    }

    return (
      <div className="space-y-6">
        {medicalRecords.map((record) => {
          // Extract doctor information
          const doctorName = record.doctorId && record.doctorId.user ? 
            record.doctorId.user.fullName : 
            (record.doctorName || 'Không có thông tin bác sĩ');
          
          // Extract doctor title/specialty
          const doctorTitle = record.doctorId ? record.doctorId.title || '' : '';
          
          // Extract hospital information
          const hospitalInfo = record.hospitalId ? 
            (record.hospitalId.name || 'Không có thông tin bệnh viện') : 
            (record.hospitalName || 'Không có thông tin bệnh viện');
          
          // Extract hospital address
          const hospitalAddress = record.hospitalId ? record.hospitalId.address || '' : '';
          
          // Extract appointment time
          let appointmentDate = '';
          let appointmentTime = '';
          if (record.appointmentId) {
            if (record.appointmentId.appointmentDate) {
              appointmentDate = formatDate(record.appointmentId.appointmentDate);
            }
            if (record.appointmentId.timeSlot) {
              appointmentTime = `${record.appointmentId.timeSlot.startTime} - ${record.appointmentId.timeSlot.endTime}`;
            }
          }

          return (
            <div key={record._id} className="bg-white shadow-md rounded-lg overflow-hidden border border-gray-100">
              <div className="bg-gray-50 px-4 py-3 border-b border-gray-100 flex justify-between items-center">
                <div className="flex items-center text-gray-600 text-sm">
                  <FaCalendarAlt className="mr-2 text-primary" />
                  <span>{formatDate(record.createdAt)} {appointmentDate && `(Ngày khám: ${appointmentDate})`}</span>
                </div>
                
                <div className="bg-primary/10 text-primary text-sm font-medium px-3 py-1 rounded-full">
                  Mã: {record._id.substring(record._id.length - 8).toUpperCase()}
                </div>
              </div>
              
              <div className="p-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h4 className="flex items-center text-gray-800 font-medium mb-3">
                      <FaUserMd className="mr-2 text-primary" /> Thông tin bác sĩ
                    </h4>
                    <div className="space-y-2 text-gray-700">
                      <p><span className="font-medium">Bác sĩ:</span> {doctorName}</p>
                      {doctorTitle && <p><span className="font-medium">Chức danh:</span> {doctorTitle}</p>}
                    </div>
                  </div>
                  
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h4 className="flex items-center text-gray-800 font-medium mb-3">
                      <FaHospital className="mr-2 text-primary" /> Thông tin bệnh viện
                    </h4>
                    <div className="space-y-2 text-gray-700">
                      <p><span className="font-medium">Bệnh viện:</span> {hospitalInfo}</p>
                      {hospitalAddress && <p><span className="font-medium">Địa chỉ:</span> {hospitalAddress}</p>}
                      {appointmentTime && <p><span className="font-medium">Thời gian:</span> {appointmentTime}</p>}
                    </div>
                  </div>
                </div>
                
                <div className="bg-gray-50 p-4 rounded-lg mb-6">
                  <h4 className="flex items-center text-gray-800 font-medium mb-3">
                    <FaNotesMedical className="mr-2 text-primary" /> Thông tin chẩn đoán
                  </h4>
                  <div className="space-y-2 text-gray-700">
                    {record.diagnosis && <p><span className="font-medium">Chẩn đoán:</span> {record.diagnosis}</p>}
                    {record.symptoms && <p><span className="font-medium">Triệu chứng:</span> {record.symptoms}</p>}
                    {record.treatment && <p><span className="font-medium">Phương pháp điều trị:</span> {record.treatment}</p>}
                    {record.notes && <p><span className="font-medium">Ghi chú:</span> {record.notes}</p>}
                  </div>
                </div>
                
                {/* Display prescription information */}
                {record.prescription && record.prescription.length > 0 && (
                  <div className="bg-gray-50 p-4 rounded-lg mb-6">
                    <h4 className="flex items-center text-gray-800 font-medium mb-3">
                      <FaPills className="mr-2 text-primary" /> Đơn thuốc
                    </h4>
                    
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm text-left text-gray-700">
                        <thead className="text-xs text-gray-600 uppercase bg-gray-100">
                          <tr>
                            <th className="px-4 py-2 rounded-l-lg">Thuốc</th>
                            <th className="px-4 py-2">Liều lượng</th>
                            <th className="px-4 py-2">Cách dùng</th>
                            <th className="px-4 py-2">Thời gian</th>
                            <th className="px-4 py-2 rounded-r-lg">Ghi chú</th>
                          </tr>
                        </thead>
                        <tbody>
                          {record.prescription.map((med, index) => (
                            <tr key={`med-${record._id}-${index}`} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                              <td className="px-4 py-2">{med.medicine}</td>
                              <td className="px-4 py-2">{med.dosage || '-'}</td>
                              <td className="px-4 py-2">{med.usage || '-'}</td>
                              <td className="px-4 py-2">{med.duration || '-'}</td>
                              <td className="px-4 py-2">{med.notes || '-'}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
                
                {/* Display attachments if available */}
                {record.attachments && record.attachments.length > 0 && (
                  <div className="bg-gray-50 p-4 rounded-lg mb-6">
                    <h4 className="flex items-center text-gray-800 font-medium mb-3">
                      <FaFileAlt className="mr-2 text-primary" /> Tệp đính kèm
                    </h4>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {record.attachments.map((attachment, index) => (
                        <a 
                          key={`attachment-${record._id}-${index}`}
                          href={attachment.url} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="flex items-center p-3 bg-white rounded-lg border border-gray-100 hover:bg-gray-50 transition-colors"
                        >
                          <FaFileAlt className="text-primary mr-2" />
                          <div>
                            <div className="text-gray-800 font-medium">{attachment.name || `Tệp đính kèm ${index + 1}`}</div>
                            {attachment.type && <div className="text-xs text-gray-500">{attachment.type}</div>}
                          </div>
                        </a>
                      ))}
                    </div>
                  </div>
                )}
                
                {/* Link to appointment details if available */}
                {record.appointmentId && (
                  <div className="flex justify-between mt-6">
                    <Link 
                      to={`/appointments/${record.appointmentId._id || record.appointmentId}`} 
                      className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-lg transition-colors flex items-center"
                    >
                      <FaCalendarAlt className="mr-2" /> Xem chi tiết lịch hẹn
                    </Link>
                    
                    <button 
                      className="bg-primary hover:bg-primary-dark text-white px-4 py-2 rounded-lg transition-colors flex items-center"
                      onClick={() => window.print()}
                    >
                      <FaPrint className="mr-2" /> In hồ sơ
                    </button>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  // Function to fetch favorite doctors
  const fetchFavoriteDoctors = async () => {
    if (!user) return;
    
    setLoadingFavorites(true);
    setFavoritesError(null);
    
    try {
      const response = await api.get('doctors/favorites');
      setFavoriteDoctors(response.data.data || []);
    } catch (error) {
      console.error('Error fetching favorite doctors:', error);
      setFavoritesError('Không thể tải danh sách bác sĩ yêu thích. Vui lòng thử lại sau.');
    } finally {
      setLoadingFavorites(false);
    }
  };

  // Function to remove a doctor from favorites
  const removeFavoriteDoctor = async (doctorId) => {
    try {
      await api.delete(`/doctors/${doctorId}/favorite`);
      // Update the favorites list after removing
      setFavoriteDoctors(favoriteDoctors.filter(doctor => doctor._id !== doctorId));
      toastSuccess('Đã xóa bác sĩ khỏi danh sách yêu thích');
    } catch (error) {
      console.error('Error removing favorite doctor:', error);
      toastError('Không thể xóa bác sĩ khỏi danh sách yêu thích. Vui lòng thử lại sau.');
    }
  };

  // Load favorites when the user changes or when the favorites tab is activated
  useEffect(() => {
    if (activeTab === 'favorites' && user) {
      fetchFavoriteDoctors();
    }
  }, [activeTab, user]);

  // Function to render the avatar with upload capabilities
  const renderAvatar = () => {
    return (
      <div className="relative mb-4">
        <div className="w-24 h-24 rounded-full overflow-hidden border-4 border-gray-100 shadow-sm mx-auto relative">
          {avatarLoading && (
            <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
              <div className="w-8 h-8 border-2 border-t-2 border-white rounded-full animate-spin"></div>
            </div>
          )}
          <img
            id="avatar-preview"
            src={getAvatarUrl(formData.avatarUrl)}
            alt={formData.fullName || "User"}
            className="w-full h-full object-cover cursor-pointer"
            onError={(e) => handleAvatarError(e)}
            onClick={() => setIsAvatarModalVisible(true)}
          />
        </div>
        
        <div className="mt-3 text-center flex justify-center gap-2">
          <input
            type="file"
            id="avatar-upload"
            accept="image/*"
            onChange={handleAvatarUpload}
            className="hidden"
          />
          <label
            htmlFor="avatar-upload"
            className="inline-flex items-center gap-1 px-3 py-1.5 bg-primary/10 text-primary hover:bg-primary/20 rounded-lg text-sm font-medium cursor-pointer transition-colors"
          >
            <UploadOutlined />
            {avatarLoading ? 'Đang tải lên...' : 'Thay đổi ảnh'}
          </label>
          
          <button
            type="button"
            onClick={() => setIsAvatarModalVisible(true)}
            className="inline-flex items-center gap-1 px-3 py-1.5 bg-gray-100 text-gray-700 hover:bg-gray-200 rounded-lg text-sm font-medium cursor-pointer transition-colors"
          >
            <i className="fas fa-search"></i>
            Xem ảnh
          </button>
        </div>
        
        {/* Avatar Modal/Lightbox */}
        <Modal
          open={isAvatarModalVisible}
          footer={null}
          onCancel={() => setIsAvatarModalVisible(false)}
          width={400}
          className="avatar-modal"
          centered
        >
          <div className="py-4">
            <img
              src={getAvatarUrl(formData.avatarUrl)}
              alt={formData.fullName || "User"}
              className="w-full h-auto object-contain rounded-lg"
              onError={(e) => handleAvatarError(e)}
            />
          </div>
        </Modal>
      </div>
    );
  };

  return (
    <div className="bg-gray-50 py-8">
      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row gap-6 bg-white rounded-lg shadow-md overflow-hidden">
          {/* Sidebar */}
          <div className="w-full md:w-1/4 bg-white p-6 border-r border-gray-100">
            <div className="flex flex-col items-center">
              {renderAvatar()}
              
              <h2 className="text-xl font-semibold text-gray-800 mb-1">
                {formData.fullName || 'Người dùng'}
              </h2>
              
              <p className="text-gray-500 mb-1 text-sm">
                {formData.email}
              </p>
              
              <div className="text-primary text-sm font-medium mb-6">
                {user?.roleType === 'admin' ? 'Quản trị viên' : 
                user?.roleType === 'doctor' ? 'Bác sĩ' : 'Người dùng'}
              </div>
            </div>
            
            <ul className="space-y-1">
              <li>
                <button 
                  className={`flex items-center w-full p-3 rounded-lg text-left transition-colors ${activeTab === 'info' ? 'bg-primary text-white' : 'text-gray-700 hover:bg-gray-100'}`}
                  onClick={() => setActiveTab('info')}
                >
                  <i className="fas fa-user mr-3"></i>
                  <span>Thông tin cá nhân</span>
                </button>
              </li>
              <li>
                <button 
                  className={`flex items-center w-full p-3 rounded-lg text-left transition-colors ${activeTab === 'medical-records' ? 'bg-primary text-white' : 'text-gray-700 hover:bg-gray-100'}`}
                  onClick={() => setActiveTab('medical-records')}
                >
                  <i className="fas fa-file-medical mr-3"></i>
                  <span>Hồ sơ y tế & đơn thuốc</span>
                </button>
              </li>
              <li>
                <button 
                  className={`flex items-center w-full p-3 rounded-lg text-left transition-colors ${activeTab === 'favorites' ? 'bg-primary text-white' : 'text-gray-700 hover:bg-gray-100'}`}
                  onClick={() => setActiveTab('favorites')}
                >
                  <FaHeart className="mr-3" />
                  <span>Bác sĩ yêu thích</span>
                </button>
              </li>
              <li>
                <button 
                  className={`flex items-center w-full p-3 rounded-lg text-left transition-colors ${activeTab === 'security' ? 'bg-primary text-white' : 'text-gray-700 hover:bg-gray-100'}`}
                  onClick={() => setActiveTab('security')}
                >
                  <i className="fas fa-shield-alt mr-3"></i>
                  <span>Bảo mật</span>
                </button>
              </li>
            </ul>
          </div>

          {/* Content Area */}
          <div className="w-full md:w-3/4 p-6">
            {activeTab === 'info' && (
              <div>
                <div className="flex justify-between items-center mb-6 pb-3 border-b border-gray-100">
                  <h2 className="text-2xl font-semibold text-gray-800">Thông tin cá nhân</h2>
                  {!isEditing ? (
                    <button 
                      className="bg-primary hover:bg-primary-dark text-white px-4 py-2 rounded-lg transition-colors flex items-center text-sm"
                      onClick={() => setIsEditing(true)}
                    >
                      <i className="fas fa-edit mr-2"></i> Chỉnh sửa
                    </button>
                  ) : (
                    <div className="flex gap-3">
                      <button 
                        className="border border-gray-300 hover:bg-gray-50 text-gray-700 px-4 py-2 rounded-lg transition-colors"
                        onClick={handleCancel}
                      >
                        Hủy
                      </button>
                      <button 
                        className="bg-primary hover:bg-primary-dark text-white px-4 py-2 rounded-lg transition-colors"
                        onClick={handleSubmit}
                        disabled={loading}
                      >
                        {loading ? 'Đang lưu...' : 'Lưu thay đổi'}
                      </button>
                    </div>
                  )}
                </div>

                {isEditing ? (
                  <form className="space-y-6">
                    <div className="space-y-2">
                      <label htmlFor="fullName" className="block text-sm font-medium text-gray-700">Họ và tên</label>
                      <input
                        type="text"
                        id="fullName"
                        name="fullName"
                        value={formData.fullName}
                        onChange={handleChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary"
                        required
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <label htmlFor="email" className="block text-sm font-medium text-gray-700">Email</label>
                        <input
                          type="email"
                          id="email"
                          name="email"
                          value={formData.email}
                          onChange={handleChange}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 focus:outline-none cursor-not-allowed"
                          required
                          disabled
                        />
                        <p className="text-xs text-gray-500">Email không thể thay đổi</p>
                      </div>

                      <div className="space-y-2">
                        <label htmlFor="phoneNumber" className="block text-sm font-medium text-gray-700">Số điện thoại</label>
                        <input
                          type="tel"
                          id="phoneNumber"
                          name="phoneNumber"
                          value={formData.phoneNumber}
                          onChange={handleChange}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary"
                          required
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <label htmlFor="dateOfBirth" className="block text-sm font-medium text-gray-700">Ngày sinh</label>
                        <input
                          type="date"
                          id="dateOfBirth"
                          name="dateOfBirth"
                          value={formData.dateOfBirth}
                          onChange={handleChange}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary"
                        />
                      </div>

                      <div className="space-y-2">
                        <label htmlFor="gender" className="block text-sm font-medium text-gray-700">Giới tính</label>
                        <select
                          id="gender"
                          name="gender"
                          value={formData.gender}
                          onChange={handleChange}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary"
                        >
                          <option value="">Chọn giới tính</option>
                          <option value="male">Nam</option>
                          <option value="female">Nữ</option>
                          <option value="other">Khác</option>
                        </select>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label htmlFor="address" className="block text-sm font-medium text-gray-700">Địa chỉ</label>
                      <textarea
                        id="address"
                        name="address"
                        value={formData.address}
                        onChange={handleChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary"
                        rows="3"
                      ></textarea>
                    </div>
                  </form>
                ) : (
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <div className="text-sm text-gray-500 mb-1">Họ và tên</div>
                        <div className="text-gray-800 font-medium">{formData.fullName || 'Chưa cập nhật'}</div>
                      </div>
                      
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <div className="text-sm text-gray-500 mb-1">Email</div>
                        <div className="text-gray-800 font-medium">{formData.email || 'Chưa cập nhật'}</div>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <div className="text-sm text-gray-500 mb-1">Số điện thoại</div>
                        <div className="text-gray-800 font-medium">{formData.phoneNumber || 'Chưa cập nhật'}</div>
                      </div>
                      
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <div className="text-sm text-gray-500 mb-1">Ngày sinh</div>
                        <div className="text-gray-800 font-medium">{formData.dateOfBirth ? formatDate(formData.dateOfBirth) : 'Chưa cập nhật'}</div>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <div className="text-sm text-gray-500 mb-1">Giới tính</div>
                        <div className="text-gray-800 font-medium">{formData.gender ? getGenderLabel(formData.gender) : 'Chưa cập nhật'}</div>
                      </div>
                      
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <div className="text-sm text-gray-500 mb-1">Địa chỉ</div>
                        <div className="text-gray-800 font-medium">{formData.address || 'Chưa cập nhật'}</div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'medical-records' && (
              <div>
                <div className="flex justify-between items-center mb-6 pb-3 border-b border-gray-100">
                  <h2 className="text-2xl font-semibold text-gray-800">Hồ sơ y tế và đơn thuốc</h2>
                </div>
                {renderMedicalRecordsSection()}
              </div>
            )}

            {activeTab === 'favorites' && (
              <div>
                <div className="flex justify-between items-center mb-6 pb-3 border-b border-gray-100">
                  <h2 className="text-2xl font-semibold text-gray-800">Bác sĩ yêu thích</h2>
                </div>
                {loadingFavorites ? (
                  <div className="flex flex-col items-center justify-center py-8 space-y-4">
                    <Spin size="large" />
                    <p className="text-gray-600">Đang tải danh sách bác sĩ yêu thích...</p>
                  </div>
                ) : favoritesError ? (
                  <div className="flex flex-col items-center justify-center py-8 bg-red-50 rounded-lg p-6 space-y-4">
                    <p className="text-red-600">{favoritesError}</p>
                    <button 
                      className="bg-primary hover:bg-primary-dark text-white px-4 py-2 rounded-lg transition-colors"
                      onClick={fetchFavoriteDoctors}
                    >
                      Thử lại
                    </button>
                  </div>
                ) : favoriteDoctors.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 bg-gray-50 rounded-lg p-6 space-y-4">
                    <div className="text-gray-400 text-6xl mb-2">
                      <FaHeart />
                    </div>
                    <p className="text-gray-600 text-lg">Bạn chưa có bác sĩ yêu thích nào.</p>
                    <Link 
                      to="/doctors" 
                      className="bg-primary hover:bg-primary-dark text-white px-6 py-2 rounded-lg transition-colors mt-2 inline-flex items-center"
                    >
                      <FaUserMd className="mr-2" /> Tìm kiếm bác sĩ
                    </Link>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {favoriteDoctors.map(doctor => (
                      <div 
                        key={doctor._id} 
                        className="bg-white rounded-xl shadow-md overflow-hidden border border-gray-100 hover:shadow-lg transition-shadow relative group"
                      >
                        <button 
                          onClick={() => removeFavoriteDoctor(doctor._id)} 
                          className="absolute top-3 right-3 bg-white p-2 rounded-full shadow-md text-red-500 hover:text-red-600 hover:bg-red-50 transition-colors z-10"
                          title="Xóa khỏi danh sách yêu thích"
                        >
                          <FaHeart className="text-lg" />
                        </button>
                        
                        <Link to={`/doctors/${doctor._id}`} className="block">
                          <div className="flex items-center p-4 border-b border-gray-100">
                            <div className="w-16 h-16 rounded-full overflow-hidden bg-gray-100 border-2 border-primary/10 flex-shrink-0">
                              <img 
                                src={doctor.user?.avatarUrl || 'https://cdn-icons-png.flaticon.com/512/3774/3774299.png'} 
                                alt={doctor.user?.fullName || "Doctor"}
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                  e.target.onerror = null;
                                  e.target.src = 'https://cdn-icons-png.flaticon.com/512/3774/3774299.png';
                                }}
                              />
                            </div>
                            <div className="ml-4">
                              <h3 className="text-lg font-semibold text-gray-800">
                                Bs. {doctor.user?.fullName || 'Bác sĩ'}
                              </h3>
                              <div className="flex items-center text-sm text-gray-600 mt-1">
                                <div className="flex items-center">
                                  {doctor.averageRating ? `${doctor.averageRating}` : '4.0'} 
                                  <span className="text-yellow-400 ml-1">⭐</span>
                                </div>
                              </div>
                            </div>
                          </div>
                          
                          <div className="p-4">
                            <div className="flex items-center text-sm text-gray-600 mb-2">
                              <FaUserMd className="text-primary mr-2" />
                              <span>{doctor.specialtyId?.name || 'Chuyên khoa'}</span>
                            </div>
                            <div className="flex items-center text-sm text-gray-600">
                              <FaHospital className="text-primary mr-2" />
                              <span>{doctor.hospitalId?.name || 'Bệnh viện'}</span>
                            </div>
                          </div>
                        </Link>
                        
                        <div className="bg-gray-50 p-4 flex justify-between gap-2">
                          <Link 
                            to={`/appointment?doctor=${doctor._id}`} 
                            className="flex-1 bg-primary hover:bg-primary-dark text-white px-3 py-2 rounded-lg transition-colors text-center text-sm font-medium hover:text-white"
                          >
                            Đặt lịch khám
                          </Link>
                          <Link 
                            to={`/doctors/${doctor._id}`} 
                            className="flex-1 border border-primary text-primary hover:bg-primary hover:text-white px-3 py-2 rounded-lg transition-colors text-center text-sm font-medium"
                          >
                            Xem chi tiết
                          </Link>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {activeTab === 'security' && (
              <div>
                <div className="flex justify-between items-center mb-6 pb-3 border-b border-gray-100">
                  <h2 className="text-2xl font-semibold text-gray-800">Bảo mật</h2>
                </div>

                <div className="bg-white rounded-lg">
                  <div className="mb-8">
                    <h3 className="text-lg font-semibold text-gray-800 mb-4">Đổi mật khẩu</h3>
                    {passwordErrors.general && <div className="mb-4 p-3 bg-red-50 text-red-600 rounded-lg">{passwordErrors.general}</div>}
                    
                    <form className="space-y-6" onSubmit={handlePasswordChange}>
                      <div className="space-y-2">
                        <label htmlFor="currentPassword" className="block text-sm font-medium text-gray-700">Mật khẩu hiện tại</label>
                        <div className="relative">
                          <input
                            type={passwordVisibility.currentPassword ? "text" : "password"}
                            id="currentPassword"
                            name="currentPassword"
                            value={passwordData.currentPassword}
                            onChange={handlePasswordInputChange}
                            className="w-full pl-3 pr-10 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary"
                            required
                          />
                          <button 
                            type="button" 
                            className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                            onClick={() => togglePasswordVisibility('currentPassword')}
                          >
                            <i className={`fas fa-${passwordVisibility.currentPassword ? 'eye-slash' : 'eye'}`}></i>
                          </button>
                        </div>
                        {passwordErrors.currentPassword && <div className="text-red-600 text-sm mt-1">{passwordErrors.currentPassword}</div>}
                      </div>

                      <div className="space-y-2">
                        <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700">Mật khẩu mới</label>
                        <div className="relative">
                          <input
                            type={passwordVisibility.newPassword ? "text" : "password"}
                            id="newPassword"
                            name="newPassword"
                            value={passwordData.newPassword}
                            onChange={handlePasswordInputChange}
                            className="w-full pl-3 pr-10 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary"
                            required
                          />
                          <button 
                            type="button" 
                            className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                            onClick={() => togglePasswordVisibility('newPassword')}
                          >
                            <i className={`fas fa-${passwordVisibility.newPassword ? 'eye-slash' : 'eye'}`}></i>
                          </button>
                        </div>
                        {passwordErrors.newPassword && <div className="text-red-600 text-sm mt-1">{passwordErrors.newPassword}</div>}
                        <p className="text-xs text-gray-500">Mật khẩu phải có ít nhất 6 ký tự</p>
                      </div>

                      <div className="space-y-2">
                        <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">Xác nhận mật khẩu mới</label>
                        <div className="relative">
                          <input
                            type={passwordVisibility.confirmPassword ? "text" : "password"}
                            id="confirmPassword"
                            name="confirmPassword"
                            value={passwordData.confirmPassword}
                            onChange={handlePasswordInputChange}
                            className="w-full pl-3 pr-10 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary"
                            required
                          />
                          <button 
                            type="button" 
                            className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                            onClick={() => togglePasswordVisibility('confirmPassword')}
                          >
                            <i className={`fas fa-${passwordVisibility.confirmPassword ? 'eye-slash' : 'eye'}`}></i>
                          </button>
                        </div>
                        {passwordErrors.confirmPassword && <div className="text-red-600 text-sm mt-1">{passwordErrors.confirmPassword}</div>}
                      </div>

                      <button 
                        type="submit" 
                        className="bg-primary hover:bg-primary-dark text-white px-6 py-2 rounded-lg transition-colors font-medium disabled:opacity-50"
                        disabled={loading}
                      >
                        {loading ? 'Đang xử lý...' : 'Đổi mật khẩu'}
                      </button>
                    </form>
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
