import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import '../styles/Home.css';

// Import images later

const Home = () => {
  const [activeIndex, setActiveIndex] = useState(0);
  const [slideFrom, setSlideFrom] = useState(null); // 'left' hoặc 'right'
  const [isAnimating, setIsAnimating] = useState(false);
  
  // useEffect để xử lý việc khởi tạo bootstrap carousel
  useEffect(() => {
    // Không cần liên kết sự kiện ở đây vì đã có onClick
  }, []);

  // Sample doctor data
  const featuredDoctors = [
    {
      id: 1,
      name: 'BS. Nguyễn Thị Vân Uyên',
      specialty: 'Nội Tổng Quát',
      rating: 4.8,
      experience: 12,
      image: 'https://media.benhvienhathanh.vn/media/doi_ngu_bac_si/nguy%E1%BB%85n_th%E1%BB%8B_v%C3%A2n_uy%C3%AAn.png',
      description: 'BS. Nguyễn Thị Vân Uyên là bác sĩ chuyên khoa Nội Tổng Quát với hơn 12 năm kinh nghiệm. Bác sĩ chuyên điều trị các bệnh lý nội khoa và tư vấn chăm sóc sức khỏe toàn diện.'
    },
    {
      id: 2,
      name: 'BS. Lê Anh Tuấn',
      specialty: 'Thần Kinh',
      rating: 4.9,
      experience: 15,
      image: 'https://media.benhvienhathanh.vn/media/doi_ngu_bac_si/le_anh_tuan.png',
      description: 'BS. Lê Anh Tuấn là bác sĩ chuyên khoa Thần Kinh với 15 năm kinh nghiệm. Bác sĩ chuyên điều trị các bệnh lý thần kinh và đau đầu mạn tính.'
    },
    {
      id: 3,
      name: 'BS. Nguyễn Khánh Hội',
      specialty: 'Nhi Khoa',
      rating: 4.7,
      experience: 8,
      image: 'https://media.benhvienhathanh.vn/media/doi_ngu_bac_si/nguy%E1%BB%85n_kh%C3%A1nh_h%E1%BB%99i.png',
      description: 'BS. Nguyễn Khánh Hội là bác sĩ chuyên khoa Nhi với 8 năm kinh nghiệm. Bác sĩ tận tâm trong việc chăm sóc sức khỏe trẻ em từ sơ sinh đến tuổi vị thành niên.'
    },
    {
      id: 4,
      name: 'BS. Trần Thị Minh Tâm',
      specialty: 'Sản Phụ Khoa',
      rating: 4.8,
      experience: 14,
      image: 'https://cdn.bookingcare.vn/fr/w300/2018/06/18/090338bac-si-le-thi-kim-tuyen.jpg',
      description: 'BS. Trần Thị Minh Tâm là bác sĩ chuyên khoa Sản Phụ Khoa với 14 năm kinh nghiệm. Bác sĩ chuyên khám và điều trị các bệnh lý phụ khoa, theo dõi thai kỳ và đỡ sinh.'
    },
    {
      id: 5,
      name: 'BS. Nguyễn Văn Hiếu',
      specialty: 'Tim Mạch',
      rating: 4.9,
      experience: 18,
      image: 'https://cdn.bookingcare.vn/fr/w300/2019/12/31/155650-bsckii-tran-minh-khiem.jpg',
      description: 'BS. Nguyễn Văn Hiếu là bác sĩ chuyên khoa Tim Mạch với 18 năm kinh nghiệm. Bác sĩ chuyên điều trị các bệnh lý tim mạch và cấp cứu tim mạch.'
    },
    {
      id: 6,
      name: 'BS. Phạm Thị Lan Anh',
      specialty: 'Da Liễu',
      rating: 4.7,
      experience: 10,
      image: 'https://cdn.bookingcare.vn/fr/w300/2021/01/18/105401-bsck2-nguyen-thi-hoai-an.jpg',
      description: 'BS. Phạm Thị Lan Anh là bác sĩ chuyên khoa Da Liễu với 10 năm kinh nghiệm. Bác sĩ chuyên điều trị các bệnh lý về da và thẩm mỹ da.'
    }
  ];

  // Sample branch data
  const branches = [
    {
      id: 1,
      name: 'Bệnh Viện Trung Tâm',
      address: '123 Đường Nguyễn Huệ, Quận 1, TP.HCM',
      phone: '(028) 3822 1234',
      image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/c6/Eo_circle_indigo_white_number-1.svg/768px-Eo_circle_indigo_white_number-1.svg.png',
      hours: 'Ngày thường: 7:00 - 20:00<br/>Cuối tuần: 8:00 - 17:00',
      specialties: ['Nội Tổng Quát', 'Thần Kinh', 'Chỉnh Hình', '+3 khác']
    },
    {
      id: 2,
      name: 'Phòng Khám Đa Khoa Đông',
      address: '456 Đường Lê Lợi, Quận 3, TP.HCM',
      phone: '(028) 3833 5678',
      image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/cd/Number_2_in_light_blue_rounded_square.svg/768px-Number_2_in_light_blue_rounded_square.svg.png',
      hours: 'Ngày thường: 7:30 - 19:30<br/>Cuối tuần: 8:00 - 16:00',
      specialties: ['Nội Tổng Quát', 'Tiêu Hóa', 'Sản Phụ Khoa', '+2 khác']
    },
    {
      id: 3,
      name: 'Trung Tâm Y Tế Tây',
      address: '789 Đường Cách Mạng Tháng 8, Quận 10, TP.HCM',
      phone: '(028) 3844 9012',
      image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/15/Eo_circle_indigo_white_number-3.svg/768px-Eo_circle_indigo_white_number-3.svg.png',
      hours: 'Ngày thường: 8:00 - 20:00<br/>Cuối tuần: 8:30 - 17:30',
      specialties: ['Y Học Gia Đình', 'Nội Khoa', 'Nhi Khoa', '+2 khác']
    }
  ];

  const handlePrevious = () => {
    if (isAnimating) return;
    
    setIsAnimating(true);
    setSlideFrom('left');
    
    // Tính chỉ số mới ngay lập tức
    const newIndex = activeIndex === 0 ? featuredDoctors.length - 1 : activeIndex - 1;
    setActiveIndex(newIndex);
    
    // Reset trạng thái sau khi animation hoàn thành
    setTimeout(() => {
      setIsAnimating(false);
    }, 600); // Thời gian bằng với thời gian animation
  };
  
  const handleNext = () => {
    if (isAnimating) return;
    
    setIsAnimating(true);
    setSlideFrom('right');
    
    // Tính chỉ số mới ngay lập tức
    const newIndex = activeIndex === featuredDoctors.length - 1 ? 0 : activeIndex + 1;
    setActiveIndex(newIndex);
    
    // Reset trạng thái sau khi animation hoàn thành
    setTimeout(() => {
      setIsAnimating(false);
    }, 600); // Thời gian bằng với thời gian animation
  };

  // Function to determine slide class
  const getSlideClass = (index) => {
    if (index === activeIndex) {
      return slideFrom ? `active from-${slideFrom}` : 'active';
    }
    return '';
  };

  return (
    <div className="home-page">
      {/* Hero Section */}
      <section className="hero">
        <div className="container">
          <div className="hero-content">
            <h1 className="hero-title">Bệnh viện</h1>
            <h2 className="hero-subtitle">Nhà Cung Cấp Dịch Vụ Y Tế Hàng Đầu</h2>
            <div className="hero-description">
              <h1>Sức Khỏe Của Bạn Là Ưu Tiên Hàng Đầu Của Chúng Tôi</h1>
              <p>Chúng tôi cung cấp dịch vụ chăm sóc sức khỏe toàn diện với cơ sở vật chất hiện đại và đội ngũ y bác sĩ giàu kinh nghiệm.</p>
            </div>
            <div className="hero-buttons">
              <Link to="/appointment" className="btn btn-primary">Đặt Lịch Khám</Link>
              <Link to="/branches" className="btn btn-secondary">Các Chi Nhánh</Link>
            </div>
          </div>
        </div>
      </section>

      {/* Quality Care Section */}
      <section className="quality-care section">
        <div className="container">
          <h2 className="section-title">Chăm Sóc Sức Khỏe Chất Lượng Cao</h2>
          <p className="section-description text-center">
            Chúng tôi cung cấp dịch vụ chăm sóc sức khỏe toàn diện với cơ sở vật chất hiện đại và đội ngũ y bác sĩ giàu kinh nghiệm.
          </p>

          {/* Stats */}
          <div className="stats-grid">
            <div className="stat-item">
              <div className="stat-number">15,200</div>
              <div className="stat-label">Bệnh Nhân Hài Lòng</div>
            </div>
            <div className="stat-item">
              <div className="stat-number">87</div>
              <div className="stat-label">Bác Sĩ Chuyên Khoa</div>
            </div>
            <div className="stat-item">
              <div className="stat-number">3</div>
              <div className="stat-label">Chi Nhánh</div>
            </div>
            <div className="stat-item">
              <div className="stat-number">15,782</div>
              <div className="stat-label">Lượt Khám</div>
            </div>
          </div>
        </div>
      </section>

      {/* Hospital Building */}
      <section className="hospital-building section">
        <div className="container">
          <div className="building-image">
            <img src="https://bvbinhdan.com.vn/vnt_upload/gallery/08_2018/g1.jpg" alt="Tòa Nhà Bệnh Viện" className="hospital-img" />
          </div>
        </div>
      </section>

      {/* Doctors Section */}
      <section className="doctors-section section py-5">
        <div className="container">
          <div className="doctors-header text-center mb-5">
            <h2 className="section-title fw-bold text-primary">Đội Ngũ Y Bác Sĩ</h2>
            <h3 className="section-subtitle fs-2 mb-3">Gặp Gỡ Các Chuyên Gia Của Chúng Tôi</h3>
            <p className="section-description text-muted mx-auto" style={{maxWidth: '800px'}}>
              Đội ngũ bác sĩ giàu kinh nghiệm của chúng tôi luôn tận tâm cung cấp dịch vụ chăm sóc sức khỏe chất lượng cao nhất.
            </p>
          </div>

          <div className="carousel doctor-carousel-container">
            <div className="carousel-inner">
              {featuredDoctors.map((doctor, index) => (
                <div key={doctor.id} className={`carousel-item ${getSlideClass(index)}`}>
                  <div className="doctor-card-horizontal">
                    <div className="row no-gutters">
                      <div className="col-md-5">
                        <div className="doctor-image-container">
                          <img src={doctor.image} alt={doctor.name} className="doctor-image" />
                        </div>
                      </div>
                      <div className="col-md-7">
                        <div className="doctor-info">
                          <div className="doctor-rating">
                            <i className="fas fa-star"></i> {doctor.rating}
                          </div>
                          <h3 className="doctor-name">{doctor.name}</h3>
                          <div className="doctor-specialty">{doctor.specialty} • {doctor.experience} năm kinh nghiệm</div>
                          <p className="doctor-description">{doctor.description}</p>
                          <Link to={`/doctors/${doctor.id}`} className="doctor-btn">
                            <i className="fas fa-user-md"></i> Xem Hồ Sơ & Đặt Lịch
                          </Link>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            
            {/* Circle Navigation Buttons */}
            <div className="circle-navigation-buttons">
              <button 
                className="circle-prev" 
                type="button" 
                onClick={handlePrevious}
                disabled={isAnimating}
              >
                <i className="fas fa-chevron-left"></i>
                <span>Previous</span>
              </button>
              <button 
                className="circle-next" 
                type="button" 
                onClick={handleNext}
                disabled={isAnimating}
              >
                <i className="fas fa-chevron-right"></i>
                <span>Next</span>
              </button>
            </div>
          </div>

          <div className="doctors-footer text-center mt-5">
            <Link to="/doctors" className="btn btn-outline-primary me-3">
              <i className="fas fa-users me-2"></i>Xem Tất Cả Bác Sĩ
            </Link>
            <Link to="/appointment" className="btn btn-primary">
              <i className="fas fa-calendar-check me-2"></i>Đặt Lịch Khám Ngay
            </Link>
          </div>
        </div>
      </section>

      {/* Branches Section */}
      <section className="branches-section section">
        <div className="container">
          <div className="branches-header">
            <h2 className="section-title">Các Chi Nhánh</h2>
            <h3 className="section-subtitle">Chi Nhánh Bệnh Viện</h3>
            <p className="section-description text-center">
              Tìm chi nhánh bệnh viện gần nhất với dịch vụ chăm sóc chuyên biệt đáp ứng nhu cầu sức khỏe của bạn.
            </p>
          </div>

          <div className="branches-grid grid">
            {branches.map(branch => (
              <div key={branch.id} className="branch-card card">
                <div className="card-body">
                  <div className="branch-image-container">
                    <img src={branch.image} alt={branch.name} className="branch-image" />
                  </div>
                  <h3 className="card-title">{branch.name}</h3>
                  <div className="branch-address">{branch.address}</div>
                  <div className="branch-phone">{branch.phone}</div>
                  <div className="branch-hours" dangerouslySetInnerHTML={{ __html: branch.hours }}></div>
                  <div className="branch-specialties">
                    <h4>Chuyên Khoa</h4>
                    <ul>
                      {branch.specialties.map((specialty, index) => (
                        <li key={index}>{specialty}</li>
                      ))}
                    </ul>
                  </div>
                  <Link to={`/branches/${branch.id}`} className="btn btn-primary">Xem Chi Tiết</Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="testimonials-section section">
        <div className="container">
          <div className="testimonials-header">
            <h2 className="section-title">Đánh Giá Từ Bệnh Nhân</h2>
            <h3 className="section-subtitle">Bệnh Nhân Nói Gì Về Chúng Tôi</h3>
            <p className="section-description text-center">
              Đọc về trải nghiệm của bệnh nhân và hành trình hướng tới sức khỏe tốt hơn cùng chúng tôi.
            </p>
          </div>

          <div className="testimonials-grid grid">
            {/* Testimonial 1 */}
            <div className="testimonial-card card">
              <div className="card-body">
                <div className="testimonial-quote">
                  "Dịch vụ chăm sóc tôi nhận được tại Bệnh viện Trung tâm thật xuất sắc. Các bác sĩ rất chu đáo và dành thời gian giải thích mọi thứ cho tôi. Tôi cảm thấy thoải mái và được chăm sóc tốt trong suốt quá trình điều trị."
                </div>
                <div className="testimonial-author">
                  <div className="author-name">Nguyễn Thị Hương</div>
                  <div className="author-info">Bệnh nhân Khoa Tim mạch</div>
                </div>
              </div>
            </div>

            {/* Testimonial 2 */}
            <div className="testimonial-card card">
              <div className="card-body">
                <div className="testimonial-quote">
                  "Tôi đã rất lo lắng về ca phẫu thuật của mình, nhưng đội ngũ y tế tại Trung tâm Y tế Đông đã giúp tôi cảm thấy an tâm. Ca phẫu thuật diễn ra suôn sẻ và việc chăm sóc sau đó rất tuyệt vời. Tôi biết ơn vì chuyên môn của họ."
                </div>
                <div className="testimonial-author">
                  <div className="author-name">Trần Văn Minh</div>
                  <div className="author-info">Phẫu thuật Chỉnh hình</div>
                </div>
              </div>
            </div>

            {/* Testimonial 3 */}
            <div className="testimonial-card card">
              <div className="card-body">
                <div className="testimonial-quote">
                  "Trải nghiệm của tôi với Bác sĩ Rodriguez thật tuyệt vời. Cô ấy rất tận tâm, chu đáo và thực sự lắng nghe những lo lắng của tôi. Nhân viên rất thân thiện và cơ sở vật chất sạch sẽ, hiện đại."
                </div>
                <div className="testimonial-author">
                  <div className="author-name">Lê Thị Mai</div>
                  <div className="author-info">Chăm sóc Nhi khoa</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="cta-section section">
        <div className="container">
          <div className="cta-content text-center">
            <h2 className="section-title">Đặt Lịch Khám Ngay Hôm Nay</h2>
            <p className="section-description">
              Đội ngũ y bác sĩ giàu kinh nghiệm của chúng tôi luôn sẵn sàng cung cấp dịch vụ chăm sóc sức khỏe tốt nhất cho bạn.
            </p>
            <div className="cta-buttons">
              <Link to="/appointment" className="btn btn-primary">Đặt Lịch Khám</Link>
              <Link to="/contact" className="btn btn-secondary">Liên Hệ Chúng Tôi</Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home; 