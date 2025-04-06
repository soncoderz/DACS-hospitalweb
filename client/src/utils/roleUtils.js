/**
 * Helper utility functions for navigation
 */

/**
 * Gets the home page route for a user
 * @returns {string} The home route
 */
export const getHomeRoute = () => {
  return '/';
};

/**
 * Navigate to home page after login
 * @param {Function} navigate - React Router's navigate function
 */
export const navigateToHome = (navigate) => {
  navigate('/');
};

/**
 * Navigate based on user role - simplified to just go to home for all roles
 * @param {Object} user - User data
 * @param {Function} navigate - React Router's navigate function
 * @param {string} fallbackPath - Fallback path if needed
 */
export const navigateByRole = (user, navigate, fallbackPath = '/') => {
  // Go to home page for all users
  navigate('/');
}; 