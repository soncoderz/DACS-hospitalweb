/**
 * Utility functions for handling images in the application
 */

// Check if environment variable is set, otherwise use an empty string
const API_URL = import.meta.env.VITE_API_URL || '';

/**
 * Returns the complete image URL with proper fallback for different entity types
 * @param {string} imageUrl - The image URL from the API
 * @param {string} type - The type of entity (specialty, doctor, service, hospital)
 * @returns {string} - The complete image URL or fallback
 */
export const getImageUrl = (imageUrl, type = 'default') => {
  // If no image URL is provided, return the fallback
  if (!imageUrl) {
    return getFallbackImage(type);
  }
  
  // If image URL already starts with http(s), use it as is
  if (imageUrl.startsWith('http')) {
    return imageUrl;
  }
  
  // Otherwise, prepend the API URL
  return `${API_URL}${imageUrl}`;
};

/**
 * Returns a fallback image for different entity types
 * @param {string} type - The type of entity (specialty, doctor, service, hospital)
 * @returns {string} - The fallback image URL
 */
export const getFallbackImage = (type) => {
  switch (type.toLowerCase()) {
    case 'specialty':
    case 'specialties':
      return '/avatars/default-specialty.png';
    case 'doctor':
    case 'doctors':
      return '/avatars/default-avatar.png';
    case 'service':
    case 'services':
      return '/avatars/default-service.png';
    case 'hospital':
    case 'hospitals':
    case 'branch':
    case 'branches':
      return '/avatars/default-hospital.png';
    default:
      return '/avatars/default-avatar.png';
  }
};

/**
 * Image onError handler to set a fallback image
 * @param {Event} event - The error event
 * @param {string} type - The type of entity (specialty, doctor, service, hospital)
 */
export const handleImageError = (event, type = 'default') => {
  event.target.onerror = null; // Prevent infinite error loops
  event.target.src = getFallbackImage(type);
}; 