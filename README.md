# HƯỚNG DẪN THIẾT LẬP VÀ CHẠY DỰ ÁN HOSPITAL WEB

## YÊU CẦU HỆ THỐNG
- Node.js (Node.js v22.14.0)
- npm 
- MongoDB (đã có tài khoản MongoDB Atlas)
- Git : https://github.com/soncoderz/DACS-hospitalweb


## THIẾT LẬP SERVER (BACKEND)

1. Di chuyển vào thư mục server:
   ```
   cd server
   ```

2. Cài đặt các dependencies:
   ```
   npm install
   ```

3. Cấu hình môi trường:
   - File .env đã được cấu hình sẵn với các thông tin kết nối MongoDB, JWT, OAuth, Cloudinary và PayPal
   - Có thể điều chỉnh các thông số nếu cần

4. Khởi động server ở chế độ development:
   ```
   npm run dev
   ```
   Server sẽ chạy tại http://localhost:5000

## THIẾT LẬP CLIENT (FRONTEND)

1. Di chuyển vào thư mục client:
   ```
   cd client
   ```

2. Cài đặt các dependencies:
   ```
   npm install --force (--force Để không bị xung đột lỗi)
   ```

3. Cấu hình môi trường:
   - File .env đã được cấu hình sẵn với URL API và các thông tin OAuth, PayPal
   - Mặc định API URL là http://localhost:5000/api

4. Khởi động client ở chế độ development:
   ```
   npm run dev
   ```
   Frontend sẽ chạy tại http://localhost:3000

## CHẠY TOÀN BỘ DỰ ÁN (Cần 2 terminal)

1. Terminal 1 - Khởi động server:
   ```
   cd server
   npm run dev
   ```

2. Terminal 2 - Khởi động client:
   ```
   cd client
   npm run dev
   ```


## Tài khoản
Tài khoản admin: admin@congson.com, mật khẩu: qwe123


Tài khoản người dùng 1: user1@example.com, mật khẩu: HospitalApp@123
Tài khoản người dùng 2: user2@example.com, mật khẩu: HospitalApp@123

+ Hoặc đăng nhập Facebook & Google


Tài khoản bác sĩ 1: nguyenhoanglan5008@gmail.com, mật khẩu: qwe123
Tài khoản bác sĩ 2: doctor.b@example.com, mật khẩu: HospitalApp@123
Tài khoản bác sĩ 3: doctor.c@example.com, mật khẩu: HospitalApp@123
Tài khoản bác sĩ 4: doctor.d@example.com, mật khẩu: HospitalApp@123

+ Tạo thêm dưới quyền admin 



## BUILD CHO MÔI TRƯỜNG PRODUCTION

1. Build frontend:
   ```
   cd client
   npm run build
   ```
   Kết quả build sẽ được lưu trong thư mục client/dist

2. Chạy server ở chế độ production:
   ```
   cd server
   npm start
   ```

## XỬ LÝ SỰ CỐ THÔNG THƯỜNG

1. Lỗi kết nối MongoDB:
   - Kiểm tra kết nối internet
   - Kiểm tra chuỗi kết nối MongoDB trong file .env

2. Lỗi port đã được sử dụng:
   - Thay đổi cổng trong file .env của server
   - Dừng các ứng dụng khác đang sử dụng cùng cổng

3. Lỗi cài đặt dependencies:
   - Xóa thư mục node_modules và file package-lock.json
   - Chạy lại lệnh npm install

## TÍNH NĂNG CHÍNH

- Đăng nhập/Đăng ký (bao gồm OAuth với Google và Facebook)
- Quản lý bệnh nhân và lịch hẹn
- Thanh toán trực tuyến với PayPal
- Trò chuyện thời gian thực
- Biểu đồ thống kê và báo cáo
.......
