import '../../domain/entities/doctor.dart';
import '../../domain/entities/hospital.dart';
import '../../domain/entities/review.dart';
import '../../domain/entities/service.dart';
import '../../domain/entities/specialty.dart';
import '../../domain/repositories/hospital_repository.dart';
import '../datasources/hospital_remote_data_source.dart';

class HospitalRepositoryImpl implements HospitalRepository {
  final HospitalRemoteDataSource remoteDataSource;

  HospitalRepositoryImpl({required this.remoteDataSource});

  @override
  Future<List<Hospital>> getHospitals({int? limit, bool? featured}) async {
    try {
      final hospitals = await remoteDataSource.getHospitals(
        limit: limit,
        featured: featured,
      );
      return hospitals.map((model) => model.toEntity()).toList();
    } catch (e) {
      rethrow;
    }
  }

  @override
  Future<Hospital> getHospitalById(String id) async {
    final hospital = await remoteDataSource.getHospitalById(id);
    return hospital.toEntity();
  }

  @override
  Future<List<Specialty>> getHospitalSpecialties(String id) async {
    final specialties = await remoteDataSource.getHospitalSpecialties(id);
    return specialties.map((model) => model.toEntity()).toList();
  }

  @override
  Future<List<Service>> getHospitalServices(String id) async {
    final services = await remoteDataSource.getHospitalServices(id);
    return services.map((model) => model.toEntity()).toList();
  }

  @override
  Future<List<Doctor>> getHospitalDoctors(String id) async {
    final doctors = await remoteDataSource.getHospitalDoctors(id);
    return doctors.map((model) => model.toEntity()).toList();
  }

  @override
  Future<List<Review>> getHospitalReviews(String id) async {
    final reviews = await remoteDataSource.getHospitalReviews(id);
    return reviews.map((model) => model.toEntity()).toList();
  }
}
