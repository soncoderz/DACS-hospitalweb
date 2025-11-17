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
        final List<dynamic> data =
            response.data['specialties'] ?? response.data;
        return data.map((json) => SpecialtyModel.fromJson(json)).toList();
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
