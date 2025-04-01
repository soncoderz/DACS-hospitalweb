const mongoose = require('mongoose');

const statSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: [
      'daily_appointments',
      'monthly_appointments',
      'daily_revenue',
      'monthly_revenue',
      'doctor_performance',
      'service_usage',
      'user_activity',
      'hospital_performance'
    ],
    required: [true, 'Loại thống kê là bắt buộc']
  },
  date: {
    type: Date,
    required: [true, 'Ngày thống kê là bắt buộc']
  },
  hospitalId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Hospital',
    default: null
  },
  doctorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Doctor',
    default: null
  },
  serviceId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Service',
    default: null
  },
  metrics: {
    type: mongoose.Schema.Types.Mixed,
    required: [true, 'Dữ liệu thống kê là bắt buộc']
  },
  lastUpdated: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Index cho truy vấn thống kê
statSchema.index({ type: 1, date: 1 });
statSchema.index({ type: 1, hospitalId: 1, date: 1 });
statSchema.index({ type: 1, doctorId: 1, date: 1 });
statSchema.index({ type: 1, serviceId: 1, date: 1 });

// Phương thức tĩnh để cập nhật hoặc tạo mới thống kê
statSchema.statics.upsertStats = async function(type, date, filter, metrics) {
  const query = { type, date, ...filter };
  
  const update = {
    $set: { metrics, lastUpdated: new Date() }
  };
  
  const options = {
    upsert: true,
    new: true,
    setDefaultsOnInsert: true
  };
  
  return this.findOneAndUpdate(query, update, options);
};

// Phương thức tĩnh để lấy thống kê trong khoảng thời gian
statSchema.statics.getStatsByDateRange = function(type, startDate, endDate, filter = {}) {
  return this.find({
    type,
    date: { $gte: startDate, $lte: endDate },
    ...filter
  }).sort({ date: 1 });
};

// Phương thức tĩnh để lấy tổng hợp thống kê
statSchema.statics.aggregateStats = async function(type, field, startDate, endDate, filter = {}) {
  const matchQuery = {
    type,
    date: { $gte: startDate, $lte: endDate },
    ...filter
  };
  
  // Tạo projection cho các trường metrics
  const projection = {};
  field.forEach(f => {
    projection[`metrics.${f}`] = 1;
  });
  
  return this.aggregate([
    { $match: matchQuery },
    { $project: { date: 1, ...projection } }
  ]);
};

// Phương thức tĩnh để lấy thống kê mới nhất
statSchema.statics.getLatestStats = function(type, filter = {}) {
  return this.findOne({
    type,
    ...filter
  }).sort({ date: -1 });
};

const Stat = mongoose.model('Stat', statSchema);

module.exports = Stat; 