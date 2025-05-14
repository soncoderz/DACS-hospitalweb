const multer = require('multer');
const path = require('path');

// Memory storage for all uploads (no local file storage)
const memoryStorage = multer.memoryStorage();

// Kiểm tra loại file
const fileFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|gif|webp|svg|jfif|bmp|tiff|tif|ico|heic|heif|avif|raw|psd|ai|eps/;
  // Kiểm tra mime type
  const mimeOk = allowedTypes.test(file.mimetype);
  // Kiểm tra extension
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  
  if (mimeOk && extname) {
    return cb(null, true);
  }
  
  cb(new Error('Định dạng file không được hỗ trợ. Hệ thống chấp nhận hầu hết các định dạng ảnh phổ biến như JPEG, PNG, GIF, WEBP, SVG, BMP, TIFF và các định dạng chuyên dụng khác.'));
};

// Cấu hình upload với memory storage
const upload = multer({
  storage: memoryStorage,
  limits: {
    fileSize: 10 * 1024 * 1024 // Giới hạn 10MB
  },
  fileFilter: fileFilter
});

// Sử dụng cùng một cấu hình cho tất cả các loại upload
const uploadAvatar = upload;
const uploadToMemory = upload;

module.exports = { upload, uploadToMemory, uploadAvatar }; 