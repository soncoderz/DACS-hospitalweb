/**
 * Class đại diện cho một Response lỗi
 * @extends Error
 */
class ErrorResponse extends Error {
  /**
   * Tạo một ErrorResponse
   * @param {string} message - Thông báo lỗi
   * @param {number} statusCode - Mã HTTP status
   */
  constructor(message, statusCode) {
    super(message);
    this.statusCode = statusCode;
    this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
    this.isOperational = true;

    Error.captureStackTrace(this, this.constructor);
  }
}

module.exports = ErrorResponse; 