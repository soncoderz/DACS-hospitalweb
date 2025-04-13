/**
 * Custom error class for application operational errors
 * This helps distinguish between operational errors (expected) and programming errors (bugs)
 */
class AppError extends Error {
  /**
   * Creates a new AppError instance
   * @param {string} message - Error message
   * @param {number} statusCode - HTTP status code (default: 500)
   */
  constructor(message, statusCode = 500) {
    super(message);
    this.statusCode = statusCode;
    this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
    this.isOperational = true;

    // Capture stack trace without this constructor function
    Error.captureStackTrace(this, this.constructor);
  }
}

module.exports = AppError; 