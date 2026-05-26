import React from 'react';

const FormField = ({
  label,
  type = 'text',
  value,
  onChange,
  placeholder,
  required = false,
  error,
  disabled = false,
  multiline = false,
  rows = 3,
  options = [],
  className = '',
  id,
  name
}) => {
  const fieldId = id || name || label?.toLowerCase().replace(/\s+/g, '-');
  
  const baseInputClasses = `
    w-full px-4 py-3 
    border border-gray-300 rounded-lg 
    focus:ring-2 focus:ring-blue-500 focus:border-blue-500 
    transition-all duration-200 ease-in-out
    bg-white text-gray-900
    placeholder-gray-500
    ${error ? 'border-red-500 focus:ring-red-500 focus:border-red-500' : ''}
    ${disabled ? 'bg-gray-100 cursor-not-allowed opacity-60' : 'hover:border-gray-400'}
    ${className}
  `.trim();

  const labelClasses = `
    block text-sm font-semibold text-gray-700 mb-2
    ${required ? 'after:content-["*"] after:text-red-500 after:ml-1' : ''}
  `.trim();

  const errorClasses = `
    mt-1 text-sm text-red-600
  `.trim();

  const renderInput = () => {
    if (type === 'select') {
      return (
        <select
          id={fieldId}
          name={name}
          value={value}
          onChange={onChange}
          disabled={disabled}
          className={baseInputClasses}
          required={required}
        >
          <option value="">Select {label}</option>
          {options.map((option) => (
            <option key={option.value || option} value={option.value || option}>
              {option.label || option}
            </option>
          ))}
        </select>
      );
    }

    if (multiline) {
      return (
        <textarea
          id={fieldId}
          name={name}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          disabled={disabled}
          rows={rows}
          className={`${baseInputClasses} resize-vertical min-h-[100px]`}
          required={required}
        />
      );
    }

    return (
      <input
        id={fieldId}
        name={name}
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        disabled={disabled}
        className={baseInputClasses}
        required={required}
      />
    );
  };

  return (
    <div className="space-y-1">
      <label htmlFor={fieldId} className={labelClasses}>
        {label}
      </label>
      {renderInput()}
      {error && (
        <p className={errorClasses} role="alert">
          {error}
        </p>
      )}
    </div>
  );
};

export default FormField;
