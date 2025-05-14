const express = require('express');
const router = express.Router();

// Controller imports
const doctorController = require('../controllers/doctorController');
const hospitalController = require('../controllers/hospitalController');
const specialtyController = require('../controllers/specialtyController');
const serviceController = require('../controllers/serviceController');
const roomController = require('../controllers/roomController');
const userController = require('../controllers/userController');
const scheduleController = require('../controllers/scheduleController');
const appointmentController = require('../controllers/appointmentController');
const couponController = require('../controllers/couponController');
const reviewController = require('../controllers/reviewController');
const hospitalReviewController = require('../controllers/hospitalReviewController');
const paymentController = require('../controllers/paymentController');
const statisticsController = require('../controllers/statisticsController');

const { protect, authorize } = require('../middlewares/authMiddleware');
const { upload, uploadToMemory } = require('../middlewares/uploadMiddleware');

const medicationController = require('../controllers/medicationController');





// Protect all admin routes
router.use(protect);
router.use(authorize('admin'));

// Account management routes
router.get('/users', userController.getAllUsers);
router.get('/users/:id', userController.getUserById);
router.put('/users/:id/lock', userController.lockUserAccount);
router.put('/users/:id/unlock', userController.unlockUserAccount);
router.put('/doctors/:id/lock', doctorController.lockDoctorAccount);
router.put('/doctors/:id/unlock', doctorController.unlockDoctorAccount);

// Doctor routes
router.post('/doctors', doctorController.createDoctor);
router.put('/doctors/:id', doctorController.updateDoctor);
router.delete('/doctors/:id', doctorController.deleteDoctor);
router.get('/doctors', doctorController.getDoctors);
router.get('/doctors/:id', doctorController.getDoctorById);
router.post('/doctors/:id/avatar', uploadToMemory.single('avatar'), doctorController.uploadDoctorAvatar);

// Branch/Hospital routes
router.post('/hospitals', hospitalController.createHospital);
router.put('/hospitals/:id', hospitalController.updateHospital);
router.delete('/hospitals/:id', hospitalController.deleteHospital);
router.get('/hospitals', hospitalController.getHospitals);
router.get('/hospitals/:id', hospitalController.getHospitalById);
router.post('/hospitals/:id/image', uploadToMemory.single('image'), hospitalController.uploadHospitalImage);

// Specialty routes
router.post('/specialties', specialtyController.createSpecialty);
router.put('/specialties/:id', specialtyController.updateSpecialty);
router.delete('/specialties/:id', specialtyController.deleteSpecialty);
router.get('/specialties', specialtyController.getSpecialties);
router.get('/specialties/:id', specialtyController.getSpecialtyById);
router.post('/specialties/:id/image', uploadToMemory.single('image'), specialtyController.uploadSpecialtyImage);

// Service routes
router.post('/services', serviceController.createService);
router.put('/services/:id', serviceController.updateService);
router.delete('/services/:id', serviceController.deleteService);
router.get('/services', serviceController.getServices);
router.get('/services/:id', serviceController.getServiceById);
router.post('/services/:id/image', uploadToMemory.single('image'), serviceController.uploadServiceImage);
router.get('/services/:id/price-history', serviceController.getPriceHistory);
// Room routes
router.post('/rooms', roomController.createRoom);
router.put('/rooms/:id', roomController.updateRoom);
router.delete('/rooms/:id', roomController.deleteRoom);
router.get('/rooms', roomController.getRooms);
router.get('/rooms/:id', roomController.getRoomById);
router.post('/rooms/:id/image', uploadToMemory.single('image'), roomController.uploadRoomImage);


// Routes cho quản lý lịch làm việc của bác sĩ
router.post('/schedules', scheduleController.createSchedule);
router.put('/schedules/:id', scheduleController.updateSchedule);
router.delete('/schedules/:id', scheduleController.deleteSchedule);
router.get('/schedules', scheduleController.getSchedules);
router.get('/schedules/:id', scheduleController.getScheduleById);

// Routes cho quản lý lịch hẹn
router.get('/appointments', appointmentController.getAllAppointments);
router.get('/appointments/:id', appointmentController.getAppointmentDetailAdmin);
router.get('/appointments/stats', appointmentController.getAppointmentStats);
router.put('/appointments/:id', appointmentController.updateAppointmentAdmin);

// Routes cho quản lý mã giảm giá
router.post('/coupons', couponController.createCoupon);
router.put('/coupons/:id', couponController.updateCoupon);
router.delete('/coupons/:id', couponController.deleteCoupon);
router.get('/coupons', couponController.getCoupons);
router.get('/coupons/:id', couponController.getCouponById);

// Routes cho quản lý đánh giá bác sĩ


// Routes cho quản lý thanh toán
router.get('/payments', paymentController.getAllPayments);
router.get('/payments/stats', paymentController.getPaymentStats);
router.put('/payments/:id', paymentController.updatePayment);
router.get('/payments/:id', paymentController.getPaymentById);

// Routes cho thống kê
router.get('/statistics/revenue', statisticsController.getRevenueStatistics);
router.get('/statistics/users', statisticsController.getUserStatistics);
router.get('/statistics/doctors', statisticsController.getDoctorStatistics);
router.get('/statistics/appointments', statisticsController.getAppointmentStatistics);
router.get('/dashboard/stats', statisticsController.getDashboardStatistics);
router.get('/dashboard/charts', statisticsController.getDashboardCharts);


router.post('/medications',  medicationController.createMedication);
router.put('/medications/:id',  medicationController.updateMedication);
router.delete('/medications/:id',  medicationController.deleteMedication);

module.exports = router; 