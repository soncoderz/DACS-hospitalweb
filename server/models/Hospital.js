const mongoose = require('mongoose');

const addressSchema = new mongoose.Schema({
  street: {
    type: String,
    required: [true, 'Địa chỉ đường là bắt buộc'],
    trim: true
  },
  district: {
    type: String,
    required: [true, 'Quận/Huyện là bắt buộc'],
    trim: true
  },
  city: {
    type: String,
    required: [true, 'Thành phố là bắt buộc'],
    trim: true
  }
});

const specialtySchema = new mongoose.Schema({
  specialtyId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Specialty',
    required: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  }
});

const openingHoursSchema = new mongoose.Schema({
  open: {
    type: String,
    required: true,
    match: [/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Định dạng thời gian không hợp lệ']
  },
  close: {
    type: String,
    required: true,
    match: [/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Định dạng thời gian không hợp lệ']
  }
});

const hospitalSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Tên bệnh viện là bắt buộc'],
    trim: true
  },
  address: {
    type: addressSchema,
    required: true
  },
  phoneNumber: {
    type: String,
    required: [true, 'Số điện thoại là bắt buộc'],
    trim: true,
    match: [/^[0-9]{10,11}$/, 'Số điện thoại không hợp lệ']
  },
  email: {
    type: String,
    required: [true, 'Email là bắt buộc'],
    unique: true,
    trim: true,
    lowercase: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Email không hợp lệ']
  },
  website: {
    type: String,
    trim: true,
    match: [/^(https?:\/\/)?([\da-z.-]+)\.([a-z.]{2,6})([/\w .-]*)*\/?$/, 'URL không hợp lệ']
  },
  description: {
    type: String,
    trim: true
  },
  facilities: [{
    type: String,
    trim: true
  }],
  images: [{
    type: String,
    trim: true
  }],
  specialties: [specialtySchema],
  openingHours: {
    monday: openingHoursSchema,
    tuesday: openingHoursSchema,
    wednesday: openingHoursSchema,
    thursday: openingHoursSchema,
    friday: openingHoursSchema,
    saturday: openingHoursSchema,
    sunday: openingHoursSchema
  },
  isMainBranch: {
    type: Boolean,
    default: true
  },
  parentHospitalId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Hospital',
    default: null
  },
  averageRating: {
    type: Number,
    default: 0,
    min: 0,
    max: 5
  },
  totalRatings: {
    type: Number,
    default: 0,
    min: 0
  }
}, {
  timestamps: true
});

// Phương thức tính toán đánh giá trung bình
hospitalSchema.methods.calculateAverageRating = function(newRating) {
  this.totalRatings += 1;
  this.averageRating = ((this.averageRating * (this.totalRatings - 1)) + newRating) / this.totalRatings;
  return this.averageRating;
};

// Phương thức kiểm tra giờ mở cửa
hospitalSchema.methods.isOpen = function(date) {
  const dayOfWeek = date.getDay();
  const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  const dayName = dayNames[dayOfWeek];
  const hours = this.openingHours[dayName];
  
  if (!hours) return false;
  
  const currentTime = date.getHours() * 60 + date.getMinutes();
  const openTime = hours.open.split(':').map(Number);
  const closeTime = hours.close.split(':').map(Number);
  
  const openMinutes = openTime[0] * 60 + openTime[1];
  const closeMinutes = closeTime[0] * 60 + closeTime[1];
  
  return currentTime >= openMinutes && currentTime <= closeMinutes;
};

const Hospital = mongoose.model('Hospital', hospitalSchema);

module.exports = Hospital; 