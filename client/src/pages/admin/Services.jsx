import React, { useState, useEffect } from 'react';
import { FaPlus, FaEdit, FaTrash, FaSearch, FaFilter, FaDownload, FaImage, FaHistory, FaTimes, FaExclamationCircle, FaProcedures, FaFileAlt, FaMoneyBillWave, FaCamera } from 'react-icons/fa';
import api from '../../utils/api';
import { toast } from 'react-toastify';


const Services = () => {
  const [services, setServices] = useState([]);
  const [specialties, setSpecialties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingAction, setLoadingAction] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState({
    status: 'all',  // used for isActive filtering
    priceRange: 'all',
    specialtyId: 'all',
    type: 'all'
  });
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    pageSize: 10
  });
  const [selectedService, setSelectedService] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalType, setModalType] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    shortDescription: '',
    description: '',
    price: 0,
    specialtyId: '',
    duration: 30,
    type: 'examination',
    preparationGuide: '',
    aftercareInstructions: '',
    requiredTests: [],
    isActive: true
  });
  const [priceHistory, setPriceHistory] = useState([]);
  const [priceStats, setPriceStats] = useState(null);
  const [selectedImage, setSelectedImage] = useState(null);
  const [previewImage, setPreviewImage] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploadLoading, setUploadLoading] = useState(false);
  const [testInput, setTestInput] = useState('');
  
  useEffect(() => {
    fetchData();
    fetchSpecialties();
  }, [pagination.currentPage, filter]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const queryParams = new URLSearchParams({
        page: pagination.currentPage,
        limit: pagination.pageSize,
        priceRange: filter.priceRange,
        specialtyId: filter.specialtyId !== 'all' ? filter.specialtyId : '',
        search: searchTerm
      });
      
      // Add isActive parameter based on status filter
      if (filter.status === 'active') {
        queryParams.append('isActive', 'true');
      } else if (filter.status === 'inactive') {
        queryParams.append('isActive', 'false');
      }
      
      const res = await api.get(`/admin/services?${queryParams}`);
      if (res.data.success) {
        // Check for nested structure in data.data.services
        if (res.data.data && res.data.data.services && Array.isArray(res.data.data.services)) {
        setServices(res.data.data.services);
          setPagination({
            ...pagination,
            totalPages: Math.ceil(res.data.data.total / pagination.pageSize) || 1
          });
        } 
        // Check if data array is directly in res.data.data
        else if (res.data.data && Array.isArray(res.data.data) && res.data.data.length > 0) {
          setServices(res.data.data);
          setPagination({
            ...pagination,
            totalPages: Math.ceil(res.data.total / pagination.pageSize) || 1
          });
        } else {
          console.error('No services found in response:', res.data);
          setServices([]);
          setPagination({
            ...pagination,
            totalPages: 1
          });
        }
      } else {
        console.error('Failed to fetch services:', res.data);
        setServices([]);
        setPagination({
          ...pagination,
          totalPages: 1
        });
      }
    } catch (error) {
      console.error('Error fetching services:', error);
      toast.error('Không thể tải dữ liệu dịch vụ');
      setServices([]);
      setPagination({
        ...pagination,
        totalPages: 1
      });
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
      toast.error('Không thể tải danh sách chuyên khoa');
      setSpecialties([]);
    }
  };

  const fetchPriceHistory = async (serviceId) => {
    try {
      setLoadingAction(true);
      const res = await api.get(`/admin/services/${serviceId}/price-history`);
      if (res.data.success) {
        setPriceHistory(res.data.data.priceHistory || []);
        setPriceStats(res.data.data.stats || null);
      } else {
        setPriceHistory([]);
        setPriceStats(null);
        toast.error(res.data.message || 'Không thể tải lịch sử giá');
      }
    } catch (error) {
      console.error('Error fetching price history:', error);
      setPriceHistory([]);
      setPriceStats(null);
      toast.error('Không thể tải lịch sử giá');
    } finally {
      setLoadingAction(false);
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

  const openModal = (type, service = null) => {
    setModalType(type);
    setSelectedService(service);
    
    if (type === 'add') {
      setFormData({
        name: '',
        shortDescription: '',
        description: '',
        price: 0,
        specialtyId: '',
        duration: 30,
        type: 'examination',
        preparationGuide: '',
        aftercareInstructions: '',
        requiredTests: [],
        isActive: true
      });
    } else if (type === 'edit' && service) {
      setFormData({
        name: service.name || '',
        shortDescription: service.shortDescription || '',
        description: service.description || '',
        price: service.price || 0,
        specialtyId: service.specialtyId?._id || service.specialtyId || '',
        duration: service.duration || 30,
        type: service.type || 'examination',
        preparationGuide: service.preparationGuide || '',
        aftercareInstructions: service.aftercareInstructions || '',
        requiredTests: service.requiredTests || [],
        isActive: service.isActive !== undefined ? service.isActive : true
      });
    } else if (type === 'price-history' && service) {
      fetchPriceHistory(service._id);
    } else if (type === 'addImage') {
      setSelectedImage(null);
      setPreviewImage(null);
      setSelectedFile(null);
    }
    
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedService(null);
    setModalType('');
    setSelectedImage(null);
    setPriceHistory([]);
    setPriceStats(null);
    setPreviewImage(null);
    setSelectedFile(null);
    setTestInput('');
    setFormData({
      name: '',
      shortDescription: '',
      description: '',
      price: 0,
      specialtyId: '',
      duration: 30,
      type: 'examination',
      preparationGuide: '',
      aftercareInstructions: '',
      requiredTests: [],
      isActive: true
    });
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    
    // Special handling for numeric fields
    if (name === 'price') {
      // Convert to number and ensure it's within valid range (0-100,000,000)
      let numValue = value === '' ? 0 : Number(value);
      // Clamp the value to valid range
      numValue = Math.max(0, Math.min(100000000, numValue));
      setFormData({ ...formData, [name]: numValue });
    } else if (name === 'duration') {
      // Convert to number for duration field
      let numValue = value === '' ? 30 : Number(value);
      // Ensure it's at least 5 minutes
      numValue = Math.max(5, numValue);
      setFormData({ ...formData, [name]: numValue });
    } else {
      // Normal handling for other fields
      setFormData({ ...formData, [name]: value });
    }
  };

  const handlePriceChange = (e) => {
    const value = e.target.value;
    // Convert to number but ensure it's within the valid range
    let price = value ? parseInt(value, 10) : 0;
    if (isNaN(price)) price = 0;
    
    // Ensure price is not negative and doesn't exceed 100 million
    price = Math.max(0, Math.min(100000000, price));
    setFormData({ ...formData, price });
  };

  const handleDurationChange = (e) => {
    const value = e.target.value;
    setFormData({ ...formData, duration: value ? parseInt(value, 10) : 30 });
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

  const handleTestInputChange = (e) => {
    setTestInput(e.target.value);
  };
  
  const addTest = () => {
    if (testInput.trim() !== '') {
      setFormData({
        ...formData,
        requiredTests: [...formData.requiredTests, testInput.trim()]
      });
      setTestInput('');
    }
  };
  
  const removeTest = (index) => {
    const updatedTests = [...formData.requiredTests];
    updatedTests.splice(index, 1);
    setFormData({ ...formData, requiredTests: updatedTests });
  };

  const validateForm = () => {
    if (!formData.name) {
      toast.error('Vui lòng nhập tên dịch vụ');
      return false;
    }
    
    if (!formData.shortDescription) {
      toast.error('Vui lòng nhập mô tả ngắn');
      return false;
    }
    
    if (formData.shortDescription.length > 200) {
      toast.error('Mô tả ngắn không được vượt quá 200 ký tự');
      return false;
    }
    
    if (formData.description && formData.description.length > 2000) {
      toast.error('Mô tả chi tiết không được vượt quá 2000 ký tự');
      return false;
    }
    
    // Price validation
    if (formData.price === '' || formData.price === null || formData.price === undefined) {
      toast.error('Vui lòng nhập giá dịch vụ');
      return false;
    }
    
    const price = Number(formData.price);
    if (isNaN(price)) {
      toast.error('Giá dịch vụ phải là số');
      return false;
    }
    
    if (price <= 0) {
      toast.error('Giá dịch vụ phải lớn hơn 0');
      return false;
    }
    
    if (price > 100000000) {
      toast.error('Giá dịch vụ không được vượt quá 100 triệu');
      return false;
    }
    
    // Check if specialtyId is selected
    if (!formData.specialtyId) {
      toast.error('Vui lòng chọn chuyên khoa');
      return false;
    }
    
    // Validate duration
    if (!formData.duration || formData.duration < 10) {
      toast.error('Thời gian dịch vụ phải từ 10 phút trở lên');
      return false;
    }
    
    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    setLoadingAction(true);
    try {
      // Make a copy of the form data
      const dataToSubmit = {...formData};
      
      // Convert empty string specialtyId to null
      if (dataToSubmit.specialtyId === '') {
        dataToSubmit.specialtyId = null;
      }
      
      let response;
      
      if (modalType === 'add') {
        response = await api.post('/admin/services', dataToSubmit);
        if (response.data.success) {
          toast.success('Thêm dịch vụ mới thành công');
          fetchData();
          closeModal();
        } else {
          toast.error(response.data.message || 'Lỗi khi thêm dịch vụ');
        }
      } else if (modalType === 'edit' && selectedService) {
        response = await api.put(`/admin/services/${selectedService._id}`, dataToSubmit);
        if (response.data.success) {
          toast.success('Cập nhật dịch vụ thành công');
          fetchData();
          closeModal();
        } else {
          toast.error(response.data.message || 'Lỗi khi cập nhật dịch vụ');
        }
      }
    } catch (error) {
      console.error(`Error ${modalType === 'add' ? 'adding' : 'updating'} service:`, error);
      console.error('Error response:', error.response?.data);
      
      const errorMessage = error.response?.data?.message || 
                          `Lỗi khi ${modalType === 'add' ? 'thêm' : 'cập nhật'} dịch vụ`;
      
      toast.error(errorMessage);
    } finally {
      setLoadingAction(false);
    }
  };

  const handleDeleteService = async (serviceId) => {
    try {
      setLoadingAction(true);
      const res = await api.delete(`/admin/services/${serviceId}`);
      if (res.data.success) {
        toast.success('Đã xóa dịch vụ thành công');
        fetchData();
        closeModal();
      } else {
        toast.error(res.data.message || 'Không thể xóa dịch vụ');
      }
    } catch (error) {
      console.error('Error deleting service:', error);
      toast.error('Không thể xóa dịch vụ');
    } finally {
      setLoadingAction(false);
    }
  };

  const handleUploadImage = async (serviceId) => {
    if (!selectedFile) {
      toast.error('Vui lòng chọn một hình ảnh');
      return;
    }

    try {
      setUploadLoading(true);
      const formData = new FormData();
      formData.append('image', selectedFile);

      const res = await api.post(`/admin/services/${serviceId}/image`, formData, {
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
      setUploadLoading(false);
    }
  };

  const exportData = () => {
    // Xuất dữ liệu dưới dạng CSV
    const fields = ['_id', 'name', 'description', 'price', 'specialtyId.name', 'duration', 'status', 'createdAt'];
    
    const csvContent = [
      // Header
      fields.join(','),
      // Rows
      ...services.map(item => 
        fields.map(field => {
          // Xử lý trường hợp nested field (specialtyId.name)
          if (field.includes('.')) {
            const [parent, child] = field.split('.');
            return item[parent] ? `"${item[parent][child] || ''}"` : '""';
          }
          return `"${item[field] || ''}"`;
        }).join(',')
      )
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `services_${new Date().toISOString().split('T')[0]}.csv`);
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

  // Format price
  const formatPrice = (price) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price || 0);
  };

  const renderModal = () => {
    return (
      <div className="fixed inset-0 z-50 overflow-y-auto">
        <div className="fixed inset-0 bg-black bg-opacity-50" onClick={closeModal}></div>
        <div className="flex items-center justify-center min-h-screen p-4">
          <div className="relative bg-white rounded-lg max-w-2xl w-full mx-4 shadow-xl">
            <div className="flex items-center justify-between p-4 border-b">
              <h2 className="text-xl font-semibold text-gray-800">
                {modalType === 'add' && 'Thêm dịch vụ mới'}
                {modalType === 'edit' && 'Chỉnh sửa dịch vụ'}
                {modalType === 'delete' && 'Xác nhận xóa dịch vụ'}
                {modalType === 'addImage' && 'Cập nhật hình ảnh dịch vụ'}
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
                        Tên dịch vụ <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        id="name"
                        name="name"
                        value={formData.name}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="Nhập tên dịch vụ"
                        required
                      />
                    </div>
                    
                    <div>
                      <label htmlFor="specialtyId" className="block text-sm font-medium text-gray-700 mb-1">
                        Chuyên khoa <span className="text-red-500">*</span>
                      </label>
                      <select
                        id="specialtyId"
                        name="specialtyId"
                        value={formData.specialtyId}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        required
                      >
                        <option value="">-- Chọn chuyên khoa --</option>
                        {specialties.map(specialty => (
                          <option key={specialty._id} value={specialty._id}>
                            {specialty.name}
                          </option>
                        ))}
                      </select>
                    </div>
                    
                    <div>
                      <label htmlFor="price" className="block text-sm font-medium text-gray-700 mb-1">
                        Giá (VND) <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="number"
                        id="price"
                        name="price"
                        value={formData.price}
                        onChange={handlePriceChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="Nhập giá dịch vụ"
                        min="0"
                        max="100000000"
                        step="1000"
                        required
                      />
                    </div>
                    
                    <div>
                      <label htmlFor="duration" className="block text-sm font-medium text-gray-700 mb-1">
                        Thời gian thực hiện (phút) <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="number"
                        id="duration"
                        name="duration"
                        value={formData.duration}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="Nhập thời gian thực hiện"
                        min="5"
                        required
                      />
                    </div>
                    
                    <div>
                      <label htmlFor="type" className="block text-sm font-medium text-gray-700 mb-1">
                        Loại dịch vụ <span className="text-red-500">*</span>
                      </label>
                      <select
                        id="type"
                        name="type"
                        value={formData.type}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        required
                      >
                        <option value="">-- Chọn loại dịch vụ --</option>
                        <option value="examination">Khám bệnh</option>
                        <option value="diagnostic">Chẩn đoán</option>
                        <option value="treatment">Điều trị</option>
                        <option value="procedure">Thủ thuật</option>
                        <option value="surgery">Phẫu thuật</option>
                        <option value="consultation">Tư vấn</option>
                      </select>
                    </div>
                    
                    <div>
                      <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-1">
                        Trạng thái <span className="text-red-500">*</span>
                      </label>
                      <select
                        id="status"
                        name="isActive"
                        value={formData.isActive === true ? 'true' : 'false'}
                        onChange={(e) => setFormData({ ...formData, isActive: e.target.value === 'true' })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        required
                      >
                        <option value="true">Đang hoạt động</option>
                        <option value="false">Tạm ngưng</option>
                      </select>
                    </div>
                  </div>
                  
                  <div className="mb-4">
                    <label htmlFor="shortDescription" className="block text-sm font-medium text-gray-700 mb-1">
                      Mô tả ngắn <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      id="shortDescription"
                      name="shortDescription"
                      value={formData.shortDescription}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Nhập mô tả ngắn về dịch vụ (tối đa 200 ký tự)"
                      rows="2"
                      required
                    />
                  </div>
                  
                  <div className="mb-4">
                    <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
                      Mô tả chi tiết
                    </label>
                    <textarea
                      id="description"
                      name="description"
                      value={formData.description}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Nhập mô tả chi tiết về dịch vụ"
                      rows="4"
                    />
                  </div>
                  
                  <div className="mb-4">
                    <label htmlFor="preparationGuide" className="block text-sm font-medium text-gray-700 mb-1">
                      Hướng dẫn chuẩn bị
                    </label>
                    <textarea
                      id="preparationGuide"
                      name="preparationGuide"
                      value={formData.preparationGuide}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Hướng dẫn chuẩn bị trước khi sử dụng dịch vụ"
                      rows="3"
                    />
                  </div>
                  
                  <div className="mb-4">
                    <label htmlFor="aftercareInstructions" className="block text-sm font-medium text-gray-700 mb-1">
                      Hướng dẫn chăm sóc sau
                    </label>
                    <textarea
                      id="aftercareInstructions"
                      name="aftercareInstructions"
                      value={formData.aftercareInstructions}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Hướng dẫn chăm sóc sau khi sử dụng dịch vụ"
                      rows="3"
                    />
                  </div>
                  
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Xét nghiệm yêu cầu
                    </label>
                    <div className="flex flex-wrap gap-2 mb-2">
                      {formData.requiredTests.map((test, index) => (
                        <div key={index} className="flex items-center bg-blue-50 px-3 py-1 rounded-full text-sm">
                          <span className="text-blue-700">{test}</span>
                          <button
                            type="button"
                            onClick={() => removeTest(index)}
                            className="ml-2 text-blue-400 hover:text-blue-600"
                          >
                            <FaTimes className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                    <div className="flex">
                      <input
                        type="text"
                        value={testInput}
                        onChange={handleTestInputChange}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-l-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="Nhập tên xét nghiệm yêu cầu"
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            addTest();
                          }
                        }}
                      />
                      <button
                        type="button"
                        onClick={addTest}
                        className="px-4 py-2 bg-blue-600 text-white rounded-r-lg hover:bg-blue-700 transition-colors"
                      >
                        Thêm
                      </button>
                    </div>
                  </div>
                </form>
              )}
              
              {modalType === 'addImage' && selectedService && (
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
                </div>
              )}
              
              {modalType === 'delete' && selectedService && (
                <div>
                  <div className="p-4 mb-4 bg-red-50 border-l-4 border-red-400 rounded-md">
                    <div className="flex">
                      <FaExclamationCircle className="h-5 w-5 text-red-500 mr-2" />
                      <p className="text-sm text-red-700">
                        Bạn có chắc chắn muốn xóa dịch vụ <span className="font-semibold">{selectedService.name}</span>?
                        <br />
                        Hành động này không thể hoàn tác và có thể ảnh hưởng đến các cuộc hẹn hiện tại.
                      </p>
                    </div>
                  </div>
                  
                  <div className="bg-gray-50 p-4 rounded-md">
                    <h3 className="text-sm font-medium text-gray-700 mb-2">Chi tiết dịch vụ:</h3>
                    <ul className="space-y-2">
                      <li className="flex items-start">
                        <FaProcedures className="h-5 w-5 text-gray-500 mr-2" />
                        <span className="text-sm">
                          <strong>Tên dịch vụ:</strong> {selectedService.name}
                        </span>
                      </li>
                      <li className="flex items-start">
                        <FaFileAlt className="h-5 w-5 text-gray-500 mr-2" />
                        <span className="text-sm">
                          <strong>Chuyên khoa:</strong> {selectedService.specialtyId?.name || 'N/A'}
                        </span>
                      </li>
                      <li className="flex items-start">
                        <FaMoneyBillWave className="h-5 w-5 text-gray-500 mr-2" />
                        <span className="text-sm">
                          <strong>Giá:</strong> {formatPrice(selectedService.price)}
                        </span>
                      </li>
                    </ul>
                  </div>
                </div>
              )}

              {modalType === 'price-history' && selectedService && (
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-medium text-gray-900">Lịch sử thay đổi giá</h3>
                    <div className="font-medium text-blue-600">
                      {formatPrice(selectedService.price)}
                    </div>
                  </div>
                  
                  {loadingAction ? (
                    <div className="flex flex-col items-center justify-center p-8">
                      <div className="w-10 h-10 border-4 border-gray-300 border-t-blue-600 rounded-full animate-spin mb-4"></div>
                      <p className="text-gray-600">Đang tải dữ liệu...</p>
                    </div>
                  ) : (
                    <>
                      {/* Price Stats Summary */}
                      {priceStats && (
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                          <div className="bg-blue-50 p-3 rounded-lg">
                            <p className="text-xs text-blue-600 font-medium">GIÁ HIỆN TẠI</p>
                            <p className="text-lg font-semibold">{formatPrice(priceStats.currentPrice)}</p>
                          </div>
                          <div className="bg-green-50 p-3 rounded-lg">
                            <p className="text-xs text-green-600 font-medium">GIÁ THẤP NHẤT</p>
                            <p className="text-lg font-semibold">{formatPrice(priceStats.lowestPrice)}</p>
                          </div>
                          <div className="bg-red-50 p-3 rounded-lg">
                            <p className="text-xs text-red-600 font-medium">GIÁ CAO NHẤT</p>
                            <p className="text-lg font-semibold">{formatPrice(priceStats.highestPrice)}</p>
                          </div>
                          <div className="bg-purple-50 p-3 rounded-lg">
                            <p className="text-xs text-purple-600 font-medium">THAY ĐỔI GIÁ</p>
                            <p className="text-lg font-semibold">{priceStats.priceChangesCount} lần</p>
                          </div>
                        </div>
                      )}

                      {/* Price History Timeline */}
                      {priceHistory && priceHistory.length > 0 ? (
                        <div className="relative">
                          <div className="absolute left-5 top-0 h-full border-l-2 border-gray-200"></div>
                          
                          <div className="space-y-6 max-h-[350px] overflow-y-auto py-2 pl-2">
                              {priceHistory.map((record, index) => (
                              <div key={index} className="relative pl-8">
                                <div className={`absolute left-0 top-1.5 w-10 h-10 rounded-full flex items-center justify-center border-2 ${
                                  record.isCurrent ? 'bg-blue-500 border-blue-300' : 'bg-white border-gray-300'
                                }`}>
                                  {record.isCurrent ? (
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-white" viewBox="0 0 20 20" fill="currentColor">
                                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                    </svg>
                                  ) : (
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                  )}
                                </div>
                                
                                <div className={`bg-white p-4 rounded-lg border ${
                                  record.isCurrent ? 'border-blue-200 shadow-sm' : 'border-gray-200'
                                }`}>
                                  <div className="flex flex-col md:flex-row md:items-center justify-between mb-2">
                                    <div className="font-medium">{formatDate(record.createdAt)}</div>
                                    <div className="text-sm text-gray-500">
                                      Bởi: {record.changedBy?.fullName || 'N/A'}
                                    </div>
                                  </div>
                                  
                                  <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                                    <div>
                                      <div className="text-sm text-gray-500">Giá trước</div>
                                      <div className="font-medium">{formatPrice(record.previousPrice)}</div>
                                    </div>
                                    <div>
                                      <div className="text-sm text-gray-500">Giá mới</div>
                                      <div className="font-medium">{formatPrice(record.newPrice)}</div>
                                    </div>
                                    <div>
                                      <div className="text-sm text-gray-500">Thay đổi</div>
                                      <div className={`font-medium ${
                                        record.newPrice > record.previousPrice 
                                          ? 'text-red-600' 
                                          : record.newPrice < record.previousPrice 
                                            ? 'text-green-600'
                                            : 'text-gray-600'
                                    }`}>
                                        {record.newPrice > record.previousPrice ? '+' : record.newPrice < record.previousPrice ? '-' : ''}
                                        {formatPrice(Math.abs(record.newPrice - record.previousPrice))}
                                        {record.newPrice !== record.previousPrice && (
                                          <span className="text-xs ml-1">
                                            ({Math.abs(Math.round((record.newPrice - record.previousPrice) / record.previousPrice * 100))}%)
                                    </span>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                  
                                  {record.reason && (
                                    <div className="mt-2 pt-2 border-t border-gray-100">
                                      <div className="text-sm text-gray-500">Lý do:</div>
                                      <div className="text-gray-700">{record.reason}</div>
                                    </div>
                                  )}
                                </div>
                              </div>
                              ))}
                          </div>
                        </div>
                      ) : (
                        <div className="text-center py-8 text-gray-500 bg-gray-50 rounded-lg">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto text-gray-400 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                          <p>Chưa có lịch sử thay đổi giá nào.</p>
                        </div>
                      )}
                    </>
                  )}
                </div>
              )}
            </div>
            
            <div className="flex justify-end gap-3 p-4 border-t bg-gray-50 rounded-b-lg">
              <button 
                className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors focus:outline-none focus:ring-2 focus:ring-gray-400"
                onClick={closeModal}
              >
                {modalType === 'addImage' && selectedFile ? 'Hủy' : 'Đóng'}
              </button>
              
              {modalType === 'add' && (
                <button 
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
                  onClick={handleSubmit}
                >
                  Thêm dịch vụ
                </button>
              )}
              
              {modalType === 'edit' && (
                <button 
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
                  onClick={handleSubmit}
                >
                  Cập nhật
                </button>
              )}
              
              {modalType === 'delete' && (
                <button 
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors focus:outline-none focus:ring-2 focus:ring-red-500"
                  onClick={() => handleDeleteService(selectedService._id)}
                >
                  Xác nhận xóa
                </button>
              )}
              
              {modalType === 'addImage' && selectedFile && (
                <button 
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
                  onClick={() => handleUploadImage(selectedService._id)}
                  disabled={uploadLoading}
                >
                  {uploadLoading ? (
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
        <h1 className="text-2xl font-bold text-gray-800">Quản lý dịch vụ</h1>
      </div>

      <div className="p-6 border-b">
        <div className="flex flex-col lg:flex-row gap-4">
          {/* Search Bar */}
          <div className="w-full lg:w-1/3">
            <form onSubmit={handleSearch} className="flex w-full">
              <div className="relative w-full">
                <input
                  type="text"
                  placeholder="Tìm kiếm theo tên dịch vụ..."
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
          <div className="w-full lg:w-2/3 grid grid-cols-1 sm:grid-cols-3 gap-2">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                <FaFilter className="text-gray-400" />
              </div>
              <select
                name="specialtyId"
                value={filter.specialtyId}
                onChange={handleFilterChange}
                className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white appearance-none"
              >
                <option value="all">Tất cả chuyên khoa</option>
                {specialties.map(specialty => (
                  <option key={specialty._id} value={specialty._id}>
                    {specialty.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="relative">
              <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                <FaFilter className="text-gray-400" />
              </div>
              <select
                name="type"
                value={filter.type}
                onChange={handleFilterChange}
                className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white appearance-none"
              >
                <option value="all">Tất cả loại dịch vụ</option>
                <option value="examination">Khám bệnh</option>
                <option value="diagnostic">Chẩn đoán</option>
                <option value="treatment">Điều trị</option>
                <option value="procedure">Thủ thuật</option>
                <option value="surgery">Phẫu thuật</option>
                <option value="consultation">Tư vấn</option>
              </select>
            </div>

            <div className="relative">
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
              <span>Thêm dịch vụ</span>
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
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Dịch vụ</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Chuyên khoa</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Loại dịch vụ</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Giá dịch vụ</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Thời gian</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Trạng thái</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Hành động</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {services.length > 0 ? (
                services.map((service) => (
                  <tr key={service._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-12 w-12 rounded-md overflow-hidden bg-gray-100">
                          <img 
                            className="h-12 w-12 object-cover" 
                            src={service.imageUrl || '/avatars/default-avatar.png'} 
                            alt={service.name}
                            onError={(e) => {
                              e.target.src = '/avatars/default-avatar.png';
                              e.target.onerror = null;
                            }}
                          />
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">{service.name}</div>
                          <div className="text-xs text-gray-500 max-w-xs overflow-hidden text-ellipsis whitespace-nowrap">
                            {service.shortDescription || service.description?.substring(0, 50) || ''}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {service.specialtyId?.name || 'N/A'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {service.type === 'examination' ? 'Khám bệnh' :
                         service.type === 'diagnostic' ? 'Chẩn đoán' :
                         service.type === 'treatment' ? 'Điều trị' :
                         service.type === 'procedure' ? 'Thủ thuật' :
                         service.type === 'surgery' ? 'Phẫu thuật' :
                         service.type === 'consultation' ? 'Tư vấn' : service.type}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {formatPrice(service.price)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {service.duration} phút
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        service.status === 'active' || service.isActive
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {service.status === 'active' || service.isActive ? 'Đang hoạt động' : 'Tạm ngưng'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end space-x-3">
                        <button
                          className="p-1.5 text-blue-600 hover:text-blue-900 rounded-full hover:bg-blue-50"
                          onClick={() => openModal('addImage', service)}
                          title="Cập nhật ảnh"
                        >
                          <FaImage className="h-4 w-4" />
                        </button>
                        <button
                          className="p-1.5 text-blue-600 hover:text-blue-900 rounded-full hover:bg-blue-50"
                          onClick={() => openModal('price-history', service)}
                          title="Lịch sử giá"
                        >
                          <FaHistory className="h-4 w-4" />
                        </button>
                        <button
                          className="p-1.5 text-blue-600 hover:text-blue-900 rounded-full hover:bg-blue-50"
                          onClick={() => openModal('edit', service)}
                          title="Chỉnh sửa"
                        >
                          <FaEdit className="h-4 w-4" />
                        </button>
                        <button
                          className="p-1.5 text-red-600 hover:text-red-900 rounded-full hover:bg-red-50"
                          onClick={() => openModal('delete', service)}
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
                  <td colSpan="7" className="px-6 py-10 text-center text-gray-500">
                    Không có dữ liệu dịch vụ
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

export default Services;
