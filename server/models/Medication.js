const mongoose = require('mongoose');

const medicationSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Tên thuốc là bắt buộc'],
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  category: {
    type: String,
    enum: ['pain-relief', 'gastrointestinal', 'antibiotic', 'antiviral', 'antihistamine', 'cardiovascular', 'respiratory', 'neurological', 'other'],
    required: [true, 'Danh mục thuốc là bắt buộc']
  },
  defaultDosage: {
    type: String,
    trim: true
  },
  defaultUsage: {
    type: String,
    trim: true
  },
  defaultDuration: {
    type: String,
    trim: true
  },
  sideEffects: {
    type: String,
    trim: true
  },
  contraindications: {
    type: String,
    trim: true
  },
  manufacturer: {
    type: String,
    trim: true
  },
  // Inventory management fields
  unitType: {
    type: String,
    enum: ['pill', 'bottle', 'package', 'patch', 'cream', 'inhaler', 'injection', 'other'],
    default: 'pill',
    required: [true, 'Loại đơn vị thuốc là bắt buộc']
  },
  unitTypeDisplay: {
    type: String,
    required: [true, 'Tên hiển thị đơn vị thuốc là bắt buộc'],
    default: 'viên'
  },
  stockQuantity: {
    type: Number,
    default: 0,
    min: [0, 'Số lượng không thể âm']
  },
  lowStockThreshold: {
    type: Number,
    default: 10
  },
  isActive: {
    type: Boolean,
    default: true
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
});

// Thêm index để tìm kiếm nhanh hơn
medicationSchema.index({ name: 'text', category: 1 });

// Thêm phương thức static để giảm số lượng thuốc
medicationSchema.statics.reduceStock = async function(medicationId, quantity) {
  const medication = await this.findById(medicationId);
  if (!medication) {
    throw new Error('Không tìm thấy thuốc');
  }
  
  if (medication.stockQuantity < quantity) {
    throw new Error(`Số lượng thuốc không đủ. Hiện chỉ còn ${medication.stockQuantity} ${medication.unitTypeDisplay}.`);
  }
  
  medication.stockQuantity -= quantity;
  return medication.save();
};

const Medication = mongoose.model('Medication', medicationSchema);

module.exports = Medication; 