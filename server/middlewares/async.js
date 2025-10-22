/**
 * Middleware wrapper để xử lý các promise và try/catch trong các controller
 * @param {Function} fn - Hàm async cần được bọc
 * @returns {Function} Middleware function với xử lý lỗi
 */
const asyncHandler = fn => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next);

module.exports = asyncHandler; 