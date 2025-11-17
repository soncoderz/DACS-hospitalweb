import 'package:dartz/dartz.dart';
import '../../core/errors/failures.dart';
import '../entities/service.dart';

abstract class ServiceRepository {
  Future<Either<Failure, List<Service>>> getServices();
  Future<Either<Failure, Service>> getServiceById(String id);
}
