import React, { useState, useEffect } from 'react';
import { FaPlus, FaEdit, FaTrash, FaSearch, FaFilter, FaDownload, FaImage, FaUserMd, FaClinicMedical, FaMapMarkerAlt, FaUserLock, FaUserCheck, FaTimes, FaCamera } from 'react-icons/fa';
import api from '../../utils/api';
import { toast } from 'react-toastify';


const Doctors = () => {
  const [doctors, setDoctors] = useState([]);
  const [specialties, setSpecialties] = useState([]);
  const [hospitals, setHospitals] = useState([]);
  const [availableServices, setAvailableServices] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState({
    status: 'all',
    specialtyId: 'all',
    hospitalId: 'all'
  });
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    pageSize: 10
  });
  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalType, setModalType] = useState('');
  const [lockReason, setLockReason] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewImage, setPreviewImage] = useState('');
  const [uploadLoading, setUploadLoading] = useState(false);
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    phoneNumber: '',
    dateOfBirth: '',
    gender: 'male',
    address: '',
    specialtyId: '',
    hospitalId: '',
    services: [],
    title: '',
    description: '',
    education: '',
    experience: 0,
    certifications: [],
    consultationFee: 0,
    isAvailable: true
  });
  const [formErrors, setFormErrors] = useState({});
  const [formSubmitting, setFormSubmitting] = useState(false);
  const [totalRecords, setTotalRecords] = useState(0);

  useEffect(() => {
    fetchData();
    fetchAllSpecialties(); // Load all specialties initially
    fetchHospitals();
  }, [pagination.currentPage, filter]);

  useEffect(() => {
    if (formData.specialtyId) {
      console.log('Debug specialtyId changed:', formData.specialtyId);
      setAvailableServices(null);
      fetchServicesBySpecialty(formData.specialtyId);
    } else {
      setAvailableServices([]);
    }
  }, [formData.specialtyId]);

  useEffect(() => {
    if (specialties && specialties.length > 0) {
      console.log('Loaded specialties:', specialties);
    }
    if (hospitals && hospitals.length > 0) {
      console.log('Loaded hospitals:', hospitals);
    }
  }, [specialties, hospitals]);

  useEffect(() => {
    if (formData.specialtyId && modalType === 'edit') {
      console.log('Form specialty changed:', formData.specialtyId);
      // Verify if this ID exists in our specialties array
      const matchedSpecialty = specialties.find(s => s._id === formData.specialtyId);
      console.log('Matched specialty:', matchedSpecialty ? matchedSpecialty.name : 'Not found');
    }
    
    if (formData.hospitalId && modalType === 'edit') {
      console.log('Form hospital changed:', formData.hospitalId);
      // Verify if this ID exists in our hospitals array
      const matchedHospital = hospitals.find(h => h._id === formData.hospitalId);
      console.log('Matched hospital:', matchedHospital ? matchedHospital.name : 'Not found');
    }
  }, [formData.specialtyId, formData.hospitalId, specialties, hospitals, modalType]);

  useEffect(() => {
    if (modalType === 'edit' && formData.certifications) {
      console.log('Current certifications:', formData.certifications);
    }
  }, [formData.certifications, modalType]);

  useEffect(() => {
    if (formData.hospitalId) {
      // When hospital changes, fetch specialties for that hospital
      fetchSpecialtiesByHospital(formData.hospitalId);
      // Clear specialty and services selection
      setFormData(prev => ({
        ...prev,
        specialtyId: '',
        services: []
      }));
      setAvailableServices([]);
    }
  }, [formData.hospitalId]);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Chuyển đổi trạng thái từ UI thành tham số API
      let isLockedParam = undefined;
      if (filter.status === 'locked') {
        isLockedParam = true;
      } else if (filter.status === 'active') {
        isLockedParam = false;
      }
      
      // Sử dụng tham số isLocked thay vì status
      console.log('Gửi request doctors với tham số:', {
        page: pagination.currentPage,
        limit: pagination.pageSize,
        isLocked: filter.status !== 'all' ? isLockedParam : undefined,
        specialtyId: filter.specialtyId !== 'all' ? filter.specialtyId : undefined,
        hospitalId: filter.hospitalId !== 'all' ? filter.hospitalId : undefined,
        search: searchTerm || undefined
      });
      
      const res = await api.get('/admin/doctors', {
        params: {
          page: pagination.currentPage,
          limit: pagination.pageSize,
          isLocked: filter.status !== 'all' ? isLockedParam : undefined,
          specialtyId: filter.specialtyId !== 'all' ? filter.specialtyId : undefined,
          hospitalId: filter.hospitalId !== 'all' ? filter.hospitalId : undefined,
          search: searchTerm || undefined
        }
      });
      
      if (res.data.success) {
        console.log('Nhận được dữ liệu bác sĩ:', res.data);
        const doctorsData = res.data.data || [];
        
        // Kiểm tra cấu trúc dữ liệu
        if (doctorsData.length > 0) {
          console.log('Dữ liệu mẫu bác sĩ đầu tiên:', {
            id: doctorsData[0]._id,
            userExists: !!doctorsData[0].user,
            userFields: doctorsData[0].user ? Object.keys(doctorsData[0].user) : [],
            avatarUrl: doctorsData[0].user?.avatarUrl || doctorsData[0].avatarUrl,
            fullName: doctorsData[0].user?.fullName || doctorsData[0].fullName
          });
        }
        
        setDoctors(doctorsData);
        setTotalRecords(res.data.total || doctorsData.length);
        setPagination({
          ...pagination,
          totalPages: Math.ceil(res.data.total / pagination.pageSize) || 1
        });
      } else {
        console.error('Dữ liệu không hợp lệ:', res.data);
        setDoctors([]);
        setTotalRecords(0);
        setPagination({
          ...pagination,
          totalPages: 1
        });
      }
    } catch (error) {
      console.error('Error fetching doctors:', error);
      toast.error('Không thể tải dữ liệu bác sĩ');
      setDoctors([]);
      setTotalRecords(0);
      setPagination({
        ...pagination,
        totalPages: 1
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchAllSpecialties = async () => {
    try {
      const res = await api.get('/admin/specialties');
      if (res.data.success) {
        console.log('All Specialties API response:', res.data);
        
        if (res.data.data && res.data.data.specialties && Array.isArray(res.data.data.specialties)) {
          console.log('Loaded all specialties from nested data:', res.data.data.specialties);
          setSpecialties(res.data.data.specialties);
        } 
        else if (res.data.data && Array.isArray(res.data.data) && res.data.data.length > 0) {
          console.log('Loaded all specialties from direct data array:', res.data.data);
          setSpecialties(res.data.data);
        } else {
          console.error('No specialties found in response:', res.data);
          setSpecialties([]);
          toast.error('Không thể tải danh sách chuyên khoa');
        }
      } else {
        console.error('Failed to fetch specialties:', res.data);
        setSpecialties([]);
        toast.error('Không thể tải danh sách chuyên khoa');
      }
    } catch (error) {
      console.error('Error fetching specialties:', error.response?.data || error);
      setSpecialties([]);
      toast.error('Không thể tải danh sách chuyên khoa');
    }
  };

  const fetchHospitals = async () => {
    try {
      const res = await api.get('/admin/hospitals');
      if (res.data.success) {
        // Console log to debug the response
        console.log('Hospitals API response:', res.data);
        
        // Check for nested structure in data.data.hospitals
        if (res.data.data && res.data.data.hospitals && Array.isArray(res.data.data.hospitals)) {
          console.log('Loaded hospitals from nested data:', res.data.data.hospitals);
          setHospitals(res.data.data.hospitals);
        }
        // Check if data array is directly in res.data.data 
        else if (res.data.data && Array.isArray(res.data.data) && res.data.data.length > 0) {
          console.log('Loaded hospitals from direct data array:', res.data.data);
          setHospitals(res.data.data);
        } else {
          console.error('No hospitals found in response:', res.data);
          // Initialize with empty array to prevent errors
          setHospitals([]);
          toast.error('Không thể tải danh sách cơ sở y tế');
        }
      } else {
        console.error('Failed to fetch hospitals:', res.data);
        setHospitals([]);
        toast.error('Không thể tải danh sách cơ sở y tế');
      }
    } catch (error) {
      console.error('Error fetching hospitals:', error.response?.data || error);
      setHospitals([]);
      toast.error('Không thể tải danh sách cơ sở y tế');
    }
  };

  const fetchServicesBySpecialty = async (specialtyId) => {
    try {
      console.log('Fetching services for specialty ID:', specialtyId);
      
      // Thử với endpoint chính
      let response = await api.get(`/appointments/specialties/${specialtyId}/services`);
      console.log('Services API response (primary):', response.data);
      
      // Kiểm tra dữ liệu trả về
      if (!response.data.success || !response.data.data || 
          (Array.isArray(response.data.data) && response.data.data.length === 0)) {
        console.log('No services from primary endpoint, trying admin endpoint...');
        
        // Thử với API admin services được lọc theo specialtyId
        response = await api.get('/admin/services', {
          params: { specialtyId }
        });
        console.log('Services API response (admin):', response.data);
      }
      
      // Kiểm tra và xử lý dữ liệu dịch vụ
      if (response.data.success) {
        let servicesData = [];
        
        if (Array.isArray(response.data.data)) {
          servicesData = response.data.data;
        } else if (response.data.data && response.data.data.services) {
          servicesData = response.data.data.services;
        } else if (response.data.data && Array.isArray(response.data.data.data)) {
          // Handle nested data structure if present
          servicesData = response.data.data.data;
        }
        
        console.log('Processed services data:', servicesData);
        setAvailableServices(servicesData);
      } else {
        console.error('Service API failed with:', response.data);
        setAvailableServices([]);
        toast.error('Không thể tải danh sách dịch vụ');
      }
    } catch (error) {
      console.error('Error fetching services (detail):', error.response || error);
      
      // Thử với API lấy tất cả dịch vụ và lọc theo specialtyId
      try {
        console.log('Trying fallback: all services');
        const allServicesRes = await api.get('/services');
        console.log('All services response:', allServicesRes.data);
        
        if (allServicesRes.data.success && Array.isArray(allServicesRes.data.data)) {
          // Lọc dịch vụ theo specialtyId
          const filteredServices = allServicesRes.data.data.filter(service => 
            service.specialtyId === specialtyId || 
            (service.specialtyId && service.specialtyId._id === specialtyId)
          );
          
          console.log('Filtered services from all services:', filteredServices);
          setAvailableServices(filteredServices);
        } else {
          console.error('Could not process services from fallback:', allServicesRes.data);
          setAvailableServices([]);
          toast.error('Không thể tải danh sách dịch vụ');
        }
      } catch (fallbackError) {
        console.error('All fallback attempts failed:', fallbackError);
        toast.error('Không thể tải danh sách dịch vụ');
        setAvailableServices([]);
      }
    }
  };

  const fetchSpecialtiesByHospital = async (hospitalId) => {
    try {
      console.log('Fetching specialties for hospital ID:', hospitalId);
      
      // Call API to get specialties for this hospital
      const res = await api.get(`/hospitals/${hospitalId}/specialties`);
      
      console.log('Hospital specialties API response:', res.data);
      
      if (res.data.success) {
        // Determine the correct data structure
        let specialtiesData = [];
        
        if (Array.isArray(res.data.data)) {
          specialtiesData = res.data.data;
        } else if (res.data.data && res.data.data.specialties) {
          specialtiesData = res.data.data.specialties;
        }
        
        console.log('Hospital specialties data:', specialtiesData);
        
        // Update the specialties state with hospital-specific specialties
        setSpecialties(specialtiesData);
        
        // If no specialties available, show message
        if (specialtiesData.length === 0) {
          toast.info('Bệnh viện này chưa có chuyên khoa nào');
        }
      } else {
        console.error('Failed to fetch hospital specialties:', res.data);
        setSpecialties([]);
        toast.error('Không thể tải danh sách chuyên khoa của bệnh viện');
      }
    } catch (error) {
      console.error('Error fetching hospital specialties:', error.response?.data || error);
      
      // Fallback: try to get all specialties and filter by hospitalId
      try {
        const allSpecialtiesRes = await api.get('/admin/specialties');
        
        if (allSpecialtiesRes.data.success) {
          const allSpecialties = Array.isArray(allSpecialtiesRes.data.data) 
            ? allSpecialtiesRes.data.data 
            : (allSpecialtiesRes.data.data?.specialties || []);
          
          // Now, get hospital-specialty mappings
          const mappingsRes = await api.get('/admin/hospital-specialty-mappings', {
            params: { hospitalId }
          });
          
          if (mappingsRes.data.success && Array.isArray(mappingsRes.data.data)) {
            // Extract specialty IDs from mappings
            const specialtyIds = mappingsRes.data.data.map(mapping => mapping.specialtyId);
            
            // Filter specialties by IDs
            const filteredSpecialties = allSpecialties.filter(specialty => 
              specialtyIds.includes(specialty._id)
            );
            
            console.log('Filtered specialties from mappings:', filteredSpecialties);
            setSpecialties(filteredSpecialties);
            
            if (filteredSpecialties.length === 0) {
              toast.info('Bệnh viện này chưa có chuyên khoa nào');
            }
          } else {
            // If no mappings found, set empty specialties
            setSpecialties([]);
            toast.info('Bệnh viện này chưa có chuyên khoa nào');
          }
        } else {
          setSpecialties([]);
          toast.error('Không thể tải danh sách chuyên khoa');
        }
      } catch (fallbackError) {
        console.error('All specialty fetching attempts failed:', fallbackError);
        setSpecialties([]);
        toast.error('Không thể tải danh sách chuyên khoa');
      }
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    setPagination({ ...pagination, currentPage: 1 });
    fetchData();
  };

  const handleSearchReset = () => {
    setSearchTerm('');
    setPagination(prev => ({ ...prev, currentPage: 1 }));
    // Trigger fetchData after state is updated
    setTimeout(() => {
      fetchData();
    }, 0);
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilter({ ...filter, [name]: value });
    setPagination({ ...pagination, currentPage: 1 });
  };

  const handleFilterReset = () => {
    setFilter({
      status: 'all',
      specialtyId: 'all',
      hospitalId: 'all'
    });
    setPagination(prev => ({ ...prev, currentPage: 1 }));
    // fetchData will be triggered by filter change effect
  };

  const handlePageChange = (newPage) => {
    if (newPage > 0 && newPage <= pagination.totalPages) {
      setPagination({ ...pagination, currentPage: newPage });
    }
  };

  const resetForm = () => {
    setFormData({
      fullName: '',
      email: '',
      password: '',
      phoneNumber: '',
      dateOfBirth: '',
      gender: 'male',
      address: '',
      specialtyId: '',
      hospitalId: '',
      services: [],
      title: '',
      description: '',
      education: '',
      experience: 0,
      certifications: [],
      consultationFee: 0,
      isAvailable: true
    });
    setFormErrors({});
  };

  const openModal = (type, doctor = null) => {
    setModalType(type);
    setSelectedDoctor(doctor);
    setIsModalOpen(true);
    setPreviewImage('');
    setSelectedFile(null);
    
    // Initialize form data if editing
    if ((type === 'edit' || type === 'view') && doctor) {
      // Set availableServices to null to show loading state
      if (type === 'edit') {
        setAvailableServices(null);
      }
      
      console.log('Full doctor data being edited:', JSON.stringify(doctor));
      
      // Xử lý services có thể là array hoặc string
      let services = [];
      if (doctor.services) {
        if (Array.isArray(doctor.services)) {
          services = doctor.services.map(service => 
            typeof service === 'string' ? service : service._id
          );
        } else if (typeof doctor.services === 'string') {
          services = [doctor.services];
        }
        console.log('Processed services for edit:', services);
      }
      
      // Get specialty ID and hospital ID correctly, handling both object and string formats
      const specialtyId = doctor.specialtyId && typeof doctor.specialtyId === 'object' 
        ? doctor.specialtyId._id 
        : doctor.specialtyId || '';
      
      const hospitalId = doctor.hospitalId && typeof doctor.hospitalId === 'object'
        ? doctor.hospitalId._id
        : doctor.hospitalId || '';
      
      // Properly handle certifications
      let certifications = [];
      if (doctor.certifications) {
        if (Array.isArray(doctor.certifications)) {
          certifications = doctor.certifications.map(cert => 
            typeof cert === 'string' ? cert : cert.name || cert
          );
        } else if (typeof doctor.certifications === 'string') {
          certifications = [doctor.certifications];
        }
        console.log('Processed certifications for edit:', certifications);
      }
      
      // Xử lý địa chỉ - ưu tiên từ user object nếu có
      let address = '';
      if (doctor.user && doctor.user.address) {
        address = doctor.user.address;
      } else if (doctor.address) {
        address = doctor.address;
      }
      console.log('Address for doctor:', address);
      
      const doctorData = {
        fullName: doctor.user?.fullName || doctor.fullName || '',
        email: doctor.user?.email || doctor.email || '',
        password: '', // Don't prefill password
        phoneNumber: doctor.user?.phoneNumber || doctor.phone || '',
        dateOfBirth: doctor.user?.dateOfBirth ? new Date(doctor.user.dateOfBirth).toISOString().split('T')[0] : '',
        gender: doctor.user?.gender || doctor.gender || 'male',
        address: address,
        specialtyId: specialtyId,
        hospitalId: hospitalId,
        services: services,
        title: doctor.title || '',
        description: doctor.description || '',
        education: doctor.education || '',
        experience: doctor.experience || 0,
        certifications: certifications.length > 0 ? certifications : [],
        consultationFee: doctor.consultationFee || 0,
        isAvailable: doctor.isAvailable !== false // Default to true
      };
      
      // Log populated form data for debugging
      console.log('Populated form data for edit:', {
        fullName: doctorData.fullName,
        email: doctorData.email,
        phoneNumber: doctorData.phoneNumber,
        address: doctorData.address,
        specialtyId: doctorData.specialtyId,
        hospitalId: doctorData.hospitalId,
        services: doctorData.services,
        education: doctorData.education,
        certifications: doctorData.certifications
      });
      
      setFormData(doctorData);
      
      // If hospital ID exists, fetch specialties for that hospital
      if (doctorData.hospitalId) {
        fetchSpecialtiesByHospital(doctorData.hospitalId);
      }
      
      // Tải dịch vụ theo chuyên khoa ngay lập tức
      if (doctorData.specialtyId) {
        fetchServicesBySpecialty(doctorData.specialtyId);
      }
    } else {
      resetForm();
      // For add mode, load all specialties
      fetchAllSpecialties();
    }
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedDoctor(null);
    setModalType('');
    setLockReason('');
    setSelectedFile(null);
    setPreviewImage(null);
    setUploadLoading(false);
    resetForm();
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    
    // Clear error for this field when user changes input
    if (formErrors[name]) {
      setFormErrors({ ...formErrors, [name]: '' });
    }
  };

  const handleServiceChange = (serviceId, isChecked) => {
    console.log('Service change:', serviceId, isChecked);
    
    // Handle the case where serviceId might be an object instead of a string
    const serviceIdStr = typeof serviceId === 'object' ? serviceId._id : serviceId;
    
    if (isChecked) {
      // Add to services array if not already present
      setFormData(prev => {
        // First filter out this ID if it somehow already exists (to avoid duplicates)
        const filteredServices = prev.services.filter(id => {
          const idStr = typeof id === 'object' ? id._id : id;
          return String(idStr) !== String(serviceIdStr);
        });
        
        // Then add the service ID
        return {
          ...prev,
          services: [...filteredServices, serviceIdStr]
        };
      });
      
      console.log(`Added service: ${serviceIdStr}`);
    } else {
      // Remove from services array
      setFormData(prev => {
        const filteredServices = prev.services.filter(id => {
          const idStr = typeof id === 'object' ? id._id : id;
          return String(idStr) !== String(serviceIdStr);
        });
        
        return {
          ...prev,
          services: filteredServices
        };
      });
      
      console.log(`Removed service: ${serviceIdStr}`);
    }
    
    // Clear service error if any
    if (formErrors.services) {
      setFormErrors(prev => ({ ...prev, services: '' }));
    }
  };

  const validateForm = () => {
    const errors = {};
    
    if (!formData.fullName.trim()) errors.fullName = 'Vui lòng nhập họ tên';
    if (!formData.email.trim()) errors.email = 'Vui lòng nhập email';
    else if (!/\S+@\S+\.\S+/.test(formData.email)) errors.email = 'Email không hợp lệ';
    
    if (modalType === 'add' && !formData.password.trim()) {
      errors.password = 'Vui lòng nhập mật khẩu';
    } else if (formData.password && formData.password.length < 6) {
      errors.password = 'Mật khẩu phải có ít nhất 6 ký tự';
    }
    
    if (!formData.phoneNumber.trim()) errors.phoneNumber = 'Vui lòng nhập số điện thoại';
    if (!formData.specialtyId) errors.specialtyId = 'Vui lòng chọn chuyên khoa';
    if (!formData.hospitalId) errors.hospitalId = 'Vui lòng chọn cơ sở y tế';
    if (!formData.title.trim()) errors.title = 'Vui lòng nhập chức danh';
    if (!formData.address.trim()) errors.address = 'Vui lòng nhập địa chỉ';
    if (!formData.education.trim()) errors.education = 'Vui lòng nhập thông tin học vấn';
    
    // Kiểm tra thông tin chứng chỉ
    if (!formData.certifications || formData.certifications.length === 0) {
      errors.certifications = 'Vui lòng nhập ít nhất một chứng chỉ';
    } else {
      // Kiểm tra từng chứng chỉ có nội dung không
      const hasEmptyCertification = formData.certifications.some(cert => !cert || cert.trim() === '');
      if (hasEmptyCertification) {
        errors.certifications = 'Không được để trống thông tin chứng chỉ';
      }
    }
    
    if (!formData.description.trim()) errors.description = 'Vui lòng nhập mô tả';
    
    // Kiểm tra dịch vụ
    if (!formData.services || formData.services.length === 0) {
      errors.services = 'Vui lòng chọn ít nhất một dịch vụ';
    }
    
    // Kiểm tra phí tư vấn
    if (!formData.consultationFee || formData.consultationFee <= 0) {
      errors.consultationFee = 'Vui lòng nhập phí tư vấn hợp lệ';
    }
    
    // Hiển thị log để debug
    if (Object.keys(errors).length > 0) {
      console.log('Form validation errors:', errors);
      console.log('Current form data:', formData);
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleCreateDoctor = async () => {
    if (!validateForm()) return;
    
    setFormSubmitting(true);
    try {
      console.log('Đang tạo bác sĩ mới với dữ liệu:', formData);
      const res = await api.post('/admin/doctors', formData);
      
      console.log('Kết quả tạo bác sĩ:', res.data);
      
      if (res.data.success) {
        toast.success('Thêm bác sĩ mới thành công');
        fetchData();
        closeModal();
        
        // If there's a selected file, upload the avatar for this new doctor
        if (selectedFile) {
          try {
            const doctorId = res.data.data._id;
            console.log('Đang tải lên avatar cho bác sĩ mới với ID:', doctorId);
            
            const avatarFormData = new FormData();
            avatarFormData.append('avatar', selectedFile);
            
            const uploadRes = await api.post(`/admin/doctors/${doctorId}/avatar`, avatarFormData, {
              headers: {
                'Content-Type': 'multipart/form-data'
              }
            });
            
            console.log('Kết quả upload avatar:', uploadRes.data);
            
            toast.success('Cập nhật ảnh đại diện thành công');
            // Reload data after avatar update
            fetchData();
          } catch (uploadError) {
            console.error('Lỗi upload avatar:', uploadError.response?.data || uploadError);
            toast.error('Bác sĩ đã được tạo nhưng không thể tải lên ảnh đại diện');
          }
        }
      }
    } catch (error) {
      console.error('Lỗi tạo bác sĩ:', error.response?.data || error);
      toast.error(error.response?.data?.message || 'Không thể tạo bác sĩ mới');
    } finally {
      setFormSubmitting(false);
    }
  };

  const handleUpdateDoctor = async () => {
    if (!validateForm()) return;
    
    setFormSubmitting(true);
    try {
      console.log('Đang cập nhật bác sĩ với ID:', selectedDoctor._id, 'dữ liệu:', formData);
      const res = await api.put(`/admin/doctors/${selectedDoctor._id}`, formData);
      
      console.log('Kết quả cập nhật bác sĩ:', res.data);
      
      if (res.data.success) {
        toast.success('Cập nhật thông tin bác sĩ thành công');
        fetchData();
        closeModal();
        
        // If there's a selected file, upload the avatar 
        if (selectedFile) {
          try {
            console.log('Đang tải lên avatar cho bác sĩ:', selectedDoctor._id);
            
            const avatarFormData = new FormData();
            avatarFormData.append('avatar', selectedFile);
            
            const uploadRes = await api.post(`/admin/doctors/${selectedDoctor._id}/avatar`, avatarFormData, {
              headers: {
                'Content-Type': 'multipart/form-data'
              }
            });
            
            console.log('Kết quả upload avatar:', uploadRes.data);
            
            toast.success('Cập nhật ảnh đại diện thành công');
            fetchData(); // Reload data after avatar update
          } catch (uploadError) {
            console.error('Lỗi upload avatar:', uploadError.response?.data || uploadError);
            toast.error('Thông tin bác sĩ đã được cập nhật nhưng không thể tải lên ảnh đại diện');
          }
        }
      }
    } catch (error) {
      console.error('Lỗi cập nhật bác sĩ:', error.response?.data || error);
      toast.error(error.response?.data?.message || 'Không thể cập nhật thông tin bác sĩ');
    } finally {
      setFormSubmitting(false);
    }
  };

  const handleDeleteDoctor = async (doctorId) => {
    try {
      const res = await api.delete(`/admin/doctors/${doctorId}`);
      if (res.data.success) {
        toast.success('Đã xóa bác sĩ thành công');
        fetchData();
        closeModal();
      }
    } catch (error) {
      console.error('Error deleting doctor:', error);
      toast.error('Không thể xóa bác sĩ');
    }
  };

  const exportData = () => {
    // Xuất dữ liệu dưới dạng CSV
    const fields = ['_id', 'fullName', 'email', 'phone', 'specialtyId.name', 'hospitalId.name', 'status', 'createdAt'];
    
    const csvContent = [
      // Header
      fields.join(','),
      // Rows
      ...doctors.map(item => 
        fields.map(field => {
          // Xử lý trường hợp nested field
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
    link.setAttribute('download', `doctors_${new Date().toISOString().split('T')[0]}.csv`);
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

  // Hàm khóa tài khoản bác sĩ
  const handleLockDoctor = async (doctorId) => {
    try {
      if (!lockReason || lockReason.trim() === '') {
        toast.error('Vui lòng nhập lý do khóa tài khoản');
        return;
      }
      
      setFormSubmitting(true);
      console.log('Đang khóa tài khoản bác sĩ:', doctorId, 'Lý do:', lockReason);
      
      const res = await api.put(`/admin/doctors/${doctorId}/lock`, { 
        lockReason: lockReason 
      });
      
      if (res.data.success) {
        toast.success('Đã khóa tài khoản bác sĩ thành công');
        closeModal();
        // Cập nhật lại danh sách để hiển thị trạng thái mới
        fetchData();
      } else {
        toast.error(res.data?.message || 'Không thể khóa tài khoản bác sĩ');
        console.error('Lỗi khi khóa tài khoản:', res.data);
      }
    } catch (error) {
      console.error('Error locking doctor:', error.response?.data || error);
      toast.error(error.response?.data?.message || 'Không thể khóa tài khoản bác sĩ. Vui lòng thử lại.');
    } finally {
      setFormSubmitting(false);
    }
  };

  // Hàm mở khóa tài khoản bác sĩ
  const handleUnlockDoctor = async (doctorId) => {
    try {
      setFormSubmitting(true);
      console.log('Đang mở khóa tài khoản bác sĩ:', doctorId);
      
      const res = await api.put(`/admin/doctors/${doctorId}/unlock`);
      
      if (res.data.success) {
        toast.success('Đã mở khóa tài khoản bác sĩ thành công');
        closeModal();
        // Cập nhật lại danh sách để hiển thị trạng thái mới
        fetchData();
      } else {
        toast.error(res.data?.message || 'Không thể mở khóa tài khoản bác sĩ');
        console.error('Lỗi khi mở khóa tài khoản:', res.data);
      }
    } catch (error) {
      console.error('Error unlocking doctor:', error.response?.data || error);
      toast.error(error.response?.data?.message || 'Không thể mở khóa tài khoản bác sĩ. Vui lòng thử lại.');
    } finally {
      setFormSubmitting(false);
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewImage(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleUploadAvatar = async () => {
    if (!selectedFile || !selectedDoctor) {
      toast.error('Vui lòng chọn file ảnh');
      return;
    }

    setUploadLoading(true);
    try {
      console.log('Đang tải lên avatar cho bác sĩ:', selectedDoctor._id);
      
      const formData = new FormData();
      formData.append('avatar', selectedFile);

      const res = await api.post(`/admin/doctors/${selectedDoctor._id}/avatar`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      console.log('Kết quả upload avatar:', res.data);
      
      if (res.data.success) {
        toast.success('Cập nhật ảnh đại diện thành công');
        fetchData(); // Reload data
        closeModal();
      } else {
        toast.error(res.data.message || 'Không thể cập nhật ảnh đại diện');
      }
    } catch (error) {
      console.error('Lỗi upload avatar:', error.response?.data || error);
      toast.error(error.response?.data?.message || 'Lỗi khi tải lên ảnh đại diện');
    } finally {
      setUploadLoading(false);
    }
  };

  // Thêm hàm xử lý chứng chỉ
  const handleAddCertification = () => {
    const certification = document.getElementById('certification-input').value.trim();
    if (certification) {
      setFormData(prev => ({
        ...prev,
        certifications: [...prev.certifications, certification]
      }));
      document.getElementById('certification-input').value = '';
      
      // Clear certification error if any
      if (formErrors.certifications) {
        setFormErrors(prev => ({ ...prev, certifications: '' }));
      }
    }
  };

  const handleRemoveCertification = (index) => {
    setFormData(prev => ({
      ...prev,
      certifications: prev.certifications.filter((_, i) => i !== index)
    }));
  };

  const handleKeyPressCertification = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddCertification();
    }
  };

  return (
    <div className="w-full">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Quản lý bác sĩ</h1>
      </div>

      <style>{`
        .loading-services {
          display: flex;
          align-items: center;
          justify-content: center;
          flex-direction: column;
          padding: 1rem;
          background-color: #f9fafb;
          border-radius: 0.375rem;
          border: 1px solid #e5e7eb;
        }
        
        .small-spinner {
          border: 3px solid rgba(0, 0, 0, 0.1);
          border-radius: 50%;
          border-top: 3px solid #3b82f6;
          width: 24px;
          height: 24px;
          animation: spin 1s linear infinite;
          margin-bottom: 0.5rem;
        }
        
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        
        .no-services-message {
          padding: 1rem;
          background-color: #f9fafb;
          border-radius: 0.375rem;
          border: 1px solid #e5e7eb;
          color: #6b7280;
          text-align: center;
        }

        .info-message {
          color: #3b82f6;
          font-size: 0.85rem;
          margin-top: 0.25rem;
        }

        .no-certifications-message {
          padding: 0.75rem;
          background-color: #f9fafb;
          border-radius: 0.375rem;
          border: 1px dashed #e5e7eb;
          color: #6b7280;
          text-align: center;
          margin-bottom: 0.75rem;
        }
      `}</style>

      <div className="mb-6 bg-white rounded-lg shadow p-4">
        <div className="flex flex-col md:flex-row justify-between items-start gap-4">
          <div className="w-full md:w-2/3 space-y-4">
            <form onSubmit={handleSearch} className="w-full">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Tìm kiếm theo tên, email, SĐT..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full px-4 py-2 pr-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                {searchTerm && (
                  <button 
                    type="button" 
                    className="absolute right-10 top-2.5 text-gray-400 hover:text-gray-600"
                    onClick={handleSearchReset}
                  >
                    <FaTimes />
                  </button>
                )}
                <button type="submit" className="absolute right-3 top-2.5 text-gray-500 hover:text-blue-600">
                  <FaSearch />
                </button>
              </div>
            </form>

            <div className="flex flex-wrap gap-3">
              <div className="flex items-center space-x-2">
                <FaFilter className="text-gray-500" />
                <select
                  name="status"
                  value={filter.status}
                  onChange={handleFilterChange}
                  className="border border-gray-300 rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  aria-label="Lọc theo trạng thái"
                >
                  <option value="all">Tất cả trạng thái</option>
                  <option value="active">Đang hoạt động</option>
                  <option value="locked">Đã khóa</option>
                </select>
              </div>
              <div className="flex items-center space-x-2">
                <FaClinicMedical className="text-gray-500" />
                <select
                  name="specialtyId"
                  value={filter.specialtyId}
                  onChange={handleFilterChange}
                  className="border border-gray-300 rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  aria-label="Lọc theo chuyên khoa"
                  disabled={specialties.length === 0}
                >
                  <option value="all">
                    {specialties.length === 0 ? 'Đang tải chuyên khoa...' : 'Tất cả chuyên khoa'}
                  </option>
                  {specialties && specialties.length > 0 && specialties.map(specialty => (
                    <option key={specialty._id} value={specialty._id}>
                      {specialty.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex items-center space-x-2">
                <FaMapMarkerAlt className="text-gray-500" />
                <select
                  name="hospitalId"
                  value={filter.hospitalId}
                  onChange={handleFilterChange}
                  className="border border-gray-300 rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  aria-label="Lọc theo cơ sở y tế"
                  disabled={hospitals.length === 0}
                >
                  <option value="all">
                    {hospitals.length === 0 ? 'Đang tải bệnh viện...' : 'Tất cả cơ sở y tế'}
                  </option>
                  {hospitals && hospitals.length > 0 && hospitals.map(hospital => (
                    <option key={hospital._id} value={hospital._id}>
                      {hospital.name}
                    </option>
                  ))}
                </select>
              </div>
              {(filter.status !== 'all' || filter.specialtyId !== 'all' || filter.hospitalId !== 'all') && (
                <button 
                  className="px-3 py-1.5 text-sm bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors"
                  onClick={handleFilterReset}
                >
                  Xóa bộ lọc
                </button>
              )}
            </div>
          </div>

          <div className="flex space-x-2 mt-4 md:mt-0">
            <button 
              className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              onClick={() => openModal('add')}
            >
              <FaPlus className="mr-2" />
              Thêm bác sĩ
            </button>
            <button 
              className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              onClick={exportData}
            >
              <FaDownload className="mr-2" />
              Xuất dữ liệu
            </button>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center p-8">
          <div className="w-12 h-12 border-4 border-blue-600/30 border-t-blue-600 rounded-full animate-spin"></div>
          <p className="ml-3 text-gray-600">Đang tải dữ liệu...</p>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ảnh</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Họ tên</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Điện thoại</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Chuyên khoa</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cơ sở y tế</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Trạng thái</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ngày tạo</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Hành động</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {doctors && doctors.length > 0 && doctors.map((doctor) => {
                  return (
                    <tr key={doctor._id} 
                      onClick={() => openModal('view', doctor)} 
                      className="hover:bg-gray-50 cursor-pointer"
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="h-10 w-10 rounded-full overflow-hidden bg-gray-100">
                          <img 
                            src={doctor?.user?.avatarUrl || doctor.avatarUrl || '/avatars/default-avatar.png'} 
                            alt={doctor.fullName || doctor.user?.fullName || 'Doctor'}
                            className="h-full w-full object-cover"
                            onError={(e) => {
                              e.target.src = '/avatars/default-avatar.png';
                            }}
                          />
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {doctor.user?.fullName || doctor.fullName || 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {doctor.user?.email || doctor.email || 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {doctor.user?.phoneNumber || doctor.phone || 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {doctor.specialtyId?.name || 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {doctor.hospitalId?.name || 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          (doctor.user && doctor.user.isLocked) 
                            ? 'bg-red-100 text-red-800' 
                            : 'bg-green-100 text-green-800'
                        }`}>
                          {(doctor.user && doctor.user.isLocked) ? 'Đã khóa' : 'Hoạt động'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatDate(doctor.createdAt)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex space-x-3">
                          <button
                            className="text-blue-600 hover:text-blue-900"
                            onClick={(e) => {
                              e.stopPropagation();
                              openModal('edit', doctor);
                            }}
                            title="Chỉnh sửa"
                          >
                            <FaEdit />
                          </button>
                          {(doctor.user && doctor.user.isLocked) ? (
                            <button
                              className="text-green-600 hover:text-green-900"
                              onClick={(e) => {
                                e.stopPropagation();
                                openModal('lock', doctor);
                              }}
                              title="Mở khóa tài khoản"
                            >
                              <FaUserCheck />
                            </button>
                          ) : (
                            <button
                              className="text-yellow-600 hover:text-yellow-900"
                              onClick={(e) => {
                                e.stopPropagation();
                                openModal('lock', doctor);
                              }}
                              title="Khóa tài khoản"
                            >
                              <FaUserLock />
                            </button>
                          )}
                          <button
                            className="text-purple-600 hover:text-purple-900"
                            onClick={(e) => {
                              e.stopPropagation();
                              openModal('image', doctor);
                            }}
                            title="Quản lý hình ảnh"
                          >
                            <FaImage />
                          </button>
                          <button
                            className="text-red-600 hover:text-red-900"
                            onClick={(e) => {
                              e.stopPropagation();
                              openModal('delete', doctor);
                            }}
                            title="Xóa bác sĩ"
                          >
                            <FaTrash />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
            <div className="flex-1 flex justify-between sm:hidden">
              <button
                onClick={() => handlePageChange(pagination.currentPage - 1)}
                disabled={pagination.currentPage === 1}
                className={`relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md ${
                  pagination.currentPage === 1 
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
                  : 'bg-white text-gray-700 hover:bg-gray-50'
                }`}
              >
                Trước
              </button>
              <button
                onClick={() => handlePageChange(pagination.currentPage + 1)}
                disabled={pagination.currentPage === pagination.totalPages}
                className={`ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md ${
                  pagination.currentPage === pagination.totalPages 
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
                  : 'bg-white text-gray-700 hover:bg-gray-50'
                }`}
              >
                Sau
              </button>
            </div>
            <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
              <div>
                <p className="text-sm text-gray-700">
                  Trang <span className="font-medium">{pagination.currentPage}</span> / <span className="font-medium">{pagination.totalPages}</span> ({totalRecords} bản ghi)
                </p>
              </div>
              <div>
                <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                  <button
                    onClick={() => handlePageChange(1)}
                    disabled={pagination.currentPage === 1}
                    className={`relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium ${
                      pagination.currentPage === 1 
                      ? 'text-gray-300 cursor-not-allowed' 
                      : 'text-gray-500 hover:bg-gray-50'
                    }`}
                  >
                    &laquo;
                  </button>
                  <button
                    onClick={() => handlePageChange(pagination.currentPage - 1)}
                    disabled={pagination.currentPage === 1}
                    className={`relative inline-flex items-center px-2 py-2 border border-gray-300 bg-white text-sm font-medium ${
                      pagination.currentPage === 1 
                      ? 'text-gray-300 cursor-not-allowed' 
                      : 'text-gray-500 hover:bg-gray-50'
                    }`}
                  >
                    &lsaquo;
                  </button>
                  
                  <span className="relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-700">
                    {pagination.currentPage} / {pagination.totalPages}
                  </span>
                  
                  <button
                    onClick={() => handlePageChange(pagination.currentPage + 1)}
                    disabled={pagination.currentPage === pagination.totalPages}
                    className={`relative inline-flex items-center px-2 py-2 border border-gray-300 bg-white text-sm font-medium ${
                      pagination.currentPage === pagination.totalPages 
                      ? 'text-gray-300 cursor-not-allowed' 
                      : 'text-gray-500 hover:bg-gray-50'
                    }`}
                  >
                    &rsaquo;
                  </button>
                  <button
                    onClick={() => handlePageChange(pagination.totalPages)}
                    disabled={pagination.currentPage === pagination.totalPages}
                    className={`relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium ${
                      pagination.currentPage === pagination.totalPages 
                      ? 'text-gray-300 cursor-not-allowed' 
                      : 'text-gray-500 hover:bg-gray-50'
                    }`}
                  >
                    &raquo;
                  </button>
                </nav>
              </div>
            </div>
          </div>
        </div>
      )}

      {isModalOpen && (
        <>
          <div className="fixed inset-0 bg-black bg-opacity-50 z-40" onClick={closeModal}></div>
          <div className="fixed inset-0 z-50 flex items-center justify-center overflow-auto py-8">
            <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-screen overflow-y-auto">
              <div className="flex items-center justify-between p-4 border-b">
                <h2 className="text-lg font-semibold text-gray-800">
                  {modalType === 'add' && 'Thêm bác sĩ mới'}
                  {modalType === 'edit' && 'Chỉnh sửa thông tin bác sĩ'}
                  {modalType === 'delete' && 'Xác nhận xóa bác sĩ'}
                  {modalType === 'image' && 'Quản lý hình ảnh bác sĩ'}
                  {modalType === 'lock' && selectedDoctor?.user?.isLocked ? 'Mở khóa tài khoản bác sĩ' : 'Khóa tài khoản bác sĩ'}
                  {modalType === 'view' && 'Thông tin bác sĩ'}
                </h2>
                <button 
                  className="text-gray-500 hover:text-gray-700 focus:outline-none" 
                  onClick={closeModal}
                  aria-label="Đóng"
                >
                  <FaTimes className="h-5 w-5" />
                </button>
              </div>
              
              <div className="p-6">
                {modalType === 'delete' && (
                  <div className="text-center p-6">
                    <p className="mb-4">Bạn có chắc chắn muốn xóa bác sĩ <strong>{selectedDoctor?.fullName || selectedDoctor?.user?.fullName || ''}</strong>?</p>
                    <p className="text-gray-500">Hành động này không thể hoàn tác.</p>
                  </div>
                )}
                
                {modalType === 'lock' && (
                  <div className="space-y-4">
                    {selectedDoctor?.user?.isLocked ? (
                      <p>Bạn có chắc chắn muốn mở khóa tài khoản <strong>{selectedDoctor?.fullName || selectedDoctor?.user?.fullName || 'này'}</strong>?</p>
                    ) : (
                      <p>Bạn có chắc chắn muốn khóa tài khoản <strong>{selectedDoctor?.fullName || selectedDoctor?.user?.fullName || 'này'}</strong>?</p>
                    )}
                    
                    {!selectedDoctor?.user?.isLocked && (
                      <div className="mt-4">
                        <label htmlFor="lockReason" className="block text-sm font-medium text-gray-700 mb-1">Lý do khóa tài khoản:</label>
                        <textarea
                          id="lockReason"
                          name="lockReason"
                          value={lockReason}
                          onChange={(e) => setLockReason(e.target.value)}
                          className="block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                          placeholder="Vui lòng nhập lý do khóa tài khoản"
                          rows="3"
                        />
                      </div>
                    )}
                    
                    {selectedDoctor?.user?.isLocked ? (
                      <p className="text-green-600 text-sm mt-2">
                        Tài khoản sẽ được mở khóa và người dùng có thể đăng nhập lại.
                      </p>
                    ) : (
                      <p className="text-yellow-600 text-sm mt-2">
                        Tài khoản sẽ không thể đăng nhập cho đến khi được mở khóa.
                      </p>
                    )}
                  </div>
                )}
                
                {modalType === 'image' && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-3">
                      <h3 className="text-lg font-medium text-gray-900">Ảnh đại diện hiện tại</h3>
                      <div className="bg-gray-100 rounded-lg p-4 flex items-center justify-center">
                        <img 
                          src={selectedDoctor?.avatarUrl || selectedDoctor?.user?.avatarUrl || '/avatars/default-avatar.png'} 
                          alt={selectedDoctor?.fullName || selectedDoctor?.user?.fullName || 'Doctor'} 
                          className="h-40 w-40 object-cover rounded-full border-4 border-white shadow"
                          onError={(e) => {
                            e.target.src = '/avatars/default-avatar.png';
                          }}
                        />
                      </div>
                    </div>
                    <div className="space-y-3">
                      <h3 className="text-lg font-medium text-gray-900">Tải lên ảnh mới</h3>
                      <div className="space-y-4">
                        <div className="mb-4 p-4 border border-dashed border-gray-300 rounded-lg text-center">
                          {previewImage ? (
                            <div className="relative mx-auto">
                              <img 
                                src={previewImage} 
                                alt="Preview" 
                                className="max-h-64 max-w-full mx-auto rounded-full object-cover border-4 border-white shadow"
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
                    </div>
                  </div>
                )}

                {(modalType === 'add' || modalType === 'edit') && (
                  <form className="space-y-6">
                    <div className="bg-blue-50 p-4 rounded-lg mb-6">
                      <h3 className="text-md font-medium text-blue-800 mb-2">Thông tin cơ bản</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label htmlFor="fullName" className="block text-sm font-medium text-gray-700 mb-1">
                            Họ và tên <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="text"
                            id="fullName"
                            name="fullName"
                            value={formData.fullName}
                            onChange={handleInputChange}
                            className={`block w-full border ${formErrors.fullName ? 'border-red-300' : 'border-gray-300'} rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm`}
                            placeholder="Nhập họ và tên bác sĩ"
                          />
                          {formErrors.fullName && <p className="mt-1 text-sm text-red-600">{formErrors.fullName}</p>}
                        </div>
                        
                        <div>
                          <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                            Email <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="email"
                            id="email"
                            name="email"
                            value={formData.email}
                            onChange={handleInputChange}
                            className={`block w-full border ${formErrors.email ? 'border-red-300' : 'border-gray-300'} rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm`}
                            placeholder="Nhập địa chỉ email"
                          />
                          {formErrors.email && <p className="mt-1 text-sm text-red-600">{formErrors.email}</p>}
                        </div>
                        
                        {modalType === 'add' && (
                          <div>
                            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                              Mật khẩu <span className="text-red-500">*</span>
                            </label>
                            <input
                              type="password"
                              id="password"
                              name="password"
                              value={formData.password}
                              onChange={handleInputChange}
                              className={`block w-full border ${formErrors.password ? 'border-red-300' : 'border-gray-300'} rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm`}
                              placeholder="Nhập mật khẩu"
                            />
                            {formErrors.password && <p className="mt-1 text-sm text-red-600">{formErrors.password}</p>}
                          </div>
                        )}
                        
                        <div>
                          <label htmlFor="phoneNumber" className="block text-sm font-medium text-gray-700 mb-1">
                            Số điện thoại <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="text"
                            id="phoneNumber"
                            name="phoneNumber"
                            value={formData.phoneNumber}
                            onChange={handleInputChange}
                            className={`block w-full border ${formErrors.phoneNumber ? 'border-red-300' : 'border-gray-300'} rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm`}
                            placeholder="Nhập số điện thoại"
                          />
                          {formErrors.phoneNumber && <p className="mt-1 text-sm text-red-600">{formErrors.phoneNumber}</p>}
                        </div>
                        
                        <div>
                          <label htmlFor="dateOfBirth" className="block text-sm font-medium text-gray-700 mb-1">
                            Ngày sinh
                          </label>
                          <input
                            type="date"
                            id="dateOfBirth"
                            name="dateOfBirth"
                            value={formData.dateOfBirth}
                            onChange={handleInputChange}
                            className="block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                          />
                        </div>
                        
                        <div>
                          <label htmlFor="gender" className="block text-sm font-medium text-gray-700 mb-1">
                            Giới tính
                          </label>
                          <select
                            id="gender"
                            name="gender"
                            value={formData.gender}
                            onChange={handleInputChange}
                            className="block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                          >
                            <option value="male">Nam</option>
                            <option value="female">Nữ</option>
                            <option value="other">Khác</option>
                          </select>
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
                            className={`block w-full border ${formErrors.address ? 'border-red-300' : 'border-gray-300'} rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm`}
                            placeholder="Nhập địa chỉ"
                          />
                          {formErrors.address && <p className="mt-1 text-sm text-red-600">{formErrors.address}</p>}
                        </div>
                      </div>
                    </div>
                    
                    <div className="bg-green-50 p-4 rounded-lg">
                      <h3 className="text-md font-medium text-green-800 mb-2">Thông tin chuyên môn</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
                            Chức danh <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="text"
                            id="title"
                            name="title"
                            value={formData.title}
                            onChange={handleInputChange}
                            className={`block w-full border ${formErrors.title ? 'border-red-300' : 'border-gray-300'} rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm`}
                            placeholder="Ví dụ: Bác sĩ, Giáo sư, Tiến sĩ..."
                          />
                          {formErrors.title && <p className="mt-1 text-sm text-red-600">{formErrors.title}</p>}
                        </div>
                        
                        <div>
                          <label htmlFor="experience" className="block text-sm font-medium text-gray-700 mb-1">
                            Kinh nghiệm (năm)
                          </label>
                          <input
                            type="number"
                            id="experience"
                            name="experience"
                            value={formData.experience}
                            onChange={handleInputChange}
                            min="0"
                            className="block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                            placeholder="Số năm kinh nghiệm"
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
                            className={`block w-full border ${formErrors.specialtyId ? 'border-red-300' : 'border-gray-300'} rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm`}
                            disabled={!formData.hospitalId}
                          >
                            <option value="">
                              {!formData.hospitalId 
                                ? '-- Vui lòng chọn bệnh viện trước --' 
                                : specialties.length === 0 
                                  ? '-- Không có chuyên khoa cho bệnh viện này --' 
                                  : '-- Chọn chuyên khoa --'
                              }
                            </option>
                            {specialties.map(specialty => (
                              <option key={specialty._id} value={specialty._id}>
                                {specialty.name}
                              </option>
                            ))}
                          </select>
                          {formErrors.specialtyId && <p className="mt-1 text-sm text-red-600">{formErrors.specialtyId}</p>}
                          {formData.hospitalId && specialties.length === 0 && (
                            <p className="mt-1 text-xs text-orange-500">Bệnh viện này chưa có chuyên khoa nào. Vui lòng chọn bệnh viện khác hoặc thêm chuyên khoa cho bệnh viện này.</p>
                          )}
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
                            className={`block w-full border ${formErrors.hospitalId ? 'border-red-300' : 'border-gray-300'} rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm`}
                          >
                            <option value="">-- Chọn cơ sở y tế --</option>
                            {hospitals.map(hospital => (
                              <option key={hospital._id} value={hospital._id}>
                                {hospital.name}
                              </option>
                            ))}
                          </select>
                          {formErrors.hospitalId && <p className="mt-1 text-sm text-red-600">{formErrors.hospitalId}</p>}
                        </div>
                        
                        <div>
                          <label htmlFor="consultationFee" className="block text-sm font-medium text-gray-700 mb-1">
                            Phí tư vấn (VNĐ) <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="number"
                            id="consultationFee"
                            name="consultationFee"
                            value={formData.consultationFee}
                            onChange={handleInputChange}
                            min="0"
                            step="1000"
                            className={`block w-full border ${formErrors.consultationFee ? 'border-red-300' : 'border-gray-300'} rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm`}
                            placeholder="Nhập phí tư vấn"
                          />
                          {formErrors.consultationFee && <p className="mt-1 text-sm text-red-600">{formErrors.consultationFee}</p>}
                        </div>
                        
                        <div>
                          <label htmlFor="isAvailable" className="block text-sm font-medium text-gray-700 mb-1">
                            Trạng thái làm việc
                          </label>
                          <select
                            id="isAvailable"
                            name="isAvailable"
                            value={formData.isAvailable}
                            onChange={(e) => setFormData({ ...formData, isAvailable: e.target.value === 'true' })}
                            className="block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                          >
                            <option value="true">Đang hành nghề</option>
                            <option value="false">Tạm ngưng</option>
                          </select>
                        </div>
                      </div>
                    </div>
                    
                    <div className="space-y-4">
                      <div>
                        <label htmlFor="education" className="block text-sm font-medium text-gray-700 mb-1">
                          Học vấn <span className="text-red-500">*</span>
                        </label>
                        <textarea
                          id="education"
                          name="education"
                          value={formData.education}
                          onChange={handleInputChange}
                          rows="2"
                          className={`block w-full border ${formErrors.education ? 'border-red-300' : 'border-gray-300'} rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm`}
                          placeholder="Nhập thông tin học vấn"
                        ></textarea>
                        {formErrors.education && <p className="mt-1 text-sm text-red-600">{formErrors.education}</p>}
                      </div>
                      
                      {/* Certifications section */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Chứng chỉ <span className="text-red-500">*</span>
                        </label>
                        <div className="flex space-x-2">
                          <input
                            id="certification-input"
                            type="text"
                            className="flex-grow border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                            placeholder="Nhập chứng chỉ"
                            onKeyPress={handleKeyPressCertification}
                          />
                          <button
                            type="button"
                            onClick={handleAddCertification}
                            className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                          >
                            Thêm
                          </button>
                        </div>
                        {formErrors.certifications && (
                          <p className="mt-1 text-sm text-red-600">{formErrors.certifications}</p>
                        )}
                        
                        {/* Display added certifications */}
                        <div className="mt-2 space-y-1">
                          {formData.certifications.length === 0 ? (
                            <div className="no-certifications-message">
                              <p>Chưa có chứng chỉ nào được thêm</p>
                            </div>
                          ) : (
                            <div className="mt-2">
                              <p className="text-xs text-gray-500 mb-2">Chứng chỉ đã thêm:</p>
                              <div className="flex flex-wrap gap-2">
                                {formData.certifications.map((cert, index) => (
                                  <div key={index} className="bg-blue-50 border border-blue-200 rounded-md px-3 py-1 text-sm text-blue-800 flex items-center">
                                    <span>{cert}</span>
                                    <button
                                      type="button"
                                      onClick={() => handleRemoveCertification(index)}
                                      className="ml-2 text-blue-500 hover:text-blue-700"
                                    >
                                      <FaTimes className="w-3 h-3" />
                                    </button>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                      
                      <div>
                        <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
                          Mô tả <span className="text-red-500">*</span>
                        </label>
                        <textarea
                          id="description"
                          name="description"
                          value={formData.description}
                          onChange={handleInputChange}
                          rows="3"
                          className={`block w-full border ${formErrors.description ? 'border-red-300' : 'border-gray-300'} rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm`}
                          placeholder="Nhập mô tả về bác sĩ"
                        ></textarea>
                        {formErrors.description && <p className="mt-1 text-sm text-red-600">{formErrors.description}</p>}
                      </div>
                    </div>
                    
                    {availableServices === null ? (
                      <div className="loading-services">
                        <div className="small-spinner"></div>
                        <p>Đang tải danh sách dịch vụ...</p>
                      </div>
                    ) : availableServices && availableServices.length > 0 ? (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Dịch vụ cung cấp <span className="text-red-500">*</span>
                          <span className="ml-2 text-xs text-blue-600">(Chọn một hoặc nhiều dịch vụ bác sĩ cung cấp)</span>
                        </label>
                        {formErrors.services && <p className="mt-1 text-sm text-red-600 mb-2">{formErrors.services}</p>}
                        <div className="max-h-48 overflow-y-auto p-3 border border-gray-300 rounded-md bg-white">
                          {availableServices.map(service => {
                            // Convert service ID to string for comparison
                            const serviceIdStr = service._id ? service._id.toString() : service;
                            // Check if service is in selected services
                            const isSelected = formData.services.some(id => {
                              return id === serviceIdStr || id === service._id || (typeof id === 'object' && id._id === serviceIdStr);
                            });
                            
                            return (
                              <div key={service._id} className={`flex items-center p-2 rounded-md ${isSelected ? 'bg-blue-50 border border-blue-200' : 'hover:bg-gray-50'}`}>
                                <input
                                  type="checkbox"
                                  id={`service-${service._id}`}
                                  checked={isSelected}
                                  onChange={(e) => handleServiceChange(service._id, e.target.checked)}
                                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                                />
                                <label htmlFor={`service-${service._id}`} className="ml-3 block text-sm text-gray-700 cursor-pointer w-full">
                                  <span className="font-medium">{service.name}</span>
                                  <span className="ml-2 text-blue-600">
                                    ({new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(service.price || 0)})
                                  </span>
                                </label>
                              </div>
                            );
                          })}
                        </div>
                        <div className="mt-2 text-xs text-gray-600">
                          Đã chọn: {formData.services.length} dịch vụ
                        </div>
                      </div>
                    ) : (
                      <div className="no-services-message">
                        <p>Không có dịch vụ cho chuyên khoa đã chọn. Vui lòng chọn chuyên khoa khác hoặc thêm dịch vụ mới trước.</p>
                      </div>
                    )}
                  </form>
                )}

                {modalType === 'view' && selectedDoctor && (
                  <div className="bg-white rounded-lg shadow-sm overflow-hidden">
                    <div className="flex flex-col md:flex-row items-center md:items-start p-6 bg-gray-50 border-b">
                      <div className="w-32 h-32 flex-shrink-0 mb-4 md:mb-0 md:mr-6">
                        <img 
                          src={selectedDoctor?.user?.avatarUrl || selectedDoctor?.avatarUrl || '/avatars/default-avatar.png'} 
                          alt={selectedDoctor?.fullName || selectedDoctor?.user?.fullName}
                          className="w-full h-full object-cover rounded-full border-4 border-white shadow"
                          onError={(e) => {
                            e.target.src = '/avatars/default-avatar.png';
                          }}
                        />
                      </div>
                      <div>
                        <h3 className="text-xl font-bold text-gray-900">{selectedDoctor?.user?.fullName || selectedDoctor?.fullName}</h3>
                        <p className="text-blue-600 font-medium">{selectedDoctor?.title}</p>
                        <p className="text-gray-600 mt-1">{selectedDoctor?.specialtyId?.name || 'Chuyên khoa không xác định'} - {selectedDoctor?.hospitalId?.name || 'Bệnh viện không xác định'}</p>
                      </div>
                    </div>
                    
                    <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
                      <div>
                        <h4 className="text-sm font-medium text-gray-500">Email:</h4>
                        <p className="mt-1 text-sm text-gray-900">{selectedDoctor?.user?.email || selectedDoctor?.email}</p>
                      </div>
                      <div>
                        <h4 className="text-sm font-medium text-gray-500">Số điện thoại:</h4>
                        <p className="mt-1 text-sm text-gray-900">{selectedDoctor?.user?.phoneNumber || selectedDoctor?.phoneNumber}</p>
                      </div>
                      <div>
                        <h4 className="text-sm font-medium text-gray-500">Ngày sinh:</h4>
                        <p className="mt-1 text-sm text-gray-900">
                          {selectedDoctor?.user?.dateOfBirth ? formatDate(selectedDoctor.user.dateOfBirth) : 'Không có thông tin'}
                        </p>
                      </div>
                      <div>
                        <h4 className="text-sm font-medium text-gray-500">Giới tính:</h4>
                        <p className="mt-1 text-sm text-gray-900">
                          {selectedDoctor?.user?.gender === 'male' ? 'Nam' : 
                           selectedDoctor?.user?.gender === 'female' ? 'Nữ' : 'Khác'}
                        </p>
                      </div>
                      <div>
                        <h4 className="text-sm font-medium text-gray-500">Địa chỉ:</h4>
                        <p className="mt-1 text-sm text-gray-900">{selectedDoctor?.user?.address || selectedDoctor?.address || 'Không có thông tin'}</p>
                      </div>
                      <div>
                        <h4 className="text-sm font-medium text-gray-500">Trạng thái:</h4>
                        <div className="mt-1">
                          {selectedDoctor?.isAvailable 
                            ? <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">Hoạt động</span> 
                            : <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-gray-100 text-gray-800">Không hoạt động</span>}
                        </div>
                      </div>
                      <div className="md:col-span-2">
                        <h4 className="text-sm font-medium text-gray-500">Mô tả:</h4>
                        <p className="mt-1 text-sm text-gray-900">{selectedDoctor?.description || 'Không có thông tin'}</p>
                      </div>
                      <div>
                        <h4 className="text-sm font-medium text-gray-500">Học vấn:</h4>
                        <p className="mt-1 text-sm text-gray-900">{selectedDoctor?.education || 'Không có thông tin'}</p>
                      </div>
                      <div>
                        <h4 className="text-sm font-medium text-gray-500">Kinh nghiệm:</h4>
                        <p className="mt-1 text-sm text-gray-900">{selectedDoctor?.experience || 0} năm</p>
                      </div>
                      <div className="md:col-span-2">
                        <h4 className="text-sm font-medium text-gray-500">Chứng chỉ:</h4>
                        <p className="mt-1 text-sm text-gray-900">
                          {selectedDoctor?.certifications && selectedDoctor.certifications.length > 0 
                            ? selectedDoctor.certifications.join(', ') 
                            : 'Không có thông tin'}
                        </p>
                      </div>
                      <div className="md:col-span-2">
                        <h4 className="text-sm font-medium text-gray-500">Phí tư vấn:</h4>
                        <p className="mt-1 text-sm text-gray-900 font-medium text-blue-600">
                          {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' })
                            .format(selectedDoctor?.consultationFee || 0)}
                        </p>
                      </div>
                      <div className="md:col-span-2">
                        <h4 className="text-sm font-medium text-gray-500 mb-2">Dịch vụ cung cấp:</h4>
                        {selectedDoctor?.services && selectedDoctor.services.length > 0 ? (
                          <div className="flex flex-wrap gap-2">
                            {selectedDoctor.services.map(service => (
                              <span key={service._id} className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                {service.name}
                                <span className="ml-1 text-blue-600">
                                  {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' })
                                    .format(service.price || 0)}
                                </span>
                              </span>
                            ))}
                          </div>
                        ) : (
                          <p className="text-sm text-gray-500">Không có dịch vụ</p>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
              
              <div className="px-4 py-3 bg-gray-50 flex justify-end space-x-3 rounded-b-lg border-t">
                <button 
                  className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  onClick={closeModal}
                >
                  {modalType === 'view' ? 'Đóng' : 'Hủy'}
                </button>
                
                {modalType === 'delete' && (
                  <button 
                    className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                    onClick={() => handleDeleteDoctor(selectedDoctor._id)}
                  >
                    Xác nhận xóa
                  </button>
                )}
                
                {modalType === 'lock' && (
                  <button 
                    className={`px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white focus:outline-none focus:ring-2 focus:ring-offset-2 ${
                      selectedDoctor?.user?.isLocked 
                        ? 'bg-green-600 hover:bg-green-700 focus:ring-green-500' 
                        : 'bg-yellow-600 hover:bg-yellow-700 focus:ring-yellow-500'
                    }`}
                    onClick={() => selectedDoctor?.user?.isLocked 
                      ? handleUnlockDoctor(selectedDoctor._id) 
                      : handleLockDoctor(selectedDoctor._id)
                    }
                  >
                    {selectedDoctor?.user?.isLocked ? 'Mở khóa tài khoản' : 'Khóa tài khoản'}
                  </button>
                )}
                
                {modalType === 'add' && (
                  <button 
                    className={`px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${
                      formSubmitting 
                        ? 'bg-blue-400 cursor-not-allowed' 
                        : 'bg-blue-600 hover:bg-blue-700'
                    }`}
                    onClick={handleCreateDoctor}
                    disabled={formSubmitting}
                  >
                    {formSubmitting ? 'Đang lưu...' : 'Thêm bác sĩ'}
                  </button>
                )}
                
                {modalType === 'edit' && (
                  <button 
                    className={`px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${
                      formSubmitting 
                        ? 'bg-blue-400 cursor-not-allowed' 
                        : 'bg-blue-600 hover:bg-blue-700'
                    }`}
                    onClick={handleUpdateDoctor}
                    disabled={formSubmitting}
                  >
                    {formSubmitting ? 'Đang lưu...' : 'Cập nhật'}
                  </button>
                )}
                
                {modalType === 'image' && (
                  <button 
                    className={`px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${
                      !selectedFile || uploadLoading
                        ? 'bg-blue-400 cursor-not-allowed' 
                        : 'bg-blue-600 hover:bg-blue-700'
                    }`}
                    onClick={handleUploadAvatar}
                    disabled={!selectedFile || uploadLoading}
                  >
                    {uploadLoading ? 'Đang tải lên...' : 'Cập nhật ảnh'}
                  </button>
                )}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default Doctors;
