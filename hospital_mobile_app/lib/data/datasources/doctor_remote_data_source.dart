import '../../core/network/dio_client.dart';
import '../../core/constants/api_constants.dart';
import '../../core/errors/exceptions.dart';
import '../models/doctor_model.dart';
import '../models/review_model.dart';
import '../models/service_model.dart';

abstract class DoctorRemoteDataSource {
  Future<List<DoctorModel>> getDoctors({String? specialtyId, String? search});
  Future<DoctorModel> getDoctorById(String id);
  Future<List<DoctorModel>> getFavoriteDoctors();
  Future<void> addToFavorites(String doctorId);
  Future<void> removeFromFavorites(String doctorId);
  Future<List<ServiceModel>> getDoctorServices(String doctorId);
  Future<List<ReviewModel>> getDoctorReviews(String doctorId);
  Future<List<DoctorModel>> getDoctorsByService(String serviceId);
}

class DoctorRemoteDataSourceImpl implements DoctorRemoteDataSource {
  final DioClient _dioClient;

  DoctorRemoteDataSourceImpl(this._dioClient);

  @override
  Future<List<DoctorModel>> getDoctors({
    String? specialtyId,
    String? search,
  }) async {
    try {
      final queryParams = <String, dynamic>{};
      if (specialtyId != null) queryParams['specialtyId'] = specialtyId;
      if (search != null) queryParams['search'] = search;

      final response = await _dioClient.get(
        ApiConstants.doctors,
        queryParameters: queryParams,
      );

      if (response.statusCode == 200) {
        final List<dynamic> data = response.data['data'] ?? response.data['doctors'] ?? [];
        return data.map((json) => DoctorModel.fromJson(json)).toList();
      } else {
        throw ServerException('Lấy danh sách bác sĩ thất bại');
      }
    } catch (e) {
      if (e is ServerException) rethrow;
      throw ServerException('Lấy danh sách bác sĩ thất bại: ${e.toString()}');
    }
  }

  @override
  Future<DoctorModel> getDoctorById(String id) async {
    try {
      final response = await _dioClient.get(ApiConstants.doctorDetail(id));

      if (response.statusCode == 200) {
        return DoctorModel.fromJson(
          response.data['doctor'] ?? response.data,
        );
      } else {
        throw ServerException('Lấy thông tin bác sĩ thất bại');
      }
    } catch (e) {
      if (e is ServerException) rethrow;
      throw ServerException('Lấy thông tin bác sĩ thất bại: ${e.toString()}');
    }
  }

  @override
  Future<List<DoctorModel>> getFavoriteDoctors() async {
    try {
      final response = await _dioClient.get(ApiConstants.favoriteDoctors);

      if (response.statusCode == 200) {
        final List<dynamic> data =
            response.data['favorites'] ?? response.data;
        return data.map((json) => DoctorModel.fromJson(json)).toList();
      } else {
        throw ServerException('Lấy danh sách yêu thích thất bại');
      }
    } catch (e) {
      if (e is ServerException) rethrow;
      throw ServerException('Lấy danh sách yêu thích thất bại: ${e.toString()}');
    }
  }

  @override
  Future<void> addToFavorites(String doctorId) async {
    try {
      final response = await _dioClient.post(
        ApiConstants.addToFavorites(doctorId),
      );

      if (response.statusCode != 200 && response.statusCode != 201) {
        throw ServerException('Thêm vào yêu thích thất bại');
      }
    } catch (e) {
      if (e is ServerException) rethrow;
      throw ServerException('Thêm vào yêu thích thất bại: ${e.toString()}');
    }
  }

  @override
  Future<void> removeFromFavorites(String doctorId) async {
    try {
      final response = await _dioClient.delete(
        ApiConstants.removeFromFavorites(doctorId),
      );

      if (response.statusCode != 200) {
        throw ServerException('Xóa khỏi yêu thích thất bại');
      }
    } catch (e) {
      if (e is ServerException) rethrow;
      throw ServerException('Xóa khỏi yêu thích thất bại: ${e.toString()}');
    }
  }

  @override
  Future<List<ServiceModel>> getDoctorServices(String doctorId) async {
    try {
      final response = await _dioClient.get(ApiConstants.doctorServices(doctorId));
      if (response.statusCode == 200) {
        final data = response.data['data'] ?? response.data['services'] ?? response.data;
        if (data is List) {
          return data
              .whereType<Map<String, dynamic>>()
              .map((json) => ServiceModel.fromJson(json))
              .toList();
        }
        return [];
      }
      throw ServerException('Lấy danh sách dịch vụ của bác sĩ thất bại');
    } catch (e) {
      if (e is ServerException) rethrow;
      throw ServerException('Lấy danh sách dịch vụ của bác sĩ thất bại: ${e.toString()}');
    }
  }

  @override
  Future<List<ReviewModel>> getDoctorReviews(String doctorId) async {
    try {
      final response = await _dioClient.get(ApiConstants.doctorReviews(doctorId));
      if (response.statusCode == 200) {
        final data = response.data['data'] ?? response.data['reviews'] ?? response.data;
        if (data is List) {
          return data
              .whereType<Map<String, dynamic>>()
              .map((json) => ReviewModel.fromJson(json))
              .toList();
        }
        // Handle paginated data
        if (data is Map && data['docs'] is List) {
          return (data['docs'] as List)
              .whereType<Map<String, dynamic>>()
              .map((json) => ReviewModel.fromJson(json))
              .toList();
        }
        return [];
      }
      throw ServerException('Lấy đánh giá bác sĩ thất bại');
    } catch (e) {
      if (e is ServerException) rethrow;
      throw ServerException('Lấy đánh giá bác sĩ thất bại: ${e.toString()}');
    }
  }

  @override
  Future<List<DoctorModel>> getDoctorsByService(String serviceId) async {
    try {
      final response = await _dioClient.get(ApiConstants.doctorsByService(serviceId));
      if (response.statusCode == 200) {
        final data = response.data['data'] ?? response.data['doctors'] ?? response.data;
        if (data is List) {
          return data
              .whereType<Map<String, dynamic>>()
              .map((json) => DoctorModel.fromJson(json))
              .toList();
        }
        return [];
      }
      throw ServerException('Lấy danh sách bác sĩ theo dịch vụ thất bại');
    } catch (e) {
      if (e is ServerException) rethrow;
      throw ServerException('Lấy danh sách bác sĩ theo dịch vụ thất bại: ${e.toString()}');
    }
  }
}
