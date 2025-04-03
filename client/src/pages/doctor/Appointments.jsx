import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../utils/api';
import '../../styles/doctor/DoctorAppointments.css';

const DoctorAppointments = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [appointments, setAppointments] = useState([]);
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // State for filtering and pagination
  const [statusFilter, setStatusFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const appointmentsPerPage = 10;
  
  // State for modal
  const [isUpdateModalOpen, setIsUpdateModalOpen] = useState(false);
  const [updatedStatus, setUpdatedStatus] = useState('');
  const [statusNote, setStatusNote] = useState('');
  
  useEffect(() => {
    const fetchAppointments = async () => {
      try {
        setLoading(true);
        const response = await api.get('/doctor/appointments');
        setAppointments(response.data);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching appointments:', err);
        setError('Không thể tải danh sách lịch hẹn. Vui lòng thử lại sau.');
        setLoading(false);
      }
    };
    
    fetchAppointments();
  }, []);
  
  // Filter appointments based on search, status, and date
  const filteredAppointments = appointments.filter(appointment => {
    // Check status filter
    if (statusFilter !== 'all' && appointment.status !== statusFilter) {
      return false;
    }
    
    // Check date filter
    if (dateFilter) {
      const filterDate = new Date(dateFilter).toDateString();
      const appointmentDate = new Date(appointment.appointmentDate).toDateString();
      if (filterDate !== appointmentDate) {
        return false;
      }
    }
    
    // Check search term
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      return (
        appointment.patientName.toLowerCase().includes(searchLower) ||
        appointment.patientEmail.toLowerCase().includes(searchLower) ||
        appointment.patientPhone.includes(searchTerm) ||
        appointment.serviceName.toLowerCase().includes(searchLower)
      );
    }
    
    return true;
  });
  
  // Pagination
  const indexOfLastAppointment = currentPage * appointmentsPerPage;
  const indexOfFirstAppointment = indexOfLastAppointment - appointmentsPerPage;
  const currentAppointments = filteredAppointments.slice(indexOfFirstAppointment, indexOfLastAppointment);
  const totalPages = Math.ceil(filteredAppointments.length / appointmentsPerPage);
  
  // Handle page change
  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber);
  };
  
  // Handle status filter change
  const handleStatusFilterChange = (status) => {
    setStatusFilter(status);
    setCurrentPage(1);
  };
  
  // Handle date filter change
  const handleDateFilterChange = (e) => {
    setDateFilter(e.target.value);
    setCurrentPage(1);
  };
  
  // Handle search
  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1);
  };
  
  // Handle appointment selection
  const handleSelectAppointment = (appointment) => {
    setSelectedAppointment(appointment);
  };
  
  // Open update status modal
  const handleOpenUpdateModal = (appointment) => {
    setSelectedAppointment(appointment);
    setUpdatedStatus(appointment.status);
    setStatusNote('');
    setIsUpdateModalOpen(true);
  };
  
  // Close modal
  const handleCloseModal = () => {
    setIsUpdateModalOpen(false);
  };
  
  // Handle status change
  const handleStatusChange = (e) => {
    setUpdatedStatus(e.target.value);
  };
  
  // Handle note change
  const handleNoteChange = (e) => {
    setStatusNote(e.target.value);
  };
  
  // Update appointment status
  const handleUpdateStatus = async () => {
    if (!selectedAppointment || !updatedStatus) return;
    
    try {
      const response = await api.put(`/doctor/appointments/${selectedAppointment._id}/status`, {
        status: updatedStatus,
        statusNote: statusNote
      });
      
      // Update appointment in the list
      const updatedAppointment = response.data;
      setAppointments(prevAppointments => prevAppointments.map(app => 
        app._id === updatedAppointment._id ? updatedAppointment : app
      ));
      
      // Update selected appointment
      setSelectedAppointment(updatedAppointment);
      
      // Close modal
      setIsUpdateModalOpen(false);
    } catch (err) {
      console.error('Error updating appointment status:', err);
      setError(err.response?.data?.message || 'Không thể cập nhật trạng thái. Vui lòng thử lại.');
    }
  };
  
  if (loading) {
    return <div className="loading">Đang tải...</div>;
  }
  
  return (
    <div className="doctor-appointments-page">
      <div className="appointments-header">
        <h1>Quản lý lịch hẹn</h1>
        <p>Xem và cập nhật trạng thái các lịch hẹn của bạn</p>
      </div>
      
      {error && <div className="alert alert-danger">{error}</div>}
      
      <div className="filter-container">
        <div className="search-box">
          <input
            type="text"
            placeholder="Tìm kiếm bệnh nhân, dịch vụ..."
            value={searchTerm}
            onChange={handleSearch}
          />
          <i className="fas fa-search"></i>
        </div>
        
        <div className="date-filter">
          <label>Ngày hẹn:</label>
          <input
            type="date"
            value={dateFilter}
            onChange={handleDateFilterChange}
          />
        </div>
        
        <div className="status-filter">
          <button
            className={statusFilter === 'all' ? 'active' : ''}
            onClick={() => handleStatusFilterChange('all')}
          >
            Tất cả
          </button>
          <button
            className={statusFilter === 'pending' ? 'active' : ''}
            onClick={() => handleStatusFilterChange('pending')}
          >
            Chờ xác nhận
          </button>
          <button
            className={statusFilter === 'confirmed' ? 'active' : ''}
            onClick={() => handleStatusFilterChange('confirmed')}
          >
            Đã xác nhận
          </button>
          <button
            className={statusFilter === 'completed' ? 'active' : ''}
            onClick={() => handleStatusFilterChange('completed')}
          >
            Đã hoàn thành
          </button>
          <button
            className={statusFilter === 'cancelled' ? 'active' : ''}
            onClick={() => handleStatusFilterChange('cancelled')}
          >
            Đã hủy
          </button>
        </div>
      </div>
      
      <div className="appointments-container">
        <div className="appointments-list-container">
          <h2>Danh sách lịch hẹn</h2>
          
          {currentAppointments.length > 0 ? (
            <div className="appointments-list">
              {currentAppointments.map(appointment => (
                <div
                  key={appointment._id}
                  className={`appointment-item ${selectedAppointment && selectedAppointment._id === appointment._id ? 'active' : ''}`}
                  onClick={() => handleSelectAppointment(appointment)}
                >
                  <div className="appointment-date">
                    <div className="date">{new Date(appointment.appointmentDate).toLocaleDateString()}</div>
                    <div className="time">{appointment.appointmentTime}</div>
                  </div>
                  
                  <div className="appointment-info">
                    <div className="patient-name">{appointment.patientName}</div>
                    <div className="service-name">{appointment.serviceName}</div>
                  </div>
                  
                  <div className="appointment-status">
                    <span className={`status-badge status-${appointment.status}`}>
                      {getStatusLabel(appointment.status)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="no-data">Không tìm thấy lịch hẹn nào</div>
          )}
          
          {filteredAppointments.length > appointmentsPerPage && (
            <div className="pagination">
              <button
                className="prev-btn"
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
              >
                <i className="fas fa-chevron-left"></i>
              </button>
              
              <div className="page-numbers">
                {Array.from({ length: totalPages }, (_, i) => i + 1)
                  .filter(pageNum => {
                    // Show current page and 1 page before and after
                    return (
                      pageNum === 1 ||
                      pageNum === totalPages ||
                      Math.abs(pageNum - currentPage) <= 1
                    );
                  })
                  .map((pageNum, index, array) => (
                    <React.Fragment key={pageNum}>
                      {index > 0 && array[index - 1] !== pageNum - 1 && (
                        <span className="page-dots">...</span>
                      )}
                      <button
                        className={`page-number ${currentPage === pageNum ? 'active' : ''}`}
                        onClick={() => handlePageChange(pageNum)}
                      >
                        {pageNum}
                      </button>
                    </React.Fragment>
                  ))}
              </div>
              
              <button
                className="next-btn"
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
              >
                <i className="fas fa-chevron-right"></i>
              </button>
            </div>
          )}
        </div>
        
        <div className="appointment-details-container">
          <h2>Chi tiết lịch hẹn</h2>
          
          {selectedAppointment ? (
            <div className="appointment-details">
              <div className="details-header">
                <div className="service-info">
                  <h3>{selectedAppointment.serviceName}</h3>
                  <span className={`status-badge status-${selectedAppointment.status}`}>
                    {getStatusLabel(selectedAppointment.status)}
                  </span>
                </div>
                
                <div className="action-buttons">
                  <button
                    className="update-btn"
                    onClick={() => handleOpenUpdateModal(selectedAppointment)}
                    disabled={selectedAppointment.status === 'cancelled'}
                  >
                    <i className="fas fa-edit"></i> Cập nhật trạng thái
                  </button>
                </div>
              </div>
              
              <div className="details-section">
                <h4>Thông tin lịch hẹn</h4>
                <div className="details-grid">
                  <div className="detail-item">
                    <span className="detail-label">Ngày hẹn</span>
                    <span className="detail-value">{new Date(selectedAppointment.appointmentDate).toLocaleDateString()}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Thời gian</span>
                    <span className="detail-value">{selectedAppointment.appointmentTime}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Chuyên khoa</span>
                    <span className="detail-value">{selectedAppointment.specialtyName}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Bệnh viện</span>
                    <span className="detail-value">{selectedAppointment.hospitalName}</span>
                  </div>
                </div>
              </div>
              
              <div className="details-section">
                <h4>Thông tin bệnh nhân</h4>
                <div className="details-grid">
                  <div className="detail-item">
                    <span className="detail-label">Họ tên</span>
                    <span className="detail-value">{selectedAppointment.patientName}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Email</span>
                    <span className="detail-value">{selectedAppointment.patientEmail}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Số điện thoại</span>
                    <span className="detail-value">{selectedAppointment.patientPhone}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Ngày sinh</span>
                    <span className="detail-value">
                      {selectedAppointment.patientDateOfBirth 
                        ? new Date(selectedAppointment.patientDateOfBirth).toLocaleDateString() 
                        : 'Không có thông tin'}
                    </span>
                  </div>
                </div>
              </div>
              
              <div className="details-section">
                <h4>Ghi chú và triệu chứng</h4>
                <div className="note-content">
                  {selectedAppointment.symptoms || 'Không có ghi chú'}
                </div>
              </div>
              
              {selectedAppointment.statusHistory && selectedAppointment.statusHistory.length > 0 && (
                <div className="details-section">
                  <h4>Lịch sử cập nhật</h4>
                  <div className="status-history">
                    {selectedAppointment.statusHistory.map((history, index) => (
                      <div key={index} className="history-item">
                        <div className="history-status">
                          <span className={`status-badge status-${history.status}`}>
                            {getStatusLabel(history.status)}
                          </span>
                          <span className="history-time">
                            {new Date(history.timestamp).toLocaleString()}
                          </span>
                        </div>
                        {history.note && (
                          <div className="history-note">{history.note}</div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="no-selection">
              <p>Chọn một lịch hẹn từ danh sách để xem chi tiết</p>
            </div>
          )}
        </div>
      </div>
      
      {/* Modal for updating appointment status */}
      {isUpdateModalOpen && selectedAppointment && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h2>Cập nhật trạng thái lịch hẹn</h2>
              <button className="close-btn" onClick={handleCloseModal}>
                <i className="fas fa-times"></i>
              </button>
            </div>
            
            <div className="modal-body">
              <div className="appointment-summary">
                <p><strong>Bệnh nhân:</strong> {selectedAppointment.patientName}</p>
                <p><strong>Dịch vụ:</strong> {selectedAppointment.serviceName}</p>
                <p>
                  <strong>Thời gian:</strong> {new Date(selectedAppointment.appointmentDate).toLocaleDateString()} - {selectedAppointment.appointmentTime}
                </p>
                <p>
                  <strong>Trạng thái hiện tại:</strong>
                  <span className={`status-badge status-${selectedAppointment.status}`}>
                    {getStatusLabel(selectedAppointment.status)}
                  </span>
                </p>
              </div>
              
              <div className="form-group">
                <label>Trạng thái mới:</label>
                <select 
                  value={updatedStatus} 
                  onChange={handleStatusChange}
                  className="form-select"
                >
                  <option value="pending">Chờ xác nhận</option>
                  <option value="confirmed">Đã xác nhận</option>
                  <option value="completed">Đã hoàn thành</option>
                  <option value="cancelled">Đã hủy</option>
                </select>
              </div>
              
              <div className="form-group">
                <label>Ghi chú (nếu có):</label>
                <textarea
                  value={statusNote}
                  onChange={handleNoteChange}
                  placeholder="Nhập ghi chú về việc thay đổi trạng thái này..."
                  rows="4"
                  className="form-control"
                ></textarea>
              </div>
              
              <div className="modal-actions">
                <button className="btn-cancel" onClick={handleCloseModal}>Hủy</button>
                <button 
                  className="btn-update" 
                  onClick={handleUpdateStatus}
                  disabled={updatedStatus === selectedAppointment.status}
                >
                  Cập nhật
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Helper function to convert status code to display label
const getStatusLabel = (status) => {
  const statusMap = {
    'pending': 'Chờ xác nhận',
    'confirmed': 'Đã xác nhận',
    'completed': 'Đã hoàn thành',
    'cancelled': 'Đã hủy'
  };
  
  return statusMap[status] || status;
};

export default DoctorAppointments; 