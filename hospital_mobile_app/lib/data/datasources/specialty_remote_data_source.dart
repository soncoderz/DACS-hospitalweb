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
        
        // Keep only active specialties to match web
        data = data.where((item) {
          if (item is Map<String, dynamic>) {
            return item['isActive'] == true;
          }
          return false;
        }).toList();

        if (data.isEmpty) {
          return [];
        }

        if (!data.every((json) => json is Map<String, dynamic>)) {
          throw ServerException('Định dạng dữ liệu chuyên khoa không hợp lệ');
        }

        final specialties = data
            .map((json) => SpecialtyModel.fromJson(json as Map<String, dynamic>))
            .toList();

        // Fetch doctor/service counts for each specialty to mirror web data
        final specialtiesWithCounts = await Future.wait(specialties.map((model) async {
          var doctorCount = model.doctorCount;
          var serviceCount = model.serviceCount;

          try {
            final doctorsResponse = await _dioClient.get(ApiConstants.doctorsBySpecialty(model.id));
            final doctorData = doctorsResponse.data['data'] ?? doctorsResponse.data['doctors'] ?? doctorsResponse.data;
            if (doctorData is List) {
              doctorCount = doctorData.length;
            }
          } catch (_) {}

          try {
            final servicesResponse = await _dioClient.get(ApiConstants.servicesBySpecialty(model.id));
            final serviceData = servicesResponse.data['data'] ?? servicesResponse.data['services'] ?? servicesResponse.data;
            if (serviceData is List) {
              serviceCount = serviceData.length;
            }
          } catch (_) {}

          return model.copyWith(
            doctorCount: doctorCount,
            serviceCount: serviceCount,
          );
        }));

        return specialtiesWithCounts;
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
        // API returns: { success: true, data: { _id, name, description, imageUrl, ... } }
        return SpecialtyModel.fromJson(
          response.data['data'] ?? response.data['specialty'] ?? response.data,
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
