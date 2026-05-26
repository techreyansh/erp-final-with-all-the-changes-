/**
 * Comprehensive Inventory Test Suite
 * Covers all logical flows, edge cases, and validation scenarios
 */

import { 
  inventoryValidators, 
  fieldValidators, 
  VALIDATION_ERRORS,
  edgeCaseHandlers 
} from './inventoryValidation';

/**
 * Test data generators
 */
export const testDataGenerators = {
  /**
   * Generate valid material inward data
   */
  generateValidMaterialInward: (overrides = {}) => ({
    Date: '2024-01-15',
    'Product Code': 'MAT001',
    'Product Name': 'Test Material',
    Quantity: '100',
    Unit: 'kg',
    Supplier: 'Test Supplier',
    'Invoice No': 'INV001',
    Status: 'Pending',
    Remarks: 'Test entry',
    ...overrides
  }),

  /**
   * Generate valid material issue data
   */
  generateValidMaterialIssue: (overrides = {}) => ({
    Date: '2024-01-15',
    itemCode: 'MAT001',
    itemName: 'Test Material',
    Quantity: '50',
    Unit: 'kg',
    'Issued To': 'John Doe',
    Department: 'Production',
    Status: 'Pending',
    Remarks: 'Test issue',
    ...overrides
  }),

  /**
   * Generate valid FG material inward data
   */
  generateValidFGMaterialInward: (overrides = {}) => ({
    Date: '2024-01-15',
    'Product Code': 'FG001',
    'Product Name': 'Finished Product',
    Quantity: '25',
    Unit: 'pcs',
    Supplier: 'Test Supplier',
    'Invoice No': 'INV002',
    Status: 'Pending',
    Remarks: 'Test FG entry',
    ...overrides
  }),

  /**
   * Generate valid FG material outward data
   */
  generateValidFGMaterialOutward: (overrides = {}) => ({
    Date: '2024-01-15',
    'Product Code': 'FG001',
    'Product Name': 'Finished Product',
    Quantity: '10',
    Unit: 'pcs',
    'Issued To': 'Customer ABC',
    Status: 'Pending',
    Remarks: 'Test FG outward',
    ...overrides
  }),

  /**
   * Generate stock data for testing
   */
  generateStockData: (count = 5) => {
    return Array.from({ length: count }, (_, i) => ({
      itemCode: `MAT${String(i + 1).padStart(3, '0')}`,
      itemName: `Material ${i + 1}`,
      currentStock: (100 + i * 10).toString(),
      Unit: 'kg',
      Category: 'Raw Material'
    }));
  },

  /**
   * Generate FG stock data for testing
   */
  generateFGStockData: (count = 5) => {
    return Array.from({ length: count }, (_, i) => ({
      'Product Code': `FG${String(i + 1).padStart(3, '0')}`,
      'Product Name': `Finished Product ${i + 1}`,
      'Current Stock': (50 + i * 5).toString(),
      Unit: 'pcs',
      Category: 'Finished Goods'
    }));
  }
};

/**
 * Test cases for material inward validation
 */
export const materialInwardTests = {
  /**
   * Test valid material inward entry
   */
  testValidEntry: () => {
    const formData = testDataGenerators.generateValidMaterialInward();
    const stockData = testDataGenerators.generateStockData();
    
    const result = inventoryValidators.validateMaterialInward(formData, stockData);
    
    return {
      testName: 'Valid Material Inward Entry',
      expected: true,
      actual: result.isValid,
      passed: result.isValid === true,
      errors: result.errors
    };
  },

  /**
   * Test missing required fields
   */
  testMissingRequiredFields: () => {
    const formData = {}; // Empty data
    const stockData = testDataGenerators.generateStockData();
    
    const result = inventoryValidators.validateMaterialInward(formData, stockData);
    
    return {
      testName: 'Missing Required Fields',
      expected: false,
      actual: result.isValid,
      passed: result.isValid === false,
      errors: result.errors
    };
  },

  /**
   * Test invalid quantity
   */
  testInvalidQuantity: () => {
    const formData = testDataGenerators.generateValidMaterialInward({
      Quantity: 'invalid'
    });
    const stockData = testDataGenerators.generateStockData();
    
    const result = inventoryValidators.validateMaterialInward(formData, stockData);
    
    return {
      testName: 'Invalid Quantity',
      expected: false,
      actual: result.isValid,
      passed: result.isValid === false,
      errors: result.errors
    };
  },

  /**
   * Test negative quantity
   */
  testNegativeQuantity: () => {
    const formData = testDataGenerators.generateValidMaterialInward({
      Quantity: '-10'
    });
    const stockData = testDataGenerators.generateStockData();
    
    const result = inventoryValidators.validateMaterialInward(formData, stockData);
    
    return {
      testName: 'Negative Quantity',
      expected: false,
      actual: result.isValid,
      passed: result.isValid === false,
      errors: result.errors
    };
  },

  /**
   * Test zero quantity
   */
  testZeroQuantity: () => {
    const formData = testDataGenerators.generateValidMaterialInward({
      Quantity: '0'
    });
    const stockData = testDataGenerators.generateStockData();
    
    const result = inventoryValidators.validateMaterialInward(formData, stockData);
    
    return {
      testName: 'Zero Quantity',
      expected: false,
      actual: result.isValid,
      passed: result.isValid === false,
      errors: result.errors
    };
  },

  /**
   * Test future date
   */
  testFutureDate: () => {
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 1);
    
    const formData = testDataGenerators.generateValidMaterialInward({
      Date: futureDate.toISOString().split('T')[0]
    });
    const stockData = testDataGenerators.generateStockData();
    
    const result = inventoryValidators.validateMaterialInward(formData, stockData);
    
    return {
      testName: 'Future Date',
      expected: false,
      actual: result.isValid,
      passed: result.isValid === false,
      errors: result.errors
    };
  },

  /**
   * Test duplicate entry
   */
  testDuplicateEntry: () => {
    const formData = testDataGenerators.generateValidMaterialInward();
    const stockData = [
      {
        Date: '2024-01-15',
        'Product Code': 'MAT001',
        'Product Name': 'Test Material',
        Supplier: 'Test Supplier'
      }
    ];
    
    const result = inventoryValidators.validateMaterialInward(formData, stockData);
    
    return {
      testName: 'Duplicate Entry',
      expected: false,
      actual: result.isValid,
      passed: result.isValid === false,
      errors: result.errors
    };
  }
};

/**
 * Test cases for material issue validation
 */
export const materialIssueTests = {
  /**
   * Test valid material issue entry
   */
  testValidEntry: () => {
    const formData = testDataGenerators.generateValidMaterialIssue();
    const stockData = testDataGenerators.generateStockData();
    const currentStock = { 'MAT001': '100' };
    
    const result = inventoryValidators.validateMaterialIssue(formData, stockData, currentStock);
    
    return {
      testName: 'Valid Material Issue Entry',
      expected: true,
      actual: result.isValid,
      passed: result.isValid === true,
      errors: result.errors
    };
  },

  /**
   * Test insufficient stock for completed status
   */
  testInsufficientStockCompleted: () => {
    const formData = testDataGenerators.generateValidMaterialIssue({
      Quantity: '150',
      Status: 'Completed'
    });
    const stockData = testDataGenerators.generateStockData();
    const currentStock = { 'MAT001': '100' }; // Less than requested
    
    const result = inventoryValidators.validateMaterialIssue(formData, stockData, currentStock);
    
    return {
      testName: 'Insufficient Stock (Completed Status)',
      expected: false,
      actual: result.isValid,
      passed: result.isValid === false,
      errors: result.errors
    };
  },

  /**
   * Test sufficient stock for pending status (should pass)
   */
  testSufficientStockPending: () => {
    const formData = testDataGenerators.generateValidMaterialIssue({
      Quantity: '150',
      Status: 'Pending'
    });
    const stockData = testDataGenerators.generateStockData();
    const currentStock = { 'MAT001': '100' }; // Less than requested but status is pending
    
    const result = inventoryValidators.validateMaterialIssue(formData, stockData, currentStock);
    
    return {
      testName: 'Sufficient Stock Check (Pending Status)',
      expected: true,
      actual: result.isValid,
      passed: result.isValid === true,
      errors: result.errors
    };
  }
};

/**
 * Test cases for FG material validation
 */
export const fgMaterialTests = {
  /**
   * Test valid FG material inward entry
   */
  testValidFGInward: () => {
    const formData = testDataGenerators.generateValidFGMaterialInward();
    const fgStockData = testDataGenerators.generateFGStockData();
    
    const result = inventoryValidators.validateFGMaterialInward(formData, fgStockData);
    
    return {
      testName: 'Valid FG Material Inward Entry',
      expected: true,
      actual: result.isValid,
      passed: result.isValid === true,
      errors: result.errors
    };
  },

  /**
   * Test FG material inward with non-existent product
   */
  testFGInwardNonExistentProduct: () => {
    const formData = testDataGenerators.generateValidFGMaterialInward({
      'Product Code': 'NONEXISTENT'
    });
    const fgStockData = testDataGenerators.generateFGStockData();
    
    const result = inventoryValidators.validateFGMaterialInward(formData, fgStockData);
    
    return {
      testName: 'FG Inward - Non-existent Product',
      expected: false,
      actual: result.isValid,
      passed: result.isValid === false,
      errors: result.errors
    };
  },

  /**
   * Test valid FG material outward entry
   */
  testValidFGOutward: () => {
    const formData = testDataGenerators.generateValidFGMaterialOutward();
    const fgStockData = testDataGenerators.generateFGStockData();
    
    const result = inventoryValidators.validateFGMaterialOutward(formData, fgStockData);
    
    return {
      testName: 'Valid FG Material Outward Entry',
      expected: true,
      actual: result.isValid,
      passed: result.isValid === true,
      errors: result.errors
    };
  },

  /**
   * Test FG material outward with insufficient stock
   */
  testFGOutwardInsufficientStock: () => {
    const formData = testDataGenerators.generateValidFGMaterialOutward({
      Quantity: '100',
      Status: 'Completed'
    });
    const fgStockData = [
      {
        'Product Code': 'FG001',
        'Product Name': 'Finished Product',
        'Current Stock': '50' // Less than requested
      }
    ];
    
    const result = inventoryValidators.validateFGMaterialOutward(formData, fgStockData);
    
    return {
      testName: 'FG Outward - Insufficient Stock',
      expected: false,
      actual: result.isValid,
      passed: result.isValid === false,
      errors: result.errors
    };
  }
};

/**
 * Test cases for field validators
 */
export const fieldValidatorTests = {
  /**
   * Test required field validator
   */
  testRequiredValidator: () => {
    const tests = [
      { value: '', expected: false, name: 'Empty string' },
      { value: '   ', expected: false, name: 'Whitespace only' },
      { value: null, expected: false, name: 'Null value' },
      { value: undefined, expected: false, name: 'Undefined value' },
      { value: 'Valid value', expected: true, name: 'Valid value' },
      { value: 0, expected: true, name: 'Zero value' },
      { value: false, expected: true, name: 'False value' }
    ];

    return tests.map(test => {
      const result = fieldValidators.required(test.value, 'Test Field');
      return {
        testName: `Required Validator - ${test.name}`,
        expected: test.expected,
        actual: result.isValid,
        passed: result.isValid === test.expected
      };
    });
  },

  /**
   * Test number field validator
   */
  testNumberValidator: () => {
    const tests = [
      { value: '100', expected: true, name: 'Valid positive number' },
      { value: '0', expected: true, name: 'Zero' },
      { value: '-10', expected: false, name: 'Negative number (not allowed)' },
      { value: 'invalid', expected: false, name: 'Invalid string' },
      { value: '', expected: false, name: 'Empty string' },
      { value: null, expected: false, name: 'Null value' },
      { value: '10.5', expected: true, name: 'Decimal number' }
    ];

    return tests.map(test => {
      const result = fieldValidators.number(test.value, 'Test Field', { allowNegative: false });
      return {
        testName: `Number Validator - ${test.name}`,
        expected: test.expected,
        actual: result.isValid,
        passed: result.isValid === test.expected
      };
    });
  },

  /**
   * Test date field validator
   */
  testDateValidator: () => {
    const today = new Date().toISOString().split('T')[0];
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    const tests = [
      { value: today, expected: true, name: 'Today' },
      { value: yesterday, expected: true, name: 'Yesterday' },
      { value: tomorrow, expected: false, name: 'Tomorrow (future not allowed)' },
      { value: 'invalid-date', expected: false, name: 'Invalid date string' },
      { value: '', expected: false, name: 'Empty string' },
      { value: null, expected: false, name: 'Null value' }
    ];

    return tests.map(test => {
      const result = fieldValidators.date(test.value, 'Test Field', { allowFuture: false });
      return {
        testName: `Date Validator - ${test.name}`,
        expected: test.expected,
        actual: result.isValid,
        passed: result.isValid === test.expected
      };
    });
  }
};

/**
 * Test cases for edge case handlers
 */
export const edgeCaseTests = {
  /**
   * Test empty data handler
   */
  testEmptyDataHandler: () => {
    const tests = [
      { data: null, defaultValue: [], expected: [], name: 'Null data' },
      { data: undefined, defaultValue: [], expected: [], name: 'Undefined data' },
      { data: [], defaultValue: [], expected: [], name: 'Empty array' },
      { data: [1, 2, 3], defaultValue: [], expected: [1, 2, 3], name: 'Valid array' }
    ];

    return tests.map(test => {
      const result = edgeCaseHandlers.handleEmptyData(test.data, test.defaultValue);
      return {
        testName: `Empty Data Handler - ${test.name}`,
        expected: test.expected,
        actual: result,
        passed: JSON.stringify(result) === JSON.stringify(test.expected)
      };
    });
  },

  /**
   * Test date edge case handler
   */
  testDateEdgeCaseHandler: () => {
    const tests = [
      { value: '2024-01-15', expected: '2024-01-15', name: 'Valid date' },
      { value: null, expected: new Date().toISOString().split('T')[0], name: 'Null value' },
      { value: undefined, expected: new Date().toISOString().split('T')[0], name: 'Undefined value' },
      { value: 'invalid-date', expected: new Date().toISOString().split('T')[0], name: 'Invalid date' }
    ];

    return tests.map(test => {
      const result = edgeCaseHandlers.handleDateEdgeCases(test.value);
      return {
        testName: `Date Edge Case Handler - ${test.name}`,
        expected: test.expected,
        actual: result,
        passed: result === test.expected
      };
    });
  },

  /**
   * Test numeric edge case handler
   */
  testNumericEdgeCaseHandler: () => {
    const tests = [
      { value: '100', expected: 100, name: 'Valid number string' },
      { value: 50, expected: 50, name: 'Valid number' },
      { value: null, expected: 0, name: 'Null value' },
      { value: undefined, expected: 0, name: 'Undefined value' },
      { value: '', expected: 0, name: 'Empty string' },
      { value: 'invalid', expected: 0, name: 'Invalid string' }
    ];

    return tests.map(test => {
      const result = edgeCaseHandlers.handleNumericEdgeCases(test.value, 0);
      return {
        testName: `Numeric Edge Case Handler - ${test.name}`,
        expected: test.expected,
        actual: result,
        passed: result === test.expected
      };
    });
  }
};

/**
 * Run all tests and return results
 */
export const runAllTests = () => {
  const allTests = [
    // Material Inward Tests
    ...Object.values(materialInwardTests).map(test => test()),
    
    // Material Issue Tests
    ...Object.values(materialIssueTests).map(test => test()),
    
    // FG Material Tests
    ...Object.values(fgMaterialTests).map(test => test()),
    
    // Field Validator Tests
    ...fieldValidatorTests.testRequiredValidator(),
    ...fieldValidatorTests.testNumberValidator(),
    ...fieldValidatorTests.testDateValidator(),
    
    // Edge Case Tests
    ...edgeCaseTests.testEmptyDataHandler(),
    ...edgeCaseTests.testDateEdgeCaseHandler(),
    ...edgeCaseTests.testNumericEdgeCaseHandler()
  ];

  const results = {
    total: allTests.length,
    passed: allTests.filter(test => test.passed).length,
    failed: allTests.filter(test => !test.passed).length,
    tests: allTests
  };

  return results;
};

/**
 * Run specific test category
 */
export const runTestCategory = (category) => {
  switch (category) {
    case 'materialInward':
      return Object.values(materialInwardTests).map(test => test());
    case 'materialIssue':
      return Object.values(materialIssueTests).map(test => test());
    case 'fgMaterial':
      return Object.values(fgMaterialTests).map(test => test());
    case 'fieldValidators':
      return [
        ...fieldValidatorTests.testRequiredValidator(),
        ...fieldValidatorTests.testNumberValidator(),
        ...fieldValidatorTests.testDateValidator()
      ];
    case 'edgeCases':
      return [
        ...edgeCaseTests.testEmptyDataHandler(),
        ...edgeCaseTests.testDateEdgeCaseHandler(),
        ...edgeCaseTests.testNumericEdgeCaseHandler()
      ];
    default:
      return [];
  }
};

export default {
  testDataGenerators,
  materialInwardTests,
  materialIssueTests,
  fgMaterialTests,
  fieldValidatorTests,
  edgeCaseTests,
  runAllTests,
  runTestCategory
};
