const User = require('../models/userModel');
const Appointment = require('../models/appointmentModel');
const Hospital = require('../models/hospitalModel');
const Doctor = require('../models/doctorModel');
const Service = require('../models/serviceModel');
const Stat = require('../models/statModel');
const asyncHandler = require('express-async-handler');

/**
 * @desc    Lấy thống kê tổng quan cho dashboard
 * @route   GET /api/admin/stats
 * @access  Private/Admin
 */
const getDashboardStats = asyncHandler(async (req, res) => {
  try {
    // Lấy số lượng người dùng
    const userCount = await User.countDocuments({});

    // Lấy số lượng lịch hẹn
    const appointmentCount = await Appointment.countDocuments({});

    // Lấy số lượng bệnh viện
    const hospitalCount = await Hospital.countDocuments({});

    // Lấy số lượng bác sĩ
    const doctorCount = await Doctor.countDocuments({});

    // Lấy số lượng dịch vụ
    const serviceCount = await Service.countDocuments({});

    // Lấy 5 lịch hẹn gần đây nhất
    const recentAppointments = await Appointment.find({})
      .sort({ createdAt: -1 })
      .limit(5)
      .populate('user', 'name email')
      .populate('doctor', 'name specialty')
      .populate('service', 'name price');

    // Nếu có model Stat, lấy thêm thống kê từ đó
    let additionalStats = {};
    if (Stat) {
      const latestStat = await Stat.findOne({}).sort({ createdAt: -1 });
      if (latestStat) {
        additionalStats = {
          revenue: latestStat.revenue || 0,
          growthRate: latestStat.growthRate || 0,
          activeUsers: latestStat.activeUsers || 0,
          completedAppointments: latestStat.completedAppointments || 0
        };
      }
    }

    // Trả về dữ liệu thống kê
    res.json({
      success: true,
      data: {
        userCount,
        appointmentCount,
        hospitalCount,
        doctorCount,
        serviceCount,
        recentAppointments,
        ...additionalStats
      }
    });
  } catch (error) {
    console.error('Error in getDashboardStats:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi lấy dữ liệu thống kê'
    });
  }
});

/**
 * @desc    Lấy thống kê người dùng
 * @route   GET /api/admin/stats/users
 * @access  Private/Admin
 */
const getUserStats = asyncHandler(async (req, res) => {
  try {
    // Tổng số người dùng
    const totalUsers = await User.countDocuments({});

    // Số người dùng mới trong tháng này
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const newUsers = await User.countDocuments({
      createdAt: { $gte: startOfMonth }
    });

    // Số người dùng đã xác minh email
    const verifiedUsers = await User.countDocuments({ isEmailVerified: true });

    // Phân bố người dùng theo tháng đăng ký (6 tháng gần nhất)
    const userDistribution = [];
    for (let i = 5; i >= 0; i--) {
      const month = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const endOfMonth = new Date(now.getFullYear(), now.getMonth() - i + 1, 0);
      
      const count = await User.countDocuments({
        createdAt: { $gte: month, $lte: endOfMonth }
      });
      
      userDistribution.push({
        month: `${month.getMonth() + 1}/${month.getFullYear()}`,
        count
      });
    }

    res.json({
      success: true,
      data: {
        totalUsers,
        newUsers,
        verifiedUsers,
        userDistribution
      }
    });
  } catch (error) {
    console.error('Error in getUserStats:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi lấy thống kê người dùng'
    });
  }
});

/**
 * @desc    Lấy thống kê lịch hẹn
 * @route   GET /api/admin/stats/appointments
 * @access  Private/Admin
 */
const getAppointmentStats = asyncHandler(async (req, res) => {
  try {
    // Tổng số lịch hẹn
    const totalAppointments = await Appointment.countDocuments({});

    // Lịch hẹn theo trạng thái
    const pendingAppointments = await Appointment.countDocuments({ status: 'pending' });
    const confirmedAppointments = await Appointment.countDocuments({ status: 'confirmed' });
    const completedAppointments = await Appointment.countDocuments({ status: 'completed' });
    const canceledAppointments = await Appointment.countDocuments({ status: 'canceled' });

    // Phân bố lịch hẹn theo tháng (6 tháng gần nhất)
    const now = new Date();
    const appointmentDistribution = [];
    for (let i = 5; i >= 0; i--) {
      const month = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const endOfMonth = new Date(now.getFullYear(), now.getMonth() - i + 1, 0);
      
      const count = await Appointment.countDocuments({
        createdAt: { $gte: month, $lte: endOfMonth }
      });
      
      appointmentDistribution.push({
        month: `${month.getMonth() + 1}/${month.getFullYear()}`,
        count
      });
    }

    res.json({
      success: true,
      data: {
        totalAppointments,
        pendingAppointments,
        confirmedAppointments,
        completedAppointments,
        canceledAppointments,
        appointmentDistribution
      }
    });
  } catch (error) {
    console.error('Error in getAppointmentStats:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi lấy thống kê lịch hẹn'
    });
  }
});

/**
 * @desc    Lấy thống kê doanh thu
 * @route   GET /api/admin/stats/revenue
 * @access  Private/Admin
 */
const getRevenueStats = asyncHandler(async (req, res) => {
  try {
    const now = new Date();
    
    // Doanh thu theo tháng (6 tháng gần nhất)
    const revenueByMonth = [];
    for (let i = 5; i >= 0; i--) {
      const month = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const endOfMonth = new Date(now.getFullYear(), now.getMonth() - i + 1, 0);
      
      const appointments = await Appointment.find({
        createdAt: { $gte: month, $lte: endOfMonth },
        status: 'completed'
      }).populate('service', 'price');
      
      const revenue = appointments.reduce((total, appointment) => {
        return total + (appointment.service ? appointment.service.price : 0);
      }, 0);
      
      revenueByMonth.push({
        month: `${month.getMonth() + 1}/${month.getFullYear()}`,
        revenue
      });
    }

    // Doanh thu theo dịch vụ
    const services = await Service.find({});
    const revenueByService = [];
    
    for (const service of services) {
      const appointments = await Appointment.countDocuments({
        service: service._id,
        status: 'completed'
      });
      
      revenueByService.push({
        service: service.name,
        revenue: appointments * service.price
      });
    }

    res.json({
      success: true,
      data: {
        revenueByMonth,
        revenueByService
      }
    });
  } catch (error) {
    console.error('Error in getRevenueStats:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi lấy thống kê doanh thu'
    });
  }
});

module.exports = {
  getDashboardStats,
  getUserStats,
  getAppointmentStats,
  getRevenueStats
}; 