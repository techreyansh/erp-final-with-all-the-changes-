import React, { useState, useEffect, useMemo, useCallback, memo } from 'react';
import {
  Box, Typography, Button, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, IconButton, Dialog, DialogTitle, DialogContent, DialogActions, TextField, Snackbar, Alert, Card, CardContent, Grid, Divider, CircularProgress, Container, Chip, FormControl, InputLabel, Select, MenuItem, Stepper, Step, StepLabel, Fade, Zoom, Tooltip, Pagination, InputAdornment, Tabs, Tab, Badge, Avatar, Stack, useTheme, useMediaQuery, Collapse, List, ListItem, ListItemText, ListItemIcon, Accordion, AccordionSummary, AccordionDetails, Switch, FormControlLabel
} from '@mui/material';
import { 
  Add as AddIcon, Edit as EditIcon, Delete as DeleteIcon, Business, Person, Email, Phone, 
  LocationOn, AccountBalance, Receipt, Schedule, AttachMoney, Category, Inventory, 
  LocalShipping, Payment, Description, CheckCircle, Warning, Info, Star, TrendingUp, 
  Group, Search, FilterList, ViewList, ViewModule, Refresh, Download, ExpandMore,
  Store, Assessment, Timeline, MonetizationOn, Security, AdminPanelSettings,
  TrendingDown, Speed, Verified, Cancel, CheckCircleOutline, ErrorOutline, Save, ExpandLess
} from '@mui/icons-material';
import { DatePicker, LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import vendorService from '../../../services/vendorService';
import { generateVendorCode } from '../../../utils/vendorCodeUtils';

// Enhanced vendor data structure
const emptyVendor = {
  // Basic Information
  vendorCode: '',
  vendorName: '',
  businessType: '',
  industry: '',
  category: '',
  
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
    phone: '', 
    department: '', 
    designation: '',
    isPrimary: false 
  }],
  
  // Product Information
  products: [{ 
    skuCode: '', 
    skuDescription: '', 
    category: '', 
    uom: '',
    moq: '',
    leadTime: '',
    lastPurchaseRate: '',
    rateValidity: '',
    alternateVendors: ''
  }],
  
  // Business Terms
  paymentTerms: '',
  creditLimit: '',
  creditPeriod: '',
  deliveryTerms: '',
  
  // Performance Metrics
  rating: 0,
  totalOrders: 0,
  totalValue: 0,
  onTimeDelivery: 0,
  qualityScore: 0,
  
  // Additional Information
  remarks: '',
  status: 'Active',
  lastContactDate: '',
  registrationDate: new Date().toISOString().slice(0, 10)
};

// Form steps for better organization
const steps = [
  'Basic Information',
  'Contact Details', 
  'Business Information',
  'Contact Management',
  'Product Information',
  'Business Terms',
  'Performance & Additional Info'
];

// Old generateVendorCode function removed - now using the utility function

const VendorManagement = () => {
  const [vendors, setVendors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editIndex, setEditIndex] = useState(null);
  const [form, setForm] = useState({ ...emptyVendor });
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [activeStep, setActiveStep] = useState(0);
  const [error, setError] = useState(null);
  
  // Pagination and search state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [sortBy, setSortBy] = useState('vendorName');
  const [sortOrder, setSortOrder] = useState('asc');
  
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

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

  // Using the imported generateVendorCode utility function

  const fetchVendors = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const data = await vendorService.getVendors();
      setVendors(Array.isArray(data) ? data : []);
      
      if (!Array.isArray(data)) {
        console.warn('Vendors data is not an array:', data);
        setSnackbar({ 
          open: true, 
          message: 'Warning: Vendors data format is unexpected. Please contact support.', 
          severity: 'warning' 
        });
      }
    } catch (err) {
      console.error('Error fetching vendors:', err);
      
      let errorMessage = 'Failed to load vendors. Please try again.';
      
      if (err.message) {
        if (err.message.includes('network') || err.message.includes('fetch')) {
          errorMessage = 'Network error. Please check your internet connection and try again.';
        } else if (err.message.includes('permission') || err.message.includes('access')) {
          errorMessage = 'Permission denied. Please contact your administrator.';
        } else if (err.message.includes('timeout')) {
          errorMessage = 'Request timed out. Please try again.';
        } else if (err.message.includes('sheet') || err.message.includes('spreadsheet')) {
          errorMessage = 'Unable to access vendor data. Please contact support.';
        } else {
          errorMessage = `Error loading vendors: ${err.message}`;
        }
      }
      
      setSnackbar({ 
        open: true, 
        message: errorMessage, 
        severity: 'error' 
      });
      
      // Set empty array as fallback
      setVendors([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchVendors();
  }, [fetchVendors]);

  // Debounced search term
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 300); // 300ms debounce

    return () => {
      clearTimeout(handler);
    };
  }, [searchTerm]);

  // Optimized filter and search logic with useMemo
  const filteredVendors = useMemo(() => {
    let filtered = [...vendors];

    // Search filter - only use debounced term
    if (debouncedSearchTerm) {
      const searchLower = debouncedSearchTerm.toLowerCase();
      filtered = filtered.filter(vendor => 
        vendor.vendorName?.toLowerCase().includes(searchLower) ||
        vendor.vendorCode?.toLowerCase().includes(searchLower) ||
        vendor.city?.toLowerCase().includes(searchLower) ||
        vendor.state?.toLowerCase().includes(searchLower) ||
        vendor.industry?.toLowerCase().includes(searchLower) ||
        vendor.gstin?.toLowerCase().includes(searchLower) ||
        vendor.contacts?.some(contact => 
          contact.name?.toLowerCase().includes(searchLower) ||
          contact.email?.toLowerCase().includes(searchLower)
        )
      );
    }

    // Status filter
    if (statusFilter !== 'All') {
      filtered = filtered.filter(vendor => vendor.status === statusFilter);
    }

    // Category filter
    if (categoryFilter !== 'All') {
      filtered = filtered.filter(vendor => vendor.category === categoryFilter);
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
  }, [vendors, debouncedSearchTerm, statusFilter, categoryFilter, sortBy, sortOrder]);

  // Reset to first page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedSearchTerm, statusFilter, categoryFilter]);

  // Optimized pagination logic with useMemo
  const { totalPages, currentVendors, startIndex, endIndex } = useMemo(() => {
    const totalPages = Math.ceil(filteredVendors.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const currentVendors = filteredVendors.slice(startIndex, endIndex);
    return { totalPages, currentVendors, startIndex, endIndex };
  }, [filteredVendors, currentPage, itemsPerPage]);

  // Handle items per page change
  const handleItemsPerPageChange = useCallback((event) => {
    setItemsPerPage(parseInt(event.target.value, 10));
    setCurrentPage(1); // Reset to first page
  }, []);

  const handleOpenDialog = useCallback((vendor, index) => {
    if (vendor) {
      setForm({ ...vendor });
    } else {
      const newVendor = { ...emptyVendor };
      // Vendor code will be generated when vendor name is entered
      setForm(newVendor);
    }
    setEditIndex(index);
    setActiveStep(0);
    setDialogOpen(true);
  }, [vendors]);

  const handleCloseDialog = useCallback(() => {
    setDialogOpen(false);
    setEditIndex(null);
    setForm({ ...emptyVendor });
    setError(null);
    setActiveStep(0);
  }, []);

  // Step validation helper - checks completion for a specific step
  const isStepCompleted = (stepIndex) => {
    switch (stepIndex) {
      case 0: // Basic Information
        return form.vendorName && form.businessType;
      case 1: // Contact Details
        return form.address && form.city && form.state && form.pincode && form.country;
      case 2: // Business Information
        return true; // All fields optional
      case 3: // Contact Management
        return form.contacts.length > 0 && form.contacts.every(c => c.name && c.phone);
      case 4: // Product Information  
        return true; // Products are optional
      case 5: // Business Terms
        return true; // All fields optional
      case 6: // Additional Information
        return true; // All fields optional
      default:
        return true;
    }
  };

  // Check current step completion
  const isCurrentStepCompleted = () => {
    return isStepCompleted(activeStep);
  };

  // Check if a step is accessible
  const isStepAccessible = (stepIndex) => {
    // For edit mode, all steps are accessible
    if (editIndex !== null) {
      return true;
    }
    
    // For add mode, user can only access current step or completed steps
    if (stepIndex <= activeStep) {
      return true;
    }
    
    // Check if all previous steps are completed
    for (let i = 0; i < stepIndex; i++) {
      if (!isStepCompleted(i)) {
        return false;
      }
    }
    return true;
  };

  const handleStepClick = useCallback((stepIndex) => {
    if (isStepAccessible(stepIndex)) {
      setActiveStep(stepIndex);
    }
  }, [editIndex, activeStep]);

  const handleNext = useCallback(() => {
    if (isCurrentStepCompleted()) {
      setActiveStep((prevStep) => prevStep + 1);
    }
  }, [form, activeStep]);

  const handleBack = useCallback(() => {
    setActiveStep((prevStep) => prevStep - 1);
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

    setForm(prev => {
      const updatedForm = { ...prev, [name]: formattedValue };
      
      // Auto-generate vendor code when vendor name changes (real-time updates)
      if (name === 'vendorName' && formattedValue.trim()) {
        updatedForm.vendorCode = generateVendorCode(formattedValue, vendors);
      }
      
      return updatedForm;
    });
  }, [vendors]);

  const handleDateChange = useCallback((date, field) => {
    setForm(prev => ({ ...prev, [field]: date ? new Date(date).toISOString().slice(0, 10) : '' }));
  }, []);

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
      phone: '', 
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
    setForm(prev => {
      const updated = [...prev.products];
      updated[idx][e.target.name] = e.target.value;
      return { ...prev, products: updated };
    });
  }, []);

  const addProduct = useCallback(() => setForm(prev => ({ 
    ...prev, 
    products: [...prev.products, { 
      skuCode: '', 
      skuDescription: '', 
      category: '', 
      uom: '',
      moq: '',
      leadTime: '',
      lastPurchaseRate: '',
      rateValidity: '',
      alternateVendors: ''
    }] 
  })), []);

  const removeProduct = useCallback((idx) => setForm(prev => ({ 
    ...prev, 
    products: prev.products.filter((_, i) => i !== idx) 
  })), []);

  const handleSave = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Clear any previous errors
      setSnackbar({ open: false, message: '', severity: 'success' });

      // Validate required fields
      if (!form.vendorName || form.vendorName.trim() === '') {
        setSnackbar({ 
          open: true, 
          message: 'Vendor name is required. Please enter a vendor name.', 
          severity: 'error' 
        });
        setLoading(false);
        return;
      }

      // Validate GSTIN format if provided
      if (form.gstin && !validateGSTIN(form.gstin)) {
        setSnackbar({ 
          open: true, 
          message: 'Invalid GSTIN format. Please use format: 22AAAAA0000A1Z5 (15 characters)', 
          severity: 'error' 
        });
        setLoading(false);
        return;
      }

      // Validate PAN format if provided
      if (form.panNumber && !validatePAN(form.panNumber)) {
        setSnackbar({ 
          open: true, 
          message: 'Invalid PAN format. Please use format: ABCDE1234F (10 characters)', 
          severity: 'error' 
        });
        setLoading(false);
        return;
      }

      // Validate email addresses
      const invalidEmails = form.contacts.filter(contact => contact.email && !validateEmail(contact.email));
      if (invalidEmails.length > 0) {
        setSnackbar({ 
          open: true, 
          message: `Invalid email format in contacts. Please check: ${invalidEmails.map(c => c.email).join(', ')}`, 
          severity: 'error' 
        });
        setLoading(false);
        return;
      }

      // Validate phone numbers (basic validation)
      const invalidPhones = form.contacts.filter(contact => 
        contact.phone && (contact.phone.length < 10 || !/^[0-9+\-\s()]+$/.test(contact.phone))
      );
      if (invalidPhones.length > 0) {
        setSnackbar({ 
          open: true, 
          message: 'Invalid phone number format. Please enter valid phone numbers.', 
          severity: 'error' 
        });
        setLoading(false);
        return;
      }

      // Generate vendor code if not present
      if (!form.vendorCode && form.vendorName) {
        form.vendorCode = generateVendorCode(form.vendorName, vendors);
      } else if (!form.vendorCode) {
        form.vendorCode = generateVendorCode('', vendors);
      }

      // Check for duplicate vendor codes (for new vendors)
      if (editIndex === null) {
        const duplicateCode = vendors.find(v => v.vendorCode === form.vendorCode);
        if (duplicateCode) {
          setSnackbar({ 
            open: true, 
            message: `Vendor code ${form.vendorCode} already exists. Please try again.`, 
            severity: 'error' 
          });
          setLoading(false);
          return;
        }
      }
      
      // Perform save/update operation
      if (editIndex !== null) {
        await vendorService.updateVendor(form.vendorCode, form);
        setSnackbar({ 
          open: true, 
          message: `Vendor "${form.vendorName}" updated successfully!`, 
          severity: 'success' 
        });
      } else {
        await vendorService.addVendor(form);
        setSnackbar({ 
          open: true, 
          message: `Vendor "${form.vendorName}" added successfully with code ${form.vendorCode}!`, 
          severity: 'success' 
        });
      }
      
      // Refresh vendors list after save
      await fetchVendors();
      handleCloseDialog();
      
    } catch (err) {
      console.error('Error saving vendor:', err);
      
      // Provide specific error messages based on error type
      let errorMessage = 'Failed to save vendor. Please try again.';
      
      if (err.message) {
        if (err.message.includes('Vendor not found')) {
          errorMessage = 'Vendor not found. It may have been deleted by another user.';
        } else if (err.message.includes('network') || err.message.includes('fetch')) {
          errorMessage = 'Network error. Please check your internet connection and try again.';
        } else if (err.message.includes('permission') || err.message.includes('access')) {
          errorMessage = 'Permission denied. Please contact your administrator.';
        } else if (err.message.includes('timeout')) {
          errorMessage = 'Request timed out. Please try again.';
        } else if (err.message.includes('duplicate') || err.message.includes('already exists')) {
          errorMessage = 'Vendor with this information already exists. Please check the details.';
        } else {
          errorMessage = `Error: ${err.message}`;
        }
      }
      
      setSnackbar({ 
        open: true, 
        message: errorMessage, 
        severity: 'error' 
      });
    } finally {
      setLoading(false);
    }
  }, [form, editIndex, fetchVendors, handleCloseDialog, vendors]);

  const handleDelete = useCallback(async (index) => {
    const vendorToDelete = vendors[index];
    if (!vendorToDelete) {
      setSnackbar({ 
        open: true, 
        message: 'Vendor not found. Please refresh the page and try again.', 
        severity: 'error' 
      });
      return;
    }

    setLoading(true);
    setError(null);
    
    try {
      await vendorService.deleteVendor(vendorToDelete.vendorCode);
      setSnackbar({ 
        open: true, 
        message: `Vendor "${vendorToDelete.vendorName}" deleted successfully!`, 
        severity: 'success' 
      });
      await fetchVendors();
    } catch (err) {
      console.error('Error deleting vendor:', err);
      
      let errorMessage = 'Failed to delete vendor. Please try again.';
      
      if (err.message) {
        if (err.message.includes('not found')) {
          errorMessage = 'Vendor not found. It may have been deleted by another user.';
        } else if (err.message.includes('network') || err.message.includes('fetch')) {
          errorMessage = 'Network error. Please check your internet connection and try again.';
        } else if (err.message.includes('permission') || err.message.includes('access')) {
          errorMessage = 'Permission denied. Please contact your administrator.';
        } else if (err.message.includes('timeout')) {
          errorMessage = 'Request timed out. Please try again.';
        } else {
          errorMessage = `Error: ${err.message}`;
        }
      }
      
      setSnackbar({ 
        open: true, 
        message: errorMessage, 
        severity: 'error' 
      });
    } finally {
      setLoading(false);
    }
  }, [vendors, fetchVendors]);

  return (
    <Box sx={{ 
      minHeight: '100vh',
      background: 'white',
      position: 'relative',
      overflow: 'hidden'
    }}>
      {/* Management Header */}
      <Box sx={{
        background: 'linear-gradient(135deg, #fb923c 0%, #f97316 100%)',
        color: 'white',
        py: 3,
        px: 4,
        boxShadow: '0 4px 20px rgba(251, 146, 60, 0.3)',
        position: 'sticky',
        top: 0,
        zIndex: 10,
        borderBottom: '4px solid rgba(255, 255, 255, 0.2)'
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Box
            sx={{
              p: 2,
              borderRadius: 2,
              background: 'rgba(255, 255, 255, 0.2)',
              backdropFilter: 'blur(10px)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <Business sx={{ fontSize: 36 }} />
          </Box>
                <Box>
            <Typography variant="h4" sx={{ 
              fontWeight: 800,
              textShadow: '0 2px 4px rgba(0,0,0,0.2)',
              mb: 0.5
            }}>
              Vendors Management
            </Typography>
            <Typography variant="body1" sx={{ 
              opacity: 0.95,
              fontWeight: 500
            }}>
              Manage vendor relationships and procurement partners
                  </Typography>
                </Box>
        </Box>
      </Box>

      <Box sx={{ p: 3 }}>
      {/* Animated Background Elements */}
      <Box
                  sx={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: '100%',
          background: `
            radial-gradient(circle at 20% 80%, rgba(251, 146, 60, 0.15) 0%, transparent 50%),
            radial-gradient(circle at 80% 20%, rgba(249, 115, 22, 0.15) 0%, transparent 50%),
            radial-gradient(circle at 40% 40%, rgba(251, 146, 60, 0.1) 0%, transparent 50%)
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
          background: 'linear-gradient(45deg, #fb923c, #f97316)',
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
          background: 'linear-gradient(45deg, #f97316, #fb923c)',
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
          background: 'linear-gradient(45deg, #fb923c, #f97316)',
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
          background: 'linear-gradient(45deg, #f97316, #fb923c)',
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
          background: 'linear-gradient(135deg, #fb923c 0%, #f97316 100%)',
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
                <Business sx={{ fontSize: 40 }} />
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
                    Vendor Management
                  </Typography>
          <Typography 
            variant="h6" 
            sx={{ 
              opacity: 0.9,
                    fontWeight: 400,
              maxWidth: 600
            }}
          >
                  Comprehensive vendor information management with advanced features
                  </Typography>
                        </Box>
                      </Box>
            
            {/* Stats Cards */}
            <Box sx={{ display: 'flex', gap: 2, mt: 3, flexWrap: 'wrap' }}>
              <Box
                  sx={{
                  p: 3,
                  borderRadius: 3,
                  background: 'linear-gradient(135deg, rgba(214, 112, 173, 0.9) 0%, rgba(150, 111, 214, 0.9) 100%)',
                  backdropFilter: 'blur(20px)',
                  border: '1px solid rgba(255, 255, 255, 0.3)',
                  minWidth: 140,
                  boxShadow: '0 10px 30px rgba(102, 126, 234, 0.3)',
                  transition: 'all 0.3s ease',
                    '&:hover': {
                    transform: 'translateY(-5px)',
                    boxShadow: '0 15px 40px rgba(102, 126, 234, 0.4)'
                  }
                }}
              >
                <Typography variant="h3" sx={{ fontWeight: 800, color: '#fff', textShadow: '0 2px 4px rgba(0,0,0,0.3)' }}>
                  {vendors.length}
                </Typography>
                <Typography variant="body1" sx={{ opacity: 0.9, fontWeight: 600 }}>
                  Total Vendors
                </Typography>
          </Box>
              <Box
                sx={{
                  p: 3,
                  borderRadius: 3,
                  background: 'linear-gradient(135deg, rgba(72, 187, 183, 0.9) 0%, rgba(96, 165, 250, 0.9) 100%)',
                  backdropFilter: 'blur(20px)',
                  border: '1px solid rgba(255, 255, 255, 0.3)',
                  minWidth: 140,
                  boxShadow: '0 10px 30px rgba(118, 75, 162, 0.3)',
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    transform: 'translateY(-5px)',
                    boxShadow: '0 15px 40px rgba(118, 75, 162, 0.4)'
                  }
                }}
              >
                <Typography variant="h3" sx={{ fontWeight: 800, color: '#fff', textShadow: '0 2px 4px rgba(0,0,0,0.3)' }}>
                            {vendors.filter(v => v.status === 'Active').length}
                          </Typography>
                <Typography variant="body1" sx={{ opacity: 0.9, fontWeight: 600 }}>
                  Active Vendors
                </Typography>
                        </Box>
              <Box
                sx={{
                  p: 3,
                  borderRadius: 3,
                  background: 'linear-gradient(135deg, rgba(244, 114, 94, 0.9) 0%, rgba(253, 164, 125, 0.9) 100%)',
                  backdropFilter: 'blur(20px)',
                  border: '1px solid rgba(255, 255, 255, 0.3)',
                  minWidth: 140,
                  boxShadow: '0 10px 30px rgba(102, 126, 234, 0.3)',
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    transform: 'translateY(-5px)',
                    boxShadow: '0 15px 40px rgba(102, 126, 234, 0.4)'
                  }
                }}
              >
                <Typography variant="h3" sx={{ fontWeight: 800, color: '#fff', textShadow: '0 2px 4px rgba(0,0,0,0.3)' }}>
                  {filteredVendors.length}
                </Typography>
                <Typography variant="body1" sx={{ opacity: 0.9, fontWeight: 600 }}>
                  Filtered Results
                </Typography>
                      </Box>
              <Box
                sx={{
                  p: 3,
                  borderRadius: 3,
                  background: 'linear-gradient(135deg, rgba(132, 204, 132, 0.9) 0%, rgba(163, 177, 138, 0.9) 100%)',
                  backdropFilter: 'blur(20px)',
                  border: '1px solid rgba(255, 255, 255, 0.3)',
                  minWidth: 140,
                  boxShadow: '0 10px 30px rgba(118, 75, 162, 0.3)',
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    transform: 'translateY(-5px)',
                    boxShadow: '0 15px 40px rgba(118, 75, 162, 0.4)'
                  }
                }}
              >
                <Typography variant="h3" sx={{ fontWeight: 800, color: '#fff', textShadow: '0 2px 4px rgba(0,0,0,0.3)' }}>
                            {vendors.reduce((sum, v) => sum + (v.totalOrders || 0), 0)}
                          </Typography>
                <Typography variant="body1" sx={{ opacity: 0.9, fontWeight: 600 }}>
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
              background: 'linear-gradient(90deg, #667eea, #764ba2)',
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
              borderBottom: '2px solid rgba(251, 146, 60, 0.1)'
          }}>
                        <Box>
              <Typography 
                  variant="h4" 
                sx={{ 
                    background: 'linear-gradient(135deg, #fb923c 0%, #f97316 100%)',
                    backgroundClip: 'text',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    fontWeight: 800,
                    mb: 1
                  }}
                >
                  Vendor Directory
                          </Typography>
              <Typography 
                  variant="body1" 
                sx={{ 
                    color: '#6c757d',
                    fontWeight: 500
                }}
              >
                  Manage your vendor relationships with comprehensive information tracking
              </Typography>
                        </Box>
            <Box sx={{ display: 'flex', gap: 2 }}>
              <Button 
                variant="contained" 
                startIcon={<AddIcon />}
                onClick={() => handleOpenDialog(null, null)}
                sx={{
                    background: 'linear-gradient(135deg, #fb923c 0%, #f97316 100%)',
                    '&:hover': { 
                      background: 'linear-gradient(135deg, #f97316 0%, #ea580c 100%)',
                      transform: 'translateY(-2px)',
                      boxShadow: '0 10px 20px rgba(251, 146, 60, 0.3)'
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
                  Add New Vendor
              </Button>
              <Button 
                variant="outlined" 
                startIcon={<Refresh />}
                onClick={fetchVendors}
                disabled={loading}
                sx={{
                    borderColor: '#fb923c',
                    color: '#fb923c',
                    '&:hover': { 
                      borderColor: '#f97316',
                      backgroundColor: 'rgba(251, 146, 60, 0.1)',
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
                background: 'linear-gradient(90deg, #fb923c, #f97316)',
                zIndex: 1
              }
            }}>
              <Grid container spacing={3} alignItems="center">
                    <Grid item xs={12} md={4}>
                      <TextField
                        fullWidth
                        placeholder="Search vendors..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        InputProps={{
                          startAdornment: (
                            <InputAdornment position="start">
                          <Search sx={{ color: '#fb923c' }} />
                            </InputAdornment>
                          ),
                        }}
                        sx={{
                          '& .MuiOutlinedInput-root': {
                        borderRadius: 2,
                        backgroundColor: 'rgba(255, 255, 255, 0.8)',
                        '& fieldset': { borderColor: 'rgba(251, 146, 60, 0.3)' },
                        '&:hover fieldset': { borderColor: '#fb923c' },
                        '&.Mui-focused fieldset': { borderColor: '#fb923c' }
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
                      sx={{
                        borderRadius: 2,
                        backgroundColor: 'rgba(255, 255, 255, 0.8)',
                        '& fieldset': { borderColor: 'rgba(251, 146, 60, 0.3)' },
                        '&:hover fieldset': { borderColor: '#fb923c' },
                        '&.Mui-focused fieldset': { borderColor: '#fb923c' },
                        '& .MuiSelect-select': {
                          minWidth: '200px', // Minimum width for complete status display
                          fontSize: '0.875rem', // Slightly smaller font to fit more text
                          whiteSpace: 'nowrap', // Prevent text wrapping
                          overflow: 'visible', // Allow text to extend beyond bounds if needed
                          textOverflow: 'unset', // Don't truncate with ellipsis
                        }
                      }}
                        >
                          <MenuItem value="All">All</MenuItem>
                          <MenuItem value="Active">Active</MenuItem>
                          <MenuItem value="Inactive">Inactive</MenuItem>
                          <MenuItem value="Suspended">Suspended</MenuItem>
                        </Select>
                      </FormControl>
                    </Grid>
                    <Grid item xs={12} md={2}>
                      <FormControl fullWidth>
                        <InputLabel>Category</InputLabel>
                        <Select
                          value={categoryFilter}
                          onChange={(e) => setCategoryFilter(e.target.value)}
                      sx={{
                        borderRadius: 2,
                        backgroundColor: 'rgba(255, 255, 255, 0.8)',
                        '& fieldset': { borderColor: 'rgba(251, 146, 60, 0.3)' },
                        '&:hover fieldset': { borderColor: '#fb923c' },
                        '&.Mui-focused fieldset': { borderColor: '#fb923c' },
                        '& .MuiSelect-select': {
                          minWidth: '200px', // Minimum width for complete category display
                          fontSize: '0.875rem', // Slightly smaller font to fit more text
                          whiteSpace: 'nowrap', // Prevent text wrapping
                          overflow: 'visible', // Allow text to extend beyond bounds if needed
                          textOverflow: 'unset', // Don't truncate with ellipsis
                        }
                      }}
                        >
                          <MenuItem value="All">All</MenuItem>
                          <MenuItem value="Raw Materials">Raw Materials</MenuItem>
                          <MenuItem value="Components">Components</MenuItem>
                          <MenuItem value="Services">Services</MenuItem>
                          <MenuItem value="Equipment">Equipment</MenuItem>
                        </Select>
                      </FormControl>
                    </Grid>
                    <Grid item xs={12} md={2}>
                      <FormControl fullWidth>
                        <InputLabel>Sort By</InputLabel>
                        <Select
                          value={sortBy}
                          onChange={(e) => setSortBy(e.target.value)}
                      sx={{
                        borderRadius: 2,
                        backgroundColor: 'rgba(255, 255, 255, 0.8)',
                        '& fieldset': { borderColor: 'rgba(251, 146, 60, 0.3)' },
                        '&:hover fieldset': { borderColor: '#fb923c' },
                        '&.Mui-focused fieldset': { borderColor: '#fb923c' },
                        '& .MuiSelect-select': {
                          minWidth: '200px', // Minimum width for complete sort option display
                          fontSize: '0.875rem', // Slightly smaller font to fit more text
                          whiteSpace: 'nowrap', // Prevent text wrapping
                          overflow: 'visible', // Allow text to extend beyond bounds if needed
                          textOverflow: 'unset', // Don't truncate with ellipsis
                        }
                      }}
                        >
                          <MenuItem value="vendorName">Name</MenuItem>
                          <MenuItem value="vendorCode">Code</MenuItem>
                          <MenuItem value="city">City</MenuItem>
                          <MenuItem value="rating">Rating</MenuItem>
                          <MenuItem value="totalValue">Value</MenuItem>
                        </Select>
                      </FormControl>
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
                      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      mb: 2,
                      animation: 'pulse 2s infinite'
                    }}
                  >
                    <Business sx={{ color: 'white', fontSize: 30 }} />
            </Box>
                  <Typography variant="h6" sx={{ color: '#6c757d', fontWeight: 600 }}>
                    Loading vendors...
                  </Typography>
                </Box>
              </Box>
            ) : (
              <>
                  <TableContainer 
                    component={Paper} 
                    sx={{ 
                          borderRadius: 3,
                          background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.95) 0%, rgba(255, 255, 255, 0.85) 100%)',
                          backdropFilter: 'blur(20px)',
                          border: '2px solid rgba(255, 255, 255, 0.3)',
                          overflowX: 'auto',
                          overflowY: 'hidden',
                          boxShadow: '0 15px 40px rgba(0,0,0,0.1), 0 0 0 1px rgba(255,255,255,0.2)',
                          position: 'relative',
                          '&::before': {
                            content: '""',
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            right: 0,
                            height: '3px',
                            background: 'linear-gradient(90deg, #fb923c, #f97316)',
                            zIndex: 1
                          }
                        }}
                      >
                <Table size="medium" sx={{ minWidth: 1200 }}>
                    <TableHead>
                    <TableRow sx={{ 
                      background: 'linear-gradient(135deg, #fb923c 0%, #f97316 100%)',
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
                      <TableCell sx={{ minWidth: 180 }}>Vendor Name</TableCell>
                      <TableCell sx={{ minWidth: 100 }}>Code</TableCell>
                      <TableCell sx={{ minWidth: 140 }}>Business Type</TableCell>
                      <TableCell sx={{ minWidth: 140 }}>Category</TableCell>
                      <TableCell sx={{ minWidth: 150 }}>Location</TableCell>
                      <TableCell sx={{ minWidth: 120 }}>Contacts</TableCell>
                      <TableCell sx={{ minWidth: 100 }}>Status</TableCell>
                      <TableCell sx={{ minWidth: 120 }}>Rating</TableCell>
                      <TableCell align="center" sx={{ minWidth: 120 }}>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                      {currentVendors.length === 0 ? (
                    <TableRow>
                        <TableCell colSpan={9} align="center" sx={{ py: 6 }}>
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
                              <Business sx={{ color: '#6c757d', fontSize: 40 }} />
                            </Box>
                            <Typography variant="h6" sx={{ color: '#6c757d', fontWeight: 600, mb: 1 }}>
                                No vendors found
                              </Typography>
                            <Typography variant="body2" sx={{ color: '#adb5bd' }}>
                                {searchTerm ? 'Try adjusting your search criteria' : 'Add your first vendor to get started'}
                              </Typography>
                            </Box>
                          </TableCell>
                    </TableRow>
                      ) : (
                        currentVendors.map((vendor, idx) => (
                  <TableRow 
                    key={vendor.vendorCode}
                    sx={{ 
                            '&:hover': { 
                              background: 'linear-gradient(135deg, rgba(251, 146, 60, 0.08) 0%, rgba(249, 115, 22, 0.08) 100%)',
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
                        >
                          <TableCell sx={{ fontWeight: 600, color: '#2c3e50' }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <Business sx={{ color: '#fb923c', fontSize: 20 }} />
                                <Box>
                                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                    {vendor.vendorName || 'Unnamed Vendor'}
                                  </Typography>
                                <Typography variant="caption" sx={{ color: '#475569', fontWeight: 500 }}>
                                    {vendor.industry || 'No industry'}
                                  </Typography>
                                </Box>
                              </Box>
                            </TableCell>
                            <TableCell>
                      <Chip
                        label={vendor.vendorCode || 'N/A'}
                        size="small"
                        sx={{
                                background: 'linear-gradient(135deg, #fb923c 0%, #f97316 100%)',
                                color: 'white',
                                fontWeight: 600,
                                fontSize: '0.75rem'
                        }}
                      />
                            </TableCell>
                          <TableCell sx={{ color: '#2c3e50', minWidth: 140, maxWidth: 180 }}>
                            <Box>
                              <Typography 
                                variant="body2" 
                                sx={{ 
                                  fontWeight: 600, 
                                  color: '#2c3e50',
                                  whiteSpace: 'nowrap',
                                  overflow: 'hidden',
                                  textOverflow: 'ellipsis'
                                }}
                                title={vendor.businessType || 'N/A'}
                              >
                                {vendor.businessType || 'N/A'}
                              </Typography>
                              {vendor.gstin && (
                                <Typography variant="caption" sx={{ color: '#059669', fontWeight: 500 }}>
                                  GST: {vendor.gstin}
                              </Typography>
                              )}
                            </Box>
                            </TableCell>
                            <TableCell sx={{ color: '#2c3e50', minWidth: 140, maxWidth: 160 }}>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                <Category sx={{ fontSize: 16, color: '#fb923c', flexShrink: 0 }} />
                                <Typography 
                                  variant="body2" 
                                  sx={{ 
                                    fontWeight: 600, 
                                    color: '#2c3e50',
                                    whiteSpace: 'nowrap',
                                    overflow: 'hidden',
                                    textOverflow: 'ellipsis',
                                    minWidth: 0
                                  }}
                                  title={vendor.category || 'N/A'}
                                >
                                  {vendor.category || 'N/A'}
                                </Typography>
                              </Box>
                            </TableCell>
                          <TableCell sx={{ color: '#2c3e50' }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                              <LocationOn sx={{ fontSize: 16, color: '#fb923c' }} />
                              <Box>
                      <Typography 
                        variant="body2" 
                        sx={{ 
                                    fontWeight: 600,
                                    color: '#2c3e50',
                                    lineHeight: 1.4
                        }}
                      >
                                  {vendor.city || 'N/A'}, {vendor.state || 'N/A'}
                              </Typography>
                                <Typography variant="caption" sx={{ color: '#475569', fontWeight: 500 }}>
                                  {vendor.pincode || ''}
                              </Typography>
                              </Box>
                            </Box>
                            </TableCell>
                            <TableCell>
                      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                              {vendor.contacts?.slice(0, 2).map((c, i) => (
                          <Box key={i} sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                  <Person fontSize="small" sx={{ color: '#fb923c' }} />
                                  <Typography variant="body2" sx={{ color: '#2c3e50', fontWeight: 600 }}>
                              {c.name || 'No name'}
                              </Typography>
                                  {c.isPrimary && (
                                    <Star sx={{ fontSize: 12, color: '#ffc107' }} />
                                  )}
                          </Box>
                        ))}
                              {vendor.contacts?.length > 2 && (
                                <Typography variant="caption" sx={{ color: '#475569', fontWeight: 500 }}>
                                  +{vendor.contacts.length - 2} more
                              </Typography>
                              )}
                              {(!vendor.contacts || vendor.contacts.length === 0) && (
                                <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 500 }}>
                                  No contacts
                              </Typography>
                              )}
                      </Box>
                            </TableCell>
                            <TableCell>
                            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                              <Chip
                                label={vendor.status || 'Active'}
                                size="small"
                            sx={{
                                  backgroundColor: vendor.status === 'Active' ? '#d4edda' : 
                                                  vendor.status === 'Inactive' ? '#f8d7da' : '#fff3cd',
                                  color: vendor.status === 'Active' ? '#155724' : 
                                        vendor.status === 'Inactive' ? '#721c24' : '#856404',
                                  fontWeight: 600,
                              fontSize: '0.7rem'
                            }}
                          />
                              {vendor.totalOrders > 0 && (
                                <Typography variant="caption" sx={{ color: '#475569', fontWeight: 500 }}>
                                  {vendor.totalOrders} orders
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
                                      color: i < (vendor.rating || 0) ? '#ffc107' : '#e9ecef'
                                    }}
                                  />
                                ))}
                              </Box>
                              {vendor.totalValue > 0 && (
                                <Typography variant="caption" sx={{ color: '#28a745', fontWeight: 600 }}>
                                  ₹{vendor.totalValue.toLocaleString()}
                                </Typography>
                              )}
                            </Box>
                            </TableCell>
                      <TableCell align="center">
                            <Box sx={{ display: 'flex', gap: 1, justifyContent: 'center' }}>
                                <Tooltip title="Edit Vendor">
                                  <IconButton 
                                    onClick={() => handleOpenDialog(vendor, idx)}
                          sx={{ 
                                    color: '#fb923c',
                                    '&:hover': { 
                                      backgroundColor: 'rgba(251, 146, 60, 0.1)',
                                      transform: 'scale(1.1)'
                                    },
                                    transition: 'all 0.2s ease'
                          }}
                                  >
                                    <EditIcon fontSize="small" />
                                  </IconButton>
                                </Tooltip>
                                <Tooltip title="Delete Vendor">
                                  <IconButton 
                                    onClick={() => handleDelete(idx)}
                          sx={{ 
                                    color: '#dc3545',
                                    '&:hover': { 
                                      backgroundColor: 'rgba(220, 53, 69, 0.1)',
                                      transform: 'scale(1.1)'
                                    },
                                    transition: 'all 0.2s ease'
                          }}
                                  >
                                    <DeleteIcon fontSize="small" />
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
              
              {/* Enhanced Pagination Controls */}
              {filteredVendors.length > 0 && (
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
                    background: 'linear-gradient(90deg, #fb923c, #f97316)',
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
                            borderColor: 'rgba(251, 146, 60, 0.3)',
                          },
                          '&:hover .MuiOutlinedInput-notchedOutline': {
                            borderColor: 'rgba(251, 146, 60, 0.5)',
                          },
                          '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                            borderColor: '#fb923c',
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
                      {startIndex + 1}-{Math.min(endIndex, filteredVendors.length)} of {filteredVendors.length} vendors
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
                              background: 'linear-gradient(135deg, #fb923c 0%, #f97316 100%)',
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
      </Box>
      {/* End of content wrapper */}
      
      {/* Enhanced Multi-Step Dialog */}
      <Dialog 
        open={dialogOpen} 
        onClose={handleCloseDialog} 
        maxWidth="lg" 
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 4,
            background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.95) 0%, rgba(248, 250, 252, 0.9) 100%)',
            backdropFilter: 'blur(20px)',
            border: '1px solid rgba(251, 146, 60, 0.2)',
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
              background: 'linear-gradient(90deg, #fb923c, #f97316, #fb923c)',
              zIndex: 2
            }
          }
        }}
      >
        <DialogTitle sx={{ 
          background: 'linear-gradient(135deg, rgba(251, 146, 60, 0.1) 0%, rgba(249, 115, 22, 0.05) 100%)',
          color: '#2c3e50',
          fontWeight: 700,
          fontSize: '1.8rem',
          py: 3,
          px: 4,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          position: 'relative',
          borderBottom: '1px solid rgba(251, 146, 60, 0.1)'
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Box
              sx={{
                p: 2,
                borderRadius: 3,
                background: 'linear-gradient(135deg, #fb923c 0%, #f97316 100%)',
                boxShadow: '0 8px 20px rgba(251, 146, 60, 0.3)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <Business sx={{ fontSize: 32, color: 'white' }} />
          </Box>
            <Box>
              <Typography variant="h5" sx={{ fontWeight: 700, color: '#2c3e50', mb: 0.5 }}>
                {editIndex !== null ? 'Edit Vendor Information' : 'Add New Vendor'}
              </Typography>
              <Typography variant="body2" sx={{ color: '#64748b', fontWeight: 500 }}>
                {editIndex !== null ? 'Update vendor details' : 'Create vendor profile'}
              </Typography>
            </Box>
          </Box>
          <IconButton 
            onClick={handleCloseDialog}
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
            borderBottom: '1px solid rgba(251, 146, 60, 0.1)',
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
                    background: 'linear-gradient(90deg, #fb923c, #f97316)',
                    boxShadow: '0 2px 8px rgba(251, 146, 60, 0.3)'
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
                        ? `Complete step ${index} first to access this step`
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
                              ? 'linear-gradient(135deg, #fb923c 0%, #f97316 100%)'
                              : isAccessible
                              ? 'linear-gradient(135deg, #e2e8f0 0%, #cbd5e0 100%)'
                              : 'linear-gradient(135deg, #f1f5f9 0%, #e2e8f0 100%)',
                            boxShadow: completed || active 
                              ? '0 6px 20px rgba(251, 146, 60, 0.3)' 
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
                              ? '#fb923c' 
                              : isAccessible
                              ? '#e2e8f0'
                              : '#f1f5f9',
                            cursor: isAccessible ? 'pointer' : 'not-allowed',
                            opacity: isAccessible ? 1 : 0.6,
                            '&:hover': isAccessible ? {
                              transform: 'scale(1.15)',
                              boxShadow: '0 8px 25px rgba(251, 146, 60, 0.4)'
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
                        color: activeStep === index ? '#fb923c' : activeStep > index ? '#10b981' : isStepAccessible(index) ? '#64748b' : '#94a3b8',
                        mt: 1,
                        transition: 'all 0.3s ease',
                        cursor: isStepAccessible(index) ? 'pointer' : 'not-allowed',
                        opacity: isStepAccessible(index) ? 1 : 0.6,
                        '&:hover': isStepAccessible(index) ? {
                          color: activeStep === index ? '#fb923c' : activeStep > index ? '#10b981' : '#fb923c',
                          fontWeight: 700
                        } : {}
                      },
                      '& .MuiStepLabel-active': {
                        '& .MuiStepLabel-label': {
                          color: '#fb923c !important',
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
                    background: 'linear-gradient(90deg, #fb923c, #f97316)',
                    borderRadius: 2,
                    transition: 'width 0.3s ease'
                  }}
                />
              </Box>
              <Typography variant="body2" sx={{ color: '#fb923c', fontWeight: 700 }}>
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
                radial-gradient(circle at 20% 80%, rgba(251, 146, 60, 0.05) 0%, transparent 50%),
                radial-gradient(circle at 80% 20%, rgba(249, 115, 22, 0.05) 0%, transparent 50%)
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
                      background: 'linear-gradient(135deg, rgba(251, 146, 60, 0.1) 0%, rgba(249, 115, 22, 0.05) 100%)',
                      borderRadius: 3,
                      border: '1px solid rgba(251, 146, 60, 0.2)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 2
                    }}>
                      <Box
                        sx={{
                          p: 2,
                          borderRadius: 2,
                          background: 'linear-gradient(135deg, #fb923c 0%, #f97316 100%)',
                          boxShadow: '0 4px 12px rgba(251, 146, 60, 0.3)'
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
                          Vendor and business details
                        </Typography>
                      </Box>
                    </Box>

                    {/* Form Fields */}
                    <Grid container spacing={2}>
                      <Grid item xs={12} sm={6} md={4}>
                        <TextField
                          label="Vendor Name" 
                          name="vendorName" 
                          value={form.vendorName} 
                          onChange={handleChange} 
                          fullWidth
                          required 
                          variant="standard"
                          sx={{
                            '& .MuiInput-underline:before': {
                              borderBottomColor: '#e2e8f0'
                            },
                            '& .MuiInput-underline:after': {
                              borderBottomColor: '#fb923c'
                            },
                            '& .MuiInput-underline:hover:not(.Mui-disabled):before': {
                              borderBottomColor: '#fb923c'
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
                          label="Vendor Code *" 
                          name="vendorCode" 
                          value={form.vendorCode} 
                          onChange={handleChange}
                          fullWidth
                          required
                          placeholder="e.g., V0001, V0002, V0003"
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
                              backgroundColor: 'rgba(251, 146, 60, 0.05)',
                              borderRadius: '4px 4px 0 0',
                              paddingLeft: '8px',
                              color: '#64748b'
                            }
                          }}
                        />
                      </Grid>
                      <Grid item xs={12} sm={6} md={4}>
                        <FormControl fullWidth variant="standard" required sx={{ minWidth: '200px' }}>
                          <InputLabel sx={{ 
                            color: '#374151', 
                            fontSize: '14px', 
                            fontWeight: 500,
                            whiteSpace: 'nowrap',
                            overflow: 'visible',
                            textOverflow: 'unset'
                          }}>Business Type *</InputLabel>
                          <Select
                            name="businessType"
                            value={form.businessType}
                            onChange={handleChange}
                            label="Business Type *"
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
                                      backgroundColor: 'rgba(251, 146, 60, 0.08)',
                                      color: '#fb923c'
                                    },
                                    '&.Mui-selected': {
                                      backgroundColor: 'rgba(251, 146, 60, 0.12)',
                                      color: '#fb923c',
                                      fontWeight: 600,
                                      '&:hover': {
                                        backgroundColor: 'rgba(251, 146, 60, 0.16)'
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
                                borderBottomColor: '#fb923c'
                              },
                              '& .MuiInput-underline:hover:not(.Mui-disabled):before': {
                                borderBottomColor: '#fb923c'
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
                            <MenuItem value="Manufacturer">Manufacturer</MenuItem>
                            <MenuItem value="Supplier">Supplier</MenuItem>
                            <MenuItem value="Service Provider">Service Provider</MenuItem>
                            <MenuItem value="Distributor">Distributor</MenuItem>
                            <MenuItem value="Trader">Trader</MenuItem>
                            <MenuItem value="Wholesaler">Wholesaler</MenuItem>
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
                          label="Complete Address *" 
                          name="address"
                          value={form.address}
                          onChange={handleChange}
                          fullWidth
                          required 
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
                          label="City *" 
                          name="city"
                          value={form.city}
                          onChange={handleChange}
                          fullWidth
                          required 
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
                          label="State *" 
                          name="state"
                          value={form.state}
                          onChange={handleChange}
                          fullWidth
                          required 
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
                          label="Pincode *" 
                          name="pincode" 
                          value={form.pincode} 
                          onChange={handleChange}
                          fullWidth
                          required 
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
                          label="Country *" 
                          name="country"
                          value={form.country}
                          onChange={handleChange}
                          fullWidth
                          required 
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
                              '& fieldset': { borderColor: 'rgba(251, 146, 60, 0.3)' },
                              '&:hover fieldset': { borderColor: '#fb923c' },
                              '&.Mui-focused fieldset': { borderColor: '#fb923c' }
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
                              '& fieldset': { borderColor: 'rgba(251, 146, 60, 0.3)' },
                              '&:hover fieldset': { borderColor: '#fb923c' },
                              '&.Mui-focused fieldset': { borderColor: '#fb923c' }
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
                              '& fieldset': { borderColor: 'rgba(251, 146, 60, 0.3)' },
                              '&:hover fieldset': { borderColor: '#fb923c' },
                              '&.Mui-focused fieldset': { borderColor: '#fb923c' }
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
                              '& fieldset': { borderColor: 'rgba(251, 146, 60, 0.3)' },
                              '&:hover fieldset': { borderColor: '#fb923c' },
                              '&.Mui-focused fieldset': { borderColor: '#fb923c' }
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
                    <Typography variant="h6" sx={{ 
                      color: '#fb923c', 
                      fontWeight: 700, 
                      mb: 2,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1
                    }}>
                      <Person sx={{ fontSize: 20 }} />
                        Contact Management
                      </Typography>
                    <Paper 
                        elevation={0}
                        sx={{ 
                          p: 2, 
                          background: 'linear-gradient(135deg, rgba(251, 146, 60, 0.05) 0%, rgba(249, 115, 22, 0.05) 100%)',
                          border: '1px solid rgba(251, 146, 60, 0.2)',
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
                          border: c.isPrimary ? '2px solid #fb923c' : '1px solid rgba(251, 146, 60, 0.1)',
                          borderRadius: 2
                        }}>
                          <Grid container spacing={2} alignItems="center">
                            <Grid item xs={12} sm={3}>
                              <TextField
                        label="Name *" 
                                name="name"
                        value={c.name} 
                        onChange={e => handleContactChange(idx, e)} 
                                fullWidth
                        required 
                        size="small"
                        sx={{
                          '& .MuiOutlinedInput-root': {
                                    borderRadius: 2,
                                    '& fieldset': { borderColor: 'rgba(251, 146, 60, 0.3)' },
                                    '&:hover fieldset': { borderColor: '#fb923c' },
                                    '&.Mui-focused fieldset': { borderColor: '#fb923c' }
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
                                    '& fieldset': { borderColor: 'rgba(251, 146, 60, 0.3)' },
                                    '&:hover fieldset': { borderColor: '#fb923c' },
                                    '&.Mui-focused fieldset': { borderColor: '#fb923c' }
                          }
                        }}
                              />
                            </Grid>
                            <Grid item xs={12} sm={2}>
                              <TextField
                                label="Phone *" 
                                name="phone"
                        value={c.phone} 
                        onChange={e => handleContactChange(idx, e)} 
                                fullWidth
                        required 
                        size="small"
                        sx={{
                          '& .MuiOutlinedInput-root': {
                                    borderRadius: 2,
                                    '& fieldset': { borderColor: 'rgba(251, 146, 60, 0.3)' },
                                    '&:hover fieldset': { borderColor: '#fb923c' },
                                    '&.Mui-focused fieldset': { borderColor: '#fb923c' }
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
                                    '& fieldset': { borderColor: 'rgba(251, 146, 60, 0.3)' },
                                    '&:hover fieldset': { borderColor: '#fb923c' },
                                    '&.Mui-focused fieldset': { borderColor: '#fb923c' }
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
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                              </Box>
                            </Grid>
                          </Grid>
                      </Card>
                    ))}
                <Button 
                  onClick={addContact} 
                  startIcon={<AddIcon />} 
                  variant="outlined"
                  sx={{
                          borderColor: '#fb923c',
                          color: '#fb923c',
                          borderRadius: 2,
                    '&:hover': {
                            borderColor: '#f97316',
                            backgroundColor: 'rgba(251, 146, 60, 0.05)'
                    }
                  }}
                >
                  Add Contact
                </Button>
              </Paper>
                  </Box>
              </Fade>
            )}

              {/* Step 5: Product Information */}
            {activeStep === 4 && (
                <Fade in timeout={500}>
                  <Box>
                    <Typography variant="h6" sx={{ 
                      color: '#fb923c', 
                      fontWeight: 700, 
                      mb: 2,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 1
                    }}>
                      <Inventory sx={{ fontSize: 20 }} />
                        Product Information
                      </Typography>
                    <Paper 
                        elevation={0}
                        sx={{ 
                          p: 2, 
                          background: 'linear-gradient(135deg, rgba(251, 146, 60, 0.05) 0%, rgba(249, 115, 22, 0.05) 100%)',
                          border: '1px solid rgba(251, 146, 60, 0.2)',
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
                          border: '1px solid rgba(251, 146, 60, 0.1)',
                          borderRadius: 2
                        }}>
                          <Grid container spacing={2} alignItems="center">
                            <Grid item xs={12} sm={3}>
                              <TextField
                                label="SKU Code"
                                name="skuCode"
                        value={p.skuCode} 
                        onChange={e => handleProductChange(idx, e)} 
                                fullWidth
                        size="small"
                        sx={{
                          '& .MuiOutlinedInput-root': {
                                    borderRadius: 2,
                                    '& fieldset': { borderColor: 'rgba(251, 146, 60, 0.3)' },
                                    '&:hover fieldset': { borderColor: '#fb923c' },
                                    '&.Mui-focused fieldset': { borderColor: '#fb923c' }
                          }
                        }}
                              />
                            </Grid>
                            <Grid item xs={12} sm={3}>
                              <TextField
                                label="Description" 
                                name="skuDescription"
                                value={p.skuDescription} 
                                onChange={e => handleProductChange(idx, e)} 
                                fullWidth
                                size="small"
                                sx={{
                                  '& .MuiOutlinedInput-root': {
                                    borderRadius: 2,
                                    '& fieldset': { borderColor: 'rgba(251, 146, 60, 0.3)' },
                                    '&:hover fieldset': { borderColor: '#fb923c' },
                                    '&.Mui-focused fieldset': { borderColor: '#fb923c' }
                                  }
                                }}
                              />
                            </Grid>
                            <Grid item xs={12} sm={2}>
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
                                    '& fieldset': { borderColor: 'rgba(251, 146, 60, 0.3)' },
                                    '&:hover fieldset': { borderColor: '#fb923c' },
                                    '&.Mui-focused fieldset': { borderColor: '#fb923c' }
                                  }
                                }}
                              />
                            </Grid>
                            <Grid item xs={12} sm={2}>
                              <TextField
                                label="UOM"
                                name="uom"
                                value={p.uom} 
                                onChange={e => handleProductChange(idx, e)} 
                                fullWidth
                                size="small"
                                sx={{
                                  '& .MuiOutlinedInput-root': {
                                    borderRadius: 2,
                                    '& fieldset': { borderColor: 'rgba(251, 146, 60, 0.3)' },
                                    '&:hover fieldset': { borderColor: '#fb923c' },
                                    '&.Mui-focused fieldset': { borderColor: '#fb923c' }
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
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                      </Grid>
                      </Grid>
                      </Card>
                    ))}
                <Button 
                  onClick={addProduct} 
                  startIcon={<AddIcon />} 
                  variant="outlined"
                  sx={{
                          borderColor: '#fb923c',
                          color: '#fb923c',
                          borderRadius: 2,
                    '&:hover': {
                            borderColor: '#f97316',
                            backgroundColor: 'rgba(251, 146, 60, 0.05)'
                    }
                  }}
                >
                        Add Product
                </Button>
              </Paper>
                  </Box>
              </Fade>
            )}

              {/* Step 6: Business Terms */}
            {activeStep === 5 && (
                <Fade in timeout={500}>
                  <Box>
                    <Typography variant="h6" sx={{ 
                      color: '#fb923c', 
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
                          label="Payment Terms"
                          name="paymentTerms"
                          value={form.paymentTerms}
                          onChange={handleChange}
                          fullWidth
                          sx={{ 
                            '& .MuiOutlinedInput-root': {
                              borderRadius: 2,
                              '& fieldset': { borderColor: 'rgba(251, 146, 60, 0.3)' },
                              '&:hover fieldset': { borderColor: '#fb923c' },
                              '&.Mui-focused fieldset': { borderColor: '#fb923c' }
                            }
                          }}
                        />
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <TextField 
                          label="Credit Limit (₹)"
                          name="creditLimit"
                          value={form.creditLimit}
                          onChange={handleChange} 
                          fullWidth 
                          type="number"
                          sx={{ 
                            '& .MuiOutlinedInput-root': {
                              borderRadius: 2,
                              '& fieldset': { borderColor: 'rgba(251, 146, 60, 0.3)' },
                              '&:hover fieldset': { borderColor: '#fb923c' },
                              '&.Mui-focused fieldset': { borderColor: '#fb923c' }
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
                              '& fieldset': { borderColor: 'rgba(251, 146, 60, 0.3)' },
                              '&:hover fieldset': { borderColor: '#fb923c' },
                              '&.Mui-focused fieldset': { borderColor: '#fb923c' }
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
                              '& fieldset': { borderColor: 'rgba(251, 146, 60, 0.3)' },
                              '&:hover fieldset': { borderColor: '#fb923c' },
                              '&.Mui-focused fieldset': { borderColor: '#fb923c' }
                            }
                          }}
                        />
                      </Grid>
                    </Grid>
                  </Box>
              </Fade>
            )}

              {/* Step 7: Additional Information */}
            {activeStep === 6 && (
                <Fade in timeout={500}>
                  <Box>
                    <Typography variant="h6" sx={{ 
                      color: '#fb923c', 
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
                            sx={{
                              '& .MuiInput-underline:before': {
                                borderBottomColor: '#e2e8f0'
                              },
                              '& .MuiInput-underline:after': {
                                borderBottomColor: '#fb923c'
                              },
                              '& .MuiInput-underline:hover:not(.Mui-disabled):before': {
                                borderBottomColor: '#fb923c'
                              },
                              '& .MuiInputBase-input': {
                                fontSize: '16px',
                                padding: '8px 0',
                                color: '#2c3e50',
                                fontWeight: 500
                              }
                            }}
                          >
                            <MenuItem value="Active">Active Vendor</MenuItem>
                            <MenuItem value="Inactive">Inactive Vendor</MenuItem>
                            <MenuItem value="Suspended">Suspended Vendor</MenuItem>
                            <MenuItem value="Preferred">Preferred Vendor</MenuItem>
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
                              '& fieldset': { borderColor: 'rgba(251, 146, 60, 0.3)' },
                              '&:hover fieldset': { borderColor: '#fb923c' },
                              '&.Mui-focused fieldset': { borderColor: '#fb923c' }
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
                                  '& fieldset': { borderColor: 'rgba(251, 146, 60, 0.3)' },
                                  '&:hover fieldset': { borderColor: '#fb923c' },
                                  '&.Mui-focused fieldset': { borderColor: '#fb923c' }
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
                              '& fieldset': { borderColor: 'rgba(251, 146, 60, 0.3)' },
                              '&:hover fieldset': { borderColor: '#fb923c' },
                              '&.Mui-focused fieldset': { borderColor: '#fb923c' }
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
                              '& fieldset': { borderColor: 'rgba(251, 146, 60, 0.3)' },
                              '&:hover fieldset': { borderColor: '#fb923c' },
                              '&.Mui-focused fieldset': { borderColor: '#fb923c' }
                            }
                          }}
                        />
                      </Grid>
                      <Grid item xs={12}>
                        <TextField
                          label="Remarks"
                          name="remarks"
                          value={form.remarks}
                          onChange={handleChange}
                          fullWidth
                          multiline
                          rows={4}
                          sx={{
                            '& .MuiOutlinedInput-root': {
                              borderRadius: 2,
                              '& fieldset': { borderColor: 'rgba(251, 146, 60, 0.3)' },
                              '&:hover fieldset': { borderColor: '#fb923c' },
                              '&.Mui-focused fieldset': { borderColor: '#fb923c' }
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
          borderTop: '1px solid rgba(251, 146, 60, 0.1)',
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
            background: 'linear-gradient(90deg, #fb923c, #f97316, #fb923c)',
          }
        }}>
          <Box sx={{ display: 'flex', gap: 2 }}>
            <Button 
              disabled={activeStep === 0}
              onClick={handleBack}
              variant="outlined"
              startIcon={<Schedule />}
              sx={{
                borderColor: activeStep === 0 ? '#e2e8f0' : '#fb923c',
                color: activeStep === 0 ? '#94a3b8' : '#fb923c',
                borderRadius: 3,
                px: 3,
                py: 1.5,
                fontWeight: 600,
                textTransform: 'none',
                fontSize: '1rem',
                minWidth: 120,
                transition: 'all 0.3s ease',
                '&:hover': {
                  borderColor: activeStep === 0 ? '#e2e8f0' : '#f97316',
                  backgroundColor: activeStep === 0 ? 'transparent' : 'rgba(251, 146, 60, 0.05)',
                  transform: activeStep === 0 ? 'none' : 'translateY(-2px)',
                  boxShadow: activeStep === 0 ? 'none' : '0 4px 12px rgba(251, 146, 60, 0.2)'
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
                    ? 'linear-gradient(135deg, #fb923c 0%, #f97316 100%)'
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
                    ? '0 6px 20px rgba(251, 146, 60, 0.3)'
                    : '0 2px 8px rgba(0, 0, 0, 0.1)',
                  transition: 'all 0.3s ease',
                  cursor: isCurrentStepCompleted() ? 'pointer' : 'not-allowed',
                  '&:hover': isCurrentStepCompleted() ? {
                    background: 'linear-gradient(135deg, #f97316 0%, #ea580c 100%)',
                    transform: 'translateY(-2px)',
                    boxShadow: '0 8px 25px rgba(251, 146, 60, 0.4)'
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
                onClick={handleSave} 
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
                {loading ? 'Saving...' : (editIndex !== null ? 'Update Vendor' : 'Create Vendor')}
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
                  background: 'linear-gradient(90deg, #fb923c, #f97316)',
                  borderRadius: 3,
                  transition: 'width 0.3s ease'
                }}
              />
            </Box>
          </Box>

          <Button 
            onClick={handleCloseDialog} 
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
      <Snackbar
        open={snackbar.open}
        autoHideDuration={snackbar.severity === 'error' ? 8000 : 4000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert 
          onClose={() => setSnackbar({ ...snackbar, open: false })} 
          severity={snackbar.severity} 
          sx={{ width: '100%' }}
          action={
            snackbar.severity === 'error' && snackbar.message.includes('Network error') ? (
              <Button 
                color="inherit" 
                size="small" 
                onClick={() => {
                  setSnackbar({ ...snackbar, open: false });
                  fetchVendors();
                }}
                sx={{ ml: 1 }}
              >
                Retry
              </Button>
            ) : null
          }
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default VendorManagement; 
