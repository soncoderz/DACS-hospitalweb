const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const couponSchema = new Schema(
  {
    code: {
      type: String,
      required: [true, 'Mã giảm giá là bắt buộc'],
      unique: true,
      uppercase: true,
      trim: true
    },
    discountType: {
      type: String,
      required: [true, 'Loại giảm giá là bắt buộc'],
      enum: ['percentage', 'fixed'],
      default: 'percentage'
    },
    discountValue: {
      type: Number,
      required: [true, 'Giá trị giảm giá là bắt buộc'],
      min: [0, 'Giá trị giảm giá không được nhỏ hơn 0']
    },
    maxDiscount: {
      type: Number,
      min: [0, 'Giảm giá tối đa không được nhỏ hơn 0']
    },
    minPurchase: {
      type: Number,
      default: 0,
      min: [0, 'Giá trị mua tối thiểu không được nhỏ hơn 0']
    },
    startDate: {
      type: Date,
      default: Date.now
    },
    endDate: {
      type: Date
    },
    isActive: {
      type: Boolean,
      default: true
    },
    description: {
      type: String,
      default: ''
    },
    usageLimit: {
      type: Number,
      min: [1, 'Giới hạn sử dụng không được nhỏ hơn 1']
    },
    usedCount: {
      type: Number,
      default: 0,
      min: [0, 'Số lần sử dụng không được nhỏ hơn 0']
    },
    applicableServices: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Service'
      }
    ],
    applicableSpecialties: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Specialty'
      }
    ],
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

// Add virtual property to check if coupon is expired
couponSchema.virtual('isExpired').get(function() {
  if (!this.endDate) return false;
  return this.endDate < new Date();
});

// Add virtual property to check if coupon has reached usage limit
couponSchema.virtual('isLimitReached').get(function() {
  if (!this.usageLimit) return false;
  return this.usedCount >= this.usageLimit;
});

// Add virtual property to check if coupon is valid
couponSchema.virtual('isValid').get(function() {
  const now = new Date();
  return (
    this.isActive && 
    (!this.endDate || this.endDate > now) &&
    (this.startDate <= now) &&
    (!this.usageLimit || this.usedCount < this.usageLimit)
  );
});

// Middleware pre-save to ensure code is uppercase and trimmed
couponSchema.pre('save', function(next) {
  if (this.code) {
    this.code = this.code.toUpperCase().trim();
  }
  next();
});

module.exports = mongoose.model('Coupon', couponSchema); 