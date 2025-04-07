/**
 * Format a number amount to XION currency display format
 * @param amount - The amount to format (can be number or string)
 * @returns Formatted currency string
 */
export function formatCurrency(amount: number | string): string {
  try {
    // Convert amount to number if it's a string
    const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
    
    // Handle NaN or invalid values
    if (isNaN(numAmount)) {
      console.warn("Invalid amount provided to formatCurrency:", amount);
      return "0 XION";
    }
    
    // Format the number with 6 decimal places for microXION
    const formattedAmount = (numAmount / 1_000_000).toLocaleString('en-US', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 6,
    });
    
    return `${formattedAmount} XION`;
  } catch (error) {
    console.error("Error in formatCurrency:", error);
    return "0 XION";
  }
}

/**
 * Format an address for display by truncating the middle
 * @param address - The full address string
 * @returns Formatted address string
 */
export function formatAddress(address: string): string {
  if (!address || address.length < 15) return address;
  return `${address.substring(0, 8)}...${address.substring(address.length - 6)}`;
}

/**
 * Format a date safely for display, with a fallback for invalid dates
 * @param dateInput - ISO string, timestamp, or Date object
 * @param format - Format to use (short, medium, long)
 * @returns Formatted date string
 */
export function formatDate(dateInput: string | number | Date, format: 'short' | 'medium' | 'long' = 'medium'): string {
  try {
    // Convert input to Date object
    const date = dateInput instanceof Date ? dateInput : new Date(dateInput);
    
    // Check if date is valid
    if (isNaN(date.getTime())) {
      console.warn("Invalid date provided to formatDate:", dateInput);
      return 'Invalid date';
    }
    
    // Format options
    let options: Intl.DateTimeFormatOptions;
    
    switch (format) {
      case 'short':
        options = { month: 'short', day: 'numeric' };
        break;
      case 'long':
        options = { 
          weekday: 'long', 
          year: 'numeric', 
          month: 'long', 
          day: 'numeric', 
          hour: '2-digit', 
          minute: '2-digit' 
        };
        break;
      case 'medium':
      default:
        options = { 
          year: 'numeric', 
          month: 'short', 
          day: 'numeric' 
        };
    }
    
    return new Intl.DateTimeFormat('en-US', options).format(date);
  } catch (error) {
    console.error("Error in formatDate:", error);
    return 'Invalid date';
  }
} 