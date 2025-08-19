/**
 * Utility functions for time formatting and calculations
 */

/**
 * Formats milliseconds into a human-readable time string
 * @param milliseconds - Time in milliseconds
 * @param format - Format type: 'short', 'long', or 'precise'
 * @returns Formatted time string
 */
export function formatTime(milliseconds: number, format: 'short' | 'long' | 'precise' = 'short'): string {
  if (milliseconds < 0) return '0s';
  
  const seconds = Math.floor(milliseconds / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  
  const remainingHours = hours % 24;
  const remainingMinutes = minutes % 60;
  const remainingSeconds = seconds % 60;
  
  switch (format) {
    case 'short':
      if (days > 0) return `${days}d ${remainingHours}h`;
      if (hours > 0) return `${hours}h ${remainingMinutes}m`;
      if (minutes > 0) return `${minutes}m`;
      return `${remainingSeconds}s`;
      
    case 'long':
      const parts: string[] = [];
      if (days > 0) parts.push(`${days} day${days !== 1 ? 's' : ''}`);
      if (remainingHours > 0) parts.push(`${remainingHours} hour${remainingHours !== 1 ? 's' : ''}`);
      if (remainingMinutes > 0) parts.push(`${remainingMinutes} minute${remainingMinutes !== 1 ? 's' : ''}`);
      if (parts.length === 0 && remainingSeconds > 0) {
        parts.push(`${remainingSeconds} second${remainingSeconds !== 1 ? 's' : ''}`);
      }
      return parts.join(', ') || '0 seconds';
      
    case 'precise':
      if (days > 0) return `${days}d ${remainingHours}h ${remainingMinutes}m ${remainingSeconds}s`;
      if (hours > 0) return `${hours}h ${remainingMinutes}m ${remainingSeconds}s`;
      if (minutes > 0) return `${minutes}m ${remainingSeconds}s`;
      return `${remainingSeconds}s`;
      
    default:
      return formatTime(milliseconds, 'short');
  }
}

/**
 * Formats time as hours and minutes (e.g., "2h 30m")
 * @param milliseconds - Time in milliseconds
 * @returns Formatted time string
 */
export function formatHoursMinutes(milliseconds: number): string {
  const minutes = Math.floor(milliseconds / (1000 * 60));
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  
  if (hours > 0) {
    return remainingMinutes > 0 ? `${hours}h ${remainingMinutes}m` : `${hours}h`;
  }
  
  return `${remainingMinutes}m`;
}

/**
 * Calculates percentage of total time
 * @param timeSpent - Time spent on specific item
 * @param totalTime - Total time across all items
 * @returns Percentage as a number (0-100)
 */
export function calculatePercentage(timeSpent: number, totalTime: number): number {
  if (totalTime === 0) return 0;
  return Math.round((timeSpent / totalTime) * 100 * 100) / 100; // Round to 2 decimal places
}

/**
 * Formats a percentage for display
 * @param percentage - Percentage as a number (0-100)
 * @returns Formatted percentage string
 */
export function formatPercentage(percentage: number): string {
  return `${percentage.toFixed(1)}%`;
}

/**
 * Gets the current date in YYYY-MM-DD format
 * @param date - Optional date object, defaults to current date
 * @returns Date string in YYYY-MM-DD format
 */
export function getCurrentDateString(date: Date = new Date()): string {
  return date.toISOString().split('T')[0];
}

/**
 * Gets the start of day timestamp
 * @param date - Optional date object, defaults to current date
 * @returns Timestamp at start of day
 */
export function getStartOfDay(date: Date = new Date()): number {
  const startOfDay = new Date(date);
  startOfDay.setHours(0, 0, 0, 0);
  return startOfDay.getTime();
}

/**
 * Gets the end of day timestamp
 * @param date - Optional date object, defaults to current date
 * @returns Timestamp at end of day
 */
export function getEndOfDay(date: Date = new Date()): number {
  const endOfDay = new Date(date);
  endOfDay.setHours(23, 59, 59, 999);
  return endOfDay.getTime();
}

/**
 * Checks if two dates are on the same day
 * @param date1 - First date
 * @param date2 - Second date
 * @returns True if dates are on the same day
 */
export function isSameDay(date1: Date, date2: Date): boolean {
  return getCurrentDateString(date1) === getCurrentDateString(date2);
}

/**
 * Gets a date range for the past N days
 * @param days - Number of days to go back
 * @returns Array of date strings in YYYY-MM-DD format
 */
export function getDateRange(days: number): string[] {
  const dates: string[] = [];
  const today = new Date();
  
  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    dates.push(getCurrentDateString(date));
  }
  
  return dates;
}

/**
 * Debounces a function call
 * @param func - Function to debounce
 * @param delay - Delay in milliseconds
 * @returns Debounced function
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timeoutId: NodeJS.Timeout;
  
  return (...args: Parameters<T>) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func(...args), delay);
  };
}