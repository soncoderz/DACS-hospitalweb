/**
 * Error handler utility functions for the application
 */

/**
 * Async function wrapper to catch errors and pass them to the error handler
 * This eliminates the need for try/catch blocks in controller functions
 * @param {Function} fn - The async controller function to wrap
 * @returns {Function} - Express middleware function that handles errors
 */
exports.catchAsync = fn => {
  return (req, res, next) => {
    fn(req, res, next).catch(err => next(err));
  };
};

/**
 * Global error handler middleware
 * @param {Error} err - The error object
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
exports.globalErrorHandler = (err, req, res, next) => {
  err.statusCode = err.statusCode || 500;
  err.status = err.status || 'error';

  // Log error for debugging in development
  console.error('ERROR 💥:', err);

  // Send error response
  res.status(err.statusCode).json({
    success: false,
    status: err.status,
    message: err.message,
    error: process.env.NODE_ENV === 'development' ? err : undefined,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
  });
};

/**
 * Handle specific operational errors (like validation errors)
 * @param {Error} err - The error to handle
 * @returns {Error} The formatted error
 */
exports.handleOperationalError = (err) => {
  // Handle Mongoose validation errors
  if (err.name === 'ValidationError') {
    const errors = Object.values(err.errors).map(val => val.message);
    const message = `Dữ liệu không hợp lệ: ${errors.join('. ')}`;
    return new AppError(message, 400);
  }
  
  // Handle duplicate key errors
  if (err.code === 11000) {
    const value = err.errmsg.match(/(["'])(\\?.)*?\1/)[0];
    const message = `Dữ liệu đã tồn tại: ${value}. Vui lòng sử dụng giá trị khác.`;
    return new AppError(message, 400);
  }
  
  // Handle cast errors (like invalid ID format)
  if (err.name === 'CastError') {
    const message = `ID không hợp lệ: ${err.value}`;
    return new AppError(message, 400);
  }
  
  // Handle JWT errors
  if (err.name === 'JsonWebTokenError') {
    return new AppError('Token không hợp lệ. Vui lòng đăng nhập lại!', 401);
  }
  
  if (err.name === 'TokenExpiredError') {
    return new AppError('Token đã hết hạn. Vui lòng đăng nhập lại!', 401);
  }
  
  return err;
};

// Require the AppError class from another file to avoid circular dependencies
const AppError = require('./appError'); 