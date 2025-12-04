import '../../core/network/dio_client.dart';
import '../../core/constants/api_constants.dart';
import '../../core/errors/exceptions.dart';
import '../models/service_model.dart';

abstract class ServiceRemoteDataSource {
  Future<List<ServiceModel>> getServices();
  Future<ServiceModel> getServiceById(String id);
  Future<List<ServiceModel>> getServicesBySpecialty(String id);
  Future<List<ServiceModel>> getServicesByHospital(String id);
}

class ServiceRemoteDataSourceImpl implements ServiceRemoteDataSource {
  final DioClient _dioClient;

  ServiceRemoteDataSourceImpl(this._dioClient);

  @override
  Future<List<ServiceModel>> getServices() async {
    try {
      final response = await _dioClient.get(ApiConstants.services);

      if (response.statusCode == 200) {
        List<dynamic> data = [];
        
        // Handle different API response structures
        if (response.data is List) {
          data = response.data as List<dynamic>;
        } else if (response.data is Map<String, dynamic>) {
          final mapData = response.data as Map<String, dynamic>;
          if (mapData.containsKey('services') && mapData['services'] is List) {
            data = mapData['services'] as List<dynamic>;
          } else if (mapData.containsKey('data') && mapData['data'] is List) {
            data = mapData['data'] as List<dynamic>;
          }
        }
        
        if (data.isEmpty) {
          return [];
        }
        
        return data.map((json) {
          if (json is Map<String, dynamic>) {
            return ServiceModel.fromJson(json);
          }
          throw ServerException('Định dạng dữ liệu dịch vụ không hợp lệ');
        }).toList();
      } else {
        throw ServerException('Lấy danh sách dịch vụ thất bại');
      }
    } catch (e) {
      if (e is ServerException) rethrow;
      throw ServerException('Lấy danh sách dịch vụ thất bại: ${e.toString()}');
    }
  }

  @override
  Future<ServiceModel> getServiceById(String id) async {
    try {
      final response = await _dioClient.get(ApiConstants.serviceById(id));

      if (response.statusCode == 200) {
        return ServiceModel.fromJson(
          response.data['service'] ?? response.data,
        );
      } else {
        throw ServerException('Lấy thông tin dịch vụ thất bại');
      }
    } catch (e) {
      if (e is ServerException) rethrow;
      throw ServerException('Lấy thông tin dịch vụ thất bại: ${e.toString()}');
    }
  }

  @override
  Future<List<ServiceModel>> getServicesBySpecialty(String id) async {
    try {
      final response = await _dioClient.get(ApiConstants.servicesBySpecialty(id));
      if (response.statusCode == 200) {
        final data = response.data['data'] ?? response.data['services'] ?? response.data;
        if (data is List) {
          return data
              .whereType<Map<String, dynamic>>()
              .map((json) => ServiceModel.fromJson(json))
              .toList();
        }
      }
      throw ServerException('Lấy danh sách dịch vụ theo chuyên khoa thất bại');
    } catch (e) {
      if (e is ServerException) rethrow;
      throw ServerException('Lấy danh sách dịch vụ theo chuyên khoa thất bại: ${e.toString()}');
    }
  }

  @override
  Future<List<ServiceModel>> getServicesByHospital(String id) async {
    try {
      final response = await _dioClient.get(ApiConstants.hospitalServices(id));
      if (response.statusCode == 200) {
        final data = response.data['data'] ?? response.data['services'] ?? response.data;
        if (data is List) {
          return data
              .whereType<Map<String, dynamic>>()
              .map((json) => ServiceModel.fromJson(json))
              .toList();
        }
      }
      throw ServerException('Lấy danh sách dịch vụ theo chi nhánh thất bại');
    } catch (e) {
      if (e is ServerException) rethrow;
      throw ServerException('Lấy danh sách dịch vụ theo chi nhánh thất bại: ${e.toString()}');
    }
  }
}
