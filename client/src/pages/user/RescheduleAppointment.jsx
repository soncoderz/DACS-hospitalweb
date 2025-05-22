import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../utils/api';
import { toast, ToastContainer } from 'react-toastify';
import io from 'socket.io-client';

import { FaCalendarAlt, FaClock, FaHospital, FaUserMd, 
        FaArrowLeft, FaCheckCircle, FaExclamationTriangle, FaInfoCircle, FaAngleRight, FaAngleLeft, FaLock } from 'react-icons/fa';

const RescheduleAppointment = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();

  // State for original appointment
  const [originalAppointment, setOriginalAppointment] = useState(null);
  
  // State for available dates and schedules
  const [schedules, setSchedules] = useState([]);
  const [availableDates, setAvailableDates] = useState([]);
  const [availableTimeSlots, setAvailableTimeSlots] = useState([]);
  
  // Add state for current month for calendar view
  const [currentMonth, setCurrentMonth] = useState(new Date());
  
  // State for form data
  const [formData, setFormData] = useState({
    appointmentDate: '',
    scheduleId: '',
    timeSlot: { startTime: '', endTime: '' }
  });
  
  // Socket connection state
  const [socket, setSocket] = useState(null);
  const [lockedSlots, setLockedSlots] = useState(new Map());
  
  // UI states
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

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

      // Set up event listeners for time slot locking
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
        setAvailableTimeSlots(prev => {
          return prev.map(schedule => {
            if (schedule.scheduleId === scheduleId) {
              return {
                ...schedule,
                timeSlots: schedule.timeSlots.map(slot => {
                  if (slot.startTime === timeSlotInfo.startTime) {
                    return {
                      ...slot,
                      isBooked: timeSlotInfo.isBooked,
                      bookedCount: timeSlotInfo.bookedCount,
                      maxBookings: timeSlotInfo.maxBookings
                    };
                  }
                  return slot;
                })
              };
            }
            return schedule;
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
        if (formData.scheduleId && formData.timeSlot?.startTime && originalAppointment?.doctorId) {
          socketInstance.emit('unlock_time_slot', {
            scheduleId: formData.scheduleId,
            timeSlotId: formData.timeSlot.startTime,
            doctorId: originalAppointment.doctorId._id || originalAppointment.doctorId,
            date: formData.appointmentDate
          });
        }
        
        socketInstance.disconnect();
      };
    }
  }, [isAuthenticated, user]);

  // Join doctor-specific appointment room when doctor is selected and date is available
  useEffect(() => {
    if (socket && originalAppointment?.doctorId && formData.appointmentDate) {
      const doctorId = originalAppointment.doctorId._id || originalAppointment.doctorId;
      const date = new Date(formData.appointmentDate).toISOString().split('T')[0];
      
      socket.emit('join_appointment_room', {
        doctorId: doctorId,
        date
      });
    }
  }, [socket, originalAppointment?.doctorId, formData.appointmentDate]);

  // Load the appointment details and available schedules on component mount
  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login', {
        state: {
          from: `/appointments/${id}/reschedule`,
          message: 'Vui lòng đăng nhập để đổi lịch hẹn.'
        }
      });
      return;
    }
    
    fetchAppointmentDetails();
  }, [id, isAuthenticated, navigate]);

  // Set the current month when available dates change
  useEffect(() => {
    if (availableDates.length > 0) {
      const firstAvailableDate = new Date(availableDates[0]);
      setCurrentMonth(new Date(firstAvailableDate.getFullYear(), firstAvailableDate.getMonth(), 1));
    }
  }, [availableDates]);

  // Fetch original appointment details
  const fetchAppointmentDetails = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/appointments/${id}`);
      
      console.log("Original appointment data loaded:", response.data);
      
      if (response.data.success && response.data.data) {
        const appointment = response.data.data;
        setOriginalAppointment(appointment);
        
        // Fetch available schedules for this doctor
        fetchSchedules(appointment.doctorId._id || appointment.doctorId);
      } else {
        setError('Không thể tải thông tin lịch hẹn. Vui lòng thử lại sau.');
      }
    } catch (err) {
      console.error('Error fetching appointment details:', err);
      setError('Không thể tải thông tin lịch hẹn. Vui lòng thử lại sau.');
    } finally {
      setLoading(false);
    }
  };

  // Fetch available schedules for the doctor
  const fetchSchedules = async (doctorId) => {
    if (!doctorId) return;

    setLoading(true);
    try {
      const response = await api.get(`/appointments/doctors/${doctorId}/schedules`);
      console.log("API Response:", response.data);
      
      if (!response.data.success && !response.data.status) {
        setError('Lỗi: Không thể tải lịch khám. Định dạng phản hồi không hợp lệ.');
        setLoading(false);
        return;
      }
      
      // Handle different API response formats
      let scheduleData = response.data.data || [];
      
      // Log schedule data for debugging
      console.log("Schedule data received:", scheduleData);
      
      // Validate schedule data format
      if (!scheduleData || !Array.isArray(scheduleData)) {
        console.error("Invalid schedule data format:", scheduleData);
        setError('Định dạng dữ liệu lịch không hợp lệ.');
        setSchedules([]);
        setAvailableDates([]);
        setLoading(false);
        return;
      }
      
      // Normalize schedule data to ensure bookedCount and maxBookings exist
      // and isBooked is determined correctly based on bookedCount
      scheduleData = scheduleData.map(schedule => {
        if (schedule.timeSlots && Array.isArray(schedule.timeSlots)) {
          const normalizedTimeSlots = schedule.timeSlots.map(slot => ({
            ...slot,
            // Ensure these properties exist with correct defaults
            bookedCount: slot.bookedCount || 0,
            maxBookings: slot.maxBookings || 3,
            // Force isBooked to be determined ONLY by the bookedCount vs maxBookings comparison
            isBooked: (slot.bookedCount !== undefined && 
                     slot.maxBookings !== undefined && 
                     slot.bookedCount >= (slot.maxBookings || 3))
          }));
          
          return {
            ...schedule,
            timeSlots: normalizedTimeSlots
          };
        }
        return schedule;
      });
      
      // Log normalized data
      console.log("Normalized schedule data:", scheduleData);
      setSchedules(scheduleData);

      // Extract and format available dates from schedules
      if (scheduleData.length > 0) {
        // Extract dates and sort them
        const dates = [...new Set(
          scheduleData.map(schedule => {
            if (!schedule.date) {
              console.error("Schedule missing date:", schedule);
              return null;
            }
            // Extract date part from ISO string
            return schedule.date.split('T')[0];
          }).filter(Boolean) // Remove null values
        )].sort();
        
        if (dates.length === 0) {
          setError('Không có ngày khả dụng cho lịch khám.');
        }
        
        setAvailableDates(dates);
        
        // Clear any previous selection
        setFormData({
          appointmentDate: '',
          scheduleId: '',
          timeSlot: { startTime: '', endTime: '' }
        });
      } else {
        setAvailableDates([]);
        setError('Không có lịch khám khả dụng cho bác sĩ này. Vui lòng thử lại sau hoặc chọn bác sĩ khác.');
      }
    } catch (err) {
      console.error('Error fetching schedules:', err);
      setError('Không thể tải lịch khám. Vui lòng thử lại sau.');
      setSchedules([]);
      setAvailableDates([]);
    } finally {
      setLoading(false);
    }
  };

  // Find time slots when a date is selected
  const findTimeSlots = (date) => {
    // Find all schedules for the selected date
    const schedulesForDate = schedules.filter(schedule => 
      schedule.date.split('T')[0] === date
    );
    
    console.log(`Schedules found for date ${date}:`, schedulesForDate);
    
    if (schedulesForDate.length === 0) {
      setAvailableTimeSlots([]);
      return;
    }
    
    // Format the time slots for display
    const formattedTimeSlots = schedulesForDate.map(schedule => {
      // Check if schedule has timeSlots property
      if (!schedule.timeSlots || !Array.isArray(schedule.timeSlots)) {
        console.error("Schedule missing timeSlots or not an array:", schedule);
        return {
          scheduleId: schedule._id,
          timeSlots: []
        };
      }
      
      // Map the timeSlots with correct availability logic
      return {
        scheduleId: schedule._id,
        timeSlots: schedule.timeSlots.map(slot => {
          // Check if we need to override the isBooked property based on bookedCount
          // This handles the case where isBooked might be true but bookedCount is 0
          const isFullyBooked = (slot.bookedCount !== undefined && 
                               slot.maxBookings !== undefined && 
                               slot.bookedCount >= (slot.maxBookings || 3));
          
          return {
            startTime: slot.startTime,
            endTime: slot.endTime,
            bookedCount: slot.bookedCount || 0,
            maxBookings: slot.maxBookings || 3,
            // Force isBooked to be determined ONLY by the bookedCount vs maxBookings comparison
            isBooked: isFullyBooked
          };
        })
      };
    });
    
    console.log("Formatted time slots:", formattedTimeSlots);
    setAvailableTimeSlots(formattedTimeSlots);
  };

  // Navigate to the previous month
  const goToPreviousMonth = (e) => {
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

  // Navigate to the next month
  const goToNextMonth = (e) => {
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

  // Generate calendar days including empty spots for a proper grid
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

  // Handle date selection
  const handleDateSelect = (date) => {
    setFormData({
      appointmentDate: date,
      scheduleId: '',
      timeSlot: { startTime: '', endTime: '' }
    });
    
    findTimeSlots(date);
  };

  // Handle time slot selection
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
        socket && originalAppointment) {
      const doctorId = originalAppointment.doctorId._id || originalAppointment.doctorId;
      
      socket.emit('unlock_time_slot', {
        scheduleId: formData.scheduleId,
        timeSlotId: formData.timeSlot.startTime,
        doctorId: doctorId,
        date: formData.appointmentDate
      });
    }
    
    // Lock the new slot
    if (socket && originalAppointment) {
      const doctorId = originalAppointment.doctorId._id || originalAppointment.doctorId;
      
      socket.emit('lock_time_slot', {
        scheduleId,
        timeSlotId: slot.startTime,
        doctorId: doctorId,
        date: formData.appointmentDate
      });
    }
    
    setFormData({
      ...formData,
      scheduleId,
      timeSlot: {
        startTime: slot.startTime,
        endTime: slot.endTime
      }
    });
    
    console.log("Selected time slot:", {
      scheduleId,
      startTime: slot.startTime,
      endTime: slot.endTime
    });
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.appointmentDate || !formData.scheduleId || !formData.timeSlot.startTime) {
      toast.error('Vui lòng chọn ngày và giờ khám');
      return;
    }
    
    setSubmitting(true);
    try {
      // Log thông tin lịch hẹn gốc để kiểm tra
      console.log("Original Appointment Data:", {
        id: id,
        originalAppointment: originalAppointment,
        doctorId: originalAppointment?.doctorId?._id || originalAppointment?.doctorId,
        scheduleId: originalAppointment?.scheduleId?._id || originalAppointment?.scheduleId,
      });
      
      // Đảm bảo định dạng của timeSlot đúng theo yêu cầu của server
      const timeSlotData = {
        startTime: formData.timeSlot.startTime,
        endTime: formData.timeSlot.endTime
      };
      
      // Tạo payload đúng định dạng
      const payload = {
        scheduleId: formData.scheduleId,
        appointmentDate: formData.appointmentDate,
        timeSlot: timeSlotData
      };
      
      console.log("Sending reschedule payload:", payload);
      console.log("Reschedule endpoint:", `/appointments/${id}/reschedule`);
      
      const response = await api.put(`/appointments/${id}/reschedule`, payload);
      
      if (response.data.success) {
        toast.success('Đổi lịch hẹn thành công!');
        
        // Navigate back to appointments list with success message
        setTimeout(() => {
          navigate('/appointments', { 
            state: { 
              success: true, 
              message: 'Đổi lịch hẹn thành công!'
            } 
          });
        }, 1500);
      } else {
        toast.error(response.data.message || 'Không thể đổi lịch hẹn. Vui lòng thử lại sau.');
      }
    } catch (err) {
      console.error('Error rescheduling appointment:', err);
      // Hiển thị chi tiết lỗi để dễ gỡ lỗi
      console.error('Error details:', {
        message: err.message,
        response: err.response?.data,
        status: err.response?.status,
        errorType: err.response?.data?.errorType
      });
      
      let errorMessage = 'Không thể đổi lịch hẹn. Vui lòng thử lại sau.';
      
      // Nếu có thông báo lỗi từ server, sử dụng nó
      if (err.response?.data?.message) {
        errorMessage = err.response.data.message;
      }
      
      // Xử lý các trường hợp lỗi cụ thể
      if (err.response?.status === 409) {
        errorMessage = "Khung giờ này đang được người khác xử lý. Vui lòng chọn khung giờ khác hoặc thử lại sau.";
      } else if (err.response?.status === 400) {
        // Hiển thị thông báo lỗi validation
        errorMessage = err.response.data.message || "Vui lòng kiểm tra lại thông tin và thử lại.";
      } else if (err.response?.status === 500 && err.response?.data?.errorType === 'VersionError') {
        errorMessage = "Có người đang đặt lịch cùng lúc với bạn. Vui lòng thử lại sau vài giây.";
        
        // Thêm nút thử lại sau 3 giây
        setTimeout(() => {
          toast.info("Bạn có thể thử lại bây giờ", {
            autoClose: 5000,
            onClick: () => setSubmitting(false)
          });
        }, 3000);
      }
      
      toast.error(errorMessage);
      
      // Nếu lỗi nghiêm trọng, hiển thị icon và gợi ý làm mới trang
      if (err.response?.status === 500) {
        toast.error("Đã xảy ra lỗi hệ thống. Bạn có thể thử làm mới trang.", {
          autoClose: 10000,
          icon: "🔄"
        });
      }
    } finally {
      setSubmitting(false);
    }
  };

  // Format date for display
  const formatDate = (dateString) => {
    if (!dateString) return '';
    
    // Create a date object
    const date = new Date(dateString);
    
    // Adjust timezone by creating a UTC date at noon to avoid date shifts
    const utcDate = new Date(Date.UTC(
      date.getFullYear(),
      date.getMonth(),
      date.getDate(),
      12, 0, 0 // Set to noon UTC to avoid timezone issues
    ));
    
    // Format the date using Vietnamese locale
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    return utcDate.toLocaleDateString('vi-VN', options);
  };

  // Helper function to get doctor name
  const getDoctorName = (appointment) => {
    if (!appointment) return '';
    if (appointment.doctorName) return appointment.doctorName;
    if (appointment.doctorId && appointment.doctorId.user && appointment.doctorId.user.fullName) {
      return appointment.doctorId.user.fullName;
    }
    return 'Chưa có thông tin';
  };

  // Helper function to get hospital name
  const getHospitalName = (appointment) => {
    if (!appointment) return '';
    if (appointment.hospitalName) return appointment.hospitalName;
    if (appointment.hospitalId && appointment.hospitalId.name) {
      return appointment.hospitalId.name;
    }
    return 'Chưa có thông tin';
  };

  // Add this at the top where other useEffects are
  useEffect(() => {
    // Log available dates and schedules for debugging
    console.log("Available dates:", availableDates);
    console.log("Schedules:", schedules);
    console.log("Available time slots:", availableTimeSlots);
  }, [availableDates, schedules, availableTimeSlots]);

  // Add this to the component to check if the user is trying to reschedule a confirmed appointment
  useEffect(() => {
    if (originalAppointment && originalAppointment.status !== 'pending' && originalAppointment.status !== 'rescheduled' && originalAppointment.status !== 'confirmed') {
      setError(`Không thể đổi lịch hẹn với trạng thái ${originalAppointment.status}. Chỉ lịch hẹn có trạng thái "Chờ xác nhận", "Đã xác nhận" hoặc "Đã đổi lịch" mới có thể đổi.`);
    }
  }, [originalAppointment]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex flex-col items-center">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
          <p className="mt-4 text-gray-600">Đang tải thông tin lịch hẹn...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-lg shadow p-6 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-red-100 text-red-500 mb-4">
            <FaExclamationTriangle className="text-2xl" />
          </div>
          <h2 className="text-xl font-bold text-gray-800 mb-4">{error}</h2>
          <Link 
            to="/appointments" 
            className="inline-flex items-center bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary-dark transition-colors"
          >
            <FaArrowLeft className="mr-2" /> Quay lại danh sách lịch hẹn
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 min-h-screen py-8">
      <ToastContainer position="top-right" autoClose={5000} />
      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-800 mb-2">Đổi lịch hẹn</h1>
            <p className="text-gray-600">Chọn thời gian mới cho lịch hẹn của bạn</p>
          </div>
          <Link to="/appointments" className="mt-2 md:mt-0 text-primary hover:text-primary-dark transition-colors inline-flex items-center">
            <FaArrowLeft className="mr-2" /> Quay lại danh sách
          </Link>
        </div>

        <div className="bg-blue-50 border-l-4 border-blue-400 p-4 rounded-lg mb-6">
          <div className="flex">
            <FaInfoCircle className="text-blue-500 mr-2 mt-1 flex-shrink-0" />
            <div>
              <p className="text-blue-800 mb-2">
                <strong>Lưu ý:</strong> 
              </p>
              <ul className="list-disc pl-5 text-sm text-blue-700">
                <li>Mỗi lịch hẹn chỉ được phép đổi tối đa 2 lần</li>
                <li>Không thể đổi lịch hẹn trong vòng 4 giờ trước thời gian hẹn</li>
                <li>Không thể đổi lịch hẹn về thời gian đã qua</li>
                <li>Không thể đổi lịch hẹn xa quá 30 ngày kể từ hôm nay</li>
                <li>Mỗi bệnh nhân chỉ được phép có tối đa 3 cuộc hẹn trong một ngày</li>
                <li>Khi đổi lịch trong cùng một ngày, phải chọn khung giờ khác với lịch hẹn cũ</li>
              </ul>
            </div>
          </div>
        </div>

        {originalAppointment && (
          <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
            <h2 className="text-xl font-bold text-gray-800 mb-4">Thông tin lịch hẹn hiện tại</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-start">
                <FaCalendarAlt className="text-primary mt-1 mr-3" />
                <div>
                  <p className="text-sm text-gray-500">Ngày khám:</p>
                  <p className="font-medium">{formatDate(originalAppointment.appointmentDate)}</p>
                </div>
              </div>
              <div className="flex items-start">
                <FaClock className="text-primary mt-1 mr-3" />
                <div>
                  <p className="text-sm text-gray-500">Giờ khám:</p>
                  <p className="font-medium">{originalAppointment.timeSlot.startTime} - {originalAppointment.timeSlot.endTime}</p>
                </div>
              </div>
              <div className="flex items-start">
                <FaUserMd className="text-primary mt-1 mr-3" />
                <div>
                  <p className="text-sm text-gray-500">Bác sĩ:</p>
                  <p className="font-medium">{getDoctorName(originalAppointment)}</p>
                </div>
              </div>
              <div className="flex items-start">
                <FaHospital className="text-primary mt-1 mr-3" />
                <div>
                  <p className="text-sm text-gray-500">Bệnh viện:</p>
                  <p className="font-medium">{getHospitalName(originalAppointment)}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-xl font-bold text-gray-800 mb-4">Chọn thời gian mới</h2>
          
          {availableDates.length === 0 && (
            <div className="bg-yellow-50 text-yellow-800 p-4 rounded-lg flex items-center">
              <FaExclamationTriangle className="text-yellow-500 mr-2" />
              <p>Không có lịch khám khả dụng cho bác sĩ này. Vui lòng thử lại sau.</p>
            </div>
          )}
          
          {availableDates.length > 0 && (
            <form onSubmit={handleSubmit}>
              <div className="mb-6">
                <label className="flex items-center text-sm font-medium text-gray-700 mb-3">
                  <FaCalendarAlt className="mr-2 text-primary" />
                  Chọn ngày khám
                </label>
                
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 max-w-md mx-auto">
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
                    <span className="inline-block w-2 h-2 rounded-full bg-primary mr-1"></span>
                    <span>Ngày bác sĩ có lịch khám</span>
                  </div>
                  
                  <div className="grid grid-cols-7 gap-1 text-center py-1 bg-gray-50 text-xs">
                    {['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'].map(day => (
                      <div key={day} className="text-xs font-medium text-gray-500 py-1">
                        {day}
                      </div>
                    ))}
                  </div>
                  
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
                            ${isSelected ? 'bg-primary text-white' : ''}
                            ${day.isAvailable && !isSelected ? 'bg-primary/10 text-primary cursor-pointer hover:bg-primary/20' : ''}
                            ${!day.isAvailable || !day.isCurrentMonth ? 'cursor-default' : 'cursor-pointer'}
                          `}
                          onClick={() => day.isCurrentMonth && day.isAvailable && handleDateSelect(day.dateString)}
                          title={day.isAvailable ? 'Có lịch khám (có thể còn chỗ trống)' : 'Không có lịch khám'}
                        >
                          {day.date.getDate()}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
              
              {formData.appointmentDate && (
                <div className="mb-6">
                  <label className="flex items-center text-sm font-medium text-gray-700 mb-3">
                    <FaClock className="mr-2 text-primary" />
                    Chọn giờ khám
                  </label>
                  
                  {availableTimeSlots.length === 0 && (
                    <div className="bg-yellow-50 text-yellow-800 p-4 rounded-lg flex items-center">
                      <FaExclamationTriangle className="text-yellow-500 mr-2" />
                      <p>Không có khung giờ khả dụng cho ngày này. Vui lòng chọn ngày khác.</p>
                    </div>
                  )}
                  
                  <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2">
                    {availableTimeSlots.map(schedule => 
                      schedule.timeSlots && schedule.timeSlots.map((slot, index) => {
                        const slotKey = `${schedule.scheduleId}_${slot.startTime}`;
                        const isLockedByOther = lockedSlots.has(slotKey) && lockedSlots.get(slotKey) !== user?.id;
                        const isLockedByMe = lockedSlots.has(slotKey) && lockedSlots.get(slotKey) === user?.id;
                        
                        return (
                          <div 
                            key={`${schedule.scheduleId}-${index}`}
                            className={`
                              rounded-lg border p-2 text-center cursor-pointer transition-all relative
                              ${slot.isBooked 
                                ? 'bg-gray-100 border-gray-200 text-gray-400 cursor-not-allowed' 
                                : isLockedByOther
                                  ? 'bg-yellow-50 border-yellow-300 text-yellow-700 cursor-not-allowed animate-pulse'
                                  : formData.scheduleId === schedule.scheduleId && formData.timeSlot.startTime === slot.startTime
                                    ? 'bg-primary/10 border-primary text-primary shadow-sm'
                                    : slot.bookedCount > 0 
                                      ? 'bg-yellow-50 border-yellow-200 hover:border-primary hover:bg-primary/5 text-gray-700'
                                      : 'bg-white border-gray-200 hover:border-primary hover:bg-primary/5 text-gray-700'
                              }
                            `}
                            onClick={() => !slot.isBooked && !isLockedByOther && handleTimeSlotSelect(schedule.scheduleId, slot)}
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
                                  : `Còn ${(slot.maxBookings || 3) - (slot.bookedCount || 0)}/${slot.maxBookings || 3}`}
                            </div>
                            
                            {(isLockedByOther || isLockedByMe) && (
                              <div className="absolute top-1 right-1 text-xs">
                                <FaLock className={isLockedByOther ? 'text-yellow-500' : 'text-blue-500'} />
                              </div>
                            )}
                          </div>
                        );
                      })
                    )}
                  </div>
                  
                  {/* Update the legend to include locked slot information */}
                  <div className="mt-4 bg-blue-50 rounded-lg p-3 text-sm text-blue-700 flex items-start">
                    <FaInfoCircle className="text-blue-500 mt-0.5 mr-2 flex-shrink-0" />
                    <div>
                      <p className="font-medium mb-1">Chú thích trạng thái khung giờ:</p>
                      <ul className="list-disc pl-5 space-y-1">
                        <li><span className="inline-block w-3 h-3 bg-green-500 rounded-full mr-1"></span> <span className="font-medium">Còn trống:</span> Khung giờ có thể đặt lịch</li>
                        <li><span className="inline-block w-3 h-3 bg-yellow-400 rounded-full mr-1"></span> <span className="font-medium">Còn X/3:</span> Khung giờ đã có người đặt nhưng vẫn còn chỗ trống</li>
                        <li><span className="inline-block w-3 h-3 bg-red-400 rounded-full mr-1"></span> <span className="font-medium">Đã đầy:</span> Khung giờ đã đạt giới hạn tối đa (3 lịch hẹn)</li>
                        <li><span className="inline-block w-3 h-3 bg-yellow-500 rounded-full mr-1"></span> <span className="font-medium">Đang có người chọn:</span> Khung giờ đang được người khác xử lý</li>
                      </ul>
                    </div>
                  </div>
                </div>
              )}
              
              <div className="flex justify-end mt-8 space-x-4">
                {/* Thêm nút huỷ */}
                <Link
                  to="/appointments"
                  className="px-6 py-2 rounded-lg font-medium border border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Huỷ
                </Link>
                
                {/* Nút xác nhận */}
                <button
                  type="submit"
                  className={`px-6 py-2 rounded-lg font-medium ${
                    submitting || !formData.appointmentDate || !formData.scheduleId || !formData.timeSlot.startTime
                      ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                      : 'bg-primary text-white hover:bg-primary-dark transition-colors'
                  }`}
                  disabled={submitting || !formData.appointmentDate || !formData.scheduleId || !formData.timeSlot.startTime}
                >
                  {submitting ? (
                    <span className="flex items-center">
                      <span className="animate-spin h-4 w-4 mr-2 border-2 border-white border-t-transparent rounded-full"></span>
                      Đang xử lý...
                    </span>
                  ) : (
                    'Xác nhận đổi lịch'
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default RescheduleAppointment; 
