import React, { useState, useEffect } from 'react';
import {
  Box, Card, CardContent, TextField, Button, Typography, Grid, Alert,
  AlertTitle, Snackbar, Paper, TableContainer, Table,
  TableHead, TableBody, TableRow, TableCell, Select, MenuItem, FormControl, InputLabel, Container,
  Avatar, Chip, Tooltip, alpha, Checkbox, FormControlLabel, Autocomplete
} from '@mui/material';
import { 
  Save, Upload, ExpandMore, ExpandLess, Edit, Delete, Add, 
  Inventory, People, Description, CheckCircle, Error as ErrorIcon
} from '@mui/icons-material';
import LoadingSpinner from '../common/LoadingSpinner';
import { getAllClients, updateClient } from '../../services/clientService';
import { getUniqueProductTypes, addProductType } from '../../services/productTypeService';

const ProductForm = ({ product, onClose }) => {
  // Direct functions to work with clients sheet
  const updateProductInClientsSheet = async (productCode, formData) => {
    try {
      // Get all clients and find the product
      const clients = await getAllClients();
      let clientWithProduct = null;
      let productIndex = -1;

      for (const client of clients) {
        if (client.products) {
          const index = client.products.findIndex(p => p.productCode === productCode);
          if (index !== -1) {
            clientWithProduct = client;
            productIndex = index;
            break;
          }
        }
      }

      if (!clientWithProduct || productIndex === -1) {
        throw new Error('Product not found in clients sheet');
      }
      // Get existing product data
      const existingProduct = clientWithProduct.products[productIndex];
      
      // Parse core colors
      const coreColors = formData.get('coreColors') ? JSON.parse(formData.get('coreColors')) : (existingProduct.coreColors || []);
      
      // Prepare updated product data with ALL core fields
      const updatedProductData = {
        productCode: formData.get('productCode'),
        productName: formData.get('productName'),
        description: formData.get('description'),
        assemblyLineManpower: formData.get('assemblyLineManpower'),
        cableCuttingManpower: formData.get('cableCuttingManpower'),
        moldingMachineManpower: formData.get('moldingMachineManpower'),
        packingLineManpower: formData.get('packingLineManpower'),
        singleShiftTarget: formData.get('singleShiftTarget'),
        basePrice: formData.get('basePrice'),
        category: formData.get('category') || existingProduct.category || '',
        // Cable Information
        conductorSize: formData.get('conductorSize') || existingProduct.conductorSize || '',
        strandCount: formData.get('strandCount') || existingProduct.strandCount || '',
        numberOfCore: formData.get('numberOfCore') || existingProduct.numberOfCore || '',
        coreColors: coreColors,
        coreOD: formData.get('coreOD') || existingProduct.coreOD || '',
        corePVC: formData.get('corePVC') || existingProduct.corePVC || '',
        sheathOD: formData.get('sheathOD') || existingProduct.sheathOD || '',
        sheathInnerPVC: formData.get('sheathInnerPVC') || existingProduct.sheathInnerPVC || '',
        sheathOuterPVC: formData.get('sheathOuterPVC') || existingProduct.sheathOuterPVC || '',
        printingMaterial: formData.get('printingMaterial') || existingProduct.printingMaterial || '',
        // Basic Information
        totalLength: formData.get('totalLength') || existingProduct.totalLength || '',
        colour: formData.get('colour') || existingProduct.colour || '',
        // Moulding Information - Side A
        typeOfProduct: formData.get('typeOfProduct') || existingProduct.typeOfProduct || '',
        typeOfMould: formData.get('typeOfMould') || existingProduct.typeOfMould || '',
        pinType: formData.get('pinType') || existingProduct.pinType || '',
        // Moulding Information - Side B
        sheathLength: formData.get('sheathLength') || existingProduct.sheathLength || '',
        stripLength: formData.get('stripLength') || existingProduct.stripLength || '',
        selectedCore: formData.get('selectedCore') || existingProduct.selectedCore || '',
        // Core-specific fields - ALWAYS include these
        coreRedSheathLength: formData.get('coreRedSheathLength') || existingProduct.coreRedSheathLength || '',
        coreRedStripLength: formData.get('coreRedStripLength') || existingProduct.coreRedStripLength || '',
        coreRedSleeve: formData.get('coreRedSleeve') || existingProduct.coreRedSleeve || '',
        coreRedTerminals: formData.get('coreRedTerminals') || existingProduct.coreRedTerminals || '',
        coreGreenSheathLength: formData.get('coreGreenSheathLength') || existingProduct.coreGreenSheathLength || '',
        coreGreenStripLength: formData.get('coreGreenStripLength') || existingProduct.coreGreenStripLength || '',
        coreGreenSleeve: formData.get('coreGreenSleeve') || existingProduct.coreGreenSleeve || '',
        coreGreenTerminals: formData.get('coreGreenTerminals') || existingProduct.coreGreenTerminals || '',
        coreBlueSheathLength: formData.get('coreBlueSheathLength') || existingProduct.coreBlueSheathLength || '',
        coreBlueStripLength: formData.get('coreBlueStripLength') || existingProduct.coreBlueStripLength || '',
        coreBlueSleeve: formData.get('coreBlueSleeve') || existingProduct.coreBlueSleeve || '',
        coreBlueTerminals: formData.get('coreBlueTerminals') || existingProduct.coreBlueTerminals || '',
        // Legacy fields
        coreRed: formData.get('coreRed') || existingProduct.coreRed || '',
        sleeve: formData.get('sleeve') || existingProduct.sleeve || '',
        terminals: formData.get('terminals') || existingProduct.terminals || '',
        grommetPresent: formData.get('grommetPresent') ? formData.get('grommetPresent') === 'true' : existingProduct.grommetPresent || false,
        grommetLengthFromSideB: formData.get('grommetLengthFromSideB') || existingProduct.grommetLengthFromSideB || '',
        // Inventory Management Fields
        currentStock: formData.get('currentStock') || existingProduct.currentStock || '',
        minLevel: formData.get('minLevel') || existingProduct.minLevel || '',
        maxLevel: formData.get('maxLevel') || existingProduct.maxLevel || '',
        reorderPoint: formData.get('reorderPoint') || existingProduct.reorderPoint || '',
        unit: formData.get('unit') || existingProduct.unit || '',
        location: formData.get('location') || existingProduct.location || '',
        lastUpdated: formData.get('lastUpdated') || existingProduct.lastUpdated || new Date().toISOString(),
        status: formData.get('status') || existingProduct.status || 'Active',
        createdAt: existingProduct.createdAt,
        updatedAt: new Date().toISOString()
      };

      // Add dynamic core fields based on selected colors
      if (coreColors && coreColors.length > 0) {
        coreColors.forEach((color) => {
          const fieldName = `core${color.replace('-', '').replace(' ', '')}`;
          const sheathLengthField = `${fieldName}SheathLength`;
          const stripLengthField = `${fieldName}StripLength`;
          const sleeveField = `${fieldName}Sleeve`;
          const terminalsField = `${fieldName}Terminals`;
          
          // Store all core-specific fields
          updatedProductData[sheathLengthField] = formData.get(sheathLengthField) || existingProduct[sheathLengthField] || '';
          updatedProductData[stripLengthField] = formData.get(stripLengthField) || existingProduct[stripLengthField] || '';
          updatedProductData[sleeveField] = formData.get(sleeveField) || existingProduct[sleeveField] || '';
          updatedProductData[terminalsField] = formData.get(terminalsField) || existingProduct[terminalsField] || '';
        });
      }
      // Update the product in the client's products array
      clientWithProduct.products[productIndex] = updatedProductData;
      // Update the client in the sheet
      await updateClient(clientWithProduct);
      return updatedProductData;
    } catch (error) {
      console.error('Error updating product in clients sheet:', error);
      throw error;
    }
  };

  const createProductInClientsSheet = async (formData) => {
    try {
      // Prepare product data
      const productData = {
        productCode: formData.get('productCode'),
        productName: formData.get('productName'),
        description: formData.get('description'),
        assemblyLineManpower: formData.get('assemblyLineManpower'),
        cableCuttingManpower: formData.get('cableCuttingManpower'),
        moldingMachineManpower: formData.get('moldingMachineManpower'),
        packingLineManpower: formData.get('packingLineManpower'),
        singleShiftTarget: formData.get('singleShiftTarget'),
        basePrice: formData.get('basePrice'),
        category: formData.get('category') || '',
        // Cable Information
        conductorSize: formData.get('conductorSize') || '',
        strandCount: formData.get('strandCount') || '',
        numberOfCore: formData.get('numberOfCore') || '',
        coreColors: formData.get('coreColors') ? JSON.parse(formData.get('coreColors')) : [],
        coreOD: formData.get('coreOD') || '',
        corePVC: formData.get('corePVC') || '',
        sheathOD: formData.get('sheathOD') || '',
        sheathInnerPVC: formData.get('sheathInnerPVC') || '',
        sheathOuterPVC: formData.get('sheathOuterPVC') || '',
        printingMaterial: formData.get('printingMaterial') || '',
        // Basic Information
        totalLength: formData.get('totalLength') || '',
        colour: formData.get('colour') || '',
        // Moulding Information - Side A
        typeOfProduct: formData.get('typeOfProduct') || '',
        typeOfMould: formData.get('typeOfMould') || '',
        pinType: formData.get('pinType') || '',
        // Moulding Information - Side B
        sheathLength: formData.get('sheathLength') || '',
        stripLength: formData.get('stripLength') || '',
        selectedCore: formData.get('selectedCore') || '',
        coreRedSheathLength: formData.get('coreRedSheathLength') || '',
        coreRedStripLength: formData.get('coreRedStripLength') || '',
        coreRedSleeve: formData.get('coreRedSleeve') || '',
        coreRedTerminals: formData.get('coreRedTerminals') || '',
        coreGreenSheathLength: formData.get('coreGreenSheathLength') || '',
        coreGreenStripLength: formData.get('coreGreenStripLength') || '',
        coreGreenSleeve: formData.get('coreGreenSleeve') || '',
        coreGreenTerminals: formData.get('coreGreenTerminals') || '',
        coreBlueSheathLength: formData.get('coreBlueSheathLength') || '',
        coreBlueStripLength: formData.get('coreBlueStripLength') || '',
        coreBlueSleeve: formData.get('coreBlueSleeve') || '',
        coreBlueTerminals: formData.get('coreBlueTerminals') || '',
        coreRed: formData.get('coreRed') || '',
        sleeve: formData.get('sleeve') || '',
        terminals: formData.get('terminals') || '',
        grommetPresent: formData.get('grommetPresent') === 'true',
        grommetLengthFromSideB: formData.get('grommetLengthFromSideB') || '',
        // Inventory Management Fields
        currentStock: formData.get('currentStock') || '',
        minLevel: formData.get('minLevel') || '',
        maxLevel: formData.get('maxLevel') || '',
        reorderPoint: formData.get('reorderPoint') || '',
        unit: formData.get('unit') || '',
        location: formData.get('location') || '',
        lastUpdated: formData.get('lastUpdated') || new Date().toISOString(),
        status: formData.get('status') || 'Active',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      // Get the client code from form data
      const clientCode = formData.get('clientCode');
      if (!clientCode) {
        throw new Error('Client code is required to create a product');
      }

      // Get all clients and find the specific client
      const clients = await getAllClients();
      const client = clients.find(c => c.clientCode === clientCode);
      
      if (!client) {
        throw new Error('Client not found');
      }

      // Add product to client's products array
      client.products = client.products || [];
      client.products.push(productData);
      // Update the client with the new product
      await updateClient(client);
      return productData;
    } catch (error) {
      console.error('Error creating product in clients sheet:', error);
      throw error;
    }
  };

  const initialFormState = {
    clientCode: '',
    productCode: '',
    productName: '',
    description: '',
    assemblyLineManpower: '',
    cableCuttingManpower: '',
    moldingMachineManpower: '',
    packingLineManpower: '',
    singleShiftTarget: '',
    basePrice: '',
    category: '',
    // Cable Information
    conductorSize: '',
    strandCount: '',
    numberOfCore: '',
    coreColors: [], // Array of selected colors
    coreOD: '',
    corePVC: '',
    sheathOD: '',
    sheathInnerPVC: '',
    sheathOuterPVC: '',
    printingMaterial: '',
    // Basic Information
    totalLength: '',
    colour: '',
    // Moulding Information - Side A
    typeOfProduct: 'Power Cord',
    typeOfMould: '6Amp',
    pinType: 'Hollow',
    // Moulding Information - Side B
    selectedCore: '', // Currently selected core for Side B
    commonSheathLength: '', // Common sheath length for all cores
    coreRedSheathLength: '',
    coreRedStripLength: '',
    coreRedSleeve: '',
    coreRedTerminals: '',
    coreGreenSheathLength: '',
    coreGreenStripLength: '',
    coreGreenSleeve: '',
    coreGreenTerminals: '',
    coreBlueSheathLength: '',
    coreBlueStripLength: '',
    coreBlueSleeve: '',
    coreBlueTerminals: '',
    sheathLength: '', // Legacy field for backward compatibility
    stripLength: '', // Legacy field for backward compatibility
    coreRed: '', // Legacy field for backward compatibility
    sleeve: '', // Legacy field for backward compatibility
    terminals: '', // Legacy field for backward compatibility
    grommetPresent: false,
    grommetLengthFromSideB: '',
    // Inventory Management Fields
    currentStock: '',
    minLevel: '',
    maxLevel: '',
    reorderPoint: '',
    unit: '',
    location: '',
    lastUpdated: '',
    status: 'Active',
    // File attachments
    drawing: null,
    fpa: null,
    pdi: null,
    processChecksheet: null,
    packagingStandard: null,
    bom: null,
    sop: null,
    pfc: null
  };

  // Helper function to check if a core is completed
  const isCoreCompleted = (color) => {
    const fields = ['SheathLength', 'StripLength', 'Sleeve', 'Terminals'];
    return fields.every(field => {
      const fieldName = `core${color}${field}`;
      return formData[fieldName] && formData[fieldName].trim() !== '';
    });
  };

  // Helper function to get next incomplete core
  const getNextIncompleteCore = () => {
    if (!formData.coreColors || formData.coreColors.length === 0) return null;
    return formData.coreColors.find(color => !isCoreCompleted(color));
  };

  const [formData, setFormData] = useState(product ? {
    ...initialFormState,
    ...product,
    clientCode: product.clientCode || '',
    coreColors: product.coreColors || [],
    // Ensure all new fields are initialized even if they don't exist in the product
    assemblyLineManpower: product.assemblyLineManpower || '',
    cableCuttingManpower: product.cableCuttingManpower || '',
    moldingMachineManpower: product.moldingMachineManpower || '',
    packingLineManpower: product.packingLineManpower || '',
    conductorSize: product.conductorSize || '',
    strandCount: product.strandCount || '',
    numberOfCore: product.numberOfCore || '',
    coreOD: product.coreOD || '',
    corePVC: product.corePVC || '',
    sheathOD: product.sheathOD || '',
    sheathInnerPVC: product.sheathInnerPVC || '',
    sheathOuterPVC: product.sheathOuterPVC || '',
    printingMaterial: product.printingMaterial || '',
    totalLength: product.totalLength || '',
    colour: product.colour || '',
    typeOfProduct: product.typeOfProduct || 'Power Cord',
    typeOfMould: product.typeOfMould || '6Amp',
    pinType: product.pinType || 'Hollow',
    selectedCore: product.selectedCore || '',
    commonSheathLength: product.commonSheathLength || '',
    coreRedSheathLength: product.coreRedSheathLength || '',
    coreRedStripLength: product.coreRedStripLength || '',
    coreRedSleeve: product.coreRedSleeve || '',
    coreRedTerminals: product.coreRedTerminals || '',
    coreGreenSheathLength: product.coreGreenSheathLength || '',
    coreGreenStripLength: product.coreGreenStripLength || '',
    coreGreenSleeve: product.coreGreenSleeve || '',
    coreGreenTerminals: product.coreGreenTerminals || '',
    coreBlueSheathLength: product.coreBlueSheathLength || '',
    coreBlueStripLength: product.coreBlueStripLength || '',
    coreBlueSleeve: product.coreBlueSleeve || '',
    coreBlueTerminals: product.coreBlueTerminals || '',
    sheathLength: product.sheathLength || '',
    stripLength: product.stripLength || '',
    coreRed: product.coreRed || '', // Legacy field
    sleeve: product.sleeve || '',
    terminals: product.terminals || '',
    grommetPresent: product.grommetPresent || false,
    grommetLengthFromSideB: product.grommetLengthFromSideB || '',
    // Inventory Management Fields
    currentStock: product.currentStock || '',
    minLevel: product.minLevel || '',
    maxLevel: product.maxLevel || '',
    reorderPoint: product.reorderPoint || '',
    unit: product.unit || '',
    location: product.location || '',
    lastUpdated: product.lastUpdated || '',
    status: product.status || 'Active',
    // Load dynamic core fields from existing product
    ...(product.coreColors && Array.isArray(product.coreColors) ? 
      product.coreColors.reduce((acc, color) => {
        const fieldName = `core${color.replace('-', '').replace(' ', '')}`;
        acc[fieldName] = product[fieldName] || '';
        return acc;
      }, {}) : {})
  } : initialFormState);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [clients, setClients] = useState([]);
  
  // State for custom "Others" values
  const [customValues, setCustomValues] = useState({
    customCoreColor: '',
    customTypeOfProduct: '',
    customTypeOfMould: '',
    customPinType: ''
  });

  // State for product types autocomplete
  const [productTypes, setProductTypes] = useState([]);
  const [loadingProductTypes, setLoadingProductTypes] = useState(false);

  useEffect(() => {
    const loadClients = async () => {
      try {
        const clientData = await getAllClients();
        setClients(clientData);
      } catch (err) {
        console.error('Error loading clients:', err);
      }
    };
    loadClients();
  }, []);

  // Load product types for autocomplete
  useEffect(() => {
    const loadProductTypes = async () => {
      setLoadingProductTypes(true);
      try {
        const types = await getUniqueProductTypes();
        setProductTypes(types);
      } catch (error) {
        console.error('Error loading product types:', error);
        // Fallback to default types
        setProductTypes(['Power Cord', 'Extension Cord', 'Cable Assembly', 'Others']);
      } finally {
        setLoadingProductTypes(false);
      }
    };
    loadProductTypes();
  }, []);

  // Handle loading custom values when editing an existing product
  useEffect(() => {
    if (product) {
      const newCustomValues = {
        customCoreColor: '',
        customTypeOfProduct: '',
        customTypeOfMould: '',
        customPinType: ''
      };
      
      // Check Type of Product
      const validProductTypes = ['Power Cord', 'Extension Cord', 'Cable Assembly'];
      if (product.typeOfProduct && !validProductTypes.includes(product.typeOfProduct)) {
        newCustomValues.customTypeOfProduct = product.typeOfProduct;
        setFormData(prev => ({ ...prev, typeOfProduct: 'Others' }));
      }
      
      // Check Type of Mould
      const validMouldTypes = ['6Amp', '16Amp'];
      if (product.typeOfMould && !validMouldTypes.includes(product.typeOfMould)) {
        newCustomValues.customTypeOfMould = product.typeOfMould;
        setFormData(prev => ({ ...prev, typeOfMould: 'Others' }));
      }
      
      // Check Pin Type
      const validPinTypes = ['Hollow', 'Solid', 'Insert Hollow', 'Insert Solid', 'Sleeve-H', 'Sleeve-Solid'];
      if (product.pinType && !validPinTypes.includes(product.pinType)) {
        newCustomValues.customPinType = product.pinType;
        setFormData(prev => ({ ...prev, pinType: 'Others' }));
      }
      
      // Check Core Colors
      const validColors = ['Red', 'Black', 'Blue', 'Brown', 'Green', 'Yellow-Green', 'Orange', 'White'];
      if (product.coreColors && Array.isArray(product.coreColors)) {
        const customColors = product.coreColors.filter(color => !validColors.includes(color));
        if (customColors.length > 0) {
          newCustomValues.customCoreColor = customColors.join(', ');
          setFormData(prev => ({ 
            ...prev, 
            coreColors: [...product.coreColors.filter(color => validColors.includes(color)), 'Others'] 
          }));
        }
      }
      
      setCustomValues(newCustomValues);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [product]);

  // Auto-select next incomplete core when current one is completed
  useEffect(() => {
    if (formData.selectedCore && isCoreCompleted(formData.selectedCore)) {
      const nextCore = getNextIncompleteCore();
      if (nextCore && nextCore !== formData.selectedCore) {
        setFormData(prev => ({ ...prev, selectedCore: nextCore }));
      }
    }
  }, [formData.selectedCore]);

  // Auto-progress to next core when current core is completed
  useEffect(() => {
    if (formData.coreColors && formData.coreColors.length > 0) {
      // Check if current core is completed
      if (formData.selectedCore && isCoreCompleted(formData.selectedCore)) {
        const nextCore = getNextIncompleteCore();
        if (nextCore && nextCore !== formData.selectedCore) {
          setFormData(prev => ({ ...prev, selectedCore: nextCore }));
        }
      } else if (!formData.selectedCore) {
        // If no core is selected, select the first incomplete one
        const firstIncomplete = getNextIncompleteCore();
        if (firstIncomplete) {
          setFormData(prev => ({ ...prev, selectedCore: firstIncomplete }));
        }
      }
    }
  }, [formData.coreColors, formData.selectedCore, formData.coreRedSheathLength, formData.coreRedStripLength, formData.coreRedSleeve, formData.coreRedTerminals,
      formData.coreGreenSheathLength, formData.coreGreenStripLength, formData.coreGreenSleeve, formData.coreGreenTerminals,
      formData.coreBlueSheathLength, formData.coreBlueStripLength, formData.coreBlueSleeve, formData.coreBlueTerminals]);

  // Handle product type change with auto-save
  const handleProductTypeChange = async (event, newValue) => {
    if (newValue) {
      setFormData(prev => ({ ...prev, typeOfProduct: newValue }));
      
      // Add the new type to the unique list if it's not already there
      await addProductType(newValue);
      
      // Refresh the product types list
      try {
        const updatedTypes = await getUniqueProductTypes();
        setProductTypes(updatedTypes);
      } catch (error) {
        console.error('Error refreshing product types:', error);
      }
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    // Handle dynamic core selection
    if (name === 'numberOfCore') {
      const coreCount = parseInt(value) || 0;
      const currentColors = formData.coreColors || [];
      
      // If core count is reduced, remove excess colors
      if (currentColors.length > coreCount) {
        const newColors = currentColors.slice(0, coreCount);
        setFormData(prev => ({ 
          ...prev, 
          [name]: value,
          coreColors: newColors
        }));
      } else {
        setFormData(prev => ({ ...prev, [name]: value }));
      }
    } else if (name === 'coreColors') {
      const selectedColors = value;
      const coreCount = parseInt(formData.numberOfCore) || 0;
      
      // Restrict selection to core count
      if (selectedColors.length > coreCount) {
        const restrictedColors = selectedColors.slice(0, coreCount);
        setFormData(prev => ({ ...prev, [name]: restrictedColors }));
      } else {
        setFormData(prev => ({ ...prev, [name]: value }));
      }
    } else if (name === 'commonSheathLength') {
      // Handle common sheath length - update all core sheath length fields
      const coreColors = formData.coreColors || [];
      const updatedData = { ...formData, [name]: value };
      
      // Update all core sheath length fields with the common value
      coreColors.forEach(color => {
        const fieldName = `core${color.replace('-', '').replace(' ', '')}SheathLength`;
        updatedData[fieldName] = value;
      });
      
      setFormData(updatedData);
    } else if (name.includes('SheathLength')) {
      // Handle individual core sheath length changes
      setFormData(prev => ({ ...prev, [name]: value }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleFileChange = (e, field) => {
    const file = e.target.files[0];
    if (file) {
      setFormData(prev => ({ ...prev, [field]: file }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      setError(null);

      const formDataToSend = new FormData();
      // Basic fields
      formDataToSend.append('clientCode', formData.clientCode);
      formDataToSend.append('productCode', formData.productCode);
      formDataToSend.append('productName', formData.productName);
      formDataToSend.append('description', formData.description);
      formDataToSend.append('assemblyLineManpower', formData.assemblyLineManpower);
      formDataToSend.append('cableCuttingManpower', formData.cableCuttingManpower);
      formDataToSend.append('moldingMachineManpower', formData.moldingMachineManpower);
      formDataToSend.append('packingLineManpower', formData.packingLineManpower);
      formDataToSend.append('singleShiftTarget', formData.singleShiftTarget);
      formDataToSend.append('basePrice', formData.basePrice);
      formDataToSend.append('category', formData.category);
      
      // Cable Information - Handle custom core colors
      formDataToSend.append('conductorSize', formData.conductorSize);
      formDataToSend.append('strandCount', formData.strandCount);
      formDataToSend.append('numberOfCore', formData.numberOfCore);
      
      // Process core colors - add custom color if "Others" is selected
      let finalCoreColors = [...formData.coreColors];
      if (formData.coreColors.includes('Others') && customValues.customCoreColor) {
        // Replace 'Others' with the actual custom color
        finalCoreColors = finalCoreColors.filter(c => c !== 'Others');
        finalCoreColors.push(customValues.customCoreColor);
      }
      formDataToSend.append('coreColors', JSON.stringify(finalCoreColors));
      
      formDataToSend.append('coreOD', formData.coreOD);
      formDataToSend.append('corePVC', formData.corePVC);
      formDataToSend.append('sheathOD', formData.sheathOD);
      formDataToSend.append('sheathInnerPVC', formData.sheathInnerPVC);
      formDataToSend.append('sheathOuterPVC', formData.sheathOuterPVC);
      formDataToSend.append('printingMaterial', formData.printingMaterial);
      
      // Basic Information (Additional)
      formDataToSend.append('totalLength', formData.totalLength);
      formDataToSend.append('colour', formData.colour);
      
      // Moulding Information - Side A - Use custom values if "Others" selected
      const finalTypeOfProduct = formData.typeOfProduct;
      const finalTypeOfMould = formData.typeOfMould === 'Others' && customValues.customTypeOfMould 
        ? customValues.customTypeOfMould 
        : formData.typeOfMould;
      const finalPinType = formData.pinType === 'Others' && customValues.customPinType 
        ? customValues.customPinType 
        : formData.pinType;
      
      formDataToSend.append('typeOfProduct', finalTypeOfProduct);
      formDataToSend.append('typeOfMould', finalTypeOfMould);
      formDataToSend.append('pinType', finalPinType);
      
      // Moulding Information - Side B
      formDataToSend.append('sheathLength', formData.sheathLength);
      formDataToSend.append('stripLength', formData.stripLength);
      
      // Core-specific Side B fields
      formDataToSend.append('selectedCore', formData.selectedCore || '');
      formDataToSend.append('commonSheathLength', formData.commonSheathLength || '');
      
      // Store core-specific values for each core color - Always include these for backward compatibility
      const coreFields = ['SheathLength', 'StripLength', 'Sleeve', 'Terminals'];
      ['Red', 'Green', 'Blue'].forEach(color => {
        coreFields.forEach(field => {
          const fieldName = `core${color}${field}`;
          formDataToSend.append(fieldName, formData[fieldName] || '');
        });
      });
      
      // Dynamic core fields based on selected colors
      if (finalCoreColors && finalCoreColors.length > 0) {
        finalCoreColors.forEach((color) => {
          const fieldName = `core${color.replace('-', '').replace(' ', '')}`;
          coreFields.forEach(field => {
            const fullFieldName = `${fieldName}${field}`;
            formDataToSend.append(fullFieldName, formData[fullFieldName] || '');
          });
        });
      }
      
      // Legacy fields for backward compatibility
      formDataToSend.append('coreRed', formData.coreRed || '');
      
      formDataToSend.append('sleeve', formData.sleeve);
      formDataToSend.append('terminals', formData.terminals);
      formDataToSend.append('grommetPresent', formData.grommetPresent);
      formDataToSend.append('grommetLengthFromSideB', formData.grommetLengthFromSideB);

      // Inventory Management Fields
      formDataToSend.append('currentStock', formData.currentStock);
      formDataToSend.append('minLevel', formData.minLevel);
      formDataToSend.append('maxLevel', formData.maxLevel);
      formDataToSend.append('reorderPoint', formData.reorderPoint);
      formDataToSend.append('unit', formData.unit);
      formDataToSend.append('location', formData.location);
      formDataToSend.append('lastUpdated', formData.lastUpdated);
      formDataToSend.append('status', formData.status);

      // Append all attachments
      const attachmentFields = ['drawing', 'fpa', 'pdi', 'processChecksheet', 'packagingStandard', 'bom', 'sop', 'pfc'];
      attachmentFields.forEach(field => {
        if (formData[field]) {
          formDataToSend.append(field, formData[field]);
        }
      });

      // Debug: Log form data being sent
      for (let [key, value] of formDataToSend.entries()) {
      }

      if (product) {
        await updateProductInClientsSheet(product.productCode, formDataToSend);
      } else {
        await createProductInClientsSheet(formDataToSend);
      }

      setSuccess(true);
      if (onClose) {
        onClose();
      }
    } catch (err) {
      setError(err.message || 'Failed to save product');
      console.error('Error in handleSubmit:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <LoadingSpinner message={product ? "Updating product..." : "Creating product..."} />;

  return (
    <Container maxWidth="xl" sx={{ py: 3 }}>
      <form onSubmit={handleSubmit}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" sx={{ mb: 2, fontWeight: 600 }}>
          {product ? 'Edit Product' : 'Create New Product'}
        </Typography>
        
        {/* Welcome Section */}
        <Paper sx={{ 
          p: 4, 
          mb: 3, 
          background: 'linear-gradient(135deg, #e3f2fd 0%, #f3e5f5 100%)',
          color: 'primary.main',
          borderRadius: 3,
          position: 'relative',
          overflow: 'hidden',
          border: '1px solid rgba(25, 118, 210, 0.1)'
        }}>
          <Box
            sx={{
              position: 'absolute',
              top: -50,
              right: -50,
              width: 200,
              height: 200,
              background: 'rgba(25, 118, 210, 0.05)',
              borderRadius: '50%',
              zIndex: 0
            }}
          />
          <Box sx={{ position: 'relative', zIndex: 1 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <Box>
                <Typography variant="h4" sx={{ mb: 1, fontWeight: 700, color: 'primary.main' }}>
                  {product ? 'Product Editor' : 'Product Creator'} 📦
                </Typography>
                <Typography variant="h6" sx={{ opacity: 0.8, fontWeight: 300, color: 'text.secondary' }}>
                  {product ? 'Update product information and attachments' : 'Add a new product with specifications and documents'}
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', gap: 1 }}>
                <Avatar sx={{ 
                  bgcolor: 'rgba(25, 118, 210, 0.1)', 
                  width: 64, 
                  height: 64,
                  color: 'primary.main'
                }}>
                  <Inventory sx={{ fontSize: 32 }} />
                </Avatar>
              </Box>
            </Box>
          </Box>
        </Paper>
      </Box>

      {/* Basic Information Section */}
      <Card sx={{ 
        mb: 3,
        background: '#f8f9fa',
        border: '1px solid #e0e0e0',
        borderRadius: 2
      }}>
        <CardContent sx={{ p: 4 }}>
          {error && (
            <Alert 
              severity="error" 
              sx={{ 
                mb: 3,
                borderRadius: 2,
                '& .MuiAlert-icon': { color: '#d32f2f' }
              }}
              icon={<ErrorIcon />}
            >
              <AlertTitle sx={{ fontWeight: 600 }}>Error</AlertTitle>
              {error}
            </Alert>
          )}

            <Typography 
              variant="h6" 
              sx={{ 
                mb: 3, 
                display: 'flex', 
                alignItems: 'center', 
                gap: 1,
                color: '#1976d2',
                fontWeight: 600,
                fontSize: '1.1rem'
              }}
            >
              <Inventory sx={{ color: '#1976d2' }} />
              Basic Information
            </Typography>
            
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
              {/* Row 1: Client and Product Code */}
              <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                <Box sx={{ flex: '1 1 200px', minWidth: '200px' }}>
                  <FormControl fullWidth required variant="standard">
                    <InputLabel sx={{ 
                      fontSize: '14px',
                      color: '#666',
                      '&.Mui-focused': { color: '#1976d2' }
                    }}>
                      Client
                    </InputLabel>
                    <Select
                      name="clientCode"
                      value={formData.clientCode}
                      onChange={handleChange}
                      label="Client"
                      disabled={!!product}
                      renderValue={(selected) => {
                        return selected || '';
                      }}
                      sx={{
                        '& .MuiInput-underline:before': {
                          borderBottomColor: '#e0e0e0'
                        },
                        '& .MuiInput-underline:after': {
                          borderBottomColor: '#1976d2'
                        },
                        '& .MuiInput-underline:hover:not(.Mui-disabled):before': {
                          borderBottomColor: '#1976d2'
                        },
                        '& .MuiInputBase-input': {
                          fontSize: '16px',
                          padding: '8px 0'
                        }
                      }}
                    >
                      {clients.map((client) => (
                        <MenuItem key={client.clientCode} value={client.clientCode}>
                          <Typography variant="body2" sx={{ flex: 1 }}>
                            {client.clientCode}
                          </Typography>
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Box>
                <Box sx={{ flex: '1 1 200px', minWidth: '200px' }}>
                  <TextField
                    label="Product Code *"
                    name="productCode"
                    value={formData.productCode}
                    onChange={handleChange}
                    fullWidth
                    required
                    variant="standard"
                    InputProps={{
                      startAdornment: <Inventory sx={{ mr: 1, color: '#666' }} />,
                    }}
                    sx={{
                      '& .MuiInput-underline:before': {
                        borderBottomColor: '#e0e0e0'
                      },
                      '& .MuiInput-underline:after': {
                        borderBottomColor: '#1976d2'
                      },
                      '& .MuiInput-underline:hover:not(.Mui-disabled):before': {
                        borderBottomColor: '#1976d2'
                      },
                      '& .MuiFormLabel-root': {
                        fontSize: '14px',
                        color: '#666',
                        '&.Mui-focused': {
                          color: '#1976d2'
                        }
                      },
                      '& .MuiInputBase-input': {
                        fontSize: '16px',
                        padding: '8px 0'
                      }
                    }}
                  />
                </Box>
              </Box>

              {/* Row 2: Product Name and Description */}
              <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                <Box sx={{ flex: '1 1 200px', minWidth: '200px' }}>
                  <TextField
                    label="Product Name *"
                    name="productName"
                    value={formData.productName}
                    onChange={handleChange}
                    fullWidth
                    required
                    variant="standard"
                    InputProps={{
                      startAdornment: <Description sx={{ mr: 1, color: '#666' }} />,
                    }}
                    sx={{
                      '& .MuiInput-underline:before': {
                        borderBottomColor: '#e0e0e0'
                      },
                      '& .MuiInput-underline:after': {
                        borderBottomColor: '#1976d2'
                      },
                      '& .MuiInput-underline:hover:not(.Mui-disabled):before': {
                        borderBottomColor: '#1976d2'
                      },
                      '& .MuiFormLabel-root': {
                        fontSize: '14px',
                        color: '#666',
                        '&.Mui-focused': {
                          color: '#1976d2'
                        }
                      },
                      '& .MuiInputBase-input': {
                        fontSize: '16px',
                        padding: '8px 0'
                      }
                    }}
                  />
                </Box>
                <Box sx={{ flex: '1 1 200px', minWidth: '200px' }}>
                  <TextField
                    label="Description"
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                    fullWidth
                    multiline
                    rows={3}
                    variant="standard"
                    sx={{
                      '& .MuiInput-underline:before': {
                        borderBottomColor: '#e0e0e0'
                      },
                      '& .MuiInput-underline:after': {
                        borderBottomColor: '#1976d2'
                      },
                      '& .MuiInput-underline:hover:not(.Mui-disabled):before': {
                        borderBottomColor: '#1976d2'
                      },
                      '& .MuiFormLabel-root': {
                        fontSize: '14px',
                        color: '#666',
                        '&.Mui-focused': {
                          color: '#1976d2'
                        }
                      },
                      '& .MuiInputBase-input': {
                        fontSize: '16px',
                        padding: '8px 0'
                      }
                    }}
                  />
                </Box>
              </Box>

              {/* Row 3: Manpower Sub-fields */}
              <Box sx={{ mb: 3, p: 2, backgroundColor: '#f8f9fa', borderRadius: 2, border: '1px solid #e0e0e0' }}>
                <Typography variant="h6" sx={{ mb: 2, color: '#1976d2', fontWeight: 600, display: 'flex', alignItems: 'center' }}>
                  <People sx={{ mr: 1 }} />
                  Manpower Required
                </Typography>
                <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                  <Box sx={{ flex: '1 1 150px', minWidth: '150px' }}>
                    <TextField
                      label="Assembly Line Manpower"
                      name="assemblyLineManpower"
                      value={formData.assemblyLineManpower}
                      onChange={handleChange}
                      fullWidth
                      variant="standard"
                      type="number"
                      InputProps={{
                        inputProps: { min: 0, step: 1 }
                      }}
                      sx={{
                        '& .MuiInput-underline:before': {
                          borderBottomColor: '#e0e0e0'
                        },
                        '& .MuiInput-underline:after': {
                          borderBottomColor: '#1976d2'
                        },
                        '& .MuiInput-underline:hover:not(.Mui-disabled):before': {
                          borderBottomColor: '#1976d2'
                        },
                        '& .MuiFormLabel-root': {
                          fontSize: '14px',
                          color: '#666',
                          '&.Mui-focused': {
                            color: '#1976d2'
                          }
                        },
                        '& .MuiInputBase-input': {
                          fontSize: '16px',
                          padding: '8px 0'
                        }
                      }}
                    />
                  </Box>
                  <Box sx={{ flex: '1 1 150px', minWidth: '150px' }}>
                    <TextField
                      label="Cable Cutting Manpower"
                      name="cableCuttingManpower"
                      value={formData.cableCuttingManpower}
                      onChange={handleChange}
                      fullWidth
                      variant="standard"
                      type="number"
                      InputProps={{
                        inputProps: { min: 0, step: 1 }
                      }}
                      sx={{
                        '& .MuiInput-underline:before': {
                          borderBottomColor: '#e0e0e0'
                        },
                        '& .MuiInput-underline:after': {
                          borderBottomColor: '#1976d2'
                        },
                        '& .MuiInput-underline:hover:not(.Mui-disabled):before': {
                          borderBottomColor: '#1976d2'
                        },
                        '& .MuiFormLabel-root': {
                          fontSize: '14px',
                          color: '#666',
                          '&.Mui-focused': {
                            color: '#1976d2'
                          }
                        },
                        '& .MuiInputBase-input': {
                          fontSize: '16px',
                          padding: '8px 0'
                        }
                      }}
                    />
                  </Box>
                  <Box sx={{ flex: '1 1 150px', minWidth: '150px' }}>
                    <TextField
                      label="Molding Machine Manpower"
                      name="moldingMachineManpower"
                      value={formData.moldingMachineManpower}
                      onChange={handleChange}
                      fullWidth
                      variant="standard"
                      type="number"
                      InputProps={{
                        inputProps: { min: 0, step: 1 }
                      }}
                      sx={{
                        '& .MuiInput-underline:before': {
                          borderBottomColor: '#e0e0e0'
                        },
                        '& .MuiInput-underline:after': {
                          borderBottomColor: '#1976d2'
                        },
                        '& .MuiInput-underline:hover:not(.Mui-disabled):before': {
                          borderBottomColor: '#1976d2'
                        },
                        '& .MuiFormLabel-root': {
                          fontSize: '14px',
                          color: '#666',
                          '&.Mui-focused': {
                            color: '#1976d2'
                          }
                        },
                        '& .MuiInputBase-input': {
                          fontSize: '16px',
                          padding: '8px 0'
                        }
                      }}
                    />
                  </Box>
                  <Box sx={{ flex: '1 1 150px', minWidth: '150px' }}>
                    <TextField
                      label="Packing Line Manpower"
                      name="packingLineManpower"
                      value={formData.packingLineManpower}
                      onChange={handleChange}
                      fullWidth
                      variant="standard"
                      type="number"
                      InputProps={{
                        inputProps: { min: 0, step: 1 }
                      }}
                      sx={{
                        '& .MuiInput-underline:before': {
                          borderBottomColor: '#e0e0e0'
                        },
                        '& .MuiInput-underline:after': {
                          borderBottomColor: '#1976d2'
                        },
                        '& .MuiInput-underline:hover:not(.Mui-disabled):before': {
                          borderBottomColor: '#1976d2'
                        },
                        '& .MuiFormLabel-root': {
                          fontSize: '14px',
                          color: '#666',
                          '&.Mui-focused': {
                            color: '#1976d2'
                          }
                        },
                        '& .MuiInputBase-input': {
                          fontSize: '16px',
                          padding: '8px 0'
                        }
                      }}
                    />
                  </Box>
                </Box>
                <Typography variant="body2" sx={{ mt: 1, color: '#666', fontStyle: 'italic' }}>
                  Total Manpower: {parseInt(formData.assemblyLineManpower || 0) + parseInt(formData.cableCuttingManpower || 0) + parseInt(formData.moldingMachineManpower || 0) + parseInt(formData.packingLineManpower || 0)}
                </Typography>
              </Box>

              {/* Row 4: Target, Price */}
              <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                <Box sx={{ flex: '1 1 150px', minWidth: '150px' }}>
                  <TextField
                    label="Single Shift Target"
                    name="singleShiftTarget"
                    value={formData.singleShiftTarget}
                    onChange={handleChange}
                    fullWidth
                    variant="standard"
                    placeholder="e.g., 100"
                    sx={{
                      '& .MuiInput-underline:before': {
                        borderBottomColor: '#e0e0e0'
                      },
                      '& .MuiInput-underline:after': {
                        borderBottomColor: '#1976d2'
                      },
                      '& .MuiInput-underline:hover:not(.Mui-disabled):before': {
                        borderBottomColor: '#1976d2'
                      },
                      '& .MuiFormLabel-root': {
                        fontSize: '14px',
                        color: '#666',
                        '&.Mui-focused': {
                          color: '#1976d2'
                        }
                      },
                      '& .MuiInputBase-input': {
                        fontSize: '16px',
                        padding: '8px 0'
                      }
                    }}
                  />
                </Box>
                <Box sx={{ flex: '1 1 150px', minWidth: '150px' }}>
                  <TextField
                    label="Base Price"
                    name="basePrice"
                    value={formData.basePrice}
                    onChange={handleChange}
                    fullWidth
                    variant="standard"
                    placeholder="e.g., 1500"
                    sx={{
                      '& .MuiInput-underline:before': {
                        borderBottomColor: '#e0e0e0'
                      },
                      '& .MuiInput-underline:after': {
                        borderBottomColor: '#1976d2'
                      },
                      '& .MuiInput-underline:hover:not(.Mui-disabled):before': {
                        borderBottomColor: '#1976d2'
                      },
                      '& .MuiFormLabel-root': {
                        fontSize: '14px',
                        color: '#666',
                        '&.Mui-focused': {
                          color: '#1976d2'
                        }
                      },
                      '& .MuiInputBase-input': {
                        fontSize: '16px',
                        padding: '8px 0'
                      }
                    }}
                  />
                </Box>
              </Box>

              {/* Row 4: Category */}
              <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                <Box sx={{ flex: '1 1 200px', minWidth: '200px' }}>
                  <TextField
                    label="Category"
                    name="category"
                    value={formData.category}
                    onChange={handleChange}
                    fullWidth
                    variant="standard"
                    placeholder="e.g., Power Cords, Cables, etc."
                    sx={{
                      '& .MuiInput-underline:before': {
                        borderBottomColor: '#e0e0e0'
                      },
                      '& .MuiInput-underline:after': {
                        borderBottomColor: '#1976d2'
                      },
                      '& .MuiInput-underline:hover:not(.Mui-disabled):before': {
                        borderBottomColor: '#1976d2'
                      },
                      '& .MuiFormLabel-root': {
                        fontSize: '14px',
                        color: '#666',
                        '&.Mui-focused': {
                          color: '#1976d2'
                        }
                      },
                      '& .MuiInputBase-input': {
                        fontSize: '16px',
                        padding: '8px 0'
                      }
                    }}
                  />
                </Box>
              </Box>
            </Box>
        </CardContent>
      </Card>

      {/* Cable Information Section */}
      <Card sx={{ 
        mb: 3,
        background: 'linear-gradient(135deg, rgba(33, 150, 243, 0.02) 0%, rgba(33, 150, 243, 0.05) 100%)',
        border: '1px solid rgba(33, 150, 243, 0.08)',
        borderRadius: 2
      }}>
        <CardContent sx={{ p: 4 }}>
          <Typography 
            variant="h6" 
            sx={{ 
              mb: 3, 
              display: 'flex', 
              alignItems: 'center', 
              gap: 1,
              color: '#1976d2',
              fontWeight: 600,
              fontSize: '1.1rem'
            }}
          >
            <Description sx={{ color: '#1976d2' }} />
            Cable Information
          </Typography>
          
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            {/* Row 1 */}
            <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
              <Box sx={{ flex: '1 1 200px', minWidth: '200px' }}>
                <TextField
                  label="Copper Gauge"
                  name="conductorSize"
                  value={formData.conductorSize}
                  onChange={handleChange}
                  fullWidth
                  variant="standard"
                  sx={{
                    '& .MuiInput-underline:before': { borderBottomColor: '#e0e0e0' },
                    '& .MuiInput-underline:after': { borderBottomColor: '#1976d2' },
                    '& .MuiInput-underline:hover:not(.Mui-disabled):before': { borderBottomColor: '#1976d2' },
                    '& .MuiFormLabel-root': { fontSize: '14px', color: '#666', '&.Mui-focused': { color: '#1976d2' } },
                    '& .MuiInputBase-input': { fontSize: '16px', padding: '8px 0' }
                  }}
                />
              </Box>
              <Box sx={{ flex: '1 1 200px', minWidth: '200px' }}>
                <TextField
                  label="Number of Strands"
                  name="strandCount"
                  type="number"
                  value={formData.strandCount}
                  onChange={handleChange}
                  fullWidth
                  variant="standard"
                  sx={{
                    '& .MuiInput-underline:before': { borderBottomColor: '#e0e0e0' },
                    '& .MuiInput-underline:after': { borderBottomColor: '#1976d2' },
                    '& .MuiInput-underline:hover:not(.Mui-disabled):before': { borderBottomColor: '#1976d2' },
                    '& .MuiFormLabel-root': { fontSize: '14px', color: '#666', '&.Mui-focused': { color: '#1976d2' } },
                    '& .MuiInputBase-input': { fontSize: '16px', padding: '8px 0' }
                  }}
                />
              </Box>
              <Box sx={{ flex: '1 1 200px', minWidth: '200px' }}>
                <TextField
                  label="Number of Core"
                  name="numberOfCore"
                  type="number"
                  value={formData.numberOfCore}
                  onChange={handleChange}
                  fullWidth
                  variant="standard"
                  sx={{
                    '& .MuiInput-underline:before': { borderBottomColor: '#e0e0e0' },
                    '& .MuiInput-underline:after': { borderBottomColor: '#1976d2' },
                    '& .MuiInput-underline:hover:not(.Mui-disabled):before': { borderBottomColor: '#1976d2' },
                    '& .MuiFormLabel-root': { fontSize: '14px', color: '#666', '&.Mui-focused': { color: '#1976d2' } },
                    '& .MuiInputBase-input': { fontSize: '16px', padding: '8px 0' }
                  }}
                />
              </Box>
            </Box>

            {/* Row 2 - Core Colors */}
            <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
              <Box sx={{ flex: '1 1 100%', minWidth: '200px' }}>
                <FormControl fullWidth variant="standard">
                  <InputLabel sx={{ fontSize: '14px', color: '#666', '&.Mui-focused': { color: '#1976d2' } }}>
                    Core Colors (Multiple Select)
                  </InputLabel>
                  <Select
                    multiple
                    name="coreColors"
                    value={formData.coreColors}
                    onChange={handleChange}
                    disabled={!formData.numberOfCore || parseInt(formData.numberOfCore) === 0}
                    renderValue={(selected) => (
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                        {selected.map((value) => (
                          <Chip key={value} label={value} size="small" sx={{ bgcolor: '#e3f2fd' }} />
                        ))}
                      </Box>
                    )}
                    sx={{
                      '& .MuiInput-underline:before': { borderBottomColor: '#e0e0e0' },
                      '& .MuiInput-underline:after': { borderBottomColor: '#1976d2' },
                      '& .MuiInput-underline:hover:not(.Mui-disabled):before': { borderBottomColor: '#1976d2' },
                      '& .MuiInputBase-input': { fontSize: '16px', padding: '8px 0' }
                    }}
                  >
                    {['Red', 'Black', 'Blue', 'Brown', 'Green', 'Yellow-Green', 'Orange', 'White', 'Others'].map((color) => (
                      <MenuItem key={color} value={color}>
                        <Checkbox checked={formData.coreColors.indexOf(color) > -1} />
                        {color}
                      </MenuItem>
                    ))}
                  </Select>
                  {formData.numberOfCore && parseInt(formData.numberOfCore) > 0 && (
                    <Typography variant="caption" sx={{ 
                      color: '#666', 
                      mt: 0.5, 
                      display: 'block',
                      fontStyle: 'italic'
                    }}>
                      Select up to {formData.numberOfCore} core color(s). Currently selected: {formData.coreColors?.length || 0}
                    </Typography>
                  )}
                  {(!formData.numberOfCore || parseInt(formData.numberOfCore) === 0) && (
                    <Typography variant="caption" sx={{ 
                      color: '#f44336', 
                      mt: 0.5, 
                      display: 'block',
                      fontStyle: 'italic'
                    }}>
                      Please specify the number of cores first
                    </Typography>
                  )}
                </FormControl>
              </Box>
            </Box>
            
            {/* Custom Core Color Input */}
            {formData.coreColors.includes('Others') && (
              <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                <Box sx={{ flex: '1 1 100%', minWidth: '200px' }}>
                  <TextField
                    label="Specify Other Core Color(s)"
                    value={customValues.customCoreColor}
                    onChange={(e) => setCustomValues(prev => ({ ...prev, customCoreColor: e.target.value }))}
                    fullWidth
                    variant="standard"
                    placeholder="Enter custom core color"
                    helperText="This custom color will be added to the selected colors"
                    sx={{
                      '& .MuiInput-underline:before': { borderBottomColor: '#e0e0e0' },
                      '& .MuiInput-underline:after': { borderBottomColor: '#1976d2' },
                      '& .MuiInput-underline:hover:not(.Mui-disabled):before': { borderBottomColor: '#1976d2' },
                      '& .MuiFormLabel-root': { fontSize: '14px', color: '#666', '&.Mui-focused': { color: '#1976d2' } },
                      '& .MuiInputBase-input': { fontSize: '16px', padding: '8px 0' }
                    }}
                  />
                </Box>
              </Box>
            )}

            {/* Row 3 */}
            <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
              <Box sx={{ flex: '1 1 200px', minWidth: '200px' }}>
                <TextField
                  label="Core OD"
                  name="coreOD"
                  value={formData.coreOD}
                  onChange={handleChange}
                  fullWidth
                  variant="standard"
                  sx={{
                    '& .MuiInput-underline:before': { borderBottomColor: '#e0e0e0' },
                    '& .MuiInput-underline:after': { borderBottomColor: '#1976d2' },
                    '& .MuiInput-underline:hover:not(.Mui-disabled):before': { borderBottomColor: '#1976d2' },
                    '& .MuiFormLabel-root': { fontSize: '14px', color: '#666', '&.Mui-focused': { color: '#1976d2' } },
                    '& .MuiInputBase-input': { fontSize: '16px', padding: '8px 0' }
                  }}
                />
              </Box>
              <Box sx={{ flex: '1 1 200px', minWidth: '200px' }}>
                <TextField
                  label="Core PVC"
                  name="corePVC"
                  value={formData.corePVC}
                  onChange={handleChange}
                  fullWidth
                  variant="standard"
                  sx={{
                    '& .MuiInput-underline:before': { borderBottomColor: '#e0e0e0' },
                    '& .MuiInput-underline:after': { borderBottomColor: '#1976d2' },
                    '& .MuiInput-underline:hover:not(.Mui-disabled):before': { borderBottomColor: '#1976d2' },
                    '& .MuiFormLabel-root': { fontSize: '14px', color: '#666', '&.Mui-focused': { color: '#1976d2' } },
                    '& .MuiInputBase-input': { fontSize: '16px', padding: '8px 0' }
                  }}
                />
              </Box>
              <Box sx={{ flex: '1 1 200px', minWidth: '200px' }}>
                <TextField
                  label="Sheath OD"
                  name="sheathOD"
                  value={formData.sheathOD}
                  onChange={handleChange}
                  fullWidth
                  variant="standard"
                  sx={{
                    '& .MuiInput-underline:before': { borderBottomColor: '#e0e0e0' },
                    '& .MuiInput-underline:after': { borderBottomColor: '#1976d2' },
                    '& .MuiInput-underline:hover:not(.Mui-disabled):before': { borderBottomColor: '#1976d2' },
                    '& .MuiFormLabel-root': { fontSize: '14px', color: '#666', '&.Mui-focused': { color: '#1976d2' } },
                    '& .MuiInputBase-input': { fontSize: '16px', padding: '8px 0' }
                  }}
                />
              </Box>
            </Box>

            {/* Row 4 */}
            <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
              <Box sx={{ flex: '1 1 200px', minWidth: '200px' }}>
                <TextField
                  label="Sheath Inner PVC"
                  name="sheathInnerPVC"
                  value={formData.sheathInnerPVC}
                  onChange={handleChange}
                  fullWidth
                  variant="standard"
                  sx={{
                    '& .MuiInput-underline:before': { borderBottomColor: '#e0e0e0' },
                    '& .MuiInput-underline:after': { borderBottomColor: '#1976d2' },
                    '& .MuiInput-underline:hover:not(.Mui-disabled):before': { borderBottomColor: '#1976d2' },
                    '& .MuiFormLabel-root': { fontSize: '14px', color: '#666', '&.Mui-focused': { color: '#1976d2' } },
                    '& .MuiInputBase-input': { fontSize: '16px', padding: '8px 0' }
                  }}
                />
              </Box>
              <Box sx={{ flex: '1 1 200px', minWidth: '200px' }}>
                <TextField
                  label="Sheath Outer PVC"
                  name="sheathOuterPVC"
                  value={formData.sheathOuterPVC}
                  onChange={handleChange}
                  fullWidth
                  variant="standard"
                  sx={{
                    '& .MuiInput-underline:before': { borderBottomColor: '#e0e0e0' },
                    '& .MuiInput-underline:after': { borderBottomColor: '#1976d2' },
                    '& .MuiInput-underline:hover:not(.Mui-disabled):before': { borderBottomColor: '#1976d2' },
                    '& .MuiFormLabel-root': { fontSize: '14px', color: '#666', '&.Mui-focused': { color: '#1976d2' } },
                    '& .MuiInputBase-input': { fontSize: '16px', padding: '8px 0' }
                  }}
                />
              </Box>
              <Box sx={{ flex: '1 1 200px', minWidth: '200px' }}>
                <TextField
                  label="Printing Material"
                  name="printingMaterial"
                  value={formData.printingMaterial}
                  onChange={handleChange}
                  fullWidth
                  variant="standard"
                  sx={{
                    '& .MuiInput-underline:before': { borderBottomColor: '#e0e0e0' },
                    '& .MuiInput-underline:after': { borderBottomColor: '#1976d2' },
                    '& .MuiInput-underline:hover:not(.Mui-disabled):before': { borderBottomColor: '#1976d2' },
                    '& .MuiFormLabel-root': { fontSize: '14px', color: '#666', '&.Mui-focused': { color: '#1976d2' } },
                    '& .MuiInputBase-input': { fontSize: '16px', padding: '8px 0' }
                  }}
                />
              </Box>
            </Box>
          </Box>
        </CardContent>
      </Card>

      {/* Additional Basic Information Section */}
      <Card sx={{ 
        mb: 3,
        background: 'linear-gradient(135deg, rgba(76, 175, 80, 0.02) 0%, rgba(76, 175, 80, 0.05) 100%)',
        border: '1px solid rgba(76, 175, 80, 0.08)',
        borderRadius: 2
      }}>
        <CardContent sx={{ p: 4 }}>
          <Typography 
            variant="h6" 
            sx={{ 
              mb: 3, 
              display: 'flex', 
              alignItems: 'center', 
              gap: 1,
              color: '#4caf50',
              fontWeight: 600,
              fontSize: '1.1rem'
            }}
          >
            <Inventory sx={{ color: '#4caf50' }} />
            Product Specifications
          </Typography>
          
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
              <Box sx={{ flex: '1 1 200px', minWidth: '200px' }}>
                <TextField
                  label="Length per piece"
                  name="totalLength"
                  value={formData.totalLength}
                  onChange={handleChange}
                  fullWidth
                  variant="standard"
                  placeholder="e.g., 1.5"
                  InputProps={{ endAdornment: 'meters' }}
                  sx={{
                    '& .MuiInput-underline:before': { borderBottomColor: '#e0e0e0' },
                    '& .MuiInput-underline:after': { borderBottomColor: '#4caf50' },
                    '& .MuiInput-underline:hover:not(.Mui-disabled):before': { borderBottomColor: '#4caf50' },
                    '& .MuiFormLabel-root': { fontSize: '14px', color: '#666', '&.Mui-focused': { color: '#4caf50' } },
                    '& .MuiInputBase-input': { fontSize: '16px', padding: '8px 0' }
                  }}
                />
              </Box>
              <Box sx={{ flex: '1 1 200px', minWidth: '200px' }}>
                <TextField
                  label="Colour"
                  name="colour"
                  value={formData.colour}
                  onChange={handleChange}
                  fullWidth
                  variant="standard"
                  placeholder="e.g., Black, White, Grey"
                  sx={{
                    '& .MuiInput-underline:before': { borderBottomColor: '#e0e0e0' },
                    '& .MuiInput-underline:after': { borderBottomColor: '#4caf50' },
                    '& .MuiInput-underline:hover:not(.Mui-disabled):before': { borderBottomColor: '#4caf50' },
                    '& .MuiFormLabel-root': { fontSize: '14px', color: '#666', '&.Mui-focused': { color: '#4caf50' } },
                    '& .MuiInputBase-input': { fontSize: '16px', padding: '8px 0' }
                  }}
                />
              </Box>
            </Box>
          </Box>
        </CardContent>
      </Card>

      {/* Moulding Information Section */}
      <Card sx={{ 
        mb: 3,
        background: 'linear-gradient(135deg, rgba(255, 152, 0, 0.02) 0%, rgba(255, 152, 0, 0.05) 100%)',
        border: '1px solid rgba(255, 152, 0, 0.08)',
        borderRadius: 2
      }}>
        <CardContent sx={{ p: 4 }}>
          <Typography 
            variant="h6" 
            sx={{ 
              mb: 3, 
              display: 'flex', 
              alignItems: 'center', 
              gap: 1,
              color: '#ff9800',
              fontWeight: 600,
              fontSize: '1.1rem'
            }}
          >
            <Add sx={{ color: '#ff9800' }} />
            Moulding Information
          </Typography>
          
          {/* Side A */}
          <Typography 
            variant="subtitle1" 
            sx={{ 
              mb: 2, 
              fontWeight: 600,
              color: '#ff9800'
            }}
          >
            Side A
          </Typography>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, mb: 4 }}>
            <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
              <Box sx={{ flex: '1 1 200px', minWidth: '200px' }}>
                <Autocomplete
                  options={productTypes}
                  value={formData.typeOfProduct}
                  onChange={handleProductTypeChange}
                  onInputChange={handleProductTypeChange}
                  loading={loadingProductTypes}
                  freeSolo
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label="Type of Product"
                      variant="standard"
                      placeholder="Type or select product type"
                      sx={{
                        '& .MuiInput-underline:before': { borderBottomColor: '#e0e0e0' },
                        '& .MuiInput-underline:after': { borderBottomColor: '#ff9800' },
                        '& .MuiInput-underline:hover:not(.Mui-disabled):before': { borderBottomColor: '#ff9800' },
                        '& .MuiFormLabel-root': { fontSize: '14px', color: '#666', '&.Mui-focused': { color: '#ff9800' } },
                        '& .MuiInputBase-input': { fontSize: '16px', padding: '8px 0' }
                      }}
                    />
                  )}
                  renderOption={(props, option) => (
                    <Box component="li" {...props}>
                      {option}
                    </Box>
                  )}
                  noOptionsText="Type to add new product type"
                  sx={{
                    '& .MuiAutocomplete-inputRoot': {
                      padding: '8px 0',
                      fontSize: '16px'
                    }
                  }}
                />
              </Box>
              <Box sx={{ flex: '1 1 200px', minWidth: '200px' }}>
                <FormControl fullWidth variant="standard">
                  <InputLabel sx={{ fontSize: '14px', color: '#666', '&.Mui-focused': { color: '#ff9800' } }}>
                    Type of Mould
                  </InputLabel>
                  <Select
                    name="typeOfMould"
                    value={formData.typeOfMould}
                    onChange={handleChange}
                    sx={{
                      '& .MuiInput-underline:before': { borderBottomColor: '#e0e0e0' },
                      '& .MuiInput-underline:after': { borderBottomColor: '#ff9800' },
                      '& .MuiInput-underline:hover:not(.Mui-disabled):before': { borderBottomColor: '#ff9800' },
                      '& .MuiInputBase-input': { fontSize: '16px', padding: '8px 0' }
                    }}
                  >
                    <MenuItem value="6Amp">6 Amp</MenuItem>
                    <MenuItem value="16Amp">16 Amp</MenuItem>
                    <MenuItem value="Others">Others</MenuItem>
                  </Select>
                </FormControl>
              </Box>
              {formData.typeOfMould === 'Others' && (
                <Box sx={{ flex: '1 1 200px', minWidth: '200px' }}>
                  <TextField
                    label="Specify Mould Type"
                    value={customValues.customTypeOfMould}
                    onChange={(e) => setCustomValues(prev => ({ ...prev, customTypeOfMould: e.target.value }))}
                    fullWidth
                    variant="standard"
                    placeholder="Enter custom mould type"
                    sx={{
                      '& .MuiInput-underline:before': { borderBottomColor: '#e0e0e0' },
                      '& .MuiInput-underline:after': { borderBottomColor: '#ff9800' },
                      '& .MuiInput-underline:hover:not(.Mui-disabled):before': { borderBottomColor: '#ff9800' },
                      '& .MuiFormLabel-root': { fontSize: '14px', color: '#666', '&.Mui-focused': { color: '#ff9800' } },
                      '& .MuiInputBase-input': { fontSize: '16px', padding: '8px 0' }
                    }}
                  />
                </Box>
              )}
              <Box sx={{ flex: '1 1 200px', minWidth: '200px' }}>
                <FormControl fullWidth variant="standard">
                  <InputLabel sx={{ fontSize: '14px', color: '#666', '&.Mui-focused': { color: '#ff9800' } }}>
                    Pin Type
                  </InputLabel>
                  <Select
                    name="pinType"
                    value={formData.pinType}
                    onChange={handleChange}
                    sx={{
                      '& .MuiInput-underline:before': { borderBottomColor: '#e0e0e0' },
                      '& .MuiInput-underline:after': { borderBottomColor: '#ff9800' },
                      '& .MuiInput-underline:hover:not(.Mui-disabled):before': { borderBottomColor: '#ff9800' },
                      '& .MuiInputBase-input': { fontSize: '16px', padding: '8px 0' }
                    }}
                  >
                    <MenuItem value="Hollow">Hollow</MenuItem>
                    <MenuItem value="Solid">Solid</MenuItem>
                    <MenuItem value="Insert Hollow">Insert Hollow</MenuItem>
                    <MenuItem value="Insert Solid">Insert Solid</MenuItem>
                    <MenuItem value="Sleeve-H">Sleeve-H</MenuItem>
                    <MenuItem value="Sleeve-Solid">Sleeve-Solid</MenuItem>
                    <MenuItem value="Others">Others</MenuItem>
                  </Select>
                </FormControl>
              </Box>
              {formData.pinType === 'Others' && (
                <Box sx={{ flex: '1 1 200px', minWidth: '200px' }}>
                  <TextField
                    label="Specify Pin Type"
                    value={customValues.customPinType}
                    onChange={(e) => setCustomValues(prev => ({ ...prev, customPinType: e.target.value }))}
                    fullWidth
                    variant="standard"
                    placeholder="Enter custom pin type"
                    sx={{
                      '& .MuiInput-underline:before': { borderBottomColor: '#e0e0e0' },
                      '& .MuiInput-underline:after': { borderBottomColor: '#ff9800' },
                      '& .MuiInput-underline:hover:not(.Mui-disabled):before': { borderBottomColor: '#ff9800' },
                      '& .MuiFormLabel-root': { fontSize: '14px', color: '#666', '&.Mui-focused': { color: '#ff9800' } },
                      '& .MuiInputBase-input': { fontSize: '16px', padding: '8px 0' }
                    }}
                  />
                </Box>
              )}
            </Box>
          </Box>

          {/* Side B */}
          <Typography 
            variant="subtitle1" 
            sx={{ 
              mb: 2, 
              fontWeight: 600,
              color: '#ff9800'
            }}
          >
            Side B
          </Typography>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            {/* Common Sheath Length Field */}
            <Box sx={{ mb: 2, p: 2, backgroundColor: '#e3f2fd', borderRadius: 2, border: '1px solid #1976d2' }}>
              <Typography variant="h6" sx={{ mb: 2, color: '#1976d2', fontWeight: 600, display: 'flex', alignItems: 'center' }}>
                <Description sx={{ mr: 1 }} />
                Common Sheath Length
              </Typography>
              <Typography variant="body2" sx={{ mb: 2, color: '#666', fontStyle: 'italic' }}>
                Enter a value here to automatically apply it to all core sheath length fields
              </Typography>
              <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                <Box sx={{ flex: '1 1 200px', minWidth: '200px' }}>
                  <TextField
                    label="Common Sheath Length"
                    name="commonSheathLength"
                    value={formData.commonSheathLength || ''}
                    onChange={handleChange}
                    fullWidth
                    variant="standard"
                    type="number"
                    InputProps={{
                      inputProps: { min: 0, step: 0.1 }
                    }}
                    sx={{
                      '& .MuiInput-underline:before': { borderBottomColor: '#e0e0e0' },
                      '& .MuiInput-underline:after': { borderBottomColor: '#1976d2' },
                      '& .MuiInput-underline:hover:not(.Mui-disabled):before': { borderBottomColor: '#1976d2' },
                      '& .MuiFormLabel-root': { 
                        fontSize: '14px', 
                        color: '#666', 
                        '&.Mui-focused': { color: '#1976d2' } 
                      },
                      '& .MuiInputBase-input': { fontSize: '16px', padding: '8px 0' }
                    }}
                  />
                </Box>
              </Box>
            </Box>
            
            {/* Sequential Core Display */}
                    {formData.coreColors && formData.coreColors.length > 0 ? (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                {formData.coreColors.map((color, index) => {
                        return (
                    <Box key={color} sx={{ 
                      p: 3, 
                      border: '2px solid #e0e0e0',
                      borderRadius: 2,
                      backgroundColor: 'rgba(240, 240, 240, 0.3)',
                      transition: 'all 0.3s ease'
                    }}>
                      {/* Core Header */}
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                        <Box sx={{
                          width: 32,
                          height: 32,
                          borderRadius: '50%',
                          backgroundColor: '#1976d2',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: 'white',
                          fontWeight: 'bold',
                          fontSize: '14px'
                        }}>
                          {index + 1}
                        </Box>
                        <Typography variant="h6" sx={{ 
                          color: '#1976d2',
                          fontWeight: 600
                        }}>
                          Core {color}
                    </Typography>
            </Box>

                      {/* Core Fields - Always show and make editable */}
                      <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                <Box sx={{ flex: '1 1 200px', minWidth: '200px' }}>
                  <TextField
                    label="Sheath Length"
                              name={`core${color.replace('-', '').replace(' ', '')}SheathLength`}
                              value={formData[`core${color.replace('-', '').replace(' ', '')}SheathLength`] || ''}
                    onChange={handleChange}
                    fullWidth
                    variant="standard"
                    sx={{
                      '& .MuiInput-underline:before': { borderBottomColor: '#e0e0e0' },
                      '& .MuiInput-underline:after': { borderBottomColor: '#1976d2' },
                      '& .MuiInput-underline:hover:not(.Mui-disabled):before': { borderBottomColor: '#1976d2' },
                      '& .MuiFormLabel-root': { 
                        fontSize: '14px', 
                        color: '#666', 
                        '&.Mui-focused': { color: '#1976d2' } 
                      },
                      '& .MuiInputBase-input': { fontSize: '16px', padding: '8px 0' }
                    }}
                  />
                </Box>
                <Box sx={{ flex: '1 1 200px', minWidth: '200px' }}>
                  <TextField
                    label="Strip Length"
                              name={`core${color.replace('-', '').replace(' ', '')}StripLength`}
                              value={formData[`core${color.replace('-', '').replace(' ', '')}StripLength`] || ''}
                    onChange={handleChange}
                    fullWidth
                    variant="standard"
                    sx={{
                      '& .MuiInput-underline:before': { borderBottomColor: '#e0e0e0' },
                      '& .MuiInput-underline:after': { borderBottomColor: '#1976d2' },
                      '& .MuiInput-underline:hover:not(.Mui-disabled):before': { borderBottomColor: '#1976d2' },
                      '& .MuiFormLabel-root': { 
                        fontSize: '14px', 
                        color: '#666', 
                        '&.Mui-focused': { color: '#1976d2' } 
                      },
                      '& .MuiInputBase-input': { fontSize: '16px', padding: '8px 0' }
                    }}
                  />
                </Box>
                <Box sx={{ flex: '1 1 200px', minWidth: '200px' }}>
                  <TextField
                    label="Sleeve"
                              name={`core${color.replace('-', '').replace(' ', '')}Sleeve`}
                              value={formData[`core${color.replace('-', '').replace(' ', '')}Sleeve`] || ''}
                    onChange={handleChange}
                    fullWidth
                    variant="standard"
                    sx={{
                      '& .MuiInput-underline:before': { borderBottomColor: '#e0e0e0' },
                      '& .MuiInput-underline:after': { borderBottomColor: '#1976d2' },
                      '& .MuiInput-underline:hover:not(.Mui-disabled):before': { borderBottomColor: '#1976d2' },
                      '& .MuiFormLabel-root': { 
                        fontSize: '14px', 
                        color: '#666', 
                        '&.Mui-focused': { color: '#1976d2' } 
                      },
                      '& .MuiInputBase-input': { fontSize: '16px', padding: '8px 0' }
                    }}
                  />
                </Box>
                <Box sx={{ flex: '1 1 200px', minWidth: '200px' }}>
                  <TextField
                    label="Terminals"
                              name={`core${color.replace('-', '').replace(' ', '')}Terminals`}
                              value={formData[`core${color.replace('-', '').replace(' ', '')}Terminals`] || ''}
                    onChange={handleChange}
                    fullWidth
                    variant="standard"
                    sx={{
                      '& .MuiInput-underline:before': { borderBottomColor: '#e0e0e0' },
                      '& .MuiInput-underline:after': { borderBottomColor: '#1976d2' },
                      '& .MuiInput-underline:hover:not(.Mui-disabled):before': { borderBottomColor: '#1976d2' },
                      '& .MuiFormLabel-root': { 
                        fontSize: '14px', 
                        color: '#666', 
                        '&.Mui-focused': { color: '#1976d2' } 
                      },
                      '& .MuiInputBase-input': { fontSize: '16px', padding: '8px 0' }
                    }}
                  />
                </Box>
              </Box>
                    </Box>
                  );
                })}
                
                {/* Progress Summary */}
                <Box sx={{ 
                  p: 2, 
                  backgroundColor: 'rgba(33, 150, 243, 0.05)', 
                  borderRadius: 2,
                  border: '1px solid rgba(33, 150, 243, 0.1)'
                }}>
                  <Typography variant="body2" sx={{ color: '#1976d2', fontWeight: 500 }}>
                    Progress: {formData.coreColors.filter(isCoreCompleted).length} of {formData.coreColors.length} cores completed
                  </Typography>
                </Box>
              </Box>
            ) : (
              <Box sx={{ 
                p: 3, 
                border: '2px dashed #e0e0e0',
                borderRadius: 2,
                textAlign: 'center',
                backgroundColor: 'rgba(240, 240, 240, 0.3)'
              }}>
                <Typography variant="body1" sx={{ color: '#666' }}>
                  Please select core colors first to configure core specifications
                </Typography>
              </Box>
            )}

            <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center' }}>
              <Box sx={{ flex: '1 1 200px', minWidth: '200px' }}>
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={formData.grommetPresent}
                      onChange={(e) => setFormData(prev => ({ ...prev, grommetPresent: e.target.checked }))}
                      sx={{ color: '#ff9800', '&.Mui-checked': { color: '#ff9800' } }}
                    />
                  }
                  label="Grommet Present"
                  sx={{ 
                    '& .MuiFormControlLabel-label': { 
                      fontSize: '16px', 
                      color: '#666',
                      fontWeight: 500
                    } 
                  }}
                />
              </Box>
              {formData.grommetPresent && (
                <Box sx={{ flex: '1 1 200px', minWidth: '200px' }}>
                  <TextField
                    label="Grommet Length from Side B"
                    name="grommetLengthFromSideB"
                    value={formData.grommetLengthFromSideB}
                    onChange={handleChange}
                    fullWidth
                    variant="standard"
                    sx={{
                      '& .MuiInput-underline:before': { borderBottomColor: '#e0e0e0' },
                      '& .MuiInput-underline:after': { borderBottomColor: '#ff9800' },
                      '& .MuiInput-underline:hover:not(.Mui-disabled):before': { borderBottomColor: '#ff9800' },
                      '& .MuiFormLabel-root': { fontSize: '14px', color: '#666', '&.Mui-focused': { color: '#ff9800' } },
                      '& .MuiInputBase-input': { fontSize: '16px', padding: '8px 0' }
                    }}
                  />
                </Box>
              )}
            </Box>
          </Box>
        </CardContent>
      </Card>

      {/* Inventory Management Section */}
      <Card sx={{ 
        mb: 3,
        background: 'linear-gradient(135deg, rgba(76, 175, 80, 0.02) 0%, rgba(76, 175, 80, 0.05) 100%)',
        border: '1px solid rgba(76, 175, 80, 0.08)'
      }}>
        <CardContent sx={{ p: 4 }}>
          <Typography 
            variant="h6" 
            sx={{ 
              mb: 3, 
              display: 'flex', 
              alignItems: 'center', 
              gap: 1,
              color: '#4caf50',
              fontWeight: 600,
              fontSize: '1.1rem'
            }}
          >
            <Inventory sx={{ color: '#4caf50' }} />
            Inventory Management
          </Typography>
          
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            {/* Row 1: Current Stock and Min Level */}
            <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
              <Box sx={{ flex: '1 1 200px', minWidth: '200px' }}>
                <TextField
                  label="Current Stock"
                  name="currentStock"
                  value={formData.currentStock}
                  onChange={handleChange}
                  fullWidth
                  type="number"
                  variant="standard"
                  InputProps={{
                    inputProps: { min: 0, step: 1 }
                  }}
                  sx={{
                    '& .MuiInput-underline:before': {
                      borderBottomColor: '#e0e0e0'
                    },
                    '& .MuiInput-underline:after': {
                      borderBottomColor: '#4caf50'
                    },
                    '& .MuiInput-underline:hover:not(.Mui-disabled):before': {
                      borderBottomColor: '#4caf50'
                    },
                    '& .MuiFormLabel-root': {
                      fontSize: '14px',
                      color: '#666',
                      '&.Mui-focused': {
                        color: '#4caf50'
                      }
                    },
                    '& .MuiInputBase-input': {
                      fontSize: '16px',
                      padding: '8px 0'
                    }
                  }}
                />
              </Box>
              <Box sx={{ flex: '1 1 200px', minWidth: '200px' }}>
                <TextField
                  label="Min Level"
                  name="minLevel"
                  value={formData.minLevel}
                  onChange={handleChange}
                  fullWidth
                  type="number"
                  variant="standard"
                  InputProps={{
                    inputProps: { min: 0, step: 1 }
                  }}
                  sx={{
                    '& .MuiInput-underline:before': {
                      borderBottomColor: '#e0e0e0'
                    },
                    '& .MuiInput-underline:after': {
                      borderBottomColor: '#4caf50'
                    },
                    '& .MuiInput-underline:hover:not(.Mui-disabled):before': {
                      borderBottomColor: '#4caf50'
                    },
                    '& .MuiFormLabel-root': {
                      fontSize: '14px',
                      color: '#666',
                      '&.Mui-focused': {
                        color: '#4caf50'
                      }
                    },
                    '& .MuiInputBase-input': {
                      fontSize: '16px',
                      padding: '8px 0'
                    }
                  }}
                />
              </Box>
            </Box>

            {/* Row 2: Max Level and Reorder Point */}
            <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
              <Box sx={{ flex: '1 1 200px', minWidth: '200px' }}>
                <TextField
                  label="Max Level"
                  name="maxLevel"
                  value={formData.maxLevel}
                  onChange={handleChange}
                  fullWidth
                  type="number"
                  variant="standard"
                  InputProps={{
                    inputProps: { min: 0, step: 1 }
                  }}
                  sx={{
                    '& .MuiInput-underline:before': {
                      borderBottomColor: '#e0e0e0'
                    },
                    '& .MuiInput-underline:after': {
                      borderBottomColor: '#4caf50'
                    },
                    '& .MuiInput-underline:hover:not(.Mui-disabled):before': {
                      borderBottomColor: '#4caf50'
                    },
                    '& .MuiFormLabel-root': {
                      fontSize: '14px',
                      color: '#666',
                      '&.Mui-focused': {
                        color: '#4caf50'
                      }
                    },
                    '& .MuiInputBase-input': {
                      fontSize: '16px',
                      padding: '8px 0'
                    }
                  }}
                />
              </Box>
              <Box sx={{ flex: '1 1 200px', minWidth: '200px' }}>
                <TextField
                  label="Reorder Point"
                  name="reorderPoint"
                  value={formData.reorderPoint}
                  onChange={handleChange}
                  fullWidth
                  type="number"
                  variant="standard"
                  InputProps={{
                    inputProps: { min: 0, step: 1 }
                  }}
                  sx={{
                    '& .MuiInput-underline:before': {
                      borderBottomColor: '#e0e0e0'
                    },
                    '& .MuiInput-underline:after': {
                      borderBottomColor: '#4caf50'
                    },
                    '& .MuiInput-underline:hover:not(.Mui-disabled):before': {
                      borderBottomColor: '#4caf50'
                    },
                    '& .MuiFormLabel-root': {
                      fontSize: '14px',
                      color: '#666',
                      '&.Mui-focused': {
                        color: '#4caf50'
                      }
                    },
                    '& .MuiInputBase-input': {
                      fontSize: '16px',
                      padding: '8px 0'
                    }
                  }}
                />
              </Box>
            </Box>

            {/* Row 3: Unit and Location */}
            <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
              <Box sx={{ flex: '1 1 200px', minWidth: '200px' }}>
                <TextField
                  label="Unit"
                  name="unit"
                  value={formData.unit}
                  onChange={handleChange}
                  fullWidth
                  variant="standard"
                  placeholder="e.g., pieces, kg, meters"
                  sx={{
                    '& .MuiInput-underline:before': {
                      borderBottomColor: '#e0e0e0'
                    },
                    '& .MuiInput-underline:after': {
                      borderBottomColor: '#4caf50'
                    },
                    '& .MuiInput-underline:hover:not(.Mui-disabled):before': {
                      borderBottomColor: '#4caf50'
                    },
                    '& .MuiFormLabel-root': {
                      fontSize: '14px',
                      color: '#666',
                      '&.Mui-focused': {
                        color: '#4caf50'
                      }
                    },
                    '& .MuiInputBase-input': {
                      fontSize: '16px',
                      padding: '8px 0'
                    }
                  }}
                />
              </Box>
              <Box sx={{ flex: '1 1 200px', minWidth: '200px' }}>
                <TextField
                  label="Location"
                  name="location"
                  value={formData.location}
                  onChange={handleChange}
                  fullWidth
                  variant="standard"
                  placeholder="e.g., Warehouse A, Shelf B1"
                  sx={{
                    '& .MuiInput-underline:before': {
                      borderBottomColor: '#e0e0e0'
                    },
                    '& .MuiInput-underline:after': {
                      borderBottomColor: '#4caf50'
                    },
                    '& .MuiInput-underline:hover:not(.Mui-disabled):before': {
                      borderBottomColor: '#4caf50'
                    },
                    '& .MuiFormLabel-root': {
                      fontSize: '14px',
                      color: '#666',
                      '&.Mui-focused': {
                        color: '#4caf50'
                      }
                    },
                    '& .MuiInputBase-input': {
                      fontSize: '16px',
                      padding: '8px 0'
                    }
                  }}
                />
              </Box>
            </Box>

            {/* Row 4: Last Updated and Status */}
            <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
              <Box sx={{ flex: '1 1 200px', minWidth: '200px' }}>
                <TextField
                  label="Last Updated"
                  name="lastUpdated"
                  value={formData.lastUpdated}
                  onChange={handleChange}
                  fullWidth
                  type="datetime-local"
                  variant="standard"
                  InputLabelProps={{ shrink: true }}
                  sx={{
                    '& .MuiInput-underline:before': {
                      borderBottomColor: '#e0e0e0'
                    },
                    '& .MuiInput-underline:after': {
                      borderBottomColor: '#4caf50'
                    },
                    '& .MuiInput-underline:hover:not(.Mui-disabled):before': {
                      borderBottomColor: '#4caf50'
                    },
                    '& .MuiFormLabel-root': {
                      fontSize: '14px',
                      color: '#666',
                      '&.Mui-focused': {
                        color: '#4caf50'
                      }
                    },
                    '& .MuiInputBase-input': {
                      fontSize: '16px',
                      padding: '8px 0'
                    }
                  }}
                />
              </Box>
              <Box sx={{ flex: '1 1 200px', minWidth: '200px' }}>
                <FormControl fullWidth variant="standard">
                  <InputLabel sx={{ 
                    fontSize: '14px',
                    color: '#666',
                    '&.Mui-focused': { color: '#4caf50' }
                  }}>
                    Status
                  </InputLabel>
                  <Select
                    name="status"
                    value={formData.status}
                    onChange={handleChange}
                    label="Status"
                    sx={{
                      '& .MuiInput-underline:before': {
                        borderBottomColor: '#e0e0e0'
                      },
                      '& .MuiInput-underline:after': {
                        borderBottomColor: '#4caf50'
                      },
                      '& .MuiInput-underline:hover:not(.Mui-disabled):before': {
                        borderBottomColor: '#4caf50'
                      },
                      '& .MuiInputBase-input': {
                        fontSize: '16px',
                        padding: '8px 0'
                      }
                    }}
                  >
                    <MenuItem value="Active">Active</MenuItem>
                    <MenuItem value="Inactive">Inactive</MenuItem>
                    <MenuItem value="Discontinued">Discontinued</MenuItem>
                    <MenuItem value="Out of Stock">Out of Stock</MenuItem>
                  </Select>
                </FormControl>
              </Box>
            </Box>
          </Box>
        </CardContent>
      </Card>

      {/* File Attachments Section */}
      <Card sx={{ 
        mb: 3,
        background: 'linear-gradient(135deg, rgba(156, 39, 176, 0.02) 0%, rgba(156, 39, 176, 0.05) 100%)',
        border: '1px solid rgba(156, 39, 176, 0.08)'
      }}>
        <CardContent sx={{ p: 4 }}>
          <Typography 
            variant="h6" 
            sx={{ 
              mb: 3, 
              display: 'flex', 
              alignItems: 'center', 
              gap: 1,
              color: 'secondary.main',
              fontWeight: 600
            }}
          >
            <Upload />
            Document Attachments
          </Typography>
          <Grid container spacing={2}>
            {[
              { field: 'drawing', label: 'Drawing', color: 'primary' },
              { field: 'fpa', label: 'FPA', color: 'secondary' },
              { field: 'pdi', label: 'PDI', color: 'success' },
              { field: 'processChecksheet', label: 'Process Checksheet', color: 'warning' },
              { field: 'packagingStandard', label: 'Packaging Standard', color: 'error' },
              { field: 'bom', label: 'BOM', color: 'info' },
              { field: 'sop', label: 'SOP', color: 'info' },
              { field: 'pfc', label: 'PFC', color: 'grey' }
            ].map(({ field, label, color }) => (
              <Grid item xs={12} sm={6} md={4} key={field}>
                <Button
                  variant="outlined"
                  component="label"
                  startIcon={<Upload />}
                  fullWidth
                  sx={{
                    borderColor: `${color}.main`,
                    color: `${color}.main`,
                    py: 2,
                    borderRadius: 2,
                    '&:hover': {
                      borderColor: `${color}.dark`,
                      backgroundColor: `${color}.light`,
                      transform: 'translateY(-2px)',
                      transition: 'all 0.3s ease',
                      boxShadow: `0 4px 12px ${color}.main`
                    }
                  }}
                >
                  {label}
                  <input
                    type="file"
                    hidden
                    onChange={(e) => handleFileChange(e, field)}
                  />
                </Button>
                {formData[field] && (
                  <Chip
                    label={`✓ ${formData[field].name}`}
                    size="small"
                    sx={{ 
                      mt: 1, 
                      backgroundColor: `${color}.light`,
                      color: `${color}.dark`,
                      fontWeight: 500,
                      width: '100%',
                      justifyContent: 'center'
                    }}
                  />
                )}
              </Grid>
            ))}
          </Grid>
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <Card sx={{ 
        mb: 3,
        background: 'linear-gradient(135deg, rgba(76, 175, 80, 0.02) 0%, rgba(76, 175, 80, 0.05) 100%)',
        border: '1px solid rgba(76, 175, 80, 0.08)'
      }}>
        <CardContent sx={{ p: 4 }}>
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
            {onClose && (
              <Button
                variant="outlined"
                onClick={onClose}
                sx={{
                  borderColor: 'primary.main',
                  color: 'primary.main',
                  px: 4,
                  py: 1.5,
                  borderRadius: 3,
                  fontWeight: 600,
                  '&:hover': {
                    borderColor: 'primary.dark',
                    backgroundColor: 'rgba(25, 118, 210, 0.05)',
                    transform: 'translateY(-1px)',
                    transition: 'all 0.3s ease'
                  }
                }}
              >
                Cancel
              </Button>
            )}
            <Button
              type="submit"
              variant="contained"
              startIcon={<Save />}
              sx={{ 
                py: 1.5,
                px: 4,
                borderRadius: 3,
                fontSize: '1.1rem',
                fontWeight: 600,
                background: 'linear-gradient(135deg, rgba(76, 175, 80, 0.8) 0%, rgba(76, 175, 80, 0.9) 100%)',
                color: 'white',
                boxShadow: '0 2px 10px rgba(76, 175, 80, 0.2)',
                '&:hover': {
                  background: 'linear-gradient(135deg, rgba(76, 175, 80, 0.9) 0%, rgba(76, 175, 80, 1) 100%)',
                  boxShadow: '0 4px 15px rgba(76, 175, 80, 0.3)',
                  transform: 'translateY(-1px)',
                  transition: 'all 0.3s ease'
                }
              }}
            >
              {product ? 'Update Product' : 'Create Product'}
            </Button>
          </Box>
        </CardContent>
      </Card>
      </form>

      {/* Success Snackbar */}
      <Snackbar 
        open={success} 
        autoHideDuration={6000} 
        onClose={() => setSuccess(false)} 
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert 
          severity="success" 
          onClose={() => setSuccess(false)}
          sx={{ 
            width: "100%",
            borderRadius: 2,
            '& .MuiAlert-icon': { color: '#2e7d32' }
          }}
          icon={<CheckCircle />}
        >
          Product {product ? 'updated' : 'created'} successfully!
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default ProductForm; 