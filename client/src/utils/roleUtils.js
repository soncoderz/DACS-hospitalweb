/**
 * Role-based utility functions for handling navigation and permissions
 */

/**
 * Gets the home page route for a user based on their role
 * @param {Object} user - The user object containing role information
 * @returns {string} The appropriate home route for the user's role
 */
export const getHomeRouteForRole = (user) => {
  if (!user) return '/login';
  
  // Get role from user object
  const role = user.roleType;
  
  // Return appropriate home route based on role
  switch (role) {
    case 'admin':
      return '/admin/dashboard';
    case 'doctor':
      return '/doctor/dashboard';
    case 'user':
    default:
      return '/';
  }
};

/**
 * Checks if a user has permission to access a specific route
 * @param {Object} user - The user object containing role information
 * @param {string} routeRole - The role required for the route
 * @returns {boolean} Whether user has permission to access the route
 */
export const hasPermission = (user, routeRole) => {
  if (!user) return false;
  
  const userRole = user.roleType;
  
  // Admin has access to all routes
  if (userRole === 'admin') return true;
  
  // Doctor can access doctor and user routes
  if (userRole === 'doctor' && (routeRole === 'doctor' || routeRole === 'user')) {
    return true;
  }
  
  // Regular user can only access user routes
  if (userRole === 'user' && routeRole === 'user') {
    return true;
  }
  
  return false;
};

/**
 * Navigate to appropriate page after login based on user role
 * @param {Object} user - The user object
 * @param {Function} navigate - React Router's navigate function
 * @param {string} defaultPath - Default path to navigate to if unable to determine
 */
export const navigateByRole = (user, navigate, defaultPath = '/') => {
  if (!user) {
    navigate('/login');
    return;
  }
  
  const homePath = getHomeRouteForRole(user);
  navigate(homePath);
}; 