import React, { useState } from 'react';
import { Link } from 'react-router-dom';

const Doctors = () => {
  // Filter states
  const [selectedDepartment, setSelectedDepartment] = useState('');
  const [selectedBranch, setSelectedBranch] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  // Mock data for doctors
  const allDoctors = [
    {
      id: 1,
      name: 'BS. Nguyễn Thị Vân Uyên',
      specialty: 'Nội Tổng Quát',
      rating: 4.8,
      experience: 12,
      image: 'https://media.benhvienhathanh.vn/media/doi_ngu_bac_si/nguy%E1%BB%85n_th%E1%BB%8B_v%C3%A2n_uy%C3%AAn.png',
      branchId: 1,
      departmentId: 1,
      description: 'BS. Nguyễn Thị Vân Uyên là bác sĩ chuyên khoa Nội Tổng Quát với hơn 12 năm kinh nghiệm. Bác sĩ chuyên điều trị các bệnh lý nội khoa và tư vấn chăm sóc sức khỏe toàn diện.'
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
      description: 'BS. Lê Anh Tuấn là bác sĩ chuyên khoa Thần Kinh với 15 năm kinh nghiệm. Bác sĩ chuyên điều trị các bệnh lý thần kinh và đau đầu mạn tính.'
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
      description: 'BS. Nguyễn Khánh Hội là bác sĩ chuyên khoa Nhi với 8 năm kinh nghiệm. Bác sĩ tận tâm trong việc chăm sóc sức khỏe trẻ em từ sơ sinh đến tuổi vị thành niên.'
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
      description: 'BS. Trần Thị Minh Tâm là bác sĩ chuyên khoa Sản Phụ Khoa với 14 năm kinh nghiệm. Bác sĩ chuyên khám và điều trị các bệnh lý phụ khoa, theo dõi thai kỳ và đỡ sinh.'
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
      description: 'BS. Nguyễn Văn Hiếu là bác sĩ chuyên khoa Tim Mạch với 18 năm kinh nghiệm. Bác sĩ chuyên điều trị các bệnh lý tim mạch và cấp cứu tim mạch.'
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
      description: 'BS. Phạm Thị Lan Anh là bác sĩ chuyên khoa Da Liễu với 10 năm kinh nghiệm. Bác sĩ chuyên điều trị các bệnh lý về da và thẩm mỹ da.'
    },
  ];

  // Mock departments and branches
  const departments = [
    { id: 1, name: 'Nội Tổng Quát' },
    { id: 2, name: 'Thần Kinh' },
    { id: 3, name: 'Nhi Khoa' },
    { id: 4, name: 'Sản Phụ Khoa' },
    { id: 5, name: 'Tim Mạch' },
    { id: 6, name: 'Da Liễu' },
  ];

  const branches = [
    { id: 1, name: 'Bệnh Viện Trung Tâm' },
    { id: 2, name: 'Phòng Khám Đa Khoa Đông' },
    { id: 3, name: 'Trung Tâm Y Tế Tây' },
  ];

  // Filter doctors based on selected filters
  const filteredDoctors = allDoctors.filter(doctor => {
    const matchesDepartment = selectedDepartment ? doctor.departmentId === parseInt(selectedDepartment) : true;
    const matchesBranch = selectedBranch ? doctor.branchId === parseInt(selectedBranch) : true;
    const matchesSearch = searchQuery ? 
      doctor.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
      doctor.specialty.toLowerCase().includes(searchQuery.toLowerCase()) : 
      true;
    
    return matchesDepartment && matchesBranch && matchesSearch;
  });

  // Handle filter changes
  const handleDepartmentChange = (e) => {
    setSelectedDepartment(e.target.value);
  };

  const handleBranchChange = (e) => {
    setSelectedBranch(e.target.value);
  };

  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
  };

  // Clear all filters
  const clearFilters = () => {
    setSelectedDepartment('');
    setSelectedBranch('');
    setSearchQuery('');
  };

  return (
    <div className="doctors-page">
      <section className="page-hero">
        <div className="container">
          <h1 className="page-title">Đội Ngũ Bác Sĩ</h1>
          <p className="page-description">
            Đội ngũ bác sĩ chuyên nghiệp, giàu kinh nghiệm của chúng tôi luôn sẵn sàng phục vụ quý khách.
          </p>
        </div>
      </section>

      <section className="doctors-list-section section">
        <div className="container">
          <div className="filters-container">
            <div className="filter-header">
              <h2 className="filter-title">Tìm kiếm bác sĩ</h2>
            </div>
            
            <div className="filters-row">
              <div className="filter-group">
                <input 
                  type="text" 
                  className="form-control"
                  placeholder="Tìm theo tên hoặc chuyên khoa"
                  value={searchQuery}
                  onChange={handleSearchChange}
                />
              </div>
              
              <div className="filter-group">
                <select 
                  className="form-control"
                  value={selectedDepartment}
                  onChange={handleDepartmentChange}
                >
                  <option value="">Tất cả chuyên khoa</option>
                  {departments.map(dept => (
                    <option key={dept.id} value={dept.id}>
                      {dept.name}
                    </option>
                  ))}
                </select>
              </div>
              
              <div className="filter-group">
                <select 
                  className="form-control"
                  value={selectedBranch}
                  onChange={handleBranchChange}
                >
                  <option value="">Tất cả chi nhánh</option>
                  {branches.map(branch => (
                    <option key={branch.id} value={branch.id}>
                      {branch.name}
                    </option>
                  ))}
                </select>
              </div>
              
              <div className="filter-group filter-actions">
                <button className="btn btn-outline" onClick={clearFilters}>
                  Xóa bộ lọc
                </button>
              </div>
            </div>
          </div>

          {/* Doctors Grid */}
          {filteredDoctors.length > 0 ? (
            <div className="doctors-grid grid">
              {filteredDoctors.map(doctor => (
                <div key={doctor.id} className="doctor-card card">
                  <div className="card-img-container">
                    {doctor.image ? (
                      <img src={doctor.image} alt={doctor.name} className="doctor-card-img" />
                    ) : (
                      <div className="doctor-img-placeholder">
                        {doctor.name.charAt(0)}
                      </div>
                    )}
                  </div>
                  <div className="card-body">
                    <h3 className="card-title">{doctor.name}</h3>
                    <div className="doctor-specialty">{doctor.specialty}</div>
                    <div className="doctor-rating">{doctor.rating} ⭐ • {doctor.experience} năm kinh nghiệm</div>
                    <p className="card-text">{doctor.description}</p>
                    <div className="doctor-location">
                      <strong>Chi nhánh:</strong> {branches.find(b => b.id === doctor.branchId)?.name}
                    </div>
                    <div className="doctor-actions">
                      <Link to={`/doctors/${doctor.id}`} className="btn btn-outline">Xem Hồ Sơ</Link>
                      <Link to={`/appointment?doctorId=${doctor.id}`} className="btn btn-primary">Đặt Lịch</Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="no-results">
              <p>Không tìm thấy bác sĩ phù hợp với bộ lọc của bạn.</p>
              <button className="btn btn-primary" onClick={clearFilters}>
                Xem tất cả bác sĩ
              </button>
            </div>
          )}
        </div>
      </section>
    </div>
  );
};

export default Doctors; 