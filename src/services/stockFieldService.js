// Service to manage unique field values for stock/inventory items
import * as db from '../lib/db';

const STORAGE_KEYS = {
  CATEGORIES: 'uniqueStockCategories',
  UNITS: 'uniqueStockUnits', 
  LOCATIONS: 'uniqueStockLocations',
  MAKES: 'uniqueStockMakes'
};

// Generic function to get unique values for a specific field
const getUniqueFieldValues = async (fieldName, storageKey) => {
  try {
    // Always fetch fresh data from Google Sheets to get the latest values
    const data = await db.getTableRows('stock');
    const uniqueValues = new Set();
    if (data && Array.isArray(data)) {
      data.forEach(item => {
        const value = item[fieldName];
        if (value && value.trim() !== '') {
          uniqueValues.add(value.trim());
        }
      });
    }

    const sortedValues = Array.from(uniqueValues).sort();
    // If no data found, try to get from cache first
    if (sortedValues.length === 0) {
      const cachedValues = localStorage.getItem(storageKey);
      if (cachedValues) {
        const cached = JSON.parse(cachedValues);
        return cached;
      }
      return getDefaultValues(fieldName);
    }
    
    // Update cache with fresh data
    localStorage.setItem(storageKey, JSON.stringify(sortedValues));
    
    return sortedValues;
  } catch (error) {
    console.error(`Error fetching unique ${fieldName} values:`, error);
    // Try to get from cache if API fails
    const cachedValues = localStorage.getItem(storageKey);
    if (cachedValues) {
      return JSON.parse(cachedValues);
    }
    // Return default values if there's an error and no cache
    return getDefaultValues(fieldName);
  }
};

// Get default values for each field type
const getDefaultValues = (fieldName) => {
  const defaults = {
    category: ['Raw Materials', 'Finished Goods', 'Components', 'Tools', 'Others'],
    unit: ['kg', 'pcs', 'm', 'cm', 'mm', 'l', 'ml', 'g', 'mg', 'Others'],
    location: ['Warehouse A', 'Warehouse B', 'Production Floor', 'Office', 'Others'],
    make: ['Local', 'Imported', 'Brand A', 'Brand B', 'Others']
  };
  return defaults[fieldName] || [];
};

// Get unique categories
export const getUniqueCategories = () => {
  return getUniqueFieldValues('category', STORAGE_KEYS.CATEGORIES);
};

// Get unique units
export const getUniqueUnits = () => {
  return getUniqueFieldValues('unit', STORAGE_KEYS.UNITS);
};

// Get unique locations
export const getUniqueLocations = () => {
  return getUniqueFieldValues('location', STORAGE_KEYS.LOCATIONS);
};

// Get unique makes
export const getUniqueMakes = () => {
  return getUniqueFieldValues('make', STORAGE_KEYS.MAKES);
};

// Generic function to add a new value to a specific field
const addFieldValue = async (fieldName, newValue, storageKey) => {
  if (!newValue || newValue.trim() === '') return;
  
  try {
    const trimmedValue = newValue.trim();
    
    // Get current values from cache first
    const cachedValues = localStorage.getItem(storageKey);
    const currentValues = cachedValues ? JSON.parse(cachedValues) : [];
    
    // Check if value already exists (case-insensitive)
    const valueExists = currentValues.some(value => 
      value.toLowerCase() === trimmedValue.toLowerCase()
    );
    
    if (!valueExists) {
      const updatedValues = [...currentValues, trimmedValue].sort();
      localStorage.setItem(storageKey, JSON.stringify(updatedValues));
      return updatedValues;
    }
    return currentValues;
  } catch (error) {
    console.error(`Error adding ${fieldName} value:`, error);
    return [];
  }
};

// Add new category
export const addCategory = (newCategory) => {
  return addFieldValue('category', newCategory, STORAGE_KEYS.CATEGORIES);
};

// Add new unit
export const addUnit = (newUnit) => {
  return addFieldValue('unit', newUnit, STORAGE_KEYS.UNITS);
};

// Add new location
export const addLocation = (newLocation) => {
  return addFieldValue('location', newLocation, STORAGE_KEYS.LOCATIONS);
};

// Add new make
export const addMake = (newMake) => {
  return addFieldValue('make', newMake, STORAGE_KEYS.MAKES);
};

// Refresh all field values by fetching from stock data again
export const refreshAllFieldValues = async () => {
  try {
    // Clear all caches
    Object.values(STORAGE_KEYS).forEach(key => {
      localStorage.removeItem(key);
    });
    
    // Fetch fresh data for all fields
    const [categories, units, locations, makes] = await Promise.all([
      getUniqueCategories(),
      getUniqueUnits(),
      getUniqueLocations(),
      getUniqueMakes()
    ]);
    
    return { categories, units, locations, makes };
  } catch (error) {
    console.error('Error refreshing field values:', error);
    return {
      categories: getDefaultValues('category'),
      units: getDefaultValues('unit'),
      locations: getDefaultValues('location'),
      makes: getDefaultValues('make')
    };
  }
};

// Clear all caches
export const clearAllFieldCaches = () => {
  Object.values(STORAGE_KEYS).forEach(key => {
    localStorage.removeItem(key);
  });
};

// Get all field values at once
export const getAllFieldValues = async () => {
  try {
    const [categories, units, locations, makes] = await Promise.all([
      getUniqueCategories(),
      getUniqueUnits(),
      getUniqueLocations(),
      getUniqueMakes()
    ]);
    
    return { categories, units, locations, makes };
  } catch (error) {
    console.error('Error getting all field values:', error);
    return {
      categories: getDefaultValues('category'),
      units: getDefaultValues('unit'),
      locations: getDefaultValues('location'),
      makes: getDefaultValues('make')
    };
  }
};
