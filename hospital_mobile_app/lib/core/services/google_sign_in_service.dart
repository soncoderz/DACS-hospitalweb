import 'package:flutter/foundation.dart';
import 'package:flutter/services.dart';
import 'package:google_sign_in/google_sign_in.dart';

import '../constants/auth_constants.dart';

/// Service for Google Sign In
class GoogleSignInService {
  static final GoogleSignInService _instance = GoogleSignInService._internal();
  factory GoogleSignInService() => _instance;
  GoogleSignInService._internal();

  final GoogleSignIn _googleSignIn = GoogleSignIn(
    scopes: ['email', 'profile'],
    serverClientId: AuthConstants.googleWebClientId.isEmpty
        ? null
        : AuthConstants.googleWebClientId,
  );

  /// Sign in with Google
  Future<String?> signIn() async {
    try {
      // Sign out first to ensure clean state
      await _googleSignIn.signOut();

      if (AuthConstants.googleWebClientId.isEmpty) {
        debugPrint(
          'Google Sign In: GOOGLE_WEB_CLIENT_ID is missing. Pass it via --dart-define so ID tokens can be requested.',
        );
      }

      final GoogleSignInAccount? account = await _googleSignIn.signIn();
      if (account == null) {
        debugPrint('Google Sign In: User cancelled');
        return null;
      }

      final GoogleSignInAuthentication auth = await account.authentication;
      final idToken = auth.idToken;

      if (idToken == null || idToken.isEmpty) {
        debugPrint(
          'Google Sign In: ID Token is null/empty - check serverClientId and web client ID setup.',
        );
        throw Exception(
          'Google Sign In needs a valid ID token. Please check the web client ID configuration.',
        );
      }

      debugPrint('Google Sign In: Success');
      return idToken;
    } on PlatformException catch (e) {
      final message = e.message ?? '';
      if (message.contains('ApiException: 10')) {
        debugPrint(
          'Google Sign In: ApiException 10 (DEVELOPER_ERROR). Check SHA-1 fingerprints/package name and google-services.json.',
        );
        throw Exception(
          'Google Sign In misconfigured (code 10). Add the SHA-1 for the signing key to the Google console/Firebase and download the updated google-services.json.',
        );
      }

      debugPrint('Google Sign In PlatformException: ${e.message}');
      throw Exception('Google Sign In failed: ${e.code} ${e.message}');
    } catch (e) {
      debugPrint('Google Sign In Error: $e');
      throw Exception('Dang nhap Google that bai: ${e.toString()}');
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
