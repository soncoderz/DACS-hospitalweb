import '../../core/network/dio_client.dart';
import '../../core/constants/api_constants.dart';
import '../../core/errors/exceptions.dart';
import '../models/service_model.dart';

abstract class ServiceRemoteDataSource {
  Future<List<ServiceModel>> getServices();
  Future<ServiceModel> getServiceById(String id);
}

class ServiceRemoteDataSourceImpl implements ServiceRemoteDataSource {
  final DioClient _dioClient;

  ServiceRemoteDataSourceImpl(this._dioClient);

  @override
  Future<List<ServiceModel>> getServices() async {
    try {
      final response = await _dioClient.get(ApiConstants.services);

      if (response.statusCode == 200) {
        final List<dynamic> data = response.data['services'] ?? response.data;
        return data.map((json) => ServiceModel.fromJson(json)).toList();
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
}
