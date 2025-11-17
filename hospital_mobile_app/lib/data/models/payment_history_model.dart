class PaymentHistoryModel {
  final String id;
  final String orderId;
  final String appointmentId;
  final String? bookingCode;
  final double amount;
  final String paymentMethod; // momo, cash, etc.
  final String status; // pending, success, failed, refunded
  final String? transactionId;
  final DateTime createdAt;
  final DateTime? paidAt;
  final Map<String, dynamic>? metadata;

  PaymentHistoryModel({
    required this.id,
    required this.orderId,
    required this.appointmentId,
    this.bookingCode,
    required this.amount,
    required this.paymentMethod,
    required this.status,
    this.transactionId,
    required this.createdAt,
    this.paidAt,
    this.metadata,
  });

  factory PaymentHistoryModel.fromJson(Map<String, dynamic> json) {
    return PaymentHistoryModel(
      id: json['_id'] ?? json['id'] ?? '',
      orderId: json['orderId'] ?? '',
      appointmentId: json['appointmentId'] ?? json['appointment']?['_id'] ?? '',
      bookingCode: json['bookingCode'] ?? json['appointment']?['bookingCode'],
      amount: (json['amount'] ?? 0).toDouble(),
      paymentMethod: json['paymentMethod'] ?? 'momo',
      status: json['status'] ?? 'pending',
      transactionId: json['transactionId'],
      createdAt: json['createdAt'] != null 
          ? DateTime.parse(json['createdAt']) 
          : DateTime.now(),
      paidAt: json['paidAt'] != null 
          ? DateTime.parse(json['paidAt']) 
          : null,
      metadata: json['metadata'] as Map<String, dynamic>?,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'orderId': orderId,
      'appointmentId': appointmentId,
      'bookingCode': bookingCode,
      'amount': amount,
      'paymentMethod': paymentMethod,
      'status': status,
      'transactionId': transactionId,
      'createdAt': createdAt.toIso8601String(),
      'paidAt': paidAt?.toIso8601String(),
      'metadata': metadata,
    };
  }

  bool get isSuccess => status == 'success';
  bool get isPending => status == 'pending';
  bool get isFailed => status == 'failed';
  bool get isRefunded => status == 'refunded';
}
