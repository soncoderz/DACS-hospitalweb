import '../entities/doctor.dart';
import '../../domain/entities/hospital.dart';
import '../entities/review.dart';
import '../entities/service.dart';
import '../entities/specialty.dart';

abstract class HospitalRepository {
  Future<List<Hospital>> getHospitals({int? limit, bool? featured});
  Future<Hospital> getHospitalById(String id);
  Future<List<Specialty>> getHospitalSpecialties(String id);
  Future<List<Service>> getHospitalServices(String id);
  Future<List<Doctor>> getHospitalDoctors(String id);
  Future<List<Review>> getHospitalReviews(String id);
}
