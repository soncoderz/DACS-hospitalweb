const { deleteImage } = require('../config/cloudinary');

// Thêm bác sĩ
exports.createDoctor = async (req, res) => {
  try {
    // Các validation và xử lý dữ liệu như trước
    
    // Tạo đối tượng doctor mới
    const newDoctor = new Doctor({
      // Các trường dữ liệu khác như trước
      
      // Thêm thông tin ảnh nếu có
      image: req.uploadedImage || null
    });
    
    // Lưu vào database
    await newDoctor.save();
    
    // Trả về response
    res.status(201).json({
      success: true,
      data: newDoctor,
      message: 'Thêm bác sĩ thành công'
    });
  } catch (error) {
    // Xử lý lỗi
    console.error('Error creating doctor:', error);
    
    // Nếu có lỗi và đã upload ảnh, xóa ảnh đã upload
    if (req.uploadedImage && req.uploadedImage.publicId) {
      await deleteImage(req.uploadedImage.publicId);
    }
    
    return res.status(500).json({
      success: false,
      message: 'Lỗi khi tạo bác sĩ',
      error: error.message
    });
  }
};

// Cập nhật bác sĩ
exports.updateDoctor = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Validate ID
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'ID bác sĩ không hợp lệ'
      });
    }
    
    // Tìm bác sĩ
    const doctor = await Doctor.findById(id);
    
    if (!doctor) {
      // Nếu có ảnh mới được upload nhưng không tìm thấy bác sĩ, xóa ảnh đã upload
      if (req.uploadedImage && req.uploadedImage.publicId) {
        await deleteImage(req.uploadedImage.publicId);
      }
      
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy bác sĩ'
      });
    }
    
    // Cập nhật các trường thông tin khác
    // [code cập nhật các trường thông thường]
    
    // Cập nhật ảnh nếu có
    if (req.uploadedImage) {
      // Xóa ảnh cũ nếu có
      if (doctor.image && doctor.image.publicId) {
        await deleteImage(doctor.image.publicId);
      }
      
      doctor.image = req.uploadedImage;
    }
    
    // Lưu thay đổi
    await doctor.save();
    
    // Trả về response
    return res.status(200).json({
      success: true,
      data: doctor,
      message: 'Cập nhật bác sĩ thành công'
    });
  } catch (error) {
    console.error('Error updating doctor:', error);
    
    // Nếu có lỗi và đã upload ảnh, xóa ảnh đã upload
    if (req.uploadedImage && req.uploadedImage.publicId) {
      await deleteImage(req.uploadedImage.publicId);
    }
    
    return res.status(500).json({
      success: false,
      message: 'Lỗi khi cập nhật bác sĩ',
      error: error.message
    });
  }
};

// Xóa bác sĩ
exports.deleteDoctor = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Validate ID
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'ID bác sĩ không hợp lệ'
      });
    }
    
    // Tìm bác sĩ
    const doctor = await Doctor.findById(id);
    
    if (!doctor) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy bác sĩ'
      });
    }
    
    // Xóa ảnh từ Cloudinary nếu có
    if (doctor.image && doctor.image.publicId) {
      await deleteImage(doctor.image.publicId);
    }
    
    // Xóa bác sĩ
    await Doctor.findByIdAndDelete(id);
    
    // Trả về response
    return res.status(200).json({
      success: true,
      message: 'Xóa bác sĩ thành công'
    });
  } catch (error) {
    console.error('Error deleting doctor:', error);
    return res.status(500).json({
      success: false,
      message: 'Lỗi khi xóa bác sĩ',
      error: error.message
    });
  }
}; 