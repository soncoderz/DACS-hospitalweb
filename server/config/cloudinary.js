const cloudinary = require('cloudinary').v2;
require('dotenv').config();

// Cấu hình Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true
});

/**
 * Tải ảnh lên Cloudinary
 * @param {string|Buffer} file - File dạng chuỗi base64 hoặc đường dẫn 
 * @param {string} folder - Thư mục lưu trữ trên Cloudinary
 * @returns {Object} - Thông tin ảnh từ Cloudinary
 */
const uploadImage = async (file, folder = 'avatars') => {
  try {
    // Log thông tin config và file đầu vào
    console.log('Cloudinary upload initiated:', {
      cloudName: cloudinary.config().cloud_name,
      hasApiKey: !!cloudinary.config().api_key,
      hasApiSecret: !!cloudinary.config().api_secret,
      fileType: typeof file,
      folder: folder
    });
    
    // Kiểm tra xem Cloudinary đã được cấu hình đúng chưa
    if (!cloudinary.config().cloud_name || !cloudinary.config().api_key || !cloudinary.config().api_secret) {
      console.error('Cloudinary configuration missing. Check environment variables.');
      throw new Error('Cloudinary configuration missing. Check environment variables.');
    }
    
    // Kiểm tra file tồn tại (nếu là đường dẫn)
    if (typeof file === 'string' && (file.startsWith('/') || file.includes(':\\') || file.includes(':/'))) {
      const fs = require('fs');
      if (!fs.existsSync(file)) {
        console.error(`File không tồn tại: ${file}`);
        throw new Error(`File không tồn tại: ${file}`);
      }
    }
    
    // Kiểm tra xem file có phải là đường dẫn local hay chuỗi base64
    const uploadOptions = {
      folder: folder,
      resource_type: 'auto',
      overwrite: true,
      transformation: [
        { width: 500, height: 500, crop: 'limit' },
        { quality: 'auto' }
      ]
    };

    console.log('Cloudinary upload options:', uploadOptions);
    
    // Thực hiện upload
    const result = await cloudinary.uploader.upload(file, uploadOptions);
    console.log('Cloudinary upload success:', {
      publicId: result.public_id,
      url: result.url
    });
    
    return {
      url: result.url,
      secureUrl: result.secure_url,
      publicId: result.public_id,
      cloudName: cloudinary.config().cloud_name,
      resourceType: result.resource_type
    };
  } catch (error) {
    console.error('Lỗi chi tiết khi tải ảnh lên Cloudinary:', {
      message: error.message,
      stack: error.stack,
      file: file ? (typeof file === 'string' ? file : 'Non-string file') : 'No file provided'
    });
    throw error;
  }
};

/**
 * Xóa ảnh khỏi Cloudinary
 * @param {string} publicId - ID công khai của ảnh trên Cloudinary
 * @returns {Object} - Kết quả xóa ảnh
 */
const deleteImage = async (publicId) => {
  try {
    if (!publicId) return null;
    
    const result = await cloudinary.uploader.destroy(publicId);
    return result;
  } catch (error) {
    console.error('Lỗi khi xóa ảnh từ Cloudinary:', error);
    throw error;
  }
};

module.exports = {
  cloudinary,
  uploadImage,
  deleteImage
}; 