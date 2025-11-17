# Hướng dẫn cấu hình Google Sign In

## Các bước cấu hình:

### 1. Tạo OAuth 2.0 Client ID trên Google Cloud Console

1. Truy cập [Google Cloud Console](https://console.cloud.google.com/)
2. Tạo hoặc chọn một project
3. Vào **APIs & Services** > **Credentials**
4. Click **Create Credentials** > **OAuth client ID**

### 2. Cấu hình cho Android

1. Chọn **Application type**: Android
2. **Package name**: `com.example.hospital_mobile_app`
3. Lấy SHA-1 fingerprint bằng lệnh:
   ```bash
   # Windows - Debug keystore
   keytool -list -v -keystore %USERPROFILE%\.android\debug.keystore -alias androiddebugkey -storepass android -keypass android
   
   # macOS/Linux - Debug keystore
   keytool -list -v -keystore ~/.android/debug.keystore -alias androiddebugkey -storepass android -keypass android
   ```
4. Copy SHA-1 (dạng: `AA:BB:CC:DD:...`) và paste vào form
5. Tạo client ID
6. (Tùy chọn) **Tải xuống file `google-services.json`**:
   - Copy file `android/app/google-services.json.template` thành `google-services.json`
   - Thay thế các giá trị `YOUR_*` bằng thông tin từ Google Cloud Console
   - File này đã được thêm vào `.gitignore` để bảo mật

### 3. Cấu hình cho iOS

1. Chọn **Application type**: iOS
2. **Bundle ID**: `com.example.hospitalMobileApp` (hoặc check trong Xcode)
3. Tạo client ID
4. Copy **iOS URL scheme** (dạng: `com.googleusercontent.apps.XXXXXXXX`)
5. Thay thế `YOUR-CLIENT-ID` trong file `ios/Runner/Info.plist`:
   ```xml
   <string>com.googleusercontent.apps.YOUR-CLIENT-ID</string>
   ```

### 4. Cấu hình Backend

Đảm bảo backend API endpoint `/auth/google/token` có thể xử lý Google ID Token:
- Nhận `idToken` từ client
- Verify token với Google
- Tạo/tìm user trong database
- Trả về JWT token của hệ thống

### 5. Test trên thiết bị thật

⚠️ **LƯU Ý**: Google Sign In không hoạt động tốt trên emulator, nên test trên thiết bị thật!

#### Android:
```bash
flutter run --release
```

#### iOS:
```bash
flutter run --release
```

## Kiểm tra cấu hình

Sau khi cấu hình xong, chạy app và kiểm tra logs:
- `Google Sign In: Success` - Đăng nhập thành công
- `Google Sign In: User cancelled` - User hủy
- `Google Sign In Error: ...` - Có lỗi xảy ra

## Các lỗi thường gặp:

### 1. "Sign in failed" hoặc "Error 10"
- Kiểm tra SHA-1 fingerprint đúng chưa
- Kiểm tra package name khớp với Google Console
- Đảm bảo đã tải `google-services.json` (Android)

### 2. "idToken is null"
- Cần có Web Client ID cho iOS
- Kiểm tra URL scheme trong Info.plist

### 3. "API not enabled"
- Enable **Google+ API** trong Google Cloud Console
- Enable **Google Sign-In API**

### 4. Không hiện popup đăng nhập
- Chạy trên thiết bị thật thay vì emulator
- Đảm bảo device có Google Play Services (Android)
- Đảm bảo đã đăng nhập tài khoản Google trên device

## Thông tin bổ sung

- Package name: `com.example.hospital_mobile_app`
- MinSdk: 21 (Android 5.0)
- File cấu hình đã sửa:
  - `android/app/build.gradle.kts`
  - `ios/Runner/Info.plist`
  - `lib/core/services/google_sign_in_service.dart`
