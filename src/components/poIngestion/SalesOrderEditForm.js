import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Typography,
  Grid,
  Alert,
  Box,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Chip,
  IconButton,
  Tooltip,
  useTheme,
  alpha,
  Fade,
  Grow,
  Slide,
  Autocomplete
} from '@mui/material';
import {
  Save,
  Cancel,
  Edit,
  Delete,
  Add,
  ExpandMore,
  ExpandLess,
  ShoppingCart,
  Assignment as AssignmentIcon,
  CheckCircle
} from '@mui/icons-material';
import LoadingSpinner from '../common/LoadingSpinner';
import poService from '../../services/poService';
import { getAllClients } from '../../services/clientService';
import sheetService from '../../services/sheetService';
import config from '../../config/config';
import { useAuth } from '../../context/AuthContext';

const orderTypes = [
  'CABLE_ONLY',
  'POWER_CORD'
];

const SalesOrderEditForm = ({ open, onClose, salesOrder, onSave }) => {
  const theme = useTheme();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  
  // Form data state
  const [formData, setFormData] = useState({
    poNumber: '',
    clientCode: '',
    assignedTo: ''
  });
  
  // Items state
  const [items, setItems] = useState([]);
  const [itemSectionOpen, setItemSectionOpen] = useState(false);
  const [editIndex, setEditIndex] = useState(null);
  
  // Item form state
  const [itemData, setItemData] = useState({
    uniqueId: '',
    itemName: '',
    productDesc: '',
    productCode: '',
    qty: '',
    price: '',
    batchSize: '',
    orderType: 'CABLE_ONLY'
  });
  
  // Client and product data
  const [clients, setClients] = useState([]);
  const [selectedClient, setSelectedClient] = useState(null);
  const [products, setProducts] = useState([]);

  // Initialize form data when salesOrder changes
  useEffect(() => {
    const fetchAllItems = async () => {
      if (salesOrder && open) {
        // Check if order is in DISPATCH or DELIVERED status
        if (salesOrder.Status === 'DISPATCH' || salesOrder.Status === 'DELIVERED') {
          setError(`Cannot edit order. Order is in ${salesOrder.Status} status and cannot be modified.`);
          // Close the dialog after showing error
          setTimeout(() => {
            onClose();
          }, 3000);
          return;
        }
        
        try {
          // Set basic form data
          const poId = salesOrder.POId || salesOrder.SOId;
          setFormData({
            poNumber: poId || '',
            clientCode: salesOrder.ClientCode || '',
            assignedTo: salesOrder.AssignedTo || 'mock.customer relations manager@reyanshelectronics.com'
          });
          
          // Fetch ALL items for this sales order (all rows with the same POId)
          const allPOs = await poService.getAllPOs();
          const orderItems = allPOs
            .filter(po => (po.POId === poId || po.SOId === poId))
            .map(po => ({
              uniqueId: po.UniqueId || '',
              itemName: po.Name || '',
              productDesc: po.Description || '',
              productCode: po.ProductCode || '',
              qty: po.Quantity ? String(po.Quantity) : '',
              price: po.Price !== undefined && po.Price !== null ? String(po.Price) : '',
              batchSize: po.BatchSize ? String(po.BatchSize) : '',
              orderType: po.OrderType || 'CABLE_ONLY'
            }));
          
          // If no items found, use the current salesOrder as a single item
          if (orderItems.length === 0) {
            const item = {
              uniqueId: salesOrder.UniqueId || '',
              itemName: salesOrder.Name || '',
              productDesc: salesOrder.Description || '',
              productCode: salesOrder.ProductCode || '',
              qty: salesOrder.Quantity ? String(salesOrder.Quantity) : '',
              price: salesOrder.Price !== undefined && salesOrder.Price !== null ? String(salesOrder.Price) : '',
              batchSize: salesOrder.BatchSize ? String(salesOrder.BatchSize) : '',
              orderType: salesOrder.OrderType || 'CABLE_ONLY'
            };
            setItems([item]);
          } else {
            setItems(orderItems);
          }
          
          // Reset other states
          setItemSectionOpen(false);
          setEditIndex(null);
          setItemData({
            uniqueId: '',
            itemName: '',
            productDesc: '',
            productCode: '',
            qty: '',
            price: '',
            batchSize: '',
            orderType: 'CABLE_ONLY'
          });
          setError(null);
          setSuccess(false);
        } catch (err) {
          console.error('Error fetching items for sales order:', err);
          setError('Failed to load sales order items');
          // Fallback to single item from salesOrder
          const item = {
            uniqueId: salesOrder.UniqueId || '',
            itemName: salesOrder.Name || '',
            productDesc: salesOrder.Description || '',
            productCode: salesOrder.ProductCode || '',
            qty: salesOrder.Quantity || '',
            price: salesOrder.Price || '',
            batchSize: salesOrder.BatchSize || '',
            orderType: salesOrder.OrderType || 'CABLE_ONLY'
          };
          setItems([item]);
        }
      }
    };
    
    fetchAllItems();
  }, [salesOrder, open]);

  // Fetch clients on component mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        const clientData = await getAllClients();
        setClients(clientData);
        
        // Set selected client if we have clientCode
        if (formData.clientCode) {
          const client = clientData.find(c => c.clientCode === formData.clientCode);
          if (client) {
            setSelectedClient(client);
          }
        }
      } catch (err) {
        console.error('Error fetching clients:', err);
        setError('Failed to load client data');
      }
    };
    
    if (open) {
      fetchData();
    }
  }, [open, formData.clientCode]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    if (name === 'clientCode') {
      const client = clients.find(c => c.clientCode === value);
      if (client) {
        setSelectedClient(client);
        // Reset item selection on client change
        setItemData(prev => ({
          ...prev,
          productCode: '',
          itemName: '',
          productDesc: ''
        }));
      } else {
        setSelectedClient(null);
      }
    }
  };

  const handleItemChange = (e) => {
    const { name, value } = e.target;
    setItemData(prev => ({ ...prev, [name]: value }));
  };

  const handleProductSelect = (e) => {
    const selectedProductCode = e.target.value;
    const product = clientProducts.find(p => p.productCode === selectedProductCode);
    
    if (product) {
      setItemData(prev => ({
        ...prev,
        productCode: product.productCode,
        itemName: product.productName,
        productDesc: product.description,
        price: prev.price || 0
      }));
    }
  };

  // Get products from selected client
  const clientProducts = selectedClient && selectedClient.products && selectedClient.products.length > 0
    ? selectedClient.products
    : [];

  const handleAddOrUpdateItem = () => {
    if (!itemData.itemName || !itemData.productDesc || !itemData.qty || !itemData.price || !itemData.batchSize) {
      setError('Please fill all required fields');
      return;
    }
    
    if (editIndex !== null) {
      // Update existing item - preserve uniqueId
      setItems(prev => prev.map((item, i) => 
        i === editIndex ? { ...itemData, uniqueId: item.uniqueId } : item
      ));
      setEditIndex(null);
    } else {
      // Add new item - uniqueId will be generated when saving
      setItems(prev => [...prev, { ...itemData, uniqueId: '' }]);
    }
    
    setItemData({
      uniqueId: '',
      itemName: '',
      productDesc: '',
      productCode: '',
      qty: '',
      price: '',
      batchSize: '',
      orderType: 'CABLE_ONLY'
    });
    setItemSectionOpen(false);
  };

  const handleEditItem = (idx) => {
    // Ensure all fields are properly copied, especially price
    const itemToEdit = { ...items[idx] };
    // Make sure price is converted to string if it's a number
    if (itemToEdit.price !== undefined && itemToEdit.price !== null) {
      itemToEdit.price = String(itemToEdit.price);
    } else {
      itemToEdit.price = '';
    }
    setItemData(itemToEdit);
    setEditIndex(idx);
    setItemSectionOpen(true);
  };

  const handleDeleteItem = (idx) => {
    setItems(prev => prev.filter((_, i) => i !== idx));
    if (editIndex === idx) {
      setEditIndex(null);
      setItemData({
        uniqueId: '',
        itemName: '',
        productDesc: '',
        productCode: '',
        qty: '',
        price: '',
        batchSize: '',
        orderType: 'CABLE_ONLY'
      });
      setItemSectionOpen(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      setError(null);
      
      // Check if order is in DISPATCH or DELIVERED status
      if (salesOrder && (salesOrder.Status === 'DISPATCH' || salesOrder.Status === 'DELIVERED')) {
        throw new Error(`Cannot update order. Order is in ${salesOrder.Status} status and cannot be modified.`);
      }
      
      if (!formData.poNumber || !formData.clientCode || items.length === 0) {
        throw new Error('Please fill all required fields and add at least one item');
      }
      
      const poId = salesOrder.POId || salesOrder.SOId;
      
      // Get all existing items for this sales order to track which ones to delete
      const allPOs = await poService.getAllPOs();
      const existingItems = allPOs.filter(po => (po.POId === poId || po.SOId === poId));
      
      // Update or create each item in the sales order
      for (let i = 0; i < items.length; i++) {
        const item = items[i];
        const updateData = {
          Name: item.itemName,
          ClientCode: formData.clientCode,
          AssignedTo: formData.assignedTo,
          OrderType: item.orderType,
          ProductCode: item.productCode,
          Description: item.productDesc,
          Quantity: item.qty,
          BatchSize: item.batchSize,
          Price: item.price,
          POId: formData.poNumber,
          SOId: formData.poNumber
        };
        
        if (item.uniqueId) {
          // Update existing item using UniqueId
          await poService.updatePOByUniqueId(item.uniqueId, updateData);
        } else {
          // Create new item row for this sales order
          const now = new Date().toISOString();
          
          const newItem = {
            UniqueId: `UI-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            SOId: formData.poNumber,
            POId: formData.poNumber,
            ...updateData,
            Status: salesOrder.Status || config.statusCodes.NEW,
            CreatedBy: user?.email || 'system',
            CreatedAt: now,
            UpdatedAt: now,
            PODocumentId: salesOrder.PODocumentId || '',
            DueDate: salesOrder.DueDate || ''
          };
          
          await sheetService.appendRow(config.sheets.poMaster, newItem);
        }
      }
      
      // Delete items that were removed (exist in database but not in current items)
      const currentUniqueIds = items.map(item => item.uniqueId).filter(id => id);
      const itemsToDelete = existingItems.filter(existing => 
        existing.UniqueId && !currentUniqueIds.includes(existing.UniqueId)
      );
      
      // Delete items in reverse order to maintain correct indices
      if (itemsToDelete.length > 0) {
        const allPOsAfterUpdate = await poService.getAllPOs();
        const deleteIndices = itemsToDelete
          .map(item => {
            const index = allPOsAfterUpdate.findIndex(po => po.UniqueId === item.UniqueId);
            return index !== -1 ? { index, uniqueId: item.UniqueId } : null;
          })
          .filter(item => item !== null)
          .sort((a, b) => b.index - a.index); // Sort descending
        
        for (const { index } of deleteIndices) {
          await sheetService.deleteRow(config.sheets.poMaster, index + 2);
        }
      }
      
      setSuccess(true);
      
      // Notify parent component
      if (onSave) {
        onSave({
          ...salesOrder,
          ...formData,
          items: items
        });
      }
      
      // Close dialog after a short delay
      setTimeout(() => {
        onClose();
      }, 1500);
      
    } catch (err) {
      setError(err.message || 'Failed to update Sales Order');
      console.error('Error in handleSubmit:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) {
      onClose();
    }
  };

  if (loading) {
    return (
      <Dialog open={open} onClose={handleClose} maxWidth="lg" fullWidth>
        <DialogContent>
          <LoadingSpinner message="Updating Sales Order..." />
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog 
      open={open} 
      onClose={handleClose} 
      maxWidth="lg" 
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 3,
          minHeight: '80vh'
        }
      }}
    >
      <DialogTitle>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Box sx={{ 
            p: 1.5, 
            borderRadius: 2,
            backgroundColor: alpha(theme.palette.primary.main, 0.04),
            color: 'primary.main'
          }}>
            <Edit sx={{ fontSize: 24 }} />
          </Box>
          <Box>
            <Typography variant="h5" sx={{ color: 'primary.main', fontWeight: 600 }}>
              Edit Sales Order
            </Typography>
            <Typography variant="body2" sx={{ color: 'text.secondary' }}>
              Update the details below to modify the sales order
            </Typography>
          </Box>
        </Box>
      </DialogTitle>

      <DialogContent dividers>
        {error && (
          <Fade in timeout={400}>
            <Alert 
              severity="error" 
              sx={{ 
                mb: 3,
                borderRadius: 2,
                border: `1px solid ${alpha(theme.palette.error.main, 0.15)}`,
                backgroundColor: alpha(theme.palette.error.main, 0.02)
              }} 
              variant="outlined"
            >
              {error}
            </Alert>
          </Fade>
        )}

        {success && (
          <Fade in timeout={400}>
            <Alert 
              severity="success" 
              sx={{ 
                mb: 3,
                borderRadius: 2,
                border: `1px solid ${alpha(theme.palette.success.main, 0.15)}`,
                backgroundColor: alpha(theme.palette.success.main, 0.02)
              }} 
              variant="outlined"
            >
              Sales Order updated successfully!
            </Alert>
          </Fade>
        )}

        <form onSubmit={handleSubmit}>
          <Grid container spacing={3}>
            {/* Basic Information Section */}
            <Grid item xs={12}>
              <Grow in timeout={800}>
                <Paper 
                  elevation={0}
                  sx={{ 
                    p: 3, 
                    backgroundColor: alpha(theme.palette.primary.main, 0.01),
                    border: `1px solid ${alpha(theme.palette.primary.main, 0.08)}`,
                    borderRadius: 2
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
                    <Box sx={{ 
                      p: 1.5, 
                      borderRadius: 2,
                      backgroundColor: alpha(theme.palette.primary.main, 0.04),
                      color: 'primary.main'
                    }}>
                      <AssignmentIcon sx={{ fontSize: 20 }} />
                    </Box>
                    <Typography 
                      variant="h6" 
                      sx={{ 
                        color: 'primary.main',
                        fontWeight: 600
                      }}
                    >
                      Basic Information
                    </Typography>
                  </Box>
                  
                  <Grid container spacing={3}>
                    {/* SO Number Field */}
                    <Grid item xs={12} sm={6} md={4}>
                      <TextField 
                        label="SO Number *" 
                        name="poNumber" 
                        value={formData.poNumber} 
                        onChange={handleChange} 
                        fullWidth 
                        required 
                        InputProps={{ readOnly: true }}
                        sx={{
                          '& .MuiOutlinedInput-root': {
                            backgroundColor: '#f5f5f5',
                            '& fieldset': { borderColor: alpha(theme.palette.primary.main, 0.08) }
                          }
                        }}
                      />
                    </Grid>

                    {/* Client Code Searchable Dropdown */}
                    <Grid item xs={12} sm={6} md={4}>
                      <Autocomplete
                        options={clients}
                        getOptionLabel={(option) => option?.clientCode ? `${option.clientCode} - ${option.clientName}` : ''}
                        value={clients.find(c => c.clientCode === formData.clientCode) || null}
                        onChange={(e, newValue) => {
                          handleChange({ target: { name: 'clientCode', value: newValue ? newValue.clientCode : '' } });
                        }}
                        renderInput={(params) => (
                          <TextField
                            {...params}
                            required
                            label="Client Code"
                            placeholder="Search by code or name"
                          />
                        )}
                        isOptionEqualToValue={(option, value) => option.clientCode === value.clientCode}
                      />
                    </Grid>

                    {/* Assigned To Field */}
                    <Grid item xs={12} sm={6} md={4}>
                      <TextField 
                        label="Assigned To *" 
                        name="assignedTo" 
                        value={formData.assignedTo} 
                        onChange={handleChange} 
                        fullWidth 
                        required 
                        InputProps={{ readOnly: true }}
                        sx={{
                          '& .MuiOutlinedInput-root': {
                            backgroundColor: '#f5f5f5',
                            '& fieldset': { borderColor: '#e3f2fd' }
                          }
                        }}
                      />
                    </Grid>
                  </Grid>
                </Paper>
              </Grow>
            </Grid>

            {/* Items Table */}
            {items.length > 0 && (
              <Grid item xs={12}>
                <Grow in timeout={800} style={{ transitionDelay: '200ms' }}>
                  <Paper 
                    elevation={0}
                    sx={{ 
                      border: '1px solid #e3f2fd',
                      borderRadius: 2,
                      overflow: 'hidden'
                    }}
                  >
                    <Box sx={{ p: 2, backgroundColor: '#f8fbff', borderBottom: '1px solid #e3f2fd' }}>
                      <Typography variant="h6" sx={{ color: '#1976d2', fontWeight: 600 }}>
                        Current Items ({items.length})
                      </Typography>
                    </Box>
                    <TableContainer>
                      <Table size="small">
                        <TableHead>
                          <TableRow sx={{ backgroundColor: '#f8fbff' }}>
                            <TableCell sx={{ fontWeight: 600, color: '#1976d2' }}>Item</TableCell>
                            <TableCell sx={{ fontWeight: 600, color: '#1976d2' }}>Description</TableCell>
                            <TableCell sx={{ fontWeight: 600, color: '#1976d2' }}>Code</TableCell>
                            <TableCell sx={{ fontWeight: 600, color: '#1976d2' }}>Order Type</TableCell>
                            <TableCell sx={{ fontWeight: 600, color: '#1976d2' }}>Qty</TableCell>
                            <TableCell sx={{ fontWeight: 600, color: '#1976d2' }}>Price</TableCell>
                            <TableCell sx={{ fontWeight: 600, color: '#1976d2' }}>Batch</TableCell>
                            <TableCell sx={{ fontWeight: 600, color: '#1976d2' }}>Actions</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {items.map((item, idx) => (
                            <TableRow key={idx} sx={{ '&:hover': { backgroundColor: '#f8fbff' } }}>
                              <TableCell>{item.itemName}</TableCell>
                              <TableCell>{item.productDesc}</TableCell>
                              <TableCell>{item.productCode}</TableCell>
                              <TableCell>
                                <Chip
                                  label={item.orderType}
                                  size="small"
                                  sx={{
                                    backgroundColor: '#e3f2fd',
                                    color: '#1976d2',
                                    fontSize: '0.75rem',
                                    fontWeight: 500
                                  }}
                                />
                              </TableCell>
                              <TableCell>{item.qty}</TableCell>
                              <TableCell>₹{item.price}</TableCell>
                              <TableCell>{item.batchSize}</TableCell>
                              <TableCell>
                                <Box sx={{ display: 'flex', gap: 1 }}>
                                  <Tooltip title="Edit Item">
                                    <IconButton 
                                      onClick={() => handleEditItem(idx)}
                                      size="small"
                                      sx={{ 
                                        color: '#1976d2',
                                        '&:hover': { backgroundColor: '#e3f2fd' }
                                      }}
                                    >
                                      <Edit fontSize="small" />
                                    </IconButton>
                                  </Tooltip>
                                  <Tooltip title="Delete Item">
                                    <IconButton 
                                      onClick={() => handleDeleteItem(idx)} 
                                      color="error"
                                      size="small"
                                      sx={{ 
                                        '&:hover': { backgroundColor: '#ffebee' }
                                      }}
                                    >
                                      <Delete fontSize="small" />
                                    </IconButton>
                                  </Tooltip>
                                </Box>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  </Paper>
                </Grow>
              </Grid>
            )}

            {/* Add/Edit Item Form */}
            {itemSectionOpen && (
              <Grid item xs={12}>
                <Slide direction="up" in={itemSectionOpen} timeout={600}>
                  <Paper 
                    elevation={0}
                    sx={{ 
                      p: 3, 
                      backgroundColor: '#f8fbff',
                      border: '1px solid #e3f2fd',
                      borderRadius: 2
                    }}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
                      <Typography 
                        variant="h6" 
                        sx={{ 
                          color: '#1976d2',
                          fontWeight: 600
                        }}
                      >
                        {editIndex !== null ? 'Edit Item' : 'Add New Item'}
                      </Typography>
                      
                      {(itemData.itemName && itemData.productDesc && itemData.qty && itemData.price && itemData.batchSize && itemData.productCode) && (
                        <Chip
                          icon={<CheckCircle />}
                          label="Ready to Save"
                          color="success"
                          variant="outlined"
                          sx={{ 
                            fontWeight: 500,
                            borderColor: '#2e7d32',
                            color: '#2e7d32'
                          }}
                        />
                      )}
                    </Box>
                    
                    <Grid container spacing={3}>
                      {/* Product Code Dropdown */}
                      <Grid item xs={12} sm={6} md={3}>
                        <FormControl fullWidth required>
                          <InputLabel>Product Code</InputLabel>
                          <Select
                            name="productCode"
                            value={itemData.productCode}
                            onChange={handleProductSelect}
                            label="Product Code"
                            renderValue={(selected) => {
                              if (!selected) {
                                return <em style={{ color: '#999' }}>Select Product</em>;
                              }
                              return selected;
                            }}
                          >
                            {!formData.clientCode ? (
                              <MenuItem disabled value="">
                                <em>Please select a client first</em>
                              </MenuItem>
                            ) : clientProducts.length === 0 ? (
                              <MenuItem disabled value="">
                                <em>No products available for this client</em>
                              </MenuItem>
                            ) : (
                              clientProducts.map(product => (
                                <MenuItem key={product.productCode} value={product.productCode}>
                                  {product.productCode} - {product.productName}
                                </MenuItem>
                              ))
                            )}
                          </Select>
                        </FormControl>
                      </Grid>

                      {/* Item Name Field */}
                      <Grid item xs={12} sm={6} md={3}>
                        <TextField
                          label="Item Name *"
                          name="itemName"
                          value={itemData.itemName}
                          fullWidth
                          required
                          InputProps={{ readOnly: true }}
                          sx={{
                            '& .MuiOutlinedInput-root': {
                              backgroundColor: '#f5f5f5',
                              '& fieldset': { borderColor: '#e3f2fd' }
                            }
                          }}
                        />
                      </Grid>

                      {/* Product Description Field */}
                      <Grid item xs={12} sm={6} md={3}>
                        <TextField
                          label="Product Description *"
                          name="productDesc"
                          value={itemData.productDesc}
                          fullWidth
                          required
                          InputProps={{ readOnly: true }}
                          sx={{
                            '& .MuiOutlinedInput-root': {
                              backgroundColor: '#f5f5f5',
                              '& fieldset': { borderColor: '#e3f2fd' }
                            }
                          }}
                        />
                      </Grid>

                      {/* Quantity Field */}
                      <Grid item xs={12} sm={6} md={3}>
                        <TextField
                          label="Quantity *"
                          name="qty"
                          type="number"
                          value={itemData.qty}
                          onChange={handleItemChange}
                          fullWidth
                          required
                        />
                      </Grid>

                      {/* Per Unit Price Field */}
                      <Grid item xs={12} sm={6} md={3}>
                        <TextField
                          label="Per Unit Price (₹) *"
                          name="price"
                          type="number"
                          value={itemData.price}
                          onChange={handleItemChange}
                          fullWidth
                          required
                        />
                      </Grid>

                      {/* Batch Size Field */}
                      <Grid item xs={12} sm={6} md={3}>
                        <TextField
                          label="Batch Size *"
                          name="batchSize"
                          type="number"
                          value={itemData.batchSize}
                          onChange={handleItemChange}
                          fullWidth
                          required
                        />
                      </Grid>

                      {/* Order Type Dropdown */}
                      <Grid item xs={12} sm={6} md={3}>
                        <FormControl fullWidth required>
                          <InputLabel>Order Type</InputLabel>
                          <Select
                            name="orderType"
                            value={itemData.orderType}
                            onChange={handleItemChange}
                            label="Order Type"
                          >
                            {orderTypes.map(type => (
                              <MenuItem key={type} value={type}>{type}</MenuItem>
                            ))}
                          </Select>
                        </FormControl>
                      </Grid>

                      {/* Add/Update Item Button */}
                      <Grid item xs={12} sm={6} md={3}>
                        <Button 
                          variant="contained" 
                          onClick={handleAddOrUpdateItem}
                          startIcon={<Add />}
                          fullWidth
                          disabled={!itemData.itemName || !itemData.productDesc || !itemData.qty || !itemData.price || !itemData.batchSize}
                          sx={{
                            backgroundColor: '#1976d2',
                            '&:hover': { backgroundColor: '#1565c0' },
                            '&:disabled': { backgroundColor: '#e0e0e0', color: '#9e9e9e' }
                          }}
                        >
                          {editIndex !== null ? 'Update Item' : 'Add Item'}
                        </Button>
                      </Grid>

                      {/* Cancel Button (when editing) */}
                      {editIndex !== null && (
                        <Grid item xs={12} sm={6} md={3}>
                          <Button 
                            onClick={() => { 
                              setEditIndex(null); 
                              setItemData({
                                uniqueId: '',
                                itemName: '',
                                productDesc: '',
                                productCode: '',
                                qty: '',
                                price: '',
                                batchSize: '',
                                orderType: 'CABLE_ONLY'
                              }); 
                            }}
                            variant="outlined"
                            fullWidth
                            sx={{
                              borderColor: '#1976d2',
                              color: '#1976d2',
                              '&:hover': {
                                borderColor: '#1565c0',
                                backgroundColor: '#f8fbff'
                              }
                            }}
                          >
                            Cancel
                          </Button>
                        </Grid>
                      )}
                    </Grid>
                  </Paper>
                </Slide>
              </Grid>
            )}

            {/* Add New Item Button */}
            {!itemSectionOpen && (
              <Grid item xs={12}>
                <Box sx={{ display: 'flex', justifyContent: 'center' }}>
                  <Button 
                    variant="outlined" 
                    onClick={() => setItemSectionOpen(true)}
                    startIcon={<Add />}
                    sx={{
                      borderColor: '#1976d2',
                      color: '#1976d2',
                      '&:hover': {
                        borderColor: '#1565c0',
                        backgroundColor: '#f8fbff'
                      }
                    }}
                  >
                    Add New Item
                  </Button>
                </Box>
              </Grid>
            )}
          </Grid>
        </form>
      </DialogContent>

      <DialogActions sx={{ p: 3, gap: 2 }}>
        <Button 
          onClick={handleClose}
          disabled={loading}
          sx={{
            borderColor: '#1976d2',
            color: '#1976d2',
            '&:hover': {
              borderColor: '#1565c0',
              backgroundColor: '#f8fbff'
            }
          }}
        >
          Cancel
        </Button>
        <Button 
          onClick={handleSubmit}
          variant="contained"
          disabled={
            loading || 
            items.length === 0 || 
            (salesOrder && (salesOrder.Status === 'DISPATCH' || salesOrder.Status === 'DELIVERED'))
          }
          startIcon={<Save />}
          sx={{
            backgroundColor: '#1976d2',
            '&:hover': { backgroundColor: '#1565c0' },
            '&:disabled': { backgroundColor: '#e0e0e0', color: '#9e9e9e' }
          }}
        >
          {loading ? 'Updating...' : 'Update Sales Order'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default SalesOrderEditForm;
