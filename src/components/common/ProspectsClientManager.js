import React, { useState, useEffect, useMemo, useCallback, memo } from 'react';
import {
  Box, Button, Dialog, DialogTitle, DialogContent, DialogActions, TextField, Typography, IconButton, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Divider, Grid, Container, Chip, Alert, Card, CardContent, FormControl, InputLabel, Select, MenuItem, Stepper, Step, StepLabel, Fade, Zoom, Tooltip, Pagination, InputAdornment, Tabs, Tab, Badge
} from '@mui/material';
import { 
  Add, Edit, Delete, Save, Cancel, Business, Person, Email, Phone, 
  LocationOn, AccountBalance, Receipt, Schedule, AttachMoney, 
  Category, Inventory, LocalShipping, Payment, Description,
  CheckCircle, Warning, Info, Star, TrendingUp, Group, Search, 
  FilterList, ViewList, ViewModule, Refresh, Download, ExpandMore, ExpandLess, ArrowForward
} from '@mui/icons-material';
import { DatePicker, LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { getAllClients, addClient, updateClient, deleteClient } from '../../services/prospectsClientService';
import { addClient as addClientToRegularClients, getAllClients as getAllRegularClients, generateSequentialClientCode } from '../../services/clientService';
import { generateProductCode, generateClientSpecificProductCode, validateProductCode } from '../../utils/productCodeUtils';
import ClientDashboardModal from '../crm/ClientDashboardModal';

const emptyClient = {
  // Basic Information
  clientName: '',
  clientCode: '',
  businessType: '',
  
  // Contact Information
  address: '',
  city: '',
  state: '',
  stateCode: '',
  pincode: '',
  country: 'India',
  
  // Business Details
  gstin: '',
  panNumber: '',
  accountCode: '',
  website: '',
  
  // Contact Management
  contacts: [{ 
    name: '', 
    email: '', 
    number: '', 
    department: '', 
    designation: '',
    isPrimary: false 
  }],
  
  // Business Terms
  paymentTerms: '',
  creditLimit: '',
  creditPeriod: '',
  deliveryTerms: '',
  
  // Product Information
  products: [{ 
    productCode: '', 
    productName: '', 
    category: '', 
    description: '' 
  }],
  
  // Additional Information
  notes: '',
  status: 'Active',
  rating: 0,
  lastContactDate: '',
  totalOrders: 0,
  totalValue: 0
};

const ProspectsClientManager = () => {
  const [clients, setClients] = useState([]);
  const [open, setOpen] = useState(false);
  const [editIndex, setEditIndex] = useState(null);
  const [originalClientCode, setOriginalClientCode] = useState(null);
  const [form, setForm] = useState(emptyClient);
  const [error, setError] = useState(null);
  const [contactSectionCollapsed, setContactSectionCollapsed] = useState(false);
  const [productsSectionCollapsed, setProductsSectionCollapsed] = useState(false);
  const [activeStep, setActiveStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [isConvertingToClient, setIsConvertingToClient] = useState(false);
  
  // Product code auto-generation state
  const [productCodeAutoGenerate, setProductCodeAutoGenerate] = useState({});
  
  // Pagination and search state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [sortBy, setSortBy] = useState('clientName');
  const [sortOrder, setSortOrder] = useState('asc');
  const [viewMode, setViewMode] = useState('table'); // 'table' or 'card'
  
  // Client Dashboard Modal state
  const [openClientDashboard, setOpenClientDashboard] = useState(false);
  const [selectedClientForDashboard, setSelectedClientForDashboard] = useState(null);

  // Form steps for better organization
  const steps = [
    'Basic Information',
    'Contact Details', 
    'Business Information',
    'Contact Management',
    'Business Terms',
    'Products & Services',
    'Additional Information'
  ];

  // Validation functions
  const validateGSTIN = (gstin) => {
    if (!gstin) return true; // Optional field
    const gstinRegex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
    return gstinRegex.test(gstin);
  };

  const validatePAN = (pan) => {
    if (!pan) return true; // Optional field
    const panRegex = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;
    return panRegex.test(pan);
  };

  const validateEmail = (email) => {
    if (!email) return true; // Optional field
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const generateClientCode = (existingClients) => {
    const max = existingClients.reduce((acc, c) => {
      const match = c.clientCode && c.clientCode.match(/^PC(\d{4})$/);
      if (match) {
        const num = parseInt(match[1], 10);
        return num > acc ? num : acc;
      }
      return acc;
    }, 0); // Start from 0 so next will be 1
    const next = (max + 1).toString().padStart(4, '0');
    return `PC${next}`;
  };

  const loadClients = useCallback(async () => {
    try {
      setLoading(true);
      const data = await getAllClients();
      setClients(data);
    } catch (err) {
      setError('Failed to load clients');

    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadClients();
  }, [loadClients]);

  // Debounced search term to prevent excessive filtering
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState(searchTerm);
  
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 300); // 300ms debounce

    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Optimized filter and search logic with useMemo
  const filteredClients = useMemo(() => {
    let filtered = [...clients];

    // Search filter
    if (debouncedSearchTerm) {
      const searchLower = debouncedSearchTerm.toLowerCase();
      filtered = filtered.filter(client => 
        client.clientName?.toLowerCase().includes(searchLower) ||
        client.clientCode?.toLowerCase().includes(searchLower) ||
        client.city?.toLowerCase().includes(searchLower) ||
        client.state?.toLowerCase().includes(searchLower) ||
        client.gstin?.toLowerCase().includes(searchLower) ||
        client.contacts?.some(contact => 
          contact.name?.toLowerCase().includes(searchLower) ||
          contact.email?.toLowerCase().includes(searchLower)
        )
      );
    }

    // Status filter
    if (statusFilter !== 'All') {
      filtered = filtered.filter(client => client.status === statusFilter);
    }

    // Sort
    filtered.sort((a, b) => {
      let aVal = a[sortBy];
      let bVal = b[sortBy];
      
      if (typeof aVal === 'string') {
        aVal = aVal.toLowerCase();
        bVal = bVal.toLowerCase();
      }
      
      if (sortOrder === 'asc') {
        return aVal > bVal ? 1 : -1;
      } else {
        return aVal < bVal ? 1 : -1;
      }
    });

    return filtered;
  }, [clients, debouncedSearchTerm, statusFilter, sortBy, sortOrder]);

  // Reset to first page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedSearchTerm, statusFilter]);

  // Optimized pagination logic with useMemo
  const { totalPages, currentClients, startIndex, endIndex } = useMemo(() => {
    const totalPages = Math.ceil(filteredClients.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const currentClients = filteredClients.slice(startIndex, endIndex);
    return { totalPages, currentClients, startIndex, endIndex };
  }, [filteredClients, currentPage, itemsPerPage]);

  const handleOpen = useCallback(async (client, idx, isConversion = false) => {
    setIsConvertingToClient(isConversion);
    if (client) {
      const baseForm = { ...client };
      // If converting to regular client, pre-generate sequential C-code for dialog display
      if (isConversion) {
        try {
          const newCode = await generateSequentialClientCode();
          baseForm.clientCode = newCode;
        } catch (e) {
          // fall back to existing code if generation fails
        }
      }
      setForm(baseForm);
      setOriginalClientCode(client.clientCode); // Store original prospect code for deletion
    } else {
      // For new prospect clients, auto-generate prospect code (PC + 4 digits)
      const newForm = { ...emptyClient };
      const generatedCode = generateClientCode(clients);
      newForm.clientCode = generatedCode;
      setForm(newForm);
      setOriginalClientCode(null);
    }
    
    // Reset product code auto-generation state
    setProductCodeAutoGenerate({});
    
    setEditIndex(idx);
    setActiveStep(0);
    setOpen(true);
  }, [clients]);

  const handleClose = useCallback(() => {
    setOpen(false);
    setEditIndex(null);
    setOriginalClientCode(null);
    setForm(emptyClient);
    setError(null);
    setActiveStep(0);
    setProductCodeAutoGenerate({});
    setIsConvertingToClient(false);
  }, []);

  const handleChange = useCallback((e) => {
    const { name, value } = e.target;
    let formattedValue = value;

    // Auto-format GSTIN
    if (name === 'gstin') {
      formattedValue = value.toUpperCase().replace(/[^0-9A-Z]/g, '');
    }

    // Auto-format PAN
    if (name === 'panNumber') {
      formattedValue = value.toUpperCase().replace(/[^0-9A-Z]/g, '');
    }

    // Auto-format State Code
    if (name === 'stateCode') {
      formattedValue = value.replace(/[^0-9]/g, '').slice(0, 2);
    }

    setForm(prev => ({ ...prev, [name]: formattedValue }));
  }, []);

  const handleDateChange = useCallback((date, field) => {
    setForm(prev => ({ ...prev, [field]: date ? new Date(date).toISOString().slice(0, 10) : '' }));
  }, []);

  const handleNext = useCallback(() => {
    setActiveStep((prevStep) => prevStep + 1);
  }, []);

  const handleBack = useCallback(() => {
    setActiveStep((prevStep) => prevStep - 1);
  }, []);

  const isStepAccessible = (stepIndex) => {
    // In edit mode, all steps are accessible
    if (editIndex !== null) {
      return true;
    }
    
    // In add mode, only allow navigation to:
    // 1. Current step
    // 2. Previous completed steps
    // 3. Next step if current step is completed
    if (stepIndex <= activeStep) {
      return true; // Can go back to previous steps
    }
    
    // Can only go to next step if current step is completed
    return stepIndex === activeStep + 1 && isCurrentStepCompleted();
  };

  const isCurrentStepCompleted = () => {
    switch (activeStep) {
      case 0: // Basic Information
        return form.clientCode && form.clientCode.trim() !== ''; // Only client code is mandatory
      case 1: // Contact Details
        return true; // All fields are optional
      case 2: // Business Information
        return true; // All fields are optional in this step
      case 3: // Contact Management
        return true; // All fields are optional
      case 4: // Business Terms
        return true; // All fields are optional
      case 5: // Products & Services
        return true; // All fields are optional
      case 6: // Additional Information
        return true; // This step is optional, so always considered completed
      default:
        return false;
    }
  };

  const handleStepClick = useCallback((stepIndex) => {
    if (isStepAccessible(stepIndex)) {
      setActiveStep(stepIndex);
    }
  }, [isStepAccessible]);

  // Contacts
  const handleContactChange = useCallback((idx, e) => {
    const updated = [...form.contacts];
    updated[idx][e.target.name] = e.target.value;
    setForm(prev => ({ ...prev, contacts: updated }));
  }, [form.contacts]);

  const addContact = useCallback(() => setForm(prev => ({ 
    ...prev, 
    contacts: [...prev.contacts, { 
      name: '', 
      email: '', 
      number: '', 
      department: '', 
      designation: '',
      isPrimary: false 
    }] 
  })), []);

  const removeContact = useCallback((idx) => setForm(prev => ({ 
    ...prev, 
    contacts: prev.contacts.filter((_, i) => i !== idx) 
  })), []);

  const setPrimaryContact = useCallback((idx) => {
    setForm(prev => {
      const updated = prev.contacts.map((contact, i) => ({
        ...contact,
        isPrimary: i === idx
      }));
      return { ...prev, contacts: updated };
    });
  }, []);

  // Products
  const handleProductChange = useCallback((idx, e) => {
    const updated = [...form.products];
    updated[idx][e.target.name] = e.target.value;
    setForm(prev => ({ ...prev, products: updated }));
  }, [form.products]);

  const addProduct = useCallback(() => {
    const newProductIndex = form.products.length;
    const newProduct = { 
      productCode: '', 
      productName: '', 
      category: '', 
      description: '' 
    };
    
    // Auto-generate product code for new product
    const generatedCode = generateClientSpecificProductCode(form.clientCode, form.products);
    newProduct.productCode = generatedCode;
    
    // Set auto-generation mode to true for this product
    setProductCodeAutoGenerate(prev => ({
      ...prev,
      [newProductIndex]: true
    }));
    
    setForm(prev => ({ 
      ...prev, 
      products: [...prev.products, newProduct]
    }));
  }, [form.clientCode, form.products]);

  const removeProduct = useCallback((idx) => {
    // Clean up auto-generation state for removed product
    setProductCodeAutoGenerate(prev => {
      const newState = { ...prev };
      delete newState[idx];
      // Shift indices for products after the removed one
      const shiftedState = {};
      Object.keys(newState).forEach(key => {
        const index = parseInt(key);
        if (index > idx) {
          shiftedState[index - 1] = newState[key];
        } else if (index < idx) {
          shiftedState[index] = newState[key];
        }
      });
      return shiftedState;
    });
    
    setForm(prev => ({ 
      ...prev, 
      products: prev.products.filter((_, i) => i !== idx) 
    }));
  }, []);

  // Toggle auto-generation mode for a product
  const toggleProductCodeAutoGenerate = (idx) => {
    const isCurrentlyAuto = productCodeAutoGenerate[idx];
    setProductCodeAutoGenerate(prev => ({
      ...prev,
      [idx]: !isCurrentlyAuto
    }));
    
    // If switching to auto-generation, generate a new code
    if (!isCurrentlyAuto) {
      const generatedCode = generateClientSpecificProductCode(form.clientCode, form.products);
      const updated = [...form.products];
      updated[idx].productCode = generatedCode;
      setForm({ ...form, products: updated });
    }
  };

  // Regenerate product code for a specific product
  const regenerateProductCode = (idx) => {
    const generatedCode = generateClientSpecificProductCode(form.clientCode, form.products);
    const updated = [...form.products];
    updated[idx].productCode = generatedCode;
    setForm({ ...form, products: updated });
  };

  const handleSubmit = useCallback(async () => {
    try {
      setError(null);
      setLoading(true);

      // Validate GSTIN and PAN if provided
      if (form.gstin && !validateGSTIN(form.gstin)) {
        setError('Invalid GSTIN format. Please use format: 22AAAAA0000A1Z5');
        setLoading(false);
        return;
      }
      if (form.panNumber && !validatePAN(form.panNumber)) {
        setError('Invalid PAN format. Please use format: ABCDE1234F');
        setLoading(false);
        return;
      }

      // Validate email addresses
      const invalidEmails = form.contacts.filter(contact => 
        contact.email && !validateEmail(contact.email)
      );
      if (invalidEmails.length > 0) {
        setError('Please enter valid email addresses for all contacts');
        setLoading(false);
        return;
      }

      // Validate client code uniqueness using local data (much faster)
      // Skip validation for conversions - it will be checked in the regular clients sheet
      if (form.clientCode && !isConvertingToClient) {
        const codeExists = clients.some(client => client.clientCode === form.clientCode);
        if (codeExists) {
          // For updates, only show error if the code is different from original
          if (editIndex !== null && form.clientCode === originalClientCode) {
            // Same code, no problem
          } else {
            setError('Client code already exists. Please use a different client code.');
            setLoading(false);
            return;
          }
        }
      }

      // Check if this is a conversion from prospect to regular client
      if (isConvertingToClient && editIndex !== null && originalClientCode) {
        // Convert prospect to regular client: save to clients sheet and remove from prospects
        const clientToConvert = { ...form };
        
        // Ensure new sequential C-code for regular clients
        try {
          if (!clientToConvert.clientCode || !/^C\d{5}$/.test(clientToConvert.clientCode)) {
            clientToConvert.clientCode = await generateSequentialClientCode();
          }
        } catch (e) {}
        
        // Update status to Active if it was Prospect
        if (clientToConvert.status === 'Prospect' || !clientToConvert.status) {
          clientToConvert.status = 'Active';
        }
        
        // Save to regular clients sheet
        await addClientToRegularClients(clientToConvert);
        
        // Delete from prospects clients sheet
        await deleteClient(originalClientCode);
        
        // Refresh data to show updated list
        await loadClients();
        handleClose();
      } else if (editIndex !== null) {
        // Regular update of prospect client
        await updateClient(form, originalClientCode);
        // Refresh data to show updated client
        await loadClients();
        handleClose();
      } else {
        // Auto-generate client code if not provided for new clients
        const clientToAdd = { ...form };
        if (!clientToAdd.clientCode) {
          clientToAdd.clientCode = generateClientCode(clients);
        }
        
        await addClient(clientToAdd);
        // Refresh data to show new client immediately
        await loadClients();
        handleClose();
      }
    } catch (err) {
      setError(err.message || 'Failed to save client');

    } finally {
      setLoading(false);
    }
  }, [form, clients, editIndex, originalClientCode, handleClose, loadClients, isConvertingToClient]);

  const handleDelete = useCallback(async (clientCode) => {
    if (window.confirm('Are you sure you want to delete this client?')) {
      try {
        await deleteClient(clientCode);
        // Refresh data to get updated list
        await loadClients();
      } catch (err) {
        setError('Failed to delete client');

      }
    }
  }, [loadClients]);

  const handleRefresh = useCallback(async () => {
    try {
      setLoading(true);
      const data = await getAllClients(true); // Force refresh from server
      setClients(data);
      setError(null);
    } catch (err) {
      setError('Failed to refresh client data');

    } finally {
      setLoading(false);
    }
  }, []);

  return (
    <Box sx={{ 
      p: 3, 
      minHeight: '100vh',
      background: 'white',
      position: 'relative',
      overflow: 'hidden'
    }}>
      {/* Animated Background Elements */}
      <Box
        sx={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: '100%',
          background: `
            radial-gradient(circle at 20% 80%, rgba(102, 126, 234, 0.15) 0%, transparent 50%),
            radial-gradient(circle at 80% 20%, rgba(118, 75, 162, 0.15) 0%, transparent 50%),
            radial-gradient(circle at 40% 40%, rgba(102, 126, 234, 0.1) 0%, transparent 50%)
          `,
          zIndex: 0,
          animation: 'backgroundShift 20s ease-in-out infinite'
        }}
      />
      
      {/* Floating Color Bubbles */}
      <Box
        sx={{
          position: 'absolute',
          top: '10%',
          left: '10%',
          width: 100,
          height: 100,
          borderRadius: '50%',
          background: 'linear-gradient(45deg, #1A1F71, #2E3A8F)',
          opacity: 0.3,
          animation: 'float 6s ease-in-out infinite',
          zIndex: 0
        }}
      />
      <Box
        sx={{
          position: 'absolute',
          top: '20%',
          right: '15%',
          width: 150,
          height: 150,
          borderRadius: '50%',
          background: 'linear-gradient(45deg, #2E3A8F, #1A1F71)',
          opacity: 0.2,
          animation: 'float 8s ease-in-out infinite reverse',
          zIndex: 0
        }}
      />
      <Box
        sx={{
          position: 'absolute',
          bottom: '20%',
          left: '20%',
          width: 80,
          height: 80,
          borderRadius: '50%',
          background: 'linear-gradient(45deg, #1A1F71, #2E3A8F)',
          opacity: 0.4,
          animation: 'float 7s ease-in-out infinite',
          zIndex: 0
        }}
      />
      <Box
        sx={{
          position: 'absolute',
          bottom: '10%',
          right: '10%',
          width: 120,
          height: 120,
          borderRadius: '50%',
          background: 'linear-gradient(45deg, #2E3A8F, #1A1F71)',
          opacity: 0.3,
          animation: 'float 9s ease-in-out infinite reverse',
          zIndex: 0
        }}
      />
      
      {/* Header */}
      <Fade in timeout={800}>
      <Paper 
        elevation={0}
        sx={{ 
          p: 4, 
          mb: 4, 
          background: 'linear-gradient(135deg, #1A1F71 0%, #2E3A8F 100%)',
          color: 'white',
          borderRadius: 4,
          position: 'relative',
          overflow: 'hidden',
          boxShadow: '0 25px 50px rgba(0,0,0,0.2), 0 0 0 1px rgba(255,255,255,0.1)',
          zIndex: 1,
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(255,255,255,0.2)'
        }}
      >
        <Box
          sx={{
            position: 'absolute',
              top: -100,
              right: -100,
              width: 300,
              height: 300,
              background: 'rgba(255, 255, 255, 0.1)',
              borderRadius: '50%',
              zIndex: 0,
              animation: 'float 6s ease-in-out infinite'
            }}
          />
          <Box
            sx={{
              position: 'absolute',
              bottom: -50,
              left: -50,
            width: 200,
            height: 200,
              background: 'rgba(255, 255, 255, 0.05)',
            borderRadius: '50%',
              zIndex: 0,
              animation: 'float 8s ease-in-out infinite reverse'
          }}
        />
        <Box sx={{ position: 'relative', zIndex: 1 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
              <Box
                sx={{
                  p: 2,
                  borderRadius: 3,
                  background: 'rgba(255, 255, 255, 0.2)',
                  backdropFilter: 'blur(10px)'
                }}
              >
                <Group sx={{ fontSize: 40 }} />
              </Box>
              <Box>
          <Typography 
            variant="h3" 
            gutterBottom 
            sx={{ 
                    fontWeight: 800,
                    textShadow: '0 2px 4px rgba(0,0,0,0.1)',
                    background: 'linear-gradient(45deg, #fff 30%, #f0f0f0 90%)',
                    backgroundClip: 'text',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent'
            }}
          >
            Prospects Client Management
          </Typography>
          <Typography 
            variant="h6" 
            sx={{ 
              opacity: 0.9,
                    fontWeight: 400,
              maxWidth: 600
            }}
          >
                  Comprehensive prospects client information management with advanced features
          </Typography>
              </Box>
            </Box>
            
            {/* Stats Cards */}
            <Box sx={{ display: 'flex', gap: 2, mt: 3, flexWrap: 'wrap' }}>
              <Box
                sx={{
                  p: 3,
                  borderRadius: 3,
                  background: 'linear-gradient(135deg, rgba(26, 31, 113, 0.9) 0%, rgba(46, 58, 143, 0.9) 100%)',
                  backdropFilter: 'blur(20px)',
                  border: '1px solid rgba(255, 255, 255, 0.3)',
                  minWidth: 140,
                  boxShadow: '0 10px 30px rgba(26, 31, 113, 0.3)',
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    transform: 'translateY(-5px)',
                    boxShadow: '0 15px 40px rgba(26, 31, 113, 0.4)'
                  }
                }}
              >
                <Typography variant="h3" sx={{ fontWeight: 800, color: '#FFFFFF', textShadow: '0 2px 4px rgba(0,0,0,0.3)' }}>
                  {clients.length}
                </Typography>
                <Typography variant="body1" sx={{ opacity: 0.9, fontWeight: 600, color: '#FFFFFF' }}>
                  Total Clients
                </Typography>
              </Box>
              <Box
                sx={{
                  p: 3,
                  borderRadius: 3,
                  background: 'linear-gradient(135deg, rgba(51, 51, 51, 0.9) 0%, rgba(85, 85, 85, 0.9) 100%)',
                  backdropFilter: 'blur(20px)',
                  border: '1px solid rgba(255, 255, 255, 0.3)',
                  minWidth: 140,
                  boxShadow: '0 10px 30px rgba(51, 51, 51, 0.3)',
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    transform: 'translateY(-5px)',
                    boxShadow: '0 15px 40px rgba(51, 51, 51, 0.4)'
                  }
                }}
              >
                <Typography variant="h3" sx={{ fontWeight: 800, color: '#FFFFFF', textShadow: '0 2px 4px rgba(0,0,0,0.3)' }}>
                  {clients.filter(c => c.status === 'Active').length}
                </Typography>
                <Typography variant="body1" sx={{ opacity: 0.9, fontWeight: 600, color: '#FFFFFF' }}>
                  Active Clients
                </Typography>
              </Box>
              <Box
                sx={{
                  p: 3,
                  borderRadius: 3,
                  background: 'linear-gradient(135deg, rgba(46, 58, 143, 0.9) 0%, rgba(67, 97, 238, 0.9) 100%)',
                  backdropFilter: 'blur(20px)',
                  border: '1px solid rgba(255, 255, 255, 0.3)',
                  minWidth: 140,
                  boxShadow: '0 10px 30px rgba(46, 58, 143, 0.3)',
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    transform: 'translateY(-5px)',
                    boxShadow: '0 15px 40px rgba(46, 58, 143, 0.4)'
                  }
                }}
              >
                <Typography variant="h3" sx={{ fontWeight: 800, color: '#FFFFFF', textShadow: '0 2px 4px rgba(0,0,0,0.3)' }}>
                  {filteredClients.length}
                </Typography>
                <Typography variant="body1" sx={{ opacity: 0.9, fontWeight: 600, color: '#FFFFFF' }}>
                  Filtered Results
                </Typography>
              </Box>
              <Box
                sx={{
                  p: 3,
                  borderRadius: 3,
                  background: 'linear-gradient(135deg, rgba(68, 68, 68, 0.9) 0%, rgba(102, 102, 102, 0.9) 100%)',
                  backdropFilter: 'blur(20px)',
                  border: '1px solid rgba(255, 255, 255, 0.3)',
                  minWidth: 140,
                  boxShadow: '0 10px 30px rgba(68, 68, 68, 0.3)',
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    transform: 'translateY(-5px)',
                    boxShadow: '0 15px 40px rgba(68, 68, 68, 0.4)'
                  }
                }}
              >
                <Typography variant="h3" sx={{ fontWeight: 800, color: '#FFFFFF', textShadow: '0 2px 4px rgba(0,0,0,0.3)' }}>
                  {clients.reduce((sum, c) => sum + (c.totalOrders || 0), 0)}
                </Typography>
                <Typography variant="body1" sx={{ opacity: 0.9, fontWeight: 600, color: '#FFFFFF' }}>
                  Total Orders
                </Typography>
              </Box>
            </Box>
        </Box>
      </Paper>
      </Fade>

      {/* Main Content Card */}
      <Zoom in timeout={1000}>
      <Card 
        elevation={0}
        sx={{ 
            background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.95) 0%, rgba(255, 255, 255, 0.8) 100%)',
            backdropFilter: 'blur(30px)',
            borderRadius: 4,
            overflow: 'hidden',
            boxShadow: '0 25px 50px rgba(0,0,0,0.15), 0 0 0 1px rgba(255,255,255,0.3)',
            border: '2px solid rgba(255, 255, 255, 0.3)',
            zIndex: 1,
            position: 'relative',
            '&::before': {
              content: '""',
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              height: '4px',
              background: 'linear-gradient(90deg, #1A1F71, #2E3A8F)',
              zIndex: 1
            }
        }}
      >
        <CardContent sx={{ p: 4 }}>
          {/* Header Section */}
          <Box sx={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center', 
              mb: 4,
              pb: 3,
              borderBottom: '2px solid rgba(102, 126, 234, 0.1)'
          }}>
            <Box>
              <Typography 
                  variant="h4" 
                sx={{ 
                    background: 'linear-gradient(135deg, #1A1F71 0%, #2E3A8F 100%)',
                    backgroundClip: 'text',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    fontWeight: 800,
                    mb: 1
                  }}
                >
                  Prospects Client Directory
              </Typography>
              <Typography 
                  variant="body1" 
                sx={{ 
                    color: '#333333',
                    fontWeight: 500
                }}
              >
                  Manage your prospect client relationships with comprehensive information tracking
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', gap: 2 }}>
              <Button 
                variant="contained" 
                startIcon={<Add />}
                onClick={() => handleOpen(null, null)}
                sx={{
                    background: 'linear-gradient(135deg, #1A1F71 0%, #2E3A8F 100%)',
                    color: '#FFFFFF',
                    '&:hover': { 
                      background: 'linear-gradient(135deg, #151A5C 0%, #1A1F71 100%)',
                      transform: 'translateY(-2px)',
                      boxShadow: '0 10px 20px rgba(26, 31, 113, 0.3)'
                    },
                    px: 4,
                    py: 2,
                    borderRadius: 3,
                    fontWeight: 700,
                    fontSize: '1rem',
                    textTransform: 'none',
                    transition: 'all 0.3s ease'
                  }}
                >
                  Add New Client
              </Button>
              <Button 
                variant="outlined" 
                startIcon={<Refresh />}
                onClick={handleRefresh}
                disabled={loading}
                sx={{
                    borderColor: '#1A1F71',
                    color: '#1A1F71',
                    '&:hover': { 
                      borderColor: '#151A5C',
                      backgroundColor: 'rgba(26, 31, 113, 0.1)',
                      transform: 'translateY(-2px)'
                    },
                    px: 3,
                    py: 2,
                    borderRadius: 3,
                    fontWeight: 600,
                    fontSize: '1rem',
                    textTransform: 'none',
                    transition: 'all 0.3s ease'
                  }}
                >
                  Refresh
              </Button>
            </Box>
          </Box>

            {/* Search and Filter Controls */}
            <Box sx={{ 
              mb: 3, 
              p: 3, 
              background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.9) 0%, rgba(255, 255, 255, 0.7) 100%)',
              borderRadius: 3,
              border: '2px solid rgba(255, 255, 255, 0.3)',
              boxShadow: '0 10px 30px rgba(0,0,0,0.1)',
              backdropFilter: 'blur(20px)',
              position: 'relative',
              overflow: 'hidden',
              '&::before': {
                content: '""',
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                height: '3px',
                background: 'linear-gradient(90deg, #1A1F71, #2E3A8F)',
                zIndex: 1
              }
            }}>
              <Grid container spacing={3} alignItems="center">
                <Grid item xs={12} md={4}>
                  <TextField
                    fullWidth
                    placeholder="Search clients..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <Search sx={{ color: '#1A1F71' }} />
                        </InputAdornment>
                      ),
                    }}
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        borderRadius: 2,
                        backgroundColor: 'rgba(255, 255, 255, 0.8)',
                        '& fieldset': { borderColor: 'rgba(102, 126, 234, 0.3)' },
                        '&:hover fieldset': { borderColor: '#1A1F71' },
                        '&.Mui-focused fieldset': { borderColor: '#1A1F71' }
                      }
                    }}
                  />
                </Grid>
                <Grid item xs={12} md={2}>
                  <FormControl fullWidth>
                    <InputLabel>Status</InputLabel>
                    <Select
                      value={statusFilter}
                      onChange={(e) => setStatusFilter(e.target.value)}
                      label="Status"
                      sx={{ borderRadius: 2 }}
                    >
                      <MenuItem value="All">All Status</MenuItem>
                      <MenuItem value="Active">Active</MenuItem>
                      <MenuItem value="Inactive">Inactive</MenuItem>
                      <MenuItem value="Prospect">Prospect</MenuItem>
                      <MenuItem value="Suspended">Suspended</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} md={2}>
                  <FormControl fullWidth>
                    <InputLabel>Sort By</InputLabel>
                    <Select
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value)}
                      label="Sort By"
                      sx={{ borderRadius: 2 }}
                    >
                      <MenuItem value="clientName">Name</MenuItem>
                      <MenuItem value="clientCode">Code</MenuItem>
                      <MenuItem value="city">City</MenuItem>
                      <MenuItem value="status">Status</MenuItem>
                      <MenuItem value="totalOrders">Orders</MenuItem>
                      <MenuItem value="totalValue">Value</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} md={2}>
                  <FormControl fullWidth>
                    <InputLabel>Order</InputLabel>
                    <Select
                      value={sortOrder}
                      onChange={(e) => setSortOrder(e.target.value)}
                      label="Order"
                      sx={{ borderRadius: 2 }}
                    >
                      <MenuItem value="asc">Ascending</MenuItem>
                      <MenuItem value="desc">Descending</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} md={2}>
                  <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
                    <Tooltip title="Table View">
                      <IconButton
                        onClick={() => setViewMode('table')}
                        sx={{
                          color: viewMode === 'table' ? '#1A1F71' : '#6c757d',
                          backgroundColor: viewMode === 'table' ? 'rgba(102, 126, 234, 0.1)' : 'transparent'
                        }}
                      >
                        <ViewList />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Card View">
                      <IconButton
                        onClick={() => setViewMode('card')}
                        sx={{
                          color: viewMode === 'card' ? '#1A1F71' : '#6c757d',
                          backgroundColor: viewMode === 'card' ? 'rgba(102, 126, 234, 0.1)' : 'transparent'
                        }}
                      >
                        <ViewModule />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Refresh">
                      <IconButton
                        onClick={() => window.location.reload()}
                        sx={{ color: '#1A1F71' }}
                      >
                        <Refresh />
                      </IconButton>
                    </Tooltip>
                  </Box>
                </Grid>
              </Grid>
          </Box>

          {error && (
            <Alert 
              severity="error" 
              sx={{ 
                mb: 3,
                  borderRadius: 3,
                  background: 'linear-gradient(135deg, #ffebee 0%, #ffcdd2 100%)',
                  border: '1px solid #f44336',
                '& .MuiAlert-icon': { color: '#d32f2f' }
              }}
            >
              {error}
            </Alert>
          )}

            {loading ? (
              <Box sx={{ 
                display: 'flex', 
                justifyContent: 'center', 
                alignItems: 'center', 
                minHeight: 200,
                background: 'linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%)',
                borderRadius: 3
              }}>
                <Box sx={{ textAlign: 'center' }}>
                  <Box
                    sx={{
                      width: 60,
                      height: 60,
                      borderRadius: '50%',
                      background: 'linear-gradient(135deg, #1A1F71 0%, #2E3A8F 100%)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      mb: 2,
                      animation: 'pulse 2s infinite'
                    }}
                  >
                    <Group sx={{ color: 'white', fontSize: 30 }} />
                  </Box>
                  <Typography variant="h6" sx={{ color: '#6c757d', fontWeight: 600 }}>
                    Loading clients...
                  </Typography>
                </Box>
              </Box>
            ) : (
              <>
                {viewMode === 'table' ? (
                  <TableContainer 
                    component={Paper} 
                    sx={{ 
                          borderRadius: 3,
                          background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.95) 0%, rgba(255, 255, 255, 0.85) 100%)',
                          backdropFilter: 'blur(20px)',
                          border: '2px solid rgba(255, 255, 255, 0.3)',
                          overflow: 'hidden',
                          boxShadow: '0 15px 40px rgba(0,0,0,0.1), 0 0 0 1px rgba(255,255,255,0.2)',
                          position: 'relative',
                          '&::before': {
                            content: '""',
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            right: 0,
                            height: '3px',
                            background: 'linear-gradient(90deg, #1A1F71, #2E3A8F)',
                            zIndex: 1
                          }
                        }}
                      >
                <Table size="medium">
              <TableHead>
                    <TableRow sx={{ 
                      background: 'linear-gradient(135deg, #1A1F71 0%, #2E3A8F 100%)',
                      '& .MuiTableCell-head': {
                        color: 'white',
                        fontWeight: 800,
                        fontSize: '0.9rem',
                        border: 'none',
                        textShadow: '0 2px 4px rgba(0,0,0,0.3)',
                        position: 'relative',
                        '&::after': {
                          content: '""',
                          position: 'absolute',
                          bottom: 0,
                          left: 0,
                          right: 0,
                          height: '2px',
                          background: 'rgba(255, 255, 255, 0.3)'
                        }
                      }
                    }}>
                      <TableCell>Client Name</TableCell>
                      <TableCell>Code</TableCell>
                      <TableCell>Business Type</TableCell>
                      <TableCell>Location</TableCell>
                      <TableCell>Contacts</TableCell>
                      <TableCell>Status</TableCell>
                      <TableCell>Rating</TableCell>
                      <TableCell align="center">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                    {currentClients.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={8} align="center" sx={{ py: 6 }}>
                          <Box sx={{ textAlign: 'center' }}>
                            <Box
                              sx={{
                                width: 80,
                                height: 80,
                                borderRadius: '50%',
                                background: 'linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                mx: 'auto',
                                mb: 2
                              }}
                            >
                              <Group sx={{ color: '#6c757d', fontSize: 40 }} />
                            </Box>
                            <Typography variant="h6" sx={{ color: '#6c757d', fontWeight: 600, mb: 1 }}>
                              No clients found
                            </Typography>
                            <Typography variant="body2" sx={{ color: '#adb5bd' }}>
                              Start by adding your first client
                            </Typography>
                          </Box>
                        </TableCell>
                      </TableRow>
                    ) : (
                      currentClients.map((client, idx) => (
                  <TableRow 
                    key={client.clientCode}
                    sx={{ 
                            cursor: 'pointer',
                            '&:hover': { 
                              background: 'linear-gradient(135deg, rgba(102, 126, 234, 0.08) 0%, rgba(118, 75, 162, 0.08) 100%)',
                              transform: 'translateY(-2px)',
                              boxShadow: '0 8px 25px rgba(0,0,0,0.15)',
                              transition: 'all 0.3s ease',
                              '& .MuiTableCell-root': {
                                color: '#2c3e50',
                                fontWeight: 600
                              }
                      },
                      '&:nth-of-type(even)': {
                              backgroundColor: 'rgba(255, 255, 255, 0.5)'
                            },
                            '&:nth-of-type(odd)': {
                              backgroundColor: 'rgba(255, 255, 255, 0.3)'
                            },
                            borderBottom: '1px solid rgba(255, 255, 255, 0.2)',
                            transition: 'all 0.3s ease'
                          }}
                          onClick={() => {
                            setSelectedClientForDashboard(client);
                            setOpenClientDashboard(true);
                          }}
                        >
                          <TableCell sx={{ fontWeight: 600, color: '#2c3e50' }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <Business sx={{ color: '#1A1F71', fontSize: 20 }} />
                              <Box>
                                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                      {client.clientName}
                                </Typography>
                                <Typography variant="caption" sx={{ color: '#475569', fontWeight: 500 }}>
                                  {client.businessType || 'No Business Type'}
                                </Typography>
                              </Box>
                            </Box>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={client.clientCode}
                        size="small"
                        sx={{
                                background: 'linear-gradient(135deg, #1A1F71 0%, #2E3A8F 100%)',
                                color: 'white',
                                fontWeight: 600,
                                fontSize: '0.75rem'
                        }}
                      />
                    </TableCell>
                          <TableCell sx={{ color: '#2c3e50' }}>
                            <Box>
                              <Typography variant="body2" sx={{ fontWeight: 600, color: '#2c3e50' }}>
                                {client.businessType || 'N/A'}
                              </Typography>
                              {client.gstin && (
                                <Typography variant="caption" sx={{ color: '#059669', fontWeight: 500 }}>
                                  GST: {client.gstin}
                                </Typography>
                              )}
                            </Box>
                          </TableCell>
                          <TableCell sx={{ color: '#2c3e50' }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                              <LocationOn sx={{ fontSize: 16, color: '#1A1F71' }} />
                              <Box>
                      <Typography 
                        variant="body2" 
                        sx={{ 
                                    fontWeight: 600,
                                    color: '#2c3e50',
                                    lineHeight: 1.4
                        }}
                      >
                                  {client.city}, {client.state}
                      </Typography>
                                <Typography variant="caption" sx={{ color: '#475569', fontWeight: 500 }}>
                                  {client.pincode}
                                </Typography>
                              </Box>
                            </Box>
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                              {client.contacts?.slice(0, 2).map((c, i) => (
                          <Box key={i} sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                  <Person fontSize="small" sx={{ color: '#1A1F71' }} />
                                  <Typography variant="body2" sx={{ color: '#2c3e50', fontWeight: 600 }}>
                              {c.name}
                            </Typography>
                                  {c.isPrimary && (
                                    <Star sx={{ fontSize: 12, color: '#ffc107' }} />
                                  )}
                          </Box>
                        ))}
                              {client.contacts?.length > 2 && (
                                <Typography variant="caption" sx={{ color: '#475569', fontWeight: 500 }}>
                                  +{client.contacts.length - 2} more
                                </Typography>
                              )}
                              {client.contacts?.length === 0 && (
                                <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 500 }}>
                                  No contacts
                                </Typography>
                              )}
                      </Box>
                    </TableCell>
                    <TableCell>
                            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                          <Chip
                                label={client.status || 'Active'}
                            size="small"
                            sx={{
                                  backgroundColor: client.status === 'Active' ? '#d4edda' : 
                                                  client.status === 'Inactive' ? '#f8d7da' :
                                                  client.status === 'Prospect' ? '#d1ecf1' : '#fff3cd',
                                  color: client.status === 'Active' ? '#155724' : 
                                        client.status === 'Inactive' ? '#721c24' :
                                        client.status === 'Prospect' ? '#0c5460' : '#856404',
                                  fontWeight: 600,
                              fontSize: '0.7rem'
                            }}
                          />
                              {client.totalOrders > 0 && (
                                <Typography variant="caption" sx={{ color: '#475569', fontWeight: 500 }}>
                                  {client.totalOrders} orders
                                </Typography>
                              )}
                      </Box>
                    </TableCell>
                    <TableCell>
                            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                {[...Array(5)].map((_, i) => (
                                  <Star
                                    key={i}
                                    sx={{
                                      fontSize: 16,
                                      color: i < (client.rating || 0) ? '#ffc107' : '#e9ecef'
                                    }}
                                  />
                                ))}
                              </Box>
                              {client.totalValue > 0 && (
                                <Typography variant="caption" sx={{ color: '#28a745', fontWeight: 600 }}>
                                  ₹{client.totalValue.toLocaleString()}
                                </Typography>
                              )}
                            </Box>
                          </TableCell>
                          <TableCell align="center" onClick={(e) => e.stopPropagation()}>
                            <Box sx={{ display: 'flex', gap: 1, justifyContent: 'center' }}>
                              <Tooltip title="Convert to Regular Client">
                        <IconButton 
                          onClick={() => handleOpen(client, idx, true)}
                          sx={{ 
                                    color: '#10b981',
                                    '&:hover': { 
                                      backgroundColor: 'rgba(16, 185, 129, 0.1)',
                                      transform: 'scale(1.1)'
                                    },
                                    transition: 'all 0.2s ease'
                          }}
                        >
                          <ArrowForward fontSize="small" />
                        </IconButton>
                              </Tooltip>
                              <Tooltip title="Edit Client">
                        <IconButton 
                          onClick={() => handleOpen(client, idx)}
                          sx={{ 
                                    color: '#1A1F71',
                                    '&:hover': { 
                                      backgroundColor: 'rgba(102, 126, 234, 0.1)',
                                      transform: 'scale(1.1)'
                                    },
                                    transition: 'all 0.2s ease'
                          }}
                        >
                          <Edit fontSize="small" />
                        </IconButton>
                              </Tooltip>
                              <Tooltip title="Delete Client">
                        <IconButton 
                          onClick={() => handleDelete(client.clientCode)}
                          sx={{ 
                                    color: '#dc3545',
                                    '&:hover': { 
                                      backgroundColor: 'rgba(220, 53, 69, 0.1)',
                                      transform: 'scale(1.1)'
                                    },
                                    transition: 'all 0.2s ease'
                          }}
                        >
                          <Delete fontSize="small" />
                        </IconButton>
                              </Tooltip>
                      </Box>
                    </TableCell>
                  </TableRow>
                      ))
                    )}
              </TableBody>
            </Table>
          </TableContainer>
                ) : (
                  // Card View
                  <Grid container spacing={3} sx={{ mt: 1 }}>
                    {currentClients.length === 0 ? (
                      <Grid item xs={12}>
                        <Box sx={{ 
                          textAlign: 'center', 
                          py: 8,
                          background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.9) 0%, rgba(248, 250, 252, 0.8) 100%)',
                          borderRadius: 3,
                          border: '2px dashed rgba(102, 126, 234, 0.3)'
                        }}>
                          <Business sx={{ fontSize: 64, color: '#cbd5e1', mb: 2 }} />
                          <Typography variant="h6" sx={{ color: '#64748b', fontWeight: 600, mb: 1 }}>
                            No clients found
                          </Typography>
                          <Typography variant="body2" sx={{ color: '#94a3b8' }}>
                            {searchTerm || statusFilter !== 'All' 
                              ? 'Try adjusting your search or filter criteria' 
                              : 'Start by adding your first client to the directory'
                            }
                          </Typography>
                        </Box>
                      </Grid>
                    ) : (
                      currentClients.map((client, idx) => (
                        <Grid item xs={12} sm={6} md={4} lg={3} key={idx}>
                          <Card 
                            sx={{
                              height: '100%',
                              background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.95) 0%, rgba(248, 250, 252, 0.9) 100%)',
                              backdropFilter: 'blur(20px)',
                              border: '2px solid rgba(255, 255, 255, 0.3)',
                              borderRadius: 3,
                              boxShadow: '0 10px 30px rgba(0,0,0,0.1)',
                              transition: 'all 0.3s ease',
                              position: 'relative',
                              overflow: 'hidden',
                              cursor: 'pointer',
                              '&:hover': {
                                transform: 'translateY(-8px)',
                                boxShadow: '0 20px 40px rgba(0,0,0,0.15)',
                                '& .client-actions': {
                                  opacity: 1,
                                  transform: 'translateY(0)'
                                }
                              },
                              '&::before': {
                                content: '""',
                                position: 'absolute',
                                top: 0,
                                left: 0,
                                right: 0,
                                height: '4px',
                                background: client.status === 'Active' 
                                  ? 'linear-gradient(90deg, #10b981, #059669)' 
                                  : 'linear-gradient(90deg, #f59e0b, #d97706)',
                                zIndex: 1
                              }
                            }}
                            onClick={() => {
                              setSelectedClientForDashboard(client);
                              setOpenClientDashboard(true);
                            }}
                          >
                            <CardContent sx={{ p: 3, height: '100%', display: 'flex', flexDirection: 'column' }}>
                              {/* Header */}
                              <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', mb: 2 }}>
                                <Box sx={{ flex: 1 }}>
                                  <Typography variant="h6" sx={{ 
                                    fontWeight: 700, 
                                    color: '#1e293b',
                                    mb: 0.5,
                                    lineHeight: 1.2
                                  }}>
                                    {client.clientName}
                                  </Typography>
                                  <Typography variant="body2" sx={{ 
                                    color: '#64748b',
                                    fontWeight: 500
                                  }}>
                                    {client.clientCode}
                                  </Typography>
                                </Box>
                                <Chip 
                                  label={client.status}
                                  size="small"
                                  sx={{
                                    backgroundColor: client.status === 'Active' ? '#dcfce7' : '#fef3c7',
                                    color: client.status === 'Active' ? '#166534' : '#92400e',
                                    fontWeight: 600,
                                    fontSize: '0.75rem'
                                  }}
                                />
                              </Box>

                              {/* Business Info */}
                              <Box sx={{ mb: 2 }}>
                                <Typography variant="body2" sx={{ color: '#64748b', mb: 0.5 }}>
                                  <Business sx={{ fontSize: 16, mr: 1, verticalAlign: 'middle' }} />
                                  {client.businessType || 'Not specified'}
                                </Typography>
                                <Typography variant="body2" sx={{ color: '#64748b', mb: 0.5 }}>
                                  <LocationOn sx={{ fontSize: 16, mr: 1, verticalAlign: 'middle' }} />
                                  {client.city}, {client.state}
                                </Typography>
                                {client.contacts && client.contacts.length > 0 && client.contacts[0].email && (
                                  <Typography variant="body2" sx={{ color: '#64748b', mb: 0.5 }}>
                                    <Email sx={{ fontSize: 16, mr: 1, verticalAlign: 'middle' }} />
                                    {client.contacts[0].email}
                                  </Typography>
                                )}
                              </Box>

                              {/* Stats */}
                              <Box sx={{ 
                                display: 'flex', 
                                justifyContent: 'space-between', 
                                mb: 2,
                                p: 2,
                                background: 'rgba(102, 126, 234, 0.05)',
                                borderRadius: 2,
                                border: '1px solid rgba(102, 126, 234, 0.1)'
                              }}>
                                <Box sx={{ textAlign: 'center' }}>
                                  <Typography variant="h6" sx={{ fontWeight: 700, color: '#1A1F71' }}>
                                    {client.totalOrders || 0}
                                  </Typography>
                                  <Typography variant="caption" sx={{ color: '#64748b' }}>
                                    Orders
                                  </Typography>
                                </Box>
                                <Box sx={{ textAlign: 'center' }}>
                                  <Typography variant="h6" sx={{ fontWeight: 700, color: '#1A1F71' }}>
                                    ₹{client.totalValue ? (client.totalValue / 100000).toFixed(1) + 'L' : '0'}
                                  </Typography>
                                  <Typography variant="caption" sx={{ color: '#64748b' }}>
                                    Value
                                  </Typography>
                                </Box>
                                <Box sx={{ textAlign: 'center' }}>
                                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    {[...Array(5)].map((_, i) => (
                                      <Star 
                                        key={i} 
                                        sx={{ 
                                          fontSize: 16, 
                                          color: i < (client.rating || 0) ? '#fbbf24' : '#e5e7eb' 
                                        }} 
                                      />
                                    ))}
                                  </Box>
                                  <Typography variant="caption" sx={{ color: '#64748b' }}>
                                    Rating
                                  </Typography>
                                </Box>
                              </Box>

                              {/* Actions */}
                              <Box 
                                className="client-actions"
                                sx={{ 
                                  display: 'flex', 
                                  gap: 1, 
                                  mt: 'auto',
                                  opacity: 0,
                                  transform: 'translateY(10px)',
                                  transition: 'all 0.3s ease'
                                }}
                                onClick={(e) => e.stopPropagation()}
                              >
                                <Button
                                  size="small"
                                  startIcon={<ArrowForward />}
                                  onClick={() => handleOpen(client, idx, true)}
                                  sx={{
                                    flex: 1,
                                    background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                                    color: 'white',
                                    fontWeight: 600,
                                    '&:hover': {
                                      background: 'linear-gradient(135deg, #059669 0%, #047857 100%)',
                                      transform: 'translateY(-2px)',
                                      boxShadow: '0 8px 20px rgba(16, 185, 129, 0.3)'
                                    }
                                  }}
                                >
                                  Convert
                                </Button>
                                <Button
                                  size="small"
                                  startIcon={<Edit />}
                                  onClick={() => handleOpen(client, idx)}
                                  sx={{
                                    flex: 1,
                                    background: 'linear-gradient(135deg, #1A1F71 0%, #2E3A8F 100%)',
                                    color: 'white',
                                    fontWeight: 600,
                                    '&:hover': {
                                      background: 'linear-gradient(135deg, #5a67d8 0%, #6b46c1 100%)',
                                      transform: 'translateY(-2px)',
                                      boxShadow: '0 8px 20px rgba(102, 126, 234, 0.3)'
                                    }
                                  }}
                                >
                                  Edit
                                </Button>
                                <IconButton
                                  size="small"
                                  onClick={() => handleDelete(client.clientCode)}
                                  sx={{
                                    background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
                                    color: 'white',
                                    '&:hover': {
                                      background: 'linear-gradient(135deg, #dc2626 0%, #b91c1c 100%)',
                                      transform: 'translateY(-2px)',
                                      boxShadow: '0 8px 20px rgba(239, 68, 68, 0.3)'
                                    }
                                  }}
                                >
                                  <Delete fontSize="small" />
                                </IconButton>
                              </Box>
                            </CardContent>
                          </Card>
                        </Grid>
                      ))
                    )}
                  </Grid>
                )}
              
              {/* Enhanced Pagination Controls */}
              {filteredClients.length > 0 && (
                <Box sx={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'center',
                  mt: 3,
                  p: 3,
                  background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.9) 0%, rgba(255, 255, 255, 0.7) 100%)',
                  borderRadius: 3,
                  border: '2px solid rgba(255, 255, 255, 0.3)',
                  boxShadow: '0 10px 30px rgba(0,0,0,0.1)',
                  backdropFilter: 'blur(20px)',
                  position: 'relative',
                  overflow: 'hidden',
                  '&::before': {
                    content: '""',
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    height: '3px',
                    background: 'linear-gradient(90deg, #1A1F71, #2E3A8F)',
                    zIndex: 1
                  }
                }}>
                  {/* Rows per page selector */}
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Typography variant="body2" sx={{ color: '#6c757d', fontWeight: 500 }}>
                      Rows per page:
                    </Typography>
                    <FormControl size="small" sx={{ minWidth: 80 }}>
                      <Select
                        value={itemsPerPage}
                        onChange={(e) => {
                          setItemsPerPage(e.target.value);
                          setCurrentPage(1); // Reset to first page
                        }}
                        sx={{
                          '& .MuiOutlinedInput-notchedOutline': {
                            borderColor: 'rgba(102, 126, 234, 0.3)',
                          },
                          '&:hover .MuiOutlinedInput-notchedOutline': {
                            borderColor: 'rgba(102, 126, 234, 0.5)',
                          },
                          '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                            borderColor: '#1A1F71',
                          }
                        }}
                      >
                        <MenuItem value={5}>5</MenuItem>
                        <MenuItem value={10}>10</MenuItem>
                        <MenuItem value={25}>25</MenuItem>
                        <MenuItem value={50}>50</MenuItem>
                        <MenuItem value={100}>100</MenuItem>
                      </Select>
                    </FormControl>
                  </Box>

                  {/* Pagination info and controls */}
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                    <Typography variant="body2" sx={{ color: '#6c757d', fontWeight: 500 }}>
                      {startIndex + 1}-{Math.min(endIndex, filteredClients.length)} of {filteredClients.length} clients
                    </Typography>
                    
                    {totalPages > 1 && (
                      <Pagination
                        count={totalPages}
                        page={currentPage}
                        onChange={(event, value) => setCurrentPage(value)}
                        color="primary"
                        size="large"
                        showFirstButton
                        showLastButton
                        sx={{
                          '& .MuiPaginationItem-root': {
                            borderRadius: 3,
                            fontWeight: 700,
                            fontSize: '0.9rem',
                            minWidth: 36,
                            height: 36,
                            margin: '0 2px',
                            transition: 'all 0.3s ease',
                            '&:hover': {
                              transform: 'scale(1.1)',
                              boxShadow: '0 5px 15px rgba(0,0,0,0.2)'
                            },
                            '&.Mui-selected': {
                              background: 'linear-gradient(135deg, #1A1F71 0%, #2E3A8F 100%)',
                              color: 'white',
                              fontWeight: 800,
                              boxShadow: '0 8px 20px rgba(0,0,0,0.3)',
                              '&:hover': {
                                transform: 'scale(1.15)',
                                boxShadow: '0 10px 25px rgba(0,0,0,0.4)'
                              }
                            }
                          }
                        }}
                      />
                    )}
                  </Box>
                </Box>
              )}
              </>
            )}
        </CardContent>
      </Card>
      </Zoom>

      {/* Enhanced Add/Edit Dialog */}
      <Dialog 
        open={open} 
        onClose={handleClose} 
        maxWidth="lg" 
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 4,
            background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.95) 0%, rgba(248, 250, 252, 0.9) 100%)',
            backdropFilter: 'blur(20px)',
            border: '1px solid rgba(102, 126, 234, 0.2)',
            boxShadow: '0 25px 50px rgba(0,0,0,0.15)',
            maxHeight: '95vh',
            overflow: 'hidden',
            position: 'relative',
            '&::before': {
              content: '""',
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              height: '4px',
              background: 'linear-gradient(90deg, #1A1F71, #2E3A8F, #f093fb)',
              zIndex: 2
            }
          }
        }}
      >
        <DialogTitle sx={{ 
          background: 'linear-gradient(135deg, rgba(102, 126, 234, 0.1) 0%, rgba(118, 75, 162, 0.05) 100%)',
          color: '#2c3e50',
          fontWeight: 700,
          fontSize: '1.8rem',
          py: 3,
          px: 4,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          position: 'relative',
          borderBottom: '1px solid rgba(102, 126, 234, 0.1)'
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Box
              sx={{
                p: 2,
                borderRadius: 3,
                background: 'linear-gradient(135deg, #1A1F71 0%, #2E3A8F 100%)',
                boxShadow: '0 8px 20px rgba(102, 126, 234, 0.3)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <Business sx={{ fontSize: 32, color: 'white' }} />
            </Box>
            <Box>
              <Typography variant="h5" sx={{ fontWeight: 700, color: '#2c3e50', mb: 0.5 }}>
                {isConvertingToClient ? 'Convert Prospect to Client' : editIndex !== null ? 'Edit Client Information' : 'Add New Client'}
              </Typography>
              <Typography variant="body2" sx={{ color: '#64748b', fontWeight: 500 }}>
                {isConvertingToClient ? 'Convert prospect to regular client' : editIndex !== null ? 'Update client details' : 'Create client profile'}
              </Typography>
            </Box>
          </Box>
          <IconButton 
            onClick={handleClose}
            sx={{ 
              color: '#64748b',
              '&:hover': { 
                backgroundColor: 'rgba(239, 68, 68, 0.1)',
                color: '#ef4444'
              }
            }}
          >
            <Cancel sx={{ fontSize: 28 }} />
          </IconButton>
        </DialogTitle>
        <DialogContent sx={{ 
          p: 0, 
          overflow: 'auto',
          maxHeight: '70vh',
          '&::-webkit-scrollbar': {
            width: '8px',
          },
          '&::-webkit-scrollbar-track': {
            background: '#f1f1f1',
            borderRadius: '4px',
          },
          '&::-webkit-scrollbar-thumb': {
            background: '#c1c1c1',
            borderRadius: '4px',
          },
          '&::-webkit-scrollbar-thumb:hover': {
            background: '#a8a8a8',
          }
        }}>
          {error && (
            <Alert 
              severity="error" 
              sx={{ 
                m: 3,
                borderRadius: 3,
                background: 'linear-gradient(135deg, #ffebee 0%, #ffcdd2 100%)',
                border: '1px solid #f44336',
                '& .MuiAlert-icon': { color: '#d32f2f' }
              }}
            >
              {error}
            </Alert>
          )}
          
          {/* Enhanced Stepper */}
          <Box sx={{ 
            px: 4, 
            pt: 3, 
            pb: 2,
            background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.8) 0%, rgba(248, 250, 252, 0.6) 100%)',
            borderBottom: '1px solid rgba(102, 126, 234, 0.1)',
            position: 'relative'
          }}>
            <Stepper 
              activeStep={activeStep} 
              alternativeLabel
              sx={{
                '& .MuiStepConnector-root': {
                  top: 22,
                  left: 'calc(-50% + 16px)',
                  right: 'calc(50% + 16px)',
                },
                '& .MuiStepConnector-active': {
                  '& .MuiStepConnector-line': {
                    background: 'linear-gradient(90deg, #1A1F71, #2E3A8F)',
                    boxShadow: '0 2px 8px rgba(102, 126, 234, 0.3)'
                  },
                },
                '& .MuiStepConnector-completed': {
                  '& .MuiStepConnector-line': {
                    background: 'linear-gradient(90deg, #10b981, #059669)',
                    boxShadow: '0 2px 8px rgba(16, 185, 129, 0.3)'
                  },
                },
                '& .MuiStepConnector-line': {
                  height: 3,
                  border: 0,
                  backgroundColor: '#e2e8f0',
                  borderRadius: 1,
                  transition: 'all 0.3s ease'
                }
              }}
            >
              {steps.map((label, index) => (
                <Step key={label}>
                  <Tooltip 
                    title={
                      !isStepAccessible(index) && editIndex === null 
                        ? `Complete step ${index + 1} first to access this step`
                        : `Go to ${label}`
                    }
                    placement="top"
                    arrow
                  >
                    <StepLabel 
                      onClick={() => handleStepClick(index)}
                    StepIconComponent={({ active, completed }) => {
                      const isAccessible = isStepAccessible(index);
                      return (
                        <Box
                          sx={{
                            width: 44,
                            height: 44,
                            borderRadius: '50%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            background: completed 
                              ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)'
                              : active 
                              ? 'linear-gradient(135deg, #1A1F71 0%, #2E3A8F 100%)'
                              : isAccessible
                              ? 'linear-gradient(135deg, #e2e8f0 0%, #cbd5e0 100%)'
                              : 'linear-gradient(135deg, #f1f5f9 0%, #e2e8f0 100%)',
                            boxShadow: completed || active 
                              ? '0 6px 20px rgba(102, 126, 234, 0.3)' 
                              : isAccessible
                              ? '0 2px 8px rgba(0, 0, 0, 0.1)'
                              : '0 1px 4px rgba(0, 0, 0, 0.05)',
                            color: completed || active ? 'white' : isAccessible ? '#64748b' : '#94a3b8',
                            fontSize: '1.2rem',
                            fontWeight: 700,
                            transition: 'all 0.3s ease',
                            transform: active ? 'scale(1.1)' : 'scale(1)',
                            border: '3px solid',
                            borderColor: completed 
                              ? '#10b981' 
                              : active 
                              ? '#1A1F71' 
                              : isAccessible
                              ? '#e2e8f0'
                              : '#f1f5f9',
                            cursor: isAccessible ? 'pointer' : 'not-allowed',
                            opacity: isAccessible ? 1 : 0.6,
                            '&:hover': isAccessible ? {
                              transform: 'scale(1.15)',
                              boxShadow: '0 8px 25px rgba(102, 126, 234, 0.4)'
                            } : {}
                          }}
                        >
                        {completed ? (
                          <CheckCircle sx={{ fontSize: 20 }} />
                        ) : (
                          index + 1
                        )}
                      </Box>
                      );
                    }}
                    sx={{
                      cursor: isStepAccessible(index) ? 'pointer' : 'not-allowed',
                      '& .MuiStepLabel-label': {
                        fontSize: '0.9rem',
                        fontWeight: 600,
                        color: activeStep === index ? '#1A1F71' : activeStep > index ? '#10b981' : isStepAccessible(index) ? '#64748b' : '#94a3b8',
                        mt: 1,
                        transition: 'all 0.3s ease',
                        cursor: isStepAccessible(index) ? 'pointer' : 'not-allowed',
                        opacity: isStepAccessible(index) ? 1 : 0.6,
                        '&:hover': isStepAccessible(index) ? {
                          color: activeStep === index ? '#1A1F71' : activeStep > index ? '#10b981' : '#1A1F71',
                          fontWeight: 700
                        } : {}
                      },
                      '& .MuiStepLabel-active': {
                        '& .MuiStepLabel-label': {
                          color: '#1A1F71 !important',
                          fontWeight: 700
                        }
                      },
                      '& .MuiStepLabel-completed': {
                        '& .MuiStepLabel-label': {
                          color: '#10b981 !important',
                          fontWeight: 600
                        }
                      }
                    }}
                  >
                    {label}
                  </StepLabel>
                  </Tooltip>
                </Step>
              ))}
            </Stepper>
            
            {/* Progress indicator */}
            <Box sx={{ mt: 2, display: 'flex', alignItems: 'center', gap: 2 }}>
            <Typography variant="body2" sx={{ color: '#374151', fontWeight: 600 }}>
              Step {activeStep + 1} of {steps.length}
            </Typography>
              <Box sx={{ flexGrow: 1, height: 4, backgroundColor: '#e2e8f0', borderRadius: 2, overflow: 'hidden' }}>
                <Box
                  sx={{
                    height: '100%',
                    width: `${((activeStep + 1) / steps.length) * 100}%`,
                    background: 'linear-gradient(90deg, #1A1F71, #2E3A8F)',
                    borderRadius: 2,
                    transition: 'width 0.3s ease'
                  }}
                />
              </Box>
              <Typography variant="body2" sx={{ color: '#1A1F71', fontWeight: 700 }}>
                {Math.round(((activeStep + 1) / steps.length) * 100)}%
              </Typography>
            </Box>
          </Box>

          {/* Enhanced Form Content */}
          <Box sx={{ 
            p: 4, 
            maxHeight: '60vh', 
            overflow: 'auto',
            background: 'linear-gradient(135deg, rgba(248, 250, 252, 0.8) 0%, rgba(241, 245, 249, 0.6) 100%)',
            position: 'relative',
            '&::before': {
              content: '""',
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: `
                radial-gradient(circle at 20% 80%, rgba(102, 126, 234, 0.05) 0%, transparent 50%),
                radial-gradient(circle at 80% 20%, rgba(118, 75, 162, 0.05) 0%, transparent 50%)
              `,
              pointerEvents: 'none'
            }
          }}>
            <LocalizationProvider dateAdapter={AdapterDateFns}>
              {/* Step 1: Basic Information */}
              {activeStep === 0 && (
                <Fade in timeout={500}>
                  <Box sx={{ position: 'relative', zIndex: 1 }}>
                    {/* Step Header */}
                    <Box sx={{ 
                      mb: 4,
                      p: 3,
                      background: 'linear-gradient(135deg, rgba(102, 126, 234, 0.1) 0%, rgba(118, 75, 162, 0.05) 100%)',
                      borderRadius: 3,
                      border: '1px solid rgba(102, 126, 234, 0.2)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 2
                    }}>
                      <Box
                        sx={{
                          p: 2,
                          borderRadius: 2,
                          background: 'linear-gradient(135deg, #1A1F71 0%, #2E3A8F 100%)',
                          boxShadow: '0 4px 12px rgba(102, 126, 234, 0.3)'
                        }}
                      >
                        <Business sx={{ fontSize: 28, color: 'white' }} />
                      </Box>
                      <Box>
                        <Typography variant="h6" sx={{ 
                          color: '#2c3e50', 
                          fontWeight: 700, 
                          mb: 0.5
                        }}>
                          Basic Information
                        </Typography>
                        <Typography variant="body2" sx={{ color: '#475569', fontWeight: 500 }}>
                          Client and business details
                        </Typography>
                      </Box>
                    </Box>

                    {/* Form Fields */}
                    <Grid container spacing={2}>
                      <Grid item xs={12} sm={6} md={4}>
                        <TextField 
                          label="Client Name" 
                          name="clientName" 
                          value={form.clientName} 
                          onChange={handleChange} 
                          fullWidth 
                          variant="standard"
                          sx={{
                            '& .MuiInput-underline:before': {
                              borderBottomColor: '#e2e8f0'
                            },
                            '& .MuiInput-underline:after': {
                              borderBottomColor: '#1A1F71'
                            },
                            '& .MuiInput-underline:hover:not(.Mui-disabled):before': {
                              borderBottomColor: '#1A1F71'
                            },
                            '& .MuiFormLabel-root': {
                              color: '#374151',
                              fontSize: '14px',
                              fontWeight: 500
                            },
                            '& .MuiInputBase-input': {
                              fontSize: '16px',
                              padding: '8px 0',
                              color: '#2c3e50',
                              fontWeight: 500
                            }
                          }}
                        />
                      </Grid>
                      <Grid item xs={12} sm={6} md={4}>
                        <TextField 
                          label="Client Code *" 
                          name="clientCode" 
                          value={form.clientCode} 
                          onChange={handleChange} 
                          fullWidth 
                          required
                          disabled
                          placeholder={isConvertingToClient ? "e.g., C00001, C00002" : "e.g., PC0001, PC0002"}
                          variant="standard"
                          sx={{
                            '& .MuiInput-underline:before': {
                              borderBottomColor: '#e2e8f0'
                            },
                            '& .MuiFormLabel-root': {
                              color: '#6b7280',
                              fontSize: '14px',
                              fontWeight: 500
                            },
                            '& .MuiInputBase-input': {
                              fontSize: '16px',
                              padding: '8px 0',
                              backgroundColor: 'rgba(102, 126, 234, 0.05)',
                              borderRadius: '4px 4px 0 0',
                              paddingLeft: '8px',
                              color: '#64748b',
                              cursor: 'not-allowed'
                            },
                            '& .MuiInputBase-input.Mui-disabled': {
                              WebkitTextFillColor: '#64748b',
                              color: '#64748b'
                            }
                          }}
                        />
                      </Grid>
                      <Grid item xs={12} sm={6} md={4}>
                        <FormControl fullWidth variant="standard" sx={{ minWidth: '200px' }}>
                          <InputLabel sx={{ 
                            color: '#374151', 
                            fontSize: '14px', 
                            fontWeight: 500,
                            whiteSpace: 'nowrap',
                            overflow: 'visible',
                            textOverflow: 'unset'
                          }}>Business Type</InputLabel>
                          <Select
                            name="businessType"
                            value={form.businessType}
                            onChange={handleChange}
                            label="Business Type"
                            MenuProps={{
                              PaperProps: {
                                sx: {
                                  maxHeight: 300,
                                  minWidth: 250,
                                  '& .MuiMenuItem-root': {
                                    fontSize: '16px',
                                    fontWeight: 500,
                                    padding: '12px 16px',
                                    color: '#2c3e50',
                                    whiteSpace: 'normal',
                                    wordWrap: 'break-word',
                                    '&:hover': {
                                      backgroundColor: 'rgba(102, 126, 234, 0.08)',
                                      color: '#1A1F71'
                                    },
                                    '&.Mui-selected': {
                                      backgroundColor: 'rgba(102, 126, 234, 0.12)',
                                      color: '#1A1F71',
                                      fontWeight: 600,
                                      '&:hover': {
                                        backgroundColor: 'rgba(102, 126, 234, 0.16)'
                                      }
                                    }
                                  }
                                }
                              }
                            }}
                            sx={{
                              '& .MuiInput-underline:before': {
                                borderBottomColor: '#e2e8f0'
                              },
                              '& .MuiInput-underline:after': {
                                borderBottomColor: '#1A1F71'
                              },
                              '& .MuiInput-underline:hover:not(.Mui-disabled):before': {
                                borderBottomColor: '#1A1F71'
                              },
                              '& .MuiInputBase-input': {
                                fontSize: '16px',
                                padding: '8px 0',
                                color: '#2c3e50',
                                fontWeight: 500,
                                overflow: 'visible',
                                textOverflow: 'unset',
                                whiteSpace: 'normal'
                              },
                              '& .MuiSelect-select': {
                                overflow: 'visible !important',
                                textOverflow: 'unset !important',
                                whiteSpace: 'normal !important'
                              }
                            }}
                          >
                            <MenuItem value="Corporation">Corporation</MenuItem>
                            <MenuItem value="Partnership">Partnership</MenuItem>
                            <MenuItem value="Sole Proprietorship">Sole Proprietorship</MenuItem>
                            <MenuItem value="LLC">Limited Liability Company (LLC)</MenuItem>
                            <MenuItem value="Limited">Limited</MenuItem>
                            <MenuItem value="LLP">Limited Liability Partnership (LLP)</MenuItem>
                            <MenuItem value="Pvt. Ltd">Private Limited (Pvt. Ltd)</MenuItem>
                            <MenuItem value="Private Limited">Private Limited Company</MenuItem>
                            <MenuItem value="Public Limited">Public Limited Company</MenuItem>
                            <MenuItem value="Non-Profit">Non-Profit Organization</MenuItem>
                            <MenuItem value="Government">Government Entity</MenuItem>
                            <MenuItem value="Trust">Trust</MenuItem>
                            <MenuItem value="Society">Society</MenuItem>
                            <MenuItem value="Others">Others</MenuItem>
                          </Select>
                        </FormControl>
                      </Grid>
                    </Grid>
                  </Box>
                </Fade>
              )}

              {/* Step 2: Contact Details */}
              {activeStep === 1 && (
                <Fade in timeout={500}>
                  <Box sx={{ position: 'relative', zIndex: 1 }}>
                    {/* Step Header */}
                    <Box sx={{ 
                      mb: 4,
                      p: 3,
                      background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.1) 0%, rgba(5, 150, 105, 0.05) 100%)',
                      borderRadius: 3,
                      border: '1px solid rgba(16, 185, 129, 0.2)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 2
                    }}>
                      <Box
                        sx={{
                          p: 2,
                          borderRadius: 2,
                          background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                          boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)'
                        }}
                      >
                        <LocationOn sx={{ fontSize: 28, color: 'white' }} />
                      </Box>
                      <Box>
                        <Typography variant="h6" sx={{ 
                          color: '#2c3e50', 
                          fontWeight: 700, 
                          mb: 0.5
                        }}>
                          Contact Details
                        </Typography>
                        <Typography variant="body2" sx={{ color: '#475569', fontWeight: 500 }}>
                          Address and location information
                        </Typography>
                      </Box>
                    </Box>
                    {/* Form Fields */}
                    <Grid container spacing={2}>
                      <Grid item xs={12}>
                        <TextField 
                          label="Complete Address" 
                          name="address" 
                          value={form.address} 
                          onChange={handleChange} 
                          fullWidth 
                          multiline
                          rows={3}
                          variant="standard"
                          sx={{
                            '& .MuiInput-underline:before': {
                              borderBottomColor: '#e2e8f0'
                            },
                            '& .MuiInput-underline:after': {
                              borderBottomColor: '#10b981'
                            },
                            '& .MuiInput-underline:hover:not(.Mui-disabled):before': {
                              borderBottomColor: '#10b981'
                            },
                            '& .MuiFormLabel-root': {
                              color: '#374151',
                              fontSize: '14px',
                              fontWeight: 500
                            },
                            '& .MuiInputBase-input': {
                              fontSize: '16px',
                              padding: '8px 0',
                              color: '#2c3e50',
                              fontWeight: 500
                            }
                          }}
                        />
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <TextField 
                          label="City" 
                          name="city" 
                          value={form.city} 
                          onChange={handleChange} 
                          fullWidth 
                          variant="standard"
                          sx={{
                            '& .MuiInput-underline:before': {
                              borderBottomColor: '#e2e8f0'
                            },
                            '& .MuiInput-underline:after': {
                              borderBottomColor: '#10b981'
                            },
                            '& .MuiInput-underline:hover:not(.Mui-disabled):before': {
                              borderBottomColor: '#10b981'
                            },
                            '& .MuiFormLabel-root': {
                              color: '#374151',
                              fontSize: '14px',
                              fontWeight: 500
                            },
                            '& .MuiInputBase-input': {
                              fontSize: '16px',
                              padding: '8px 0',
                              color: '#2c3e50',
                              fontWeight: 500
                            }
                          }}
                        />
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <TextField 
                          label="State" 
                          name="state" 
                          value={form.state} 
                          onChange={handleChange} 
                          fullWidth 
                          variant="standard"
                          sx={{
                            '& .MuiInput-underline:before': {
                              borderBottomColor: '#e2e8f0'
                            },
                            '& .MuiInput-underline:after': {
                              borderBottomColor: '#10b981'
                            },
                            '& .MuiInput-underline:hover:not(.Mui-disabled):before': {
                              borderBottomColor: '#10b981'
                            },
                            '& .MuiFormLabel-root': {
                              color: '#374151',
                              fontSize: '14px',
                              fontWeight: 500
                            },
                            '& .MuiInputBase-input': {
                              fontSize: '16px',
                              padding: '8px 0',
                              color: '#2c3e50',
                              fontWeight: 500
                            }
                          }}
                        />
                      </Grid>
                      <Grid item xs={12} sm={4}>
                        <TextField 
                          label="State Code" 
                          name="stateCode" 
                          value={form.stateCode} 
                          onChange={handleChange} 
                          fullWidth 
                          placeholder="e.g., 27"
                          variant="standard"
                          sx={{
                            '& .MuiInput-underline:before': {
                              borderBottomColor: '#e2e8f0'
                            },
                            '& .MuiInput-underline:after': {
                              borderBottomColor: '#10b981'
                            },
                            '& .MuiInput-underline:hover:not(.Mui-disabled):before': {
                              borderBottomColor: '#10b981'
                            },
                            '& .MuiFormLabel-root': {
                              color: '#374151',
                              fontSize: '14px',
                              fontWeight: 500
                            },
                            '& .MuiInputBase-input': {
                              fontSize: '16px',
                              padding: '8px 0',
                              color: '#2c3e50',
                              fontWeight: 500
                            }
                          }}
                        />
                      </Grid>
                      <Grid item xs={12} sm={4}>
                        <TextField 
                          label="Pincode" 
                          name="pincode" 
                          value={form.pincode} 
                          onChange={handleChange} 
                          fullWidth 
                          variant="standard"
                          sx={{
                            '& .MuiInput-underline:before': {
                              borderBottomColor: '#e2e8f0'
                            },
                            '& .MuiInput-underline:after': {
                              borderBottomColor: '#10b981'
                            },
                            '& .MuiInput-underline:hover:not(.Mui-disabled):before': {
                              borderBottomColor: '#10b981'
                            },
                            '& .MuiFormLabel-root': {
                              color: '#374151',
                              fontSize: '14px',
                              fontWeight: 500
                            },
                            '& .MuiInputBase-input': {
                              fontSize: '16px',
                              padding: '8px 0',
                              color: '#2c3e50',
                              fontWeight: 500
                            }
                          }}
                        />
                      </Grid>
                      <Grid item xs={12} sm={4}>
                        <TextField 
                          label="Country" 
                          name="country" 
                          value={form.country} 
                          onChange={handleChange} 
                          fullWidth 
                          variant="standard"
                          sx={{
                            '& .MuiInput-underline:before': {
                              borderBottomColor: '#e2e8f0'
                            },
                            '& .MuiInput-underline:after': {
                              borderBottomColor: '#10b981'
                            },
                            '& .MuiInput-underline:hover:not(.Mui-disabled):before': {
                              borderBottomColor: '#10b981'
                            },
                            '& .MuiFormLabel-root': {
                              color: '#374151',
                              fontSize: '14px',
                              fontWeight: 500
                            },
                            '& .MuiInputBase-input': {
                              fontSize: '16px',
                              padding: '8px 0',
                              color: '#2c3e50',
                              fontWeight: 500
                            }
                          }}
                        />
                      </Grid>
                    </Grid>
                  </Box>
                </Fade>
              )}

              {/* Step 3: Business Information */}
              {activeStep === 2 && (
                <Fade in timeout={500}>
                  <Box sx={{ position: 'relative', zIndex: 1 }}>
                    {/* Step Header */}
                    <Box sx={{ 
                      mb: 4,
                      p: 3,
                      background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.1) 0%, rgba(217, 119, 6, 0.05) 100%)',
                      borderRadius: 3,
                      border: '1px solid rgba(245, 158, 11, 0.2)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 2
                    }}>
                      <Box
                        sx={{
                          p: 2,
                          borderRadius: 2,
                          background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                          boxShadow: '0 4px 12px rgba(245, 158, 11, 0.3)'
                        }}
                      >
                        <AccountBalance sx={{ fontSize: 28, color: 'white' }} />
                      </Box>
                      <Box>
                        <Typography variant="h6" sx={{ 
                          color: '#2c3e50', 
                          fontWeight: 700, 
                          mb: 0.5
                        }}>
                          Business Information
                        </Typography>
                        <Typography variant="body2" sx={{ color: '#475569', fontWeight: 500 }}>
                          Legal and business documentation
                        </Typography>
                      </Box>
                    </Box>
                    <Grid container spacing={3}>
                      <Grid item xs={12} sm={6}>
                        <TextField 
                          label="GSTIN" 
                          name="gstin" 
                          value={form.gstin} 
                          onChange={handleChange} 
                          fullWidth 
                          placeholder="22AAAAA0000A1Z5"
                          error={form.gstin && !validateGSTIN(form.gstin)}
                          helperText={form.gstin && !validateGSTIN(form.gstin) ? "Invalid GSTIN format" : ""}
                sx={{ 
                            '& .MuiOutlinedInput-root': {
                              borderRadius: 2,
                              '& fieldset': { borderColor: 'rgba(102, 126, 234, 0.3)' },
                              '&:hover fieldset': { borderColor: '#1A1F71' },
                              '&.Mui-focused fieldset': { borderColor: '#1A1F71' }
                            }
                          }}
                        />
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <TextField 
                          label="PAN Number" 
                          name="panNumber" 
                          value={form.panNumber} 
                          onChange={handleChange} 
                          fullWidth 
                          placeholder="ABCDE1234F"
                          error={form.panNumber && !validatePAN(form.panNumber)}
                          helperText={form.panNumber && !validatePAN(form.panNumber) ? "Invalid PAN format" : ""}
                  sx={{ 
                            '& .MuiOutlinedInput-root': {
                              borderRadius: 2,
                              '& fieldset': { borderColor: 'rgba(102, 126, 234, 0.3)' },
                              '&:hover fieldset': { borderColor: '#1A1F71' },
                              '&.Mui-focused fieldset': { borderColor: '#1A1F71' }
                            }
                          }}
                        />
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <TextField 
                          label="Account Code" 
                          name="accountCode" 
                          value={form.accountCode} 
                          onChange={handleChange} 
                          fullWidth 
                          sx={{
                            '& .MuiOutlinedInput-root': {
                              borderRadius: 2,
                              '& fieldset': { borderColor: 'rgba(102, 126, 234, 0.3)' },
                              '&:hover fieldset': { borderColor: '#1A1F71' },
                              '&.Mui-focused fieldset': { borderColor: '#1A1F71' }
                            }
                          }}
                        />
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <TextField 
                          label="Website" 
                          name="website" 
                          value={form.website} 
                          onChange={handleChange} 
                          fullWidth 
                          type="url"
                          sx={{
                            '& .MuiOutlinedInput-root': {
                              borderRadius: 2,
                              '& fieldset': { borderColor: 'rgba(102, 126, 234, 0.3)' },
                              '&:hover fieldset': { borderColor: '#1A1F71' },
                              '&.Mui-focused fieldset': { borderColor: '#1A1F71' }
                            }
                          }}
                        />
                      </Grid>
                    </Grid>
                  </Box>
                </Fade>
              )}

              {/* Step 4: Contact Management */}
              {activeStep === 3 && (
                <Fade in timeout={500}>
                  <Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                      <Typography variant="h6" sx={{ 
                        color: '#1A1F71', 
                        fontWeight: 700, 
                        display: 'flex',
                        alignItems: 'center',
                        gap: 1
                      }}>
                        <Person sx={{ fontSize: 20 }} />
                        Contact Management
                      </Typography>
                      <IconButton 
                        onClick={() => setContactSectionCollapsed(!contactSectionCollapsed)}
                        size="small"
                        sx={{ color: '#1A1F71' }}
                      >
                        {contactSectionCollapsed ? <ExpandMore /> : <ExpandLess />}
                      </IconButton>
                    </Box>
                    {!contactSectionCollapsed && (
                      <Paper 
                        elevation={0}
                        sx={{ 
                          p: 2, 
                          background: 'linear-gradient(135deg, rgba(102, 126, 234, 0.05) 0%, rgba(118, 75, 162, 0.05) 100%)',
                          border: '1px solid rgba(102, 126, 234, 0.2)',
                          borderRadius: 2,
                          maxHeight: '400px',
                          overflow: 'auto',
                          '&::-webkit-scrollbar': {
                            width: '6px',
                          },
                          '&::-webkit-scrollbar-track': {
                            background: '#f1f1f1',
                            borderRadius: '3px',
                          },
                          '&::-webkit-scrollbar-thumb': {
                            background: '#c1c1c1',
                            borderRadius: '3px',
                          },
                          '&::-webkit-scrollbar-thumb:hover': {
                            background: '#a8a8a8',
                          }
                        }}
                      >
                {form.contacts.map((c, idx) => (
                        <Card key={idx} sx={{ 
                          mb: 1.5, 
                          p: 1.5,
                          background: 'rgba(255, 255, 255, 0.8)',
                          border: c.isPrimary ? '2px solid #1A1F71' : '1px solid rgba(102, 126, 234, 0.1)',
                          borderRadius: 2
                        }}>
                          <Grid container spacing={2} alignItems="center">
                            <Grid item xs={12} sm={3}>
                      <TextField 
                        label="Name" 
                        name="name" 
                        value={c.name} 
                        onChange={e => handleContactChange(idx, e)} 
                        fullWidth 
                        required 
                        size="small"
                        sx={{
                          '& .MuiOutlinedInput-root': {
                                    borderRadius: 2,
                                    '& fieldset': { borderColor: 'rgba(102, 126, 234, 0.3)' },
                                    '&:hover fieldset': { borderColor: '#1A1F71' },
                                    '&.Mui-focused fieldset': { borderColor: '#1A1F71' }
                          }
                        }}
                      />
                    </Grid>
                            <Grid item xs={12} sm={3}>
                      <TextField 
                        label="Email" 
                        name="email" 
                        value={c.email} 
                        onChange={e => handleContactChange(idx, e)} 
                        fullWidth 
                                type="email"
                        size="small"
                                error={c.email && !validateEmail(c.email)}
                        sx={{
                          '& .MuiOutlinedInput-root': {
                                    borderRadius: 2,
                                    '& fieldset': { borderColor: 'rgba(102, 126, 234, 0.3)' },
                                    '&:hover fieldset': { borderColor: '#1A1F71' },
                                    '&.Mui-focused fieldset': { borderColor: '#1A1F71' }
                          }
                        }}
                      />
                    </Grid>
                            <Grid item xs={12} sm={2}>
                      <TextField 
                                label="Phone" 
                        name="number" 
                        value={c.number} 
                        onChange={e => handleContactChange(idx, e)} 
                        fullWidth 
                        required 
                        size="small"
                        sx={{
                          '& .MuiOutlinedInput-root': {
                                    borderRadius: 2,
                                    '& fieldset': { borderColor: 'rgba(102, 126, 234, 0.3)' },
                                    '&:hover fieldset': { borderColor: '#1A1F71' },
                                    '&.Mui-focused fieldset': { borderColor: '#1A1F71' }
                          }
                        }}
                      />
                    </Grid>
                            <Grid item xs={12} sm={2}>
                      <TextField 
                        label="Department" 
                        name="department" 
                        value={c.department} 
                        onChange={e => handleContactChange(idx, e)} 
                        fullWidth 
                        size="small"
                        sx={{
                          '& .MuiOutlinedInput-root': {
                                    borderRadius: 2,
                                    '& fieldset': { borderColor: 'rgba(102, 126, 234, 0.3)' },
                                    '&:hover fieldset': { borderColor: '#1A1F71' },
                                    '&.Mui-focused fieldset': { borderColor: '#1A1F71' }
                          }
                        }}
                      />
                    </Grid>
                            <Grid item xs={12} sm={1}>
                              <Box sx={{ display: 'flex', gap: 0.5, justifyContent: 'center' }}>
                                <Tooltip title={c.isPrimary ? "Primary Contact" : "Set as Primary"}>
                                  <IconButton 
                                    onClick={() => setPrimaryContact(idx)}
                                    sx={{ 
                                      color: c.isPrimary ? '#ffc107' : '#6c757d',
                                      '&:hover': { backgroundColor: 'rgba(255, 193, 7, 0.1)' }
                                    }}
                                  >
                                    <Star fontSize="small" />
                                  </IconButton>
                                </Tooltip>
                      <IconButton 
                        onClick={() => removeContact(idx)} 
                        disabled={form.contacts.length === 1}
                        sx={{ 
                                    color: '#dc3545',
                                    '&:hover': { backgroundColor: 'rgba(220, 53, 69, 0.1)' },
                                    '&:disabled': { color: '#6c757d' }
                        }}
                      >
                        <Delete fontSize="small" />
                      </IconButton>
                              </Box>
                    </Grid>
                  </Grid>
                        </Card>
                ))}
                <Button 
                  onClick={addContact} 
                  startIcon={<Add />} 
                  variant="outlined"
                  sx={{
                          borderColor: '#1A1F71',
                          color: '#1A1F71',
                          borderRadius: 2,
                    '&:hover': {
                            borderColor: '#5a6fd8',
                            backgroundColor: 'rgba(102, 126, 234, 0.05)'
                    }
                  }}
                >
                  Add Contact
                </Button>
              </Paper>
                    )}
                  </Box>
                </Fade>
              )}

              {/* Step 5: Business Terms */}
              {activeStep === 4 && (
                <Fade in timeout={500}>
                  <Box>
                    <Typography variant="h6" sx={{ 
                      color: '#1A1F71', 
                      fontWeight: 700, 
                      mb: 2,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1
                    }}>
                      <Payment sx={{ fontSize: 20 }} />
                      Business Terms
                    </Typography>
                    <Grid container spacing={2}>
                      <Grid item xs={12} sm={6}>
                        <TextField 
                          label="Payment Terms *" 
                          name="paymentTerms" 
                          value={form.paymentTerms} 
                          onChange={handleChange} 
                          fullWidth 
                          required 
                sx={{ 
                            '& .MuiOutlinedInput-root': {
                              borderRadius: 2,
                              '& fieldset': { borderColor: 'rgba(102, 126, 234, 0.3)' },
                              '&:hover fieldset': { borderColor: '#1A1F71' },
                              '&.Mui-focused fieldset': { borderColor: '#1A1F71' }
                            }
                          }}
                        />
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <TextField 
                          label="Credit Limit (₹) *" 
                          name="creditLimit" 
                          value={form.creditLimit} 
                          onChange={handleChange} 
                          fullWidth 
                          required 
                          type="number"
                  sx={{ 
                            '& .MuiOutlinedInput-root': {
                              borderRadius: 2,
                              '& fieldset': { borderColor: 'rgba(102, 126, 234, 0.3)' },
                              '&:hover fieldset': { borderColor: '#1A1F71' },
                              '&.Mui-focused fieldset': { borderColor: '#1A1F71' }
                            }
                          }}
                        />
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <TextField 
                          label="Credit Period (Days)" 
                          name="creditPeriod" 
                          value={form.creditPeriod} 
                          onChange={handleChange} 
                          fullWidth 
                          type="number"
                          sx={{
                            '& .MuiOutlinedInput-root': {
                              borderRadius: 2,
                              '& fieldset': { borderColor: 'rgba(102, 126, 234, 0.3)' },
                              '&:hover fieldset': { borderColor: '#1A1F71' },
                              '&.Mui-focused fieldset': { borderColor: '#1A1F71' }
                            }
                          }}
                        />
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <TextField 
                          label="Delivery Terms" 
                          name="deliveryTerms" 
                          value={form.deliveryTerms} 
                          onChange={handleChange} 
                          fullWidth 
                          sx={{
                            '& .MuiOutlinedInput-root': {
                              borderRadius: 2,
                              '& fieldset': { borderColor: 'rgba(102, 126, 234, 0.3)' },
                              '&:hover fieldset': { borderColor: '#1A1F71' },
                              '&.Mui-focused fieldset': { borderColor: '#1A1F71' }
                            }
                          }}
                        />
                      </Grid>
                    </Grid>
                  </Box>
                </Fade>
              )}

              {/* Step 6: Products & Services */}
              {activeStep === 5 && (
                <Fade in timeout={500}>
                  <Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                      <Typography variant="h6" sx={{ 
                        color: '#1A1F71', 
                        fontWeight: 700, 
                        display: 'flex',
                        alignItems: 'center',
                        gap: 1
                      }}>
                        <Inventory sx={{ fontSize: 20 }} />
                        Products & Services
                      </Typography>
                      <IconButton 
                        onClick={() => setProductsSectionCollapsed(!productsSectionCollapsed)}
                        size="small"
                        sx={{ color: '#1A1F71' }}
                      >
                        {productsSectionCollapsed ? <ExpandMore /> : <ExpandLess />}
                      </IconButton>
                    </Box>
                    {!productsSectionCollapsed && (
                      <Paper 
                        elevation={0}
                        sx={{ 
                          p: 2, 
                          background: 'linear-gradient(135deg, rgba(102, 126, 234, 0.05) 0%, rgba(118, 75, 162, 0.05) 100%)',
                          border: '1px solid rgba(102, 126, 234, 0.2)',
                          borderRadius: 2,
                          maxHeight: '400px',
                          overflow: 'auto',
                          '&::-webkit-scrollbar': {
                            width: '6px',
                          },
                          '&::-webkit-scrollbar-track': {
                            background: '#f1f1f1',
                            borderRadius: '3px',
                          },
                          '&::-webkit-scrollbar-thumb': {
                            background: '#c1c1c1',
                            borderRadius: '3px',
                          },
                          '&::-webkit-scrollbar-thumb:hover': {
                            background: '#a8a8a8',
                          }
                        }}
                      >
                {form.products.map((p, idx) => (
                        <Card key={idx} sx={{ 
                          mb: 1.5, 
                          p: 1.5,
                          background: 'rgba(255, 255, 255, 0.8)',
                          border: '1px solid rgba(102, 126, 234, 0.1)',
                          borderRadius: 2
                        }}>
                          <Grid container spacing={2} alignItems="center">
                            <Grid item xs={12} sm={3}>
                      <Box sx={{ position: 'relative' }}>
                      <TextField 
                        label="Product Code" 
                        name="productCode" 
                        value={p.productCode} 
                        onChange={e => handleProductChange(idx, e)} 
                        fullWidth 
                        required 
                        size="small"
                          disabled={productCodeAutoGenerate[idx]}
                          placeholder={productCodeAutoGenerate[idx] ? "Auto-generated" : "e.g., P100000 or C100000P0001"}
                          InputProps={{
                            endAdornment: (
                              <InputAdornment position="end">
                                <Box sx={{ display: 'flex', gap: 0.5 }}>
                                  {productCodeAutoGenerate[idx] && (
                                    <Tooltip title="Regenerate Code">
                                      <IconButton
                                        size="small"
                                        onClick={() => regenerateProductCode(idx)}
                                        sx={{ color: '#1A1F71' }}
                                      >
                                        <Refresh fontSize="small" />
                                      </IconButton>
                                    </Tooltip>
                                  )}
                                  <Tooltip title={productCodeAutoGenerate[idx] ? "Switch to Manual" : "Switch to Auto"}>
                                    <IconButton
                                      size="small"
                                      onClick={() => toggleProductCodeAutoGenerate(idx)}
                                      sx={{ 
                                        color: productCodeAutoGenerate[idx] ? '#1A1F71' : '#6c757d',
                                        '&:hover': { color: '#1A1F71' }
                                      }}
                                    >
                                      {productCodeAutoGenerate[idx] ? <CheckCircle fontSize="small" /> : <Edit fontSize="small" />}
                                    </IconButton>
                                  </Tooltip>
                                </Box>
                              </InputAdornment>
                            )
                          }}
                        sx={{
                          '& .MuiOutlinedInput-root': {
                                    borderRadius: 2,
                                    '& fieldset': { borderColor: 'rgba(102, 126, 234, 0.3)' },
                                    '&:hover fieldset': { borderColor: '#1A1F71' },
                              '&.Mui-focused fieldset': { borderColor: '#1A1F71' },
                              '&.Mui-disabled': {
                                backgroundColor: 'rgba(26, 31, 113, 0.05)',
                                '& fieldset': { borderColor: 'rgba(26, 31, 113, 0.2)' }
                              }
                          }
                        }}
                      />
                      </Box>
                    </Grid>
                            <Grid item xs={12} sm={3}>
                              <TextField 
                                label="Product Name *" 
                                name="productName" 
                                value={p.productName} 
                                onChange={e => handleProductChange(idx, e)} 
                                fullWidth 
                                required
                                size="small"
                                sx={{
                                  '& .MuiOutlinedInput-root': {
                                    borderRadius: 2,
                                    '& fieldset': { borderColor: 'rgba(102, 126, 234, 0.3)' },
                                    '&:hover fieldset': { borderColor: '#1A1F71' },
                                    '&.Mui-focused fieldset': { borderColor: '#1A1F71' }
                                  }
                                }}
                              />
                            </Grid>
                            <Grid item xs={12} sm={3}>
                              <TextField 
                                label="Category" 
                                name="category" 
                                value={p.category} 
                                onChange={e => handleProductChange(idx, e)} 
                                fullWidth 
                                size="small"
                                sx={{
                                  '& .MuiOutlinedInput-root': {
                                    borderRadius: 2,
                                    '& fieldset': { borderColor: 'rgba(102, 126, 234, 0.3)' },
                                    '&:hover fieldset': { borderColor: '#1A1F71' },
                                    '&.Mui-focused fieldset': { borderColor: '#1A1F71' }
                                  }
                                }}
                              />
                            </Grid>
                            <Grid item xs={12} sm={2}>
                              <TextField 
                                label="Description" 
                                name="description" 
                                value={p.description} 
                                onChange={e => handleProductChange(idx, e)} 
                                fullWidth 
                                size="small"
                                sx={{
                                  '& .MuiOutlinedInput-root': {
                                    borderRadius: 2,
                                    '& fieldset': { borderColor: 'rgba(102, 126, 234, 0.3)' },
                                    '&:hover fieldset': { borderColor: '#1A1F71' },
                                    '&.Mui-focused fieldset': { borderColor: '#1A1F71' }
                                  }
                                }}
                              />
                            </Grid>
                            <Grid item xs={12} sm={1}>
                      <IconButton 
                        onClick={() => removeProduct(idx)} 
                        disabled={form.products.length === 1}
                        sx={{ 
                                  color: '#dc3545',
                                  '&:hover': { backgroundColor: 'rgba(220, 53, 69, 0.1)' },
                                  '&:disabled': { color: '#6c757d' }
                        }}
                      >
                        <Delete fontSize="small" />
                      </IconButton>
                    </Grid>
                  </Grid>
                        </Card>
                ))}
                <Button 
                  onClick={addProduct} 
                  startIcon={<Add />} 
                  variant="outlined"
                  sx={{
                          borderColor: '#1A1F71',
                          color: '#1A1F71',
                          borderRadius: 2,
                    '&:hover': {
                            borderColor: '#5a6fd8',
                            backgroundColor: 'rgba(102, 126, 234, 0.05)'
                    }
                  }}
                >
                        Add Product
                </Button>
              </Paper>
                    )}
                  </Box>
                </Fade>
              )}

              {/* Step 7: Additional Information */}
              {activeStep === 6 && (
                <Fade in timeout={500}>
                  <Box>
                    <Typography variant="h6" sx={{ 
                      color: '#1A1F71', 
                      fontWeight: 700, 
                      mb: 2,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 1
                    }}>
                      <Description sx={{ fontSize: 20 }} />
                      Additional Information
                    </Typography>
                    <Grid container spacing={2}>
                      <Grid item xs={12} sm={6}>
                        <FormControl fullWidth variant="standard">
                          <InputLabel sx={{ color: '#374151', fontSize: '14px', fontWeight: 500 }}>Status</InputLabel>
                          <Select
                            name="status"
                            value={form.status}
                            onChange={handleChange}
                            label="Status"
                            MenuProps={{
                              PaperProps: {
                                sx: {
                                  maxHeight: 250,
                                  minWidth: 200,
                                  '& .MuiMenuItem-root': {
                                    fontSize: '16px',
                                    fontWeight: 500,
                                    padding: '12px 16px',
                                    color: '#2c3e50',
                                    whiteSpace: 'normal',
                                    wordWrap: 'break-word',
                                    '&:hover': {
                                      backgroundColor: 'rgba(102, 126, 234, 0.08)',
                                      color: '#1A1F71'
                                    },
                                    '&.Mui-selected': {
                                      backgroundColor: 'rgba(102, 126, 234, 0.12)',
                                      color: '#1A1F71',
                                      fontWeight: 600,
                                      '&:hover': {
                                        backgroundColor: 'rgba(102, 126, 234, 0.16)'
                                      }
                                    }
                                  }
                                }
                              }
                            }}
                            sx={{
                              '& .MuiInput-underline:before': {
                                borderBottomColor: '#e2e8f0'
                              },
                              '& .MuiInput-underline:after': {
                                borderBottomColor: '#1A1F71'
                              },
                              '& .MuiInput-underline:hover:not(.Mui-disabled):before': {
                                borderBottomColor: '#1A1F71'
                              },
                              '& .MuiInputBase-input': {
                                fontSize: '16px',
                                padding: '8px 0',
                                color: '#2c3e50',
                                fontWeight: 500,
                                overflow: 'visible',
                                textOverflow: 'unset',
                                whiteSpace: 'normal'
                              },
                              '& .MuiSelect-select': {
                                overflow: 'visible !important',
                                textOverflow: 'unset !important',
                                whiteSpace: 'normal !important'
                              }
                            }}
                          >
                            <MenuItem value="Active">Active Client</MenuItem>
                            <MenuItem value="Inactive">Inactive Client</MenuItem>
                            <MenuItem value="Prospect">Prospective Client</MenuItem>
                            <MenuItem value="Suspended">Suspended Client</MenuItem>
                            <MenuItem value="Lead">Lead</MenuItem>
                            <MenuItem value="VIP">VIP Client</MenuItem>
                          </Select>
                        </FormControl>
            </Grid>
                      <Grid item xs={12} sm={6}>
                        <TextField 
                          label="Rating (1-5)" 
                          name="rating" 
                          value={form.rating} 
                          onChange={handleChange} 
                          fullWidth 
                          type="number"
                          inputProps={{ min: 1, max: 5 }}
                          sx={{
                            '& .MuiOutlinedInput-root': {
                              borderRadius: 2,
                              '& fieldset': { borderColor: 'rgba(102, 126, 234, 0.3)' },
                              '&:hover fieldset': { borderColor: '#1A1F71' },
                              '&.Mui-focused fieldset': { borderColor: '#1A1F71' }
                            },
                            '& .MuiFormLabel-root': {
                              whiteSpace: 'nowrap',
                              overflow: 'visible',
                              textOverflow: 'unset'
                            }
                          }}
                        />
          </Grid>
                      <Grid item xs={12} sm={6}>
                        <DatePicker
                          label="Last Contact Date"
                          value={form.lastContactDate ? new Date(form.lastContactDate) : null}
                          onChange={(date) => handleDateChange(date, 'lastContactDate')}
                          renderInput={(params) => (
                            <TextField 
                              {...params} 
                              fullWidth 
                              sx={{
                                '& .MuiOutlinedInput-root': {
                                  borderRadius: 2,
                                  '& fieldset': { borderColor: 'rgba(102, 126, 234, 0.3)' },
                                  '&:hover fieldset': { borderColor: '#1A1F71' },
                                  '&.Mui-focused fieldset': { borderColor: '#1A1F71' }
                                }
                              }}
                            />
                          )}
                        />
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <TextField 
                          label="Total Orders" 
                          name="totalOrders" 
                          value={form.totalOrders} 
                          onChange={handleChange} 
                          fullWidth 
                          type="number"
                          sx={{
                            '& .MuiOutlinedInput-root': {
                              borderRadius: 2,
                              '& fieldset': { borderColor: 'rgba(102, 126, 234, 0.3)' },
                              '&:hover fieldset': { borderColor: '#1A1F71' },
                              '&.Mui-focused fieldset': { borderColor: '#1A1F71' }
                            }
                          }}
                        />
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <TextField 
                          label="Total Value (₹)" 
                          name="totalValue" 
                          value={form.totalValue} 
                          onChange={handleChange} 
                          fullWidth 
                          type="number"
                          sx={{
                            '& .MuiOutlinedInput-root': {
                              borderRadius: 2,
                              '& fieldset': { borderColor: 'rgba(102, 126, 234, 0.3)' },
                              '&:hover fieldset': { borderColor: '#1A1F71' },
                              '&.Mui-focused fieldset': { borderColor: '#1A1F71' }
                            }
                          }}
                        />
                      </Grid>
                      <Grid item xs={12}>
                        <TextField 
                          label="Notes" 
                          name="notes" 
                          value={form.notes} 
                          onChange={handleChange} 
                          fullWidth 
                          multiline
                          rows={4}
                          sx={{
                            '& .MuiOutlinedInput-root': {
                              borderRadius: 2,
                              '& fieldset': { borderColor: 'rgba(102, 126, 234, 0.3)' },
                              '&:hover fieldset': { borderColor: '#1A1F71' },
                              '&.Mui-focused fieldset': { borderColor: '#1A1F71' }
                            }
                          }}
                        />
                      </Grid>
                    </Grid>
                  </Box>
                </Fade>
              )}
            </LocalizationProvider>
          </Box>
        </DialogContent>
        <DialogActions sx={{ 
          p: 4, 
          background: 'linear-gradient(135deg, rgba(248, 250, 252, 0.9) 0%, rgba(241, 245, 249, 0.8) 100%)',
          borderTop: '1px solid rgba(102, 126, 234, 0.1)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          position: 'relative',
          '&::before': {
            content: '""',
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: '2px',
            background: 'linear-gradient(90deg, #1A1F71, #2E3A8F, #f093fb)',
          }
        }}>
          <Box sx={{ display: 'flex', gap: 2 }}>
            <Button 
              disabled={activeStep === 0}
              onClick={handleBack}
              variant="outlined"
              startIcon={<Schedule />}
              sx={{
                borderColor: activeStep === 0 ? '#e2e8f0' : '#1A1F71',
                color: activeStep === 0 ? '#94a3b8' : '#1A1F71',
                borderRadius: 3,
                px: 3,
                py: 1.5,
                fontWeight: 600,
                textTransform: 'none',
                fontSize: '1rem',
                minWidth: 120,
                transition: 'all 0.3s ease',
                '&:hover': {
                  borderColor: activeStep === 0 ? '#e2e8f0' : '#5a6fd8',
                  backgroundColor: activeStep === 0 ? 'transparent' : 'rgba(102, 126, 234, 0.05)',
                  transform: activeStep === 0 ? 'none' : 'translateY(-2px)',
                  boxShadow: activeStep === 0 ? 'none' : '0 4px 12px rgba(102, 126, 234, 0.2)'
                },
                '&:disabled': {
                  borderColor: '#e2e8f0',
                  color: '#94a3b8',
                  backgroundColor: 'transparent'
                }
              }}
            >
              Back
            </Button>
            {activeStep < steps.length - 1 ? (
              <Tooltip 
                title={
                  !isCurrentStepCompleted() 
                    ? `Please complete all required fields (marked with *) to continue`
                    : `Proceed to ${steps[activeStep + 1]}`
                }
                placement="top"
                arrow
              >
                <span>
                  <Button 
                    onClick={handleNext}
                    disabled={!isCurrentStepCompleted()}
                    variant="contained"
                    endIcon={<Schedule />}
                sx={{
                  background: isCurrentStepCompleted() 
                    ? 'linear-gradient(135deg, #1A1F71 0%, #2E3A8F 100%)'
                    : 'linear-gradient(135deg, #e2e8f0 0%, #cbd5e1 100%)',
                  color: isCurrentStepCompleted() ? 'white' : '#94a3b8',
                  borderRadius: 3,
                  px: 4,
                  py: 1.5,
                  fontWeight: 700,
                  textTransform: 'none',
                  fontSize: '1rem',
                  minWidth: 140,
                  boxShadow: isCurrentStepCompleted() 
                    ? '0 6px 20px rgba(102, 126, 234, 0.3)'
                    : '0 2px 8px rgba(0, 0, 0, 0.1)',
                  transition: 'all 0.3s ease',
                  cursor: isCurrentStepCompleted() ? 'pointer' : 'not-allowed',
                  '&:hover': isCurrentStepCompleted() ? {
                    background: 'linear-gradient(135deg, #6D28D9 0%, #DB2777 100%)',
                    transform: 'translateY(-2px)',
                    boxShadow: '0 8px 25px rgba(102, 126, 234, 0.4)'
                  } : {},
                  '&:disabled': {
                    background: 'linear-gradient(135deg, #e2e8f0 0%, #cbd5e1 100%)',
                    color: '#94a3b8',
                    cursor: 'not-allowed'
                  }
                }}
              >
                Next Step
              </Button>
                </span>
              </Tooltip>
            ) : (
              <Button 
                onClick={handleSubmit} 
                startIcon={loading ? <Box sx={{ width: 16, height: 16, border: '2px solid #fff', borderTop: '2px solid transparent', borderRadius: '50%', animation: 'spin 1s linear infinite' }} /> : <Save />} 
                variant="contained"
                disabled={loading}
                sx={{
                  background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                  color: 'white',
                  borderRadius: 3,
                  px: 4,
                  py: 1.5,
                  fontWeight: 700,
                  textTransform: 'none',
                  fontSize: '1rem',
                  minWidth: 160,
                  boxShadow: '0 6px 20px rgba(16, 185, 129, 0.3)',
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    background: loading ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)' : 'linear-gradient(135deg, #059669 0%, #047857 100%)',
                    transform: loading ? 'none' : 'translateY(-2px)',
                    boxShadow: loading ? '0 6px 20px rgba(16, 185, 129, 0.3)' : '0 8px 25px rgba(16, 185, 129, 0.4)'
                  },
                  '&:disabled': {
                    background: 'linear-gradient(135deg, #94a3b8 0%, #64748b 100%)',
                    color: 'white'
                  }
                }}
              >
                {loading ? 'Saving...' : (isConvertingToClient ? 'Convert to Client' : editIndex !== null ? 'Update Client' : 'Create Client')}
              </Button>
            )}
          </Box>
          
          {/* Progress indicator */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Typography variant="body2" sx={{ color: '#374151', fontWeight: 600 }}>
              Progress: {Math.round(((activeStep + 1) / steps.length) * 100)}%
            </Typography>
            <Box sx={{ width: 80, height: 6, backgroundColor: '#e2e8f0', borderRadius: 3, overflow: 'hidden' }}>
              <Box
                sx={{
                  height: '100%',
                  width: `${((activeStep + 1) / steps.length) * 100}%`,
                  background: 'linear-gradient(90deg, #1A1F71, #2E3A8F)',
                  borderRadius: 3,
                  transition: 'width 0.3s ease'
                }}
              />
            </Box>
          </Box>

          <Button 
            onClick={handleClose} 
            startIcon={<Cancel />}
            variant="text"
            sx={{
              color: '#6c757d',
              borderRadius: 3,
              px: 3,
              py: 1.5,
              fontWeight: 600,
              textTransform: 'none',
              fontSize: '1rem',
              minWidth: 120,
              transition: 'all 0.3s ease',
              '&:hover': {
                backgroundColor: 'rgba(239, 68, 68, 0.1)',
                color: '#ef4444',
                transform: 'translateY(-1px)',
                boxShadow: '0 4px 12px rgba(239, 68, 68, 0.2)'
              }
            }}
          >
            Cancel
          </Button>
        </DialogActions>
              </Dialog>

        {/* Client Dashboard Modal */}
        <ClientDashboardModal
          open={openClientDashboard}
          onClose={() => {
            setOpenClientDashboard(false);
            setSelectedClientForDashboard(null);
          }}
          client={selectedClientForDashboard}
        />
      </Box>
    );
};

export default ProspectsClientManager; 

// Add CSS animations
const style = document.createElement('style');
style.textContent = `
  @keyframes float {
    0%, 100% { transform: translateY(0px) rotate(0deg); }
    50% { transform: translateY(-20px) rotate(5deg); }
  }
  
  @keyframes pulse {
    0%, 100% { transform: scale(1); }
    50% { transform: scale(1.05); }
  }
  
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
  
  @keyframes backgroundShift {
    0%, 100% { 
      background-position: 0% 50%;
      transform: scale(1);
    }
    25% { 
      background-position: 100% 50%;
      transform: scale(1.02);
    }
    50% { 
      background-position: 50% 100%;
      transform: scale(1.01);
    }
    75% { 
      background-position: 50% 0%;
      transform: scale(1.02);
    }
  }
  
  @keyframes shimmer {
    0% { background-position: -200% 0; }
    100% { background-position: 200% 0; }
  }
`;
document.head.appendChild(style); 
