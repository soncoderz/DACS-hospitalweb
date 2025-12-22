import 'package:dio/dio.dart';
import '../../core/network/dio_client.dart';
import '../../core/constants/api_constants.dart';
import '../../core/errors/exceptions.dart';
import '../models/user_model.dart';
import '../models/auth_dto.dart';

/// Abstract interface for auth remote data source
abstract class AuthRemoteDataSource {
  Future<AuthResponse> register(RegisterDto dto);
  Future<AuthResponse> login(LoginDto dto);
  Future<AuthResponse> googleLogin(GoogleLoginDto dto);
  Future<AuthResponse> facebookLogin(FacebookLoginDto dto);
  Future<void> forgotPassword(ForgotPasswordDto dto);
  Future<void> verifyOtp(VerifyOtpDto dto);
  Future<void> resetPassword(ResetPasswordDto dto);
  Future<void> verifyEmail(VerifyEmailDto dto);
  Future<void> resendVerification(String email);
  Future<UserModel> getCurrentUser();
  Future<UserModel> updateProfile({
    required String fullName,
    String? phoneNumber,
    String? address,
    String? gender,
    String? dateOfBirth,
  });
  Future<void> changePassword({
    required String currentPassword,
    required String newPassword,
  });
  Future<UserModel> uploadAvatar(String filePath);
  Future<void> logout();
}

/// Implementation of auth remote data source
class AuthRemoteDataSourceImpl implements AuthRemoteDataSource {
  final DioClient _dioClient;

  AuthRemoteDataSourceImpl(this._dioClient);

  @override
  Future<AuthResponse> register(RegisterDto dto) async {
    try {
      final response = await _dioClient.post(
        ApiConstants.register,
        data: dto.toJson(),
      );

      if (response.statusCode == 201 || response.statusCode == 200) {
        return AuthResponse.fromJson(response.data);
      } else {
        throw ServerException(
          response.data['message'] ?? 'Đăng ký thất bại',
          response.statusCode,
        );
      }
    } catch (e) {
      if (e is ServerException) rethrow;
      throw ServerException('Đăng ký thất bại: ${e.toString()}');
    }
  }

  @override
  Future<AuthResponse> login(LoginDto dto) async {
    try {
      final response = await _dioClient.post(
        ApiConstants.login,
        data: dto.toJson(),
      );

      if (response.statusCode == 200) {
        return AuthResponse.fromJson(response.data);
      } else {
        throw ServerException(
          response.data['message'] ?? 'Đăng nhập thất bại',
          response.statusCode,
        );
      }
    } catch (e) {
      if (e is ServerException) rethrow;
      throw ServerException('Đăng nhập thất bại: ${e.toString()}');
    }
  }

  @override
  Future<AuthResponse> googleLogin(GoogleLoginDto dto) async {
    try {
      final response = await _dioClient.post(
        ApiConstants.googleLogin,
        data: dto.toJson(),
      );

     if (response.statusCode == 200) {
        return AuthResponse.fromJson(response.data);
      } else {
        throw ServerException(
          response.data['message'] ?? 'Đăng nhập Google thất bại',
          response.statusCode,
        );
      }
    } catch (e) {
      if (e is ServerException) rethrow;
      throw ServerException('Đăng nhập Google thất bại: ${e.toString()}');
    }
  }

  @override
  Future<AuthResponse> facebookLogin(FacebookLoginDto dto) async {
    try {
      final response = await _dioClient.post(
        ApiConstants.facebookLogin,
        data: dto.toJson(),
      );

      if (response.statusCode == 200) {
        return AuthResponse.fromJson(response.data);
      } else {
        throw ServerException(
          response.data['message'] ?? 'Đăng nhập Facebook thất bại',
          response.statusCode,
        );
      }
    } catch (e) {
      if (e is ServerException) rethrow;
      throw ServerException('Đăng nhập Facebook thất bại: ${e.toString()}');
    }
  }

  @override
  Future<void> forgotPassword(ForgotPasswordDto dto) async {
    try {
      final response = await _dioClient.post(
        ApiConstants.forgotPassword,
        data: dto.toJson(),
      );

      if (response.statusCode != 200) {
        throw ServerException(
          response.data['message'] ?? 'Gửi OTP thất bại',
          response.statusCode,
        );
      }
    } catch (e) {
      if (e is ServerException) rethrow;
      throw ServerException('Gửi OTP thất bại: ${e.toString()}');
    }
  }

  @override
  Future<void> verifyOtp(VerifyOtpDto dto) async {
    try {
      final response = await _dioClient.post(
        ApiConstants.verifyOtp,
        data: dto.toJson(),
      );

      if (response.statusCode != 200) {
        throw ServerException(
          response.data['message'] ?? 'Xác thực OTP thất bại',
          response.statusCode,
        );
      }
    } catch (e) {
      if (e is ServerException) rethrow;
      throw ServerException('Xác thực OTP thất bại: ${e.toString()}');
    }
  }

  @override
  Future<void> resetPassword(ResetPasswordDto dto) async {
    try {
      final response = await _dioClient.post(
        ApiConstants.resetPassword,
        data: dto.toJson(),
      );

      if (response.statusCode != 200) {
        throw ServerException(
          response.data['message'] ?? 'Đặt lại mật khẩu thất bại',
          response.statusCode,
        );
      }
    } catch (e) {
      if (e is ServerException) rethrow;
      throw ServerException('Đặt lại mật khẩu thất bại: ${e.toString()}');
    }
  }

  @override
  Future<void> verifyEmail(VerifyEmailDto dto) async {
    try {
      final response = await _dioClient.post(
        ApiConstants.verifyEmail,
        data: dto.toJson(),
      );

      if (response.statusCode != 200) {
        throw ServerException(
          response.data['message'] ?? 'Xác thực email thất bại',
          response.statusCode,
        );
      }
    } catch (e) {
      if (e is ServerException) rethrow;
      throw ServerException('Xác thực email thất bại: ${e.toString()}');
    }
  }

  @override
  Future<void> resendVerification(String email) async {
    try {
      final response = await _dioClient.post(
        ApiConstants.resendVerification,
        data: {'email': email},
      );

      if (response.statusCode != 200) {
        throw ServerException(
          response.data['message'] ?? 'Gửi lại email xác thực thất bại',
          response.statusCode,
        );
      }
    } catch (e) {
      if (e is ServerException) rethrow;
      throw ServerException('Gửi lại email xác thực thất bại: ${e.toString()}');
    }
  }

  @override
  Future<UserModel> getCurrentUser() async {
    try {
      final response = await _dioClient.get(ApiConstants.profile);

      if (response.statusCode == 200) {
        return UserModel.fromJson(response.data['user'] ?? response.data);
      } else {
        throw ServerException(
          response.data['message'] ?? 'Lấy thông tin người dùng thất bại',
          response.statusCode,
        );
      }
    } catch (e) {
      if (e is ServerException) rethrow;
      throw ServerException('Lấy thông tin người dùng thất bại: ${e.toString()}');
    }
  }

  @override
  Future<UserModel> updateProfile({
    required String fullName,
    String? phoneNumber,
    String? address,
    String? gender,
    String? dateOfBirth,
  }) async {
    try {
      final data = {
        'fullName': fullName,
        if (phoneNumber != null) 'phoneNumber': phoneNumber,
        if (address != null) 'address': address,
        if (gender != null) 'gender': gender,
        if (dateOfBirth != null) 'dateOfBirth': dateOfBirth,
      };

      final response = await _dioClient.put(
        ApiConstants.updateProfile,
        data: data,
      );

      if (response.statusCode == 200) {
        return UserModel.fromJson(response.data['data'] ?? response.data);
      } else {
        throw ServerException(
          response.data['message'] ?? 'Cập nhật thông tin thất bại',
          response.statusCode,
        );
      }
    } catch (e) {
      if (e is ServerException) rethrow;
      throw ServerException('Cập nhật thông tin thất bại: ${e.toString()}');
    }
  }

  @override
  Future<void> changePassword({
    required String currentPassword,
    required String newPassword,
  }) async {
    try {
      final response = await _dioClient.put(
        ApiConstants.changePassword,
        data: {
          'currentPassword': currentPassword,
          'newPassword': newPassword,
        },
      );

      if (response.statusCode != 200) {
        throw ServerException(
          response.data['message'] ?? 'Đổi mật khẩu thất bại',
          response.statusCode,
        );
      }
    } catch (e) {
      if (e is ServerException) rethrow;
      throw ServerException('Đổi mật khẩu thất bại: ${e.toString()}');
    }
  }

  @override
  Future<UserModel> uploadAvatar(String filePath) async {
    try {
      // Use dio's FormData for multipart upload
      final formData = FormData.fromMap({
        'avatar':  await MultipartFile.fromFile(filePath),
      });

      final response = await _dioClient.post(
        ApiConstants.uploadAvatar,
        data: formData,
      );

      if (response.statusCode == 200) {
        return UserModel.fromJson(response.data['data'] ?? response.data);
      } else {
        throw ServerException(
          response.data['message'] ?? 'Tải ảnh lên thất bại',
          response.statusCode,
        );
      }
    } catch (e) {
      if (e is ServerException) rethrow;
      throw ServerException('Tải ảnh lên thất bại: ${e.toString()}');
    }
  }

  @override
  Future<void> logout() async {
    try {
      // Just clear local storage, no server call needed
      return;
    } catch (e) {
      // Logout can fail silently
      return;
    }
  }
}
