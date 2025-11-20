import '../../domain/entities/appointment.dart';

class AppointmentModel extends Appointment {
  const AppointmentModel({
    required super.id,
    required super.patientId,
    required super.patientName,
    required super.doctorId,
    required super.doctorName,
    required super.specialtyName,
    super.hospitalName,
    required super.appointmentDate,
    required super.timeSlot,
    required super.status,
    super.reason,
    super.notes,
    required super.bookingCode,
    super.fee,
    super.queueNumber,
    super.roomInfo,
    super.paymentStatus,
    super.paymentMethod,
    required super.createdAt,
  });

  factory AppointmentModel.fromJson(Map<String, dynamic> json) {
    try {
      print('[AppointmentModel] Parsing appointment: ${json['_id'] ?? json['id']}');
      
      // Handle timeSlot - can be String or Object
      String timeSlotValue = '';
      final timeSlotField = json['timeSlot'];
      if (timeSlotField is String) {
        timeSlotValue = timeSlotField;
      } else if (timeSlotField is Map<String, dynamic>) {
        // If timeSlot is an object, try to extract time string
        timeSlotValue = timeSlotField['time'] ?? 
                        timeSlotField['startTime'] ?? 
                        timeSlotField.toString();
      }
    
    // Handle doctorId - can be String or Object
    String doctorIdValue = '';
    String doctorNameValue = '';
    final doctorField = json['doctorId'];
    if (doctorField is String) {
      doctorIdValue = doctorField;
      doctorNameValue = json['doctorName'] ?? '';
    } else if (doctorField is Map<String, dynamic>) {
      doctorIdValue = doctorField['_id'] ?? doctorField['id'] ?? '';
      doctorNameValue = doctorField['fullName'] ?? doctorField['user']?['fullName'] ?? '';
    }
    
    // Also check 'doctor' field
    if (json.containsKey('doctor') && json['doctor'] is Map<String, dynamic>) {
      final doctor = json['doctor'] as Map<String, dynamic>;
      doctorIdValue = doctor['_id'] ?? doctor['id'] ?? doctorIdValue;
      doctorNameValue = doctor['fullName'] ?? doctor['user']?['fullName'] ?? doctorNameValue;
    }
    
    // Handle specialtyName - can be String or Object
    String specialtyNameValue = '';
    final specialtyField = json['specialtyId'];
    if (specialtyField is String) {
      specialtyNameValue = json['specialtyName'] ?? '';
    } else if (specialtyField is Map<String, dynamic>) {
      specialtyNameValue = specialtyField['name'] ?? '';
    }
    
    // Also check 'specialty' field
    if (json.containsKey('specialty') && json['specialty'] is Map<String, dynamic>) {
      final specialty = json['specialty'] as Map<String, dynamic>;
      specialtyNameValue = specialty['name'] ?? specialtyNameValue;
    }
    
    // Handle patientId and patientName
    String patientIdValue = '';
    String patientNameValue = '';
    final patientField = json['patientId'];
    if (patientField is String) {
      patientIdValue = patientField;
      patientNameValue = json['patientName'] ?? '';
    } else if (patientField is Map<String, dynamic>) {
      patientIdValue = patientField['_id'] ?? patientField['id'] ?? '';
      patientNameValue = patientField['fullName'] ?? '';
    }
    
    // Also check 'patient' field
    if (json.containsKey('patient') && json['patient'] is Map<String, dynamic>) {
      final patient = json['patient'] as Map<String, dynamic>;
      patientIdValue = patient['_id'] ?? patient['id'] ?? patientIdValue;
      patientNameValue = patient['fullName'] ?? patientNameValue;
    }
    
    // Handle hospitalName
    String? hospitalNameValue;
    final hospitalField = json['hospitalId'];
    if (hospitalField is String) {
      hospitalNameValue = json['hospitalName'];
    } else if (hospitalField is Map<String, dynamic>) {
      hospitalNameValue = hospitalField['name'];
    }
    
    // Also check 'hospital' field
    if (json.containsKey('hospital') && json['hospital'] is Map<String, dynamic>) {
      final hospital = json['hospital'] as Map<String, dynamic>;
      hospitalNameValue = hospital['name'] ?? hospitalNameValue;
    }
    
    // Handle fee - can be number or object
    double? feeValue;
    final feeField = json['fee'];
    if (feeField is num) {
      feeValue = feeField.toDouble();
    } else if (feeField is Map<String, dynamic>) {
      // If fee is an object, try to extract totalAmount or amount
      final amount = feeField['totalAmount'] ?? feeField['amount'] ?? feeField['consultationFee'];
      if (amount is num) {
        feeValue = amount.toDouble();
      }
    }
    
    // Also check totalAmount field directly
    if (feeValue == null && json.containsKey('totalAmount')) {
      final totalAmount = json['totalAmount'];
      if (totalAmount is num) {
        feeValue = totalAmount.toDouble();
      }
    }
    
      // Parse appointmentDate safely
      DateTime appointmentDateValue;
      try {
        appointmentDateValue = DateTime.parse(json['appointmentDate']);
      } catch (e) {
        print('[AppointmentModel] Error parsing appointmentDate: $e');
        appointmentDateValue = DateTime.now();
      }
      
      // Parse createdAt safely
      DateTime createdAtValue;
      try {
        createdAtValue = json['createdAt'] != null
            ? DateTime.parse(json['createdAt'])
            : DateTime.now();
      } catch (e) {
        print('[AppointmentModel] Error parsing createdAt: $e');
        createdAtValue = DateTime.now();
      }
      
      print('[AppointmentModel] Successfully parsed appointment');
      
      // Handle queueNumber
      int? queueNumberValue;
      if (json['queueNumber'] != null) {
        if (json['queueNumber'] is int) {
          queueNumberValue = json['queueNumber'];
        } else if (json['queueNumber'] is String) {
          queueNumberValue = int.tryParse(json['queueNumber']);
        }
      }
      
      // Handle roomInfo - can be String or Object
      String? roomInfoValue;
      final roomField = json['roomId'];
      if (roomField is String) {
        roomInfoValue = json['roomInfo'];
      } else if (roomField is Map<String, dynamic>) {
        final floor = roomField['floor'];
        final roomName = roomField['roomName'] ?? roomField['name'];
        if (floor != null && roomName != null) {
          roomInfoValue = 'Tầng $floor, $roomName';
        } else if (roomName != null) {
          roomInfoValue = roomName;
        }
      }
      
      // Also check 'roomInfo' field directly
      if (roomInfoValue == null && json.containsKey('roomInfo')) {
        roomInfoValue = json['roomInfo'];
      }
      
      // Handle paymentStatus
      String? paymentStatusValue = json['paymentStatus'];
      
      // Handle paymentMethod
      String? paymentMethodValue = json['paymentMethod'];
      
      return AppointmentModel(
        id: json['_id'] ?? json['id'] ?? '',
        patientId: patientIdValue.isEmpty ? 'unknown' : patientIdValue,
        patientName: patientNameValue.isEmpty ? 'Bệnh nhân' : patientNameValue,
        doctorId: doctorIdValue.isEmpty ? 'unknown' : doctorIdValue,
        doctorName: doctorNameValue.isEmpty ? 'Bác sĩ' : doctorNameValue,
        specialtyName: specialtyNameValue.isEmpty ? 'Chuyên khoa' : specialtyNameValue,
        hospitalName: hospitalNameValue,
        appointmentDate: appointmentDateValue,
        timeSlot: timeSlotValue.isEmpty ? 'Chưa xác định' : timeSlotValue,
        status: json['status'] ?? 'pending',
        reason: json['reason'],
        notes: json['notes'],
        bookingCode: json['bookingCode'] ?? '',
        fee: feeValue,
        queueNumber: queueNumberValue,
        roomInfo: roomInfoValue,
        paymentStatus: paymentStatusValue,
        paymentMethod: paymentMethodValue,
        createdAt: createdAtValue,
      );
    } catch (e, stackTrace) {
      print('[AppointmentModel] Error parsing appointment: $e');
      print('[AppointmentModel] Stack trace: $stackTrace');
      print('[AppointmentModel] JSON data: $json');
      rethrow;
    }
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
        hospitalName: hospitalName,
        appointmentDate: appointmentDate,
        timeSlot: timeSlot,
        status: status,
        reason: reason,
        notes: notes,
        bookingCode: bookingCode,
        fee: fee,
        queueNumber: queueNumber,
        roomInfo: roomInfo,
        paymentStatus: paymentStatus,
        paymentMethod: paymentMethod,
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
