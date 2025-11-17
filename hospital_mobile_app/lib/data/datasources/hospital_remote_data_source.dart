import 'package:dio/dio.dart';
import '../../core/network/dio_client.dart';
import '../models/hospital_model.dart';

class HospitalRemoteDataSource {
  final DioClient dioClient;

  HospitalRemoteDataSource({required this.dioClient});

  Future<List<HospitalModel>> getHospitals({
    int? limit,
    bool? featured,
  }) async {
    try {
      final queryParams = <String, dynamic>{};
      if (limit != null) queryParams['limit'] = limit;
      if (featured != null) queryParams['featured'] = featured;
      queryParams['includeServices'] = true;

      final response = await dioClient.get(
        '/hospitals',
        queryParameters: queryParams,
      );

      final data = response.data;
      List<dynamic> hospitalsJson = [];

      if (data['data'] != null) {
        if (data['data'] is List) {
          hospitalsJson = data['data'];
        } else if (data['data']['hospitals'] != null) {
          hospitalsJson = data['data']['hospitals'];
        }
      }

      return hospitalsJson
          .map((json) => HospitalModel.fromJson(json))
          .where((hospital) => hospital.isActive)
          .toList();
    } on DioException catch (e) {
      throw Exception(e.response?.data['message'] ?? 'Failed to fetch hospitals');
    }
  }
}
