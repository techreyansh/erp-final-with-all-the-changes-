/**
 * Utility functions for product code generation and management
 */

/**
 * Generate a unique product code based on existing products
 * Format: P + 6 digits (e.g., P100000, P100001)
 * @param {Array} existingProducts - Array of existing products to check against
 * @returns {string} Generated product code
 */
export const generateProductCode = (existingProducts = []) => {
  // Extract all existing product codes
  const existingCodes = existingProducts
    .map(product => product.productCode)
    .filter(code => code && typeof code === 'string');

  // Find the highest number in existing codes with format P######
  const max = existingCodes.reduce((acc, code) => {
    const match = code.match(/^P(\d{6})$/);
    if (match) {
      const num = parseInt(match[1], 10);
      return num > acc ? num : acc;
    }
    return acc;
  }, 99999); // Start from 99999 so next will be 100000

  // Generate next sequential code
  const next = (max + 1).toString().padStart(6, '0');
  return `P${next}`;
};

/**
 * Generate a unique product code for a specific client
 * Format: C[clientCode]P + 4 digits (e.g., C100000P0001, C100001P0002)
 * @param {string} clientCode - The client code
 * @param {Array} existingProducts - Array of existing products for this client
 * @returns {string} Generated product code
 */
export const generateClientSpecificProductCode = (clientCode, existingProducts = []) => {
  if (!clientCode) {
    return generateProductCode(existingProducts);
  }

  // Extract existing product codes for this client
  const clientProducts = existingProducts.filter(product => 
    product.productCode && product.productCode.startsWith(`${clientCode}P`)
  );

  // Find the highest number in client-specific codes
  const max = clientProducts.reduce((acc, product) => {
    const match = product.productCode.match(new RegExp(`^${clientCode}P(\\d{4})$`));
    if (match) {
      const num = parseInt(match[1], 10);
      return num > acc ? num : acc;
    }
    return acc;
  }, 0); // Start from 0 so first will be 0001

  // Generate next sequential code
  const next = (max + 1).toString().padStart(4, '0');
  return `${clientCode}P${next}`;
};

/**
 * Validate product code format
 * @param {string} productCode - The product code to validate
 * @returns {boolean} True if valid format
 */
export const validateProductCode = (productCode) => {
  if (!productCode || typeof productCode !== 'string') {
    return false;
  }
  
  // Accept formats: P###### or C######P####
  return /^(P\d{6}|C\d{6}P\d{4})$/.test(productCode);
};

/**
 * Check if a product code already exists
 * @param {string} productCode - The product code to check
 * @param {Array} existingProducts - Array of existing products
 * @returns {boolean} True if code already exists
 */
export const isProductCodeExists = (productCode, existingProducts = []) => {
  return existingProducts.some(product => 
    product.productCode && product.productCode.toLowerCase() === productCode.toLowerCase()
  );
};

/**
 * Get all unique product codes from multiple sources
 * @param {Array} clientProducts - Products from clients
 * @param {Array} prospectsProducts - Products from prospects
 * @returns {Array} Array of unique product codes
 */
export const getAllUniqueProductCodes = (clientProducts = [], prospectsProducts = []) => {
  const allProducts = [...clientProducts, ...prospectsProducts];
  const uniqueCodes = new Set();
  
  allProducts.forEach(product => {
    if (product.productCode && typeof product.productCode === 'string') {
      uniqueCodes.add(product.productCode);
    }
  });
  
  return Array.from(uniqueCodes).sort();
};
