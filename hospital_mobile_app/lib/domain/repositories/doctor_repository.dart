import 'package:dartz/dartz.dart';
import '../../core/errors/failures.dart';
import '../entities/doctor.dart';

abstract class DoctorRepository {
  Future<Either<Failure, List<Doctor>>> getDoctors({
    String? specialtyId,
    String? search,
  });
  Future<Either<Failure, Doctor>> getDoctorById(String id);
  Future<Either<Failure, List<Doctor>>> getFavoriteDoctors();
  Future<Either<Failure, void>> addToFavorites(String doctorId);
  Future<Either<Failure, void>> removeFromFavorites(String doctorId);
}
