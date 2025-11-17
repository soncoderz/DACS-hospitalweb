import 'package:dartz/dartz.dart';
import '../../core/errors/failures.dart';
import '../../core/errors/error_handler.dart';
import '../../domain/entities/service.dart';
import '../../domain/repositories/service_repository.dart';
import '../datasources/service_remote_data_source.dart';

class ServiceRepositoryImpl implements ServiceRepository {
  final ServiceRemoteDataSource _remoteDataSource;

  ServiceRepositoryImpl(this._remoteDataSource);

  @override
  Future<Either<Failure, List<Service>>> getServices() async {
    try {
      final hasConnection = await ErrorHandler.hasNetworkConnection();
      if (!hasConnection) {
        return const Left(NetworkFailure('Không có kết nối internet'));
      }

      final services = await _remoteDataSource.getServices();
      return Right(services.map((model) => model.toEntity()).toList());
    } catch (e) {
      return Left(ErrorHandler.handleException(e as Exception));
    }
  }

  @override
  Future<Either<Failure, Service>> getServiceById(String id) async {
    try {
      final hasConnection = await ErrorHandler.hasNetworkConnection();
      if (!hasConnection) {
        return const Left(NetworkFailure('Không có kết nối internet'));
      }

      final service = await _remoteDataSource.getServiceById(id);
      return Right(service.toEntity());
    } catch (e) {
      return Left(ErrorHandler.handleException(e as Exception));
    }
  }
}
