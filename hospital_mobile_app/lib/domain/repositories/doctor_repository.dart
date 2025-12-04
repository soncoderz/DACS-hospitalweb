import 'package:dartz/dartz.dart';
import '../../core/errors/failures.dart';
import '../entities/doctor.dart';
import '../entities/review.dart';
import '../entities/service.dart';

abstract class DoctorRepository {
  Future<Either<Failure, List<Doctor>>> getDoctors({
    String? specialtyId,
    String? search,
  });
  Future<Either<Failure, Doctor>> getDoctorById(String id);
  Future<Either<Failure, List<Doctor>>> getFavoriteDoctors();
  Future<Either<Failure, void>> addToFavorites(String doctorId);
  Future<Either<Failure, void>> removeFromFavorites(String doctorId);
  Future<Either<Failure, List<Service>>> getDoctorServices(String doctorId);
  Future<Either<Failure, List<Review>>> getDoctorReviews(String doctorId);
  Future<Either<Failure, List<Doctor>>> getDoctorsByService(String serviceId);
}
