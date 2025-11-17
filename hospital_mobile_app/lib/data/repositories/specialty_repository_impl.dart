import 'package:dartz/dartz.dart';
import '../../core/errors/failures.dart';
import '../../core/errors/error_handler.dart';
import '../../domain/entities/specialty.dart';
import '../../domain/repositories/specialty_repository.dart';
import '../datasources/specialty_remote_data_source.dart';

class SpecialtyRepositoryImpl implements SpecialtyRepository {
  final SpecialtyRemoteDataSource _remoteDataSource;

  SpecialtyRepositoryImpl(this._remoteDataSource);

  @override
  Future<Either<Failure, List<Specialty>>> getSpecialties() async {
    try {
      final hasConnection = await ErrorHandler.hasNetworkConnection();
      if (!hasConnection) {
        return const Left(NetworkFailure('Không có kết nối internet'));
      }

      final specialties = await _remoteDataSource.getSpecialties();
      return Right(specialties.map((model) => model.toEntity()).toList());
    } catch (e) {
      return Left(ErrorHandler.handleException(e as Exception));
    }
  }

  @override
  Future<Either<Failure, Specialty>> getSpecialtyById(String id) async {
    try {
      final hasConnection = await ErrorHandler.hasNetworkConnection();
      if (!hasConnection) {
        return const Left(NetworkFailure('Không có kết nối internet'));
      }

      final specialty = await _remoteDataSource.getSpecialtyById(id);
      return Right(specialty.toEntity());
    } catch (e) {
      return Left(ErrorHandler.handleException(e as Exception));
    }
  }
}
