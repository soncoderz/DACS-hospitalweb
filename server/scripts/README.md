# Scripts Hệ thống

Thư mục này chứa các script hệ thống hỗ trợ quản trị và phát triển.

## 1. Quản lý Admin

### 1.1. Tạo tài khoản Admin tương tác

Script `createAdmin.js` cho phép tạo tài khoản admin thông qua các tương tác dòng lệnh.

**Cách sử dụng:**

```bash
node server/scripts/createAdmin.js
```

Script sẽ yêu cầu nhập các thông tin:
- Email
- Số điện thoại
- Mật khẩu (ít nhất 6 ký tự)
- Họ tên
- Vai trò (admin hoặc super_admin)

### 1.2. Tạo tài khoản Admin mặc định

Script `createDefaultAdmin.js` tạo một tài khoản admin mặc định với các thông tin đã cấu hình sẵn.

**Cách sử dụng:**

```bash
node server/scripts/createDefaultAdmin.js
```

**Thông tin tài khoản mặc định:**
- Email: admin@example.com
- Mật khẩu: Admin@123
- Vai trò: super_admin

**Lưu ý:** Tài khoản này chỉ nên được sử dụng trong môi trường phát triển hoặc cho lần khởi tạo đầu tiên.
Hãy đổi mật khẩu ngay sau khi đăng nhập thành công.

## 2. Quản lý Bác Sĩ

### 2.1. Tạo tài khoản Bác Sĩ tương tác

Script `createDoctor.js` cho phép tạo tài khoản bác sĩ thông qua các tương tác dòng lệnh.

**Cách sử dụng:**

```bash
node server/scripts/createDoctor.js
```

Script sẽ yêu cầu nhập các thông tin:
- Email
- Số điện thoại
- Mật khẩu
- Họ tên đầy đủ
- Ngày sinh
- Giới tính
- Địa chỉ
- Chuyên khoa (chọn từ danh sách)
- Bệnh viện (chọn từ danh sách)
- Số năm kinh nghiệm
- Phí tư vấn
- Tiểu sử bác sĩ

**Lưu ý:** Script này yêu cầu đã có ít nhất một chuyên khoa và một bệnh viện trong hệ thống.

### 2.2. Tạo tài khoản Bác Sĩ mặc định

Script `createDefaultDoctor.js` tạo một tài khoản bác sĩ mặc định với các thông tin đã cấu hình sẵn.

**Cách sử dụng:**

```bash
node server/scripts/createDefaultDoctor.js
```

**Thông tin tài khoản mặc định:**
- Email: doctor@example.com
- Mật khẩu: Doctor@123
- Họ tên: Bác Sĩ Mẫu
- Chuyên khoa: Đa khoa (được tạo tự động nếu chưa có)
- Bệnh viện: Bệnh viện Mẫu (được tạo tự động nếu chưa có)

**Lưu ý:** Script này sẽ tự động tạo chuyên khoa, vai trò và bệnh viện nếu chưa có trong hệ thống, phù hợp cho việc khởi tạo hệ thống từ đầu.

## 3. Quản lý Chuyên Khoa

### 3.1. Tạo chuyên khoa tương tác

Script `createSpecialty.js` cho phép tạo chuyên khoa mới thông qua các tương tác dòng lệnh.

**Cách sử dụng:**

```bash
node server/scripts/createSpecialty.js
```

Script sẽ yêu cầu nhập các thông tin:
- Tên chuyên khoa
- Mô tả
- Icon (URL hoặc tên icon, có thể để trống)

Script sẽ hiển thị danh sách các chuyên khoa hiện có trước khi tạo mới để tránh trùng lặp.

### 3.2. Tạo các chuyên khoa mặc định

Script `createDefaultSpecialties.js` tạo sẵn 10 chuyên khoa phổ biến.

**Cách sử dụng:**

```bash
node server/scripts/createDefaultSpecialties.js
```

**Danh sách chuyên khoa mặc định:**
- Đa khoa
- Tim mạch
- Nhi khoa
- Da liễu
- Thần kinh
- Tiêu hóa
- Chấn thương chỉnh hình
- Tai Mũi Họng
- Mắt
- Sản phụ khoa

**Lưu ý:** Script sẽ bỏ qua các chuyên khoa đã tồn tại trong hệ thống và chỉ tạo những chuyên khoa mới.

## 4. Quản lý Vai Trò

### 4.1. Tạo các vai trò mặc định

Script `createDefaultRoles.js` tạo sẵn 3 vai trò cơ bản cho hệ thống.

**Cách sử dụng:**

```bash
node server/scripts/createDefaultRoles.js
```

**Danh sách vai trò mặc định:**
- Quản trị viên (admin)
- Bác sĩ (doctor)
- Người dùng (user)

**Lưu ý:** Việc tạo các vai trò này là bắt buộc trước khi tạo tài khoản bác sĩ hoặc người dùng.

## 5. Quản lý Bệnh viện

### 5.1. Tạo các bệnh viện mẫu

Script `createDefaultHospitals.js` tạo sẵn 2 bệnh viện mẫu cho hệ thống.

**Cách sử dụng:**

```bash
node server/scripts/createDefaultHospitals.js
```

**Danh sách bệnh viện mẫu:**
- Bệnh viện Đa khoa Trung ương
- Bệnh viện Quốc tế

**Lưu ý:** Việc tạo các bệnh viện này là bắt buộc trước khi tạo tài khoản bác sĩ, vì mỗi bác sĩ phải liên kết với ít nhất một bệnh viện. 