/**
 * Utility functions for vendor code generation and management
 */

/**
 * Generate a vendor code using simple sequential format
 * Format: V0001, V0002, V0003, etc.
 * @param {string} vendorName - The vendor name (not used in new format, kept for compatibility)
 * @param {Array} existingVendors - Array of existing vendors to check against
 * @returns {string} Generated vendor code
 */
export const generateVendorCode = (vendorName, existingVendors = []) => {
  // Find the next available number for V prefix
  const nextNumber = findNextAvailableNumber('V', existingVendors);
  
  return `V${String(nextNumber).padStart(4, '0')}`;
};

/**
 * Find the next available number for a given prefix
 * Ensures no duplicate vendor codes are generated
 * @param {string} prefix - The prefix to find next number for
 * @param {Array} existingVendors - Array of existing vendors to check against
 * @returns {number} Next available number
 */
export const findNextAvailableNumber = (prefix, existingVendors = []) => {
  // Get all existing vendor codes with the same prefix
  const existingCodes = existingVendors
    .map(vendor => {
      const vendorCode = vendor.vendorCode || vendor['Vendor Code'] || '';
      return vendorCode;
    })
    .filter(code => code && typeof code === 'string')
    .filter(code => code.startsWith(prefix));

  // Extract numeric parts from existing codes
  const existingNumbers = existingCodes
    .map(code => {
      const match = code.match(new RegExp(`^${prefix}(\\d{4})$`));
      return match ? parseInt(match[1], 10) : 0;
    })
    .filter(num => !isNaN(num) && num > 0);

  // Find the highest number and return next
  const maxNumber = existingNumbers.length > 0 ? Math.max(...existingNumbers) : 0;
  return maxNumber + 1;
};

/**
 * Check if a vendor code already exists
 * @param {string} vendorCode - The vendor code to check
 * @param {Array} existingVendors - Array of existing vendors to check against
 * @returns {boolean} True if code already exists
 */
export const isVendorCodeExists = (vendorCode, existingVendors = []) => {
  if (!vendorCode || typeof vendorCode !== 'string') {
    return false;
  }

  return existingVendors.some(vendor => {
    const existingCode = vendor.vendorCode || vendor['Vendor Code'] || '';
    return existingCode === vendorCode;
  });
};

/**
 * Generate a fallback vendor code when name-based generation fails
 * Format: V + 4 digits (e.g., V0001, V0002)
 * @param {Array} existingVendors - Array of existing vendors to check against
 * @returns {string} Generated fallback vendor code
 */
export const generateFallbackCode = (existingVendors = []) => {
  const nextNumber = findNextAvailableNumber('V', existingVendors);
  return `V${String(nextNumber).padStart(4, '0')}`;
};

/**
 * Validate vendor code format
 * @param {string} vendorCode - The vendor code to validate
 * @returns {boolean} True if valid format
 */
export const validateVendorCode = (vendorCode) => {
  if (!vendorCode || typeof vendorCode !== 'string') {
    return false;
  }

  // Pattern: V followed by 4 digits (e.g., V0001, V0002, V0003)
  const pattern = /^V\d{4}$/;
  return pattern.test(vendorCode);
};

/**
 * Get vendor code examples for the new sequential format
 * @returns {Array} Array of example objects with name and generated code
 */
export const getVendorCodeExamples = () => {
  return [
    {
      name: 'Any Vendor Name',
      description: 'Sequential format: V + 4 digits',
      code: 'V0001'
    },
    {
      name: 'Another Vendor',
      description: 'Next sequential number',
      code: 'V0002'
    },
    {
      name: 'Third Vendor',
      description: 'Continues sequentially',
      code: 'V0003'
    },
    {
      name: 'Fourth Vendor',
      description: 'Always increments by 1',
      code: 'V0004'
    }
  ];
};

/**
 * Test function to demonstrate duplicate prevention
 * @param {Array} existingVendors - Array of existing vendors
 */
export const testDuplicatePrevention = (existingVendors = []) => {

  // Test with any vendor name - should generate V0001, V0002, etc.
  const testName = 'Test Vendor';
  const code1 = generateVendorCode(testName, existingVendors);
  // Add the first code to existing vendors and generate again
  const updatedVendors = [...existingVendors, { vendorCode: code1 }];
  const code2 = generateVendorCode(testName, updatedVendors);
  // Add the second code and generate again
  const updatedVendors2 = [...updatedVendors, { vendorCode: code2 }];
  const code3 = generateVendorCode(testName, updatedVendors2);
  return { code1, code2, code3 };
};
