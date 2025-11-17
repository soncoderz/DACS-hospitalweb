import 'package:dartz/dartz.dart';
import '../../core/errors/failures.dart';
import '../entities/appointment.dart';

abstract class AppointmentRepository {
  Future<Either<Failure, List<TimeSlot>>> getAvailableSlots(
    String doctorId,
    DateTime date,
  );
  Future<Either<Failure, Appointment>> createAppointment({
    required String doctorId,
    required String specialtyId,
    required DateTime appointmentDate,
    required String timeSlot,
    String? reason,
  });
  Future<Either<Failure, List<Appointment>>> getMyAppointments();
  Future<Either<Failure, Appointment>> getAppointmentById(String id);
  Future<Either<Failure, void>> cancelAppointment(String id, String? reason);
  Future<Either<Failure, Appointment>> rescheduleAppointment(
    String id,
    DateTime newDate,
    String newTimeSlot,
  );
  Future<Either<Failure, List<Appointment>>> getAppointmentHistory();
}
