import '../../domain/entities/hospital.dart';
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
}
