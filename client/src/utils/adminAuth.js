/**
 * Utility functions for admin authentication
 */

/**
 * Logs in an admin user
 * @param {Object} adminData - The admin data including token
 */
export const loginAdmin = (adminData) => {
  // Store admin token and data
  localStorage.setItem('adminToken', adminData.token);
  localStorage.setItem('adminData', JSON.stringify(adminData));
};

/**
 * Logs out an admin user
 */
export const logoutAdmin = () => {
  // Remove admin token and data
  localStorage.removeItem('adminToken');
  localStorage.removeItem('adminData');
};

/**
 * Checks if an admin user is logged in
 * @returns {boolean} Whether an admin is logged in
 */
export const isAdminLoggedIn = () => {
  const adminToken = localStorage.getItem('adminToken');
  const adminData = localStorage.getItem('adminData');
  return !!adminToken && !!adminData;
};

/**
 * Gets the admin data from local storage
 * @returns {Object|null} The admin data or null if not logged in
 */
export const getAdminData = () => {
  const adminData = localStorage.getItem('adminData');
  return adminData ? JSON.parse(adminData) : null;
}; 