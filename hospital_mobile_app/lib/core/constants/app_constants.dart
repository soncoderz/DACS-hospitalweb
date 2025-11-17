/// Application Constants
/// Contains app-wide constants like storage keys, pagination limits, etc.
class AppConstants {
  // App Info
  static const String appName = 'Hospital Mobile App';
  static const String appVersion = '1.0.0';

  // Storage Keys
  static const String jwtTokenKey = 'jwt_token';
  static const String userDataKey = 'user_data';
  static const String cachedDoctorsKey = 'cached_doctors';
  static const String cachedSpecialtiesKey = 'cached_specialties';
  static const String cachedServicesKey = 'cached_services';
  static const String cachedNewsKey = 'cached_news';
  static const String themeKey = 'theme_mode';
  static const String languageKey = 'language';

  // Pagination
  static const int defaultPageSize = 10;
  static const int newsPageSize = 10;
  static const int doctorsPageSize = 20;

  // Cache Expiry (in hours)
  static const int cacheExpiryHours = 24;

  // Date Formats
  static const String dateFormat = 'dd/MM/yyyy';
  static const String timeFormat = 'HH:mm';
  static const String dateTimeFormat = 'dd/MM/yyyy HH:mm';
  static const String apiDateFormat = 'yyyy-MM-dd';

  // Validation
  static const int minPasswordLength = 6;
  static const int maxPasswordLength = 50;
  static const int minNameLength = 2;
  static const int maxNameLength = 100;

  // UI Constants
  static const double defaultPadding = 16.0;
  static const double smallPadding = 8.0;
  static const double largePadding = 24.0;
  static const double borderRadius = 12.0;
  static const double cardElevation = 2.0;

  // Animation Durations
  static const Duration shortAnimationDuration = Duration(milliseconds: 200);
  static const Duration mediumAnimationDuration = Duration(milliseconds: 300);
  static const Duration longAnimationDuration = Duration(milliseconds: 500);

  // Appointment Status
  static const String statusPending = 'pending';
  static const String statusConfirmed = 'confirmed';
  static const String statusCompleted = 'completed';
  static const String statusCancelled = 'cancelled';

  // Payment Status
  static const String paymentPending = 'pending';
  static const String paymentSuccess = 'success';
  static const String paymentFailed = 'failed';

  // User Roles
  static const String rolePatient = 'patient';
  static const String roleDoctor = 'doctor';
  static const String roleAdmin = 'admin';

  // Error Messages
  static const String networkErrorMessage = 'Không có kết nối internet';
  static const String serverErrorMessage = 'Đã có lỗi xảy ra từ server';
  static const String unknownErrorMessage = 'Đã có lỗi không xác định';
  static const String sessionExpiredMessage = 'Phiên đăng nhập đã hết hạn';
  static const String invalidCredentialsMessage =
      'Email hoặc mật khẩu không đúng';

  // Success Messages
  static const String loginSuccessMessage = 'Đăng nhập thành công';
  static const String registerSuccessMessage = 'Đăng ký thành công';
  static const String bookingSuccessMessage = 'Đặt lịch thành công';
  static const String cancelSuccessMessage = 'Hủy lịch thành công';
  static const String rescheduleSuccessMessage = 'Đổi lịch thành công';

  // Regex Patterns
  static const String emailPattern =
      r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$';
  static const String phonePattern = r'^[0-9]{10,11}$';

  // Image Placeholders
  static const String defaultAvatarUrl =
      'https://via.placeholder.com/150/CCCCCC/FFFFFF?text=Avatar';
  static const String defaultDoctorAvatarUrl =
      'https://via.placeholder.com/150/4A90E2/FFFFFF?text=Doctor';
  static const String defaultNewsImageUrl =
      'https://via.placeholder.com/400x200/4A90E2/FFFFFF?text=News';
  static const String defaultServiceImageUrl =
      'https://via.placeholder.com/400x200/4A90E2/FFFFFF?text=Service';
}
