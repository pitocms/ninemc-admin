// Utility functions for date formatting

/**
 * Formats a date string or Date object to a locale date string.
 * @param {string|Date} date - The date to format.
 * @param {string} [locale='en-US'] - The locale to use.
 * @param {Object} [options] - Options for toLocaleDateString.
 * @returns {string}
 */
export function formatDate(date, locale = 'en-US', options) {
    if (!date) return 'N/A';
    try {
      let d;
      if (typeof date === 'string') {
        // Handle ISO string dates
        if (date.includes('T') || date.includes('Z')) {
          d = new Date(date);
        } else {
          // Handle other string formats
          d = new Date(date);
        }
      } else if (date instanceof Date) {
        d = date;
      } else {
        // Try to convert other types
        d = new Date(date);
      }
      
      if (isNaN(d.getTime())) {
        console.warn('Invalid date provided to formatDate:', date);
        return 'Invalid date';
      }
      
      return d.toLocaleDateString(locale, options);
    } catch (error) {
      console.warn('Error formatting date:', error, 'Date:', date);
      return 'Invalid date';
    }
  }
  
  /**
   * Formats a date string or Date object to a locale string (date and time).
   * @param {string|Date} date - The date to format.
   * @param {string} [locale='en-US'] - The locale to use.
   * @param {Object} [options] - Options for toLocaleString.
   * @returns {string}
   */
  export function formatDateTime(date, locale = 'en-US', options) {
    if (!date) return 'N/A';
    
    // Handle empty objects or invalid values
    if (typeof date === 'object' && Object.keys(date).length === 0) {
      return 'N/A';
    }
    
    // Handle string representations of empty objects
    if (typeof date === 'string' && (date === '{}' || date === 'null' || date === 'undefined')) {
      return 'N/A';
    }
    
    try {
      let d;
      if (typeof date === 'string') {
        // Handle ISO string dates
        if (date.includes('T') || date.includes('Z')) {
          d = new Date(date);
        } else {
          // Handle other string formats
          d = new Date(date);
        }
      } else if (date instanceof Date) {
        d = date;
      } else {
        // Try to convert other types
        d = new Date(date);
      }
      
      if (isNaN(d.getTime())) {
        console.warn('Invalid date provided to formatDateTime:', date);
        return 'Invalid date';
      }
      
      return d.toLocaleString(locale, options);
    } catch (error) {
      console.warn('Error formatting date:', error, 'Date:', date);
      return 'Invalid date';
    }
  }
  
  /**
   * Returns the color classes for a given user role.
   * @param {string} role
   * @returns {string}
   */
  export function getRoleColor(role) {
    switch (role) {
      case 'SUPER_ADMIN':
        return 'bg-gradient-to-r from-red-500 to-red-600 text-white';
      case 'SYSTEM_USER':
        return 'bg-gradient-to-r from-blue-500 to-blue-600 text-white';
      case 'ORGANIZATION_MANAGER':
        return 'bg-gradient-to-r from-green-500 to-green-600 text-white';
      case 'REVIEWER':
        return 'bg-gradient-to-r from-yellow-500 to-yellow-600 text-white';
      default:
        return 'bg-gradient-to-r from-gray-500 to-gray-600 text-white';
    }
  }
  
  /**
   * Formats a role string (e.g., 'SUPER_ADMIN') to a human-readable string (e.g., 'Super Admin').
   * @param {string} role
   * @returns {string}
   */
  export function formatRole(role) {
    if (!role) return '';
    return role
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
  }
  
  
  /**
   * Formats user level and title for display.
   * @param {number} level - The user level.
   * @param {string} title - The user title.
   * @param {Function} t - Translation function.
   * @returns {string} Formatted level and title string.
   */
  export function formatLevelTitle(level, title, t) {
    if (!title || title === 'NA' || title === '') {
      return `${t("common.level")} ${level || 1}`;
    }
    
    const translatedTitle = t(`admin.users.titles.${title}`);
    
    if (translatedTitle === `admin.users.titles.${title}`) {
      return `${t("common.level")} ${level || 1} (${title})`;
    }
    
    return `${t("common.level")} ${level || 1} (${translatedTitle})`;
  }