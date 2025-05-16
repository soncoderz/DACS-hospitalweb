import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FaArrowLeft, FaCalendarCheck, FaCheckCircle, FaUserMd, FaProcedures, FaShieldAlt, FaHospital, FaClock, FaAngleRight } from 'react-icons/fa';
import AOS from 'aos';
import 'aos/dist/aos.css';

const FacilitySurgery = () => {
  // Các đội ngũ bác sĩ phẫu thuật tiêu biểu
  const surgeons = [
    {
      id: 1,
      name: 'TS. BS. Nguyễn Văn A',
      specialty: 'Phẫu thuật Tim Mạch',
      experience: '20 năm kinh nghiệm',
      image: 'https://img.freepik.com/free-photo/doctor-with-stethoscope-hands-hospital-background_1423-1.jpg',
      link: '/doctors/1',
    },
    {
      id: 2,
      name: 'PGS. TS. Trần Thị B',
      specialty: 'Phẫu thuật Thần Kinh',
      experience: '15 năm kinh nghiệm',
      image: 'https://img.freepik.com/free-photo/smiling-young-female-doctor-wearing-medical-robe-stethoscope-around-neck-standing-with-closed-posture_409827-254.jpg',
      link: '/doctors/2',
    },
    {
      id: 3,
      name: 'BS. CKI. Phạm Văn C',
      specialty: 'Phẫu thuật Nội Soi',
      experience: '12 năm kinh nghiệm',
      image: 'https://img.freepik.com/free-photo/portrait-smiling-handsome-male-doctor-man_171337-5055.jpg',
      link: '/doctors/3',
    },
  ];

  // Các loại phẫu thuật
  const surgeryTypes = [
    {
      id: 1,
      name: 'Phẫu thuật Tim Mạch',
      description: 'Các can thiệp phẫu thuật tim mạch hiện đại với công nghệ tiên tiến.',
      image: 'https://img.freepik.com/free-photo/surgeon-operation-room_23-2147772466.jpg'
    },
    {
      id: 2,
      name: 'Phẫu thuật Thần Kinh',
      description: 'Phẫu thuật điều trị các bệnh lý về não và hệ thần kinh.',
      image: 'https://img.freepik.com/free-photo/brain-surgery-operation-progress-professional-doctors-modern-hospital_482257-21597.jpg'
    },
    {
      id: 3,
      name: 'Phẫu thuật Nội Soi',
      description: 'Phương pháp phẫu thuật ít xâm lấn giúp giảm đau và phục hồi nhanh.',
      image: 'https://img.freepik.com/free-photo/group-doctors-discussing-x-ray-scan-during-meeting-hospital_637285-632.jpg'
    },
    {
      id: 4,
      name: 'Phẫu thuật Chỉnh Hình',
      description: 'Điều trị các bệnh lý về xương khớp và chấn thương chỉnh hình.',
      image: 'https://img.freepik.com/free-photo/doctors-examining-x-ray-hospital_107420-84781.jpg'
    },
  ];

  // Thiết bị hiện đại
  const equipment = [
    {
      id: 1,
      name: 'Hệ thống Phẫu thuật Robot Da Vinci',
      description: 'Hệ thống phẫu thuật robot tiên tiến giúp phẫu thuật chính xác và ít xâm lấn.',
      features: ['Độ chính xác cao', 'Giảm thiểu xâm lấn', 'Phục hồi nhanh']
    },
    {
      id: 2,
      name: 'Kính hiển vi phẫu thuật Leica',
      description: 'Kính hiển vi phẫu thuật cho phép bác sĩ thực hiện các thao tác phẫu thuật tinh vi.',
      features: ['Hình ảnh 3D sắc nét', 'Chiếu sáng tối ưu', 'Tích hợp hệ thống ghi hình']
    },
    {
      id: 3,
      name: 'Hệ thống Monitoring trong phẫu thuật',
      description: 'Theo dõi liên tục các chỉ số sống còn của bệnh nhân trong suốt quá trình phẫu thuật.',
      features: ['Cảnh báo sớm', 'Theo dõi đa thông số', 'Kết nối trực tuyến']
    },
  ];

  useEffect(() => {
    AOS.init({
      duration: 1000,
      once: true,
      easing: 'ease-out-cubic'
    });
    
    // Cuộn lên đầu trang khi component được mount
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <section className="relative py-20 bg-gradient-to-r from-blue-600 to-blue-800 text-white">
        <div className="absolute inset-0 overflow-hidden">
          <img 
            src="https://img.freepik.com/free-photo/interior-view-operating-room_1170-2254.jpg" 
            alt="Phòng phẫu thuật" 
            className="w-full h-full object-cover opacity-20"
          />
        </div>
        
        <div className="container mx-auto px-4 relative z-10">
          <Link 
            to="/facilities" 
            className="inline-flex items-center text-white bg-blue-500/30 px-4 py-2 rounded-lg hover:bg-blue-500/50 transition-colors mb-8"
          >
            <FaArrowLeft className="mr-2" /> Quay lại tất cả cơ sở
          </Link>
          
          <div className="max-w-3xl">
            <h1 className="text-4xl md:text-5xl font-bold mb-6" data-aos="fade-up">Phòng Phẫu Thuật Hiện Đại</h1>
            <p className="text-xl opacity-90 mb-8 leading-relaxed" data-aos="fade-up" data-aos-delay="100">
              Hệ thống phòng phẫu thuật của chúng tôi được trang bị những thiết bị y tế tiên tiến nhất, 
              đạt chuẩn quốc tế, đảm bảo môi trường vô trùng tuyệt đối và an toàn nhất cho bệnh nhân.
            </p>
            
            <div className="flex flex-wrap gap-4" data-aos="fade-up" data-aos-delay="200">
              <Link 
                to="/appointment" 
                className="bg-white text-blue-600 hover:bg-blue-50 px-6 py-3 rounded-lg font-medium transition-colors flex items-center"
              >
                <FaCalendarCheck className="mr-2" /> Đặt Lịch Khám
              </Link>
              <Link 
                to="/contact" 
                className="bg-transparent border-2 border-white text-white hover:bg-white hover:text-blue-600 px-6 py-3 rounded-lg font-medium transition-colors"
              >
                Liên Hệ Tư Vấn
              </Link>
            </div>
          </div>
        </div>
        
        {/* Wave Bottom */}
        <svg className="absolute bottom-0 left-0 w-full text-gray-50" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1440 320">
          <path fill="currentColor" fillOpacity="1" d="M0,224L48,213.3C96,203,192,181,288,181.3C384,181,480,203,576,202.7C672,203,768,181,864,181.3C960,181,1056,203,1152,213.3C1248,224,1344,224,1392,224L1440,224L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z"></path>
        </svg>
      </section>
      
      {/* Overview Section */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            <div data-aos="fade-right">
              <h2 className="text-3xl font-bold text-gray-800 mb-6">
                <span className="inline-block border-b-4 border-blue-500 pb-2">Tổng Quan</span>
              </h2>
              <p className="text-gray-600 mb-6 leading-relaxed">
                Hệ thống phòng phẫu thuật của Bệnh viện chúng tôi được thiết kế và xây dựng theo tiêu chuẩn quốc tế, 
                đảm bảo môi trường vô trùng tuyệt đối, được trang bị đầy đủ các thiết bị y tế hiện đại nhất.
              </p>
              <p className="text-gray-600 mb-6 leading-relaxed">
                Với đội ngũ bác sĩ phẫu thuật giàu kinh nghiệm và tay nghề cao, cùng với công nghệ tiên tiến, 
                chúng tôi tự hào cung cấp dịch vụ phẫu thuật an toàn và hiệu quả, góp phần mang lại sức khỏe và hạnh phúc cho bệnh nhân.
              </p>
              
              <ul className="space-y-3">
                <li className="flex items-start">
                  <FaCheckCircle className="text-green-500 mt-1 mr-2 flex-shrink-0" />
                  <span className="text-gray-700">Thiết kế theo tiêu chuẩn quốc tế</span>
                </li>
                <li className="flex items-start">
                  <FaCheckCircle className="text-green-500 mt-1 mr-2 flex-shrink-0" />
                  <span className="text-gray-700">Hệ thống lọc không khí HEPA hiện đại</span>
                </li>
                <li className="flex items-start">
                  <FaCheckCircle className="text-green-500 mt-1 mr-2 flex-shrink-0" />
                  <span className="text-gray-700">Trang thiết bị phẫu thuật tiên tiến</span>
                </li>
                <li className="flex items-start">
                  <FaCheckCircle className="text-green-500 mt-1 mr-2 flex-shrink-0" />
                  <span className="text-gray-700">Đội ngũ phẫu thuật viên hàng đầu</span>
                </li>
              </ul>
            </div>
            
            <div className="relative rounded-2xl overflow-hidden shadow-xl" data-aos="fade-left">
              <img 
                src="https://img.freepik.com/free-photo/interior-view-operating-room_1170-2254.jpg" 
                alt="Phòng phẫu thuật" 
                className="w-full h-full object-cover"
                style={{ minHeight: '400px' }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex items-end">
                <div className="p-6">
                  <div className="text-white font-bold mb-2">Hệ thống 10+ phòng phẫu thuật hiện đại</div>
                  <div className="flex space-x-4">
                    <div className="bg-blue-600/80 text-white text-xs py-1 px-3 rounded-full">Phẫu thuật thường</div>
                    <div className="bg-blue-600/80 text-white text-xs py-1 px-3 rounded-full">Phẫu thuật nội soi</div>
                    <div className="bg-blue-600/80 text-white text-xs py-1 px-3 rounded-full">Phẫu thuật robot</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
      
      {/* Features Section */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12" data-aos="fade-up">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-800">
              <span className="inline-block border-b-4 border-blue-500 pb-2">Trang Thiết Bị Hiện Đại</span>
            </h2>
            <p className="text-gray-600 max-w-3xl mx-auto mt-4 text-lg">
              Hệ thống phòng phẫu thuật của chúng tôi được trang bị đầy đủ các thiết bị y tế hiện đại nhất
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {equipment.map((item, index) => (
              <div 
                key={item.id} 
                className="bg-gray-50 rounded-xl shadow-md overflow-hidden hover:shadow-lg transition-shadow"
                data-aos="fade-up" 
                data-aos-delay={index * 100}
              >
                <div className="p-6">
                  <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center mb-4">
                    <FaProcedures className="text-xl text-blue-600" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-3">{item.name}</h3>
                  <p className="text-gray-600 mb-4">{item.description}</p>
                  <div className="space-y-2">
                    {item.features.map((feature, idx) => (
                      <div key={idx} className="flex items-center">
                        <FaCheckCircle className="text-green-500 mr-2 flex-shrink-0" />
                        <span className="text-gray-700 text-sm">{feature}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
      
      {/* Surgery Types */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12" data-aos="fade-up">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-800">
              <span className="inline-block border-b-4 border-blue-500 pb-2">Các Loại Phẫu Thuật</span>
            </h2>
            <p className="text-gray-600 max-w-3xl mx-auto mt-4 text-lg">
              Chúng tôi thực hiện đa dạng các loại phẫu thuật với công nghệ tiên tiến và bác sĩ giàu kinh nghiệm
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {surgeryTypes.map((surgery, index) => (
              <div 
                key={surgery.id} 
                className="bg-white rounded-xl shadow-md overflow-hidden flex flex-col md:flex-row hover:shadow-xl transition-shadow"
                data-aos="fade-up"
                data-aos-delay={index * 100}
              >
                <div className="md:w-2/5 relative">
                  <img 
                    src={surgery.image} 
                    alt={surgery.name} 
                    className="w-full h-full object-cover"
                    style={{ minHeight: '200px' }}
                  />
                </div>
                <div className="md:w-3/5 p-6">
                  <h3 className="text-xl font-bold text-gray-900 mb-2">{surgery.name}</h3>
                  <p className="text-gray-600 mb-4">{surgery.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
      
      {/* Expert Surgeons */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12" data-aos="fade-up">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-800">
              <span className="inline-block border-b-4 border-blue-500 pb-2">Đội Ngũ Bác Sĩ Phẫu Thuật</span>
            </h2>
            <p className="text-gray-600 max-w-3xl mx-auto mt-4 text-lg">
              Đội ngũ bác sĩ phẫu thuật của chúng tôi là những chuyên gia hàng đầu, giàu kinh nghiệm và tay nghề cao
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {surgeons.map((surgeon, index) => (
              <div 
                key={surgeon.id} 
                className="bg-white rounded-xl shadow-md overflow-hidden border border-gray-100 hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
                data-aos="fade-up"
                data-aos-delay={index * 100}
              >
                <div className="relative h-64 overflow-hidden">
                  <img 
                    src={surgeon.image} 
                    alt={surgeon.name}
                    className="w-full h-full object-cover transition-transform duration-500 hover:scale-105"
                  />
                </div>
                <div className="p-6">
                  <h3 className="font-bold text-xl text-gray-900 mb-1">{surgeon.name}</h3>
                  <p className="text-blue-600 font-medium mb-3">{surgeon.specialty}</p>
                  <p className="text-gray-600 text-sm mb-4">{surgeon.experience}</p>
                </div>
              </div>
            ))}
          </div>
          
          <div className="text-center mt-10" data-aos="fade-up">
          </div>
        </div>
      </section>
      
      {/* Process Timeline */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12" data-aos="fade-up">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-800">
              <span className="inline-block border-b-4 border-blue-500 pb-2">Quy Trình Phẫu Thuật</span>
            </h2>
            <p className="text-gray-600 max-w-3xl mx-auto mt-4 text-lg">
              Chúng tôi tuân thủ quy trình phẫu thuật chặt chẽ nhằm đảm bảo an toàn tối đa cho bệnh nhân
            </p>
          </div>
          
          <div className="max-w-4xl mx-auto">
            {/* Timeline with 4 steps */}
            <div className="relative">
              {/* Line */}
              <div className="absolute left-8 top-0 bottom-0 w-1 bg-blue-200 hidden md:block"></div>
              
              {/* Step 1 */}
              <div className="flex flex-col md:flex-row mb-12" data-aos="fade-up">
                <div className="md:w-16 flex-shrink-0 flex items-start justify-center mb-4 md:mb-0">
                  <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold text-xl shadow-lg z-10">
                    1
                  </div>
                </div>
                <div className="bg-white p-6 rounded-xl shadow-md md:ml-4 flex-1">
                  <h3 className="text-xl font-bold text-gray-900 mb-2">Chuẩn Bị Trước Phẫu Thuật</h3>
                  <p className="text-gray-600 mb-4">
                    Bao gồm thăm khám, xét nghiệm và chuẩn bị tâm lý cho bệnh nhân. Đội ngũ y tế sẽ giải thích chi tiết quy trình phẫu thuật và chuẩn bị các thiết bị, phương tiện cần thiết.
                  </p>
                  <div className="flex items-center text-gray-500">
                    <FaClock className="mr-2" /> Thời gian: 1-2 ngày trước phẫu thuật
                  </div>
                </div>
              </div>
              
              {/* Step 2 */}
              <div className="flex flex-col md:flex-row mb-12" data-aos="fade-up" data-aos-delay="100">
                <div className="md:w-16 flex-shrink-0 flex items-start justify-center mb-4 md:mb-0">
                  <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold text-xl shadow-lg z-10">
                    2
                  </div>
                </div>
                <div className="bg-white p-6 rounded-xl shadow-md md:ml-4 flex-1">
                  <h3 className="text-xl font-bold text-gray-900 mb-2">Gây Mê</h3>
                  <p className="text-gray-600 mb-4">
                    Dưới sự giám sát của bác sĩ gây mê, bệnh nhân được gây mê/gây tê phù hợp với loại phẫu thuật. Hệ thống monitoring liên tục theo dõi các chỉ số sống còn.
                  </p>
                  <div className="flex items-center text-gray-500">
                    <FaClock className="mr-2" /> Thời gian: 15-30 phút
                  </div>
                </div>
              </div>
              
              {/* Step 3 */}
              <div className="flex flex-col md:flex-row mb-12" data-aos="fade-up" data-aos-delay="200">
                <div className="md:w-16 flex-shrink-0 flex items-start justify-center mb-4 md:mb-0">
                  <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold text-xl shadow-lg z-10">
                    3
                  </div>
                </div>
                <div className="bg-white p-6 rounded-xl shadow-md md:ml-4 flex-1">
                  <h3 className="text-xl font-bold text-gray-900 mb-2">Tiến Hành Phẫu Thuật</h3>
                  <p className="text-gray-600 mb-4">
                    Đội ngũ phẫu thuật viên tiến hành phẫu thuật với các trang thiết bị hiện đại. Mỗi bước đều được thực hiện cẩn thận, tỉ mỉ theo quy trình chuẩn.
                  </p>
                  <div className="flex items-center text-gray-500">
                    <FaClock className="mr-2" /> Thời gian: Tùy thuộc vào loại phẫu thuật
                  </div>
                </div>
              </div>
              
              {/* Step 4 */}
              <div className="flex flex-col md:flex-row" data-aos="fade-up" data-aos-delay="300">
                <div className="md:w-16 flex-shrink-0 flex items-start justify-center mb-4 md:mb-0">
                  <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold text-xl shadow-lg z-10">
                    4
                  </div>
                </div>
                <div className="bg-white p-6 rounded-xl shadow-md md:ml-4 flex-1">
                  <h3 className="text-xl font-bold text-gray-900 mb-2">Hồi Phục Sau Phẫu Thuật</h3>
                  <p className="text-gray-600 mb-4">
                    Sau phẫu thuật, bệnh nhân được theo dõi tại phòng hồi sức. Đội ngũ y tế tiếp tục theo dõi sát sao và hỗ trợ bệnh nhân trong quá trình hồi phục.
                  </p>
                  <div className="flex items-center text-gray-500">
                    <FaClock className="mr-2" /> Thời gian: Tùy thuộc vào tình trạng của bệnh nhân
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
      
      {/* Safety Measures */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <div className="max-w-5xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
              <div data-aos="fade-right">
                <h2 className="text-3xl font-bold text-gray-800 mb-6">
                  <span className="inline-block border-b-4 border-blue-500 pb-2">Các Biện Pháp An Toàn</span>
                </h2>
                <p className="text-gray-600 mb-6">
                  Sự an toàn của bệnh nhân là ưu tiên hàng đầu. Chúng tôi áp dụng các biện pháp an toàn nghiêm ngặt trong quá trình phẫu thuật.
                </p>
                
                <ul className="space-y-4">
                  <li className="flex">
                    <div className="bg-blue-100 p-2 rounded text-blue-700 mr-4 mt-1">
                      <FaShieldAlt className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900">Hệ thống lọc không khí HEPA</h4>
                      <p className="text-gray-600 text-sm">Đảm bảo môi trường vô trùng tuyệt đối trong phòng phẫu thuật.</p>
                    </div>
                  </li>
                  <li className="flex">
                    <div className="bg-blue-100 p-2 rounded text-blue-700 mr-4 mt-1">
                      <FaShieldAlt className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900">Quy trình vô trùng nghiêm ngặt</h4>
                      <p className="text-gray-600 text-sm">Tuân thủ các quy trình vô trùng quốc tế, giảm thiểu nguy cơ nhiễm trùng.</p>
                    </div>
                  </li>
                  <li className="flex">
                    <div className="bg-blue-100 p-2 rounded text-blue-700 mr-4 mt-1">
                      <FaShieldAlt className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900">Hệ thống theo dõi liên tục</h4>
                      <p className="text-gray-600 text-sm">Giám sát các chỉ số sinh tồn của bệnh nhân trong suốt quá trình phẫu thuật.</p>
                    </div>
                  </li>
                  <li className="flex">
                    <div className="bg-blue-100 p-2 rounded text-blue-700 mr-4 mt-1">
                      <FaShieldAlt className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900">Đội ngũ phẫu thuật kinh nghiệm</h4>
                      <p className="text-gray-600 text-sm">Các bác sĩ và điều dưỡng viên giàu kinh nghiệm, được đào tạo bài bản.</p>
                    </div>
                  </li>
                </ul>
              </div>
              
              <div className="relative rounded-2xl overflow-hidden shadow-xl" data-aos="fade-left">
                <img 
                  src="https://img.freepik.com/free-photo/doctor-getting-ready-surgery_23-2149190737.jpg" 
                  alt="Quy trình an toàn" 
                  className="w-full h-full object-cover"
                  style={{ minHeight: '400px' }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex items-end">
                  <div className="p-6">
                    <div className="text-white font-bold mb-2">Tỷ lệ thành công cao</div>
                    <p className="text-white/80 text-sm">Với quy trình an toàn nghiêm ngặt, chúng tôi tự hào về tỷ lệ thành công cao trong các ca phẫu thuật.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
      
      {/* CTA Section */}
      <section className="py-16 bg-gradient-to-r from-blue-600 to-blue-800 text-white">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-3xl md:text-4xl font-bold mb-6" data-aos="fade-up">Bạn Cần Tư Vấn?</h2>
            <p className="text-xl opacity-90 mb-8" data-aos="fade-up" data-aos-delay="100">
              Hãy liên hệ với chúng tôi để được tư vấn chi tiết về các dịch vụ phẫu thuật 
              và đặt lịch khám với đội ngũ bác sĩ chuyên khoa.
            </p>
            <div className="flex flex-wrap justify-center gap-4" data-aos="fade-up" data-aos-delay="200">
              <Link 
                to="/appointment" 
                className="bg-white text-blue-600 hover:bg-blue-50 px-8 py-4 rounded-lg font-bold text-lg transition-colors"
              >
                Đặt Lịch Ngay
              </Link>
              <Link 
                to="/contact" 
                className="bg-transparent border-2 border-white text-white hover:bg-white hover:text-blue-600 px-8 py-4 rounded-lg font-bold text-lg transition-colors"
              >
                Liên Hệ Tư Vấn
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default FacilitySurgery; 