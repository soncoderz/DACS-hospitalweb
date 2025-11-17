/// Base exception class
class AppException implements Exception {
  final String message;
  final int? statusCode;

  AppException(this.message, [this.statusCode]);

  @override
  String toString() => message;
}

/// Server exception - thrown when API returns an error
class ServerException extends AppException {
  ServerException(super.message, [super.statusCode]);
}

/// Network exception - thrown when there's no internet connection
class NetworkException extends AppException {
  NetworkException(super.message);
}

/// Authentication exception - thrown when auth fails
class AuthenticationException extends AppException {
  AuthenticationException(super.message, [super.statusCode]);
}

/// Validation exception - thrown when validation fails
class ValidationException extends AppException {
  ValidationException(super.message);
}

/// Cache exception - thrown when cache operations fail
class CacheException extends AppException {
  CacheException(super.message);
}
