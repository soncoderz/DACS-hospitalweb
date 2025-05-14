import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../utils/api';
import { useAuth } from '../../context/AuthContext';
import { 
  FaUserMd, FaHospital, FaStethoscope, FaHandHoldingMedical,
  FaDoorOpen, FaCalendarCheck, FaTicketAlt, FaCreditCard,
  FaStar, FaCalendarAlt, FaUsers, FaChartLine, FaChartPie, FaChartBar,
  FaMoneyBillWave, FaCalendarDay, FaCalendarWeek, FaCalendarAlt as FaCalendarYear,
  FaInfoCircle, FaList, FaCheck, FaTimes, FaClock, FaMoneyBill, FaUserCheck,
  FaExclamationTriangle
} from 'react-icons/fa';

import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, ArcElement, BarElement } from 'chart.js';
import { Line, Pie, Bar } from 'react-chartjs-2';

// Đăng ký các thành phần cần thiết cho Chart.js
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

const Dashboard = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalDoctors: 0,
    totalHospitals: 0,
    totalSpecialties: 0,
    totalServices: 0,
    totalRooms: 0,
    totalAppointments: 0,
    totalPayments: 0,
    totalRevenue: 0,
    pendingAppointments: 0,
    totalCoupons: 0,
    totalReviews: 0,
    totalSchedules: 0
  });
  const [chartData, setChartData] = useState({
    appointmentTrends: {
      labels: [],
      datasets: []
    },
    specialtyDistribution: {
      labels: [],
      datasets: []
    },
    hospitalPerformance: {
      labels: [],
      datasets: []
    },
    revenueByTime: {
      daily: {
        labels: [],
        datasets: []
      },
      monthly: {
        labels: [],
        datasets: []
      },
      yearly: {
        labels: [],
        datasets: []
      }
    }
  });
  const [specialtyStats, setSpecialtyStats] = useState([]);
  const [revenueChartPeriod, setRevenueChartPeriod] = useState('daily');
  const [activeSpecialty, setActiveSpecialty] = useState(null);
  const [showDetailedStats, setShowDetailedStats] = useState(false);

  useEffect(() => {
    const fetchDashboardData = async () => {
      setLoading(true);
      setError(null);
      try {
        // Lấy số liệu thống kê tổng quan
        const statsRes = await api.get('/admin/dashboard/stats');
        if (statsRes.data.success) {
          setStats(statsRes.data.data);
        }

        // Lấy dữ liệu biểu đồ
        try {
          const chartsRes = await api.get('/admin/dashboard/charts');
          if (chartsRes.data.success) {
            const data = chartsRes.data.data;
            setChartData(data);
            
            // Xử lý dữ liệu chuyên khoa để hiển thị trong bảng
            if (data.specialtyDetailedData && data.specialtyDetailedData.length > 0) {
              setSpecialtyStats(data.specialtyDetailedData);
              setActiveSpecialty(data.specialtyDetailedData[0]);
            } else if (data.specialtyDistribution && 
                       data.specialtyDistribution.labels &&
                       data.specialtyDistribution.datasets) {
              // Fallback cho trường hợp không có dữ liệu chi tiết
              const labels = data.specialtyDistribution.labels;
              const chartData = data.specialtyDistribution.datasets[0].data;
              
              if (labels && labels.length && chartData && chartData.length) {
                const specialtyData = labels.map((label, index) => ({
                  name: label,
                  count: chartData[index] || 0,
                  percentage: chartData.reduce((a, b) => a + (b || 0), 0) > 0 
                    ? (((chartData[index] || 0) / chartData.reduce((a, b) => a + (b || 0), 0)) * 100).toFixed(1) 
                    : '0.0'
                }));
                
                setSpecialtyStats(specialtyData);
                if (specialtyData.length > 0) {
                  setActiveSpecialty(specialtyData[0]);
                }
              }
            }
          }
        } catch (error) {
          console.error('Error fetching chart data:', error);
          setError('Không thể tải dữ liệu biểu đồ');
          // Sử dụng dữ liệu mẫu nếu API không tồn tại
          generateMockChartData();
        }
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
        setError('Không thể tải dữ liệu từ máy chủ');
        // Sử dụng dữ liệu mẫu nếu API không tồn tại
        generateMockChartData();
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  // Tạo dữ liệu mẫu cho các biểu đồ nếu API không tồn tại
  const generateMockChartData = () => {
    // Dữ liệu xu hướng lịch hẹn trong 7 ngày gần đây
    const now = new Date();
    const last7Days = Array(7).fill().map((_, i) => {
      const date = new Date(now);
      date.setDate(date.getDate() - (6 - i));
      return date.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' });
    });

    // Dữ liệu doanh thu theo ngày
    const last10Days = Array(10).fill().map((_, i) => {
      const date = new Date(now);
      date.setDate(date.getDate() - (9 - i));
      return date.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' });
    });

    // Dữ liệu doanh thu theo tháng
    const months = ['Tháng 1', 'Tháng 2', 'Tháng 3', 'Tháng 4', 'Tháng 5', 'Tháng 6', 
                    'Tháng 7', 'Tháng 8', 'Tháng 9', 'Tháng 10', 'Tháng 11', 'Tháng 12'];
    const lastMonths = months.slice(now.getMonth() - 11 >= 0 ? now.getMonth() - 11 : 0, now.getMonth() + 1);
    
    // Dữ liệu doanh thu theo năm
    const currentYear = now.getFullYear();
    const lastYears = Array(5).fill().map((_, i) => (currentYear - 4 + i).toString());

    // Dữ liệu mẫu cho chuyên khoa
    const specialtyLabels = ['Nội khoa', 'Tim mạch', 'Da liễu', 'Nhi khoa', 'Tai mũi họng'];
    const specialtyData = [45, 25, 20, 30, 15];
    
    // Tính tổng
    const totalSpecialtyAppointments = specialtyData.reduce((a, b) => a + b, 0);
    
    // Dữ liệu chi tiết chuyên khoa
    const specialtyDetails = specialtyLabels.map((name, index) => ({
      name,
      count: specialtyData[index],
      percentage: ((specialtyData[index] / totalSpecialtyAppointments) * 100).toFixed(1),
      completedCount: Math.floor(specialtyData[index] * 0.7),
      canceledCount: Math.floor(specialtyData[index] * 0.1),
      pendingCount: Math.floor(specialtyData[index] * 0.2),
      completionRate: (70 + Math.random() * 20).toFixed(1),
      totalAmount: specialtyData[index] * 100000,
      doctorCount: Math.floor(specialtyData[index] / 5) + 1,
      activeDoctorCount: Math.floor((Math.floor(specialtyData[index] / 5) + 1) * 0.8),
      avgRating: (3.5 + Math.random() * 1.5).toFixed(1)
    }));
    
    setSpecialtyStats(specialtyDetails);
    setActiveSpecialty(specialtyDetails[0]);

    setChartData({
      appointmentTrends: {
        labels: last7Days,
            datasets: [
              {
            label: 'Lịch hẹn mới',
            data: [5, 8, 12, 7, 15, 10, 18],
            borderColor: '#0c4c91',
            backgroundColor: 'rgba(12, 76, 145, 0.2)',
            tension: 0.4,
            fill: true,
          },
          {
            label: 'Đã hoàn thành',
            data: [3, 6, 9, 5, 12, 8, 14],
            borderColor: '#10b981',
            backgroundColor: 'rgba(16, 185, 129, 0.2)',
            tension: 0.4,
            fill: true,
          }
        ]
      },
      specialtyDistribution: {
            labels: specialtyLabels,
            datasets: [
              {
            data: specialtyData,
                backgroundColor: [
              '#0c4c91',
              '#10b981',
              '#f59e0b',
              '#3b82f6',
              '#f43f5e'
                ],
                borderWidth: 1,
              }
            ]
      },
      hospitalPerformance: {
        labels: ['Bệnh viện A', 'Bệnh viện B', 'Bệnh viện C', 'Bệnh viện D'],
        datasets: [
          {
            label: 'Số lịch hẹn',
            data: [150, 120, 180, 90],
            backgroundColor: 'rgba(12, 76, 145, 0.8)',
          },
          {
            label: 'Đánh giá trung bình',
            data: [4.5, 4.2, 4.8, 3.9],
            backgroundColor: 'rgba(16, 185, 129, 0.8)',
          }
        ]
      },
      revenueByTime: {
        daily: {
          labels: last10Days,
          datasets: [
            {
              label: 'Doanh thu theo ngày',
              data: [250000, 320000, 280000, 450000, 380000, 420000, 350000, 510000, 480000, 550000],
              borderColor: '#0ea5e9',
              backgroundColor: 'rgba(14, 165, 233, 0.2)',
              tension: 0.4,
              fill: true,
            }
          ]
        },
        monthly: {
          labels: lastMonths,
          datasets: [
            {
              label: 'Doanh thu theo tháng',
              data: [3800000, 4200000, 3500000, 4800000, 5100000, 4600000, 5200000, 4900000, 5500000, 6200000, 5800000, 6500000],
              borderColor: '#8b5cf6',
              backgroundColor: 'rgba(139, 92, 246, 0.2)',
              tension: 0.4,
              fill: true,
            }
          ]
        },
        yearly: {
          labels: lastYears,
            datasets: [
              {
              label: 'Doanh thu theo năm',
              data: [45000000, 58000000, 65000000, 72000000, 85000000],
              borderColor: '#f97316',
              backgroundColor: 'rgba(249, 115, 22, 0.2)',
              tension: 0.4,
              fill: true,
            }
          ]
        }
      },
      specialtyDetailedData: specialtyDetails
    });
  };

  const handleSpecialtyClick = (specialty) => {
    setActiveSpecialty(specialty);
    setShowDetailedStats(true);
  };

  // Chart options
  const lineOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top',
      },
      title: {
        display: true,
        text: 'Xu hướng lịch hẹn trong 7 ngày gần đây'
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          precision: 0
        }
      }
    }
  };

  const pieOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'right',
        labels: {
          boxWidth: 15,
          font: {
            size: 10
          }
        }
      },
      title: {
        display: true,
        text: 'Phân bố theo chuyên khoa',
        font: {
          size: 14
        }
      }
    }
  };

  const barOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top',
      },
      title: {
        display: true,
        text: 'Hiệu suất cơ sở y tế'
      }
    },
    scales: {
      y: {
        beginAtZero: true
      }
    }
  };

  const revenueOptions = {
    responsive: true,
    plugins: {
      legend: {
        display: false
      },
      title: {
        display: true,
        text: `Doanh thu theo ${revenueChartPeriod === 'daily' ? 'ngày' : revenueChartPeriod === 'monthly' ? 'tháng' : 'năm'}`
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          callback: function(value) {
            if (value >= 1000000) {
              return (value / 1000000) + 'M';
            } else if (value >= 1000) {
              return (value / 1000) + 'K';
            }
            return value;
          }
        }
      }
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="inline-block w-12 h-12 border-4 border-blue-600/30 border-l-blue-600 rounded-full animate-spin mb-4"></div>
          <p className="text-gray-600 font-medium">Đang tải dữ liệu...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] p-6">
        <div className="text-red-500 text-5xl mb-4">
          <FaExclamationTriangle />
        </div>
        <p className="text-xl font-semibold text-gray-800 mb-4">{error}</p>
        <button 
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          onClick={() => window.location.reload()}
        >
          Tải lại trang
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Welcome Section */}
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Tổng quan hệ thống</h1>
            <p className="text-gray-600 mt-1">
              Xin chào, <span className="font-semibold text-blue-600">{user?.fullName || 'Admin'}</span>
            </p>
          </div>
          
          <div className="mt-4 md:mt-0">
            <div className="flex items-center bg-blue-50 text-blue-700 px-4 py-2 rounded-lg">
              <FaCalendarAlt className="mr-2" />
              <span>Hôm nay: {new Date().toLocaleDateString('vi-VN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
            </div>
          </div>
        </div>
      </div>
      
      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Users */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow group">
          <div className="p-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-medium text-gray-500">Người dùng</p>
                <h3 className="text-3xl font-bold text-gray-800 mt-1 group-hover:text-blue-600 transition-colors">
                  {stats.totalUsers}
                </h3>
              </div>
              <div className="bg-blue-100 p-3 rounded-lg text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                <FaUsers className="w-6 h-6" />
              </div>
            </div>
            <div className="mt-4">
              <Link to="/admin/users" className="text-xs text-blue-600 hover:text-blue-800 font-medium group-hover:underline">
                Quản lý người dùng →
              </Link>
            </div>
          </div>
          <div className="h-1.5 w-full bg-blue-600"></div>
        </div>
        
        {/* Doctors */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow group">
          <div className="p-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-medium text-gray-500">Bác sĩ</p>
                <h3 className="text-3xl font-bold text-gray-800 mt-1 group-hover:text-green-600 transition-colors">
                  {stats.totalDoctors}
                </h3>
              </div>
              <div className="bg-green-100 p-3 rounded-lg text-green-600 group-hover:bg-green-600 group-hover:text-white transition-colors">
                <FaUserMd className="w-6 h-6" />
              </div>
            </div>
            <div className="mt-4">
              <Link to="/admin/doctors" className="text-xs text-green-600 hover:text-green-800 font-medium group-hover:underline">
                Quản lý bác sĩ →
              </Link>
            </div>
          </div>
          <div className="h-1.5 w-full bg-green-600"></div>
        </div>
        
        {/* Hospitals */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow group">
          <div className="p-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-medium text-gray-500">Cơ sở y tế</p>
                <h3 className="text-3xl font-bold text-gray-800 mt-1 group-hover:text-indigo-600 transition-colors">
                  {stats.totalHospitals}
                </h3>
              </div>
              <div className="bg-indigo-100 p-3 rounded-lg text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                <FaHospital className="w-6 h-6" />
              </div>
            </div>
            <div className="mt-4">
              <Link to="/admin/hospitals" className="text-xs text-indigo-600 hover:text-indigo-800 font-medium group-hover:underline">
                Quản lý cơ sở y tế →
              </Link>
            </div>
          </div>
          <div className="h-1.5 w-full bg-indigo-600"></div>
        </div>
        
        {/* Specialties */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow group">
          <div className="p-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-medium text-gray-500">Chuyên khoa</p>
                <h3 className="text-3xl font-bold text-gray-800 mt-1 group-hover:text-purple-600 transition-colors">
                  {stats.totalSpecialties}
                </h3>
              </div>
              <div className="bg-purple-100 p-3 rounded-lg text-purple-600 group-hover:bg-purple-600 group-hover:text-white transition-colors">
                <FaStethoscope className="w-6 h-6" />
              </div>
            </div>
            <div className="mt-4">
              <Link to="/admin/specialties" className="text-xs text-purple-600 hover:text-purple-800 font-medium group-hover:underline">
                Quản lý chuyên khoa →
              </Link>
            </div>
          </div>
          <div className="h-1.5 w-full bg-purple-600"></div>
        </div>
        
        {/* Services */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow group">
          <div className="p-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-medium text-gray-500">Dịch vụ</p>
                <h3 className="text-3xl font-bold text-gray-800 mt-1 group-hover:text-pink-600 transition-colors">
                  {stats.totalServices}
                </h3>
              </div>
              <div className="bg-pink-100 p-3 rounded-lg text-pink-600 group-hover:bg-pink-600 group-hover:text-white transition-colors">
                <FaHandHoldingMedical className="w-6 h-6" />
              </div>
            </div>
            <div className="mt-4">
              <Link to="/admin/services" className="text-xs text-pink-600 hover:text-pink-800 font-medium group-hover:underline">
                Quản lý dịch vụ →
              </Link>
            </div>
          </div>
          <div className="h-1.5 w-full bg-pink-600"></div>
        </div>
        
        {/* Rooms */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow group">
          <div className="p-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-medium text-gray-500">Phòng</p>
                <h3 className="text-3xl font-bold text-gray-800 mt-1 group-hover:text-amber-600 transition-colors">
                  {stats.totalRooms}
                </h3>
              </div>
              <div className="bg-amber-100 p-3 rounded-lg text-amber-600 group-hover:bg-amber-600 group-hover:text-white transition-colors">
                <FaDoorOpen className="w-6 h-6" />
              </div>
            </div>
            <div className="mt-4">
              <Link to="/admin/rooms" className="text-xs text-amber-600 hover:text-amber-800 font-medium group-hover:underline">
                Quản lý phòng →
              </Link>
            </div>
          </div>
          <div className="h-1.5 w-full bg-amber-600"></div>
        </div>
        
        {/* Appointments */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow group">
          <div className="p-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-medium text-gray-500">Lịch hẹn</p>
                <h3 className="text-3xl font-bold text-gray-800 mt-1 group-hover:text-cyan-600 transition-colors">
                  {stats.totalAppointments}
                </h3>
                <div className="mt-1">
                  <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-yellow-100 text-yellow-800">
                    <FaClock className="mr-1 text-xs" /> Đang chờ: {stats.pendingAppointments}
                  </span>
                </div>
              </div>
              <div className="bg-cyan-100 p-3 rounded-lg text-cyan-600 group-hover:bg-cyan-600 group-hover:text-white transition-colors">
                <FaCalendarCheck className="w-6 h-6" />
              </div>
            </div>
            <div className="mt-4">
              <Link to="/admin/appointments" className="text-xs text-cyan-600 hover:text-cyan-800 font-medium group-hover:underline">
                Quản lý lịch hẹn →
              </Link>
            </div>
          </div>
          <div className="h-1.5 w-full bg-cyan-600"></div>
        </div>
        
        {/* Payments Highlight */}
        <div className="col-span-1 sm:col-span-2 bg-gradient-to-r from-blue-700 to-blue-500 rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow">
          <div className="p-6 text-white">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-medium text-blue-100">Doanh thu</p>
                <h3 className="text-3xl font-bold mt-1">
                  {Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(stats.totalRevenue || 0)}
                </h3>
                <div className="mt-2 flex items-center">
                  <FaCreditCard className="mr-2" />
                  <span>Tổng số thanh toán: {stats.totalPayments}</span>
                </div>
              </div>
              <div className="bg-white/20 p-3 rounded-lg">
                <FaMoneyBill className="w-8 h-8" />
              </div>
            </div>
            <div className="mt-6 flex justify-between items-center">
              <div className="flex items-center text-blue-100">
                <FaChartLine className="mr-1" />
                <span className="text-sm">Tốc độ tăng trưởng: +{Math.floor(Math.random() * 8) + 3}%</span>
              </div>
              <Link to="/admin/payments" className="text-sm bg-white/20 hover:bg-white/30 px-3 py-1 rounded font-medium">
                Xem chi tiết →
              </Link>
            </div>
          </div>
        </div>
      </div>
      
      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Appointment Trends Chart */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-bold text-gray-800 flex items-center">
              <FaChartLine className="mr-2 text-blue-600" /> 
              Xu hướng lịch hẹn
            </h2>
            <div className="text-xs px-3 py-1 bg-blue-50 text-blue-700 rounded-full">
              7 ngày gần đây
            </div>
          </div>
          <div className="h-64">
            {chartData.appointmentTrends && 
              chartData.appointmentTrends.labels && 
              chartData.appointmentTrends.labels.length > 0 && 
              chartData.appointmentTrends.datasets && 
              chartData.appointmentTrends.datasets.length > 0 ? (
              <Line options={lineOptions} data={chartData.appointmentTrends} />
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-gray-400">
                <FaChartLine className="text-4xl mb-2" />
                <p>Không có dữ liệu xu hướng lịch hẹn</p>
              </div>
            )}
          </div>
        </div>

        {/* Revenue Chart */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
            <h2 className="text-lg font-bold text-gray-800 flex items-center">
              <FaMoneyBillWave className="mr-2 text-green-600" /> 
              Doanh thu
            </h2>
            <div className="flex items-center space-x-2 bg-gray-50 p-1 rounded-lg">
              <button 
                className={`px-3 py-1.5 text-xs rounded-md font-medium transition-colors ${
                  revenueChartPeriod === 'daily' 
                    ? 'bg-white text-blue-700 shadow-sm' 
                    : 'text-gray-600 hover:text-gray-800'
                }`}
                onClick={() => setRevenueChartPeriod('daily')}
              >
                <FaCalendarDay className="inline-block mr-1" /> Ngày
              </button>
              <button 
                className={`px-3 py-1.5 text-xs rounded-md font-medium transition-colors ${
                  revenueChartPeriod === 'monthly' 
                    ? 'bg-white text-blue-700 shadow-sm' 
                    : 'text-gray-600 hover:text-gray-800'
                }`}
                onClick={() => setRevenueChartPeriod('monthly')}
              >
                <FaCalendarWeek className="inline-block mr-1" /> Tháng
              </button>
              <button 
                className={`px-3 py-1.5 text-xs rounded-md font-medium transition-colors ${
                  revenueChartPeriod === 'yearly' 
                    ? 'bg-white text-blue-700 shadow-sm' 
                    : 'text-gray-600 hover:text-gray-800'
                }`}
                onClick={() => setRevenueChartPeriod('yearly')}
              >
                <FaCalendarYear className="inline-block mr-1" /> Năm
              </button>
            </div>
          </div>
          <div className="h-64">
            {chartData.revenueByTime && 
              chartData.revenueByTime[revenueChartPeriod] && 
              chartData.revenueByTime[revenueChartPeriod].labels && 
              chartData.revenueByTime[revenueChartPeriod].labels.length > 0 && 
              chartData.revenueByTime[revenueChartPeriod].datasets && 
              chartData.revenueByTime[revenueChartPeriod].datasets.length > 0 ? (
              <Line options={revenueOptions} data={chartData.revenueByTime[revenueChartPeriod]} />
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-gray-400">
                <FaChartLine className="text-4xl mb-2" />
                <p>Không có dữ liệu doanh thu</p>
              </div>
            )}
          </div>
        </div>

        {/* Specialty Distribution Chart */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-bold text-gray-800 flex items-center">
              <FaChartPie className="mr-2 text-purple-600" /> 
              Phân bố theo chuyên khoa
            </h2>
            <button 
              onClick={() => setShowDetailedStats(!showDetailedStats)}
              className="text-xs px-3 py-1 bg-purple-50 text-purple-700 rounded-full hover:bg-purple-100"
            >
              {showDetailedStats ? 'Ẩn chi tiết' : 'Xem chi tiết'}
            </button>
          </div>
          <div className="flex flex-col lg:flex-row">
            <div className={showDetailedStats ? "w-full lg:w-1/2 h-64" : "w-full h-64"}>
              {chartData.specialtyDistribution && 
                chartData.specialtyDistribution.labels && 
                chartData.specialtyDistribution.labels.length > 0 && 
                chartData.specialtyDistribution.datasets && 
                chartData.specialtyDistribution.datasets.length > 0 ? (
                <Pie options={pieOptions} data={chartData.specialtyDistribution} />
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-gray-400">
                  <FaChartPie className="text-4xl mb-2" />
                  <p>Không có dữ liệu phân bố</p>
                </div>
              )}
            </div>
            
            {showDetailedStats && specialtyStats.length > 0 && (
              <div className="w-full lg:w-1/2 mt-4 lg:mt-0 lg:pl-6 text-sm">
                <div className="flex flex-wrap gap-2 mb-4">
                  {specialtyStats.map((specialty, index) => (
                    <button 
                      key={index}
                      onClick={() => handleSpecialtyClick(specialty)}
                      className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                        activeSpecialty && activeSpecialty.name === specialty.name
                          ? 'bg-purple-600 text-white'
                          : 'bg-purple-100 text-purple-700 hover:bg-purple-200'
                      }`}
                    >
                      {specialty.name}
                    </button>
                  ))}
                </div>
                
                {activeSpecialty && (
                  <div className="bg-purple-50 rounded-lg p-4">
                    <h3 className="font-medium text-purple-800 mb-2">{activeSpecialty.name}</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="flex flex-col">
                        <span className="text-xs text-gray-500">Số lịch hẹn</span>
                        <span className="font-medium">{activeSpecialty.count || 0}</span>
                      </div>
                      <div className="flex flex-col">
                        <span className="text-xs text-gray-500">Tỉ lệ</span>
                        <span className="font-medium">{activeSpecialty.percentage || 0}%</span>
                      </div>
                      {activeSpecialty.completionRate && (
                        <div className="flex flex-col">
                          <span className="text-xs text-gray-500">Tỉ lệ hoàn thành</span>
                          <span className="font-medium">{activeSpecialty.completionRate}%</span>
                        </div>
                      )}
                      {activeSpecialty.totalAmount && (
                        <div className="flex flex-col">
                          <span className="text-xs text-gray-500">Doanh thu</span>
                          <span className="font-medium">{Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(activeSpecialty.totalAmount)}</span>
                        </div>
                      )}
                      {activeSpecialty.doctorCount && (
                        <div className="flex flex-col">
                          <span className="text-xs text-gray-500">Số bác sĩ</span>
                          <span className="font-medium">{activeSpecialty.doctorCount}</span>
                        </div>
                      )}
                      {activeSpecialty.avgRating && (
                        <div className="flex flex-col">
                          <span className="text-xs text-gray-500">Đánh giá TB</span>
                          <span className="font-medium flex items-center">
                            {activeSpecialty.avgRating}
                            <FaStar className="ml-1 text-yellow-400 text-xs" />
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
        
        {/* Hospital Performance Chart */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-bold text-gray-800 flex items-center">
              <FaChartBar className="mr-2 text-cyan-600" /> 
              Hiệu suất cơ sở y tế
            </h2>
            <Link to="/admin/hospitals" className="text-xs px-3 py-1 bg-cyan-50 text-cyan-700 rounded-full hover:bg-cyan-100">
              Xem tất cả
            </Link>
          </div>
          <div className="h-64">
            {chartData.hospitalPerformance && 
              chartData.hospitalPerformance.labels && 
              chartData.hospitalPerformance.labels.length > 0 && 
              chartData.hospitalPerformance.datasets && 
              chartData.hospitalPerformance.datasets.length > 0 ? (
              <Bar options={barOptions} data={chartData.hospitalPerformance} />
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-gray-400">
                <FaChartBar className="text-4xl mb-2" />
                <p>Không có dữ liệu hiệu suất</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard; 
