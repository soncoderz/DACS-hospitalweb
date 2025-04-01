const mongoose = require('mongoose');

const promotionSchema = new mongoose.Schema({
  code: {
    type: String,
    required: [true, 'Mã khuyến mãi là bắt buộc'],
    unique: true,
    trim: true,
    uppercase: true
  },
  description: {
    type: String,
    required: [true, 'Mô tả khuyến mãi là bắt buộc'],
    trim: true
  },
  discountType: {
    type: String,
    enum: ['fixed', 'percentage'],
    required: [true, 'Loại giảm giá là bắt buộc']
  },
  discountValue: {
    type: Number,
    required: [true, 'Giá trị giảm giá là bắt buộc'],
    min: [0, 'Giá trị giảm giá không thể âm']
  },
  minSpend: {
    type: Number,
    default: 0,
    min: [0, 'Mức chi tiêu tối thiểu không thể âm']
  },
  maxDiscount: {
    type: Number,
    default: null
  },
  startDate: {
    type: Date,
    default: Date.now
  },
  endDate: {
    type: Date,
    required: [true, 'Ngày kết thúc là bắt buộc']
  },
  isActive: {
    type: Boolean,
    default: true
  },
  usageLimit: {
    type: Number,
    default: null
  },
  usedCount: {
    type: Number,
    default: 0
  },
  applicableServices: {
    type: [String],
    default: ['all']
  },
  applicableHospitals: {
    type: [String],
    default: ['all']
  },
  forNewUsersOnly: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

// Index cho các trường tìm kiếm thường xuyên
promotionSchema.index({ code: 1 });
promotionSchema.index({ isActive: 1 });
promotionSchema.index({ startDate: 1, endDate: 1 });

// Phương thức kiểm tra khuyến mãi có hiệu lực hay không
promotionSchema.methods.isValid = function() {
  const now = new Date();
  return (
    this.isActive &&
    now >= this.startDate &&
    now <= this.endDate &&
    (this.usageLimit === null || this.usedCount < this.usageLimit)
  );
};

// Phương thức áp dụng khuyến mãi
promotionSchema.methods.apply = function(amount, serviceId, hospitalId, isNewUser) {
  // Kiểm tra khuyến mãi có hiệu lực không
  if (!this.isValid()) {
    return { success: false, message: 'Khuyến mãi không hợp lệ hoặc đã hết hạn' };
  }

  // Kiểm tra mức chi tiêu tối thiểu
  if (amount < this.minSpend) {
    return {
      success: false,
      message: `Đơn hàng cần tối thiểu ${this.minSpend.toLocaleString('vi-VN')} VND để áp dụng mã này`
    };
  }

  // Kiểm tra giới hạn người dùng mới
  if (this.forNewUsersOnly && !isNewUser) {
    return { success: false, message: 'Mã này chỉ áp dụng cho người dùng mới' };
  }

  // Kiểm tra dịch vụ áp dụng
  if (!this.applicableServices.includes('all') && serviceId && !this.applicableServices.includes(serviceId)) {
    return { success: false, message: 'Mã không áp dụng cho dịch vụ này' };
  }

  // Kiểm tra bệnh viện áp dụng
  if (!this.applicableHospitals.includes('all') && hospitalId && !this.applicableHospitals.includes(hospitalId)) {
    return { success: false, message: 'Mã không áp dụng cho bệnh viện này' };
  }

  // Tính toán số tiền giảm
  let discountAmount = 0;
  if (this.discountType === 'fixed') {
    discountAmount = this.discountValue;
  } else {
    // Percentage discount
    discountAmount = Math.round(amount * (this.discountValue / 100));
  }

  // Áp dụng giới hạn giảm giá tối đa nếu có
  if (this.maxDiscount !== null && discountAmount > this.maxDiscount) {
    discountAmount = this.maxDiscount;
  }

  return {
    success: true,
    discountAmount,
    finalAmount: amount - discountAmount
  };
};

// Phương thức tăng số lần sử dụng
promotionSchema.methods.increaseUsedCount = function() {
  this.usedCount += 1;
  return this.save();
};

const Promotion = mongoose.model('Promotion', promotionSchema);

module.exports = Promotion; 