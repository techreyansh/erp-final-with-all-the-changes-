# Clean Form Components with Tailwind CSS

This directory contains reusable form components built with React and Tailwind CSS, designed to provide a clean, consistent, and user-friendly form experience throughout the employee dashboard.

## Components Overview

### 1. FormField
A flexible form field component that handles various input types with consistent styling and validation.

### 2. FormContainer
A wrapper component that provides the overall form structure with header, content area, and action buttons.

### 3. FormValidation
A comprehensive validation system with custom hooks and validation rules.

### 4. FormExample
A demonstration component showing how to use all the form components together.

## Features

✅ **Top-to-bottom layout** with proper spacing and alignment  
✅ **Consistent field styling** with Tailwind CSS  
✅ **Form validation** with real-time error display  
✅ **Responsive design** that works on all screen sizes  
✅ **Accessibility features** with proper labels and ARIA attributes  
✅ **Loading states** and disabled button handling  
✅ **Custom validation rules** and error messages  
✅ **Step-by-step forms** with progress indicators  

## Quick Start

### Basic Form Setup

```jsx
import React from 'react';
import FormContainer from './FormContainer';
import FormField from './FormField';
import { useFormValidation } from './FormValidation';

const MyForm = () => {
  const validationSchema = {
    name: ['required', { minLength: 2 }],
    email: ['required', 'email'],
    phone: ['required', 'phone']
  };

  const {
    values,
    errors,
    touched,
    isValid,
    handleChange,
    handleBlur,
    resetForm
  } = useFormValidation({}, validationSchema);

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log('Form values:', values);
  };

  return (
    <FormContainer
      title="My Form"
      subtitle="Fill out the form below"
      onSubmit={handleSubmit}
      onCancel={() => resetForm()}
      submitLabel="Submit"
      cancelLabel="Reset"
      isSubmitDisabled={!isValid}
    >
      <div className="space-y-6">
        <FormField
          label="Full Name"
          name="name"
          value={values.name || ''}
          onChange={(e) => handleChange('name', e.target.value)}
          onBlur={() => handleBlur('name')}
          required
          error={touched.name ? errors.name : ''}
        />
        
        <FormField
          label="Email"
          name="email"
          type="email"
          value={values.email || ''}
          onChange={(e) => handleChange('email', e.target.value)}
          onBlur={() => handleBlur('email')}
          required
          error={touched.email ? errors.email : ''}
        />
      </div>
    </FormContainer>
  );
};
```

## Component API

### FormField Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `label` | string | - | Field label text |
| `type` | string | 'text' | Input type (text, email, tel, date, select, etc.) |
| `value` | string | - | Field value |
| `onChange` | function | - | Change handler |
| `placeholder` | string | - | Placeholder text |
| `required` | boolean | false | Whether field is required |
| `error` | string | - | Error message to display |
| `disabled` | boolean | false | Whether field is disabled |
| `multiline` | boolean | false | Whether to render as textarea |
| `rows` | number | 3 | Number of rows for textarea |
| `options` | array | [] | Options for select field |
| `className` | string | '' | Additional CSS classes |

### FormContainer Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `title` | string | - | Form title |
| `subtitle` | string | - | Form subtitle |
| `onSubmit` | function | - | Submit handler |
| `onCancel` | function | - | Cancel handler |
| `submitLabel` | string | 'Submit' | Submit button text |
| `cancelLabel` | string | 'Cancel' | Cancel button text |
| `isLoading` | boolean | false | Loading state |
| `isSubmitDisabled` | boolean | false | Whether submit is disabled |
| `maxWidth` | string | 'max-w-2xl' | Maximum width class |
| `showActions` | boolean | true | Whether to show action buttons |

## Validation Rules

### Built-in Rules

- `required` - Field must not be empty
- `email` - Valid email format
- `phone` - Valid phone number
- `date` - Valid date format
- `numeric` - Numeric value
- `futureDate` - Date must be in the future
- `pastDate` - Date must be in the past

### Custom Rules

- `minLength(n)` - Minimum character length
- `maxLength(n)` - Maximum character length

### Example Validation Schema

```jsx
const validationSchema = {
  name: ['required', { minLength: 2 }],
  email: ['required', 'email'],
  phone: ['required', 'phone'],
  age: ['required', 'numeric'],
  birthDate: ['required', 'date', 'pastDate'],
  message: ['required', { minLength: 10 }, { maxLength: 500 }]
};
```

## Field Types

### Text Input
```jsx
<FormField
  label="Full Name"
  type="text"
  value={values.name}
  onChange={(e) => handleChange('name', e.target.value)}
  placeholder="Enter your name"
  required
/>
```

### Email Input
```jsx
<FormField
  label="Email"
  type="email"
  value={values.email}
  onChange={(e) => handleChange('email', e.target.value)}
  required
/>
```

### Phone Input
```jsx
<FormField
  label="Phone"
  type="tel"
  value={values.phone}
  onChange={(e) => handleChange('phone', e.target.value)}
  required
/>
```

### Date Input
```jsx
<FormField
  label="Birth Date"
  type="date"
  value={values.birthDate}
  onChange={(e) => handleChange('birthDate', e.target.value)}
  required
/>
```

### Select Dropdown
```jsx
<FormField
  label="Department"
  type="select"
  value={values.department}
  onChange={(e) => handleChange('department', e.target.value)}
  options={[
    { value: 'engineering', label: 'Engineering' },
    { value: 'marketing', label: 'Marketing' },
    { value: 'sales', label: 'Sales' }
  ]}
  required
/>
```

### Textarea
```jsx
<FormField
  label="Message"
  type="text"
  value={values.message}
  onChange={(e) => handleChange('message', e.target.value)}
  multiline
  rows={4}
  placeholder="Enter your message..."
  required
/>
```

## Styling

All components use Tailwind CSS classes and follow a consistent design system:

- **Colors**: Blue primary, gray neutrals, red for errors
- **Spacing**: Consistent padding and margins using Tailwind spacing scale
- **Typography**: Clear hierarchy with proper font weights and sizes
- **Borders**: Rounded corners and subtle borders
- **Shadows**: Subtle shadows for depth
- **Transitions**: Smooth hover and focus transitions

## Accessibility

The components include proper accessibility features:

- Semantic HTML elements
- Proper labeling with `htmlFor` attributes
- ARIA attributes for error states
- Keyboard navigation support
- Screen reader friendly
- Focus management

## Examples

### Simple Contact Form
See `FormExample.js` for a complete working example.

### Employee Form
See `EmployeeFormTailwind.js` for a multi-step form example.

### Integration with Existing Forms
The components can be easily integrated into existing forms by replacing Material-UI components with these Tailwind-based alternatives.

## Best Practices

1. **Always use validation** - Define validation schemas for all forms
2. **Provide clear labels** - Use descriptive labels for all fields
3. **Handle errors gracefully** - Show validation errors in real-time
4. **Use appropriate field types** - Choose the right input type for each field
5. **Test on mobile** - Ensure forms work well on all screen sizes
6. **Provide feedback** - Show loading states and success messages

## Migration from Material-UI

To migrate existing Material-UI forms:

1. Replace `TextField` with `FormField`
2. Replace `Dialog` with `FormContainer` (for modal forms)
3. Replace Material-UI validation with `useFormValidation`
4. Update styling to use Tailwind classes
5. Test thoroughly on all devices

## Troubleshooting

### Common Issues

1. **Validation not working**: Ensure validation schema is properly defined
2. **Styling issues**: Check that Tailwind CSS is properly configured
3. **Form not submitting**: Verify `onSubmit` handler is properly connected
4. **Errors not showing**: Make sure `touched` state is being managed

### Getting Help

- Check the example components for reference
- Review the validation rules documentation
- Test with the `FormExample` component
- Ensure all required props are provided
