import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../utils/api';
import '../../styles/doctor/DoctorPatients.css';

const DoctorPatients = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [patients, setPatients] = useState([]);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [patientHistory, setPatientHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // State for filtering and pagination
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const patientsPerPage = 10;
  
  useEffect(() => {
    const fetchPatients = async () => {
      try {
        setLoading(true);
        const response = await api.get('/doctor/patients');
        setPatients(response.data);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching patients:', err);
        setError('Không thể tải danh sách bệnh nhân. Vui lòng thử lại sau.');
        setLoading(false);
      }
    };
    
    fetchPatients();
  }, []);
  
  // Fetch patient history when a patient is selected
  useEffect(() => {
    if (selectedPatient) {
      const fetchPatientHistory = async () => {
        try {
          const response = await api.get(`/doctor/patients/${selectedPatient._id}/history`);
          setPatientHistory(response.data);
        } catch (err) {
          console.error('Error fetching patient history:', err);
          setError('Không thể tải lịch sử khám bệnh. Vui lòng thử lại sau.');
        }
      };
      
      fetchPatientHistory();
    }
  }, [selectedPatient]);
  
  // Filter patients based on search term
  const filteredPatients = patients.filter(patient => {
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      return (
        patient.name.toLowerCase().includes(searchLower) ||
        patient.email.toLowerCase().includes(searchLower) ||
        patient.phone.includes(searchTerm)
      );
    }
    
    return true;
  });
  
  // Pagination
  const indexOfLastPatient = currentPage * patientsPerPage;
  const indexOfFirstPatient = indexOfLastPatient - patientsPerPage;
  const currentPatients = filteredPatients.slice(indexOfFirstPatient, indexOfLastPatient);
  const totalPages = Math.ceil(filteredPatients.length / patientsPerPage);
  
  // Handle page change
  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber);
  };
  
  // Handle search
  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1);
  };
  
  // Handle patient selection
  const handleSelectPatient = (patient) => {
    setSelectedPatient(patient);
  };
  
  // Navigate to appointment detail
  const handleViewAppointment = (appointmentId) => {
    navigate(`/doctor/appointments/${appointmentId}`);
  };
  
  // Calculate age from date of birth
  const calculateAge = (dateOfBirth) => {
    const today = new Date();
    const birthDate = new Date(dateOfBirth);
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    
    return age;
  };
  
  if (loading) {
    return <div className="loading">Đang tải...</div>;
  }
  
  return (
    <div className="doctor-patients-page">
      <div className="patients-header">
        <h1>Danh sách bệnh nhân</h1>
        <p>Quản lý thông tin và lịch sử khám bệnh của bệnh nhân</p>
      </div>
      
      {error && <div className="alert alert-danger">{error}</div>}
      
      <div className="search-container">
        <div className="search-box">
          <input
            type="text"
            placeholder="Tìm kiếm theo tên, email, số điện thoại..."
            value={searchTerm}
            onChange={handleSearch}
          />
          <i className="fas fa-search"></i>
        </div>
      </div>
      
      <div className="patients-container">
        <div className="patients-list-container">
          <h2>Danh sách bệnh nhân</h2>
          
          {currentPatients.length > 0 ? (
            <div className="patients-list">
              {currentPatients.map(patient => (
                <div
                  key={patient._id}
                  className={`patient-item ${selectedPatient && selectedPatient._id === patient._id ? 'active' : ''}`}
                  onClick={() => handleSelectPatient(patient)}
                >
                  <div className="patient-avatar">
                    {patient.avatar ? (
                      <img src={patient.avatar} alt={patient.name} />
                    ) : (
                      <div className="avatar-placeholder">
                        {patient.name.charAt(0).toUpperCase()}
                      </div>
                    )}
                  </div>
                  
                  <div className="patient-info">
                    <div className="patient-name">{patient.name}</div>
                    <div className="patient-details">
                      {patient.dateOfBirth && (
                        <span className="patient-age">
                          {calculateAge(patient.dateOfBirth)} tuổi
                        </span>
                      )}
                      <span className="patient-gender">
                        {getGenderLabel(patient.gender)}
                      </span>
                    </div>
                    <div className="patient-contact">{patient.phone}</div>
                  </div>
                  
                  <div className="patient-visit-count">
                    <div className="count">{patient.visitCount || 0}</div>
                    <div className="label">Lần khám</div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="no-data">Không tìm thấy bệnh nhân nào</div>
          )}
          
          {filteredPatients.length > patientsPerPage && (
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
        
        <div className="patient-details-container">
          <h2>Thông tin chi tiết</h2>
          
          {selectedPatient ? (
            <div className="patient-details">
              <div className="details-header">
                <div className="patient-profile">
                  <div className="patient-avatar-large">
                    {selectedPatient.avatar ? (
                      <img src={selectedPatient.avatar} alt={selectedPatient.name} />
                    ) : (
                      <div className="avatar-placeholder-large">
                        {selectedPatient.name.charAt(0).toUpperCase()}
                      </div>
                    )}
                  </div>
                  
                  <div className="patient-info-large">
                    <h3>{selectedPatient.name}</h3>
                    <div className="patient-meta">
                      {selectedPatient.dateOfBirth && (
                        <div className="meta-item">
                          <i className="fas fa-birthday-cake"></i>
                          <span>
                            {new Date(selectedPatient.dateOfBirth).toLocaleDateString()} 
                            ({calculateAge(selectedPatient.dateOfBirth)} tuổi)
                          </span>
                        </div>
                      )}
                      <div className="meta-item">
                        <i className="fas fa-venus-mars"></i>
                        <span>{getGenderLabel(selectedPatient.gender)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="details-section">
                <h4>Thông tin liên hệ</h4>
                <div className="details-grid">
                  <div className="detail-item">
                    <span className="detail-label">Email</span>
                    <span className="detail-value">{selectedPatient.email}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Số điện thoại</span>
                    <span className="detail-value">{selectedPatient.phone}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Địa chỉ</span>
                    <span className="detail-value">{selectedPatient.address || 'Chưa cập nhật'}</span>
                  </div>
                </div>
              </div>
              
              {selectedPatient.medicalInfo && (
                <div className="details-section">
                  <h4>Thông tin y tế</h4>
                  <div className="details-grid">
                    <div className="detail-item">
                      <span className="detail-label">Nhóm máu</span>
                      <span className="detail-value">{selectedPatient.medicalInfo.bloodType || 'Chưa cập nhật'}</span>
                    </div>
                    <div className="detail-item">
                      <span className="detail-label">Chiều cao</span>
                      <span className="detail-value">
                        {selectedPatient.medicalInfo.height 
                          ? `${selectedPatient.medicalInfo.height} cm` 
                          : 'Chưa cập nhật'}
                      </span>
                    </div>
                    <div className="detail-item">
                      <span className="detail-label">Cân nặng</span>
                      <span className="detail-value">
                        {selectedPatient.medicalInfo.weight 
                          ? `${selectedPatient.medicalInfo.weight} kg` 
                          : 'Chưa cập nhật'}
                      </span>
                    </div>
                  </div>
                  {selectedPatient.medicalInfo.allergies && (
                    <div className="allergies-section">
                      <h5>Dị ứng</h5>
                      <div className="allergies-list">
                        {selectedPatient.medicalInfo.allergies.length > 0 
                          ? selectedPatient.medicalInfo.allergies.map((allergy, index) => (
                              <span key={index} className="allergy-tag">{allergy}</span>
                            ))
                          : 'Không có dị ứng'}
                      </div>
                    </div>
                  )}
                  {selectedPatient.medicalInfo.chronicDiseases && (
                    <div className="diseases-section">
                      <h5>Bệnh mãn tính</h5>
                      <div className="diseases-list">
                        {selectedPatient.medicalInfo.chronicDiseases.length > 0 
                          ? selectedPatient.medicalInfo.chronicDiseases.map((disease, index) => (
                              <span key={index} className="disease-tag">{disease}</span>
                            ))
                          : 'Không có bệnh mãn tính'}
                      </div>
                    </div>
                  )}
                </div>
              )}
              
              <div className="details-section">
                <h4>Lịch sử khám bệnh</h4>
                {patientHistory.length > 0 ? (
                  <div className="history-timeline">
                    {patientHistory.map(appointment => (
                      <div key={appointment._id} className="history-item">
                        <div className="history-date">
                          <div className="date-badge">
                            {new Date(appointment.appointmentDate).toLocaleDateString()}
                          </div>
                          <div className="time-badge">{appointment.appointmentTime}</div>
                        </div>
                        
                        <div className="history-content">
                          <div className="history-header">
                            <h5>{appointment.serviceName}</h5>
                            <div className="history-status">
                              <span className={`status-badge status-${appointment.status}`}>
                                {getStatusLabel(appointment.status)}
                              </span>
                            </div>
                          </div>
                          
                          <div className="history-body">
                            {appointment.diagnosis && (
                              <div className="diagnosis-section">
                                <strong>Chẩn đoán:</strong> {appointment.diagnosis}
                              </div>
                            )}
                            
                            {appointment.prescription && (
                              <div className="prescription-section">
                                <strong>Đơn thuốc:</strong> {appointment.prescription}
                              </div>
                            )}
                            
                            {appointment.notes && (
                              <div className="notes-section">
                                <strong>Ghi chú:</strong> {appointment.notes}
                              </div>
                            )}
                          </div>
                          
                          <div className="history-footer">
                            <button 
                              className="btn-view-details"
                              onClick={() => handleViewAppointment(appointment._id)}
                            >
                              <i className="fas fa-eye"></i> Xem chi tiết
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="no-data">Chưa có lịch sử khám bệnh</div>
                )}
              </div>
            </div>
          ) : (
            <div className="no-selection">
              <p>Chọn một bệnh nhân từ danh sách để xem chi tiết</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// Helper function to convert gender code to display label
const getGenderLabel = (gender) => {
  const genderMap = {
    'male': 'Nam',
    'female': 'Nữ',
    'other': 'Khác'
  };
  
  return genderMap[gender] || gender;
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

export default DoctorPatients; 