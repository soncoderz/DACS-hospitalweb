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
      'token': idToken,
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

/// Data Transfer Object for verify email request
class VerifyEmailDto {
  final String token;

  VerifyEmailDto({required this.token});

  Map<String, dynamic> toJson() {
    return {
      'token': token,
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
    // Handle different response formats
    // Format 1: { token: "...", user: {...} }
    // Format 2: { data: { token: "...", ...otherUserFields } }
    
    String token = '';
    Map<String, dynamic> user = {};
    
    if (json.containsKey('data') && json['data'] is Map<String, dynamic>) {
      // Format 2: data contains both token and user info
      final data = json['data'] as Map<String, dynamic>;
      token = data['token'] ?? '';
      
      // Extract user info (everything except token)
      user = Map<String, dynamic>.from(data);
      user.remove('token'); // Remove token from user data
    } else {
      // Format 1: token and user are separate
      token = json['token'] ?? '';
      user = json['user'] ?? {};
    }
    
    print('[AuthResponse] Parsed token: ${token.isNotEmpty ? "${token.substring(0, token.length > 20 ? 20 : token.length)}..." : "EMPTY"}');
    print('[AuthResponse] Parsed user: ${user.isNotEmpty ? user.keys.join(", ") : "EMPTY"}');
    
    return AuthResponse(
      token: token,
      user: user,
    );
  }
}
