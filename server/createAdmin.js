require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// Kết nối đến MongoDB
mongoose.connect(process.env.MONGODB_URI)
  .then(async () => {
    console.log('Connected to MongoDB');
    try {
      // Import models
      const Role = require('./models/Role');
      const User = require('./models/User');

      console.log('Models loaded');

      // Tạo hoặc tìm role admin
      const adminRole = await Role.findOneAndUpdate(
        { code: 'admin' }, 
        { 
          name: 'Admin', 
          code: 'admin', 
          description: 'Full system access', 
          active: true 
        }, 
        { upsert: true, new: true }
      );

      console.log('Admin role created/found:', adminRole);

      // Hash mật khẩu thủ công
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash('Password123', salt);
      console.log('Password hashed manually');

      // Tạo hoặc tìm user admin
      const adminUser = await User.findOneAndUpdate(
        { email: 'admin@congson.com' },
        {
          fullName: 'Administrator',
          email: 'admin@congson.com',
          phoneNumber: '0123456789',
          passwordHash: hashedPassword, // Sử dụng mật khẩu đã được hash
          dateOfBirth: new Date('1990-01-01'),
          gender: 'other',
          address: 'Hospital Address',
          role: adminRole._id,
          roleType: 'admin',
          isVerified: true
        },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );

      console.log('Admin user created/found:', adminUser);
      console.log('Login with:');
      console.log('- Email: admin@congson.com');
      console.log('- Password: Password123');

      // Đóng kết nối và kết thúc
      await mongoose.connection.close();
      console.log('MongoDB connection closed');
      console.log('Admin account setup completed successfully');
      process.exit(0);
    } catch (error) {
      console.error('Error setting up admin account:', error);
      await mongoose.connection.close();
      process.exit(1);
    }
  })
  .catch(err => {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  }); 