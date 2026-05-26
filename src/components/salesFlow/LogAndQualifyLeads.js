import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Typography,
  Paper,
  TextField,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  OutlinedInput,
  useTheme,
  Alert,
  Snackbar,
  CircularProgress,
  Grid,
  Card,
  CardContent,
  Divider,
  Avatar,
  Fade,
  IconButton,
  Tooltip
} from '@mui/material';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import salesFlowService from '../../services/salesFlowService';
import { getAllClients as getAllProspectsClients, addClient as addProspectClient } from '../../services/prospectsClientService';
import { getAllClients as getAllRegularClients } from '../../services/clientService';
import { 
  Save, 
  ArrowBack, 
  Person, 
  Business, 
  Email, 
  Phone, 
  ShoppingCart, 
  Source, 
  PriorityHigh, 
  CheckCircle, 
  Notes, 
  AutoAwesome,
  Diamond,
  WorkspacePremium,
  TrendingUp,
  LocationOn,
  Assignment,
  Category,
  AccountCircle,
  Add,
  Refresh,
  Cancel
} from '@mui/icons-material';
import WhatsAppButton from '../common/WhatsAppButton';

const LogAndQualifyLeads = () => {
  const theme = useTheme();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [products, setProducts] = useState([]);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [clients, setClients] = useState([]);
  const [loadingClients, setLoadingClients] = useState(false);
  const [selectedClientCode, setSelectedClientCode] = useState('');
  const [selectedClient, setSelectedClient] = useState(null);
  const [clientProducts, setClientProducts] = useState([]);
  const [createNewProspect, setCreateNewProspect] = useState(false);

  // Form state with new fields
  const [formData, setFormData] = useState({
    enquiryNumber: '', // Will be auto-generated
    customerName: '',
    companyName: '',
    mobileNumber: '',
    emailId: '',
    productsInterested: [], // Products interested in
    requirement: '',
    leadAssignedTo: '',
    customerLocation: '',
    customerType: '',
    notes: '',
    clientCode: '' // Link to client/prospect
  });

  // Validation state
  const [errors, setErrors] = useState({});

  useEffect(() => {
    loadProducts();
    loadClients();
    // Auto-generate enquiry number
    generateEnquiryNumber();
  }, []);

  const loadClients = async () => {
    try {
      setLoadingClients(true);
      // Load both prospects and regular clients
      const [prospects, regularClients] = await Promise.all([
        getAllProspectsClients(true),
        getAllRegularClients(true)
      ]);
      
      // Combine and format for dropdown
      const allClients = [
        ...prospects.map(c => ({ ...c, type: 'Prospect', displayName: `${c.clientName} (${c.clientCode}) - Prospect` })),
        ...regularClients.map(c => ({ ...c, type: 'Client', displayName: `${c.clientName} (${c.clientCode}) - Client` }))
      ];
      
      setClients(allClients);
    } catch (error) {
      console.error('Error loading clients:', error);
      setSnackbar({
        open: true,
        message: 'Failed to load clients/prospects',
        severity: 'error'
      });
    } finally {
      setLoadingClients(false);
    }
  };

  const handleClientChange = (clientCode) => {
    if (!clientCode) {
      setSelectedClientCode('');
      setSelectedClient(null);
      setClientProducts([]);
      setCreateNewProspect(false);
      return;
    }

    const client = clients.find(c => c.clientCode === clientCode);
    if (client) {
      setSelectedClientCode(clientCode);
      setSelectedClient(client);
      
      // Auto-fill form with client data
      const primaryContact = client.contacts?.find(c => c.isPrimary) || client.contacts?.[0] || {};
      
      setFormData(prev => ({
        ...prev,
        clientCode: clientCode,
        customerName: primaryContact.name || prev.customerName,
        companyName: client.clientName || prev.companyName,
        mobileNumber: primaryContact.number || prev.mobileNumber,
        emailId: primaryContact.email || prev.emailId,
        customerLocation: `${client.city || ''}${client.city && client.state ? ', ' : ''}${client.state || ''}`.trim() || prev.customerLocation,
        customerType: client.businessType || prev.customerType
      }));

      // Load client products
      if (client.products && Array.isArray(client.products) && client.products.length > 0) {
        setClientProducts(client.products);
        // Pre-select client products
        const productCodes = client.products
          .map(p => p.productCode || p.productName)
          .filter(Boolean);
        setFormData(prev => ({
          ...prev,
          productsInterested: productCodes
        }));
      } else {
        setClientProducts([]);
      }
    }
  };

  const generateEnquiryNumber = () => {
    const randomDigits = Math.floor(1000 + Math.random() * 9000);
    const enquiryNumber = `EN${randomDigits}`;
    setFormData(prev => ({
      ...prev,
      enquiryNumber: enquiryNumber
    }));
  };

  const loadProducts = async () => {
    try {
      const productOptions = await salesFlowService.getProducts();
      setProducts(productOptions);
      
      if (productOptions.length === 0) {
        console.warn('No products found. Please ensure products exist in either PRODUCT sheet or CLIENT sheet.');
        setSnackbar({
          open: true,
          message: 'No products found. Please add products to the PRODUCT sheet or CLIENT sheet.',
          severity: 'warning'
        });
      } else {
        console.log(`Loaded ${productOptions.length} products successfully`);
      }
    } catch (error) {
      console.error('Error loading products:', error);
      setSnackbar({
        open: true,
        message: 'Failed to load products. Please try again or check your connection.',
        severity: 'error'
      });
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.customerName.trim()) {
      newErrors.customerName = 'Customer Name is required';
    }

    if (!formData.companyName.trim()) {
      newErrors.companyName = 'Company Name is required';
    }

    if (!formData.emailId.trim()) {
      newErrors.emailId = 'Email ID is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.emailId)) {
      newErrors.emailId = 'Please enter a valid email address';
    }

    if (!formData.mobileNumber.trim()) {
      newErrors.mobileNumber = 'Mobile Number is required';
    }

    if (!formData.requirement.trim()) {
      newErrors.requirement = 'Requirement is required';
    }

    if (!formData.leadAssignedTo) {
      newErrors.leadAssignedTo = 'Lead Assigned To is required';
    }

    if (!formData.customerLocation.trim()) {
      newErrors.customerLocation = 'Customer Location is required';
    }

    if (!formData.customerType) {
      newErrors.customerType = 'Customer Type is required';
    }

    if (!formData.productsInterested || formData.productsInterested.length === 0) {
      newErrors.productsInterested = 'Please select at least one product';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));

    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: ''
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      setSnackbar({
        open: true,
        message: 'Please fix the errors in the form',
        severity: 'error'
      });
      return;
    }

    try {
      setLoading(true);
      
      // Create new prospect if requested and no client selected
      if (createNewProspect && !selectedClientCode) {
        try {
          const newProspect = {
            clientName: formData.companyName,
            clientCode: '', // Will be auto-generated
            businessType: formData.customerType,
            address: formData.customerLocation,
            contacts: [{
              name: formData.customerName,
              email: formData.emailId,
              number: formData.mobileNumber,
              department: 'General',
              designation: 'Contact',
              isPrimary: true
            }],
            products: formData.productsInterested.map(productCode => ({
              productCode: productCode,
              productName: products.find(p => p.value === productCode)?.label || productCode
            })),
            status: 'Prospect',
            notes: formData.notes
          };
          
          await addProspectClient(newProspect);
          setSnackbar({
            open: true,
            message: 'New prospect created successfully!',
            severity: 'success'
          });
          
          // Reload clients to get the new prospect
          await loadClients();
        } catch (error) {
          console.error('Error creating prospect:', error);
          // Continue with lead creation even if prospect creation fails
        }
      }

      // Transform form data to match the expected format
      const leadData = {
        fullName: formData.customerName,
        companyName: formData.companyName,
        email: formData.emailId,
        phoneNumber: formData.mobileNumber,
        productsInterested: formData.productsInterested,
        leadSource: '', // Not used in new format
        priority: 'Medium', // Default value
        qualificationStatus: 'New',
        notes: formData.notes,
        // New fields
        enquiryNumber: formData.enquiryNumber,
        requirement: formData.requirement,
        leadAssignedTo: formData.leadAssignedTo,
        customerLocation: formData.customerLocation,
        customerType: formData.customerType,
        clientCode: formData.clientCode // Link to client/prospect
      };
      
      const result = await salesFlowService.createLead(leadData, user?.email);
      
      setSnackbar({
        open: true,
        message: `Lead created successfully! Enquiry Number: ${formData.enquiryNumber}`,
        severity: 'success'
      });

      // Reset form
      setFormData({
        enquiryNumber: '',
        customerName: '',
        companyName: '',
        mobileNumber: '',
        emailId: '',
        productsInterested: [],
        requirement: '',
        leadAssignedTo: '',
        customerLocation: '',
        customerType: '',
        notes: '',
        clientCode: ''
      });
      setSelectedClientCode('');
      setSelectedClient(null);
      setClientProducts([]);
      setCreateNewProspect(false);

      // Generate new enquiry number
      generateEnquiryNumber();

      // Continue to step 2 (Initial Call) after a short delay
      setTimeout(() => {
        navigate('/sales-flow/initial-call');
      }, 1200);

    } catch (error) {
      console.error('Error creating lead:', error);
      const detail =
        error?.message ||
        error?.details ||
        (typeof error === 'string' ? error : '');
      setSnackbar({
        open: true,
        message: detail
          ? `Failed to create lead: ${detail}`
          : 'Failed to create lead. Please try again.',
        severity: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  const leadAssignedToOptions = [
    { value: 'Sales Executive', label: 'Sales Executive' }
  ];

  const customerTypeOptions = [
    { value: 'New Customer', label: 'New Customer' },
    { value: 'Existing Customer', label: 'Existing Customer' },
    { value: 'Potential Customer', label: 'Potential Customer' },
    { value: 'Distributor', label: 'Distributor' },
    { value: 'OEM', label: 'OEM' },
    { value: 'System Integrator', label: 'System Integrator' }
  ];

  return (
    <Box sx={{ 
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #f8fafc 0%, #e3f2fd 100%)',
      py: 3
    }}>
      <Container maxWidth="xl">
        <Fade in timeout={800}>
          <Box>
            {/* Enhanced Header */}
            <Card sx={{ 
              mb: 4,
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              color: 'white',
              borderRadius: 3,
              boxShadow: '0 20px 60px rgba(0,0,0,0.15)',
              position: 'relative',
              overflow: 'hidden',
              maxWidth: '1400px',
              mx: 'auto',
              '&::before': {
                content: '""',
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                background: 'url("data:image/svg+xml,%3Csvg width="60" height="60" viewBox="0 0 60 60" xmlns="http://www.w3.org/2000/svg"%3E%3Cg fill="none" fill-rule="evenodd"%3E%3Cg fill="%23ffffff" fill-opacity="0.05"%3E%3Ccircle cx="30" cy="30" r="2"/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")',
                opacity: 0.3
              }
            }}>
              <CardContent sx={{ p: 4, position: 'relative', zIndex: 1 }}>
                <Box display="flex" alignItems="center" justifyContent="space-between">
                  <Box display="flex" alignItems="center" gap={3}>
                    <Tooltip title="Back to Sales Flow">
                      <IconButton
                        onClick={() => navigate('/sales-flow')}
                        sx={{ 
                          color: 'white',
                          backgroundColor: 'rgba(255,255,255,0.1)',
                          '&:hover': {
                            backgroundColor: 'rgba(255,255,255,0.2)',
                            transform: 'translateX(-3px)'
                          },
                          transition: 'all 0.3s ease'
                        }}
                      >
                        <ArrowBack />
                      </IconButton>
                    </Tooltip>
                    
                    <Box display="flex" alignItems="center" gap={2}>
                      <Box sx={{
                        width: 60,
                        height: 60,
                        borderRadius: '50%',
                        background: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        boxShadow: '0 8px 32px rgba(250, 112, 154, 0.4)',
                        position: 'relative',
                        '&::after': {
                          content: '""',
                          position: 'absolute',
                          top: -2,
                          left: -2,
                          right: -2,
                          bottom: -2,
                          borderRadius: '50%',
                          background: 'linear-gradient(135deg, #667eea, #764ba2, #f093fb)',
                          zIndex: -1,
                          opacity: 0.7
                        }
                      }}>
                        <Diamond sx={{ fontSize: 28, color: 'white' }} />
                      </Box>
                      <Box>
                        <Typography variant="h3" sx={{ 
                          fontWeight: 800,
                          background: 'linear-gradient(135deg, #ffffff 0%, #f0f0f0 100%)',
                          backgroundClip: 'text',
                          WebkitBackgroundClip: 'text',
                          WebkitTextFillColor: 'transparent',
                          textShadow: '0 4px 8px rgba(0,0,0,0.1)',
                          mb: 1
                        }}>
                          Log & Qualify Leads
                        </Typography>
                        <Typography variant="h6" sx={{ 
                          opacity: 0.9,
                          fontWeight: 300,
                          color: 'rgba(255,255,255,0.9)'
                        }}>
                          Create and qualify new sales leads
                        </Typography>
                      </Box>
                    </Box>
                  </Box>
                  
                  <Box sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1,
                    px: 3,
                    py: 1.5,
                    background: 'rgba(255,255,255,0.1)',
                    borderRadius: 3,
                    border: '1px solid rgba(255,255,255,0.2)',
                    backdropFilter: 'blur(10px)'
                  }}>
                    <WorkspacePremium sx={{ color: '#fee140', fontSize: 20 }} />
                    <Typography variant="body2" sx={{ fontWeight: 600, color: 'white' }}>
                      Step 1
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>

            {/* Enhanced Form */}
            <Card sx={{ 
              borderRadius: 3,
              boxShadow: '0 20px 60px rgba(0,0,0,0.1)',
              overflow: 'hidden',
              background: 'white',
              maxWidth: '1400px',
              mx: 'auto'
            }}>
              <CardContent sx={{ p: 0 }}>
                {/* Form Header */}
                <Box sx={{ 
                  p: 4, 
                  borderBottom: '1px solid #e0e0e0',
                  backgroundColor: '#f8f9fa'
                }}>
                  <Box display="flex" alignItems="center" gap={2}>
                    <Person sx={{ fontSize: 28, color: '#1976d2' }} />
                    <Box>
                      <Typography variant="h5" sx={{ fontWeight: 700, color: '#1976d2', mb: 0.5 }}>
                        Lead Information
                      </Typography>
                      <Typography variant="body2" sx={{ color: 'text.secondary', fontWeight: 400 }}>
                        Create and qualify new sales leads
                      </Typography>
                    </Box>
                  </Box>
                </Box>

                <form onSubmit={handleSubmit}>
                  <Box sx={{ p: 4 }}>
                    <Grid container spacing={3}>
                      {/* Client/Prospect Selection Section */}
                      <Grid item xs={12}>
                        <Box sx={{ 
                          p: 2.5, 
                          mb: 3, 
                          backgroundColor: '#f8f9fa', 
                          borderRadius: 2,
                          border: '1px solid #e0e0e0'
                        }}>
                          <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
                            <Box display="flex" alignItems="center" gap={1.5}>
                              <AccountCircle sx={{ fontSize: 22, color: '#1976d2' }} />
                              <Typography variant="subtitle1" sx={{ fontWeight: 600, color: '#1976d2' }}>
                                Client/Prospect Selection (Optional)
                              </Typography>
                            </Box>
                            <Tooltip title="Refresh Clients List">
                              <IconButton
                                size="small"
                                onClick={loadClients}
                                disabled={loadingClients}
                                sx={{
                                  color: '#667eea',
                                  '&:hover': {
                                    backgroundColor: 'rgba(102, 126, 234, 0.1)'
                                  }
                                }}
                              >
                                {loadingClients ? <CircularProgress size={20} /> : <Refresh fontSize="small" />}
                              </IconButton>
                            </Tooltip>
                          </Box>
                          <Grid container spacing={2}>
                            <Grid item xs={12} md={6}>
                              <FormControl fullWidth size="small">
                                <InputLabel id="client-select-label">Select Existing Client/Prospect</InputLabel>
                                <Select
                                  labelId="client-select-label"
                                  value={selectedClientCode}
                                  onChange={(e) => handleClientChange(e.target.value)}
                                  label="Select Existing Client/Prospect"
                                  disabled={loadingClients}
                                  sx={{
                                    borderRadius: 2,
                                    '& .MuiOutlinedInput-notchedOutline': {
                                      borderColor: '#e0e0e0'
                                    },
                                    '&:hover .MuiOutlinedInput-notchedOutline': {
                                      borderColor: '#667eea'
                                    },
                                    '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                                      borderColor: '#667eea',
                                      borderWidth: 2
                                    }
                                  }}
                                >
                                  <MenuItem value="">
                                    <em>None - Create New Lead</em>
                                  </MenuItem>
                                  {clients.map((client) => (
                                    <MenuItem key={client.clientCode} value={client.clientCode}>
                                      <Box display="flex" alignItems="center" gap={1} width="100%">
                                        <Chip 
                                          label={client.type} 
                                          size="small" 
                                          color={client.type === 'Client' ? 'primary' : 'secondary'}
                                          sx={{ height: 20, fontSize: '0.7rem' }}
                                        />
                                        <Typography variant="body2" sx={{ flex: 1, fontWeight: 600 }}>
                                          {client.clientCode}
                                        </Typography>
                                      </Box>
                                    </MenuItem>
                                  ))}
                                </Select>
                              </FormControl>
                            </Grid>
                            <Grid item xs={12} md={6}>
                              <Box display="flex" alignItems="center" gap={2} height="100%">
                                <Button
                                  variant="outlined"
                                  size="small"
                                  startIcon={<Add />}
                                  onClick={() => {
                                    setCreateNewProspect(!createNewProspect);
                                    if (!createNewProspect) {
                                      setSelectedClientCode('');
                                      setSelectedClient(null);
                                    }
                                  }}
                                  sx={{
                                    borderRadius: 2,
                                    borderColor: createNewProspect ? '#667eea' : '#e0e0e0',
                                    color: createNewProspect ? '#667eea' : 'text.secondary',
                                    '&:hover': {
                                      borderColor: '#667eea',
                                      backgroundColor: 'rgba(102, 126, 234, 0.04)'
                                    }
                                  }}
                                >
                                  {createNewProspect ? 'Cancel' : 'Create New Prospect'}
                                </Button>
                                {selectedClient && (
                                  <Chip
                                    label={selectedClient.clientCode}
                                    size="small"
                                    color={selectedClient.type === 'Client' ? 'primary' : 'secondary'}
                                    icon={<AccountCircle />}
                                  />
                                )}
                              </Box>
                            </Grid>
                          </Grid>
                          {selectedClient && clientProducts.length > 0 && (
                            <Alert severity="info" sx={{ mt: 2, borderRadius: 2 }}>
                              <Typography variant="caption" sx={{ fontWeight: 600, display: 'block', mb: 0.5 }}>
                                Client Products: {clientProducts.map(p => p.productName || p.productCode).join(', ')}
                              </Typography>
                            </Alert>
                          )}
                        </Box>
                      </Grid>

                      {/* Basic Information Section */}
                      <Grid item xs={12}>
                        <Box sx={{ 
                          p: 2.5, 
                          mb: 3, 
                          backgroundColor: '#f8f9fa', 
                          borderRadius: 2,
                          border: '1px solid #e0e0e0'
                        }}>
                          <Box display="flex" alignItems="center" gap={1.5} mb={3}>
                            <Person sx={{ fontSize: 22, color: '#1976d2' }} />
                            <Typography variant="subtitle1" sx={{ fontWeight: 600, color: '#1976d2' }}>
                              Basic Information
                            </Typography>
                          </Box>
                          <Grid container spacing={3}>
                            {/* Row 1: Enquiry Number, Customer Name, Company Name */}
                            <Grid item xs={12} md={4}>
                              <TextField
                                fullWidth
                                size="small"
                                label="Enquiry Number"
                                value={formData.enquiryNumber}
                                InputProps={{
                                  readOnly: true,
                                  startAdornment: (
                                    <Diamond sx={{ mr: 1, color: 'text.secondary', fontSize: 18 }} />
                                  )
                                }}
                                helperText="Code will be auto-generated"
                                sx={{
                                  '& .MuiOutlinedInput-root': {
                                    borderRadius: 2,
                                    backgroundColor: '#f5f5f5',
                                    '& .MuiOutlinedInput-input': {
                                      color: '#1976d2',
                                      fontWeight: 600
                                    }
                                  }
                                }}
                              />
                            </Grid>

                            <Grid item xs={12} md={4}>
                              <TextField
                                fullWidth
                                size="small"
                                label="Customer Name *"
                                value={formData.customerName}
                                onChange={(e) => handleInputChange('customerName', e.target.value)}
                                error={!!errors.customerName}
                                helperText={errors.customerName}
                                required
                                InputProps={{
                                  startAdornment: (
                                    <Person sx={{ mr: 1, color: 'text.secondary', fontSize: 18 }} />
                                  )
                                }}
                                sx={{
                                  '& .MuiOutlinedInput-root': {
                                    borderRadius: 2,
                                    '&:hover .MuiOutlinedInput-notchedOutline': {
                                      borderColor: '#667eea'
                                    },
                                    '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                                      borderColor: '#667eea',
                                      borderWidth: 2
                                    }
                                  }
                                }}
                              />
                            </Grid>

                            <Grid item xs={12} md={4}>
                              <TextField
                                fullWidth
                                size="small"
                                label="Company Name *"
                                value={formData.companyName}
                                onChange={(e) => handleInputChange('companyName', e.target.value)}
                                error={!!errors.companyName}
                                helperText={errors.companyName}
                                required
                                InputProps={{
                                  startAdornment: (
                                    <Business sx={{ mr: 1, color: 'text.secondary', fontSize: 18 }} />
                                  )
                                }}
                                sx={{
                                  '& .MuiOutlinedInput-root': {
                                    borderRadius: 2,
                                    '&:hover .MuiOutlinedInput-notchedOutline': {
                                      borderColor: '#667eea'
                                    },
                                    '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                                      borderColor: '#667eea',
                                      borderWidth: 2
                                    }
                                  }
                                }}
                              />
                            </Grid>
                          </Grid>
                        </Box>
                      </Grid>

                      {/* Contact Information Section */}
                      <Grid item xs={12}>
                        <Box sx={{ 
                          p: 2.5, 
                          mb: 3, 
                          backgroundColor: '#f8f9fa', 
                          borderRadius: 2,
                          border: '1px solid #e0e0e0'
                        }}>
                          <Box display="flex" alignItems="center" gap={1.5} mb={3}>
                            <Phone sx={{ fontSize: 22, color: '#1976d2' }} />
                            <Typography variant="subtitle1" sx={{ fontWeight: 600, color: '#1976d2' }}>
                              Contact Information
                            </Typography>
                          </Box>
                          <Grid container spacing={3}>
                            <Grid item xs={12} md={4}>
                              <TextField
                                fullWidth
                                size="small"
                                label="Mobile Number *"
                                value={formData.mobileNumber}
                                onChange={(e) => handleInputChange('mobileNumber', e.target.value)}
                                error={!!errors.mobileNumber}
                                helperText={errors.mobileNumber}
                                required
                                InputProps={{
                                  startAdornment: (
                                    <Phone sx={{ mr: 1, color: 'text.secondary', fontSize: 18 }} />
                                  )
                                }}
                                sx={{
                                  '& .MuiOutlinedInput-root': {
                                    borderRadius: 2,
                                    '&:hover .MuiOutlinedInput-notchedOutline': {
                                      borderColor: '#667eea'
                                    },
                                    '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                                      borderColor: '#667eea',
                                      borderWidth: 2
                                    }
                                  }
                                }}
                              />
                            </Grid>

                            <Grid item xs={12} md={4}>
                              <TextField
                                fullWidth
                                size="small"
                                label="Email ID *"
                                type="email"
                                value={formData.emailId}
                                onChange={(e) => handleInputChange('emailId', e.target.value)}
                                error={!!errors.emailId}
                                helperText={errors.emailId}
                                required
                                InputProps={{
                                  startAdornment: (
                                    <Email sx={{ mr: 1, color: 'text.secondary', fontSize: 18 }} />
                                  )
                                }}
                                sx={{
                                  '& .MuiOutlinedInput-root': {
                                    borderRadius: 2,
                                    '&:hover .MuiOutlinedInput-notchedOutline': {
                                      borderColor: '#667eea'
                                    },
                                    '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                                      borderColor: '#667eea',
                                      borderWidth: 2
                                    }
                                  }
                                }}
                              />
                            </Grid>

                            <Grid item xs={12} md={4}>
                              <TextField
                                fullWidth
                                size="small"
                                label="Customer Location *"
                                value={formData.customerLocation}
                                onChange={(e) => handleInputChange('customerLocation', e.target.value)}
                                error={!!errors.customerLocation}
                                helperText={errors.customerLocation}
                                required
                                placeholder="Type or select location"
                                InputProps={{
                                  startAdornment: (
                                    <LocationOn sx={{ mr: 1, color: 'text.secondary', fontSize: 18 }} />
                                  )
                                }}
                                sx={{
                                  '& .MuiOutlinedInput-root': {
                                    borderRadius: 2,
                                    '&:hover .MuiOutlinedInput-notchedOutline': {
                                      borderColor: '#667eea'
                                    },
                                    '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                                      borderColor: '#667eea',
                                      borderWidth: 2
                                    }
                                  }
                                }}
                              />
                            </Grid>
                          </Grid>
                        </Box>
                      </Grid>

                      {/* Assignment & Classification Section */}
                      <Grid item xs={12}>
                        <Box sx={{ 
                          p: 2.5, 
                          mb: 3, 
                          backgroundColor: '#f8f9fa', 
                          borderRadius: 2,
                          border: '1px solid #e0e0e0'
                        }}>
                          <Box display="flex" alignItems="center" gap={1.5} mb={3}>
                            <Assignment sx={{ fontSize: 22, color: '#1976d2' }} />
                            <Typography variant="subtitle1" sx={{ fontWeight: 600, color: '#1976d2' }}>
                              Assignment & Classification
                            </Typography>
                          </Box>
                          <Grid container spacing={3}>
                            <Grid item xs={12} md={6}>
                              <FormControl fullWidth size="small" error={!!errors.customerType}>
                                <InputLabel id="customer-type-label">Customer Type *</InputLabel>
                                <Select
                                  labelId="customer-type-label"
                                  value={formData.customerType}
                                  onChange={(e) => handleInputChange('customerType', e.target.value)}
                                  label="Customer Type *"
                                  sx={{
                                    borderRadius: 2,
                                    '& .MuiOutlinedInput-notchedOutline': {
                                      borderColor: errors.customerType ? '#d32f2f' : '#e0e0e0'
                                    },
                                    '&:hover .MuiOutlinedInput-notchedOutline': {
                                      borderColor: '#667eea'
                                    },
                                    '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                                      borderColor: '#667eea',
                                      borderWidth: 2
                                    }
                                  }}
                                >
                                  {customerTypeOptions.map((option) => (
                                    <MenuItem key={option.value} value={option.value}>
                                      {option.label}
                                    </MenuItem>
                                  ))}
                                </Select>
                                {errors.customerType && (
                                  <Typography variant="caption" color="error" sx={{ mt: 0.5, ml: 1.75, display: 'block' }}>
                                    {errors.customerType}
                                  </Typography>
                                )}
                              </FormControl>
                            </Grid>

                            <Grid item xs={12} md={6}>
                              <FormControl fullWidth size="small" error={!!errors.leadAssignedTo}>
                                <InputLabel id="lead-assigned-label">Lead Assigned To *</InputLabel>
                                <Select
                                  labelId="lead-assigned-label"
                                  value={formData.leadAssignedTo}
                                  onChange={(e) => handleInputChange('leadAssignedTo', e.target.value)}
                                  label="Lead Assigned To *"
                                  sx={{
                                    borderRadius: 2,
                                    '& .MuiOutlinedInput-notchedOutline': {
                                      borderColor: errors.leadAssignedTo ? '#d32f2f' : '#e0e0e0'
                                    },
                                    '&:hover .MuiOutlinedInput-notchedOutline': {
                                      borderColor: '#667eea'
                                    },
                                    '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                                      borderColor: '#667eea',
                                      borderWidth: 2
                                    }
                                  }}
                                >
                                  {leadAssignedToOptions.map((option) => (
                                    <MenuItem key={option.value} value={option.value}>
                                      {option.label}
                                    </MenuItem>
                                  ))}
                                </Select>
                                {errors.leadAssignedTo && (
                                  <Typography variant="caption" color="error" sx={{ mt: 0.5, ml: 1.75, display: 'block' }}>
                                    {errors.leadAssignedTo}
                                  </Typography>
                                )}
                              </FormControl>
                            </Grid>
                          </Grid>
                        </Box>
                      </Grid>

                      {/* Products Interested Section */}
                      <Grid item xs={12}>
                        <Box sx={{ 
                          p: 2.5, 
                          mb: 3, 
                          backgroundColor: '#f8f9fa', 
                          borderRadius: 2,
                          border: '1px solid #e0e0e0'
                        }}>
                          <Box display="flex" alignItems="center" gap={1.5} mb={3}>
                            <ShoppingCart sx={{ fontSize: 22, color: '#1976d2' }} />
                            <Typography variant="subtitle1" sx={{ fontWeight: 600, color: '#1976d2' }}>
                              Products Interested
                            </Typography>
                          </Box>
                          <FormControl fullWidth size="small" error={!!errors.productsInterested}>
                            <InputLabel>Products Interested In *</InputLabel>
                            <Select
                              multiple
                              value={formData.productsInterested}
                              onChange={(e) => handleInputChange('productsInterested', e.target.value)}
                              input={<OutlinedInput label="Products Interested In *" />}
                              renderValue={(selected) => (
                                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                                  {selected.map((value) => {
                                    const product = products.find(p => p.value === value);
                                    return (
                                      <Chip 
                                        key={value} 
                                        label={product ? product.label : value}
                                        size="small"
                                        sx={{
                                          backgroundColor: '#667eea',
                                          color: 'white',
                                          '& .MuiChip-deleteIcon': {
                                            color: 'white'
                                          }
                                        }}
                                      />
                                    );
                                  })}
                                </Box>
                              )}
                              sx={{
                                borderRadius: 2,
                                '& .MuiOutlinedInput-notchedOutline': {
                                  borderColor: errors.productsInterested ? '#d32f2f' : '#e0e0e0'
                                },
                                '&:hover .MuiOutlinedInput-notchedOutline': {
                                  borderColor: '#667eea'
                                },
                                '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                                  borderColor: '#667eea',
                                  borderWidth: 2
                                }
                              }}
                            >
                              {products.map((product) => (
                                <MenuItem key={product.value} value={product.value}>
                                  <Box display="flex" alignItems="center" gap={1}>
                                    <ShoppingCart sx={{ fontSize: 16, color: 'text.secondary' }} />
                                    {product.label}
                                  </Box>
                                </MenuItem>
                              ))}
                            </Select>
                            {errors.productsInterested && (
                              <Typography variant="caption" color="error" sx={{ mt: 0.5, ml: 1.75, display: 'block' }}>
                                {errors.productsInterested}
                              </Typography>
                            )}
                            {selectedClient && clientProducts.length > 0 && (
                              <Typography variant="caption" sx={{ mt: 0.5, ml: 1.75, display: 'block', color: 'info.main' }}>
                                Client products are pre-selected. You can add more products from the list above.
                              </Typography>
                            )}
                          </FormControl>
                        </Box>
                      </Grid>

                      {/* Details Section */}
                      <Grid item xs={12}>
                        <Box sx={{ 
                          p: 2.5, 
                          mb: 3, 
                          backgroundColor: '#f8f9fa', 
                          borderRadius: 2,
                          border: '1px solid #e0e0e0'
                        }}>
                          <Box display="flex" alignItems="center" gap={1.5} mb={3}>
                            <Notes sx={{ fontSize: 22, color: '#1976d2' }} />
                            <Typography variant="subtitle1" sx={{ fontWeight: 600, color: '#1976d2' }}>
                              Details
                            </Typography>
                          </Box>
                          <Grid container spacing={3}>
                            <Grid item xs={12}>
                              <TextField
                                fullWidth
                                size="small"
                                label="Requirement *"
                                multiline
                                rows={4}
                                value={formData.requirement}
                                onChange={(e) => handleInputChange('requirement', e.target.value)}
                                error={!!errors.requirement}
                                helperText={errors.requirement}
                                required
                                placeholder="Describe the customer's requirement in detail..."
                                InputProps={{
                                  startAdornment: (
                                    <Notes sx={{ mr: 1, color: 'text.secondary', mt: 1, alignSelf: 'flex-start', fontSize: 18 }} />
                                  )
                                }}
                                sx={{
                                  '& .MuiOutlinedInput-root': {
                                    borderRadius: 2,
                                    '&:hover .MuiOutlinedInput-notchedOutline': {
                                      borderColor: '#667eea'
                                    },
                                    '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                                      borderColor: '#667eea',
                                      borderWidth: 2
                                    }
                                  }
                                }}
                              />
                            </Grid>

                            <Grid item xs={12}>
                              <TextField
                                fullWidth
                                size="small"
                                label="Notes"
                                multiline
                                rows={4}
                                value={formData.notes}
                                onChange={(e) => handleInputChange('notes', e.target.value)}
                                placeholder="Additional notes about the lead..."
                                InputProps={{
                                  startAdornment: (
                                    <Notes sx={{ mr: 1, color: 'text.secondary', mt: 1, alignSelf: 'flex-start', fontSize: 18 }} />
                                  )
                                }}
                                sx={{
                                  '& .MuiOutlinedInput-root': {
                                    borderRadius: 2,
                                    '&:hover .MuiOutlinedInput-notchedOutline': {
                                      borderColor: '#667eea'
                                    },
                                    '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                                      borderColor: '#667eea',
                                      borderWidth: 2
                                    }
                                  }
                                }}
                              />
                            </Grid>
                          </Grid>
                        </Box>
                      </Grid>

                    </Grid>
                  </Box>

                  {/* Action Buttons Section */}
                  <Box sx={{ 
                    p: 3, 
                    borderTop: '1px solid #e0e0e0',
                    backgroundColor: '#f8f9fa',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}>
                    <Box display="flex" alignItems="center" gap={1}>
                      <TrendingUp sx={{ fontSize: 18, color: 'text.secondary' }} />
                      <Typography variant="body2" sx={{ color: 'text.secondary', fontWeight: 500 }}>
                        All fields marked with * are required
                      </Typography>
                    </Box>
                    
                    <Box display="flex" gap={2}>
                      {/* WhatsApp Button - Send update after creating lead */}
                      {formData.enquiryNumber && (
                        <WhatsAppButton
                          task={{
                            POId: formData.enquiryNumber,
                            DispatchUniqueId: formData.enquiryNumber,
                            ClientCode: formData.clientCode || formData.customerName,
                            ClientName: formData.customerName,
                            Status: 'NEW',
                            Email: formData.emailId,
                            PhoneNumber: formData.mobileNumber
                          }}
                          stageName="LOG_AND_QUALIFY_LEADS"
                          status="NEW"
                          size="small"
                          variant="icon"
                        />
                      )}
                      <Button
                        variant="outlined"
                        onClick={() => navigate('/sales-flow')}
                        disabled={loading}
                        startIcon={<Cancel />}
                        sx={{
                          borderRadius: 2,
                          px: 3,
                          py: 1,
                          minWidth: 100,
                          borderColor: '#e0e0e0',
                          color: 'text.secondary',
                          fontWeight: 600,
                          '&:hover': {
                            borderColor: '#d32f2f',
                            backgroundColor: 'rgba(211, 47, 47, 0.04)',
                            color: '#d32f2f'
                          }
                        }}
                      >
                        Cancel
                      </Button>
                      <Button
                        type="submit"
                        variant="contained"
                        startIcon={loading ? <CircularProgress size={18} color="inherit" /> : <AutoAwesome />}
                        disabled={loading}
                        sx={{
                          background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
                          color: 'white',
                          fontWeight: 700,
                          px: 4,
                          py: 1,
                          minWidth: 140,
                          borderRadius: 2,
                          boxShadow: '0 4px 16px rgba(79, 172, 254, 0.4)',
                          transition: 'all 0.3s ease',
                          '&:hover': {
                            transform: 'translateY(-2px)',
                            boxShadow: '0 8px 24px rgba(79, 172, 254, 0.6)',
                            background: 'linear-gradient(135deg, #00f2fe 0%, #4facfe 100%)'
                          },
                          '&:disabled': {
                            background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
                            opacity: 0.7
                          }
                        }}
                      >
                        {loading ? 'Creating...' : 'Create Lead'}
                      </Button>
                    </Box>
                  </Box>
                </form>
              </CardContent>
            </Card>

            {/* Enhanced Snackbar */}
            <Snackbar
              open={snackbar.open}
              autoHideDuration={6000}
              onClose={() => setSnackbar({ ...snackbar, open: false })}
              anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
            >
              <Alert 
                onClose={() => setSnackbar({ ...snackbar, open: false })} 
                severity={snackbar.severity}
                sx={{ 
                  borderRadius: 2,
                  boxShadow: '0 8px 32px rgba(0,0,0,0.1)'
                }}
              >
                {snackbar.message}
              </Alert>
            </Snackbar>
          </Box>
        </Fade>
      </Container>
    </Box>
  );
};

export default LogAndQualifyLeads; 