import 'package:flutter/foundation.dart';
import '../../core/errors/error_handler.dart';
import '../../core/services/token_storage_service.dart';
import '../../domain/entities/user.dart';
import '../../domain/repositories/auth_repository.dart';

/// Auth provider for state management
class AuthProvider extends ChangeNotifier {
  final AuthRepository _authRepository;
  final TokenStorageService _tokenStorage;

  AuthProvider(this._authRepository, this._tokenStorage);

  // State
  User? _user;
  bool _isAuthenticated = false;
  bool _isLoading = false;
  String? _errorMessage;

  // Getters
  User? get user => _user;
  bool get isAuthenticated => _isAuthenticated;
  bool get isLoading => _isLoading;
  String? get errorMessage => _errorMessage;

  /// Set loading state
  void _setLoading(bool value) {
    _isLoading = value;
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

  /// Register new user
  Future<bool> register({
    required String email,
    required String password,
    required String fullName,
    String? phone,
  }) async {
    _setLoading(true);
    _setError(null);

    final result = await _authRepository.register(
      email: email,
      password: password,
      fullName: fullName,
      phone: phone,
    );

    return result.fold(
      (failure) {
        _setError(ErrorHandler.getErrorMessage(failure));
        _setLoading(false);
        return false;
      },
      (user) {
        _user = user;
        _isAuthenticated = true;
        _setLoading(false);
        return true;
      },
    );
  }

  /// Login user
  Future<bool> login({
    required String email,
    required String password,
  }) async {
    _setLoading(true);
    _setError(null);

    final result = await _authRepository.login(
      email: email,
      password: password,
    );

    return result.fold(
      (failure) {
        _setError(ErrorHandler.getErrorMessage(failure));
        _setLoading(false);
        return false;
      },
      (user) {
        _user = user;
        _isAuthenticated = true;
        _setLoading(false);
        return true;
      },
    );
  }

  /// Google Sign In
  Future<bool> googleSignIn(String idToken) async {
    _setLoading(true);
    _setError(null);

    final result = await _authRepository.googleLogin(idToken: idToken);

    return result.fold(
      (failure) {
        _setError(ErrorHandler.getErrorMessage(failure));
        _setLoading(false);
        return false;
      },
      (user) {
        _user = user;
        _isAuthenticated = true;
        _setLoading(false);
        return true;
      },
    );
  }

  /// Forgot password - send OTP
  Future<bool> forgotPassword(String email) async {
    _setLoading(true);
    _setError(null);

    final result = await _authRepository.forgotPassword(email: email);

    return result.fold(
      (failure) {
        _setError(ErrorHandler.getErrorMessage(failure));
        _setLoading(false);
        return false;
      },
      (_) {
        _setLoading(false);
        return true;
      },
    );
  }

  /// Verify OTP
  Future<bool> verifyOtp({
    required String email,
    required String otp,
  }) async {
    _setLoading(true);
    _setError(null);

    final result = await _authRepository.verifyOtp(
      email: email,
      otp: otp,
    );

    return result.fold(
      (failure) {
        _setError(ErrorHandler.getErrorMessage(failure));
        _setLoading(false);
        return false;
      },
      (_) {
        _setLoading(false);
        return true;
      },
    );
  }

  /// Reset password
  Future<bool> resetPassword({
    required String email,
    required String otp,
    required String newPassword,
  }) async {
    _setLoading(true);
    _setError(null);

    final result = await _authRepository.resetPassword(
      email: email,
      otp: otp,
      newPassword: newPassword,
    );

    return result.fold(
      (failure) {
        _setError(ErrorHandler.getErrorMessage(failure));
        _setLoading(false);
        return false;
      },
      (_) {
        _setLoading(false);
        return true;
      },
    );
  }

  /// Check authentication status
  Future<void> checkAuthStatus() async {
    _setLoading(true);

    // Check if token exists
    final hasToken = await _tokenStorage.hasToken();

    if (!hasToken) {
      _isAuthenticated = false;
      _user = null;
      _setLoading(false);
      return;
    }

    // Validate token by getting current user
    final result = await _authRepository.getCurrentUser();

    result.fold(
      (failure) {
        _isAuthenticated = false;
        _user = null;
        _setLoading(false);
      },
      (user) {
        _user = user;
        _isAuthenticated = true;
        _setLoading(false);
      },
    );
  }

  /// Logout user
  Future<void> logout() async {
    _setLoading(true);

    await _authRepository.logout();

    _user = null;
    _isAuthenticated = false;
    _setLoading(false);
  }

  /// Update user profile (for future use)
  void updateUser(User user) {
    _user = user;
    notifyListeners();
  }
}
