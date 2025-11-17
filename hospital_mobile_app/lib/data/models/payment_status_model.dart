class PaymentStatusModel {
  final String orderId;
  final String transactionId;
  final String status; // pending, success, failed
  final double amount;
  final String message;
  final int resultCode;
  final DateTime? paidAt;

  PaymentStatusModel({
    required this.orderId,
    required this.transactionId,
    required this.status,
    required this.amount,
    required this.message,
    required this.resultCode,
    this.paidAt,
  });

  factory PaymentStatusModel.fromJson(Map<String, dynamic> json) {
    return PaymentStatusModel(
      orderId: json['orderId'] ?? '',
      transactionId: json['transactionId'] ?? json['transId'] ?? '',
      status: json['status'] ?? 'pending',
      amount: (json['amount'] ?? 0).toDouble(),
      message: json['message'] ?? '',
      resultCode: json['resultCode'] ?? 0,
      paidAt: json['paidAt'] != null 
          ? DateTime.parse(json['paidAt']) 
          : null,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'orderId': orderId,
      'transactionId': transactionId,
      'status': status,
      'amount': amount,
      'message': message,
      'resultCode': resultCode,
      'paidAt': paidAt?.toIso8601String(),
    };
  }

  bool get isSuccess => status == 'success' || resultCode == 0;
  bool get isPending => status == 'pending';
  bool get isFailed => status == 'failed' || (resultCode != 0 && resultCode != null);
}
