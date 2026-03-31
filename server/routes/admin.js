const express = require('express');
const router = express.Router();
const multer = require('multer');

// Controller imports that are safe to load at boot
const doctorController = require('../controllers/doctorController');
const hospitalController = require('../controllers/hospitalController');
const specialtyController = require('../controllers/specialtyController');
const serviceController = require('../controllers/serviceController');
const roomController = require('../controllers/roomController');
const userController = require('../controllers/userController');
const scheduleController = require('../controllers/scheduleController');
const appointmentController = require('../controllers/appointmentController');
const couponController = require('../controllers/couponController');
const paymentController = require('../controllers/paymentController');
const statisticsController = require('../controllers/statisticsController');
const medicationController = require('../controllers/medicationController');
const cronController = require('../controllers/cronController');

const { protect, authorize } = require('../middlewares/authMiddleware');

const storage = multer.memoryStorage();
const uploadToMemory = multer({ storage });

const AI_CONFIG_ERROR_PATTERN = /OPENAI_API_KEY|GEMINI_API_KEY|Missing credentials|apiKey|API key/i;

// Some admin endpoints depend on AI/Qdrant. Load them lazily so the whole server
// does not crash in CI when AI keys are not provided.
const lazyAdminHandler = (controllerPath, exportName, unavailableMessage) => async (req, res, next) => {
  try {
    const controller = require(controllerPath);
    const handler = controller[exportName];

    if (typeof handler !== 'function') {
      throw new Error(`Controller export "${exportName}" does not exist in ${controllerPath}`);
    }

    return await handler(req, res, next);
  } catch (error) {
    const message = error?.message || '';

    if (AI_CONFIG_ERROR_PATTERN.test(message)) {
      console.warn(`[Admin Routes] Optional AI/Qdrant feature is unavailable for ${req.method} ${req.originalUrl}: ${message}`);
      return res.status(503).json({
        success: false,
        message: unavailableMessage,
      });
    }

    return next(error);
  }
};

const adminChatHistoryHandler = lazyAdminHandler(
  '../controllers/adminController',
  'getChatHistory',
  'Tinh nang lich su chat admin hien chua duoc cau hinh tren moi truong nay.',
);

const addIrrelevantQuestionHandler = lazyAdminHandler(
  '../controllers/adminController',
  'addIrrelevantQuestion',
  'Tinh nang bo loc Qdrant hien chua duoc cau hinh tren moi truong nay.',
);

const getSpecialtyMappingsHandler = lazyAdminHandler(
  '../controllers/specialtyMappingController',
  'getSpecialtyMappings',
  'Tinh nang anh xa chuyen khoa hien chua duoc cau hinh tren moi truong nay.',
);

const getSpecialtyMappingHandler = lazyAdminHandler(
  '../controllers/specialtyMappingController',
  'getSpecialtyMapping',
  'Tinh nang anh xa chuyen khoa hien chua duoc cau hinh tren moi truong nay.',
);

const createSpecialtyMappingHandler = lazyAdminHandler(
  '../controllers/specialtyMappingController',
  'createSpecialtyMapping',
  'Tinh nang anh xa chuyen khoa hien chua duoc cau hinh tren moi truong nay.',
);

const updateSpecialtyMappingHandler = lazyAdminHandler(
  '../controllers/specialtyMappingController',
  'updateSpecialtyMapping',
  'Tinh nang anh xa chuyen khoa hien chua duoc cau hinh tren moi truong nay.',
);

const deleteSpecialtyMappingHandler = lazyAdminHandler(
  '../controllers/specialtyMappingController',
  'deleteSpecialtyMapping',
  'Tinh nang anh xa chuyen khoa hien chua duoc cau hinh tren moi truong nay.',
);

const seedMappingsToQdrantHandler = lazyAdminHandler(
  '../controllers/specialtyMappingController',
  'seedMappingsToQdrant',
  'Tinh nang anh xa chuyen khoa hien chua duoc cau hinh tren moi truong nay.',
);

// Protect all admin routes
router.use(protect);
router.use(authorize('admin'));

router.get('/chat-history', adminChatHistoryHandler);
router.post('/filter/add', addIrrelevantQuestionHandler);

// Specialty Mapping routes
router.get('/specialty-mappings', getSpecialtyMappingsHandler);
router.get('/specialty-mappings/:id', getSpecialtyMappingHandler);
router.post('/specialty-mappings', createSpecialtyMappingHandler);
router.put('/specialty-mappings/:id', updateSpecialtyMappingHandler);
router.delete('/specialty-mappings/:id', deleteSpecialtyMappingHandler);
router.post('/specialty-mappings/seed-to-qdrant', seedMappingsToQdrantHandler);

// Doctor routes
router.post('/doctors', doctorController.createDoctor);

// Account management routes
router.get('/users', userController.getAllUsers);
router.get('/users/:id', userController.getUserById);
router.put('/users/:id/lock', userController.lockUserAccount);
router.put('/users/:id/unlock', userController.unlockUserAccount);
router.put('/doctors/:id/lock', doctorController.lockDoctorAccount);
router.put('/doctors/:id/unlock', doctorController.unlockDoctorAccount);

// Pharmacist routes
router.post('/pharmacists', userController.createPharmacist);
router.get('/pharmacists', userController.getAllUsers);

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

// Schedule routes
router.post('/schedules', scheduleController.createSchedule);
router.put('/schedules/:id', scheduleController.updateSchedule);
router.delete('/schedules/:id', scheduleController.deleteSchedule);
router.get('/schedules', scheduleController.getSchedules);
router.get('/schedules/:id', scheduleController.getScheduleById);

// Appointment routes
router.get('/appointments', appointmentController.getAllAppointments);
router.get('/appointments/:id', appointmentController.getAppointmentDetailAdmin);
router.get('/appointments/stats', appointmentController.getAppointmentStats);
router.put('/appointments/:id', appointmentController.updateAppointmentAdmin);

// Coupon routes
router.post('/coupons', couponController.createCoupon);
router.put('/coupons/:id', couponController.updateCoupon);
router.delete('/coupons/:id', couponController.deleteCoupon);
router.get('/coupons', couponController.getCoupons);
router.get('/coupons/:id', couponController.getCouponById);

// Payment routes
router.get('/payments', paymentController.getAllPayments);
router.get('/payments/stats', paymentController.getPaymentStats);
router.put('/payments/:id', paymentController.updatePayment);
router.get('/payments/:id', paymentController.getPaymentById);

// Statistics routes
router.get('/statistics/revenue', statisticsController.getRevenueStatistics);
router.get('/statistics/users', statisticsController.getUserStatistics);
router.get('/statistics/doctors', statisticsController.getDoctorStatistics);
router.get('/statistics/appointments', statisticsController.getAppointmentStatistics);
router.get('/dashboard/stats', statisticsController.getDashboardStatistics);
router.get('/dashboard/charts', statisticsController.getDashboardCharts);

router.post('/medications', medicationController.createMedication);
router.put('/medications/:id', medicationController.updateMedication);
router.delete('/medications/:id', medicationController.deleteMedication);

// Cron job test routes
router.get('/cron/test-appointment-reminder', cronController.testAppointmentReminder);

module.exports = router;
