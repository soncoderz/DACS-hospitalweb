/// API Constants for the Hospital Mobile App
/// Contains all API endpoints and base URLs
class ApiConstants {
  // Base URLs
  static const String baseUrl = 'http://10.0.2.2:5000/api';
  static const String socketUrl = 'http://10.0.2.2:5000';

  // Auth Endpoints
  static const String register = '/auth/register';
  static const String login = '/auth/login';
  static const String googleLogin = '/auth/google/token';
  static const String facebookLogin = '/auth/facebook/token';
  static const String forgotPassword = '/auth/forgot-password';
  static const String verifyOtp = '/auth/verify-otp';
  static const String resetPassword = '/auth/reset-password';
  static const String verifyEmail = '/auth/verify-email';
  static const String resendVerification = '/auth/resend-verification';
  static const String profile = '/auth/profile';
  static const String updateProfile = '/auth/profile';
  static const String changePassword = '/auth/profile/password';
  static const String uploadAvatar = '/auth/profile/avatar';
  static const String refreshToken = '/auth/refresh-token';

  // Doctor Endpoints
  static const String doctors = '/doctors';
  static String doctorDetail(String id) => '/doctors/doctors/$id';
  static const String favoriteDoctors = '/doctors/favorites';
  static String checkFavorite(String id) => '/doctors/$id/favorite';
  static String addToFavorites(String id) => '/doctors/$id/favorite';
  static String removeFromFavorites(String id) => '/doctors/$id/favorite';
  static String doctorServices(String id) => '/doctors/$id/services';
  static String doctorSchedule(String id) => '/doctors/$id/schedule';

  // Specialty Endpoints
  static const String specialties = '/specialties';
  static String specialtyById(String id) => '/specialties/$id';
  static String doctorsBySpecialty(String id) => '/appointments/specialties/$id/doctors';
  static String servicesBySpecialty(String id) => '/appointments/specialties/$id/services';

  // Service Endpoints
  static const String services = '/services';
  static String serviceById(String id) => '/services/$id';
  static String doctorsByService(String id) => '/appointments/services/$id/doctors';

  // Hospital Endpoints
  static const String hospitals = '/hospitals';
  static String hospitalById(String id) => '/hospitals/$id';
  static String hospitalSpecialties(String id) => '/appointments/hospitals/$id/specialties';
  static String hospitalDoctors(String id) => '/hospitals/$id/doctors';
  static String hospitalServices(String id) => '/hospitals/$id/services';

  // Appointment Endpoints
  static const String appointments = '/appointments';
  static String doctorSchedules(String doctorId) => '/appointments/doctors/$doctorId/schedules';
  static const String myAppointments = '/appointments/user/patient';
  static String appointmentById(String id) => '/appointments/$id';
  static String cancelAppointment(String id) => '/appointments/$id';
  static String rescheduleAppointment(String id) => '/appointments/$id/reschedule';
  static const String validateCoupon = '/appointments/coupons/validate';

  // Payment Endpoints
  static const String createMomoPayment = '/payments/momo/create';
  static const String momoPaymentResult = '/payments/momo/result';
  static String momoPaymentStatus(String orderId) => '/payments/momo/status/$orderId';
  static const String paymentHistory = '/billing/payment-history';
  static String billingByAppointment(String appointmentId) => '/billing/appointment/$appointmentId';

  // News Endpoints
  static const String news = '/news/all';
  static String newsById(String id) => '/news/news/$id';

  // Review Endpoints
  static const String allReviews = '/reviews/all';
  static String doctorReviews(String doctorId) => '/reviews/doctor/$doctorId';
  static String hospitalReviews(String hospitalId) => '/reviews/hospital/$hospitalId';
  static const String createDoctorReview = '/reviews/doctor';
  static const String createHospitalReview = '/reviews/hospital';

  // Statistics Endpoints
  static const String doctorStats = '/statistics/doctors';
  static const String appointmentStats = '/statistics/appointments';

  // Timeout durations
  static const Duration connectTimeout = Duration(seconds: 30);
  static const Duration receiveTimeout = Duration(seconds: 30);
  static const Duration sendTimeout = Duration(seconds: 30);
}
