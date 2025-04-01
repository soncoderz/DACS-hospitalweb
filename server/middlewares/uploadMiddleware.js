const multer = require('multer');
const path = require('path');

// Cấu hình lưu trữ
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, `avatar-${uniqueSuffix}${ext}`);
  }
});

// Kiểm tra loại file
const fileFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|gif/;
  // Kiểm tra mime type
  const mimeOk = allowedTypes.test(file.mimetype);
  // Kiểm tra extension
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  
  if (mimeOk && extname) {
    return cb(null, true);
  }
  
  cb(new Error('Định dạng file không được hỗ trợ. Chỉ chấp nhận ảnh JPEG, JPG, PNG hoặc GIF.'));
};

// Cấu hình upload
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // Giới hạn 5MB
  },
  fileFilter: fileFilter
});

module.exports = upload; 