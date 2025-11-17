import 'package:google_sign_in/google_sign_in.dart';
import 'package:flutter/foundation.dart';

/// Service for Google Sign In
class GoogleSignInService {
  static final GoogleSignInService _instance = GoogleSignInService._internal();
  factory GoogleSignInService() => _instance;
  GoogleSignInService._internal();

  final GoogleSignIn _googleSignIn = GoogleSignIn(
    scopes: ['email', 'profile'],
  );

  /// Sign in with Google
  Future<String?> signIn() async {
    try {
      // Sign out first to ensure clean state
      await _googleSignIn.signOut();
      
      final GoogleSignInAccount? account = await _googleSignIn.signIn();
      if (account == null) {
        debugPrint('Google Sign In: User cancelled');
        return null;
      }

      final GoogleSignInAuthentication auth = await account.authentication;
      
      if (auth.idToken == null) {
        debugPrint('Google Sign In: ID Token is null');
        throw Exception('Không thể lấy ID Token từ Google');
      }
      
      debugPrint('Google Sign In: Success');
      return auth.idToken;
    } catch (e) {
      debugPrint('Google Sign In Error: $e');
      throw Exception('Đăng nhập Google thất bại: ${e.toString()}');
    }
  }

  /// Sign out from Google
  Future<void> signOut() async {
    try {
      await _googleSignIn.signOut();
      debugPrint('Google Sign Out: Success');
    } catch (e) {
      debugPrint('Google Sign Out Error: $e');
    }
  }

  /// Check if user is signed in
  Future<bool> isSignedIn() async {
    try {
      final isSignedIn = await _googleSignIn.isSignedIn();
      debugPrint('Google Is Signed In: $isSignedIn');
      return isSignedIn;
    } catch (e) {
      debugPrint('Google isSignedIn Error: $e');
      return false;
    }
  }

  /// Disconnect from Google
  Future<void> disconnect() async {
    try {
      await _googleSignIn.disconnect();
      debugPrint('Google Disconnect: Success');
    } catch (e) {
      debugPrint('Google Disconnect Error: $e');
    }
  }
}
