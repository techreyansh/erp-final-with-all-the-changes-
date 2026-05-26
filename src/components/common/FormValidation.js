import React, { useState, useEffect } from 'react';

// Validation rules
export const validationRules = {
  required: (value) => {
    if (typeof value === 'string') {
      return value.trim().length > 0;
    }
    return value !== null && value !== undefined && value !== '';
  },
  
  email: (value) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(value);
  },
  
  phone: (value) => {
    const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
    return phoneRegex.test(value.replace(/[\s\-\(\)]/g, ''));
  },
  
  minLength: (min) => (value) => {
    return value && value.length >= min;
  },
  
  maxLength: (max) => (value) => {
    return !value || value.length <= max;
  },
  
  numeric: (value) => {
    return !isNaN(value) && !isNaN(parseFloat(value));
  },
  
  date: (value) => {
    const date = new Date(value);
    return date instanceof Date && !isNaN(date);
  },
  
  futureDate: (value) => {
    const date = new Date(value);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return date > today;
  },
  
  pastDate: (value) => {
    const date = new Date(value);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return date < today;
  }
};

// Error messages
export const errorMessages = {
  required: 'This field is required',
  email: 'Please enter a valid email address',
  phone: 'Please enter a valid phone number',
  minLength: (min) => `Must be at least ${min} characters long`,
  maxLength: (max) => `Must be no more than ${max} characters long`,
  numeric: 'Please enter a valid number',
  date: 'Please enter a valid date',
  futureDate: 'Date must be in the future',
  pastDate: 'Date must be in the past'
};

// Custom hook for form validation
export const useFormValidation = (initialValues = {}, validationSchema = {}) => {
  const [values, setValues] = useState(initialValues);
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [isValid, setIsValid] = useState(false);

  // Validate a single field
  const validateField = (name, value) => {
    const rules = validationSchema[name];
    if (!rules) return '';

    for (const rule of rules) {
      if (typeof rule === 'string') {
        // Simple rule like 'required', 'email'
        if (rule === 'required' && !validationRules.required(value)) {
          return errorMessages.required;
        }
        if (rule === 'email' && value && !validationRules.email(value)) {
          return errorMessages.email;
        }
        if (rule === 'phone' && value && !validationRules.phone(value)) {
          return errorMessages.phone;
        }
        if (rule === 'numeric' && value && !validationRules.numeric(value)) {
          return errorMessages.numeric;
        }
        if (rule === 'date' && value && !validationRules.date(value)) {
          return errorMessages.date;
        }
        if (rule === 'futureDate' && value && !validationRules.futureDate(value)) {
          return errorMessages.futureDate;
        }
        if (rule === 'pastDate' && value && !validationRules.pastDate(value)) {
          return errorMessages.pastDate;
        }
      } else if (typeof rule === 'object') {
        // Complex rule like { minLength: 3 }
        for (const [ruleName, ruleValue] of Object.entries(rule)) {
          if (ruleName === 'minLength' && value && !validationRules.minLength(ruleValue)(value)) {
            return errorMessages.minLength(ruleValue);
          }
          if (ruleName === 'maxLength' && value && !validationRules.maxLength(ruleValue)(value)) {
            return errorMessages.maxLength(ruleValue);
          }
        }
      }
    }
    return '';
  };

  // Validate all fields
  const validateForm = () => {
    const newErrors = {};
    let formIsValid = true;

    for (const [name, rules] of Object.entries(validationSchema)) {
      const error = validateField(name, values[name]);
      if (error) {
        newErrors[name] = error;
        formIsValid = false;
      }
    }

    setErrors(newErrors);
    setIsValid(formIsValid);
    return formIsValid;
  };

  // Handle input change
  const handleChange = (name, value) => {
    setValues(prev => ({
      ...prev,
      [name]: value
    }));

    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  // Handle input blur
  const handleBlur = (name) => {
    setTouched(prev => ({
      ...prev,
      [name]: true
    }));

    // Validate field on blur
    const error = validateField(name, values[name]);
    setErrors(prev => ({
      ...prev,
      [name]: error
    }));
  };

  // Reset form
  const resetForm = (newValues = {}) => {
    setValues(newValues);
    setErrors({});
    setTouched({});
    setIsValid(false);
  };

  // Set field value
  const setFieldValue = (name, value) => {
    setValues(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Set field error
  const setFieldError = (name, error) => {
    setErrors(prev => ({
      ...prev,
      [name]: error
    }));
  };

  // Check if form is valid
  useEffect(() => {
    validateForm();
  }, [values, validationSchema]);

  return {
    values,
    errors,
    touched,
    isValid,
    handleChange,
    handleBlur,
    resetForm,
    setFieldValue,
    setFieldError,
    validateForm
  };
};

// Higher-order component for form validation
export const withFormValidation = (WrappedComponent) => {
  return (props) => {
    const validationProps = useFormValidation(
      props.initialValues,
      props.validationSchema
    );

    return <WrappedComponent {...props} {...validationProps} />;
  };
};

export default useFormValidation;
