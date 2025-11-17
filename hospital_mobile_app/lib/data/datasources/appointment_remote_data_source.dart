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
  Future<List<AppointmentModel>> getAppointmentHistory();
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
        ApiConstants.availableSlots(doctorId),
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
      final response = await _dioClient.get(ApiConstants.myAppointments);

      if (response.statusCode == 200) {
        final List<dynamic> data =
            response.data['appointments'] ?? response.data;
        return data.map((json) => AppointmentModel.fromJson(json)).toList();
      } else {
        throw ServerException('Lấy danh sách lịch hẹn thất bại');
      }
    } catch (e) {
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
        return AppointmentModel.fromJson(
          response.data['appointment'] ?? response.data,
        );
      } else {
        throw ServerException('Lấy thông tin lịch hẹn thất bại');
      }
    } catch (e) {
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

  @override
  Future<List<AppointmentModel>> getAppointmentHistory() async {
    try {
      final response = await _dioClient.get(
        ApiConstants.appointmentHistory,
      );

      if (response.statusCode == 200) {
        final List<dynamic> data =
            response.data['appointments'] ?? response.data;
        return data.map((json) => AppointmentModel.fromJson(json)).toList();
      } else {
        throw ServerException('Lấy lịch sử lịch hẹn thất bại');
      }
    } catch (e) {
      if (e is ServerException) rethrow;
      throw ServerException('Lấy lịch sử lịch hẹn thất bại: ${e.toString()}');
    }
  }
}
