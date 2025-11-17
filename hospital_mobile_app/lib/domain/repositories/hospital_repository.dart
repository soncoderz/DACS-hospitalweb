import '../../domain/entities/hospital.dart';

abstract class HospitalRepository {
  Future<List<Hospital>> getHospitals({int? limit, bool? featured});
}
