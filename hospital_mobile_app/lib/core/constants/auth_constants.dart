/// Auth-related constants and secrets.
/// Provide the Google web client ID via `--dart-define=GOOGLE_WEB_CLIENT_ID=...`
/// so the mobile app can request an ID token for backend verification.
class AuthConstants {
  AuthConstants._();

  static const String googleWebClientId =
      String.fromEnvironment('GOOGLE_WEB_CLIENT_ID', defaultValue: '1046290597450-hea7uomj629tv6arefmvpnjutc87jfbe.apps.googleusercontent.com');
}
