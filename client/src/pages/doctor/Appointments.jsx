import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  FaCalendarAlt, FaFileAlt, FaFilter, FaSearch, 
  FaCheckCircle, FaTimesCircle, FaClipboardCheck, FaEye,
  FaClock, FaCheck, FaTimes, FaExchangeAlt,
  FaCalendarCheck, FaBan, FaUserClock, FaAngleRight,
  FaAngleLeft, FaRegCalendarCheck, FaListAlt, FaPlus
} from 'react-icons/fa';
import { toast, ToastContainer } from 'react-toastify';

import api from '../../utils/api';

const Appointments = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all');
  const [appointments, setAppointments] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredAppointments, setFilteredAppointments] = useState([]);
  const [statusFilter, setStatusFilter] = useState('all');
  const [isUpdating, setIsUpdating] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [rejectionReason, setRejectionReason] = useState('');
  const [showRejectionModal, setShowRejectionModal] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [error, setError] = useState(null);
  const [statusCounts, setStatusCounts] = useState({
    all: 0,
    pending: 0,
    confirmed: 0,
    completed: 0,
    cancelled: 0,
    rejected: 0,
    rescheduled: 0,
    'no-show': 0
  });
  const [showCompletionModal, setShowCompletionModal] = useState(false);
  const [completionData, setCompletionData] = useState({
    diagnosis: '',
    treatment: '',
    prescription: [],
    notes: ''
  });

  useEffect(() => {
    fetchAppointments();
    fetchStatusCounts();
  }, [activeTab, currentPage, statusFilter]);

  useEffect(() => {
    if (appointments && Array.isArray(appointments)) {
      applySearchFilter();
    }
  }, [appointments, searchTerm]);

  const fetchStatusCounts = async () => {
    try {
      console.log('Fetching appointment status counts...');
      const response = await api.get('/appointments/doctor/counts');
      console.log('Status counts response:', response.data);
      
      if (response.data.success && response.data.data) {
        const counts = response.data.data;
        setStatusCounts({
          all: counts.total || 0,
          pending: counts.pending || 0,
          confirmed: counts.confirmed || 0,
          completed: counts.completed || 0,
          cancelled: counts.cancelled || 0,
          rejected: counts.rejected || 0,
          rescheduled: counts.rescheduled || 0,
          'no-show': counts['no-show'] || 0
        });
      } else {
        console.error('Invalid counts response format:', response.data);
        // Set default counts
        setStatusCounts({
          all: 0,
          pending: 0,
          confirmed: 0,
          completed: 0,
          cancelled: 0,
          rejected: 0,
          rescheduled: 0,
          'no-show': 0
        });
      }
    } catch (error) {
      console.error('Lỗi khi tải số lượng lịch hẹn:', error.response?.data || error.message);
      // Set default counts on error
      setStatusCounts({
        all: 0,
        pending: 0,
        confirmed: 0,
        completed: 0,
        cancelled: 0,
        rejected: 0,
        rescheduled: 0,
        'no-show': 0
      });
    }
  };

  const fetchAppointments = async () => {
    setLoading(true);
    setError(null);
    try {
      let endpoint = '/appointments';
      let params = { page: currentPage, limit: 10 };
      
      if (activeTab === 'today') {
        endpoint = '/appointments/doctor/today';
      } else if (statusFilter !== 'all') {
        params.status = statusFilter;
      }

      console.log("Đang tải dữ liệu từ:", endpoint, params);
      const response = await api.get(endpoint, { params });
      console.log("Kết quả:", response.data);
      
      if (response.data.success) {
        const appointmentsData = response.data.data.docs || response.data.data || [];
        setAppointments(appointmentsData);
        
        const calculatedTotalPages = response.data.data.totalPages || 
                                   response.data.totalPages || 
                                   Math.ceil((response.data.data.total || response.data.total || 0) / params.limit) || 
                                   1;
        
        setTotalPages(calculatedTotalPages);
        console.log("Total pages set to:", calculatedTotalPages);
      } else {
        console.error("Lỗi API:", response.data.message);
        setError(response.data.message || "Không thể tải dữ liệu lịch hẹn");
      }
    } catch (error) {
      console.error('Lỗi khi tải lịch hẹn:', error.response?.data || error.message);
      setError("Đã xảy ra lỗi khi tải dữ liệu. Vui lòng thử lại sau.");
    } finally {
      setLoading(false);
    }
  };

  const applySearchFilter = () => {
    if (!appointments || !Array.isArray(appointments)) {
      setFilteredAppointments([]);
      return;
    }
    
    if (searchTerm.trim() === '') {
      setFilteredAppointments(appointments);
      return;
    }
    
    const searchTermLower = searchTerm.toLowerCase().trim();
    
    const filtered = appointments.filter(app => {
      // Tìm theo tên bệnh nhân
      const patientName = app.patientId?.fullName || '';
      if (patientName.toLowerCase().includes(searchTermLower)) return true;
      
      // Tìm theo mã lịch hẹn
      const bookingCode = app.bookingCode || '';
      if (bookingCode.toLowerCase().includes(searchTermLower)) return true;
      
      // Tìm theo dịch vụ
      const serviceName = app.serviceId?.name || '';
      if (serviceName.toLowerCase().includes(searchTermLower)) return true;
      
      return false;
    });
    
    setFilteredAppointments(filtered);
  };

  const handleStatusChange = async (appointmentId, newStatus, reason = '') => {
    setIsUpdating(true);
    try {
      let endpoint;
      let requestData = {};
      
      if (newStatus === 'confirmed') {
        endpoint = `/appointments/${appointmentId}/confirmed`;
      } else if (newStatus === 'rejected') {
        endpoint = `/appointments/${appointmentId}/reject`;
        requestData = { reason };
      } else if (newStatus === 'completed') {
        // Instead of redirecting, show the completion modal
        const appointment = appointments.find(app => app._id === appointmentId);
        if (appointment && appointment.patientId?._id) {
          setSelectedAppointment(appointment);
          setCompletionData({
            diagnosis: '',
            treatment: '',
            prescription: [],
            notes: ''
          });
          setShowCompletionModal(true);
          setIsUpdating(false);
          return;
        } else {
          toast.error('Không tìm thấy thông tin bệnh nhân');
          setIsUpdating(false);
          return;
        }
      }
      
      console.log("Gửi yêu cầu cập nhật:", endpoint, requestData);
      const response = await api.put(endpoint, requestData);
      console.log("Kết quả cập nhật:", response.data);
      
      if (response.data.success) {
        toast.success(`Cập nhật trạng thái lịch hẹn thành công!`);
        
        // Update local state
        setAppointments(prevAppointments => 
          prevAppointments.map(app => 
            app._id === appointmentId ? { ...app, status: newStatus } : app
          )
        );
        
        // Clear search term after a status change to show all appointments
        if (searchTerm) {
          setSearchTerm('');
        }
        
        // Refresh data from server
        fetchAppointments();
        fetchStatusCounts();
      } else {
        toast.error(`Cập nhật trạng thái thất bại: ${response.data.message || 'Lỗi không xác định'}`);
      }
    } catch (error) {
      console.error('Lỗi khi cập nhật trạng thái:', error.response?.data || error.message);
      toast.error('Đã xảy ra lỗi khi cập nhật trạng thái. Vui lòng thử lại sau.');
    } finally {
      setIsUpdating(false);
      setShowRejectionModal(false);
    }
  };

  const openRejectionModal = (appointment) => {
    setSelectedAppointment(appointment);
    setRejectionReason('');
    setShowRejectionModal(true);
  };

  const handleRejection = () => {
    if (selectedAppointment && rejectionReason.trim()) {
      handleStatusChange(selectedAppointment._id, 'rejected', rejectionReason);
    }
  };

  const viewMedicalRecord = (appointmentId, patientId) => {
    navigate(`/doctor/medical-records/${patientId}?appointmentId=${appointmentId}`);
  };

  const formatDateTime = (dateTimeStr) => {
    if (!dateTimeStr) return 'N/A';
    
    const date = new Date(dateTimeStr);
    
    return new Intl.DateTimeFormat('vi-VN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  const renderStatusBadge = (status) => {
    const statusClasses = {
      pending: "bg-yellow-100 text-yellow-800 border border-yellow-200",
      confirmed: "bg-blue-100 text-blue-800 border border-blue-200",
      completed: "bg-green-100 text-green-800 border border-green-200",
      cancelled: "bg-red-100 text-red-800 border border-red-200",
      rejected: "bg-red-100 text-red-800 border border-red-200",
      rescheduled: "bg-indigo-100 text-indigo-800 border border-indigo-200",
      'no-show': "bg-gray-100 text-gray-800 border border-gray-200"
    };
    
    const statusIcons = {
      pending: <FaClock className="mr-1.5" />,
      confirmed: <FaCheckCircle className="mr-1.5" />,
      completed: <FaClipboardCheck className="mr-1.5" />,
      cancelled: <FaTimesCircle className="mr-1.5" />,
      rejected: <FaTimesCircle className="mr-1.5" />,
      rescheduled: <FaExchangeAlt className="mr-1.5" />,
      'no-show': <FaBan className="mr-1.5" />
    };
    
    const statusText = {
      pending: "Chờ xác nhận",
      confirmed: "Đã xác nhận",
      completed: "Hoàn thành",
      cancelled: "Đã hủy",
      rejected: "Đã từ chối",
      rescheduled: "Đã đổi lịch",
      'no-show': "Không đến"
    };
    
    return (
      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${statusClasses[status] || "bg-gray-100 text-gray-800 border border-gray-200"}`}>
        {statusIcons[status]}
        <span>{statusText[status] || status}</span>
      </span>
    );
  };

  const handleStatusFilterChange = (e) => {
    const newStatus = e.target.value;
    setStatusFilter(newStatus);
    setCurrentPage(1); // Reset to first page when filter changes
  };

  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
  };

  const clearSearch = () => {
    setSearchTerm('');
  };

  const handleCompleteAppointment = async () => {
    if (!selectedAppointment) return;
    
    setIsUpdating(true);
    try {
      const response = await api.put(`/appointments/${selectedAppointment._id}/complete`, completionData);
      
      if (response.data.success) {
        toast.success('Lịch hẹn đã hoàn thành và hồ sơ y tế đã được tạo');
        setShowCompletionModal(false);
        
        // Update local state
        setAppointments(prevAppointments => 
          prevAppointments.map(app => 
            app._id === selectedAppointment._id ? { ...app, status: 'completed' } : app
          )
        );
        
        // Refresh data
        fetchAppointments();
        fetchStatusCounts();
      } else {
        toast.error(`Không thể hoàn thành lịch hẹn: ${response.data.message || 'Lỗi không xác định'}`);
      }
    } catch (error) {
      console.error('Lỗi khi hoàn thành lịch hẹn:', error.response?.data || error.message);
      toast.error(error.response?.data?.message || 'Lỗi khi hoàn thành lịch hẹn');
    } finally {
      setIsUpdating(false);
    }
  };

  const addMedication = () => {
    setCompletionData(prev => ({
      ...prev,
      prescription: [
        ...prev.prescription,
        { medicine: '', dosage: '', frequency: '', duration: '' }
      ]
    }));
  };

  const updateMedication = (index, field, value) => {
    setCompletionData(prev => {
      const updatedPrescription = [...prev.prescription];
      updatedPrescription[index] = {
        ...updatedPrescription[index],
        [field]: value
      };
      return {
        ...prev,
        prescription: updatedPrescription
      };
    });
  };

  const removeMedication = (index) => {
    setCompletionData(prev => ({
      ...prev,
      prescription: prev.prescription.filter((_, i) => i !== index)
    }));
  };

  const renderAppointmentsTable = () => {
    const displayAppointments = searchTerm ? filteredAppointments : appointments;
    
    if (loading) {
      return (
        <div className="flex justify-center items-center py-20">
          <div className="text-center">
            <div className="inline-block w-12 h-12 border-4 border-primary/30 border-l-primary rounded-full animate-spin mb-4"></div>
            <p className="text-gray-600">Đang tải danh sách lịch hẹn...</p>
          </div>
        </div>
      );
    }
    
    if (error) {
      return (
        <div className="bg-red-50 text-red-700 p-4 rounded-lg flex items-start mb-6">
          <FaTimesCircle className="text-lg mt-0.5 mr-2 flex-shrink-0" />
          <div>
            <h4 className="font-medium">Lỗi khi tải dữ liệu</h4>
            <p>{error}</p>
          </div>
        </div>
      );
    }
    
    if (!displayAppointments.length) {
      return (
        <div className="bg-white rounded-xl shadow-sm p-8 text-center">
          <div className="text-gray-400 text-5xl mb-4">
            <FaRegCalendarCheck className="mx-auto" />
          </div>
          <h3 className="text-xl font-medium text-gray-700 mb-2">Không tìm thấy lịch hẹn nào</h3>
          <p className="text-gray-500 mb-6">
            {searchTerm ? 
              `Không có kết quả phù hợp với từ khóa "${searchTerm}"` : 
              statusFilter !== 'all' ? 
                `Không có lịch hẹn nào với trạng thái "${statusFilter}"` : 
                'Không có lịch hẹn nào được tìm thấy'}
          </p>
          {searchTerm && (
            <button
              className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors"
              onClick={clearSearch}
            >
              Xóa tìm kiếm
            </button>
          )}
        </div>
      );
    }
    
    return (
      <div className="bg-white rounded-xl shadow-md hover:shadow-lg transition-shadow duration-300 overflow-hidden">
        <div className="overflow-x-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-4 sm:px-6 py-3.5 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Mã lịch hẹn
                </th>
                <th scope="col" className="px-4 sm:px-6 py-3.5 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Thông tin bệnh nhân
                </th>
                <th scope="col" className="px-4 sm:px-6 py-3.5 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Thời gian
                </th>
                <th scope="col" className="px-4 sm:px-6 py-3.5 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Dịch vụ
                </th>
                <th scope="col" className="px-4 sm:px-6 py-3.5 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Trạng thái
                </th>
                <th scope="col" className="px-4 sm:px-6 py-3.5 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Hành động
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {displayAppointments.map(appointment => (
                <tr key={appointment._id} className="hover:bg-blue-50 transition-all duration-150">
                  <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {appointment.bookingCode || 'N/A'}
                  </td>
                  <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="h-12 w-12 rounded-full bg-gray-200 flex items-center justify-center text-gray-500 flex-shrink-0 overflow-hidden border-2 border-white shadow-sm hover:shadow transition-all">
                        {appointment.patientId?.avatarUrl ? (
                          <img 
                            src={appointment.patientId.avatarUrl} 
                            alt={appointment.patientId.fullName}
                            className="h-12 w-12 rounded-full object-cover"
                            onError={(e) => {
                              e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(appointment.patientId.fullName || 'User')}&background=0D8ABC&color=fff`;
                            }}
                          />
                        ) : (
                          <img 
                            src={`https://ui-avatars.com/api/?name=${encodeURIComponent(appointment.patientId?.fullName || 'User')}&background=0D8ABC&color=fff&size=64`}
                            alt={appointment.patientId?.fullName || 'User'} 
                            className="h-12 w-12 rounded-full"
                          />
                        )}
                      </div>
                      <div className="ml-4 min-w-0">
                        <div className="text-sm font-medium text-gray-900 truncate">
                          {appointment.patientId?.fullName || 'N/A'}
                        </div>
                        <div className="text-sm text-gray-500 truncate">
                          {appointment.patientId?.phoneNumber || 'N/A'}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {new Date(appointment.appointmentDate).toLocaleDateString('vi-VN')}
                    </div>
                    <div className="text-sm text-gray-500">
                      {appointment.timeSlot?.startTime} - {appointment.timeSlot?.endTime}
                    </div>
                  </td>
                  <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {appointment.serviceId?.name || 'N/A'}
                    </div>
                    <div className="text-sm text-gray-500">
                      {appointment.specialtyId?.name}
                    </div>
                  </td>
                  <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                    {renderStatusBadge(appointment.status)}
                  </td>
                  <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <div className="flex space-x-2">
                      <Link 
                        to={`/doctor/appointments/${appointment._id}`}
                        className="inline-flex items-center px-2 py-1 bg-blue-50 text-blue-700 rounded hover:bg-blue-100 transition-colors"
                      >
                        <FaEye className="mr-1" />
                        Chi tiết
                      </Link>
                      
                      {appointment.status === 'pending' && (
                        <>
                          <button
                            onClick={() => handleStatusChange(appointment._id, 'confirmed')}
                            disabled={isUpdating}
                            className="inline-flex items-center px-2 py-1 bg-green-50 text-green-700 rounded hover:bg-green-100 transition-colors disabled:opacity-50"
                          >
                            <FaCheck className="mr-1" />
                            Xác nhận
                          </button>
                          <button
                            onClick={() => openRejectionModal(appointment)}
                            disabled={isUpdating}
                            className="inline-flex items-center px-2 py-1 bg-red-50 text-red-700 rounded hover:bg-red-100 transition-colors disabled:opacity-50"
                          >
                            <FaTimes className="mr-1" />
                            Từ chối
                          </button>
                        </>
                      )}
                      
                      {appointment.status === 'confirmed' && (
                        <button
                          onClick={() => handleStatusChange(appointment._id, 'completed')}
                          disabled={isUpdating}
                          className="inline-flex items-center px-2 py-1 bg-indigo-50 text-indigo-700 rounded hover:bg-indigo-100 transition-colors disabled:opacity-50"
                        >
                          <FaClipboardCheck className="mr-1" />
                          Hoàn thành
                        </button>
                      )}
                      
                      {appointment.status === 'completed' && (
                        <button
                          onClick={() => viewMedicalRecord(appointment._id, appointment.patientId._id)}
                          className="inline-flex items-center px-2 py-1 bg-purple-50 text-purple-700 rounded hover:bg-purple-100 transition-colors"
                        >
                          <FaFileAlt className="mr-1" />
                          Hồ sơ
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {/* Pagination */}
        {totalPages > 1 && (
          <div className="px-4 sm:px-6 py-4 bg-gray-50 border-t border-gray-200">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
              <div className="text-xs sm:text-sm text-gray-600 mb-3 sm:mb-0">
                Trang {currentPage} / {totalPages}
              </div>
              <div className="flex justify-center sm:justify-end space-x-2">
                <button
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                  className="inline-flex items-center px-3 sm:px-4 py-2 border border-gray-300 rounded-md bg-white text-gray-700 hover:bg-blue-50 hover:text-blue-600 hover:border-blue-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                >
                  <FaAngleLeft className="mr-1.5" />
                  Trước
                </button>
                <button
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages}
                  className="inline-flex items-center px-3 sm:px-4 py-2 border border-gray-300 rounded-md bg-white text-gray-700 hover:bg-blue-50 hover:text-blue-600 hover:border-blue-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                >
                  Sau
                  <FaAngleRight className="ml-1.5" />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  // Modal từ chối lịch hẹn
  const renderRejectionModal = () => {
    if (!showRejectionModal) return null;
    
    return (
      <div className="fixed inset-0 z-50 overflow-y-auto bg-black/50 flex items-center justify-center backdrop-blur-sm">
        <div className="bg-white rounded-xl shadow-xl w-full max-w-md mx-4 transform transition-all">
          <div className="flex justify-between items-center p-5 border-b border-gray-200">
            <h3 className="text-xl font-semibold text-gray-800 flex items-center">
              <FaTimesCircle className="text-red-500 mr-2" /> Từ chối lịch hẹn
            </h3>
            <button 
              className="text-gray-400 hover:text-gray-500 focus:outline-none transition-colors"
              onClick={() => setShowRejectionModal(false)}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <div className="p-5">
            <p className="text-gray-600 mb-1">Bệnh nhân: <span className="font-medium">{selectedAppointment?.patientId?.fullName || 'N/A'}</span></p>
            <p className="text-gray-600 mb-3">Thời gian: <span className="font-medium">{new Date(selectedAppointment?.appointmentDate).toLocaleDateString('vi-VN')} ({selectedAppointment?.timeSlot?.startTime} - {selectedAppointment?.timeSlot?.endTime})</span></p>
            
            <p className="text-gray-600 mt-4 mb-2">Vui lòng nhập lý do từ chối lịch hẹn:</p>
            <textarea
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              placeholder="Lý do từ chối..."
              rows={4}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all"
            />
          </div>
          <div className="flex justify-end space-x-3 p-5 border-t border-gray-200">
            <button 
              className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
              onClick={() => setShowRejectionModal(false)}
            >
              Hủy
            </button>
            <button 
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
              onClick={handleRejection}
              disabled={!rejectionReason.trim() || isUpdating}
            >
              {isUpdating ? 'Đang xử lý...' : 'Xác nhận từ chối'}
            </button>
          </div>
        </div>
      </div>
    );
  };

  // Modal hoàn thành lịch hẹn
  const renderCompletionModal = () => {
    if (!showCompletionModal) return null;
    
    return (
      <div className="fixed inset-0 z-50 overflow-y-auto bg-black/50 flex items-center justify-center backdrop-blur-sm">
        <div className="bg-white rounded-xl shadow-xl w-full max-w-3xl mx-4 transform transition-all max-h-[90vh] overflow-y-auto">
          <div className="flex justify-between items-center p-5 border-b border-gray-200">
            <h3 className="text-xl font-semibold text-gray-800 flex items-center">
              <FaClipboardCheck className="text-green-500 mr-2" /> Hoàn thành lịch hẹn
            </h3>
            <button 
              className="text-gray-400 hover:text-gray-500 focus:outline-none transition-colors"
              onClick={() => setShowCompletionModal(false)}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          
          <div className="p-5 space-y-4">
            <p className="text-gray-600 mb-3">
              Bệnh nhân: <span className="font-medium">{selectedAppointment?.patientId?.fullName}</span>
              <span className="mx-2">•</span>
              Ngày khám: <span className="font-medium">{new Date(selectedAppointment?.appointmentDate).toLocaleDateString('vi-VN')}</span>
            </p>
            
            <div className="space-y-3">
              <label className="block text-sm font-medium text-gray-700">Chẩn đoán</label>
              <textarea
                value={completionData.diagnosis}
                onChange={(e) => setCompletionData({...completionData, diagnosis: e.target.value})}
                placeholder="Nhập chẩn đoán..."
                rows={2}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all"
              />
            </div>
            
            <div className="space-y-3">
              <label className="block text-sm font-medium text-gray-700">Phương pháp điều trị</label>
              <textarea
                value={completionData.treatment}
                onChange={(e) => setCompletionData({...completionData, treatment: e.target.value})}
                placeholder="Nhập phương pháp điều trị..."
                rows={2}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all"
              />
            </div>
            
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <label className="block text-sm font-medium text-gray-700">Đơn thuốc</label>
                <button 
                  onClick={addMedication}
                  className="px-2 py-1 bg-blue-50 text-blue-600 rounded hover:bg-blue-100 text-sm flex items-center"
                >
                  <FaPlus className="mr-1" /> Thêm thuốc
                </button>
              </div>
              
              {completionData.prescription.length === 0 ? (
                <p className="text-sm text-gray-500 italic">Chưa có thuốc nào được kê</p>
              ) : (
                <div className="space-y-3">
                  {completionData.prescription.map((med, index) => (
                    <div key={index} className="p-3 border border-gray-200 rounded-lg bg-gray-50">
                      <div className="flex justify-between mb-2">
                        <h4 className="font-medium text-gray-700">Thuốc #{index + 1}</h4>
                        <button 
                          onClick={() => removeMedication(index)}
                          className="text-red-500 hover:text-red-700"
                        >
                          <FaTimes />
                        </button>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs text-gray-500 mb-1">Tên thuốc</label>
                          <input
                            type="text"
                            value={med.medicine}
                            onChange={(e) => updateMedication(index, 'medicine', e.target.value)}
                            className="w-full p-2 border border-gray-300 rounded"
                            placeholder="Tên thuốc"
                          />
                        </div>
                        <div>
                          <label className="block text-xs text-gray-500 mb-1">Liều lượng</label>
                          <input
                            type="text"
                            value={med.dosage}
                            onChange={(e) => updateMedication(index, 'dosage', e.target.value)}
                            className="w-full p-2 border border-gray-300 rounded"
                            placeholder="Liều lượng"
                          />
                        </div>
                        <div>
                          <label className="block text-xs text-gray-500 mb-1">Tần suất</label>
                          <input
                            type="text"
                            value={med.frequency}
                            onChange={(e) => updateMedication(index, 'frequency', e.target.value)}
                            className="w-full p-2 border border-gray-300 rounded"
                            placeholder="Vd: 3 lần/ngày"
                          />
                        </div>
                        <div>
                          <label className="block text-xs text-gray-500 mb-1">Thời gian</label>
                          <input
                            type="text"
                            value={med.duration}
                            onChange={(e) => updateMedication(index, 'duration', e.target.value)}
                            className="w-full p-2 border border-gray-300 rounded"
                            placeholder="Vd: 7 ngày"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            
            <div className="space-y-3">
              <label className="block text-sm font-medium text-gray-700">Ghi chú</label>
              <textarea
                value={completionData.notes}
                onChange={(e) => setCompletionData({...completionData, notes: e.target.value})}
                placeholder="Nhập ghi chú bổ sung..."
                rows={2}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all"
              />
            </div>
          </div>
          
          <div className="flex justify-end space-x-3 p-5 border-t border-gray-200">
            <button 
              className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
              onClick={() => setShowCompletionModal(false)}
            >
              Hủy
            </button>
            <button 
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
              onClick={handleCompleteAppointment}
              disabled={!completionData.diagnosis || isUpdating}
            >
              {isUpdating ? 'Đang xử lý...' : 'Hoàn thành và lưu hồ sơ'}
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <ToastContainer position="top-right" autoClose={3000} hideProgressBar={false} />
      
      <div className="bg-white rounded-xl shadow-sm p-4 sm:p-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-6">
          <h1 className="text-xl sm:text-2xl font-bold text-gray-800 mb-4 lg:mb-0 flex items-center">
            <FaCalendarAlt className="mr-2 text-primary" /> Quản lý lịch hẹn
          </h1>
          
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <FaSearch className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                value={searchTerm}
                onChange={handleSearch}
                placeholder="Tìm kiếm theo tên, mã lịch hẹn..."
                className="block w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
              />
              {searchTerm && (
                <button
                  onClick={clearSearch}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                >
                  <FaTimes className="h-4 w-4" />
                </button>
              )}
            </div>
            
            <div className="flex items-center bg-gray-100 rounded-lg px-3 min-w-[200px]">
              <FaFilter className="text-gray-500 mr-2 flex-shrink-0" />
              <select
                value={statusFilter}
                onChange={handleStatusFilterChange}
                className="block w-full py-2 bg-transparent border-0 focus:ring-0"
              >
                <option value="all">Tất cả trạng thái</option>
                <option value="pending">Chờ xác nhận</option>
                <option value="confirmed">Đã xác nhận</option>
                <option value="completed">Hoàn thành</option>
                <option value="cancelled">Đã hủy</option>
                <option value="rejected">Đã từ chối</option>
                <option value="rescheduled">Đã đổi lịch</option>
                <option value="no-show">Không đến</option>
              </select>
            </div>
          </div>
        </div>
        
        <div className="border-b border-gray-200 mb-6 overflow-x-auto">
          <nav className="flex flex-nowrap -mb-px min-w-max">
            <button
              onClick={() => { setActiveTab('all'); setStatusFilter('all'); setCurrentPage(1); }}
              className={`inline-flex items-center py-3 px-4 border-b-2 text-sm font-medium ${
                activeTab === 'all'
                  ? 'border-primary text-primary'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <FaListAlt className={`mr-2 ${activeTab === 'all' ? 'text-primary' : 'text-gray-400'}`} />
              Tất cả
              <span className="ml-2 bg-gray-100 text-gray-700 py-0.5 px-2 rounded-full text-xs">
                {statusCounts.all}
              </span>
            </button>
            
            <button
              onClick={() => { setActiveTab('today'); setStatusFilter('all'); setCurrentPage(1); }}
              className={`inline-flex items-center py-3 px-4 border-b-2 text-sm font-medium ${
                activeTab === 'today'
                  ? 'border-primary text-primary'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <FaCalendarCheck className={`mr-2 ${activeTab === 'today' ? 'text-primary' : 'text-gray-400'}`} />
              Hôm nay
            </button>
            
            <button
              onClick={() => { setActiveTab('all'); setStatusFilter('pending'); setCurrentPage(1); }}
              className={`inline-flex items-center py-3 px-4 border-b-2 text-sm font-medium ${
                activeTab === 'all' && statusFilter === 'pending'
                  ? 'border-yellow-500 text-yellow-700'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <FaClock className={`mr-2 ${activeTab === 'all' && statusFilter === 'pending' ? 'text-yellow-500' : 'text-gray-400'}`} />
              Chờ xác nhận
              <span className="ml-2 bg-yellow-100 text-yellow-800 py-0.5 px-2 rounded-full text-xs">
                {statusCounts.pending}
              </span>
            </button>
            
            <button
              onClick={() => { setActiveTab('all'); setStatusFilter('confirmed'); setCurrentPage(1); }}
              className={`inline-flex items-center py-3 px-4 border-b-2 text-sm font-medium ${
                activeTab === 'all' && statusFilter === 'confirmed'
                  ? 'border-blue-500 text-blue-700'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <FaCheckCircle className={`mr-2 ${activeTab === 'all' && statusFilter === 'confirmed' ? 'text-blue-500' : 'text-gray-400'}`} />
              Đã xác nhận
              <span className="ml-2 bg-blue-100 text-blue-800 py-0.5 px-2 rounded-full text-xs">
                {statusCounts.confirmed}
              </span>
            </button>
          </nav>
        </div>
      </div>
      
      {renderAppointmentsTable()}
      {renderRejectionModal()}
      {renderCompletionModal()}
    </div>
  );
};

export default Appointments;
