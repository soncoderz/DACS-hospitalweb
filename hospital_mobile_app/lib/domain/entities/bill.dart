class Bill {
  final String id;
  final String appointmentId;
  final String billNumber;
  final double totalAmount;
  final double paidAmount;
  final String overallStatus;
  
  // Consultation
  final double consultationAmount;
  final String consultationStatus;
  final String? consultationPaymentMethod;
  final DateTime? consultationPaymentDate;
  
  // Medication
  final double medicationAmount;
  final String medicationStatus;
  final List<PrescriptionBill> prescriptions;
  
  // Hospitalization
  final double hospitalizationAmount;
  final String hospitalizationStatus;
  final String? hospitalizationPaymentMethod;
  final DateTime? hospitalizationPaymentDate;
  
  final DateTime createdAt;
  final DateTime updatedAt;

  Bill({
    required this.id,
    required this.appointmentId,
    required this.billNumber,
    required this.totalAmount,
    required this.paidAmount,
    required this.overallStatus,
    required this.consultationAmount,
    required this.consultationStatus,
    this.consultationPaymentMethod,
    this.consultationPaymentDate,
    required this.medicationAmount,
    required this.medicationStatus,
    required this.prescriptions,
    required this.hospitalizationAmount,
    required this.hospitalizationStatus,
    this.hospitalizationPaymentMethod,
    this.hospitalizationPaymentDate,
    required this.createdAt,
    required this.updatedAt,
  });
}

class PrescriptionBill {
  final String id;
  final int? order;
  final double amount;
  final String status;
  final String? diagnosis;
  final String? paymentMethod;
  final DateTime? paymentDate;

  PrescriptionBill({
    required this.id,
    this.order,
    required this.amount,
    required this.status,
    this.diagnosis,
    this.paymentMethod,
    this.paymentDate,
  });
}
