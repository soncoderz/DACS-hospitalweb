import '../../core/network/dio_client.dart';
import '../../core/constants/api_constants.dart';
import '../../core/errors/exceptions.dart';
import '../models/momo_payment_model.dart';
import '../models/payment_status_model.dart';
import '../models/payment_history_model.dart';

/// Abstract interface for payment remote data source
abstract class PaymentRemoteDataSource {
  Future<MomoPaymentModel> createMomoPayment(String appointmentId, double amount);
  Future<PaymentStatusModel> checkPaymentStatus(String orderId);
  Future<List<PaymentHistoryModel>> getPaymentHistory();
}

/// Implementation of payment remote data source
class PaymentRemoteDataSourceImpl implements PaymentRemoteDataSource {
  final DioClient _dioClient;

  PaymentRemoteDataSourceImpl(this._dioClient);

  @override
  Future<MomoPaymentModel> createMomoPayment(String appointmentId, double amount) async {
    try {
      final response = await _dioClient.post(
        ApiConstants.createMomoPayment,
        data: {
          'appointmentId': appointmentId,
          'amount': amount,
        },
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
}
