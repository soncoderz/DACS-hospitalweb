import 'package:flutter/foundation.dart';
import '../../core/errors/error_handler.dart';
import '../../domain/repositories/payment_repository.dart';
import '../../data/models/momo_payment_model.dart';
import '../../data/models/payment_status_model.dart';
import '../../data/models/payment_history_model.dart';

/// Payment provider for state management
class PaymentProvider extends ChangeNotifier {
  final PaymentRepository _paymentRepository;

  PaymentProvider(this._paymentRepository);

  // State
  MomoPaymentModel? _currentPayment;
  PaymentStatusModel? _paymentStatus;
  List<PaymentHistoryModel> _paymentHistory = [];
  bool _isLoading = false;
  bool _isCheckingStatus = false;
  String? _errorMessage;

  // Getters
  MomoPaymentModel? get currentPayment => _currentPayment;
  PaymentStatusModel? get paymentStatus => _paymentStatus;
  List<PaymentHistoryModel> get paymentHistory => _paymentHistory;
  bool get isLoading => _isLoading;
  bool get isCheckingStatus => _isCheckingStatus;
  String? get errorMessage => _errorMessage;

  /// Set loading state
  void _setLoading(bool value) {
    _isLoading = value;
    notifyListeners();
  }

  /// Set checking status state
  void _setCheckingStatus(bool value) {
    _isCheckingStatus = value;
    notifyListeners();
  }

  /// Set error message
  void _setError(String? message) {
    _errorMessage = message;
    notifyListeners();
  }

  /// Clear error message
  void clearError() {
    _errorMessage = null;
    notifyListeners();
  }

  /// Clear current payment
  void clearCurrentPayment() {
    _currentPayment = null;
    _paymentStatus = null;
    notifyListeners();
  }

  /// Create MoMo payment
  Future<bool> createMomoPayment({
    required String appointmentId,
    required double amount,
  }) async {
    _setLoading(true);
    _setError(null);

    final result = await _paymentRepository.createMomoPayment(
      appointmentId: appointmentId,
      amount: amount,
    );

    return result.fold(
      (failure) {
        _setError(ErrorHandler.getErrorMessage(failure));
        _setLoading(false);
        return false;
      },
      (payment) {
        _currentPayment = payment;
        _setLoading(false);
        return true;
      },
    );
  }

  /// Check payment status
  Future<bool> checkPaymentStatus(String orderId) async {
    _setCheckingStatus(true);
    _setError(null);

    final result = await _paymentRepository.checkPaymentStatus(
      orderId: orderId,
    );

    return result.fold(
      (failure) {
        _setError(ErrorHandler.getErrorMessage(failure));
        _setCheckingStatus(false);
        return false;
      },
      (status) {
        _paymentStatus = status;
        _setCheckingStatus(false);
        return true;
      },
    );
  }

  /// Get payment history
  Future<bool> fetchPaymentHistory() async {
    _setLoading(true);
    _setError(null);

    final result = await _paymentRepository.getPaymentHistory();

    return result.fold(
      (failure) {
        _setError(ErrorHandler.getErrorMessage(failure));
        _setLoading(false);
        return false;
      },
      (history) {
        _paymentHistory = history;
        _setLoading(false);
        return true;
      },
    );
  }

  /// Poll payment status (for checking payment completion)
  Future<PaymentStatusModel?> pollPaymentStatus({
    required String orderId,
    int maxAttempts = 30,
    Duration interval = const Duration(seconds: 2),
  }) async {
    for (int i = 0; i < maxAttempts; i++) {
      final success = await checkPaymentStatus(orderId);
      
      if (success && _paymentStatus != null) {
        // Check if payment is completed (success or failed)
        if (_paymentStatus!.isSuccess || _paymentStatus!.isFailed) {
          return _paymentStatus;
        }
      }

      // Wait before next attempt
      await Future.delayed(interval);
    }

    // Timeout
    _setError('Không thể xác nhận trạng thái thanh toán. Vui lòng kiểm tra lại sau.');
    return null;
  }

  /// Refresh payment history
  Future<void> refreshPaymentHistory() async {
    await fetchPaymentHistory();
  }
}
