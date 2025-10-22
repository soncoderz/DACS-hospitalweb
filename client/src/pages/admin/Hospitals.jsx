import React, { useState, useEffect } from 'react';
import api from '../../utils/api';
import { FaPlus, FaEdit, FaTrash, FaSearch, FaFilter, FaDownload, FaMapMarkerAlt, FaImage, FaTimes, FaExclamationCircle, FaHospital, FaPhone, FaFileAlt, FaInfoCircle, FaCamera, FaList } from 'react-icons/fa';
import { toast } from 'react-toastify';


const Hospitals = () => {
  const [hospitals, setHospitals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState({
    status: 'all'  // used for isActive filtering
  });
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    pageSize: 10
  });
  const [selectedHospital, setSelectedHospital] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalType, setModalType] = useState('');
  const [specialties, setSpecialties] = useState([]);
  const [facilityInput, setFacilityInput] = useState('');
  const [mainHospitals, setMainHospitals] = useState([]);
  const [formData, setFormData] = useState({
    name: '',
    address: '',
    contactInfo: {
      phone: '',
      email: '',
      website: ''
    },
    description: '',
    workingHours: {
      monday: { open: '08:00', close: '17:00', isOpen: true },
      tuesday: { open: '08:00', close: '17:00', isOpen: true },
      wednesday: { open: '08:00', close: '17:00', isOpen: true },
      thursday: { open: '08:00', close: '17:00', isOpen: true },
      friday: { open: '08:00', close: '17:00', isOpen: true },
      saturday: { open: '08:00', close: '12:00', isOpen: true },
      sunday: { open: null, close: null, isOpen: false }
    },
    specialties: [],
    facilities: [],
    location: {
      coordinates: [0, 0]
    },
    isActive: true,
    isMainHospital: false,
    parentHospital: null
  });
  const [selectedImage, setSelectedImage] = useState(null);
  const [loadingAction, setLoadingAction] = useState(false);
  const [previewImage, setPreviewImage] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);

  useEffect(() => {
    fetchData();
    fetchSpecialties();
    fetchMainHospitals();
  }, [pagination.currentPage, filter]);

  const fetchData = async () => {
    setLoading(true);
    try {
      let apiUrl = `/admin/hospitals?page=${pagination.currentPage}&limit=${pagination.pageSize}&search=${searchTerm}`;
      
      // Add isActive parameter based on status filter
      if (filter.status === 'active') {
        apiUrl += '&isActive=true';
      } else if (filter.status === 'inactive') {
        apiUrl += '&isActive=false';
      }
      
      const res = await api.get(apiUrl);
      if (res.data.success) {
        const { hospitals, total, totalPages, currentPage } = res.data.data;
        setHospitals(hospitals || []);
        setPagination({
          ...pagination,
          totalPages: totalPages || Math.ceil(total / pagination.pageSize),
          currentPage: currentPage || pagination.currentPage
        });
      } else {
        setHospitals([]);
        toast.error(res.data.message || 'Không thể tải dữ liệu cơ sở y tế');
      }
    } catch (error) {
      console.error('Error fetching hospitals:', error);
      toast.error('Không thể tải dữ liệu cơ sở y tế');
      setHospitals([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchSpecialties = async () => {
    try {
      const res = await api.get('/admin/specialties');
      if (res.data.success) {
        if (res.data.data && Array.isArray(res.data.data)) {
          setSpecialties(res.data.data);
        } else if (res.data.data && res.data.data.specialties && Array.isArray(res.data.data.specialties)) {
          setSpecialties(res.data.data.specialties);
        } else {
          console.error('No specialties found in response:', res.data);
          setSpecialties([]);
        }
      } else {
        console.error('Failed to fetch specialties:', res.data);
        setSpecialties([]);
      }
    } catch (error) {
      console.error('Error fetching specialties:', error);
      setSpecialties([]);
    }
  };

  const fetchMainHospitals = async () => {
    try {
      // Fetch all hospitals and filter client-side instead of using a query parameter
      const res = await api.get('/admin/hospitals?limit=100');
      if (res.data.success) {
        let hospitals = [];
        if (res.data.data && res.data.data.hospitals) {
          hospitals = res.data.data.hospitals;
        } else if (Array.isArray(res.data.data)) {
          hospitals = res.data.data;
        }
        
        // Filter main hospitals client-side
        const mainHospitalsList = hospitals.filter(hospital => 
          hospital.isMainHospital === true
        );
        
        setMainHospitals(mainHospitalsList);
      } else {
        console.error('Failed to fetch hospitals:', res.data);
        setMainHospitals([]);
      }
    } catch (error) {
      console.error('Error fetching hospitals:', error);
      setMainHospitals([]);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    setPagination({ ...pagination, currentPage: 1 });
    fetchData();
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilter({ ...filter, [name]: value });
    setPagination({ ...pagination, currentPage: 1 });
  };

  const handlePageChange = (newPage) => {
    if (newPage > 0 && newPage <= pagination.totalPages) {
      setPagination({ ...pagination, currentPage: newPage });
    }
  };

  const openModal = (type, hospital = null) => {
    setModalType(type);
    setSelectedHospital(hospital);
    
    if (type === 'add') {
      setFormData({
        name: '',
        address: '',
        contactInfo: {
          phone: '',
          email: '',
          website: ''
        },
        description: '',
        workingHours: {
          monday: { open: '08:00', close: '17:00', isOpen: true },
          tuesday: { open: '08:00', close: '17:00', isOpen: true },
          wednesday: { open: '08:00', close: '17:00', isOpen: true },
          thursday: { open: '08:00', close: '17:00', isOpen: true },
          friday: { open: '08:00', close: '17:00', isOpen: true },
          saturday: { open: '08:00', close: '12:00', isOpen: true },
          sunday: { open: null, close: null, isOpen: false }
        },
        specialties: [],
        facilities: [],
        location: {
          coordinates: [0, 0]
        },
        isActive: true,
        isMainHospital: false,
        parentHospital: null
      });
    } else if (type === 'edit' && hospital) {
      // Create a deep copy of the hospital object for form data
      setFormData({
        name: hospital.name || '',
        address: hospital.address || '',
        contactInfo: {
          phone: hospital.contactInfo?.phone || '',
          email: hospital.contactInfo?.email || '',
          website: hospital.contactInfo?.website || ''
        },
        description: hospital.description || '',
        workingHours: hospital.workingHours || {
          monday: { open: '08:00', close: '17:00', isOpen: true },
          tuesday: { open: '08:00', close: '17:00', isOpen: true },
          wednesday: { open: '08:00', close: '17:00', isOpen: true },
          thursday: { open: '08:00', close: '17:00', isOpen: true },
          friday: { open: '08:00', close: '17:00', isOpen: true },
          saturday: { open: '08:00', close: '12:00', isOpen: true },
          sunday: { open: null, close: null, isOpen: false }
        },
        specialties: hospital.specialties || [],
        facilities: hospital.facilities || [],
        location: hospital.location || {
          coordinates: [0, 0]
        },
        isActive: hospital.isActive !== undefined ? hospital.isActive : true,
        isMainHospital: hospital.isMainHospital || false,
        parentHospital: hospital.parentHospital || null
      });
    } else if (type === 'image') {
      setSelectedImage(null);
    }
    
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedHospital(null);
    setModalType('');
    setSelectedImage(null);
    setFacilityInput('');
    setPreviewImage(null);
    setSelectedFile(null);
  };

  const handleDeleteHospital = async (hospitalId) => {
    try {
      setLoadingAction(true);
      const res = await api.delete(`/admin/hospitals/${hospitalId}`);
      if (res.data.success) {
        toast.success('Đã xóa cơ sở y tế thành công');
        fetchData();
        closeModal();
      }
    } catch (error) {
      console.error('Error deleting hospital:', error);
      toast.error('Không thể xóa cơ sở y tế');
    } finally {
      setLoadingAction(false);
    }
  };

  const validateForm = () => {
    if (!formData.name) {
      toast.error('Vui lòng nhập tên cơ sở y tế');
      return false;
    }
    
    if (!formData.address) {
      toast.error('Vui lòng nhập địa chỉ');
      return false;
    }
    
    if (!formData.contactInfo.phone) {
      toast.error('Vui lòng nhập số điện thoại liên hệ');
      return false;
    }
    
    // Basic phone validation
    const phoneRegex = /^\d{9,15}$/;
    if (!phoneRegex.test(formData.contactInfo.phone.replace(/[\s-]/g, ''))) {
      toast.error('Số điện thoại không hợp lệ');
      return false;
    }
    
    // Email validation if provided
    if (formData.contactInfo.email) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formData.contactInfo.email)) {
        toast.error('Email không hợp lệ');
        return false;
      }
    }
    
    return true;
  };
  
  const handleSubmit = async () => {
    if (!validateForm()) return;

    setLoadingAction(true);
    try {
      let response;
      
      if (modalType === 'add') {
        response = await api.post('/admin/hospitals', formData);
        if (response.data.success) {
          toast.success('Thêm cơ sở y tế mới thành công');
          fetchData();
          closeModal();
        } else {
          toast.error(response.data.message || 'Lỗi khi thêm cơ sở y tế');
        }
      } else if (modalType === 'edit' && selectedHospital) {
        response = await api.put(`/admin/hospitals/${selectedHospital._id}`, formData);
        if (response.data.success) {
          toast.success('Cập nhật cơ sở y tế thành công');
          fetchData();
          closeModal();
        } else {
          toast.error(response.data.message || 'Lỗi khi cập nhật cơ sở y tế');
        }
      }
    } catch (error) {
      console.error(`Error ${modalType === 'add' ? 'adding' : 'updating'} hospital:`, error);
      toast.error(error.response?.data?.message || `Lỗi khi ${modalType === 'add' ? 'thêm' : 'cập nhật'} cơ sở y tế`);
    } finally {
      setLoadingAction(false);
    }
  };
  
  const handleImageUpload = async () => {
    if (!selectedImage) {
      toast.error('Vui lòng chọn một hình ảnh');
      return;
    }

    try {
      setLoadingAction(true);
      const formData = new FormData();
      formData.append('image', selectedImage);

      const res = await api.post(`/admin/hospitals/${selectedHospital._id}/image`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      if (res.data.success) {
        toast.success('Cập nhật hình ảnh thành công');
        fetchData();
        closeModal();
      } else {
        toast.error(res.data.message || 'Lỗi khi cập nhật hình ảnh');
      }
    } catch (error) {
      console.error('Error uploading image:', error);
      toast.error('Không thể tải lên hình ảnh');
    } finally {
      setLoadingAction(false);
    }
  };

  const exportData = () => {
    // Xuất dữ liệu dưới dạng CSV
    const fields = ['_id', 'name', 'address', 'contactInfo.phone', 'contactInfo.email', 'isActive', 'createdAt'];
    
    const csvContent = [
      // Header
      fields.join(','),
      // Rows
      ...hospitals.map(item => 
        fields.map(field => {
          // Handle nested fields
          if (field.includes('.')) {
            const [parent, child] = field.split('.');
            return `"${item[parent] && item[parent][child] ? item[parent][child] : ''}"`;
          }
          // Handle boolean fields
          if (field === 'isActive') {
            return `"${item[field] ? 'Hoạt động' : 'Ngừng hoạt động'}"`;
          }
          return `"${item[field] || ''}"`;
        }).join(',')
      )
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `hospitals_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('vi-VN', { year: 'numeric', month: 'numeric', day: 'numeric' });
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleContactInfoChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      contactInfo: {
        ...formData.contactInfo,
        [name]: value
      }
    });
  };

  const handleWorkingHoursChange = (day, field, value) => {
    setFormData({
      ...formData,
      workingHours: {
        ...formData.workingHours,
        [day]: {
          ...formData.workingHours[day],
          [field]: value
        }
      }
    });
  };

  const handleDayOpenStatusChange = (day, isOpen) => {
    setFormData({
      ...formData,
      workingHours: {
        ...formData.workingHours,
        [day]: {
          ...formData.workingHours[day],
          isOpen
        }
      }
    });
  };

  const handleSpecialtiesChange = (e) => {
    const options = e.target.options;
    const selectedValues = [];
    
    for (let i = 0; i < options.length; i++) {
      if (options[i].selected) {
        selectedValues.push(options[i].value);
      }
    }
    
    setFormData({
      ...formData,
      specialties: selectedValues
    });
  };

  const handleFacilitiesChange = (e) => {
    const value = e.target.value;
    const facilitiesList = value.split('\n').filter(item => item.trim() !== '');
    
    setFormData({
      ...formData,
      facilities: facilitiesList
    });
  };

  const handleFacilityInputChange = (e) => {
    setFacilityInput(e.target.value);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddFacility();
    }
  };

  const handleAddFacility = () => {
    if (facilityInput.trim() !== '') {
      setFormData({
        ...formData,
        facilities: [...formData.facilities, facilityInput.trim()]
      });
      setFacilityInput('');
    }
  };

  const handleRemoveFacility = (index) => {
    const updatedFacilities = [...formData.facilities];
    updatedFacilities.splice(index, 1);
    setFormData({
      ...formData,
      facilities: updatedFacilities
    });
  };

  const handleIsActiveChange = (e) => {
    setFormData({
      ...formData,
      isActive: e.target.value === 'true'
    });
  };

  const handleIsMainHospitalChange = (e) => {
    const isMain = e.target.value === 'true';
    setFormData({
      ...formData,
      isMainHospital: isMain,
      parentHospital: isMain ? null : formData.parentHospital
    });
  };

  const handleParentHospitalChange = (e) => {
    setFormData({
      ...formData,
      parentHospital: e.target.value || null
    });
  };

  const handleLocationChange = (lat, lng) => {
    setFormData({
      ...formData,
      location: {
        ...formData.location,
        coordinates: [lng, lat]
      }
    });
  };
  
  const handleImageChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedImage(e.target.files[0]);
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewImage(reader.result);
      };
      reader.readAsDataURL(e.target.files[0]);
    }
  };

  const handleUploadImage = async (hospitalId) => {
    if (!selectedFile) {
      toast.error('Vui lòng chọn một hình ảnh');
      return;
    }

    try {
      setLoadingAction(true);
      const formData = new FormData();
      formData.append('image', selectedFile);

      const res = await api.post(`/admin/hospitals/${hospitalId}/image`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      if (res.data.success) {
        toast.success('Tải ảnh lên thành công');
        fetchData();
        closeModal();
      } else {
        toast.error(res.data.message || 'Lỗi khi tải ảnh lên');
      }
    } catch (error) {
      console.error('Error uploading image:', error);
      toast.error('Không thể tải ảnh lên');
    } finally {
      setLoadingAction(false);
    }
  };

  const handleDeleteImage = async (hospitalId, imageId) => {
    try {
      setLoadingAction(true);
      const res = await api.delete(`/admin/hospitals/${hospitalId}/image/${imageId}`);
      if (res.data.success) {
        toast.success('Đã xóa ảnh thành công');
        fetchData();
        closeModal();
      }
    } catch (error) {
      console.error('Error deleting image:', error);
      toast.error('Không thể xóa ảnh');
    } finally {
      setLoadingAction(false);
    }
  };

  const handleAddSpecialty = async (hospitalId) => {
    try {
      setLoadingAction(true);
      const res = await api.post(`/admin/hospitals/${hospitalId}/specialties`, { specialtyId: selectedSpecialty });
      if (res.data.success) {
        toast.success('Thêm chuyên khoa thành công');
        fetchData();
        closeModal();
      }
    } catch (error) {
      console.error('Error adding specialty:', error);
      toast.error('Không thể thêm chuyên khoa');
    } finally {
      setLoadingAction(false);
    }
  };

  const handleRemoveSpecialty = async (hospitalId, specialtyId) => {
    try {
      setLoadingAction(true);
      const res = await api.delete(`/admin/hospitals/${hospitalId}/specialties/${specialtyId}`);
      if (res.data.success) {
        toast.success('Đã xóa chuyên khoa thành công');
        fetchData();
        closeModal();
      }
    } catch (error) {
      console.error('Error removing specialty:', error);
      toast.error('Không thể xóa chuyên khoa');
    } finally {
      setLoadingAction(false);
    }
  };

  const renderModal = () => {
    return (
      <div className="fixed inset-0 z-50 overflow-y-auto">
        <div className="fixed inset-0 bg-black bg-opacity-50" onClick={closeModal}></div>
        <div className="flex items-center justify-center min-h-screen p-4">
          <div className="relative bg-white rounded-lg max-w-2xl w-full mx-4 shadow-xl">
            <div className="flex items-center justify-between p-4 border-b">
              <h2 className="text-xl font-semibold text-gray-800">
                {modalType === 'add' && 'Thêm cơ sở y tế mới'}
                {modalType === 'edit' && 'Chỉnh sửa cơ sở y tế'}
                {modalType === 'delete' && 'Xác nhận xóa cơ sở y tế'}
                {modalType === 'addImage' && 'Thêm ảnh cơ sở y tế'}
                {modalType === 'editSpecialties' && 'Quản lý chuyên khoa'}
              </h2>
              <button 
                className="text-gray-500 hover:text-gray-700 focus:outline-none"
                onClick={closeModal}
                aria-label="Đóng"
              >
                <FaTimes className="h-5 w-5" />
              </button>
            </div>
            
            <div className="p-6 max-h-[70vh] overflow-y-auto">
              {(modalType === 'add' || modalType === 'edit') && (
                <form>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div className="md:col-span-2">
                      <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                        Tên cơ sở y tế <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        id="name"
                        name="name"
                        value={formData.name}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="Nhập tên cơ sở y tế"
                        required
                      />
                    </div>
                    
                    <div>
                      <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
                        Số điện thoại <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        id="phone"
                        name="phone"
                        value={formData.contactInfo.phone}
                        onChange={handleContactInfoChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="Nhập số điện thoại"
                        required
                      />
                    </div>
                    
                    <div>
                      <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                        Email
                      </label>
                      <input
                        type="email"
                        id="email"
                        name="email"
                        value={formData.contactInfo.email}
                        onChange={handleContactInfoChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="Nhập email"
                      />
                    </div>
                    
                    <div className="md:col-span-2">
                      <label htmlFor="address" className="block text-sm font-medium text-gray-700 mb-1">
                        Địa chỉ <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        id="address"
                        name="address"
                        value={formData.address}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="Nhập địa chỉ"
                        required
                      />
                    </div>
                    
                    <div className="md:col-span-2">
                      <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
                        Mô tả
                      </label>
                      <textarea
                        id="description"
                        name="description"
                        value={formData.description}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="Mô tả về cơ sở y tế"
                        rows="3"
                      />
                    </div>
                    
                    <div>
                      <label htmlFor="isActive" className="block text-sm font-medium text-gray-700 mb-1">
                        Trạng thái <span className="text-red-500">*</span>
                      </label>
                      <select
                        id="isActive"
                        name="isActive"
                        value={formData.isActive.toString()}
                        onChange={handleIsActiveChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        required
                      >
                        <option value="true">Đang hoạt động</option>
                        <option value="false">Tạm ngưng</option>
                      </select>
                    </div>
                    
                    <div>
                      <label htmlFor="isMainHospital" className="block text-sm font-medium text-gray-700 mb-1">
                        Bệnh viện chính
                      </label>
                      <select
                        id="isMainHospital"
                        name="isMainHospital"
                        value={formData.isMainHospital.toString()}
                        onChange={handleIsMainHospitalChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      >
                        <option value="true">Là bệnh viện chính</option>
                        <option value="false">Là bệnh viện chi nhánh</option>
                      </select>
                    </div>
                    
                    {!formData.isMainHospital && (
                      <div>
                        <label htmlFor="parentHospital" className="block text-sm font-medium text-gray-700 mb-1">
                          Thuộc bệnh viện <span className="text-red-500">*</span>
                        </label>
                        <select
                          id="parentHospital"
                          name="parentHospital"
                          value={formData.parentHospital || ''}
                          onChange={handleParentHospitalChange}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          required
                        >
                          <option value="" disabled>-- Chọn bệnh viện chính --</option>
                          {mainHospitals.map(hospital => (
                            <option key={hospital._id} value={hospital._id}>
                              {hospital.name}
                            </option>
                          ))}
                        </select>
                        {mainHospitals.length === 0 && (
                          <p className="text-xs text-orange-500 mt-1">
                            Chưa có bệnh viện chính nào. Vui lòng tạo bệnh viện chính trước.
                          </p>
                        )}
                      </div>
                    )}
                    
                    <div className="md:col-span-2">
                      <label htmlFor="specialties" className="block text-sm font-medium text-gray-700 mb-1">
                        Chuyên khoa 
                      </label>
                      <select
                        id="specialties"
                        name="specialties"
                        multiple
                        value={formData.specialties}
                        onChange={handleSpecialtiesChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        size="4"
                      >
                        {specialties.map(specialty => (
                          <option key={specialty._id} value={specialty._id}>
                            {specialty.name}
                          </option>
                        ))}
                      </select>
                      <p className="text-xs text-gray-500 mt-1">Nhấn Ctrl hoặc Command để chọn nhiều chuyên khoa</p>
                    </div>
                    
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Cơ sở vật chất
                      </label>
                      <div className="flex items-center space-x-2 mb-2">
                        <input
                          type="text"
                          value={facilityInput}
                          onChange={handleFacilityInputChange}
                          onKeyDown={handleKeyDown}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          placeholder="Thêm cơ sở vật chất"
                        />
                        <button
                          type="button"
                          onClick={handleAddFacility}
                          className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                        >
                          Thêm
                        </button>
                      </div>
                      <div className="mt-2 flex flex-wrap gap-2">
                        {formData.facilities.map((facility, index) => (
                          <div key={index} className="inline-flex items-center bg-blue-50 text-blue-700 px-2 py-1 rounded-full text-sm">
                            {facility}
                            <button
                              type="button"
                              onClick={() => handleRemoveFacility(index)}
                              className="ml-2 text-blue-700 hover:text-blue-900 focus:outline-none"
                            >
                              <FaTimes className="h-3 w-3" />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </form>
              )}
              
              {modalType === 'delete' && selectedHospital && (
                <div className="text-center py-4">
                  <FaExclamationCircle className="mx-auto h-12 w-12 text-red-500 mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Bạn có chắc muốn xóa cơ sở y tế này?</h3>
                  <p className="text-gray-500 mb-6">
                    Bạn sắp xóa cơ sở y tế "<span className="font-semibold">{selectedHospital.name}</span>". 
                    Hành động này không thể hoàn tác.
                  </p>
                </div>
              )}
              
              {modalType === 'addImage' && selectedHospital && (
                <div>
                  <div className="mb-4 p-4 border border-dashed border-gray-300 rounded-lg text-center">
                    {previewImage ? (
                      <div className="relative mx-auto">
                        <img 
                          src={previewImage} 
                          alt="Preview" 
                          className="max-h-64 max-w-full mx-auto rounded-lg object-contain"
                        />
                        <button
                          className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600"
                          onClick={() => {
                            setSelectedFile(null);
                            setPreviewImage(null);
                          }}
                        >
                          <FaTimes className="h-4 w-4" />
                        </button>
                      </div>
                    ) : (
                      <>
                        <div className="space-y-2">
                          <FaCamera className="h-12 w-12 mx-auto text-gray-400" />
                          <p className="text-gray-500">Nhấn vào nút bên dưới để chọn ảnh</p>
                          <p className="text-xs text-gray-400">Hỗ trợ: JPG, PNG, JPEG (Max: 5MB)</p>
                        </div>
                        <label className="mt-4 inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 cursor-pointer">
                          <FaImage className="mr-2" /> Chọn ảnh
                          <input
                            type="file"
                            accept="image/jpeg,image/png,image/jpg"
                            onChange={handleFileChange}
                            className="hidden"
                          />
                        </label>
                      </>
                    )}
                  </div>
                  
                  {/* Current Images */}
                  {selectedHospital.images && selectedHospital.images.length > 0 && (
                    <div className="mb-4">
                      <h3 className="text-sm font-medium text-gray-700 mb-2">Ảnh hiện tại</h3>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                        {selectedHospital.images.map((image, index) => (
                          <div key={index} className="relative rounded-lg overflow-hidden border border-gray-200 group">
                            <img 
                              src={image.url} 
                              alt={`Hospital ${index + 1}`} 
                              className="h-32 w-full object-cover"
                              onError={(e) => {
                                e.target.src = '/avatars/default-avatar.png';
                                e.target.onerror = null;
                              }}
                            />
                            <div className="absolute inset-0 bg-black bg-opacity-50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                              <button
                                onClick={() => handleDeleteImage(selectedHospital._id, image._id || image.publicId || index)}
                                className="p-2 bg-red-600 text-white rounded-full hover:bg-red-700"
                                title="Xóa ảnh"
                              >
                                <FaTrash className="h-4 w-4" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
            
            <div className="flex justify-end gap-3 p-4 border-t bg-gray-50 rounded-b-lg">
              <button 
                className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors focus:outline-none focus:ring-2 focus:ring-gray-400"
                onClick={closeModal}
              >
                Hủy
              </button>
              
              {modalType === 'delete' && (
                <button 
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors focus:outline-none focus:ring-2 focus:ring-red-500"
                  onClick={() => handleDeleteHospital(selectedHospital._id)}
                  disabled={loadingAction}
                >
                  {loadingAction ? (
                    <span className="flex items-center">
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Đang xóa...
                    </span>
                  ) : 'Xác nhận xóa'}
                </button>
              )}
              
              {(modalType === 'add' || modalType === 'edit') && (
                <button 
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
                  onClick={handleSubmit}
                  disabled={loadingAction}
                >
                  {loadingAction ? (
                    <span className="flex items-center">
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      {modalType === 'add' ? 'Đang thêm...' : 'Đang cập nhật...'}
                    </span>
                  ) : (modalType === 'add' ? 'Thêm mới' : 'Cập nhật')}
                </button>
              )}
              
              {modalType === 'addImage' && selectedFile && (
                <button 
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
                  onClick={() => handleUploadImage(selectedHospital._id)}
                  disabled={loadingAction}
                >
                  {loadingAction ? (
                    <span className="flex items-center">
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Đang tải ảnh...
                    </span>
                  ) : 'Tải ảnh lên'}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="bg-white rounded-lg shadow-sm overflow-hidden">
      <div className="p-6 border-b">
        <h1 className="text-2xl font-bold text-gray-800">Quản lý cơ sở y tế</h1>
      </div>

      <div className="p-6 border-b">
        <div className="flex flex-col lg:flex-row gap-4">
          {/* Search Bar */}
          <div className="w-full lg:w-1/3">
            <form onSubmit={handleSearch} className="flex w-full">
              <div className="relative w-full">
                <input
                  type="text"
                  placeholder="Tìm kiếm theo tên, địa chỉ..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
                <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                  <FaSearch className="text-gray-400" />
                </div>
              </div>
              <button 
                type="submit" 
                className="ml-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center justify-center"
              >
                <FaSearch className="mr-2" />
                Tìm
              </button>
            </form>
          </div>

          {/* Filters */}
          <div className="w-full lg:w-2/3 flex items-center">
            <div className="relative w-full sm:w-64">
              <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                <FaFilter className="text-gray-400" />
              </div>
              <select
                name="status"
                value={filter.status}
                onChange={handleFilterChange}
                className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white appearance-none"
              >
                <option value="all">Tất cả trạng thái</option>
                <option value="active">Đang hoạt động</option>
                <option value="inactive">Tạm ngưng</option>
              </select>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row justify-between items-center mt-4">
          <div className="mb-2 sm:mb-0">
            {/* Additional filters could go here */}
          </div>
          <div className="flex flex-col sm:flex-row gap-2">
            <button 
              className="flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              onClick={() => openModal('add')}
            >
              <FaPlus />
              <span>Thêm cơ sở mới</span>
            </button>
            <button 
              className="flex items-center justify-center gap-2 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
              onClick={exportData}
            >
              <FaDownload />
              <span>Xuất dữ liệu</span>
            </button>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center p-8">
          <div className="w-12 h-12 border-4 border-gray-300 border-t-blue-600 rounded-full animate-spin mb-4"></div>
          <p className="text-gray-600">Đang tải dữ liệu...</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cơ sở y tế</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Địa chỉ</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Liên hệ</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Chuyên khoa</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Trạng thái</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Hành động</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {hospitals.length > 0 ? (
                hospitals.map((hospital) => (
                  <tr key={hospital._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-12 w-12 rounded-md overflow-hidden bg-gray-100">
                          <img 
                            className="h-12 w-12 object-cover" 
                            src={
                              hospital.imageUrl ? hospital.imageUrl :
                              hospital.images && hospital.images.length > 0 ? hospital.images[0].url :
                              '/avatars/default-avatar.png'
                            } 
                            alt={hospital.name}
                            onError={(e) => {
                              e.target.src = '/avatars/default-avatar.png';
                              e.target.onerror = null;
                            }}
                          />
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">{hospital.name}</div>
                          <div className="text-xs text-gray-500">
                            {hospital.foundedYear ? `Thành lập: ${hospital.foundedYear}` : ''}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900 max-w-xs truncate">{hospital.address}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900">
                        {hospital.contactInfo?.phone || hospital.phoneNumber || 'N/A'}
                      </div>
                      {(hospital.contactInfo?.email || hospital.email) && (
                        <div className="text-xs text-gray-500">
                          {hospital.contactInfo?.email || hospital.email}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-wrap gap-1">
                        {hospital.specialties && hospital.specialties.length > 0 ? (
                          <>
                            {hospital.specialties.slice(0, 2).map((specialty, index) => (
                              <span 
                                key={index} 
                                className="inline-flex px-2 py-1 text-xs bg-blue-50 text-blue-700 rounded-full"
                              >
                                {typeof specialty === 'object' ? specialty.name : specialties.find(s => s._id === specialty)?.name || 'Chưa đặt tên'}
                              </span>
                            ))}
                            {hospital.specialties.length > 2 && (
                              <span className="inline-flex px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded-full">
                                +{hospital.specialties.length - 2}
                              </span>
                            )}
                          </>
                        ) : (
                          <span className="text-xs text-gray-500">
                            Chưa có chuyên khoa
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs leading-5 font-semibold rounded-full ${
                        hospital.status === 'active' || hospital.isActive
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {hospital.status === 'active' || hospital.isActive
                          ? 'Đang hoạt động' 
                          : 'Tạm ngưng'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center space-x-2">
                        <button
                          className="p-1.5 text-blue-600 hover:text-blue-900 rounded-full hover:bg-blue-50"
                          onClick={() => openModal('addImage', hospital)}
                          title="Cập nhật ảnh"
                        >
                          <FaImage className="h-4 w-4" />
                        </button>
                        <button
                          className="p-1.5 text-blue-600 hover:text-blue-900 rounded-full hover:bg-blue-50"
                          onClick={() => openModal('edit', hospital)}
                          title="Chỉnh sửa"
                        >
                          <FaEdit className="h-4 w-4" />
                        </button>
                        <button
                          className="p-1.5 text-red-600 hover:text-red-900 rounded-full hover:bg-red-50"
                          onClick={() => openModal('delete', hospital)}
                          title="Xóa"
                        >
                          <FaTrash className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="6" className="px-6 py-10 text-center text-gray-500">
                    Không có dữ liệu cơ sở y tế
                  </td>
                </tr>
              )}
            </tbody>
          </table>

          {/* Pagination */}
          <div className="flex items-center justify-between px-6 py-4 bg-white border-t">
            <div className="flex items-center gap-2">
              <button
                className="p-2 rounded-md border border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                onClick={() => handlePageChange(1)}
                disabled={pagination.currentPage === 1}
              >
                &laquo;
              </button>
              <button
                className="p-2 rounded-md border border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                onClick={() => handlePageChange(pagination.currentPage - 1)}
                disabled={pagination.currentPage === 1}
              >
                &lsaquo;
              </button>
            </div>
            
            <div className="text-sm text-gray-700">
              Trang {pagination.currentPage} / {pagination.totalPages}
            </div>
            
            <div className="flex items-center gap-2">
              <button
                className="p-2 rounded-md border border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                onClick={() => handlePageChange(pagination.currentPage + 1)}
                disabled={pagination.currentPage === pagination.totalPages}
              >
                &rsaquo;
              </button>
              <button
                className="p-2 rounded-md border border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                onClick={() => handlePageChange(pagination.totalPages)}
                disabled={pagination.currentPage === pagination.totalPages}
              >
                &raquo;
              </button>
            </div>
          </div>
        </div>
      )}

      {isModalOpen && renderModal()}
    </div>
  );
};

export default Hospitals; 
