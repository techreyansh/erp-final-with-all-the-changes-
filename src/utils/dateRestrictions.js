/**
 * Utility functions for date restrictions in dispatch management
 * Prevents selection of Sundays and gazetted holidays
 */

// List of gazetted holidays for India (2024-2025)
// Note: This should be updated annually or made configurable
const GAZETTED_HOLIDAYS = [
  // 2024
  '2024-01-26', // Republic Day
  '2024-03-08', // Holi
  '2024-03-25', // Good Friday
  '2024-04-11', // Eid al-Fitr
  '2024-04-14', // Ambedkar Jayanti
  '2024-04-17', // Ram Navami
  '2024-05-01', // Labour Day
  '2024-06-17', // Eid al-Adha
  '2024-08-15', // Independence Day
  '2024-08-26', // Janmashtami
  '2024-10-02', // Gandhi Jayanti
  '2024-10-12', // Dussehra
  '2024-11-01', // Diwali
  '2024-11-15', // Guru Nanak Jayanti
  '2024-12-25', // Christmas Day
  
  // 2025
  '2025-01-26', // Republic Day
  '2025-02-27', // Holi
  '2025-03-31', // Eid al-Fitr
  '2025-04-06', // Ram Navami
  '2025-04-14', // Ambedkar Jayanti
  '2025-04-18', // Good Friday
  '2025-05-01', // Labour Day
  '2025-06-07', // Eid al-Adha
  '2025-08-15', // Independence Day
  '2025-08-15', // Janmashtami (same date as Independence Day)
  '2025-10-02', // Gandhi Jayanti
  '2025-10-12', // Dussehra (corrected date)
  '2025-10-21', // Diwali
  '2025-11-06', // Guru Nanak Jayanti (corrected)
  '2025-12-25', // Christmas Day
];

/** Normalize input to a native Date safely */
const toDate = (input) => {
  if (input instanceof Date) return input;
  if (typeof input === 'string') return new Date(input);
  if (typeof input === 'number') return new Date(input);
  if (input && typeof input.toDate === 'function') return input.toDate();
  return new Date(input);
};

/**
 * Check if a given date is a Sunday
 * @param {string|Date|any} date - Date to check
 * @returns {boolean} - True if the date is a Sunday
 */
export const isSunday = (date) => {
  const dateObj = toDate(date);
  return typeof dateObj?.getDay === 'function' ? dateObj.getDay() === 0 : false; // 0 = Sunday
};

/**
 * Check if a given date is a gazetted holiday
 * @param {string|Date} date - Date to check (YYYY-MM-DD format or Date object)
 * @returns {boolean} - True if the date is a gazetted holiday
 */
export const isGazettedHoliday = (date) => {
  const dateStr = typeof date === 'string' ? date : formatDateForComparison(date);
  return GAZETTED_HOLIDAYS.includes(dateStr);
};

/**
 * Check if a given date is restricted (Sunday or gazetted holiday),
 * honoring company overrides from the CompanyCalendar sheet.
 * @param {string|Date} date - Date to check (YYYY-MM-DD format or Date object)
 * @returns {boolean} - True if the date is restricted
 */
export const isRestrictedDate = (date) => {
  // Lazy import to avoid circular deps on first load
  let getOverrideForDate;
  let loadOverrides;
  try {
    // eslint-disable-next-line global-require
    ({ getOverrideForDate, loadOverrides } = require('../services/companyCalendarService'));
  } catch (e) {
    // Service not available yet; fall back to base rules
  }

  const baseRestricted = isSunday(date) || isGazettedHoliday(date);

  if (getOverrideForDate) {
    try { loadOverrides && loadOverrides(); } catch {}
    const override = getOverrideForDate(date);
    if (override === 'include') return false;
    if (override === 'exclude') return true;
  }

  return baseRestricted;
};

/**
 * Get the reason why a date is restricted
 * @param {string|Date} date - Date to check (YYYY-MM-DD format or Date object)
 * @returns {string|null} - Reason for restriction or null if not restricted
 */
export const getRestrictionReason = (date) => {
  if (isSunday(date)) {
    return 'Sunday';
  }
  if (isGazettedHoliday(date)) {
    return 'Gazetted Holiday';
  }
  return null;
};

/**
 * Get the next available working day (excluding Sundays and holidays)
 * @param {string|Date} fromDate - Starting date (YYYY-MM-DD format or Date object)
 * @returns {Date} - Next available working day
 */
export const getNextWorkingDay = (fromDate) => {
  const date = new Date(fromDate);
  date.setDate(date.getDate() + 1);
  
  while (isRestrictedDate(date)) {
    date.setDate(date.getDate() + 1);
  }
  
  return date;
};

/**
 * Get the previous available working day (excluding Sundays and holidays)
 * @param {string|Date} fromDate - Starting date (YYYY-MM-DD format or Date object)
 * @returns {Date} - Previous available working day
 */
export const getPreviousWorkingDay = (fromDate) => {
  const date = new Date(fromDate);
  date.setDate(date.getDate() - 1);
  
  while (isRestrictedDate(date)) {
    date.setDate(date.getDate() - 1);
  }
  
  return date;
};

/**
 * Format date for comparison (YYYY-MM-DD)
 * @param {Date} date - Date to format
 * @returns {string} - Formatted date string
 */
const formatDateForComparison = (date) => {
  const d = toDate(date);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

/**
 * Get all restricted dates for a given month
 * @param {number} year - Year
 * @param {number} month - Month (0-11)
 * @returns {Array} - Array of restricted dates
 */
export const getRestrictedDatesForMonth = (year, month) => {
  const restrictedDates = [];
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  
  for (let day = 1; day <= daysInMonth; day++) {
    const date = new Date(year, month, day);
    if (isRestrictedDate(date)) {
      restrictedDates.push({
        date: formatDateForComparison(date),
        reason: getRestrictionReason(date)
      });
    }
  }
  
  return restrictedDates;
};

/**
 * Count working days between two dates (excluding Sundays and holidays)
 * @param {string|Date} startDate - Start date
 * @param {string|Date} endDate - End date
 * @returns {number} - Number of working days
 */
export const countWorkingDays = (startDate, endDate) => {
  const start = new Date(startDate);
  const end = new Date(endDate);
  
  // Set to midnight for accurate day counting
  start.setHours(0, 0, 0, 0);
  end.setHours(0, 0, 0, 0);
  
  let workingDays = 0;
  const current = new Date(start);
  
  while (current <= end) {
    if (!isRestrictedDate(current)) {
      workingDays++;
    }
    current.setDate(current.getDate() + 1);
  }
  
  return workingDays;
};

/**
 * Count holidays between two dates (including both Sundays and gazetted holidays)
 * @param {string|Date} startDate - Start date
 * @param {string|Date} endDate - End date
 * @returns {Object} - Object with count and details of holidays
 */
export const countHolidaysBetween = (startDate, endDate) => {
  const start = new Date(startDate);
  const end = new Date(endDate);
  
  // Set to midnight for accurate day counting
  start.setHours(0, 0, 0, 0);
  end.setHours(0, 0, 0, 0);
  
  const holidays = [];
  const current = new Date(start);
  
  while (current <= end) {
    if (isRestrictedDate(current)) {
      holidays.push({
        date: formatDateForComparison(current),
        reason: getRestrictionReason(current)
      });
    }
    current.setDate(current.getDate() + 1);
  }
  
  return {
    count: holidays.length,
    holidays: holidays
  };
};

/**
 * Add working days to a date (skipping Sundays and holidays)
 * @param {string|Date} fromDate - Starting date
 * @param {number} workingDays - Number of working days to add
 * @returns {Date} - Resulting date after adding working days
 */
export const addWorkingDays = (fromDate, workingDays) => {
  const date = new Date(fromDate);
  date.setHours(0, 0, 0, 0);
  
  let daysAdded = 0;
  
  while (daysAdded < workingDays) {
    date.setDate(date.getDate() + 1);
    if (!isRestrictedDate(date)) {
      daysAdded++;
    }
  }
  
  return date;
};

/**
 * Subtract working days from a date (skipping Sundays and holidays)
 * @param {string|Date} fromDate - Starting date
 * @param {number} workingDays - Number of working days to subtract
 * @returns {Date} - Resulting date after subtracting working days
 */
export const subtractWorkingDays = (fromDate, workingDays) => {
  const date = new Date(fromDate);
  date.setHours(0, 0, 0, 0);
  
  let daysSubtracted = 0;
  
  while (daysSubtracted < workingDays) {
    date.setDate(date.getDate() - 1);
    if (!isRestrictedDate(date)) {
      daysSubtracted++;
    }
  }
  
  return date;
};

/**
 * Suggest adjusted dispatch date accounting for holidays in the timeline
 * Special case: If D-5 to D-1 can all be performed on working days, no adjustment needed
 * @param {string|Date} selectedDate - User selected dispatch date
 * @param {string|Date} startDate - Starting date (usually today)
 * @param {string} orderType - 'CABLE_ONLY' or 'POWER_CORD'
 * @param {boolean} isUrgentDispatch - Whether this is an urgent dispatch (skips working days check)
 * @returns {Object} - Suggestion object with adjusted date and details
 */
export const suggestAdjustedDispatchDate = (selectedDate, startDate = new Date(), orderType = 'POWER_CORD', isUrgentDispatch = false) => {
  const selected = new Date(selectedDate);
  const start = new Date(startDate);
  
  selected.setHours(0, 0, 0, 0);
  start.setHours(0, 0, 0, 0);
  
  // For urgent dispatch, skip all holiday and working days checks
  if (isUrgentDispatch) {
    return {
      hasHolidays: false,
      canProceed: true,
      originalDate: selected,
      suggestedDate: selected,
      message: 'Urgent dispatch mode: All production stages will be scheduled on the dispatch date.'
    };
  }
  
  // Calculate the earliest production start date (D-5)
  const requiredWorkingDays = 5;
  const earliestStartDate = subtractWorkingDays(selected, requiredWorkingDays);
  earliestStartDate.setHours(0, 0, 0, 0);
  
  // Check if we have enough time for production
  if (earliestStartDate < start) {
    const daysShort = Math.ceil((start - earliestStartDate) / (1000 * 60 * 60 * 24));
    return {
      hasHolidays: true,
      canProceed: false,
      originalDate: selected,
      suggestedDate: addWorkingDays(selected, daysShort),
      message: `Cannot proceed with this dispatch date. Production requires ${requiredWorkingDays} working days (D-5 to D-1), but you're ${daysShort} day(s) short. Please select a later dispatch date.`
    };
  }
  
  // Count holidays in the timeline
  const holidayInfo = countHolidaysBetween(start, selected);
  
  if (holidayInfo.count === 0) {
    return {
      hasHolidays: false,
      canProceed: true,
      originalDate: selected,
      suggestedDate: selected,
      message: 'No holidays detected in your timeline. All production stages can be scheduled.'
    };
  }
  
  // Even if there are holidays, check if all working days D-5 to D-1 can be performed
  // If earliestStartDate >= start, then we have enough working days
  const canProceedWithHolidays = earliestStartDate >= start;
  
  if (canProceedWithHolidays) {
    // Format holiday details for message
    const holidayDetails = holidayInfo.holidays
      .map(h => `${formatDateDisplay(h.date)} (${h.reason})`)
      .join(', ');
    
    return {
      hasHolidays: true,
      canProceed: true,
      holidayCount: holidayInfo.count,
      holidays: holidayInfo.holidays,
      originalDate: selected,
      suggestedDate: selected,
      message: `${holidayInfo.count} holiday${holidayInfo.count > 1 ? 's' : ''} detected (${holidayDetails}), but all required production stages (D-5 to D-1) can be scheduled on working days. Dispatch can proceed as planned.`
    };
  }
  
  // Calculate suggested date by adding the holiday count to original date
  const suggestedDate = addWorkingDays(selected, holidayInfo.count);
  
  // Format holiday details for message
  const holidayDetails = holidayInfo.holidays
    .map(h => `${formatDateDisplay(h.date)} (${h.reason})`)
    .join(', ');
  
  return {
    hasHolidays: true,
    canProceed: false,
    holidayCount: holidayInfo.count,
    holidays: holidayInfo.holidays,
    originalDate: selected,
    suggestedDate: suggestedDate,
    message: `You selected ${formatDateDisplay(selected)}. There ${holidayInfo.count === 1 ? 'is' : 'are'} ${holidayInfo.count} holiday${holidayInfo.count > 1 ? 's' : ''} in your timeline (${holidayDetails}). Consider selecting ${formatDateDisplay(suggestedDate)} to account for non-working days.`
  };
};

/**
 * Format date for display (DD MMM YYYY)
 * @param {string|Date} date - Date to format
 * @returns {string} - Formatted date string
 */
const formatDateDisplay = (date) => {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  const options = { day: 'numeric', month: 'short', year: 'numeric' };
  return dateObj.toLocaleDateString('en-US', options);
};

/**
 * Validate dispatch date with custom error messages
 * Special case: If dispatch is on a working day, and all required production
 * stages (D-5 to D-1) can be scheduled on working days, allow the dispatch
 * @param {string|Date} date - Date to validate
 * @param {string} orderType - 'CABLE_ONLY' or 'POWER_CORD' (optional)
 * @param {boolean} isUrgentDispatch - Whether this is an urgent dispatch (skips working days check)
 * @returns {Object} - Validation result with isValid and message
 */
export const validateDispatchDate = (date, orderType = 'POWER_CORD', isUrgentDispatch = false) => {
  if (!date) {
    return { isValid: false, message: 'Please select a dispatch date' };
  }
  
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  // Check if date is in the past
  if (dateObj < today) {
    return { isValid: false, message: 'Dispatch date cannot be in the past' };
  }
  
  // For urgent dispatch, skip holiday/restriction checks and working days validation
  if (isUrgentDispatch) {
    return { isValid: true, message: 'Valid urgent dispatch date' };
  }
  
  // Check if dispatch date itself is restricted
  if (isRestrictedDate(date)) {
    const reason = getRestrictionReason(date);
    return { 
      isValid: false, 
      message: `Dispatch not available on ${reason}. Please select a working day.` 
    };
  }
  
  // Special case: Check if all required production stages can be scheduled
  // even if there are holidays in between
  // Calculate required working days (D-5, D-4, D-3, D-2, D-1)
  const requiredWorkingDays = 5;
  const earliestStartDate = subtractWorkingDays(date, requiredWorkingDays);
  
  // If earliest start date is before today, we don't have enough working days
  earliestStartDate.setHours(0, 0, 0, 0);
  if (earliestStartDate < today) {
    const daysShort = Math.ceil((today - earliestStartDate) / (1000 * 60 * 60 * 24));
    return {
      isValid: false,
      message: `Not enough working days for production. Need to start ${daysShort} day(s) earlier. Please select a later dispatch date.`
    };
  }
  
  return { isValid: true, message: 'Valid dispatch date' };
};
