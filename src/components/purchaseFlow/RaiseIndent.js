import React, { useState, useEffect } from 'react';
import { 
  TextField, 
  Button, 
  Box, 
  Typography, 
  Grid,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  IconButton,
  Tooltip,
  Divider,
  Snackbar,
  Alert,
  Collapse,
  Card,
  CardContent,
  CardHeader,
  Avatar,
  LinearProgress,
  Fab,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  useTheme,
  alpha
} from '@mui/material';
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  Add as AddIcon,
  Refresh as RefreshIcon,
  ShoppingCart as ShoppingCartIcon,
  Inventory as InventoryIcon,
  Assignment as AssignmentIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  CheckCircle as CheckCircleIcon,
  Warning as WarningIcon,
  Error as ErrorIcon,
  Info as InfoIcon
} from '@mui/icons-material';
import Pagination from '@mui/material/Pagination';
import Autocomplete from '@mui/material/Autocomplete';
import sheetService from '../../services/sheetService';
import purchaseFlowService from '../../services/purchaseFlowService';
import AdvancedPagination from '../flowManagement/AdvancedPagination';

const RaiseIndent = () => {
  const theme = useTheme();
  const [indents, setIndents] = useState([{ itemCode: '', item: '', quantity: '', specifications: '' }]);
  const [allIndents, setAllIndents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [editRowId, setEditRowId] = useState(null);
  const [editRowData, setEditRowData] = useState({});
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [stockItems, setStockItems] = useState([]);
  const [quantityErrors, setQuantityErrors] = useState({});
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [refreshInterval, setRefreshInterval] = useState(null);
  const [vendorItems, setVendorItems] = useState([]);
  const [openGroups, setOpenGroups] = useState({});
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [indentToDelete, setIndentToDelete] = useState(null);
  const [materialIntentInfo, setMaterialIntentInfo] = useState(null);
  const [page, setPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  const handleAddItem = () => {
    setIndents([...indents, { itemCode: '', item: '', quantity: '', specifications: '' }]);
  };

  const handleChange = (index, field, value) => {
    const newIndents = [...indents];
    if (field === 'itemCode') {
      // Auto-fill item name when item code is selected
      const selected = stockItems.find(item => item.itemCode === value);
      if (selected) {
        
        // Try multiple possible field names for specifications
        const possibleSpecFields = [
          'item specifications ',  // Note the trailing space
          'item specifications',
          'specifications', 
          'Specifications',
          'description',
          'Description',
          'itemDescription',
          'ItemDescription',
          'details',
          'Details',
          'notes',
          'Notes'
        ];
        
        let specifications = '';
        for (const field of possibleSpecFields) {
          if (selected[field]) {
            specifications = selected[field];
            break;
          }
        }
        
        // If no specifications found in stock item, try vendor sheet
        if (!specifications) {
          const vendorItem = vendorItems.find(vendor => vendor['SKU Code'] === value);
          if (vendorItem) {
            specifications = vendorItem['SKU Description'] || vendorItem['Remarks'] || '';
          }
        }
        newIndents[index].specifications = specifications;
      }
      newIndents[index].itemCode = value;
      newIndents[index].item = selected ? (selected.itemName || selected.ItemName || selected['Item Name'] || selected.Name) : '';
      newIndents[index].quantity = '';
      // Remove any previous error
      setQuantityErrors(prev => ({ ...prev, [index]: undefined }));
    } else if (field === 'quantity') {
      newIndents[index][field] = value;
      // Validate quantity
      const selected = stockItems.find(item => item.itemCode === newIndents[index].itemCode);
      if (selected) {
        const currentStock = parseFloat(selected.currentStock || 0);
        const maxLevel = parseFloat(selected.maxLevel || 0);
        const qty = parseFloat(value || 0);
        if (Number(Math.max(currentStock, 0)) + Number(qty) > Number(maxLevel)) {
          setQuantityErrors(prev => ({ ...prev, [index]: `Max allowed: ${Number(Math.max(maxLevel - Math.max(currentStock, 0), 0) )}` }));
        } else {
          setQuantityErrors(prev => ({ ...prev, [index]: undefined }));
        }
      }
    } else {
      newIndents[index][field] = value;
    }
    setIndents(newIndents);
  };

  const fetchAllIndents = async () => {
    try {
      setLoading(true);
      const data = await purchaseFlowService.getAllIndents();
      setAllIndents(data);
    } catch (error) {
      setSnackbar({ open: true, message: 'Error fetching indents: ' + error.message, severity: 'error' });
      setAllIndents([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchStockItems = async () => {
    try {
      const items = await sheetService.getStockItems();
      if (items && items.length > 0) {
        
      }
      setStockItems(items);
    } catch (error) {
      setSnackbar({ open: true, message: 'Error fetching stock items: ' + error.message, severity: 'error' });
    }
  };

  const fetchVendorItems = async () => {
    try {
      const items = await sheetService.getSheetData('Vendor');
      setVendorItems(items);
    } catch (error) {
    }
  };

  // Check for material intent data from kitting sheet or stock management
  useEffect(() => {
    const materialIntentData = localStorage.getItem('materialIntentData');
    if (materialIntentData) {
      try {
        const intentData = JSON.parse(materialIntentData);
        
        // Check if it's multiple items from bulk selection
        if (intentData.multipleItems && intentData.items && Array.isArray(intentData.items)) {
          // Handle multiple items
          const multipleIndents = intentData.items.map(item => ({
            itemCode: item.itemCode || '',
            item: item.itemName || '',
            quantity: item.quantity || '',
            specifications: item.specifications || ''
          }));
          
          setIndents(multipleIndents);
          setMaterialIntentInfo({
            multipleItems: true,
            count: multipleIndents.length,
            items: intentData.items
          });
          setSnackbar({ 
            open: true, 
            message: `Loaded ${multipleIndents.length} item(s) for reorder`, 
            severity: 'info' 
          });
        } else {
          // Handle single item (legacy format)
          setIndents([{
            itemCode: intentData.itemCode || '',
            item: intentData.itemName || '',
            quantity: intentData.quantity || '',
            specifications: intentData.specifications || ''
          }]);
          setMaterialIntentInfo(intentData);
          setSnackbar({ 
            open: true, 
            message: `Material intent data loaded for ${intentData.itemName || intentData.item}`, 
            severity: 'info' 
          });
        }
        
        // Clear the data from localStorage after using it
        localStorage.removeItem('materialIntentData');
      } catch (error) {
        console.error('Error parsing material intent data:', error);
      }
    }
  }, []);

  useEffect(() => {
    fetchAllIndents();
    fetchStockItems();
    fetchVendorItems();
  }, []);

  // Auto-fill item name when itemCode is set and stockItems are loaded
  useEffect(() => {
    if (indents.length > 0 && stockItems.length > 0) {
      let needsUpdate = false;
      const updatedIndents = indents.map(indent => {
        if (indent.itemCode && !indent.item) {
          const stockItem = stockItems.find(item => item.itemCode === indent.itemCode);
          if (stockItem) {
            needsUpdate = true;
            return {
              ...indent,
              item: stockItem.itemName || stockItem.ItemName || stockItem['Item Name'] || stockItem.Name || ''
            };
          }
        }
        return indent;
      });
      
      if (needsUpdate) {
        setIndents(updatedIndents);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stockItems]);

  // Auto-refresh effect
  useEffect(() => {
    if (autoRefresh) {
      const interval = setInterval(() => {
        fetchAllIndents();
      }, 10000); // Refresh every 10 seconds
      setRefreshInterval(interval);
    } else {
      if (refreshInterval) {
        clearInterval(refreshInterval);
        setRefreshInterval(null);
      }
    }

    return () => {
      if (refreshInterval) {
        clearInterval(refreshInterval);
      }
    };
  }, [autoRefresh]);

  const validateIndents = () => {
    const errors = [];
    
    // Filter out empty rows
    const validIndents = indents.filter(indent => 
      indent.itemCode && indent.item && indent.quantity && indent.specifications
    );
    
    if (validIndents.length === 0) {
      errors.push('Please add at least one item with all required fields');
      return { isValid: false, errors, validIndents: [] };
    }
    
    // Validate each item
    for (let i = 0; i < validIndents.length; i++) {
      const indent = validIndents[i];
      
      // Check required fields
      if (!indent.itemCode || indent.itemCode.trim() === '') {
        errors.push(`Item ${i + 1}: Item Code is required`);
      }
      if (!indent.item || indent.item.trim() === '') {
        errors.push(`Item ${i + 1}: Item Name is required`);
      }
      if (!indent.quantity || indent.quantity.toString().trim() === '') {
        errors.push(`Item ${i + 1}: Quantity is required`);
      }
      if (!indent.specifications || indent.specifications.trim() === '') {
        errors.push(`Item ${i + 1}: Specifications is required`);
      }
      
      // Validate quantity is numeric and positive
      if (indent.quantity) {
        const qty = parseFloat(indent.quantity);
        if (isNaN(qty)) {
          errors.push(`Item ${i + 1}: Quantity must be a valid number`);
        } else if (qty <= 0) {
          errors.push(`Item ${i + 1}: Quantity must be greater than zero`);
        } else {
          // Check max stock level if item code exists
          if (indent.itemCode) {
            const stockItem = stockItems.find(item => item.itemCode === indent.itemCode);
            if (stockItem) {
              const currentStock = parseFloat(stockItem.currentStock || 0);
              const maxLevel = parseFloat(stockItem.maxLevel || 0);
              if (currentStock + qty > maxLevel) {
                errors.push(`Item ${i + 1}: Quantity exceeds max stock level. Max allowed: ${maxLevel - currentStock}`);
              }
            }
          }
        }
      }
    }
    
    return {
      isValid: errors.length === 0,
      errors,
      validIndents: errors.length === 0 ? validIndents : []
    };
  };

  const handleSubmit = async () => {
    // Validate before submitting
    const validation = validateIndents();
    
    if (!validation.isValid) {
      setSnackbar({ 
        open: true, 
        message: validation.errors.join('; '), 
        severity: 'error' 
      });
      return;
    }
    
    try {
      setLoading(true);
      // Submit all valid items as a single indent
      const result = await purchaseFlowService.addIndentWithItems({ items: validation.validIndents });
      setSnackbar({ open: true, message: `Indent ${result.indentNumber} raised successfully!`, severity: 'success' });
      setIndents([{ itemCode: '', item: '', quantity: '', specifications: '' }]);
      setQuantityErrors({});
      await fetchAllIndents();
    } catch (error) {
      console.error('Error submitting indent:', error);
      setSnackbar({ 
        open: true, 
        message: 'Error submitting indent: ' + (error.message || 'Network error. Please try again.'), 
        severity: 'error' 
      });
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'completed':
        return 'success';
      case 'in progress':
        return 'warning';
      case 'rejected':
        return 'error';
      default:
        return 'default';
    }
  };

  const getStatusIcon = (status) => {
    switch (status?.toLowerCase()) {
      case 'completed':
        return <CheckCircleIcon fontSize="small" />;
      case 'in progress':
        return <WarningIcon fontSize="small" />;
      case 'rejected':
        return <ErrorIcon fontSize="small" />;
      default:
        return <InfoIcon fontSize="small" />;
    }
  };

  const handleEditClick = (indent) => {
    setEditRowId(indent.IndentNumber);
    setEditRowData({
      ItemCode: indent.ItemCode,
      ItemName: indent.ItemName,
      Quantity: indent.Quantity,
      Specifications: indent.Specifications,
    });
  };

  const handleEditChange = (field, value) => {
    setEditRowData((prev) => ({ ...prev, [field]: value }));
  };

  const handleEditSave = async (indentNumber) => {
    try {
      await purchaseFlowService.updateIndent(indentNumber, editRowData);
      setEditRowId(null);
      setEditRowData({});
      
      // Show success message
      setSnackbar({ 
        open: true, 
        message: 'Indent updated successfully!', 
        severity: 'success' 
      });
      
      // Refresh the data
      await fetchAllIndents();
    } catch (error) {
      console.error('Error updating indent:', error);
      setSnackbar({ 
        open: true, 
        message: 'Error updating indent: ' + error.message, 
        severity: 'error' 
      });
    }
  };

  const handleEditCancel = () => {
    setEditRowId(null);
    setEditRowData({});
  };

  const handleDeleteClick = (indentNumber) => {
    setIndentToDelete(indentNumber);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    try {
      await purchaseFlowService.deleteIndent(indentToDelete);
      
      // Show success message
      setSnackbar({ 
        open: true, 
        message: 'Indent deleted successfully!', 
        severity: 'success' 
      });
      
      // Refresh the data
      await fetchAllIndents();
    } catch (error) {
      console.error('Error deleting indent:', error);
      setSnackbar({ 
        open: true, 
        message: 'Error deleting indent: ' + error.message, 
        severity: 'error' 
      });
    } finally {
      setDeleteDialogOpen(false);
      setIndentToDelete(null);
    }
  };

  const toggleGroup = (indentNumber) => {
    setOpenGroups((prev) => ({ ...prev, [indentNumber]: !prev[indentNumber] }));
  };

  const getFormValidationStatus = () => {
    const hasErrors = Object.values(quantityErrors).some(Boolean);
    const hasRequiredFields = indents[0].itemCode && indents[0].item && indents[0].quantity && indents[0].specifications;
    return { hasErrors, hasRequiredFields, isValid: hasRequiredFields && !hasErrors };
  };

  const validationStatus = getFormValidationStatus();

  // Pagination calculations
  const totalPages = Math.ceil(allIndents.length / rowsPerPage);
  const startIndex = (page - 1) * rowsPerPage;
  const endIndex = startIndex + rowsPerPage;
  const paginatedIndents = allIndents.slice(startIndex, endIndex);

  const handlePageChange = (value) => {
    setPage(value);
  };

  const handleRowsPerPageChange = (newRowsPerPage) => {
    setRowsPerPage(newRowsPerPage);
    setPage(1); // Reset to first page when changing rows per page
  };

  // Reset to page 1 when data changes
  useEffect(() => {
    setPage(1);
  }, [allIndents.length]);

  return (
    <Box sx={{ 
      p: 3, 
      background: `linear-gradient(135deg, #f1f8f4 0%, #e8f5e9 50%, #c8e6c9 100%)`,
      minHeight: '100vh',
      position: 'relative',
      '&::before': {
        content: '""',
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: `radial-gradient(circle at 20% 80%, rgba(129, 199, 132, 0.1) 0%, transparent 50%),
                     radial-gradient(circle at 80% 20%, rgba(165, 214, 167, 0.1) 0%, transparent 50%),
                     radial-gradient(circle at 40% 40%, rgba(200, 230, 201, 0.05) 0%, transparent 50%)`,
        pointerEvents: 'none'
      }
    }}>
      {/* Header Section */}
      <Box sx={{ mb: 4, textAlign: 'center', position: 'relative', zIndex: 1 }}>
        <Typography 
          variant="h3" 
          gutterBottom 
          sx={{ 
            fontWeight: 800,
            color: '#2e7d32',
            textShadow: '0 2px 4px rgba(0,0,0,0.1)',
            letterSpacing: '-0.02em'
          }}
        >
          Raise Indent
        </Typography>
      </Box>
      
      {/* Material Intent Info Banner */}
      {materialIntentInfo && (
        <Paper elevation={1} sx={{ p: 2, mb: 3, backgroundColor: '#e8f5e9', border: '1px solid #81c784' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <InfoIcon color="primary" />
            <Typography variant="body1" color="primary">
              {materialIntentInfo.multipleItems ? (
                <>
                  <strong>Bulk Reorder:</strong> {materialIntentInfo.count} item(s) pre-filled from inventory selection.
                </>
              ) : (
                <>
                  <strong>Material Intent:</strong> This indent is pre-filled from kitting sheet for shortage of{' '}
                  <strong>{materialIntentInfo.itemName}</strong> ({materialIntentInfo.itemCode}).
                </>
              )}
            </Typography>
          </Box>
          {!materialIntentInfo.multipleItems && (
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              Requested by: {materialIntentInfo.requestedBy} | Department: {materialIntentInfo.department} | Priority: {materialIntentInfo.priority}
            </Typography>
          )}
        </Paper>
      )}
      
      {/* Form Section */}
      <Card 
        elevation={0} 
        sx={{ 
          mb: 4, 
          borderRadius: 4,
          background: 'rgba(255, 255, 255, 0.95)',
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(255, 255, 255, 0.3)',
          boxShadow: '0 8px 32px rgba(129, 199, 132, 0.1)',
          position: 'relative',
          overflow: 'hidden',
          '&::before': {
            content: '""',
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: '4px',
            background: `linear-gradient(90deg, #81c784, #a5d6a7)`
          }
        }}
      >
        <CardHeader
          avatar={
            <Avatar sx={{ 
              bgcolor: '#81c784',
              boxShadow: '0 4px 12px rgba(129, 199, 132, 0.3)',
              width: 56,
              height: 56
            }}>
              <ShoppingCartIcon sx={{ fontSize: 28 }} />
            </Avatar>
          }
          title={
            <Typography variant="h5" sx={{ 
              fontWeight: 700, 
              color: '#2c3e50',
              letterSpacing: '-0.01em'
            }}>
              New Indent Form
            </Typography>
          }
          subheader="Add items to create a new purchase indent"
          sx={{ 
            background: `linear-gradient(135deg, rgba(74, 144, 226, 0.05) 0%, rgba(155, 89, 182, 0.05) 100%)`,
            borderBottom: '1px solid rgba(74, 144, 226, 0.1)',
            pb: 2
          }}
        />
        <CardContent sx={{ p: 4 }}>
          {indents.map((indent, index) => (
            <Paper 
              key={index} 
              elevation={0} 
              sx={{ 
                p: 3, 
                mb: 3, 
                borderRadius: 3,
                border: '1px solid rgba(74, 144, 226, 0.15)',
                background: `linear-gradient(135deg, rgba(255, 255, 255, 0.9) 0%, rgba(248, 249, 255, 0.9) 100%)`,
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                position: 'relative',
                overflow: 'hidden',
                '&::before': {
                  content: '""',
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '4px',
                  height: '100%',
                  background: `linear-gradient(180deg, #4a90e2, #9b59b6)`
                },
              }}
            >
              <Typography variant="h6" sx={{ 
                mb: 3, 
                color: '#2c3e50', 
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                gap: 1
              }}>
                <Box sx={{ 
                  width: 8, 
                  height: 8, 
                  borderRadius: '50%', 
                  background: `linear-gradient(45deg, #4a90e2, #9b59b6)`,
                  boxShadow: '0 2px 8px rgba(74, 144, 226, 0.3)'
                }} />
                Item {index + 1}
              </Typography>
              <Grid container spacing={3}>
                <Grid item xs={12} sm={6} md={3} sx={{ width: '100%' }}>
                  <Autocomplete
                    freeSolo
                    fullWidth
                    options={stockItems.map(item => item.itemCode || '')}
                    value={indent.itemCode}
                    onInputChange={(e, newValue) => handleChange(index, 'itemCode', newValue)}
                    sx={{ 
                      width: '100%',
                      minWidth: 0,
                      '& .MuiAutocomplete-root': { width: '100%' },
                      '& .MuiAutocomplete-inputRoot': { width: '100%' }
                    }}
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        label="Item Code"
                        placeholder="Item Code"
                        fullWidth
                        required
                        variant="outlined"
                        helperText={
                          materialIntentInfo && materialIntentInfo.multipleItems 
                            ? "Pre-filled from bulk selection" 
                            : materialIntentInfo && index === 0 
                            ? "Pre-filled from Material Intent" 
                            : ""
                        }
                        sx={{ width: '100%' }}
                      />
                    )}
                    filterOptions={(options, { inputValue }) =>
                      options.filter(option => option.toLowerCase().includes(inputValue.toLowerCase()))
                    }
                  />
                </Grid>
                <Grid item xs={12} sm={6} md={3} sx={{ width: '100%' }}>
                  <TextField
                    label="Item Name"
                    value={indent.item}
                    fullWidth
                    required
                    InputProps={{ readOnly: true }}
                    variant="outlined"
                    helperText={
                      materialIntentInfo && materialIntentInfo.multipleItems 
                        ? "Auto-filled from bulk selection" 
                        : materialIntentInfo && index === 0 
                        ? "Auto-filled from Material Intent" 
                        : ""
                    }
                    sx={{ width: '100%' }}
                  />
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <TextField
                    label="Quantity"
                    value={indent.quantity}
                    onChange={(e) => handleChange(index, 'quantity', e.target.value)}
                    fullWidth
                    required
                    type="number"
                    error={!!quantityErrors[index]}
                    helperText={
                      quantityErrors[index] || 
                      (materialIntentInfo && materialIntentInfo.multipleItems 
                        ? "Suggested reorder quantity" 
                        : materialIntentInfo && index === 0 
                        ? "Shortage quantity from kitting" 
                        : "")
                    }
                    variant="outlined"
                  />
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <TextField
                    label="Specifications"
                    value={indent.specifications}
                    onChange={(e) => handleChange(index, 'specifications', e.target.value)}
                    fullWidth
                    required
                    multiline
                    rows={2}
                    variant="outlined"
                    helperText={
                      materialIntentInfo && materialIntentInfo.multipleItems 
                        ? "Auto-filled specifications" 
                        : materialIntentInfo && index === 0 
                        ? "Auto-generated specifications" 
                        : ""
                    }
                  />
                </Grid>
              </Grid>
            </Paper>
          ))}

          <Box sx={{ display: 'flex', gap: 3, justifyContent: 'center' }}>
            <Button 
              variant="outlined" 
              startIcon={<AddIcon />} 
              onClick={handleAddItem} 
              sx={{ 
                borderRadius: 3,
                px: 4,
                py: 1.5,
                borderWidth: 2,
                borderColor: '#9b59b6',
                color: '#9b59b6',
                fontWeight: 600,
                textTransform: 'none',
                fontSize: '1rem',
                background: 'rgba(155, 89, 182, 0.05)',
              }}
            >
              Add Item
            </Button>
            <Button 
              variant="contained" 
              onClick={handleSubmit}
              disabled={!validationStatus.isValid}
              sx={{ 
                borderRadius: 3,
                px: 4,
                py: 1.5,
                background: ` #9b59b6`,
                boxShadow: '0 8px 25px rgba(74, 144, 226, 0.3)',
                fontWeight: 600,
                textTransform: 'none',
                fontSize: '1rem',
                '&:disabled': {
                  background: 'rgba(108, 117, 125, 0.3)',
                  transform: 'none',
                  boxShadow: 'none',
                  color: 'rgba(108, 117, 125, 0.5)'
                }
              }}
            >
              Submit Indent
            </Button>
          </Box>
        </CardContent>
      </Card>

      {/* Table Section */}
      <Card 
        elevation={0} 
        sx={{ 
          mt: 10,
          borderRadius: 4,
          background: 'rgba(255, 255, 255, 0.95)',
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(255, 255, 255, 0.3)',
          boxShadow: '0 8px 32px rgba(74, 144, 226, 0.1)',
          position: 'relative',
          overflow: 'hidden',
          '&::before': {
            content: '""',
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: '4px',
            background: `linear-gradient(90deg, #9b59b6, #4a90e2)`
          }
        }}
      >
        <CardHeader
          avatar={
            <Avatar sx={{ 
              bgcolor: '#9b59b6',
              boxShadow: '0 4px 12px rgba(155, 89, 182, 0.3)',
              width: 56,
              height: 56
            }}>
              <InventoryIcon sx={{ fontSize: 28 }} />
            </Avatar>
          }
          title={
            <Typography variant="h5" sx={{ 
              fontWeight: 700, 
              color: '#2c3e50',
              letterSpacing: '-0.01em'
            }}>
              All Indents
            </Typography>
          }
          subheader={`${allIndents.length} indents found${allIndents.length > 0 ? ` • Showing ${startIndex + 1}-${Math.min(endIndex, allIndents.length)}` : ''}`}
          action={
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              {loading && (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <LinearProgress sx={{ 
                    width: 120, 
                    height: 6, 
                    borderRadius: 3,
                    backgroundColor: 'rgba(108, 117, 125, 0.2)',
                  }} />
                  <Typography variant="body2" sx={{ color: '#6c757d', fontWeight: 500 }}>
                    Refreshing...
                  </Typography>
                </Box>
              )}
              <Button
                variant="outlined"
                startIcon={<RefreshIcon />}
                onClick={fetchAllIndents}
                disabled={loading}
                size="small"
                sx={{ 
                  borderRadius: 3,
                  borderWidth: 2,
                  borderColor: '#4a90e2',
                  color: '#4a90e2',
                  fontWeight: 600,
                  textTransform: 'none',
                }}
              >
                Refresh
              </Button>
            </Box>
          }
          sx={{ 
            background: `linear-gradient(135deg, rgba(155, 89, 182, 0.05) 0%, rgba(233, 30, 99, 0.05) 100%)`,
            borderBottom: '1px solid rgba(155, 89, 182, 0.1)',
            pb: 2
          }}
        />
        <CardContent sx={{ p: 0 }}>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow sx={{ 
                  background: `linear-gradient(90deg, rgba(74, 144, 226, 0.1) 0%, rgba(155, 89, 182, 0.1) 100%)`
                }}>
                  <TableCell sx={{ 
                    fontWeight: 700, 
                    color: '#2c3e50',
                    fontSize: '0.95rem',
                    borderBottom: '2px solid rgba(74, 144, 226, 0.2)'
                  }}>Indent Number</TableCell>
                  <TableCell sx={{ 
                    fontWeight: 700, 
                    color: '#2c3e50',
                    fontSize: '0.95rem',
                    borderBottom: '2px solid rgba(74, 144, 226, 0.2)'
                  }}>Details</TableCell>
                  <TableCell sx={{ 
                    fontWeight: 700, 
                    color: '#2c3e50',
                    fontSize: '0.95rem',
                    borderBottom: '2px solid rgba(74, 144, 226, 0.2)'
                  }}>Status</TableCell>
                  <TableCell sx={{ 
                    fontWeight: 700, 
                    color: '#2c3e50',
                    fontSize: '0.95rem',
                    borderBottom: '2px solid rgba(74, 144, 226, 0.2)'
                  }}>Created At</TableCell>
                  <TableCell sx={{ 
                    fontWeight: 700, 
                    color: '#2c3e50',
                    fontSize: '0.95rem',
                    borderBottom: '2px solid rgba(74, 144, 226, 0.2)'
                  }}>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={5} align="center" sx={{ py: 6 }}>
                      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3 }}>
                        <LinearProgress sx={{ 
                          width: '100%', 
                          height: 8, 
                          borderRadius: 4,
                          backgroundColor: 'rgba(108, 117, 125, 0.2)',
                        }} />
                        <Typography variant="h6" sx={{ color: '#6c757d', fontWeight: 500 }}>
                          Loading indents...
                        </Typography>
                      </Box>
                    </TableCell>
                  </TableRow>
                ) : allIndents.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} align="center" sx={{ py: 8 }}>
                      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3 }}>
                        <Box sx={{ 
                          width: 80, 
                          height: 80, 
                          borderRadius: '50%',
                          background: `linear-gradient(135deg, rgba(74, 144, 226, 0.1), rgba(155, 89, 182, 0.1))`,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}>
                          <AssignmentIcon sx={{ fontSize: 48, color: '#9b59b6' }} />
                        </Box>
                        <Typography variant="h6" sx={{ color: '#2c3e50', fontWeight: 600 }}>
                          No indents found
                        </Typography>
                        <Typography variant="body2" sx={{ color: '#6c757d', textAlign: 'center' }}>
                          Create your first indent using the form above
                        </Typography>
                      </Box>
                    </TableCell>
                  </TableRow>
                ) : (
                  paginatedIndents.map((indent) => (
                    <React.Fragment key={indent.IndentNumber}>
                      <TableRow 
                        sx={{ 
                          background: 'rgba(255, 255, 255, 0.7)',
                        }}
                      >
                        <TableCell>
                          <Typography variant="h6" sx={{ 
                            fontWeight: 700, 
                            color: '#4a90e2',
                            letterSpacing: '-0.01em'
                          }}>
                            #{indent.IndentNumber}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Button 
                            variant="text" 
                            onClick={() => toggleGroup(indent.IndentNumber)}
                            endIcon={openGroups[indent.IndentNumber] ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                            sx={{ 
                              borderRadius: 2,
                              textTransform: 'none',
                              fontWeight: 600,
                              color: '#9b59b6',
                            }}
                          >
                            {openGroups[indent.IndentNumber] ? 'Hide Items' : 'Show Items'}
                          </Button>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" sx={{ color: '#6c757d', fontWeight: 500 }}>
                            {indent.Status}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" sx={{ color: '#6c757d', fontWeight: 500 }}>
                            {new Date(indent.CreatedAt).toLocaleDateString()}
                          </Typography>
                          <Typography variant="caption" sx={{ color: '#adb5bd' }}>
                            {new Date(indent.CreatedAt).toLocaleTimeString()}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Tooltip title="Delete entire indent" arrow>
                            <IconButton 
                              size="medium" 
                              onClick={() => handleDeleteClick(indent.IndentNumber)}
                              sx={{ 
                                backgroundColor: 'rgba(233, 30, 99, 0.1)',
                                color: '#e91e63',
                              }}
                            >
                              <DeleteIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        </TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell colSpan={5} sx={{ p: 0, border: 0 }}>
                          <Collapse in={openGroups[indent.IndentNumber]} timeout="auto" unmountOnExit>
                            <Box sx={{ 
                              p: 4, 
                              background: `linear-gradient(135deg, rgba(248, 249, 255, 0.8) 0%, rgba(240, 244, 255, 0.8) 100%)`,
                              borderTop: '1px solid rgba(74, 144, 226, 0.1)'
                            }}>
                              <Typography variant="h6" sx={{ 
                                mb: 3, 
                                color: '#2c3e50', 
                                fontWeight: 600,
                                display: 'flex',
                                alignItems: 'center',
                                gap: 2
                              }}>
                                <Box sx={{ 
                                  width: 12, 
                                  height: 12, 
                                  borderRadius: '50%', 
                                  boxShadow: '0 2px 8px rgba(155, 89, 182, 0.3)'
                                }} />
                                Items in Indent #{indent.IndentNumber}
                              </Typography>
                              <Table size="small" sx={{ 
                                backgroundColor: 'rgba(255, 255, 255, 0.9)',
                                borderRadius: 3,
                                overflow: 'hidden',
                                boxShadow: '0 4px 20px rgba(74, 144, 226, 0.1)',
                                border: '1px solid rgba(74, 144, 226, 0.1)'
                              }}>
                                <TableHead>
                                  <TableRow sx={{ 
                                  }}>
                                    <TableCell sx={{ fontWeight: 700, color: '#2c3e50' }}>Item Code</TableCell>
                                    <TableCell sx={{ fontWeight: 700, color: '#2c3e50' }}>Item Name</TableCell>
                                    <TableCell sx={{ fontWeight: 700, color: '#2c3e50' }}>Quantity</TableCell>
                                    <TableCell sx={{ fontWeight: 700, color: '#2c3e50' }}>Specifications</TableCell>
                                  </TableRow>
                                </TableHead>
                                <TableBody>
                                  {indent.Items && indent.Items.length > 0 ? (
                                    indent.Items.map((item, idx) => (
                                      <TableRow key={item.itemCode + '-' + idx} sx={{ 
                                        '&:hover': {
                                          backgroundColor: 'rgba(155, 89, 182, 0.05)'
                                        }
                                      }}>
                                        <TableCell>
                                          <Chip 
                                            label={item.itemCode} 
                                            size="small" 
                                            variant="outlined"
                                            sx={{ 
                                              borderRadius: 2,
                                              borderColor: '#4a90e2',
                                              color: '#4a90e2',
                                              fontWeight: 600,
                                              background: 'rgba(74, 144, 226, 0.05)'
                                            }}
                                          />
                                        </TableCell>
                                        <TableCell sx={{ fontWeight: 500, color: '#2c3e50' }}>
                                          {item.item}
                                        </TableCell>
                                        <TableCell>
                                          
                                        <Typography variant="body2" sx={{ 
                                            maxWidth: 300, 
                                            wordWrap: 'break-word',
                                            color: '#6c757d',
                                            lineHeight: 1.5
                                          }}>
                                            {item.quantity}
                                          </Typography>
                                          
                                        </TableCell>
                                        <TableCell>
                                          <Typography variant="body2" sx={{ 
                                            maxWidth: 300, 
                                            wordWrap: 'break-word',
                                            color: '#6c757d',
                                            lineHeight: 1.5
                                          }}>
                                            {item.specifications}
                                          </Typography>
                                        </TableCell>
                                      </TableRow>
                                    ))
                                  ) : (
                                    <TableRow>
                                      <TableCell colSpan={4} align="center" sx={{ py: 4 }}>
                                        <Typography variant="body2" sx={{ color: '#6c757d', fontWeight: 500 }}>
                                          No items found in this indent
                                        </Typography>
                                      </TableCell>
                                    </TableRow>
                                  )}
                                </TableBody>
                              </Table>
                            </Box>
                          </Collapse>
                        </TableCell>
                      </TableRow>
                    </React.Fragment>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
          {allIndents.length > 0 && (
            <Box sx={{ 
              p: 3,
              borderTop: '1px solid rgba(74, 144, 226, 0.1)',
              background: `linear-gradient(135deg, rgba(248, 249, 255, 0.5) 0%, rgba(240, 244, 255, 0.5) 100%)`
            }}>
              <AdvancedPagination
                totalItems={allIndents.length}
                itemsPerPage={rowsPerPage}
                currentPage={page}
                onPageChange={handlePageChange}
                onItemsPerPageChange={handleRowsPerPageChange}
                onRefresh={fetchAllIndents}
                showPageSizeOptions={true}
                showJumpToPage={true}
                showStatistics={true}
                showRefreshButton={true}
                pageSizeOptions={[5, 10, 25, 50, 100]}
                disabled={loading}
                sx={{
                  backgroundColor: 'transparent',
                  border: 'none',
                  boxShadow: 'none',
                  '& .MuiPaper-root': {
                    backgroundColor: 'transparent',
                    border: 'none',
                    boxShadow: 'none'
                  }
                }}
              />
            </Box>
          )}
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        PaperProps={{
          sx: {
            borderRadius: 4,
            background: 'rgba(255, 255, 255, 0.95)',
            backdropFilter: 'blur(20px)',
            border: '1px solid rgba(255, 255, 255, 0.3)',
            boxShadow: '0 20px 60px rgba(233, 30, 99, 0.2)'
          }
        }}
      >
        <DialogTitle sx={{ 
          background: `linear-gradient(135deg, rgba(233, 30, 99, 0.1) 0%, rgba(255, 182, 193, 0.1) 100%)`,
          borderBottom: '1px solid rgba(233, 30, 99, 0.2)'
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Avatar sx={{ 
              bgcolor: '#e91e63',
              boxShadow: '0 4px 12px rgba(233, 30, 99, 0.3)'
            }}>
              <DeleteIcon />
            </Avatar>
            <Typography variant="h6" sx={{ color: '#e91e63', fontWeight: 700 }}>
              Confirm Deletion
            </Typography>
          </Box>
        </DialogTitle>
        <DialogContent sx={{ p: 4 }}>
          <Typography variant="body1" sx={{ mb: 2, color: '#2c3e50', fontWeight: 500 }}>
            Are you sure you want to delete indent <strong style={{ color: '#e91e63' }}>#{indentToDelete}</strong>?
          </Typography>
          <Typography variant="body2" sx={{ color: '#6c757d', lineHeight: 1.6 }}>
            This action cannot be undone. All items and associated data will be permanently removed.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ p: 4, gap: 2 }}>
          <Button 
            onClick={() => setDeleteDialogOpen(false)}
            variant="outlined"
            sx={{ 
              borderRadius: 3, 
              px: 4,
              borderColor: '#6c757d',
              color: '#6c757d',
              fontWeight: 600,
              textTransform: 'none',
              '&:hover': {
                borderColor: '#4a90e2',
                color: '#4a90e2',
                background: 'rgba(74, 144, 226, 0.05)'
              }
            }}
          >
            Cancel
          </Button>
          <Button 
            onClick={handleDeleteConfirm}
            variant="contained" 
            sx={{ 
              borderRadius: 3, 
              px: 4,
              background: `linear-gradient(45deg, #e91e63, #ffb6c1)`,
              fontWeight: 600,
              textTransform: 'none',
              boxShadow: '0 8px 25px rgba(233, 30, 99, 0.3)',
            }}
          >
            Delete
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert 
          onClose={() => setSnackbar({ ...snackbar, open: false })} 
          severity={snackbar.severity} 
          sx={{ 
            width: '100%',
            borderRadius: 3,
            boxShadow: '0 8px 32px rgba(0,0,0,0.15)',
            background: 'rgba(255, 255, 255, 0.95)',
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(255, 255, 255, 0.3)',
          }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default RaiseIndent; 