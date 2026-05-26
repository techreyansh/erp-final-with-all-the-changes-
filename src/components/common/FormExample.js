import React from 'react';
import FormContainer from './FormContainer';
import FormField from './FormField';
import { useFormValidation } from './FormValidation';

const FormExample = () => {
  // Validation schema
  const validationSchema = {
    name: ['required', { minLength: 2 }],
    email: ['required', 'email'],
    phone: ['required', 'phone'],
    department: ['required'],
    message: ['required', { minLength: 10 }]
  };

  // Form validation hook
  const {
    values,
    errors,
    touched,
    isValid,
    handleChange,
    handleBlur,
    resetForm
  } = useFormValidation({}, validationSchema);

  // Department options
  const departmentOptions = [
    { value: 'engineering', label: 'Engineering' },
    { value: 'marketing', label: 'Marketing' },
    { value: 'sales', label: 'Sales' },
    { value: 'hr', label: 'Human Resources' },
    { value: 'finance', label: 'Finance' }
  ];

  // Handle form submission
  const handleSubmit = (e) => {
    e.preventDefault();
    alert('Form submitted successfully! Check console for values.');
    resetForm();
  };

  // Handle cancel
  const handleCancel = () => {
    resetForm();
    alert('Form cancelled');
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Clean Form Example
          </h1>
          <p className="text-gray-600">
            A demonstration of the new Tailwind CSS form components
          </p>
        </div>

        <FormContainer
          title="Contact Form"
          subtitle="Please fill out the form below with your information"
          onSubmit={handleSubmit}
          onCancel={handleCancel}
          submitLabel="Send Message"
          cancelLabel="Reset Form"
          isSubmitDisabled={!isValid}
        >
          {/* Personal Information Section */}
          <div className="space-y-6">
            <div className="border-b border-gray-200 pb-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Personal Information
              </h3>
              <p className="text-sm text-gray-600">
                Basic details about yourself
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                label="Full Name"
                name="name"
                type="text"
                value={values.name || ''}
                onChange={(e) => handleChange('name', e.target.value)}
                onBlur={() => handleBlur('name')}
                placeholder="Enter your full name"
                required
                error={touched.name ? errors.name : ''}
              />

              <FormField
                label="Email Address"
                name="email"
                type="email"
                value={values.email || ''}
                onChange={(e) => handleChange('email', e.target.value)}
                onBlur={() => handleBlur('email')}
                placeholder="Enter your email"
                required
                error={touched.email ? errors.email : ''}
              />

              <FormField
                label="Phone Number"
                name="phone"
                type="tel"
                value={values.phone || ''}
                onChange={(e) => handleChange('phone', e.target.value)}
                onBlur={() => handleBlur('phone')}
                placeholder="Enter your phone number"
                required
                error={touched.phone ? errors.phone : ''}
              />

              <FormField
                label="Department"
                name="department"
                type="select"
                value={values.department || ''}
                onChange={(e) => handleChange('department', e.target.value)}
                onBlur={() => handleBlur('department')}
                required
                error={touched.department ? errors.department : ''}
                options={departmentOptions}
              />
            </div>
          </div>

          {/* Message Section */}
          <div className="space-y-6">
            <div className="border-b border-gray-200 pb-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Message
              </h3>
              <p className="text-sm text-gray-600">
                Tell us what you need help with
              </p>
            </div>

            <FormField
              label="Message"
              name="message"
              type="text"
              value={values.message || ''}
              onChange={(e) => handleChange('message', e.target.value)}
              onBlur={() => handleBlur('message')}
              placeholder="Enter your message here..."
              multiline
              rows={4}
              required
              error={touched.message ? errors.message : ''}
            />
          </div>

          {/* Form Status */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-blue-700">
                  <strong>Form Status:</strong> {isValid ? 'Ready to submit' : 'Please fill in all required fields'}
                </p>
              </div>
            </div>
          </div>
        </FormContainer>

        {/* Usage Instructions */}
        <div className="mt-8 bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            How to Use These Components
          </h3>
          <div className="space-y-4 text-sm text-gray-600">
            <div>
              <h4 className="font-medium text-gray-900 mb-2">1. FormContainer</h4>
              <p>Provides the overall form structure with header, content area, and action buttons.</p>
            </div>
            <div>
              <h4 className="font-medium text-gray-900 mb-2">2. FormField</h4>
              <p>Handles individual form fields with consistent styling, validation, and error display.</p>
            </div>
            <div>
              <h4 className="font-medium text-gray-900 mb-2">3. FormValidation</h4>
              <p>Provides validation rules, error messages, and a custom hook for form state management.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FormExample;
