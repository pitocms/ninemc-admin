/**
 * Utility functions for handling Decimal values from Prisma
 */

/**
 * Converts a value to a string, handling Decimal objects
 * @param {any} value - The value to convert
 * @param {string} defaultValue - Default value if conversion fails
 * @returns {string} - The converted string value
 */
export const formatDecimal = (value, defaultValue = '0') => {
    if (value === null || value === undefined) return defaultValue;
    
    // If it's already a string or number, return as string
    if (typeof value === 'string' || typeof value === 'number') {
      return value.toString();
    }
    
    // If it's a Decimal object (has toString method)
    if (typeof value === 'object' && value.toString && typeof value.toString === 'function') {
      return value.toString();
    }
    
    return defaultValue;
  };
  
  /**
   * Formats a decimal value as currency
   * @param {any} value - The value to format
   * @param {string} currency - Currency code (default: 'JPY')
   * @returns {string} - Formatted currency string
   */
  export const formatCurrency = (value, currency = 'JPY') => {
    // Handle null/undefined/empty values
    if ((value === null || value === undefined || value === '') && value !== 0) {
      return '-';
    }
    
    const amount = typeof value === 'number' ? value : parseFloat(formatDecimal(value, '0'));
    
    if (currency === 'JPY') {
      return `¥${Number(amount).toLocaleString('ja-JP', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
    }
    
    // For crypto currencies (USDT, USDC), show with appropriate decimal places
    if (currency === 'USDT' || currency === 'USDC') {
      const numAmount = Number(amount);
      // Show up to 6 decimal places, but remove trailing zeros
      const formatted = numAmount.toLocaleString('en-US', { 
        minimumFractionDigits: 0, 
        maximumFractionDigits: 6 
      });
      return `${formatted} ${currency}`;
    }
    
    // Fallback for other currencies
    return `${Number(amount).toLocaleString('en-US')} ${currency}`;
  };