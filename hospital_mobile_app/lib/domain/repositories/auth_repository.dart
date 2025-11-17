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

  Future<Either<Failure, User>> getCurrentUser();

  Future<Either<Failure, void>> logout();
}
