import React, { useState, useEffect } from 'react';
import FormContainer from '../common/FormContainer';
import FormField from '../common/FormField';
import { useFormValidation } from '../common/FormValidation';

const EmployeeFormTailwind = ({ 
  open, 
  onClose, 
  employee, 
  onSave,
  title = 'Employee Form'
}) => {
  // Form validation schema
  const validationSchema = {
    EmployeeName: ['required', { minLength: 2 }],
    Email: ['required', 'email'],
    Phone: ['required', 'phone'],
    DateOfBirth: ['required', 'date', 'pastDate'],
    Department: ['required'],
    Designation: ['required', { minLength: 2 }],
    JoiningDate: ['required', 'date', 'pastDate'],
    EmployeeType: ['required'],
    Status: ['required']
  };

  // Initialize form validation
  const {
    values,
    errors,
    touched,
    isValid,
    handleChange,
    handleBlur,
    resetForm,
    validateForm
  } = useFormValidation({}, validationSchema);

  const [isLoading, setIsLoading] = useState(false);
  const [activeStep, setActiveStep] = useState(0);

  // Department options
  const departmentOptions = [
    'Engineering',
    'Marketing',
    'Sales',
    'HR',
    'Finance',
    'Operations',
    'Design',
    'Customer Support',
    'Legal',
    'Administration'
  ];

  // Employee type options
  const employeeTypeOptions = [
    'Full-time',
    'Part-time',
    'Contract',
    'Intern',
    'Consultant',
    'Freelancer'
  ];

  // Status options
  const statusOptions = [
    'Active',
    'Inactive',
    'On Leave',
    'Terminated',
    'Suspended'
  ];

  // Form steps
  const steps = [
    {
      title: 'Personal Information',
      fields: ['EmployeeName', 'DateOfBirth', 'Email', 'Phone', 'Address']
    },
    {
      title: 'Employment Details',
      fields: ['Department', 'Designation', 'EmployeeType', 'JoiningDate', 'ReportingManager', 'Status']
    },
    {
      title: 'Education & Skills',
      fields: ['HighestQualification', 'University', 'GraduationYear', 'Specialization', 'Experience', 'Skills', 'Certifications']
    }
  ];

  // Initialize form data
  useEffect(() => {
    if (employee) {
      resetForm(employee);
    } else {
      resetForm({
        EmployeeName: '',
        Email: '',
        Phone: '',
        DateOfBirth: '',
        Address: '',
        Department: '',
        Designation: '',
        EmployeeType: 'Full-time',
        JoiningDate: '',
        ReportingManager: '',
        Status: 'Active',
        HighestQualification: '',
        University: '',
        GraduationYear: '',
        Specialization: '',
        Experience: '',
        Skills: '',
        Certifications: ''
      });
    }
    setActiveStep(0);
  }, [employee, open, resetForm]);

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsLoading(true);
    try {
      // Generate employee code if new employee
      if (!employee) {
        const timestamp = Date.now();
        const code = `EMP${String(timestamp).slice(-6)}`;
        values.EmployeeCode = code;
        values.EmployeeId = code;
        values.CreatedAt = new Date().toISOString();
      }
      
      values.UpdatedAt = new Date().toISOString();
      
      await onSave(values);
      onClose();
    } catch (error) {
      console.error('Error saving employee:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle cancel
  const handleCancel = () => {
    onClose();
  };

  // Handle next step
  const handleNext = () => {
    if (activeStep < steps.length - 1) {
      setActiveStep(prev => prev + 1);
    }
  };

  // Handle previous step
  const handlePrevious = () => {
    if (activeStep > 0) {
      setActiveStep(prev => prev - 1);
    }
  };

  // Check if current step is valid
  const isCurrentStepValid = () => {
    const currentStepFields = steps[activeStep].fields;
    return currentStepFields.every(field => !errors[field] && values[field]);
  };

  // Render form fields for current step
  const renderStepFields = () => {
    const currentStep = steps[activeStep];
    
    return (
      <div className="space-y-6">
        {/* Step indicator */}
        <div className="flex items-center justify-center space-x-4 mb-8">
          {steps.map((step, index) => (
            <div key={index} className="flex items-center">
              <div className={`
                w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold
                ${index <= activeStep 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-gray-200 text-gray-600'
                }
              `}>
                {index < activeStep ? '✓' : index + 1}
              </div>
              <span className={`
                ml-2 text-sm font-medium
                ${index <= activeStep ? 'text-blue-600' : 'text-gray-500'}
              `}>
                {step.title}
              </span>
              {index < steps.length - 1 && (
                <div className={`
                  w-8 h-0.5 mx-4
                  ${index < activeStep ? 'bg-blue-600' : 'bg-gray-200'}
                `} />
              )}
            </div>
          ))}
        </div>

        {/* Form fields */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {currentStep.fields.map((fieldName) => {
            const fieldConfig = getFieldConfig(fieldName);
            return (
              <div key={fieldName} className={fieldConfig.fullWidth ? 'md:col-span-2' : ''}>
                <FormField
                  label={fieldConfig.label}
                  type={fieldConfig.type}
                  name={fieldName}
                  value={values[fieldName] || ''}
                  onChange={(e) => handleChange(fieldName, e.target.value)}
                  onBlur={() => handleBlur(fieldName)}
                  placeholder={fieldConfig.placeholder}
                  required={fieldConfig.required}
                  error={touched[fieldName] ? errors[fieldName] : ''}
                  multiline={fieldConfig.multiline}
                  rows={fieldConfig.rows}
                  options={fieldConfig.options}
                />
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  // Get field configuration
  const getFieldConfig = (fieldName) => {
    const configs = {
      EmployeeName: {
        label: 'Full Name',
        type: 'text',
        required: true,
        placeholder: 'Enter full name'
      },
      Email: {
        label: 'Email Address',
        type: 'email',
        required: true,
        placeholder: 'Enter email address'
      },
      Phone: {
        label: 'Phone Number',
        type: 'tel',
        required: true,
        placeholder: 'Enter phone number'
      },
      DateOfBirth: {
        label: 'Date of Birth',
        type: 'date',
        required: true
      },
      Address: {
        label: 'Address',
        type: 'text',
        multiline: true,
        rows: 3,
        fullWidth: true,
        placeholder: 'Enter full address'
      },
      Department: {
        label: 'Department',
        type: 'select',
        required: true,
        options: departmentOptions
      },
      Designation: {
        label: 'Designation',
        type: 'text',
        required: true,
        placeholder: 'Enter job title'
      },
      EmployeeType: {
        label: 'Employee Type',
        type: 'select',
        required: true,
        options: employeeTypeOptions
      },
      JoiningDate: {
        label: 'Joining Date',
        type: 'date',
        required: true
      },
      ReportingManager: {
        label: 'Reporting Manager',
        type: 'text',
        placeholder: 'Enter manager name'
      },
      Status: {
        label: 'Status',
        type: 'select',
        required: true,
        options: statusOptions
      },
      HighestQualification: {
        label: 'Highest Qualification',
        type: 'text',
        placeholder: 'e.g., Bachelor\'s Degree'
      },
      University: {
        label: 'University/Institute',
        type: 'text',
        placeholder: 'Enter university name'
      },
      GraduationYear: {
        label: 'Graduation Year',
        type: 'number',
        placeholder: 'e.g., 2020'
      },
      Specialization: {
        label: 'Specialization',
        type: 'text',
        placeholder: 'e.g., Computer Science'
      },
      Experience: {
        label: 'Experience',
        type: 'text',
        placeholder: 'e.g., 3 Years'
      },
      Skills: {
        label: 'Skills',
        type: 'text',
        multiline: true,
        rows: 2,
        fullWidth: true,
        placeholder: 'e.g., React, Node.js, Python'
      },
      Certifications: {
        label: 'Certifications',
        type: 'text',
        multiline: true,
        rows: 2,
        fullWidth: true,
        placeholder: 'e.g., AWS Certified, PMP'
      }
    };

    return configs[fieldName] || { label: fieldName, type: 'text' };
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <FormContainer
          title={employee ? 'Edit Employee' : 'Add New Employee'}
          subtitle={`Step ${activeStep + 1} of ${steps.length}: ${steps[activeStep].title}`}
          onSubmit={handleSubmit}
          onCancel={handleCancel}
          submitLabel={activeStep === steps.length - 1 ? (employee ? 'Update Employee' : 'Create Employee') : 'Next'}
          cancelLabel={activeStep === 0 ? 'Cancel' : 'Previous'}
          isLoading={isLoading}
          isSubmitDisabled={!isCurrentStepValid()}
          maxWidth="max-w-4xl"
        >
          {renderStepFields()}
          
          {/* Step navigation */}
          {activeStep < steps.length - 1 && (
            <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
              <button
                type="button"
                onClick={handlePrevious}
                disabled={activeStep === 0}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              <button
                type="button"
                onClick={handleNext}
                disabled={!isCurrentStepValid()}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
          )}
        </FormContainer>
      </div>
    </div>
  );
};

export default EmployeeFormTailwind;
