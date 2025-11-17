import 'package:dio/dio.dart';
import 'dart:developer' as developer;

/// Custom log interceptor for debugging network requests
class CustomLogInterceptor extends Interceptor {
  @override
  void onRequest(RequestOptions options, RequestInterceptorHandler handler) {
    developer.log(
      '🌐 REQUEST[${options.method}] => PATH: ${options.path}',
      name: 'DioClient',
    );
    developer.log(
      '📤 Headers: ${options.headers}',
      name: 'DioClient',
    );
    if (options.data != null) {
      developer.log(
        '📦 Data: ${options.data}',
        name: 'DioClient',
      );
    }
    if (options.queryParameters.isNotEmpty) {
      developer.log(
        '🔍 Query: ${options.queryParameters}',
        name: 'DioClient',
      );
    }
    handler.next(options);
  }

  @override
  void onResponse(Response response, ResponseInterceptorHandler handler) {
    developer.log(
      '✅ RESPONSE[${response.statusCode}] => PATH: ${response.requestOptions.path}',
      name: 'DioClient',
    );
    developer.log(
      '📥 Data: ${response.data}',
      name: 'DioClient',
    );
    handler.next(response);
  }

  @override
  void onError(DioException err, ErrorInterceptorHandler handler) {
    developer.log(
      '❌ ERROR[${err.response?.statusCode}] => PATH: ${err.requestOptions.path}',
      name: 'DioClient',
    );
    developer.log(
      '💥 Message: ${err.message}',
      name: 'DioClient',
    );
    if (err.response?.data != null) {
      developer.log(
        '📛 Error Data: ${err.response?.data}',
        name: 'DioClient',
      );
    }
    handler.next(err);
  }
}
