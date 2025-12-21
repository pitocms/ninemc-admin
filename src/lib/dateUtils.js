/**
 * Utility functions for date formatting
 */

/**
 * Formats a date value to a localized string with date and time
 * @param {any} dateValue - The date value to format (Date, string, etc.)
 * @returns {string} - Formatted date string or 'Invalid Date'
 */
export const formatDate = (dateValue) => {
    try {
      let date;
      if (dateValue instanceof Date) {
        date = dateValue;
      } else if (typeof dateValue === 'string') {
        date = new Date(dateValue);
      } else {
        return 'Invalid Date';
      }
      
      if (isNaN(date.getTime())) {
        return 'Invalid Date';
      }
      return date.toLocaleString();
    } catch (error) {
      return 'Invalid Date';
    }
  };
  
  /**
   * Formats a date value to a localized date string (date only)
   * @param {any} dateValue - The date value to format (Date, string, etc.)
   * @returns {string} - Formatted date string or 'Invalid Date'
   */
  export const formatDateOnly = (dateValue) => {
    try {
      let date;
      if (dateValue instanceof Date) {
        date = dateValue;
      } else if (typeof dateValue === 'string') {
        date = new Date(dateValue);
      } else {
        return 'Invalid Date';
      }
      
      if (isNaN(date.getTime())) {
        return 'Invalid Date';
      }
      return date.toLocaleDateString();
    } catch (error) {
      return 'Invalid Date';
    }
  };