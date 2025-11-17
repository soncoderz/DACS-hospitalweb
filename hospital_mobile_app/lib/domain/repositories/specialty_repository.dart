import 'package:dartz/dartz.dart';
import '../../core/errors/failures.dart';
import '../entities/specialty.dart';

abstract class SpecialtyRepository {
  Future<Either<Failure, List<Specialty>>> getSpecialties();
  Future<Either<Failure, Specialty>> getSpecialtyById(String id);
}
