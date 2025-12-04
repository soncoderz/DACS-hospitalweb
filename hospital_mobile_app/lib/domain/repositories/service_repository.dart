import 'package:dartz/dartz.dart';
import '../../core/errors/failures.dart';
import '../entities/service.dart';

abstract class ServiceRepository {
  Future<Either<Failure, List<Service>>> getServices();
  Future<Either<Failure, Service>> getServiceById(String id);
  Future<Either<Failure, List<Service>>> getServicesBySpecialty(String id);
  Future<Either<Failure, List<Service>>> getServicesByHospital(String id);
}
