const { deleteImage, cloudinary } = require('../config/cloudinary');

// Helper để xử lý upload ảnh
exports.handleImageUpload = async (req, res, next) => {
  try {
    if (!req.file) {
      return next();
    }
    
    // Lưu thông tin ảnh vào req để sử dụng trong controller tiếp theo
    req.uploadedImage = {
      url: req.file.path,
      publicId: req.file.filename,
      altText: req.body.altText || ''
    };
    
    next();
  } catch (error) {
    console.error('Image upload error:', error);
    return res.status(500).json({
      success: false,
      message: 'Lỗi khi tải ảnh lên',
      error: error.message
    });
  }
};

// Helper để xử lý thay thế ảnh
exports.handleImageReplace = async (req, res, next) => {
  try {
    if (!req.file) {
      return next();
    }
    
    // Nếu đã có ảnh cũ, xóa ảnh cũ từ Cloudinary
    const oldImagePublicId = req.body.oldImagePublicId;
    if (oldImagePublicId) {
      await deleteImage(oldImagePublicId);
    }
    
    // Lưu thông tin ảnh mới vào req
    req.uploadedImage = {
      url: req.file.path,
      publicId: req.file.filename,
      altText: req.body.altText || ''
    };
    
    next();
  } catch (error) {
    console.error('Image replace error:', error);
    return res.status(500).json({
      success: false,
      message: 'Lỗi khi thay thế ảnh',
      error: error.message
    });
  }
}; 