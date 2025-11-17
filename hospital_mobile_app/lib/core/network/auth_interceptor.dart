import 'package:dio/dio.dart';
import '../services/token_storage_service.dart';

/// Interceptor to automatically add JWT token to request headers
class AuthInterceptor extends Interceptor {
  final TokenStorageService _tokenStorage = TokenStorageService();

  @override
  void onRequest(
    RequestOptions options,
    RequestInterceptorHandler handler,
  ) async {
    // Get token from secure storage
    final token = await _tokenStorage.getToken();

    // Add token to headers if it exists
    if (token != null && token.isNotEmpty) {
      options.headers['Authorization'] = 'Bearer $token';
    }

    handler.next(options);
  }

  @override
  void onError(DioException err, ErrorInterceptorHandler handler) async {
    // Handle 401 Unauthorized - token expired or invalid
    if (err.response?.statusCode == 401) {
      // Clear token
      await _tokenStorage.deleteToken();
      // You can also trigger a logout event here if needed
    }

    handler.next(err);
  }
}
