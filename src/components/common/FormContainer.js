import React from 'react';

const FormContainer = ({
  title,
  subtitle,
  children,
  onSubmit,
  onCancel,
  submitLabel = 'Submit',
  cancelLabel = 'Cancel',
  isLoading = false,
  isSubmitDisabled = false,
  className = '',
  showActions = true,
  maxWidth = 'max-w-2xl'
}) => {
  const containerClasses = `
    bg-white rounded-xl shadow-lg border border-gray-200
    ${maxWidth} mx-auto
    ${className}
  `.trim();

  const headerClasses = `
    px-6 py-4 border-b border-gray-200
    bg-gradient-to-r from-blue-50 to-indigo-50
    rounded-t-xl
  `.trim();

  const contentClasses = `
    px-6 py-6 space-y-6
  `.trim();

  const actionsClasses = `
    px-6 py-4 border-t border-gray-200
    bg-gray-50 rounded-b-xl
    flex justify-end space-x-3
  `.trim();

  const buttonBaseClasses = `
    px-6 py-2.5 rounded-lg font-semibold text-sm
    transition-all duration-200 ease-in-out
    focus:outline-none focus:ring-2 focus:ring-offset-2
    disabled:opacity-50 disabled:cursor-not-allowed
  `.trim();

  const submitButtonClasses = `
    ${buttonBaseClasses}
    bg-blue-600 text-white
    hover:bg-blue-700 focus:ring-blue-500
    shadow-sm hover:shadow-md
    ${isLoading ? 'animate-pulse' : ''}
  `.trim();

  const cancelButtonClasses = `
    ${buttonBaseClasses}
    bg-white text-gray-700 border border-gray-300
    hover:bg-gray-50 focus:ring-gray-500
    shadow-sm hover:shadow-md
  `.trim();

  return (
    <div className={containerClasses}>
      {/* Header */}
      {(title || subtitle) && (
        <div className={headerClasses}>
          {title && (
            <h2 className="text-xl font-bold text-gray-900 mb-1">
              {title}
            </h2>
          )}
          {subtitle && (
            <p className="text-sm text-gray-600">
              {subtitle}
            </p>
          )}
        </div>
      )}

      {/* Form Content */}
      <form onSubmit={onSubmit} className="space-y-0">
        <div className={contentClasses}>
          {children}
        </div>

        {/* Actions */}
        {showActions && (
          <div className={actionsClasses}>
            <button
              type="button"
              onClick={onCancel}
              disabled={isLoading}
              className={cancelButtonClasses}
            >
              {cancelLabel}
            </button>
            <button
              type="submit"
              disabled={isLoading || isSubmitDisabled}
              className={submitButtonClasses}
            >
              {isLoading ? (
                <span className="flex items-center">
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Processing...
                </span>
              ) : (
                submitLabel
              )}
            </button>
          </div>
        )}
      </form>
    </div>
  );
};

export default FormContainer;
