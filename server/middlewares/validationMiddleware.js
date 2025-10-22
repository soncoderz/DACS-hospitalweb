const validator = require('validator');

/**
 * Middleware xác thực dữ liệu người dùng
 */

// Xác thực họ tên
exports.validateFullName = (req, res, next) => {
  const { fullName } = req.body;
  
  if (!fullName) {
    return res.status(400).json({
      success: false,
      field: 'fullName',
      message: 'Họ và tên là bắt buộc'
    });
  }
  
  const trimmedName = fullName.trim();
  
  if (trimmedName.length < 2) {
    return res.status(400).json({
      success: false,
      field: 'fullName',
      message: 'Họ và tên phải có ít nhất 2 ký tự'
    });
  }
  
  if (trimmedName.length > 100) {
    return res.status(400).json({
      success: false,
      field: 'fullName',
      message: 'Họ và tên không được vượt quá 100 ký tự'
    });
  }
  
  // Gán giá trị đã trim vào request body
  req.body.fullName = trimmedName;
  
  next();
};

// Xác thực email
exports.validateEmail = (req, res, next) => {
  const { email } = req.body;
  
  if (!email) {
    return res.status(400).json({
      success: false,
      field: 'email',
      message: 'Email là bắt buộc'
    });
  }
  
  const trimmedEmail = email.trim().toLowerCase();
  
  if (!validator.isEmail(trimmedEmail)) {
    return res.status(400).json({
      success: false,
      field: 'email',
      message: 'Email không hợp lệ'
    });
  }
  
  // Gán giá trị đã xử lý vào request body
  req.body.email = trimmedEmail;
  
  next();
};

// Xác thực số điện thoại
exports.validatePhoneNumber = (req, res, next) => {
  const { phoneNumber } = req.body;
  
  // Nếu không có số điện thoại, cho phép bỏ qua
  if (!phoneNumber) {
    next();
    return;
  }
  
  const trimmedPhone = phoneNumber.trim();
  
  if (!trimmedPhone.match(/^[0-9]{10,11}$/)) {
    return res.status(400).json({
      success: false,
      field: 'phoneNumber',
      message: 'Số điện thoại không hợp lệ'
    });
  }
  
  // Gán giá trị đã xử lý vào request body
  req.body.phoneNumber = trimmedPhone;
  
  next();
};

// Xác thực mật khẩu
exports.validatePassword = (req, res, next) => {
  const { password } = req.body;
  const { googleId, facebookId } = req.body;
  
  // Mật khẩu chỉ bắt buộc nếu không dùng xác thực từ mạng xã hội
  if (!googleId && !facebookId && !password) {
    return res.status(400).json({
      success: false,
      field: 'password',
      message: 'Mật khẩu là bắt buộc'
    });
  }
  
  // Nếu có mật khẩu, kiểm tra độ dài
  if (password && password.length < 6) {
    return res.status(400).json({
      success: false,
      field: 'password',
      message: 'Mật khẩu phải có ít nhất 6 ký tự'
    });
  }
  
  next();
};

// Xác thực ngày sinh
exports.validateDateOfBirth = (req, res, next) => {
  const { dateOfBirth } = req.body;
  
  if (!dateOfBirth) {
    return res.status(400).json({
      success: false,
      field: 'dateOfBirth',
      message: 'Ngày sinh là bắt buộc'
    });
  }
  
  const dob = new Date(dateOfBirth);
  const now = new Date();
  
  if (isNaN(dob.getTime()) || dob > now) {
    return res.status(400).json({
      success: false,
      field: 'dateOfBirth',
      message: 'Ngày sinh không hợp lệ'
    });
  }
  
  next();
};

// Xác thực giới tính
exports.validateGender = (req, res, next) => {
  const { gender } = req.body;
  
  if (!gender) {
    return res.status(400).json({
      success: false,
      field: 'gender',
      message: 'Giới tính là bắt buộc'
    });
  }
  
  if (!['male', 'female', 'other'].includes(gender)) {
    return res.status(400).json({
      success: false,
      field: 'gender',
      message: 'Giới tính phải là male, female hoặc other'
    });
  }
  
  next();
};

// Xác thực địa chỉ
exports.validateAddress = (req, res, next) => {
  const { address } = req.body;
  
  if (address && address.trim().length > 200) {
    return res.status(400).json({
      success: false,
      field: 'address',
      message: 'Địa chỉ không được vượt quá 200 ký tự'
    });
  }
  
  if (address) {
    req.body.address = address.trim();
  }
  
  next();
};

// Xác thực vai trò
exports.validateRoleType = (req, res, next) => {
  const { roleType } = req.body;
  
  if (roleType && !['user'].includes(roleType)) {
    return res.status(400).json({
      success: false,
      field: 'roleType',
      message: 'Vai trò không hợp lệ'
    });
  }
  
  next();
};

// Middleware xác thực đăng ký người dùng
exports.validateUserRegistration = [
  exports.validateFullName,
  exports.validateEmail,
  exports.validatePhoneNumber,
  exports.validatePassword,
  exports.validateDateOfBirth,
  exports.validateGender,
  exports.validateAddress,
  exports.validateRoleType
];

// Middleware xác thực cập nhật thông tin người dùng
exports.validateUserUpdate = [
  exports.validateFullName,
  exports.validatePhoneNumber,
  exports.validateDateOfBirth,
  exports.validateGender,
  exports.validateAddress
];

// Middleware xác thực đổi mật khẩu
exports.validatePasswordChange = (req, res, next) => {
  const { currentPassword, newPassword } = req.body;
  
  if (!currentPassword) {
    return res.status(400).json({
      success: false,
      field: 'currentPassword',
      message: 'Mật khẩu hiện tại là bắt buộc'
    });
  }
  
  if (!newPassword) {
    return res.status(400).json({
      success: false,
      field: 'newPassword',
      message: 'Mật khẩu mới là bắt buộc'
    });
  }
  
  if (newPassword.length < 6) {
    return res.status(400).json({
      success: false,
      field: 'newPassword',
      message: 'Mật khẩu mới phải có ít nhất 6 ký tự'
    });
  }
  
  if (currentPassword === newPassword) {
    return res.status(400).json({
      success: false,
      field: 'newPassword',
      message: 'Mật khẩu mới không được trùng với mật khẩu hiện tại'
    });
  }
  
  next();
}; 