# Hướng dẫn cài đặt MoMo trên Android Emulator

## Vấn đề hiện tại

Trên Android Emulator, MoMo app chưa được cài đặt nên URL sẽ mở trong Chrome browser thay vì MoMo app.

## Giải pháp 1: Cài đặt MoMo app trên Emulator (Khuyến nghị)

### Bước 1: Download MoMo APK

Có 2 cách:

**Cách 1: Download từ APKPure/APKMirror**
1. Truy cập https://apkpure.com hoặc https://apkmirror.com
2. Tìm "MoMo" 
3. Download file APK

**Cách 2: Extract từ thiết bị Android thật**
```bash
# Nếu bạn có thiết bị Android với MoMo đã cài
adb shell pm list packages | grep momo
adb shell pm path com.mservice.momotransfer
adb pull /data/app/.../base.apk momo.apk
```

### Bước 2: Cài đặt APK lên Emulator

```bash
# Khởi động emulator
flutter emulators --launch <emulator_id>

# Cài đặt APK
adb install momo.apk

# Hoặc kéo thả file APK vào cửa sổ emulator
```

### Bước 3: Verify cài đặt

```bash
adb shell pm list packages | grep momo
# Output: package:com.mservice.momotransfer
```

### Bước 4: Test thanh toán

1. Chạy app: `flutter run`
2. Chọn thanh toán MoMo
3. MoMo app sẽ tự động mở
4. Hoàn tất thanh toán trong MoMo app

## Giải pháp 2: Test trên thiết bị thật (Đơn giản nhất)

### Bước 1: Cài đặt MoMo từ Play Store

1. Mở Play Store trên điện thoại
2. Tìm "MoMo"
3. Cài đặt

### Bước 2: Build và cài app

```bash
flutter build apk
flutter install
```

### Bước 3: Test

App sẽ tự động mở MoMo app khi thanh toán.

## Giải pháp 3: Sử dụng Browser (Hiện tại)

Nếu không cài MoMo app, URL sẽ mở trong Chrome browser:

1. URL mở trong Chrome
2. Hoàn tất thanh toán trên web
3. App tự động check status
4. Hiển thị kết quả

**Ưu điểm**: Không cần cài MoMo app
**Nhược điểm**: UX không tốt bằng mở app trực tiếp

## Cấu hình đã thêm

### AndroidManifest.xml

```xml
<queries>
    <!-- For MoMo app deep link -->
    <intent>
        <action android:name="android.intent.action.VIEW" />
        <data android:scheme="momo" />
    </intent>
    <!-- For MoMo app package -->
    <package android:name="com.mservice.momotransfer" />
</queries>
```

### MomoPaymentScreen

Code đã được cập nhật để:
1. Kiểm tra MoMo app có cài không
2. Ưu tiên mở MoMo app
3. Fallback sang browser nếu không có app
4. Fallback sang WebView nếu không mở được browser

## Timeout Issue

Đã tăng timeout lên 60 giây trong `api_constants.dart`:
```dart
static const Duration connectTimeout = Duration(seconds: 60);
static const Duration receiveTimeout = Duration(seconds: 60);
static const Duration sendTimeout = Duration(seconds: 60);
```

## Test Flow

### Với MoMo app đã cài:
1. User chọn thanh toán MoMo
2. App kiểm tra MoMo app có cài không
3. Mở MoMo app trực tiếp
4. User xác nhận trong MoMo
5. Quay lại app
6. App auto-check status

### Không có MoMo app:
1. User chọn thanh toán MoMo
2. App mở URL trong Chrome
3. User thanh toán trên web
4. App auto-check status

## Logs để debug

```
I/flutter: Opening MoMo payment URL: https://test-payment.momo.vn/...
I/flutter: MoMo app is installed, trying to open...
I/flutter: Launched in MoMo app: true
```

Hoặc:

```
I/flutter: Opening MoMo payment URL: https://test-payment.momo.vn/...
I/flutter: MoMo app is not installed
I/flutter: Trying to open in external browser...
I/flutter: Launched in external browser: true
```

## Khuyến nghị

Để có trải nghiệm tốt nhất:
1. **Development**: Test trên thiết bị thật có MoMo app
2. **Production**: Hướng dẫn user cài MoMo app
3. **Fallback**: Luôn hỗ trợ thanh toán qua browser
