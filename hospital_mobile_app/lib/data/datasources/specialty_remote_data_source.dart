import '../../core/network/dio_client.dart';
import '../../core/constants/api_constants.dart';
import '../../core/errors/exceptions.dart';
import '../models/specialty_model.dart';

abstract class SpecialtyRemoteDataSource {
  Future<List<SpecialtyModel>> getSpecialties();
  Future<SpecialtyModel> getSpecialtyById(String id);
}

class SpecialtyRemoteDataSourceImpl implements SpecialtyRemoteDataSource {
  final DioClient _dioClient;

  SpecialtyRemoteDataSourceImpl(this._dioClient);

  @override
  Future<List<SpecialtyModel>> getSpecialties() async {
    try {
      final response = await _dioClient.get(ApiConstants.specialties);

      if (response.statusCode == 200) {
        List<dynamic> data = [];
        
        // Handle different API response structures
        if (response.data is List) {
          data = response.data as List<dynamic>;
        } else if (response.data is Map<String, dynamic>) {
          final mapData = response.data as Map<String, dynamic>;
          
          // Check for nested data.specialties structure
          if (mapData.containsKey('data') && mapData['data'] is Map<String, dynamic>) {
            final nestedData = mapData['data'] as Map<String, dynamic>;
            if (nestedData.containsKey('specialties') && nestedData['specialties'] is List) {
              data = nestedData['specialties'] as List<dynamic>;
            }
          }
          // Check for direct specialties array
          else if (mapData.containsKey('specialties') && mapData['specialties'] is List) {
            data = mapData['specialties'] as List<dynamic>;
          }
          // Check for direct data array
          else if (mapData.containsKey('data') && mapData['data'] is List) {
            data = mapData['data'] as List<dynamic>;
          }
        }
        
        if (data.isEmpty) {
          return [];
        }
        
        return data.map((json) {
          if (json is Map<String, dynamic>) {
            return SpecialtyModel.fromJson(json);
          }
          throw ServerException('Định dạng dữ liệu chuyên khoa không hợp lệ');
        }).toList();
      } else {
        throw ServerException('Lấy danh sách chuyên khoa thất bại');
      }
    } catch (e) {
      if (e is ServerException) rethrow;
      throw ServerException('Lấy danh sách chuyên khoa thất bại: ${e.toString()}');
    }
  }

  @override
  Future<SpecialtyModel> getSpecialtyById(String id) async {
    try {
      final response = await _dioClient.get(ApiConstants.specialtyById(id));

      if (response.statusCode == 200) {
        return SpecialtyModel.fromJson(
          response.data['specialty'] ?? response.data,
        );
      } else {
        throw ServerException('Lấy thông tin chuyên khoa thất bại');
      }
    } catch (e) {
      if (e is ServerException) rethrow;
      throw ServerException('Lấy thông tin chuyên khoa thất bại: ${e.toString()}');
    }
  }
}
