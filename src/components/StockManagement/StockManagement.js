import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Box,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Button,
  Typography,
  Grid,
  IconButton,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  Snackbar,
  Chip,
  Card,
  CardContent,
  CardActions,
  Stack,
  Container,
  Avatar,
  Badge,
  Fab,
  Zoom,
  LinearProgress,
  Divider,
  useTheme,
  useMediaQuery,
  CircularProgress,
  TablePagination,
  TableSortLabel,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Autocomplete,
  Checkbox,
} from "@mui/material";
import sheetService from "../../services/sheetService";
import vendorService from "../../services/vendorService";
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  Warning as WarningIcon,
  History as HistoryIcon,
  Inventory as InventoryIcon,
  Storage as StorageIcon,
  Add as AddIcon,
  Search as SearchIcon,
  Save as SaveIcon,
  Cancel as CancelIcon,
  Close as CloseIcon,
  Assignment as AssignmentIcon,
  Category as CategoryIcon,
  Analytics as AnalyticsIcon,
  CheckCircle as CheckIcon,
  Error as ErrorIcon,
  Schedule as ScheduleIcon,
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  Visibility as ViewIcon,
  LocationOn as LocationIcon,
  Scale as UnitIcon,
  InfoOutlined as InfoIcon,
  Refresh as RefreshIcon,
  Business as VendorIcon,
  Person as PersonIcon,
  Factory as FactoryIcon,
  Download as DownloadIcon,
  Print as PrintIcon,
  RemoveCircle as RemoveIcon,
  ArrowForward as ArrowForwardIcon,
  ContentCopy as QuickAddIcon,
  ShoppingCart as ShoppingCartIcon,
} from "@mui/icons-material";
import { getAllFieldValues, addCategory, addUnit, addLocation, addMake, getUniqueCategories, getUniqueUnits, getUniqueLocations, getUniqueMakes } from '../../services/stockFieldService';
import * as XLSX from 'xlsx';

const StockManagement = () => {
  // Theme and responsive design
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const isTablet = useMediaQuery(theme.breakpoints.between('md', 'lg'));
  const navigate = useNavigate();

  // State management
  const [stockItems, setStockItems] = useState([]);
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [openHistoryDialog, setOpenHistoryDialog] = useState(false);
  const [selectedItemHistory, setSelectedItemHistory] = useState([]);
  const [historyFilter, setHistoryFilter] = useState("all"); // "all" or "24h"
  const [openViewDetailsDialog, setOpenViewDetailsDialog] = useState(false);
  const [selectedItemDetails, setSelectedItemDetails] = useState(null);
  const [openQuickAddDialog, setOpenQuickAddDialog] = useState(false);
  const [quickAddItem, setQuickAddItem] = useState(null);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success",
  });
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [orderBy, setOrderBy] = useState("itemCode");
  const [order, setOrder] = useState("asc");
  const [search, setSearch] = useState("");
  const [reorderFilter, setReorderFilter] = useState("all"); // "all" or "reorder"
  const [selectedItems, setSelectedItems] = useState([]); // Array of itemCodes for bulk selection

  const [formData, setFormData] = useState({
    itemCode: "",
    itemName: "",
    category: "",
    currentStock: "",
    minLevel: "",
    maxLevel: "",
    reorderPoint: "",
    unit: "",
    location: "",
    make: "",
    vendorDetails: [], // Changed to array to support multiple vendors
    lastUpdated: new Date().toISOString().split("T")[0],
    status: "", // Auto-calculated based on stock levels
    "item specifications": "",
  });

  // State for dynamic dropdowns
  const [vendors, setVendors] = useState([]);
  const [categories, setCategories] = useState([]);
  const [units, setUnits] = useState([]);
  const [locations, setLocations] = useState([]);
  const [makes, setMakes] = useState([]);
  const [loadingVendors, setLoadingVendors] = useState(false);
  const [loadingFieldValues, setLoadingFieldValues] = useState(false);

  // Helper function to parse vendor details from sheet data (supports multiple vendors)
  const parseVendorDetails = (vendorDetailsData) => {
    if (!vendorDetailsData) {
      return [];
    }
    
    // If it's already an array, return it
    if (Array.isArray(vendorDetailsData)) {
      return vendorDetailsData.map(vendor => ({
        vendorCode: vendor.vendorCode || "",
        vendorName: vendor.vendorName || "",
        vendorContact: vendor.vendorContact || "",
        vendorEmail: vendor.vendorEmail || ""
      }));
    }
    
    // If it's a single object (legacy format), convert to array
    if (typeof vendorDetailsData === 'object') {
      return [{
        vendorCode: vendorDetailsData.vendorCode || "",
        vendorName: vendorDetailsData.vendorName || "",
        vendorContact: vendorDetailsData.vendorContact || "",
        vendorEmail: vendorDetailsData.vendorEmail || ""
      }];
    }
    
    // If it's a string, try to parse it as JSON
    if (typeof vendorDetailsData === 'string') {
      try {
        const parsed = JSON.parse(vendorDetailsData);
        if (Array.isArray(parsed)) {
          return parsed.map(vendor => ({
            vendorCode: vendor.vendorCode || "",
            vendorName: vendor.vendorName || "",
            vendorContact: vendor.vendorContact || "",
            vendorEmail: vendor.vendorEmail || ""
          }));
        } else {
          // Single vendor object
          return [{
            vendorCode: parsed.vendorCode || "",
            vendorName: parsed.vendorName || "",
            vendorContact: parsed.vendorContact || "",
            vendorEmail: parsed.vendorEmail || ""
          }];
        }
      } catch (error) {
        console.warn('Failed to parse vendorDetails JSON:', error);
        return [];
      }
    }
    
    // Fallback for any other type
    return [];
  };

  // Helper functions for managing multiple vendors
  const addVendor = () => {
    setFormData(prev => ({
      ...prev,
      vendorDetails: [
        ...prev.vendorDetails,
        {
          vendorCode: "",
          vendorName: "",
          vendorContact: "",
          vendorEmail: ""
        }
      ]
    }));
  };

  const removeVendor = (index) => {
    setFormData(prev => {
      const updatedVendorDetails = prev.vendorDetails.filter((_, i) => i !== index);

      return {
        ...prev,
        vendorDetails: updatedVendorDetails
      };
    });
  };

  const updateVendor = (index, field, value) => {
    setFormData(prev => {
      const updatedVendorDetails = prev.vendorDetails.map((vendor, i) => {
        if (i === index) {
          const updatedVendor = { ...vendor, [field]: value };
          
          // If vendor code changes, auto-fill vendor details
          if (field === 'vendorCode' && value) {
            const selectedVendor = vendors.find(v => v.vendorCode === value);
            if (selectedVendor) {
              const primaryContact = selectedVendor?.contacts?.[0] || {};
              updatedVendor.vendorName = selectedVendor.vendorName || "";
              updatedVendor.vendorContact = primaryContact.name || "";
              updatedVendor.vendorEmail = primaryContact.email || "";
            }
          }
          
          return updatedVendor;
        }
        return vendor;
      });

      return {
        ...prev,
        vendorDetails: updatedVendorDetails
      };
    });
  };

  // Primary vendor concept removed
  const setPrimaryVendor = () => {};

  const getPrimaryVendor = (vendors) => {
    // No primary; return first if exists
    return vendors[0] || null;
  };

  // Helper functions for UI
  const getStockStatusData = () => {
    const critical = stockItems.filter(item => getStockStatus(item).color === 'error').length;
    const low = stockItems.filter(item => getStockStatus(item).color === 'warning').length;
    const normal = stockItems.filter(item => getStockStatus(item).color === 'success').length;
    const overstock = stockItems.filter(item => getStockStatus(item).color === 'info').length;
    
    return { critical, low, normal, overstock };
  };

  const getRecentActivity = () => {
    // Sort by lastUpdated and get last 5
    return stockItems
      .sort((a, b) => new Date(b.lastUpdated) - new Date(a.lastUpdated))
      .slice(0, 5);
  };

  const getTotalStockValue = () => {
    return stockItems.reduce((total, item) => {
      return total + (parseFloat(item.currentStock || 0) * 1); // Assuming unit price is 1 for demo
    }, 0);
  };

  useEffect(() => {
    ensureVendorDetailsColumn();
    fetchStockItems();
    fetchVendors();
    fetchDynamicOptions();
  }, []);

  // Ensure vendorDetails column exists in the Stock sheet
  const ensureVendorDetailsColumn = async () => {
    try {
      const headers = await sheetService.getSheetHeaders("Stock");
      if (!headers.includes("vendorDetails")) {
        // Create a new sheet with proper headers including vendorDetails
        const properHeaders = [
          "itemCode", "itemName", "category", "currentStock", "minLevel", "maxLevel", 
          "reorderPoint", "unit", "location", "make", "vendorDetails", "lastUpdated"
        ];
        
        // Check if Stock sheet exists
        const sheetExists = await sheetService.doesSheetExist("Stock");
        
        if (!sheetExists) {
          await sheetService.createSheetWithHeaders("Stock", properHeaders);
        } else {
          // Get current data
          const currentData = await sheetService.getSheetData("Stock");
          
          // Update the header row to include vendorDetails
          const headerRow = {};
          properHeaders.forEach(header => {
            headerRow[header] = header;
          });
          
          await sheetService.updateRow("Stock", 1, headerRow);
          
          // Update existing rows to include empty vendorDetails
          for (let i = 0; i < currentData.length; i++) {
            const rowData = {
              ...currentData[i],
              vendorDetails: currentData[i].vendorDetails || {
                vendorCode: "",
                vendorName: "",
                vendorContact: "",
                vendorEmail: ""
              }
            };
            await sheetService.updateRow("Stock", i + 2, rowData);
          }
        }
      } else {
      }
    } catch (error) {
      console.error("Error ensuring vendorDetails column:", error);
    }
  };

  // Fetch vendors for dropdown
  const fetchVendors = async () => {
    try {
      setLoadingVendors(true);
      const vendorData = await vendorService.getVendors();
      setVendors(vendorData);
    } catch (error) {
      console.error("Error fetching vendors:", error);
      showSnackbar("Error fetching vendors", "error");
    } finally {
      setLoadingVendors(false);
    }
  };

  // Fetch dynamic options from existing stock data using our service
  const fetchDynamicOptions = async () => {
    setLoadingFieldValues(true);
    try {
      const { categories: uniqueCategories, units: uniqueUnits, locations: uniqueLocations, makes: uniqueMakes } = await getAllFieldValues();
      
      setCategories(uniqueCategories);
      setUnits(uniqueUnits);
      setLocations(uniqueLocations);
      setMakes(uniqueMakes);
    } catch (error) {
      console.error("Error fetching dynamic options:", error);
    } finally {
      setLoadingFieldValues(false);
    }
  };

  const fetchStockItems = async () => {
    try {
      setLoading(true);
      const data = await sheetService.getSheetData("Stock");
      if (data.length > 0) {
        
      }
      
      setStockItems(data);
    } catch (error) {
      showSnackbar("Error fetching stock items", "error");
    } finally {
      setLoading(false);
    }
  };

  // Generate next item code based on category
  const generateItemCode = (category) => {
    // If no category provided, use default
    if (!category || category.trim() === "") {
      return "ITM001";
    }
    
    // Generate category prefix intelligently
    const categoryTrimmed = category.trim();
    const words = categoryTrimmed.split(/\s+/); // Split by whitespace
    
    let categoryPrefix;
    if (words.length >= 2) {
      // Multi-word category: take first letter of each word (max 2 letters)
      categoryPrefix = words.slice(0, 2).map(word => word.charAt(0)).join('').toUpperCase();
    } else {
      // Single word: take first 2 letters
      categoryPrefix = categoryTrimmed.substring(0, 2).toUpperCase();
    }
    
    // Find all existing items with the same category prefix
    const sameCategoryItems = stockItems.filter(item => {
      return item.itemCode?.startsWith(categoryPrefix);
    });
    
    // Extract numeric parts from existing item codes with same prefix
    const existingNumbers = sameCategoryItems
      .map(item => {
        const match = item.itemCode?.match(new RegExp(`${categoryPrefix}(\\d+)`));
        return match ? parseInt(match[1], 10) : 0;
      })
      .filter(num => !isNaN(num));
    
    // Get the highest number
    const maxNumber = existingNumbers.length > 0 ? Math.max(...existingNumbers) : 0;
    
    // Generate next code
    const nextNumber = maxNumber + 1;
    return `${categoryPrefix}${String(nextNumber).padStart(3, '0')}`;
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // Handle vendor selection - auto-fetch vendor details
  const handleVendorChange = (event, newValue, vendorIndex = 0) => {
    updateVendor(vendorIndex, 'vendorCode', newValue || "");
  };

  // Handle category selection - add new category if not exists
  const handleCategoryChange = async (event, newValue) => {
    const categoryValue = newValue ? newValue.toString().trim() : "";
    
    // Generate item code based on category (only for new items, not editing)
    let newItemCode = formData.itemCode;
    if (!selectedItem && categoryValue) {
      newItemCode = generateItemCode(categoryValue);
    }
    
    setFormData((prev) => ({
      ...prev,
      category: categoryValue,
      itemCode: newItemCode,
    }));
    
    // Add new category to the list if it doesn't exist and is not empty
    if (categoryValue && categoryValue.length > 0) {
      await addCategory(categoryValue);
      // Refresh the categories list from our service
      try {
        const updatedCategories = await getUniqueCategories();
        setCategories(updatedCategories);
      } catch (error) {
        console.error("Error refreshing categories:", error);
      }
    }
  };

  // Handle unit selection - add new unit if not exists
  const handleUnitChange = async (event, newValue) => {
    const unitValue = newValue ? newValue.toString().trim() : "";
    setFormData((prev) => ({
      ...prev,
      unit: unitValue,
    }));
    
    // Add new unit to the list if it doesn't exist and is not empty
    if (unitValue && unitValue.length > 0) {
      await addUnit(unitValue);
      // Refresh the units list from our service
      try {
        const updatedUnits = await getUniqueUnits();
        setUnits(updatedUnits);
      } catch (error) {
        console.error("Error refreshing units:", error);
      }
    }
  };

  // Handle location selection - add new location if not exists
  const handleLocationChange = async (event, newValue) => {
    const locationValue = newValue ? newValue.toString().trim() : "";
    setFormData((prev) => ({
      ...prev,
      location: locationValue,
    }));
    
    // Add new location to the list if it doesn't exist and is not empty
    if (locationValue && locationValue.length > 0) {
      await addLocation(locationValue);
      // Refresh the locations list from our service
      try {
        const updatedLocations = await getUniqueLocations();
        setLocations(updatedLocations);
      } catch (error) {
        console.error("Error refreshing locations:", error);
      }
    }
  };

  // Handle make selection - add new make if not exists
  const handleMakeChange = async (event, newValue) => {
    const makeValue = newValue ? newValue.toString().trim() : "";
    setFormData((prev) => ({
      ...prev,
      make: makeValue,
    }));
    
    // Add new make to the list if it doesn't exist and is not empty
    if (makeValue && makeValue.length > 0) {
      await addMake(makeValue);
      // Refresh the makes list from our service
      try {
        const updatedMakes = await getUniqueMakes();
        setMakes(updatedMakes);
      } catch (error) {
        console.error("Error refreshing makes:", error);
      }
    }
  };

  // Validation function
  const validateForm = () => {
    const errors = [];
    
    // Required field validations
    if (!formData.itemName || formData.itemName.trim() === "") {
      errors.push("Item Name is required");
    }
    
    // Numeric validations
    if (formData.currentStock && isNaN(parseFloat(formData.currentStock))) {
      errors.push("Current Stock must be a valid number");
    }
    
    if (formData.currentStock && parseFloat(formData.currentStock) < 0) {
      errors.push("Current Stock cannot be negative");
    }
    
    if (formData.reorderPoint && isNaN(parseFloat(formData.reorderPoint))) {
      errors.push("Reorder Point must be a valid number");
    }
    
    if (formData.reorderPoint && parseFloat(formData.reorderPoint) < 0) {
      errors.push("Reorder Point cannot be negative");
    }
    
    // Item name uniqueness check (case-insensitive, ignoring whitespace)
    const normalizedItemName = formData.itemName.trim().toLowerCase();
    const duplicateByName = stockItems.find(
      (item) => 
        item.itemName && 
        item.itemName.trim().toLowerCase() === normalizedItemName &&
        (!selectedItem || item.itemCode !== selectedItem.itemCode)
    );
    
    if (duplicateByName) {
      errors.push(`Item "${formData.itemName}" already exists in stock`);
    }
    
    return errors;
  };

  const handleSubmit = async () => {
    try {
      setLoading(true);
      
      // Validate form
      const validationErrors = validateForm();
      if (validationErrors.length > 0) {
        showSnackbar(validationErrors.join(", "), "error");
        setLoading(false);
        return;
      }
      
      // Auto-generate itemCode if it's a new item (not editing)
      let itemCodeToUse = formData.itemCode;
      if (!selectedItem) {
        itemCodeToUse = generateItemCode(formData.category);
      }
      
      // Ensure itemCode is present
      if (!itemCodeToUse) {
        showSnackbar("Item Code generation failed", "error");
        setLoading(false);
        return;
      }
      
      // Check if itemCode already exists (case-insensitive) - should not happen with auto-generation
      const existingIndex = stockItems.findIndex(
        (item) => (item.itemCode || "").toUpperCase() === itemCodeToUse.toUpperCase()
      );
      
      if (existingIndex !== -1 && !selectedItem) {
        // If item exists and we're not editing, it's a duplicate
        showSnackbar("Item Code already exists. Please try again.", "error");
        setLoading(false);
        return;
      }
      
      // Sanitize and prepare data
      const currentStockValue = formData.currentStock ? parseFloat(formData.currentStock).toString() : "0";
      const minLevelValue = formData.minLevel ? parseFloat(formData.minLevel).toString() : "";
      const maxLevelValue = formData.maxLevel ? parseFloat(formData.maxLevel).toString() : "";
      const reorderPointValue = formData.reorderPoint ? parseFloat(formData.reorderPoint).toString() : "";
      
      // Auto-calculate status based on stock levels
      const autoStatus = calculateStatus(currentStockValue, minLevelValue, maxLevelValue, reorderPointValue);
      
      const dataToSave = {
        ...formData,
        itemCode: itemCodeToUse,
        itemName: formData.itemName.trim(),
        category: formData.category ? formData.category.trim() : "",
        currentStock: currentStockValue,
        minLevel: minLevelValue,
        maxLevel: maxLevelValue,
        reorderPoint: reorderPointValue,
        unit: formData.unit ? formData.unit.trim() : "",
        location: formData.location ? formData.location.trim() : "",
        make: formData.make ? formData.make.trim() : "",
        vendorDetails: formData.vendorDetails, // Pass object directly, sheetService will handle JSON serialization
        status: autoStatus, // Auto-calculated status based on stock levels
        lastUpdated: new Date().toISOString().split("T")[0],
      };
      if (selectedItem) {
        // Update existing row
        const updateIndex = stockItems.findIndex(
          (item) => item.itemCode === selectedItem.itemCode
        );
        
        if (updateIndex === -1) {
          showSnackbar("Item not found for update", "error");
          setLoading(false);
          return;
        }
        
        await handleUpdate(updateIndex, dataToSave);
        setOpenDialog(false);
        showSnackbar("Stock item updated successfully");
      } else {
        // Add new row
        await sheetService.appendRow("Stock", dataToSave);
        setOpenDialog(false);
        showSnackbar("Stock item added successfully");
      }
      fetchStockItems();
      fetchDynamicOptions(); // Refresh dynamic dropdown options
      resetForm();
    } catch (error) {
      console.error("Error in handleSubmit:", error);
      showSnackbar("Error adding/updating stock item: " + error.message, "error");
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async (rowIndex, newData) => {
    try {
      await sheetService.updateRow("Stock", rowIndex + 2, {
        ...newData,
        lastUpdated: new Date().toISOString().split("T")[0],
      });
      showSnackbar("Stock item updated successfully");
      fetchStockItems();
    } catch (error) {
      showSnackbar("Error updating stock item", "error");
    }
  };

  const handleDelete = async (item) => {
    if (!window.confirm(`Are you sure you want to delete ${item.itemName}?`)) {
      return;
    }

    try {
      setLoading(true);
      const rowIndex = stockItems.findIndex(
        (stockItem) => stockItem.itemCode === item.itemCode
      );
      if (rowIndex !== -1) {
      await sheetService.deleteRow("Stock", rowIndex + 2);
      showSnackbar("Stock item deleted successfully");
      fetchStockItems();
      }
    } catch (error) {
      showSnackbar("Error deleting stock item", "error");
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      itemCode: "",
      itemName: "",
      category: "",
      currentStock: "",
      minLevel: "",
      maxLevel: "",
      reorderPoint: "",
      unit: "",
      location: "",
      make: "",
      vendorDetails: [], // Reset to empty array for multiple vendors
      lastUpdated: new Date().toISOString().split("T")[0],
      status: "", // Auto-calculated based on stock levels
      "item specifications": "",
    });
  };

  const showSnackbar = (message, severity = "success") => {
    setSnackbar({ open: true, message, severity });
  };

  // Calculate stock status based on levels
  const calculateStatus = (currentStock, minLevel, maxLevel, reorderPoint) => {
    const current = parseFloat(currentStock || 0);
    const min = parseFloat(minLevel || 0);
    const max = parseFloat(maxLevel || Infinity);
    const reorder = parseFloat(reorderPoint || 0);

    if (current <= min) {
      return "Critical";
    } else if (current <= reorder) {
      return "Reorder";
    } else if (current > max) {
      return "Overstock";
    }
    return "Available";
  };

  const getStockStatus = (item) => {
    const current = parseFloat(item.currentStock);
    const min = parseFloat(item.minLevel);
    const max = parseFloat(item.maxLevel);
    const reorder = parseFloat(item.reorderPoint);

    if (current <= min) {
      return { label: "Critical", color: "error" };
    } else if (current <= reorder) {
      return { label: "Reorder", color: "warning" };
    } else if (current > max) {
      return { label: "Overstock", color: "info" };
    }
    return { label: "Available", color: "success" };
  };

  const getStockStatusIcon = (item) => {
    const status = getStockStatus(item);
    switch (status.color) {
      case 'error':
        return <ErrorIcon color="error" />;
      case 'warning':
        return <WarningIcon color="warning" />;
      case 'info':
        return <InfoIcon color="info" />;
      default:
        return <CheckIcon color="success" />;
    }
  };

  const handleEdit = (item) => {
    setSelectedItem(item);
    
    // Refresh dropdown options to get latest data
    fetchDynamicOptions();
    
    // Parse vendorDetails using the helper function
    const vendorDetails = parseVendorDetails(item.vendorDetails);
    setFormData({
      ...item,
      category: item.category || "",
      unit: item.unit || "",
      vendorDetails: vendorDetails
    });
    setOpenDialog(true);
  };

  const handleViewHistory = (item) => {
    // In a real application, this would fetch the item's history from the backend
    const mockHistory = [
      {
        date: new Date(),
        type: "IN",
        quantity: 100,
        reference: "PO-001",
        remarks: "Purchase order received",
      },
      {
        date: new Date(),
        type: "OUT",
        quantity: -20,
        reference: "KIT-001",
        remarks: "Issued for kitting",
      },
      {
        date: new Date(Date.now() - 86400000),
        type: "IN",
        quantity: 50,
        reference: "PO-002",
        remarks: "Additional stock",
      },
    ];
    setSelectedItemHistory(mockHistory);
    setSelectedItem(item);
    setHistoryFilter("all"); // Reset filter when opening dialog
    setOpenHistoryDialog(true);
  };

  const handleViewDetails = (item) => {
    setSelectedItemDetails(item);
    setOpenViewDetailsDialog(true);
  };

  const handleQuickAdd = (item) => {
    // Generate unique item code with same number of digits as original
    const generateUniqueItemCode = (originalCode) => {
      // Extract the base pattern (letters/prefix) from original code
      const basePattern = originalCode.replace(/\d/g, ''); // Remove all digits, keep letters
      const originalDigits = originalCode.replace(/\D/g, ''); // Extract only digits
      const digitCount = originalDigits.length; // Count of digits in original
      
      let newCode;
      let counter = 1;
      
      do {
        // Generate new number with same digit count
        const newNumber = counter.toString().padStart(digitCount, '0');
        newCode = `${basePattern}${newNumber}`;
        counter++;
        
        // If counter exceeds the digit limit, add more digits
        if (counter > Math.pow(10, digitCount) - 1) {
          const extendedNumber = counter.toString().padStart(digitCount + 1, '0');
          newCode = `${basePattern}${extendedNumber}`;
        }
      } while (stockItems.some(existingItem => existingItem.itemCode === newCode));
      
      return newCode;
    };

    // Create a copy of the item with a unique item code
    const quickAddData = {
      ...item,
      originalItemCode: item.itemCode, // Store original item code for display
      itemCode: generateUniqueItemCode(item.itemCode), // Generate unique item code with same format
      itemName: item.itemName, // Keep original name
      currentStock: Number(item?.closingBalance ?? item?.currentStock ?? 0),
      openingBalance: 0, // Reset quantities
      inQty: 0,
      outQty: 0,
      closingBalance: 0,
      minLevel: item.minLevel,
      maxLevel: item.maxLevel,
      reorderLevel: item.reorderLevel,
      vendorDetails: parseVendorDetails(item.vendorDetails), // Copy vendor details from original
      // Keep other details like category, unit, location, make, etc.
    };
    setQuickAddItem(quickAddData);
    setOpenQuickAddDialog(true);
  };

  const handleQuickAddSubmit = async () => {
    if (!quickAddItem) return;
    
    try {
      setLoading(true);
      
      // Validate required fields
      if (!quickAddItem.itemCode || !quickAddItem.itemName || !quickAddItem.category || !quickAddItem.unit || !quickAddItem.location) {
        setSnackbar({
          open: true,
          message: "Please fill in all required fields",
          severity: "error"
        });
        return;
      }

      // Check if item code already exists
      const existingItem = stockItems.find(item => item.itemCode === quickAddItem.itemCode);
      if (existingItem) {
        setSnackbar({
          open: true,
          message: "Item code already exists. Please use a different code.",
          severity: "error"
        });
        return;
      }

      // Create new item data
      const current = Number(quickAddItem.currentStock || 0);
      const newItem = {
        ...quickAddItem,
        currentStock: current,
        openingBalance: current,
        inQty: 0,
        outQty: 0,
        closingBalance: current,
        vendorDetails: quickAddItem.vendorDetails || [], // Include vendor details
        lastUpdated: new Date().toISOString(),
        createdBy: "Current User", // You can get this from auth context
        status: "Active"
      };

      // Add to stock items and save to backend
      setStockItems(prevItems => [...prevItems, newItem]);
      
      // Save to Google Sheets backend
      try {
        await sheetService.appendRow("Stock", newItem);
        // Refresh stock items from Google Sheets to get the latest data
        await fetchStockItems();
        await fetchDynamicOptions(); // Refresh dynamic dropdown options
      } catch (error) {
        console.error('Error saving to Google Sheets:', error);
        // Still show success message as item is added to local state
        // The user can refresh to get the latest data from sheets
      }
      
      setSnackbar({
        open: true,
        message: `Item "${newItem.itemName}" created successfully!`,
        severity: "success"
      });
      
      // Close dialog and reset
      setOpenQuickAddDialog(false);
      setQuickAddItem(null);
      
    } catch (error) {
      console.error("Error creating item:", error);
      setSnackbar({
        open: true,
        message: "Error creating item. Please try again.",
        severity: "error"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadHistory = () => {
    const filteredHistory = getFilteredHistory();
    const csvContent = generateCSVContent(filteredHistory);
    downloadCSV(csvContent, `${selectedItem?.itemCode}_stock_history.csv`);
  };

  const getFilteredHistory = () => {
    if (historyFilter === "24h") {
      const now = new Date();
      const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      return selectedItemHistory.filter(entry => new Date(entry.date) >= yesterday);
    }
    return selectedItemHistory;
  };

  const generateCSVContent = (data) => {
    const headers = ["Date", "Type", "Quantity", "Reference", "Remarks"];
    const csvRows = [headers.join(",")];
    
    data.forEach(entry => {
      const row = [
        entry.date.toLocaleDateString(),
        entry.type,
        entry.quantity,
        entry.reference,
        `"${entry.remarks}"` // Wrap remarks in quotes to handle commas
      ];
      csvRows.push(row.join(","));
    });
    
    return csvRows.join("\n");
  };

  const downloadCSV = (content, filename) => {
    const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const generateStockItemPDF = (item) => {
    const companyName = "REYANSH INTERNATIONAL PVT. LTD";
    const currentDate = new Date().toLocaleDateString('en-US', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    }).replace(/\//g, '/');
    const currentTime = new Date().toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
    
    // Create HTML content for PDF
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Stock Item Details - ${item.itemName}</title>
        <style>
          body {
            font-family: Arial, sans-serif;
            margin: 20px;
            color: #333;
          }
          .header {
            text-align: center;
            border-bottom: 2px solid #1976d2;
            padding-bottom: 20px;
            margin-bottom: 30px;
          }
          .company-name {
            font-size: 24px;
            font-weight: bold;
            color: #1976d2;
            margin-bottom: 10px;
          }
          .report-title {
            font-size: 18px;
            color: #666;
            margin-bottom: 5px;
          }
          .report-date {
            font-size: 14px;
            color: #999;
          }
          .item-details {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 20px;
            margin-bottom: 30px;
          }
          .detail-section {
            background-color: #f8f9fa;
            padding: 20px;
            border-radius: 8px;
            border-left: 4px solid #1976d2;
          }
          .detail-section h3 {
            margin: 0 0 15px 0;
            color: #1976d2;
            font-size: 16px;
          }
          .detail-row {
            display: flex;
            justify-content: space-between;
            margin-bottom: 8px;
            padding: 5px 0;
            border-bottom: 1px solid #eee;
          }
          .detail-label {
            font-weight: bold;
            color: #555;
          }
          .detail-value {
            color: #333;
          }
          .status-badge {
            display: inline-block;
            padding: 4px 12px;
            border-radius: 20px;
            font-size: 12px;
            font-weight: bold;
            text-transform: uppercase;
          }
          .status-normal { background-color: #d4edda; color: #155724; }
          .status-low { background-color: #fff3cd; color: #856404; }
          .status-critical { background-color: #f8d7da; color: #721c24; }
          .status-overstock { background-color: #d1ecf1; color: #0c5460; }
          .footer {
            margin-top: 40px;
            text-align: center;
            font-size: 12px;
            color: #999;
            border-top: 1px solid #eee;
            padding-top: 20px;
          }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="company-name">${companyName}</div>
          <div class="report-title">Stock Item Details Report</div>
          <div class="report-date">Generated on: ${currentDate} at ${currentTime}</div>
        </div>

        <div class="item-details">
          <div class="detail-section">
            <h3>Item Information</h3>
            <div class="detail-row">
              <span class="detail-label">Item Code:</span>
              <span class="detail-value">${item.itemCode || 'N/A'}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Item Name:</span>
              <span class="detail-value">${item.itemName || 'N/A'}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Category:</span>
              <span class="detail-value">${item.category || 'N/A'}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Unit:</span>
              <span class="detail-value">${item.unit || 'N/A'}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Location:</span>
              <span class="detail-value">${item.location || 'N/A'}</span>
            </div>
          </div>

          <div class="detail-section">
            <h3>Stock Levels</h3>
            <div class="detail-row">
              <span class="detail-label">Current Stock:</span>
              <span class="detail-value">${item.currentStock || '0'}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Minimum Level:</span>
              <span class="detail-value">${item.minLevel || 'N/A'}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Maximum Level:</span>
              <span class="detail-value">${item.maxLevel || 'N/A'}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Reorder Point:</span>
              <span class="detail-value">${item.reorderPoint || 'N/A'}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Status:</span>
              <span class="detail-value">
                <span class="status-badge status-${getStockStatus(item).color}">
                  ${getStockStatus(item).label}
                </span>
              </span>
            </div>
          </div>
        </div>

        ${item["item specifications"] ? `
          <div class="detail-section" style="grid-column: 1 / -1;">
            <h3>Item Specifications</h3>
            <div style="padding: 10px; background-color: #f8f9fa; border-radius: 4px; white-space: pre-wrap;">
              ${item["item specifications"]}
            </div>
          </div>
        ` : ''}

        <div class="footer">
          <p>Generated by Stock Management System</p>
        </div>
      </body>
      </html>
    `;

    // Create a new window to generate PDF
    const printWindow = window.open('', '_blank');
    printWindow.document.write(htmlContent);
    printWindow.document.close();
    
    // Wait for content to load then print
    printWindow.onload = function() {
      printWindow.print();
    };
  };

  const handleOpenDialog = () => {
    resetForm();
    setSelectedItem(null);
    // Refresh dropdown options to get latest data
    fetchDynamicOptions();
    // Item code will be generated when category is selected
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    resetForm();
    setSelectedItem(null);
  };

  const handleRequestSort = (property) => {
    const isAsc = orderBy === property && order === "asc";
    setOrder(isAsc ? "desc" : "asc");
    setOrderBy(property);
  };

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  // Helper function to calculate suggested quantity for an item
  const calculateSuggestedQuantity = (item) => {
    const currentStock = parseFloat(item.currentStock || 0);
    const reorderPoint = parseFloat(item.reorderPoint || 0);
    const maxLevel = parseFloat(item.maxLevel || 0);
    
    let suggestedQuantity = 0;
    if (maxLevel > 0 && maxLevel > currentStock) {
      // Suggest quantity to reach max level
      suggestedQuantity = maxLevel - currentStock;
    } else {
      // If no max level or already at max, suggest quantity to reach reorder point + 50% buffer
      const quantityToReorderPoint = Math.max(reorderPoint - currentStock, 0);
      const buffer = reorderPoint * 0.5; // 50% buffer
      suggestedQuantity = quantityToReorderPoint + buffer;
    }
    
    // Ensure minimum quantity is at least 1
    return Math.max(Math.ceil(suggestedQuantity), 1);
  };

  // Helper function to get specifications from item
  const getItemSpecifications = (item) => {
    const possibleSpecFields = [
      'item specifications ',
      'item specifications',
      'specifications',
      'Specifications',
      'description',
      'Description',
    ];
    
    for (const field of possibleSpecFields) {
      if (item[field]) {
        return item[field];
      }
    }
    return '';
  };

  // Handle Raise Indent - navigate to purchase flow with pre-filled data (single item)
  const handleRaiseIndent = (item) => {
    const currentStock = parseFloat(item.currentStock || 0);
    const reorderPoint = parseFloat(item.reorderPoint || 0);
    const maxLevel = parseFloat(item.maxLevel || 0);
    const minLevel = parseFloat(item.minLevel || 0);
    const suggestedQuantity = calculateSuggestedQuantity(item);
    const specifications = getItemSpecifications(item);
    
    // Prepare material intent data
    const materialIntentData = {
      itemCode: item.itemCode,
      itemName: item.itemName,
      quantity: suggestedQuantity.toString(),
      specifications: specifications,
      category: item.category,
      unit: item.unit,
      location: item.location,
      currentStock: currentStock,
      reorderPoint: reorderPoint,
      maxLevel: maxLevel,
      minLevel: minLevel
    };
    
    // Store in localStorage (RaiseIndent component reads from here)
    localStorage.setItem('materialIntentData', JSON.stringify(materialIntentData));
    
    // Navigate to raise indent page
    navigate('/purchase-flow/raise-indent');
  };

  // Handle bulk raise indent for selected items
  const handleBulkRaiseIndent = () => {
    if (selectedItems.length === 0) {
      setSnackbar({
        open: true,
        message: 'Please select at least one item to raise indent',
        severity: 'warning',
      });
      return;
    }

    // Get selected items from stockItems
    const selectedItemsData = stockItems.filter(item => 
      selectedItems.includes(item.itemCode)
    );

    // Prepare multiple items data
    const multipleItemsData = selectedItemsData.map(item => {
      const currentStock = parseFloat(item.currentStock || 0);
      const reorderPoint = parseFloat(item.reorderPoint || 0);
      const maxLevel = parseFloat(item.maxLevel || 0);
      const minLevel = parseFloat(item.minLevel || 0);
      const suggestedQuantity = calculateSuggestedQuantity(item);
      const specifications = getItemSpecifications(item);

      return {
        itemCode: item.itemCode,
        itemName: item.itemName || item.ItemName || item['Item Name'] || item.Name || '',
        quantity: suggestedQuantity.toString(),
        specifications: specifications,
        category: item.category,
        unit: item.unit,
        location: item.location,
        currentStock: currentStock,
        reorderPoint: reorderPoint,
        maxLevel: maxLevel,
        minLevel: minLevel
      };
    });

    // Store multiple items in localStorage
    localStorage.setItem('materialIntentData', JSON.stringify({
      multipleItems: true,
      items: multipleItemsData
    }));

    // Clear selection
    setSelectedItems([]);

    // Navigate to raise indent page
    navigate('/purchase-flow/raise-indent');
  };

  // Handle checkbox selection
  const handleSelectItem = (itemCode) => {
    setSelectedItems(prev => {
      if (prev.includes(itemCode)) {
        return prev.filter(code => code !== itemCode);
      } else {
        return [...prev, itemCode];
      }
    });
  };


  // Helper function to check if item needs reordering
  const needsReorder = (item) => {
    const current = parseFloat(item.currentStock || 0);
    const reorder = parseFloat(item.reorderPoint || 0);
    return current <= reorder;
  };

  const filteredItems = stockItems.filter((item) => {
    // Search filter
    const matchesSearch = search === "" ||
      String(item.itemCode).toLowerCase().includes(search.toLowerCase()) ||
      String(item.itemName).toLowerCase().includes(search.toLowerCase()) ||
      String(item.category).toLowerCase().includes(search.toLowerCase());
    
    // Reorder filter
    const matchesReorderFilter = reorderFilter === "all" || needsReorder(item);
    
    return matchesSearch && matchesReorderFilter;
  });

  const sortedItems = filteredItems.sort((a, b) => {
      // First, prioritize items that need reordering
      const aNeedsReorder = needsReorder(a);
      const bNeedsReorder = needsReorder(b);
      
      if (aNeedsReorder && !bNeedsReorder) {
        return -1; // a comes first
      }
      if (!aNeedsReorder && bNeedsReorder) {
        return 1; // b comes first
      }
      
      // If both have same reorder status, apply the original sorting
      if (order === "asc") {
        return a[orderBy] > b[orderBy] ? 1 : -1;
      } else {
        return a[orderBy] < b[orderBy] ? 1 : -1;
      }
    });

  const paginatedItems = sortedItems.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage
  );

  // Handle select all checkbox
  const handleSelectAll = (event) => {
    if (event.target.checked) {
      const allItemCodes = paginatedItems.map(item => item.itemCode);
      setSelectedItems(allItemCodes);
    } else {
      setSelectedItems([]);
    }
  };

  // Check if all items on current page are selected
  const isAllSelected = paginatedItems.length > 0 && 
    paginatedItems.every(item => selectedItems.includes(item.itemCode));
  
  // Check if some items are selected
  const isIndeterminate = selectedItems.length > 0 && 
    selectedItems.length < paginatedItems.length;

  // Get items that need reordering
  const reorderItems = filteredItems.filter(item => needsReorder(item));

  // Function to export reorder items to Excel
  const handleDownloadReorderExcel = () => {
    if (reorderItems.length === 0) {
      setSnackbar({
        open: true,
        message: "No items need reordering at this time.",
        severity: "info",
      });
      return;
    }

    // Prepare data for Excel export
    const excelData = reorderItems.map(item => {
      const vendorData = parseVendorDetails(item.vendorDetails);
      const primaryVendor = vendorData.length > 0 ? vendorData[0] : null;
      
      return {
        "Item Code": item.itemCode || "",
        "Item Name": item.itemName || "",
        "Category": item.category || "",
        "Current Stock": parseFloat(item.currentStock || 0),
        "Min Level": parseFloat(item.minLevel || 0),
        "Max Level": parseFloat(item.maxLevel || 0),
        "Reorder Point": parseFloat(item.reorderPoint || 0),
        "Unit": item.unit || "",
        "Location": item.location || "",
        "Make": item.make || "",
        "Vendor Code": primaryVendor?.vendorCode || "",
        "Vendor Name": primaryVendor?.vendorName || "",
        "Last Updated": item.lastUpdated || "",
        "Status": getStockStatus(item).label || "",
      };
    });

    // Create workbook and worksheet
    const ws = XLSX.utils.json_to_sheet(excelData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Reorder Items");

    // Set column widths
    const colWidths = [
      { wch: 15 }, // Item Code
      { wch: 30 }, // Item Name
      { wch: 15 }, // Category
      { wch: 12 }, // Current Stock
      { wch: 12 }, // Min Level
      { wch: 12 }, // Max Level
      { wch: 12 }, // Reorder Point
      { wch: 10 }, // Unit
      { wch: 15 }, // Location
      { wch: 15 }, // Make
      { wch: 15 }, // Vendor Code
      { wch: 25 }, // Vendor Name
      { wch: 15 }, // Last Updated
      { wch: 12 }, // Status
    ];
    ws['!cols'] = colWidths;

    // Generate filename with current date
    const dateStr = new Date().toISOString().split('T')[0];
    const filename = `Reorder_Items_${dateStr}.xlsx`;

    // Download the file
    XLSX.writeFile(wb, filename);

    setSnackbar({
      open: true,
      message: `Excel file with ${reorderItems.length} reorder items downloaded successfully!`,
      severity: "success",
    });
  };

  const stockStats = getStockStatusData();

  return (
    <Container maxWidth="xl" sx={{ py: 3 }}>
      {/* Header Section */}
      <Stack direction="row" alignItems="center" spacing={2} justifyContent="space-between" sx={{ mb: 3 }}>
        <Stack direction="row" alignItems="center" spacing={2}>
          <Avatar sx={{ bgcolor: theme.palette.primary.main, width: 56, height: 56 }}>
            <StorageIcon fontSize="large" />
          </Avatar>
          <Box>
            <Typography 
              variant="h4" 
              component="h1" 
          sx={{
                fontWeight: 'bold',
                background: 'linear-gradient(45deg, #1976d2, #90caf9)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}
            >
              Stock Management
            </Typography>
            <Typography variant="subtitle1" color="text.secondary">
              Inventory Control & Monitoring System
            </Typography>
          </Box>
        </Stack>
        
        <Stack direction="row" alignItems="center" spacing={2}>
          {loading && (
            <CircularProgress 
              size={24} 
              color="primary"
            />
          )}
          <Tooltip title="Next to Material Inward">
            <IconButton
              onClick={() => navigate('/inventory/stock-sheet/material-inward')}
              sx={{
                color: theme.palette.primary.main,
                bgcolor: 'rgba(25, 118, 210, 0.1)',
                '&:hover': {
                  bgcolor: 'rgba(25, 118, 210, 0.2)',
                  transform: 'scale(1.05)'
                },
                transition: 'all 0.2s ease'
              }}
            >
              <ArrowForwardIcon />
            </IconButton>
          </Tooltip>
        </Stack>
      </Stack>

      {/* Controls Card */}
      <Card sx={{ mb: 3, boxShadow: 3 }}>
        <CardContent>
          <Stack direction="row" alignItems="center" spacing={2} sx={{ mb: 2 }}>
            <InventoryIcon color="primary" />
            <Typography variant="h6" component="h2" sx={{ fontWeight: 'bold' }}>
              Inventory Management
            </Typography>
            <Button
              variant="outlined"
              size="small"
              startIcon={<RefreshIcon />}
              onClick={fetchStockItems}
              disabled={loading}
            >
              Refresh
          </Button>
          </Stack>
          
          <Grid container spacing={3} alignItems="center">
            <Grid item xs={12} md={5}>
          <TextField
                fullWidth
                label="Search Inventory"
            variant="outlined"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
                InputProps={{
                  startAdornment: <SearchIcon color="action" sx={{ mr: 1 }} />
                }}
                placeholder="Search by Item Code, Name, or Category..."
              />
            </Grid>
            
            <Grid item xs={12} md={2}>
              <FormControl fullWidth variant="outlined">
                <InputLabel>Filter</InputLabel>
                <Select
                  value={reorderFilter}
                  onChange={(e) => setReorderFilter(e.target.value)}
                  label="Filter"
                >
                  <MenuItem value="all">All Items</MenuItem>
                  <MenuItem value="reorder">Reorder Only</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12} md={5}>
              <Stack direction={isMobile ? "column" : "row"} spacing={2} sx={{ width: '100%' }}>
                <Button
                  variant="contained"
                  onClick={handleOpenDialog}
                  startIcon={<AddIcon />}
                  size="large"
          sx={{
                    background: 'linear-gradient(45deg, #1976d2, #90caf9)',
                    '&:hover': {
                      background: 'linear-gradient(45deg, #1565c0, #1976d2)',
                    }
                  }}
                >
                  Add New Item
                </Button>
                
                <Button
                  variant="contained"
                  onClick={() => navigate('/inventory/stock-sheet/material-inward')}
                  startIcon={<AddIcon />}
                  size="large"
                  sx={{
                    background: 'linear-gradient(45deg, #4caf50, #81c784)',
                    '&:hover': {
                      background: 'linear-gradient(45deg, #388e3c, #4caf50)',
                    }
                  }}
                >
                  Material Inward
                </Button>
                
                <Button
                  variant="contained"
                  onClick={() => navigate('/inventory/stock-sheet/material-outward')}
                  startIcon={<RemoveIcon />}
                  size="large"
                  sx={{
                    background: 'linear-gradient(45deg, #f44336, #ef5350)',
                    '&:hover': {
                      background: 'linear-gradient(45deg, #d32f2f, #f44336)',
                    }
                  }}
                >
                  Material Issue
                </Button>
                
                <Button
                  variant="outlined"
                  color="info"
                  startIcon={<AnalyticsIcon />}
                  disabled={stockItems.length === 0}
                >
                  Reports
                </Button>
              </Stack>
            </Grid>
          </Grid>

          {/* Summary Cards */}
          {stockItems.length > 0 && (
            <Box sx={{ mt: 3 }}>
              <Divider sx={{ mb: 2 }} />
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6} md={3}>
                  <Card variant="outlined" sx={{ p: 2, bgcolor: 'background.default' }}>
                    <Stack direction="row" alignItems="center" spacing={2}>
                      <Badge badgeContent={stockItems.length} color="primary">
                        <StorageIcon color="primary" />
                      </Badge>
                      <Box>
                        <Typography variant="body2" color="text.secondary">
                          Total Items
                        </Typography>
                        <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                          {stockItems.length}
                        </Typography>
        </Box>
                    </Stack>
                  </Card>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <Card variant="outlined" sx={{ p: 2, bgcolor: 'background.default' }}>
                    <Stack direction="row" alignItems="center" spacing={2}>
                      <Badge badgeContent={stockStats.critical} color="error">
                        <ErrorIcon color="error" />
                      </Badge>
                      <Box>
                        <Typography variant="body2" color="text.secondary">
                          Critical Stock
                        </Typography>
                        <Typography variant="h6" sx={{ fontWeight: 'bold', color: 'error.main' }}>
                          {stockStats.critical}
                        </Typography>
                      </Box>
                    </Stack>
                  </Card>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <Card variant="outlined" sx={{ p: 2, bgcolor: 'background.default' }}>
                    <Stack direction="row" alignItems="center" spacing={2}>
                      <Badge badgeContent={stockStats.low} color="warning">
                        <WarningIcon color="warning" />
                      </Badge>
                      <Box>
                        <Typography variant="body2" color="text.secondary">
                          Low Stock
                        </Typography>
                        <Typography variant="h6" sx={{ fontWeight: 'bold', color: 'warning.main' }}>
                          {stockStats.low}
                        </Typography>
                      </Box>
                    </Stack>
                  </Card>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <Card variant="outlined" sx={{ p: 2, bgcolor: 'background.default' }}>
                    <Stack direction="row" alignItems="center" spacing={2}>
                      <CheckIcon color="success" />
                      <Box>
                        <Typography variant="body2" color="text.secondary">
                          Normal Stock
                        </Typography>
                        <Typography variant="h6" sx={{ fontWeight: 'bold', color: 'success.main' }}>
                          {stockStats.normal}
                        </Typography>
                      </Box>
                    </Stack>
                  </Card>
                </Grid>
              </Grid>
            </Box>
          )}
        </CardContent>
      </Card>

      {/* Stock Items Table */}
      <Card sx={{ boxShadow: 3 }}>
        <CardContent sx={{ p: 0 }}>
          <Box sx={{ p: 3, pb: 0 }}>
            <Stack direction="row" alignItems="center" spacing={2} justifyContent="space-between">
              <Stack direction="row" alignItems="center" spacing={2}>
                <InventoryIcon color="primary" />
                <Typography variant="h6" component="h2" sx={{ fontWeight: 'bold' }}>
                  Inventory Items
                </Typography>
                {filteredItems.length > 0 && (
                  <Chip 
                    label={`${filteredItems.length} items`} 
                    color="primary" 
                    size="small" 
                  />
                )}
                {reorderItems.length > 0 && (
                  <Chip 
                    label={`${reorderItems.length} need reorder`} 
                    color="warning" 
                    size="small" 
                  />
                )}
              </Stack>
              {reorderItems.length > 0 && (
                <Tooltip title="Download Reorder Items as Excel">
                  <Button
                    variant="contained"
                    color="warning"
                    startIcon={<DownloadIcon />}
                    onClick={handleDownloadReorderExcel}
                    sx={{
                      textTransform: 'none',
                      fontWeight: 'bold',
                    }}
                  >
                    Download Reorder Excel
                  </Button>
                </Tooltip>
              )}
            </Stack>
          </Box>

          {/* Bulk Action Bar */}
          {selectedItems.length > 0 && (
            <Box sx={{ 
              mb: 2, 
              p: 2, 
              bgcolor: 'primary.light', 
              borderRadius: 2,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              boxShadow: 2
            }}>
              <Typography variant="body1" sx={{ fontWeight: 'bold', color: 'white' }}>
                {selectedItems.length} item{selectedItems.length > 1 ? 's' : ''} selected
              </Typography>
              <Stack direction="row" spacing={2}>
                <Button
                  variant="outlined"
                  onClick={() => setSelectedItems([])}
                  sx={{ 
                    color: 'white', 
                    borderColor: 'white',
                    '&:hover': { 
                      borderColor: 'white', 
                      bgcolor: 'rgba(255, 255, 255, 0.1)' 
                    }
                  }}
                >
                  Clear Selection
                </Button>
                <Button
                  variant="contained"
                  startIcon={<ShoppingCartIcon />}
                  onClick={handleBulkRaiseIndent}
                  sx={{ 
                    bgcolor: 'white', 
                    color: 'primary.main',
                    '&:hover': { 
                      bgcolor: 'rgba(255, 255, 255, 0.9)' 
                    }
                  }}
                >
                  Raise Indent for Selected
                </Button>
              </Stack>
            </Box>
          )}

          <TableContainer sx={{ mt: 2 }}>
          <Table stickyHeader>
            <TableHead>
              <TableRow>
                  <TableCell padding="checkbox" sx={{ 
                    fontWeight: 'bold', 
                    textTransform: 'uppercase',
                    bgcolor: 'primary.main',
                    color: 'white',
                    fontSize: '0.75rem'
                  }}>
                    <Checkbox
                      indeterminate={isIndeterminate}
                      checked={isAllSelected}
                      onChange={handleSelectAll}
                      sx={{ 
                        color: 'white',
                        '&.Mui-checked': { color: 'white' },
                        '&.MuiCheckbox-indeterminate': { color: 'white' }
                      }}
                    />
                  </TableCell>
                  <TableCell sx={{ 
                    fontWeight: 'bold', 
                    textTransform: 'uppercase',
                    bgcolor: 'primary.main',
                    color: 'white',
                    fontSize: '0.75rem'
                  }}>
                    <TableSortLabel
                      active={orderBy === 'itemCode'}
                      direction={orderBy === 'itemCode' ? order : 'asc'}
                      onClick={() => handleRequestSort('itemCode')}
                      sx={{ color: 'white !important' }}
                    >
                      Item Details
                    </TableSortLabel>
                  </TableCell>
                  <TableCell sx={{ 
                    fontWeight: 'bold', 
                    textTransform: 'uppercase',
                    bgcolor: 'primary.main',
                    color: 'white',
                    fontSize: '0.75rem'
                  }}>
                      <TableSortLabel
                      active={orderBy === 'currentStock'}
                      direction={orderBy === 'currentStock' ? order : 'asc'}
                      onClick={() => handleRequestSort('currentStock')}
                      sx={{ color: 'white !important' }}
                    >
                      Stock Levels
                      </TableSortLabel>
                  </TableCell>
                  <TableCell sx={{ 
                    fontWeight: 'bold', 
                    textTransform: 'uppercase',
                    bgcolor: 'primary.main',
                    color: 'white',
                    fontSize: '0.75rem'
                  }}>
                    Status
                  </TableCell>
                  <TableCell sx={{ 
                    fontWeight: 'bold', 
                    textTransform: 'uppercase',
                    bgcolor: 'primary.main',
                    color: 'white',
                    fontSize: '0.75rem'
                  }}>
                    Location & Unit
                  </TableCell>
                  <TableCell sx={{ 
                    fontWeight: 'bold', 
                    textTransform: 'uppercase',
                    bgcolor: 'primary.main',
                    color: 'white',
                    fontSize: '0.75rem'
                  }}>
                    Last Updated
                  </TableCell>
                  <TableCell sx={{ 
                    fontWeight: 'bold', 
                    textTransform: 'uppercase',
                    bgcolor: 'primary.main',
                    color: 'white',
                    fontSize: '0.75rem'
                  }}>
                    Vendor Info
                  </TableCell>
                  <TableCell sx={{ 
                    fontWeight: 'bold', 
                    textTransform: 'uppercase',
                    bgcolor: 'primary.main',
                    color: 'white',
                    fontSize: '0.75rem'
                  }}>
                    Actions
                  </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
                {paginatedItems.length > 0 ? (
                  paginatedItems.map((item, index) => {
                    const status = getStockStatus(item);
                return (
                      <TableRow 
                        key={index}
                        sx={{ 
                          '&:nth-of-type(odd)': { bgcolor: 'action.hover' },
                          '&:hover': { bgcolor: 'action.selected' },
                          transition: 'background-color 0.2s',
                          bgcolor: selectedItems.includes(item.itemCode) ? 'action.selected' : 'inherit'
                        }}
                      >
                    <TableCell padding="checkbox">
                      <Checkbox
                        checked={selectedItems.includes(item.itemCode)}
                        onChange={() => handleSelectItem(item.itemCode)}
                        sx={{ color: 'primary.main' }}
                      />
                    </TableCell>
                    <TableCell>
                          <Box>
                            <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                              {item.itemName}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              Code: {item.itemCode}
                            </Typography>
                            <br />
                      <Chip
                              label={item.category} 
                        size="small"
                              variant="outlined" 
                              sx={{ mt: 0.5 }}
                      />
                          </Box>
                    </TableCell>
                    <TableCell>
                          <Box>
                            <Typography variant="body2" sx={{ fontWeight: 'bold', fontSize: '1.1rem' }}>
                              {item.currentStock}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              Min: {item.minLevel} | Max: {item.maxLevel}
                            </Typography>
                            <br />
                            <Typography variant="caption" color="warning.main">
                              Reorder: {item.reorderPoint}
                            </Typography>
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Stack direction="row" alignItems="center" spacing={1}>
                            {getStockStatusIcon(item)}
                            <Chip 
                              label={status.label} 
                              color={status.color} 
                              size="small" 
                            />
                          </Stack>
                        </TableCell>
                        <TableCell>
                          <Box>
                            <Stack direction="row" alignItems="center" spacing={1}>
                              <LocationIcon fontSize="small" color="action" />
                              <Typography variant="body2">
                                {item.location}
                              </Typography>
                            </Stack>
                            <Stack direction="row" alignItems="center" spacing={1} sx={{ mt: 0.5 }}>
                              <UnitIcon fontSize="small" color="action" />
                              <Typography variant="body2">
                                {item.unit}
                              </Typography>
                            </Stack>
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Typography variant="caption" color="text.secondary">
                            {item.lastUpdated || 'N/A'}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Box>
                            {(() => {
                              const vendorData = parseVendorDetails(item.vendorDetails);
                              const primaryVendor = getPrimaryVendor(vendorData);
                              
                              return (
                                <>
                                  {/* Vendors List - show all vendor codes */}
                                  {vendorData.length > 0 && (
                                    <Box>
                                      <Stack direction="row" spacing={0.5}>
                                        {vendorData.slice(0, 3).map((vendor, index) => (
                                          <Chip
                                            key={index}
                                            label={vendor.vendorCode || 'N/A'}
                                            size="small"
                                            variant="outlined"
                                            sx={{ fontSize: '0.7rem', height: '18px' }}
                                          />
                                        ))}
                                        {vendorData.length > 3 && (
                                          <Chip
                                            label={`+${vendorData.length - 3}`}
                                            size="small"
                                            variant="outlined"
                                            sx={{ fontSize: '0.7rem', height: '18px' }}
                                          />
                                        )}
                                      </Stack>
                                    </Box>
                                  )}
                                  
                                  {/* No vendors */}
                                  {vendorData.length === 0 && (
                                    <Typography variant="caption" color="text.secondary">
                                      No vendors assigned
                                    </Typography>
                                  )}
                                </>
                              );
                            })()}
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Stack direction="row" spacing={1}>
                            {needsReorder(item) && (
                              <Tooltip title="Raise Indent">
                                <IconButton
                                  size="small"
                                  onClick={() => handleRaiseIndent(item)}
                                  sx={{ 
                                    color: '#ff9800',
                                    '&:hover': { 
                                      backgroundColor: 'rgba(255, 152, 0, 0.1)' 
                                    }
                                  }}
                                >
                                  <ShoppingCartIcon />
                                </IconButton>
                              </Tooltip>
                            )}
                            <Tooltip title="View Details">
                              <IconButton
                                size="small"
                                onClick={() => handleViewDetails(item)}
                                color="secondary"
                              >
                                <ViewIcon />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Edit Item">
                        <IconButton
                          size="small"
                          onClick={() => handleEdit(item)}
                                color="primary"
                        >
                          <EditIcon />
                        </IconButton>
                      </Tooltip>
                            <Tooltip title="Quick Add New Item">
                        <IconButton
                          size="small"
                          onClick={() => handleQuickAdd(item)}
                                color="success"
                        >
                          <QuickAddIcon />
                        </IconButton>
                      </Tooltip>
                            <Tooltip title="View History">
                        <IconButton
                          size="small"
                                onClick={() => setSnackbar({ open: true, message: "View History feature coming soon!", severity: "info" })}
                                color="info"
                              >
                                <HistoryIcon />
                              </IconButton>
                            </Tooltip>
                      <Tooltip title="Material Inward">
                        <IconButton
                          size="small"
                          onClick={() => {
                            // Store item data in sessionStorage for pre-selection (including vendor details)
                            sessionStorage.setItem('selectedItemForInward', JSON.stringify({
                              itemCode: item.itemCode,
                              itemName: item.itemName,
                              category: item.category,
                              unit: item.unit,
                              location: item.location,
                              vendorDetails: item.vendorDetails // Include vendor details for supplier dropdown
                            }));
                            navigate('/inventory/stock-sheet/material-inward');
                          }}
                          sx={{ 
                            color: '#4caf50',
                            '&:hover': { 
                              backgroundColor: 'rgba(76, 175, 80, 0.1)' 
                            }
                          }}
                        >
                          <AddIcon />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Material Issue">
                        <IconButton
                          size="small"
                          onClick={() => {
                            // Store item data in sessionStorage for pre-selection
                            sessionStorage.setItem('selectedItemForIssue', JSON.stringify({
                              itemCode: item.itemCode,
                              itemName: item.itemName,
                              category: item.category,
                              unit: item.unit,
                              location: item.location
                            }));
                            navigate('/inventory/stock-sheet/material-outward');
                          }}
                          sx={{ 
                            color: '#f44336',
                            '&:hover': { 
                              backgroundColor: 'rgba(244, 67, 54, 0.1)' 
                            }
                          }}
                        >
                          <RemoveIcon />
                        </IconButton>
                      </Tooltip>
                            <Tooltip title="Delete Item">
                              <IconButton
                                size="small"
                                onClick={() => handleDelete(item)}
                          color="error"
                        >
                          <DeleteIcon />
                        </IconButton>
                      </Tooltip>
                          </Stack>
                    </TableCell>
                  </TableRow>
                );
                  })
                ) : (
                  <TableRow>
                    <TableCell colSpan={8} align="center" sx={{ py: 6 }}>
                      <Stack alignItems="center" spacing={2}>
                        <StorageIcon sx={{ fontSize: 64, color: 'text.disabled' }} />
                        <Typography variant="h6" color="text.secondary">
                          No inventory items found
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {search ? 
                            `No items match "${search}". Try a different search term.` :
                            "Create your first inventory item to get started"
                          }
                        </Typography>
                        {!search && (
                          <Button
                            variant="contained"
                            onClick={handleOpenDialog}
                            startIcon={<AddIcon />}
                            sx={{ mt: 2 }}
                          >
                            Add First Item
                          </Button>
                        )}
                      </Stack>
                    </TableCell>
                  </TableRow>
                )}
            </TableBody>
          </Table>
        </TableContainer>

          {paginatedItems.length > 0 && (
      <TablePagination
              rowsPerPageOptions={[5, 10, 25, 50]}
        component="div"
              count={filteredItems.length}
              rowsPerPage={rowsPerPage}
        page={page}
        onPageChange={handleChangePage}
        onRowsPerPageChange={handleChangeRowsPerPage}
              sx={{ borderTop: 1, borderColor: 'divider' }}
            />
          )}
        </CardContent>
      </Card>

      {/* Floating Action Button */}
      {stockItems.length > 0 && (
        <Zoom in={true}>
          <Fab
            color="primary"
            aria-label="add new item"
            sx={{
              position: 'fixed',
              bottom: 24,
              right: 24,
              zIndex: 1000,
            }}
            onClick={handleOpenDialog}
          >
            <AddIcon />
          </Fab>
        </Zoom>
      )}

      {/* Add/Edit Item Dialog */}
      <Dialog
        open={openDialog}
        onClose={handleCloseDialog}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 4,
            boxShadow: '0 20px 40px rgba(0, 0, 0, 0.1)',
            border: 'none'
          }
        }}
        BackdropProps={{
          sx: {
            backgroundColor: 'rgba(0, 0, 0, 0.3)',
            backdropFilter: 'blur(4px)'
          }
        }}
      >
        <DialogTitle sx={{ p: 0, textAlign: 'center', pt: 4, pb: 2, position: 'relative' }}>
          <IconButton
            onClick={handleCloseDialog}
            sx={{
              position: 'absolute',
              right: 16,
              top: '50%',
              transform: 'translateY(-50%)',
              color: '#00bcd4',
              '&:hover': {
                backgroundColor: 'rgba(0, 188, 212, 0.1)'
              }
            }}
          >
            <CloseIcon />
          </IconButton>
          <Typography 
            variant="h4" 
            sx={{ 
              fontWeight: 700,
              background: 'linear-gradient(135deg, #1976d2, #00bcd4)',
              backgroundClip: 'text',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              textAlign: 'center',
              lineHeight: 1.2
            }}
          >
            {selectedItem ? "Edit Inventory Item" : "Add New Inventory Item"}
          </Typography>
          <Typography 
            variant="body1" 
            sx={{ 
              color: 'text.secondary',
              textAlign: 'center',
              mt: 1
            }}
          >
            {selectedItem ? "Update existing stock item" : "Create new stock item entry"}
          </Typography>
        </DialogTitle>
        
        <DialogContent sx={{ px: 4, py: 2, maxHeight: 'calc(90vh - 200px)', overflowY: 'auto', position: 'relative', zIndex: 1 }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
              <Box sx={{ flex: '1 1 200px', minWidth: '200px' }}>
                <TextField
                  fullWidth
                  label={selectedItem ? "Item Code" : "Item Code (Auto-Generated)"}
                  name="itemCode"
                  value={formData.itemCode}
                  onChange={handleInputChange}
                  required
                  variant="standard"
                  InputProps={{
                    startAdornment: <AssignmentIcon color="action" sx={{ mr: 1 }} />,
                    readOnly: true
                  }}
                  disabled={true}
                  helperText={!selectedItem ? "Code will be auto-generated" : "Code cannot be changed"}
                  sx={{
                    '& .MuiInput-underline:before': {
                      borderBottomColor: '#e0e0e0'
                    },
                    '& .MuiInput-underline:after': {
                      borderBottomColor: '#00bcd4'
                    },
                    '& .MuiInput-underline:hover:not(.Mui-disabled):before': {
                      borderBottomColor: '#00bcd4'
                    },
                    '& .MuiFormLabel-root': {
                      fontSize: '14px',
                      color: '#666',
                      '&.Mui-focused': {
                        color: '#00bcd4'
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
                  fullWidth
                  label="Item Name *"
                  name="itemName"
                  value={formData.itemName}
                  onChange={handleInputChange}
                  required
                  variant="standard"
                  InputProps={{
                    startAdornment: <CategoryIcon color="action" sx={{ mr: 1 }} />
                  }}
                  sx={{
                    '& .MuiInput-underline:before': {
                      borderBottomColor: '#e0e0e0'
                    },
                    '& .MuiInput-underline:after': {
                      borderBottomColor: '#00bcd4'
                    },
                    '& .MuiInput-underline:hover:not(.Mui-disabled):before': {
                      borderBottomColor: '#00bcd4'
                    },
                    '& .MuiFormLabel-root': {
                      fontSize: '14px',
                      color: '#666',
                      '&.Mui-focused': {
                        color: '#00bcd4'
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
            <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
              <Box sx={{ flex: '1 1 200px', minWidth: '200px' }}>
                <Autocomplete
                  key={`category-${selectedItem?.itemCode || 'new'}`}
                  fullWidth
                  options={categories}
                  value={formData.category || ""}
                  onChange={handleCategoryChange}
                  freeSolo
                  inputValue={formData.category || ""}
                  onInputChange={(event, newInputValue) => {
                    setFormData((prev) => ({
                      ...prev,
                      category: newInputValue,
                    }));
                  }}
                  renderInput={(params) => {
                    return (
                    <TextField
                      {...params}
                      label="Category"
                      variant="standard"
                      InputProps={{
                        ...params.InputProps,
                        startAdornment: <CategoryIcon color="action" sx={{ mr: 1 }} />
                      }}
                      sx={{
                        '& .MuiInput-underline:before': {
                          borderBottomColor: '#e0e0e0'
                        },
                        '& .MuiInput-underline:after': {
                          borderBottomColor: '#00bcd4'
                        },
                        '& .MuiInput-underline:hover:not(.Mui-disabled):before': {
                          borderBottomColor: '#00bcd4'
                        },
                        '& .MuiFormLabel-root': {
                          fontSize: '14px',
                          color: '#666',
                          '&.Mui-focused': {
                            color: '#00bcd4'
                          }
                        },
                        '& .MuiInputBase-input': {
                          fontSize: '16px',
                          padding: '8px 0'
                        }
                      }}
                    />
                    );
                  }}
                />
              </Box>
              <Box sx={{ flex: '1 1 200px', minWidth: '200px' }}>
                <Autocomplete
                  key={`unit-${selectedItem?.itemCode || 'new'}`}
                  fullWidth
                  options={units}
                  value={formData.unit || ""}
                  onChange={handleUnitChange}
                  freeSolo
                  inputValue={formData.unit || ""}
                  onInputChange={(event, newInputValue) => {
                    setFormData((prev) => ({
                      ...prev,
                      unit: newInputValue,
                    }));
                  }}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label="Unit"
                      variant="standard"
                      placeholder="Optional (e.g., kg, pcs, m)"
                      InputProps={{
                        ...params.InputProps,
                        startAdornment: <UnitIcon color="action" sx={{ mr: 1 }} />
                      }}
                      sx={{
                        '& .MuiInput-underline:before': {
                          borderBottomColor: '#e0e0e0'
                        },
                        '& .MuiInput-underline:after': {
                          borderBottomColor: '#00bcd4'
                        },
                        '& .MuiInput-underline:hover:not(.Mui-disabled):before': {
                          borderBottomColor: '#00bcd4'
                        },
                        '& .MuiFormLabel-root': {
                          fontSize: '14px',
                          color: '#666',
                          '&.Mui-focused': {
                            color: '#00bcd4'
                          }
                        },
                        '& .MuiInputBase-input': {
                          fontSize: '16px',
                          padding: '8px 0'
                        }
                      }}
                    />
                  )}
                />
              </Box>
            </Box>
            <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
              <Box sx={{ flex: '1 1 200px', minWidth: '200px' }}>
                <Autocomplete
                  options={locations}
                  value={formData.location || ""}
                  onChange={handleLocationChange}
                  freeSolo
                  inputValue={formData.location || ""}
                  onInputChange={(event, newInputValue) => {
                    setFormData((prev) => ({
                      ...prev,
                      location: newInputValue,
                    }));
                  }}
                  loading={loadingFieldValues}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label="Location"
                      variant="standard"
                      placeholder="Type or select location"
                      InputProps={{
                        ...params.InputProps,
                        startAdornment: <LocationIcon color="action" sx={{ mr: 1 }} />
                      }}
                      sx={{
                        '& .MuiInput-underline:before': {
                          borderBottomColor: '#e0e0e0'
                        },
                        '& .MuiInput-underline:after': {
                          borderBottomColor: '#00bcd4'
                        },
                        '& .MuiInput-underline:hover:not(.Mui-disabled):before': {
                          borderBottomColor: '#00bcd4'
                        },
                        '& .MuiFormLabel-root': {
                          fontSize: '14px',
                          color: '#666',
                          '&.Mui-focused': {
                            color: '#00bcd4'
                          }
                        },
                        '& .MuiInputBase-input': {
                          fontSize: '16px',
                          padding: '8px 0'
                        }
                      }}
                    />
                  )}
                  renderOption={(props, option) => (
                    <Box component="li" {...props}>
                      {option}
                    </Box>
                  )}
                  noOptionsText="Type to add new location"
                  sx={{
                    '& .MuiAutocomplete-inputRoot': {
                      padding: '8px 0',
                      fontSize: '16px'
                    }
                  }}
                />
              </Box>
              <Box sx={{ flex: '1 1 200px', minWidth: '200px' }}>
                <Autocomplete
                  options={makes}
                  value={formData.make || ""}
                  onChange={handleMakeChange}
                  freeSolo
                  inputValue={formData.make || ""}
                  onInputChange={(event, newInputValue) => {
                    setFormData((prev) => ({
                      ...prev,
                      make: newInputValue,
                    }));
                  }}
                  loading={loadingFieldValues}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label="Make"
                      variant="standard"
                      placeholder="Type or select make"
                      InputProps={{
                        ...params.InputProps,
                        startAdornment: <FactoryIcon color="action" sx={{ mr: 1 }} />
                      }}
                      sx={{
                        '& .MuiInput-underline:before': {
                          borderBottomColor: '#e0e0e0'
                        },
                        '& .MuiInput-underline:after': {
                          borderBottomColor: '#00bcd4'
                        },
                        '& .MuiInput-underline:hover:not(.Mui-disabled):before': {
                          borderBottomColor: '#00bcd4'
                        },
                        '& .MuiFormLabel-root': {
                          fontSize: '14px',
                          color: '#666',
                          '&.Mui-focused': {
                            color: '#00bcd4'
                          }
                        },
                        '& .MuiInputBase-input': {
                          fontSize: '16px',
                          padding: '8px 0'
                        }
                      }}
                    />
                  )}
                  renderOption={(props, option) => (
                    <Box component="li" {...props}>
                      {option}
                    </Box>
                  )}
                  noOptionsText="Type to add new make"
                  sx={{
                    '& .MuiAutocomplete-inputRoot': {
                      padding: '8px 0',
                      fontSize: '16px'
                    }
                  }}
                />
              </Box>
              {/* Multiple Vendors Management */}
              <Box sx={{ flex: '1 1 100%', minWidth: '100%' }}>
                <Stack direction="row" alignItems="center" spacing={2} sx={{ mb: 2 }}>
                  <VendorIcon color="primary" />
                  <Typography variant="h6" sx={{ color: '#1976d2', fontWeight: 'bold' }}>
                    Vendor Management
                  </Typography>
                  <Button
                    startIcon={<AddIcon />}
                    onClick={addVendor}
                    variant="outlined"
                    size="small"
                    sx={{ ml: 'auto' }}
                  >
                    Add Vendor
                  </Button>
                </Stack>
                
                {formData.vendorDetails.length === 0 && (
                  <Card sx={{ p: 3, textAlign: 'center', bgcolor: '#f5f5f5' }}>
                    <Typography variant="body2" color="text.secondary">
                      No vendors assigned. Click "Add Vendor" to add vendors for this item.
                    </Typography>
                  </Card>
                )}
                
                {formData.vendorDetails.map((vendor, index) => (
                  <Card key={index} sx={{ mb: 2, p: 2, border: '1px solid #e0e0e0' }}>
                    <Stack direction="row" alignItems="center" spacing={2} sx={{ mb: 2 }}>
                      <Typography variant="subtitle2" sx={{ flexGrow: 1 }}>
                        Vendor {index + 1}
                      </Typography>
                      <Stack direction="row" spacing={1}>
                        <IconButton
                          size="small"
                          onClick={() => removeVendor(index)}
                          color="error"
                        >
                          <DeleteIcon />
                        </IconButton>
                      </Stack>
                    </Stack>
                    
                    <Grid container spacing={3}>
                      <Grid item xs={12} sm={6} md={7}>
                        <Autocomplete
                          fullWidth
                          options={vendors.map(v => v.vendorCode).filter(vendorCode => {
                            // Filter out vendors already selected in other fields
                            const selectedVendorCodes = formData.vendorDetails
                              .map((v, i) => i !== index ? v.vendorCode : null)
                              .filter(code => code && code.trim() !== '');
                            return !selectedVendorCodes.includes(vendorCode);
                          })}
                          value={vendor.vendorCode}
                          onChange={(event, newValue) => handleVendorChange(event, newValue, index)}
                          loading={loadingVendors}
                          sx={{
                            '& .MuiAutocomplete-input': {
                              textOverflow: 'clip !important',
                              overflow: 'visible !important',
                              whiteSpace: 'nowrap !important'
                            }
                          }}
                          renderInput={(params) => (
                            <TextField
                              {...params}
                              label="Vendor Code"
                              variant="standard"
                              placeholder="Select vendor..."
                              size="small"
                              InputLabelProps={{
                                shrink: true,
                                sx: {
                                  whiteSpace: 'nowrap',
                                  overflow: 'visible',
                                  textOverflow: 'clip'
                                }
                              }}
                              InputProps={{
                                ...params.InputProps,
                                sx: {
                                  '& input': {
                                    textOverflow: 'clip !important',
                                    overflow: 'visible !important'
                                  },
                                  minWidth: 220
                                }
                              }}
                            />
                          )}
                        />
                      </Grid>
                      <Grid item xs={12} sm={6} md={5}>
                        <TextField
                          fullWidth
                          label="Vendor Name"
                          value={vendor.vendorName}
                          variant="standard"
                          placeholder="Auto-filled"
                          InputProps={{ readOnly: true }}
                          InputLabelProps={{
                            shrink: true,
                            sx: {
                              whiteSpace: 'nowrap',
                              overflow: 'visible',
                              textOverflow: 'clip'
                            }
                          }}
                          size="small"
                        />
                      </Grid>
                      <Grid item xs={12} sm={6} md={6}>
                        <TextField
                          fullWidth
                          label="Contact Person"
                          value={vendor.vendorContact}
                          variant="standard"
                          placeholder="Auto-filled"
                          InputProps={{ readOnly: true }}
                          InputLabelProps={{
                            shrink: true,
                            sx: {
                              whiteSpace: 'nowrap',
                              overflow: 'visible',
                              textOverflow: 'clip'
                            }
                          }}
                          size="small"
                        />
                      </Grid>
                      <Grid item xs={12} sm={6} md={6}>
                        <TextField
                          fullWidth
                          label="Email"
                          value={vendor.vendorEmail}
                          variant="standard"
                          placeholder="Auto-filled"
                          InputProps={{ readOnly: true }}
                          InputLabelProps={{
                            shrink: true,
                            sx: {
                              whiteSpace: 'nowrap',
                              overflow: 'visible',
                              textOverflow: 'clip'
                            }
                          }}
                          size="small"
                        />
                      </Grid>
                    </Grid>
                  </Card>
                ))}
              </Box>
              <Box sx={{ flex: '1 1 200px', minWidth: '200px' }}>
                <TextField
                  fullWidth
                  type="number"
                  label="Current Stock *"
                  name="currentStock"
                  value={formData.currentStock}
                  onChange={handleInputChange}
                  required
                  variant="standard"
                  sx={{
                    '& .MuiInput-underline:before': {
                      borderBottomColor: '#e0e0e0'
                    },
                    '& .MuiInput-underline:after': {
                      borderBottomColor: '#00bcd4'
                    },
                    '& .MuiInput-underline:hover:not(.Mui-disabled):before': {
                      borderBottomColor: '#00bcd4'
                    },
                    '& .MuiFormLabel-root': {
                      fontSize: '14px',
                      color: '#666',
                      '&.Mui-focused': {
                        color: '#00bcd4'
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
            <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
              <Box sx={{ flex: '1 1 150px', minWidth: '150px' }}>
                <TextField
                  fullWidth
                  type="number"
                  label="Minimum Level *"
                  name="minLevel"
                  value={formData.minLevel}
                  onChange={handleInputChange}
                  required
                  variant="standard"
                  sx={{
                    '& .MuiInput-underline:before': {
                      borderBottomColor: '#e0e0e0'
                    },
                    '& .MuiInput-underline:after': {
                      borderBottomColor: '#00bcd4'
                    },
                    '& .MuiInput-underline:hover:not(.Mui-disabled):before': {
                      borderBottomColor: '#00bcd4'
                    },
                    '& .MuiFormLabel-root': {
                      fontSize: '14px',
                      color: '#666',
                      '&.Mui-focused': {
                        color: '#00bcd4'
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
                  fullWidth
                  type="number"
                  label="Maximum Level *"
                  name="maxLevel"
                  value={formData.maxLevel}
                  onChange={handleInputChange}
                  required
                  variant="standard"
                  sx={{
                    '& .MuiInput-underline:before': {
                      borderBottomColor: '#e0e0e0'
                    },
                    '& .MuiInput-underline:after': {
                      borderBottomColor: '#00bcd4'
                    },
                    '& .MuiInput-underline:hover:not(.Mui-disabled):before': {
                      borderBottomColor: '#00bcd4'
                    },
                    '& .MuiFormLabel-root': {
                      fontSize: '14px',
                      color: '#666',
                      '&.Mui-focused': {
                        color: '#00bcd4'
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
                  fullWidth
                  type="number"
                  label="Reorder Point"
                  name="reorderPoint"
                  value={formData.reorderPoint}
                  onChange={handleInputChange}
                  variant="standard"
                  placeholder=""
                  sx={{
                    '& .MuiInput-underline:before': {
                      borderBottomColor: '#e0e0e0'
                    },
                    '& .MuiInput-underline:after': {
                      borderBottomColor: '#00bcd4'
                    },
                    '& .MuiInput-underline:hover:not(.Mui-disabled):before': {
                      borderBottomColor: '#00bcd4'
                    },
                    '& .MuiFormLabel-root': {
                      fontSize: '14px',
                      color: '#666',
                      '&.Mui-focused': {
                        color: '#00bcd4'
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
            <Box sx={{ width: '100%' }}>
              <TextField
                fullWidth
                label="Item Specifications"
                name="item specifications"
                value={formData["item specifications"]}
                onChange={handleInputChange}
                multiline
                rows={3}
                placeholder="Enter detailed item specifications..."
                variant="standard"
                sx={{
                  '& .MuiInput-underline:before': {
                    borderBottomColor: '#e0e0e0'
                  },
                  '& .MuiInput-underline:after': {
                    borderBottomColor: '#00bcd4'
                  },
                  '& .MuiInput-underline:hover:not(.Mui-disabled):before': {
                    borderBottomColor: '#00bcd4'
                  },
                  '& .MuiFormLabel-root': {
                    fontSize: '14px',
                    color: '#666',
                    '&.Mui-focused': {
                      color: '#00bcd4'
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
        </DialogContent>
        
        <DialogActions sx={{ p: 4, pt: 2, justifyContent: 'center' }}>
          <Button 
            onClick={handleCloseDialog}
            variant="outlined"
            startIcon={<CancelIcon />}
            sx={{
              borderRadius: 3,
              border: '1px solid #e0e0e0',
              backgroundColor: 'transparent',
              color: '#666',
              px: 3,
              py: 1.5,
              minWidth: '120px',
              '&:hover': {
                backgroundColor: 'rgba(0, 0, 0, 0.04)',
                borderColor: '#00bcd4'
              }
            }}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            variant="contained"
            disabled={loading}
            startIcon={loading ? <CircularProgress size={16} /> : <SaveIcon />}
            sx={{ 
              borderRadius: 3,
              background: 'linear-gradient(135deg, #1976d2, #00bcd4)',
              color: 'white',
              px: 3,
              py: 1.5,
              minWidth: '180px',
              boxShadow: '0 4px 12px rgba(25, 118, 210, 0.3)',
              '&:hover': {
                background: 'linear-gradient(135deg, #1565c0, #00acc1)',
                boxShadow: '0 6px 16px rgba(25, 118, 210, 0.4)',
                transform: 'translateY(-1px)'
              },
              '&:disabled': {
                background: 'rgba(0, 0, 0, 0.12)',
                color: 'rgba(0, 0, 0, 0.26)',
                boxShadow: 'none'
              }
            }}
          >
            {selectedItem ? "Update Item" : loading ? "Saving..." : "Create Item"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* History Dialog */}
      <Dialog
        open={openHistoryDialog}
        onClose={() => setOpenHistoryDialog(false)}
        maxWidth="lg"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 2,
            boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
          }
        }}
      >
        <DialogTitle sx={{ pb: 1 }}>
          <Stack direction="row" alignItems="center" spacing={2}>
            <Avatar sx={{ bgcolor: 'info.main' }}>
              <HistoryIcon />
            </Avatar>
            <Box sx={{ flexGrow: 1 }}>
              <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                Stock Movement History
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {selectedItem ? `${selectedItem.itemName} (${selectedItem.itemCode})` : 'Item History'}
              </Typography>
            </Box>
            <Stack direction="row" spacing={1} alignItems="center">
              <FormControl size="small" sx={{ minWidth: 120 }}>
                <Select
                  value={historyFilter}
                  onChange={(e) => setHistoryFilter(e.target.value)}
                  variant="outlined"
                  size="small"
                >
                  <MenuItem value="all">All Time</MenuItem>
                  <MenuItem value="24h">Last 24 Hours</MenuItem>
                </Select>
              </FormControl>
              <Button
                variant="contained"
                size="small"
                startIcon={<DownloadIcon />}
                onClick={() => setSnackbar({ open: true, message: "History download feature coming soon!", severity: "info" })}
                sx={{ bgcolor: 'success.main', '&:hover': { bgcolor: 'success.dark' } }}
              >
                Download
              </Button>
            </Stack>
          </Stack>
        </DialogTitle>
        
        <DialogContent>
          <Box sx={{ mb: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="body2" color="text.secondary">
              Showing {getFilteredHistory().length} of {selectedItemHistory.length} records
            </Typography>
            {historyFilter === "24h" && (
              <Chip 
                label="Last 24 Hours" 
                size="small" 
                color="primary" 
                variant="outlined" 
              />
            )}
          </Box>
          <TableContainer sx={{ mt: 1 }}>
            <Table size="small">
              <TableHead>
                <TableRow sx={{ bgcolor: 'grey.50' }}>
                  <TableCell sx={{ fontWeight: 'bold' }}>Date</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Type</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Quantity</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Reference</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Remarks</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {getFilteredHistory().length > 0 ? (
                  getFilteredHistory().map((history, index) => (
                    <TableRow key={index} sx={{ '&:hover': { bgcolor: 'action.hover' } }}>
                      <TableCell>
                        <Typography variant="body2">
                          {history.date.toLocaleDateString()}
                        </Typography>
                      </TableCell>
                    <TableCell>
                      <Chip
                        label={history.type}
                        color={history.type === "IN" ? "success" : "error"}
                        size="small"
                          icon={history.type === "IN" ? <TrendingUpIcon /> : <TrendingDownIcon />}
                      />
                    </TableCell>
                      <TableCell>
                        <Typography 
                          variant="body2" 
                          sx={{ 
                            fontWeight: 'bold',
                            color: history.quantity > 0 ? 'success.main' : 'error.main'
                          }}
                        >
                          {history.quantity > 0 ? '+' : ''}{history.quantity}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {history.reference}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {history.remarks}
                        </Typography>
                      </TableCell>
                  </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={5} align="center" sx={{ py: 4 }}>
                      <Stack alignItems="center" spacing={2}>
                        <HistoryIcon sx={{ fontSize: 48, color: 'text.disabled' }} />
                        <Typography variant="body1" color="text.secondary">
                          No history available
                        </Typography>
                      </Stack>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </DialogContent>
        
        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button 
            onClick={() => setOpenHistoryDialog(false)}
            variant="outlined"
            startIcon={<CancelIcon />}
          >
            Close
          </Button>
        </DialogActions>
      </Dialog>

      {/* View Details Dialog */}
      <Dialog
        open={openViewDetailsDialog}
        onClose={() => setOpenViewDetailsDialog(false)}
        maxWidth="lg"
        fullWidth
        fullScreen={isMobile}
        PaperProps={{
          sx: {
            borderRadius: isMobile ? 0 : 3,
            boxShadow: isMobile ? 'none' : '0 16px 48px rgba(0,0,0,0.15)',
            minHeight: isMobile ? '100vh' : '80vh',
            display: 'flex',
            flexDirection: 'column'
          }
        }}
      >
        {/* Sticky Header */}
        <DialogTitle sx={{ 
          position: 'sticky',
          top: 0,
          zIndex: 1,
          bgcolor: 'background.paper',
          borderBottom: '1px solid',
          borderColor: 'divider',
          p: { xs: 2, md: 3 },
          pb: 2
        }}>
          <Stack 
            direction={{ xs: 'column', sm: 'row' }} 
            alignItems={{ xs: 'flex-start', sm: 'center' }} 
            spacing={2}
          >
            <Stack direction="row" alignItems="center" spacing={2} sx={{ flexGrow: 1 }}>
              <Avatar sx={{ 
                bgcolor: '#1976d2', 
                width: { xs: 40, md: 48 }, 
                height: { xs: 40, md: 48 },
                boxShadow: 2
              }}>
                <ViewIcon sx={{ color: 'white' }} />
              </Avatar>
              <Box>
                <Typography variant="h6" sx={{ 
                  fontWeight: 700, 
                  color: '#1976d2',
                  fontSize: { xs: '1.1rem', md: '1.25rem' },
                  fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif'
                }}>
                  Stock Item Details
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.85rem' }}>
                  {selectedItemDetails ? `${selectedItemDetails.itemName} (${selectedItemDetails.itemCode})` : 'Item Details'}
                </Typography>
              </Box>
            </Stack>
          </Stack>
        </DialogTitle>
        
        <DialogContent sx={{ 
          flexGrow: 1,
          p: { xs: 2, md: 3 },
          pt: { xs: 2, md: 2 },
          overflow: 'auto'
        }}>
          {selectedItemDetails && (
            <Box>
              {/* Company Header */}
              <Card sx={{ 
                background: 'linear-gradient(135deg, #1976d2 0%, #1565c0 100%)', 
                color: 'white', 
                p: { xs: 2, md: 3 }, 
                textAlign: 'center',
                borderRadius: 3,
                boxShadow: 4,
                mb: 3
              }}>
                <Typography variant="h5" sx={{ 
                  fontWeight: 700, 
                  mb: 1, 
                  fontSize: { xs: '1.1rem', sm: '1.3rem', md: '1.5rem' },
                  fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif'
                }}>
                  REYANSH INTERNATIONAL PVT. LTD
                </Typography>
                <Typography variant="subtitle1" sx={{ mb: 1, opacity: 0.95, fontSize: { xs: '0.9rem', md: '1rem' } }}>
                  Stock Item Details Report
                </Typography>
                <Typography variant="caption" sx={{ 
                  opacity: 0.8, 
                  fontSize: { xs: '0.7rem', md: '0.75rem' },
                  color: 'rgba(255,255,255,0.9)'
                }}>
                  Generated on {new Date().toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric'
                  })} at {new Date().toLocaleTimeString('en-US', {
                    hour: '2-digit',
                    minute: '2-digit',
                    hour12: true
                  })}
                </Typography>
              </Card>

              {/* Main Content Grid */}
              <Grid container spacing={{ xs: 2, md: 3 }}>
                {/* Item Information */}
                <Grid item xs={12} lg={6}>
                  <Card sx={{ 
                    p: { xs: 2, md: 3 }, 
                    borderRadius: 3,
                    boxShadow: 2,
                    height: '100%',
                    border: '1px solid',
                    borderColor: 'rgba(25, 118, 210, 0.1)',
                    '&:hover': {
                      boxShadow: 4,
                      borderColor: 'rgba(25, 118, 210, 0.2)'
                    }
                  }}>
                    <Stack direction="row" alignItems="center" spacing={1.5} sx={{ mb: 3 }}>
                      <AssignmentIcon sx={{ color: '#1976d2', fontSize: 24 }} />
                      <Typography variant="h6" sx={{ 
                        fontWeight: 600, 
                        color: '#1976d2',
                        fontSize: '1.1rem'
                      }}>
                        Item Information
                      </Typography>
                    </Stack>
                    <Stack spacing={2.5}>
                      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <Stack direction="row" alignItems="center" spacing={1}>
                          <Typography sx={{ color: '#1976d2', fontSize: 16 }}>🏷️</Typography>
                          <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.9rem', fontWeight: 500 }}>
                            Item Code:
                          </Typography>
                        </Stack>
                        <Typography variant="body1" sx={{ fontWeight: 600, color: '#333' }}>
                          {selectedItemDetails.itemCode || 'N/A'}
                        </Typography>
                      </Box>
                      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <Stack direction="row" alignItems="center" spacing={1}>
                          <Typography sx={{ color: '#1976d2', fontSize: 16 }}>📦</Typography>
                          <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.9rem', fontWeight: 500 }}>
                            Item Name:
                          </Typography>
                        </Stack>
                        <Typography variant="body1" sx={{ fontWeight: 600, color: '#333' }}>
                          {selectedItemDetails.itemName || 'N/A'}
                        </Typography>
                      </Box>
                      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <Stack direction="row" alignItems="center" spacing={1}>
                          <Typography sx={{ color: '#1976d2', fontSize: 16 }}>🏷️</Typography>
                          <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.9rem', fontWeight: 500 }}>
                            Category:
                          </Typography>
                        </Stack>
                        <Typography variant="body1" sx={{ fontWeight: 600, color: '#333' }}>
                          {selectedItemDetails.category || 'N/A'}
                        </Typography>
                      </Box>
                      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <Stack direction="row" alignItems="center" spacing={1}>
                          <Typography sx={{ color: '#1976d2', fontSize: 16 }}>🏭</Typography>
                          <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.9rem', fontWeight: 500 }}>
                            Make:
                          </Typography>
                        </Stack>
                        <Typography variant="body1" sx={{ fontWeight: 600, color: '#333' }}>
                          {selectedItemDetails.make || 'N/A'}
                        </Typography>
                      </Box>
                      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <Stack direction="row" alignItems="center" spacing={1}>
                          <Typography sx={{ color: '#1976d2', fontSize: 16 }}>⚖️</Typography>
                          <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.9rem', fontWeight: 500 }}>
                            Unit:
                          </Typography>
                        </Stack>
                        <Typography variant="body1" sx={{ fontWeight: 600, color: '#333' }}>
                          {selectedItemDetails.unit || 'N/A'}
                        </Typography>
                      </Box>
                      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <Stack direction="row" alignItems="center" spacing={1}>
                          <Typography sx={{ color: '#1976d2', fontSize: 16 }}>📍</Typography>
                          <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.9rem', fontWeight: 500 }}>
                            Location:
                          </Typography>
                        </Stack>
                        <Typography variant="body1" sx={{ fontWeight: 600, color: '#333' }}>
                          {selectedItemDetails.location || 'N/A'}
                        </Typography>
                      </Box>
                    </Stack>
                  </Card>
                </Grid>

                {/* Stock Levels */}
                <Grid item xs={12} lg={6}>
                  <Card sx={{ 
                    p: { xs: 2, md: 3 }, 
                    borderRadius: 3,
                    boxShadow: 2,
                    height: '100%',
                    border: '1px solid',
                    borderColor: 'rgba(25, 118, 210, 0.1)',
                    '&:hover': {
                      boxShadow: 4,
                      borderColor: 'rgba(25, 118, 210, 0.2)'
                    }
                  }}>
                    <Stack direction="row" alignItems="center" spacing={1.5} sx={{ mb: 3 }}>
                      <StorageIcon sx={{ color: '#1976d2', fontSize: 24 }} />
                      <Typography variant="h6" sx={{ 
                        fontWeight: 600, 
                        color: '#1976d2',
                        fontSize: '1.1rem'
                      }}>
                        Stock Levels
                      </Typography>
                    </Stack>
                    <Stack spacing={2.5}>
                      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <Stack direction="row" alignItems="center" spacing={1}>
                          <Typography sx={{ color: '#1976d2', fontSize: 16 }}>📊</Typography>
                          <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.9rem', fontWeight: 500 }}>
                            Current Stock:
                          </Typography>
                        </Stack>
                        <Stack direction="row" alignItems="center" spacing={1}>
                          <Typography variant="h6" sx={{ 
                            fontWeight: 700, 
                            color: '#1976d2',
                            fontSize: '1.3rem'
                          }}>
                            {selectedItemDetails.currentStock || '0'}
                          </Typography>
                          {selectedItemDetails.currentStock > (selectedItemDetails.minLevel || 0) ? (
                            <Box sx={{ 
                              width: 8, 
                              height: 8, 
                              borderRadius: '50%', 
                              bgcolor: '#4caf50',
                              boxShadow: '0 0 6px rgba(76, 175, 80, 0.5)'
                            }} />
                          ) : (
                            <Box sx={{ 
                              width: 8, 
                              height: 8, 
                              borderRadius: '50%', 
                              bgcolor: '#f44336',
                              boxShadow: '0 0 6px rgba(244, 67, 54, 0.5)'
                            }} />
                          )}
                        </Stack>
                      </Box>
                      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <Stack direction="row" alignItems="center" spacing={1}>
                          <Typography sx={{ color: '#1976d2', fontSize: 16 }}>📉</Typography>
                          <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.9rem', fontWeight: 500 }}>
                            Minimum Level:
                          </Typography>
                        </Stack>
                        <Typography variant="body1" sx={{ fontWeight: 600, color: '#333' }}>
                          {selectedItemDetails.minLevel || 'N/A'}
                        </Typography>
                      </Box>
                      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <Stack direction="row" alignItems="center" spacing={1}>
                          <Typography sx={{ color: '#1976d2', fontSize: 16 }}>📈</Typography>
                          <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.9rem', fontWeight: 500 }}>
                            Maximum Level:
                          </Typography>
                        </Stack>
                        <Typography variant="body1" sx={{ fontWeight: 600, color: '#333' }}>
                          {selectedItemDetails.maxLevel || 'N/A'}
                        </Typography>
                      </Box>
                      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <Stack direction="row" alignItems="center" spacing={1}>
                          <Typography sx={{ color: '#1976d2', fontSize: 16 }}>⚠️</Typography>
                          <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.9rem', fontWeight: 500 }}>
                            Reorder Point:
                          </Typography>
                        </Stack>
                        <Typography variant="body1" sx={{ fontWeight: 600, color: '#333' }}>
                          {selectedItemDetails.reorderPoint || 'N/A'}
                        </Typography>
                      </Box>
                      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <Stack direction="row" alignItems="center" spacing={1}>
                          <Typography sx={{ color: '#1976d2', fontSize: 16 }}>✅</Typography>
                          <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.9rem', fontWeight: 500 }}>
                            Status:
                          </Typography>
                        </Stack>
                        <Stack direction="row" alignItems="center" spacing={1}>
                          {selectedItemDetails.currentStock > (selectedItemDetails.minLevel || 0) ? (
                            <CheckIcon sx={{ color: '#4caf50', fontSize: 20 }} />
                          ) : (
                            <ErrorIcon sx={{ color: '#f44336', fontSize: 20 }} />
                          )}
                          <Chip 
                            label={getStockStatus(selectedItemDetails).label} 
                            color={getStockStatus(selectedItemDetails).color} 
                            size="small"
                            sx={{
                              fontWeight: 600,
                              color: 'white',
                              '&.MuiChip-colorSuccess': {
                                bgcolor: '#4caf50'
                              },
                              '&.MuiChip-colorError': {
                                bgcolor: '#f44336'
                              },
                              '&.MuiChip-colorWarning': {
                                bgcolor: '#ff9800'
                              }
                            }}
                          />
                        </Stack>
                      </Box>
                    </Stack>
                  </Card>
                </Grid>

                {/* Vendor Information */}
                {(() => {
                  const vendorData = parseVendorDetails(selectedItemDetails.vendorDetails);
                  if (vendorData.vendorCode || vendorData.vendorName) {
                    return (
                      <Grid item xs={12}>
                        <Card sx={{ 
                          p: { xs: 2, md: 3 }, 
                          borderRadius: 3,
                          boxShadow: 2,
                          border: '1px solid',
                          borderColor: 'rgba(25, 118, 210, 0.1)',
                          '&:hover': {
                            boxShadow: 4,
                            borderColor: 'rgba(25, 118, 210, 0.2)'
                          }
                        }}>
                          <Stack direction="row" alignItems="center" spacing={1.5} sx={{ mb: 3 }}>
                            <VendorIcon sx={{ color: '#1976d2', fontSize: 24 }} />
                            <Typography variant="h6" sx={{ 
                              fontWeight: 600, 
                              color: '#1976d2',
                              fontSize: '1.1rem'
                            }}>
                              Vendor Information
                            </Typography>
                          </Stack>
                          <Grid container spacing={{ xs: 2, md: 3 }}>
                            <Grid item xs={12} sm={6}>
                              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                <Stack direction="row" alignItems="center" spacing={1}>
                                  <Typography sx={{ color: '#1976d2', fontSize: 16 }}>🏢</Typography>
                                  <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.9rem', fontWeight: 500 }}>
                                    Vendor Code:
                                  </Typography>
                                </Stack>
                                <Typography variant="body1" sx={{ fontWeight: 600, color: '#333' }}>
                                  {vendorData.vendorCode || 'N/A'}
                                </Typography>
                              </Box>
                            </Grid>
                            <Grid item xs={12} sm={6}>
                              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                <Stack direction="row" alignItems="center" spacing={1}>
                                  <Typography sx={{ color: '#1976d2', fontSize: 16 }}>👤</Typography>
                                  <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.9rem', fontWeight: 500 }}>
                                    Vendor Name:
                                  </Typography>
                                </Stack>
                                <Typography variant="body1" sx={{ fontWeight: 600, color: '#333' }}>
                                  {vendorData.vendorName || 'N/A'}
                                </Typography>
                              </Box>
                            </Grid>
                            <Grid item xs={12} sm={6}>
                              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                <Stack direction="row" alignItems="center" spacing={1}>
                                  <Typography sx={{ color: '#1976d2', fontSize: 16 }}>📞</Typography>
                                  <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.9rem', fontWeight: 500 }}>
                                    Contact Person:
                                  </Typography>
                                </Stack>
                                <Typography variant="body1" sx={{ fontWeight: 600, color: '#333' }}>
                                  {vendorData.vendorContact || 'N/A'}
                                </Typography>
                              </Box>
                            </Grid>
                            <Grid item xs={12} sm={6}>
                              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                <Stack direction="row" alignItems="center" spacing={1}>
                                  <Typography sx={{ color: '#1976d2', fontSize: 16 }}>📧</Typography>
                                  <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.9rem', fontWeight: 500 }}>
                                    Email:
                                  </Typography>
                                </Stack>
                                <Typography variant="body1" sx={{ fontWeight: 600, color: '#333' }}>
                                  {vendorData.vendorEmail || 'N/A'}
                                </Typography>
                              </Box>
                            </Grid>
                          </Grid>
                        </Card>
                      </Grid>
                    );
                  }
                  return null;
                })()}

                {/* Item Specifications */}
                {selectedItemDetails["item specifications"] && (
                  <Grid item xs={12}>
                    <Card sx={{ 
                      p: { xs: 2, md: 3 }, 
                      borderRadius: 3,
                      boxShadow: 2,
                      border: '1px solid',
                      borderColor: 'rgba(25, 118, 210, 0.1)',
                      '&:hover': {
                        boxShadow: 4,
                        borderColor: 'rgba(25, 118, 210, 0.2)'
                      }
                    }}>
                      <Stack direction="row" alignItems="center" spacing={1.5} sx={{ mb: 3 }}>
                        <InfoIcon sx={{ color: '#1976d2', fontSize: 24 }} />
                        <Typography variant="h6" sx={{ 
                          fontWeight: 600, 
                          color: '#1976d2',
                          fontSize: '1.1rem'
                        }}>
                          Item Specifications
                        </Typography>
                      </Stack>
                      <Typography variant="body2" sx={{ 
                        whiteSpace: 'pre-wrap',
                        p: { xs: 2, md: 3 },
                        bgcolor: 'rgba(25, 118, 210, 0.05)',
                        borderRadius: 2,
                        border: '1px solid',
                        borderColor: 'rgba(25, 118, 210, 0.1)',
                        fontSize: '0.9rem',
                        lineHeight: 1.6
                      }}>
                        {selectedItemDetails["item specifications"]}
                      </Typography>
                    </Card>
                  </Grid>
                )}
              </Grid>
            </Box>
          )}
        </DialogContent>
        
        {/* Sticky Footer */}
        <DialogActions sx={{ 
          position: 'sticky',
          bottom: 0,
          zIndex: 1,
          bgcolor: 'background.paper',
          borderTop: '1px solid',
          borderColor: 'divider',
          p: { xs: 2, md: 3 },
          pt: 2,
          justifyContent: 'flex-end', 
          gap: 2,
          flexShrink: 0
        }}>
          <Button 
            onClick={() => setOpenViewDetailsDialog(false)}
            variant="outlined"
            startIcon={<CloseIcon />}
            size={isMobile ? "medium" : "large"}
            sx={{
              border: '2px solid #e0e0e0',
              color: '#666',
              borderRadius: 2,
              px: { xs: 2, md: 3 },
              py: 1,
              fontWeight: 600,
              '&:hover': {
                borderColor: '#1976d2',
                backgroundColor: 'rgba(25, 118, 210, 0.04)',
                color: '#1976d2'
              }
            }}
          >
            Close
          </Button>
          <Button 
            onClick={() => generateStockItemPDF(selectedItemDetails)}
            variant="contained"
            startIcon={<PrintIcon />}
            size={isMobile ? "medium" : "large"}
            sx={{ 
              bgcolor: '#1976d2',
              color: 'white',
              borderRadius: 2,
              px: { xs: 2, md: 3 },
              py: 1,
              fontWeight: 600,
              boxShadow: 2,
              '&:hover': { 
                bgcolor: '#1565c0',
                transform: 'translateY(-1px)',
                boxShadow: 4
              }
            }}
          >
            Download PDF
          </Button>
        </DialogActions>
      </Dialog>

      {/* Quick Add Dialog */}
      <Dialog
        open={openQuickAddDialog}
        onClose={() => setOpenQuickAddDialog(false)}
        maxWidth="lg"
        fullWidth
        fullScreen={isMobile}
      >
        <DialogTitle sx={{ 
          background: 'linear-gradient(135deg, #4caf50 0%, #2e7d32 100%)',
          color: 'white',
          display: 'flex',
          alignItems: 'center',
          gap: 2,
          py: 3
        }}>
          <QuickAddIcon sx={{ fontSize: 28 }} />
          <Box>
            <Typography variant="h5" sx={{ fontWeight: 'bold' }}>
              Quick Add - New Item
            </Typography>
            <Typography variant="body2" sx={{ opacity: 0.9 }}>
              Create a new item based on existing item details
            </Typography>
          </Box>
        </DialogTitle>
        
        <DialogContent sx={{ p: 0 }}>
          <Box sx={{ p: 4 }}>
            <Grid container spacing={3}>
              {/* New Item Form - Full Width */}
              <Grid item xs={12}>
                <Card sx={{ height: '100%', border: '2px solid #4caf50' }}>
                  <CardContent>
                    <Stack direction="row" alignItems="center" spacing={2} sx={{ mb: 3 }}>
                      <QuickAddIcon color="success" />
                      <Typography variant="h6" sx={{ fontWeight: 'bold', color: '#4caf50' }}>
                        New Item Details
                      </Typography>
                    </Stack>
                    
                    {quickAddItem && (
                      <Stack spacing={2}>
                        <TextField
                          fullWidth
                          label="Item Code"
                          value={quickAddItem.itemCode}
                          onChange={(e) => setQuickAddItem({...quickAddItem, itemCode: e.target.value})}
                          variant="outlined"
                          size="small"
                          required
                        />
                        <TextField
                          fullWidth
                          label="Item Name"
                          value={quickAddItem.itemName}
                          onChange={(e) => setQuickAddItem({...quickAddItem, itemName: e.target.value})}
                          variant="outlined"
                          size="small"
                          required
                        />
                        <FormControl fullWidth size="small">
                          <InputLabel>Category</InputLabel>
                          <Select
                            value={quickAddItem.category}
                            onChange={(e) => {
                              const newCategory = e.target.value;
                              // Generate new item code based on category
                              const newItemCode = generateItemCode(newCategory);
                              setQuickAddItem({
                                ...quickAddItem, 
                                category: newCategory,
                                itemCode: newItemCode
                              });
                            }}
                            label="Category"
                          >
                            {categories.map((category) => (
                              <MenuItem key={category} value={category}>
                                {category}
                              </MenuItem>
                            ))}
                          </Select>
                        </FormControl>
                        <FormControl fullWidth size="small">
                          <InputLabel>Unit</InputLabel>
                          <Select
                            value={quickAddItem.unit}
                            onChange={(e) => setQuickAddItem({...quickAddItem, unit: e.target.value})}
                            label="Unit"
                          >
                            {units.map((unit) => (
                              <MenuItem key={unit} value={unit}>
                                {unit}
                              </MenuItem>
                            ))}
                          </Select>
                        </FormControl>
                        <FormControl fullWidth size="small">
                          <InputLabel>Location</InputLabel>
                          <Select
                            value={quickAddItem.location}
                            onChange={(e) => setQuickAddItem({...quickAddItem, location: e.target.value})}
                            label="Location"
                          >
                            {locations.map((location) => (
                              <MenuItem key={location} value={location}>
                                {location}
                              </MenuItem>
                            ))}
                          </Select>
                        </FormControl>
                        <FormControl fullWidth size="small">
                          <InputLabel>Make</InputLabel>
                          <Select
                            value={quickAddItem.make || ''}
                            onChange={(e) => setQuickAddItem({...quickAddItem, make: e.target.value})}
                            label="Make"
                          >
                            {makes.map((make) => (
                              <MenuItem key={make} value={make}>
                                {make}
                              </MenuItem>
                            ))}
                          </Select>
                        </FormControl>
                        <Grid container spacing={2}>
                          <Grid item xs={4}>
                            <TextField fullWidth label="Current Stock" type="number"
                              value={quickAddItem.currentStock || 0}
                              onChange={(e) => setQuickAddItem({ ...quickAddItem, currentStock: Number(e.target.value) })}
                              variant="outlined" size="small" />
                          </Grid>
                          <Grid item xs={4}>
                            <TextField
                              fullWidth
                              label="Min Level"
                              type="number"
                              value={quickAddItem.minLevel}
                              onChange={(e) => setQuickAddItem({...quickAddItem, minLevel: Number(e.target.value)})}
                              variant="outlined"
                              size="small"
                            />
                          </Grid>
                          <Grid item xs={4}>
                            <TextField
                              fullWidth
                              label="Max Level"
                              type="number"
                              value={quickAddItem.maxLevel}
                              onChange={(e) => setQuickAddItem({...quickAddItem, maxLevel: Number(e.target.value)})}
                              variant="outlined"
                              size="small"
                        />
                          </Grid>
                          <Grid item xs={4}>
                            <TextField
                              fullWidth
                              label="Reorder Level"
                              type="number"
                              value={quickAddItem.reorderLevel}
                              onChange={(e) => setQuickAddItem({...quickAddItem, reorderLevel: Number(e.target.value)})}
                              variant="outlined"
                              size="small"
                            />
                          </Grid>
                        </Grid>

                        {/* Vendor Management Section */}
                        <Box sx={{ mt: 3 }}>
                          <Stack direction="row" alignItems="center" spacing={2} sx={{ mb: 2 }}>
                            <VendorIcon color="primary" />
                            <Typography variant="h6" sx={{ color: '#1976d2', fontWeight: 'bold' }}>
                              Vendor Management
                            </Typography>
                            <Button
                              startIcon={<AddIcon />}
                              onClick={() => {
                                const newVendor = {
                                  vendorCode: "",
                                  vendorName: "",
                                  vendorContact: "",
                                  vendorEmail: ""
                                };
                                setQuickAddItem({
                                  ...quickAddItem,
                                  vendorDetails: [...(quickAddItem.vendorDetails || []), newVendor]
                                });
                              }}
                              variant="outlined"
                              size="small"
                              sx={{ ml: 'auto' }}
                            >
                              Add Vendor
                            </Button>
                          </Stack>
                          
                          {(!quickAddItem.vendorDetails || quickAddItem.vendorDetails.length === 0) && (
                            <Card sx={{ p: 2, textAlign: 'center', bgcolor: '#f5f5f5' }}>
                              <Typography variant="body2" color="text.secondary">
                                No vendors assigned. Click "Add Vendor" to add vendors for this item.
                              </Typography>
                            </Card>
                          )}
                          
                          {quickAddItem.vendorDetails && quickAddItem.vendorDetails.map((vendor, index) => (
                            <Card key={index} sx={{ mb: 2, p: 2, border: '1px solid #e0e0e0' }}>
                              <Stack direction="row" alignItems="center" spacing={2} sx={{ mb: 2 }}>
                                <Typography variant="subtitle2" sx={{ flexGrow: 1 }}>
                                  Vendor {index + 1}
                                </Typography>
                                <IconButton
                                  size="small"
                                  onClick={() => {
                                    const updatedVendors = quickAddItem.vendorDetails.filter((_, i) => i !== index);
                                    setQuickAddItem({...quickAddItem, vendorDetails: updatedVendors});
                                  }}
                                  color="error"
                                >
                                  <DeleteIcon />
                                </IconButton>
                              </Stack>
                              
                              <Grid container spacing={3}>
                                <Grid item xs={12} sm={6} md={7}>
                                  <Autocomplete
                                    fullWidth
                                    options={vendors.map(v => v.vendorCode).filter(vendorCode => {
                                      const selectedVendorCodes = (quickAddItem.vendorDetails || [])
                                        .map((v, i) => i !== index ? v.vendorCode : null)
                                        .filter(code => code && code.trim() !== '');
                                      return !selectedVendorCodes.includes(vendorCode);
                                    })}
                                    value={vendor.vendorCode}
                                    onChange={(event, newValue) => {
                                      const selectedVendor = vendors.find(v => v.vendorCode === newValue);
                                      const updatedVendors = [...(quickAddItem.vendorDetails || [])];
                                      updatedVendors[index] = {
                                        vendorCode: newValue || "",
                                        vendorName: selectedVendor?.vendorName || "",
                                        vendorContact: selectedVendor?.contacts?.[0]?.name || "",
                                        vendorEmail: selectedVendor?.contacts?.[0]?.email || ""
                                      };
                                      setQuickAddItem({...quickAddItem, vendorDetails: updatedVendors});
                                    }}
                                    loading={loadingVendors}
                                    sx={{
                                      '& .MuiAutocomplete-input': {
                                        textOverflow: 'clip !important',
                                        overflow: 'visible !important',
                                        whiteSpace: 'nowrap !important'
                                      }
                                    }}
                                    renderInput={(params) => (
                                      <TextField
                                        {...params}
                                        label="Vendor Code"
                                        variant="standard"
                                        placeholder="Select vendor..."
                                        size="small"
                                        InputLabelProps={{
                                          shrink: true,
                                          sx: {
                                            whiteSpace: 'nowrap',
                                            overflow: 'visible',
                                            textOverflow: 'clip'
                                          }
                                        }}
                                        InputProps={{
                                          ...params.InputProps,
                                          sx: {
                                            '& input': {
                                              textOverflow: 'clip !important',
                                              overflow: 'visible !important'
                                            },
                                            minWidth: 220
                                          }
                                        }}
                                      />
                                    )}
                                  />
                                </Grid>
                                <Grid item xs={12} sm={6} md={5}>
                                  <TextField
                                    fullWidth
                                    label="Vendor Name"
                                    value={vendor.vendorName}
                                    variant="standard"
                                    placeholder="Auto-filled"
                                    InputProps={{ readOnly: true }}
                                    InputLabelProps={{
                                      shrink: true,
                                      sx: {
                                        whiteSpace: 'nowrap',
                                        overflow: 'visible',
                                        textOverflow: 'clip'
                                      }
                                    }}
                                    size="small"
                                  />
                                </Grid>
                                <Grid item xs={12} sm={6} md={6}>
                                  <TextField
                                    fullWidth
                                    label="Contact Person"
                                    value={vendor.vendorContact}
                                    variant="standard"
                                    placeholder="Auto-filled"
                                    InputProps={{ readOnly: true }}
                                    InputLabelProps={{
                                      shrink: true,
                                      sx: {
                                        whiteSpace: 'nowrap',
                                        overflow: 'visible',
                                        textOverflow: 'clip'
                                      }
                                    }}
                                    size="small"
                                  />
                                </Grid>
                                <Grid item xs={12} sm={6} md={6}>
                                  <TextField
                                    fullWidth
                                    label="Email"
                                    value={vendor.vendorEmail}
                                    variant="standard"
                                    placeholder="Auto-filled"
                                    InputProps={{ readOnly: true }}
                                    InputLabelProps={{
                                      shrink: true,
                                      sx: {
                                        whiteSpace: 'nowrap',
                                        overflow: 'visible',
                                        textOverflow: 'clip'
                                      }
                                    }}
                                    size="small"
                                  />
                                </Grid>
                              </Grid>
                            </Card>
                          ))}
                        </Box>
                      </Stack>
                    )}
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          </Box>
        </DialogContent>
        
        <DialogActions sx={{ p: 3, justifyContent: 'space-between' }}>
          <Button 
            onClick={() => setOpenQuickAddDialog(false)}
            variant="outlined"
            startIcon={<CancelIcon />}
            size="large"
          >
            Cancel
          </Button>
          <Button 
            onClick={handleQuickAddSubmit}
            variant="contained"
            startIcon={<SaveIcon />}
            size="large"
            sx={{ 
              bgcolor: '#4caf50',
              '&:hover': { bgcolor: '#2e7d32' }
            }}
            disabled={loading}
          >
            {loading ? "Creating..." : "Create New Item"}
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
      >
        <Alert
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          severity={snackbar.severity}
          sx={{ width: "100%" }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default StockManagement;
