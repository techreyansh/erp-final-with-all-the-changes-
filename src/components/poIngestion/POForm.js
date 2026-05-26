import React, { useState, useEffect } from 'react';
import {
  Box, Card, CardContent, TextField, Button, Typography, Grid, Alert,
  AlertTitle, Snackbar, Paper, TableContainer, Table,
  TableHead, TableBody, TableRow, TableCell, Select, MenuItem, FormControl, InputLabel,
  useTheme, alpha, Fade, Grow, Slide, Chip, IconButton, Tooltip, Autocomplete
} from '@mui/material';
import { 
  Save, Upload, ExpandMore, ExpandLess, Edit, Delete, Add, 
  ShoppingCart, Assignment as AssignmentIcon, AutoAwesome, CheckCircle
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import LoadingSpinner from '../common/LoadingSpinner';
import poService from '../../services/poService';
import sheetService from '../../services/sheetService';
import salesFlowService from '../../services/salesFlowService';
import { getAllClients } from '../../services/clientService';
import { useAuth } from '../../context/AuthContext';
import WhatsAppButton from '../common/WhatsAppButton';

const orderTypes = [
  'CABLE_ONLY',
  'POWER_CORD'
];

const SalesOrderForm = ({ onSalesOrderCreated }) => {
  const theme = useTheme();
  const { user } = useAuth();
  const navigate = useNavigate();
  
  // Function to generate unique ID for items
  const generateUniqueId = () => {
    // Generate a unique ID using timestamp and random number
    const timestamp = Date.now().toString().slice(-6); // Last 6 digits of timestamp
    const randomNum = Math.floor(Math.random() * 1000).toString().padStart(3, '0'); // 3-digit random number
    const uniqueId = `SO-${timestamp}-${randomNum}`;
    return uniqueId;
  };
  
  const initialFormState = { 
    salesOrderNumber: '', 
    clientCode: '',
    assignedTo: 'mock.customer relations manager@reyanshelectronics.com'
  };
  const initialItemState = {
    itemName: '', productDesc: '', productCode: '',
    qty: '', price: '', batchSize: '', orderType: 'CABLE_ONLY', uniqueId: '',
  };

  const [formData, setFormData] = useState(initialFormState);
  const [items, setItems] = useState([]);
  const [itemSectionOpen, setItemSectionOpen] = useState(false);
  const [itemData, setItemData] = useState(initialItemState);
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [editIndex, setEditIndex] = useState(null);
  const [clients, setClients] = useState([]);
  const [selectedClient, setSelectedClient] = useState(null);
  const [products, setProducts] = useState([]);
  const [salesFlowNotification, setSalesFlowNotification] = useState(null);

  // Fetch clients on component mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        const clientData = await getAllClients();
        setClients(clientData);
        
        // Check if we have sales flow data from session storage
        const salesFlowForSO = sessionStorage.getItem('salesFlowForSO');
        if (salesFlowForSO) {
          try {
            const salesFlowData = JSON.parse(salesFlowForSO);
            // Pre-populate form with sales flow data
            if (salesFlowData.salesFlowData) {
              const flowData = salesFlowData.salesFlowData;
              const leadDetails = flowData.leadDetails;
              const newClient = salesFlowData.newClient;
              
              // Set form data - use new client if available, otherwise fall back to original data
              setFormData(prev => ({
                ...prev,
                poNumber: `SO-${flowData.LogId}-${Date.now()}`,
                clientCode: newClient?.clientCode || leadDetails?.CompanyName || flowData.CompanyName || '',
                assignedTo: 'mock.customer relations manager@reyanshelectronics.com'
              }));
              
              // If there's a new client, set it as selected client
              if (newClient) {
                setSelectedClient(newClient);
              }
              
              // If there are products interested, add them as items
              // Use new client's products if available, otherwise use original products
              let productsToUse = [];
              
              if (newClient?.products && Array.isArray(newClient.products) && newClient.products.length > 0) {
                // Use products from newly created client
                productsToUse = newClient.products.map(product => ({
                  itemName: 'Product', // Will be populated when product details are fetched
                  productDesc: 'Product Description',
                  productCode: product.productCode,
                  qty: 1,
                  price: 0,
                  batchSize: 1,
                  orderType: 'CABLE_ONLY',
                  uniqueId: generateUniqueId()
                }));
              } else if (leadDetails?.ProductsInterested) {
                // Fall back to original products - handle both string and array formats
                let productsInterested = leadDetails.ProductsInterested;
                
                // Parse if it's a JSON string
                if (typeof productsInterested === 'string') {
                  try {
                    productsInterested = JSON.parse(productsInterested);
                  } catch (err) {
                    console.error('Error parsing ProductsInterested:', err);
                    productsInterested = [];
                  }
                }
                
                if (Array.isArray(productsInterested) && productsInterested.length > 0) {
                  productsToUse = productsInterested.map(product => {
                    // Handle both object and string formats
                    let productCode = '';
                    if (typeof product === 'object') {
                      productCode = product.productCode || product.ProductCode || '';
                    } else if (typeof product === 'string') {
                      productCode = product;
                    }
                    
                    return {
                      itemName: 'Product',
                      productDesc: 'Product Description',
                      productCode: productCode,
                      qty: 1,
                      price: 0,
                      batchSize:4000 ,
                      orderType: 'CABLE_ONLY',
                      uniqueId: generateUniqueId()
                    };
                  });
                }
              }
              
              if (productsToUse.length > 0) {
                setItems(productsToUse);
                
                // Show loading notification while fetching product details
                setSalesFlowNotification({
                  message: `Loading product details for ${productsToUse.length} product(s)...`,
                  severity: 'info'
                });
                
                // Update product details for the automatically added items
                fetchProductDetailsForItems(productsToUse);
                
                // Update notification after fetching details
                const clientInfo = newClient ? ` and new client ${newClient.clientCode}` : '';
                setSalesFlowNotification({
                  message: `Form pre-populated with data from Sales Flow Log ID: ${flowData.LogId}${clientInfo}`,
                  severity: 'success'
                });
              } else {
                // Show notification if no products were found
                const clientInfo = newClient ? ` and new client ${newClient.clientCode}` : '';
                setSalesFlowNotification({
                  message: `Form pre-populated with data from Sales Flow Log ID: ${flowData.LogId}${clientInfo} (No products found)`,
                  severity: 'warning'
                });
              }
              
              // Note: Don't clear session storage here - it will be cleared after successful SO creation
              // This ensures the sales flow data is available when the user submits the form
              
            }
          } catch (err) {
            console.error('Error parsing sales flow data:', err);
          }
        }
      } catch (err) {
        console.error('Error fetching data:', err);
        setError('Failed to load data');
      }
    };
    fetchData();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (name === 'clientCode') {
      const client = clients.find(c => c.clientCode === value);
      if (client) {
        setSelectedClient(client);
        // Reset item selection on client change
        setItemData(prev => ({
          ...initialItemState,
          // Keep order type if it was already set
          orderType: prev.orderType || 'CABLE_ONLY'
        }));
      } else {
        setSelectedClient(null);
      }
    }
  };

  const handleItemChange = (e) => {
    const { name, value } = e.target;
    if (name === 'qty') {
      // Update quantity - price will be entered manually since no base price from client data
      setItemData(prev => ({
        ...prev,
        qty: value
      }));
    } else if (name === 'price') {
      // Allow manual price entry since no base price is available from client sheet
      setItemData(prev => ({
        ...prev,
        price: value
      }));
    } else {
      setItemData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleProductSelect = (e) => {
    const selectedProductCode = e.target.value;
    
    // Find the product directly from the client's products array
    const product = clientProducts.find(p => p.productCode === selectedProductCode);
    
    if (product) {
      setItemData(prev => ({
        ...prev,
        productCode: product.productCode,
        itemName: product.productName,
        productDesc: product.description,
        basePrice: 0, // Base price not available in client sheet
        price: 0 // Will be calculated based on quantity and manual price entry
      }));
    } else {
      console.warn('Product not found in client data:', selectedProductCode);
      setError(`Product ${selectedProductCode} not found for this client`);
    }
  };

  // Function to fetch product details for automatically added items
  const fetchProductDetailsForItems = (itemsToUpdate) => {
    try {
      // Update items with actual product details from client data
      const updatedItems = itemsToUpdate.map(item => {
        const product = clientProducts.find(p => p.productCode === item.productCode);
        if (product) {
          return {
            ...item,
            itemName: product.productName || item.itemName,
            productDesc: product.description || item.productDesc,
            basePrice: 0, // Base price not available in client sheet
            price: item.price || 0 // Keep existing price or set to 0
          };
        }
        // If product not found, keep the item as is but log a warning
        console.warn(`Product with code ${item.productCode} not found in client data`);
        return item;
      });
      
      // Update the items state with the fetched details
      setItems(updatedItems);
      
      // Count how many products were successfully updated
      const updatedCount = updatedItems.filter(item => 
        item.itemName !== 'Product' && item.productDesc !== 'Product Description'
      ).length;
      // If some products weren't found, show a warning
      if (updatedCount < itemsToUpdate.length) {
        const missingCount = itemsToUpdate.length - updatedCount;
        console.warn(`${missingCount} product(s) not found in client data`);
      }
    } catch (err) {
      console.error('Error updating product details for items:', err);
      // Don't set error here as this is not critical - items will still work with basic info
    }
  };

  // Get products directly from the selected client's Products column (JSON array)
  // Each product object contains: productCode, productName, category, description
  const clientProducts = selectedClient && selectedClient.products && selectedClient.products.length > 0
    ? selectedClient.products
    : [];
  const handleAddOrUpdateItem = () => {
    if (!itemData.itemName || !itemData.productDesc || !itemData.qty || !itemData.price || !itemData.batchSize) return;
    
    if (editIndex !== null) {
      // When editing, preserve the existing uniqueId
      setItems(prev => prev.map((item, i) => i === editIndex ? itemData : item));
      setEditIndex(null);
    } else {
      // When adding new item, generate a new uniqueId
      const newItem = {
        ...itemData,
        uniqueId: generateUniqueId()
      };
      setItems(prev => [...prev, newItem]);
    }
    setItemData(initialItemState);
    setItemSectionOpen(false);
  };

  const handleEditItem = (idx) => {
    setItemData(items[idx]);
    setEditIndex(idx);
    setItemSectionOpen(true);
  };

  const handleDeleteItem = (idx) => {
    setItems(prev => prev.filter((_, i) => i !== idx));
    if (editIndex === idx) {
      setEditIndex(null);
      setItemData(initialItemState);
      setItemSectionOpen(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      setError(null);
      if (!formData.poNumber || !formData.clientCode || items.length === 0) {
        throw new Error('Please fill all required fields and add at least one item');
      }
      
      // Check if this SO was created from sales flow data
      const salesFlowForSO = sessionStorage.getItem('salesFlowForSO');
      let poDocumentId = '';
      if (file) {
        poDocumentId = await sheetService.uploadFile(file);
      }
      // Add SOId to each item - same SOId for all items in this sales order
      const itemsWithSOId = items.map(item => ({
        ...item,
        soId: formData.poNumber // Same SOId for all items in this sales order
      }));
      
      const payload = {
        name: formData.poNumber,
        clientCode: formData.clientCode,
        assignedTo: formData.assignedTo,
        orderType: items[0]?.orderType || '',
        productCode: items[0]?.productCode || '',
        description: items[0]?.productDesc || '',
        quantity: items.reduce((sum, item) => sum + Number(item.qty), 0),
        batchSize: items[0]?.batchSize || '',
        items: itemsWithSOId, // Items now include SOId
        poDocumentId
      };
      await poService.createPO(payload, user?.email || 'system');
      
      // Update sales flow step if this was created from sales flow data
      if (salesFlowForSO) {
        try {
          const salesFlowData = JSON.parse(salesFlowForSO);
          if (salesFlowData.salesFlowData?.LogId) {
            // First, let's check what step we actually need to update
            try {
              const allSteps = await sheetService.getSheetData('SalesFlowSteps');
              const stepsForThisLog = allSteps.filter(s => s.LogId === salesFlowData.salesFlowData.LogId);
              // Find the step that has NextStep = 11 (Order Booking step)
              const orderBookingStep = stepsForThisLog.find(s => s.NextStep === '11' || s.StepId === '11');
              if (orderBookingStep) {
                // Update sales flow step to completed and set next step to "-" (final step)
                const updateResult = await salesFlowService.updateSalesFlowStep(
                  salesFlowData.salesFlowData.LogId,
                  orderBookingStep.StepId, // Use the actual step ID from the database
                  'completed',
                  {
                    ApprovalStatus: 'Approved',
                    NextStep: '-', // Set to "-" to mark as final step
                    comments: [{
                      comment: `SO ${formData.poNumber} created successfully with ${items.length} items`,
                      user: user?.email || 'system',
                      timestamp: new Date().toISOString()
                    }]
                  },
                  user?.email || 'system'
                );
              } else {
              }
            } catch (error) {
              console.error('Error checking step data:', error);
            }
          } else {
          }
        } catch (salesFlowError) {
          console.error('Error updating sales flow step:', salesFlowError);
          console.error('Error details:', salesFlowError.message);
          console.error('Error stack:', salesFlowError.stack);
          // Don't fail the SO creation if sales flow update fails
        }
      } else {
      }
      
      setFormData(initialFormState);
      setItems([]);
      setFile(null);
      
      // Clear session storage after successful SO creation
      sessionStorage.removeItem('salesFlowForSO');
      
      // Show success message
      const salesFlowMessage = salesFlowForSO ? ' and sales flow step updated' : '';
      setSuccess(true);
      setSalesFlowNotification({
        message: salesFlowForSO 
          ? `SO created successfully! Sales flow step 11 (Order Booking) completed. This is the final step - sales flow completed. Redirecting to Sales Flow...`
          : `SO created successfully!`,
        severity: 'success'
      });
      
      // Notify parent component to refresh the sales order list
      if (onSalesOrderCreated) {
        onSalesOrderCreated();
      }
      
      // Navigate back to sales flow after a short delay if this was from sales flow
      if (salesFlowForSO) {
        setTimeout(() => {
          navigate('/sales-flow');
        }, 2000);
      }
    } catch (err) {
      setError(err.message || 'Failed to create SO');
      console.error('Error in handleSubmit:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) setFile(e.target.files[0]);
  };

  if (loading) return <LoadingSpinner message="Creating SO..." />;

  return (
    <Box>
      <Card 
        elevation={0}
        sx={{ 
          border: `1px solid ${alpha(theme.palette.primary.main, 0.08)}`,
          borderRadius: 2,
          overflow: 'hidden',
          transition: 'all 0.3s ease',
          '&:hover': {
            borderColor: alpha(theme.palette.primary.main, 0.15),
            boxShadow: theme.shadows[2]
          }
        }}
      >
        <CardContent sx={{ p: 4 }}>
          {/* Header */}
          <Fade in timeout={600}>
            <Box sx={{ mb: 4 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 3, mb: 2 }}>
                <Box sx={{ 
                  p: 2, 
                  borderRadius: 2,
                  backgroundColor: alpha(theme.palette.primary.main, 0.04),
                  color: 'primary.main',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <ShoppingCart sx={{ fontSize: 28 }} />
                </Box>
                <Box>
                  <Typography 
                    variant="h4" 
                    sx={{ 
                      color: 'primary.main',
                      fontWeight: 600,
                      mb: 1
                    }}
                  >
                    Create New Sales Order
                  </Typography>
                  <Typography 
                    variant="body1" 
                    sx={{ 
                      color: 'text.secondary',
                      lineHeight: 1.6,
                      fontSize: '1.1rem'
                    }}
                  >
                    Fill in the details below to create a new purchase order
                  </Typography>
                </Box>
              </Box>
              
            </Box>
          </Fade>

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
                <AlertTitle sx={{ fontWeight: 600 }}>Error</AlertTitle>
                {error}
              </Alert>
            </Fade>
          )}

          {salesFlowNotification && (
            <Fade in timeout={400}>
              <Alert 
                severity={salesFlowNotification.severity} 
                sx={{ 
                  mb: 3,
                  borderRadius: 2,
                  border: `1px solid ${alpha(theme.palette[salesFlowNotification.severity === 'success' ? 'success' : salesFlowNotification.severity === 'warning' ? 'warning' : 'info'].main, 0.15)}`,
                  backgroundColor: alpha(theme.palette[salesFlowNotification.severity === 'success' ? 'success' : salesFlowNotification.severity === 'warning' ? 'warning' : 'info'].main, 0.02)
                }} 
                onClose={() => setSalesFlowNotification(null)}
                variant="outlined"
              >
                {salesFlowNotification.message}
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
                      borderRadius: 2,
                      transition: 'all 0.3s ease',
                      height: '100%',
                      '&:hover': {
                        borderColor: alpha(theme.palette.primary.main, 0.15),
                        boxShadow: theme.shadows[1]
                      }
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
                    <Box sx={{
                      display: 'grid',
                      gridTemplateColumns: {
                        xs: '1fr',
                        sm: '1fr 1fr',
                        md: '1fr 1fr 1fr',
                        lg: '1fr 1fr 1fr 1fr 1fr'
                      },
                      gap: 3,
                      alignItems: 'start'
                    }}>
                      {/* SO Number Field */}
                      <Box>
                        <TextField 
                          label="SO Number *" 
                          name="poNumber" 
                          value={formData.poNumber} 
                          onChange={handleChange} 
                          fullWidth 
                          required 
                          sx={{
                            '& .MuiOutlinedInput-root': {
                              '& fieldset': { borderColor: alpha(theme.palette.primary.main, 0.08) },
                              '&:hover fieldset': { borderColor: 'primary.main' },
                              '&.Mui-focused fieldset': { borderColor: 'primary.main' }
                            }
                          }}
                        />
                      </Box>

                      {/* Client Code Searchable Dropdown */}
                      <Box>
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
                              sx={{
                                '& .MuiOutlinedInput-root': {
                                  '& fieldset': { borderColor: alpha(theme.palette.primary.main, 0.08) },
                                  '&:hover fieldset': { borderColor: 'primary.main' },
                                  '&.Mui-focused fieldset': { borderColor: 'primary.main' }
                                }
                              }}
                            />
                          )}
                          isOptionEqualToValue={(option, value) => option.clientCode === value.clientCode}
                        />
                      </Box>

                      {/* Assigned To Field */}
                      <Box>
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
                      </Box>

                      {/* Add New Item Button */}
                      <Box sx={{ display: 'flex', alignItems: 'center', height: '100%' }}>
                        <Button 
                          variant="outlined" 
                          onClick={() => setItemSectionOpen(p => !p)} 
                          fullWidth 
                          endIcon={itemSectionOpen ? <ExpandLess /> : <ExpandMore />}
                          sx={{
                            borderColor: '#1976d2',
                            color: '#1976d2',
                            py: 1.5,
                            minHeight: '56px',
                            '&:hover': {
                              borderColor: '#1565c0',
                              backgroundColor: '#f8fbff'
                            }
                          }}
                        >
                          {itemSectionOpen ? 'Hide Item Form' : 'Add New Item'}
                        </Button>
                      </Box>

                      {/* Document Upload */}
                      <Box>
                        <Button 
                          variant="outlined" 
                          component="label" 
                          startIcon={<Upload />} 
                          fullWidth
                          sx={{
                            borderColor: '#1976d2',
                            color: '#1976d2',
                            py: 1.5,
                            minHeight: '56px',
                            '&:hover': {
                              borderColor: '#1565c0',
                              backgroundColor: '#f8fbff'
                            }
                          }}
                        >
                          {file ? `Uploaded: ${file.name}` : 'Upload SO Document'}
                          <input type="file" hidden onChange={handleFileChange} />
                        </Button>
                      </Box>
                    </Box>
                  </Paper>
                </Grow>
              </Grid>

              {/* Submit Button */}
              <Grid item xs={12}>
                <Grow in timeout={800} style={{ transitionDelay: '200ms' }}>
                  <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2, mt: 3, alignItems: 'center' }}>
                    {/* WhatsApp Button - Send update after creating order */}
                    {formData.poNumber && formData.clientCode && (
                      <WhatsAppButton
                        task={{
                          POId: formData.poNumber,
                          DispatchUniqueId: formData.poNumber,
                          ClientCode: formData.clientCode,
                          ClientName: formData.clientCode,
                          Status: 'NEW',
                          Items: items
                        }}
                        stageName="ORDER_BOOKING"
                        status="NEW"
                        size="medium"
                        variant="icon"
                      />
                    )}
                    <Button 
                      type="submit" 
                      variant="contained" 
                      startIcon={<Save />} 
                      size="large"
                      disabled={loading}
                      sx={{ 
                        py: 2,
                        px: 4,
                        backgroundColor: '#1976d2',
                        '&:hover': { backgroundColor: '#1565c0' },
                        fontSize: '1.1rem',
                        fontWeight: 600,
                        borderRadius: 2,
                        minWidth: 200
                      }}
                    >
                      {loading ? 'Creating...' : 'Create Sales Order'}
                    </Button>
                  </Box>
                </Grow>
              </Grid>
              
              {/* Items Table */}
              {items.length > 0 && (
                <Grid item xs={12}>
                  <Grow in timeout={800} style={{ transitionDelay: '400ms' }}>
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
                        Added Items ({items.length})
                      </Typography>
                    </Box>
                    <TableContainer>
                      <Table size="small">
                        <TableHead>
                          <TableRow sx={{ backgroundColor: '#f8fbff' }}>
                            <TableCell sx={{ fontWeight: 600, color: '#1976d2' }}>Unique ID</TableCell>
                            <TableCell sx={{ fontWeight: 600, color: '#1976d2' }}>SO ID</TableCell>
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
                              <TableCell>
                                <Box
                                  sx={{
                                    px: 1.5,
                                    py: 0.5,
                                    backgroundColor: '#f3e5f5',
                                    color: '#7b1fa2',
                                    borderRadius: 1,
                                    fontSize: '0.7rem',
                                    fontWeight: 600,
                                    display: 'inline-block',
                                    fontFamily: 'monospace'
                                  }}
                                >
                                  {item.uniqueId}
                                </Box>
                              </TableCell>
                              <TableCell>
                                <Box
                                  sx={{
                                    px: 1.5,
                                    py: 0.5,
                                    backgroundColor: '#e8f5e8',
                                    color: '#2e7d32',
                                    borderRadius: 1,
                                    fontSize: '0.7rem',
                                    fontWeight: 600,
                                    display: 'inline-block',
                                    fontFamily: 'monospace'
                                  }}
                                >
                                  {formData.poNumber}
                                </Box>
                              </TableCell>
                              <TableCell>{item.itemName}</TableCell>
                              <TableCell>{item.productDesc}</TableCell>
                              <TableCell>{item.productCode}</TableCell>
                              <TableCell>
                                <Box
                                  sx={{
                                    px: 2,
                                    py: 0.5,
                                    backgroundColor: '#e3f2fd',
                                    color: '#1976d2',
                                    borderRadius: 1,
                                    fontSize: '0.75rem',
                                    fontWeight: 500,
                                    display: 'inline-block'
                                  }}
                                >
                                  {item.orderType}
                                </Box>
                              </TableCell>
                              <TableCell>{item.qty}</TableCell>
                              <TableCell>₹{item.price}</TableCell>
                              <TableCell>{item.batchSize}</TableCell>
                              <TableCell>
                                <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                                  <Tooltip title="Edit Item">
                                    <Button 
                                      onClick={() => handleEditItem(idx)}
                                      size="small"
                                      sx={{ 
                                        minWidth: 'auto',
                                        color: '#1976d2',
                                        '&:hover': { backgroundColor: '#e3f2fd' }
                                      }}
                                    >
                                      <Edit fontSize="small" />
                                    </Button>
                                  </Tooltip>
                                  <Tooltip title="Delete Item">
                                    <Button 
                                      onClick={() => handleDeleteItem(idx)} 
                                      color="error"
                                      size="small"
                                      sx={{ 
                                        minWidth: 'auto',
                                        '&:hover': { backgroundColor: '#ffebee' }
                                      }}
                                    >
                                      <Delete fontSize="small" />
                                    </Button>
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
              
              {/* Add Item Form */}
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
                      
                      {/* Status Indicator */}
                      {(itemData.itemName && itemData.productDesc && itemData.qty && itemData.price && itemData.batchSize && itemData.productCode) && (
                        <Chip
                          icon={<CheckCircle />}
                          label="Ready to Add"
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
                    <Box sx={{
                      display: 'grid',
                      gridTemplateColumns: {
                        xs: '1fr',
                        sm: '1fr 1fr',
                        md: '1fr 1fr 1fr',
                        lg: '1fr 1fr 1fr 1fr'
                      },
                      gap: 3,
                      alignItems: 'start'
                    }}>
                      {/* Product Code Dropdown */}
                      <Box>
                        <FormControl fullWidth required sx={{ minHeight: '56px' }}>
                          <InputLabel 
                            sx={{ 
                              color: 'text.secondary',
                              backgroundColor: 'white',
                              px: 1,
                              '&.Mui-focused': {
                                color: 'primary.main'
                              }
                            }}
                          >
                            Product Code
                          </InputLabel>
                          <Select
                            name="productCode"
                            value={itemData.productCode}
                            onChange={handleProductSelect}
                            label="Product Code"
                            displayEmpty
                            renderValue={(selected) => {
                              if (!selected) {
                                return <em style={{ color: '#999' }}>Select Product</em>;
                              }
                              return selected;
                            }}
                            sx={{
                              '& .MuiOutlinedInput-notchedOutline': { 
                                borderColor: '#e3f2fd' 
                              },
                              '&:hover .MuiOutlinedInput-notchedOutline': { 
                                borderColor: '#1976d2' 
                              },
                              '&.Mui-focused .MuiOutlinedInput-notchedOutline': { 
                                borderColor: '#1976d2' 
                              }
                            }}
                          >
                            {!formData.clientCode ? (
                              <MenuItem disabled value="">
                                <em>Please select a client first to see client-specific products</em>
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
                          <Typography 
                            variant="caption" 
                            sx={{ 
                              mt: 0.5, 
                              color: !formData.clientCode 
                                ? 'info.main' 
                                : clientProducts.length > 0 
                                  ? 'success.main' 
                                  : 'warning.main',
                              display: 'block'
                            }}
                          >
                            {!formData.clientCode 
                              ? 'Select a client to see their specific products'
                              : selectedClient && clientProducts.length > 0 
                                ? `${clientProducts.length} product(s) available for ${selectedClient.clientName}`
                                : selectedClient 
                                  ? `No products configured for ${selectedClient.clientName}. Please contact admin to add products.`
                                  : 'Loading...'
                            }
                          </Typography>
                        </FormControl>
                      </Box>

                      {/* Item Name Field */}
                      <Box>
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
                      </Box>

                      {/* Product Description Field */}
                      <Box>
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
                      </Box>

                      {/* Quantity Field */}
                      <Box>
                        <TextField
                          label="Quantity *"
                          name="qty"
                          type="number"
                          value={itemData.qty}
                          onChange={handleItemChange}
                          fullWidth
                          required
                          sx={{
                            '& .MuiOutlinedInput-root': {
                              '& fieldset': { borderColor: '#e3f2fd' },
                              '&:hover fieldset': { borderColor: '#1976d2' },
                              '&.Mui-focused fieldset': { borderColor: '#1976d2' }
                            }
                          }}
                        />
                      </Box>

                      {/* Per Unit Price Field */}
                      <Box>
                        <TextField
                          label="Per Unit Price (₹) *"
                          name="price"
                          type="number"
                          value={itemData.price}
                          onChange={handleItemChange}
                          fullWidth
                          required
                          sx={{
                            '& .MuiOutlinedInput-root': {
                              '& fieldset': { borderColor: '#e3f2fd' },
                              '&:hover fieldset': { borderColor: '#1976d2' },
                              '&.Mui-focused fieldset': { borderColor: '#1976d2' }
                            }
                          }}
                        />
                      </Box>

                      {/* Batch Size Field */}
                      <Box>
                        <TextField
                          label="Batch Size *"
                          name="batchSize"
                          type="number"
                          value={itemData.batchSize}
                          onChange={handleItemChange}
                          fullWidth
                          required
                          sx={{
                            '& .MuiOutlinedInput-root': {
                              '& fieldset': { borderColor: '#e3f2fd' },
                              '&:hover fieldset': { borderColor: '#1976d2' },
                              '&.Mui-focused fieldset': { borderColor: '#1976d2' }
                            }
                          }}
                        />
                      </Box>

                      {/* Order Type Dropdown */}
                      <Box>
                        <FormControl fullWidth required sx={{ minHeight: '56px' }}>
                          <InputLabel 
                            sx={{ 
                              color: 'text.secondary',
                              backgroundColor: 'white',
                              px: 1,
                              '&.Mui-focused': {
                                color: 'primary.main'
                              }
                            }}
                          >
                            Order Type
                          </InputLabel>
                          <Select
                            name="orderType"
                            value={itemData.orderType}
                            onChange={handleItemChange}
                            label="Order Type"
                            sx={{
                              '& .MuiOutlinedInput-notchedOutline': { 
                                borderColor: '#e3f2fd' 
                              },
                              '&:hover .MuiOutlinedInput-notchedOutline': { 
                                borderColor: '#1976d2' 
                              },
                              '&.Mui-focused .MuiOutlinedInput-notchedOutline': { 
                                borderColor: '#1976d2' 
                              }
                            }}
                          >
                            {orderTypes.map(type => (
                              <MenuItem key={type} value={type}>{type}</MenuItem>
                            ))}
                          </Select>
                        </FormControl>
                      </Box>

                      {/* Add Item Button */}
                      <Box sx={{ display: 'flex', alignItems: 'center', height: '100%' }}>
                        <Button 
                          variant="contained" 
                          onClick={handleAddOrUpdateItem}
                          startIcon={<Add />}
                          fullWidth
                          disabled={!itemData.itemName || !itemData.productDesc || !itemData.qty || !itemData.price || !itemData.batchSize}
                          sx={{
                            backgroundColor: '#1976d2',
                            minHeight: '56px',
                            '&:hover': { backgroundColor: '#1565c0' },
                            '&:disabled': { backgroundColor: '#e0e0e0', color: '#9e9e9e' },
                            px: 3,
                            py: 1.5
                          }}
                        >
                          {editIndex !== null ? 'Update Item' : 'Add Item'}
                        </Button>
                      </Box>

                      {/* Cancel Button (when editing) */}
                      {editIndex !== null && (
                        <Box sx={{ display: 'flex', alignItems: 'center', height: '100%' }}>
                          <Button 
                            onClick={() => { setEditIndex(null); setItemData(initialItemState); }}
                            variant="outlined"
                            fullWidth
                            sx={{
                              borderColor: '#1976d2',
                              color: '#1976d2',
                              minHeight: '56px',
                              '&:hover': {
                                borderColor: '#1565c0',
                                backgroundColor: '#f8fbff'
                              }
                            }}
                          >
                            Cancel
                          </Button>
                        </Box>
                      )}
                    </Box>
                    </Paper>
                  </Slide>
                </Grid>
              )}

            </Grid>
          </form>
        </CardContent>
      </Card>

      <Snackbar 
        open={success} 
        autoHideDuration={5000} 
        onClose={() => setSuccess(false)} 
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert 
          severity="success" 
          onClose={() => setSuccess(false)}
          sx={{ 
            borderRadius: 2,
            '& .MuiAlert-icon': { color: '#2e7d32' }
          }}
        >
          Sales Order created successfully!
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default SalesOrderForm;