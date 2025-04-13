const Role = require('../models/Role');
const Permission = require('../models/Permission');

// Lấy danh sách tất cả vai trò
exports.getAllRoles = async (req, res) => {
  try {
    const roles = await Role.find().populate('permissions');
    
    res.status(200).json({
      success: true,
      count: roles.length,
      data: roles
    });
  } catch (error) {
    console.error('Error in getAllRoles:', error);
    res.status(500).json({
      success: false,
      message: 'Không thể lấy danh sách vai trò',
      error: error.message
    });
  }
};

// Lấy thông tin chi tiết vai trò
exports.getRoleById = async (req, res) => {
  try {
    const role = await Role.findById(req.params.id).populate('permissions');
    
    if (!role) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy vai trò'
      });
    }
    
    res.status(200).json({
      success: true,
      data: role
    });
  } catch (error) {
    console.error('Error in getRoleById:', error);
    res.status(500).json({
      success: false,
      message: 'Không thể lấy thông tin vai trò',
      error: error.message
    });
  }
};

// Tạo vai trò mới
exports.createRole = async (req, res) => {
  try {
    const { name, description, code, permissions, isDefault } = req.body;
    
    // Kiểm tra nếu code đã tồn tại
    const existingRole = await Role.findOne({ code });
    if (existingRole) {
      return res.status(400).json({
        success: false,
        message: 'Mã vai trò đã tồn tại'
      });
    }
    
    // Kiểm tra nếu tên đã tồn tại
    const existingRoleName = await Role.findOne({ name });
    if (existingRoleName) {
      return res.status(400).json({
        success: false,
        message: 'Tên vai trò đã tồn tại'
      });
    }
    
    // Tạo vai trò mới
    const role = new Role({
      name,
      description,
      code,
      permissions,
      isDefault: isDefault || false
    });
    
    await role.save();
    
    res.status(201).json({
      success: true,
      data: role,
      message: 'Tạo vai trò thành công'
    });
  } catch (error) {
    console.error('Error in createRole:', error);
    res.status(500).json({
      success: false,
      message: 'Không thể tạo vai trò',
      error: error.message
    });
  }
};

// Cập nhật vai trò
exports.updateRole = async (req, res) => {
  try {
    const { name, description, permissions, isDefault } = req.body;
    
    // Tìm vai trò
    const role = await Role.findById(req.params.id);
    if (!role) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy vai trò'
      });
    }
    
    // Kiểm tra nếu tên đã tồn tại (và không phải là vai trò hiện tại)
    if (name && name !== role.name) {
      const existingRole = await Role.findOne({ name, _id: { $ne: role._id } });
      if (existingRole) {
        return res.status(400).json({
          success: false,
          message: 'Tên vai trò đã tồn tại'
        });
      }
      role.name = name;
    }
    
    // Cập nhật thông tin vai trò
    if (description) role.description = description;
    if (permissions) role.permissions = permissions;
    if (isDefault !== undefined) role.isDefault = isDefault;
    
    await role.save();
    
    res.status(200).json({
      success: true,
      data: role,
      message: 'Cập nhật vai trò thành công'
    });
  } catch (error) {
    console.error('Error in updateRole:', error);
    res.status(500).json({
      success: false,
      message: 'Không thể cập nhật vai trò',
      error: error.message
    });
  }
};

// Xóa vai trò
exports.deleteRole = async (req, res) => {
  try {
    const role = await Role.findById(req.params.id);
    
    if (!role) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy vai trò'
      });
    }
    
    // Kiểm tra nếu là vai trò mặc định
    if (role.isDefault) {
      return res.status(400).json({
        success: false,
        message: 'Không thể xóa vai trò mặc định'
      });
    }
    
    await role.remove();
    
    res.status(200).json({
      success: true,
      message: 'Xóa vai trò thành công'
    });
  } catch (error) {
    console.error('Error in deleteRole:', error);
    res.status(500).json({
      success: false,
      message: 'Không thể xóa vai trò',
      error: error.message
    });
  }
}; 