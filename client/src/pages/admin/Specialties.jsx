import React, { useState, useEffect } from 'react';
import { FaPlus, FaEdit, FaTrash, FaSearch, FaFilter, FaDownload, FaImage, FaTimes, FaExclamationCircle, FaUserMd, FaHospital, FaFolderOpen, FaCamera, FaStethoscope, FaHeartbeat, FaLungs, FaBrain, FaAmbulance, FaBaby, FaTooth, FaEye, FaFileMedicalAlt, FaNotesMedical, FaXRay, FaBone, FaAllergies, FaWheelchair, FaPills, FaProcedures, FaHandHoldingMedical, FaVial, FaCheck, FaAngleRight, FaDna, FaFirstAid, FaBandAid, FaMicroscope, FaBed, FaVirus, FaTemperatureLow, FaHeadSideMask, FaCapsules, FaSyringe, FaPrescriptionBottle, FaFlask, FaHeadSideCough, FaBookMedical, FaIdCard, FaThermometer, FaHospitalUser, FaHospitalAlt, FaClinicMedical, FaHeartBroken, FaLungsVirus, FaWeight, FaSkull } from 'react-icons/fa';
import { GiMedicines, GiDna1, GiMedicalPack, GiHealthNormal, GiHumanEar, GiHeartOrgan, GiChemicalDrop } from 'react-icons/gi';
import { MdLocalHospital, MdMedicalServices, MdBloodtype, MdOutlineVaccines } from 'react-icons/md';
import { IoNutritionOutline } from 'react-icons/io5';
import api from '../../utils/api';
import { toast } from 'react-toastify';


const Specialties = () => {
  const [specialties, setSpecialties] = useState([]);
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
  const [selectedSpecialty, setSelectedSpecialty] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalType, setModalType] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    isActive: true,
    icon: 'stethoscope'
  });
  const [selectedImage, setSelectedImage] = useState(null);
  const [loadingAction, setLoadingAction] = useState(false);
  const [previewImage, setPreviewImage] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploadLoading, setUploadLoading] = useState(false);
  const [showIconSelector, setShowIconSelector] = useState(false);

  // Danh sách các icon có thể chọn
  const availableIcons = [
    { name: 'stethoscope', component: FaStethoscope, label: 'Ống nghe' },
    { name: 'heartbeat', component: FaHeartbeat, label: 'Nhịp tim' },
    { name: 'lungs', component: FaLungs, label: 'Phổi' },
    { name: 'brain', component: FaBrain, label: 'Não' },
    { name: 'ambulance', component: FaAmbulance, label: 'Xe cứu thương' },
    { name: 'baby', component: FaBaby, label: 'Trẻ em' },
    { name: 'tooth', component: FaTooth, label: 'Răng' },
    { name: 'eye', component: FaEye, label: 'Mắt' },
    { name: 'file-medical-alt', component: FaFileMedicalAlt, label: 'Hồ sơ y tế' },
    { name: 'notes-medical', component: FaNotesMedical, label: 'Ghi chú y tế' },
    { name: 'x-ray', component: FaXRay, label: 'X-quang' },
    { name: 'bone', component: FaBone, label: 'Xương' },
    { name: 'allergies', component: FaAllergies, label: 'Dị ứng' },
    { name: 'wheelchair', component: FaWheelchair, label: 'Xe lăn' },
    { name: 'pills', component: FaPills, label: 'Thuốc' },
    { name: 'procedures', component: FaProcedures, label: 'Phẫu thuật' },
    { name: 'hand-holding-medical', component: FaHandHoldingMedical, label: 'Chăm sóc y tế' },
    { name: 'vial', component: FaVial, label: 'Ống nghiệm' },
    { name: 'user-md', component: FaUserMd, label: 'Bác sĩ' },
    { name: 'hospital', component: FaHospital, label: 'Bệnh viện' },
    { name: 'dna', component: FaDna, label: 'DNA' },
    { name: 'first-aid', component: FaFirstAid, label: 'Sơ cứu' },
    { name: 'band-aid', component: FaBandAid, label: 'Băng cá nhân' },
    { name: 'microscope', component: FaMicroscope, label: 'Kính hiển vi' },
    { name: 'bed', component: FaBed, label: 'Giường bệnh' },
    { name: 'virus', component: FaVirus, label: 'Virus' },
    { name: 'temperature-low', component: FaTemperatureLow, label: 'Nhiệt độ' },
    { name: 'head-side-mask', component: FaHeadSideMask, label: 'Khẩu trang' },
    { name: 'capsules', component: FaCapsules, label: 'Viên nang' },
    { name: 'syringe', component: FaSyringe, label: 'Tiêm' },
    { name: 'prescription-bottle', component: FaPrescriptionBottle, label: 'Lọ thuốc' },
    { name: 'flask', component: FaFlask, label: 'Ống nghiệm' },
    { name: 'head-side-cough', component: FaHeadSideCough, label: 'Ho' },
    { name: 'book-medical', component: FaBookMedical, label: 'Sách y khoa' },
    { name: 'id-card', component: FaIdCard, label: 'Thẻ bệnh nhân' },
    { name: 'thermometer', component: FaThermometer, label: 'Nhiệt kế' },
    { name: 'hospital-user', component: FaHospitalUser, label: 'Bệnh nhân' },
    { name: 'hospital-alt', component: FaHospitalAlt, label: 'Tòa nhà y tế' },
    { name: 'clinic-medical', component: FaClinicMedical, label: 'Phòng khám' },
    { name: 'heart-broken', component: FaHeartBroken, label: 'Tim đập chậm' },
    { name: 'lungs-virus', component: FaLungsVirus, label: 'Viêm phổi' },
    { name: 'weight', component: FaWeight, label: 'Cân nặng' },
    { name: 'skull', component: FaSkull, label: 'Xương sọ' },
    { name: 'gi-medicines', component: GiMedicines, label: 'Thuốc' },
    { name: 'gi-dna', component: GiDna1, label: 'DNA' },
    { name: 'gi-medical-pack', component: GiMedicalPack, label: 'Túi y tế' },
    { name: 'gi-health', component: GiHealthNormal, label: 'Sức khỏe' },
    { name: 'gi-ear', component: GiHumanEar, label: 'Tai' },
    { name: 'gi-heart', component: GiHeartOrgan, label: 'Tim' },
    { name: 'gi-chemical', component: GiChemicalDrop, label: 'Hóa chất' },
    { name: 'md-hospital', component: MdLocalHospital, label: 'Bệnh viện' },
    { name: 'md-medical', component: MdMedicalServices, label: 'Dịch vụ y tế' },
    { name: 'md-blood', component: MdBloodtype, label: 'Nhóm máu' },
    { name: 'md-vaccines', component: MdOutlineVaccines, label: 'Vắc xin' },
    { name: 'io-nutrition', component: IoNutritionOutline, label: 'Dinh dưỡng' },
  ];

  // Component hiển thị icon đã chọn
  const SelectedIconDisplay = ({ iconName }) => {
    const selectedIcon = availableIcons.find(icon => icon.name === iconName) || availableIcons[0];
    const IconComponent = selectedIcon.component;
    
    return (
      <div className="flex items-center">
        <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mr-2">
          <IconComponent className="text-blue-600" />
        </div>
        <div>{selectedIcon.label}</div>
      </div>
    );
  };

  useEffect(() => {
    fetchData();
  }, [pagination.currentPage, filter]);

  const fetchData = async () => {
    setLoading(true);
    try {
      let apiUrl = `/admin/specialties?page=${pagination.currentPage}&limit=${pagination.pageSize}&search=${searchTerm}`;
      
      // Add isActive parameter based on status filter
      if (filter.status === 'active') {
        apiUrl += '&isActive=true';
      } else if (filter.status === 'inactive') {
        apiUrl += '&isActive=false';
      }
      
      const res = await api.get(apiUrl);
      if (res.data.success) {
        const { specialties, total, totalPages, currentPage } = res.data.data;
        setSpecialties(specialties || []);
        setPagination({
          ...pagination,
          totalPages: totalPages || Math.ceil(total / pagination.pageSize),
          currentPage: currentPage || pagination.currentPage
        });
      } else {
        setSpecialties([]);
        toast.error(res.data.message || 'Không thể tải dữ liệu chuyên khoa');
      }
    } catch (error) {
      console.error('Error fetching specialties:', error);
      toast.error('Không thể tải dữ liệu chuyên khoa');
      setSpecialties([]);
    } finally {
      setLoading(false);
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

  const openModal = (type, specialty = null) => {
    setModalType(type);
    setSelectedSpecialty(specialty);
    
    if (type === 'add') {
      setFormData({
        name: '',
        description: '',
        isActive: true,
        icon: 'stethoscope'
      });
    } else if (type === 'edit' && specialty) {
      setFormData({
        name: specialty.name || '',
        description: specialty.description || '',
        isActive: specialty.isActive !== undefined ? specialty.isActive : true,
        icon: specialty.icon || 'stethoscope'
      });
    } else if (type === 'addImage') {
      setSelectedImage(null);
      setPreviewImage(null);
      setSelectedFile(null);
    }
    
    setShowIconSelector(false);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedSpecialty(null);
    setModalType('');
    setSelectedImage(null);
    setPreviewImage(null);
    setSelectedFile(null);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };
  
  const handleIsActiveChange = (e) => {
    setFormData({ ...formData, isActive: e.target.value === 'true' });
  };

  // Hàm xử lý khi chọn icon
  const handleIconSelect = (iconName) => {
    setFormData({ ...formData, icon: iconName });
    setShowIconSelector(false);
  };
  
  const handleImageChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedImage(e.target.files[0]);
    }
  };

  const handleDeleteSpecialty = async (specialtyId) => {
    try {
      setLoadingAction(true);
      const res = await api.delete(`/admin/specialties/${specialtyId}`);
      if (res.data.success) {
        toast.success('Đã xóa chuyên khoa thành công');
        fetchData();
        closeModal();
      }
    } catch (error) {
      console.error('Error deleting specialty:', error);
      toast.error('Không thể xóa chuyên khoa');
    } finally {
      setLoadingAction(false);
    }
  };

  const validateForm = () => {
    if (!formData.name) {
      toast.error('Vui lòng nhập tên chuyên khoa');
      return false;
    }
    return true;
  };
  
  const handleSubmit = async () => {
    if (!validateForm()) return;

    setLoadingAction(true);
    try {
      let response;
      
      if (modalType === 'add') {
        response = await api.post('/admin/specialties', formData);
        if (response.data.success) {
          toast.success('Thêm chuyên khoa mới thành công');
          fetchData();
          closeModal();
        } else {
          toast.error(response.data.message || 'Lỗi khi thêm chuyên khoa');
        }
      } else if (modalType === 'edit' && selectedSpecialty) {
        response = await api.put(`/admin/specialties/${selectedSpecialty._id}`, formData);
        if (response.data.success) {
          toast.success('Cập nhật chuyên khoa thành công');
          fetchData();
          closeModal();
        } else {
          toast.error(response.data.message || 'Lỗi khi cập nhật chuyên khoa');
        }
      }
    } catch (error) {
      console.error(`Error ${modalType === 'add' ? 'adding' : 'updating'} specialty:`, error);
      toast.error(error.response?.data?.message || `Lỗi khi ${modalType === 'add' ? 'thêm' : 'cập nhật'} chuyên khoa`);
    } finally {
      setLoadingAction(false);
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
  
  const handleUploadImage = async (specialtyId) => {
    if (!selectedFile) {
      toast.error('Vui lòng chọn một hình ảnh');
      return;
    }

    try {
      setUploadLoading(true);
      const formData = new FormData();
      formData.append('image', selectedFile);

      const res = await api.post(`/admin/specialties/${specialtyId}/image`, formData, {
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
    const fields = ['_id', 'name', 'description', 'status', 'createdAt'];
    
    const csvContent = [
      // Header
      fields.join(','),
      // Rows
      ...specialties.map(item => 
        fields.map(field => `"${item[field] || ''}"`)
        .join(',')
      )
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `specialties_${new Date().toISOString().split('T')[0]}.csv`);
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

  const handleDeleteImage = async (specialtyId) => {
    try {
      setLoadingAction(true);
      const res = await api.delete(`/admin/specialties/${specialtyId}/image`);
      if (res.data.success) {
        toast.success('Đã xóa hình ảnh thành công');
        fetchData();
        closeModal();
      }
    } catch (error) {
      console.error('Error deleting image:', error);
      toast.error('Không thể xóa hình ảnh');
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
                {modalType === 'add' && 'Thêm chuyên khoa mới'}
                {modalType === 'edit' && 'Chỉnh sửa chuyên khoa'}
                {modalType === 'delete' && 'Xác nhận xóa chuyên khoa'}
                {modalType === 'addImage' && 'Cập nhật hình ảnh chuyên khoa'}
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
                  <div className="mb-4">
                    <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                      Tên chuyên khoa <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      id="name"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Nhập tên chuyên khoa"
                      required
                    />
                  </div>
                  
                  {/* Thêm phần chọn Icon */}
                  <div className="mb-4">
                    <label htmlFor="icon" className="block text-sm font-medium text-gray-700 mb-1">
                      Icon chuyên khoa <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <button
                        type="button"
                        onClick={() => setShowIconSelector(!showIconSelector)}
                        className="w-full flex items-center justify-between px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                      >
                        <SelectedIconDisplay iconName={formData.icon} />
                        <FaAngleRight className={`transition-transform ${showIconSelector ? 'rotate-90' : ''}`} />
                      </button>
                      
                      {showIconSelector && (
                        <div className="absolute z-10 mt-1 w-full bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                          <div className="p-2 grid grid-cols-2 gap-2">
                            {availableIcons.map((icon) => (
                              <button
                                key={icon.name}
                                type="button"
                                onClick={() => handleIconSelect(icon.name)}
                                className={`flex items-center p-2 hover:bg-gray-100 rounded-md ${
                                  formData.icon === icon.name ? 'bg-blue-100' : ''
                                }`}
                              >
                                <div className="w-8 h-8 rounded-full flex items-center justify-center mr-2 bg-gray-100">
                                  {React.createElement(icon.component, { className: formData.icon === icon.name ? 'text-blue-600' : 'text-gray-600' })}
                                </div>
                                <span className="text-sm truncate">{icon.label}</span>
                                {formData.icon === icon.name && <FaCheck className="ml-auto text-blue-600" />}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="mb-4">
                    <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
                      Mô tả <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      id="description"
                      name="description"
                      value={formData.description}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Nhập mô tả về chuyên khoa"
                      rows="3"
                      required
                    />
                  </div>
                  
                  <div className="mb-4">
                    <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-1">
                      Trạng thái <span className="text-red-500">*</span>
                    </label>
                    <select
                      id="status"
                      name="isActive"
                      value={formData.isActive === true ? 'true' : 'false'}
                      onChange={handleIsActiveChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      required
                    >
                      <option value="true">Đang hoạt động</option>
                      <option value="false">Tạm ngưng</option>
                    </select>
                  </div>
                </form>
              )}
              
              {modalType === 'addImage' && selectedSpecialty && (
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
              
              {modalType === 'delete' && selectedSpecialty && (
                <div>
                  <div className="p-4 mb-4 bg-red-50 border-l-4 border-red-400 rounded-md">
                    <div className="flex">
                      <FaExclamationCircle className="h-5 w-5 text-red-500 mr-2" />
                      <p className="text-sm text-red-700">
                        Bạn có chắc chắn muốn xóa chuyên khoa <span className="font-semibold">{selectedSpecialty.name}</span>?
                        <br />
                        Hành động này không thể hoàn tác và có thể ảnh hưởng đến các bác sĩ, dịch vụ và lịch khám.
                      </p>
                    </div>
                  </div>
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
                  Thêm chuyên khoa
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
                  onClick={() => handleDeleteSpecialty(selectedSpecialty._id)}
                >
                  Xác nhận xóa
                </button>
              )}
              
              {modalType === 'addImage' && selectedFile && (
                <button 
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
                  onClick={() => handleUploadImage(selectedSpecialty._id)}
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
        <h1 className="text-2xl font-bold text-gray-800">Quản lý chuyên khoa</h1>
      </div>

      <div className="p-6 border-b">
        <div className="flex flex-col lg:flex-row gap-4">
          {/* Search Bar */}
          <div className="w-full lg:w-1/3">
            <form onSubmit={handleSearch} className="flex w-full">
              <div className="relative w-full">
                <input
                  type="text"
                  placeholder="Tìm kiếm chuyên khoa..."
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
              <span>Thêm chuyên khoa</span>
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
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Hình ảnh</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Icon</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tên chuyên khoa</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Mô tả</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Trạng thái</th>
                <th scope="col" className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Hành động</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {specialties.length > 0 ? (
                specialties.map((specialty) => {
                  // Lấy component icon từ tên icon
                  const IconComponent = availableIcons.find(i => i.name === specialty.icon)?.component || FaStethoscope;
                  
                  return (
                    <tr key={specialty._id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="h-16 w-16 rounded-md overflow-hidden bg-gray-100">
                          <img 
                            src={specialty.imageUrl || '/avatars/default-avatar.png'} 
                            alt={specialty.name} 
                            className="h-full w-full object-cover"
                            onError={(e) => {
                              e.target.src = '/avatars/default-avatar.png';
                              e.target.onerror = null;
                            }}
                          />
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                          <IconComponent className="text-blue-600 text-lg" />
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{specialty.name}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-600 max-w-xs truncate">{specialty.description || 'Không có mô tả'}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          specialty.status === 'active' || specialty.isActive === true
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {specialty.status === 'active' || specialty.isActive === true
                            ? 'Đang hoạt động' 
                            : 'Tạm ngưng'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <div className="flex items-center justify-center space-x-2">
                          <button
                            className="p-1.5 text-blue-600 hover:text-blue-900 rounded-full hover:bg-blue-50"
                            onClick={(e) => {
                              e.stopPropagation();
                              openModal('addImage', specialty);
                            }}
                            title="Cập nhật ảnh"
                          >
                            <FaImage className="h-4 w-4" />
                          </button>
                          <button
                            className="p-1.5 text-blue-600 hover:text-blue-900 rounded-full hover:bg-blue-50"
                            onClick={(e) => {
                              e.stopPropagation();
                              openModal('edit', specialty);
                            }}
                            title="Chỉnh sửa"
                          >
                            <FaEdit className="h-4 w-4" />
                          </button>
                          <button
                            className="p-1.5 text-red-600 hover:text-red-900 rounded-full hover:bg-red-50"
                            onClick={(e) => {
                              e.stopPropagation();
                              openModal('delete', specialty);
                            }}
                            title="Xóa"
                          >
                            <FaTrash className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan="7" className="px-6 py-10 text-center text-gray-500">
                    <div className="flex flex-col items-center justify-center">
                      <FaFolderOpen className="text-gray-300 text-4xl mb-4" />
                      <h3 className="text-lg font-medium text-gray-500">Không có dữ liệu chuyên khoa</h3>
                      <p className="text-gray-400 mt-1">Hãy thêm chuyên khoa mới</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination */}
      {!loading && specialties.length > 0 && (
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
      )}

      {isModalOpen && renderModal()}
    </div>
  );
};

export default Specialties;
