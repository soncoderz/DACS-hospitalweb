import '../../domain/entities/bill.dart';

class BillModel extends Bill {
  BillModel({
    required super.id,
    required super.appointmentId,
    required super.billNumber,
    required super.totalAmount,
    required super.paidAmount,
    required super.overallStatus,
    required super.consultationAmount,
    required super.consultationStatus,
    super.consultationPaymentMethod,
    super.consultationPaymentDate,
    required super.medicationAmount,
    required super.medicationStatus,
    required super.prescriptions,
    required super.hospitalizationAmount,
    required super.hospitalizationStatus,
    super.hospitalizationPaymentMethod,
    super.hospitalizationPaymentDate,
    required super.createdAt,
    required super.updatedAt,
  });

  factory BillModel.fromJson(Map<String, dynamic> json) {
    return BillModel(
      id: json['_id'] ?? json['id'] ?? '',
      appointmentId: _extractId(json['appointmentId']),
      billNumber: json['billNumber'] ?? '',
      totalAmount: _parseDouble(json['totalAmount']),
      paidAmount: _parseDouble(json['paidAmount']),
      overallStatus: json['overallStatus'] ?? 'pending',
      consultationAmount: _parseDouble(json['consultationBill']?['amount']),
      consultationStatus: json['consultationBill']?['status'] ?? 'pending',
      consultationPaymentMethod: json['consultationBill']?['paymentMethod'],
      consultationPaymentDate: json['consultationBill']?['paymentDate'] != null
          ? DateTime.parse(json['consultationBill']['paymentDate'])
          : null,
      medicationAmount: _parseDouble(json['medicationBill']?['amount']),
      medicationStatus: json['medicationBill']?['status'] ?? 'pending',
      prescriptions: _parsePrescriptions(json['medicationBill']),
      hospitalizationAmount: _parseDouble(json['hospitalizationBill']?['amount']),
      hospitalizationStatus: json['hospitalizationBill']?['status'] ?? 'pending',
      hospitalizationPaymentMethod: json['hospitalizationBill']?['paymentMethod'],
      hospitalizationPaymentDate: json['hospitalizationBill']?['paymentDate'] != null
          ? DateTime.parse(json['hospitalizationBill']['paymentDate'])
          : null,
      createdAt: DateTime.parse(json['createdAt'] ?? DateTime.now().toIso8601String()),
      updatedAt: DateTime.parse(json['updatedAt'] ?? DateTime.now().toIso8601String()),
    );
  }

  static String _extractId(dynamic value) {
    if (value == null) return '';
    if (value is String) return value;
    if (value is Map) return value['_id'] ?? value['id'] ?? '';
    return '';
  }

  static double _parseDouble(dynamic value) {
    if (value == null) return 0.0;
    if (value is double) return value;
    if (value is int) return value.toDouble();
    if (value is String) return double.tryParse(value) ?? 0.0;
    return 0.0;
  }

  static List<PrescriptionBill> _parsePrescriptions(Map<String, dynamic>? medicationBill) {
    if (medicationBill == null) return [];
    
    final prescriptionIds = medicationBill['prescriptionIds'] as List?;
    final prescriptionPayments = medicationBill['prescriptionPayments'] as List?;
    
    if (prescriptionIds == null) return [];
    
    return prescriptionIds.map((prescription) {
      final prescriptionId = _extractId(prescription);
      
      // Find matching payment
      final payment = prescriptionPayments?.firstWhere(
        (p) => _extractId(p['prescriptionId']) == prescriptionId,
        orElse: () => null,
      );
      
      return PrescriptionBillModel(
        id: prescriptionId,
        order: prescription['prescriptionOrder'],
        amount: _parseDouble(prescription['totalAmount']),
        status: payment?['status'] ?? 'pending',
        diagnosis: prescription['diagnosis'],
        paymentMethod: payment?['paymentMethod'],
        paymentDate: payment?['paymentDate'] != null
            ? DateTime.parse(payment['paymentDate'])
            : null,
      );
    }).toList();
  }

  Map<String, dynamic> toJson() {
    return {
      '_id': id,
      'appointmentId': appointmentId,
      'billNumber': billNumber,
      'totalAmount': totalAmount,
      'paidAmount': paidAmount,
      'overallStatus': overallStatus,
      'consultationBill': {
        'amount': consultationAmount,
        'status': consultationStatus,
        'paymentMethod': consultationPaymentMethod,
        'paymentDate': consultationPaymentDate?.toIso8601String(),
      },
      'medicationBill': {
        'amount': medicationAmount,
        'status': medicationStatus,
      },
      'hospitalizationBill': {
        'amount': hospitalizationAmount,
        'status': hospitalizationStatus,
        'paymentMethod': hospitalizationPaymentMethod,
        'paymentDate': hospitalizationPaymentDate?.toIso8601String(),
      },
      'createdAt': createdAt.toIso8601String(),
      'updatedAt': updatedAt.toIso8601String(),
    };
  }
}

class PrescriptionBillModel extends PrescriptionBill {
  PrescriptionBillModel({
    required super.id,
    super.order,
    required super.amount,
    required super.status,
    super.diagnosis,
    super.paymentMethod,
    super.paymentDate,
  });

  factory PrescriptionBillModel.fromJson(Map<String, dynamic> json) {
    return PrescriptionBillModel(
      id: json['_id'] ?? json['id'] ?? '',
      order: json['prescriptionOrder'],
      amount: BillModel._parseDouble(json['totalAmount']),
      status: json['status'] ?? 'pending',
      diagnosis: json['diagnosis'],
      paymentMethod: json['paymentMethod'],
      paymentDate: json['paymentDate'] != null
          ? DateTime.parse(json['paymentDate'])
          : null,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      '_id': id,
      'prescriptionOrder': order,
      'totalAmount': amount,
      'status': status,
      'diagnosis': diagnosis,
      'paymentMethod': paymentMethod,
      'paymentDate': paymentDate?.toIso8601String(),
    };
  }
}
