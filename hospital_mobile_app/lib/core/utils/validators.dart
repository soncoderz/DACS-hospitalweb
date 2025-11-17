import '../constants/app_constants.dart';

/// Validation utilities
class Validators {
  /// Validate email
  static String? validateEmail(String? value) {
    if (value == null || value.isEmpty) {
      return 'Vui lòng nhập email';
    }

    final emailRegex = RegExp(AppConstants.emailPattern);
    if (!emailRegex.hasMatch(value)) {
      return 'Email không hợp lệ';
    }

    return null;
  }

  /// Validate password
  static String? validatePassword(String? value) {
    if (value == null || value.isEmpty) {
      return 'Vui lòng nhập mật khẩu';
    }

    if (value.length < AppConstants.minPasswordLength) {
      return 'Mật khẩu phải có ít nhất ${AppConstants.minPasswordLength} ký tự';
    }

    if (value.length > AppConstants.maxPasswordLength) {
      return 'Mật khẩu không được quá ${AppConstants.maxPasswordLength} ký tự';
    }

    return null;
  }

  /// Validate confirm password
  static String? validateConfirmPassword(String? value, String password) {
    if (value == null || value.isEmpty) {
      return 'Vui lòng xác nhận mật khẩu';
    }

    if (value != password) {
      return 'Mật khẩu không khớp';
    }

    return null;
  }

  /// Validate full name
  static String? validateFullName(String? value) {
    if (value == null || value.isEmpty) {
      return 'Vui lòng nhập họ tên';
    }

    if (value.length < AppConstants.minNameLength) {
      return 'Họ tên phải có ít nhất ${AppConstants.minNameLength} ký tự';
    }

    if (value.length > AppConstants.maxNameLength) {
      return 'Họ tên không được quá ${AppConstants.maxNameLength} ký tự';
    }

    return null;
  }

  /// Validate phone number
  static String? validatePhone(String? value) {
    if (value == null || value.isEmpty) {
      return null; // Phone is optional
    }

    final phoneRegex = RegExp(AppConstants.phonePattern);
    if (!phoneRegex.hasMatch(value)) {
      return 'Số điện thoại không hợp lệ';
    }

    return null;
  }

  /// Validate OTP
  static String? validateOtp(String? value) {
    if (value == null || value.isEmpty) {
      return 'Vui lòng nhập mã OTP';
    }

    if (value.length != 6) {
      return 'Mã OTP phải có 6 chữ số';
    }

    if (!RegExp(r'^\d+$').hasMatch(value)) {
      return 'Mã OTP chỉ chứa số';
    }

    return null;
  }
}
