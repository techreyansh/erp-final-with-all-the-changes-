/**
 * Utility functions for handling combined status and date storage
 */

/**
 * Converts a date to YYYY-MM-DD format without timezone issues
 * @param {string|Date} dateInput - The date to convert
 * @returns {string} Date in YYYY-MM-DD format
 */
export const formatDateForStorage = (dateInput) => {
  if (!dateInput) return null;
  
  let date;
  if (typeof dateInput === 'string') {
    // If it's already in YYYY-MM-DD format, return as is
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateInput)) {
      return dateInput;
    }
    // Parse the string date
    date = new Date(dateInput);
  } else {
    date = dateInput;
  }
  
  // Use local date components to avoid timezone issues
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  
  return `${year}-${month}-${day}`;
};

/**
 * Creates a combined status string with completion date and due date
 * @param {string} status - The status (e.g., 'COMPLETED', 'NEW', 'IN_PROGRESS')
 * @param {string} completionDate - The completion date in YYYY-MM-DD format (optional)
 * @param {string} dueDate - The original due date in YYYY-MM-DD format (optional)
 * @returns {string} Combined status string
 */
export const createStatusWithDate = (status, completionDate = null, dueDate = null) => {
  if (status === 'COMPLETED' && completionDate) {
    return dueDate ? `${status}|${completionDate}|${dueDate}` : `${status}|${completionDate}`;
  }
  if (status !== 'COMPLETED' && dueDate) {
    return `${status}|${dueDate}`;
  }
  return status;
};

/**
 * Parses a combined status string to extract status, completion date, and due date
 * @param {string} statusString - The combined status string
 * @returns {object} Object with status, completionDate, and dueDate properties
 */
export const parseStatusWithDate = (statusString) => {
  if (!statusString) {
    return { status: 'NEW', completionDate: null, dueDate: null };
  }

  if (statusString.includes('|')) {
    const parts = statusString.split('|');
    const status = parts[0] || 'NEW';
    const completionDate = parts[1] || null;
    const dueDate = parts[2] || null;
    
    // For completed tasks: STATUS|COMPLETION_DATE|DUE_DATE
    // For non-completed tasks: STATUS|DUE_DATE
    if (status === 'COMPLETED') {
      return { 
        status, 
        completionDate, 
        dueDate: dueDate || completionDate // If no separate due date, use completion date
      };
    } else {
      return { 
        status, 
        completionDate: null, 
        dueDate: completionDate // For non-completed, the second part is the due date
      };
    }
  }

  return { status: statusString, completionDate: null, dueDate: null };
};

/**
 * Gets just the status part from a combined status string
 * @param {string} statusString - The combined status string
 * @returns {string} Just the status part
 */
export const getStatusOnly = (statusString) => {
  const { status } = parseStatusWithDate(statusString);
  return status;
};

/**
 * Gets the completion date from a combined status string
 * @param {string} statusString - The combined status string
 * @returns {string|null} The completion date or null
 */
export const getCompletionDate = (statusString) => {
  const { completionDate } = parseStatusWithDate(statusString);
  return completionDate;
};

/**
 * Gets the due date from a combined status string
 * @param {string} statusString - The combined status string
 * @returns {string|null} The due date or null
 */
export const getDueDate = (statusString) => {
  const { dueDate } = parseStatusWithDate(statusString);
  return dueDate;
};

/**
 * Formats a completion date for display
 * @param {string} dateString - The date string in YYYY-MM-DD format
 * @returns {string} Formatted date for display
 */
export const formatCompletionDate = (dateString) => {
  if (!dateString) return '';
  
  try {
    const date = new Date(dateString + 'T00:00:00');
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  } catch (error) {
    console.error('Error formatting completion date:', error);
    return dateString;
  }
};

/**
 * Checks if a status indicates completion
 * @param {string} statusString - The status string (may be combined)
 * @returns {boolean} True if the status indicates completion
 */
export const isCompletedStatus = (statusString) => {
  const status = getStatusOnly(statusString);
  return status === 'COMPLETED';
};

/**
 * Updates a status to completed with current date, preserving original due date
 * @param {string} currentStatus - Current status string
 * @param {string} originalDueDate - The original due date to preserve (optional)
 * @returns {string} Updated status with completion date and preserved due date
 */
export const markAsCompletedWithDate = (currentStatus, originalDueDate = null) => {
  const today = formatDateForStorage(new Date()); // YYYY-MM-DD format without timezone issues
  const currentParsed = parseStatusWithDate(currentStatus);
  
  // Preserve the original due date if provided, otherwise use the current due date
  const dueDateToPreserve = originalDueDate || currentParsed.dueDate;
  
  return createStatusWithDate('COMPLETED', today, dueDateToPreserve);
};

/**
 * Updates a status to a new status, preserving due dates when appropriate
 * @param {string} currentStatus - Current status string
 * @param {string} newStatus - New status to set
 * @param {string} newDueDate - New due date (optional)
 * @returns {string} Updated status
 */
export const updateStatus = (currentStatus, newStatus, newDueDate = null) => {
  if (newStatus === 'COMPLETED') {
    const currentParsed = parseStatusWithDate(currentStatus);
    // Use the provided newDueDate if available, otherwise use the current due date
    const dueDateToUse = newDueDate || currentParsed.dueDate;
    return markAsCompletedWithDate(currentStatus, dueDateToUse);
  }
  
  // For non-completed statuses, include due date if provided
  if (newDueDate) {
    return createStatusWithDate(newStatus, null, newDueDate);
  }
  
  return newStatus;
};

/**
 * Sets or updates the due date for a status without changing completion status
 * @param {string} currentStatus - Current status string
 * @param {string} newDueDate - New due date to set
 * @returns {string} Updated status with new due date
 */
export const updateDueDate = (currentStatus, newDueDate) => {
  const parsed = parseStatusWithDate(currentStatus);
  
  if (parsed.status === 'COMPLETED') {
    // For completed tasks, preserve completion date but update due date
    return createStatusWithDate(parsed.status, parsed.completionDate, newDueDate);
  } else {
    // For non-completed tasks, just update the due date
    return createStatusWithDate(parsed.status, null, newDueDate);
  }
};
