/**
 * Backward Planning Utility
 * Calculates due dates for each production stage working backwards from dispatch date
 * Updated to exclude holidays and Sundays in calculations
 */

import config from '../config/config';
import { subtractWorkingDays } from './dateRestrictions';

/**
 * Calculate due dates for all stages based on dispatch date
 * @param {string|Date} dispatchDate - The target dispatch date (D)
 * @param {string} orderType - 'CABLE_ONLY' or 'POWER_CORD'
 * @param {boolean} useWorkingDays - Whether to exclude holidays/Sundays (default: true)
 * @param {boolean} isUrgentDispatch - Whether this is an urgent dispatch (skips 5-6 day delay)
 * @returns {Object} Object containing due dates for each stage
 */
export const calculateStageDueDates = (dispatchDate, orderType = 'POWER_CORD', useWorkingDays = true, isUrgentDispatch = false) => {
  const D = new Date(dispatchDate);
  
  // Set time to end of day for dispatch date
  D.setHours(23, 59, 59, 999);
  
  // Helper function to subtract days (working days or calendar days)
  const subtractDays = (date, days) => {
    if (useWorkingDays) {
      // Use working days calculation (excludes holidays and Sundays)
      const workingDate = subtractWorkingDays(date, days);
      workingDate.setHours(23, 59, 59, 999);
      return workingDate.toISOString();
    } else {
      // Use calendar days (old behavior)
      const newDate = new Date(date);
      newDate.setDate(newDate.getDate() - days);
      newDate.setHours(23, 59, 59, 999);
      return newDate.toISOString();
    }
  };
  
  // For urgent dispatch, set all production dates to dispatch date (same day)
  if (isUrgentDispatch) {
    return {
      DispatchDate: D.toISOString(),
      FGSectionDueDate: D.toISOString(), // Same day
      MouldingDueDate: D.toISOString(), // Same day
      Store2DueDate: D.toISOString(), // Same day
      CableProductionDueDate: D.toISOString(), // Same day
      Store1DueDate: D.toISOString(), // Same day
      useWorkingDays: useWorkingDays,
      isUrgentDispatch: true // Include this flag for reference
    };
  }
  
  // Calculate due dates working backwards from dispatch date (normal flow)
  // FG Section: D-1 (1 working day before dispatch)
  const fgSectionDueDate = subtractDays(D, 1);
  
  // Moulding: D-2 (2 working days before dispatch)
  const mouldingDueDate = subtractDays(D, 2);
  
  // Store 2: D-3 (3 working days before dispatch)
  const store2DueDate = subtractDays(D, 3);
  
  // Cable Production: D-4 (4 working days before dispatch)
  const cableProductionDueDate = subtractDays(D, 4);
  
  // Store 1: D-5 (5 working days before dispatch)
  const store1DueDate = subtractDays(D, 5);
  
  return {
    DispatchDate: D.toISOString(),
    FGSectionDueDate: fgSectionDueDate,
    MouldingDueDate: mouldingDueDate,
    Store2DueDate: store2DueDate,
    CableProductionDueDate: cableProductionDueDate,
    Store1DueDate: store1DueDate,
    useWorkingDays: useWorkingDays // Include this flag for reference
  };
};

/**
 * Get the due date for a specific stage based on dispatch date
 * @param {string|Date} dispatchDate - The target dispatch date
 * @param {string} status - The status code (e.g., config.statusCodes.STORE1)
 * @param {string} orderType - 'CABLE_ONLY' or 'POWER_CORD'
 * @returns {string} ISO date string for the stage's due date
 */
export const getDueDateForStage = (dispatchDate, status, orderType = 'POWER_CORD') => {
  const dueDates = calculateStageDueDates(dispatchDate, orderType);
  
  switch (status) {
    case config.statusCodes.STORE1:
      return dueDates.Store1DueDate;
    case config.statusCodes.CABLE_PRODUCTION:
      return dueDates.CableProductionDueDate;
    case config.statusCodes.STORE2:
      return dueDates.Store2DueDate;
    case config.statusCodes.MOULDING:
      return dueDates.MouldingDueDate;
    case config.statusCodes.FG_SECTION:
      return dueDates.FGSectionDueDate;
    case config.statusCodes.DISPATCH:
      return dueDates.DispatchDate;
    default:
      return null;
  }
};

/**
 * Format dispatch date for display
 * @param {string|Date} date - Date to format
 * @returns {string} Formatted date string
 */
export const formatDispatchDate = (date) => {
  if (!date) return '';
  const d = new Date(date);
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  return `${day}/${month}/${year}`;
};

/**
 * Get stage name for display
 * @param {string} status - Status code
 * @returns {string} Display name for the stage
 */
export const getStageDisplayName = (status) => {
  const stageNames = {
    [config.statusCodes.STORE1]: 'Store 1',
    [config.statusCodes.CABLE_PRODUCTION]: 'Cable Production',
    [config.statusCodes.STORE2]: 'Store 2',
    [config.statusCodes.MOULDING]: 'Moulding',
    [config.statusCodes.FG_SECTION]: 'FG Section',
    [config.statusCodes.DISPATCH]: 'Dispatch'
  };
  return stageNames[status] || status;
};

/**
 * Get all stage due dates in order for display
 * @param {Object} dueDates - Object containing all due dates
 * @returns {Array} Array of {stage, dueDate, daysBeforeDispatch} objects
 */
export const getOrderedStageDueDates = (dueDates) => {
  if (!dueDates) return [];
  
  return [
    {
      stage: 'Store 1',
      status: config.statusCodes.STORE1,
      dueDate: dueDates.Store1DueDate,
      daysBeforeDispatch: 5,
      label: 'D-5'
    },
    {
      stage: 'Cable Production',
      status: config.statusCodes.CABLE_PRODUCTION,
      dueDate: dueDates.CableProductionDueDate,
      daysBeforeDispatch: 4,
      label: 'D-4'
    },
    {
      stage: 'Store 2',
      status: config.statusCodes.STORE2,
      dueDate: dueDates.Store2DueDate,
      daysBeforeDispatch: 3,
      label: 'D-3'
    },
    {
      stage: 'Moulding',
      status: config.statusCodes.MOULDING,
      dueDate: dueDates.MouldingDueDate,
      daysBeforeDispatch: 2,
      label: 'D-2'
    },
    {
      stage: 'FG Section',
      status: config.statusCodes.FG_SECTION,
      dueDate: dueDates.FGSectionDueDate,
      daysBeforeDispatch: 1,
      label: 'D-1'
    },
    {
      stage: 'Dispatch',
      status: config.statusCodes.DISPATCH,
      dueDate: dueDates.DispatchDate,
      daysBeforeDispatch: 0,
      label: 'D'
    }
  ];
};
