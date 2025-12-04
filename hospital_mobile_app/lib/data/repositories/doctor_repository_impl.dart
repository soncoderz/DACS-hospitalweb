import 'package:dartz/dartz.dart';
import '../../core/errors/failures.dart';
import '../../core/errors/error_handler.dart';
import '../../domain/entities/doctor.dart';
import '../../domain/entities/review.dart';
import '../../domain/entities/service.dart';
import '../../domain/repositories/doctor_repository.dart';
import '../datasources/doctor_remote_data_source.dart';

class DoctorRepositoryImpl implements DoctorRepository {
  final DoctorRemoteDataSource _remoteDataSource;

  DoctorRepositoryImpl(this._remoteDataSource);

  @override
  Future<Either<Failure, List<Doctor>>> getDoctors({
    String? specialtyId,
    String? search,
  }) async {
    try {
      final hasConnection = await ErrorHandler.hasNetworkConnection();
      if (!hasConnection) {
        return const Left(NetworkFailure('Không có kết nối internet'));
      }

      final doctors = await _remoteDataSource.getDoctors(
        specialtyId: specialtyId,
        search: search,
      );
      return Right(doctors.map((model) => model.toEntity()).toList());
    } catch (e) {
      return Left(ErrorHandler.handleException(e as Exception));
    }
  }

  @override
  Future<Either<Failure, Doctor>> getDoctorById(String id) async {
    try {
      final hasConnection = await ErrorHandler.hasNetworkConnection();
      if (!hasConnection) {
        return const Left(NetworkFailure('Không có kết nối internet'));
      }

      final doctor = await _remoteDataSource.getDoctorById(id);
      return Right(doctor.toEntity());
    } catch (e) {
      return Left(ErrorHandler.handleException(e as Exception));
    }
  }

  @override
  Future<Either<Failure, List<Doctor>>> getFavoriteDoctors() async {
    try {
      final hasConnection = await ErrorHandler.hasNetworkConnection();
      if (!hasConnection) {
        return const Left(NetworkFailure('Không có kết nối internet'));
      }

      final doctors = await _remoteDataSource.getFavoriteDoctors();
      return Right(doctors.map((model) => model.toEntity()).toList());
    } catch (e) {
      return Left(ErrorHandler.handleException(e as Exception));
    }
  }

  @override
  Future<Either<Failure, void>> addToFavorites(String doctorId) async {
    try {
      final hasConnection = await ErrorHandler.hasNetworkConnection();
      if (!hasConnection) {
        return const Left(NetworkFailure('Không có kết nối internet'));
      }

      await _remoteDataSource.addToFavorites(doctorId);
      return const Right(null);
    } catch (e) {
      return Left(ErrorHandler.handleException(e as Exception));
    }
  }

  @override
  Future<Either<Failure, void>> removeFromFavorites(String doctorId) async {
    try {
      final hasConnection = await ErrorHandler.hasNetworkConnection();
      if (!hasConnection) {
        return const Left(NetworkFailure('Không có kết nối internet'));
      }

      await _remoteDataSource.removeFromFavorites(doctorId);
      return const Right(null);
    } catch (e) {
      return Left(ErrorHandler.handleException(e as Exception));
    }
  }

  @override
  Future<Either<Failure, List<Service>>> getDoctorServices(String doctorId) async {
    try {
      final hasConnection = await ErrorHandler.hasNetworkConnection();
      if (!hasConnection) {
        return const Left(NetworkFailure('Không có kết nối internet'));
      }

      final services = await _remoteDataSource.getDoctorServices(doctorId);
      return Right(services.map((service) => service.toEntity()).toList());
    } catch (e) {
      return Left(ErrorHandler.handleException(e as Exception));
    }
  }

  @override
  Future<Either<Failure, List<Review>>> getDoctorReviews(String doctorId) async {
    try {
      final hasConnection = await ErrorHandler.hasNetworkConnection();
      if (!hasConnection) {
        return const Left(NetworkFailure('Không có kết nối internet'));
      }

      final reviews = await _remoteDataSource.getDoctorReviews(doctorId);
      return Right(reviews.map((review) => review.toEntity()).toList());
    } catch (e) {
      return Left(ErrorHandler.handleException(e as Exception));
    }
  }

  @override
  Future<Either<Failure, List<Doctor>>> getDoctorsByService(String serviceId) async {
    try {
      final hasConnection = await ErrorHandler.hasNetworkConnection();
      if (!hasConnection) {
        return const Left(NetworkFailure('Không có kết nối internet'));
      }

      final doctors = await _remoteDataSource.getDoctorsByService(serviceId);
      return Right(doctors.map((doctor) => doctor.toEntity()).toList());
    } catch (e) {
      return Left(ErrorHandler.handleException(e as Exception));
    }
  }
}
