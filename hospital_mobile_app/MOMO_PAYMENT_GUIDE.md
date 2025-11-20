# Hướng dẫn Thanh toán MoMo - Flutter Mobile App

## Tổng quan

Ứng dụng đã tích hợp thanh toán MoMo sử dụng phương pháp URL Deep Link, cho phép người dùng thanh toán trực tiếp qua ứng dụng MoMo đã cài đặt trên điện thoại.

## Luồng thanh toán

1. **Người dùng chọn thanh toán MoMo** trong màn hình billing
2. **App tạo payment request** gửi lên server
3. **Server trả về payUrl** từ MoMo
4. **App mở MoMo app** bằng URL Launcher
5. **Người dùng xác nhận thanh toán** trong MoMo app
6. **App tự động kiểm tra** trạng thái thanh toán mỗi 5 giây
7. **Hiển thị kết quả** khi thanh toán thành công

## Các file đã tạo/cập nhật

### 1. MomoPaymentScreen
**File:** `lib/presentation/screens/payment/momo_payment_screen.dart`

Màn hình xử lý thanh toán MoMo với các tính năng:
- Tự động mở MoMo app
- Kiểm tra trạng thái thanh toán định kỳ
- Hiển thị loading và status
- Xử lý timeout và lỗi
- Cho phép retry

### 2. BillingProvider
**File:** `lib/presentation/providers/billing_provider.dart`

Thêm phương thức:
```dart
Future<dynamic> createMomoPayment(
  String appointmentId,
  double amount,
  String billType, {
  String? prescriptionId,
})
```

### 3. UserBillingWidget
**File:** `lib/presentation/widgets/billing/user_billing_widget.dart`

Cập nhật để navigate đến MomoPaymentScreen khi chọn thanh toán MoMo.

### 4. Main.dart
**File:** `lib/main.dart`

Thêm route `/momo-payment` để navigate đến màn hình thanh toán.

## Cách sử dụng

### Thanh toán phí khám

```dart
Navigator.pushNamed(
  context,
  '/momo-payment',
  arguments: {
    'appointmentId': appointmentId,
    'amount': consultationAmount,
    'billType': 'consultation',
  },
);
```

### Thanh toán đơn thuốc

```dart
Navigator.pushNamed(
  context,
  '/momo-payment',
  arguments: {
    'appointmentId': appointmentId,
    'amount': prescriptionAmount,
    'billType': 'medication',
    'prescriptionId': prescriptionId,
  },
);
```

### Thanh toán phí nội trú

```dart
Navigator.pushNamed(
  context,
  '/momo-payment',
  arguments: {
    'appointmentId': appointmentId,
    'amount': hospitalizationAmount,
    'billType': 'hospitalization',
  },
);
```

## API Server

Server cần implement endpoint:
```
POST /api/payments/momo/create
```

Request body:
```json
{
  "appointmentId": "string",
  "amount": number,
  "billType": "consultation|medication|hospitalization",
  "prescriptionId": "string" // optional, for medication
}
```

Response:
```json
{
  "success": true,
  "data": {
    "payUrl": "https://test-payment.momo.vn/...",
    "orderId": "string",
    "requestId": "string"
  }
}
```

## Kiểm tra trạng thái thanh toán

App tự động kiểm tra trạng thái bằng cách:
1. Gọi `fetchBill(appointmentId)` mỗi 5 giây
2. Kiểm tra status của bill tương ứng với billType
3. Dừng kiểm tra khi:
   - Thanh toán thành công
   - Timeout (5 phút)
   - Người dùng hủy

## Xử lý lỗi

### Không mở được MoMo app
- Kiểm tra MoMo app đã cài đặt chưa
- Kiểm tra URL scheme đúng chưa

### Timeout
- Hiển thị dialog cho phép người dùng:
  - Kiểm tra lại
  - Đóng và quay lại

### Lỗi server
- Hiển thị thông báo lỗi
- Cho phép retry

## Dependencies

Package đã có trong `pubspec.yaml`:
```yaml
dependencies:
  url_launcher: ^6.2.3
```

## Testing

### Test trên Android Emulator
```bash
flutter run
```

### Test trên thiết bị thật
1. Cài đặt MoMo app
2. Build và cài đặt app
3. Thực hiện thanh toán

## Lưu ý

1. **MoMo Sandbox**: Sử dụng môi trường test của MoMo để phát triển
2. **Production**: Cần đăng ký tài khoản merchant tại https://business.momo.vn
3. **Security**: Không lưu thông tin thanh toán nhạy cảm trên client
4. **UX**: Luôn thông báo rõ ràng cho người dùng về trạng thái thanh toán

## Tương lai

Có thể mở rộng thêm:
- [ ] Thanh toán PayPal
- [ ] Thanh toán ZaloPay
- [ ] Thanh toán VNPay
- [ ] Lưu lịch sử thanh toán
- [ ] Thông báo push khi thanh toán thành công
