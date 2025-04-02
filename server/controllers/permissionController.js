const Permission = require('../models/Permission');

// Lấy danh sách tất cả quyền
exports.getAllPermissions = async (req, res) => {
  try {
    const permissions = await Permission.find().sort({ category: 1, name: 1 });
    
    res.status(200).json({
      success: true,
      count: permissions.length,
      data: permissions
    });
  } catch (error) {
    console.error('Error in getAllPermissions:', error);
    res.status(500).json({
      success: false,
      message: 'Không thể lấy danh sách quyền',
      error: error.message
    });
  }
};

// Lấy danh sách quyền theo danh mục
exports.getPermissionsByCategory = async (req, res) => {
  try {
    const { category } = req.params;
    
    const permissions = await Permission.find({ category }).sort({ name: 1 });
    
    res.status(200).json({
      success: true,
      count: permissions.length,
      data: permissions
    });
  } catch (error) {
    console.error('Error in getPermissionsByCategory:', error);
    res.status(500).json({
      success: false,
      message: 'Không thể lấy danh sách quyền theo danh mục',
      error: error.message
    });
  }
};

// Lấy thông tin chi tiết quyền
exports.getPermissionById = async (req, res) => {
  try {
    const permission = await Permission.findById(req.params.id);
    
    if (!permission) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy quyền'
      });
    }
    
    res.status(200).json({
      success: true,
      data: permission
    });
  } catch (error) {
    console.error('Error in getPermissionById:', error);
    res.status(500).json({
      success: false,
      message: 'Không thể lấy thông tin quyền',
      error: error.message
    });
  }
};

// Tạo quyền mới
exports.createPermission = async (req, res) => {
  try {
    const { name, description, code, category } = req.body;
    
    // Kiểm tra nếu code đã tồn tại
    const existingPermission = await Permission.findOne({ code });
    if (existingPermission) {
      return res.status(400).json({
        success: false,
        message: 'Mã quyền đã tồn tại'
      });
    }
    
    // Kiểm tra nếu tên đã tồn tại
    const existingPermissionName = await Permission.findOne({ name });
    if (existingPermissionName) {
      return res.status(400).json({
        success: false,
        message: 'Tên quyền đã tồn tại'
      });
    }
    
    // Tạo quyền mới
    const permission = new Permission({
      name,
      description,
      code,
      category
    });
    
    await permission.save();
    
    res.status(201).json({
      success: true,
      data: permission,
      message: 'Tạo quyền thành công'
    });
  } catch (error) {
    console.error('Error in createPermission:', error);
    res.status(500).json({
      success: false,
      message: 'Không thể tạo quyền',
      error: error.message
    });
  }
};

// Cập nhật quyền
exports.updatePermission = async (req, res) => {
  try {
    const { name, description, category } = req.body;
    
    // Tìm quyền
    const permission = await Permission.findById(req.params.id);
    if (!permission) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy quyền'
      });
    }
    
    // Kiểm tra nếu tên đã tồn tại (và không phải là quyền hiện tại)
    if (name && name !== permission.name) {
      const existingPermission = await Permission.findOne({ name, _id: { $ne: permission._id } });
      if (existingPermission) {
        return res.status(400).json({
          success: false,
          message: 'Tên quyền đã tồn tại'
        });
      }
      permission.name = name;
    }
    
    // Cập nhật thông tin quyền
    if (description) permission.description = description;
    if (category) permission.category = category;
    
    await permission.save();
    
    res.status(200).json({
      success: true,
      data: permission,
      message: 'Cập nhật quyền thành công'
    });
  } catch (error) {
    console.error('Error in updatePermission:', error);
    res.status(500).json({
      success: false,
      message: 'Không thể cập nhật quyền',
      error: error.message
    });
  }
};

// Xóa quyền
exports.deletePermission = async (req, res) => {
  try {
    const permission = await Permission.findById(req.params.id);
    
    if (!permission) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy quyền'
      });
    }
    
    await permission.remove();
    
    res.status(200).json({
      success: true,
      message: 'Xóa quyền thành công'
    });
  } catch (error) {
    console.error('Error in deletePermission:', error);
    res.status(500).json({
      success: false,
      message: 'Không thể xóa quyền',
      error: error.message
    });
  }
}; 