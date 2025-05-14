/**
 * Helper utility functions for navigation
 */

/**
 * Gets the home page route for a user based on role
 * @param {Object} user - User data with role
 * @returns {string} The home route
 */
export const getHomeRoute = (user) => {
  if (!user) return '/';
  
  // Kiểm tra cả hai trường roleType và role
  const isAdmin = user.roleType === 'admin' || user.role === 'admin';
  const isDoctor = user.roleType === 'doctor' || user.role === 'doctor';
  
  if (isAdmin) return '/admin/dashboard';
  if (isDoctor) return '/doctor/dashboard';
  return '/';
};

/**
 * Navigate to home page after login based on role
 * @param {Object} user - User data with role
 * @param {Function} navigate - React Router's navigate function
 */
export const navigateToHome = (user, navigate) => {
  const route = getHomeRoute(user);
  navigate(route);
};

/**
 * Navigate based on user role
 * @param {Object} user - User data
 * @param {Function} navigate - React Router's navigate function
 * @param {string} fallbackPath - Fallback path if redirect is needed
 */
export const navigateByRole = (user, navigate, fallbackPath = '/') => {
  if (!user) {
    navigate(fallbackPath);
    return;
  }
  
  const userRole = user.roleType || user.role;
  
  switch (userRole) {
    case 'doctor':
      navigate('/doctor/dashboard');
      break;
    case 'admin':
      navigate('/admin/dashboard');
      break;
    default:
      navigate(fallbackPath);
  }
}; 