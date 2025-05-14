import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../utils/api';
import { useAuth } from '../../context/AuthContext';
import { 
  FaCalendarCheck, FaUserInjured, FaStar, 
  FaCalendarAlt, FaClipboardList, FaCommentMedical, 
  FaReply, FaChartLine, FaClock, FaCheck, FaTimes,
  FaAngleRight, FaUserMd, FaCog
} from 'react-icons/fa';

const Dashboard = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    todayAppointments: 0,
    pendingAppointments: 0,
    totalPatients: 0,
    reviewsCount: 0,
    completedAppointments: 0,
    averageRating: 0
  });
  const [todayAppointments, setTodayAppointments] = useState([]);
  const [recentReviews, setRecentReviews] = useState([]);

  useEffect(() => {
    const fetchDashboardData = async () => {
      setLoading(true);
      try {
        // Lấy số liệu thống kê tổng quan
        const statsRes = await api.get('/doctors/dashboard/stats');
        if (statsRes.data.success) {
          setStats(statsRes.data.data);
        }

        // Lấy danh sách lịch hẹn hôm nay
        const todayAppsRes = await api.get('/appointments/doctor/today');
        if (todayAppsRes.data.success) {
          setTodayAppointments(todayAppsRes.data.data);
        }

        // Lấy đánh giá gần đây
        try {
          // First attempt - Try to get doctor ID from user context
          if (user?.doctorId || (user?.doctorProfile?._id)) {
            const doctorId = user?.doctorId || user?.doctorProfile?._id;
            // Use the public endpoint instead which doesn't require doctor middleware
            const reviewsRes = await api.get(`/reviews/doctor/${doctorId}`);
            
            if (reviewsRes.data.success) {
              const reviewsData = reviewsRes.data.data || [];
              setRecentReviews(reviewsData.slice(0, 3));
            }
          } else {
            // If no doctor ID is available, try the original endpoint as fallback
            const reviewsRes = await api.get('/doctors/reviews');
            if (reviewsRes.data.success) {
              let reviewsData = [];
              if (reviewsRes.data.data && reviewsRes.data.data.reviews) {
                reviewsData = reviewsRes.data.data.reviews;
              } else if (Array.isArray(reviewsRes.data.data)) {
                reviewsData = reviewsRes.data.data;
              }
              
              setRecentReviews(reviewsData.slice(0, 3));
            }
          }
        } catch (reviewError) {
          console.log('Could not fetch reviews:', reviewError);
          setRecentReviews([]);
        }
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  // Format time from ISO string
  const formatTime = (isoString) => {
    if (!isoString) return '';
    const date = new Date(isoString);
    return date.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
  };

  // Format date from ISO string
  const formatDate = (isoString) => {
    if (!isoString) return '';
    const date = new Date(isoString);
    return date.toLocaleDateString('vi-VN', { year: 'numeric', month: 'numeric', day: 'numeric' });
  };

  // Status badge component
  const StatusBadge = ({ status }) => {
    const statusClasses = {
      pending: "bg-yellow-100 text-yellow-800 border border-yellow-200",
      confirmed: "bg-blue-100 text-blue-800 border border-blue-200",
      completed: "bg-green-100 text-green-800 border border-green-200",
      cancelled: "bg-red-100 text-red-800 border border-red-200"
    };
    
    const statusText = {
      pending: "Chờ xác nhận",
      confirmed: "Đã xác nhận",
      completed: "Hoàn thành", 
      cancelled: "Đã hủy"
    };
    
    return (
      <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${statusClasses[status] || "bg-gray-100 text-gray-800 border border-gray-200"}`}>
        {statusText[status] || status}
      </span>
    );
  };

  // Generate star rating display
  const renderStars = (rating) => {
    return (
      <div className="flex">
        {[1, 2, 3, 4, 5].map((star) => (
          <FaStar 
            key={star}
            className={`w-4 h-4 ${
              star <= Math.floor(rating) 
                ? "text-yellow-400" 
                : star <= Math.ceil(rating) && star > Math.floor(rating)
                  ? "text-yellow-300" 
                  : "text-gray-300"
            }`}
          />
        ))}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="inline-block w-12 h-12 border-4 border-primary/30 border-l-primary rounded-full animate-spin mb-4"></div>
          <p className="text-gray-600">Đang tải dữ liệu...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Welcome Section */}
      <div className="bg-gradient-to-r from-primary to-blue-600 p-4 sm:p-6 rounded-2xl shadow-md text-white">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold">Xin chào, BS. {user?.fullName || 'Bác sĩ'}</h1>
            <p className="mt-1 opacity-90 text-sm sm:text-base">
              Chào mừng bạn đến với Hệ thống quản lý bệnh viện
            </p>
          </div>
          
          <div className="mt-4 md:mt-0">
            <div className="flex items-center bg-white/20 backdrop-blur-sm px-3 sm:px-4 py-2 rounded-xl text-sm">
              <FaCalendarAlt className="mr-2 flex-shrink-0" />
              <span className="truncate">{new Date().toLocaleDateString('vi-VN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
            </div>
          </div>
        </div>
      </div>
      
      {/* Quick Actions */}
      <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4">
        <Link to="/doctor/appointments" className="flex items-center p-3 sm:p-4 bg-blue-50 rounded-xl border border-blue-100 hover:bg-blue-100 transition-colors duration-200">
          <div className="p-2 sm:p-3 rounded-lg bg-blue-100 mr-3 flex-shrink-0">
            <FaCalendarCheck className="text-blue-600 text-lg sm:text-xl" />
          </div>
          <div className="min-w-0">
            <h3 className="font-semibold text-blue-800 text-sm sm:text-base truncate">Lịch hẹn</h3>
            <p className="text-xs sm:text-sm text-blue-600 truncate">Quản lý lịch hẹn</p>
          </div>
        </Link>
        
        <Link to="/doctor/schedule" className="flex items-center p-3 sm:p-4 bg-green-50 rounded-xl border border-green-100 hover:bg-green-100 transition-colors duration-200">
          <div className="p-2 sm:p-3 rounded-lg bg-green-100 mr-3 flex-shrink-0">
            <FaClock className="text-green-600 text-lg sm:text-xl" />
          </div>
          <div className="min-w-0">
            <h3 className="font-semibold text-green-800 text-sm sm:text-base truncate">Lịch trực</h3>
            <p className="text-xs sm:text-sm text-green-600 truncate">Cập nhật lịch làm việc</p>
          </div>
        </Link>
        
        <Link to="/doctor/medical-records" className="flex items-center p-3 sm:p-4 bg-purple-50 rounded-xl border border-purple-100 hover:bg-purple-100 transition-colors duration-200">
          <div className="p-2 sm:p-3 rounded-lg bg-purple-100 mr-3 flex-shrink-0">
            <FaClipboardList className="text-purple-600 text-lg sm:text-xl" />
          </div>
          <div className="min-w-0">
            <h3 className="font-semibold text-purple-800 text-sm sm:text-base truncate">Hồ sơ y tế</h3>
            <p className="text-xs sm:text-sm text-purple-600 truncate">Quản lý hồ sơ bệnh nhân</p>
          </div>
        </Link>
        
        <Link to="/doctor/profile" className="flex items-center p-3 sm:p-4 bg-amber-50 rounded-xl border border-amber-100 hover:bg-amber-100 transition-colors duration-200">
          <div className="p-2 sm:p-3 rounded-lg bg-amber-100 mr-3 flex-shrink-0">
            <FaUserMd className="text-amber-600 text-lg sm:text-xl" />
          </div>
          <div className="min-w-0">
            <h3 className="font-semibold text-amber-800 text-sm sm:text-base truncate">Hồ sơ</h3>
            <p className="text-xs sm:text-sm text-amber-600 truncate">Cập nhật thông tin cá nhân</p>
          </div>
        </Link>
      </div>
      
      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
        {/* Today's Appointments */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-lg transform hover:-translate-y-1 transition-all duration-300">
          <div className="p-4 sm:p-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-xs sm:text-sm font-medium text-gray-500">Lịch hẹn hôm nay</p>
                <h3 className="text-xl sm:text-3xl font-bold text-gray-800 mt-1 group-hover:text-primary transition-colors">
                  {stats.todayAppointments}
                </h3>
              </div>
              <div className="bg-blue-100 p-2 sm:p-3 rounded-lg group-hover:bg-blue-500 group-hover:text-white transition-all duration-300 transform group-hover:rotate-6">
                <FaCalendarCheck className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600 group-hover:text-white" />
              </div>
            </div>
            <div className="mt-4 flex items-center text-xs text-gray-500">
              <FaChartLine className="mr-1" />
              <span>So với hôm qua: +{Math.floor(Math.random() * 5)}%</span>
            </div>
          </div>
          <div className="h-1.5 w-full bg-gradient-to-r from-blue-400 to-blue-600"></div>
        </div>

        {/* Pending Appointments */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-lg transform hover:-translate-y-1 transition-all duration-300">
          <div className="p-4 sm:p-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-xs sm:text-sm font-medium text-gray-500">Chờ xác nhận</p>
                <h3 className="text-xl sm:text-3xl font-bold text-gray-800 mt-1 group-hover:text-primary transition-colors">
                  {stats.pendingAppointments}
                </h3>
              </div>
              <div className="bg-yellow-100 p-2 sm:p-3 rounded-lg group-hover:bg-yellow-500 group-hover:text-white transition-all duration-300 transform group-hover:rotate-6">
                <FaClock className="w-5 h-5 sm:w-6 sm:h-6 text-yellow-600 group-hover:text-white" />
              </div>
            </div>
            <div className="mt-4">
              <Link to="/doctor/appointments" className="text-xs text-blue-600 hover:text-blue-800 font-medium inline-flex items-center hover:underline">
                Xem tất cả lịch hẹn chờ xác nhận <FaAngleRight className="ml-1" />
              </Link>
            </div>
          </div>
          <div className="h-1.5 w-full bg-gradient-to-r from-yellow-400 to-yellow-600"></div>
        </div>

        {/* Total Patients */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-all group">
          <div className="p-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-medium text-gray-500">Tổng số bệnh nhân</p>
                <h3 className="text-3xl font-bold text-gray-800 mt-1 group-hover:text-primary transition-colors">
                  {stats.totalPatients}
                </h3>
              </div>
              <div className="bg-green-100 p-3 rounded-lg group-hover:bg-green-500 group-hover:text-white transition-all duration-200 transform group-hover:scale-110">
                <FaUserInjured className="w-6 h-6 text-green-600 group-hover:text-white" />
              </div>
            </div>
            <div className="mt-4">
              <Link to="/doctor/patients" className="text-xs text-blue-600 hover:text-blue-800 font-medium inline-flex items-center">
                Xem danh sách bệnh nhân <FaAngleRight className="ml-1" />
              </Link>
            </div>
          </div>
          <div className="h-1.5 w-full bg-gradient-to-r from-green-400 to-green-600"></div>
        </div>

        {/* Completed Appointments */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-all group">
          <div className="p-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-medium text-gray-500">Lịch hẹn đã hoàn thành</p>
                <h3 className="text-3xl font-bold text-gray-800 mt-1 group-hover:text-primary transition-colors">
                  {stats.completedAppointments}
                </h3>
              </div>
              <div className="bg-indigo-100 p-3 rounded-lg group-hover:bg-indigo-500 group-hover:text-white transition-all duration-200 transform group-hover:scale-110">
                <FaCheck className="w-6 h-6 text-indigo-600 group-hover:text-white" />
              </div>
            </div>
            <div className="mt-4 flex items-center">
              <span className="px-2 py-0.5 bg-green-100 text-green-800 rounded-full text-xs font-medium">
                Tỉ lệ hoàn thành: {stats.totalPatients > 0 ? Math.round((stats.completedAppointments / stats.totalPatients) * 100) : 0}%
              </span>
            </div>
          </div>
          <div className="h-1.5 w-full bg-gradient-to-r from-indigo-400 to-indigo-600"></div>
        </div>

        {/* Reviews Count */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-all group">
          <div className="p-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-medium text-gray-500">Số lượng đánh giá</p>
                <h3 className="text-3xl font-bold text-gray-800 mt-1 group-hover:text-primary transition-colors">
                  {stats.reviewsCount}
                </h3>
              </div>
              <div className="bg-purple-100 p-3 rounded-lg group-hover:bg-purple-500 group-hover:text-white transition-all duration-200 transform group-hover:scale-110">
                <FaCommentMedical className="w-6 h-6 text-purple-600 group-hover:text-white" />
              </div>
            </div>
            <div className="mt-4">
              <Link to="/doctor/reviews" className="text-xs text-blue-600 hover:text-blue-800 font-medium inline-flex items-center">
                Xem tất cả đánh giá <FaAngleRight className="ml-1" />
              </Link>
            </div>
          </div>
          <div className="h-1.5 w-full bg-gradient-to-r from-purple-400 to-purple-600"></div>
        </div>

        {/* Average Rating */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-all group">
          <div className="p-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-medium text-gray-500">Đánh giá trung bình</p>
                <h3 className="text-3xl font-bold text-gray-800 mt-1 group-hover:text-primary transition-colors">
                  {stats.averageRating?.toFixed(1) || 0}<span className="text-sm font-medium text-gray-500">/5</span>
                </h3>
              </div>
              <div className="bg-amber-100 p-3 rounded-lg group-hover:bg-amber-500 group-hover:text-white transition-all duration-200 transform group-hover:scale-110">
                <FaStar className="w-6 h-6 text-amber-500 group-hover:text-white" />
              </div>
            </div>
            <div className="mt-2 flex">
              {renderStars(stats.averageRating || 0)}
            </div>
          </div>
          <div className="h-1.5 w-full bg-gradient-to-r from-amber-400 to-amber-600"></div>
        </div>
      </div>
      
      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Today's Appointments Section */}
        <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="flex justify-between items-center p-6 border-b border-gray-100">
            <h2 className="text-lg font-bold text-gray-800 flex items-center">
              <FaCalendarAlt className="mr-2 text-primary" /> Lịch hẹn hôm nay
            </h2>
            <Link to="/doctor/appointments" className="text-sm text-blue-600 hover:text-blue-800 font-medium hover:underline flex items-center">
              Xem tất cả <FaAngleRight className="ml-1" />
            </Link>
          </div>
          
          <div className="p-6">
            {todayAppointments.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b border-gray-200">
                      <th className="px-4 py-3">Thời gian</th>
                      <th className="px-4 py-3">Bệnh nhân</th>
                      <th className="px-4 py-3">Dịch vụ</th>
                      <th className="px-4 py-3">Trạng thái</th>
                      <th className="px-4 py-3">Hành động</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {todayAppointments.map((appointment) => (
                      <tr key={appointment._id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-4 py-4 whitespace-nowrap font-medium">{formatTime(appointment.time)}</td>
                        <td className="px-4 py-4 whitespace-nowrap">{appointment.userId.fullName}</td>
                        <td className="px-4 py-4 whitespace-nowrap">{appointment.serviceId.name}</td>
                        <td className="px-4 py-4 whitespace-nowrap">
                          <StatusBadge status={appointment.status} />
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap">
                          <Link 
                            to={`/doctor/appointments/${appointment._id}`}
                            className="inline-flex items-center px-3 py-1.5 text-xs font-medium rounded-lg text-white bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 transition-all shadow-sm"
                          >
                            Xem chi tiết
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-16 rounded-lg bg-gray-50">
                <div className="text-gray-400 text-4xl mb-3">
                  <FaCalendarAlt />
                </div>
                <p className="text-gray-600 font-medium mb-1">Không có lịch hẹn nào trong hôm nay</p>
                <p className="text-gray-500 text-sm">Bạn có thể quản lý lịch hẹn trong phần Lịch hẹn</p>
              </div>
            )}
          </div>
        </div>
        
        {/* Recent Reviews Section */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="flex justify-between items-center p-6 border-b border-gray-100">
            <h2 className="text-lg font-bold text-gray-800 flex items-center">
              <FaCommentMedical className="mr-2 text-primary" /> Đánh giá gần đây
            </h2>
            <Link to="/doctor/reviews" className="text-sm text-blue-600 hover:text-blue-800 font-medium hover:underline flex items-center">
              Xem tất cả <FaAngleRight className="ml-1" />
            </Link>
          </div>
          
          <div className="p-6">
            {recentReviews.length > 0 ? (
              <div className="space-y-4">
                {recentReviews.map((review) => (
                  <div key={review._id} className="border border-gray-100 rounded-xl p-4 hover:shadow-sm transition-all bg-white">
                    <div className="flex justify-between mb-3">
                      <div className="flex items-center">
                        <div className="w-10 h-10 rounded-full overflow-hidden bg-gray-100 flex-shrink-0">
                          <img 
                            src={review.userId?.avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(review.userId?.fullName || 'Bệnh nhân')}`}
                            alt={review.userId?.fullName || 'Bệnh nhân'} 
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(review.userId?.fullName || 'Bệnh nhân')}`;
                            }}
                          />
                        </div>
                        <div className="ml-3">
                          <h4 className="text-sm font-medium text-gray-800">{review.userId?.fullName || 'Bệnh nhân'}</h4>
                          <div className="text-xs text-gray-500">{formatDate(review.createdAt)}</div>
                        </div>
                      </div>
                      <div className="flex items-center">
                        {renderStars(review.rating)}
                        <span className="ml-1 text-sm font-medium text-gray-800">{review.rating?.toFixed(1)}</span>
                      </div>
                    </div>
                    
                    <p className="text-sm text-gray-600 mb-4 bg-gray-50 p-3 rounded-lg">{review.comment || 'Không có nội dung đánh giá.'}</p>
                    
                    {review.appointmentId && (
                      <div className="text-xs text-gray-500 mb-3">
                        <span className="font-medium">Lịch hẹn:</span> {formatDate(review.appointmentId.appointmentDate)}
                      </div>
                    )}
                    
                    {review.doctorReply ? (
                      <div className="bg-blue-50 rounded-lg p-3 border-l-4 border-blue-500">
                        <div className="flex items-center text-xs font-medium text-blue-700 mb-1">
                          <FaReply className="mr-1" /> Phản hồi của bạn
                        </div>
                        <p className="text-sm text-gray-600">{review.doctorReply}</p>
                      </div>
                    ) : (
                      <button 
                        className="text-xs flex items-center text-blue-600 hover:text-blue-800"
                        onClick={() => {
                          // Handle reply logic
                        }}
                      >
                        <FaReply className="mr-1" /> Trả lời đánh giá này
                      </button>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-16 rounded-lg bg-gray-50">
                <div className="text-gray-400 text-4xl mb-3">
                  <FaCommentMedical />
                </div>
                <p className="text-gray-600 font-medium mb-1">Chưa có đánh giá nào</p>
                <p className="text-gray-500 text-sm">Đánh giá từ bệnh nhân sẽ hiển thị ở đây</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard; 
