import 'package:dartz/dartz.dart';
import '../../core/errors/failures.dart';
import '../../data/models/momo_payment_model.dart';
import '../../data/models/payment_status_model.dart';
import '../../data/models/payment_history_model.dart';

/// Abstract payment repository interface - domain layer
abstract class PaymentRepository {
  Future<Either<Failure, MomoPaymentModel>> createMomoPayment({
    required String appointmentId,
    required double amount,
  });

  Future<Either<Failure, PaymentStatusModel>> checkPaymentStatus({
    required String orderId,
  });

  Future<Either<Failure, List<PaymentHistoryModel>>> getPaymentHistory();
}
