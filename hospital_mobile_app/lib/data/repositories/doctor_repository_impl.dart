import 'package:dartz/dartz.dart';
import '../../core/errors/failures.dart';
import '../../core/errors/error_handler.dart';
import '../../domain/entities/doctor.dart';
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
}
