// Format date to readable string
export const formatDate = (dateString) => {
  if (!dateString) return '';
  
  let date = null;
  
  // Handle DD/MM/YYYY format
  if (typeof dateString === 'string' && dateString.includes('/')) {
    const parts = dateString.split('/');
    if (parts.length === 3) {
      const day = parseInt(parts[0], 10);
      const month = parseInt(parts[1], 10) - 1; // Month is 0-indexed
      const year = parseInt(parts[2], 10);
      date = new Date(year, month, day);
      // Validate the date
      if (isNaN(date.getTime())) {
        date = null;
      }
    }
  }
  
  // If not DD/MM/YYYY or parsing failed, try standard Date parsing
  if (!date) {
    date = new Date(dateString);
    // Check if date is valid
    if (isNaN(date.getTime())) {
      return 'N/A';
    }
  }
  
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
};

// Format date with time
export const formatDateTime = (dateString) => {
  if (!dateString) return '';
  
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

// Calculate time difference in hours
export const getHoursDifference = (startDate, endDate) => {
  if (!startDate || !endDate) return 0;
  
  const start = new Date(startDate);
  const end = new Date(endDate);
  
  return Math.abs(end - start) / (1000 * 60 * 60);
};

// Check if a date is overdue
export const isOverdue = (dateString) => {
  if (!dateString) return false;
  
  const dueDate = new Date(dateString);
  const now = new Date();
  
  return dueDate < now;
};

// Get days remaining until due date
export const getDaysRemaining = (dateString) => {
  if (!dateString) return 0;
  
  const dueDate = new Date(dateString);
  const now = new Date();
  
  // If already overdue, return negative days
  if (dueDate < now) {
    return -Math.ceil((now - dueDate) / (1000 * 60 * 60 * 24));
  }
  
  return Math.floor((dueDate - now) / (1000 * 60 * 60 * 24));
};

/**
 * Calculate due date from a starting date, adding days/hours while skipping holidays
 * This is a general-purpose function for all due date calculations in the system
 * @param {string|Date} fromDate - Starting date
 * @param {number} hours - Hours to add (will be converted to working days)
 * @param {boolean} useWorkingDays - Whether to skip Sundays and holidays (default: true)
 * @returns {Date} - Calculated due date
 */
export const calculateDueDate = (fromDate = new Date(), hours = 24, useWorkingDays = true) => {
  if (!useWorkingDays) {
    // Legacy behavior: simple calendar addition
    const dueDate = new Date(fromDate);
    dueDate.setHours(dueDate.getHours() + hours);
    return dueDate;
  }
  
  // Import the working days function
  const { addWorkingDays } = require('./dateRestrictions');
  
  // Convert hours to working days (24 hours = 1 working day)
  const workingDays = Math.ceil(hours / 24);
  
  // Add working days, skipping Sundays and holidays
  const dueDate = addWorkingDays(fromDate, workingDays);
  
  // Set to end of working day
  dueDate.setHours(23, 59, 59, 999);
  
  return dueDate;
};

/**
 * Calculate due date and return as ISO string
 * @param {string|Date} fromDate - Starting date
 * @param {number} hours - Hours to add
 * @param {boolean} useWorkingDays - Whether to skip Sundays and holidays (default: true)
 * @returns {string} - ISO date string
 */
export const calculateDueDateISO = (fromDate = new Date(), hours = 24, useWorkingDays = true) => {
  return calculateDueDate(fromDate, hours, useWorkingDays).toISOString();
}; 