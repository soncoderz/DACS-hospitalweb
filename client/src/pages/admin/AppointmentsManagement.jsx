import React, { useState, useEffect } from 'react';
import api from '../../utils/api';

const AppointmentsManagement = () => {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showDetails, setShowDetails] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterDate, setFilterDate] = useState('');
  
  // Danh sách trạng thái lịch hẹn
  const statusOptions = [
    { value: 'pending', label: 'Chờ xác nhận' },
    { value: 'confirmed', label: 'Đã xác nhận' },
    { value: 'completed', label: 'Đã hoàn thành' },
    { value: 'canceled', label: 'Đã hủy' },
    { value: 'rescheduled', label: 'Đã đổi lịch' }
  ];

  useEffect(() => {
    fetchAppointments();
  }, []);

  const fetchAppointments = async () => {
    setLoading(true);
    try {
      // Trong thực tế, gọi API từ server
      // const response = await api.get('/admin/appointments');
      // setAppointments(response.data);
      
      // Dữ liệu mẫu
      setAppointments([
        {
          _id: '1',
          patientId: { _id: 'p1', fullName: 'Nguyễn Văn A', phoneNumber: '0901234567', email: 'nguyenvana@example.com' },
          doctorId: { _id: 'd1', fullName: 'BS. Trần Thị B', speciality: 'Nội khoa' },
          serviceId: { _id: 's1', name: 'Khám tổng quát', price: 500000, duration: 60 },
          branchId: { _id: 'b1', name: 'Bệnh viện Đa khoa Trung ương' },
          date: '2023-05-15',
          time: '09:00',
          status: 'completed',
          notes: 'Bệnh nhân có tiền sử huyết áp cao',
          symptoms: 'Đau đầu, chóng mặt, mệt mỏi',
          medicalHistory: 'Huyết áp cao, đã điều trị từ năm 2020',
          diagnosis: 'Tăng huyết áp cấp độ 1',
          createdAt: '2023-05-01T08:30:00Z'
        },
        {
          _id: '2',
          patientId: { _id: 'p2', fullName: 'Lê Văn C', phoneNumber: '0912345678', email: 'levanc@example.com' },
          doctorId: { _id: 'd2', fullName: 'BS. Phạm Văn D', speciality: 'Da liễu' },
          serviceId: { _id: 's2', name: 'Khám da liễu', price: 350000, duration: 30 },
          branchId: { _id: 'b1', name: 'Bệnh viện Đa khoa Trung ương' },
          date: '2023-05-16',
          time: '14:30',
          status: 'confirmed',
          notes: 'Bệnh nhân bị dị ứng với một số loại thuốc',
          symptoms: 'Nổi mẩn đỏ, ngứa',
          medicalHistory: 'Không có bệnh nền',
          diagnosis: '',
          createdAt: '2023-05-10T10:15:00Z'
        },
        {
          _id: '3',
          patientId: { _id: 'p3', fullName: 'Trần Thị E', phoneNumber: '0923456789', email: 'tranthe@example.com' },
          doctorId: { _id: 'd3', fullName: 'BS. Hoàng Văn F', speciality: 'Nhi khoa' },
          serviceId: { _id: 's3', name: 'Khám nhi tổng quát', price: 400000, duration: 45 },
          branchId: { _id: 'b2', name: 'Phòng khám Đa khoa Quốc tế' },
          date: '2023-05-20',
          time: '08:00',
          status: 'pending',
          notes: 'Trẻ cần tiêm vắc xin theo lịch',
          symptoms: 'Sốt nhẹ, ho',
          medicalHistory: 'Không có',
          diagnosis: '',
          createdAt: '2023-05-12T14:20:00Z'
        },
        {
          _id: '4',
          patientId: { _id: 'p4', fullName: 'Phạm Thị G', phoneNumber: '0934567890', email: 'phamthig@example.com' },
          doctorId: { _id: 'd4', fullName: 'BS. Nguyễn Văn H', speciality: 'Mắt' },
          serviceId: { _id: 's4', name: 'Khám mắt toàn diện', price: 400000, duration: 45 },
          branchId: { _id: 'b3', name: 'Phòng khám Chuyên khoa Mắt' },
          date: '2023-05-18',
          time: '10:30',
          status: 'rescheduled',
          notes: 'Bệnh nhân cần đo thị lực và kiểm tra chuyên sâu',
          symptoms: 'Mờ mắt, nhức mắt khi đọc sách',
          medicalHistory: 'Cận thị',
          diagnosis: '',
          createdAt: '2023-05-05T09:45:00Z'
        },
        {
          _id: '5',
          patientId: { _id: 'p5', fullName: 'Hoàng Văn I', phoneNumber: '0945678901', email: 'hoangvani@example.com' },
          doctorId: { _id: 'd5', fullName: 'BS. Lê Thị K', speciality: 'Sản phụ khoa' },
          serviceId: { _id: 's5', name: 'Khám thai định kỳ', price: 300000, duration: 45 },
          branchId: { _id: 'b1', name: 'Bệnh viện Đa khoa Trung ương' },
          date: '2023-05-14',
          time: '15:00',
          status: 'canceled',
          notes: 'Thai phụ mang thai lần đầu, 28 tuần',
          symptoms: 'Đau lưng, mệt mỏi',
          medicalHistory: 'Không có bệnh nền',
          diagnosis: '',
          createdAt: '2023-05-02T11:10:00Z'
        }
      ]);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching appointments:', error);
      setError('Không thể tải danh sách lịch hẹn. Vui lòng thử lại sau.');
      setLoading(false);
    }
  };

  const handleStatusChange = async (appointmentId, newStatus) => {
    try {
      // Cập nhật trạng thái lịch hẹn thông qua API
      // await api.put(`/admin/appointments/${appointmentId}/status`, { status: newStatus });
      
      // Cập nhật state
      setAppointments(prevAppointments => 
        prevAppointments.map(appointment => 
          appointment._id === appointmentId ? { ...appointment, status: newStatus } : appointment
        )
      );
      
      // Nếu đang xem chi tiết lịch hẹn, cập nhật thông tin đó
      if (selectedAppointment && selectedAppointment._id === appointmentId) {
        setSelectedAppointment(prev => ({
          ...prev,
          status: newStatus
        }));
      }
    } catch (error) {
      console.error('Error updating appointment status:', error);
      setError('Không thể cập nhật trạng thái lịch hẹn. Vui lòng thử lại sau.');
    }
  };

  const handleViewDetails = (appointment) => {
    setSelectedAppointment(appointment);
    setShowDetails(true);
  };

  const handleCloseDetails = () => {
    setSelectedAppointment(null);
    setShowDetails(false);
  };

  // Lọc lịch hẹn theo trạng thái, ngày và từ khóa tìm kiếm
  const filteredAppointments = appointments.filter(appointment => {
    const matchesStatus = filterStatus === 'all' || appointment.status === filterStatus;
    const matchesDate = !filterDate || appointment.date === filterDate;
    
    const searchableFields = [
      appointment.patientId.fullName,
      appointment.patientId.phoneNumber,
      appointment.patientId.email,
      appointment.doctorId.fullName,
      appointment.serviceId.name,
      appointment.branchId.name
    ];
    
    const matchesSearch = !searchTerm || searchableFields.some(field => 
      field.toLowerCase().includes(searchTerm.toLowerCase())
    );
    
    return matchesStatus && matchesDate && matchesSearch;
  });

  // Sắp xếp lịch hẹn theo ngày và giờ (mới nhất lên đầu)
  const sortedAppointments = [...filteredAppointments].sort((a, b) => {
    const dateA = new Date(`${a.date}T${a.time}`);
    const dateB = new Date(`${b.date}T${b.time}`);
    return dateB - dateA;
  });

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString('vi-VN');
  };

  // Format date time
  const formatDateTime = (dateString, timeString) => {
    if (!dateString) return '';
    const options = { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    };
    return new Date(`${dateString}T${timeString}`).toLocaleString('vi-VN', options);
  };

  // Format currency
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('vi-VN', { 
      style: 'currency', 
      currency: 'VND',
      maximumFractionDigits: 0
    }).format(amount);
  };

  // Get status label and color
  const getStatusInfo = (status) => {
    const statusOption = statusOptions.find(option => option.value === status);
    return {
      label: statusOption ? statusOption.label : 'Không xác định',
      className: `status-badge ${status}`
    };
  };

  return (
    <div className="admin-appointments-management">
      <div className="admin-section-header">
        <h1>Quản lý lịch hẹn</h1>
      </div>

      {error && <div className="alert alert-danger">{error}</div>}

      <div className="admin-filter-section">
        <div className="search-box">
          <input
            type="text"
            placeholder="Tìm kiếm tên, số điện thoại, email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <i className="fas fa-search"></i>
        </div>
        
        <div className="filter-box">
          <label>Ngày:</label>
          <input
            type="date"
            value={filterDate}
            onChange={(e) => setFilterDate(e.target.value)}
          />
        </div>
        
        <div className="filter-box">
          <label>Trạng thái:</label>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
          >
            <option value="all">Tất cả</option>
            {statusOptions.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {loading ? (
        <div className="loading-indicator">Đang tải...</div>
      ) : (
        <div className="admin-table-container">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Mã</th>
                <th>Bệnh nhân</th>
                <th>Bác sĩ</th>
                <th>Dịch vụ</th>
                <th>Chi nhánh</th>
                <th>Ngày giờ khám</th>
                <th>Trạng thái</th>
                <th>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {sortedAppointments.length > 0 ? (
                sortedAppointments.map(appointment => (
                  <tr key={appointment._id}>
                    <td>#{appointment._id.slice(-5)}</td>
                    <td>
                      <div className="patient-info">
                        <div className="patient-name">{appointment.patientId.fullName}</div>
                        <div className="patient-contact">{appointment.patientId.phoneNumber}</div>
                      </div>
                    </td>
                    <td>
                      <div className="doctor-info">
                        <div className="doctor-name">{appointment.doctorId.fullName}</div>
                        <div className="doctor-speciality">{appointment.doctorId.speciality}</div>
                      </div>
                    </td>
                    <td>{appointment.serviceId.name}</td>
                    <td>{appointment.branchId.name}</td>
                    <td>
                      <div className="appointment-datetime">
                        <div className="appointment-date">{formatDate(appointment.date)}</div>
                        <div className="appointment-time">{appointment.time}</div>
                      </div>
                    </td>
                    <td>
                      <span className={getStatusInfo(appointment.status).className}>
                        {getStatusInfo(appointment.status).label}
                      </span>
                    </td>
                    <td>
                      <div className="action-buttons">
                        <button 
                          className="btn-icon btn-view" 
                          onClick={() => handleViewDetails(appointment)}
                          title="Xem chi tiết"
                        >
                          <i className="fas fa-eye"></i>
                        </button>
                        <div className="dropdown">
                          <button className="btn-icon btn-status-dropdown" title="Đổi trạng thái">
                            <i className="fas fa-exchange-alt"></i>
                          </button>
                          <div className="dropdown-content">
                            {statusOptions.map(option => (
                              <button
                                key={option.value}
                                onClick={() => handleStatusChange(appointment._id, option.value)}
                                disabled={appointment.status === option.value}
                                className={appointment.status === option.value ? 'active' : ''}
                              >
                                {option.label}
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="8" className="no-data">
                    Không tìm thấy lịch hẹn nào
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal chi tiết lịch hẹn */}
      {showDetails && selectedAppointment && (
        <div className="modal-overlay">
          <div className="appointment-detail-modal">
            <div className="modal-header">
              <h2>Chi tiết lịch hẹn #{selectedAppointment._id.slice(-5)}</h2>
              <button className="btn-icon" onClick={handleCloseDetails}>
                <i className="fas fa-times"></i>
              </button>
            </div>
            
            <div className="modal-body">
              <div className="detail-section">
                <h3>Thông tin chung</h3>
                <div className="detail-grid">
                  <div className="detail-item">
                    <span className="detail-label">Trạng thái:</span>
                    <span className={getStatusInfo(selectedAppointment.status).className}>
                      {getStatusInfo(selectedAppointment.status).label}
                    </span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Ngày giờ khám:</span>
                    <span className="detail-value">
                      {formatDateTime(selectedAppointment.date, selectedAppointment.time)}
                    </span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Dịch vụ:</span>
                    <span className="detail-value">{selectedAppointment.serviceId.name}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Phí:</span>
                    <span className="detail-value">{formatCurrency(selectedAppointment.serviceId.price)}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Thời gian dự kiến:</span>
                    <span className="detail-value">{selectedAppointment.serviceId.duration} phút</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Chi nhánh:</span>
                    <span className="detail-value">{selectedAppointment.branchId.name}</span>
                  </div>
                </div>
              </div>
              
              <div className="detail-two-columns">
                <div className="detail-section">
                  <h3>Thông tin bệnh nhân</h3>
                  <div className="detail-list">
                    <div className="detail-item">
                      <span className="detail-label">Họ tên:</span>
                      <span className="detail-value">{selectedAppointment.patientId.fullName}</span>
                    </div>
                    <div className="detail-item">
                      <span className="detail-label">Số điện thoại:</span>
                      <span className="detail-value">{selectedAppointment.patientId.phoneNumber}</span>
                    </div>
                    <div className="detail-item">
                      <span className="detail-label">Email:</span>
                      <span className="detail-value">{selectedAppointment.patientId.email}</span>
                    </div>
                  </div>
                </div>
                
                <div className="detail-section">
                  <h3>Thông tin bác sĩ</h3>
                  <div className="detail-list">
                    <div className="detail-item">
                      <span className="detail-label">Họ tên:</span>
                      <span className="detail-value">{selectedAppointment.doctorId.fullName}</span>
                    </div>
                    <div className="detail-item">
                      <span className="detail-label">Chuyên khoa:</span>
                      <span className="detail-value">{selectedAppointment.doctorId.speciality}</span>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="detail-section">
                <h3>Thông tin y tế</h3>
                <div className="detail-list">
                  <div className="detail-item">
                    <span className="detail-label">Triệu chứng:</span>
                    <span className="detail-value">
                      {selectedAppointment.symptoms || 'Không có thông tin'}
                    </span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Tiền sử bệnh:</span>
                    <span className="detail-value">
                      {selectedAppointment.medicalHistory || 'Không có thông tin'}
                    </span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Chẩn đoán:</span>
                    <span className="detail-value">
                      {selectedAppointment.diagnosis || 'Chưa có chẩn đoán'}
                    </span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Ghi chú:</span>
                    <span className="detail-value">
                      {selectedAppointment.notes || 'Không có ghi chú'}
                    </span>
                  </div>
                </div>
              </div>
              
              <div className="detail-section">
                <h3>Thao tác</h3>
                <div className="detail-actions">
                  <div className="status-change-section">
                    <span className="detail-label">Đổi trạng thái:</span>
                    <div className="status-buttons">
                      {statusOptions.map(option => (
                        <button
                          key={option.value}
                          className={`btn status-btn ${option.value} ${selectedAppointment.status === option.value ? 'active' : ''}`}
                          onClick={() => handleStatusChange(selectedAppointment._id, option.value)}
                          disabled={selectedAppointment.status === option.value}
                        >
                          {option.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AppointmentsManagement; 