import 'package:dio/dio.dart';
import '../../core/constants/api_constants.dart';
import '../../core/network/dio_client.dart';
import '../models/doctor_model.dart';
import '../models/hospital_model.dart';
import '../models/review_model.dart';
import '../models/service_model.dart';
import '../models/specialty_model.dart';

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

  Future<HospitalModel> getHospitalById(String id) async {
    try {
      final response = await dioClient.get(ApiConstants.hospitalById(id));
      final data = response.data['data'] ?? response.data['hospital'] ?? response.data;
      return HospitalModel.fromJson(data as Map<String, dynamic>);
    } on DioException catch (e) {
      throw Exception(e.response?.data['message'] ?? 'Failed to fetch hospital detail');
    }
  }

  Future<List<DoctorModel>> getHospitalDoctors(String id) async {
    try {
      final response = await dioClient.get(ApiConstants.hospitalDoctors(id));
      final data = response.data['data'] ?? response.data['doctors'] ?? response.data;
      if (data is List) {
        return data
            .whereType<Map<String, dynamic>>()
            .map((json) => DoctorModel.fromJson(json))
            .toList();
      }
      return [];
    } on DioException catch (e) {
      throw Exception(e.response?.data['message'] ?? 'Failed to fetch doctors');
    }
  }

  Future<List<ServiceModel>> getHospitalServices(String id) async {
    try {
      final response = await dioClient.get(ApiConstants.hospitalServices(id));
      final data = response.data['data'] ?? response.data['services'] ?? response.data;
      if (data is List) {
        return data
            .whereType<Map<String, dynamic>>()
            .map((json) => ServiceModel.fromJson(json))
            .toList();
      }
      return [];
    } on DioException catch (e) {
      throw Exception(e.response?.data['message'] ?? 'Failed to fetch services');
    }
  }

  Future<List<SpecialtyModel>> getHospitalSpecialties(String id) async {
    try {
      final response = await dioClient.get(ApiConstants.hospitalSpecialties(id));
      final data = response.data['data'] ?? response.data['specialties'] ?? response.data;
      if (data is List) {
        return data
            .whereType<Map<String, dynamic>>()
            .map((json) => SpecialtyModel.fromJson(json))
            .toList();
      }
      return [];
    } on DioException catch (e) {
      throw Exception(e.response?.data['message'] ?? 'Failed to fetch specialties');
    }
  }

  Future<List<ReviewModel>> getHospitalReviews(String id) async {
    try {
      final response = await dioClient.get(ApiConstants.hospitalReviews(id));
      final data = response.data['data'] ?? response.data['reviews'] ?? response.data;
      if (data is List) {
        return data
            .whereType<Map<String, dynamic>>()
            .map((json) => ReviewModel.fromJson(json))
            .toList();
      }
      if (data is Map && data['docs'] is List) {
        return (data['docs'] as List)
            .whereType<Map<String, dynamic>>()
            .map((json) => ReviewModel.fromJson(json))
            .toList();
      }
      return [];
    } on DioException catch (e) {
      throw Exception(e.response?.data['message'] ?? 'Failed to fetch hospital reviews');
    }
  }
}
