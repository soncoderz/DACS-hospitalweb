import 'package:dio/dio.dart';
import 'package:flutter/material.dart';
import '../constants/app_constants.dart';
import '../services/navigation_service.dart';
import '../services/token_storage_service.dart';

/// Interceptor to automatically add JWT token to request headers
class AuthInterceptor extends Interceptor {
  final TokenStorageService _tokenStorage = TokenStorageService();
  bool _isHandlingUnauthorized = false;

  @override
  void onRequest(
    RequestOptions options,
    RequestInterceptorHandler handler,
  ) async {
    // Get token from secure storage
    final token = await _tokenStorage.getToken();

    // Debug logging
    print('[AuthInterceptor] Request to: ${options.path}');
    print('[AuthInterceptor] Token exists: ${token != null && token.isNotEmpty}');
    if (token != null && token.isNotEmpty) {
      print('[AuthInterceptor] Token preview: ${token.substring(0, token.length > 20 ? 20 : token.length)}...');
    }

    // Add token to headers if it exists
    if (token != null && token.isNotEmpty) {
      options.headers['Authorization'] = 'Bearer $token';
    }

    handler.next(options);
  }

  @override
  void onError(DioException err, ErrorInterceptorHandler handler) async {
    final statusCode = err.response?.statusCode;
    if (statusCode == 401 && !_isHandlingUnauthorized) {
      _isHandlingUnauthorized = true;
      await _tokenStorage.clearAll();

      final context = NavigationService.context;
      final navigator = NavigationService.navigatorKey.currentState;

      // Notify user and force re-login
      if (context != null) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text(AppConstants.sessionExpiredMessage),
            duration: Duration(seconds: 3),
          ),
        );
      }
      navigator?.pushNamedAndRemoveUntil('/login', (route) => false);

      _isHandlingUnauthorized = false;
    }
    handler.next(err);
  }
}
