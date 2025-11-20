# Hướng dẫn Test Thanh toán MoMo

## Đã sửa lỗi

✅ **Cấu hình AndroidManifest.xml**: Thêm queries để cho phép mở URL
✅ **Cải thiện URL Launcher**: Thử nhiều mode khác nhau để mở URL
✅ **Fallback to WebView**: Nếu không mở được app/browser, sẽ mở trong WebView

## Cách test trên Android Emulator

### 1. Rebuild app
```bash
flutter clean
flutter pub get
flutter run
```

### 2. Test thanh toán

Khi thanh toán MoMo, URL sẽ được mở theo thứ tự:
1. **External Application** - Thử mở MoMo app (nếu có cài)
2. **External Non-Browser** - Thử mở app khác
3. **Platform Default** - Mở trình duyệt mặc định (Chrome)
4. **In-App WebView** - Mở trong WebView của app

### 3. Môi trường test MoMo

URL test: `https://test-payment.momo.vn/v2/gateway/pay?t=...`

Trên emulator, URL này sẽ mở trong Chrome browser.

### 4. Xác nhận thanh toán

Trong môi trường test của MoMo:
- Nhập số điện thoại test
- Nhập OTP test
- Xác nhận thanh toán

### 5. App tự động check status

App sẽ tự động kiểm tra trạng thái thanh toán mỗi 5 giây.

## Test trên thiết bị thật

### 1. Cài đặt MoMo app
Download từ Google Play Store

### 2. Build và cài app
```bash
flutter build apk
flutter install
```

### 3. Test thanh toán
- Chọn thanh toán MoMo
- App sẽ tự động mở MoMo app
- Xác nhận thanh toán trong MoMo
- Quay lại app để xem kết quả

## Troubleshooting

### Lỗi: "component name is null"
**Nguyên nhân**: Android không tìm thấy app/browser để mở URL

**Giải pháp**: 
- Đã fix bằng cách thử nhiều launch mode
- URL sẽ mở trong Chrome browser trên emulator

### Lỗi: Không mở được URL
**Kiểm tra**:
1. Internet connection
2. URL hợp lệ từ server
3. AndroidManifest.xml đã có queries

### Lỗi: Timeout checking status
**Nguyên nhân**: Thanh toán chưa hoàn tất hoặc server chưa cập nhật

**Giải pháp**:
- Click "Kiểm tra lại" trong dialog
- Hoặc quay lại và check trong billing

## Thông tin MoMo Test

### Test Credentials (Sandbox)
- Merchant Code: Được cấp bởi MoMo
- Partner Code: Được cấp bởi MoMo
- Access Key: Được cấp bởi MoMo
- Secret Key: Được cấp bởi MoMo

### Test Phone Numbers
MoMo cung cấp số điện thoại test trong tài liệu sandbox

### Test OTP
MoMo cung cấp OTP test trong môi trường sandbox

## Production

Khi chuyển sang production:

1. **Đăng ký merchant**: https://business.momo.vn
2. **Lấy credentials production**
3. **Cập nhật server config**
4. **Test kỹ trước khi release**

## Logs để debug

```dart
// Trong MomoPaymentScreen
debugPrint('MoMo PayUrl: $payUrl');
debugPrint('Launch mode tried: ...');
debugPrint('Payment status check: ...');
```

## Notes

- Emulator sẽ mở URL trong Chrome browser
- Thiết bị thật sẽ mở MoMo app (nếu có cài)
- WebView là fallback cuối cùng
- Auto-check status mỗi 5 giây, timeout sau 5 phút
