import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import api from '../../utils/api';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { toast, ToastContainer } from 'react-toastify';

import { FaCalendarAlt, FaClock, FaHospital, FaUserMd, FaNotesMedical, FaFileMedical, 
         FaMoneyBillWave, FaExclamationTriangle, FaTimesCircle, FaCheckCircle, 
         FaCalendarCheck, FaPrint, FaFileDownload, FaStar, FaEye, FaRedo, FaInfoCircle, FaQuestion, FaCheck, FaCheckDouble, FaTimes, FaRegCalendarCheck, FaExchangeAlt, FaAngleLeft, FaAngleRight, FaDoorOpen } from 'react-icons/fa';
import { FaPaypal } from 'react-icons/fa';
import CancelAppointmentModal from '../../components/shared/CancelAppointmentModal';

import { Tab } from 'react-bootstrap';
import { Tabs as BoostrapTabs } from 'react-bootstrap';

// Add CSS for PayPal buttons
const paypalStyles = `
  .paypal-button-container {
    min-height: 40px;
    margin-top: 10px;
  }

  .paypal-button {
    height: 40px !important;
    width: 100% !important;
  }
`;

// Add MoMo button styles
const momoStyles = `
  .momo-button {
    background-color: #ae2070;
    color: white;
    border: none;
    border-radius: 4px;
    padding: 10px;
    font-weight: 500;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    width: 100%;
    margin-top: 8px;
    transition: background-color 0.3s;
  }
  
  .momo-button:hover {
    background-color: #8e1a5c;
  }
  
  .momo-icon {
    margin-right: 8px;
    width: 24px;
    height: 24px;
  }
`;

const Appointments = () => {
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('upcoming');
  const [showDetails, setShowDetails] = useState(null);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [cancellationReason, setCancellationReason] = useState('');
  const [cancelingAppointment, setCancelingAppointment] = useState(false);
  const [processingPayment, setProcessingPayment] = useState(false);
  const [processingMomoPayment, setProcessingMomoPayment] = useState(false);
  const paypalRef = React.useRef(null);
  const [paypalContainerRefs, setPaypalContainerRefs] = useState({});
  const [upcomingFilter, setUpcomingFilter] = useState('all');
  
  // Add pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [limit, setLimit] = useState(10);
  const [totalAppointments, setTotalAppointments] = useState(0);

  useEffect(() => {
    // Display success message from location state if available
    if (location.state?.success) {
      toast.success(location.state.message);
      if (location.state.roomInfo) {
        toast.info(location.state.roomInfo);
      }
      
      // Clear the state to prevent showing the message on page refresh
      window.history.replaceState({}, document.title);
    }
    
    fetchAppointments();
  }, [location, currentPage, limit, activeTab, upcomingFilter]);

  useEffect(() => {
    // Fix PayPal SDK loading to prevent 404 error
    if (!document.querySelector('script[src*="paypal"]')) {
      const script = document.createElement('script');
      // Use a fallback client ID that is verified to work
      const clientId = import.meta.env.VITE_PAYPAL_CLIENT_ID || 'sb';
      script.src = `https://www.paypal.com/sdk/js?client-id=${clientId}&currency=USD`;
      script.async = true;
      script.onload = () => {
        console.log('PayPal SDK loaded successfully');
        // Initialize PayPal buttons for existing appointments once SDK is loaded
        if (appointments.length > 0) {
          setTimeout(() => {
            appointments.forEach(appointment => {
              if ((appointment.paymentStatus === 'unpaid' || !appointment.paymentStatus || appointment.paymentStatus === 'pending') && 
                  (appointment.status === 'confirmed' || appointment.status === 'pending' || appointment.status === 'rescheduled') &&
                  appointment.totalAmount) {
                handlePayPalPayment(appointment._id, { totalAmount: appointment.totalAmount });
              }
            });
          }, 1000);
        }
      };
      script.onerror = (err) => console.error('PayPal SDK loading error:', err);
      document.body.appendChild(script);
      
      // Add styles for PayPal buttons
      const style = document.createElement('style');
      style.textContent = paypalStyles + momoStyles;
      document.head.appendChild(style);
    }
  }, []);

  // Function to handle MoMo payment
  const handleMomoPayment = async (appointmentId, { totalAmount }) => {
    try {
      setProcessingMomoPayment(true);
      
      // Call backend to create MoMo payment URL
      const response = await api.post('/payments/momo/create', {
        appointmentId,
        amount: totalAmount,
        orderInfo: `Thanh toán lịch hẹn khám bệnh #${appointmentId.substring(0, 8)}`,
        redirectUrl: `${window.location.origin}/payment/result`, // Frontend URL to handle redirect after payment
      });
      
      if (response.data.success && response.data.payUrl) {
        // Open the MoMo payment URL in a new tab
        window.open(response.data.payUrl, '_blank');
      } else {
        toast.error('Không thể khởi tạo thanh toán MoMo. Vui lòng thử lại sau.');
      }
    } catch (error) {
      console.error('Error creating MoMo payment:', error);
      toast.error('Đã xảy ra lỗi khi xử lý thanh toán qua MoMo.');
    } finally {
      setProcessingMomoPayment(false);
    }
  };

  const fetchAppointments = async () => {
    try {
      setLoading(true);
      
      // Add pagination and status filter parameters
      const params = {
        page: currentPage,
        limit: limit
      };
      
      // Add status filter if appropriate based on activeTab and upcomingFilter
      if (activeTab === 'upcoming') {
        if (upcomingFilter !== 'all') {
          params.status = upcomingFilter;
        }
      } else if (activeTab === 'completed') {
        params.status = 'completed';
      } else if (activeTab === 'cancelled') {
        params.status = 'cancelled';
      }
      
      console.log('Fetching appointments with params:', params);
      const res = await api.get('/appointments/user/patient', { params });
      
      // Thêm console.log để kiểm tra cấu trúc dữ liệu thực tế
      console.log('API response data:', res.data);
      
      if (res.data.success) {
        // Kiểm tra xem dữ liệu có đúng cấu trúc không
        const appointmentsData = res.data.appointments || res.data.data || [];
        
        // Set pagination data
        setTotalAppointments(res.data.total || 0);
        setTotalPages(res.data.totalPages || Math.ceil(res.data.total / limit) || 1);
        
        // Đảm bảo rằng appointmentsData là một mảng trước khi gọi sort
        if (Array.isArray(appointmentsData)) {
          const sortedAppointments = appointmentsData.sort((a, b) => {
            return new Date(b.appointmentDate) - new Date(a.appointmentDate);
          });
          
          setAppointments(sortedAppointments);
          
          // Render PayPal buttons for appointments that need payment
          setTimeout(() => {
            sortedAppointments.forEach(appointment => {
              if ((appointment.paymentStatus === 'unpaid' || !appointment.paymentStatus || appointment.paymentStatus === 'pending') && 
                  (appointment.status === 'confirmed' || appointment.status === 'pending' || appointment.status === 'rescheduled') &&
                  appointment.totalAmount) {
                handlePayPalPayment(appointment._id, { totalAmount: appointment.totalAmount });
              }
            });
          }, 1000); // Give time for containers to render
        } else {
          console.error('Appointments data is not an array:', appointmentsData);
          setAppointments([]);
        }
        setError(null);
      } else {
        setError('Không thể tải danh sách lịch hẹn');
      }
    } catch (err) {
      console.error('Error fetching appointments:', err);
      setError('Đã xảy ra lỗi khi tải danh sách lịch hẹn');
    } finally {
      setLoading(false);
    }
  };

  // Add a useEffect to initialize PayPal after appointments have loaded and DOM has updated
  useEffect(() => {
    // Initialize PayPal buttons after appointments have loaded
    if (!loading && appointments.length > 0) {
      appointments.forEach(appointment => {
        if ((appointment.paymentStatus === 'unpaid' || !appointment.paymentStatus || appointment.paymentStatus === 'pending') && 
            (appointment.status === 'confirmed' || appointment.status === 'pending' || appointment.status === 'rescheduled') &&
            appointment.totalAmount) {
          handlePayPalPayment(appointment._id, { totalAmount: appointment.totalAmount });
        }
      });
    }
  }, [loading, appointments, activeTab]);

  // Helper function to extract doctor name
  const getDoctorName = (appointment) => {
    if (appointment.doctorId) {
      if (typeof appointment.doctorId === 'object') {
        if (appointment.doctorId.user && typeof appointment.doctorId.user === 'object') {
          return appointment.doctorId.user.fullName || 'Không có tên';
        }
      }
    }
    return 'Không có thông tin';
  };

  // Helper function to extract hospital name
  const getHospitalName = (appointment) => {
    if (appointment.hospitalId) {
      if (typeof appointment.hospitalId === 'object') {
        return appointment.hospitalId.name || 'Không có tên';
      }
    }
    return 'Bệnh viện Đa khoa';
  };

  // Helper function to extract hospital address
  const getHospitalAddress = (appointment) => {
    if (appointment.hospitalId) {
      if (typeof appointment.hospitalId === 'object') {
        return appointment.hospitalId.address || 'Không có địa chỉ';
      }
    }
    return 'Không có thông tin';
  };

  // Helper function to extract service name
  const getServiceName = (appointment) => {
    if (appointment.serviceId) {
      if (typeof appointment.serviceId === 'object') {
        return appointment.serviceId.name || 'Không có tên';
      }
    }
    return 'Dịch vụ khám bệnh';
  };

  // Add a function to extract room information
  const getRoomInfo = (appointment) => {
    if (appointment.roomId) {
      if (typeof appointment.roomId === 'object') {
        return `${appointment.roomId.floor ? `Tầng ${appointment.roomId.floor}, ` : ''}${appointment.roomId.roomName || appointment.roomId.name || 'Phòng không xác định'}`;
      }
    }
    return 'Theo hướng dẫn tại bệnh viện';
  };

  // Add a function to extract specialty name
  const getSpecialtyName = (appointment) => {
    // Trường hợp 1: Có đối tượng doctorId chứa specialityId object
    if (appointment.doctorId && appointment.doctorId.specialtyId) {
      if (typeof appointment.doctorId.specialtyId === 'object' && appointment.doctorId.specialtyId.name) {
        return appointment.doctorId.specialtyId.name;
      }
    }
    
    // Trường hợp 2: Có đối tượng specialtyId trực tiếp trong appointment
    if (appointment.specialtyId) {
      if (typeof appointment.specialtyId === 'object' && appointment.specialtyId.name) {
        return appointment.specialtyId.name;
      }
      return appointment.specialtyId;
    }
    
    // Trường hợp 3: Có specialtyId trong doctorId
    if (appointment.doctorId && appointment.doctorId.specialtyId) {
      if (typeof appointment.doctorId.specialtyId === 'object' && appointment.doctorId.specialtyId.name) {
        return appointment.doctorId.specialtyId.name;
      }
      return appointment.doctorId.specialtyId;
    }
    
    // Nếu không tìm thấy thông tin chuyên khoa
    return '';
  };

  // Filter appointments based on activeTab
  const filteredAppointments = appointments.filter(appointment => {
    const appointmentDate = new Date(appointment.appointmentDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    if (activeTab === 'upcoming') {
      const isUpcoming = ['pending', 'rescheduled'].includes(appointment.status);
      
      // Áp dụng lọc trong tab "Sắp tới"
      if (upcomingFilter === 'pending') {
        return isUpcoming && appointment.status === 'pending';
      } else if (upcomingFilter === 'confirmed') {
        return appointment.status === 'confirmed';
      } else if (upcomingFilter === 'rescheduled') {
        return isUpcoming && appointment.status === 'rescheduled';
      } else {
        return isUpcoming || appointment.status === 'confirmed'; // Include confirmed in "all"
      }
    } else if (activeTab === 'completed') {
      return appointment.status === 'completed';
    } else if (activeTab === 'cancelled') {
      // Loại bỏ 'completed' khỏi danh sách trạng thái hiển thị trong tab "Đã hủy"
      return ['cancelled', 'rejected', 'no-show'].includes(appointment.status);
    }
    return true;
  });

  const getStatusLabel = (status, rescheduleCount) => {
    const warningCount = rescheduleCount && rescheduleCount > 0 ? (
      <span className="reschedule-count">{rescheduleCount}</span>
    ) : null;

    switch (status) {
      case 'confirmed':
        return (
          <div className="status-badge status-confirmed">
            <FaCheck className="status-icon" /> Xác nhận
            {warningCount}
          </div>
        );
      case 'completed':
        return (
          <div className="status-badge status-completed">
            <FaCheckDouble className="status-icon" /> Hoàn thành
          </div>
        );
      case 'cancelled':
        return (
          <div className="status-badge status-cancelled">
            <FaTimes className="status-icon" /> Đã hủy
          </div>
        );
      case 'rescheduled':
        return (
          <div className="status-badge status-rescheduled">
            <FaExchangeAlt className="status-icon" /> Đổi lịch {rescheduleCount > 0 ? rescheduleCount : ''}
          </div>
        );
      case 'pending':
        return (
          <div className="status-badge status-pending">
            <FaClock className="status-icon" /> Chờ xác nhận
          </div>
        );
      default:
        return (
          <div className="status-badge status-unknown">
            <FaQuestion className="status-icon" /> Không xác định
          </div>
        );
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    
    // Tạo đối tượng Date từ chuỗi ngày
    const date = new Date(dateString);
    
    // Điều chỉnh múi giờ bằng cách đặt giờ về giữa ngày UTC
    // Điều này đảm bảo ngày không bị thay đổi khi chuyển đổi múi giờ địa phương
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

  const formatTime = (timeString) => {
    return timeString || '';
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('vi-VN', { 
      style: 'currency', 
      currency: 'VND',
      maximumFractionDigits: 0
    }).format(price);
  };

  const openCancelModal = (appointment) => {
    setSelectedAppointment(appointment);
    setCancellationReason('');
    setShowCancelModal(true);
  };

  const handleCancelAppointment = async () => {
    if (!selectedAppointment) return;
    
    if (!cancellationReason.trim()) {
      toast.error('Vui lòng nhập lý do hủy lịch hẹn');
      return;
    }

    try {
      setCancelingAppointment(true);
      
      // In ra các thông tin để debug
      console.log('Đang hủy lịch hẹn:', selectedAppointment._id);
      console.log('Lý do:', cancellationReason);
      
      const response = await api.delete(`/appointments/${selectedAppointment._id}`, {
        data: { cancellationReason }
      });
      
      console.log('Phản hồi từ máy chủ:', response.data);
      
      // Sửa đoạn kiểm tra điều kiện thành công
      if (response.data.status === 'success' || response.data.success) {
        toast.success('Hủy lịch hẹn thành công');
        setShowCancelModal(false);
        
        // Cập nhật state trước khi tải lại dữ liệu
        const updatedAppointments = appointments.map(appointment => 
          appointment._id === selectedAppointment._id ? 
            { ...appointment, status: 'cancelled', cancellationReason } : 
            appointment
        );
        
        setAppointments(updatedAppointments);
        setActiveTab('cancelled');
        
        // Thay vì reload trang, chỉ cần fetch lại dữ liệu
        fetchAppointments();
      } else {
        toast.error(response.data.message || 'Không thể hủy lịch hẹn. Vui lòng thử lại sau.');
      }
    } catch (error) {
      console.error('Lỗi khi hủy lịch hẹn:', error);
      
      // Xử lý lỗi chi tiết hơn
      if (error.response) {
        // Máy chủ trả về lỗi với mã trạng thái
        console.error('Mã lỗi:', error.response.status);
        console.error('Dữ liệu lỗi:', error.response.data);
        toast.error(error.response.data.message || 'Không thể hủy lịch hẹn. Vui lòng thử lại sau.');
      } else if (error.request) {
        // Yêu cầu được gửi nhưng không nhận được phản hồi
        console.error('Không nhận được phản hồi từ máy chủ');
        toast.error('Không thể kết nối đến máy chủ. Vui lòng kiểm tra kết nối mạng.');
      } else {
        // Lỗi khác
        console.error('Lỗi:', error.message);
        toast.error('Đã xảy ra lỗi khi hủy lịch hẹn. Vui lòng thử lại sau.');
      }
    } finally {
      setCancelingAppointment(false);
    }
  };

  const handleReschedule = (appointment) => {
    const rescheduleCount = appointment.rescheduleCount || 0;
    
    if (rescheduleCount >= 2) {
      toast.error('Bạn đã sử dụng hết số lần đổi lịch cho cuộc hẹn này');
      return;
    }
    
    // Navigate to reschedule page
    navigate(`/appointments/${appointment._id}/reschedule`);
  };

  const toggleDetails = (id) => {
    setShowDetails(showDetails === id ? null : id);
  };

  const viewAppointmentDetails = (id) => {
    navigate(`/appointments/${id}`);
  };

  // Updated function to handle all payment statuses consistently
  const getPaymentStatusLabel = (appointment) => {
    const { paymentStatus, paymentMethod } = appointment;
    
    if (paymentStatus === 'completed') {
      // Payment method specific styling
      const methodStyles = {
        paypal: {
          bg: 'bg-blue-50',
          text: 'text-blue-700',
          pillBg: 'bg-blue-100',
          pillText: 'text-blue-800',
          icon: <svg className="w-3.5 h-3.5 mr-1" viewBox="0 0 24 24" fill="currentColor">
            <path d="M19.554 9.488c.121.563.106 1.246-.04 2.051-.582 2.978-2.477 4.466-5.683 4.466h-.442a.666.666 0 0 0-.444.166.72.72 0 0 0-.239.427l-.041.189-.553 3.479-.021.151a.706.706 0 0 1-.247.426.666.666 0 0 1-.447.166H8.874a.395.395 0 0 1-.331-.147.457.457 0 0 1-.09-.352c.061-.385.253-1.542.253-1.542l.483-3.049-.015.091s.255-1.556.311-1.93l.004-.024a.557.557 0 0 1 .227-.376.651.651 0 0 1 .438-.15h.924c1.626 0 2.807-.324 3.518-.984.472-.437.786-1.077.935-1.858a4.76 4.76 0 0 0 .046-1.118 2.81 2.81 0 0 0-.401-1.158c-.105-.167-.238-.324-.391-.475z" />
            <path d="M18.178 6.117c-.32-.45-.855-.815-1.56-1.053-.313-.103-.675-.189-1.09-.258-.42-.069-.901-.123-1.459-.156-.777-.053-1.423-.072-1.956-.072h-5.39c-.38 0-.691.14-.785.407-.284.772-.773 3.597-.862 4.093 0 0-.288 1.839-.327 2.075a.397.397 0 0 0 .095.336.391.391 0 0 0 .335.142h1.656c.152-.005.296-.054.405-.138a.598.598 0 0 0 .223-.329c.084-.3.16-.605.224-.883l.49-3.523.011-.074c.012-.058.028-.239.129-.364a.545.545 0 0 1 .357-.155h3.927c.587 0 1.1.017 1.549.052.449.035.84.091 1.178.167.339.078.631.173.88.284.249.112.456.243.625.393a2.54 2.54 0 0 1 .812 1.714 6.604 6.604 0 0 1-.064 1.456 12.737 12.737 0 0 1-.168.953 1.732 1.732 0 0 0-.524-.486 2.048 2.048 0 0 0-.712-.258 4.388 4.388 0 0 0-.87-.087h-3.019c-.379 0-.72.039-.979.116a1.546 1.546 0 0 0-.659.342 1.46 1.46 0 0 0-.37.524c-.87.212-.122.446-.148.697l-.141.879c-.036.225-.043.447-.032.661a1.1 1.1 0 0 0 .107.493c-.072.178 0 0 0 0 .092.162.204.296.35.406.145.109.325.192.544.252.219.058.487.089.784.089h.988c.34-.008.557-.028.736-.059.179-.032.347-.108.464-.166.116-.058.238-.149.326-.232.088-.082.172-.206.224-.302.051-.096.104-.238.143-.372.039-.135.074-.301.098-.488.023-.187.036-.411.041-.684.004-.273-.007-.577-.04-.925a11.018 11.018 0 0 0-.089-1.061c-.089.09-.24.183-.474.284-.233.101-.543.194-.945.284-.401.091-.874.166-1.431.232a13.423 13.423 0 0 1-1.87.1 10.766 10.766 0 0 1-2.148-.193 6.108 6.108 0 0 1-1.57-.533c-.421-.214-.755-.48-.997-.813-.241-.332-.399-.71-.483-1.128a4.036 4.036 0 0 1-.064-1.333c.05-.433.156-.82.32-1.189a3.547 3.547 0 0 1 .604-.945c.252-.282.563-.53.933-.736.371-.206.798-.368 1.277-.485a9.57 9.57 0 0 1 1.587-.239C7.994 4.963 8.85 4.95 9.834 4.95h4.726a9.045 9.045 0 0 1 1.587.135c.386.064.73.142 1.044.229.313.087.589.18.84.285.251.103.466.212.65.325.184.114.34.232.468.349.129.116.231.232.314.348.252.323.48.771.601 1.323.12.551.179 1.22.168 2.032a11.777 11.777 0 0 1-.104 1.577c-.06.51-.149 1.042-.268 1.614-.118.571-.268 1.174-.437 1.811l-.16.626c-.01.08-.031.172-.052.266-.021.093-.053.196-.082.299-.029.103-.068.217-.112.329a2.323 2.323 0 0 1-.155.335.903.903 0 0 1-.219.271.996.996 0 0 1-.4.192c-.28.065-.61.108-.996.128l-3.859.036a7.27 7.27 0 0 1-1.563-.141 5.97 5.97 0 0 1-.579-.171l-.018-.006a2.365 2.365 0 0 1-.336-.142 9.908 9.908 0 0 1-.322-.175l.043.268c.013.081.017.115.027.176.016.1.039.215.068.338.029.124.066.259.11.403a2.222 2.222 0 0 0 .168.407c.06.119.14.246.232.371a1.5 1.5 0 0 0 .343.329c.143.103.314.19.511.261.197.072.428.126.688.163.259.037.55.056.87.056h4.302c.365 0 .672-.028.919-.084.246-.057.472-.148.629-.274.158-.127.294-.294.365-.505.071-.21.115-.454.115-.731v-.431h.001v-.002l.032-.353c.007-.093.019-.211.031-.342.012-.13.028-.28.043-.438.016-.159.033-.335.051-.526l.047-.468c.081-.888.173-1.895.277-3.01.104-1.118.231-2.391.375-3.72.016-.15.03-.301.044-.453a.698.698 0 0 0-.195-.561 1.354 1.354 0 0 0-.463-.3 3.34 3.34 0 0 0-.701-.19 7.02 7.02 0 0 0-.906-.082h-4.716c-.75 0-1.456.018-2.151.054a6.57 6.57 0 0 0-.981.114H8.95z" />
          </svg>
        },
        momo: {
          bg: 'bg-pink-50',
          text: 'text-pink-700',
          pillBg: 'bg-pink-100',
          pillText: 'text-pink-800',
          icon: <svg className="w-3.5 h-3.5 mr-1" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2C6.477 2 2 6.477 2 12s4.477 10 10 10 10-4.477 10-10S17.523 2 12 2zm-1.24 14.862c-.456 0-.883-.186-1.197-.528a1.91 1.91 0 0 1-.487-1.284c0-.487.171-.93.487-1.285.314-.342.74-.528 1.198-.528.457 0 .883.186 1.197.528.316.355.488.798.488 1.285 0 .486-.172.93-.488 1.284-.314.342-.74.528-1.197.528zm2.688-6.698a4.097 4.097 0 0 0-.256-.468 2.022 2.022 0 0 0-.2-.257 4.425 4.425 0 0 0-.485-.485c-.243-.196-.498-.384-.842-.554-.344-.17-.73-.313-1.186-.428a6.02 6.02 0 0 0-1.387-.17c-.499 0-.997.056-1.484.17-.486.114-.923.285-1.295.485a3.711 3.711 0 0 0-.954.77c-.258.299-.47.627-.627.981a5.28 5.28 0 0 0-.37 1.142c-.085.412-.128.84-.128 1.284v3.966h2.366v-3.966c0-.313.028-.612.114-.882.086-.27.214-.512.385-.712.172-.2.387-.355.627-.469.243-.115.5-.171.784-.171.286 0 .556.056.784.17.228.115.428.27.599.47.17.2.3.427.399.712.1.27.142.57.142.882 0 .214-.014.428-.057.627-.028.2-.086.385-.157.556-.071.17-.157.313-.243.441a7.07 7.07 0 0 1-.242.356c.228.228.485.427.755.584.271.156.543.285.784.384.114-.142.228-.313.342-.485.1-.17.2-.355.271-.54.072-.187.143-.371.187-.57.085-.397.128-.798.128-1.199 0-.441-.043-.882-.13-1.284a4.402 4.402 0 0 0-.369-1.142 5.495 5.495 0 0 0-.27-.513z"/>
          </svg>
        },
        cash: {
          bg: 'bg-green-50',
          text: 'text-green-700',
          pillBg: 'bg-green-100',
          pillText: 'text-green-800',
          icon: <svg className="w-3.5 h-3.5 mr-1" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="2" y="6" width="20" height="12" rx="2" />
            <circle cx="12" cy="12" r="4" />
            <path d="M17 12h.01M7 12h.01" />
          </svg>
        }
      };
      
      // Get style based on payment method
      const style = methodStyles[paymentMethod] || methodStyles.cash;
      
      return (
        <div className="payment-badge payment-completed flex items-center">
          <div className={`flex items-center ${style.pillBg} ${style.pillText} px-2 py-1 rounded text-xs font-medium`}>
            <FaCheckCircle className="payment-icon mr-1" /> 
            <span>Đã thanh toán</span>
          </div>
          {paymentMethod && (
            <div className={`ml-1.5 flex items-center ${style.bg} ${style.text} px-2 py-0.5 rounded-full text-xs font-medium`}>
              {style.icon}
              {paymentMethod === 'paypal' ? 'PayPal' : paymentMethod === 'momo' ? 'MoMo' : 'Tiền mặt'}
            </div>
          )}
        </div>
      );
    } else if (paymentStatus === 'pending') {
      return (
        <div className="payment-badge payment-pending">
          <div className="bg-yellow-50 text-yellow-700 px-2 py-1 rounded text-xs font-medium flex items-center">
            <FaClock className="payment-icon mr-1" /> Chờ thanh toán
          </div>
        </div>
      );
    } else {
      return (
        <div className="payment-badge payment-unpaid">
          <div className="bg-gray-50 text-gray-700 px-2 py-1 rounded text-xs font-medium flex items-center">
            <FaMoneyBillWave className="payment-icon mr-1" /> Chưa thanh toán
          </div>
        </div>
      );
    }
  };

  // Improve the PayPal payment handler to be more robust
  const handlePayPalPayment = (appointmentId, fee) => {
    // If PayPal SDK is not loaded, log and exit
    if (!window.paypal) {
      console.log(`PayPal SDK not loaded yet for appointment ${appointmentId}, will try again when SDK loads`);
      return null;
    }
    
    // Verify fee information
    if (!fee || !fee.totalAmount) {
      console.error('No fee information available for appointment', appointmentId);
      return null;
    }
    
    // Get the container
    const container = document.getElementById(`paypal-button-${appointmentId}`);
    
    if (!container) {
      console.error(`Container for PayPal button not found: paypal-button-${appointmentId}`);
      return null;
    }
    
    // Clear existing buttons before rendering new ones
    while (container.firstChild) {
      container.removeChild(container.firstChild);
    }
    
    try {
      // Convert VND to USD (approximate rate, adjust as needed)
        const usdAmount = (fee.totalAmount / 24000).toFixed(2);
        
      console.log(`Rendering PayPal button for appointment ${appointmentId} with amount: ${usdAmount} USD (${fee.totalAmount} VND)`);
        
        window.paypal
          .Buttons({
            style: {
              layout: 'horizontal',
              color: 'blue',
              shape: 'rect',
            label: 'pay',
            height: 40
            },
            createOrder: (data, actions) => {
              return actions.order.create({
                purchase_units: [
                  {
                  description: `Thanh toán lịch hẹn khám bệnh #${appointmentId.substring(0, 8)}`,
                    amount: {
                      currency_code: 'USD',
                      value: usdAmount,
                    },
                  },
                ],
              });
            },
            onApprove: async (data, actions) => {
              try {
                setProcessingPayment(true);
                toast.info('Đang xử lý thanh toán, vui lòng đợi...');
                
                console.log('PayPal payment approved, capturing order:', data);
                const order = await actions.order.capture();
                console.log('PayPal payment successful, order details:', order);
                
                // Update payment status on the server
                try {
                  console.log('Sending payment confirmation to server with data:', {
                    appointmentId,
                    paymentId: order.id,
                  });
                  
                  const paymentResponse = await api.post('/payments/paypal/confirmed', {
                    appointmentId,
                    paymentId: order.id,
                    paymentDetails: order
                  });
                  
                  console.log('Server payment confirmation response:', paymentResponse.data);
                  
                  if (paymentResponse.data.success) {
                    toast.success('Thanh toán thành công!');
                    
                    // After successful payment, reload the page
                    setTimeout(() => {
                      window.location.reload();
                    }, 1000);
                  } else {
                    console.error('Server rejected payment:', paymentResponse.data);
                    toast.error(paymentResponse.data.message || 'Đã xảy ra lỗi khi xử lý thanh toán');
                  }
                } catch (apiError) {
                  console.error('API error during payment confirmation:', apiError);
                  
                  // If the server response indicates payment might still be successful
                  // despite the error (e.g., server timeout after processing)
                  const errorResponse = apiError.response?.data;
                  if (errorResponse && errorResponse.paymentProcessed) {
                    toast.warning('Thanh toán đã được xử lý nhưng có lỗi. Vui lòng kiểm tra trạng thái sau.');
                    setTimeout(() => {
                      window.location.reload();
                    }, 2000);
                  } else {
                    toast.error('Không thể xác nhận thanh toán với máy chủ. Vui lòng liên hệ hỗ trợ.');
                  }
                }
              } catch (error) {
                console.error('Error processing payment:', error);
                toast.error('Đã xảy ra lỗi khi xử lý thanh toán. Vui lòng thử lại hoặc chọn phương thức khác.');
              } finally {
                setProcessingPayment(false);
              }
            },
            onError: (err) => {
              console.error('PayPal button error:', err);
              toast.error('Đã xảy ra lỗi với cổng thanh toán PayPal. Vui lòng thử lại sau.');
              setProcessingPayment(false);
            },
            onCancel: () => {
              console.log('PayPal payment cancelled by user');
              toast.info('Bạn đã hủy thanh toán.');
              setProcessingPayment(false);
            }
          })
          .render(container)
          .catch(err => {
            console.error('PayPal render error:', err);
            toast.error('Không thể khởi tạo nút thanh toán PayPal');
            setProcessingPayment(false);
          });
        
      return true;
      } catch (error) {
        console.error('Error setting up PayPal button:', error);
      return false;
    }
  };

  // Add a manual payment trigger function for MoMo
  const manualInitiateMomoPayment = (appointmentId, totalAmount) => {
    handleMomoPayment(appointmentId, { totalAmount });
  };

  // Add a manual payment trigger function
  const manualInitiatePayment = (appointmentId, totalAmount) => {
    if (!window.paypal) {
      toast.info('Đang tải hệ thống thanh toán. Vui lòng thử lại sau vài giây.');
      return;
    }
    
    // Try to render PayPal button
    const success = handlePayPalPayment(appointmentId, { totalAmount });
    
    if (!success) {
      toast.error('Không thể khởi tạo cổng thanh toán. Vui lòng thử lại sau.');
    }
  };

  const renderAppointmentCard = (appointment) => {
    const statusColors = {
      pending: 'bg-yellow-100 text-yellow-800',
      confirmed: 'bg-green-100 text-green-800',
      completed: 'bg-blue-100 text-blue-800',
      cancelled: 'bg-red-100 text-red-800',
      rescheduled: 'bg-purple-100 text-purple-800',
      'no-show': 'bg-gray-100 text-gray-800'
    };

    const statusText = {
      pending: 'Chờ xác nhận',
      confirmed: 'Đã xác nhận',
      completed: 'Đã hoàn thành',
      cancelled: 'Đã hủy',
      rescheduled: 'Đã đổi lịch',
      'no-show': 'Không đến khám'
    };

    // Get the service name from either service object or serviceId object
    const serviceName = appointment.service?.name || 
                        (appointment.serviceId && typeof appointment.serviceId === 'object' ? 
                        appointment.serviceId.name : 'Dịch vụ khám bệnh');

    // Get doctor name considering different data structures
    const doctorName = appointment.doctor?.fullName || 
                      (appointment.doctorId && typeof appointment.doctorId === 'object' ? 
                      (appointment.doctorId.user?.fullName || appointment.doctorId.fullName) : 'Chưa chọn bác sĩ');

    // Get hospital name considering different data structures
    const hospitalName = appointment.hospital?.name || 
                        (appointment.hospitalId && typeof appointment.hospitalId === 'object' ? 
                        appointment.hospitalId.name : 'Chưa chọn cơ sở');

    // Get time from either time-related fields
    const startTime = appointment.startTime || (appointment.timeSlot?.startTime) || '';
    const endTime = appointment.endTime || (appointment.timeSlot?.endTime) || '';

    // Get total amount
    const totalAmount = appointment.totalAmount || 
                        (appointment.fee?.totalAmount) || null;

    return (
      <div className="bg-white rounded-xl shadow-sm hover:shadow-md transition-all p-5 border border-gray-100 mb-4">
        <div className="flex flex-col md:flex-row gap-4">
          {/* Left Side - Appointment Info */}
          <div className="flex-1">
            <div className="flex flex-wrap items-center gap-2 mb-3">
              <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${statusColors[appointment.status]}`}>
                {statusText[appointment.status]}
              </span>
              
              {appointment.bookingCode && (
                <>
                  <span className="text-gray-300">•</span>
                  <span className="text-sm text-gray-500">
                    Mã: {appointment.bookingCode}
                  </span>
                </>
              )}
              
              {appointment.createdAt && (
                <>
                  <span className="text-gray-300">•</span>
                  <span className="text-sm text-gray-500 flex items-center">
                    <FaRegCalendarCheck className="mr-1 text-gray-400" />
                    {formatDate(appointment.createdAt)}
                  </span>
                </>
              )}
            </div>
            
            <h3 className="font-semibold text-lg text-gray-800 mb-3">
              {serviceName}
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="flex items-center">
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary mr-3">
                  <FaUserMd />
                </div>
                <div>
                  <div className="text-sm text-gray-500">Bác sĩ</div>
                  <div className="font-medium">{doctorName}</div>
                </div>
              </div>
              
              <div className="flex items-center">
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary mr-3">
                  <FaHospital />
                </div>
                <div>
                  <div className="text-sm text-gray-500">Bệnh viện</div>
                  <div className="font-medium">{hospitalName}</div>
                </div>
              </div>
              
              <div className="flex items-center">
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary mr-3">
                  <FaCalendarAlt />
                </div>
                <div>
                  <div className="text-sm text-gray-500">Ngày khám</div>
                  <div className="font-medium">{formatDate(appointment.appointmentDate)}</div>
                </div>
              </div>
              
              <div className="flex items-center">
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary mr-3">
                  <FaClock />
                </div>
                <div>
                  <div className="text-sm text-gray-500">Thời gian</div>
                  <div className="font-medium">{startTime} - {endTime}</div>
                </div>
              </div>
              
              {appointment.queueNumber > 0 && (
                <div className="flex items-center">
                  <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 mr-3">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 11h.01M7 15h.01M11 7h6M11 11h6M11 15h6" />
                    </svg>
                  </div>
                  <div>
                    <div className="text-sm text-gray-500">Số thứ tự khám</div>
                    <div className="font-medium text-indigo-600">{appointment.queueNumber}</div>
                  </div>
                </div>
              )}
              
              {appointment.roomId && (
                <div className="flex items-center">
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary mr-3">
                    <FaDoorOpen />
                  </div>
                  <div>
                    <div className="text-sm text-gray-500">Phòng khám</div>
                    <div className="font-medium">{getRoomInfo(appointment)}</div>
                  </div>
                </div>
              )}
            </div>
          </div>
          
          {/* Right side - Price and Actions */}
          <div className="md:w-64 flex flex-col">
            {totalAmount && (
              <div className="mb-4">
                <div className="text-sm text-gray-500 mb-1">Tổng tiền</div>
                <div className="text-xl font-bold text-primary">
                  {formatPrice(totalAmount)}
                </div>
                
                {/* Payment status */}
                <div className="mt-1">
                  {getPaymentStatusLabel(appointment)}
                </div>
                
                {/* Display payment buttons only if not paid */}
                {(appointment.paymentStatus === 'unpaid' || !appointment.paymentStatus || appointment.paymentStatus === 'pending') && 
                  (appointment.status === 'confirmed' || appointment.status === 'pending' || appointment.status === 'rescheduled') && (
                  <div className="mt-2">
                    {/* PayPal button */}
                    <button 
                      onClick={() => manualInitiatePayment(appointment._id, totalAmount)}
                      className="w-full bg-blue-500 hover:bg-blue-600 text-white text-sm font-medium py-2 px-4 rounded-lg transition-colors flex items-center justify-center mb-2"
                      disabled={processingPayment || processingMomoPayment}
                    >
                      {processingPayment ? (
                        <>
                          <div className="w-4 h-4 mr-2 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                          Đang xử lý...
                        </>
                      ) : (
                        <>
                          <FaPaypal className="mr-2" /> Thanh toán qua PayPal
                        </>
                      )}
                    </button>
                    <div 
                      id={`paypal-button-${appointment._id}`} 
                      className="paypal-button-container"
                    ></div>
                    
                    {/* MoMo button */}
                    <button
                      onClick={() => manualInitiateMomoPayment(appointment._id, totalAmount)}
                      className="momo-button mt-2"
                      disabled={processingPayment || processingMomoPayment}
                    >
                      {processingMomoPayment ? (
                        <>
                          <div className="w-4 h-4 mr-2 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                          Đang xử lý...
                        </>
                      ) : (
                        <>
                          <img 
                            src="https://upload.wikimedia.org/wikipedia/vi/f/fe/MoMo_Logo.png" 
                            alt="MoMo Logo" 
                            className="momo-icon" 
                          />
                          Thanh toán qua MoMo
                        </>
                      )}
                    </button>
                  </div>
                )}
              </div>
            )}
            
            {/* Action buttons */}
            <div className="flex flex-col gap-2 mt-auto">
              <Link
                to={`/appointments/${appointment._id}`}
                className="bg-blue-500 hover:bg-blue-600 text-white text-sm font-medium py-2 px-4 rounded-lg transition-colors flex items-center justify-center"
              >
                <FaEye className="mr-2" /> Xem chi tiết
              </Link>
              
              {(appointment.status === 'pending' || appointment.status === 'rescheduled') && (
                <>
                  <button 
                    className={`text-sm font-medium py-2 px-4 rounded-lg transition-colors flex items-center justify-center ${
                      appointment.rescheduleCount >= 2 
                        ? 'bg-gray-200 text-gray-500 cursor-not-allowed' 
                        : 'bg-blue-100 text-blue-800 hover:bg-blue-200'
                    }`}
                    onClick={() => handleReschedule(appointment)}
                    disabled={appointment.rescheduleCount >= 2}
                  >
                    <FaCalendarAlt className="mr-2" /> Đổi lịch
                    {appointment.rescheduleCount >= 2 && ' (Đã hết lượt)'}
                  </button>
                  
                  <button 
                    className="bg-red-100 text-red-800 hover:bg-red-200 text-sm font-medium py-2 px-4 rounded-lg transition-colors flex items-center justify-center"
                    onClick={() => openCancelModal(appointment)}
                  >
                    <FaTimesCircle className="mr-2" /> Hủy lịch
                  </button>
                </>
              )}
              
              {appointment.status === 'completed' && !appointment.isReviewed && (
                <Link 
                  to={`/appointments/${appointment._id}/review`} 
                  className="bg-yellow-100 text-yellow-800 hover:bg-yellow-200 text-sm font-medium py-2 px-4 rounded-lg transition-colors flex items-center justify-center"
                >
                  <FaStar className="mr-2" /> Đánh giá
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="bg-gray-50 min-h-screen py-8">
      <div className="container mx-auto px-4">
        {/* Page Header */}
        <div className="mb-8 text-center md:text-left">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-800 mb-2">Lịch sử đặt khám</h1>
          <p className="text-gray-600">Xem và quản lý các cuộc hẹn khám bệnh của bạn</p>
        </div>

        {/* Tabs */}
        <div className="bg-white shadow-sm rounded-xl p-1 mb-6 inline-flex w-full md:w-auto">
          <button
            className={`px-5 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeTab === 'upcoming' 
                ? 'bg-primary text-white' 
                : 'text-gray-600 hover:text-primary'
            }`}
            onClick={() => {
              setActiveTab('upcoming');
              setCurrentPage(1);
            }}
          >
            Tất cả
          </button>
          <button
            className={`px-5 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeTab === 'completed' 
                ? 'bg-primary text-white' 
                : 'text-gray-600 hover:text-primary'
            }`}
            onClick={() => {
              setActiveTab('completed');
              setCurrentPage(1);
            }}
          >
            Đã hoàn thành
          </button>
          <button
            className={`px-5 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeTab === 'cancelled' 
                ? 'bg-primary text-white' 
                : 'text-gray-600 hover:text-primary'
            }`}
            onClick={() => {
              setActiveTab('cancelled');
              setCurrentPage(1);
            }}
          >
            Đã hủy
          </button>
        </div>

        {/* Sub-filters for upcoming tab */}
        {activeTab === 'upcoming' && (
          <div className="flex flex-wrap gap-2 mb-6">
            <button 
              className={`px-4 py-1.5 text-xs font-medium rounded-full transition-colors ${
                upcomingFilter === 'all' 
                  ? 'bg-blue-100 text-blue-800' 
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
              onClick={() => {
                setUpcomingFilter('all');
                setCurrentPage(1);
              }}
            >
              Tất cả
            </button>
            <button 
              className={`px-4 py-1.5 text-xs font-medium rounded-full transition-colors ${
                upcomingFilter === 'pending' 
                  ? 'bg-yellow-100 text-yellow-800' 
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
              onClick={() => {
                setUpcomingFilter('pending');
                setCurrentPage(1);
              }}
            >
              Chờ xác nhận
            </button>
            <button 
              className={`px-4 py-1.5 text-xs font-medium rounded-full transition-colors ${
                upcomingFilter === 'confirmed' 
                  ? 'bg-green-100 text-green-800' 
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
              onClick={() => {
                setUpcomingFilter('confirmed');
                setCurrentPage(1);
              }}
            >
              Đã xác nhận
            </button>
            <button 
              className={`px-4 py-1.5 text-xs font-medium rounded-full transition-colors ${
                upcomingFilter === 'rescheduled' 
                  ? 'bg-purple-100 text-purple-800' 
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
              onClick={() => {
                setUpcomingFilter('rescheduled');
                setCurrentPage(1);
              }}
            >
              Đã đổi lịch
            </button>
          </div>
        )}

        {/* Loading State */}
        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mb-4"></div>
            <p className="text-gray-600">Đang tải lịch hẹn...</p>
          </div>
        ) : error ? (
          <div className="bg-red-100 text-red-800 p-4 rounded-lg mb-6">
            <p className="font-medium">{error}</p>
          </div>
        ) : appointments.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm p-8 text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <FaCalendarAlt className="text-2xl text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-800 mb-2">Không có lịch hẹn</h3>
            <p className="text-gray-600 mb-6">
              {activeTab === 'upcoming' 
                ? `Bạn chưa có lịch hẹn nào ${upcomingFilter !== 'all' ? 
                    (upcomingFilter === 'pending' ? 'đang chờ xác nhận' : 
                     upcomingFilter === 'confirmed' ? 'đã xác nhận' : 'đã đổi lịch') 
                    : 'sắp tới'}` 
                : activeTab === 'completed' 
                  ? 'Bạn chưa có lịch hẹn nào đã hoàn thành.' 
                  : 'Bạn chưa có lịch hẹn nào đã hủy.'
              }
            </p>
            {activeTab === 'upcoming' && (
              <Link 
                to="/appointment" 
                className="bg-primary hover:bg-primary-dark text-white font-medium px-6 py-2 rounded-lg transition-colors inline-block"
              >
                Đặt lịch khám
              </Link>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {appointments.map((appointment) => (
              <div key={appointment._id}>
                {renderAppointmentCard(appointment)}
              </div>
            ))}
            
            {/* Pagination UI */}
            {totalPages > 1 && (
              <div className="flex justify-between items-center bg-white rounded-lg p-4 shadow-sm mt-6">
                <div className="text-sm text-gray-600">
                  Hiển thị <span className="font-medium">{appointments.length}</span> trên tổng số <span className="font-medium">{totalAppointments}</span> lịch hẹn
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                    disabled={currentPage === 1}
                    className={`flex items-center px-3 py-2 rounded-lg text-sm ${
                      currentPage === 1
                        ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                        : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    <FaAngleLeft className="mr-1.5" />
                    Trước
                  </button>
                  
                  <div className="flex items-center">
                    <span className="text-sm font-medium text-gray-700">Trang {currentPage} / {totalPages}</span>
                  </div>
                  
                  <button
                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                    disabled={currentPage === totalPages}
                    className={`flex items-center px-3 py-2 rounded-lg text-sm ${
                      currentPage === totalPages
                        ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                        : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    Sau
                    <FaAngleRight className="ml-1.5" />
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Cancel Appointment Modal */}
      {showCancelModal && selectedAppointment && (
        <CancelAppointmentModal
          appointment={selectedAppointment}
          cancellationReason={cancellationReason}
          setCancellationReason={setCancellationReason}
          onCancel={() => setShowCancelModal(false)}
          onConfirm={handleCancelAppointment}
          isProcessing={cancelingAppointment}
          formatDate={formatDate}
        />
      )}
    </div>
  );
};

export default Appointments; 
