import 'package:dartz/dartz.dart';
import '../../core/errors/failures.dart';
import '../../core/errors/error_handler.dart';
import '../../core/services/token_storage_service.dart';
import '../../domain/entities/user.dart';
import '../../domain/repositories/auth_repository.dart';
import '../datasources/auth_remote_data_source.dart';
import '../models/auth_dto.dart';
import '../models/user_model.dart';

/// Implementation of auth repository - data layer
class AuthRepositoryImpl implements AuthRepository {
  final AuthRemoteDataSource _remoteDataSource;
  final TokenStorageService _tokenStorage;

  AuthRepositoryImpl(this._remoteDataSource, this._tokenStorage);

  @override
  Future<Either<Failure, User>> register({
    required String email,
    required String password,
    required String fullName,
    String? phone,
  }) async {
    try {
      // Check network connectivity
      final hasConnection = await ErrorHandler.hasNetworkConnection();
      if (!hasConnection) {
        return const Left(NetworkFailure('Không có kết nối internet'));
      }

      final dto = RegisterDto(
        email: email,
        password: password,
        fullName: fullName,
        phone: phone,
      );

      final response = await _remoteDataSource.register(dto);

      // Save token
      await _tokenStorage.saveToken(response.token);
      await _tokenStorage.saveUserData(response.user);

      // Convert to user model and entity
      final userModel = UserModel.fromJson(response.user);
      return Right(userModel.toEntity());
    } catch (e) {
      return Left(ErrorHandler.handleException(e as Exception));
    }
  }

  @override
  Future<Either<Failure, User>> login({
    required String email,
    required String password,
  }) async {
    try {
      // Check network connectivity
      final hasConnection = await ErrorHandler.hasNetworkConnection();
      if (!hasConnection) {
        return const Left(NetworkFailure('Không có kết nối internet'));
      }

      print('[AuthRepository] Attempting login for: $email');
      final dto = LoginDto(email: email, password: password);
      final response = await _remoteDataSource.login(dto);

      print('[AuthRepository] Login response received');
      print('[AuthRepository] Token exists: ${response.token.isNotEmpty}');
      print('[AuthRepository] User data: ${response.user}');

      // Save token
      print('[AuthRepository] Saving token...');
      await _tokenStorage.saveToken(response.token);
      await _tokenStorage.saveUserData(response.user);
      print('[AuthRepository] Token saved successfully');

      // Convert to user model and entity
      final userModel = UserModel.fromJson(response.user);
      print('[AuthRepository] User model created: ${userModel.email}');
      
      return Right(userModel.toEntity());
    } catch (e) {
      print('[AuthRepository] Login error: $e');
      return Left(ErrorHandler.handleException(e as Exception));
    }
  }

  @override
  Future<Either<Failure, User>> googleLogin({
    required String idToken,
  }) async {
    try {
      // Check network connectivity
      final hasConnection = await ErrorHandler.hasNetworkConnection();
      if (!hasConnection) {
        return const Left(NetworkFailure('Không có kết nối internet'));
      }

      final dto = GoogleLoginDto(idToken: idToken);
      final response = await _remoteDataSource.googleLogin(dto);

      // Save token
      await _tokenStorage.saveToken(response.token);
      await _tokenStorage.saveUserData(response.user);

      // Convert to user model and entity
      final userModel = UserModel.fromJson(response.user);
      return Right(userModel.toEntity());
    } catch (e) {
      return Left(ErrorHandler.handleException(e as Exception));
    }
  }

  @override
  Future<Either<Failure, User>> facebookLogin({
    required String accessToken,
    required String userID,
  }) async {
    try {
      // Check network connectivity
      final hasConnection = await ErrorHandler.hasNetworkConnection();
      if (!hasConnection) {
        return const Left(NetworkFailure('Không có kết nối internet'));
      }

      final dto = FacebookLoginDto(accessToken: accessToken, userID: userID);
      final response = await _remoteDataSource.facebookLogin(dto);

      // Save token
      await _tokenStorage.saveToken(response.token);
      await _tokenStorage.saveUserData(response.user);

      // Convert to user model and entity
      final userModel = UserModel.fromJson(response.user);
      return Right(userModel.toEntity());
    } catch (e) {
      return Left(ErrorHandler.handleException(e as Exception));
    }
  }

  @override
  Future<Either<Failure, void>> forgotPassword({
    required String email,
  }) async {
    try {
      // Check network connectivity
      final hasConnection = await ErrorHandler.hasNetworkConnection();
      if (!hasConnection) {
        return const Left(NetworkFailure('Không có kết nối internet'));
      }

      final dto = ForgotPasswordDto(email: email);
      await _remoteDataSource.forgotPassword(dto);
      return const Right(null);
    } catch (e) {
      return Left(ErrorHandler.handleException(e as Exception));
    }
  }

  @override
  Future<Either<Failure, void>> verifyOtp({
    required String email,
    required String otp,
  }) async {
    try {
      // Check network connectivity
      final hasConnection = await ErrorHandler.hasNetworkConnection();
      if (!hasConnection) {
        return const Left(NetworkFailure('Không có kết nối internet'));
      }

      final dto = VerifyOtpDto(email: email, otp: otp);
      await _remoteDataSource.verifyOtp(dto);
      return const Right(null);
    } catch (e) {
      return Left(ErrorHandler.handleException(e as Exception));
    }
  }

  @override
  Future<Either<Failure, void>> resetPassword({
    required String email,
    required String otp,
    required String newPassword,
  }) async {
    try {
      // Check network connectivity
      final hasConnection = await ErrorHandler.hasNetworkConnection();
      if (!hasConnection) {
        return const Left(NetworkFailure('Không có kết nối internet'));
      }

      final dto = ResetPasswordDto(
        email: email,
        otp: otp,
        newPassword: newPassword,
      );
      await _remoteDataSource.resetPassword(dto);
      return const Right(null);
    } catch (e) {
      return Left(ErrorHandler.handleException(e as Exception));
    }
  }

  @override
  Future<Either<Failure, void>> verifyEmail({
    required String token,
  }) async {
    try {
      // Check network connectivity
      final hasConnection = await ErrorHandler.hasNetworkConnection();
      if (!hasConnection) {
        return const Left(NetworkFailure('Không có kết nối internet'));
      }

      final dto = VerifyEmailDto(token: token);
      await _remoteDataSource.verifyEmail(dto);
      return const Right(null);
    } catch (e) {
      return Left(ErrorHandler.handleException(e as Exception));
    }
  }

  @override
  Future<Either<Failure, void>> resendVerification({
    required String email,
  }) async {
    try {
      // Check network connectivity
      final hasConnection = await ErrorHandler.hasNetworkConnection();
      if (!hasConnection) {
        return const Left(NetworkFailure('Không có kết nối internet'));
      }

      await _remoteDataSource.resendVerification(email);
      return const Right(null);
    } catch (e) {
      return Left(ErrorHandler.handleException(e as Exception));
    }
  }

  @override
  Future<Either<Failure, User>> getCurrentUser() async {
    try {
      // Check network connectivity
      final hasConnection = await ErrorHandler.hasNetworkConnection();
      if (!hasConnection) {
        return const Left(NetworkFailure('Không có kết nối internet'));
      }

      final userModel = await _remoteDataSource.getCurrentUser();
      return Right(userModel.toEntity());
    } catch (e) {
      return Left(ErrorHandler.handleException(e as Exception));
    }
  }

  @override
  Future<Either<Failure, User>> updateProfile({
    required String fullName,
    String? phoneNumber,
    String? address,
    String? gender,
    String? dateOfBirth,
  }) async {
    try {
      // Check network connectivity
      final hasConnection = await ErrorHandler.hasNetworkConnection();
      if (!hasConnection) {
        return const Left(NetworkFailure('Không có kết nối internet'));
      }

      final userModel = await _remoteDataSource.updateProfile(
        fullName: fullName,
        phoneNumber: phoneNumber,
        address: address,
        gender: gender,
        dateOfBirth: dateOfBirth,
      );
      return Right(userModel.toEntity());
    } catch (e) {
      return Left(ErrorHandler.handleException(e as Exception));
    }
  }

  @override
  Future<Either<Failure, void>> changePassword({
    required String currentPassword,
    required String newPassword,
  }) async {
    try {
      // Check network connectivity
      final hasConnection = await ErrorHandler.hasNetworkConnection();
      if (!hasConnection) {
        return const Left(NetworkFailure('Không có kết nối internet'));
      }

      await _remoteDataSource.changePassword(
        currentPassword: currentPassword,
        newPassword: newPassword,
      );
      return const Right(null);
    } catch (e) {
      return Left(ErrorHandler.handleException(e as Exception));
    }
  }

  @override
  Future<Either<Failure, User>> uploadAvatar(String filePath) async {
    try {
      // Check network connectivity
      final hasConnection = await ErrorHandler.hasNetworkConnection();
      if (!hasConnection) {
        return const Left(NetworkFailure('Không có kết nối internet'));
      }

      final userModel = await _remoteDataSource.uploadAvatar(filePath);
      return Right(userModel.toEntity());
    } catch (e) {
      return Left(ErrorHandler.handleException(e as Exception));
    }
  }

  @override
  Future<Either<Failure, void>> logout() async {

    try {
      // Try to call logout API
      await _remoteDataSource.logout();

      // Clear token regardless of API result
      await _tokenStorage.deleteToken();
      await _tokenStorage.deleteUserData();

      return const Right(null);
    } catch (e) {
      // Even if API fails, clear token locally
      await _tokenStorage.deleteToken();
      await _tokenStorage.deleteUserData();
      return const Right(null);
    }
  }
}
