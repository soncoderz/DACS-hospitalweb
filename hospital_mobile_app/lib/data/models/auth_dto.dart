/// Data Transfer Object for login request
class LoginDto {
  final String email;
  final String password;

  LoginDto({
    required this.email,
    required this.password,
  });

  Map<String, dynamic> toJson() {
    return {
      'email': email,
      'password': password,
    };
  }
}

/// Data Transfer Object for register request
class RegisterDto {
  final String email;
  final String password;
  final String fullName;
  final String? phone;

  RegisterDto({
    required this.email,
    required this.password,
    required this.fullName,
    this.phone,
  });

  Map<String, dynamic> toJson() {
    return {
      'email': email,
      'password': password,
      'fullName': fullName,
      if (phone != null) 'phone': phone,
    };
  }
}

/// Data Transfer Object for Google login request
class GoogleLoginDto {
  final String idToken;

  GoogleLoginDto({required this.idToken});

  Map<String, dynamic> toJson() {
    return {
      'idToken': idToken,
    };
  }
}

/// Data Transfer Object for forgot password request
class ForgotPasswordDto {
  final String email;

  ForgotPasswordDto({required this.email});

  Map<String, dynamic> toJson() {
    return {
      'email': email,
    };
  }
}

/// Data Transfer Object for verify OTP request
class VerifyOtpDto {
  final String email;
  final String otp;

  VerifyOtpDto({
    required this.email,
    required this.otp,
  });

  Map<String, dynamic> toJson() {
    return {
      'email': email,
      'otp': otp,
    };
  }
}

/// Data Transfer Object for reset password request
class ResetPasswordDto {
  final String email;
  final String otp;
  final String newPassword;

  ResetPasswordDto({
    required this.email,
    required this.otp,
    required this.newPassword,
  });

  Map<String, dynamic> toJson() {
    return {
      'email': email,
      'otp': otp,
      'newPassword': newPassword,
    };
  }
}

/// Response model for authentication
class AuthResponse {
  final String token;
  final Map<String, dynamic> user;

  AuthResponse({
    required this.token,
    required this.user,
  });

  factory AuthResponse.fromJson(Map<String, dynamic> json) {
    return AuthResponse(
      token: json['token'] ?? '',
      user: json['user'] ?? {},
    );
  }
}
