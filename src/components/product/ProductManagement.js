import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  TextField,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Chip,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Autocomplete,
  Divider,
  Alert,
  Snackbar,
  Tabs,
  Tab,
  Tooltip,
  Badge,
  Avatar,
  LinearProgress,
  Fade,
  Zoom,
  Slide,
  Grow,
  Collapse,
  Container,
  Stack,
  alpha,
  useTheme,
  styled,
  keyframes,
  Skeleton,
  CircularProgress,
  Pagination,
  TablePagination,
  Fab,
  SpeedDial,
  SpeedDialAction,
  SpeedDialIcon,
  Backdrop,
  ButtonGroup,
  CardHeader,
  CardActions,
  ListItemIcon,
  ListItemText,
  Menu,
  MenuList,
  Stepper,
  Step,
  StepLabel,
  StepContent,
  useMediaQuery,
  Checkbox,
  InputAdornment
} from '@mui/material';
import {
  Add,
  Edit,
  Delete,
  Save,
  Cancel,
  Visibility,
  LocalShipping,
  Person,
  Business,
  DateRange,
  Assignment,
  AttachMoney,
  CheckCircle,
  Warning,
  ExpandMore,
  Print,
  Download,
  Search,
  FilterList,
  Refresh,
  TrendingUp,
  Analytics,
  Timeline,
  Dashboard,
  Close,
  MoreVert,
  Star,
  StarBorder,
  Flag,
  Schedule,
  Phone,
  Email,
  LocationOn,
  Receipt,
  Payment,
  Inventory,
  Category,
  PriorityHigh,
  AccessTime,
  CalendarToday,
  MonetizationOn,
  LocalOffer,
  AccountCircle,
  NotificationsActive,
  Speed,
  AutoAwesome,
  Celebration,
  RocketLaunch,
  Description,
  CloudDone,
  DeliveryDining,
  TruckLoading,
  Package,
  TrackChanges,
  Assessment,
  Timeline as TimelineIcon,
  People,
  Error as ErrorIcon
} from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { useAuth } from '../../context/AuthContext';
import { getAllClients } from '../../services/clientService';
import ManagementHeader from '../common/ManagementHeader';
import ProductForm from './ProductForm';
import DocumentViewer from '../common/DocumentViewer';

// Enhanced animations
const float = keyframes`
  0% { transform: translateY(0px); }
  50% { transform: translateY(-10px); }
  100% { transform: translateY(0px); }
`;

const shimmer = keyframes`
  0% { background-position: -468px 0; }
  100% { background-position: 468px 0; }
`;

const pulse = keyframes`
  0% { transform: scale(1); }
  50% { transform: scale(1.05); }
  100% { transform: scale(1); }
`;

const slideInUp = keyframes`
  from { 
    opacity: 0;
    transform: translateY(30px);
  }
  to { 
    opacity: 1;
    transform: translateY(0);
  }
`;

const slideInLeft = keyframes`
  from { 
    opacity: 0;
    transform: translateX(-30px);
  }
  to { 
    opacity: 1;
    transform: translateX(0);
  }
`;

const rainbow = keyframes`
  0% { background-position: 0% 50%; }
  50% { background-position: 100% 50%; }
  100% { background-position: 0% 50%; }
`;

// Styled components with advanced styling
const GradientCard = styled(Card)(({ theme }) => ({
  background: `linear-gradient(135deg, 
    ${alpha(theme.palette.primary.main, 0.1)} 0%, 
    ${alpha(theme.palette.secondary.main, 0.1)} 100%)`,
  backdropFilter: 'blur(20px)',
  borderRadius: '24px',
  border: `1px solid ${alpha(theme.palette.common.white, 0.2)}`,
  boxShadow: `0 8px 32px ${alpha(theme.palette.common.black, 0.1)}`,
  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
  overflow: 'visible',
  '&:hover': {
    transform: 'translateY(-8px)',
    boxShadow: `0 20px 40px ${alpha(theme.palette.common.black, 0.15)}`,
  },
}));

const AnimatedCard = styled(Card)(({ theme }) => ({
  borderRadius: '20px',
  background: `linear-gradient(145deg, 
    ${theme.palette.background.paper} 0%, 
    ${alpha(theme.palette.primary.main, 0.02)} 100%)`,
  border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
  boxShadow: `0 4px 20px ${alpha(theme.palette.common.black, 0.08)}`,
  transition: 'all 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
  animation: `${slideInUp} 0.6s ease-out`,
  '&:hover': {
    transform: 'translateY(-4px) scale(1.02)',
    boxShadow: `0 12px 40px ${alpha(theme.palette.common.black, 0.15)}`,
    border: `1px solid ${alpha(theme.palette.primary.main, 0.3)}`,
  },
}));

const GlassmorphismCard = styled(Card)(({ theme }) => ({
  background: `linear-gradient(135deg, 
    ${alpha(theme.palette.background.paper, 0.9)} 0%, 
    ${alpha(theme.palette.background.paper, 0.7)} 100%)`,
  backdropFilter: 'blur(40px) saturate(200%)',
  WebkitBackdropFilter: 'blur(40px) saturate(200%)',
  borderRadius: '24px',
  border: `1px solid ${alpha(theme.palette.common.white, 0.18)}`,
  boxShadow: `0 8px 32px ${alpha(theme.palette.common.black, 0.12)}`,
  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
}));

const FloatingActionButton = styled(Fab)(({ theme }) => ({
  position: 'fixed',
  bottom: theme.spacing(2),
  right: theme.spacing(2),
  zIndex: 1000,
  background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 100%)`,
  color: 'white',
  animation: `${float} 3s ease-in-out infinite`,
  '&:hover': {
    background: `linear-gradient(135deg, ${theme.palette.primary.dark} 0%, ${theme.palette.secondary.dark} 100%)`,
    transform: 'scale(1.1)',
  },
}));

const StyledChip = styled(Chip)(({ theme, variant }) => {
  const getVariantStyles = () => {
    switch (variant) {
      case 'success':
        return {
          background: `linear-gradient(135deg, #4CAF50 0%, #8BC34A 100%)`,
          color: 'white',
          boxShadow: `0 4px 12px ${alpha('#4CAF50', 0.3)}`,
        };
      case 'warning':
        return {
          background: `linear-gradient(135deg, #FF9800 0%, #FFC107 100%)`,
          color: 'white',
          boxShadow: `0 4px 12px ${alpha('#FF9800', 0.3)}`,
        };
      case 'error':
        return {
          background: `linear-gradient(135deg, #F44336 0%, #E91E63 100%)`,
          color: 'white',
          boxShadow: `0 4px 12px ${alpha('#F44336', 0.3)}`,
        };
      case 'info':
        return {
          background: `linear-gradient(135deg, #2196F3 0%, #03A9F4 100%)`,
          color: 'white',
          boxShadow: `0 4px 12px ${alpha('#2196F3', 0.3)}`,
        };
      default:
        return {
          background: `linear-gradient(135deg, ${theme.palette.grey[400]} 0%, ${theme.palette.grey[600]} 100%)`,
          color: 'white',
          boxShadow: `0 4px 12px ${alpha(theme.palette.grey[400], 0.3)}`,
        };
    }
  };

  return {
    ...getVariantStyles(),
    borderRadius: '20px',
    fontWeight: 600,
    fontSize: '0.75rem',
    height: '28px',
    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
    '&:hover': {
      transform: 'translateY(-2px) scale(1.05)',
      animation: `${pulse} 0.6s ease-in-out`,
    },
  };
});

const ProductManagement = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const { user } = useAuth();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  
  // State management
  const [products, setProducts] = useState([]);
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState(0);
  const [filterStatus, setFilterStatus] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState('table'); // only table view
  
  // Filter states
  const [clientFilter, setClientFilter] = useState('');
  const [productCodeFilter, setProductCodeFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  
  // Pagination
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  
  // Dialog states
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [filterDialogOpen, setFilterDialogOpen] = useState(false);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isViewerOpen, setIsViewerOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  
  // Snackbar
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  
  // Real-time tracking state
  const [lastUpdated, setLastUpdated] = useState(new Date());

  // Load data on component mount
  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    setLoading(true);
    setError(null);
    try {
      const clientData = await getAllClients();
      
      // Extract products from clients
      const allProducts = [];
      const seenProducts = new Set();
      
      for (const client of clientData) {
        if (client.products && client.products.length > 0) {
          const clientProducts = client.products.map(product => ({
            ...product,
            clientCode: client.clientCode,
            clientName: client.clientName,
            uniqueKey: `${client.clientCode}-${product.productCode}`
          }));
          
          clientProducts.forEach(product => {
            if (!seenProducts.has(product.uniqueKey)) {
              seenProducts.add(product.uniqueKey);
              allProducts.push(product);
            }
          });
        }
      }
      setProducts(allProducts);
      setClients(clientData);
      setLastUpdated(new Date());
    } catch (err) {
      console.error('Error loading product data:', err);
      setError(err.message || 'Failed to load product data');
    } finally {
      setLoading(false);
    }
  };

  // Filter products
  const filteredProducts = useMemo(() => {
    let filtered = products;

    // Client filter
    if (clientFilter) {
      filtered = filtered.filter(product => 
        product.clientCode?.toLowerCase().includes(clientFilter.toLowerCase())
      );
    }

    // Product code filter
    if (productCodeFilter) {
      filtered = filtered.filter(product => 
        product.productCode?.toLowerCase().includes(productCodeFilter.toLowerCase())
      );
    }

    // Category filter
    if (categoryFilter) {
      filtered = filtered.filter(product => 
        product.category?.toLowerCase().includes(categoryFilter.toLowerCase())
      );
    }

    // Search term
    if (searchTerm) {
      filtered = filtered.filter(product => 
        product.productCode?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.productName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.clientCode?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.clientName?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Add unique key to prevent React key conflicts
    return filtered.map((product, index) => ({
      ...product,
      _uniqueKey: `${product.productCode}-${product.clientCode}-${index}`
    }));
  }, [products, clientFilter, productCodeFilter, categoryFilter, searchTerm]);

  // Get unique values for filters
  const uniqueClients = useMemo(() => {
    const clients = [...new Set(products.map(p => p.clientCode))];
    return clients.filter(Boolean).sort();
  }, [products]);

  const uniqueProductCodes = useMemo(() => {
    const codes = [...new Set(products.map(p => p.productCode))];
    return codes.filter(Boolean).sort();
  }, [products]);

  const uniqueCategories = useMemo(() => {
    const categories = [...new Set(products.map(p => p.category))];
    return categories.filter(Boolean).sort();
  }, [products]);

  // Calculate summary statistics
  const summaryStats = useMemo(() => {
    const total = products.length;
    const attachmentFields = ['drawing', 'fpa', 'pdi', 'processChecksheet', 'packagingStandard', 'bom', 'sop', 'pfc'];
    const totalAttachments = products.reduce((sum, product) => {
      return sum + attachmentFields.filter(field => product[field]).length;
    }, 0);
    const avgAttachments = total > 0 ? Math.round(totalAttachments / total) : 0;
    const uniqueClientsCount = new Set(products.map(p => p.clientCode)).size;

    return {
      total,
      totalAttachments,
      avgAttachments,
      uniqueClientsCount
    };
  }, [products]);

  const handleRefresh = () => {
    loadInitialData();
  };

  const handleViewProduct = (product) => {
    setSelectedProduct(product);
    setViewDialogOpen(true);
  };

  const handleCloseViewDialog = () => {
    setViewDialogOpen(false);
    setSelectedProduct(null);
  };

  const handleFilterChange = (filterType, value) => {
    switch (filterType) {
      case 'client':
        setClientFilter(value);
        break;
      case 'productCode':
        setProductCodeFilter(value);
        break;
      case 'category':
        setCategoryFilter(value);
        break;
      case 'search':
        setSearchTerm(value);
        break;
      default:
        break;
    }
  };

  const clearFilters = () => {
    setClientFilter('');
    setProductCodeFilter('');
    setCategoryFilter('');
    setSearchTerm('');
  };

  const handleEdit = (product) => {
    setSelectedProduct(product);
    setIsFormOpen(true);
  };

  const handleDelete = async (productCode) => {
    if (window.confirm('Are you sure you want to delete this product?')) {
      try {
        // Find the client with this product
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
          throw new Error('Product not found');
        }

        // Remove product from client's products array
        clientWithProduct.products.splice(productIndex, 1);

        // Update the client
        const { updateClient } = await import('../../services/clientService');
        await updateClient(clientWithProduct);
        
        setSnackbar({ open: true, message: 'Product deleted successfully!', severity: 'success' });
        loadInitialData();
      } catch (err) {
        setSnackbar({ open: true, message: 'Failed to delete product', severity: 'error' });
        console.error('Error deleting product:', err);
      }
    }
  };

  const handleBOMNavigation = (product) => {
    navigate('/inventory/bill-of-materials', { 
      state: { 
        selectedProduct: product,
        focusSelection: true
      }
    });
  };

  const handleViewFile = (fileId, fileName) => {
    setSelectedFile({ id: fileId, name: fileName });
    setIsViewerOpen(true);
  };

  const handleFormClose = () => {
    setIsFormOpen(false);
    setSelectedProduct(null);
    setSnackbar({ open: true, message: 'Product saved successfully!', severity: 'success' });
    loadInitialData();
  };

  if (loading) {
    return (
      <Container maxWidth="xl" sx={{ py: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '50vh' }}>
          <CircularProgress size={60} />
        </Box>
      </Container>
    );
  }

  // Prepare stats for ManagementHeader
  const headerStats = [
    {
      value: summaryStats.total,
      label: 'Total Products',
      icon: <Inventory />,
      color: theme.palette.primary.main
    },
    {
      value: summaryStats.totalAttachments,
      label: 'Total Attachments',
      icon: <Description />,
      color: theme.palette.success.main
    },
    {
      value: summaryStats.uniqueClientsCount,
      label: 'Unique Clients',
      icon: <Business />,
      color: theme.palette.warning.main
    },
    {
      value: summaryStats.avgAttachments,
      label: 'Avg Attachments',
      icon: <TrendingUp />,
      color: theme.palette.info.main
    }
  ];

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      {/* Management Header */}
      <ManagementHeader
        title="Product Management"
        subtitle="Advanced product catalog with comprehensive filtering & document management"
        stats={headerStats}
        onRefresh={handleRefresh}
        onAddNew={() => {
          setSelectedProduct(null);
          setIsFormOpen(true);
        }}
        addButtonText="New Product"
        addButtonIcon={<Add />}
        refreshLoading={loading}
      />

      <Container maxWidth="xl" sx={{ py: 4 }}>
        {/* Filters and Search */}
        <GlassmorphismCard sx={{ mb: 4, p: 3 }}>
          <Typography variant="h6" sx={{ mb: 3, fontWeight: 600 }}>
            Filters & Search
          </Typography>
          
          <Grid container spacing={3}>
            {/* Client Filter */}
            <Grid item xs={12} sm={6} md={3}>
              <Autocomplete
                fullWidth
                options={uniqueClients}
                value={clientFilter}
                onChange={(event, newValue) => handleFilterChange('client', newValue || '')}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Client Code"
                    variant="outlined"
                    InputProps={{
                      ...params.InputProps,
                      startAdornment: (
                        <InputAdornment position="start">
                          <Business fontSize="small" />
                        </InputAdornment>
                      ),
                    }}
                    sx={{
                      '& .MuiInputBase-input': {
                        minWidth: '200px', // Minimum width for complete client code display
                        fontSize: '0.875rem', // Slightly smaller font to fit more text
                        whiteSpace: 'nowrap', // Prevent text wrapping
                        overflow: 'visible', // Allow text to extend beyond bounds if needed
                        textOverflow: 'unset', // Don't truncate with ellipsis
                      },
                      '& .MuiInputBase-root': {
                        minWidth: '200px', // Ensure the entire input has minimum width
                        '& .MuiInputBase-input': {
                          minWidth: '200px',
                        }
                      },
                      '& .MuiAutocomplete-input': {
                        minWidth: '200px',
                        fontSize: '0.875rem',
                      }
                    }}
                  />
                )}
                noOptionsText="No clients found"
                clearOnEscape
                selectOnFocus
                handleHomeEndKeys
              />
            </Grid>

            {/* Product Code Filter */}
            <Grid item xs={12} sm={6} md={3}>
              <Autocomplete
                fullWidth
                options={uniqueProductCodes}
                value={productCodeFilter}
                onChange={(event, newValue) => handleFilterChange('productCode', newValue || '')}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Product Code"
                    variant="outlined"
                    InputProps={{
                      ...params.InputProps,
                      startAdornment: (
                        <InputAdornment position="start">
                          <Inventory fontSize="small" />
                        </InputAdornment>
                      ),
                    }}
                    sx={{
                      '& .MuiInputBase-input': {
                        minWidth: '200px', // Minimum width for complete product code display
                        fontSize: '0.875rem', // Slightly smaller font to fit more text
                        whiteSpace: 'nowrap', // Prevent text wrapping
                        overflow: 'visible', // Allow text to extend beyond bounds if needed
                        textOverflow: 'unset', // Don't truncate with ellipsis
                      },
                      '& .MuiInputBase-root': {
                        minWidth: '200px', // Ensure the entire input has minimum width
                        '& .MuiInputBase-input': {
                          minWidth: '200px',
                        }
                      },
                      '& .MuiAutocomplete-input': {
                        minWidth: '200px',
                        fontSize: '0.875rem',
                      }
                    }}
                  />
                )}
                noOptionsText="No product codes found"
                clearOnEscape
                selectOnFocus
                handleHomeEndKeys
              />
            </Grid>

            {/* Category Filter */}
            <Grid item xs={12} sm={6} md={3}>
              <Autocomplete
                fullWidth
                options={uniqueCategories}
                value={categoryFilter}
                onChange={(event, newValue) => handleFilterChange('category', newValue || '')}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Category"
                    variant="outlined"
                    InputProps={{
                      ...params.InputProps,
                      startAdornment: (
                        <InputAdornment position="start">
                          <Category fontSize="small" />
                        </InputAdornment>
                      ),
                    }}
                    sx={{
                      '& .MuiInputBase-input': {
                        minWidth: '200px', // Minimum width for complete category display
                        fontSize: '0.875rem', // Slightly smaller font to fit more text
                        whiteSpace: 'nowrap', // Prevent text wrapping
                        overflow: 'visible', // Allow text to extend beyond bounds if needed
                        textOverflow: 'unset', // Don't truncate with ellipsis
                      },
                      '& .MuiInputBase-root': {
                        minWidth: '200px', // Ensure the entire input has minimum width
                        '& .MuiInputBase-input': {
                          minWidth: '200px',
                        }
                      },
                      '& .MuiAutocomplete-input': {
                        minWidth: '200px',
                        fontSize: '0.875rem',
                      }
                    }}
                  />
                )}
                noOptionsText="No categories found"
                clearOnEscape
                selectOnFocus
                handleHomeEndKeys
              />
            </Grid>

            {/* Search */}
            <Grid item xs={12} sm={6} md={3}>
              <TextField
                fullWidth
                label="Search"
                placeholder="Search products..."
                value={searchTerm}
                onChange={(e) => handleFilterChange('search', e.target.value)}
                variant="outlined"
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Search />
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>
          </Grid>

          {/* Filter Actions */}
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 3 }}>
            <Box sx={{ display: 'flex', gap: 2 }}>
              <Button
                variant="outlined"
                startIcon={<FilterList />}
                onClick={() => setFilterDialogOpen(true)}
                sx={{ borderRadius: '12px' }}
              >
                Advanced Filters
              </Button>
              <Button
                variant="text"
                onClick={clearFilters}
                sx={{ borderRadius: '12px' }}
              >
                Clear All
              </Button>
            </Box>

          </Box>
        </GlassmorphismCard>

        {/* Error Display */}
        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            <Typography variant="body1" sx={{ fontWeight: 600 }}>
              Error loading product data:
            </Typography>
            <Typography variant="body2">
              {error}
            </Typography>
            <Button 
              onClick={handleRefresh} 
              size="small" 
              sx={{ mt: 1 }}
            >
              Retry
            </Button>
          </Alert>
        )}

        {/* Results */}
        <AnimatedCard sx={{ p: 3 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              Product Records ({filteredProducts.length})
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Last updated: {lastUpdated.toLocaleTimeString()}
            </Typography>
          </Box>

          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', py: 4 }}>
              <CircularProgress size={60} />
              <Typography variant="body1" sx={{ ml: 2 }}>
                Loading product data...
              </Typography>
            </Box>
          ) : filteredProducts.length === 0 ? (
            <Alert severity="info" sx={{ textAlign: 'center', py: 4 }}>
              <Typography variant="h6" sx={{ mb: 1 }}>
                No product records found
              </Typography>
              <Typography variant="body2">
                {error ? 'There was an error loading the data.' : 'No product records match your current filters.'}
              </Typography>
              {!error && (
                <Button onClick={clearFilters} sx={{ mt: 2 }}>
                  Clear Filters
                </Button>
              )}
            </Alert>
          ) : (
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Client Code</TableCell>
                    <TableCell>Product Code</TableCell>
                    <TableCell>Product Name</TableCell>
                    <TableCell>Description</TableCell>
                    <TableCell>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredProducts
                    .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                    .map((product) => (
                      <TableRow key={product._uniqueKey} hover>
                        <TableCell>
                          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                            <Chip
                              label={product.clientCode}
                              size="small"
                              sx={{
                                backgroundColor: alpha(theme.palette.secondary.main, 0.1),
                                color: theme.palette.secondary.main,
                                fontWeight: 600,
                                fontSize: '0.7rem'
                              }}
                            />
                            {/* Client name removed as per requirement to show only code */}
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={product.productCode}
                            size="small"
                            sx={{
                              backgroundColor: alpha(theme.palette.primary.main, 0.1),
                              color: theme.palette.primary.main,
                              fontWeight: 600,
                              fontFamily: 'monospace',
                              fontSize: '0.75rem'
                            }}
                          />
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" sx={{ fontWeight: 500 }}>
                            {product.productName}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography 
                            variant="body2" 
                            color="text.secondary"
                            sx={{ 
                              maxWidth: 200,
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap'
                            }}
                          >
                            {product.description}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Box sx={{ display: 'flex', gap: 1 }}>
                            <Tooltip title="Edit Product">
                              <IconButton
                                size="small"
                                onClick={() => handleEdit(product)}
                                sx={{
                                  color: 'primary.main',
                                  '&:hover': { 
                                    backgroundColor: alpha(theme.palette.primary.main, 0.1),
                                    transform: 'scale(1.1)'
                                  }
                                }}
                              >
                                <Edit fontSize="small" />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="View BOM">
                              <IconButton
                                size="small"
                                onClick={() => handleBOMNavigation(product)}
                                sx={{
                                  color: 'success.main',
                                  '&:hover': { 
                                    backgroundColor: alpha(theme.palette.success.main, 0.1),
                                    transform: 'scale(1.1)'
                                  }
                                }}
                              >
                                <Assignment fontSize="small" />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Delete Product">
                              <IconButton
                                size="small"
                                onClick={() => handleDelete(product.productCode)}
                                sx={{
                                  color: 'error.main',
                                  '&:hover': { 
                                    backgroundColor: alpha(theme.palette.error.main, 0.1),
                                    transform: 'scale(1.1)'
                                  }
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
          )}

          {/* Pagination */}
          <TablePagination
            component="div"
            count={filteredProducts.length}
            page={page}
            onPageChange={(event, newPage) => setPage(newPage)}
            rowsPerPage={rowsPerPage}
            onRowsPerPageChange={(event) => {
              setRowsPerPage(parseInt(event.target.value, 10));
              setPage(0);
            }}
            rowsPerPageOptions={[5, 10, 25, 50]}
          />
        </AnimatedCard>

        {/* View Product Dialog */}
        <Dialog
          open={viewDialogOpen}
          onClose={handleCloseViewDialog}
          maxWidth="md"
          fullWidth
        >
          <DialogTitle>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography variant="h6">Product Details</Typography>
              <IconButton onClick={handleCloseViewDialog}>
                <Close />
              </IconButton>
            </Box>
          </DialogTitle>
          <DialogContent>
            {selectedProduct && (
              <Grid container spacing={3}>
                <Grid item xs={12}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Product Code
                  </Typography>
                  <Chip
                    label={selectedProduct.productCode}
                    sx={{
                      backgroundColor: alpha(theme.palette.primary.main, 0.1),
                      color: theme.palette.primary.main,
                      fontWeight: 600,
                      fontFamily: 'monospace',
                      fontSize: '0.875rem',
                      mb: 2
                    }}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Client Code
                  </Typography>
                  <Typography variant="body1" sx={{ mb: 2 }}>
                    {selectedProduct.clientCode}
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Client Code
                  </Typography>
                  <Typography variant="body1" sx={{ mb: 2 }}>
                    {selectedProduct.clientCode}
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Product Name
                  </Typography>
                  <Typography variant="body1" sx={{ mb: 2 }}>
                    {selectedProduct.productName}
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Manpower Required
                  </Typography>
                  <Typography variant="body2" sx={{ mb: 1 }}>
                    Assembly Line: {selectedProduct.assemblyLineManpower || 0}
                  </Typography>
                  <Typography variant="body2" sx={{ mb: 1 }}>
                    Cable Cutting: {selectedProduct.cableCuttingManpower || 0}
                  </Typography>
                  <Typography variant="body2" sx={{ mb: 1 }}>
                    Molding Machine: {selectedProduct.moldingMachineManpower || 0}
                  </Typography>
                  <Typography variant="body2" sx={{ mb: 1 }}>
                    Packing Line: {selectedProduct.packingLineManpower || 0}
                  </Typography>
                  <Typography variant="body1" sx={{ mb: 2, fontWeight: 600, color: '#1976d2' }}>
                    Total: {parseInt(selectedProduct.assemblyLineManpower || 0) + parseInt(selectedProduct.cableCuttingManpower || 0) + parseInt(selectedProduct.moldingMachineManpower || 0) + parseInt(selectedProduct.packingLineManpower || 0)}
                  </Typography>
                </Grid>
                <Grid item xs={12}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Description
                  </Typography>
                  <Typography variant="body1" sx={{ mb: 2 }}>
                    {selectedProduct.description}
                  </Typography>
                </Grid>
                <Grid item xs={12}>
                  <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
                    Attachments
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                    {['drawing', 'fpa', 'pdi', 'processChecksheet', 'packagingStandard', 'bom', 'sop', 'pfc'].map((field) => (
                      selectedProduct[field] && (
                        <Chip
                          key={field}
                          label={field.charAt(0).toUpperCase() + field.slice(1)}
                          onClick={() => handleViewFile(selectedProduct[field], field)}
                          sx={{ cursor: 'pointer' }}
                        />
                      )
                    ))}
                  </Box>
                </Grid>
              </Grid>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseViewDialog}>Close</Button>
          </DialogActions>
        </Dialog>

        {/* Product Form Dialog */}
        <Dialog
          open={isFormOpen}
          onClose={handleFormClose}
          maxWidth="lg"
          fullWidth
        >
          <DialogTitle>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography variant="h6">
                {selectedProduct ? 'Edit Product' : 'Add New Product'}
              </Typography>
              <IconButton onClick={() => setIsFormOpen(false)}>
                <Close />
              </IconButton>
            </Box>
          </DialogTitle>
          <DialogContent sx={{ p: 0 }}>
            <ProductForm product={selectedProduct} onClose={handleFormClose} />
          </DialogContent>
        </Dialog>

        {/* Document Viewer Dialog */}
        <Dialog
          open={isViewerOpen}
          onClose={() => setIsViewerOpen(false)}
          maxWidth="md"
          fullWidth
        >
          <DialogTitle>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography variant="h6">{selectedFile?.name}</Typography>
              <IconButton onClick={() => setIsViewerOpen(false)}>
                <Close />
              </IconButton>
            </Box>
          </DialogTitle>
          <DialogContent>
            {selectedFile && (
              <DocumentViewer fileId={selectedFile.id} fileName={selectedFile.name} />
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setIsViewerOpen(false)}>Close</Button>
          </DialogActions>
        </Dialog>

        {/* Snackbar */}
        <Snackbar
          open={snackbar.open}
          autoHideDuration={4000}
          onClose={() => setSnackbar({ ...snackbar, open: false })}
        >
          <Alert
            onClose={() => setSnackbar({ ...snackbar, open: false })}
            severity={snackbar.severity}
            sx={{ width: '100%' }}
          >
            {snackbar.message}
          </Alert>
        </Snackbar>
      </Container>
    </LocalizationProvider>
  );
};

export default ProductManagement;

