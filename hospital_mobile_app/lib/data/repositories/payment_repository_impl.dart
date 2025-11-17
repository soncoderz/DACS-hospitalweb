import 'package:dartz/dartz.dart';
import '../../core/errors/failures.dart';
import '../../core/errors/error_handler.dart';
import '../../domain/repositories/payment_repository.dart';
import '../datasources/payment_remote_data_source.dart';
import '../models/momo_payment_model.dart';
import '../models/payment_status_model.dart';
import '../models/payment_history_model.dart';

/// Implementation of payment repository - data layer
class PaymentRepositoryImpl implements PaymentRepository {
  final PaymentRemoteDataSource _remoteDataSource;

  PaymentRepositoryImpl(this._remoteDataSource);

  @override
  Future<Either<Failure, MomoPaymentModel>> createMomoPayment({
    required String appointmentId,
    required double amount,
  }) async {
    try {
      // Check network connectivity
      final hasConnection = await ErrorHandler.hasNetworkConnection();
      if (!hasConnection) {
        return const Left(NetworkFailure('Không có kết nối internet'));
      }

      final paymentModel = await _remoteDataSource.createMomoPayment(
        appointmentId,
        amount,
      );

      return Right(paymentModel);
    } catch (e) {
      return Left(ErrorHandler.handleException(e as Exception));
    }
  }

  @override
  Future<Either<Failure, PaymentStatusModel>> checkPaymentStatus({
    required String orderId,
  }) async {
    try {
      // Check network connectivity
      final hasConnection = await ErrorHandler.hasNetworkConnection();
      if (!hasConnection) {
        return const Left(NetworkFailure('Không có kết nối internet'));
      }

      final statusModel = await _remoteDataSource.checkPaymentStatus(orderId);

      return Right(statusModel);
    } catch (e) {
      return Left(ErrorHandler.handleException(e as Exception));
    }
  }

  @override
  Future<Either<Failure, List<PaymentHistoryModel>>> getPaymentHistory() async {
    try {
      // Check network connectivity
      final hasConnection = await ErrorHandler.hasNetworkConnection();
      if (!hasConnection) {
        return const Left(NetworkFailure('Không có kết nối internet'));
      }

      final historyList = await _remoteDataSource.getPaymentHistory();

      return Right(historyList);
    } catch (e) {
      return Left(ErrorHandler.handleException(e as Exception));
    }
  }
}
