import React, { useState, useEffect } from "react";
import {
  Box,
  Button,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Snackbar,
  Alert,
  Chip,
  IconButton,
  Tooltip,
  Grid,
  TableSortLabel,
  TablePagination,
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
  Typography,
  useTheme,
  useMediaQuery,
  CircularProgress,
} from "@mui/material";
import {
  CheckCircle,
  Delete as DeleteIcon,
  CallReceived as InwardIcon,
  LocalShipping as SupplierIcon,
  Add as AddIcon,
  Search as SearchIcon,
  Save as SaveIcon,
  Cancel as CancelIcon,
  Close as CloseIcon,
  Assignment as AssignmentIcon,
  Analytics as AnalyticsIcon,
  TrendingUp as TrendingUpIcon,
  Receipt as ReceiptIcon,
  Inventory as InventoryIcon,
  Today as TodayIcon,
  Scale as ScaleIcon,
  Person as PersonIcon,
  CheckCircleOutline as CheckOutlineIcon,
  Schedule as PendingIcon,
  Refresh as RefreshIcon,
  HourglassEmpty as ProcessingIcon,
} from "@mui/icons-material";
import {
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Autocomplete,
} from "@mui/material";
import sheetService from "../../services/sheetService";

const updateStockLevels = async (itemCode, quantity, operation) => {
  const stockData = await sheetService.getSheetData("Stock");
  const stockIndex = stockData.findIndex((item) => item.itemCode === itemCode);
  if (stockIndex === -1) {
    throw new Error(
      "Item not found in Stock sheet. Please add it to Stock first."
    );
  }
  const updatedStock = { ...stockData[stockIndex] };
  const currentStock = parseFloat(updatedStock.currentStock) || 0;
  const qty = parseFloat(quantity) || 0;
  updatedStock.currentStock =
    operation === "inward"
      ? (currentStock + qty).toString()
      : (currentStock - qty).toString();
  updatedStock.lastUpdated = new Date().toISOString().split("T")[0];
  await sheetService.updateRow("Stock", stockIndex + 2, updatedStock);
};

const MaterialInwardRegister = () => {
  // Theme and responsive design
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const isTablet = useMediaQuery(theme.breakpoints.between('md', 'lg'));

  // State management
  const [materials, setMaterials] = useState([]);
  const [openDialog, setOpenDialog] = useState(false);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success",
  });
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split("T")[0],
    itemCode: "",
    itemName: "",
    quantity: "",
    unit: "",
    supplier: "",
    status: "Pending",
  });
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [orderBy, setOrderBy] = useState("date");
  const [order, setOrder] = useState("asc");
  const [search, setSearch] = useState("");
  const [stockItems, setStockItems] = useState([]);
  const [availableVendors, setAvailableVendors] = useState([]);

  // Normalize vendor list from a stock row irrespective of header naming
  const extractVendorsFromStockItem = (item) => {

    const options = [];
    const addUnique = (code, name) => {
      const normCode = (code || '').toString().trim();
      const normName = (name || '').toString().trim() || undefined;
      if (!normCode) return;
      if (!options.some(v => v.vendorCode === normCode)) {
        options.push({ vendorCode: normCode, vendorName: normName });
      }
    };

    // Direct common fields - check multiple possible field names
    addUnique(item.vendorCode || item.VendorCode || item['Vendor Code'] || item.vendor);
    addUnique(item.supplierCode || item.SupplierCode || item['Supplier Code'] || item.supplier);
    
    // Check for vendor fields that might contain comma-separated or array values
    const vendorFields = [
      'vendors', 'Vendors', 'VENDORS',
      'vendorList', 'VendorList', 'VENDOR_LIST',
      'vendorCodes', 'VendorCodes', 'VENDOR_CODES',
      'suppliers', 'Suppliers', 'SUPPLIERS',
      'supplierList', 'SupplierList', 'SUPPLIER_LIST'
    ];
    
    vendorFields.forEach(fieldName => {
      const fieldValue = item[fieldName];
      if (fieldValue) {
        if (typeof fieldValue === 'string') {
          // Handle comma-separated vendor codes
          fieldValue.split(/[,;]+/).map(s => s.trim()).filter(Boolean).forEach(vendorCode => {
            addUnique(vendorCode, undefined);
          });
        } else if (Array.isArray(fieldValue)) {
          fieldValue.forEach(vendor => {
            if (typeof vendor === 'string') {
              addUnique(vendor.trim(), undefined);
            } else if (vendor && typeof vendor === 'object') {
              addUnique(vendor.vendorCode || vendor.code || vendor.id, vendor.vendorName || vendor.name);
            }
          });
        }
      }
    });

    // Structured vendorDetails JSON - This is the primary source of vendor information
    const vd = item.vendorDetails || item.VendorDetails || item['Vendor Details'];
    if (vd) {
      try {
        let parsedVendors = null;
        
        // Handle different data types
        if (typeof vd === 'string') {
          // First try to parse as complete JSON
          try {
            parsedVendors = JSON.parse(vd);
          } catch (parseError) {
            console.warn("Failed to parse as complete JSON:", parseError);
            
            // Check for incomplete JSON and try to fix it
            if (vd.includes('[') && !vd.includes(']')) {
              console.warn("Incomplete JSON array detected - attempting to fix");
              let fixedVd = vd;
              const openBrackets = (vd.match(/\[/g) || []).length;
              const closeBrackets = (vd.match(/\]/g) || []).length;
              const openBraces = (vd.match(/\{/g) || []).length;
              const closeBraces = (vd.match(/\}/g) || []).length;
              
              // Add missing closing brackets/braces
              for (let i = 0; i < openBrackets - closeBrackets; i++) {
                fixedVd += ']';
              }
              for (let i = 0; i < openBraces - closeBraces; i++) {
                fixedVd += '}';
              }
              try {
                parsedVendors = JSON.parse(fixedVd);
              } catch (fixError) {
                console.warn("Failed to parse fixed JSON:", fixError);
                // Try to extract vendor codes and names from incomplete string
                const vendorCodeMatches = vd.match(/"vendorCode"\s*:\s*"([^"]*)/g);
                const vendorNameMatches = vd.match(/"vendorName"\s*:\s*"([^"]*)/g);
                
                if (vendorCodeMatches) {
                  vendorCodeMatches.forEach((match, index) => {
                    const code = match.match(/"vendorCode"\s*:\s*"([^"]*)/)[1];
                    const name = vendorNameMatches && vendorNameMatches[index] 
                      ? vendorNameMatches[index].match(/"vendorName"\s*:\s*"([^"]*)/)[1] 
                      : undefined;
                    addUnique(code, name);
                  });
                }
                
                // If no vendor codes found, try alternative patterns
                if (!vendorCodeMatches || vendorCodeMatches.length === 0) {
                  // Look for any VEND pattern in the string
                  const vendPattern = vd.match(/VEND\d+/gi);
                  if (vendPattern) {
                    vendPattern.forEach(vendCode => {
                      addUnique(vendCode, undefined);
                    });
                  }
                }
              }
            } else {
              // Try to extract vendor information from malformed JSON
              const vendorCodeMatches = vd.match(/"vendorCode"\s*:\s*"([^"]*)/g);
              const vendorNameMatches = vd.match(/"vendorName"\s*:\s*"([^"]*)/g);
              
              if (vendorCodeMatches) {
                vendorCodeMatches.forEach((match, index) => {
                  const code = match.match(/"vendorCode"\s*:\s*"([^"]*)/)[1];
                  const name = vendorNameMatches && vendorNameMatches[index] 
                    ? vendorNameMatches[index].match(/"vendorName"\s*:\s*"([^"]*)/)[1] 
                    : undefined;
                  addUnique(code, name);
                });
              }
              
              // If no vendor codes found, try VEND pattern
              if (!vendorCodeMatches || vendorCodeMatches.length === 0) {
                const vendPattern = vd.match(/VEND\d+/gi);
                if (vendPattern) {
                  vendPattern.forEach(vendCode => {
                    addUnique(vendCode, undefined);
                  });
                }
              }
            }
          }
        } else if (Array.isArray(vd)) {
          // Already an array
          parsedVendors = vd;
        } else if (typeof vd === 'object') {
          // Single object, convert to array
          parsedVendors = [vd];
        }
        
        // Process the parsed vendors
        if (parsedVendors) {
          processVendorData(parsedVendors);
        }
        
      } catch (e) {
        console.warn('Error parsing vendor details:', e);
        console.warn('Raw vendor details that failed to parse:', vd);
        
        // Try to extract vendor information from malformed JSON
        if (typeof vd === 'string') {
          // Look for multiple vendorCode patterns
          const vendorCodeMatches = vd.match(/"vendorCode"\s*:\s*"([^"]*)/g);
          if (vendorCodeMatches) {
            vendorCodeMatches.forEach(match => {
              const code = match.match(/"vendorCode"\s*:\s*"([^"]*)/)[1];
              addUnique(code, undefined);
            });
          }
          
          // Look for vendorName patterns
          const vendorNameMatches = vd.match(/"vendorName"\s*:\s*"([^"]*)/g);
          if (vendorNameMatches && options.length > 0) {
            vendorNameMatches.forEach((match, index) => {
              const name = match.match(/"vendorName"\s*:\s*"([^"]*)/)[1];
              if (options[index]) {
                options[index].vendorName = name;
              }
            });
          }
        }
      }
    } else {
    }
    
    // Helper function to process vendor data
    function processVendorData(parsed) {
      // Handle new array format from updated Stock Management
      if (Array.isArray(parsed)) {
        parsed.forEach((vendor, index) => {
          if (vendor && typeof vendor === 'object') {
            const vendorCode = vendor.vendorCode || vendor.code || vendor.VendorCode;
            const vendorName = vendor.vendorName || vendor.name || vendor.VendorName;
            addUnique(vendorCode, vendorName);
          } else if (typeof vendor === 'string' && vendor.trim()) {
            addUnique(vendor.trim(), undefined);
          }
        });
      } else if (parsed && typeof parsed === 'object') {
        // Handle legacy single vendor object format
        const vendorCode = parsed.vendorCode || parsed.code || parsed.VendorCode;
        const vendorName = parsed.vendorName || parsed.name || parsed.VendorName;
        addUnique(vendorCode, vendorName);
        
        // Check for nested vendor lists
        const lists = parsed.vendors || parsed.vendorList || parsed.availableVendors;
        if (Array.isArray(lists)) {
          lists.forEach((v, index) => {
            if (typeof v === 'string') {
              addUnique(v.trim());
            } else if (v && typeof v === 'object') {
              const code = v.vendorCode || v.code || v.id;
              const name = v.vendorName || v.name;
              addUnique(code, name);
            }
          });
        }
        
        // Handle alternate vendors string format
        if (typeof parsed.alternateVendors === 'string' && parsed.alternateVendors.trim()) {
          parsed.alternateVendors.split(/[,;]+/).map(s => s.trim()).filter(Boolean).forEach((tok, index) => {
            const [code, name] = tok.split('|').map(p => (p || '').trim());
            addUnique(code || tok, name);
          });
        }
      }
    }

    // Any other keys that look like vendor data
    Object.keys(item || {}).forEach(k => {
      if (/vendor|supplier/i.test(k)) {
        const value = item[k];
        if (value == null || value === '') return;
        if (Array.isArray(value)) {
          value.forEach(v => {
            if (typeof v === 'string') addUnique(v);
            else addUnique(v.vendorCode || v.code || v.id, v.vendorName || v.name);
          });
          return;
        }
        if (typeof value === 'object') {
          addUnique(value.vendorCode || value.code || value.id, value.vendorName || value.name);
          return;
        }
        if (typeof value === 'string') {
          try {
            const parsed = JSON.parse(value);
            if (Array.isArray(parsed)) {
              parsed.forEach(v => {
                if (typeof v === 'string') addUnique(v);
                else addUnique(v.vendorCode || v.code || v.id, v.vendorName || v.name);
              });
            } else if (parsed && typeof parsed === 'object') {
              addUnique(parsed.vendorCode || parsed.code || parsed.id, parsed.vendorName || parsed.name);
            }
          } catch {
            // If not JSON, try comma-separated values
            value.split(/[,;]+/).map(s => s.trim()).filter(Boolean).forEach(tok => {
              const [code, name] = tok.split('|').map(p => (p || '').trim());
              addUnique(code || tok, name);
            });
          }
        }
      }
    });
    
    // Final comprehensive check - look for any field containing VEND001, VEND002, etc.
    Object.keys(item || {}).forEach(k => {
      const value = item[k];
      if (typeof value === 'string' && /VEND\d+/i.test(value)) {
        // Extract all VEND codes from the string
        const vendMatches = value.match(/VEND\d+/gi);
        if (vendMatches) {
          vendMatches.forEach(vendCode => {
            addUnique(vendCode, undefined);
          });
        }
      }
    });
    // If still no options found, do a final aggressive search
    if (options.length === 0) {
      // Last resort: search every field for any vendor-like patterns
      const allFieldsString = JSON.stringify(item);
      const vendCodes = allFieldsString.match(/VEND\d+/gi);
      if (vendCodes) {
        vendCodes.forEach(code => addUnique(code, undefined));
      }
    }
    return options;
  };

  // Fetch stock items for dropdown
  const fetchStockItems = async () => {
    try {
      const data = await sheetService.getSheetData("Stock");
      setStockItems(data);
    } catch (error) {
      console.error("Error fetching stock items:", error);
    }
  };

  // Handle item code selection and auto-populate fields
  const handleItemCodeChange = async (event, newValue) => {
    if (newValue) {

      // Debug: Log all fields that might contain vendor information
      Object.keys(newValue).forEach(key => {
        if (/vendor|supplier/i.test(key)) {
        }
      });
      
      // Check for AB001 specifically
      if (newValue.itemCode === 'AB001') {
        
      }
      
      // newValue is the full object from Autocomplete
      let vendorCode = "";
      let vendors = [];
      
      // Extract vendor code from vendorDetails if it exists
      if (newValue.vendorDetails) {
        try {
          const vendorData = typeof newValue.vendorDetails === 'string' 
            ? JSON.parse(newValue.vendorDetails) 
            : newValue.vendorDetails;

          // Handle new array format from updated Stock Management
          if (Array.isArray(vendorData)) {
            vendors = vendorData;
            vendorCode = vendorData.length > 0 ? vendorData[0].vendorCode || "" : "";
          } else {
            // Handle legacy single vendor object format
            vendorCode = vendorData.vendorCode || "";
            // Try common shapes for vendor lists
            if (Array.isArray(vendorData.vendors)) {
              vendors = vendorData.vendors;
            } else if (Array.isArray(vendorData.vendorList)) {
              vendors = vendorData.vendorList;
            } else if (Array.isArray(vendorData.availableVendors)) {
              vendors = vendorData.availableVendors;
            } else if (typeof vendorData.alternateVendors === 'string') {
              // Parse comma/semicolon separated codes/names: "V001|Vendor A, V002|Vendor B"
              vendors = vendorData.alternateVendors
                .split(/[,;]+/)
                .map(s => s.trim())
                .filter(Boolean)
                .map(token => {
                  const [code, name] = token.split('|').map(p => (p || '').trim());
                  return { vendorCode: code || token, vendorName: name || undefined };
                });
            }
          }
        } catch (e) {
          console.warn("Error parsing vendor details:", e);
          vendorCode = newValue.vendorCode || "";
        }
      } else {
        vendorCode = newValue.vendorCode || "";
      }
      
      // Expand search through all vendor-like fields
      const normalizedVendorOptions = extractVendorsFromStockItem(newValue);
      // Ensure primary vendorCode is included
      if (vendorCode) {
        const exists = normalizedVendorOptions.some(v => v.vendorCode === vendorCode);
        if (!exists) normalizedVendorOptions.unshift({ vendorCode, vendorName: newValue.vendorName });
      }
      // Always set available vendors, even if empty (to show fallback message)
      setAvailableVendors(normalizedVendorOptions);
      
      // If no vendors found in stock item, fetch all vendors from vendor sheet as fallback
      if (normalizedVendorOptions.length === 0) {
        try {
          const allVendors = await sheetService.getSheetData("Vendors");
          const vendorOptions = allVendors
            .filter(vendor => vendor.vendorCode || vendor['Vendor Code'])
            .map(vendor => ({
              vendorCode: vendor.vendorCode || vendor['Vendor Code'] || '',
              vendorName: vendor.vendorName || vendor['Vendor Name'] || ''
            }))
            .filter(v => v.vendorCode.trim() !== '');
          setAvailableVendors(vendorOptions);
        } catch (error) {
          console.error("Error fetching fallback vendors:", error);
          setAvailableVendors([]);
        }
      }
      
      setFormData(prev => ({
        ...prev,
        itemCode: newValue.itemCode,
        itemName: newValue.itemName || "",
        unit: newValue.unit || "",
        supplier: normalizedVendorOptions.length > 0 ? vendorCode : "", // Only auto-populate if vendors found
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        itemCode: "",
        itemName: "",
        unit: "",
        supplier: "",
      }));
      setAvailableVendors([]);
    }
  };

  // Helper functions for UI
  const getTotalMaterials = () => materials.length;

  const getCompletedMaterials = () => 
    materials.filter(material => material.status === "Completed").length;

  const getPendingMaterials = () => 
    materials.filter(material => material.status === "Pending").length;

  const getTotalQuantity = () => 
    materials.reduce((total, material) => total + parseFloat(material.quantity || 0), 0);

  const getUniqueSuppliers = () => {
    const suppliers = new Set(materials.map(material => material.supplier).filter(Boolean));
    return suppliers.size;
  };

  const getTodaysMaterials = () => {
    const today = new Date().toDateString();
    return materials.filter(material => 
      new Date(material.date).toDateString() === today
    ).length;
  };

  // Fetch materials from sheet
  const fetchMaterials = async () => {
    try {
      setLoading(true);
      const data = await sheetService.getSheetData("Material Inward");
      setMaterials(data);
    } catch (error) {
      setSnackbar({
        open: true,
        message: "Error fetching materials",
        severity: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  // Fetch data on component mount
  useEffect(() => {
    fetchStockItems();
    fetchMaterials();
    
    // Check for pre-selected item from Stock Management
    const selectedItem = sessionStorage.getItem('selectedItemForInward');
    if (selectedItem) {
      try {
        const itemData = JSON.parse(selectedItem);
        setFormData(prev => ({
          ...prev,
          itemCode: itemData.itemCode || '',
          itemName: itemData.itemName || '',
          unit: itemData.unit || '',
          // Keep quantity empty for user to fill
          quantity: '',
          // Keep supplier empty for user to select
          supplier: '',
        }));
        
        // Extract and set vendors from the pre-selected item
        if (itemData.vendorDetails) {
          const extractedVendors = extractVendorsFromStockItem(itemData);
          setAvailableVendors(extractedVendors);
        } else {
          setAvailableVendors([]);
        }
        
        // Auto-open the dialog
        setOpenDialog(true);
        // Clear the sessionStorage after use
        sessionStorage.removeItem('selectedItemForInward');
      } catch (error) {
        console.error('Error parsing selected item data:', error);
      }
    }
  }, []);

  const getStatusColor = (status) => {
    switch (status) {
      case "Completed":
        return "success";
      case "Pending":
        return "warning";
      default:
        return "default";
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case "Completed":
        return <CheckCircle color="success" />;
      case "Pending":
        return <PendingIcon color="warning" />;
      default:
        return <ProcessingIcon color="action" />;
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));

    if (name === "itemCode") {
      const item = stockItems.find((i) => i.itemCode === value);
      if (item) {
        setFormData((prev) => ({
          ...prev,
          itemName: item.itemName,
          unit: item.unit,
        }));
      }
    }
  };

  // Validation function
  const validateMaterialInwardForm = () => {
    const errors = [];
    
    // Required field validations
    if (!formData.itemCode || formData.itemCode.trim() === "") {
      errors.push("Item Code is required");
    }
    
    if (!formData.itemName || formData.itemName.trim() === "") {
      errors.push("Item Name is required");
    }
    
    if (!formData.quantity || formData.quantity.trim() === "") {
      errors.push("Quantity is required");
    }
    
    if (!formData.unit || formData.unit.trim() === "") {
      errors.push("Unit is required");
    }
    
    if (!formData.supplier || formData.supplier.trim() === "") {
      errors.push("Supplier is required");
    }
    
    // Numeric validations
    if (formData.quantity && isNaN(parseFloat(formData.quantity))) {
      errors.push("Quantity must be a valid number");
    }
    
    if (formData.quantity && parseFloat(formData.quantity) <= 0) {
      errors.push("Quantity must be greater than zero");
    }
    
    // Check if item exists in stock
    const itemExistsInStock = stockItems.some(
      (item) => item.itemCode && item.itemCode.toUpperCase() === formData.itemCode.toUpperCase()
    );
    
    if (!itemExistsInStock) {
      errors.push(`Item "${formData.itemCode}" not found in Stock. Please add it to Stock Management first.`);
    }
    
    return errors;
  };

  const handleSubmit = async () => {
    try {
      // Validate form
      const validationErrors = validateMaterialInwardForm();
      if (validationErrors.length > 0) {
        setSnackbar({
          open: true,
          message: validationErrors.join(", "),
          severity: "error",
        });
        return;
      }
      
      // Sanitize and prepare data
      const rowData = {
        date: formData.date,
        itemCode: formData.itemCode.trim(),
        itemName: formData.itemName.trim(),
        quantity: parseFloat(formData.quantity).toString(),
        unit: formData.unit.trim(),
        supplier: formData.supplier.trim(),
        status: formData.status || "Pending",
        lastUpdated: new Date().toISOString().split("T")[0],
      };
      
      await sheetService.appendRow("Material Inward", rowData);
      setOpenDialog(false);
      setSnackbar({
        open: true,
        message: "Material inward entry added successfully",
        severity: "success",
      });
      fetchMaterials();
      resetForm();
    } catch (error) {
      console.error("Error in handleSubmit:", error);
      setSnackbar({
        open: true,
        message: "Error adding material: " + error.message,
        severity: "error",
      });
    }
  };

  const handleUpdate = async (rowIndex, material) => {
    try {
      // Get the current material from sortedItems instead of materials
      const currentMaterial = sortedItems[rowIndex];
      // Find the actual index in the original materials array
      const originalIndex = materials.findIndex(
        (m) => m.itemCode === currentMaterial.itemCode && 
               m.date === currentMaterial.date && 
               m.quantity === currentMaterial.quantity &&
               m.supplier === currentMaterial.supplier
      );
      const isStatusChangingToCompleted = 
        currentMaterial.status !== "Completed" && material.status === "Completed";
      // Add lastUpdated timestamp
      const updatedMaterial = {
        ...material,
        lastUpdated: new Date().toISOString().split("T")[0],
      };
      // Use originalIndex + 2 for sheet row (header + 1-based indexing)
      await sheetService.updateRow("Material Inward", originalIndex + 2, updatedMaterial);
      // Update local state using original index
      setMaterials((prev) => {
        const updated = [...prev];
        updated[originalIndex] = { ...updatedMaterial };
        return updated;
      });
      
      // Only update stock if status is changing from non-Completed to Completed
      if (isStatusChangingToCompleted) {
        await updateStockLevels(material.itemCode, material.quantity, "inward");
        setSnackbar({
          open: true,
          message: "Material updated successfully",
          severity: "success",
        });
      } else {
        setSnackbar({
          open: true,
          message: "Material updated successfully",
          severity: "success",
        });
      }
    } catch (error) {
      console.error('Error in handleUpdate:', error);
      setSnackbar({
        open: true,
        message: "Error updating material: " + error.message,
        severity: "error",
      });
    }
  };

  const handleDelete = async (rowIndex) => {
    if (!window.confirm('Are you sure you want to delete this material entry?')) {
      return;
    }
    try {
      await sheetService.deleteRow("Material Inward", rowIndex + 2);
      setSnackbar({
        open: true,
        message: "Material deleted successfully",
        severity: "success",
      });
      fetchMaterials();
    } catch (error) {
      setSnackbar({
        open: true,
        message: "Error deleting material: " + error.message,
        severity: "error",
      });
    }
  };

  const resetForm = () => {
    setFormData({
      date: new Date().toISOString().split("T")[0],
      itemCode: "",
      itemName: "",
      quantity: "",
      unit: "",
      supplier: "",
      status: "Pending",
    });
  };

  // Sorting logic
  const handleRequestSort = (property) => {
    const isAsc = orderBy === property && order === "asc";
    setOrder(isAsc ? "desc" : "asc");
    setOrderBy(property);
  };

  const sortedItems = [...materials]
    .filter((item) =>
      String(item.itemCode || "").toLowerCase().includes(search.toLowerCase()) ||
      String(item.itemName || "").toLowerCase().includes(search.toLowerCase()) ||
      String(item.supplier || "").toLowerCase().includes(search.toLowerCase())
    )
    .sort((a, b) => {
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

  function handleChangePage(event, newPage) {
    setPage(newPage);
  }

  function handleChangeRowsPerPage(event) {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  }

  return (
    <Container maxWidth="xl" sx={{ py: 3 }}>
      {/* Header Section */}
      <Stack direction="row" alignItems="center" spacing={2} sx={{ mb: 3 }}>
        <Avatar sx={{ bgcolor: theme.palette.success.main, width: 56, height: 56 }}>
          <InwardIcon fontSize="large" />
        </Avatar>
        <Box>
          <Typography 
            variant="h4" 
            component="h1" 
        sx={{
              fontWeight: 'bold',
              background: 'linear-gradient(45deg, #2e7d32, #a5d6a7)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}
          >
            Material Inward Register
          </Typography>
          <Typography variant="subtitle1" color="text.secondary">
            Raw Material Inventory Management System
          </Typography>
        </Box>
        <Stack direction="row" spacing={2} sx={{ ml: 'auto' }}>
          <Tooltip title="Refresh Data">
            <IconButton onClick={fetchMaterials} color="success">
              <RefreshIcon />
            </IconButton>
          </Tooltip>
          {loading && (
            <CircularProgress 
              size={24} 
              color="success"
            />
          )}
        </Stack>
      </Stack>

      {/* Summary Cards */}
      {materials.length > 0 && (
        <Card sx={{ mb: 3, boxShadow: 3 }}>
          <CardContent>
            <Stack direction="row" alignItems="center" spacing={2} sx={{ mb: 2 }}>
              <AnalyticsIcon color="success" />
              <Typography variant="h6" component="h2" sx={{ fontWeight: 'bold' }}>
                Material Inward Summary
              </Typography>
            </Stack>
            
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6} md={2}>
                <Card variant="outlined" sx={{ p: 2, bgcolor: 'background.default' }}>
                  <Stack direction="row" alignItems="center" spacing={2}>
                    <Badge badgeContent={getTotalMaterials()} color="success">
                      <AssignmentIcon color="success" />
                    </Badge>
                    <Box>
                      <Typography variant="body2" color="text.secondary">
                        Total Materials
                      </Typography>
                      <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                        {getTotalMaterials()}
                      </Typography>
                    </Box>
                  </Stack>
                </Card>
              </Grid>
              <Grid item xs={12} sm={6} md={2}>
                <Card variant="outlined" sx={{ p: 2, bgcolor: 'background.default' }}>
                  <Stack direction="row" alignItems="center" spacing={2}>
                    <CheckCircle color="success" />
                    <Box>
                      <Typography variant="body2" color="text.secondary">
                        Completed
                      </Typography>
                      <Typography variant="h6" sx={{ fontWeight: 'bold', color: 'success.main' }}>
                        {getCompletedMaterials()}
                      </Typography>
                    </Box>
                  </Stack>
                </Card>
              </Grid>
              <Grid item xs={12} sm={6} md={2}>
                <Card variant="outlined" sx={{ p: 2, bgcolor: 'background.default' }}>
                  <Stack direction="row" alignItems="center" spacing={2}>
                    <PendingIcon color="warning" />
                    <Box>
                      <Typography variant="body2" color="text.secondary">
                        Pending
                      </Typography>
                      <Typography variant="h6" sx={{ fontWeight: 'bold', color: 'warning.main' }}>
                        {getPendingMaterials()}
                      </Typography>
                    </Box>
                  </Stack>
                </Card>
              </Grid>
              <Grid item xs={12} sm={6} md={2}>
                <Card variant="outlined" sx={{ p: 2, bgcolor: 'background.default' }}>
                  <Stack direction="row" alignItems="center" spacing={2}>
                    <TrendingUpIcon color="primary" />
                    <Box>
                      <Typography variant="body2" color="text.secondary">
                        Total Quantity
                      </Typography>
                      <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                        {getTotalQuantity()}
                      </Typography>
                    </Box>
                  </Stack>
                </Card>
              </Grid>
              <Grid item xs={12} sm={6} md={2}>
                <Card variant="outlined" sx={{ p: 2, bgcolor: 'background.default' }}>
                  <Stack direction="row" alignItems="center" spacing={2}>
                    <SupplierIcon color="info" />
                    <Box>
                      <Typography variant="body2" color="text.secondary">
                        Suppliers
                      </Typography>
                      <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                        {getUniqueSuppliers()}
                      </Typography>
                    </Box>
                  </Stack>
                </Card>
              </Grid>
              <Grid item xs={12} sm={6} md={2}>
                <Card variant="outlined" sx={{ p: 2, bgcolor: 'background.default' }}>
                  <Stack direction="row" alignItems="center" spacing={2}>
                    <TodayIcon color="warning" />
                    <Box>
                      <Typography variant="body2" color="text.secondary">
                        Today's Items
                      </Typography>
                      <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                        {getTodaysMaterials()}
                      </Typography>
                    </Box>
                  </Stack>
                </Card>
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      )}

      {/* Action Bar */}
      <Card sx={{ mb: 3, boxShadow: 3 }}>
        <CardContent>
          <Stack
            direction={{ xs: "column", sm: "row" }}
            justifyContent="space-between"
            alignItems={{ xs: "stretch", sm: "center" }}
            spacing={2}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <SearchIcon color="action" />
          <TextField
                label="Search materials"
            variant="outlined"
            size="small"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by Item Code, Name, or Supplier..."
                sx={{ minWidth: { xs: "100%", sm: "300px" } }}
          />
        </Box>
            
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => setOpenDialog(true)}
              size="large"
              sx={{ 
                background: 'linear-gradient(45deg, #2e7d32, #a5d6a7)',
                '&:hover': {
                  background: 'linear-gradient(45deg, #1b5e20, #2e7d32)',
                }
              }}
            >
              Add New Material
            </Button>
          </Stack>
        </CardContent>
      </Card>

      {/* Materials Table */}
      <Card sx={{ boxShadow: 3 }}>
        <CardContent sx={{ p: 0 }}>
          <Box sx={{ p: 3, pb: 0 }}>
            <Stack direction="row" alignItems="center" spacing={2}>
              <InwardIcon color="success" />
              <Typography variant="h6" component="h2" sx={{ fontWeight: 'bold' }}>
                Material Inward Entries
              </Typography>
              {sortedItems.length > 0 && (
                <Chip 
                  label={`${sortedItems.length} materials`} 
                  color="success" 
                  size="small" 
                />
              )}
            </Stack>
      </Box>

      {loading ? (
        <Box
          sx={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            minHeight: 200,
          }}
        >
          <CircularProgress />
        </Box>
      ) : (
            <>
              <TableContainer sx={{ maxHeight: 600 }}>
          <Table stickyHeader>
            <TableHead>
              <TableRow>
                {[
                  { id: "date", label: "Date" },
                        { id: "itemCode", label: "Item Details" },
                        { id: "quantity", label: "Quantity & Unit" },
                        { id: "supplier", label: "Supplier Info" },
                  { id: "status", label: "Status" },
                  { id: "actions", label: "Actions" },
                ].map((col) => (
                  <TableCell
                    key={col.id}
                          sx={{ 
                            fontWeight: 'bold', 
                            textTransform: 'uppercase',
                            bgcolor: 'success.main',
                            color: 'white',
                            fontSize: '0.75rem'
                          }}
                    sortDirection={orderBy === col.id ? order : false}
                  >
                          {col.id !== "actions" && col.id !== "itemCode" && col.id !== "quantity" && col.id !== "supplier" ? (
                      <TableSortLabel
                        active={orderBy === col.id}
                        direction={orderBy === col.id ? order : "asc"}
                        onClick={() => handleRequestSort(col.id)}
                              sx={{ color: 'white !important' }}
                      >
                        {col.label}
                      </TableSortLabel>
                    ) : (
                      col.label
                    )}
                  </TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
                    {paginatedItems.length > 0 ? (
                      paginatedItems.map((material, index) => (
                        <TableRow 
                          key={index}
                          sx={{ 
                            '&:nth-of-type(odd)': { bgcolor: 'action.hover' },
                            '&:hover': { bgcolor: 'action.selected' },
                            transition: 'background-color 0.2s'
                          }}
                        >
                          <TableCell>
                            <Stack alignItems="flex-start" spacing={0.5}>
                              <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                                {new Date(material.date).toLocaleDateString()}
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                {new Date(material.date).toLocaleDateString('en-US', { weekday: 'short' })}
                              </Typography>
                            </Stack>
                          </TableCell>
                          
                          <TableCell>
                            <Stack alignItems="flex-start" spacing={0.5}>
                              <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                                {material.itemName}
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                Code: {material.itemCode}
                              </Typography>
                            </Stack>
                          </TableCell>
                          
                          <TableCell>
                            <Stack alignItems="flex-start" spacing={0.5}>
                              <Typography variant="body2" sx={{ fontWeight: 'bold', color: 'success.main' }}>
                                {material.quantity} {material.unit}
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                Qty: {material.quantity}
                              </Typography>
                            </Stack>
                          </TableCell>
                          
                          <TableCell>
                            <Stack alignItems="flex-start" spacing={0.5}>
                              <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                                {material.supplier || 'N/A'}
                              </Typography>
                            </Stack>
                          </TableCell>
                          
                  <TableCell>
                    <Chip
                      label={material.status}
                              color={getStatusColor(material.status)}
                      variant={material.status === "Completed" ? "filled" : "outlined"}
                      size="small"
                              icon={getStatusIcon(material.status)}
                    />
                  </TableCell>
                          
                  <TableCell>
                            <Stack spacing={1}>
                              {/* GRN and PO Information */}
                              {(material.grnId || material.poId || material.GRNId || material.POId) && (
                                <Stack direction="row" spacing={0.5} flexWrap="wrap" useFlexGap>
                                  {material.grnId || material.GRNId ? (
                                    <Chip
                                      icon={<ReceiptIcon />}
                                      label={`GRN: ${material.grnId || material.GRNId}`}
                                      size="small"
                                      color="primary"
                                      variant="outlined"
                                      sx={{ fontSize: '0.7rem', height: 24 }}
                                    />
                                  ) : null}
                                  {material.poId || material.POId ? (
                                    <Chip
                                      icon={<AssignmentIcon />}
                                      label={`PO: ${material.poId || material.POId}`}
                                      size="small"
                                      color="secondary"
                                      variant="outlined"
                                      sx={{ fontSize: '0.7rem', height: 24 }}
                                    />
                                  ) : null}
                                </Stack>
                              )}
                              {/* Action Buttons */}
                              <Stack direction="row" spacing={1}>
                                <Tooltip title={material.status === "Completed" ? "Already Completed" : "Mark Complete"}>
                                  <span>
                                    <IconButton
                                      size="small"
                                      color={material.status === "Completed" ? "inherit" : "success"}
                                      onClick={() => {
                                        // Calculate the actual row index based on pagination
                                        const actualIndex = page * rowsPerPage + index;
                                        if (actualIndex < sortedItems.length) {
                                          handleUpdate(actualIndex, {
                                            ...material,
                                            status: "Completed",
                                          });
                                        } else {
                                          setSnackbar({
                                            open: true,
                                            message: "Error: Invalid row index",
                                            severity: "error",
                                          });
                                        }
                                      }}
                                      disabled={material.status === "Completed"}
                                    >
                                      <CheckCircle />
                                    </IconButton>
                                  </span>
                                </Tooltip>
                                <Tooltip title="Delete Material">
                                  <IconButton
                                    size="small"
                                    color="error"
                                    onClick={() => {
                                      // Calculate the actual row index based on pagination
                                      const actualIndex = page * rowsPerPage + index;
                                      handleDelete(actualIndex);
                                    }}
                                  >
                                    <DeleteIcon />
                                  </IconButton>
                                </Tooltip>
                              </Stack>
                            </Stack>
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={6} align="center" sx={{ py: 6 }}>
                          <Stack alignItems="center" spacing={2}>
                            <InwardIcon sx={{ fontSize: 64, color: 'text.disabled' }} />
                            <Typography variant="h6" color="text.secondary">
                              No material entries found
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              {search ? 
                                `No materials match "${search}". Try a different search term.` :
                                "Create your first material inward entry to get started"
                              }
                            </Typography>
                          </Stack>
                  </TableCell>
                </TableRow>
                    )}
            </TableBody>
          </Table>
        </TableContainer>

      <TablePagination
        component="div"
        count={sortedItems.length}
        page={page}
        onPageChange={handleChangePage}
        rowsPerPage={rowsPerPage}
        onRowsPerPageChange={handleChangeRowsPerPage}
        rowsPerPageOptions={[10, 20, 50, 100]}
                sx={{ borderTop: 1, borderColor: 'divider' }}
              />
            </>
          )}
        </CardContent>
      </Card>

      {/* Add Material Dialog */}
      <Dialog 
        open={openDialog} 
        onClose={() => setOpenDialog(false)} 
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
            onClick={() => setOpenDialog(false)}
            sx={{
              position: 'absolute',
              right: 16,
              top: '50%',
              transform: 'translateY(-50%)',
              color: '#4caf50',
              '&:hover': {
                backgroundColor: 'rgba(76, 175, 80, 0.1)'
              }
            }}
          >
            <CloseIcon />
          </IconButton>
          <Typography 
            variant="h4" 
            sx={{ 
              fontWeight: 700,
              background: 'linear-gradient(135deg, #4caf50, #66bb6a)',
              backgroundClip: 'text',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              textAlign: 'center',
              lineHeight: 1.2
            }}
          >
            Add New Material
          </Typography>
          <Typography 
            variant="body1" 
            sx={{ 
              color: 'text.secondary',
              textAlign: 'center',
              mt: 1
            }}
          >
            Create new material entry
          </Typography>
        </DialogTitle>
        
        <DialogContent sx={{ px: 4, py: 2, maxHeight: 'calc(90vh - 200px)', overflowY: 'auto', position: 'relative', zIndex: 1 }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
              <Box sx={{ flex: '1 1 200px', minWidth: '200px' }}>
                <TextField
                  fullWidth
                  label="Date *"
                  name="date"
                  type="date"
                  value={formData.date}
                  onChange={handleInputChange}
                  InputLabelProps={{ shrink: true }}
                  required
                  variant="standard"
                  InputProps={{
                    startAdornment: <TodayIcon color="action" sx={{ mr: 1 }} />
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
                <Autocomplete
                  options={stockItems}
                  getOptionLabel={(option) => option.itemCode || ""}
                  value={stockItems.find(item => item.itemCode === formData.itemCode) || null}
                  onChange={handleItemCodeChange}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label="Item Code *"
                      variant="standard"
                      required
                      InputProps={{
                        ...params.InputProps,
                        startAdornment: <InventoryIcon color="action" sx={{ mr: 1 }} />
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
                  )}
                  renderOption={(props, option) => {
                    // Extract vendor info for display
                    let vendorInfo = "";
                    try {
                      if (option.vendorDetails) {
                        const vendorData = typeof option.vendorDetails === 'string' 
                          ? JSON.parse(option.vendorDetails) 
                          : option.vendorDetails;
                        vendorInfo = vendorData.vendorCode || "";
                      } else {
                        vendorInfo = option.vendorCode || "";
                      }
                    } catch (e) {
                      vendorInfo = "";
                    }
                    
                    return (
                      <Box component="li" {...props}>
                        <Box>
                          <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                            {option.itemCode}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {option.itemName} - {option.unit || 'No unit'}
                          </Typography>
                          {vendorInfo && (
                            <Typography variant="caption" color="primary" sx={{ display: 'block' }}>
                              Vendor: {vendorInfo}
                            </Typography>
                          )}
                        </Box>
                      </Box>
                    );
                  }}
                />
              </Box>
            </Box>
            <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
              <Box sx={{ flex: '1 1 200px', minWidth: '200px' }}>
                <TextField
                  fullWidth
                  label="Item Name *"
                  name="itemName"
                  value={formData.itemName}
                  onChange={handleInputChange}
                  required
                  disabled
                  variant="standard"
                  helperText="Auto-populated from selected item"
                  InputProps={{
                    startAdornment: <AssignmentIcon color="action" sx={{ mr: 1 }} />
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
                  fullWidth
                  label="Quantity *"
                  name="quantity"
                  type="number"
                  value={formData.quantity}
                  onChange={handleInputChange}
                  required
                  variant="standard"
                  InputProps={{
                    startAdornment: <TrendingUpIcon color="action" sx={{ mr: 1 }} />
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
            <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
              <Box sx={{ flex: '1 1 200px', minWidth: '200px' }}>
                <TextField
                  fullWidth
                  label="Unit *"
                  name="unit"
                  value={formData.unit}
                  onChange={handleInputChange}
                  required
                  disabled
                  variant="standard"
                  helperText="Auto-populated from selected item"
                  InputProps={{
                    startAdornment: <ScaleIcon color="action" sx={{ mr: 1 }} />
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
                <Autocomplete
                  options={availableVendors}
                  getOptionLabel={(opt) => (opt?.vendorCode || '')}
                  value={availableVendors.find(v => v.vendorCode === formData.supplier) || null}
                  onChange={(e, val) => setFormData(prev => ({ ...prev, supplier: val ? val.vendorCode : '' }))}
                  disabled={availableVendors.length === 0}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label="Supplier"
                      variant="standard"
                      helperText={availableVendors.length > 0 ? "Select vendor from dropdown" : "No vendors found for this item in stock sheet"}
                      InputProps={{
                        ...params.InputProps,
                        startAdornment: <SupplierIcon color="action" sx={{ mr: 1 }} />
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
                  )}
                  renderOption={(props, option) => (
                    <Box component="li" {...props}>
                      <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                        {option.vendorCode}
                      </Typography>
                      {option.vendorName && (
                        <Typography variant="caption" color="text.secondary" sx={{ ml: 1 }}>
                          {option.vendorName}
                        </Typography>
                      )}
                    </Box>
                  )}
                />
              </Box>
            </Box>
          </Box>
        </DialogContent>
        
        <DialogActions sx={{ p: 4, pt: 2, justifyContent: 'center' }}>
          <Button 
            onClick={() => setOpenDialog(false)}
            startIcon={<CancelIcon />}
            variant="outlined"
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
                borderColor: '#4caf50'
              }
            }}
          >
            Cancel
          </Button>
          <Button 
            onClick={handleSubmit} 
            variant="contained" 
            startIcon={<SaveIcon />}
            sx={{ 
              borderRadius: 3,
              background: 'linear-gradient(135deg, #4caf50, #66bb6a)',
              color: 'white',
              px: 3,
              py: 1.5,
              minWidth: '180px',
              boxShadow: '0 4px 12px rgba(76, 175, 80, 0.3)',
              '&:hover': {
                background: 'linear-gradient(135deg, #388e3c, #4caf50)',
                boxShadow: '0 6px 16px rgba(76, 175, 80, 0.4)',
                transform: 'translateY(-1px)'
              },
              '&:disabled': {
                background: 'rgba(0, 0, 0, 0.12)',
                color: 'rgba(0, 0, 0, 0.26)',
                boxShadow: 'none'
              }
            }}
          >
            Add Material
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      >
        <Alert
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          severity={snackbar.severity}
          sx={{ width: "100%" }}
          variant="filled"
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default MaterialInwardRegister;
