import '../../core/network/dio_client.dart';
import '../../core/constants/api_constants.dart';
import '../../core/errors/exceptions.dart';
import '../models/momo_payment_model.dart';
import '../models/payment_status_model.dart';
import '../models/payment_history_model.dart';
import '../models/bill_model.dart';

/// Abstract interface for payment remote data source
abstract class PaymentRemoteDataSource {
  Future<MomoPaymentModel> createMomoPayment(
    String appointmentId,
    double amount,
    String billType, {
    String? prescriptionId,
  });
  Future<PaymentStatusModel> checkPaymentStatus(String orderId);
  Future<List<PaymentHistoryModel>> getPaymentHistory();
  Future<BillModel> getBill(String appointmentId);
  Future<void> payConsultation(String appointmentId, String paymentMethod);
  Future<void> payHospitalization(String appointmentId, String paymentMethod);
  Future<void> payPrescription(String prescriptionId, String paymentMethod);
}

/// Implementation of payment remote data source
class PaymentRemoteDataSourceImpl implements PaymentRemoteDataSource {
  final DioClient _dioClient;

  PaymentRemoteDataSourceImpl(this._dioClient);

  @override
  Future<MomoPaymentModel> createMomoPayment(
    String appointmentId,
    double amount,
    String billType, {
    String? prescriptionId,
  }) async {
    try {
      final data = {
        'appointmentId': appointmentId,
        'amount': amount,
        'billType': billType,
        // Send a reachable redirect URL so MoMo does not bounce to localhost on mobile
        'redirectUrl': ApiConstants.momoRedirectUrl,
      };
      
      if (prescriptionId != null) {
        data['prescriptionId'] = prescriptionId;
      }

      final response = await _dioClient.post(
        ApiConstants.createMomoPayment,
        data: data,
      );

      if (response.statusCode == 200 || response.statusCode == 201) {
        return MomoPaymentModel.fromJson(response.data);
      } else {
        throw ServerException(
          response.data['message'] ?? 'Tạo thanh toán MoMo thất bại',
          response.statusCode,
        );
      }
    } catch (e) {
      if (e is ServerException) rethrow;
      throw ServerException('Tạo thanh toán MoMo thất bại: ${e.toString()}');
    }
  }

  @override
  Future<PaymentStatusModel> checkPaymentStatus(String orderId) async {
    try {
      final response = await _dioClient.get(
        '${ApiConstants.checkPaymentStatus}/$orderId',
      );

      if (response.statusCode == 200) {
        return PaymentStatusModel.fromJson(response.data);
      } else {
        throw ServerException(
          response.data['message'] ?? 'Kiểm tra trạng thái thanh toán thất bại',
          response.statusCode,
        );
      }
    } catch (e) {
      if (e is ServerException) rethrow;
      throw ServerException('Kiểm tra trạng thái thanh toán thất bại: ${e.toString()}');
    }
  }

  @override
  Future<List<PaymentHistoryModel>> getPaymentHistory() async {
    try {
      final response = await _dioClient.get(ApiConstants.paymentHistory);

      if (response.statusCode == 200) {
        final List<dynamic> data = response.data['payments'] ?? response.data;
        return data.map((json) => PaymentHistoryModel.fromJson(json)).toList();
      } else {
        throw ServerException(
          response.data['message'] ?? 'Lấy lịch sử thanh toán thất bại',
          response.statusCode,
        );
      }
    } catch (e) {
      if (e is ServerException) rethrow;
      throw ServerException('Lấy lịch sử thanh toán thất bại: ${e.toString()}');
    }
  }

  @override
  Future<BillModel> getBill(String appointmentId) async {
    try {
      final response = await _dioClient.get(
        ApiConstants.billingByAppointment(appointmentId),
      );

      if (response.statusCode == 200) {
        final data = response.data['data'] ?? response.data;
        return BillModel.fromJson(data);
      } else {
        throw ServerException(
          response.data['message'] ?? 'Lấy thông tin hóa đơn thất bại',
          response.statusCode,
        );
      }
    } catch (e) {
      if (e is ServerException) rethrow;
      throw ServerException('Lấy thông tin hóa đơn thất bại: ${e.toString()}');
    }
  }

  @override
  Future<void> payConsultation(String appointmentId, String paymentMethod) async {
    try {
      final response = await _dioClient.post(
        ApiConstants.payConsultation,
        data: {
          'appointmentId': appointmentId,
          'paymentMethod': paymentMethod,
          'transactionId': 'CONS-${DateTime.now().millisecondsSinceEpoch}',
          'paymentDetails': {
            'method': paymentMethod,
            'timestamp': DateTime.now().toIso8601String(),
          },
        },
      );

      if (response.statusCode != 200 && response.statusCode != 201) {
        throw ServerException(
          response.data['message'] ?? 'Thanh toán phí khám thất bại',
          response.statusCode,
        );
      }
    } catch (e) {
      if (e is ServerException) rethrow;
      throw ServerException('Thanh toán phí khám thất bại: ${e.toString()}');
    }
  }

  @override
  Future<void> payHospitalization(String appointmentId, String paymentMethod) async {
    try {
      final response = await _dioClient.post(
        ApiConstants.payHospitalization,
        data: {
          'appointmentId': appointmentId,
          'paymentMethod': paymentMethod,
          'transactionId': 'HOSP-${DateTime.now().millisecondsSinceEpoch}',
          'paymentDetails': {
            'method': paymentMethod,
            'timestamp': DateTime.now().toIso8601String(),
          },
        },
      );

      if (response.statusCode != 200 && response.statusCode != 201) {
        throw ServerException(
          response.data['message'] ?? 'Thanh toán phí nội trú thất bại',
          response.statusCode,
        );
      }
    } catch (e) {
      if (e is ServerException) rethrow;
      throw ServerException('Thanh toán phí nội trú thất bại: ${e.toString()}');
    }
  }

  @override
  Future<void> payPrescription(String prescriptionId, String paymentMethod) async {
    try {
      final response = await _dioClient.post(
        ApiConstants.payPrescription,
        data: {
          'prescriptionId': prescriptionId,
          'paymentMethod': paymentMethod,
          'transactionId': 'PRES-${DateTime.now().millisecondsSinceEpoch}',
          'paymentDetails': {
            'method': paymentMethod,
            'timestamp': DateTime.now().toIso8601String(),
          },
        },
      );

      if (response.statusCode != 200 && response.statusCode != 201) {
        throw ServerException(
          response.data['message'] ?? 'Thanh toán đơn thuốc thất bại',
          response.statusCode,
        );
      }
    } catch (e) {
      if (e is ServerException) rethrow;
      throw ServerException('Thanh toán đơn thuốc thất bại: ${e.toString()}');
    }
  }
}
