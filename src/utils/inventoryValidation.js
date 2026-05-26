/**
 * Comprehensive Inventory Validation Utilities
 * Handles all validation, error checking, and edge cases for inventory operations
 */

// Validation error types
export const VALIDATION_ERRORS = {
  REQUIRED_FIELD: 'REQUIRED_FIELD',
  INVALID_NUMBER: 'INVALID_NUMBER',
  NEGATIVE_NUMBER: 'NEGATIVE_NUMBER',
  INSUFFICIENT_STOCK: 'INSUFFICIENT_STOCK',
  DUPLICATE_ENTRY: 'DUPLICATE_ENTRY',
  INVALID_DATE: 'INVALID_DATE',
  FUTURE_DATE: 'FUTURE_DATE',
  INVALID_STATUS: 'INVALID_STATUS',
  PRODUCT_NOT_FOUND: 'PRODUCT_NOT_FOUND',
  SHEET_NOT_FOUND: 'SHEET_NOT_FOUND',
  NETWORK_ERROR: 'NETWORK_ERROR',
  UNKNOWN_ERROR: 'UNKNOWN_ERROR'
};

// Validation error messages
export const VALIDATION_MESSAGES = {
  [VALIDATION_ERRORS.REQUIRED_FIELD]: 'This field is required',
  [VALIDATION_ERRORS.INVALID_NUMBER]: 'Please enter a valid number',
  [VALIDATION_ERRORS.NEGATIVE_NUMBER]: 'Value cannot be negative',
  [VALIDATION_ERRORS.INSUFFICIENT_STOCK]: 'Insufficient stock available',
  [VALIDATION_ERRORS.DUPLICATE_ENTRY]: 'This entry already exists',
  [VALIDATION_ERRORS.INVALID_DATE]: 'Please enter a valid date',
  [VALIDATION_ERRORS.FUTURE_DATE]: 'Date cannot be in the future',
  [VALIDATION_ERRORS.INVALID_STATUS]: 'Invalid status selected',
  [VALIDATION_ERRORS.PRODUCT_NOT_FOUND]: 'Product not found in inventory',
  [VALIDATION_ERRORS.SHEET_NOT_FOUND]: 'Required sheet not found',
  [VALIDATION_ERRORS.NETWORK_ERROR]: 'Network error occurred',
  [VALIDATION_ERRORS.UNKNOWN_ERROR]: 'An unexpected error occurred'
};

/**
 * Generic validation result class
 */
export class ValidationResult {
  constructor(isValid = true, errors = [], warnings = []) {
    this.isValid = isValid;
    this.errors = errors;
    this.warnings = warnings;
  }

  addError(field, type, message) {
    this.errors.push({ field, type, message });
    this.isValid = false;
  }

  addWarning(field, message) {
    this.warnings.push({ field, message });
  }

  getFirstError() {
    return this.errors.length > 0 ? this.errors[0] : null;
  }

  getAllErrors() {
    return this.errors;
  }

  hasErrors() {
    return this.errors.length > 0;
  }

  hasWarnings() {
    return this.warnings.length > 0;
  }
}

/**
 * Field validation functions
 */
export const fieldValidators = {
  /**
   * Validate required fields
   */
  required: (value, fieldName) => {
    if (!value || (typeof value === 'string' && value.trim() === '')) {
      return {
        isValid: false,
        error: {
          field: fieldName,
          type: VALIDATION_ERRORS.REQUIRED_FIELD,
          message: `${fieldName} is required`
        }
      };
    }
    return { isValid: true };
  },

  /**
   * Validate numeric values
   */
  number: (value, fieldName, options = {}) => {
    const { min = 0, max = Infinity, allowZero = true, allowNegative = false } = options;
    
    if (value === null || value === undefined || value === '') {
      return {
        isValid: false,
        error: {
          field: fieldName,
          type: VALIDATION_ERRORS.REQUIRED_FIELD,
          message: `${fieldName} is required`
        }
      };
    }

    const numValue = parseFloat(value);
    if (isNaN(numValue)) {
      return {
        isValid: false,
        error: {
          field: fieldName,
          type: VALIDATION_ERRORS.INVALID_NUMBER,
          message: `${fieldName} must be a valid number`
        }
      };
    }

    if (!allowZero && numValue === 0) {
      return {
        isValid: false,
        error: {
          field: fieldName,
          type: VALIDATION_ERRORS.INVALID_NUMBER,
          message: `${fieldName} must be greater than 0`
        }
      };
    }

    if (!allowNegative && numValue < 0) {
      return {
        isValid: false,
        error: {
          field: fieldName,
          type: VALIDATION_ERRORS.NEGATIVE_NUMBER,
          message: `${fieldName} cannot be negative`
        }
      };
    }

    if (numValue < min || numValue > max) {
      return {
        isValid: false,
        error: {
          field: fieldName,
          type: VALIDATION_ERRORS.INVALID_NUMBER,
          message: `${fieldName} must be between ${min} and ${max}`
        }
      };
    }

    return { isValid: true, value: numValue };
  },

  /**
   * Validate dates
   */
  date: (value, fieldName, options = {}) => {
    const { allowFuture = true, minDate = null, maxDate = null } = options;
    
    if (!value) {
      return {
        isValid: false,
        error: {
          field: fieldName,
          type: VALIDATION_ERRORS.REQUIRED_FIELD,
          message: `${fieldName} is required`
        }
      };
    }

    const dateValue = new Date(value);
    if (isNaN(dateValue.getTime())) {
      return {
        isValid: false,
        error: {
          field: fieldName,
          type: VALIDATION_ERRORS.INVALID_DATE,
          message: `${fieldName} must be a valid date`
        }
      };
    }

    const today = new Date();
    today.setHours(23, 59, 59, 999); // End of today

    if (!allowFuture && dateValue > today) {
      return {
        isValid: false,
        error: {
          field: fieldName,
          type: VALIDATION_ERRORS.FUTURE_DATE,
          message: `${fieldName} cannot be in the future`
        }
      };
    }

    if (minDate && dateValue < new Date(minDate)) {
      return {
        isValid: false,
        error: {
          field: fieldName,
          type: VALIDATION_ERRORS.INVALID_DATE,
          message: `${fieldName} cannot be before ${new Date(minDate).toLocaleDateString()}`
        }
      };
    }

    if (maxDate && dateValue > new Date(maxDate)) {
      return {
        isValid: false,
        error: {
          field: fieldName,
          type: VALIDATION_ERRORS.INVALID_DATE,
          message: `${fieldName} cannot be after ${new Date(maxDate).toLocaleDateString()}`
        }
      };
    }

    return { isValid: true, value: dateValue.toISOString().split('T')[0] };
  },

  /**
   * Validate status values
   */
  status: (value, fieldName, allowedStatuses = ['Pending', 'Completed', 'Cancelled']) => {
    if (!value) {
      return {
        isValid: false,
        error: {
          field: fieldName,
          type: VALIDATION_ERRORS.REQUIRED_FIELD,
          message: `${fieldName} is required`
        }
      };
    }

    if (!allowedStatuses.includes(value)) {
      return {
        isValid: false,
        error: {
          field: fieldName,
          type: VALIDATION_ERRORS.INVALID_STATUS,
          message: `${fieldName} must be one of: ${allowedStatuses.join(', ')}`
        }
      };
    }

    return { isValid: true };
  },

  /**
   * Validate product code format
   */
  productCode: (value, fieldName) => {
    if (!value || value.trim() === '') {
      return {
        isValid: false,
        error: {
          field: fieldName,
          type: VALIDATION_ERRORS.REQUIRED_FIELD,
          message: `${fieldName} is required`
        }
      };
    }

    // Basic format validation (alphanumeric with possible special characters)
    const productCodeRegex = /^[A-Za-z0-9\-_\.]+$/;
    if (!productCodeRegex.test(value.trim())) {
      return {
        isValid: false,
        error: {
          field: fieldName,
          type: VALIDATION_ERRORS.INVALID_NUMBER,
          message: `${fieldName} contains invalid characters`
        }
      };
    }

    return { isValid: true, value: value.trim() };
  }
};

/**
 * Inventory-specific validation functions
 */
export const inventoryValidators = {
  /**
   * Validate material inward entry
   */
  validateMaterialInward: (formData, stockData = []) => {
    const result = new ValidationResult();

    // Required fields validation
    const requiredFields = ['Date', 'Product Code', 'Product Name', 'Quantity', 'Unit', 'Supplier'];
    requiredFields.forEach(field => {
      const validation = fieldValidators.required(formData[field], field);
      if (!validation.isValid) {
        result.addError(validation.error.field, validation.error.type, validation.error.message);
      }
    });

    // Date validation
    const dateValidation = fieldValidators.date(formData.Date, 'Date', { allowFuture: false });
    if (!dateValidation.isValid) {
      result.addError(dateValidation.error.field, dateValidation.error.type, dateValidation.error.message);
    }

    // Quantity validation
    const quantityValidation = fieldValidators.number(formData.Quantity, 'Quantity', { 
      min: 0.01, 
      allowZero: false, 
      allowNegative: false 
    });
    if (!quantityValidation.isValid) {
      result.addError(quantityValidation.error.field, quantityValidation.error.type, quantityValidation.error.message);
    }

    // Status validation
    if (formData.Status) {
      const statusValidation = fieldValidators.status(formData.Status, 'Status');
      if (!statusValidation.isValid) {
        result.addError(statusValidation.error.field, statusValidation.error.type, statusValidation.error.message);
      }
    }

    // Product code validation
    const productCodeValidation = fieldValidators.productCode(formData['Product Code'], 'Product Code');
    if (!productCodeValidation.isValid) {
      result.addError(productCodeValidation.error.field, productCodeValidation.error.type, productCodeValidation.error.message);
    }

    // Check for duplicate entries (same date, product code, supplier)
    if (stockData.length > 0) {
      const duplicate = stockData.find(entry => 
        entry.Date === formData.Date &&
        entry['Product Code'] === formData['Product Code'] &&
        entry.Supplier === formData.Supplier
      );
      
      if (duplicate) {
        result.addError('entry', VALIDATION_ERRORS.DUPLICATE_ENTRY, 
          'An entry with the same date, product code, and supplier already exists');
      }
    }

    return result;
  },

  /**
   * Validate material issue entry
   */
  validateMaterialIssue: (formData, stockData = [], currentStock = {}) => {
    const result = new ValidationResult();

    // Required fields validation
    const requiredFields = ['Date', 'itemCode', 'itemName', 'Quantity', 'Unit', 'Issued To'];
    requiredFields.forEach(field => {
      const validation = fieldValidators.required(formData[field], field);
      if (!validation.isValid) {
        result.addError(validation.error.field, validation.error.type, validation.error.message);
      }
    });

    // Date validation
    const dateValidation = fieldValidators.date(formData.Date, 'Date', { allowFuture: false });
    if (!dateValidation.isValid) {
      result.addError(dateValidation.error.field, dateValidation.error.type, dateValidation.error.message);
    }

    // Quantity validation
    const quantityValidation = fieldValidators.number(formData.Quantity, 'Quantity', { 
      min: 0.01, 
      allowZero: false, 
      allowNegative: false 
    });
    if (!quantityValidation.isValid) {
      result.addError(quantityValidation.error.field, quantityValidation.error.type, quantityValidation.error.message);
    }

    // Stock availability validation (only for Completed status)
    if (formData.Status === 'Completed' && currentStock[formData.itemCode] !== undefined) {
      const availableStock = parseFloat(currentStock[formData.itemCode]) || 0;
      const requestedQuantity = parseFloat(formData.Quantity) || 0;
      
      if (requestedQuantity > availableStock) {
        result.addError('Quantity', VALIDATION_ERRORS.INSUFFICIENT_STOCK, 
          `Insufficient stock! Available: ${availableStock}, Requested: ${requestedQuantity}`);
      }
    }

    // Status validation
    if (formData.Status) {
      const statusValidation = fieldValidators.status(formData.Status, 'Status');
      if (!statusValidation.isValid) {
        result.addError(statusValidation.error.field, statusValidation.error.type, statusValidation.error.message);
      }
    }

    return result;
  },

  /**
   * Validate FG material inward entry
   */
  validateFGMaterialInward: (formData, fgStockData = []) => {
    const result = new ValidationResult();

    // Required fields validation
    const requiredFields = ['Date', 'Product Code', 'Product Name', 'Quantity', 'Unit', 'Supplier'];
    requiredFields.forEach(field => {
      const validation = fieldValidators.required(formData[field], field);
      if (!validation.isValid) {
        result.addError(validation.error.field, validation.error.type, validation.error.message);
      }
    });

    // Date validation
    const dateValidation = fieldValidators.date(formData.Date, 'Date', { allowFuture: false });
    if (!dateValidation.isValid) {
      result.addError(dateValidation.error.field, dateValidation.error.type, dateValidation.error.message);
    }

    // Quantity validation
    const quantityValidation = fieldValidators.number(formData.Quantity, 'Quantity', { 
      min: 0.01, 
      allowZero: false, 
      allowNegative: false 
    });
    if (!quantityValidation.isValid) {
      result.addError(quantityValidation.error.field, quantityValidation.error.type, quantityValidation.error.message);
    }

    // Product code validation
    const productCodeValidation = fieldValidators.productCode(formData['Product Code'], 'Product Code');
    if (!productCodeValidation.isValid) {
      result.addError(productCodeValidation.error.field, productCodeValidation.error.type, productCodeValidation.error.message);
    }

    // Check if product exists in FG Stock
    const productExists = fgStockData.find(item => item['Product Code'] === formData['Product Code']);
    if (!productExists) {
      result.addError('Product Code', VALIDATION_ERRORS.PRODUCT_NOT_FOUND, 
        'Product not found in FG Stock. Please add it to FG Stock first.');
    }

    return result;
  },

  /**
   * Validate FG material outward entry
   */
  validateFGMaterialOutward: (formData, fgStockData = []) => {
    const result = new ValidationResult();

    // Required fields validation
    const requiredFields = ['Date', 'Product Code', 'Product Name', 'Quantity'];
    requiredFields.forEach(field => {
      const validation = fieldValidators.required(formData[field], field);
      if (!validation.isValid) {
        result.addError(validation.error.field, validation.error.type, validation.error.message);
      }
    });

    // Date validation
    const dateValidation = fieldValidators.date(formData.Date, 'Date', { allowFuture: false });
    if (!dateValidation.isValid) {
      result.addError(dateValidation.error.field, dateValidation.error.type, dateValidation.error.message);
    }

    // Quantity validation
    const quantityValidation = fieldValidators.number(formData.Quantity, 'Quantity', { 
      min: 0.01, 
      allowZero: false, 
      allowNegative: false 
    });
    if (!quantityValidation.isValid) {
      result.addError(quantityValidation.error.field, quantityValidation.error.type, quantityValidation.error.message);
    }

    // Product code validation
    const productCodeValidation = fieldValidators.productCode(formData['Product Code'], 'Product Code');
    if (!productCodeValidation.isValid) {
      result.addError(productCodeValidation.error.field, productCodeValidation.error.type, productCodeValidation.error.message);
    }

    // Check if product exists in FG Stock
    const productExists = fgStockData.find(item => item['Product Code'] === formData['Product Code']);
    if (!productExists) {
      result.addError('Product Code', VALIDATION_ERRORS.PRODUCT_NOT_FOUND, 
        'Product not found in FG Stock. Please add it to FG Stock first.');
    }

    // Stock availability validation (only for Completed status)
    if (formData.Status === 'Completed' && productExists) {
      const availableStock = parseFloat(productExists['Current Stock']) || 0;
      const requestedQuantity = parseFloat(formData.Quantity) || 0;
      
      if (requestedQuantity > availableStock) {
        result.addError('Quantity', VALIDATION_ERRORS.INSUFFICIENT_STOCK, 
          `Insufficient stock! Available: ${availableStock}, Requested: ${requestedQuantity}`);
      }
    }

    // Status validation
    if (formData.Status) {
      const statusValidation = fieldValidators.status(formData.Status, 'Status');
      if (!statusValidation.isValid) {
        result.addError(statusValidation.error.field, statusValidation.error.type, statusValidation.error.message);
      }
    }

    return result;
  }
};

/**
 * Error handling utilities
 */
export const errorHandlers = {
  /**
   * Handle API errors with user-friendly messages
   */
  handleApiError: (error, operation = 'operation') => {
    console.error(`API Error during ${operation}:`, error);
    
    if (error.response) {
      // Server responded with error status
      const status = error.response.status;
      const message = error.response.data?.message || error.response.statusText;
      
      switch (status) {
        case 400:
          return {
            type: VALIDATION_ERRORS.INVALID_NUMBER,
            message: `Bad request: ${message || 'Invalid data provided'}`
          };
        case 401:
          return {
            type: VALIDATION_ERRORS.NETWORK_ERROR,
            message: 'Authentication required. Please log in again.'
          };
        case 403:
          return {
            type: VALIDATION_ERRORS.NETWORK_ERROR,
            message: 'Access denied. You do not have permission to perform this action.'
          };
        case 404:
          return {
            type: VALIDATION_ERRORS.SHEET_NOT_FOUND,
            message: 'Required resource not found. Please check your setup.'
          };
        case 500:
          return {
            type: VALIDATION_ERRORS.NETWORK_ERROR,
            message: 'Server error occurred. Please try again later.'
          };
        default:
          return {
            type: VALIDATION_ERRORS.NETWORK_ERROR,
            message: `Server error (${status}): ${message || 'Unknown error'}`
          };
      }
    } else if (error.request) {
      // Network error
      return {
        type: VALIDATION_ERRORS.NETWORK_ERROR,
        message: 'Network error. Please check your internet connection and try again.'
      };
    } else {
      // Other error
      return {
        type: VALIDATION_ERRORS.UNKNOWN_ERROR,
        message: error.message || 'An unexpected error occurred'
      };
    }
  },

  /**
   * Handle sheet service errors
   */
  handleSheetError: (error, sheetName, operation) => {
    console.error(`Sheet Error for ${sheetName} during ${operation}:`, error);
    
    if (error.message.includes('does not exist')) {
      return {
        type: VALIDATION_ERRORS.SHEET_NOT_FOUND,
        message: `Sheet "${sheetName}" not found. Please initialize the sheet first.`
      };
    }
    
    if (error.message.includes('access token')) {
      return {
        type: VALIDATION_ERRORS.NETWORK_ERROR,
        message: 'Authentication expired. Please refresh the page and log in again.'
      };
    }
    
    return errorHandlers.handleApiError(error, `${operation} on ${sheetName}`);
  }
};

/**
 * Edge case handlers
 */
export const edgeCaseHandlers = {
  /**
   * Handle empty or null data gracefully
   */
  handleEmptyData: (data, defaultValue = []) => {
    if (!data || (Array.isArray(data) && data.length === 0)) {
      return defaultValue;
    }
    return data;
  },

  /**
   * Handle concurrent stock updates
   */
  handleConcurrentStockUpdate: async (stockUpdateFunction, retries = 3) => {
    for (let i = 0; i < retries; i++) {
      try {
        return await stockUpdateFunction();
      } catch (error) {
        if (i === retries - 1) throw error;
        
        // Wait before retry (exponential backoff)
        await new Promise(resolve => setTimeout(resolve, Math.pow(2, i) * 1000));
      }
    }
  },

  /**
   * Handle large datasets with pagination
   */
  handleLargeDataset: (data, pageSize = 100) => {
    if (!Array.isArray(data)) return { pages: [], totalPages: 0 };
    
    const totalPages = Math.ceil(data.length / pageSize);
    const pages = [];
    
    for (let i = 0; i < totalPages; i++) {
      const start = i * pageSize;
      const end = start + pageSize;
      pages.push(data.slice(start, end));
    }
    
    return { pages, totalPages };
  },

  /**
   * Handle date edge cases
   */
  handleDateEdgeCases: (date) => {
    if (!date) return new Date().toISOString().split('T')[0];
    
    const dateObj = new Date(date);
    if (isNaN(dateObj.getTime())) {
      return new Date().toISOString().split('T')[0];
    }
    
    return dateObj.toISOString().split('T')[0];
  },

  /**
   * Handle numeric edge cases
   */
  handleNumericEdgeCases: (value, defaultValue = 0) => {
    if (value === null || value === undefined || value === '') {
      return defaultValue;
    }
    
    const numValue = parseFloat(value);
    if (isNaN(numValue)) {
      return defaultValue;
    }
    
    return numValue;
  }
};

export default {
  VALIDATION_ERRORS,
  VALIDATION_MESSAGES,
  ValidationResult,
  fieldValidators,
  inventoryValidators,
  errorHandlers,
  edgeCaseHandlers
};
