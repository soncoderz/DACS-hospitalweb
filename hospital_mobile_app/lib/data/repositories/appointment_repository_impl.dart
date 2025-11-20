import 'package:dartz/dartz.dart';
import '../../core/errors/failures.dart';
import '../../core/errors/error_handler.dart';
import '../../domain/entities/appointment.dart';
import '../../domain/repositories/appointment_repository.dart';
import '../datasources/appointment_remote_data_source.dart';
import '../models/appointment_model.dart';

class AppointmentRepositoryImpl implements AppointmentRepository {
  final AppointmentRemoteDataSource _remoteDataSource;

  AppointmentRepositoryImpl(this._remoteDataSource);

  @override
  Future<Either<Failure, List<TimeSlot>>> getAvailableSlots(
    String doctorId,
    DateTime date,
  ) async {
    try {
      final hasConnection = await ErrorHandler.hasNetworkConnection();
      if (!hasConnection) {
        return const Left(NetworkFailure('Không có kết nối internet'));
      }

      final slots = await _remoteDataSource.getAvailableSlots(doctorId, date);
      return Right(slots);
    } catch (e) {
      return Left(ErrorHandler.handleException(e as Exception));
    }
  }

  @override
  Future<Either<Failure, Appointment>> createAppointment({
    required String doctorId,
    required String specialtyId,
    required DateTime appointmentDate,
    required String timeSlot,
    String? reason,
  }) async {
    try {
      final hasConnection = await ErrorHandler.hasNetworkConnection();
      if (!hasConnection) {
        return const Left(NetworkFailure('Không có kết nối internet'));
      }

      final dto = CreateAppointmentDto(
        doctorId: doctorId,
        specialtyId: specialtyId,
        appointmentDate: appointmentDate,
        timeSlot: timeSlot,
        reason: reason,
      );

      final appointment = await _remoteDataSource.createAppointment(dto);
      return Right(appointment.toEntity());
    } catch (e) {
      return Left(ErrorHandler.handleException(e as Exception));
    }
  }

  @override
  Future<Either<Failure, List<Appointment>>> getMyAppointments() async {
    try {
      final hasConnection = await ErrorHandler.hasNetworkConnection();
      if (!hasConnection) {
        return const Left(NetworkFailure('Không có kết nối internet'));
      }

      final appointments = await _remoteDataSource.getMyAppointments();
      return Right(appointments.map((model) => model.toEntity()).toList());
    } catch (e) {
      return Left(ErrorHandler.handleException(e as Exception));
    }
  }

  @override
  Future<Either<Failure, Appointment>> getAppointmentById(String id) async {
    try {
      final hasConnection = await ErrorHandler.hasNetworkConnection();
      if (!hasConnection) {
        return const Left(NetworkFailure('Không có kết nối internet'));
      }

      final appointment = await _remoteDataSource.getAppointmentById(id);
      return Right(appointment.toEntity());
    } catch (e) {
      return Left(ErrorHandler.handleException(e as Exception));
    }
  }

  @override
  Future<Either<Failure, void>> cancelAppointment(
    String id,
    String? reason,
  ) async {
    try {
      final hasConnection = await ErrorHandler.hasNetworkConnection();
      if (!hasConnection) {
        return const Left(NetworkFailure('Không có kết nối internet'));
      }

      await _remoteDataSource.cancelAppointment(id, reason);
      return const Right(null);
    } catch (e) {
      return Left(ErrorHandler.handleException(e as Exception));
    }
  }

  @override
  Future<Either<Failure, Appointment>> rescheduleAppointment(
    String id,
    DateTime newDate,
    String newTimeSlot,
  ) async {
    try {
      final hasConnection = await ErrorHandler.hasNetworkConnection();
      if (!hasConnection) {
        return const Left(NetworkFailure('Không có kết nối internet'));
      }

      final appointment = await _remoteDataSource.rescheduleAppointment(
        id,
        newDate,
        newTimeSlot,
      );
      return Right(appointment.toEntity());
    } catch (e) {
      return Left(ErrorHandler.handleException(e as Exception));
    }
  }
}
