// Service to manage product types with auto-suggest functionality
import { getAllClients } from './clientService';

const STORAGE_KEY = 'uniqueProductTypes';

// Get all unique product types from existing products
export const getUniqueProductTypes = async () => {
  try {
    // First try to get from localStorage
    const cachedTypes = localStorage.getItem(STORAGE_KEY);
    if (cachedTypes) {
      return JSON.parse(cachedTypes);
    }

    // If not in cache, fetch from all products
    const clients = await getAllClients();
    const productTypes = new Set();

    clients.forEach(client => {
      if (client.products && Array.isArray(client.products)) {
        client.products.forEach(product => {
          if (product.typeOfProduct && product.typeOfProduct.trim() !== '') {
            productTypes.add(product.typeOfProduct.trim());
          }
        });
      }
    });

    const uniqueTypes = Array.from(productTypes).sort();
    
    // Cache the result
    localStorage.setItem(STORAGE_KEY, JSON.stringify(uniqueTypes));
    
    return uniqueTypes;
  } catch (error) {
    console.error('Error fetching unique product types:', error);
    // Return default types if there's an error
    return ['Power Cord', 'Extension Cord', 'Cable Assembly', 'Others'];
  }
};

// Add a new product type to the unique list
export const addProductType = async (newType) => {
  if (!newType || newType.trim() === '') return;
  
  try {
    const currentTypes = await getUniqueProductTypes();
    const trimmedType = newType.trim();
    
    // Check if type already exists (case-insensitive)
    const typeExists = currentTypes.some(type => 
      type.toLowerCase() === trimmedType.toLowerCase()
    );
    
    if (!typeExists) {
      const updatedTypes = [...currentTypes, trimmedType].sort();
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedTypes));
      return updatedTypes;
    }
    
    return currentTypes;
  } catch (error) {
    console.error('Error adding product type:', error);
    return [];
  }
};

// Refresh the cache by fetching from all products again
export const refreshProductTypes = async () => {
  try {
    localStorage.removeItem(STORAGE_KEY);
    return await getUniqueProductTypes();
  } catch (error) {
    console.error('Error refreshing product types:', error);
    return ['Power Cord', 'Extension Cord', 'Cable Assembly', 'Others'];
  }
};

// Clear the cache
export const clearProductTypesCache = () => {
  localStorage.removeItem(STORAGE_KEY);
};
