import React, { useState, useEffect } from 'react';
import { FaPlus, FaEdit, FaTrash, FaSearch, FaFilter, FaDownload, FaUserMd, FaCalendarAlt, FaClock, FaHospital, FaExclamationCircle, FaExclamationTriangle, FaDoorOpen, FaCalendarCheck, FaTimes, FaInfoCircle } from 'react-icons/fa';
import api from '../../utils/api';
import { toast } from 'react-toastify';


const DoctorSchedules = () => {
  const [schedules, setSchedules] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [hospitals, setHospitals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState({
    doctorId: 'all',
    hospitalId: 'all',
    roomId: 'all',
    isActive: 'all'
  });
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    pageSize: 10
  });
  const [selectedSchedule, setSelectedSchedule] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalType, setModalType] = useState('');
  const [rooms, setRooms] = useState([]);
  const [formData, setFormData] = useState({
    doctorId: '',
    hospitalId: '',
    date: '',
    roomId: '',
    isActive: true,
    timeSlots: [{
      startTime: '',
      endTime: ''
    }]
  });
  const [apiError, setApiError] = useState(null);
  const [conflicts, setConflicts] = useState([]);
  const [conflictDetails, setConflictDetails] = useState(null);
  const [formErrors, setFormErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const daysOfWeek = [
    { value: 'monday', label: 'Thứ 2' },
    { value: 'tuesday', label: 'Thứ 3' },
    { value: 'wednesday', label: 'Thứ 4' },
    { value: 'thursday', label: 'Thứ 5' },
    { value: 'friday', label: 'Thứ 6' },
    { value: 'saturday', label: 'Thứ 7' },
    { value: 'sunday', label: 'Chủ nhật' }
  ];

  // Thêm danh sách các khung giờ mẫu vào component
  const timeSlotOptions = [
    "08:00", "08:30", "09:00", "09:30", "10:00", "10:30", "11:00", 
    "12:00", "12:30", "13:00", "13:30", "14:00", "14:30", 
    "15:00", "15:30", "16:00", "16:30", "17:00"
  ];

  // Log userInfo để kiểm tra token
  useEffect(() => {
    const userInfo = localStorage.getItem('userInfo') ? 
      JSON.parse(localStorage.getItem('userInfo')) : 
      (sessionStorage.getItem('userInfo') ? 
      JSON.parse(sessionStorage.getItem('userInfo')) : null);
    
    console.log('Current userInfo:', userInfo ? 
      { id: userInfo.id, roleType: userInfo.roleType, hasToken: !!userInfo.token } : 
      'No user info');
    
    // Kiểm tra role admin - bảo vệ component
    if (!userInfo || userInfo.roleType !== 'admin') {
      console.warn('Not authorized to access admin page');
      toast.error('Bạn không có quyền truy cập trang này');
    }
  }, []);

  useEffect(() => {
    const loadInitialData = async () => {
      try {
        // Load doctors, hospitals and rooms trước để form có data
        const [doctorsRes, hospitalsRes, roomsData] = await Promise.all([
          fetchDoctors(), 
          fetchHospitals(),
          fetchRooms()
        ]);
        
        // Lưu danh sách rooms - đảm bảo luôn là mảng
        setRooms(Array.isArray(roomsData) ? roomsData : []);
        
        // Sau đó mới load schedule data
        await fetchData();
      } catch (error) {
        console.error('Error loading initial data:', error);
        setApiError('Không thể kết nối với máy chủ. Vui lòng thử lại sau.');
      }
    };
    
    loadInitialData();
  }, [pagination.currentPage, filter]);

  const fetchData = async () => {
    setLoading(true);
    setApiError(null);
    try {
      // Build the query string based on active filters
      let queryParams = `page=${pagination.currentPage}&limit=${pagination.pageSize}`;
      if (filter.doctorId !== 'all') queryParams += `&doctorId=${filter.doctorId}`;
      if (filter.hospitalId !== 'all') queryParams += `&hospitalId=${filter.hospitalId}`;
      if (filter.roomId !== 'all') queryParams += `&roomId=${filter.roomId}`;
      if (filter.isActive !== 'all') queryParams += `&isActive=${filter.isActive}`;
      if (searchTerm) queryParams += `&search=${searchTerm}`;
      
      console.log('Fetching schedules with URL:', `/admin/schedules?${queryParams}`);
      const res = await api.get(`/admin/schedules?${queryParams}`);
      console.log('API response:', res.data);
      
      if (res.data.success) {
        // Handle the new response format directly
        if (res.data.data && Array.isArray(res.data.data)) {
          setSchedules(res.data.data);
          setPagination({
            ...pagination,
            currentPage: res.data.currentPage || 1,
            totalPages: res.data.totalPages || 1
          });
          console.log(`Loaded ${res.data.data.length} schedules`);
        } else {
          console.log('Unexpected data format:', res.data);
          setSchedules([]);
          setPagination({...pagination, totalPages: 1});
          setApiError('Định dạng dữ liệu không đúng');
        }
      } else {
        console.log('No success in response:', res.data.message);
        setSchedules([]);
        setPagination({...pagination, totalPages: 1});
        setApiError(res.data.message || 'Không thể tải dữ liệu');
      }
    } catch (error) {
      console.error('Error fetching doctor schedules:', error);
      console.error('Error details:', error.response?.data || error.message);
      setApiError('Không thể tải dữ liệu. Lỗi: ' + (error.response?.data?.message || error.message));
      toast.error('Không thể tải dữ liệu lịch làm việc');
      setSchedules([]);
      setPagination({...pagination, totalPages: 1});
    } finally {
      setLoading(false);
    }
  };

  const fetchScheduleById = async (id) => {
    try {
      const res = await api.get(`/admin/schedules/${id}`);
      if (res.data.success) {
        return res.data.data;
      }
      return null;
    } catch (error) {
      console.error('Error fetching schedule details:', error);
      toast.error('Không thể tải thông tin lịch làm việc');
      return null;
    }
  };

  const fetchDoctors = async () => {
    try {
      const res = await api.get('/admin/doctors');
      if (res.data.success) {
        // Sử dụng trực tiếp dữ liệu trả về từ API mới
        const doctorsData = res.data.data || [];
        console.log('Loaded doctors:', doctorsData.length);
        setDoctors(Array.isArray(doctorsData) ? doctorsData : []);
      } else {
        setDoctors([]);
      }
    } catch (error) {
      console.error('Error fetching doctors:', error);
      toast.error('Không thể tải danh sách bác sĩ');
      setDoctors([]);
    }
  };

  const fetchHospitals = async () => {
    try {
      const res = await api.get('/admin/hospitals');
      if (res.data.success) {
        setHospitals(res.data.data.hospitals || []);
      } else {
        setHospitals([]);
      }
    } catch (error) {
      console.error('Error fetching hospitals:', error);
      toast.error('Không thể tải danh sách cơ sở y tế');
      setHospitals([]);
    }
  };

  const fetchRooms = async (hospitalId = null) => {
    try {
      if (hospitalId) {
        console.log(`Fetching rooms for hospital: ${hospitalId}`);
        const res = await api.get(`/admin/rooms?hospitalId=${hospitalId}`);
        
        if (res.data.success) {
          // Kiểm tra cấu trúc API và lấy mảng rooms
          let roomsData = [];
          if (res.data.data && res.data.data.rooms) {
            roomsData = res.data.data.rooms;
          } else if (Array.isArray(res.data.data)) {
            roomsData = res.data.data;
          }
          
          console.log(`Loaded ${roomsData.length} rooms for hospital ${hospitalId}`);
          return Array.isArray(roomsData) ? roomsData : [];
        } else {
          console.log('Failed to load rooms for hospital:', res.data.message);
          return [];
        }
      } else {
        console.log('Fetching all rooms');
        const res = await api.get(`/admin/rooms`);
        
        if (res.data.success) {
          // Kiểm tra cấu trúc API và lấy mảng rooms
          let roomsData = [];
          if (res.data.data && res.data.data.rooms) {
            roomsData = res.data.data.rooms;
          } else if (Array.isArray(res.data.data)) {
            roomsData = res.data.data;
          }
          
          console.log('Loaded all rooms:', roomsData.length);
          return Array.isArray(roomsData) ? roomsData : [];
        } else {
          console.log('Failed to load all rooms:', res.data.message);
          return [];
        }
      }
    } catch (error) {
      console.error('Error fetching rooms:', error);
      return [];
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

  const openModal = async (type, schedule = null) => {
    setModalType(type);
    setSelectedSchedule(schedule);
    
    if (type === 'add') {
      setFormData({
        doctorId: '',
        hospitalId: '',
        date: '',
        roomId: '',
        isActive: true,
        timeSlots: [{
          startTime: '',
          endTime: ''
        }]
      });
      // For add mode, initially load all rooms
      const roomData = await fetchRooms();
      setRooms(roomData);
    } else if (type === 'edit' && schedule) {
      try {
        // Fetch complete schedule details
        const scheduleDetails = await fetchScheduleById(schedule._id);
        
        if (scheduleDetails) {
          const hospitalId = scheduleDetails.hospitalId?._id || scheduleDetails.hospitalId;
          
          // Fetch rooms specific to this hospital
          let roomData = [];
          if (hospitalId) {
            roomData = await fetchRooms(hospitalId);
          } else {
            // Fallback to all rooms if no hospital ID is found
            roomData = await fetchRooms();
          }
          setRooms(roomData);
          
          // Format date as YYYY-MM-DD for the input field
          const formattedDate = scheduleDetails.date ? 
            new Date(scheduleDetails.date).toISOString().split('T')[0] : '';
          
          setFormData({
            doctorId: scheduleDetails.doctorId?._id || scheduleDetails.doctorId,
            hospitalId: hospitalId,
            date: formattedDate,
            roomId: scheduleDetails.timeSlots && scheduleDetails.timeSlots.length > 0 ? 
              scheduleDetails.timeSlots[0].roomId : '',
            isActive: scheduleDetails.isActive,
            timeSlots: scheduleDetails.timeSlots?.length ? scheduleDetails.timeSlots : [{
              startTime: '',
              endTime: ''
            }]
          });
        }
      } catch (error) {
        console.error('Error initializing edit form:', error);
        toast.error('Không thể tải thông tin lịch làm việc để chỉnh sửa');
      }
    }
    
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setModalType('');
    setSelectedSchedule(null);
    setConflicts([]);
    setFormData({
      doctorId: '',
      hospitalId: '',
      date: '',
      roomId: '',
      isActive: true,
      timeSlots: [{
        startTime: '',
        endTime: ''
      }]
    });
    setFormErrors({});
    setIsSubmitting(false);
  };

  const handleDeleteSchedule = async (scheduleId) => {
    try {
      const res = await api.delete(`/admin/schedules/${scheduleId}`);
      if (res.data.success) {
        toast.success('Đã xóa lịch làm việc thành công');
        fetchData();
        closeModal();
      } else {
        toast.error(res.data.message || 'Không thể xóa lịch làm việc');
      }
    } catch (error) {
      console.error('Error deleting schedule:', error);
      toast.error(error.response?.data?.message || 'Không thể xóa lịch làm việc');
    }
  };

  const exportData = () => {
    // Xuất dữ liệu dưới dạng CSV
    const fields = ['_id', 'doctorId.fullName', 'hospitalId.name', 'date', 'roomId.name', 'createdAt'];
    
    const csvContent = [
      // Header
      fields.join(','),
      // Rows
      ...schedules.map(item => 
        fields.map(field => {
          // Xử lý trường hợp nested field
          if (field.includes('.')) {
            const [parent, child] = field.split('.');
            return item[parent] && typeof item[parent] === 'object' ? `"${item[parent][child] || ''}"` : '""';
          }
          return `"${item[field] || ''}"`;
        }).join(',')
      )
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `doctor_schedules_${new Date().toISOString().split('T')[0]}.csv`);
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
  
  const handleFormChange = (e) => {
    const { name, value } = e.target;
    
    // Special handling for isActive which should be a boolean
    if (name === 'isActive') {
      const boolValue = typeof value === 'string' ? value === 'true' : value;
      setFormData({
        ...formData,
        [name]: boolValue
      });
    } else if (name === 'doctorId' && value) {
      // When a doctor is selected, automatically set their hospital
      const selectedDoctor = doctors.find(doc => doc._id === value);
      
      if (selectedDoctor) {
        console.log('Selected doctor:', selectedDoctor);
        
        // Get the hospital ID from the doctor data
        const hospitalId = selectedDoctor.hospitalId && 
          (typeof selectedDoctor.hospitalId === 'object' ? 
            selectedDoctor.hospitalId._id : 
            selectedDoctor.hospitalId);
        
        console.log('Setting hospital ID to:', hospitalId);
        
        // Set both doctor and hospital IDs
        setFormData({
          ...formData,
          doctorId: value,
          hospitalId: hospitalId || '' // Default to empty string if hospital not found
        });
        
        // If hospital changed, update the available rooms
        if (hospitalId && hospitalId !== formData.hospitalId) {
          // Fetch rooms for the selected hospital
          fetchRooms(hospitalId).then(roomData => {
            setRooms(roomData);
          });
        }
      } else {
        // Just set the doctor ID if no doctor found
        setFormData({
          ...formData,
          [name]: value
        });
      }
    } else if (name === 'hospitalId' && value) {
      // When hospital is changed directly, fetch rooms for that hospital
      setFormData({
        ...formData,
        hospitalId: value
      });
      
      // Fetch rooms for the selected hospital
      fetchRooms(value).then(roomData => {
        setRooms(roomData);
      });
    } else {
      setFormData({
        ...formData,
        [name]: value
      });
    }
  };

  const addTimeSlot = () => {
    setFormData({
      ...formData,
      timeSlots: [
        ...formData.timeSlots,
        { startTime: '', endTime: '' }
      ]
    });
  };

  const removeTimeSlot = (index) => {
    const newTimeSlots = [...formData.timeSlots];
    newTimeSlots.splice(index, 1);
    
    setFormData({
      ...formData,
      timeSlots: newTimeSlots
    });
  };

  const handleTimeSlotChange = (index, field, value) => {
    const updatedTimeSlots = [...formData.timeSlots];
    updatedTimeSlots[index] = {
      ...updatedTimeSlots[index],
      [field]: value
    };
    
    // Đảm bảo mỗi timeSlot có roomId
    if (field !== 'roomId' && !updatedTimeSlots[index].roomId && formData.roomId) {
      updatedTimeSlots[index].roomId = formData.roomId;
    }
    
    setFormData({
      ...formData,
      timeSlots: updatedTimeSlots
    });
  };

  const handleSaveSchedule = async () => {
    // Reset thông tin lỗi
    setConflicts([]);
    setConflictDetails(null);
    setFormErrors({});
    
    // Validate form data
    const errors = {};
    
    if (!formData.doctorId) errors.doctorId = 'Vui lòng chọn bác sĩ';
    if (!formData.hospitalId) errors.hospitalId = 'Vui lòng chọn bệnh viện';
    if (!formData.date) errors.date = 'Vui lòng chọn ngày';
    if (!formData.roomId) errors.roomId = 'Vui lòng chọn phòng khám';
    
    // Validate doctor works at the selected hospital
    if (formData.doctorId && formData.hospitalId) {
      const selectedDoctor = doctors.find(d => d._id === formData.doctorId);
      if (selectedDoctor) {
        const doctorHospitalId = selectedDoctor.hospitalId && 
          (typeof selectedDoctor.hospitalId === 'object' ? 
            selectedDoctor.hospitalId._id : 
            selectedDoctor.hospitalId);
        
        if (doctorHospitalId !== formData.hospitalId) {
          errors.hospitalId = 'Bác sĩ này không làm việc tại bệnh viện đã chọn';
        }
      }
    }
    
    // Validate time slots
    if (!formData.timeSlots || formData.timeSlots.length === 0) {
      errors.timeSlots = 'Vui lòng thêm ít nhất một khung giờ làm việc';
    } else {
      const invalidTimeSlots = formData.timeSlots.some(slot => 
        !slot.startTime || !slot.endTime
      );
      
      if (invalidTimeSlots) {
        errors.timeSlots = 'Vui lòng điền đầy đủ thông tin thời gian cho tất cả các khung giờ';
      }
    }
    
    // If there are validation errors, show them and stop
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      console.log('Validation errors:', errors);
      toast.error('Vui lòng điền đầy đủ thông tin và sửa các lỗi.');
      return;
    }
    
    try {
      // Đảm bảo mỗi timeSlot đều có roomId
      const updatedTimeSlots = formData.timeSlots.map(slot => ({
        ...slot,
        roomId: slot.roomId || formData.roomId
      }));
      
      const dataToSend = {
        ...formData,
        timeSlots: updatedTimeSlots,
        isActive: formData.isActive !== undefined ? formData.isActive : true
      };
      
      const endpoint = modalType === 'add' ? '/admin/schedules' : `/admin/schedules/${selectedSchedule._id}`;
      const method = modalType === 'add' ? 'post' : 'put';
      
      console.log(`Saving schedule with ${method.toUpperCase()} to ${endpoint}`);
      console.log('Schedule data being sent:', dataToSend);
      
      setIsSubmitting(true);
      const response = await api[method](endpoint, dataToSend);
      
      if (response.data.success) {
        toast.success(modalType === 'add' ? 'Thêm lịch làm việc thành công' : 'Cập nhật lịch làm việc thành công');
        closeModal();
        fetchData();
      } else {
        console.error('Failed to save schedule:', response.data);
        toast.error(response.data.message || 'Không thể lưu lịch làm việc');
      }
    } catch (error) {
      console.error('Error saving schedule:', error);
      
      // Xử lý thông tin lỗi chi tiết từ server
      if (error.response) {
        const responseData = error.response.data;
        
        // Xử lý lỗi trùng lịch (HTTP 409 Conflict)
        if (error.response.status === 409 && responseData.error === 'schedule_conflict') {
          setConflicts(responseData.conflicts || []);
          setConflictDetails(responseData.errorDetails || null);
          
          // Hiển thị thông báo lỗi chi tiết hơn
          const roomConflicts = (responseData.conflicts || []).filter(c => c.type === 'room_conflict').length;
          const doctorConflicts = (responseData.conflicts || []).filter(c => c.type === 'doctor_conflict').length;
          
          let errorMessage = 'Phát hiện xung đột lịch làm việc: ';
          if (roomConflicts > 0) {
            errorMessage += `${roomConflicts} xung đột phòng khám, `;
          }
          if (doctorConflicts > 0) {
            errorMessage += `${doctorConflicts} xung đột lịch bác sĩ, `;
          }
          errorMessage = errorMessage.replace(/, $/, '');
          
          toast.error(errorMessage, { autoClose: 5000 });
        } else if (responseData.message && responseData.message.includes('đã có lịch làm việc cho ngày này')) {
          // Xử lý lỗi trùng ngày
          toast.error('Bác sĩ đã có lịch làm việc cho ngày này. Vui lòng chọn ngày khác hoặc chỉnh sửa lịch hiện có.', { autoClose: 5000 });
        } else {
          // Các lỗi khác
          toast.error(responseData.message || 'Đã xảy ra lỗi khi lưu lịch làm việc');
        }
      } else {
        // Lỗi kết nối
        toast.error('Không thể kết nối với máy chủ');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // Update the ConflictAlert component with Tailwind CSS
  const ConflictAlert = ({ conflicts }) => {
    return (
      <div className="mb-4 p-4 bg-yellow-50 border-l-4 border-yellow-400 rounded-md">
        <div className="flex items-start">
          <FaExclamationTriangle className="h-5 w-5 text-yellow-600 mr-3 mt-0.5" />
          <div>
            <h3 className="text-sm font-medium text-yellow-800 mb-1">Cảnh báo xung đột lịch làm việc</h3>
            <p className="text-sm text-yellow-700 mb-2">Có {conflicts.length} xung đột lịch làm việc:</p>
            <ul className="list-disc pl-5 text-sm text-yellow-700">
              {conflicts.map((conflict, index) => (
                <li key={index} className="mb-1">
                  {conflict.message || 'Xung đột không xác định'}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    );
  };

  // Update the modal rendering function
  const renderModal = () => {
    return (
      <div className="fixed inset-0 z-50 overflow-y-auto">
        <div className="fixed inset-0 bg-black bg-opacity-50" onClick={closeModal}></div>
        <div className="flex items-center justify-center min-h-screen p-4">
          <div className="relative bg-white rounded-lg max-w-3xl w-full mx-4 shadow-xl">
            <div className="flex items-center justify-between p-4 border-b">
              <h2 className="text-xl font-semibold text-gray-800">
                {modalType === 'add' && 'Thêm lịch làm việc mới'}
                {modalType === 'edit' && 'Chỉnh sửa lịch làm việc'}
                {modalType === 'delete' && 'Xác nhận xóa lịch làm việc'}
                {modalType === 'view-conflicts' && 'Xung đột lịch làm việc'}
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
                <form className="space-y-6">
                  <div className="bg-blue-50 p-4 rounded-lg mb-4">
                    <h3 className="text-md font-medium text-blue-800 mb-2">Thông tin cơ bản</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label htmlFor="doctorId" className="block text-sm font-medium text-gray-700 mb-1">
                          Bác sĩ <span className="text-red-500">*</span>
                        </label>
                        <select
                          id="doctorId"
                          name="doctorId"
                          value={formData.doctorId}
                          onChange={handleFormChange}
                          className={`w-full px-3 py-2 border ${formErrors.doctorId ? 'border-red-300' : 'border-gray-300'} rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500`}
                          required
                          disabled={modalType === 'edit'}
                        >
                          <option value="">-- Chọn bác sĩ --</option>
                          {doctors
                            .filter(doctor => doctor.isAvailable !== false) // Only show active doctors
                            .map(doctor => (
                              <option key={doctor._id} value={doctor._id}>
                                {doctor.fullName || doctor.user?.fullName || `Bác sĩ ${doctor._id}`}
                                {doctor.hospitalId && typeof doctor.hospitalId === 'object' ? 
                                  ` - ${doctor.hospitalId.name}` : ''}
                              </option>
                            ))
                          }
                        </select>
                        {formErrors.doctorId && <p className="mt-1 text-sm text-red-600">{formErrors.doctorId}</p>}
                      </div>
                      
                      <div>
                        <label htmlFor="hospitalId" className="block text-sm font-medium text-gray-700 mb-1">
                          Cơ sở y tế <span className="text-red-500">*</span>
                        </label>
                        <select
                          id="hospitalId"
                          name="hospitalId"
                          value={formData.hospitalId}
                          onChange={handleFormChange}
                          className={`w-full px-3 py-2 border ${formErrors.hospitalId ? 'border-red-300' : 'border-gray-300'} rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500`}
                          required
                          disabled={modalType === 'edit'}
                        >
                          <option value="">-- Chọn cơ sở y tế --</option>
                          {hospitals.map(hospital => {
                            const isCurrentHospital = formData.doctorId && doctors.find(
                              d => d._id === formData.doctorId && 
                                  (d.hospitalId === hospital._id || 
                                   (d.hospitalId && typeof d.hospitalId === 'object' && d.hospitalId._id === hospital._id))
                            );
                            
                            return (
                              <option key={hospital._id} value={hospital._id}>
                                {hospital.name}{isCurrentHospital ? ' (Nơi bác sĩ đang hành nghề)' : ''}
                              </option>
                            );
                          })}
                        </select>
                        {formErrors.hospitalId && <p className="mt-1 text-sm text-red-600">{formErrors.hospitalId}</p>}
                      </div>
                      
                      <div>
                        <label htmlFor="date" className="block text-sm font-medium text-gray-700 mb-1">
                          Ngày <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="date"
                          id="date"
                          name="date"
                          value={formData.date}
                          onChange={handleFormChange}
                          className={`w-full px-3 py-2 border ${formErrors.date ? 'border-red-300' : 'border-gray-300'} rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500`}
                          required
                          min={new Date().toISOString().split('T')[0]}
                        />
                        {formErrors.date && <p className="mt-1 text-sm text-red-600">{formErrors.date}</p>}
                      </div>
                      
                      <div>
                        <label htmlFor="roomId" className="block text-sm font-medium text-gray-700 mb-1">
                          Phòng <span className="text-red-500">*</span>
                        </label>
                        <select
                          id="roomId"
                          name="roomId"
                          value={formData.roomId}
                          onChange={handleFormChange}
                          className={`w-full px-3 py-2 border ${formErrors.roomId ? 'border-red-300' : 'border-gray-300'} rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500`}
                          required
                        >
                          <option value="">-- Chọn phòng --</option>
                          {rooms.map(room => (
                            <option key={room._id} value={room._id}>
                              Phòng {room.number} - {room.name} (Tầng {room.floor})
                            </option>
                          ))}
                        </select>
                        {formErrors.roomId && <p className="mt-1 text-sm text-red-600">{formErrors.roomId}</p>}
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-green-50 p-4 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-md font-medium text-green-800">Khung giờ làm việc</h3>
                      <button
                        type="button"
                        onClick={addTimeSlot}
                        className="px-2 py-1 bg-green-500 text-white text-sm rounded hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-green-500"
                      >
                        + Thêm khung giờ
                      </button>
                    </div>
                    
                    {formErrors.timeSlots && <p className="text-sm text-red-600 mb-2">{formErrors.timeSlots}</p>}
                    
                    {formData.timeSlots.map((slot, index) => (
                      <div key={index} className="mb-3 p-3 bg-white rounded-lg border border-green-200">
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-medium text-sm text-green-800">Khung giờ #{index+1}</span>
                          {formData.timeSlots.length > 1 && (
                            <button
                              type="button"
                              onClick={() => removeTimeSlot(index)}
                              className="p-1 text-red-500 hover:text-red-700 focus:outline-none"
                              title="Xóa khung giờ này"
                            >
                              <FaTimes className="h-4 w-4" />
                            </button>
                          )}
                        </div>
                        
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label htmlFor={`startTime-${index}`} className="block text-sm font-medium text-gray-700 mb-1">
                              Giờ bắt đầu <span className="text-red-500">*</span>
                            </label>
                            <select
                              id={`startTime-${index}`}
                              value={slot.startTime}
                              onChange={(e) => handleTimeSlotChange(index, 'startTime', e.target.value)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                              required
                            >
                              <option value="">-- Chọn giờ --</option>
                              {timeSlotOptions.map((time) => (
                                <option key={`start-${time}`} value={time}>
                                  {time}
                                </option>
                              ))}
                            </select>
                          </div>
                          
                          <div>
                            <label htmlFor={`endTime-${index}`} className="block text-sm font-medium text-gray-700 mb-1">
                              Giờ kết thúc <span className="text-red-500">*</span>
                            </label>
                            <select
                              id={`endTime-${index}`}
                              value={slot.endTime}
                              onChange={(e) => handleTimeSlotChange(index, 'endTime', e.target.value)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                              required
                            >
                              <option value="">-- Chọn giờ --</option>
                              {timeSlotOptions.map((time) => (
                                <option 
                                  key={`end-${time}`} 
                                  value={time}
                                  disabled={slot.startTime && time <= slot.startTime}
                                >
                                  {time}
                                </option>
                              ))}
                            </select>
                          </div>
                        </div>
                      </div>
                    ))}
                    
                    <div className="text-xs text-gray-500 mt-2">
                      <span className="flex items-center">
                        <FaInfoCircle className="h-3 w-3 mr-1" />
                        Thêm nhiều khung giờ để tạo lịch làm việc không liên tục cho bác sĩ. Có thể xóa khung giờ không cần thiết.
                      </span>
                    </div>
                  </div>
                  
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Trạng thái
                    </label>
                    <div className="relative">
                      <select
                        id="isActive"
                        name="isActive"
                        value={formData.isActive === false ? "false" : "true"}
                        onChange={(e) => handleFormChange({
                          target: {
                            name: 'isActive',
                            value: e.target.value === "true"
                          }
                        })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      >
                        <option value="true">Có hiệu lực</option>
                        <option value="false">Đã hủy</option>
                      </select>
                      <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
                        <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                          <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/>
                        </svg>
                      </div>
                    </div>
                  </div>

                  <div className="mb-4">
                    <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-1">
                      Ghi chú
                    </label>
                    <textarea
                      id="notes"
                      name="notes"
                      value={formData.notes || ''}
                      onChange={handleFormChange}
                      rows="2"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Nhập ghi chú bổ sung (nếu có)"
                    ></textarea>
                  </div>
                </form>
              )}
              
              {modalType === 'delete' && selectedSchedule && (
                <div className="text-center p-6">
                  <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-4">
                    <FaExclamationTriangle className="h-6 w-6 text-red-600" />
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Xác nhận xóa lịch làm việc</h3>
                  <p className="text-gray-500">
                    Bạn có chắc chắn muốn xóa lịch làm việc của bác sĩ{' '}
                    <span className="font-semibold text-gray-700">
                      {selectedSchedule.doctorId?.fullName || selectedSchedule.doctorId?.user?.fullName || 'này'}
                    </span>{' '}
                    vào ngày{' '}
                    <span className="font-semibold text-gray-700">
                      {formatDate(selectedSchedule.date)}
                    </span>?
                  </p>
                  <p className="text-sm text-red-600 mt-2">
                    Hành động này không thể hoàn tác và có thể ảnh hưởng đến các lịch hẹn đã đặt.
                  </p>
                </div>
              )}
            </div>
            
            <div className="flex justify-end gap-3 p-4 border-t bg-gray-50 rounded-b-lg">
              <button 
                className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors focus:outline-none focus:ring-2 focus:ring-gray-400"
                onClick={closeModal}
              >
                {modalType === 'view-conflicts' ? 'Đóng' : 'Hủy'}
              </button>
              
              {modalType === 'add' && (
                <button 
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
                  onClick={handleSaveSchedule}
                >
                  Thêm lịch
                </button>
              )}
              
              {modalType === 'edit' && (
                <button 
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
                  onClick={handleSaveSchedule}
                >
                  Cập nhật
                </button>
              )}
              
              {modalType === 'delete' && (
                <button 
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors focus:outline-none focus:ring-2 focus:ring-red-500"
                  onClick={() => handleDeleteSchedule(selectedSchedule._id)}
                >
                  Xóa lịch
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Format time slots in a concise way
  const formatTimeSlots = (timeSlots) => {
    if (!timeSlots || !Array.isArray(timeSlots) || timeSlots.length === 0) {
      return <div className="text-sm text-gray-500">Không có khung giờ</div>;
    }
    
    // Sort time slots by start time
    const sortedSlots = [...timeSlots].sort((a, b) => {
      return a.startTime.localeCompare(b.startTime);
    });
    
    // Group consecutive time slots
    const groups = [];
    let currentGroup = [sortedSlots[0]];
    
    for (let i = 1; i < sortedSlots.length; i++) {
      const currentSlot = sortedSlots[i];
      const previousSlot = sortedSlots[i-1];
      
      // If this slot starts at the same time the previous one ends, they're consecutive
      if (currentSlot.startTime === previousSlot.endTime) {
        currentGroup.push(currentSlot);
      } else {
        groups.push([...currentGroup]);
        currentGroup = [currentSlot];
      }
    }
    groups.push(currentGroup);
    
    // Render each group
    return groups.map((group, groupIndex) => {
      const firstSlot = group[0];
      const lastSlot = group[group.length - 1];
      
      return (
        <div key={groupIndex} className="text-sm">
          <span className="font-medium">{firstSlot.startTime} - {lastSlot.endTime}</span>
          {group.some(slot => slot.isBooked) && (
            <span className="ml-2 px-1.5 py-0.5 text-xs rounded bg-red-100 text-red-800">
              Đã đặt
            </span>
          )}
          {firstSlot.roomInfo && (
            <div className="text-xs text-gray-500">
              Phòng {firstSlot.roomInfo.number || 'N/A'}
            </div>
          )}
        </div>
      );
    });
  };

  return (
    <div className="bg-white rounded-lg shadow-sm overflow-hidden">
      <div className="p-6 border-b">
        <h1 className="text-2xl font-bold text-gray-800">Quản lý lịch làm việc bác sĩ</h1>
      </div>

      <div className="p-6 border-b">
        <div className="flex flex-col lg:flex-row gap-4">
          {/* Search Bar */}
          <div className="w-full lg:w-1/3">
            <form onSubmit={handleSearch} className="flex w-full">
              <div className="relative w-full">
                <input
                  type="text"
                  placeholder="Tìm kiếm theo tên bác sĩ, cơ sở y tế..."
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
                name="doctorId"
                value={filter.doctorId}
                onChange={handleFilterChange}
                className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white appearance-none"
              >
                <option value="all">Tất cả bác sĩ</option>
                {doctors.map(doctor => (
                  <option key={doctor._id} value={doctor._id}>
                    {doctor.fullName}
                  </option>
                ))}
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
                name="isActive"
                value={filter.isActive}
                onChange={handleFilterChange}
                className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white appearance-none"
              >
                <option value="all">Tất cả trạng thái</option>
                <option value="true">Có hiệu lực</option>
                <option value="false">Đã hủy</option>
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
              <span>Thêm lịch mới</span>
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

      {apiError && (
        <div className="mx-6 mt-6 p-4 bg-red-50 border-l-4 border-red-400 text-red-700 rounded-md">
          <div className="flex">
            <FaExclamationCircle className="h-5 w-5 text-red-500 mr-2" />
            <p>{apiError}</p>
          </div>
        </div>
      )}

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
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Bác sĩ</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cơ sở y tế</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ngày khám</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Trạng thái</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Phòng</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Khung giờ</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Hành động</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {schedules.length > 0 ? (
                schedules.map((schedule) => {
                  // Get current date at start of day for comparison
                  const today = new Date();
                  today.setHours(0, 0, 0, 0);
                  const scheduleDate = new Date(schedule.date);
                  scheduleDate.setHours(0, 0, 0, 0);
                  
                  // Calculate if the schedule is in the past
                  const isPast = scheduleDate < today;
                  
                  return (
                    <tr key={schedule._id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10">
                            <img 
                              className="h-10 w-10 rounded-full object-cover" 
                              src={
                                schedule.doctorId?.avatarUrl || 
                                schedule.doctorId?.user?.avatarUrl || 
                                '/assets/images/default-avatar.png'
                              } 
                              alt=""
                              onError={(e) => { e.target.src = '/assets/images/default-avatar.png'; }}
                            />
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">
                              {schedule.doctorId?.fullName || 
                               schedule.doctorId?.user?.fullName || 
                               'N/A'}
                            </div>
                            <div className="text-sm text-gray-500">
                              {schedule.doctorId?.specialtyId?.name || 
                               schedule.doctorId?.specialty?.name || 
                               schedule.doctorId?.user?.specialty?.name ||
                               'Chưa có chuyên khoa'}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{schedule.hospitalId?.name || 'N/A'}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{formatDate(schedule.date)}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          schedule.isActive 
                            ? isPast ? 'bg-orange-100 text-orange-800' : 'bg-green-100 text-green-800' 
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {schedule.isActive 
                            ? isPast ? 'Đã qua' : 'Có hiệu lực' 
                            : 'Đã hủy'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          <span className="font-medium">
                            {schedule.timeSlots && schedule.timeSlots.length > 0 && schedule.timeSlots[0].roomInfo
                              ? `Phòng ${schedule.timeSlots[0].roomInfo.number || 'N/A'}`
                              : 'Chưa có phòng'}
                          </span>
                        </div>
                        {schedule.timeSlots && schedule.timeSlots.length > 0 && schedule.timeSlots[0].roomInfo?.name && (
                          <div className="text-xs text-gray-500">{schedule.timeSlots[0].roomInfo.name}</div>
                        )}
                        {schedule.timeSlots && schedule.timeSlots.length > 0 && schedule.timeSlots[0].roomInfo?.floor && (
                          <div className="text-xs text-gray-500">Tầng {schedule.timeSlots[0].roomInfo.floor}</div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="space-y-1">
                          {formatTimeSlots(schedule.timeSlots)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center space-x-2">
                          <button
                            className="p-2 text-blue-600 hover:text-blue-900 rounded-full hover:bg-blue-50"
                            onClick={() => openModal('edit', schedule)}
                            title="Chỉnh sửa lịch"
                          >
                            <FaEdit className="h-5 w-5" />
                          </button>
                          <button
                            className="p-2 text-red-600 hover:text-red-900 rounded-full hover:bg-red-50"
                            onClick={() => openModal('delete', schedule)}
                            title="Xóa lịch"
                          >
                            <FaTrash className="h-5 w-5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan="7" className="px-6 py-10 text-center text-gray-500">
                    Không có dữ liệu lịch làm việc
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

export default DoctorSchedules;
