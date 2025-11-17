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
  static const String forgotPassword = '/auth/forgot-password';
  static const String verifyOtp = '/auth/verify-otp';
  static const String resetPassword = '/auth/reset-password';
  static const String profile = '/auth/profile';
  static const String logout = '/auth/logout';

  // Doctor Endpoints
  static const String doctors = '/doctors';
  static String doctorById(String id) => '/doctors/$id';
  static const String favoriteDoctors = '/doctors/favorites';
  static String addToFavorites(String id) => '/doctors/$id/favorite';
  static String removeFromFavorites(String id) => '/doctors/$id/favorite';

  // Specialty Endpoints
  static const String specialties = '/specialties';
  static String specialtyById(String id) => '/specialties/$id';

  // Service Endpoints
  static const String services = '/services';
  static String serviceById(String id) => '/services/$id';

  // Appointment Endpoints
  static const String appointments = '/appointments';
  static String availableSlots(String doctorId) =>
      '/appointments/doctors/$doctorId/schedules';
  static const String myAppointments = '/appointments/user/patient';
  static String appointmentById(String id) => '/appointments/$id';
  static String cancelAppointment(String id) => '/appointments/$id';
  static String rescheduleAppointment(String id) =>
      '/appointments/$id/reschedule';
  static const String appointmentHistory = '/appointments/history';

  // Payment Endpoints
  static const String createMomoPayment = '/payment/momo/create';
  static const String checkPaymentStatus = '/payment/momo/status';
  static String paymentStatus(String orderId) =>
      '/payment/momo/status/$orderId';
  static const String paymentHistory = '/payments/history';

  // News Endpoints
  static const String news = '/news/all';
  static String newsById(String id) => '/news/$id';

  // Timeout durations
  static const Duration connectTimeout = Duration(seconds: 30);
  static const Duration receiveTimeout = Duration(seconds: 30);
  static const Duration sendTimeout = Duration(seconds: 30);
}
