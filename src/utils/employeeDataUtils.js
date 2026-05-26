/**
 * Employee Data Management Utilities
 * This module provides utility functions for handling employee data,
 * especially for new employees with no data
 */

/**
 * Creates a default employee profile structure for new employees
 * @param {string} employeeCode - The employee code
 * @returns {Object} Default employee profile
 */
export const createDefaultEmployeeProfile = (employeeCode) => {
  return {
    EmployeeCode: employeeCode,
    EmployeeName: '',
    Email: '',
    Phone: '',
    Department: '',
    Designation: '',
    JoiningDate: '',
    DateOfBirth: '',
    Address: '',
    Status: 'Active',
    EmployeeType: 'Full-time',
    ReportingManager: '',
    SalaryGrade: '',
    HighestQualification: '',
    University: '',
    GraduationYear: '',
    Specialization: '',
    Experience: '',
    Skills: '',
    Certifications: '',
    EmployeeId: '',
    CreatedAt: new Date().toISOString(),
    UpdatedAt: new Date().toISOString(),
    attendance: [],
    performance: [],
    tasks: [],
    stats: {
      totalTasks: 0,
      completedTasks: 0,
      pendingTasks: 0,
      attendanceRate: 0,
      performanceScore: 0
    }
  };
};

/**
 * Creates a default dashboard summary for new employees
 * @returns {Object} Default dashboard summary
 */
export const createDefaultDashboardSummary = () => {
  return {
    tasks: {
      total: 0,
      completed: 0,
      pending: 0,
      inProgress: 0
    },
    attendance: {
      isCheckedIn: false,
      weeklyHours: 0,
      attendanceRate: 0
    },
    notifications: {
      unread: 0,
      recent: []
    }
  };
};

/**
 * Validates if employee data is empty/new
 * @param {Object} employee - Employee data object
 * @returns {boolean} True if employee is new/empty
 */
export const isNewEmployee = (employee) => {
  if (!employee) return true;
  
  // Check if essential fields are empty
  const essentialFields = ['EmployeeName', 'Email', 'Department', 'Designation'];
  return essentialFields.some(field => !employee[field] || employee[field].trim() === '');
};

/**
 * Generates a new employee code
 * @returns {string} New employee code
 */
export const generateEmployeeCode = () => {
  const timestamp = Date.now();
  const randomNum = Math.floor(Math.random() * 100);
  return `EMP${String(timestamp).slice(-6)}${String(randomNum).padStart(2, '0')}`;
};

/**
 * Sanitizes and validates employee data before saving
 * @param {Object} employeeData - Raw employee data
 * @returns {Object} Sanitized employee data
 */
export const sanitizeEmployeeData = (employeeData) => {
  const sanitized = { ...employeeData };
  
  // Trim string fields
  const stringFields = [
    'EmployeeName', 'Email', 'Phone', 'Address', 'Department', 
    'Designation', 'ReportingManager', 'SalaryGrade', 'HighestQualification',
    'University', 'Specialization', 'Experience', 'Skills', 'Certifications'
  ];
  
  stringFields.forEach(field => {
    if (sanitized[field] && typeof sanitized[field] === 'string') {
      sanitized[field] = sanitized[field].trim();
    }
  });
  
  // Ensure required fields have defaults
  if (!sanitized.Status) sanitized.Status = 'Active';
  if (!sanitized.EmployeeType) sanitized.EmployeeType = 'Full-time';
  if (!sanitized.EmployeeCode) sanitized.EmployeeCode = generateEmployeeCode();
  if (!sanitized.EmployeeId) sanitized.EmployeeId = sanitized.EmployeeCode;
  
  // Set timestamps
  if (!sanitized.CreatedAt) sanitized.CreatedAt = new Date().toISOString();
  sanitized.UpdatedAt = new Date().toISOString();
  
  return sanitized;
};

/**
 * Formats employee data for display
 * @param {Object} employee - Employee data
 * @returns {Object} Formatted employee data
 */
export const formatEmployeeForDisplay = (employee) => {
  if (!employee) return null;
  
  return {
    ...employee,
    formattedJoiningDate: employee.JoiningDate 
      ? new Date(employee.JoiningDate).toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        })
      : 'Not specified',
    formattedDateOfBirth: employee.DateOfBirth
      ? new Date(employee.DateOfBirth).toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        })
      : 'Not specified',
    displayName: employee.EmployeeName || 'Employee',
    initials: employee.EmployeeName 
      ? employee.EmployeeName.split(' ').map(n => n[0]).join('').toUpperCase()
      : 'E'
  };
};

/**
 * Creates sample task data for new employees
 * @param {string} employeeCode - Employee code
 * @returns {Array} Sample tasks
 */
export const createSampleTasks = (employeeCode) => {
  return [
    {
      TaskId: `TASK${Date.now()}1`,
      TaskTitle: 'Complete Onboarding Process',
      TaskDescription: 'Go through the company onboarding checklist and complete all required forms.',
      AssignedTo: employeeCode,
      AssignedBy: 'HR Team',
      Priority: 'High',
      Status: 'Pending',
      StartDate: new Date().toISOString().split('T')[0],
      DueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 7 days from now
      EstimatedHours: 4,
      ActualHours: 0,
      Progress: 0,
      Category: 'Onboarding',
      Project: 'Employee Integration',
      Notes: 'Welcome to the team! Please complete this by your first week.',
      CreatedAt: new Date().toISOString(),
      UpdatedAt: new Date().toISOString()
    },
    {
      TaskId: `TASK${Date.now()}2`,
      TaskTitle: 'Setup Workspace & Tools',
      TaskDescription: 'Set up your workstation and familiarize yourself with company tools and systems.',
      AssignedTo: employeeCode,
      AssignedBy: 'IT Team',
      Priority: 'Medium',
      Status: 'Pending',
      StartDate: new Date().toISOString().split('T')[0],
      DueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 3 days from now
      EstimatedHours: 2,
      ActualHours: 0,
      Progress: 0,
      Category: 'Setup',
      Project: 'Employee Integration',
      Notes: 'Contact IT if you need assistance with any tools.',
      CreatedAt: new Date().toISOString(),
      UpdatedAt: new Date().toISOString()
    }
  ];
};

/**
 * Creates sample notification for new employees
 * @param {string} employeeCode - Employee code
 * @returns {Array} Sample notifications
 */
export const createWelcomeNotifications = (employeeCode) => {
  return [
    {
      Id: `NOTIF${Date.now()}1`,
      EmployeeCode: employeeCode,
      Title: 'Welcome to the Team!',
      Message: 'Welcome aboard! We\'re excited to have you join our team. Check your tasks to get started.',
      Type: 'Welcome',
      Priority: 'High',
      Read: false,
      ActionRequired: true,
      ActionUrl: '#/tasks',
      CreatedBy: 'System',
      CreatedAt: new Date().toISOString()
    },
    {
      Id: `NOTIF${Date.now()}2`,
      EmployeeCode: employeeCode,
      Title: 'Complete Your Profile',
      Message: 'Please complete your employee profile to help us serve you better.',
      Type: 'Action Required',
      Priority: 'Medium',
      Read: false,
      ActionRequired: true,
      ActionUrl: '#/profile',
      CreatedBy: 'HR Team',
      CreatedAt: new Date().toISOString()
    }
  ];
};

/**
 * Checks if employee data needs initialization
 * @param {Object} employee - Employee data
 * @returns {boolean} True if initialization is needed
 */
export const needsDataInitialization = (employee) => {
  if (!employee) return true;
  
  // Check if basic profile data exists
  const hasBasicData = employee.EmployeeName && employee.Email && employee.Department;
  
  // Check if any supplementary data exists
  const hasSupplementaryData = 
    (employee.attendance && employee.attendance.length > 0) ||
    (employee.performance && employee.performance.length > 0) ||
    (employee.tasks && employee.tasks.length > 0);
  
  return !hasBasicData || !hasSupplementaryData;
};

/**
 * Default error handler for employee operations
 * @param {Error} error - The error object
 * @param {string} operation - The operation being performed
 * @returns {Object} Formatted error response
 */
export const handleEmployeeError = (error, operation = 'employee operation') => {
  console.error(`Error in ${operation}:`, error);
  
  return {
    success: false,
    error: {
      message: error.message || `Failed to complete ${operation}`,
      code: error.code || 'UNKNOWN_ERROR',
      details: error.details || null
    },
    data: null
  };
};

/**
 * Success response formatter for employee operations
 * @param {any} data - The success data
 * @param {string} message - Success message
 * @returns {Object} Formatted success response
 */
export const createSuccessResponse = (data, message = 'Operation completed successfully') => {
  return {
    success: true,
    message,
    data,
    error: null
  };
};
