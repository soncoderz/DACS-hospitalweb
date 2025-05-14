import React, { useState, useEffect } from 'react';
import { FaPlus, FaEdit, FaTrash, FaSearch, FaFilter, FaDownload, FaImage, FaHospital, FaBuilding, FaInfoCircle, FaTools, FaTimes, FaExclamationCircle, FaFileAlt } from 'react-icons/fa';
import api from '../../utils/api';
import { toast } from 'react-toastify';


const Rooms = () => {
  const [rooms, setRooms] = useState([]);
  const [hospitals, setHospitals] = useState([]);
  const [specialties, setSpecialties] = useState([]);
  const [hospitalSpecialties, setHospitalSpecialties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState({
    status: 'all',
    hospitalId: 'all',
    type: 'all'
  });
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    pageSize: 10
  });
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalType, setModalType] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    number: '',
    floor: '',
    type: 'examination',
    capacity: 1,
    description: '',
    notes: '',
    hospitalId: '',
    specialtyId: '',
    equipment: [],
    status: 'active'
  });
  const [equipmentInput, setEquipmentInput] = useState('');
  const [loadingSpecialties, setLoadingSpecialties] = useState(false);

  useEffect(() => {
    fetchData();
    fetchHospitals();
    fetchAllSpecialties();
  }, [pagination.currentPage, filter]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/admin/rooms?page=${pagination.currentPage}&limit=${pagination.pageSize}&status=${filter.status}&hospitalId=${filter.hospitalId}&type=${filter.type}&search=${searchTerm}`);
      if (res.data.success) {
        // Check for nested structure in data.data.rooms
        if (res.data.data && res.data.data.rooms && Array.isArray(res.data.data.rooms)) {
          setRooms(res.data.data.rooms);
          setPagination({
            ...pagination,
            totalPages: Math.ceil(res.data.data.total / pagination.pageSize) || 1
          });
        } 
        // Check if data array is directly in res.data.data
        else if (res.data.data && Array.isArray(res.data.data) && res.data.data.length > 0) {
          setRooms(res.data.data);
          setPagination({
            ...pagination,
            totalPages: Math.ceil(res.data.total / pagination.pageSize) || 1
          });
        } else {
          console.error('No rooms found in response:', res.data);
          setRooms([]);
          setPagination({
            ...pagination,
            totalPages: 1
          });
        }
      } else {
        console.error('Failed to fetch rooms:', res.data);
        setRooms([]);
        setPagination({
          ...pagination,
          totalPages: 1
        });
      }
    } catch (error) {
      console.error('Error fetching rooms:', error);
      toast.error('Không thể tải dữ liệu phòng');
      setRooms([]);
      setPagination({
        ...pagination,
        totalPages: 1
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchHospitals = async () => {
    try {
      const res = await api.get('/admin/hospitals');
      if (res.data.success) {
        // Check for nested structure in data.data.hospitals
        if (res.data.data && res.data.data.hospitals && Array.isArray(res.data.data.hospitals)) {
          setHospitals(res.data.data.hospitals);
        }
        // Check if data array is directly in res.data.data
        else if (res.data.data && Array.isArray(res.data.data) && res.data.data.length > 0) {
          setHospitals(res.data.data);
        } else {
          console.error('No hospitals found in response:', res.data);
          setHospitals([]);
          toast.error('Không thể tải danh sách cơ sở y tế');
        }
      } else {
        console.error('Failed to fetch hospitals:', res.data);
        setHospitals([]);
        toast.error('Không thể tải danh sách cơ sở y tế');
      }
    } catch (error) {
      console.error('Error fetching hospitals:', error);
      toast.error('Không thể tải danh sách cơ sở y tế');
      setHospitals([]);
    }
  };

  const fetchAllSpecialties = async () => {
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

  const fetchHospitalSpecialties = async (hospitalId) => {
    if (!hospitalId) {
      setHospitalSpecialties([]);
      return;
    }

    setLoadingSpecialties(true);
    try {
      const res = await api.get(`/hospitals/${hospitalId}/specialties`);
      if (res.data.success) {
        let specialtiesData = [];
        if (Array.isArray(res.data.data)) {
          specialtiesData = res.data.data;
        } else if (res.data.data && res.data.data.specialties) {
          specialtiesData = res.data.data.specialties;
        }
        
        setHospitalSpecialties(specialtiesData);
        
        // Kiểm tra xem specialtyId hiện tại có trong danh sách chuyên khoa của bệnh viện này không
        if (formData.specialtyId) {
          const isValidSpecialty = specialtiesData.some(s => s._id === formData.specialtyId);
          if (!isValidSpecialty) {
            // Nếu không có, reset specialtyId - use callback to avoid render state update
            setTimeout(() => {
              setFormData(prev => ({ ...prev, specialtyId: '' }));
            }, 0);
          }
        }
      } else {
        console.error('Failed to fetch hospital specialties:', res.data);
        setHospitalSpecialties([]);
        toast.error('Không thể tải danh sách chuyên khoa của bệnh viện');
      }
    } catch (error) {
      console.error('Error fetching hospital specialties:', error);
      setHospitalSpecialties([]);
      toast.error('Không thể tải danh sách chuyên khoa của bệnh viện');
    } finally {
      setLoadingSpecialties(false);
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

  const openModal = (type, room = null) => {
    setModalType(type);
    
    if (type === 'add') {
      setFormData({
        name: '',
        number: '',
        floor: '',
        type: 'examination',
        capacity: 1,
        description: '',
        notes: '',
        hospitalId: '',
        specialtyId: '',
        equipment: [],
        status: 'active'
      });
      setHospitalSpecialties([]);
    } else if (type === 'edit' && room) {
      const hospitalId = room.hospitalId?._id || room.hospitalId || '';
      const specialtyId = room.specialtyId?._id || room.specialtyId || '';
      
      setFormData({
        name: room.name || '',
        number: room.number || '',
        floor: room.floor || '',
        type: room.type || 'examination',
        capacity: room.capacity || 1,
        description: room.description || '',
        notes: room.notes || '',
        hospitalId: hospitalId,
        specialtyId: specialtyId,
        equipment: room.equipment || [],
        status: room.status || 'active'
      });
      
      // Nếu có hospitalId, load chuyên khoa của bệnh viện đó
      if (hospitalId) {
        fetchHospitalSpecialties(hospitalId);
      }
    }
    
    setSelectedRoom(room);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedRoom(null);
    setModalType('');
    setEquipmentInput('');
    setHospitalSpecialties([]);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    
    // Special handling for capacity to ensure it's a number between 1-20
    if (name === 'capacity') {
      let capacityValue = parseInt(value, 10);
      // Ensure it's a valid number
      if (isNaN(capacityValue)) capacityValue = 1;
      // Ensure it's within range 1-20
      capacityValue = Math.max(1, Math.min(20, capacityValue));
      setFormData({ ...formData, [name]: capacityValue });
    }
    // Handling for hospitalId
    else if (name === 'hospitalId') {
      // First update the formData
      setFormData(prev => ({ ...prev, [name]: value, specialtyId: '' }));
      
      // Then fetch hospital specialties in a separate operation
      if (value) {
        setTimeout(() => {
          fetchHospitalSpecialties(value);
        }, 0);
      } else {
        setHospitalSpecialties([]);
      }
    } 
    else {
      setFormData({ ...formData, [name]: value });
    }
  };

  const handleEquipmentInputChange = (e) => {
    setEquipmentInput(e.target.value);
  };
  
  const addEquipment = () => {
    if (equipmentInput.trim() !== '') {
      setFormData({
        ...formData,
        equipment: [...formData.equipment, equipmentInput.trim()]
      });
      setEquipmentInput('');
    }
  };
  
  const removeEquipment = (index) => {
    const updatedEquipment = [...formData.equipment];
    updatedEquipment.splice(index, 1);
    setFormData({ ...formData, equipment: updatedEquipment });
  };

  // Check if form is valid without showing toasts
  const isFormValid = () => {
    return formData.name && formData.hospitalId && formData.number && 
           formData.capacity >= 1 && formData.capacity <= 20;
  };

  const validateForm = () => {
    if (!formData.name) {
      toast.error('Vui lòng nhập tên phòng');
      return false;
    }
    if (!formData.hospitalId) {
      toast.error('Vui lòng chọn cơ sở y tế');
      return false;
    }
    if (!formData.number) {
      toast.error('Vui lòng nhập số phòng');
      return false;
    }
    if (!formData.capacity || formData.capacity < 1 || formData.capacity > 20) {
      toast.error('Sức chứa không hợp lệ (phải là số nguyên từ 1-20)');
      return false;
    }
    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    setLoading(true);
    try {
      // Prepare data - handle empty ObjectId fields
      const dataToSubmit = {...formData};
      
      // Handle empty fields that expect ObjectIds
      // Convert empty strings to null for ObjectId fields
      ['specialtyId', 'hospitalId'].forEach(field => {
        if (dataToSubmit[field] === '') {
          dataToSubmit[field] = null;
        }
      });
      
      // Kiểm tra tính hợp lệ của specialtyId
      if (dataToSubmit.specialtyId && dataToSubmit.hospitalId) {
        // Nếu cả hai đều có giá trị, kiểm tra xem specialtyId có thuộc hospitalId không
        const isValidSpecialty = hospitalSpecialties.some(s => s._id === dataToSubmit.specialtyId);
        if (!isValidSpecialty) {
          // Nếu không hợp lệ, gán là null
          dataToSubmit.specialtyId = null;
          toast.warning('Chuyên khoa không phù hợp với bệnh viện, đã bỏ qua thông tin chuyên khoa.');
        }
      }

      // Nếu không có hospitalId thì cũng không thể có specialtyId
      if (!dataToSubmit.hospitalId) {
        dataToSubmit.specialtyId = null;
      }
      
      console.log('Submitting data:', dataToSubmit);
      
      let response;
      
      if (modalType === 'add') {
        response = await api.post('/admin/rooms', dataToSubmit);
        if (response.data.success) {
          toast.success('Thêm phòng mới thành công');
          fetchData();
          closeModal();
        } else {
          toast.error(response.data.message || 'Lỗi khi thêm phòng');
        }
      } else if (modalType === 'edit' && selectedRoom) {
        response = await api.put(`/admin/rooms/${selectedRoom._id}`, dataToSubmit);
        if (response.data.success) {
          toast.success('Cập nhật phòng thành công');
          fetchData();
          closeModal();
        } else {
          toast.error(response.data.message || 'Lỗi khi cập nhật phòng');
        }
      }
    } catch (error) {
      console.error(`Error ${modalType === 'add' ? 'adding' : 'updating'} room:`, error);
      
      // Cải thiện thông báo lỗi
      const errorMessage = error.response?.data?.message || 
                          `Lỗi khi ${modalType === 'add' ? 'thêm' : 'cập nhật'} phòng`;
      
      // Hiển thị chi tiết lỗi nếu có lỗi CastError
      if (error.response?.data?.error?.includes('Cast to ObjectId failed')) {
        toast.error('Lỗi định dạng dữ liệu: Vui lòng kiểm tra lại thông tin chuyên khoa');
      } else {
        console.error('Error response:', error.response?.data);
        toast.error(errorMessage);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteRoom = async (roomId) => {
    try {
      const res = await api.delete(`/admin/rooms/${roomId}`);
      if (res.data.success) {
        toast.success('Đã xóa phòng thành công');
        fetchData();
        closeModal();
      }
    } catch (error) {
      console.error('Error deleting room:', error);
      toast.error('Không thể xóa phòng');
    }
  };

  const exportData = () => {
    // Xuất dữ liệu dưới dạng CSV
    const fields = ['_id', 'name', 'number', 'floor', 'type', 'status', 'hospitalId.name', 'specialtyId.name', 'capacity', 'createdAt'];
    
    const csvContent = [
      // Header
      fields.join(','),
      // Rows
      ...rooms.map(item => 
        fields.map(field => {
          // Xử lý trường hợp nested field (hospitalId.name)
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
    link.setAttribute('download', `rooms_${new Date().toISOString().split('T')[0]}.csv`);
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

  const renderModal = () => {
    return (
      <div className="fixed inset-0 z-50 overflow-y-auto bg-black bg-opacity-50 flex items-center justify-center">
        <div className="relative bg-white rounded-lg max-w-2xl w-full mx-4 shadow-xl">
          <div className="flex items-center justify-between p-4 border-b">
            <h2 className="text-xl font-semibold text-gray-800">
              {modalType === 'add' && 'Thêm phòng mới'}
              {modalType === 'edit' && 'Chỉnh sửa thông tin phòng'}
              {modalType === 'delete' && 'Xác nhận xóa phòng'}
            </h2>
            <button 
              className="text-gray-500 hover:text-gray-700 focus:outline-none"
              onClick={closeModal}
            >
              <FaTimes className="h-5 w-5" />
            </button>
          </div>
          
          <div className="p-6 max-h-[70vh] overflow-y-auto">
            {(modalType === 'add' || modalType === 'edit') && (
              <form>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                      Tên phòng <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      id="name"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Nhập tên phòng"
                      required
                    />
                  </div>
                  
                  <div>
                    <label htmlFor="number" className="block text-sm font-medium text-gray-700 mb-1">
                      Số phòng <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      id="number"
                      name="number"
                      value={formData.number}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Nhập số phòng"
                      required
                    />
                  </div>
                  
                  <div>
                    <label htmlFor="floor" className="block text-sm font-medium text-gray-700 mb-1">
                      Tầng <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      id="floor"
                      name="floor"
                      value={formData.floor}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Nhập tầng"
                      required
                    />
                  </div>
                  
                  <div>
                    <label htmlFor="type" className="block text-sm font-medium text-gray-700 mb-1">
                      Loại phòng <span className="text-red-500">*</span>
                    </label>
                    <select
                      id="type"
                      name="type"
                      value={formData.type}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      required
                    >
                      <option value="examination">Phòng khám</option>
                      <option value="procedure">Phòng thủ thuật</option>
                      <option value="operation">Phòng phẫu thuật</option>
                      <option value="consultation">Phòng tư vấn</option>
                      <option value="waiting">Phòng chờ</option>
                    </select>
                  </div>
                  
                  <div>
                    <label htmlFor="capacity" className="block text-sm font-medium text-gray-700 mb-1">
                      Sức chứa (người) <span className="text-red-500">*</span>
                      <span className="text-sm text-gray-500 ml-1">(1-20)</span>
                    </label>
                    <input
                      type="number"
                      id="capacity"
                      name="capacity"
                      value={formData.capacity}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      min="1"
                      max="20"
                      required
                    />
                  </div>
                  
                  <div>
                    <label htmlFor="hospitalId" className="block text-sm font-medium text-gray-700 mb-1">
                      Cơ sở y tế <span className="text-red-500">*</span>
                    </label>
                    <select
                      id="hospitalId"
                      name="hospitalId"
                      value={formData.hospitalId}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      required
                    >
                      <option value="">-- Chọn cơ sở y tế --</option>
                      {hospitals.map(hospital => (
                        <option key={hospital._id} value={hospital._id}>
                          {hospital.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  
                  <div>
                    <label htmlFor="specialtyId" className="block text-sm font-medium text-gray-700 mb-1">
                      Chuyên khoa
                    </label>
                    <select
                      id="specialtyId"
                      name="specialtyId"
                      value={formData.specialtyId}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      disabled={!formData.hospitalId || loadingSpecialties}
                    >
                      <option value="">-- Chọn chuyên khoa --</option>
                      {loadingSpecialties ? (
                        <option value="" disabled>Đang tải chuyên khoa...</option>
                      ) : (
                        hospitalSpecialties.length > 0 ? (
                          hospitalSpecialties.map(specialty => (
                            <option key={specialty._id} value={specialty._id}>
                              {specialty.name}
                            </option>
                          ))
                        ) : (
                          formData.hospitalId ? (
                            <option value="" disabled>Không có chuyên khoa nào</option>
                          ) : null
                        )
                      )}
                    </select>
                  </div>
                  
                  <div>
                    <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-1">
                      Trạng thái <span className="text-red-500">*</span>
                    </label>
                    <select
                      id="status"
                      name="status"
                      value={formData.status}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      required
                    >
                      <option value="active">Đang hoạt động</option>
                      <option value="maintenance">Bảo trì</option>
                      <option value="inactive">Không hoạt động</option>
                    </select>
                  </div>
                </div>
                
                <div className="mb-4">
                  <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
                    Mô tả
                  </label>
                  <textarea
                    id="description"
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Mô tả phòng"
                    rows="3"
                  />
                </div>
                
                <div className="mb-4">
                  <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-1">
                    Ghi chú
                  </label>
                  <textarea
                    id="notes"
                    name="notes"
                    value={formData.notes}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Ghi chú bổ sung"
                    rows="2"
                  />
                </div>
                
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Trang thiết bị
                  </label>
                  <div className="flex flex-wrap gap-2 mb-2">
                    {formData.equipment.map((item, index) => (
                      <div key={index} className="flex items-center bg-blue-50 px-3 py-1 rounded-full text-sm">
                        <span className="text-blue-700">{item}</span>
                        <button
                          type="button"
                          onClick={() => removeEquipment(index)}
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
                      value={equipmentInput}
                      onChange={handleEquipmentInputChange}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-l-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Nhập tên thiết bị"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          addEquipment();
                        }
                      }}
                    />
                    <button
                      type="button"
                      onClick={addEquipment}
                      className="px-4 py-2 bg-blue-600 text-white rounded-r-lg hover:bg-blue-700 transition-colors"
                    >
                      Thêm
                    </button>
                  </div>
                </div>
              </form>
            )}
            
            {modalType === 'delete' && selectedRoom && (
              <div>
                <div className="p-4 mb-4 bg-red-50 border-l-4 border-red-400 rounded-md">
                  <div className="flex">
                    <FaExclamationCircle className="h-5 w-5 text-red-500 mr-2" />
                    <p className="text-sm text-red-700">
                      Bạn có chắc chắn muốn xóa phòng <span className="font-semibold">{selectedRoom.name}</span>?
                      <br />
                      Hành động này không thể hoàn tác và có thể ảnh hưởng đến các lịch khám đã được đặt.
                    </p>
                  </div>
                </div>
                
                <div className="bg-gray-50 p-4 rounded-md">
                  <h3 className="text-sm font-medium text-gray-700 mb-2">Chi tiết phòng:</h3>
                  <ul className="space-y-2">
                    <li className="flex items-start">
                      <FaBuilding className="h-5 w-5 text-gray-500 mr-2" />
                      <span className="text-sm">
                        <strong>Phòng:</strong> {selectedRoom.name} - {selectedRoom.number} (Tầng {selectedRoom.floor})
                      </span>
                    </li>
                    <li className="flex items-start">
                      <FaHospital className="h-5 w-5 text-gray-500 mr-2" />
                      <span className="text-sm">
                        <strong>Cơ sở y tế:</strong> {selectedRoom.hospitalId?.name || 'N/A'}
                      </span>
                    </li>
                    {selectedRoom.specialtyId && (
                      <li className="flex items-start">
                        <FaFileAlt className="h-5 w-5 text-gray-500 mr-2" />
                        <span className="text-sm">
                          <strong>Chuyên khoa:</strong> {selectedRoom.specialtyId?.name || 'N/A'}
                        </span>
                      </li>
                    )}
                  </ul>
                </div>
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
            
            {modalType === 'add' && (
              <button 
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
                onClick={handleSubmit}
                disabled={!isFormValid()}
              >
                Thêm phòng
              </button>
            )}
            
            {modalType === 'edit' && (
              <button 
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
                onClick={handleSubmit}
                disabled={!isFormValid()}
              >
                Cập nhật
              </button>
            )}
            
            {modalType === 'delete' && (
              <button 
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors focus:outline-none focus:ring-2 focus:ring-red-500"
                onClick={() => handleDeleteRoom(selectedRoom._id)}
              >
                Xóa phòng
              </button>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="bg-white rounded-lg shadow-sm overflow-hidden">
      <div className="p-6 border-b">
        <h1 className="text-2xl font-bold text-gray-800">Quản lý phòng</h1>
      </div>

      <div className="p-6 border-b">
        <div className="flex flex-col lg:flex-row gap-4">
          {/* Search Bar */}
          <div className="w-full lg:w-1/3">
            <form onSubmit={handleSearch} className="flex w-full">
              <div className="relative w-full">
                <input
                  type="text"
                  placeholder="Tìm kiếm theo tên phòng, số phòng..."
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
                name="status"
                value={filter.status}
                onChange={handleFilterChange}
                className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white appearance-none"
              >
                <option value="all">Tất cả trạng thái</option>
                <option value="active">Đang hoạt động</option>
                <option value="maintenance">Bảo trì</option>
                <option value="inactive">Không hoạt động</option>
              </select>
            </div>

            <div className="relative">
              <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                <FaFilter className="text-gray-400" />
              </div>
              <select
                name="hospitalId"
                value={filter.hospitalId}
                onChange={handleFilterChange}
                className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white appearance-none"
              >
                <option value="all">Tất cả cơ sở y tế</option>
                {hospitals.map(hospital => (
                  <option key={hospital._id} value={hospital._id}>
                    {hospital.name}
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
                <option value="all">Tất cả loại phòng</option>
                <option value="examination">Phòng khám</option>
                <option value="procedure">Phòng thủ thuật</option>
                <option value="operation">Phòng phẫu thuật</option>
                <option value="consultation">Phòng tư vấn</option>
                <option value="waiting">Phòng chờ</option>
              </select>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row justify-between items-center mt-4">
          <div className="mb-2 sm:mb-0">
            {/* Future filters can go here */}
          </div>
          <div className="flex flex-col sm:flex-row gap-2">
            <button 
              className="flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              onClick={() => openModal('add')}
            >
              <FaPlus />
              <span>Thêm phòng mới</span>
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
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tên phòng</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cơ sở y tế</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Chuyên khoa</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Loại phòng</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Sức chứa</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Trạng thái</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Trang thiết bị</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Hành động</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {rooms.length > 0 ? (
                rooms.map((room) => (
                  <tr key={room._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{room.name}</div>
                      <div className="text-xs text-gray-500">
                        Số {room.number}, Tầng {room.floor}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {room.hospitalId?.name || (typeof room.hospitalId === 'string' ? 'ID: ' + room.hospitalId : 'N/A')}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {room.specialtyId?.name || (typeof room.specialtyId === 'string' && room.specialtyId ? 'ID: ' + room.specialtyId : 'Không có')}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {room.type === 'examination' ? 'Phòng khám' :
                         room.type === 'procedure' ? 'Phòng thủ thuật' :
                         room.type === 'operation' ? 'Phòng phẫu thuật' :
                         room.type === 'consultation' ? 'Phòng tư vấn' :
                         room.type === 'waiting' ? 'Phòng chờ' : room.type}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{room.capacity} người</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        room.status === 'active' 
                          ? 'bg-green-100 text-green-800' 
                          : room.status === 'maintenance'
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-red-100 text-red-800'
                      }`}>
                        {room.status === 'active' 
                          ? 'Đang hoạt động' 
                          : room.status === 'maintenance'
                            ? 'Bảo trì'
                            : 'Không hoạt động'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-wrap gap-1">
                        {room.equipment && room.equipment.length > 0 ? (
                          room.equipment.slice(0, 2).map((item, index) => (
                            <span 
                              key={index} 
                              className="inline-flex px-2 py-1 text-xs bg-blue-50 text-blue-700 rounded-full"
                            >
                              {item}
                            </span>
                          ))
                        ) : (
                          <span className="text-sm text-gray-500">Không có</span>
                        )}
                        {room.equipment && room.equipment.length > 2 && (
                          <span 
                            className="inline-flex px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded-full cursor-pointer"
                            title={room.equipment.slice(2).join(', ')}
                          >
                            +{room.equipment.length - 2}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center space-x-2">
                        <button
                          className="p-2 text-blue-600 hover:text-blue-900 rounded-full hover:bg-blue-50"
                          onClick={() => openModal('edit', room)}
                          title="Chỉnh sửa phòng"
                        >
                          <FaEdit className="h-5 w-5" />
                        </button>
                        <button
                          className="p-2 text-red-600 hover:text-red-900 rounded-full hover:bg-red-50"
                          onClick={() => openModal('delete', room)}
                          title="Xóa phòng"
                        >
                          <FaTrash className="h-5 w-5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="8" className="px-6 py-10 text-center text-gray-500">
                    Không có dữ liệu phòng
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

export default Rooms;
