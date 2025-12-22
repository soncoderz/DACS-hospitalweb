import 'package:flutter/foundation.dart';
import 'package:flutter_facebook_auth/flutter_facebook_auth.dart';

/// Service for Facebook Sign In
class FacebookSignInService {
  static final FacebookSignInService _instance = FacebookSignInService._internal();
  factory FacebookSignInService() => _instance;
  FacebookSignInService._internal();

  /// Sign in with Facebook
  /// Returns a map with accessToken and userID if successful
  Future<Map<String, String>?> signIn() async {
    try {
      // Sign out first to ensure clean state
      await FacebookAuth.instance.logOut();

      // Request login with email permission
      final LoginResult result = await FacebookAuth.instance.login(
        permissions: ['email', 'public_profile'],
      );

      if (result.status == LoginStatus.cancelled) {
        debugPrint('Facebook Sign In: User cancelled');
        return null;
      }

      if (result.status == LoginStatus.failed) {
        debugPrint('Facebook Sign In: Failed - ${result.message}');
        throw Exception('Facebook Sign In failed: ${result.message}');
      }

      if (result.status != LoginStatus.success || result.accessToken == null) {
        debugPrint('Facebook Sign In: No access token received');
        throw Exception('Facebook Sign In failed: No access token');
      }

      final accessToken = result.accessToken!;
      
      // Get user data to retrieve userID
      final userData = await FacebookAuth.instance.getUserData();
      final userID = userData['id'] as String?;

      if (userID == null) {
        debugPrint('Facebook Sign In: No user ID received');
        throw Exception('Facebook Sign In failed: No user ID');
      }

      debugPrint('Facebook Sign In: Success');
      return {
        'accessToken': accessToken.tokenString,
        'userID': userID,
      };
    } catch (e) {
      debugPrint('Facebook Sign In Error: $e');
      throw Exception('Đăng nhập Facebook thất bại: ${e.toString()}');
    }
  }

  /// Sign out from Facebook
  Future<void> signOut() async {
    try {
      await FacebookAuth.instance.logOut();
      debugPrint('Facebook Sign Out: Success');
    } catch (e) {
      debugPrint('Facebook Sign Out Error: $e');
    }
  }

  /// Check if user is signed in
  Future<bool> isSignedIn() async {
    try {
      final accessToken = await FacebookAuth.instance.accessToken;
      final isSignedIn = accessToken != null;
      debugPrint('Facebook Is Signed In: $isSignedIn');
      return isSignedIn;
    } catch (e) {
      debugPrint('Facebook isSignedIn Error: $e');
      return false;
    }
  }
}
