import 'package:dartz/dartz.dart';
import '../../core/errors/failures.dart';
import '../entities/user.dart';

/// Abstract interface for auth repository - domain layer
abstract class AuthRepository {
  Future<Either<Failure, User>> register({
    required String email,
    required String password,
    required String fullName,
    String? phone,
  });

  Future<Either<Failure, User>> login({
    required String email,
    required String password,
  });

  Future<Either<Failure, User>> googleLogin({
    required String idToken,
  });

  Future<Either<Failure, void>> forgotPassword({
    required String email,
  });

  Future<Either<Failure, void>> verifyOtp({
    required String email,
    required String otp,
  });

  Future<Either<Failure, void>> resetPassword({
    required String email,
    required String otp,
    required String newPassword,
  });

  Future<Either<Failure, void>> verifyEmail({
    required String token,
  });

  Future<Either<Failure, void>> resendVerification({
    required String email,
  });

  Future<Either<Failure, User>> getCurrentUser();

  Future<Either<Failure, User>> updateProfile({
    required String fullName,
    String? phoneNumber,
    String? address,
    String? gender,
    String? dateOfBirth,
  });

  Future<Either<Failure, void>> changePassword({
    required String currentPassword,
    required String newPassword,
  });

  Future<Either<Failure, User>> uploadAvatar(String filePath);

  Future<Either<Failure, void>> logout();
}

