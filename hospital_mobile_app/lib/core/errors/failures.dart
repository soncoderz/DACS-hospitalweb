import 'package:equatable/equatable.dart';

/// Abstract base class for all failures
abstract class Failure extends Equatable {
  final String message;

  const Failure(this.message);

  @override
  List<Object> get props => [message];
}

/// Server failure - when API returns an error
class ServerFailure extends Failure {
  const ServerFailure(super.message);
}

/// Network failure - when there's no internet connection
class NetworkFailure extends Failure {
  const NetworkFailure(super.message);
}

/// Authentication failure - when auth token is invalid or expired
class AuthenticationFailure extends Failure {
  const AuthenticationFailure(super.message);
}

/// Validation failure - when input validation fails
class ValidationFailure extends Failure {
  const ValidationFailure(super.message);
}

/// Cache failure - when local cache operations fail
class CacheFailure extends Failure {
  const CacheFailure(super.message);
}

/// Unknown failure - for unexpected errors
class UnknownFailure extends Failure {
  const UnknownFailure(super.message);
}
