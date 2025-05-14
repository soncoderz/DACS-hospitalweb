import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { FaFileMedical, FaFileMedicalAlt, FaEdit, FaSave, FaTimes, FaNotesMedical, FaPills, FaUserMd, FaArrowLeft, FaCalendarCheck, FaHospital, FaStethoscope, FaRegClipboard, FaClock, FaEye, FaPhone, FaEnvelope, FaMapMarkerAlt, FaPlus } from 'react-icons/fa';
import { toast, ToastContainer } from 'react-toastify';

import api from '../../utils/api';


const MedicalRecords = () => {
  const { patientId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const [patient, setPatient] = useState(null);
  const [medicalRecords, setMedicalRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentRecord, setCurrentRecord] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [patientList, setPatientList] = useState([]);
  const [error, setError] = useState(null);
  
  // Form data for new/edit record
  const [formData, setFormData] = useState({
    diagnosis: '',
    treatment: '',
    prescription: [{ medicine: '', dosage: '', usage: '', duration: '', notes: '' }],
    notes: '',
    appointmentId: ''
  });

  // Extract appointmentId from URL if present
  useEffect(() => {
    const queryParams = new URLSearchParams(location.search);
    const appointmentId = queryParams.get('appointmentId');
    if (appointmentId) {
      setFormData(prev => ({ ...prev, appointmentId }));
      setShowForm(true);
    }
  }, [location]);

  useEffect(() => {
    if (!patientId) {
      fetchPatientList();
      setLoading(false); // Dừng loading khi không có patientId
    } else {
      // Nếu có patientId, tải dữ liệu
      fetchPatientData();
      fetchMedicalRecords();
    }
  }, [patientId]);

  const fetchPatientData = async () => {
    try {
      const response = await api.get(`/doctors/patients/${patientId}`);
      console.log("Patient data response:", response.data);
      
      if (response.data.success) {
        setPatient(response.data.data);
      } else {
        setError('Không thể tải thông tin bệnh nhân');
      }
    } catch (error) {
      console.error('Error fetching patient data:', error.response?.data || error.message);
      setError('Lỗi khi tải thông tin bệnh nhân');
    }
  };

  const fetchMedicalRecords = async () => {
    setLoading(true);
    try {
      console.log(`Đang gọi API: /doctors/patients/${patientId}/medical-records`);
      const response = await api.get(`/doctors/patients/${patientId}/medical-records`);
      console.log("Medical records response:", response.data);
      
      if (response.data.success) {
        setMedicalRecords(response.data.data || []);
        
        // Cập nhật dữ liệu bệnh nhân nếu có từ API
        if (response.data.patient) {
          setPatient(response.data.patient);
        }
        
        // Check for appointmentId in query params
        const queryParams = new URLSearchParams(location.search);
        const appointmentId = queryParams.get('appointmentId');
        
        if (appointmentId) {
          const existingRecord = response.data.data.find(
            record => record.appointmentId?._id === appointmentId
          );
          
          if (existingRecord) {
            setCurrentRecord(existingRecord);
            populateFormData(existingRecord);
            setIsEditing(true);
          }
        } else if (response.data.data.length > 0) {
          // Nếu có hồ sơ và không có appointmentId, mặc định chọn hồ sơ mới nhất
          const latestRecord = response.data.data[0];
          setCurrentRecord(latestRecord);
        }
      } else {
        console.error('Failed to fetch medical records:', response.data.message);
        setError(`Không thể tải hồ sơ y tế: ${response.data.message || 'Vui lòng thử lại sau'}`);
      }
    } catch (error) {
      console.error('Error fetching medical records:', error);
      setError(`Lỗi khi tải hồ sơ y tế: ${error.response?.data?.message || error.message || 'Vui lòng thử lại sau'}`);
    } finally {
      setLoading(false);
    }
  };

  const populateFormData = (record) => {
    setFormData({
      diagnosis: record.diagnosis || '',
      treatment: record.treatment || '',
      prescription: record.prescription && record.prescription.length > 0 
        ? record.prescription 
        : [{ medicine: '', dosage: '', usage: '', duration: '', notes: '' }],
      notes: record.notes || '',
      appointmentId: record.appointmentId?._id || ''
    });
  };

  const resetForm = () => {
    setFormData({
      diagnosis: '',
      treatment: '',
      prescription: [{ medicine: '', dosage: '', usage: '', duration: '', notes: '' }],
      notes: '',
      appointmentId: ''
    });
    setCurrentRecord(null);
    setIsEditing(false);
  };

  const handleSelectRecord = (record) => {
    setCurrentRecord(record);
    setIsEditing(false);
    setShowForm(false); // Đóng form nếu đang mở
  };

  const handleEditRecord = () => {
    populateFormData(currentRecord);
    setIsEditing(true);
    setShowForm(true);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handlePrescriptionChange = (index, field, value) => {
    const updatedPrescription = [...formData.prescription];
    updatedPrescription[index] = { 
      ...updatedPrescription[index], 
      [field]: value 
    };
    setFormData({ ...formData, prescription: updatedPrescription });
  };

  const addPrescriptionItem = () => {
    setFormData({
      ...formData,
      prescription: [
        ...formData.prescription,
        { medicine: '', dosage: '', usage: '', duration: '', notes: '' }
      ]
    });
  };

  const removePrescriptionItem = (index) => {
    if (formData.prescription.length > 1) {
      const updatedPrescription = [...formData.prescription];
      updatedPrescription.splice(index, 1);
      setFormData({ ...formData, prescription: updatedPrescription });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate form data
    if (!formData.diagnosis.trim()) {
      toast.warning('Vui lòng nhập chẩn đoán');
      return;
    }
    
    // Filter out empty prescription items
    const filteredPrescription = formData.prescription.filter(item => item.medicine.trim() !== '');
    
    const recordData = {
      ...formData,
      patientId,
      prescription: filteredPrescription
    };
    
    try {
      toast.info('Đang lưu hồ sơ y tế...', { autoClose: 2000 });
      let response;
      
      if (isEditing && currentRecord) {
        response = await api.put(`/doctors/medical-records/${currentRecord._id}`, recordData);
      } else {
        response = await api.post('/doctors/medical-records', recordData);
      }
      
      console.log("Save medical record response:", response.data);
      
      if (response.data.success) {
        // Refresh medical records list
        fetchMedicalRecords();
        
        // If the record is connected to an appointment, mark the appointment as completed
        if (formData.appointmentId) {
          try {
            const completeResponse = await api.put(`/appointments/${formData.appointmentId}/complete`);
            if (completeResponse.data.success) {
              console.log('Appointment marked as completed');
              toast.success('Lịch hẹn đã được đánh dấu hoàn thành');
            }
          } catch (err) {
            console.error('Error completing appointment:', err);
            toast.error('Lưu ý: Không thể cập nhật trạng thái lịch hẹn');
          }
        }
        
        // Reset form
        resetForm();
        setShowForm(false);
        
        // Show success message
        toast.success(isEditing ? 'Hồ sơ y tế đã được cập nhật thành công' : 'Hồ sơ y tế đã được tạo thành công');
      } else {
        console.error('Failed to save medical record:', response.data.message);
        toast.error(response.data.message || 'Không thể lưu hồ sơ y tế');
      }
    } catch (error) {
      console.error('Error saving medical record:', error.response?.data || error.message);
      toast.error('Đã xảy ra lỗi khi lưu hồ sơ y tế');
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('vi-VN', {
      year: 'numeric',
      month: 'numeric',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  const formatDateOnly = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('vi-VN', {
      year: 'numeric',
      month: 'numeric',
      day: 'numeric',
    }).format(date);
  };

  const fetchPatientList = async () => {
    try {
      setLoading(true);
      const response = await api.get('/doctors/patients');
      if (response.data.success) {
        setPatientList(response.data.data || []);
      } else {
        setError('Không thể tải danh sách bệnh nhân');
      }
    } catch (error) {
      console.error('Error fetching patients list:', error);
      setError('Lỗi khi tải danh sách bệnh nhân');
    } finally {
      setLoading(false);
    }
  };

  // Khi không có ID bệnh nhân, chuyển hướng về trang danh sách bệnh nhân
  if (!patientId) {
    navigate('/doctor/patients');
    return null;
  }

  if (loading && !patient) {
    return (
      <div className="flex items-center justify-center min-h-[70vh]">
        <div className="text-center">
          <div className="inline-block w-12 h-12 border-4 border-primary/30 border-l-primary rounded-full animate-spin mb-4"></div>
          <p className="text-gray-600">Đang tải dữ liệu...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="bg-white rounded-xl shadow-md p-8 text-center">
          <div className="text-red-500 text-5xl mb-4">
            <FaTimes className="mx-auto" />
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Đã xảy ra lỗi</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <div className="flex flex-wrap justify-center gap-4">
            <button 
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
              onClick={() => {
                setError(null);
                setLoading(true);
                fetchPatientData();
                fetchMedicalRecords();
              }}
            >
              Thử lại
            </button>
            <button 
              className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors"
              onClick={() => navigate('/doctor/patients')}
            >
              Quay lại danh sách
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <ToastContainer position="top-right" autoClose={3000} hideProgressBar={false} />
      
      {/* Page Header */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <div className="bg-gradient-to-r from-primary-dark to-primary p-4 sm:p-6 text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <button 
                className="mr-3 sm:mr-4 bg-white/20 hover:bg-white/30 p-2 rounded-full transition-colors"
                onClick={() => navigate('/doctor/patients')}
              >
                <FaArrowLeft className="text-lg" />
              </button>
              <h1 className="text-xl sm:text-2xl font-bold">Hồ sơ y tế</h1>
            </div>
            <button 
              onClick={() => {
                resetForm();
                setShowForm(true);
              }}
              className="flex items-center gap-2 bg-white/20 hover:bg-white/30 px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg transition-all duration-200 hover:shadow-lg text-sm sm:text-base"
            >
              <FaFileMedical /> <span className="hidden sm:inline">Tạo hồ sơ mới</span>
            </button>
          </div>
        </div>
      </div>
      
      {/* Patient Info Card */}
      {patient && (
        <div className="bg-white rounded-xl shadow-md hover:shadow-lg transition-all duration-300 overflow-hidden">
          <div className="p-4 sm:p-6 flex flex-col md:flex-row items-start gap-4 sm:gap-6">
            <div className="w-20 h-20 sm:w-24 sm:h-24 md:w-28 md:h-28 rounded-full overflow-hidden border-4 border-primary/30 flex-shrink-0 shadow-lg bg-gray-50 transform hover:scale-105 transition-transform duration-300 mx-auto md:mx-0">
              <img
                src={patient.avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(patient.fullName || 'User')}&background=1AC0FF&color=fff`} 
                alt={patient.fullName}
                className="w-full h-full object-cover"
                onError={(e) => {
                  e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(patient.fullName || 'User')}&background=1AC0FF&color=fff`;
                }}
              />
            </div>
            
            <div className="flex-1 min-w-0 text-center md:text-left">
              <h2 className="text-xl sm:text-2xl font-bold text-gray-800 mb-3 flex flex-col md:flex-row md:items-center">
                <span className="truncate">{patient.fullName}</span>
                <span className={`mt-2 md:mt-0 md:ml-3 inline-block px-2.5 py-1 text-xs rounded-full ${
                  patient.gender === 'male' ? 'bg-blue-100 text-blue-800' : 
                  patient.gender === 'female' ? 'bg-pink-100 text-pink-800' : 
                  'bg-gray-100 text-gray-800'
                }`}>
                  {patient.gender === 'male' ? 'Nam' : 
                   patient.gender === 'female' ? 'Nữ' : 'Khác'}
                </span>
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-x-4 sm:gap-x-8 gap-y-2 sm:gap-y-3">
                <div className="flex items-center text-gray-600 justify-center md:justify-start">
                  <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-blue-50 flex items-center justify-center mr-2 sm:mr-3 flex-shrink-0">
                    <FaUserMd className="text-primary" />
                  </div>
                  <div>
                    <div className="text-xs sm:text-sm text-gray-500">Giới tính</div>
                    <div className="font-medium text-sm sm:text-base">{
                      patient.gender === 'male' ? 'Nam' : 
                      patient.gender === 'female' ? 'Nữ' : 
                      'Khác'
                    }</div>
                  </div>
                </div>
                
                <div className="flex items-center text-gray-600 justify-center md:justify-start">
                  <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-blue-50 flex items-center justify-center mr-2 sm:mr-3 flex-shrink-0">
                    <FaClock className="text-primary" />
                  </div>
                  <div>
                    <div className="text-xs sm:text-sm text-gray-500">Ngày sinh</div>
                    <div className="font-medium text-sm sm:text-base">{patient.dateOfBirth ? formatDateOnly(patient.dateOfBirth) : 'N/A'}</div>
                  </div>
                </div>
                
                <div className="flex items-center text-gray-600 justify-center md:justify-start">
                  <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-blue-50 flex items-center justify-center mr-2 sm:mr-3 flex-shrink-0">
                    <FaPhone className="text-primary" />
                  </div>
                  <div>
                    <div className="text-xs sm:text-sm text-gray-500">Điện thoại</div>
                    <div className="font-medium text-sm sm:text-base">{patient.phoneNumber || 'N/A'}</div>
                  </div>
                </div>
                
                <div className="flex items-center text-gray-600 justify-center md:justify-start">
                  <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-blue-50 flex items-center justify-center mr-2 sm:mr-3 flex-shrink-0">
                    <FaEnvelope className="text-primary" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-xs sm:text-sm text-gray-500">Email</div>
                    <div className="font-medium text-sm sm:text-base truncate">{patient.email}</div>
                  </div>
                </div>
                
                <div className="flex items-center text-gray-600 md:col-span-2 justify-center md:justify-start">
                  <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-blue-50 flex items-center justify-center mr-2 sm:mr-3 flex-shrink-0">
                    <FaMapMarkerAlt className="text-primary" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-xs sm:text-sm text-gray-500">Địa chỉ</div>
                    <div className="font-medium text-sm sm:text-base truncate">{patient.address || 'N/A'}</div>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="flex flex-row md:flex-col gap-3 mt-4 md:mt-0 w-full md:w-auto justify-center">
              <button 
                className="flex items-center gap-2 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white px-3 sm:px-4 py-2 rounded-lg shadow-sm hover:shadow-md transition-all text-sm sm:text-base"
                onClick={() => {
                  resetForm();
                  setShowForm(true);
                }}
              >
                <FaFileMedical /> <span className="hidden sm:inline">Tạo hồ sơ mới</span>
              </button>
              <button 
                className="flex items-center gap-2 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white px-3 sm:px-4 py-2 rounded-lg shadow-sm hover:shadow-md transition-all text-sm sm:text-base"
                onClick={() => navigate(`/doctor/appointments/create?patientId=${patientId}`)}
              >
                <FaCalendarCheck /> <span className="hidden sm:inline">Tạo lịch hẹn</span>
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Records Container */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
        {/* Records Sidebar */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="bg-gradient-to-r from-indigo-500 to-indigo-600 p-4 text-white">
            <h3 className="flex items-center text-base sm:text-lg font-semibold">
              <FaFileMedicalAlt className="mr-2" /> Danh sách hồ sơ
              <span className="ml-2 bg-white/20 text-white text-xs py-1 px-2 rounded-full">
                {medicalRecords.length}
              </span>
            </h3>
          </div>
          
          {medicalRecords.length === 0 ? (
            <div className="p-8 text-center">
              <div className="w-16 h-16 rounded-full bg-indigo-50 flex items-center justify-center mx-auto mb-4">
                <FaFileMedicalAlt className="text-2xl text-indigo-500" />
              </div>
              <p className="text-gray-600 mb-4">Không có hồ sơ y tế</p>
              <button 
                className="inline-flex items-center justify-center gap-2 bg-gradient-to-r from-indigo-500 to-indigo-600 hover:from-indigo-600 hover:to-indigo-700 text-white px-4 py-2 rounded-lg shadow-sm hover:shadow-md transition-all"
                onClick={() => {
                  resetForm();
                  setShowForm(true);
                }}
              >
                <FaFileMedical /> Tạo hồ sơ đầu tiên
              </button>
            </div>
          ) : (
            <div className="divide-y divide-gray-100 max-h-[500px] overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent">
              {medicalRecords.map((record) => (
                <div 
                  key={record._id} 
                  className={`p-4 cursor-pointer transition-colors hover:bg-gray-50 ${currentRecord && currentRecord._id === record._id ? 'bg-indigo-50 border-l-4 border-indigo-500' : ''}`}
                  onClick={() => handleSelectRecord(record)}
                >
                  <div className="flex items-center mb-2 text-sm text-gray-500">
                    <FaClock className="mr-1.5 text-indigo-500" /> 
                    {formatDate(record.createdAt)}
                  </div>
                  <div className="font-medium text-gray-800 mb-1 line-clamp-1">
                    <FaStethoscope className="inline-block mr-1.5 text-indigo-500" /> 
                    {record.diagnosis || 'Không có chẩn đoán'}
                  </div>
                  {record.appointmentId && (
                    <div className="flex items-center text-xs text-gray-500 mt-2 bg-indigo-50 rounded-full px-2 py-1 w-fit">
                      <FaCalendarCheck className="mr-1.5 text-indigo-400" /> 
                      {formatDateOnly(record.appointmentId.appointmentDate)}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
        
        {/* Record Detail */}
        <div className="md:col-span-2 bg-white rounded-xl shadow-sm overflow-hidden">
          {!currentRecord && !showForm ? (
            <div className="p-8 text-center">
              <div className="w-20 h-20 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
                <FaFileMedicalAlt className="text-3xl text-gray-400" />
              </div>
              <h3 className="text-xl font-bold text-gray-800 mb-2">Chưa chọn hồ sơ</h3>
              <p className="text-gray-600 mb-6 max-w-md mx-auto">Vui lòng chọn một hồ sơ y tế từ danh sách bên trái hoặc tạo hồ sơ mới</p>
              <button 
                className="inline-flex items-center justify-center gap-2 bg-gradient-to-r from-primary to-primary-dark hover:from-primary-dark hover:to-primary text-white px-5 py-2.5 rounded-lg shadow-sm hover:shadow-md transition-all"
                onClick={() => {
                  resetForm();
                  setShowForm(true);
                }}
              >
                <FaFileMedical /> Tạo hồ sơ mới
              </button>
            </div>
          ) : showForm ? (
            <div className="bg-white rounded-lg shadow-sm overflow-hidden">
              <div className="bg-gradient-to-r from-blue-500 to-blue-600 px-6 py-4 text-white flex justify-between items-center">
                <h3 className="text-lg font-semibold flex items-center">
                  {isEditing ? <FaEdit className="mr-2" /> : <FaFileMedical className="mr-2" />}
                  {isEditing ? 'Cập nhật hồ sơ y tế' : 'Tạo hồ sơ y tế mới'}
                </h3>
                <button 
                  className="text-white hover:bg-white/20 p-1.5 rounded-full transition-colors"
                  onClick={() => {
                    setShowForm(false);
                    if (currentRecord) {
                      setIsEditing(false);
                    }
                  }}
                >
                  <FaTimes className="text-lg" />
                </button>
              </div>
              
              <form onSubmit={handleSubmit} className="p-6 space-y-6">
                <div className="space-y-3">
                  <label htmlFor="diagnosis" className="block text-sm font-medium text-gray-700 flex items-center">
                    <FaUserMd className="mr-2 text-primary" /> Chẩn đoán:
                  </label>
                  <textarea
                    id="diagnosis"
                    name="diagnosis"
                    value={formData.diagnosis}
                    onChange={handleInputChange}
                    placeholder="Nhập chẩn đoán..."
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent min-h-[100px]"
                  />
                </div>
                
                <div className="space-y-3">
                  <label htmlFor="treatment" className="block text-sm font-medium text-gray-700 flex items-center">
                    <FaNotesMedical className="mr-2 text-primary" /> Phương pháp điều trị:
                  </label>
                  <textarea
                    id="treatment"
                    name="treatment"
                    value={formData.treatment}
                    onChange={handleInputChange}
                    placeholder="Nhập phương pháp điều trị..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent min-h-[100px]"
                  />
                </div>
                
                <div className="space-y-3">
                  <label className="block text-sm font-medium text-gray-700 flex items-center">
                    <FaPills className="mr-2 text-primary" /> Đơn thuốc:
                  </label>
                  
                  <div className="space-y-4">
                    {formData.prescription.map((item, index) => (
                      <div key={index} className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                          <div className="space-y-2">
                            <label className="block text-xs font-medium text-gray-700">Thuốc:</label>
                            <input
                              type="text"
                              value={item.medicine}
                              onChange={(e) => handlePrescriptionChange(index, 'medicine', e.target.value)}
                              placeholder="Tên thuốc"
                              required
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                            />
                          </div>
                          
                          <div className="space-y-2">
                            <label className="block text-xs font-medium text-gray-700">Liều lượng:</label>
                            <input
                              type="text"
                              value={item.dosage}
                              onChange={(e) => handlePrescriptionChange(index, 'dosage', e.target.value)}
                              placeholder="Liều lượng"
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                            />
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                          <div className="space-y-2">
                            <label className="block text-xs font-medium text-gray-700">Cách dùng:</label>
                            <input
                              type="text"
                              value={item.usage}
                              onChange={(e) => handlePrescriptionChange(index, 'usage', e.target.value)}
                              placeholder="Cách dùng"
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                            />
                          </div>
                          
                          <div className="space-y-2">
                            <label className="block text-xs font-medium text-gray-700">Thời gian:</label>
                            <input
                              type="text"
                              value={item.duration}
                              onChange={(e) => handlePrescriptionChange(index, 'duration', e.target.value)}
                              placeholder="Thời gian dùng"
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                            />
                          </div>
                        </div>
                        
                        <div className="space-y-2">
                          <label className="block text-xs font-medium text-gray-700">Ghi chú:</label>
                          <input
                            type="text"
                            value={item.notes}
                            onChange={(e) => handlePrescriptionChange(index, 'notes', e.target.value)}
                            placeholder="Ghi chú thêm"
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                          />
                        </div>
                        
                        <button
                          type="button"
                          className="mt-3 px-3 py-1.5 text-sm bg-red-50 text-red-500 rounded-md hover:bg-red-100 transition-colors flex items-center"
                          onClick={() => removePrescriptionItem(index)}
                          disabled={formData.prescription.length <= 1}
                        >
                          <FaTimes className="mr-1.5" /> Xóa
                        </button>
                      </div>
                    ))}
                    
                    <button
                      type="button"
                      className="w-full py-2 px-4 bg-blue-50 text-blue-600 rounded-md hover:bg-blue-100 transition-colors flex items-center justify-center"
                      onClick={addPrescriptionItem}
                    >
                      <FaPlus className="mr-2" /> Thêm thuốc
                    </button>
                  </div>
                </div>
                
                <div className="space-y-3">
                  <label htmlFor="notes" className="block text-sm font-medium text-gray-700 flex items-center">
                    <FaRegClipboard className="mr-2 text-primary" /> Ghi chú:
                  </label>
                  <textarea
                    id="notes"
                    name="notes"
                    value={formData.notes}
                    onChange={handleInputChange}
                    placeholder="Thêm ghi chú..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent min-h-[80px]"
                  />
                </div>
                
                <div className="flex justify-end space-x-4 pt-4 border-t border-gray-200">
                  <button
                    type="button"
                    className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors flex items-center"
                    onClick={() => {
                      setShowForm(false);
                      if (currentRecord) {
                        setIsEditing(false);
                      }
                    }}
                  >
                    <FaTimes className="mr-2" /> Hủy
                  </button>
                  
                  <button 
                    type="submit" 
                    className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary-dark transition-colors shadow hover:shadow-md flex items-center"
                  >
                    <FaSave className="mr-2" /> {isEditing ? 'Cập nhật' : 'Lưu'}
                  </button>
                </div>
              </form>
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow-sm overflow-hidden">
              <div className="bg-gradient-to-r from-indigo-500 to-indigo-600 px-6 py-4 text-white flex justify-between items-center">
                <h2 className="text-lg font-semibold flex items-center">
                  <FaFileMedical className="mr-2" /> Chi tiết hồ sơ y tế
                </h2>
                <div className="flex items-center space-x-4">
                  <div className="text-sm flex items-center">
                    <FaClock className="mr-1.5" /> {formatDate(currentRecord.createdAt)}
                  </div>
                  <button 
                    className="bg-white/20 hover:bg-white/30 text-white px-3 py-1.5 rounded-lg transition-colors text-sm flex items-center"
                    onClick={handleEditRecord}
                  >
                    <FaEdit className="mr-1.5" /> Chỉnh sửa
                  </button>
                </div>
              </div>
              
              <div className="p-6 space-y-6">
                <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                  <h3 className="text-md font-semibold text-gray-800 mb-3">Thông tin lịch hẹn</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {currentRecord.appointmentId ? (
                      <>
                        <div>
                          <div className="text-sm text-gray-500 flex items-center"><FaCalendarCheck className="mr-1.5 text-indigo-500" /> Mã lịch hẹn:</div>
                          <div className="font-medium text-gray-800">
                            {currentRecord.appointmentId.bookingCode || 'N/A'}
                          </div>
                        </div>
                        <div>
                          <div className="text-sm text-gray-500 flex items-center"><FaClock className="mr-1.5 text-indigo-500" /> Ngày khám:</div>
                          <div className="font-medium text-gray-800">
                            {formatDate(currentRecord.appointmentId.appointmentDate)}
                          </div>
                        </div>
                        <div>
                          <div className="text-sm text-gray-500 flex items-center"><FaStethoscope className="mr-1.5 text-indigo-500" /> Dịch vụ:</div>
                          <div className="font-medium text-gray-800">
                            {currentRecord.appointmentId.serviceId?.name || 'Khám thông thường'}
                          </div>
                        </div>
                        <div>
                          <div className="text-sm text-gray-500 flex items-center"><FaRegClipboard className="mr-1.5 text-indigo-500" /> Triệu chứng:</div>
                          <div className="font-medium text-gray-800">
                            {currentRecord.appointmentId.symptoms || 'Không có'}
                          </div>
                        </div>
                        <div className="md:col-span-2">
                          <button 
                            className="px-4 py-2 bg-indigo-50 text-indigo-700 rounded-md hover:bg-indigo-100 transition-colors flex items-center"
                            onClick={() => navigate(`/doctor/appointments/${currentRecord.appointmentId._id}`)}
                          >
                            <FaEye className="mr-2" /> Xem chi tiết lịch hẹn
                          </button>
                        </div>
                      </>
                    ) : (
                      <div className="md:col-span-2 text-center py-4 text-gray-500">Không có thông tin lịch hẹn</div>
                    )}
                  </div>
                </div>
                
                <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                  <h3 className="text-md font-semibold text-gray-800 mb-3">Thông tin bác sĩ và cơ sở y tế</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {currentRecord.doctorId && currentRecord.doctorId.user && (
                      <div>
                        <div className="text-sm text-gray-500 flex items-center"><FaUserMd className="mr-1.5 text-indigo-500" /> Bác sĩ:</div>
                        <div className="font-medium text-gray-800">
                          {currentRecord.doctorId.title || ''} {currentRecord.doctorId.user.fullName || 'N/A'}
                        </div>
                      </div>
                    )}
                    
                    {/* Hospital Information */}
                    {currentRecord.doctorId && currentRecord.doctorId.hospitalId && (
                      <div>
                        <div className="text-sm text-gray-500 flex items-center"><FaHospital className="mr-1.5 text-indigo-500" /> Bệnh viện:</div>
                        <div className="font-medium text-gray-800">
                          {currentRecord.doctorId.hospitalId.name || 'N/A'}
                          {currentRecord.doctorId.hospitalId.address && (
                            <div className="text-sm text-gray-500 mt-0.5">{currentRecord.doctorId.hospitalId.address}</div>
                          )}
                        </div>
                      </div>
                    )}
                    
                    {/* Specialty Information */}
                    {currentRecord.doctorId && currentRecord.doctorId.specialtyId && (
                      <div>
                        <div className="text-sm text-gray-500 flex items-center"><FaStethoscope className="mr-1.5 text-indigo-500" /> Chuyên khoa:</div>
                        <div className="font-medium text-gray-800">
                          {currentRecord.doctorId.specialtyId.name || 'N/A'}
                          {currentRecord.doctorId.specialtyId.description && (
                            <div className="text-sm text-gray-500 mt-0.5">{currentRecord.doctorId.specialtyId.description}</div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                  <h3 className="text-md font-semibold text-gray-800 mb-3">Thông tin y tế</h3>
                  <div className="space-y-4">
                    <div>
                      <div className="text-sm text-gray-500 flex items-center"><FaStethoscope className="mr-1.5 text-indigo-500" /> Chẩn đoán:</div>
                      <div className="mt-1 p-3 bg-white rounded border border-gray-200 text-gray-800">{currentRecord.diagnosis || 'Không có'}</div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-500 flex items-center"><FaNotesMedical className="mr-1.5 text-indigo-500" /> Phương pháp điều trị:</div>
                      <div className="mt-1 p-3 bg-white rounded border border-gray-200 text-gray-800 whitespace-pre-line">{currentRecord.treatment || 'Không có'}</div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-500 flex items-center"><FaRegClipboard className="mr-1.5 text-indigo-500" /> Ghi chú:</div>
                      <div className="mt-1 p-3 bg-white rounded border border-gray-200 text-gray-800 whitespace-pre-line">{currentRecord.notes || 'Không có'}</div>
                    </div>
                  </div>
                </div>
                
                <div className="bg-white p-4 rounded-lg border border-gray-200">
                  <h3 className="text-md font-semibold text-gray-800 mb-3 flex items-center"><FaPills className="mr-2 text-indigo-500" /> Đơn thuốc</h3>
                  {currentRecord.prescription && currentRecord.prescription.length > 0 ? (
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tên thuốc</th>
                            <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Liều lượng</th>
                            <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cách dùng</th>
                            <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Thời gian dùng</th>
                            <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ghi chú</th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {currentRecord.prescription.map((med, index) => (
                            <tr key={index}>
                              <td className="px-4 py-3 whitespace-nowrap">
                                <div className="font-medium text-gray-900">{med.medicine || 'N/A'}</div>
                              </td>
                              <td className="px-4 py-3 whitespace-nowrap text-gray-700">{med.dosage || 'N/A'}</td>
                              <td className="px-4 py-3 whitespace-nowrap text-gray-700">{med.usage || 'N/A'}</td>
                              <td className="px-4 py-3 whitespace-nowrap text-gray-700">{med.duration || 'N/A'}</td>
                              <td className="px-4 py-3 whitespace-nowrap text-gray-700">{med.notes || 'N/A'}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <p className="text-center py-6 text-gray-500">Không có đơn thuốc</p>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MedicalRecords;
