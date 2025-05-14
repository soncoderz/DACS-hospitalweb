const mongoose = require('mongoose');

/**
 * Hàm kết nối đến MongoDB
 * @param {Function} callback - Hàm callback được gọi sau khi kết nối thành công
 * @returns {Promise<mongoose.Connection>} - Kết nối Mongoose
 */
const connectDB = async (callback) => {
  try {
    // Lấy URI từ biến môi trường hoặc dùng giá trị mặc định
    const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/hospital';
    
    // Cấu hình kết nối Mongoose
    const conn = await mongoose.connect(mongoURI);
    
    console.log(`MongoDB Connected: ${conn.connection.host}`);
    
    // Gọi callback nếu được cung cấp
    if (typeof callback === 'function') {
      callback();
    }
    
    return conn;
  } catch (error) {
    console.error(`Error connecting to MongoDB: ${error.message}`);
    process.exit(1);
  }
};

/**
 * Đóng kết nối MongoDB
 * @returns {Promise<void>}
 */
const disconnectDB = async () => {
  try {
    await mongoose.disconnect();
    console.log('MongoDB connection closed');
  } catch (error) {
    console.error(`Error closing MongoDB connection: ${error.message}`);
    process.exit(1);
  }
};

module.exports = {
  connectDB,
  disconnectDB
}; 