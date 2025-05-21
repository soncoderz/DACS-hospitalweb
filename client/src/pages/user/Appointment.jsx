import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link, useParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../utils/api';
import { FaHospital, FaUserMd, FaCalendarAlt, FaClock, FaCreditCard, FaClipboardList, FaNotesMedical, FaAngleRight, FaAngleLeft, FaInfoCircle, FaExclamationTriangle, FaStar, FaLock } from 'react-icons/fa';
import { toast, ToastContainer } from 'react-toastify';
import io from 'socket.io-client';

// Custom styles for background patterns
const styles = {
  patternOverlay: {
    backgroundImage: 'radial-gradient(rgba(37, 99, 235, 0.1) 2px, transparent 2px)',
    backgroundSize: '30px 30px',
    backgroundPosition: '0 0',
  }
};

const Appointment = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const params = useParams();
  const { isAuthenticated, user } = useAuth();
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isRescheduling, setIsRescheduling] = useState(false);
  const [originalAppointment, setOriginalAppointment] = useState(null);
  const [isEditing, setIsEditing] = useState(false);

  // Socket connection state
  const [socket, setSocket] = useState(null);
  const [lockedSlots, setLockedSlots] = useState(new Map());

  // Form data
  const [formData, setFormData] = useState({
    hospitalId: '',
    specialtyId: '',
    doctorId: '',
    serviceId: '',
    appointmentDate: '',
    scheduleId: '',
    timeSlot: { startTime: '', endTime: '' },
    appointmentType: 'first-visit',
    symptoms: '',
    medicalHistory: '',
    notes: '',
    discountCode: '',
    paymentMethod: 'cash',
    roomId: '',
  });

  // Data for selection
  const [hospitals, setHospitals] = useState([]);
  const [specialties, setSpecialties] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [services, setServices] = useState([]);
  const [doctorServices, setDoctorServices] = useState([]);
  const [currentDoctorIndex, setCurrentDoctorIndex] = useState(0);
  const [schedules, setSchedules] = useState([]);
  const [availableDates, setAvailableDates] = useState([]);
  const [timeSlots, setTimeSlots] = useState([]);

  // Add state for the current month in the calendar
  const [currentMonth, setCurrentMonth] = useState(new Date());

  // Add coupon state variables
  const [couponInfo, setCouponInfo] = useState(null);
  const [validatingCoupon, setValidatingCoupon] = useState(false);

  // Add price states to the component
  const [priceDetails, setPriceDetails] = useState({
    consultationFee: 0,
    serviceFee: 0,
    totalBeforeDiscount: 0,
    discountAmount: 0,
    finalTotal: 0
  });

  // Parse URL query parameters and check for reschedule path
  useEffect(() => {
    // Check if we're on a reschedule path
    const pathParts = location.pathname.split('/');
    if (pathParts.length === 4 && pathParts[1] === 'appointments' && pathParts[3] === 'reschedule') {
      const appointmentId = pathParts[2];
      setIsRescheduling(true);
      
      // Fetch the original appointment to get details
      fetchAppointmentDetails(appointmentId);
    } else {
      // Regular appointment booking flow or editing
      const queryParams = new URLSearchParams(location.search);
      const hospitalId = queryParams.get('hospital');
      const doctorId = queryParams.get('doctor');
      const specialtyId = queryParams.get('specialty');
      const editId = queryParams.get('edit');
      
      if (editId) {
        // We're editing an existing appointment
        setIsEditing(true);
        fetchAppointmentDetails(editId);
      } else {
        // Regular new appointment
        if (hospitalId) {
          setFormData(prev => ({ ...prev, hospitalId }));
        }
        
        if (doctorId) {
          setFormData(prev => ({ ...prev, doctorId }));
        }
        
        if (specialtyId) {
          setFormData(prev => ({ ...prev, specialtyId }));
        }
      }
    }
    
    fetchInitialData();
  }, [location.pathname, location.search]);

  // Fetch original appointment details for rescheduling
  const fetchAppointmentDetails = async (appointmentId) => {
    try {
      setLoading(true);
      const response = await api.get(`/appointments/${appointmentId}`);
      
      if (response.data.success && response.data.data) {
        const appointment = response.data.data;
        setOriginalAppointment(appointment);
        
        // Pre-fill form data with original appointment details
        setFormData(prev => ({
          ...prev,
          hospitalId: appointment.hospitalId,
          specialtyId: appointment.specialtyId,
          doctorId: appointment.doctorId,
          serviceId: appointment.serviceId || '',
          appointmentType: appointment.appointmentType || 'first-visit',
          symptoms: appointment.symptoms || '',
          medicalHistory: appointment.medicalHistory || '',
          notes: appointment.notes || ''
        }));

        // Move to date selection step
        setCurrentStep(3);
      } else {
        setError('Không thể tải thông tin lịch hẹn gốc. Vui lòng thử lại sau.');
      }
    } catch (err) {
      console.error('Error fetching appointment details:', err);
      setError('Không thể tải thông tin lịch hẹn gốc. Vui lòng thử lại sau.');
    } finally {
      setLoading(false);
    }
  };

  // Fetch initial data
  const fetchInitialData = async (preselectedHospitalId) => {
    setLoading(true);
    try {
      // Fetch hospitals
      const hospitalsResponse = await api.get('/hospitals');
      
      // Xử lý dữ liệu hospitals
      let hospitalsData = [];
      if (hospitalsResponse.data) {
        if (Array.isArray(hospitalsResponse.data.data)) {
          hospitalsData = hospitalsResponse.data.data;
        } else if (hospitalsResponse.data.data && hospitalsResponse.data.data.hospitals) {
          hospitalsData = hospitalsResponse.data.data.hospitals;
        }
      }
      setHospitals(hospitalsData);

      // If there's a preselected hospital, fetch its specialties
      if (preselectedHospitalId) {
        fetchSpecialties(preselectedHospitalId);
      }

      setError(null);
    } catch (err) {
      console.error('Error fetching initial data:', err);
      setError('Không thể tải dữ liệu ban đầu. Vui lòng thử lại sau.');
    } finally {
      setLoading(false);
    }
  };

  // Fetch specialties when hospital is selected
  const fetchSpecialties = async (hospitalId) => {
    setLoading(true);
    try {
      const response = await api.get(`/hospitals/${hospitalId}/specialties`);
      
      // Xử lý dữ liệu specialties
      let specialtiesData = [];
      if (response.data) {
        if (Array.isArray(response.data.data)) {
          specialtiesData = response.data.data;
        } else if (response.data.data && response.data.data.specialties) {
          specialtiesData = response.data.data.specialties;
        }
      }
      setSpecialties(specialtiesData);
    } catch (err) {
      console.error('Error fetching specialties:', err);
      setError('Không thể tải danh sách chuyên khoa. Vui lòng thử lại sau.');
    } finally {
      setLoading(false);
    }
  };

  // Fetch doctors when specialty is selected
  const fetchDoctors = async () => {
    if (!formData.hospitalId || !formData.specialtyId) return;

    setLoading(true);
    try {
      const response = await api.get('/doctors', {
        params: {
          hospitalId: formData.hospitalId,
          specialtyId: formData.specialtyId
        }
      });
      
      // Xử lý dữ liệu doctors
      let doctorsData = [];
      if (response.data) {
        if (Array.isArray(response.data.data)) {
          doctorsData = response.data.data;
        } else if (response.data.data && response.data.data.doctors) {
          doctorsData = response.data.data.doctors;
        }
      }
      setDoctors(doctorsData);
    } catch (err) {
      console.error('Error fetching doctors:', err);
      setError('Không thể tải danh sách bác sĩ. Vui lòng thử lại sau.');
    } finally {
      setLoading(false);
    }
  };

  // Fetch services when specialty is selected
  const fetchServices = async () => {
    if (!formData.specialtyId) return;

    setLoading(true);
    try {
      const response = await api.get(`/appointments/specialties/${formData.specialtyId}/services`);
      
      // Xử lý dữ liệu services
      let servicesData = [];
      if (response.data) {
        if (Array.isArray(response.data.data)) {
          servicesData = response.data.data;
        } else if (response.data.data && response.data.data.services) {
          servicesData = response.data.data.services;
        }
      }
      setServices(servicesData);
    } catch (err) {
      console.error('Error fetching services:', err);
      setError('Không thể tải danh sách dịch vụ. Vui lòng thử lại sau.');
    } finally {
      setLoading(false);
    }
  };

  // Fetch schedules when doctor is selected
  const fetchSchedules = async () => {
    if (!formData.doctorId) return;

    setLoading(true);
    try {
      // Get doctor details to ensure we have specialtyId
      const doctorResponse = await api.get(`/doctors/doctors/${formData.doctorId}`);
      const doctorData = doctorResponse.data.data;
      
      // Set specialtyId from doctor data if it's not already set
      if (doctorData && doctorData.specialtyId && !formData.specialtyId) {
        // Update formData with specialtyId
        setFormData(prev => ({
          ...prev,
          specialtyId: typeof doctorData.specialtyId === 'object' ? 
            doctorData.specialtyId._id : doctorData.specialtyId
        }));
      }
      
      // Updated endpoint to match the API response format shown
      const response = await api.get(`/appointments/doctors/${formData.doctorId}/schedules`);
      
      // Enhanced debugging for the API response
      console.log('Raw API response:', response.data);
      
      // Handle different data structures
      let scheduleData = [];
      if (response.data) {
        if (Array.isArray(response.data.data)) {
          scheduleData = response.data.data;
        } else if (response.data.data && response.data.data.schedules) {
          scheduleData = response.data.data.schedules;
        }
      }
      
      // Fix any potential issues with the data structure
      if (scheduleData && scheduleData.length > 0) {
        // Normalize the schedule data to ensure all properties exist
        scheduleData = scheduleData.map(schedule => {
          if (schedule.timeSlots && Array.isArray(schedule.timeSlots)) {
            const normalizedTimeSlots = schedule.timeSlots.map(slot => ({
              ...slot,
              // Ensure these properties exist with correct defaults
              bookedCount: slot.bookedCount || 0,
              maxBookings: slot.maxBookings || 3,
              appointmentIds: slot.appointmentIds || [],
              // Force isBooked to be false for new slots with bookedCount of 0
              isBooked: slot.bookedCount >= (slot.maxBookings || 3)
            }));
            
            return {
              ...schedule,
              timeSlots: normalizedTimeSlots
            };
          }
          return schedule;
        });
      }
      
      console.log('Normalized Doctor schedules data:', scheduleData);
      setSchedules(scheduleData);

      // Extract and format available dates from schedules
      if (scheduleData.length > 0) {
        // Extract dates and standardize them with UTC noon timestamp to prevent timezone issues
        const dates = [...new Set(
          scheduleData.map(schedule => {
            // Create a standardized UTC date to ensure consistent date handling
            const scheduleDate = new Date(schedule.date);
            const utcDate = new Date(Date.UTC(
              scheduleDate.getFullYear(),
              scheduleDate.getMonth(),
              scheduleDate.getDate(),
              12, 0, 0
            ));
            return utcDate.toISOString().split('T')[0];
          })
        )].sort();
        
        setAvailableDates(dates);
        
        // If there are dates available, clear any previous selection
        setFormData(prev => ({
          ...prev,
          appointmentDate: '',
          scheduleId: '',
          timeSlot: { startTime: '', endTime: '' }
        }));
      } else {
        setAvailableDates([]);
      }
    } catch (err) {
      console.error('Error fetching schedules:', err);
      setError('Không thể tải lịch khám. Vui lòng thử lại sau.');
    } finally {
      setLoading(false);
    }
  };

  // Update findTimeSlots function to select the first available slot if needed
  const findTimeSlots = (date) => {
    // Create standardized UTC date string for consistent comparison
    const localDate = new Date(date);
    const utcDate = new Date(Date.UTC(
      localDate.getFullYear(),
      localDate.getMonth(),
      localDate.getDate(),
      12, 0, 0
    ));
    const utcDateString = utcDate.toISOString().split('T')[0];
    
    // Find all schedules for the selected date using the standardized UTC date
    const schedulesForDate = schedules.filter(schedule => {
      // Convert schedule date to standardized UTC format for comparison
      const scheduleDate = new Date(schedule.date);
      const scheduleUtcDate = new Date(Date.UTC(
        scheduleDate.getFullYear(),
        scheduleDate.getMonth(),
        scheduleDate.getDate(),
        12, 0, 0
      ));
      return scheduleUtcDate.toISOString().split('T')[0] === utcDateString;
    });
    
    if (schedulesForDate.length > 0) {
      // Get all time slots (both available and booked)
      const allSlots = [];
      
      // Process each schedule
      schedulesForDate.forEach(schedule => {
        // If schedule has timeSlots array
        if (schedule.timeSlots && Array.isArray(schedule.timeSlots)) {
          // Map all slots, including booked ones
          const slotsFromThisSchedule = schedule.timeSlots.map(slot => {
            // Check if we need to override the isBooked property based on bookedCount
            // This handles the case where isBooked might be true but bookedCount is 0
            const isFullyBooked = (slot.bookedCount !== undefined && 
                                 slot.maxBookings !== undefined && 
                                 slot.bookedCount >= slot.maxBookings);
            
            return {
              scheduleId: schedule._id,
              startTime: slot.startTime,
              endTime: slot.endTime,
              _id: slot._id,
              roomId: slot.roomId,
              bookedCount: slot.bookedCount || 0,
              maxBookings: slot.maxBookings || 3,
              // Force isBooked to be determined ONLY by the bookedCount vs maxBookings comparison
              isBooked: isFullyBooked
            };
          });
          
          allSlots.push(...slotsFromThisSchedule);
        }
      });
      
      // Sort slots by start time
      allSlots.sort((a, b) => {
        const timeA = a.startTime.split(':').map(Number);
        const timeB = b.startTime.split(':').map(Number);
        
        // Compare hours
        if (timeA[0] !== timeB[0]) {
          return timeA[0] - timeB[0];
        }
        
        // If hours are equal, compare minutes
        return timeA[1] - timeB[1];
      });
      
      // Debug log showing the exact data that will be used for displaying slots
      console.log("Time slots before rendering:", JSON.stringify(allSlots, null, 2));
      
      setTimeSlots(allSlots);
      
      // Set the schedule ID if available slots exist
      const availableSlots = allSlots.filter(slot => !slot.isBooked);
      if (schedulesForDate.length > 0 && availableSlots.length > 0) {
        // Use the schedule ID from the first available slot
        const firstAvailableSlot = availableSlots[0];
        setFormData(prev => ({
          ...prev,
          scheduleId: firstAvailableSlot.scheduleId,
          // Clear any previously selected time slot
          timeSlot: { 
            startTime: '', 
            endTime: '' 
          }
        }));
      }
    } else {
      setTimeSlots([]);
      // Clear schedule and time slot if no schedules found for this date
      setFormData(prev => ({
        ...prev,
        scheduleId: '',
        timeSlot: { 
          startTime: '', 
          endTime: '' 
        }
      }));
    }
  };

  // Add function to validate coupon
  const validateCoupon = async (code) => {
    if (!code || code.trim() === '') {
      setCouponInfo(null);
      return;
    }
    
    setValidatingCoupon(true);
    try {
      // Calculate total before discount to check against minPurchase
      const totalBeforeDiscount = priceDetails.totalBeforeDiscount;
      
      const response = await api.get(`/coupons/validate`, {
        params: {
          code: code.trim(),
          serviceId: formData.serviceId || '',
          specialtyId: formData.specialtyId || '',
          totalAmount: totalBeforeDiscount // Send total amount to validate minPurchase on backend
        }
      });
      
      if (response.data.success) {
        const coupon = response.data.data;
        
        // Check minPurchase requirement on the frontend too
        if (coupon.minPurchase && totalBeforeDiscount < coupon.minPurchase) {
          setCouponInfo(null);
          toast.error(`Mã giảm giá yêu cầu đơn hàng tối thiểu ${coupon.minPurchase.toLocaleString('vi-VN')} VNĐ`);
          return;
        }
        
        setCouponInfo(coupon);
        toast.success('Mã giảm giá hợp lệ!');
      } else {
        setCouponInfo(null);
        toast.error(response.data.message || 'Mã giảm giá không hợp lệ.');
      }
    } catch (err) {
      console.error('Error validating coupon:', err);
      setCouponInfo(null);
      
      // Show specific error message if available
      if (err.response && err.response.data && err.response.data.message) {
        toast.error(err.response.data.message);
      } else {
        toast.error('Lỗi khi kiểm tra mã giảm giá. Vui lòng thử lại sau.');
      }
    } finally {
      setValidatingCoupon(false);
    }
  };

  // Add function to manually validate coupon
  const handleValidateCoupon = () => {
    if (!formData.discountCode || formData.discountCode.trim() === '') {
      toast.error('Vui lòng nhập mã giảm giá');
      return;
    }
    
    // Check if required fields are selected
    if (!formData.hospitalId) {
      toast.error('Vui lòng chọn bệnh viện trước khi kiểm tra mã giảm giá');
      return;
    }
    
    if (!formData.specialtyId) {
      toast.error('Vui lòng chọn chuyên khoa trước khi kiểm tra mã giảm giá');
      return;
    }
    
    if (!formData.doctorId) {
      toast.error('Vui lòng chọn bác sĩ trước khi kiểm tra mã giảm giá');
      return;
    }
    
    // Make sure prices are calculated before validating coupon
    if (priceDetails.totalBeforeDiscount === 0) {
      toast.error('Vui lòng chọn dịch vụ trước khi kiểm tra mã giảm giá');
      return;
    }
    
    validateCoupon(formData.discountCode.trim());
  };

  // Handle input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    
    // Update form data
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Reset error message
    setError('');
    
    // Additional logic for specific fields
    if (name === 'hospitalId') {
      // Reset fields that depend on hospital selection
    setFormData(prev => ({
      ...prev,
        specialtyId: '',
        doctorId: '',
        serviceId: '',
        appointmentDate: '',
        scheduleId: '',
        timeSlot: { startTime: '', endTime: '' }
      }));
      
      setAvailableDates([]);
      setSchedules([]);
      setTimeSlots([]);
      
      // Fetch specialties for the selected hospital
      if (value) {
        fetchSpecialties(value);
      }
    } else if (name === 'specialtyId') {
      // Reset fields that depend on specialty selection
    setFormData(prev => ({
      ...prev,
        doctorId: '',
        serviceId: '',
        appointmentDate: '',
        scheduleId: '',
        timeSlot: { startTime: '', endTime: '' }
      }));
      
      setAvailableDates([]);
      setSchedules([]);
      setTimeSlots([]);
      
      // Fetch doctors and services for the selected specialty
      if (value) {
        fetchDoctors();
        fetchServices();
      }
    } else if (name === 'doctorId') {
      // Reset fields that depend on doctor selection
      setFormData(prev => ({ 
        ...prev, 
        appointmentDate: '',
        scheduleId: '',
        timeSlot: { startTime: '', endTime: '' },
        serviceId: ''
      }));
      
      setAvailableDates([]);
      setTimeSlots([]);
      
      // Fetch schedules for the selected doctor
      if (value) {
        fetchSchedules();
        fetchDoctorServices(value);
      }
    } else if (name === 'appointmentDate') {
      // Reset time slot when date changes
      setFormData(prev => ({ 
        ...prev, 
        timeSlot: { startTime: '', endTime: '' }
      }));
      
      // Find time slots for the selected date
      if (value) {
        findTimeSlots(value);
      }
    } else if (name === 'discountCode') {
      // We no longer automatically validate - we'll validate on button click
      if (!value.trim()) {
        setCouponInfo(null);
      }
    }
  };

  // Handle hospital change
  useEffect(() => {
    if (formData.hospitalId) {
      fetchSpecialties(formData.hospitalId);
      setFormData(prev => ({
        ...prev,
        specialtyId: '',
        doctorId: '',
        serviceId: '',
        scheduleId: '',
        appointmentDate: '',
        timeSlot: { startTime: '', endTime: '' }
      }));
    }
  }, [formData.hospitalId]);

  // Handle specialty change
  useEffect(() => {
    if (formData.specialtyId) {
      fetchDoctors();
      fetchServices();
      setFormData(prev => ({
        ...prev,
        doctorId: '',
        scheduleId: '',
        appointmentDate: '',
        timeSlot: { startTime: '', endTime: '' }
      }));
    }
  }, [formData.specialtyId]);

  // Handle doctor change
  useEffect(() => {
    if (formData.doctorId) {
      // Khi người dùng chọn bác sĩ, tìm specialtyId từ bác sĩ nếu chưa có
      const getDoctor = async () => {
        try {
          const doctorResponse = await api.get(`/doctors/doctors/${formData.doctorId}`);
          const doctorData = doctorResponse.data.data;
          
          if (doctorData && doctorData.specialtyId) {
            // Extract specialtyId from doctor data
            const specialtyId = typeof doctorData.specialtyId === 'object' ? 
              doctorData.specialtyId._id : doctorData.specialtyId;
              
            // If specialtyId from doctor is different from current selection, update it
            if (specialtyId && (!formData.specialtyId || formData.specialtyId !== specialtyId)) {
              console.log('Updating specialtyId from doctor:', specialtyId);
              setFormData(prev => ({
                ...prev,
                specialtyId: specialtyId
              }));
            }
          }
        } catch (err) {
          console.error('Error fetching doctor details:', err);
        }
      };
      
      getDoctor();
      fetchSchedules();
      setFormData(prev => ({
        ...prev,
        scheduleId: '',
        appointmentDate: '',
        timeSlot: { startTime: '', endTime: '' }
      }));
    }
  }, [formData.doctorId]);

  // Handle appointment date change
  useEffect(() => {
    if (formData.appointmentDate) {
      findTimeSlots(formData.appointmentDate);
    }
  }, [formData.appointmentDate]);

    // Add function to calculate prices
  const calculatePrices = async () => {
    if (!formData.doctorId) return;
    
    try {
      // Fetch doctor details to get consultation fee
      const doctorResponse = await api.get(`/doctors/doctors/${formData.doctorId}`);
      const doctor = doctorResponse.data.data;
      const consultationFee = doctor.consultationFee || 0;
      
      // Fetch service details if selected
      let serviceFee = 0;
      if (formData.serviceId) {
        const serviceResponse = await api.get(`/services/${formData.serviceId}`);
        const service = serviceResponse.data.data;
        serviceFee = service.price || 0;
      }
      
      const totalBeforeDiscount = consultationFee + serviceFee;
      
      // Calculate discount if coupon is valid
      let discountAmount = 0;
      if (couponInfo) {
        // Check if total meets minimum purchase requirement
        if (couponInfo.minPurchase && totalBeforeDiscount < couponInfo.minPurchase) {
          // Invalidate coupon if minimum purchase requirement not met
          setCouponInfo(null);
          toast.error(`Không thể áp dụng mã giảm giá: Yêu cầu đơn hàng tối thiểu ${couponInfo.minPurchase.toLocaleString('vi-VN')} VNĐ`);
        } else {
          // Apply discount based on type
          if (couponInfo.discountType === 'percentage') {
            discountAmount = (totalBeforeDiscount * couponInfo.discountValue) / 100;
            // Cap discount at maxDiscount if specified
            if (couponInfo.maxDiscount && discountAmount > couponInfo.maxDiscount) {
              discountAmount = couponInfo.maxDiscount;
            }
          } else { // fixed discount
            discountAmount = couponInfo.discountValue;
            // Make sure discount doesn't exceed total
            if (discountAmount > totalBeforeDiscount) {
              discountAmount = totalBeforeDiscount;
            }
          }
        }
      }
      
      const finalTotal = totalBeforeDiscount - discountAmount;
      
      setPriceDetails({
        consultationFee,
        serviceFee,
        totalBeforeDiscount,
        discountAmount,
        finalTotal
      });
    } catch (err) {
      console.error('Error calculating prices:', err);
      toast.error('Không thể tính chi phí. Vui lòng thử lại sau.');
    }
  };

  // Add useEffect to calculate prices when relevant data changes
  useEffect(() => {
    if (formData.doctorId) {
      calculatePrices();
    }
  }, [formData.doctorId, formData.serviceId, couponInfo]);

  // Handle form submission - Update for rescheduling
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!isAuthenticated) {
      // Redirect to login if not authenticated
      navigate('/login', { 
        state: { 
          from: location.pathname,
          message: 'Vui lòng đăng nhập để đặt lịch khám.' 
        } 
      });
      return;
    }
    
    // Check if user is available
    if (!user) {
      toast.error('Không thể xác định thông tin người dùng. Vui lòng đăng nhập lại.');
      return;
    }
    
    // Collect missing fields to show a more specific error message
    const missingFields = [];
    if (!formData.hospitalId) missingFields.push('Bệnh viện');
    if (!formData.doctorId) missingFields.push('Bác sĩ');
    if (!formData.specialtyId) missingFields.push('Chuyên khoa');
    if (!formData.appointmentDate) missingFields.push('Ngày khám');
    if (!formData.timeSlot?.startTime) missingFields.push('Giờ khám');
    if (!formData.scheduleId) missingFields.push('Lịch khám');
    if (!formData.paymentMethod) missingFields.push('Phương thức thanh toán');
      
    if (missingFields.length > 0) {
      const missingFieldsText = missingFields.join(', ');
      toast.error(`Vui lòng điền đầy đủ thông tin: ${missingFieldsText}`);
      return;
    }
    
    try {
      setLoading(true);
      
      // Get the correct user ID field - it could be in different properties
      const patientId = user._id || user.id;
      
      if (!patientId) {
        toast.error('Không thể xác định ID người dùng. Vui lòng đăng nhập lại.');
        setLoading(false);
        return;
      }
      
      // Create request data for API
      const requestData = {
        patientId: patientId, // Use the correctly identified patientId
        doctorId: formData.doctorId,
        hospitalId: formData.hospitalId,
        specialtyId: formData.specialtyId,
          scheduleId: formData.scheduleId,
          appointmentDate: formData.appointmentDate,
        timeSlot: formData.timeSlot,
          appointmentType: formData.appointmentType,
          symptoms: formData.symptoms,
          medicalHistory: formData.medicalHistory,
        notes: formData.notes,
        paymentMethod: formData.paymentMethod
      };
      
      // Log the user info for debugging
      console.log('Current user info:', user);
      console.log('Patient ID being used:', patientId);
      
      // Rest of the function remains the same...
      // Add coupon code if provided
      if (formData.discountCode) {
        requestData.couponCode = formData.discountCode;
      }
      
      // Add service ID if provided
      if (formData.serviceId) {
        requestData.serviceId = formData.serviceId;
      }
      
      // Add room ID if a specific room was selected
      if (formData.roomId) {
        requestData.roomId = formData.roomId;
      }
      
      console.log('Submitting appointment request:', JSON.stringify(requestData, null, 2));
      
      let response;
      
      // Handle rescheduling vs. new appointment
      if (isRescheduling && originalAppointment) {
        response = await api.put(`/appointments/${originalAppointment._id}/reschedule`, requestData);
      } else if (isEditing && originalAppointment) {
        response = await api.put(`/appointments/${originalAppointment._id}`, requestData);
      } else {
        response = await api.post('/appointments', requestData);
      }
      
      console.log('Appointment response:', response.data);
      
      if (response.data.success) {
        // Show success message
        const actionText = isRescheduling ? 'đổi lịch' : isEditing ? 'cập nhật' : 'đặt lịch';
        toast.success(`Đã ${actionText} khám thành công!`);
        
        // Handle PayPal redirect if needed
        if (formData.paymentMethod === 'paypal' && response.data.data.redirectUrl) {
          window.location.href = response.data.data.redirectUrl;
          return;
        }
        
        // Navigate to the appointments page or display confirmation
          navigate('/appointments', { 
            state: { 
            fromBooking: true,
            appointmentId: response.data.data.appointment._id,
            message: `Đã ${actionText} khám thành công!` 
          } 
        });
      } else {
        // Handle API error response
        toast.error(response.data.message || `Không thể ${isRescheduling ? 'đổi lịch' : 'đặt lịch'} khám. Vui lòng thử lại.`);
      }
    } catch (error) {
      console.error('Error creating appointment:', error);
      
      // Log detailed error information for debugging
      if (error.response) {
        console.log('Error response data:', error.response.data);
        console.log('Error response status:', error.response.status);
        console.log('Error response headers:', error.response.headers);
      
        // Show detailed error message if available
        if (error.response.data.missingFields) {
          const missingFieldsStr = Object.keys(error.response.data.missingFields)
            .filter(field => error.response.data.missingFields[field])
            .join(', ');
          
          toast.error(`Thiếu thông tin: ${missingFieldsStr}`);
        } else if (error.response.data.message) {
          toast.error(error.response.data.message);
        } else {
          toast.error(`Lỗi ${error.response.status}: Không thể đặt lịch khám.`);
        }
      } else if (error.request) {
        console.log('Error request:', error.request);
        toast.error('Không thể kết nối đến máy chủ. Vui lòng kiểm tra kết nối internet.');
      } else {
        console.log('Error details:', error.message);
        toast.error(`Lỗi không xác định: ${error.message}`);
      }
    } finally {
      setLoading(false);
    }
  };

  // Handle step navigation
  const goToNextStep = () => {
    // Only validate if not on step 3 or if on step 3 and has appointmentDate
    if ((currentStep !== 3) || (currentStep === 3 && formData.appointmentDate)) {
    if (canProceedToNextStep()) {
      setCurrentStep(prev => prev + 1);
      } else {
        // Only show error message if user has already selected a date
        if (currentStep === 3 && formData.appointmentDate && (!formData.timeSlot?.startTime || !formData.scheduleId)) {
          toast.error('Vui lòng chọn khung giờ khám');
        } else if (currentStep !== 3) {
          // Show usual validation errors for other steps
          const missingFields = [];
          if (currentStep === 1) {
            if (!formData.hospitalId) missingFields.push('Bệnh viện');
            if (!formData.specialtyId) missingFields.push('Chuyên khoa');
          } else if (currentStep === 2) {
            if (!formData.doctorId) missingFields.push('Bác sĩ');
          }
          
          if (missingFields.length > 0) {
            const missingFieldsText = missingFields.join(', ');
            toast.error(`Vui lòng điền đầy đủ thông tin: ${missingFieldsText}`);
          }
        }
      }
    } else {
      // If on step 3 and no date selected yet, just show a helpful message
      toast.info('Vui lòng chọn ngày khám');
    }
  };

  const goToPreviousStep = () => {
    setCurrentStep(prev => prev - 1);
  };

  // Format date for display
  const formatDate = (dateString) => {
    if (!dateString) return '';
    
    // Tạo đối tượng Date từ chuỗi ngày
    const date = new Date(dateString);
    
    // Điều chỉnh múi giờ bằng cách đặt giờ về giữa ngày UTC
    const utcDate = new Date(Date.UTC(
      date.getFullYear(),
      date.getMonth(),
      date.getDate(),
      12, 0, 0 // đặt giờ là 12:00:00 UTC để tránh vấn đề múi giờ
    ));
    
    // Format ngày theo định dạng Việt Nam
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    return utcDate.toLocaleDateString('vi-VN', options);
  };

  // Add the missing handleTimeSlotSelect function
  const handleTimeSlotSelect = (scheduleId, slot) => {
    // Don't allow selecting booked slots
    if (slot.isBooked) return;
    
    // Check if slot is locked by another user
    const slotKey = `${scheduleId}_${slot.startTime}`;
    if (lockedSlots.has(slotKey) && lockedSlots.get(slotKey) !== user?.id) {
      toast.warning('Khung giờ này đang được người khác xử lý, vui lòng chọn khung giờ khác.');
      return;
    }
    
    // If we had a different slot selected before, unlock it first
    if (formData.scheduleId && formData.timeSlot?.startTime && 
        (formData.scheduleId !== scheduleId || formData.timeSlot.startTime !== slot.startTime) &&
        socket) {
      socket.emit('unlock_time_slot', {
        scheduleId: formData.scheduleId,
        timeSlotId: formData.timeSlot.startTime,
        doctorId: formData.doctorId,
        date: formData.appointmentDate
      });
    }
    
    // Lock the new slot
    if (socket) {
      socket.emit('lock_time_slot', {
        scheduleId,
        timeSlotId: slot.startTime,
        doctorId: formData.doctorId,
        date: formData.appointmentDate
      });
    }
    
    setFormData(prev => ({
      ...prev,
      scheduleId: scheduleId,
      timeSlot: {
        startTime: slot.startTime,
        endTime: slot.endTime,
        _id: slot._id,
        roomId: slot.roomId
      },
      roomId: slot.roomId // Also store roomId directly in formData
    }));
    
    console.log("Selected time slot:", {
      scheduleId: scheduleId,
      startTime: slot.startTime,
      endTime: slot.endTime,
      _id: slot._id,
      roomId: slot.roomId
    });
  };

  // Find hospital, doctor, etc. by ID
  const getHospitalName = (id) => {
    const hospital = hospitals.find(h => h._id === id);
    return hospital ? hospital.name : '';
  };

  const getSpecialtyName = (id) => {
    const specialty = specialties.find(s => s._id === id);
    return specialty ? specialty.name : '';
  };

  const getDoctorName = (id) => {
    const doctor = doctors.find(d => d._id === id);
    return doctor ? doctor.user.fullName : '';
  };

  const getServiceName = (id) => {
    const service = services.find(s => s._id === id);
    return service ? service.name : '';
  };

  // Function to check if user can proceed to next step
  const canProceedToNextStep = () => {
    switch (currentStep) {
      case 1:
        return formData.hospitalId && formData.specialtyId;
      case 2:
        return formData.doctorId && formData.serviceId;
      case 3:
        return formData.appointmentDate && 
               formData.timeSlot && 
               formData.timeSlot.startTime && 
               formData.timeSlot.endTime &&
               formData.scheduleId;
      case 4:
        // Payment validation already done separately
        return true;
      default:
        return true;
    }
  };

  // Fix the goToPreviousMonth and goToNextMonth functions to prevent form submission
  const goToPreviousMonth = (e) => {
    // Prevent default to avoid form submission
    if (e) e.preventDefault();
    
    const prevMonth = new Date(currentMonth);
    prevMonth.setMonth(prevMonth.getMonth() - 1);
    setCurrentMonth(prevMonth);
    
    // Check if the currently selected date is still visible in the calendar
    if (formData.appointmentDate) {
      const selectedDate = new Date(formData.appointmentDate);
      if (selectedDate.getMonth() !== prevMonth.getMonth() || 
          selectedDate.getFullYear() !== prevMonth.getFullYear()) {
        // Clear the selected date and time if it's not in the current view
        setFormData(prev => ({
          ...prev,
          appointmentDate: '',
          timeSlot: { startTime: '', endTime: '' },
          scheduleId: ''
        }));
      }
    }
  };

  const goToNextMonth = (e) => {
    // Prevent default to avoid form submission
    if (e) e.preventDefault();
    
    const nextMonth = new Date(currentMonth);
    nextMonth.setMonth(nextMonth.getMonth() + 1);
    setCurrentMonth(nextMonth);
    
    // Check if the currently selected date is still visible in the calendar
    if (formData.appointmentDate) {
      const selectedDate = new Date(formData.appointmentDate);
      if (selectedDate.getMonth() !== nextMonth.getMonth() || 
          selectedDate.getFullYear() !== nextMonth.getFullYear()) {
        // Clear the selected date and time if it's not in the current view
        setFormData(prev => ({
          ...prev,
          appointmentDate: '',
          timeSlot: { startTime: '', endTime: '' },
          scheduleId: ''
        }));
      }
    }
  };

  // Add a function to generate calendar dates including empty spots for a proper grid
  const generateCalendarDays = () => {
    if (!availableDates.length) return [];
    
    // First day of the month
    const firstDay = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);
    // Last day of the month
    const lastDay = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0);
    
    // Get the day of the week for the first day (0 is Sunday, 1 is Monday, etc.)
    // Convert to Monday-based (0 is Monday, 6 is Sunday)
    let firstDayOfWeek = firstDay.getDay() - 1;
    if (firstDayOfWeek < 0) firstDayOfWeek = 6; // Handle Sunday
    
    // Calculate days from previous month to show
    const daysFromPrevMonth = firstDayOfWeek;
    
    // Total days in the month
    const totalDaysInMonth = lastDay.getDate();
    
    // Calculate total grid spaces needed (6 rows x 7 columns max)
    const totalDaysToShow = 42;
    
    // Days from next month to show
    const daysFromNextMonth = totalDaysToShow - daysFromPrevMonth - totalDaysInMonth;
    
    // Generate the calendar days
    const days = [];
    
    // Add days from previous month (as empty placeholders)
    const prevMonthLastDay = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 0).getDate();
    for (let i = 0; i < daysFromPrevMonth; i++) {
      // Create date with noon UTC timestamp to prevent day shifting
      const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, prevMonthLastDay - daysFromPrevMonth + i + 1);
      const utcDate = new Date(Date.UTC(
        date.getFullYear(),
        date.getMonth(),
        date.getDate(),
        12, 0, 0
      ));
      
      const dateString = utcDate.toISOString().split('T')[0];
      
      days.push({
        date: utcDate,
        dateString,
        isCurrentMonth: false,
        isEmpty: true
      });
    }
    
    // Add days from current month
    for (let i = 1; i <= totalDaysInMonth; i++) {
      // Create date with noon UTC timestamp to prevent day shifting
      const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), i);
      const utcDate = new Date(Date.UTC(
        date.getFullYear(),
        date.getMonth(),
        date.getDate(),
        12, 0, 0
      ));
      
      const dateString = utcDate.toISOString().split('T')[0];
      
      // Check if this date is in availableDates
      const isAvailable = availableDates.includes(dateString);
      
      days.push({
        date: utcDate,
        dateString,
        isCurrentMonth: true,
        isAvailable
      });
    }
    
    // Add days from next month (as empty placeholders)
    for (let i = 1; i <= daysFromNextMonth; i++) {
      // Create date with noon UTC timestamp to prevent day shifting
      const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, i);
      const utcDate = new Date(Date.UTC(
        date.getFullYear(),
        date.getMonth(),
        date.getDate(),
        12, 0, 0
      ));
      
      const dateString = utcDate.toISOString().split('T')[0];
      
      days.push({
        date: utcDate,
        dateString,
        isCurrentMonth: false,
        isEmpty: true
      });
    }
    
    return days;
  };

  // Set the current month to match the first available date when it changes
  useEffect(() => {
    if (availableDates.length > 0) {
      const firstAvailableDate = new Date(availableDates[0]);
      setCurrentMonth(new Date(firstAvailableDate.getFullYear(), firstAvailableDate.getMonth(), 1));
    }
  }, [availableDates]);

  // Add a message to indicate days with available slots
  const renderCalendarLegend = () => {
    return (
      <div className="calendar-legend">
        <div className="legend-item">
          <span className="legend-dot available"></span>
          <span className="legend-text">Ngày bác sĩ có lịch khám</span>
        </div>
      </div>
    );
  };

  // Fetch doctor specific services
  const fetchDoctorServices = async (doctorId) => {
    if (!doctorId) return;
    
    setLoading(true);
    try {
      const response = await api.get(`/doctors/${doctorId}/services`);
      
      let servicesData = [];
      if (response.data) {
        if (Array.isArray(response.data.data)) {
          servicesData = response.data.data;
        } else if (response.data.data && response.data.data.services) {
          servicesData = response.data.data.services;
        }
      }
      
      setDoctorServices(servicesData);
      
      // Clear any previously selected service since we're showing doctor-specific services now
      setFormData(prev => ({
        ...prev,
        serviceId: ''
      }));
    } catch (err) {
      console.error('Error fetching doctor services:', err);
      setError('Không thể tải danh sách dịch vụ của bác sĩ. Vui lòng thử lại sau.');
    } finally {
      setLoading(false);
    }
  };

  // Functions to navigate the doctor carousel
  const goToPreviousDoctor = () => {
    if (currentDoctorIndex > 0) {
      setCurrentDoctorIndex(currentDoctorIndex - 1);
    }
  };

  const goToNextDoctor = () => {
    if (doctors.length > 0 && currentDoctorIndex < doctors.length - 1) {
      setCurrentDoctorIndex(currentDoctorIndex + 1);
    }
  };

  // Handle doctor selection from the carousel
  const handleDoctorSelect = (doctor) => {
    setFormData(prev => ({ 
      ...prev, 
      doctorId: doctor._id,
      appointmentDate: '',
      scheduleId: '',
      timeSlot: { startTime: '', endTime: '' },
      serviceId: ''
    }));

    // Find and set the current doctor index
    const doctorIndex = doctors.findIndex(doc => doc._id === doctor._id);
    if (doctorIndex >= 0) {
      setCurrentDoctorIndex(doctorIndex);
    }

    // Fetch schedules for this doctor
    fetchSchedules();
    fetchDoctorServices(doctor._id);
  };

  // Initialize socket connection
  useEffect(() => {
    if (isAuthenticated && user) {
      const apiBaseUrl = import.meta.env?.VITE_API_URL || 'http://localhost:5000/api';
      // Extract base server URL (without /api)
      const socketUrl = apiBaseUrl.replace(/\/api$/, '');

      console.log("Connecting to socket server at:", socketUrl);

      // Get JWT token from localStorage
      const userInfo = JSON.parse(localStorage.getItem('userInfo')) || {};
      const token = userInfo.token;

      // Create socket instance with improved configuration
      const socketInstance = io(socketUrl, {
        auth: {
          token: token
        },
        reconnectionAttempts: 5,
        reconnectionDelay: 1000, // Increase timeout
        // Start with polling first, then upgrade to websocket if possible
        transports: ['polling', 'websocket'],
        path: '/socket.io',
        forceNew: true,
        autoConnect: true
      });

      socketInstance.on('connect', () => {
        console.log('Socket connected successfully');
      });

      socketInstance.on('connect_error', (error) => {
        console.error('Socket connection error:', error.message);
        toast.error('Không thể kết nối tới máy chủ cho tính năng cập nhật thời gian thực. Vui lòng thử lại sau.');
      });

      // Set up event listeners for time slot locking (keep the rest of the code as it is)
      socketInstance.on('time_slot_locked', ({ scheduleId, timeSlotId, userId }) => {
        console.log(`Time slot locked: ${scheduleId}_${timeSlotId} by ${userId}`);
        setLockedSlots(prev => {
          const newMap = new Map(prev);
          newMap.set(`${scheduleId}_${timeSlotId}`, userId);
          return newMap;
        });

        // Hiển thị thông báo khi có người khác vừa chọn khung giờ (chỉ khi người dùng đang xem khung giờ này)
        if (formData.scheduleId === scheduleId && userId !== user?.id) {
          toast.info('Có người vừa chọn một khung giờ. Khung giờ này sẽ bị khóa tạm thời.', {
            autoClose: 3000,
          });
        }
        
        // Nếu đây là khung giờ mà người dùng đang chọn, thông báo rằng nó vừa bị người khác chọn
        if (formData.scheduleId === scheduleId && 
            formData.timeSlot.startTime === timeSlotId && 
            userId !== user?.id) {
          toast.warning('Khung giờ bạn đang chọn vừa được người khác chọn. Vui lòng chọn khung giờ khác.', {
            autoClose: 5000,
          });
          
          // Reset the time slot selection
          setFormData(prev => ({
            ...prev,
            timeSlot: { startTime: '', endTime: '' }
          }));
        }
      });

      socketInstance.on('time_slot_unlocked', ({ scheduleId, timeSlotId }) => {
        console.log(`Time slot unlocked: ${scheduleId}_${timeSlotId}`);
        setLockedSlots(prev => {
          const newMap = new Map(prev);
          newMap.delete(`${scheduleId}_${timeSlotId}`);
          return newMap;
        });
        
        // Thông báo khi khung giờ được mở khóa (có thể có người vừa hủy đặt lịch)
        if (formData.scheduleId === scheduleId) {
          toast.info('Một khung giờ vừa được mở khóa và có thể đặt lịch.', {
            autoClose: 3000,
          });
        }
      });

      // Listen for time slot booking status changes
      socketInstance.on('time_slot_status_changed', ({ scheduleId, timeSlotInfo, updateType }) => {
        console.log(`Time slot booking status changed: ${scheduleId}, slot: ${timeSlotInfo.startTime}`, timeSlotInfo);
        
        // Update the time slots with the new booking information
        setTimeSlots(prev => {
          return prev.map(slot => {
            // If this is the slot that was updated
            if (slot.scheduleId === scheduleId && slot.startTime === timeSlotInfo.startTime) {
              // Return updated slot with new booking information
              return {
                ...slot,
                isBooked: timeSlotInfo.isBooked,
                bookedCount: timeSlotInfo.bookedCount,
                maxBookings: timeSlotInfo.maxBookings
              };
            }
            return slot;
          });
        });
        
        // Show toast notification about the change
        if (formData.scheduleId === scheduleId) {
          if (updateType === 'booking_changed') {
            if (timeSlotInfo.isBooked) {
              toast.info(`Khung giờ ${timeSlotInfo.startTime}-${timeSlotInfo.endTime} vừa được đặt kín.`, {
                autoClose: 3000,
              });
            } else if (timeSlotInfo.bookedCount > 0) {
              toast.info(`Khung giờ ${timeSlotInfo.startTime}-${timeSlotInfo.endTime} còn ${timeSlotInfo.maxBookings - timeSlotInfo.bookedCount}/${timeSlotInfo.maxBookings} chỗ trống.`, {
                autoClose: 3000,
              });
            }
          }
        }
      });

      socketInstance.on('time_slot_lock_confirmed', ({ scheduleId, timeSlotId }) => {
        console.log(`Your lock was confirmed for: ${scheduleId}_${timeSlotId}`);
      });

      socketInstance.on('time_slot_lock_rejected', ({ message, scheduleId, timeSlotId }) => {
        console.warn(`Lock rejected: ${message}`);
        toast.warning('Khung giờ này đang được người khác xử lý, vui lòng chọn khung giờ khác.');

        // Reset the time slot selection if our selection was rejected
        if (formData.scheduleId === scheduleId && 
            formData.timeSlot?.startTime === timeSlotId) {
          setFormData(prev => ({
            ...prev,
            timeSlot: { startTime: '', endTime: '' }
          }));
        }
      });

      socketInstance.on('current_locked_slots', ({ lockedSlots: currentLockedSlots }) => {
        console.log('Current locked slots:', currentLockedSlots);
        const locksMap = new Map();
        currentLockedSlots.forEach(({ scheduleId, timeSlotId, userId }) => {
          locksMap.set(`${scheduleId}_${timeSlotId}`, userId);
        });
        setLockedSlots(locksMap);
      });

      setSocket(socketInstance);

      // Clean up function
      return () => {
        // Unlock any time slot this user has locked before disconnecting
        if (formData.scheduleId && formData.timeSlot?.startTime && formData.timeSlot?.endTime && formData.doctorId) {
          socketInstance.emit('unlock_time_slot', {
            scheduleId: formData.scheduleId,
            timeSlotId: formData.timeSlot.startTime,
            doctorId: formData.doctorId,
            date: formData.appointmentDate
          });
        }
        
        socketInstance.disconnect();
      };
    }
  }, [isAuthenticated, user]);

  // Join doctor-specific appointment room when doctor is selected and date is available
  useEffect(() => {
    if (socket && formData.doctorId && formData.appointmentDate) {
      const date = new Date(formData.appointmentDate).toISOString().split('T')[0];
      socket.emit('join_appointment_room', {
        doctorId: formData.doctorId,
        date
      });
    }
  }, [socket, formData.doctorId, formData.appointmentDate]);

  if (loading && currentStep === 1) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white flex items-center justify-center p-4">
        <div className="bg-white rounded-xl shadow-xl p-8 text-center max-w-md mx-auto">
          <div className="w-16 h-16 border-4 border-t-blue-500 border-blue-200 rounded-full animate-spin mx-auto mb-6"></div>
          <p className="text-gray-600 text-lg">Đang tải thông tin...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white py-10 px-4 sm:px-6 lg:px-8 relative">
      {/* Add subtle pattern overlay */}
      <div className="absolute inset-0 z-0 pattern-dots pattern-blue-500 pattern-bg-white pattern-size-2 pattern-opacity-5 pointer-events-none"></div>
      
      {/* Add decorative elements */}
      <div className="absolute top-0 left-0 w-32 h-32 bg-blue-500 rounded-br-full opacity-10 -translate-x-1/2 -translate-y-1/2"></div>
      <div className="absolute bottom-0 right-0 w-64 h-64 bg-green-500 rounded-tl-full opacity-5"></div>
      
      <div className="relative z-10 max-w-4xl mx-auto">
        {/* Remove local ToastContainer as we'll use the global one from App.jsx */}
        <div className="text-center mb-10">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            {isRescheduling ? 'Đổi lịch hẹn' : 
             isEditing ? 'Chỉnh sửa lịch hẹn' : 
             'Đặt lịch khám'}
          </h1>
          <p className="text-lg text-gray-600">
            {isRescheduling ? 'Chọn ngày và giờ mới cho lịch hẹn của bạn' : 
             isEditing ? 'Cập nhật thông tin cho lịch hẹn của bạn' : 
             'Đặt lịch khám nhanh chóng và dễ dàng'}
          </p>
        </div>

        {/* Show original appointment details when rescheduling */}
        {isRescheduling && originalAppointment && (
          <div className="mb-8 bg-blue-50 rounded-xl p-6 border border-blue-100 shadow-sm">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Thông tin lịch hẹn hiện tại</h2>
            <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-100">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-3">
                <div className="flex flex-col">
                  <span className="text-sm text-gray-500 font-medium">Bác sĩ</span>
                  <span className="text-gray-800">{originalAppointment.doctorName}</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-sm text-gray-500 font-medium">Bệnh viện</span>
                  <span className="text-gray-800">{originalAppointment.hospitalName}</span>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-3">
                <div className="flex flex-col">
                  <span className="text-sm text-gray-500 font-medium">Chuyên khoa</span>
                  <span className="text-gray-800">{originalAppointment.specialtyName}</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-sm text-gray-500 font-medium">Dịch vụ</span>
                  <span className="text-gray-800">{originalAppointment.serviceName || 'Khám tư vấn'}</span>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex flex-col">
                  <span className="text-sm text-gray-500 font-medium">Ngày giờ hiện tại</span>
                  <span className="text-gray-800">
                    {formatDate(originalAppointment.appointmentDate)}, {originalAppointment.timeSlot.startTime} - {originalAppointment.timeSlot.endTime}
                  </span>
                </div>
                <div className="flex flex-col">
                  <span className="text-sm text-gray-500 font-medium">Phòng</span>
                  <span className="text-gray-800">{originalAppointment.roomInfo || 'Chưa phân phòng'}</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {error && (
          <div className="mb-6 bg-red-50 border-l-4 border-red-500 p-4 rounded-md flex items-start">
            <FaExclamationTriangle className="text-red-500 mt-1 mr-3 flex-shrink-0" />
            <div className="flex-1">
              <p className="text-red-800 font-medium">Lỗi: {error}</p>
            </div>
            <button 
              onClick={() => setError(null)} 
              className="text-gray-500 hover:text-gray-700"
            >
              &times;
            </button>
          </div>
        )}

        <div className="relative mb-10">
          <div className="overflow-hidden mb-2 flex">
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-gradient-to-r from-blue-500 to-blue-600 h-2 rounded-full transition-all duration-500 shadow-sm" 
                style={{ width: `${(currentStep / 5) * 100}%` }}
              ></div>
            </div>
          </div>
          <div className="flex justify-between relative">
            <div className={`flex flex-col items-center ${currentStep >= 1 ? 'text-blue-600' : 'text-gray-400'}`}>
              <div className={`w-12 h-12 rounded-full flex items-center justify-center mb-2 transition-all duration-300 shadow-md ${
                currentStep >= 1 ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white transform scale-110' : 'bg-white border border-gray-200 text-gray-500'
              }`}>
                <FaHospital className="text-lg" />
              </div>
              <span className="text-xs font-medium">Bệnh viện</span>
            </div>
            <div className={`flex flex-col items-center ${currentStep >= 2 ? 'text-blue-600' : 'text-gray-400'}`}>
              <div className={`w-12 h-12 rounded-full flex items-center justify-center mb-2 transition-all duration-300 shadow-md ${
                currentStep >= 2 ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white transform scale-110' : 'bg-white border border-gray-200 text-gray-500'
              }`}>
                <FaUserMd className="text-lg" />
              </div>
              <span className="text-xs font-medium">Bác sĩ</span>
            </div>
            <div className={`flex flex-col items-center ${currentStep >= 3 ? 'text-blue-600' : 'text-gray-400'}`}>
              <div className={`w-12 h-12 rounded-full flex items-center justify-center mb-2 transition-all duration-300 shadow-md ${
                currentStep >= 3 ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white transform scale-110' : 'bg-white border border-gray-200 text-gray-500'
              }`}>
                <FaCalendarAlt className="text-lg" />
              </div>
              <span className="text-xs font-medium">Lịch khám</span>
            </div>
            <div className={`flex flex-col items-center ${currentStep >= 4 ? 'text-blue-600' : 'text-gray-400'}`}>
              <div className={`w-12 h-12 rounded-full flex items-center justify-center mb-2 transition-all duration-300 shadow-md ${
                currentStep >= 4 ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white transform scale-110' : 'bg-white border border-gray-200 text-gray-500'
              }`}>
                <FaCreditCard className="text-lg" />
              </div>
              <span className="text-xs font-medium">Thanh toán</span>
            </div>
            <div className={`flex flex-col items-center ${currentStep >= 5 ? 'text-blue-600' : 'text-gray-400'}`}>
              <div className={`w-12 h-12 rounded-full flex items-center justify-center mb-2 transition-all duration-300 shadow-md ${
                currentStep >= 5 ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white transform scale-110' : 'bg-white border border-gray-200 text-gray-500'
              }`}>
                <FaClipboardList className="text-lg" />
              </div>
              <span className="text-xs font-medium">Xác nhận</span>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="bg-white shadow-xl rounded-xl overflow-hidden border border-blue-50 backdrop-blur-sm bg-white/90">
          {/* Step 1: Select Hospital and Specialty */}
          {currentStep === 1 && (
            <div className="p-6 md:p-8">
              <h2 className="text-xl font-semibold text-gray-800 mb-6 pb-3 border-b border-gray-100 flex items-center">
                <span className="w-1.5 h-6 bg-gradient-to-b from-blue-500 to-blue-600 rounded-full mr-3 inline-block"></span>
                Chọn bệnh viện và chuyên khoa
              </h2>
              
              <div className="mb-6">
                <label htmlFor="hospitalId" className="block text-sm font-medium text-gray-700 mb-2">
                  Bệnh viện
                </label>
                <div className="relative">
                  <select 
                    id="hospitalId" 
                    name="hospitalId" 
                    value={formData.hospitalId} 
                    onChange={handleInputChange}
                    required
                    className="block w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 py-3 px-4 bg-white appearance-none"
                  >
                    <option value="">-- Chọn bệnh viện --</option>
                    {Array.isArray(hospitals) && hospitals.map(hospital => (
                      <option key={hospital._id} value={hospital._id}>
                        {hospital.name}
                      </option>
                    ))}
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
                    <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                      <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" />
                    </svg>
                  </div>
                </div>
              </div>

              {formData.hospitalId && (
                <div className="mb-6">
                  <label htmlFor="specialtyId" className="block text-sm font-medium text-gray-700 mb-2">
                    Chuyên khoa
                  </label>
                  <div className="relative">
                    <select 
                      id="specialtyId" 
                      name="specialtyId" 
                      value={formData.specialtyId} 
                      onChange={handleInputChange}
                      required
                      className="block w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 py-3 px-4 bg-white appearance-none"
                    >
                      <option value="">-- Chọn chuyên khoa --</option>
                      {Array.isArray(specialties) && specialties.map(specialty => (
                        <option key={specialty._id} value={specialty._id}>
                          {specialty.name}
                        </option>
                      ))}
                    </select>
                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
                      <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                        <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" />
                      </svg>
                    </div>
                  </div>
                </div>
              )}
              
              <div className="flex justify-end pt-4">
                <button 
                  type="button" 
                  className={`flex items-center px-6 py-3 rounded-lg text-white font-medium transition-all ${
                    canProceedToNextStep() 
                      ? 'bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 shadow-md hover:shadow-lg transform hover:-translate-y-0.5' 
                      : 'bg-gray-400 cursor-not-allowed'
                  }`}
                  onClick={goToNextStep}
                  disabled={!canProceedToNextStep()}
                >
                  <span>Tiếp theo</span>
                  <FaAngleRight className="ml-2" />
                </button>
              </div>
            </div>
          )}

          {/* Step 2: Select Doctor and Service */}
          {currentStep === 2 && (
            <div className="p-6 md:p-8">
              <h2 className="text-xl font-semibold text-gray-800 mb-6 pb-3 border-b border-gray-100 flex items-center">
                <span className="w-1.5 h-6 bg-gradient-to-b from-blue-500 to-blue-600 rounded-full mr-3 inline-block"></span>
                Chọn bác sĩ và dịch vụ
              </h2>
              
              <div className="mb-8">
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Bác sĩ
                </label>
                
                {Array.isArray(doctors) && doctors.length > 0 ? (
                  <div className="relative flex items-center">
                    <button 
                      type="button"
                      className="absolute left-0 -ml-4 z-10 w-10 h-10 flex items-center justify-center rounded-full bg-white shadow-md border border-gray-200 text-gray-600 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all transform hover:-translate-y-0.5"
                      onClick={goToPreviousDoctor}
                      disabled={currentDoctorIndex === 0}
                    >
                      <FaAngleLeft />
                    </button>
                    
                    <div className="w-full px-2">
                      {doctors.length > 0 && (
                        <div 
                          className={`bg-white rounded-xl shadow-md overflow-hidden border-2 transition-all hover:shadow-lg cursor-pointer ${
                            formData.doctorId === doctors[currentDoctorIndex]._id 
                              ? 'border-blue-500' 
                              : 'border-gray-200 hover:border-blue-300'
                          }`}
                          onClick={() => handleDoctorSelect(doctors[currentDoctorIndex])}
                        >
                          <div className="md:flex">
                            <div className="md:flex-shrink-0">
                              <img 
                                className="h-48 w-full object-cover md:h-full md:w-48"
                                src={doctors[currentDoctorIndex].user?.avatarUrl || '/avatars/default-avatar.png'} 
                                alt={doctors[currentDoctorIndex].user?.fullName || 'Doctor'}
                                onError={(e) => {
                                  e.target.src = '/avatars/default-avatar.png';
                                }}
                              />
                            </div>
                            <div className="p-6">
                              <h3 className="text-xl font-bold text-gray-900 mb-2">
                                {doctors[currentDoctorIndex].user?.fullName || 'Bác sĩ'}
                              </h3>
                              <p className="text-sm text-blue-600 font-medium mb-2">
                                {getSpecialtyName(doctors[currentDoctorIndex].specialtyId)}
                              </p>
                              {doctors[currentDoctorIndex].ratings && doctors[currentDoctorIndex].ratings.average ? (
                                <p className="flex items-center text-yellow-500 mb-2">
                                  <FaStar className="mr-1" />
                                  <span>{doctors[currentDoctorIndex].ratings.average.toFixed(1)}</span>
                                </p>
                              ) : doctors[currentDoctorIndex].averageRating ? (
                                <p className="flex items-center text-yellow-500 mb-2">
                                  <FaStar className="mr-1" />
                                  <span>{doctors[currentDoctorIndex].averageRating.toFixed(1)}</span>
                                </p>
                              ) : null}
                              {doctors[currentDoctorIndex].experience && (
                                <p className="text-gray-600">
                                  {doctors[currentDoctorIndex].experience} năm kinh nghiệm
                                </p>
                              )}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                    
                    <button 
                      type="button"
                      className="absolute right-0 -mr-4 z-10 w-10 h-10 flex items-center justify-center rounded-full bg-white shadow-md border border-gray-200 text-gray-600 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all transform hover:-translate-y-0.5"
                      onClick={goToNextDoctor}
                      disabled={currentDoctorIndex === doctors.length - 1}
                    >
                      <FaAngleRight />
                    </button>
                  </div>
                ) : (
                  <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded-md">
                    <div className="flex">
                      <div className="flex-shrink-0">
                        <FaInfoCircle className="text-yellow-500" />
                      </div>
                      <div className="ml-3">
                        <p className="text-yellow-700">
                          Không có bác sĩ nào cho chuyên khoa này. Vui lòng chọn chuyên khoa khác.
                        </p>
                      </div>
                    </div>
                  </div>
                )}
                
                {doctors.length > 0 && (
                  <div className="text-center mt-3 text-sm text-gray-600">
                    Bác sĩ {currentDoctorIndex + 1} / {doctors.length}
                  </div>
                )}
              </div>

              {formData.doctorId && (
                <div className="mb-6">
                  <label htmlFor="serviceId" className="block text-sm font-medium text-gray-700 mb-2">
                    Dịch vụ
                  </label>
                  <div className="relative">
                    <select 
                      id="serviceId" 
                      name="serviceId" 
                      value={formData.serviceId} 
                      onChange={handleInputChange}
                      className="block w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 py-3 px-4 bg-white appearance-none"
                    >
                      <option value="">-- Chọn dịch vụ --</option>
                      {Array.isArray(doctorServices) && doctorServices.length > 0 ? (
                        doctorServices.map(service => (
                          <option key={service._id} value={service._id}>
                            {service.name} - {service.price?.toLocaleString('vi-VN') || '0'} VNĐ
                          </option>
                        ))
                      ) : (
                        <option value="" disabled>Bác sĩ này không có dịch vụ nào</option>
                      )}
                    </select>
                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
                      <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                        <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" />
                      </svg>
                    </div>
                  </div>
                </div>
              )}
              
              <div className="flex justify-between pt-4">
                <button 
                  type="button" 
                  className="flex items-center px-6 py-3 rounded-lg border border-gray-200 text-gray-700 bg-white hover:bg-gray-50 font-medium transition-all shadow-sm hover:shadow transform hover:-translate-y-0.5"
                  onClick={goToPreviousStep}
                >
                  <FaAngleLeft className="mr-2" />
                  <span>Quay lại</span>
                </button>
                <button 
                  type="button" 
                  className={`flex items-center px-6 py-3 rounded-lg text-white font-medium transition-all ${
                    canProceedToNextStep() 
                      ? 'bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 hover:text-white shadow-md hover:shadow-lg transform hover:-translate-y-0.5' 
                      : 'bg-gray-400 cursor-not-allowed'
                  }`}
                  onClick={goToNextStep}
                  disabled={!canProceedToNextStep()}
                >
                  <span>Tiếp theo</span>
                  <FaAngleRight className="ml-2" />
                </button>
              </div>
            </div>
          )}

          {/* Step 3: Select Date and Time */}
          {currentStep === 3 && (
            <div className="p-6 md:p-8">
              <h2 className="text-xl font-semibold text-gray-800 mb-6 pb-3 border-b border-gray-100 flex items-center">
                <span className="w-1.5 h-6 bg-gradient-to-b from-blue-500 to-blue-600 rounded-full mr-3 inline-block"></span>
                Chọn ngày và giờ khám
              </h2>
              
              <div className="mb-8">
                <label htmlFor="appointmentDate" className="flex items-center text-sm font-medium text-gray-700 mb-3">
                  <FaCalendarAlt className="mr-2 text-blue-500" />
                  Ngày khám
                </label>
                
                {loading ? (
                  <div className="flex flex-col items-center justify-center h-48 bg-gray-50 rounded-lg border border-gray-200">
                    <div className="w-10 h-10 border-4 border-t-blue-500 border-blue-200 rounded-full animate-spin mb-3"></div>
                    <p className="text-gray-600">Đang tải lịch khám...</p>
                  </div>
                ) : (
                  <div className="bg-white/90 rounded-lg shadow-md border border-blue-100 max-w-md mx-auto backdrop-blur-sm hover:shadow-lg transition-all">
                    <div className="p-3 flex items-center justify-between border-b border-gray-100">
                      <button 
                        type="button" 
                        className="p-1 hover:bg-gray-100 rounded-full transition-colors"
                        onClick={goToPreviousMonth}
                      >
                        <FaAngleLeft className="text-gray-600" />
                      </button>
                      <h3 className="text-sm font-medium text-gray-800">
                        Tháng {currentMonth.getMonth() + 1} / {currentMonth.getFullYear()}
                      </h3>
                      <button 
                        type="button" 
                        className="p-1 hover:bg-gray-100 rounded-full transition-colors"
                        onClick={goToNextMonth}
                      >
                        <FaAngleRight className="text-gray-600" />
                      </button>
                    </div>

                    <div className="px-2 py-1 bg-gray-50 flex items-center text-xs text-gray-600">
                      <span className="inline-block w-2 h-2 rounded-full bg-blue-500 mr-1"></span>
                      <span>Ngày bác sĩ có lịch khám</span>
                    </div>
                    
                    <div className="grid grid-cols-7 gap-1 text-center py-1 bg-gray-50 text-xs">
                      {['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'].map(day => (
                        <div key={day} className="text-xs font-medium text-gray-500 py-1">
                          {day}
                        </div>
                      ))}
                    </div>
                    
                    {availableDates.length > 0 ? (
                      <div className="grid grid-cols-7 gap-0.5 p-1.5">
                        {generateCalendarDays().map((day, index) => {
                          if (day.isEmpty) {
                            return <div key={`empty-${day.dateString || index}`} className="aspect-square w-8 h-8 sm:w-9 sm:h-9"></div>;
                          }
                          
                          const today = new Date();
                          today.setHours(0, 0, 0, 0);
                          
                          // Check if this is today
                          const isToday = day.date.getTime() === today.getTime();
                          
                          // Check if this day is selected
                          const isSelected = formData.appointmentDate === day.dateString;
                          
                          return (
                            <div 
                              key={day.dateString}
                              className={`w-8 h-8 sm:w-9 sm:h-9 flex items-center justify-center rounded-full text-xs font-medium
                                ${!day.isCurrentMonth ? 'text-gray-300' : 'text-gray-800'}
                                ${isToday ? 'ring-1 ring-gray-300' : ''}
                                ${isSelected ? 'bg-blue-600 text-white' : ''}
                                ${day.isAvailable && !isSelected ? 'bg-blue-50 text-blue-800 cursor-pointer hover:bg-blue-100' : ''}
                                ${!day.isAvailable || !day.isCurrentMonth ? 'cursor-default' : 'cursor-pointer'}
                              `}
                              onClick={() => day.isCurrentMonth && day.isAvailable && setFormData(prev => ({ ...prev, appointmentDate: day.dateString }))}
                              title={day.isAvailable ? 'Có lịch khám' : 'Không có lịch khám'}
                            >
                              {day.date.getDate()}
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="p-4 text-center">
                        <p className="text-gray-500 text-xs">
                          Không có lịch khám nào cho bác sĩ này. Vui lòng chọn bác sĩ khác.
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {formData.appointmentDate && (
                <div className="mb-6">
                  <label htmlFor="timeSlot" className="flex items-center text-sm font-medium text-gray-700 mb-3">
                    <FaClock className="mr-2 text-blue-500" />
                    Giờ khám
                  </label>
                  
                  {loading ? (
                    <div className="flex flex-col items-center justify-center h-24 bg-gray-50 rounded-lg border border-gray-200">
                      <div className="w-6 h-6 border-3 border-t-blue-500 border-blue-200 rounded-full animate-spin mb-2"></div>
                      <p className="text-gray-600 text-xs">Đang tải khung giờ khám...</p>
                    </div>
                  ) : timeSlots.length > 0 ? (
                    <>
                      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2">
                        {timeSlots.map((slot, index) => {
                          const slotKey = `${formData.scheduleId}_${slot.startTime}`;
                          const isLockedByOther = lockedSlots.has(slotKey) && lockedSlots.get(slotKey) !== user?.id;
                          const isLockedByMe = lockedSlots.has(slotKey) && lockedSlots.get(slotKey) === user?.id;
                          
                          return (
                            <div 
                              key={`timeslot-${slot._id || index}`}
                              className={`
                                rounded-lg border p-2 text-center cursor-pointer transition-all relative
                                ${slot.isBooked 
                                  ? 'bg-gray-100 border-gray-200 text-gray-400 cursor-not-allowed' 
                                  : isLockedByOther
                                    ? 'bg-yellow-50 border-yellow-300 text-yellow-700 cursor-not-allowed animate-pulse'
                                    : formData.timeSlot.startTime === slot.startTime
                                      ? 'bg-blue-50 border-blue-500 text-blue-700 shadow-sm'
                                      : 'bg-white border-gray-200 hover:border-blue-300 hover:bg-blue-50 text-gray-700'
                                }
                              `}
                              onClick={() => !slot.isBooked && !isLockedByOther && handleTimeSlotSelect(formData.scheduleId, slot)}
                            >
                              <div className="text-xs font-medium">{slot.startTime} - {slot.endTime}</div>
                              <div className={`text-xs ${
                                slot.isBooked 
                                  ? 'text-red-400' 
                                  : isLockedByOther 
                                    ? 'text-yellow-600 font-semibold' 
                                    : 'text-green-500'
                              }`}>
                                {slot.isBooked 
                                  ? 'Đã đầy' 
                                  : isLockedByOther 
                                    ? 'Đang có người chọn' 
                                    : slot.bookedCount > 0
                                      ? `Còn ${slot.maxBookings - slot.bookedCount}/${slot.maxBookings}`
                                      : 'Còn trống'}
                              </div>
                              
                              {(isLockedByOther || isLockedByMe) && (
                                <div className="absolute top-1 right-1 text-xs">
                                  <FaLock className={isLockedByOther ? 'text-yellow-500' : 'text-blue-500'} />
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                      
                      {/* Thêm chú thích trạng thái khung giờ */}
                      <div className="mt-4 bg-blue-50 rounded-lg p-3 text-sm text-blue-700 flex items-start">
                        <FaInfoCircle className="text-blue-500 mt-0.5 mr-2 flex-shrink-0" />
                        <div>
                          <p className="font-medium mb-1">Chú thích trạng thái khung giờ:</p>
                          <ul className="list-disc pl-5 space-y-1">
                            <li><span className="inline-block w-3 h-3 bg-green-500 rounded-full mr-1"></span> <span className="font-medium">Còn trống:</span> Khung giờ có thể đặt lịch</li> 
                            <li><span className="inline-block w-3 h-3 bg-yellow-500 rounded-full mr-1"></span> <span className="font-medium">Đang có người chọn:</span> Khung giờ đang được người khác xử lý (tự động mở khóa sau 5 phút)</li>
                            <li><span className="inline-block w-3 h-3 bg-red-400 rounded-full mr-1"></span> <span className="font-medium">Đã đầy:</span> Khung giờ đã đạt giới hạn tối đa (3 lịch hẹn)</li>
                            <li><span className="inline-block w-3 h-3 bg-blue-400 rounded-full mr-1"></span> <span className="font-medium">Còn X/3:</span> Khung giờ đã có người đặt nhưng vẫn còn chỗ trống</li>
                          </ul>
                        </div>
                      </div>
                    </>
                  ) : (
                    <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded-md">
                      <div className="flex">
                        <div className="flex-shrink-0">
                          <FaInfoCircle className="text-yellow-500" />
                        </div>
                        <div className="ml-3">
                          <p className="text-yellow-700">
                            Không có khung giờ khám nào cho ngày này. Vui lòng chọn ngày khác.
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
              
              <div className="flex justify-between pt-4">
                <button 
                  type="button" 
                  className="flex items-center px-6 py-3 rounded-lg border border-gray-200 text-gray-700 bg-white hover:bg-gray-50 font-medium transition-all shadow-sm hover:shadow transform hover:-translate-y-0.5"
                  onClick={goToPreviousStep}
                >
                  <FaAngleLeft className="mr-2" />
                  <span>Quay lại</span>
                </button>
                <button 
                  type="button" 
                  className={`flex items-center px-6 py-3 rounded-lg text-white font-medium transition-all ${
                    canProceedToNextStep() 
                      ? 'bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 hover:text-white shadow-md hover:shadow-lg transform hover:-translate-y-0.5' 
                      : 'bg-gray-400 cursor-not-allowed'
                  }`}
                  onClick={goToNextStep}
                  disabled={!canProceedToNextStep()}
                >
                  <span>Tiếp theo</span>
                  <FaAngleRight className="ml-2" />
                </button>
              </div>
            </div>
          )}

          {/* Step 4: Payment */}
          {currentStep === 4 && (
            <div className="p-6 md:p-8">
              <h2 className="text-xl font-semibold text-gray-800 mb-6 pb-3 border-b border-gray-100 flex items-center">
                <span className="w-1.5 h-6 bg-gradient-to-b from-blue-500 to-blue-600 rounded-full mr-3 inline-block"></span>
                Thông tin thanh toán
              </h2>
              
              <div className="bg-blue-50/70 rounded-xl p-6 border border-blue-100/80 shadow-sm backdrop-blur-sm">
                <h3 className="text-lg font-medium text-gray-800 mb-3">Thông tin lịch hẹn</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex flex-col">
                    <span className="text-sm text-gray-500 font-medium">Bệnh viện</span>
                    <span className="text-gray-800">{getHospitalName(formData.hospitalId)}</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-sm text-gray-500 font-medium">Chuyên khoa</span>
                    <span className="text-gray-800">{getSpecialtyName(formData.specialtyId)}</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-sm text-gray-500 font-medium">Bác sĩ</span>
                    <span className="text-gray-800">{getDoctorName(formData.doctorId)}</span>
                  </div>
                  {formData.serviceId && (
                    <div className="flex flex-col">
                      <span className="text-sm text-gray-500 font-medium">Dịch vụ</span>
                      <span className="text-gray-800">{getServiceName(formData.serviceId)}</span>
                    </div>
                  )}
                  <div className="flex flex-col">
                    <span className="text-sm text-gray-500 font-medium">Ngày khám</span>
                    <span className="text-gray-800">{formatDate(formData.appointmentDate)}</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-sm text-gray-500 font-medium">Giờ khám</span>
                    <span className="text-gray-800">{formData.timeSlot.startTime} - {formData.timeSlot.endTime}</span>
                  </div>
                </div>
              </div>
              
              <div className="bg-gray-50 rounded-lg p-4 mb-6 border border-gray-200">
                <h3 className="text-lg font-medium text-gray-800 mb-3">Chi phí dự kiến</h3>
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Phí khám tư vấn:</span>
                    <span className="font-medium">{priceDetails.consultationFee.toLocaleString('vi-VN')} VNĐ</span>
                  </div>
                  {formData.serviceId && (
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Phí dịch vụ:</span>
                      <span className="font-medium">{priceDetails.serviceFee.toLocaleString('vi-VN')} VNĐ</span>
                    </div>
                  )}
                  <div className="flex justify-between items-center border-t border-gray-200 pt-2 text-gray-800">
                    <span className="font-medium">Tổng chi phí:</span>
                    <span className="font-medium">{priceDetails.totalBeforeDiscount.toLocaleString('vi-VN')} VNĐ</span>
                  </div>
                  {couponInfo && (
                    <div className="flex justify-between items-center text-green-600">
                      <span className="font-medium">Giảm giá:</span>
                      <span className="font-medium">-{priceDetails.discountAmount.toLocaleString('vi-VN')} VNĐ</span>
                    </div>
                  )}
                  <div className="flex justify-between items-center border-t border-gray-200 pt-2 text-lg font-bold">
                    <span>Thanh toán:</span>
                    <span className="text-blue-600">{priceDetails.finalTotal.toLocaleString('vi-VN')} VNĐ</span>
                  </div>
                </div>

                <div className="mt-4 p-3 bg-blue-50 rounded-lg flex items-start border border-blue-100">
                  <FaInfoCircle className="text-blue-500 mt-0.5 mr-2 flex-shrink-0" />
                  <span className="text-sm text-gray-700">
                    Bạn có thể thanh toán trực tuyến bằng PayPal , MOMO sau khi đặt lịch trong phần lịch sử đặt lịch hoặc thanh toán tiền mặt tại bệnh viện.
                  </span>
                </div>
              </div>
              
              <div className="mb-6">
                <label htmlFor="discountCode" className="block text-sm font-medium text-gray-700 mb-2">
                  Mã giảm giá (nếu có)
                </label>
                <div className="flex space-x-2">
                  <div className="flex-1">
                    <input 
                      type="text" 
                      id="discountCode" 
                      name="discountCode" 
                      value={formData.discountCode} 
                      onChange={handleInputChange}
                      placeholder="Nhập mã giảm giá"
                      className="block w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 py-3 px-4"
                    />
                  </div>
                  <button 
                    type="button" 
                    className={`px-4 py-3 rounded-lg font-medium transition-all ${
                      validatingCoupon
                        ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                        : 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                    }`}
                    onClick={handleValidateCoupon}
                    disabled={validatingCoupon}
                  >
                    {validatingCoupon ? (
                      <div className="w-5 h-5 border-2 border-t-blue-500 border-blue-200 rounded-full animate-spin"></div>
                    ) : (
                      'Sử dụng'
                    )}
                  </button>
                </div>
                              {couponInfo && (                  <div className="mt-2 p-2 bg-green-50 text-green-800 text-sm rounded-md flex items-center">                    <FaInfoCircle className="mr-2 text-green-500" />                    <div className="flex flex-col">                      <span>                        {couponInfo.discountType === 'percentage'                           ? `Giảm ${couponInfo.discountValue}% (tối đa ${couponInfo.maxDiscount?.toLocaleString('vi-VN') || 'không giới hạn'} VNĐ)`                           : `Giảm ${couponInfo.discountValue.toLocaleString('vi-VN')} VNĐ`}                      </span>                      {couponInfo.minPurchase > 0 && (                        <span className="text-xs mt-1">                          Yêu cầu đơn hàng tối thiểu: {couponInfo.minPurchase.toLocaleString('vi-VN')} VNĐ                        </span>                      )}                      {couponInfo.endDate && (                        <span className="text-xs mt-1">                          Hạn sử dụng: {new Date(couponInfo.endDate).toLocaleDateString('vi-VN')}                        </span>                      )}                    </div>                  </div>                )}
              </div>
              
              <div className="mb-6">
                <label htmlFor="appointmentType" className="block text-sm font-medium text-gray-700 mb-2">
                  Loại khám
                </label>
                <div className="relative">
                  <select 
                    id="appointmentType" 
                    name="appointmentType" 
                    value={formData.appointmentType} 
                    onChange={handleInputChange}
                    className="block w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 py-3 px-4 bg-white appearance-none"
                  >
                    <option value="first-visit">Khám lần đầu</option>
                    <option value="follow-up">Tái khám</option>
                    <option value="consultation">Tư vấn</option>
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
                    <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                      <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" />
                    </svg>
                  </div>
                </div>
              </div>

              <div className="mb-6">
                <label htmlFor="symptoms" className="block text-sm font-medium text-gray-700 mb-2">
                  Triệu chứng
                </label>
                <textarea 
                  id="symptoms" 
                  name="symptoms" 
                  value={formData.symptoms} 
                  onChange={handleInputChange}
                  placeholder="Mô tả triệu chứng của bạn"
                  rows={3}
                  className="block w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 py-3 px-4 resize-none"
                ></textarea>
              </div>

              <div className="mb-6">
                <label htmlFor="medicalHistory" className="block text-sm font-medium text-gray-700 mb-2">
                  Tiền sử bệnh (nếu có)
                </label>
                <textarea 
                  id="medicalHistory" 
                  name="medicalHistory" 
                  value={formData.medicalHistory} 
                  onChange={handleInputChange}
                  placeholder="Các bệnh đã mắc, dị ứng, thuốc đang sử dụng..."
                  rows={3}
                  className="block w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 py-3 px-4 resize-none"
                ></textarea>
              </div>

              <div className="mb-6">
                <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-2">
                  Ghi chú thêm
                </label>
                <textarea 
                  id="notes" 
                  name="notes" 
                  value={formData.notes} 
                  onChange={handleInputChange}
                  placeholder="Các yêu cầu đặc biệt hoặc thông tin khác..."
                  rows={3}
                  className="block w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 py-3 px-4 resize-none"
                ></textarea>
              </div>

              <div className="flex justify-between pt-4">
                <button 
                  type="button" 
                  className="flex items-center px-6 py-3 rounded-lg border border-gray-200 text-gray-700 bg-white hover:bg-gray-50 font-medium transition-all shadow-sm hover:shadow transform hover:-translate-y-0.5"
                  onClick={goToPreviousStep}
                >
                  <FaAngleLeft className="mr-2" />
                  <span>Quay lại</span>
                </button>
                <button 
                  type="button" 
                  className="flex items-center px-6 py-3 rounded-lg text-white font-medium bg-blue-600 hover:bg-blue-700 shadow-md hover:shadow-lg transition-all"
                  onClick={goToNextStep}
                >
                  <span>Tiếp theo</span>
                  <FaAngleRight className="ml-2" />
                </button>
              </div>
            </div>
          )}

          {/* Step 5: Confirmation */}
          {currentStep === 5 && (
            <div className="p-6 md:p-8">
              <h2 className="text-xl font-semibold text-gray-800 mb-6 pb-3 border-b border-gray-100 flex items-center">
                <span className="w-1.5 h-6 bg-gradient-to-b from-blue-500 to-blue-600 rounded-full mr-3 inline-block"></span>
                Xác nhận đặt lịch
              </h2>
              
              <div className="bg-white border border-gray-200 rounded-lg shadow-sm mb-6">
                <div className="p-5 border-b border-gray-100">
                  <h3 className="text-lg font-semibold text-gray-800 mb-2">Xác nhận thông tin lịch hẹn</h3>
                  <p className="text-gray-600 text-sm">
                    Vui lòng kiểm tra lại thông tin lịch hẹn trước khi hoàn tất. Bạn có thể thanh toán trực tuyến bằng PayPal trong lịch sử đặt lịch.
                  </p>
                </div>
                
                <div className="divide-y divide-gray-100">
                  <div className="p-5">
                    <h4 className="flex items-center text-gray-800 font-medium mb-3">
                      <FaHospital className="mr-2 text-blue-500" />
                      Thông tin bệnh viện
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="flex flex-col">
                        <span className="text-sm text-gray-500 font-medium">Bệnh viện</span>
                        <span className="text-gray-800">{getHospitalName(formData.hospitalId)}</span>
                      </div>
                      <div className="flex flex-col">
                        <span className="text-sm text-gray-500 font-medium">Chuyên khoa</span>
                        <span className="text-gray-800">{getSpecialtyName(formData.specialtyId)}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="p-5">
                    <h4 className="flex items-center text-gray-800 font-medium mb-3">
                      <FaUserMd className="mr-2 text-blue-500" />
                      Thông tin bác sĩ
                    </h4>
                    <div className="flex flex-col">
                      <span className="text-sm text-gray-500 font-medium">Bác sĩ</span>
                      <span className="text-gray-800">{getDoctorName(formData.doctorId)}</span>
                    </div>
                  </div>

                  <div className="p-5">
                    <h4 className="flex items-center text-gray-800 font-medium mb-3">
                      <FaCalendarAlt className="mr-2 text-blue-500" />
                      Thông tin lịch hẹn
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="flex flex-col">
                        <span className="text-sm text-gray-500 font-medium">Ngày khám</span>
                        <span className="text-gray-800">{formatDate(formData.appointmentDate)}</span>
                      </div>
                      <div className="flex flex-col">
                        <span className="text-sm text-gray-500 font-medium">Giờ khám</span>
                        <span className="text-gray-800">{formData.timeSlot.startTime} - {formData.timeSlot.endTime}</span>
                      </div>
                      <div className="flex flex-col">
                        <span className="text-sm text-gray-500 font-medium">Loại khám</span>
                        <span className="text-gray-800">
                          {formData.appointmentType === 'first-visit' ? 'Khám lần đầu' : 
                           formData.appointmentType === 'follow-up' ? 'Tái khám' : 'Tư vấn'}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="p-5">
                    <h4 className="flex items-center text-gray-800 font-medium mb-3">
                      <FaNotesMedical className="mr-2 text-blue-500" />
                      Thông tin y tế
                    </h4>
                    <div className="grid grid-cols-1 gap-4">
                      {formData.serviceId && (
                        <div className="flex flex-col">
                          <span className="text-sm text-gray-500 font-medium">Dịch vụ</span>
                          <span className="text-gray-800">{getServiceName(formData.serviceId)}</span>
                        </div>
                      )}
                      <div className="flex flex-col">
                        <span className="text-sm text-gray-500 font-medium">Triệu chứng</span>
                        <span className="text-gray-800">{formData.symptoms || 'Không có'}</span>
                      </div>
                      <div className="flex flex-col">
                        <span className="text-sm text-gray-500 font-medium">Tiền sử bệnh</span>
                        <span className="text-gray-800">{formData.medicalHistory || 'Không có'}</span>
                      </div>
                      <div className="flex flex-col">
                        <span className="text-sm text-gray-500 font-medium">Ghi chú</span>
                        <span className="text-gray-800">{formData.notes || 'Không có'}</span>
                      </div>
                    </div>
                  </div>

                  <div className="p-5 bg-gray-50">
                    <h4 className="flex items-center text-gray-800 font-medium mb-3">
                      <FaCreditCard className="mr-2 text-blue-500" />
                      Thông tin thanh toán
                    </h4>
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600">Phương thức</span>
                        <span className="font-medium">Tiền mặt tại bệnh viện</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600">Tổng chi phí</span>
                        <span className="font-medium">{priceDetails.totalBeforeDiscount.toLocaleString('vi-VN')} VNĐ</span>
                      </div>
                      {couponInfo && (
                        <div className="flex justify-between items-center text-green-600">
                          <span className="font-medium">Giảm giá</span>
                          <span className="font-medium">-{priceDetails.discountAmount.toLocaleString('vi-VN')} VNĐ</span>
                        </div>
                      )}
                      <div className="flex justify-between items-center pt-2 text-lg font-bold">
                        <span>Thanh toán</span>
                        <span className="text-blue-600">{priceDetails.finalTotal.toLocaleString('vi-VN')} VNĐ</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="flex justify-between pt-4">
                <button 
                  type="button" 
                  className="flex items-center px-6 py-3 rounded-lg border border-gray-200 text-gray-700 bg-white hover:bg-gray-50 font-medium transition-all shadow-sm hover:shadow transform hover:-translate-y-0.5"
                  onClick={goToPreviousStep}
                >
                  <FaAngleLeft className="mr-2" />
                  <span>Quay lại</span>
                </button>
                <button 
                  type="submit" 
                  className="flex items-center px-8 py-3 rounded-lg text-white font-medium bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 hover:text-white shadow-md hover:shadow-lg transition-all transform hover:-translate-y-0.5"
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <div className="w-5 h-5 border-2 border-t-white border-white/30 rounded-full animate-spin mr-2"></div>
                      <span>Đang xử lý...</span>
                    </>
                  ) : (
                    <>
                      {isRescheduling ? 'Xác nhận đổi lịch' : 
                       isEditing ? 'Cập nhật lịch hẹn' : 
                       'Hoàn tất đặt lịch'}
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </form>
      </div>
    </div>
  );
};

export default Appointment; 
