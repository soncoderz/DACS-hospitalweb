import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import '../constants/app_constants.dart';

/// Service for securely storing and retrieving JWT tokens
class TokenStorageService {
  static final TokenStorageService _instance = TokenStorageService._internal();
  factory TokenStorageService() => _instance;
  TokenStorageService._internal();

  final FlutterSecureStorage _secureStorage = const FlutterSecureStorage(
    aOptions: AndroidOptions(
      encryptedSharedPreferences: true,
    ),
  );

  /// Save JWT token to secure storage
  Future<void> saveToken(String token) async {
    try {
      await _secureStorage.write(
        key: AppConstants.jwtTokenKey,
        value: token,
      );
    } catch (e) {
      throw Exception('Failed to save token: $e');
    }
  }

  /// Get JWT token from secure storage
  Future<String?> getToken() async {
    try {
      return await _secureStorage.read(key: AppConstants.jwtTokenKey);
    } catch (e) {
      throw Exception('Failed to get token: $e');
    }
  }

  /// Delete JWT token from secure storage
  Future<void> deleteToken() async {
    try {
      await _secureStorage.delete(key: AppConstants.jwtTokenKey);
    } catch (e) {
      throw Exception('Failed to delete token: $e');
    }
  }

  /// Check if token exists in secure storage
  Future<bool> hasToken() async {
    try {
      final token = await getToken();
      return token != null && token.isNotEmpty;
    } catch (e) {
      return false;
    }
  }

  /// Clear all data from secure storage
  Future<void> clearAll() async {
    try {
      await _secureStorage.deleteAll();
    } catch (e) {
      throw Exception('Failed to clear storage: $e');
    }
  }
}
