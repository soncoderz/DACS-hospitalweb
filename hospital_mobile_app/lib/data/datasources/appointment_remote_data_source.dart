import '../../core/network/dio_client.dart';
import '../../core/constants/api_constants.dart';
import '../../core/errors/exceptions.dart';
import '../models/appointment_model.dart';

abstract class AppointmentRemoteDataSource {
  Future<List<TimeSlotModel>> getAvailableSlots(String doctorId, DateTime date);
  Future<AppointmentModel> createAppointment(CreateAppointmentDto dto);
  Future<List<AppointmentModel>> getMyAppointments();
  Future<AppointmentModel> getAppointmentById(String id);
  Future<void> cancelAppointment(String id, String? reason);
  Future<AppointmentModel> rescheduleAppointment(
    String id,
    DateTime newDate,
    String newTimeSlot,
  );
}

class AppointmentRemoteDataSourceImpl implements AppointmentRemoteDataSource {
  final DioClient _dioClient;

  AppointmentRemoteDataSourceImpl(this._dioClient);

  @override
  Future<List<TimeSlotModel>> getAvailableSlots(
    String doctorId,
    DateTime date,
  ) async {
    try {
      final response = await _dioClient.get(
        ApiConstants.doctorSchedules(doctorId),
        queryParameters: {
          'date': date.toIso8601String().split('T')[0],
        },
      );

      if (response.statusCode == 200) {
        final List<dynamic> data = response.data['slots'] ?? response.data;
        return data.map((json) => TimeSlotModel.fromJson(json)).toList();
      } else {
        throw ServerException('Lấy lịch trống thất bại');
      }
    } catch (e) {
      if (e is ServerException) rethrow;
      throw ServerException('Lấy lịch trống thất bại: ${e.toString()}');
    }
  }

  @override
  Future<AppointmentModel> createAppointment(CreateAppointmentDto dto) async {
    try {
      final response = await _dioClient.post(
        ApiConstants.appointments,
        data: dto.toJson(),
      );

      if (response.statusCode == 201 || response.statusCode == 200) {
        return AppointmentModel.fromJson(
          response.data['appointment'] ?? response.data,
        );
      } else {
        throw ServerException('Đặt lịch thất bại');
      }
    } catch (e) {
      if (e is ServerException) rethrow;
      throw ServerException('Đặt lịch thất bại: ${e.toString()}');
    }
  }

  @override
  Future<List<AppointmentModel>> getMyAppointments() async {
    try {
      // Fetch all appointments with a large limit to get complete data
      final response = await _dioClient.get(
        ApiConstants.myAppointments,
        queryParameters: {
          'limit': 1000, // Fetch all appointments
        },
      );

      if (response.statusCode == 200) {
        List<dynamic> data = [];
        
        // Handle different response formats
        if (response.data is List) {
          // Direct array response
          data = response.data as List<dynamic>;
        } else if (response.data is Map<String, dynamic>) {
          final mapData = response.data as Map<String, dynamic>;
          
          // Try different possible keys
          if (mapData.containsKey('appointments') && mapData['appointments'] is List) {
            data = mapData['appointments'] as List<dynamic>;
          } else if (mapData.containsKey('data')) {
            if (mapData['data'] is List) {
              data = mapData['data'] as List<dynamic>;
            } else if (mapData['data'] is Map<String, dynamic>) {
              final nestedData = mapData['data'] as Map<String, dynamic>;
              if (nestedData.containsKey('appointments') && nestedData['appointments'] is List) {
                data = nestedData['appointments'] as List<dynamic>;
              }
            }
          }
        }
        
        print('[AppointmentDataSource] Parsed ${data.length} appointments');
        
        return data.map((json) {
          if (json is Map<String, dynamic>) {
            return AppointmentModel.fromJson(json);
          }
          throw ServerException('Invalid appointment data format');
        }).toList();
      } else {
        throw ServerException('Lấy danh sách lịch hẹn thất bại');
      }
    } catch (e) {
      print('[AppointmentDataSource] Error: $e');
      if (e is ServerException) rethrow;
      throw ServerException('Lấy danh sách lịch hẹn thất bại: ${e.toString()}');
    }
  }

  @override
  Future<AppointmentModel> getAppointmentById(String id) async {
    try {
      final response = await _dioClient.get(
        ApiConstants.appointmentById(id),
      );

      if (response.statusCode == 200) {
        Map<String, dynamic> appointmentData;
        
        // Handle different response formats
        if (response.data is Map<String, dynamic>) {
          final mapData = response.data as Map<String, dynamic>;
          
          // Check for nested data structure
          if (mapData.containsKey('data') && mapData['data'] is Map<String, dynamic>) {
            appointmentData = mapData['data'] as Map<String, dynamic>;
          } else if (mapData.containsKey('appointment') && mapData['appointment'] is Map<String, dynamic>) {
            appointmentData = mapData['appointment'] as Map<String, dynamic>;
          } else {
            appointmentData = mapData;
          }
        } else {
          throw ServerException('Invalid response format');
        }
        
        print('[AppointmentDataSource] Parsing appointment detail: ${appointmentData['_id']}');
        return AppointmentModel.fromJson(appointmentData);
      } else {
        throw ServerException('Lấy thông tin lịch hẹn thất bại');
      }
    } catch (e) {
      print('[AppointmentDataSource] Error getting appointment: $e');
      if (e is ServerException) rethrow;
      throw ServerException('Lấy thông tin lịch hẹn thất bại: ${e.toString()}');
    }
  }

  @override
  Future<void> cancelAppointment(String id, String? reason) async {
    try {
      final response = await _dioClient.delete(
        ApiConstants.cancelAppointment(id),
        data: reason != null ? {'reason': reason} : null,
      );

      if (response.statusCode != 200) {
        throw ServerException('Hủy lịch hẹn thất bại');
      }
    } catch (e) {
      if (e is ServerException) rethrow;
      throw ServerException('Hủy lịch hẹn thất bại: ${e.toString()}');
    }
  }

  @override
  Future<AppointmentModel> rescheduleAppointment(
    String id,
    DateTime newDate,
    String newTimeSlot,
  ) async {
    try {
      final response = await _dioClient.put(
        ApiConstants.rescheduleAppointment(id),
        data: {
          'appointmentDate': newDate.toIso8601String().split('T')[0],
          'timeSlot': newTimeSlot,
        },
      );

      if (response.statusCode == 200) {
        return AppointmentModel.fromJson(
          response.data['appointment'] ?? response.data,
        );
      } else {
        throw ServerException('Đổi lịch hẹn thất bại');
      }
    } catch (e) {
      if (e is ServerException) rethrow;
      throw ServerException('Đổi lịch hẹn thất bại: ${e.toString()}');
    }
  }
}
