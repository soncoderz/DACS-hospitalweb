import 'package:equatable/equatable.dart';

class Appointment extends Equatable {
  final String id;
  final String patientId;
  final String patientName;
  final String doctorId;
  final String doctorName;
  final String specialtyName;
  final String? hospitalName;
  final DateTime appointmentDate;
  final String timeSlot;
  final String status;
  final String? reason;
  final String? notes;
  final String bookingCode;
  final double? fee;
  final int? queueNumber;
  final String? roomInfo;
  final String? paymentStatus;
  final String? paymentMethod;
  final DateTime createdAt;

  const Appointment({
    required this.id,
    required this.patientId,
    required this.patientName,
    required this.doctorId,
    required this.doctorName,
    required this.specialtyName,
    this.hospitalName,
    required this.appointmentDate,
    required this.timeSlot,
    required this.status,
    this.reason,
    this.notes,
    required this.bookingCode,
    this.fee,
    this.queueNumber,
    this.roomInfo,
    this.paymentStatus,
    this.paymentMethod,
    required this.createdAt,
  });

  @override
  List<Object?> get props => [
        id,
        patientId,
        patientName,
        doctorId,
        doctorName,
        specialtyName,
        hospitalName,
        appointmentDate,
        timeSlot,
        status,
        reason,
        notes,
        bookingCode,
        fee,
        queueNumber,
        roomInfo,
        paymentStatus,
        paymentMethod,
        createdAt,
      ];
}

class TimeSlot extends Equatable {
  final String time;
  final bool isAvailable;

  const TimeSlot({
    required this.time,
    required this.isAvailable,
  });

  @override
  List<Object> get props => [time, isAvailable];
}
