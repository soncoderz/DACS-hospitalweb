// =============================================================================
// SELENIUM USER HELPER - Script hỗ trợ thao tác user trong DB cho Selenium
// =============================================================================
// Script này được gọi bởi runner Selenium (client/selenium/run.js) để thao tác
// trực tiếp vào database MongoDB mà không cần tạo thêm endpoint API riêng.
//
// Các lệnh hỗ trợ:
//   - verify: Đánh dấu user đã xác thực email (bỏ qua bước gửi email thật)
//   - delete: Xóa user tạm do Selenium tạo ra sau khi test xong
//   - state:  Đọc nhanh trạng thái user (isVerified, isLocked) để debug
//
// Cách sử dụng:
//   node seleniumUserHelper.js <verify|delete|state> <email>
// =============================================================================

const path = require('path');
const dotenv = require('dotenv');

// Nạp biến môi trường từ file .env của server
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const { connectDB, disconnectDB } = require('../config/database');
const User = require('../models/User');

// Hàm chính - Selenium runner gọi script này như một process con (child process)
// để thao tác user trực tiếp trong DB mà không cần mở thêm endpoint test
// đặc biệt trong HTTP API.
async function main() {
  // Đọc tham số dòng lệnh: lệnh (verify/delete/state) và email user
  const [, , command, email] = process.argv;

  // Kiểm tra đầu vào bắt buộc
  if (!command || !email) {
    throw new Error('Usage: node seleniumUserHelper.js <verify|delete|state> <email>');
  }

  // Kết nối đến MongoDB
  await connectDB();

  try {
    // Chuẩn hóa email: chuyển về chữ thường và xóa khoảng trắng
    const normalizedEmail = String(email).trim().toLowerCase();
    // Tìm user trong DB theo email
    const user = await User.findOne({ email: normalizedEmail });

    // --- LỆNH DELETE ---
    // Dùng để dọn dẹp user tạm mà Selenium tạo ra sau khi chạy test xong.
    // Điều này giúp DB không bị tích lũy user rác qua nhiều lần chạy test.
    if (command === 'delete') {
      if (!user) {
        // User không tồn tại -> trả về thành công (không cần xóa gì)
        console.log(JSON.stringify({ success: true, action: 'delete', email: normalizedEmail, found: false }));
        return;
      }

      // Xóa user khỏi DB
      await User.deleteOne({ _id: user._id });
      // Trả kết quả dạng JSON để runner Selenium đọc được
      console.log(JSON.stringify({ success: true, action: 'delete', email: normalizedEmail, found: true }));
      return;
    }

    // Nếu không phải lệnh delete thì user phải tồn tại
    if (!user) {
      throw new Error(`User not found for email ${normalizedEmail}`);
    }

    // --- LỆNH VERIFY ---
    // Dùng để bỏ qua bước xác thực email thật (gửi email -> click link).
    // Khi test Selenium cần booking/payment, user phải ở trạng thái đã verify,
    // nên script này đánh dấu verify trực tiếp trong DB thay vì phải check email thật.
    if (command === 'verify') {
      user.isVerified = true;                    // Đánh dấu đã xác thực
      user.verificationToken = undefined;         // Xóa token xác thực (không cần nữa)
      user.verificationTokenExpires = undefined;  // Xóa thời hạn token
      await user.save();                          // Lưu thay đổi vào DB

      // Trả kết quả JSON cho runner Selenium
      console.log(JSON.stringify({
        success: true,
        action: 'verify',
        email: normalizedEmail,
        userId: String(user._id),
        isVerified: user.isVerified
      }));
      return;
    }

    // --- LỆNH STATE ---
    // Dùng để đọc nhanh trạng thái hiện tại của user do Selenium tạo ra,
    // hữu ích khi debug xem user đã verify chưa hoặc có bị khóa không.
    if (command === 'state') {
      console.log(JSON.stringify({
        success: true,
        action: 'state',
        email: normalizedEmail,
        userId: String(user._id),
        isVerified: Boolean(user.isVerified),  // Đã xác thực email chưa?
        isLocked: Boolean(user.isLocked)       // Tài khoản có bị khóa không?
      }));
      return;
    }

    // Lệnh không hợp lệ
    throw new Error(`Unsupported command: ${command}`);
  } finally {
    // Luôn ngắt kết nối DB khi xong, dù thành công hay lỗi
    await disconnectDB();
  }
}

// Chạy hàm chính và xử lý lỗi
main().catch(async (error) => {
  console.error(error.message);
  try {
    await disconnectDB();
  } catch (_) {
    // Bỏ qua lỗi ngắt kết nối khi đã có lỗi khác
  }
  process.exit(1);  // Thoát với mã lỗi 1 để runner Selenium biết script thất bại
});
