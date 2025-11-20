import 'package:flutter/foundation.dart';
import '../../data/datasources/payment_remote_data_source.dart';
import '../../domain/entities/bill.dart';

class BillingProvider with ChangeNotifier {
  final PaymentRemoteDataSource _paymentDataSource;

  BillingProvider(this._paymentDataSource);

  Bill? _bill;
  bool _isLoading = false;
  String? _errorMessage;

  Bill? get bill => _bill;
  bool get isLoading => _isLoading;
  String? get errorMessage => _errorMessage;

  Future<void> fetchBill(String appointmentId) async {
    _isLoading = true;
    _errorMessage = null;
    notifyListeners();

    try {
      _bill = await _paymentDataSource.getBill(appointmentId);
      _errorMessage = null;
    } catch (e) {
      _errorMessage = e.toString();
      debugPrint('Error fetching bill: $e');
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  Future<dynamic> createMomoPayment(
    String appointmentId,
    double amount,
    String billType, {
    String? prescriptionId,
  }) async {
    _isLoading = true;
    _errorMessage = null;
    notifyListeners();

    try {
      final momoPayment = await _paymentDataSource.createMomoPayment(
        appointmentId,
        amount,
        billType,
        prescriptionId: prescriptionId,
      );
      return momoPayment;
    } catch (e) {
      _errorMessage = e.toString();
      debugPrint('Error creating MoMo payment: $e');
      return null;
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  Future<bool> payConsultation(String appointmentId, String paymentMethod) async {
    _isLoading = true;
    _errorMessage = null;
    notifyListeners();

    try {
      if (paymentMethod == 'momo') {
        // Return false to indicate that payment needs to be handled separately
        // The UI will navigate to MomoPaymentScreen
        return false;
      } else if (paymentMethod == 'paypal') {
        // TODO: Implement PayPal payment
        _errorMessage = 'Thanh toán PayPal chưa được triển khai';
        return false;
      } else {
        // Cash payment
        await _paymentDataSource.payConsultation(appointmentId, paymentMethod);
        await fetchBill(appointmentId);
        return true;
      }
    } catch (e) {
      _errorMessage = e.toString();
      debugPrint('Error paying consultation: $e');
      return false;
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  Future<bool> payHospitalization(String appointmentId, String paymentMethod) async {
    _isLoading = true;
    _errorMessage = null;
    notifyListeners();

    try {
      if (paymentMethod == 'momo') {
        final momoPayment = await _paymentDataSource.createMomoPayment(
          appointmentId,
          _bill!.hospitalizationAmount,
          'hospitalization',
        );
        // TODO: Open MoMo payment URL
        return true;
      } else if (paymentMethod == 'paypal') {
        // TODO: Implement PayPal payment
        _errorMessage = 'Thanh toán PayPal chưa được triển khai';
        return false;
      } else {
        // Cash payment
        await _paymentDataSource.payHospitalization(appointmentId, paymentMethod);
        await fetchBill(appointmentId);
        return true;
      }
    } catch (e) {
      _errorMessage = e.toString();
      debugPrint('Error paying hospitalization: $e');
      return false;
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  Future<bool> payPrescription(String prescriptionId, String paymentMethod) async {
    _isLoading = true;
    _errorMessage = null;
    notifyListeners();

    try {
      if (paymentMethod == 'momo') {
        // Find prescription amount
        final prescription = _bill!.prescriptions.firstWhere(
          (p) => p.id == prescriptionId,
        );
        final momoPayment = await _paymentDataSource.createMomoPayment(
          _bill!.appointmentId,
          prescription.amount,
          'medication',
          prescriptionId: prescriptionId,
        );
        // TODO: Open MoMo payment URL
        return true;
      } else if (paymentMethod == 'paypal') {
        // TODO: Implement PayPal payment
        _errorMessage = 'Thanh toán PayPal chưa được triển khai';
        return false;
      } else {
        // Cash payment
        await _paymentDataSource.payPrescription(prescriptionId, paymentMethod);
        await fetchBill(_bill!.appointmentId);
        return true;
      }
    } catch (e) {
      _errorMessage = e.toString();
      debugPrint('Error paying prescription: $e');
      return false;
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  void clearBill() {
    _bill = null;
    _errorMessage = null;
    notifyListeners();
  }
}
