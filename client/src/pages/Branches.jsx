import React, { useState } from 'react';
import { Link } from 'react-router-dom';

const Branches = () => {
  // Filter state for search
  const [searchQuery, setSearchQuery] = useState('');

  // Mock data for branches with images
  const branches = [
    {
      id: 1,
      name: 'Bệnh Viện Trung Tâm',
      address: '123 Đường Nguyễn Huệ, Quận 1, TP.HCM',
      phone: '(028) 3822 1234',
      image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/c6/Eo_circle_indigo_white_number-1.svg/768px-Eo_circle_indigo_white_number-1.svg.png',
      hours: 'Ngày thường: 7:00 - 20:00<br/>Cuối tuần: 8:00 - 17:00',
      email: 'trungtam@benhvien.com',
      description: 'Bệnh viện trung tâm là cơ sở y tế chính của hệ thống với đầy đủ các khoa chuyên môn và trang thiết bị hiện đại. Chúng tôi cung cấp dịch vụ chăm sóc sức khỏe toàn diện cho người dân tại khu vực trung tâm thành phố.',
      specialties: ['Nội Tổng Quát', 'Thần Kinh', 'Chỉnh Hình', 'Tim Mạch', 'Sản Phụ Khoa', 'Nhi Khoa'],
      facilities: ['Phòng khám', 'Phòng mổ', 'Phòng hồi sức', 'Phòng xét nghiệm', 'Khoa cấp cứu 24/7', 'Khoa chẩn đoán hình ảnh']
    },
    {
      id: 2,
      name: 'Phòng Khám Đa Khoa Đông',
      address: '456 Đường Lê Lợi, Quận 3, TP.HCM',
      phone: '(028) 3833 5678',
      image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/cd/Number_2_in_light_blue_rounded_square.svg/768px-Number_2_in_light_blue_rounded_square.svg.png',
      hours: 'Ngày thường: 7:30 - 19:30<br/>Cuối tuần: 8:00 - 16:00',
      email: 'dongclinic@benhvien.com',
      description: 'Phòng khám đa khoa Đông là cơ sở y tế hiện đại phục vụ người dân khu vực phía đông thành phố. Với đội ngũ y bác sĩ chuyên môn cao, chúng tôi cung cấp dịch vụ khám chữa bệnh chất lượng và tiện lợi.',
      specialties: ['Nội Tổng Quát', 'Tiêu Hóa', 'Sản Phụ Khoa', 'Nhi Khoa', 'Tai Mũi Họng'],
      facilities: ['Phòng khám', 'Phòng xét nghiệm', 'Phòng siêu âm', 'Phòng X-quang']
    },
    {
      id: 3,
      name: 'Trung Tâm Y Tế Tây',
      address: '789 Đường Cách Mạng Tháng 8, Quận 10, TP.HCM',
      phone: '(028) 3844 9012',
      image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/15/Eo_circle_indigo_white_number-3.svg/768px-Eo_circle_indigo_white_number-3.svg.png',
      hours: 'Ngày thường: 8:00 - 20:00<br/>Cuối tuần: 8:30 - 17:30',
      email: 'tayclinic@benhvien.com',
      description: 'Trung tâm y tế Tây là một cơ sở y tế mới được trang bị các thiết bị hiện đại nhất. Chúng tôi chuyên cung cấp dịch vụ chăm sóc sức khỏe gia đình và điều trị ngoại trú cho người dân khu vực phía tây thành phố.',
      specialties: ['Y Học Gia Đình', 'Nội Khoa', 'Nhi Khoa', 'Da Liễu', 'Tim Mạch'],
      facilities: ['Phòng khám', 'Phòng tiểu phẫu', 'Phòng hồi sức', 'Phòng xét nghiệm', 'Chuẩn đoán hình ảnh']
    },
  ];

  // Filter branches based on search query
  const filteredBranches = branches.filter(branch => 
    branch.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    branch.address.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="branches-page">
      <section className="page-hero">
        <div className="container">
          <h1 className="page-title">Các Chi Nhánh</h1>
          <p className="page-description">
            Tìm chi nhánh gần nhất để được chăm sóc sức khỏe chất lượng cao.
          </p>
        </div>
      </section>

      <section className="branches-list-section section">
        <div className="container">
          <div className="search-container">
            <div className="search-box">
              <input
                type="text"
                className="form-control"
                placeholder="Tìm kiếm theo tên hoặc địa chỉ..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              {searchQuery && (
                <button 
                  className="clear-search" 
                  onClick={() => setSearchQuery('')}
                >
                  &times;
                </button>
              )}
            </div>
          </div>

          <div className="branches-grid grid">
            {filteredBranches.map(branch => (
              <div key={branch.id} className="branch-card card">
                <div className="branch-image-container">
                  <img src={branch.image} alt={branch.name} className="branch-card-img" />
                </div>
                <div className="card-body">
                  <h3 className="card-title">{branch.name}</h3>
                  <div className="branch-address">
                    <i className="location-icon">📍</i> {branch.address}
                  </div>
                  <div className="branch-contact">
                    <div><i className="phone-icon">📞</i> {branch.phone}</div>
                    <div><i className="email-icon">✉️</i> {branch.email}</div>
                  </div>
                  <div className="branch-hours" dangerouslySetInnerHTML={{ __html: branch.hours }}></div>
                  <div className="branch-specialties">
                    <h4>Chuyên Khoa</h4>
                    <div className="specialties-tags">
                      {branch.specialties.slice(0, 4).map((specialty, index) => (
                        <span key={index} className="specialty-tag">{specialty}</span>
                      ))}
                      {branch.specialties.length > 4 && (
                        <span className="specialty-tag more-tag">+{branch.specialties.length - 4}</span>
                      )}
                    </div>
                  </div>
                  <div className="branch-actions">
                    <Link to={`/branches/${branch.id}`} className="btn btn-outline">Chi Tiết</Link>
                    <Link to={`/appointment?branchId=${branch.id}`} className="btn btn-primary">Đặt Lịch</Link>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {filteredBranches.length === 0 && (
            <div className="no-results">
              <p>Không tìm thấy chi nhánh phù hợp với tìm kiếm của bạn.</p>
              <button 
                className="btn btn-primary" 
                onClick={() => setSearchQuery('')}
              >
                Xem tất cả chi nhánh
              </button>
            </div>
          )}
        </div>
      </section>

      <section className="map-section section">
        <div className="container">
          <h2 className="section-title">Bản Đồ Chi Nhánh</h2>
          <p className="section-description">
            Tìm chi nhánh gần nhất với vị trí của bạn trên bản đồ
          </p>
          <div className="branch-map">
            <div className="map-placeholder">
              <p>Bản đồ hiển thị tất cả chi nhánh</p>
              <p className="map-note">Trong ứng dụng thực tế, đây sẽ là bản đồ Google Maps hiển thị vị trí các chi nhánh</p>
            </div>
          </div>
        </div>
      </section>

      <section className="contact-cta section">
        <div className="container">
          <div className="cta-box">
            <h3 className="cta-title">Bạn Cần Hỗ Trợ?</h3>
            <p className="cta-text">
              Liên hệ với chúng tôi để được hỗ trợ tìm chi nhánh phù hợp nhất với nhu cầu của bạn.
            </p>
            <div className="cta-actions">
              <a href="tel:(028)38221234" className="btn btn-outline">Gọi Hotline</a>
              <Link to="/appointment" className="btn btn-primary">Đặt Lịch Ngay</Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Branches; 