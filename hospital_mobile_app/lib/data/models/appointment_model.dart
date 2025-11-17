import '../../domain/entities/appointment.dart';

class AppointmentModel extends Appointment {
  const AppointmentModel({
    required super.id,
    required super.patientId,
    required super.patientName,
    required super.doctorId,
    required super.doctorName,
    required super.specialtyName,
    required super.appointmentDate,
    required super.timeSlot,
    required super.status,
    super.reason,
    super.notes,
    required super.bookingCode,
    super.fee,
    required super.createdAt,
  });

  factory AppointmentModel.fromJson(Map<String, dynamic> json) {
    return AppointmentModel(
      id: json['_id'] ?? json['id'] ?? '',
      patientId: json['patient']?['_id'] ?? json['patientId'] ?? '',
      patientName: json['patient']?['fullName'] ?? json['patientName'] ?? '',
      doctorId: json['doctor']?['_id'] ?? json['doctorId'] ?? '',
      doctorName: json['doctor']?['fullName'] ?? json['doctorName'] ?? '',
      specialtyName: json['specialty']?['name'] ?? json['specialtyName'] ?? '',
      appointmentDate: DateTime.parse(json['appointmentDate']),
      timeSlot: json['timeSlot'] ?? '',
      status: json['status'] ?? 'pending',
      reason: json['reason'],
      notes: json['notes'],
      bookingCode: json['bookingCode'] ?? '',
      fee: json['fee']?.toDouble(),
      createdAt: json['createdAt'] != null
          ? DateTime.parse(json['createdAt'])
          : DateTime.now(),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      '_id': id,
      'patientId': patientId,
      'patientName': patientName,
      'doctorId': doctorId,
      'doctorName': doctorName,
      'specialtyName': specialtyName,
      'appointmentDate': appointmentDate.toIso8601String(),
      'timeSlot': timeSlot,
      'status': status,
      'reason': reason,
      'notes': notes,
      'bookingCode': bookingCode,
      'fee': fee,
      'createdAt': createdAt.toIso8601String(),
    };
  }

  Appointment toEntity() => Appointment(
        id: id,
        patientId: patientId,
        patientName: patientName,
        doctorId: doctorId,
        doctorName: doctorName,
        specialtyName: specialtyName,
        appointmentDate: appointmentDate,
        timeSlot: timeSlot,
        status: status,
        reason: reason,
        notes: notes,
        bookingCode: bookingCode,
        fee: fee,
        createdAt: createdAt,
      );
}

class TimeSlotModel extends TimeSlot {
  const TimeSlotModel({
    required super.time,
    required super.isAvailable,
  });

  factory TimeSlotModel.fromJson(Map<String, dynamic> json) {
    return TimeSlotModel(
      time: json['time'] ?? '',
      isAvailable: json['isAvailable'] ?? false,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'time': time,
      'isAvailable': isAvailable,
    };
  }
}

class CreateAppointmentDto {
  final String doctorId;
  final String specialtyId;
  final DateTime appointmentDate;
  final String timeSlot;
  final String? reason;

  CreateAppointmentDto({
    required this.doctorId,
    required this.specialtyId,
    required this.appointmentDate,
    required this.timeSlot,
    this.reason,
  });

  Map<String, dynamic> toJson() {
    return {
      'doctorId': doctorId,
      'specialtyId': specialtyId,
      'appointmentDate': appointmentDate.toIso8601String().split('T')[0],
      'timeSlot': timeSlot,
      if (reason != null) 'reason': reason,
    };
  }
}
