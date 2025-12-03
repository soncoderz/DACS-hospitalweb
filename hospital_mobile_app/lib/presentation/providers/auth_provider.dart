import 'dart:convert';
import 'dart:io';
import 'package:flutter/foundation.dart';
import '../../core/errors/error_handler.dart';
import '../../core/errors/failures.dart';
import '../../core/services/token_storage_service.dart';
import '../../domain/entities/user.dart';
import '../../domain/repositories/auth_repository.dart';
import '../../data/models/user_model.dart';

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

  /// Verify Email
  Future<bool> verifyEmail({
    required String token,
  }) async {
    _setLoading(true);
    _setError(null);

    final result = await _authRepository.verifyEmail(token: token);

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

  /// Resend Verification Email
  Future<bool> resendVerification({
    required String email,
  }) async {
    _setLoading(true);
    _setError(null);

    final result = await _authRepository.resendVerification(email: email);

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

    print('[AuthProvider] Checking auth status...');
    
    // Check if token exists
    final token = await _tokenStorage.getToken();
    final hasToken = token != null && token.isNotEmpty;
    print('[AuthProvider] Has token: $hasToken');

    if (!hasToken) {
      print('[AuthProvider] No token found, user not authenticated');
      _isAuthenticated = false;
      _user = null;
      _setLoading(false);
      return;
    }

    // Try to load cached user to avoid forcing re-login on app restart
    try {
      final cachedUserJson = await _tokenStorage.getUserData();
      if (cachedUserJson != null && cachedUserJson.isNotEmpty) {
        final Map<String, dynamic> userMap = jsonDecode(cachedUserJson) as Map<String, dynamic>;
        _user = UserModel.fromJson(userMap).toEntity();
        _isAuthenticated = true;
        print('[AuthProvider] Loaded cached user: ${_user?.email}');
      }
    } catch (e) {
      print('[AuthProvider] Failed to load cached user: $e');
    }

    print('[AuthProvider] Token found, validating with server...');
    // Validate token by getting current user
    final result = await _authRepository.getCurrentUser();

    result.fold(
      (failure) {
        print('[AuthProvider] Token validation failed: ${failure.toString()}');
        final isAuthFailure = failure is AuthenticationFailure;
        if (isAuthFailure) {
          _isAuthenticated = false;
          _user = null;
          _tokenStorage.deleteToken();
          _tokenStorage.deleteUserData();
        } else {
          // Keep user authenticated if we have a token and cached user (network/server errors)
          _isAuthenticated = _user != null;
        }
        _isLoading = false;
        notifyListeners();
      },
      (user) {
        print('[AuthProvider] Token valid, user authenticated: ${user.email}');
        _user = user;
        _isAuthenticated = true;
        // Refresh cached user
        try {
          final userModel = UserModel.fromEntity(user);
          _tokenStorage.saveUserData(userModel.toJson());
        } catch (_) {}
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

  /// Update user profile
  Future<bool> updateProfile({
    required String fullName,
    String? phoneNumber,
    String? address,
    String? gender,
    String? dateOfBirth,
  }) async {
    _setLoading(true);
    _setError(null);

    final result = await _authRepository.updateProfile(
      fullName: fullName,
      phoneNumber: phoneNumber,
      address: address,
      gender: gender,
      dateOfBirth: dateOfBirth,
    );

    return result.fold(
      (failure) {
        _setError(ErrorHandler.getErrorMessage(failure));
        _setLoading(false);
        return false;
      },
      (user) {
        _user = user;
        _setLoading(false);
        return true;
      },
    );
  }

  /// Change password
  Future<bool> changePassword({
    required String currentPassword,
    required String newPassword,
  }) async {
    _setLoading(true);
    _setError(null);

    final result = await _authRepository.changePassword(
      currentPassword: currentPassword,
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

  /// Upload avatar
  Future<bool> uploadAvatar(File file) async {
    _setLoading(true);
    _setError(null);

    final result = await _authRepository.uploadAvatar(file.path);

    return result.fold(
      (failure) {
        _setError(ErrorHandler.getErrorMessage(failure));
        _setLoading(false);
        return false;
      },
      (user) {
        _user = user;
        _setLoading(false);
        return true;
      },
    );
  }
}

