/**
 * Wrapper function for async route handlers to catch errors
 * Eliminates the need for try/catch blocks in route handlers
 * @param {Function} fn - The async route handler function
 * @returns {Function} - Express middleware function
 */
module.exports = fn => {
  return (req, res, next) => {
    fn(req, res, next).catch(next);
  };
}; 