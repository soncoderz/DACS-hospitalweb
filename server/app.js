const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/user');
const roleRoutes = require('./routes/role');
const permissionRoutes = require('./routes/permission');
const doctorRoutes = require('./routes/doctor');
const specialtyRoutes = require('./routes/specialty');
const serviceRoutes = require('./routes/service');
const hospitalRoutes = require('./routes/hospital');
const appointmentRoutes = require('./routes/appointmentRoutes');
const paymentRoutes = require('./routes/payment');
const statisticsRoutes = require('./routes/statistics');
const logRoutes = require('./routes/log');
const { Logger } = require('./models/logger');

// Load environment variables
dotenv.config();

// Create Express app
const app = express();

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error('Could not connect to MongoDB', err));

// Middleware
app.use(cors());
app.use(express.json());

// Create logger instance
const logger = new Logger();

// Request logger middleware
app.use(logger.createRequestLogger());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/roles', roleRoutes);
app.use('/api/permissions', permissionRoutes);
app.use('/api/doctors', doctorRoutes);
app.use('/api/specialties', specialtyRoutes);
app.use('/api/services', serviceRoutes);
app.use('/api/hospitals', hospitalRoutes);
app.use('/api/appointments', appointmentRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/statistics', statisticsRoutes);
app.use('/api/logs', logRoutes);

// Error logger middleware
app.use(logger.createErrorLogger());

// Default error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.statusCode || 500).json({
    message: err.message || 'Internal Server Error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

// Start server
const port = process.env.PORT || 5000;
app.listen(port, () => console.log(`Server running on port ${port}`));