class MomoPaymentModel {
  final String orderId;
  final String requestId;
  final String payUrl;
  final String deeplink;
  final String qrCodeUrl;
  final String message;
  final int resultCode;

  MomoPaymentModel({
    required this.orderId,
    required this.requestId,
    required this.payUrl,
    required this.deeplink,
    required this.qrCodeUrl,
    required this.message,
    required this.resultCode,
  });

  factory MomoPaymentModel.fromJson(Map<String, dynamic> json) {
    return MomoPaymentModel(
      orderId: json['orderId'] ?? '',
      requestId: json['requestId'] ?? '',
      payUrl: json['payUrl'] ?? '',
      deeplink: json['deeplink'] ?? json['deepLink'] ?? '',
      qrCodeUrl: json['qrCodeUrl'] ?? '',
      message: json['message'] ?? '',
      resultCode: json['resultCode'] ?? 0,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'orderId': orderId,
      'requestId': requestId,
      'payUrl': payUrl,
      'deeplink': deeplink,
      'qrCodeUrl': qrCodeUrl,
      'message': message,
      'resultCode': resultCode,
    };
  }
}
