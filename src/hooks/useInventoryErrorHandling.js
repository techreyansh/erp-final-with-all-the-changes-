/**
 * Custom hook for comprehensive inventory error handling
 * Provides consistent error handling patterns across all inventory components
 */

import { useState, useCallback } from 'react';
import { 
  VALIDATION_ERRORS, 
  VALIDATION_MESSAGES, 
  errorHandlers, 
  edgeCaseHandlers 
} from '../utils/inventoryValidation';

export const useInventoryErrorHandling = () => {
  const [errors, setErrors] = useState({});
  const [warnings, setWarnings] = useState({});
  const [loading, setLoading] = useState(false);

  /**
   * Set a field-specific error
   */
  const setFieldError = useCallback((field, error) => {
    setErrors(prev => ({
      ...prev,
      [field]: error
    }));
  }, []);

  /**
   * Clear a field-specific error
   */
  const clearFieldError = useCallback((field) => {
    setErrors(prev => {
      const newErrors = { ...prev };
      delete newErrors[field];
      return newErrors;
    });
  }, []);

  /**
   * Clear all errors
   */
  const clearAllErrors = useCallback(() => {
    setErrors({});
    setWarnings({});
  }, []);

  /**
   * Set a field-specific warning
   */
  const setFieldWarning = useCallback((field, warning) => {
    setWarnings(prev => ({
      ...prev,
      [field]: warning
    }));
  }, []);

  /**
   * Clear a field-specific warning
   */
  const clearFieldWarning = useCallback((field) => {
    setWarnings(prev => {
      const newWarnings = { ...prev };
      delete newWarnings[field];
      return newWarnings;
    });
  }, []);

  /**
   * Handle async operations with error handling
   */
  const handleAsyncOperation = useCallback(async (operation, operationName = 'operation') => {
    setLoading(true);
    clearAllErrors();

    try {
      const result = await operation();
      return { success: true, data: result, error: null };
    } catch (error) {
      console.error(`Error during ${operationName}:`, error);
      
      const handledError = errorHandlers.handleApiError(error, operationName);
      setFieldError('general', handledError.message);
      
      return { success: false, data: null, error: handledError };
    } finally {
      setLoading(false);
    }
  }, [clearAllErrors, setFieldError]);

  /**
   * Handle sheet service operations with error handling
   */
  const handleSheetOperation = useCallback(async (operation, sheetName, operationName) => {
    setLoading(true);
    clearAllErrors();

    try {
      const result = await operation();
      return { success: true, data: result, error: null };
    } catch (error) {
      console.error(`Sheet error during ${operationName}:`, error);
      
      const handledError = errorHandlers.handleSheetError(error, sheetName, operationName);
      setFieldError('general', handledError.message);
      
      return { success: false, data: null, error: handledError };
    } finally {
      setLoading(false);
    }
  }, [clearAllErrors, setFieldError]);

  /**
   * Validate form data and set errors
   */
  const validateFormData = useCallback((validationFunction, formData, additionalData = {}) => {
    clearAllErrors();
    
    try {
      const validationResult = validationFunction(formData, additionalData);
      
      if (!validationResult.isValid) {
        validationResult.errors.forEach(error => {
          setFieldError(error.field, error.message);
        });
        
        validationResult.warnings.forEach(warning => {
          setFieldWarning(warning.field, warning.message);
        });
        
        return false;
      }
      
      return true;
    } catch (error) {
      console.error('Validation error:', error);
      setFieldError('general', 'Validation failed. Please check your input.');
      return false;
    }
  }, [clearAllErrors, setFieldError, setFieldWarning]);

  /**
   * Handle stock update operations with retry logic
   */
  const handleStockUpdate = useCallback(async (updateFunction, retries = 3) => {
    setLoading(true);
    clearFieldError('stock');

    try {
      const result = await edgeCaseHandlers.handleConcurrentStockUpdate(updateFunction, retries);
      return { success: true, data: result, error: null };
    } catch (error) {
      console.error('Stock update error:', error);
      
      const handledError = errorHandlers.handleApiError(error, 'stock update');
      setFieldError('stock', handledError.message);
      
      return { success: false, data: null, error: handledError };
    } finally {
      setLoading(false);
    }
  }, [clearFieldError, setFieldError]);

  /**
   * Handle bulk operations with progress tracking
   */
  const handleBulkOperation = useCallback(async (operations, operationName = 'bulk operation') => {
    setLoading(true);
    clearAllErrors();
    
    const results = [];
    const errors = [];
    
    try {
      for (let i = 0; i < operations.length; i++) {
        try {
          const result = await operations[i]();
          results.push({ success: true, data: result, index: i });
        } catch (error) {
          const handledError = errorHandlers.handleApiError(error, `${operationName} item ${i + 1}`);
          errors.push({ success: false, error: handledError, index: i });
          results.push({ success: false, data: null, error: handledError, index: i });
        }
      }
      
      if (errors.length > 0) {
        setFieldError('bulk', `${errors.length} out of ${operations.length} operations failed`);
      }
      
      return { 
        success: errors.length === 0, 
        results, 
        errors,
        summary: {
          total: operations.length,
          successful: results.filter(r => r.success).length,
          failed: errors.length
        }
      };
    } catch (error) {
      console.error(`Bulk ${operationName} error:`, error);
      const handledError = errorHandlers.handleApiError(error, operationName);
      setFieldError('general', handledError.message);
      
      return { success: false, results, errors: [handledError] };
    } finally {
      setLoading(false);
    }
  }, [clearAllErrors, setFieldError]);

  /**
   * Handle network connectivity issues
   */
  const handleNetworkError = useCallback((error) => {
    if (!navigator.onLine) {
      setFieldError('network', 'No internet connection. Please check your network and try again.');
      return true;
    }
    
    if (error.code === 'NETWORK_ERROR' || error.message.includes('network')) {
      setFieldError('network', 'Network error occurred. Please check your connection and try again.');
      return true;
    }
    
    return false;
  }, [setFieldError]);

  /**
   * Handle authentication errors
   */
  const handleAuthError = useCallback((error) => {
    if (error.response?.status === 401 || error.message.includes('auth') || error.message.includes('token')) {
      setFieldError('auth', 'Authentication expired. Please refresh the page and log in again.');
      return true;
    }
    
    return false;
  }, [setFieldError]);

  /**
   * Get error message for a specific field
   */
  const getFieldError = useCallback((field) => {
    return errors[field] || null;
  }, [errors]);

  /**
   * Get warning message for a specific field
   */
  const getFieldWarning = useCallback((field) => {
    return warnings[field] || null;
  }, [warnings]);

  /**
   * Check if there are any errors
   */
  const hasErrors = useCallback(() => {
    return Object.keys(errors).length > 0;
  }, [errors]);

  /**
   * Check if there are any warnings
   */
  const hasWarnings = useCallback(() => {
    return Object.keys(warnings).length > 0;
  }, [warnings]);

  /**
   * Get all errors as an array
   */
  const getAllErrors = useCallback(() => {
    return Object.entries(errors).map(([field, message]) => ({ field, message }));
  }, [errors]);

  /**
   * Get all warnings as an array
   */
  const getAllWarnings = useCallback(() => {
    return Object.entries(warnings).map(([field, message]) => ({ field, message }));
  }, [warnings]);

  /**
   * Create a snackbar message from errors
   */
  const createSnackbarMessage = useCallback((type = 'error') => {
    if (type === 'error' && hasErrors()) {
      const firstError = Object.values(errors)[0];
      return {
        open: true,
        message: firstError,
        severity: 'error'
      };
    }
    
    if (type === 'warning' && hasWarnings()) {
      const firstWarning = Object.values(warnings)[0];
      return {
        open: true,
        message: firstWarning,
        severity: 'warning'
      };
    }
    
    return null;
  }, [errors, warnings, hasErrors, hasWarnings]);

  return {
    // State
    errors,
    warnings,
    loading,
    
    // Error management
    setFieldError,
    clearFieldError,
    clearAllErrors,
    setFieldWarning,
    clearFieldWarning,
    
    // Operation handlers
    handleAsyncOperation,
    handleSheetOperation,
    handleStockUpdate,
    handleBulkOperation,
    
    // Specific error handlers
    handleNetworkError,
    handleAuthError,
    
    // Validation
    validateFormData,
    
    // Getters
    getFieldError,
    getFieldWarning,
    hasErrors,
    hasWarnings,
    getAllErrors,
    getAllWarnings,
    createSnackbarMessage
  };
};

export default useInventoryErrorHandling;
