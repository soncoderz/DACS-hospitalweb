import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

const Appointment = () => {
  // State for form data
  const [formData, setFormData] = useState({
    fullName: '',
    phone: '',
    email: '',
    dob: '',
    gender: '',
    doctorId: '',
    branchId: '',
    departmentId: '',
    appointmentDate: '',
    appointmentTime: '',
    symptoms: '',
    notes: '',
  });

  // State for form steps
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  // Selected doctor/branch/department details
  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const [selectedBranch, setSelectedBranch] = useState(null);
  const [selectedDepartment, setSelectedDepartment] = useState(null);
  const [selectedDate, setSelectedDate] = useState(null);

  // Available time slots based on selected date
  const [availableTimeSlots, setAvailableTimeSlots] = useState([]);

  // Mock data for doctors, branches, and departments
  const doctors = [
    {
      id: 1,
      name: 'BS. Nguyễn Thị Vân Uyên',
      specialty: 'Nội Tổng Quát',
      rating: 4.8,
      experience: 12,
      image: 'https://media.benhvienhathanh.vn/media/doi_ngu_bac_si/nguy%E1%BB%85n_th%E1%BB%8B_v%C3%A2n_uy%C3%AAn.png',
      branchId: 1,
      departmentId: 1,
    },
    {
      id: 2,
      name: 'BS. Lê Anh Tuấn',
      specialty: 'Thần Kinh',
      rating: 4.9,
      experience: 15,
      image: 'https://media.benhvienhathanh.vn/media/doi_ngu_bac_si/le_anh_tuan.png',
      branchId: 1,
      departmentId: 2,
    },
    {
      id: 3,
      name: 'BS. Nguyễn Khánh Hội',
      specialty: 'Nhi Khoa',
      rating: 4.7,
      experience: 8,
      image: 'https://media.benhvienhathanh.vn/media/doi_ngu_bac_si/nguy%E1%BB%85n_kh%C3%A1nh_h%E1%BB%99i.png',
      branchId: 2,
      departmentId: 3,
    },
    {
      id: 4,
      name: 'BS. Trần Thị Minh Tâm',
      specialty: 'Sản Phụ Khoa',
      rating: 4.8,
      experience: 14,
      image: null,
      branchId: 2,
      departmentId: 4,
    },
    {
      id: 5,
      name: 'BS. Nguyễn Văn Hiếu',
      specialty: 'Tim Mạch',
      rating: 4.9,
      experience: 18,
      image: null,
      branchId: 3,
      departmentId: 5,
    },
    {
      id: 6,
      name: 'BS. Phạm Thị Lan Anh',
      specialty: 'Da Liễu',
      rating: 4.7,
      experience: 10,
      image: null,
      branchId: 3,
      departmentId: 6,
    },
  ];

  const branches = [
    {
      id: 1,
      name: 'Bệnh Viện Trung Tâm',
      address: '123 Đường Nguyễn Huệ, Quận 1, TP.HCM',
      phone: '(028) 3822 1234',
      image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/c6/Eo_circle_indigo_white_number-1.svg/768px-Eo_circle_indigo_white_number-1.svg.png'
    },
    {
      id: 2,
      name: 'Phòng Khám Đa Khoa Đông',
      address: '456 Đường Lê Lợi, Quận 3, TP.HCM',
      phone: '(028) 3833 5678',
      image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/cd/Number_2_in_light_blue_rounded_square.svg/768px-Number_2_in_light_blue_rounded_square.svg.png'
    },
    {
      id: 3,
      name: 'Trung Tâm Y Tế Tây',
      address: '789 Đường Cách Mạng Tháng 8, Quận 10, TP.HCM',
      phone: '(028) 3844 9012',
      image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/15/Eo_circle_indigo_white_number-3.svg/768px-Eo_circle_indigo_white_number-3.svg.png'
    },
  ];

  const departments = [
    { id: 1, name: 'Nội Tổng Quát' },
    { id: 2, name: 'Thần Kinh' },
    { id: 3, name: 'Nhi Khoa' },
    { id: 4, name: 'Sản Phụ Khoa' },
    { id: 5, name: 'Tim Mạch' },
    { id: 6, name: 'Da Liễu' },
  ];

  // Generate available dates (next 14 days from today)
  const generateAvailableDates = () => {
    const dates = [];
    const currentDate = new Date();
    
    for (let i = 1; i <= 14; i++) {
      const newDate = new Date(currentDate);
      newDate.setDate(currentDate.getDate() + i);
      
      // Skip Sundays (assuming Sunday is a day off)
      if (newDate.getDay() !== 0) {
        dates.push({
          date: newDate,
          formatted: newDate.toISOString().split('T')[0],
          display: newDate.toLocaleDateString('vi-VN', {
            weekday: 'long',
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
          })
        });
      }
    }
    
    return dates;
  };

  const availableDates = generateAvailableDates();

  // Generate time slots based on selected date
  useEffect(() => {
    if (selectedDate) {
      // Mock time slots - in a real app, these would come from the server based on doctor availability
      const mockTimeSlots = [
        { id: 1, time: '08:00', available: true },
        { id: 2, time: '08:30', available: true },
        { id: 3, time: '09:00', available: true },
        { id: 4, time: '09:30', available: true },
        { id: 5, time: '10:00', available: false },
        { id: 6, time: '10:30', available: true },
        { id: 7, time: '11:00', available: true },
        { id: 8, time: '14:00', available: true },
        { id: 9, time: '14:30', available: false },
        { id: 10, time: '15:00', available: true },
        { id: 11, time: '15:30', available: true },
        { id: 12, time: '16:00', available: true },
        { id: 13, time: '16:30', available: true },
        { id: 14, time: '17:00', available: false },
      ];
      
      setAvailableTimeSlots(mockTimeSlots);
    }
  }, [selectedDate]);

  // Filter doctors based on selected branch and department
  const filteredDoctors = doctors.filter(doctor => {
    let matches = true;
    
    if (formData.branchId && doctor.branchId !== parseInt(formData.branchId)) {
      matches = false;
    }
    
    if (formData.departmentId && doctor.departmentId !== parseInt(formData.departmentId)) {
      matches = false;
    }
    
    return matches;
  });

  // Handle form input changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });

    // Update selected entities when their IDs change
    if (name === 'doctorId' && value) {
      setSelectedDoctor(doctors.find(d => d.id === parseInt(value)));
    }
    
    if (name === 'branchId' && value) {
      setSelectedBranch(branches.find(b => b.id === parseInt(value)));
      // Clear doctor selection if branch changes
      if (formData.branchId !== value) {
        setFormData(prev => ({
          ...prev,
          doctorId: ''
        }));
        setSelectedDoctor(null);
      }
    }
    
    if (name === 'departmentId' && value) {
      setSelectedDepartment(departments.find(d => d.id === parseInt(value)));
      // Clear doctor selection if department changes
      if (formData.departmentId !== value) {
        setFormData(prev => ({
          ...prev,
          doctorId: ''
        }));
        setSelectedDoctor(null);
      }
    }
    
    if (name === 'appointmentDate' && value) {
      setSelectedDate(value);
      // Clear time selection if date changes
      setFormData(prev => ({
        ...prev,
        appointmentTime: ''
      }));
    }
  };

  // Handle form submission
  const handleSubmit = (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    // Simulate API call
    setTimeout(() => {
      console.log('Appointment data:', formData);
      setIsSubmitting(false);
      setSubmitSuccess(true);
      setCurrentStep(5); // Move to success step after submission
    }, 1500);
  };

  // Move to the next step
  const nextStep = () => {
    setCurrentStep(currentStep + 1);
  };

  // Move to the previous step
  const prevStep = () => {
    setCurrentStep(currentStep - 1);
  };

  // Check if current step is valid to proceed
  const isStepValid = () => {
    switch (currentStep) {
      case 1:
        return formData.branchId && formData.departmentId && formData.doctorId;
      case 2:
        return formData.appointmentDate && formData.appointmentTime;
      case 3:
        return formData.fullName && formData.phone && formData.email && formData.dob && formData.gender;
      default:
        return true;
    }
  };

  // Render based on current step
  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="appointment-step">
            <h2 className="step-title">Chọn Bác Sĩ</h2>
            
            <div className="form-group">
              <label htmlFor="branchId">Chi Nhánh</label>
              <select
                id="branchId"
                name="branchId"
                className="form-control"
                value={formData.branchId}
                onChange={handleChange}
              >
                <option value="">-- Chọn Chi Nhánh --</option>
                {branches.map(branch => (
                  <option key={branch.id} value={branch.id}>
                    {branch.name}
                  </option>
                ))}
              </select>
            </div>
            
            <div className="form-group">
              <label htmlFor="departmentId">Chuyên Khoa</label>
              <select
                id="departmentId"
                name="departmentId"
                className="form-control"
                value={formData.departmentId}
                onChange={handleChange}
              >
                <option value="">-- Chọn Chuyên Khoa --</option>
                {departments.map(department => (
                  <option key={department.id} value={department.id}>
                    {department.name}
                  </option>
                ))}
              </select>
            </div>
            
            <div className="form-group">
              <label>Chọn Bác Sĩ</label>
              <div className="doctors-grid">
                {filteredDoctors.length > 0 ? (
                  filteredDoctors.map(doctor => (
                    <div 
                      key={doctor.id} 
                      className={`doctor-card-small ${parseInt(formData.doctorId) === doctor.id ? 'selected' : ''}`}
                      onClick={() => handleChange({
                        target: { name: 'doctorId', value: doctor.id.toString() }
                      })}
                    >
                      <div className="doctor-card-content">
                        <div className="doctor-avatar">
                          {doctor.image ? (
                            <img src={doctor.image} alt={doctor.name} className="doctor-img" />
                          ) : (
                            <div className="avatar-placeholder">{doctor.name.charAt(0)}</div>
                          )}
                        </div>
                        <div className="doctor-info">
                          <h3 className="doctor-name">{doctor.name}</h3>
                          <p className="doctor-specialty">{doctor.specialty}</p>
                          <div className="doctor-rating">
                            {doctor.rating} ⭐ • {doctor.experience} năm kinh nghiệm
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="no-results">
                    <p>Vui lòng chọn chi nhánh và chuyên khoa để xem danh sách bác sĩ</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      
      case 2:
        return (
          <div className="appointment-step">
            <h2 className="step-title">Chọn Ngày và Giờ</h2>
            
            {selectedDoctor && (
              <div className="selected-doctor">
                <h3>Bác sĩ đã chọn:</h3>
                <div className="doctor-card-selected">
                  <div className="doctor-avatar">
                    {selectedDoctor.image ? (
                      <img src={selectedDoctor.image} alt={selectedDoctor.name} className="doctor-img" />
                    ) : (
                      <div className="avatar-placeholder">{selectedDoctor.name.charAt(0)}</div>
                    )}
                  </div>
                  <div className="doctor-info">
                    <h4>{selectedDoctor.name}</h4>
                    <p>{selectedDoctor.specialty}</p>
                    <p>{branches.find(b => b.id === selectedDoctor.branchId)?.name}</p>
                  </div>
                </div>
              </div>
            )}
            
            <div className="form-group">
              <label>Chọn Ngày Khám</label>
              <div className="date-grid">
                {availableDates.map((dateObj, index) => (
                  <div 
                    key={index} 
                    className={`date-card ${formData.appointmentDate === dateObj.formatted ? 'selected' : ''}`}
                    onClick={() => handleChange({
                      target: { name: 'appointmentDate', value: dateObj.formatted }
                    })}
                  >
                    <div className="date-day">{new Date(dateObj.date).toLocaleDateString('vi-VN', { weekday: 'short' })}</div>
                    <div className="date-number">{new Date(dateObj.date).getDate()}</div>
                    <div className="date-month">{new Date(dateObj.date).toLocaleDateString('vi-VN', { month: 'short' })}</div>
                  </div>
                ))}
              </div>
            </div>
            
            {formData.appointmentDate && (
              <div className="form-group">
                <label>Chọn Giờ Khám</label>
                <div className="time-grid">
                  {availableTimeSlots.map(slot => (
                    <div 
                      key={slot.id} 
                      className={`time-card ${!slot.available ? 'unavailable' : ''} ${formData.appointmentTime === slot.time ? 'selected' : ''}`}
                      onClick={() => {
                        if (slot.available) {
                          handleChange({
                            target: { name: 'appointmentTime', value: slot.time }
                          });
                        }
                      }}
                    >
                      {slot.time}
                      {!slot.available && <span className="unavailable-label">Đã đặt</span>}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        );
      
      case 3:
        return (
          <div className="appointment-step">
            <h2 className="step-title">Thông Tin Cá Nhân</h2>
            
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="fullName">Họ và Tên</label>
                <input
                  type="text"
                  id="fullName"
                  name="fullName"
                  className="form-control"
                  placeholder="Nhập họ và tên"
                  value={formData.fullName}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>
            
            <div className="form-row">
              <div className="form-group half">
                <label htmlFor="phone">Số Điện Thoại</label>
                <input
                  type="tel"
                  id="phone"
                  name="phone"
                  className="form-control"
                  placeholder="Nhập số điện thoại"
                  value={formData.phone}
                  onChange={handleChange}
                  required
                />
              </div>
              
              <div className="form-group half">
                <label htmlFor="email">Email</label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  className="form-control"
                  placeholder="Nhập địa chỉ email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>
            
            <div className="form-row">
              <div className="form-group half">
                <label htmlFor="dob">Ngày Sinh</label>
                <input
                  type="date"
                  id="dob"
                  name="dob"
                  className="form-control"
                  value={formData.dob}
                  onChange={handleChange}
                  required
                />
              </div>
              
              <div className="form-group half">
                <label htmlFor="gender">Giới Tính</label>
                <select
                  id="gender"
                  name="gender"
                  className="form-control"
                  value={formData.gender}
                  onChange={handleChange}
                  required
                >
                  <option value="">-- Chọn --</option>
                  <option value="Nam">Nam</option>
                  <option value="Nữ">Nữ</option>
                  <option value="Khác">Khác</option>
                </select>
              </div>
            </div>
            
            <div className="form-group">
              <label htmlFor="symptoms">Triệu Chứng / Lý Do Khám</label>
              <textarea
                id="symptoms"
                name="symptoms"
                className="form-control"
                placeholder="Mô tả triệu chứng hoặc lý do khám bệnh"
                rows="3"
                value={formData.symptoms}
                onChange={handleChange}
              ></textarea>
            </div>
            
            <div className="form-group">
              <label htmlFor="notes">Ghi Chú Thêm</label>
              <textarea
                id="notes"
                name="notes"
                className="form-control"
                placeholder="Thông tin thêm cần lưu ý (nếu có)"
                rows="2"
                value={formData.notes}
                onChange={handleChange}
              ></textarea>
            </div>
          </div>
        );
      
      case 4:
        return (
          <div className="appointment-step confirmation-step">
            <h2 className="step-title">Xác Nhận Thông Tin</h2>
            
            <div className="confirmation-details">
              <div className="confirmation-section">
                <h3>Thông Tin Bác Sĩ & Lịch Khám</h3>
                <div className="detail-row">
                  <span className="detail-label">Bác Sĩ:</span>
                  <span className="detail-value">{selectedDoctor?.name}</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Chuyên Khoa:</span>
                  <span className="detail-value">{selectedDoctor?.specialty}</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Chi Nhánh:</span>
                  <span className="detail-value">{selectedBranch?.name}</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Địa Chỉ:</span>
                  <span className="detail-value">{selectedBranch?.address}</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Ngày Khám:</span>
                  <span className="detail-value">
                    {formData.appointmentDate && new Date(formData.appointmentDate).toLocaleDateString('vi-VN', {
                      weekday: 'long',
                      day: '2-digit',
                      month: '2-digit',
                      year: 'numeric'
                    })}
                  </span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Giờ Khám:</span>
                  <span className="detail-value">{formData.appointmentTime}</span>
                </div>
              </div>
              
              <div className="confirmation-section">
                <h3>Thông Tin Cá Nhân</h3>
                <div className="detail-row">
                  <span className="detail-label">Họ Tên:</span>
                  <span className="detail-value">{formData.fullName}</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Số Điện Thoại:</span>
                  <span className="detail-value">{formData.phone}</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Email:</span>
                  <span className="detail-value">{formData.email}</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Ngày Sinh:</span>
                  <span className="detail-value">
                    {formData.dob && new Date(formData.dob).toLocaleDateString('vi-VN')}
                  </span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Giới Tính:</span>
                  <span className="detail-value">{formData.gender}</span>
                </div>
                {formData.symptoms && (
                  <div className="detail-row">
                    <span className="detail-label">Triệu Chứng:</span>
                    <span className="detail-value">{formData.symptoms}</span>
                  </div>
                )}
                {formData.notes && (
                  <div className="detail-row">
                    <span className="detail-label">Ghi Chú:</span>
                    <span className="detail-value">{formData.notes}</span>
                  </div>
                )}
              </div>
            </div>
            
            <div className="terms-agreement">
              <p>
                Bằng cách xác nhận đặt lịch, bạn đồng ý với <Link to="/terms">Điều khoản dịch vụ</Link> và <Link to="/privacy">Chính sách bảo mật</Link> của chúng tôi.
              </p>
            </div>
            
            <div className="important-notes">
              <h4>Lưu ý quan trọng:</h4>
              <ul>
                <li>Vui lòng đến trước giờ hẹn 15 phút để hoàn tất thủ tục đăng ký.</li>
                <li>Mang theo CMND/CCCD và thẻ BHYT (nếu có).</li>
                <li>Nếu cần hủy hoặc thay đổi lịch hẹn, vui lòng thông báo trước ít nhất 24 giờ.</li>
              </ul>
            </div>
          </div>
        );
      
      case 5:
        return (
          <div className="appointment-step success-step">
            <div className="success-icon">✓</div>
            <h2 className="success-title">Đặt Lịch Thành Công!</h2>
            <p className="success-message">
              Cảm ơn bạn đã đặt lịch khám tại hệ thống của chúng tôi. Chúng tôi sẽ gửi xác nhận qua email và SMS trong thời gian sớm nhất.
            </p>
            
            <div className="appointment-summary">
              <h3>Thông Tin Lịch Hẹn</h3>
              <div className="summary-detail">
                <span>Bác Sĩ:</span> {selectedDoctor?.name}
              </div>
              <div className="summary-detail">
                <span>Ngày Khám:</span> {formData.appointmentDate && new Date(formData.appointmentDate).toLocaleDateString('vi-VN', {
                  weekday: 'long',
                  day: '2-digit',
                  month: '2-digit',
                  year: 'numeric'
                })}
              </div>
              <div className="summary-detail">
                <span>Giờ Khám:</span> {formData.appointmentTime}
              </div>
              <div className="summary-detail">
                <span>Chi Nhánh:</span> {selectedBranch?.name}
              </div>
              <div className="summary-detail">
                <span>Địa Chỉ:</span> {selectedBranch?.address}
              </div>
            </div>
            
            <div className="success-actions">
              <Link to="/" className="btn btn-primary">Về Trang Chủ</Link>
              <Link to="/appointment" className="btn btn-outline">Đặt Lịch Khác</Link>
            </div>
          </div>
        );
      
      default:
        return null;
    }
  };

  // Render form progress indicator
  const renderProgress = () => {
    const steps = [
      { number: 1, name: 'Chọn Bác Sĩ' },
      { number: 2, name: 'Chọn Lịch' },
      { number: 3, name: 'Thông Tin' },
      { number: 4, name: 'Xác Nhận' },
    ];
    
    return (
      <div className="appointment-progress">
        {steps.map(step => (
          <div
            key={step.number}
            className={`progress-step ${currentStep >= step.number ? 'active' : ''} ${currentStep > step.number ? 'completed' : ''}`}
          >
            <div className="step-number">{step.number}</div>
            <div className="step-name">{step.name}</div>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="appointment-page">
      <section className="page-hero">
        <div className="container">
          <h1 className="page-title">Đặt Lịch Khám</h1>
          <p className="page-description">
            Đặt lịch khám dễ dàng, nhanh chóng và tiện lợi với hệ thống đặt lịch trực tuyến của chúng tôi.
          </p>
        </div>
      </section>
      
      <section className="appointment-section section">
        <div className="container">
          {currentStep <= 4 && renderProgress()}
          
          <div className="appointment-container">
            <form onSubmit={handleSubmit}>
              {renderStep()}
              
              <div className="appointment-actions">
                {currentStep > 1 && currentStep <= 4 && (
                  <button
                    type="button"
                    className="btn btn-outline"
                    onClick={prevStep}
                  >
                    Quay Lại
                  </button>
                )}
                
                {currentStep < 4 ? (
                  <button
                    type="button"
                    className="btn btn-primary"
                    onClick={nextStep}
                    disabled={!isStepValid()}
                  >
                    Tiếp Tục
                  </button>
                ) : currentStep === 4 ? (
                  <button
                    type="submit"
                    className="btn btn-success"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? 'Đang Xử Lý...' : 'Xác Nhận Đặt Lịch'}
                  </button>
                ) : null}
              </div>
            </form>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Appointment; 