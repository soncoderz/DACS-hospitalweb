import 'package:dio/dio.dart';
import 'package:connectivity_plus/connectivity_plus.dart';
import '../constants/app_constants.dart';
import 'exceptions.dart';
import 'failures.dart';

/// Global error handler for converting exceptions to failures
class ErrorHandler {
  /// Convert DioException to appropriate Failure
  static Failure handleDioError(DioException error) {
    switch (error.type) {
      case DioExceptionType.connectionTimeout:
      case DioExceptionType.sendTimeout:
      case DioExceptionType.receiveTimeout:
        return const NetworkFailure('Kết nối bị timeout. Vui lòng thử lại.');

      case DioExceptionType.badResponse:
        return _handleResponseError(error.response);

      case DioExceptionType.cancel:
        return const UnknownFailure('Yêu cầu đã bị hủy');

      case DioExceptionType.connectionError:
        return const NetworkFailure(AppConstants.networkErrorMessage);

      case DioExceptionType.badCertificate:
        return const ServerFailure('Lỗi chứng chỉ bảo mật');

      case DioExceptionType.unknown:
      default:
        return const UnknownFailure(AppConstants.unknownErrorMessage);
    }
  }

  /// Handle HTTP response errors
  static Failure _handleResponseError(Response? response) {
    if (response == null) {
      return const ServerFailure(AppConstants.serverErrorMessage);
    }

    final statusCode = response.statusCode ?? 0;
    final data = response.data;

    // Extract error message from response
    String message = AppConstants.serverErrorMessage;
    if (data is Map<String, dynamic>) {
      message = data['message'] ?? data['error'] ?? message;
    }

    switch (statusCode) {
      case 400:
        return ValidationFailure(message);
      case 401:
        return AuthenticationFailure(
          message.isEmpty ? AppConstants.sessionExpiredMessage : message,
        );
      case 403:
        return const AuthenticationFailure('Bạn không có quyền truy cập');
      case 404:
        return ServerFailure('Không tìm thấy: $message');
      case 422:
        return ValidationFailure(message);
      case 500:
      case 502:
      case 503:
        return ServerFailure(message);
      default:
        return ServerFailure('Lỗi $statusCode: $message');
    }
  }

  /// Convert Exception to Failure
  static Failure handleException(Exception exception) {
    if (exception is DioException) {
      return handleDioError(exception);
    } else if (exception is ServerException) {
      return ServerFailure(exception.message);
    } else if (exception is NetworkException) {
      return NetworkFailure(exception.message);
    } else if (exception is AuthenticationException) {
      return AuthenticationFailure(exception.message);
    } else if (exception is ValidationException) {
      return ValidationFailure(exception.message);
    } else if (exception is CacheException) {
      return CacheFailure(exception.message);
    } else {
      return UnknownFailure(exception.toString());
    }
  }

  /// Check network connectivity
  static Future<bool> hasNetworkConnection() async {
    try {
      final connectivityResult = await Connectivity().checkConnectivity();
      return connectivityResult != ConnectivityResult.none;
    } catch (e) {
      return false;
    }
  }

  /// Get user-friendly error message from Failure
  static String getErrorMessage(Failure failure) {
    if (failure is NetworkFailure) {
      return failure.message;
    } else if (failure is ServerFailure) {
      return failure.message;
    } else if (failure is AuthenticationFailure) {
      return failure.message;
    } else if (failure is ValidationFailure) {
      return failure.message;
    } else if (failure is CacheFailure) {
      return failure.message;
    } else {
      return AppConstants.unknownErrorMessage;
    }
  }
}
