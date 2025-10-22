import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FaHospital, FaStethoscope, FaWheelchair, FaHeartbeat, FaDna, FaProcedures, FaNotesMedical, FaUserMd, FaAngleRight, FaCalendarCheck, FaSearch } from 'react-icons/fa';
import AOS from 'aos';
import 'aos/dist/aos.css';

const Facilities = () => {
  useEffect(() => {
    AOS.init({
      duration: 1000,
      once: true,
      easing: 'ease-out-cubic'
    });
    
    // Cuộn lên đầu trang khi component được mount
    window.scrollTo(0, 0);
  }, []);

  // Danh sách các cơ sở vật chất
  const facilities = [
    {
      id: 1,
      name: 'Phòng Phẫu Thuật Hiện Đại',
      description: 'Các phòng phẫu thuật của chúng tôi được trang bị theo tiêu chuẩn quốc tế với các thiết bị tiên tiến nhất, đảm bảo môi trường vô trùng tuyệt đối và an toàn cho bệnh nhân.',
      image: 'https://img.freepik.com/free-photo/interior-view-operating-room_1170-2254.jpg',
      icon: <FaProcedures />
    },
    {
      id: 2,
      name: 'Phòng Xét Nghiệm',
      description: 'Hệ thống phòng xét nghiệm hiện đại với các trang thiết bị tiên tiến giúp chẩn đoán chính xác và nhanh chóng các bệnh lý.',
      image: 'https://img.freepik.com/free-photo/scientist-working-laboratory-with-test-tubes-laboratory-equipment_1150-19445.jpg',
      icon: <FaDna />
    },
    {
      id: 3,
      name: 'Khoa Cấp Cứu',
      description: 'Khoa cấp cứu hoạt động 24/7 với đội ngũ y bác sĩ giàu kinh nghiệm và trang thiết bị hiện đại, sẵn sàng ứng phó với mọi tình huống khẩn cấp.',
      image: 'https://img.freepik.com/free-photo/blur-hospital_1203-7957.jpg',
      icon: <FaHeartbeat />
    },
    {
      id: 4,
      name: 'Khoa Chẩn Đoán Hình Ảnh',
      description: 'Trang bị các thiết bị chẩn đoán hình ảnh tiên tiến như MRI, CT Scanner, X-quang kỹ thuật số, siêu âm 4D, giúp phát hiện sớm các bệnh lý.',
      image: 'https://img.freepik.com/free-photo/medical-examination-with-ct-scan_23-2149367358.jpg',
      icon: <FaNotesMedical />
    },
    {
      id: 5,
      name: 'Phòng Hồi Sức',
      description: 'Phòng hồi sức tích cực với các thiết bị theo dõi và hỗ trợ sự sống hiện đại, giúp chăm sóc tối ưu cho bệnh nhân nặng.',
      image: 'https://img.freepik.com/free-photo/hospital-ward-with-beds-medical-equipment_107420-84559.jpg',
      icon: <FaWheelchair />
    },
    {
      id: 6,
      name: 'Phòng Khám Đa Khoa',
      description: 'Hệ thống phòng khám thiết kế hiện đại, thoáng mát và riêng tư, tạo cảm giác thoải mái cho bệnh nhân khi thăm khám.',
      image: 'https://img.freepik.com/free-photo/hospital-healthcare-workers-covid-pandemic-concept-young-doctor-scrubs-making-daily-errands-clinic-listening-patient-symptoms-holding-digital-tablet-professional-physician-using-computer_1258-57203.jpg',
      icon: <FaStethoscope />
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <section className="relative py-16 bg-gradient-to-r from-blue-500 to-blue-600 text-white">
        <div className="absolute inset-0 overflow-hidden">
          <img 
            src="https://img.freepik.com/free-photo/modern-equipped-operating-room_114579-254.jpg" 
            alt="Facilities Background" 
            className="w-full h-full object-cover object-center opacity-20"
          />
        </div>
        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="text-4xl md:text-5xl font-bold mb-6" data-aos="fade-up">Cơ Sở Vật Chất Hiện Đại</h1>
            <p className="text-xl opacity-90 mb-8" data-aos="fade-up" data-aos-delay="100">
              Bệnh viện chúng tôi được trang bị những thiết bị y tế tiên tiến nhất, 
              đảm bảo chất lượng chẩn đoán và điều trị tốt nhất cho bệnh nhân.
            </p>
            <div className="flex flex-wrap justify-center gap-4" data-aos="fade-up" data-aos-delay="200">
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
          <path fill="currentColor" fillOpacity="1" d="M0,96L48,112C96,128,192,160,288,160C384,160,480,128,576,112C672,96,768,96,864,106.7C960,117,1056,139,1152,138.7C1248,139,1344,117,1392,106.7L1440,96L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z"></path>
        </svg>
      </section>
      
      {/* Search & Filter Section */}
      <section className="py-12 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto bg-white p-8 rounded-xl shadow-md -mt-20 relative z-20" data-aos="fade-up">
            <h2 className="text-2xl font-bold text-gray-800 mb-6">Tìm Kiếm Cơ Sở Vật Chất</h2>
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <input 
                    type="text" 
                    placeholder="Nhập tên cơ sở vật chất cần tìm..." 
                    className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-colors"
                  />
                  <FaSearch className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                </div>
              </div>
              <button className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium">
                Tìm Kiếm
              </button>
            </div>
          </div>
        </div>
      </section>
      
      {/* Main Facilities Section */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12" data-aos="fade-up">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-800">
              <span className="inline-block border-b-4 border-blue-500 pb-2">Cơ Sở Vật Chất</span>
            </h2>
            <p className="text-gray-600 max-w-3xl mx-auto mt-4 text-lg">
              Khám phá hệ thống cơ sở vật chất hiện đại của chúng tôi, nơi chúng tôi cung cấp dịch vụ chăm sóc sức khỏe chất lượng cao
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {facilities.map((facility, index) => (
              <div 
                key={facility.id} 
                className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-xl transition-shadow duration-300"
                data-aos="fade-up"
                data-aos-delay={index * 100}
              >
                <div className="relative h-64 overflow-hidden">
                  <img 
                    src={facility.image} 
                    alt={facility.name} 
                    className="w-full h-full object-cover transition-transform duration-500 hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent"></div>
                  <div className="absolute bottom-4 left-4 right-4">
                    <h3 className="text-white text-xl font-bold flex items-center">
                      <span className="mr-2">{facility.icon}</span> {facility.name}
                    </h3>
                  </div>
                </div>
                <div className="p-6">
                  <p className="text-gray-600 mb-4 min-h-[80px]">{facility.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
      
      {/* Why Choose Our Facilities */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12" data-aos="fade-up">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-800">
              <span className="inline-block border-b-4 border-blue-500 pb-2">Tại Sao Chọn Chúng Tôi</span>
            </h2>
            <p className="text-gray-600 max-w-3xl mx-auto mt-4 text-lg">
              Cam kết cung cấp dịch vụ chăm sóc sức khỏe chất lượng cao với cơ sở vật chất và thiết bị hiện đại
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="bg-gray-50 p-6 rounded-xl text-center" data-aos="fade-up" data-aos-delay="0">
              <div className="w-16 h-16 mx-auto bg-blue-100 rounded-full flex items-center justify-center mb-4">
                <FaUserMd className="text-2xl text-blue-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Đội Ngũ Chuyên Gia</h3>
              <p className="text-gray-600">Bác sĩ giỏi chuyên môn, giàu kinh nghiệm và tận tâm.</p>
            </div>
            
            <div className="bg-gray-50 p-6 rounded-xl text-center" data-aos="fade-up" data-aos-delay="100">
              <div className="w-16 h-16 mx-auto bg-blue-100 rounded-full flex items-center justify-center mb-4">
                <FaHospital className="text-2xl text-blue-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Cơ Sở Hiện Đại</h3>
              <p className="text-gray-600">Trang thiết bị y tế tiên tiến, đạt chuẩn quốc tế.</p>
            </div>
            
            <div className="bg-gray-50 p-6 rounded-xl text-center" data-aos="fade-up" data-aos-delay="200">
              <div className="w-16 h-16 mx-auto bg-blue-100 rounded-full flex items-center justify-center mb-4">
                <FaHeartbeat className="text-2xl text-blue-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Chăm Sóc Toàn Diện</h3>
              <p className="text-gray-600">Điều trị toàn diện từ thăm khám đến phục hồi sức khỏe.</p>
            </div>
            
            <div className="bg-gray-50 p-6 rounded-xl text-center" data-aos="fade-up" data-aos-delay="300">
              <div className="w-16 h-16 mx-auto bg-blue-100 rounded-full flex items-center justify-center mb-4">
                <FaStethoscope className="text-2xl text-blue-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Công Nghệ Tiên Tiến</h3>
              <p className="text-gray-600">Ứng dụng công nghệ mới nhất trong chẩn đoán và điều trị.</p>
            </div>
          </div>
        </div>
      </section>
      
      {/* CTA Section */}
      <section className="py-16 bg-gradient-to-r from-blue-600 to-blue-800 text-white">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-3xl md:text-4xl font-bold mb-6" data-aos="fade-up">Đặt Lịch Tham Quan Cơ Sở</h2>
            <p className="text-xl opacity-90 mb-8" data-aos="fade-up" data-aos-delay="100">
              Hãy liên hệ với chúng tôi để đặt lịch tham quan và tìm hiểu thêm về cơ sở vật chất hiện đại của bệnh viện.
            </p>
            <div data-aos="fade-up" data-aos-delay="200">
              <Link 
                to="/contact" 
                className="bg-white text-blue-600 hover:bg-blue-50 px-8 py-4 rounded-lg font-bold text-lg inline-block transition-colors"
              >
                Liên Hệ Ngay
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Facilities; 