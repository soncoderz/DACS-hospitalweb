import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import api from '../../utils/api';
import { 
  FaCalendarAlt, FaPlus, FaTrashAlt, 
  FaEdit, FaSave, FaTimes, FaCalendarCheck,
  FaClock, FaDoorOpen, FaHospital, FaCheckCircle,
  FaExclamationCircle, FaAngleLeft, FaAngleRight,
  FaCalendarDay, FaCalendarWeek, FaExclamationTriangle, FaUserMd, FaInfoCircle,
  FaArrowLeft
} from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';

const Schedule = () => {
  const [schedules, setSchedules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedDate, setSelectedDate] = useState('');
  const [viewingWeek, setViewingWeek] = useState(getWeekDates());
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [processingAction, setProcessingAction] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState(null);
  const [formErrors, setFormErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [newSchedule, setNewSchedule] = useState({
    hospitalId: '',
    date: '',
    roomId: '',
    timeSlots: [{
      startTime: '',
      endTime: '',
      roomId: ''
    }],
  });
  
  const [rooms, setRooms] = useState([]);
  const [hospitalId, setHospitalId] = useState('');
  const [hospitals, setHospitals] = useState([]);

  // Add this array near the top of the component, after your state definitions
  const timeSlotOptions = [
    "08:00", "08:30", "09:00", "09:30", "10:00", "10:30", "11:00", "11:30",
    "12:00", "12:30", "13:00", "13:30", "14:00", "14:30", 
    "15:00", "15:30", "16:00", "16:30", "17:00"
  ];
  
  // Thêm các cặp khung giờ phổ biến
  const commonTimeSlotGroups = [
    { name: "Buổi sáng (8h-12h)", slots: [
      { startTime: "08:00", endTime: "08:30" },
      { startTime: "08:30", endTime: "09:00" },
      { startTime: "09:00", endTime: "09:30" },
      { startTime: "09:30", endTime: "10:00" },
      { startTime: "10:00", endTime: "10:30" },
      { startTime: "10:30", endTime: "11:00" },
      { startTime: "11:00", endTime: "11:30" },
      { startTime: "11:30", endTime: "12:00" }
    ]},
    { name: "Buổi chiều (13h-17h)", slots: [
      { startTime: "13:00", endTime: "13:30" },
      { startTime: "13:30", endTime: "14:00" },
      { startTime: "14:00", endTime: "14:30" },
      { startTime: "14:30", endTime: "15:00" },
      { startTime: "15:00", endTime: "15:30" },
      { startTime: "15:30", endTime: "16:00" },
      { startTime: "16:00", endTime: "16:30" },
      { startTime: "16:30", endTime: "17:00" }
    ]},
    { name: "Cả ngày (8h-17h)", slots: [
      { startTime: "08:00", endTime: "08:30" },
      { startTime: "08:30", endTime: "09:00" },
      { startTime: "09:00", endTime: "09:30" },
      { startTime: "09:30", endTime: "10:00" },
      { startTime: "10:00", endTime: "10:30" },
      { startTime: "10:30", endTime: "11:00" },
      { startTime: "11:00", endTime: "11:30" },
      { startTime: "11:30", endTime: "12:00" },
      { startTime: "13:00", endTime: "13:30" },
      { startTime: "13:30", endTime: "14:00" },
      { startTime: "14:00", endTime: "14:30" },
      { startTime: "14:30", endTime: "15:00" },
      { startTime: "15:00", endTime: "15:30" },
      { startTime: "15:30", endTime: "16:00" },
      { startTime: "16:00", endTime: "16:30" },
      { startTime: "16:30", endTime: "17:00" }
    ]}
  ];

  const navigate = useNavigate();

  // Fetch doctor information, hospitals, and schedules
  useEffect(() => {
    fetchDoctorInfo();
    fetchSchedules();
  }, [viewingWeek, hospitalId]);

  // Fetch doctor information to get hospitalId
  const fetchDoctorInfo = async () => {
    try {
      const response = await api.get('/doctors/profile');
      if (response.data.success && response.data.data) {
        const doctor = response.data.data;
        console.log('Fetched doctor info:', doctor);
        
        // Check if hospital data exists in the new structure
        if (doctor.hospital && doctor.hospital._id) {
          console.log('Setting hospital ID:', doctor.hospital._id);
          setHospitalId(doctor.hospital._id);
          
          // Fetch rooms for this hospital
          await fetchRooms(doctor.hospital._id);
        } else if (doctor.hospitalId) {
          // Fallback to old structure if present
          console.log('Setting hospital ID from hospitalId field:', doctor.hospitalId);
          setHospitalId(doctor.hospitalId);
          await fetchRooms(doctor.hospitalId);
        } else {
          console.error('Doctor has no hospital assigned');
          toast.warning('Không tìm thấy thông tin bệnh viện');
        }
      } else {
        console.error('Failed to fetch doctor info');
        toast.error('Không thể tải thông tin bác sĩ');
      }
    } catch (err) {
      console.error('Error fetching doctor info:', err.response?.data || err.message);
      toast.error('Đã xảy ra lỗi khi tải thông tin bác sĩ');
    }
  };

  const fetchSchedules = async () => {
    setLoading(true);
    try {
      // Format dates as ISO strings for query using UTC to prevent timezone issues
      const startDate = formatDateString(viewingWeek[0]);
      const endDate = formatDateString(viewingWeek[6]);
      
      console.log(`Fetching schedules from ${startDate} to ${endDate}`);
      const response = await api.get(`/schedules/doctor?startDate=${startDate}&endDate=${endDate}`);
      
      if (response.data.success) {
        // Process schedule data to populate room information
        const processedSchedules = response.data.data || [];
        
        // Set the default selected date if not already set
        if (!selectedDate && processedSchedules.length > 0) {
          // Check for today's schedule first
          const today = new Date();
          const utcToday = new Date(Date.UTC(
            today.getFullYear(),
            today.getMonth(),
            today.getDate(),
            12, 0, 0
          ));
          const todayString = utcToday.toISOString().split('T')[0];
          
          const todaySchedule = processedSchedules.find(
            schedule => {
              const scheduleDate = new Date(schedule.date);
              const utcScheduleDate = new Date(Date.UTC(
                scheduleDate.getFullYear(),
                scheduleDate.getMonth(),
                scheduleDate.getDate(),
                12, 0, 0
              ));
              return utcScheduleDate.toISOString().split('T')[0] === todayString;
            }
          );
          
          if (todaySchedule) {
            setSelectedDate(todayString);
          } else if (processedSchedules.length > 0) {
            // Get the nearest date if no schedule today
            const firstScheduleDate = new Date(processedSchedules[0].date);
            const utcFirstScheduleDate = new Date(Date.UTC(
              firstScheduleDate.getFullYear(),
              firstScheduleDate.getMonth(),
              firstScheduleDate.getDate(),
              12, 0, 0
            ));
            setSelectedDate(utcFirstScheduleDate.toISOString().split('T')[0]);
          }
        }
        
        setSchedules(processedSchedules);
      } else {
        setError(response.data.message || 'Không thể tải lịch làm việc');
      }
    } catch (err) {
      console.error('Error fetching schedules:', err.response?.data || err.message);
      setError('Đã xảy ra lỗi khi tải lịch làm việc');
    } finally {
      setLoading(false);
    }
  };

  const fetchRooms = async (hospitalId) => {
    if (!hospitalId) {
      console.error('Cannot fetch rooms: No hospital ID provided');
      return;
    }
    
    try {
      console.log(`Fetching rooms for hospital ID: ${hospitalId}`);
      const response = await api.get(`/schedules/rooms/hospital/${hospitalId}`);
      
      if (response.data.success) {
        const roomsData = response.data.data || [];
        console.log(`Successfully fetched ${roomsData.length} rooms`);
        setRooms(roomsData);
      } else {
        console.error('Failed to fetch rooms:', response.data.message);
        toast.error('Không thể tải danh sách phòng khám');
      }
    } catch (err) {
      console.error('Error fetching rooms:', err.response?.data || err.message);
      toast.error('Đã xảy ra lỗi khi tải danh sách phòng khám');
    }
  };

  // Generate dates for current week view
  function getWeekDates(date = new Date()) {
    // Create a copy of the date to avoid modifying the original
    const currentDate = new Date(date);
    
    // Get the day of the week (0-6, 0 is Sunday)
    const day = currentDate.getDay();
    
    // Calculate the date of Monday
    const diff = currentDate.getDate() - day + (day === 0 ? -6 : 1); // adjust when day is Sunday
    
    // Create a new Date for Monday
    const monday = new Date(currentDate.setDate(diff));
    monday.setHours(0, 0, 0, 0);
    
    const weekDates = [];
    for (let i = 0; i < 7; i++) {
      // Create a standardized UTC date to ensure consistent date handling
      const nextDate = new Date(monday);
      nextDate.setDate(monday.getDate() + i);
      
      // Create a standardized UTC date to prevent timezone issues
      const utcDate = new Date(Date.UTC(
        nextDate.getFullYear(),
        nextDate.getMonth(),
        nextDate.getDate(),
        12, 0, 0
      ));
      
      weekDates.push(utcDate);
    }
    
    return weekDates;
  }

  // Navigate to previous week
  const goToPreviousWeek = () => {
    const prevWeekDate = new Date(viewingWeek[0]);
    prevWeekDate.setDate(prevWeekDate.getDate() - 7);
    setViewingWeek(getWeekDates(prevWeekDate));
  };

  // Navigate to next week
  const goToNextWeek = () => {
    const nextWeekDate = new Date(viewingWeek[0]);
    nextWeekDate.setDate(nextWeekDate.getDate() + 7);
    setViewingWeek(getWeekDates(nextWeekDate));
  };

  // Navigate to current week
  const goToCurrentWeek = () => {
    setViewingWeek(getWeekDates(new Date()));
  };

  // Format date for display
  const formatDate = (date) => {
    // Create a standardized UTC date to prevent timezone issues
    const utcDate = new Date(Date.UTC(
      date.getFullYear(),
      date.getMonth(),
      date.getDate(),
      12, 0, 0
    ));
    
    return utcDate.toLocaleDateString('vi-VN', { year: 'numeric', month: 'numeric', day: 'numeric' });
  };

  // Format short day name
  const formatDay = (date) => {
    // Create a standardized UTC date to prevent timezone issues
    const utcDate = new Date(Date.UTC(
      date.getFullYear(),
      date.getMonth(),
      date.getDate(),
      12, 0, 0
    ));
    
    return utcDate.toLocaleDateString('vi-VN', { weekday: 'short' });
  };

  // Format month name
  const formatMonth = (date) => {
    // Create a standardized UTC date to prevent timezone issues
    const utcDate = new Date(Date.UTC(
      date.getFullYear(),
      date.getMonth(),
      date.getDate(),
      12, 0, 0
    ));
    
    return utcDate.toLocaleDateString('vi-VN', { month: 'long', year: 'numeric' });
  };

  // Format time for display
  const formatTime = (timeString) => {
    return timeString ? timeString.substring(0, 5) : '';
  };

  // Check if date is today
  const isToday = (date) => {
    const today = new Date();
    
    // Create UTC dates for consistent comparison
    const utcToday = new Date(Date.UTC(
      today.getFullYear(),
      today.getMonth(),
      today.getDate(), 
      12, 0, 0
    ));
    
    const utcDate = new Date(Date.UTC(
      date.getFullYear(),
      date.getMonth(),
      date.getDate(),
      12, 0, 0
    ));
    
    return utcDate.getTime() === utcToday.getTime();
  };

  // Format date to YYYY-MM-DD string
  const formatDateString = (date) => {
    // Create a standardized UTC date to prevent timezone issues
    const utcDate = new Date(Date.UTC(
      date.getFullYear(),
      date.getMonth(),
      date.getDate(),
      12, 0, 0
    ));
    
    return utcDate.toISOString().split('T')[0];
  };

  // Check if a date is in the past
  const isPastDate = (date) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // Create UTC dates for consistent comparison
    const utcToday = new Date(Date.UTC(
      today.getFullYear(),
      today.getMonth(),
      today.getDate(), 
      12, 0, 0
    ));
    
    const utcDate = new Date(Date.UTC(
      date.getFullYear(),
      date.getMonth(),
      date.getDate(),
      12, 0, 0
    ));
    
    return utcDate < utcToday;
  };

  // Get schedules for a specific date
  const getSchedulesForDate = (date) => {
    const formattedDate = formatDateString(date);
    return schedules.filter(schedule => {
      const scheduleDate = new Date(schedule.date);
      
      // Create standardized UTC date for consistent comparison
      const utcScheduleDate = new Date(Date.UTC(
        scheduleDate.getFullYear(),
        scheduleDate.getMonth(),
        scheduleDate.getDate(),
        12, 0, 0
      ));
      
      return formatDateString(utcScheduleDate) === formattedDate;
    });
  };

  // Count booked time slots in a schedule
  const countBookedTimeSlots = (schedule) => {
    if (!schedule.timeSlots) return 0;
    return schedule.timeSlots.filter(slot => slot.isBooked).length;
  };

  // Calculate availability percentage for a schedule
  const getAvailabilityPercentage = (schedule) => {
    if (!schedule.timeSlots || schedule.timeSlots.length === 0) return 0;
    const bookedSlots = countBookedTimeSlots(schedule);
    return 100 - Math.round((bookedSlots / schedule.timeSlots.length) * 100);
  };

  // Render the availability indicator
  const renderAvailability = (schedule) => {
    const percentage = getAvailabilityPercentage(schedule);
    const totalSlots = schedule.timeSlots?.length || 0;
    const bookedSlots = countBookedTimeSlots(schedule);
    let className = 'availability ';
    
    if (percentage > 60) {
      className += 'high';
    } else if (percentage > 30) {
      className += 'medium';
    } else {
      className += 'low';
    }
    
    return (
      <div className={className}>
        <div className="availability-bar" style={{ width: `${percentage}%` }}></div>
        <span>{totalSlots - bookedSlots}/{totalSlots} chỗ trống</span>
      </div>
    );
  };

  // Handle time slot input changes
  const handleTimeSlotChange = (index, field, value) => {
    const newTimeSlots = [...newSchedule.timeSlots];
    newTimeSlots[index] = {
      ...newTimeSlots[index],
      [field]: value
    };
    
    setNewSchedule({
      ...newSchedule,
      timeSlots: newTimeSlots
    });
  };

  // Add a new function to handle global room change
  const handleRoomChange = (roomId) => {
    setNewSchedule({
      ...newSchedule,
      roomId: roomId,
      // Update all time slots to use this room
      timeSlots: newSchedule.timeSlots.map(slot => ({
        ...slot,
        roomId: roomId
      }))
    });
  };

  // Add a new time slot to the form
  const addTimeSlot = () => {
    setNewSchedule({
      ...newSchedule,
      timeSlots: [
        ...newSchedule.timeSlots,
        { startTime: '', endTime: '', roomId: newSchedule.roomId || '' }
      ]
    });
  };

  // Remove a time slot from the form
  const removeTimeSlot = (index) => {
    if (newSchedule.timeSlots.length <= 1) {
      return; // Keep at least one time slot
    }
    
    const newTimeSlots = [...newSchedule.timeSlots];
    newTimeSlots.splice(index, 1);
    
    setNewSchedule({
      ...newSchedule,
      timeSlots: newTimeSlots
    });
  };

  // Handle adding a new schedule
  const handleAddSchedule = async () => {
    setFormErrors({});
    setIsSubmitting(true);
    
    try {
      const validationErrors = validateScheduleForm();
      if (Object.keys(validationErrors).length > 0) {
        setFormErrors(validationErrors);
        toast.error('Vui lòng điền đầy đủ thông tin và sửa các lỗi');
        return;
      }
      
      const formattedTimeSlots = newSchedule.timeSlots.map(slot => ({
        startTime: slot.startTime,
        endTime: slot.endTime,
        roomId: newSchedule.roomId
      }));
      
      const payload = {
        date: formatDateString(new Date(newSchedule.date)),
        timeSlots: formattedTimeSlots,
        roomId: newSchedule.roomId,
        hospitalId: hospitalId
      };
      
      console.log('Saving schedule:', payload);
      const response = await api.post('/schedules/doctor', payload);
      
      if (response.data.success) {
        toast.success('Thêm lịch trực thành công');
        setShowAddModal(false);
        // Reset form
        setNewSchedule({
          hospitalId: hospitalId,
          date: '',
          roomId: '',
          timeSlots: [{
            startTime: '',
            endTime: '',
            roomId: ''
          }]
        });
        // Fetch updated schedules
        fetchSchedules();
      } else {
        toast.error(response.data.message || "Không thể thêm lịch trực");
      }
    } catch (error) {
      console.error('Error adding schedule:', error);
      
      // Xử lý lỗi 409 Conflict từ API
      if (error.response && error.response.status === 409 && error.response.data.error === 'schedule_conflict') {
        const conflictData = error.response.data;
        const conflicts = conflictData.conflicts || [];
        
        // Phân loại xung đột
        const doctorConflicts = conflicts.filter(c => c.type === 'doctor_conflict');
        const roomConflicts = conflicts.filter(c => c.type === 'room_conflict');
        
        // Tạo thông báo lỗi chi tiết
        let errorMsg = 'Không thể tạo lịch làm việc do có xung đột: ';
        
        if (doctorConflicts.length > 0) {
          errorMsg += `${doctorConflicts.length} xung đột lịch bác sĩ`;
          if (roomConflicts.length > 0) errorMsg += ', ';
        }
        
        if (roomConflicts.length > 0) {
          errorMsg += `${roomConflicts.length} xung đột phòng khám`;
        }
        
        toast.error(errorMsg, { autoClose: 5000 });
        
        // Hiển thị chi tiết các xung đột (giới hạn 3 xung đột)
        const displayedConflicts = conflicts.slice(0, 3);
        displayedConflicts.forEach((conflict, index) => {
          setTimeout(() => {
            toast.warning(conflict.message, { autoClose: 4000 });
          }, 300 * (index + 1));
        });
        
        // Thông báo nếu còn nhiều xung đột khác
        if (conflicts.length > 3) {
          setTimeout(() => {
            toast.info(`Còn ${conflicts.length - 3} xung đột khác.`, { autoClose: 3000 });
          }, 1200);
        }
        
        // Hiển thị thông tin chi tiết về loại xung đột
        setFormErrors({
          conflicts: {
            message: 'Có xung đột lịch làm việc',
            details: conflictData.errorDetails
          }
        });
      } else {
        toast.error(error.response?.data?.message || 'Đã xảy ra lỗi khi thêm lịch trực');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle updating an existing schedule
  const handleUpdateSchedule = async () => {
    setFormErrors({});
    setIsSubmitting(true);
    
    try {
      const validationErrors = validateScheduleForm();
      if (Object.keys(validationErrors).length > 0) {
        setFormErrors(validationErrors);
        toast.error('Vui lòng điền đầy đủ thông tin và sửa các lỗi');
        return;
      }
      
      const formattedTimeSlots = editingSchedule.timeSlots.map(slot => ({
        startTime: slot.startTime,
        endTime: slot.endTime,
        roomId: editingSchedule.roomId
      }));
      
      const payload = {
        date: formatDateString(new Date(editingSchedule.date)),
        timeSlots: formattedTimeSlots,
        roomId: editingSchedule.roomId,
        isActive: editingSchedule.isActive
      };
      
      console.log('Updating schedule:', payload);
      const response = await api.put(`/schedules/${editingSchedule._id}/doctor`, payload);
      
      if (response.data.success) {
        toast.success('Cập nhật lịch trực thành công');
        setShowEditModal(false);
        setEditingSchedule(null);
        fetchSchedules();
      } else {
        toast.error(response.data.message || "Không thể cập nhật lịch trực");
      }
    } catch (error) {
      console.error('Error updating schedule:', error);
      
      // Xử lý lỗi 409 Conflict từ API
      if (error.response && error.response.status === 409 && error.response.data.error === 'schedule_conflict') {
        const conflictData = error.response.data;
        const conflicts = conflictData.conflicts || [];
        
        // Phân loại xung đột
        const doctorConflicts = conflicts.filter(c => c.type === 'doctor_conflict');
        const roomConflicts = conflicts.filter(c => c.type === 'room_conflict');
        
        // Tạo thông báo lỗi chi tiết
        let errorMsg = 'Không thể cập nhật lịch làm việc do có xung đột: ';
        
        if (doctorConflicts.length > 0) {
          errorMsg += `${doctorConflicts.length} xung đột lịch bác sĩ`;
          if (roomConflicts.length > 0) errorMsg += ', ';
        }
        
        if (roomConflicts.length > 0) {
          errorMsg += `${roomConflicts.length} xung đột phòng khám`;
        }
        
        toast.error(errorMsg, { autoClose: 5000 });
        
        // Hiển thị chi tiết các xung đột (giới hạn 3 xung đột)
        const displayedConflicts = conflicts.slice(0, 3);
        displayedConflicts.forEach((conflict, index) => {
          setTimeout(() => {
            toast.warning(conflict.message, { autoClose: 4000 });
          }, 300 * (index + 1));
        });
        
        // Thông báo nếu còn nhiều xung đột khác
        if (conflicts.length > 3) {
          setTimeout(() => {
            toast.info(`Còn ${conflicts.length - 3} xung đột khác.`, { autoClose: 3000 });
          }, 1200);
        }
        
        // Hiển thị thông tin chi tiết về loại xung đột
        setFormErrors({
          conflicts: {
            message: 'Có xung đột lịch làm việc',
            details: conflictData.errorDetails
          }
        });
      } else {
        toast.error(error.response?.data?.message || 'Đã xảy ra lỗi khi cập nhật lịch trực');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle deleting a schedule
  const handleDeleteSchedule = async (scheduleId) => {
    setProcessingAction(true);
    try {
      const response = await api.delete(`/schedules/${scheduleId}/doctor`);
      
      if (response.data.success) {
        toast.success('Xóa lịch trực thành công');
        fetchSchedules();
      } else {
        toast.error(response.data.message || "Không thể xóa lịch trực");
      }
    } catch (err) {
      console.error('Error deleting schedule:', err.response?.data || err.message);
      toast.error(err.response?.data?.message || 'Đã xảy ra lỗi khi xóa lịch trực');
    } finally {
      setProcessingAction(false);
    }
  };

  // Open edit modal
  const openEditModal = (schedule) => {
    // Deep copy the schedule for editing to avoid modifying the original data
    const editableSchedule = JSON.parse(JSON.stringify(schedule));
    
    // Format the date properly using UTC
    if (editableSchedule.date) {
      const scheduleDate = new Date(editableSchedule.date);
      const utcScheduleDate = new Date(Date.UTC(
        scheduleDate.getFullYear(),
        scheduleDate.getMonth(),
        scheduleDate.getDate(),
        12, 0, 0
      ));
      editableSchedule.date = utcScheduleDate;
    }
    
    // Find the room from timeSlots - use the first time slot that has a valid roomId
    let roomId = null;
    
    if (editableSchedule.timeSlots && editableSchedule.timeSlots.length > 0) {
      // Try to find the first time slot with a valid roomId
      for (const slot of editableSchedule.timeSlots) {
        if (slot.roomId) {
          // Normalize roomId - it might be an object or a string
          roomId = typeof slot.roomId === 'object' ? slot.roomId._id : slot.roomId;
          break;
        }
      }
    }
    
    // If no roomId found in time slots, use the schedule's roomId if available
    if (!roomId && editableSchedule.roomId) {
      roomId = typeof editableSchedule.roomId === 'object' ? 
        editableSchedule.roomId._id : editableSchedule.roomId;
    }
    
    // If still no roomId, use the first available room (fallback)
    if (!roomId && rooms.length > 0) {
      roomId = rooms[0]._id;
    }
    
    // Store the roomId at the schedule level
    editableSchedule.roomId = roomId;
    
    console.log('Extracted roomId for editing:', roomId);
    
    // Prepare the timeSlots data for editing
    if (editableSchedule.timeSlots) {
      // Process booked slots (keep their original roomId)
      const bookedSlots = editableSchedule.timeSlots
        .filter(slot => slot.isBooked)
        .map(slot => ({
          ...slot,
          startTime: formatTime(slot.startTime),
          endTime: formatTime(slot.endTime),
          // Ensure each booked slot has its original roomId
          roomId: (typeof slot.roomId === 'object' ? slot.roomId._id : slot.roomId) || roomId,
          isBooked: true
        }));
      
      // Process non-booked slots
      const editableTimeSlots = editableSchedule.timeSlots
        .filter(slot => !slot.isBooked)
        .map(slot => ({
          ...slot,
          startTime: formatTime(slot.startTime),
          endTime: formatTime(slot.endTime),
          // Set roomId from the schedule
          roomId: roomId,
          isBooked: false
        }));
        
      // Combine both sets of slots
      const allTimeSlots = [...bookedSlots, ...editableTimeSlots];
        
      // If no editable slots, add a new empty one
      if (editableTimeSlots.length === 0) {
        allTimeSlots.push({ 
          startTime: '', 
          endTime: '', 
          roomId: roomId,
          isBooked: false
        });
      }
        
      editableSchedule.timeSlots = allTimeSlots;
    }
    
    console.log('Opening edit modal with schedule:', editableSchedule);
    setEditingSchedule(editableSchedule);
    setShowEditModal(true);
  };

  // Handle editing time slot changes
  const handleEditTimeSlotChange = (index, field, value) => {
    if (!editingSchedule) return;
    
    const timeSlots = [...editingSchedule.timeSlots];
    timeSlots[index] = {
      ...timeSlots[index],
      [field]: value
    };
    
    setEditingSchedule({
      ...editingSchedule,
      timeSlots
    });
  };

  // Add a time slot to the editing form
  const addEditTimeSlot = () => {
    if (!editingSchedule) return;
    
    setEditingSchedule({
      ...editingSchedule,
      timeSlots: [
        ...editingSchedule.timeSlots,
        { 
          startTime: '', 
          endTime: '', 
          roomId: editingSchedule.roomId || '',
          isBooked: false
        }
      ]
    });
  };

  // Remove a time slot from the editing form
  const removeEditTimeSlot = (index) => {
    if (!editingSchedule || editingSchedule.timeSlots.length <= 1) return;
    
    const timeSlots = [...editingSchedule.timeSlots];
    timeSlots.splice(index, 1);
    
    setEditingSchedule({
      ...editingSchedule,
      timeSlots
    });
  };

  // Group schedules by date for the week view
  const schedulesByDate = viewingWeek.map(date => {
    const dateStr = formatDateString(date);
    const daySchedules = schedules.filter(s => {
      const scheduleDate = new Date(s.date);
      const utcScheduleDate = new Date(Date.UTC(
        scheduleDate.getFullYear(),
        scheduleDate.getMonth(),
        scheduleDate.getDate(),
        12, 0, 0
      ));
      return formatDateString(utcScheduleDate) === dateStr;
    });
    
    return {
      date,
      schedules: daySchedules
    };
  });

  // Function to add predefined time slots
  const addPredefinedTimeSlots = (slots, isEditing = false) => {
    if (isEditing && editingSchedule) {
      // For editing mode
      setEditingSchedule({
        ...editingSchedule,
        timeSlots: slots.map(slot => ({
          ...slot,
          roomId: editingSchedule.roomId || '',
          isBooked: false
        }))
      });
      toast.success(`Đã thêm ${slots.length} khung giờ`);
    } else {
      // For adding new schedule mode
      setNewSchedule({
        ...newSchedule,
        timeSlots: slots.map(slot => ({
          ...slot,
          roomId: newSchedule.roomId || ''
        }))
      });
      toast.success(`Đã thêm ${slots.length} khung giờ`);
    }
  };

  // Add a ConflictErrorMessage component to display in the form
  const ConflictErrorMessage = ({ conflicts }) => {
    if (!conflicts) return null;
    
    const details = conflicts.details;
    
    return (
      <div className="mb-4 p-4 bg-yellow-50 border-l-4 border-yellow-400 rounded-md">
        <div className="flex items-start">
          <FaExclamationTriangle className="h-5 w-5 text-yellow-600 mr-3 mt-0.5" />
          <div className="w-full">
            <h3 className="text-sm font-medium text-yellow-800 mb-2">{details?.title || 'Cảnh báo xung đột lịch làm việc'}</h3>
            <p className="text-sm text-yellow-700 mb-3">{details?.description || 'Phát hiện xung đột lịch làm việc'}</p>
            
            {details?.doctorConflictsCount > 0 && (
              <div className="mb-3">
                <h4 className="text-sm font-medium text-yellow-800 flex items-center mb-1">
                  <FaUserMd className="mr-1.5" /> {details.doctorConflictsCount} xung đột về lịch bác sĩ
                </h4>
              </div>
            )}
            
            {details?.roomConflictsCount > 0 && (
              <div className="mb-3">
                <h4 className="text-sm font-medium text-yellow-800 flex items-center mb-1">
                  <FaDoorOpen className="mr-1.5" /> {details.roomConflictsCount} xung đột về phòng khám
                </h4>
              </div>
            )}
            
            <div className="mt-3 pt-2 border-t border-yellow-200">
              <p className="text-xs text-yellow-600 italic">
                <FaInfoCircle className="inline mr-1" /> 
                Vui lòng điều chỉnh thời gian hoặc phòng khám để tránh xung đột trước khi lưu.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Validate the schedule form
  const validateScheduleForm = () => {
    const errors = {};
    
    // For adding new schedule
    if (showAddModal || !editingSchedule) {
      if (!newSchedule.date) {
        errors.date = 'Vui lòng chọn ngày làm việc';
      }
      
      if (!newSchedule.roomId) {
        errors.roomId = 'Vui lòng chọn phòng khám';
      }
      
      // Check timeSlots
      if (!newSchedule.timeSlots || newSchedule.timeSlots.length === 0) {
        errors.timeSlots = 'Vui lòng thêm ít nhất một khung giờ';
      } else {
        const invalidTimeSlots = newSchedule.timeSlots.some(slot => 
          !slot.startTime || !slot.endTime
        );
        
        if (invalidTimeSlots) {
          errors.timeSlots = 'Vui lòng điền đầy đủ thông tin thời gian';
        }
      }
    } 
    // For editing existing schedule
    else if (editingSchedule) {
      if (!editingSchedule.roomId) {
        errors.roomId = 'Vui lòng chọn phòng khám';
      }
      
      // Only validate non-booked slots
      const nonBookedSlots = editingSchedule.timeSlots.filter(slot => !slot.isBooked);
      
      if (nonBookedSlots.length > 0) {
        const invalidTimeSlots = nonBookedSlots.some(slot => 
          !slot.startTime || !slot.endTime
        );
        
        if (invalidTimeSlots) {
          errors.timeSlots = 'Vui lòng điền đầy đủ thông tin thời gian cho tất cả các khung giờ chưa được đặt';
        }
      }
    }
    
    return errors;
  };

  if (loading && schedules.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[70vh]">
        <div className="text-center">
          <div className="inline-block w-12 h-12 border-4 border-primary/30 border-l-primary rounded-full animate-spin mb-4"></div>
          <p className="text-gray-600">Đang tải lịch làm việc...</p>
        </div>
      </div>
    );
  }

  // Display loading error if any
  if (error) {
    return (
      <div className="bg-white rounded-xl shadow-sm p-8 text-center max-w-3xl mx-auto">
        <div className="text-red-500 text-5xl mb-4">
          <FaTimes className="mx-auto" />
        </div>
        <h2 className="text-2xl font-bold text-gray-800 mb-2">Đã xảy ra lỗi</h2>
        <p className="text-gray-600 mb-6">{error}</p>
        <button onClick={fetchSchedules} className="bg-primary hover:bg-primary-dark text-white px-4 py-2 rounded-lg transition-colors">
          Thử lại
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <div className="bg-gradient-to-r from-primary-dark to-primary p-6 text-white">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <h1 className="text-2xl font-bold flex items-center">
              <FaCalendarAlt className="mr-3" /> Quản lý lịch trực
            </h1>
            
            <button 
              className="inline-flex items-center gap-2 bg-white/20 hover:bg-white/30 px-4 py-2 rounded-lg transition-all duration-200 hover:shadow-lg"
              onClick={() => {
                setNewSchedule({
                  hospitalId: hospitalId,
                  date: selectedDate || new Date().toISOString().split('T')[0],
                  roomId: '',
                  timeSlots: [{
                    startTime: '',
                    endTime: '',
                    roomId: ''
                  }]
                });
                setShowAddModal(true);
              }}
            >
              <FaPlus /> Thêm lịch trực
            </button>
          </div>
        </div>
      </div>
      
      {/* Calendar Navigation */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div className="text-xl font-semibold text-gray-800">
              {formatMonth(viewingWeek[0])}
            </div>
            <div className="flex items-center space-x-2">
              <button 
                onClick={goToPreviousWeek} 
                className="p-2 rounded-lg border border-gray-300 hover:bg-gray-50 text-gray-700 transition-colors"
              >
                <FaAngleLeft />
              </button>
              
              <button
                onClick={goToCurrentWeek}
                className="py-2 px-4 rounded-lg border border-gray-300 hover:bg-gray-50 text-gray-700 transition-colors flex items-center"
              >
                <FaCalendarDay className="mr-2" /> Hôm nay
              </button>
              
              <button 
                onClick={goToNextWeek} 
                className="p-2 rounded-lg border border-gray-300 hover:bg-gray-50 text-gray-700 transition-colors"
              >
                <FaAngleRight />
              </button>
            </div>
          </div>
        </div>
        
        {/* Week Calendar */}
        <div className="grid grid-cols-7 border-b border-gray-200">
          {schedulesByDate.map(dayData => {
            const daySchedules = dayData.schedules;
            const isSelectedDay = selectedDate === formatDateString(dayData.date);
            const isPast = isPastDate(dayData.date);
            
            return (
              <div 
                key={dayData.date.toISOString()} 
                className={`relative border-r last:border-r-0 border-gray-200 min-h-[120px] cursor-pointer transition-all
                  ${isSelectedDay ? 'bg-blue-50' : isPast ? 'bg-gray-50' : 'hover:bg-gray-50'}`}
                onClick={() => setSelectedDate(formatDateString(dayData.date))}
              >
                <div className={`p-2 text-center ${isToday(dayData.date) 
                  ? 'bg-primary text-white' 
                  : 'border-b border-gray-200'}`}
                >
                  <div className="text-xs font-medium uppercase">{formatDay(dayData.date)}</div>
                  <div className={`text-xl ${isToday(dayData.date) ? 'font-bold' : 'font-medium text-gray-800'}`}>
                    {dayData.date.getDate()}
                  </div>
                </div>
                
                <div className="p-2">
                  {loading ? (
                    <div className="flex justify-center py-4">
                      <div className="w-5 h-5 border-2 border-primary/30 border-l-primary rounded-full animate-spin"></div>
                    </div>
                  ) : daySchedules.length > 0 ? (
                    <div className="space-y-1">
                      {daySchedules.map((schedule, idx) => (
                        <div 
                          key={idx} 
                          className={`text-xs p-1 rounded ${
                            schedule.isActive 
                              ? 'bg-blue-100 text-blue-800' 
                              : 'bg-gray-100 text-gray-600'
                          }`}
                        >
                          <div className="font-medium truncate">{schedule.timeSlots?.length || 0} slot</div>
                          <div className="flex items-center">
                            <FaHospital className="mr-1 text-xs" />
                            <span className="truncate">{schedule.hospitalId?.name || 'Bệnh viện'}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center h-full py-2 text-gray-400 text-xs">
                      <FaCalendarAlt className="mb-1" />
                      <span>Không có lịch</span>
                    </div>
                  )}
                </div>
                
                {/* Indicator for events count */}
                {daySchedules.length > 0 && (
                  <div className="absolute bottom-1 right-1">
                    <div className={`w-5 h-5 rounded-full flex items-center justify-center text-xs
                      ${daySchedules.length > 0 ? 'bg-primary text-white' : 'bg-gray-200 text-gray-600'}`}>
                      {daySchedules.length}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
      
      {/* Day Detail */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        {!selectedDate ? (
          <div className="p-8 text-center">
            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <FaCalendarAlt className="text-4xl text-gray-400" />
            </div>
            <h3 className="text-xl font-bold text-gray-800 mb-2">Chưa chọn ngày</h3>
            <p className="text-gray-600 mb-4">Vui lòng chọn một ngày để xem chi tiết lịch trực</p>
          </div>
        ) : loading ? (
          <div className="p-8 text-center">
            <div className="inline-block w-12 h-12 border-4 border-primary/30 border-l-primary rounded-full animate-spin mb-4"></div>
            <p className="text-gray-600">Đang tải lịch trực...</p>
          </div>
        ) : (
          <div>
            <div className="p-6">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
                <h3 className="text-xl font-semibold text-gray-800 flex items-center">
                  <FaCalendarDay className="mr-2 text-primary" />
                  Lịch trực ngày {formatDate(new Date(selectedDate))}
                </h3>
                <button 
                  className="inline-flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary-dark transition-colors shadow-sm hover:shadow"
                  onClick={() => {
                    setNewSchedule({
                      hospitalId: hospitalId,
                      date: selectedDate,
                      roomId: '',
                      timeSlots: [{
                        startTime: '',
                        endTime: '',
                        roomId: ''
                      }]
                    });
                    setShowAddModal(true);
                  }}
                >
                  <FaPlus /> Thêm lịch trực
                </button>
              </div>
              
              {getSchedulesForDate(new Date(selectedDate)).length === 0 ? (
                <div className="text-center py-12 bg-gray-50 rounded-lg border border-gray-200">
                  <FaCalendarAlt className="mx-auto text-4xl text-gray-300 mb-4" />
                  <p className="text-gray-600 mb-4">Không có lịch trực vào ngày này</p>
                  <button 
                    className="inline-flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary-dark transition-colors shadow-sm hover:shadow"
                    onClick={() => {
                      setNewSchedule({
                        ...newSchedule,
                        date: selectedDate,
                        hospitalId: hospitalId
                      });
                      setShowAddModal(true);
                    }}
                  >
                    <FaPlus /> Thêm lịch trực
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {getSchedulesForDate(new Date(selectedDate)).map((schedule) => (
                    <div 
                      key={schedule._id} 
                      className={`border rounded-xl overflow-hidden shadow-sm ${!schedule.isActive ? 'bg-gray-50 border-gray-200' : 'bg-white border-gray-200'}`}
                    >
                      <div className="p-4 flex items-center justify-between border-b border-gray-200">
                        <div>
                          {schedule.isActive ? (
                            <span className="inline-flex items-center gap-1 text-xs font-medium px-2.5 py-0.5 rounded-full bg-green-100 text-green-800">
                              <FaCheckCircle /> Hoạt động
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-xs font-medium px-2.5 py-0.5 rounded-full bg-red-100 text-red-800">
                              <FaExclamationCircle /> Không hoạt động
                            </span>
                          )}
                        </div>
                        <div className="flex items-center space-x-2">
                          <button 
                            className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-full transition-colors"
                            onClick={() => openEditModal(schedule)}
                            title="Chỉnh sửa"
                          >
                            <FaEdit className="text-lg" />
                          </button>
                          <button 
                            className={`p-1.5 ${
                              countBookedTimeSlots(schedule) > 0 
                                ? 'text-gray-400 cursor-not-allowed' 
                                : 'text-red-600 hover:bg-red-50'
                            } rounded-full transition-colors`}
                            onClick={() => {
                              if (countBookedTimeSlots(schedule) > 0) return;
                              if (window.confirm('Bạn có chắc chắn muốn xóa lịch trực này không?')) {
                                handleDeleteSchedule(schedule._id);
                              }
                            }}
                            disabled={countBookedTimeSlots(schedule) > 0}
                            title={countBookedTimeSlots(schedule) > 0 ? "Không thể xóa lịch đã có lịch hẹn" : "Xóa lịch trực"}
                          >
                            <FaTrashAlt className="text-lg" />
                          </button>
                        </div>
                      </div>
                      
                      {schedule.hospitalId && (
                        <div className="px-4 py-3 flex items-center text-gray-700 border-b border-gray-200 bg-gray-50">
                          <FaHospital className="mr-2 text-primary" />
                          <span className="font-medium">{schedule.hospitalId.name}</span>
                        </div>
                      )}
                      
                      <div className="p-4">
                        <h4 className="text-sm font-medium text-gray-700 mb-3">Khung giờ:</h4>
                        <div className="space-y-3">
                          {schedule.timeSlots && schedule.timeSlots.map((slot, index) => (
                            <div 
                              key={index} 
                              className={`p-3 rounded-lg border ${slot.isBooked 
                                ? 'bg-amber-50 border-amber-200' 
                                : 'bg-green-50 border-green-200'}`}
                            >
                              <div className="flex items-center text-gray-700 mb-2">
                                <FaClock className="mr-2 text-primary" /> 
                                <span className="font-medium">{formatTime(slot.startTime)} - {formatTime(slot.endTime)}</span>
                              </div>
                              
                              {slot.roomId && (
                                <div className="flex items-center text-gray-700 text-sm">
                                  <FaDoorOpen className="mr-2 text-primary" />
                                  {typeof slot.roomId === 'object' ? 
                                    `${slot.roomId.name} (P.${slot.roomId.number}, T.${slot.roomId.floor})` : 
                                    'Phòng: ' + slot.roomId}
                                </div>
                              )}
                              
                              <div className="mt-2 flex justify-end">
                                {slot.isBooked ? (
                                  <span className="inline-flex items-center gap-1 text-xs font-medium px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800">
                                    Đã đặt
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center gap-1 text-xs font-medium px-2.5 py-0.5 rounded-full bg-green-100 text-green-800">
                                    Còn trống
                                  </span>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                      
                      <div className="px-4 py-3 bg-gray-50 border-t border-gray-200">
                        <div className="flex items-center justify-between">
                          <div className="w-full">
                            <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                              <div 
                                className={`h-full ${
                                  getAvailabilityPercentage(schedule) > 60 
                                    ? 'bg-green-500' 
                                    : getAvailabilityPercentage(schedule) > 30 
                                      ? 'bg-yellow-500' 
                                      : 'bg-red-500'
                                }`} 
                                style={{ width: `${getAvailabilityPercentage(schedule)}%` }}
                              ></div>
                            </div>
                            <div className="mt-1 text-xs text-gray-600 text-right">
                              {schedule.timeSlots?.length - countBookedTimeSlots(schedule)}/{schedule.timeSlots?.length} chỗ trống
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
      
      {/* Add Schedule Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="border-b border-gray-200 px-6 py-4 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-800">Thêm lịch trực mới</h3>
              <button className="text-gray-500 hover:text-gray-700" onClick={() => setShowAddModal(false)}>
                <FaTimes className="text-xl" />
              </button>
            </div>
            
            {/* Display conflict errors if present */}
            {formErrors.conflicts && (
              <ConflictErrorMessage conflicts={formErrors.conflicts} />
            )}
            
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">Ngày làm việc <span className="text-red-500">*</span></label>
                <input 
                  type="date" 
                  value={newSchedule.date} 
                  onChange={(e) => setNewSchedule({...newSchedule, date: e.target.value})}
                  min={new Date().toISOString().split('T')[0]}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                />
              </div>
              
                    <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">Phòng khám <span className="text-red-500">*</span></label>
                      <select 
                    value={newSchedule.roomId}
                    onChange={(e) => handleRoomChange(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                  >
                    <option value="">Chọn phòng</option>
                    {rooms && rooms.length > 0 ? (
                      rooms.map(room => (
                        <option key={room._id} value={room._id}>
                          Phòng {room.number} - {room.name} (Tầng {room.floor})
                        </option>
                      ))
                    ) : (
                      <option value="" disabled>Không có phòng khám</option>
                    )}
                  </select>
                  {!newSchedule.roomId && (
                    <p className="text-xs text-gray-500">Vui lòng chọn phòng khám trước khi thêm khung giờ</p>
                  )}
                </div>
              </div>
              
              {/* Thêm các khung giờ có sẵn */}
              <div className="space-y-3">
                <label className="block text-sm font-medium text-gray-700">Khung giờ có sẵn</label>
                <div className="flex flex-wrap gap-2">
                  {commonTimeSlotGroups.map((group, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => addPredefinedTimeSlots(group.slots)}
                      className={`px-3 py-2 text-sm rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all ${
                        newSchedule.roomId ? 'bg-primary text-white hover:bg-primary-dark' : 'bg-gray-200 text-gray-500 cursor-not-allowed'
                      }`}
                      disabled={!newSchedule.roomId}
                    >
                      <FaCalendarCheck className="inline-block mr-1 mb-1" />
                      {group.name} ({group.slots.length} khung giờ)
                    </button>
                  ))}
                </div>
                <p className="text-xs text-gray-500">
                  Chọn một khung giờ có sẵn hoặc thêm từng khung giờ riêng lẻ bên dưới
                </p>
              </div>
              
              <div className="bg-white p-3 rounded-lg border border-green-200 mb-3">
                <div className="flex justify-between items-center mb-2">
                  <h4 className="font-medium text-green-800">Danh sách khung giờ ({newSchedule.timeSlots.length})</h4>
                  <div className="text-sm">
                    <span className="text-gray-500">Phòng: </span>
                    <span className="font-medium">
                      {newSchedule.roomId ? 
                        rooms.find(r => r._id === newSchedule.roomId)?.number ? 
                        `Phòng ${rooms.find(r => r._id === newSchedule.roomId)?.number} - ${rooms.find(r => r._id === newSchedule.roomId)?.name}` : 
                        'Đã chọn' : 
                        'Chưa chọn'
                      }
                    </span>
                  </div>
                </div>
                
                {newSchedule.timeSlots.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {newSchedule.timeSlots.map((slot, index) => (
                      <div key={index} className="p-3 bg-gray-50 rounded-lg border border-gray-200 relative">
                        <button
                          type="button"
                          onClick={() => removeTimeSlot(index)}
                          className="absolute top-1 right-1 p-1 text-red-500 hover:text-red-700 focus:outline-none"
                          title="Xóa khung giờ này"
                          disabled={newSchedule.timeSlots.length <= 1}
                        >
                          <FaTimes className="h-4 w-4" />
                        </button>
                        
                        <div className="text-xs font-medium text-gray-500 mb-1">Khung giờ #{index+1}</div>
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label htmlFor={`startTime-${index}`} className="block text-xs font-medium text-gray-700 mb-1">
                              Bắt đầu <span className="text-red-500">*</span>
                            </label>
                            <select
                              id={`startTime-${index}`}
                        value={slot.startTime} 
                        onChange={(e) => handleTimeSlotChange(index, 'startTime', e.target.value)}
                              className="w-full px-2 py-1 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-primary"
                              disabled={!newSchedule.roomId}
                      >
                        <option value="">Chọn giờ</option>
                        {timeSlotOptions.map(time => (
                                <option key={`start-${time}-${index}`} value={time}>
                            {time}
                          </option>
                        ))}
                      </select>
                    </div>
                          
                          <div>
                            <label htmlFor={`endTime-${index}`} className="block text-xs font-medium text-gray-700 mb-1">
                              Kết thúc <span className="text-red-500">*</span>
                            </label>
                      <select 
                              id={`endTime-${index}`}
                        value={slot.endTime} 
                        onChange={(e) => handleTimeSlotChange(index, 'endTime', e.target.value)}
                              className="w-full px-2 py-1 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-primary"
                              disabled={!newSchedule.roomId}
                      >
                        <option value="">Chọn giờ</option>
                        {timeSlotOptions
                          .filter(time => !slot.startTime || time > slot.startTime)
                          .map(time => (
                                  <option key={`end-${time}-${index}`} value={time}>
                              {time}
                            </option>
                          ))}
                      </select>
                    </div>
                  </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-gray-500 italic">Chưa có khung giờ nào được thêm</p>
                )}
                  </div>
                  
                    <button 
                      type="button" 
                className={`w-full mt-2 py-2 px-4 rounded-md flex items-center justify-center ${
                  newSchedule.roomId ? 'bg-blue-50 text-blue-600 hover:bg-blue-100' : 'bg-gray-100 text-gray-500 cursor-not-allowed'
                } transition-colors`}
                onClick={addTimeSlot}
                disabled={!newSchedule.roomId}
              >
                <FaPlus className="mr-2" /> Thêm khung giờ đơn lẻ
              </button>
            </div>
            
            <div className="border-t border-gray-200 px-6 py-4 flex justify-end space-x-3">
              <button 
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors flex items-center"
                onClick={() => setShowAddModal(false)}
                disabled={processingAction}
              >
                <FaTimes className="mr-2" /> Hủy
              </button>
              <button 
                className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary-dark transition-colors shadow hover:shadow-md flex items-center"
                onClick={handleAddSchedule}
                disabled={processingAction || !newSchedule.roomId}
              >
                <FaSave className="mr-2" /> {processingAction ? 'Đang lưu...' : 'Lưu'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Schedule Modal */}
      {showEditModal && editingSchedule && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="border-b border-gray-200 px-6 py-4 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-800">Chỉnh sửa lịch trực</h3>
              <button className="text-gray-500 hover:text-gray-700" onClick={() => setShowEditModal(false)}>
                <FaTimes className="text-xl" />
              </button>
            </div>
            
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">Ngày làm việc</label>
                <input 
                  type="date" 
                  value={formatDateString(new Date(editingSchedule.date))}
                  disabled
                  className="w-full px-3 py-2 border border-gray-200 rounded-md bg-gray-100 text-gray-500 cursor-not-allowed"
                />
                  <p className="text-xs text-gray-500">Không thể thay đổi ngày làm việc</p>
                </div>
                
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">Phòng khám <span className="text-red-500">*</span></label>
                  <select 
                    value={editingSchedule.roomId || ''}
                    onChange={(e) => {
                      // Update roomId at the schedule level
                      setEditingSchedule({
                        ...editingSchedule, 
                        roomId: e.target.value,
                        // Update roomId for all non-booked time slots
                        timeSlots: editingSchedule.timeSlots.map(slot => 
                          slot.isBooked ? slot : { ...slot, roomId: e.target.value }
                        )
                      });
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                  >
                    <option value="">Chọn phòng</option>
                    {rooms && rooms.length > 0 ? (
                      rooms.map(room => (
                        <option key={room._id} value={room._id}>
                          Phòng {room.number} - {room.name} (Tầng {room.floor})
                        </option>
                      ))
                    ) : (
                      <option value="" disabled>Không có phòng khám</option>
                    )}
                  </select>
                  {!editingSchedule.roomId && (
                    <p className="text-xs text-red-500">Vui lòng chọn phòng khám trước khi lưu</p>
                  )}
                  {editingSchedule.timeSlots?.some(slot => slot.isBooked) && (
                    <p className="text-xs text-amber-500">
                      <FaInfoCircle className="inline mr-1" />
                      Lưu ý: Thay đổi phòng sẽ áp dụng cho tất cả các khung giờ chưa đặt.
                    </p>
                  )}
                </div>
              </div>
              
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">Trạng thái</label>
                <div className="flex items-center">
                  <label className="inline-flex items-center cursor-pointer">
                    <input 
                      type="checkbox" 
                      checked={editingSchedule.isActive}
                      onChange={(e) => setEditingSchedule({
                        ...editingSchedule, 
                        isActive: e.target.checked
                      })}
                      className="sr-only peer"
                    />
                    <div className="relative w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                    <span className="ml-3 text-sm font-medium text-gray-700">
                      {editingSchedule.isActive ? 'Hoạt động' : 'Không hoạt động'}
                    </span>
                  </label>
                </div>
              </div>
              
              {/* Thêm các khung giờ có sẵn */}
              {editingSchedule.timeSlots && editingSchedule.timeSlots.some(slot => !slot.isBooked) && (
                <div className="space-y-3">
                  <label className="block text-sm font-medium text-gray-700">Thêm khung giờ có sẵn</label>
                  <div className="flex flex-wrap gap-2">
                    {commonTimeSlotGroups.map((group, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => addPredefinedTimeSlots(group.slots, true)}
                        className="px-3 py-2 text-sm bg-primary text-white rounded-lg hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                      >
                        <FaCalendarCheck className="inline-block mr-1 mb-1" />
                        {group.name} ({group.slots.length} khung giờ)
                      </button>
                    ))}
                  </div>
                  <p className="text-xs text-gray-500">
                    Chú ý: Thêm khung giờ có sẵn sẽ thay thế các khung giờ hiện tại chưa được đặt
                  </p>
                </div>
              )}

              <div className="bg-white p-3 rounded-lg border border-green-200 mb-3">
                <div className="flex justify-between items-center mb-2">
                  <h4 className="font-medium text-green-800">Danh sách khung giờ ({editingSchedule.timeSlots?.length || 0})</h4>
                  <div className="text-sm">
                    <span className="text-gray-500">Phòng: </span>
                    <span className="font-medium">
                      {editingSchedule.roomId ? 
                        rooms.find(r => r._id === editingSchedule.roomId)?.number ? 
                        `Phòng ${rooms.find(r => r._id === editingSchedule.roomId)?.number}` : 
                        'Đã chọn' : 
                        'Không có'
                      }
                    </span>
                  </div>
                </div>
                
                {editingSchedule.timeSlots && editingSchedule.timeSlots.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {editingSchedule.timeSlots.map((slot, index) => (
                      <div 
                        key={index} 
                        className={`p-3 rounded-lg relative ${
                          slot.isBooked ? 'bg-amber-50 border border-amber-200' : 'bg-gray-50 border border-gray-200'
                        }`}
                      >
                        {!slot.isBooked && editingSchedule.timeSlots.filter(s => !s.isBooked).length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeEditTimeSlot(index)}
                            className="absolute top-1 right-1 p-1 text-red-500 hover:text-red-700 focus:outline-none"
                            title="Xóa khung giờ này"
                          >
                            <FaTimes className="h-4 w-4" />
                          </button>
                        )}
                        
                        <div className="flex items-center mb-1">
                          <span className="text-xs font-medium text-gray-500">Khung giờ #{index+1}</span>
                          {slot.isBooked && (
                            <span className="ml-2 text-xs bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded-full text-[10px]">
                              Đã đặt
                            </span>
                          )}
                        </div>
                        
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label htmlFor={`edit-startTime-${index}`} className="block text-xs font-medium text-gray-700 mb-1">
                              Bắt đầu <span className="text-red-500">*</span>
                            </label>
                      <select 
                              id={`edit-startTime-${index}`}
                        value={slot.startTime} 
                        onChange={(e) => handleEditTimeSlotChange(index, 'startTime', e.target.value)}
                        disabled={slot.isBooked}
                              className={`w-full px-2 py-1 text-sm border rounded-lg ${
                                slot.isBooked ? 'bg-gray-100 border-gray-200 text-gray-500 cursor-not-allowed' : 
                                'border-gray-300 focus:outline-none focus:ring-1 focus:ring-primary'
                              }`}
                      >
                        <option value="">Chọn giờ</option>
                        {timeSlotOptions.map(time => (
                                <option key={`edit-start-${time}-${index}`} value={time}>
                            {time}
                          </option>
                        ))}
                      </select>
                    </div>
                          
                          <div>
                            <label htmlFor={`edit-endTime-${index}`} className="block text-xs font-medium text-gray-700 mb-1">
                              Kết thúc <span className="text-red-500">*</span>
                            </label>
                      <select 
                              id={`edit-endTime-${index}`}
                        value={slot.endTime} 
                        onChange={(e) => handleEditTimeSlotChange(index, 'endTime', e.target.value)}
                        disabled={slot.isBooked}
                              className={`w-full px-2 py-1 text-sm border rounded-lg ${
                                slot.isBooked ? 'bg-gray-100 border-gray-200 text-gray-500 cursor-not-allowed' : 
                                'border-gray-300 focus:outline-none focus:ring-1 focus:ring-primary'
                              }`}
                      >
                        <option value="">Chọn giờ</option>
                        {timeSlotOptions
                          .filter(time => !slot.startTime || time > slot.startTime)
                          .map(time => (
                                  <option key={`edit-end-${time}-${index}`} value={time}>
                              {time}
                            </option>
                          ))}
                      </select>
                    </div>
                  </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-gray-500 italic">Chưa có khung giờ nào được thêm</p>
                )}
                  </div>
              
              <button 
                type="button" 
                className="w-full mt-2 py-2 px-4 bg-blue-50 text-blue-600 rounded-md hover:bg-blue-100 transition-colors flex items-center justify-center"
                onClick={addEditTimeSlot}
              >
                <FaPlus className="mr-2" /> Thêm khung giờ
              </button>
            </div>
            
            <div className="border-t border-gray-200 px-6 py-4 flex justify-end space-x-3">
              <button 
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors flex items-center"
                onClick={() => setShowEditModal(false)}
                disabled={processingAction}
              >
                <FaTimes className="mr-2" /> Hủy
              </button>
              <button 
                className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary-dark transition-colors shadow hover:shadow-md flex items-center"
                onClick={handleUpdateSchedule}
                disabled={processingAction}
              >
                <FaSave className="mr-2" /> {processingAction ? 'Đang lưu...' : 'Lưu'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Schedule; 
