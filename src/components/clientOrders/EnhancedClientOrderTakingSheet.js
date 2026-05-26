import React, { useState, useEffect, useMemo } from 'react';
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
  ToggleButton,
  ToggleButtonGroup,
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
  Checkbox
} from '@mui/material';
import {
  Add,
  Edit,
  Delete,
  Save,
  Cancel,
  Visibility,
  ShoppingCart,
  Person,
  Business,
  DateRange,
  Assignment,
  AttachMoney,
  LocalShipping,
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
  Description
} from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { useAuth } from '../../context/AuthContext';
import { getAllClients } from '../../services/clientService';
import WhatsAppButton from '../common/WhatsAppButton';

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

const FilterButton = styled(Button)(({ theme }) => ({
  minWidth: 'fit-content !important',
  whiteSpace: 'nowrap !important',
  flexShrink: 0,
  overflow: 'visible !important',
  textOverflow: 'unset !important',
  width: 'auto !important',
  maxWidth: 'none !important',
  '& .MuiButton-startIcon': {
    marginRight: 1,
  },
}));

const AnimatedButton = styled(Button)(({ theme, variant = 'primary' }) => {
  const getVariantStyles = () => {
    switch (variant) {
      case 'gradient':
        return {
          background: `linear-gradient(90deg, #1e3a8a 0%, #f97316 100%)`, // Blue to orange gradient
          color: 'white',
          borderRadius: '20px', // More rounded corners
          fontWeight: 700,
          fontSize: '1rem',
          padding: '12px 32px',
          boxShadow: `0 6px 20px rgba(30, 58, 138, 0.3)`,
          border: 'none',
          '&:hover': {
            background: `linear-gradient(90deg, #1e40af 0%, #ea580c 100%)`,
            transform: 'translateY(-2px)',
            boxShadow: `0 8px 25px rgba(30, 58, 138, 0.4)`,
          },
        };
      case 'success':
        return {
          background: `linear-gradient(135deg, #4CAF50 0%, #8BC34A 100%)`,
          color: 'white',
          '&:hover': {
            background: `linear-gradient(135deg, #388E3C 0%, #689F38 100%)`,
          },
        };
      case 'danger':
        return {
          background: `linear-gradient(135deg, #F44336 0%, #E91E63 100%)`,
          color: 'white',
          '&:hover': {
            background: `linear-gradient(135deg, #D32F2F 0%, #C2185B 100%)`,
          },
        };
      default:
        return {};
    }
  };

  return {
    ...getVariantStyles(),
    borderRadius: variant === 'gradient' ? '20px' : '12px', // Override for gradient
    textTransform: 'none',
    fontWeight: variant === 'gradient' ? 700 : 600,
    padding: variant === 'gradient' ? '12px 32px' : '10px 24px',
    boxShadow: variant === 'gradient' ? 
      `0 6px 20px rgba(30, 58, 138, 0.3)` : 
      `0 4px 12px ${alpha(theme.palette.primary.main, 0.3)}`,
    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
    '&:hover': {
      transform: 'translateY(-2px)',
      boxShadow: variant === 'gradient' ? 
        `0 8px 25px rgba(30, 58, 138, 0.4)` : 
        `0 8px 24px ${alpha(theme.palette.primary.main, 0.4)}`,
    },
    '&:active': {
      transform: 'translateY(0px)',
    },
  };
});

const StyledTableRow = styled(TableRow)(({ theme }) => ({
  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
  '&:hover': {
    backgroundColor: alpha(theme.palette.primary.main, 0.04),
    transform: 'scale(1.01)',
    boxShadow: `0 4px 12px ${alpha(theme.palette.common.black, 0.08)}`,
  },
  '&:nth-of-type(even)': {
    backgroundColor: alpha(theme.palette.action.hover, 0.02),
  },
}));

const LoadingSkeleton = ({ rows = 5 }) => (
  <Box>
    {Array.from({ length: rows }).map((_, index) => (
      <Fade in timeout={300 + index * 100} key={index}>
        <Box sx={{ mb: 2 }}>
          <Skeleton
            variant="rectangular"
            height={60}
            sx={{
              borderRadius: 2,
              animation: `${shimmer} 2s infinite linear`,
              background: `linear-gradient(90deg, 
                ${alpha('#f0f0f0', 0.2)} 0px, 
                ${alpha('#e0e0e0', 0.4)} 40px, 
                ${alpha('#f0f0f0', 0.2)} 80px)`,
              backgroundSize: '468px 104px',
            }}
          />
        </Box>
      </Fade>
    ))}
  </Box>
);

const StatusStepper = ({ currentStatus, onStatusChange }) => {
  const theme = useTheme();
  const statusSteps = [
    { label: 'Draft', icon: <Edit />, color: '#9E9E9E' },
    { label: 'Pending', icon: <Schedule />, color: '#FF9800' },
    { label: 'Confirmed', icon: <CheckCircle />, color: '#2196F3' },
    { label: 'Production', icon: <Assignment />, color: '#9C27B0' },
    { label: 'Ready', icon: <Inventory />, color: '#607D8B' },
    { label: 'Dispatched', icon: <LocalShipping />, color: '#4CAF50' },
    { label: 'Delivered', icon: <CheckCircle />, color: '#8BC34A' },
    { label: 'Completed', icon: <Celebration />, color: '#4CAF50' },
  ];

  const currentIndex = statusSteps.findIndex(step => 
    step.label.toLowerCase() === currentStatus?.toLowerCase()
  );

  return (
    <Box sx={{ width: '100%', mt: 2 }}>
      <Stepper activeStep={currentIndex} alternativeLabel>
        {statusSteps.map((step, index) => (
          <Step key={step.label} completed={index < currentIndex}>
            <StepLabel
              StepIconComponent={() => (
                <Box
                  sx={{
                    width: 40,
                    height: 40,
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: index <= currentIndex 
                      ? `linear-gradient(135deg, ${step.color} 0%, ${alpha(step.color, 0.7)} 100%)`
                      : alpha(theme.palette.grey[300], 0.5),
                    color: 'white',
                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                    cursor: 'pointer',
                    '&:hover': {
                      transform: 'scale(1.1)',
                      boxShadow: `0 4px 12px ${alpha(step.color, 0.3)}`,
                    },
                  }}
                  onClick={() => onStatusChange && onStatusChange(step.label)}
                >
                  {step.icon}
                </Box>
              )}
            >
              <Typography variant="caption" sx={{ fontWeight: 600, color: step.color }}>
                {step.label}
              </Typography>
            </StepLabel>
          </Step>
        ))}
      </Stepper>
    </Box>
  );
};

const PriorityIndicator = ({ priority }) => {
  const getPriorityConfig = () => {
    switch (priority?.toLowerCase()) {
      case 'urgent':
        return { 
          color: '#F44336', 
          icon: <PriorityHigh />, 
          animation: `${pulse} 1s infinite`,
          glow: '0 0 20px rgba(244, 67, 54, 0.5)'
        };
      case 'high':
        return { 
          color: '#FF5722', 
          icon: <Flag />, 
          animation: `${pulse} 2s infinite`,
          glow: '0 0 15px rgba(255, 87, 34, 0.4)'
        };
      case 'medium':
        return { 
          color: '#FF9800', 
          icon: <Star />, 
          animation: 'none',
          glow: '0 0 10px rgba(255, 152, 0, 0.3)'
        };
      case 'low':
        return { 
          color: '#4CAF50', 
          icon: <StarBorder />, 
          animation: 'none',
          glow: '0 0 5px rgba(76, 175, 80, 0.2)'
        };
      default:
        return { 
          color: '#9E9E9E', 
          icon: <StarBorder />, 
          animation: 'none',
          glow: 'none'
        };
    }
  };

  const config = getPriorityConfig();

  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        gap: 1,
        padding: '4px 12px',
        borderRadius: '20px',
        background: `linear-gradient(135deg, ${config.color} 0%, ${alpha(config.color, 0.7)} 100%)`,
        color: 'white',
        animation: config.animation,
        boxShadow: config.glow,
        fontSize: '0.75rem',
        fontWeight: 600,
      }}
    >
      {config.icon}
      {priority}
    </Box>
  );
};

const orderStatuses = [
  'Draft', 'Pending', 'In Production', 'Delivered', 'Completed', 'Cancelled'
];

const EnhancedClientOrderTakingSheet = () => {
  const theme = useTheme();
  const { user } = useAuth();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  
  // State management
  const [products, setProducts] = useState([]);
  const [clients, setClients] = useState([]);
  const [selectedClient, setSelectedClient] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState(0);
  const [filterStatus, setFilterStatus] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState('table'); // 'table' or 'cards'
  
  // Pagination
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  
   // Dialog states
   const [viewDialogOpen, setViewDialogOpen] = useState(false);
   const [selectedOrder, setSelectedOrder] = useState(null);
  
  // Snackbar
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  // Filter dropdown
  const [filterMenuAnchor, setFilterMenuAnchor] = useState(null);
  
  // Real-time tracking state
  const [lastUpdated, setLastUpdated] = useState(new Date());
  const [isRealTimeEnabled, setIsRealTimeEnabled] = useState(true);
  
  // Bulk operations state
  const [selectedProducts, setSelectedProducts] = useState([]);
  const [bulkActionAnchor, setBulkActionAnchor] = useState(null);

  // Load data on component mount
  useEffect(() => {
    loadInitialData();
  }, []);

  // Real-time refresh mechanism
  useEffect(() => {
    if (!isRealTimeEnabled) return;

    const interval = setInterval(async () => {
      try {
        await Promise.all([loadClients(), loadProducts()]);
        setLastUpdated(new Date());
      } catch (err) {
        console.error('Error refreshing data:', err);
      }
    }, 30000); // Refresh every 30 seconds

    return () => clearInterval(interval);
  }, [isRealTimeEnabled]);

  const loadInitialData = async () => {
    setLoading(true);
    try {
      await Promise.all([loadClients(), loadProducts()]);
    } catch (err) {
      setError('Failed to load initial data');
      console.error('Error loading initial data:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadClients = async () => {
    try {
      const clientData = await getAllClients();
      setClients(clientData || []);
    } catch (err) {
      console.error('Error loading clients:', err);
      setClients([]);
    }
  };

  const loadProducts = async () => {
    try {
      const clients = await getAllClients();
      const allProducts = [];
      const seenProducts = new Set();
      
      for (const client of clients) {
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
      
      setProducts(allProducts || []);
    } catch (err) {
      console.error('Error loading products:', err);
      setProducts([]);
    }
  };

  const handleViewProduct = (product) => {
    setSelectedOrder({
      ...product,
      items: []
    });
    setViewDialogOpen(true);
  };

  const handleEditProduct = (product) => {
    showSnackbar('Product editing feature coming soon!', 'info');
  };

  const showSnackbar = (message, severity = 'success') => {
    setSnackbar({ open: true, message, severity });
  };

  const getStatusColor = (status) => {
    const statusColors = {
      'Draft': 'default',
      'Pending': 'warning',
      'In Production': 'primary',
      'Delivered': 'success',
      'Completed': 'success',
      'Cancelled': 'error'
    };
    return statusColors[status] || 'default';
  };

  // Filtered and paginated data
  const filteredProducts = useMemo(() => {
    return products.filter(product => {
      const matchesClient = !selectedClient || product.clientCode === selectedClient.clientCode;
      const matchesSearch = !searchTerm || 
        product.productCode?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.productName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.clientName?.toLowerCase().includes(searchTerm.toLowerCase());
      return matchesClient && matchesSearch;
    });
  }, [products, searchTerm, selectedClient]);

  const getTabData = () => {
    switch(activeTab) {
      case 0: // ALL ORDERS
        return filteredProducts;
      case 1: // DRAFTS
        return filteredProducts.filter(p => !p.drawing && !p.fpa && !p.bom && !p.sop);
      case 2: // ACTIVE
        return filteredProducts.filter(p => p.drawing || p.fpa || p.bom || p.sop);
      case 3: // COMPLETED
        return filteredProducts.filter(p => parseFloat(p.basePrice || 0) > 2000);
      default: 
        return filteredProducts;
    }
  };

  const paginatedData = useMemo(() => {
    const data = getTabData();
    const startIndex = page * rowsPerPage;
    return data.slice(startIndex, startIndex + rowsPerPage);
  }, [getTabData, page, rowsPerPage]);

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  if (loading && products.length === 0) {
    return (
      <Container maxWidth="xl" sx={{ py: 4 }}>
        <Fade in timeout={300}>
          <Box>
            <Skeleton variant="rectangular" height={200} sx={{ borderRadius: 4, mb: 3 }} />
            <LoadingSkeleton rows={8} />
          </Box>
        </Fade>
      </Container>
    );
  }

  return (
    <Box sx={{ 
      minHeight: '100vh',
      background: `linear-gradient(135deg, 
        ${alpha(theme.palette.primary.main, 0.02)} 0%, 
        ${alpha(theme.palette.secondary.main, 0.02)} 50%,
        ${alpha(theme.palette.background.default, 1)} 100%)`,
      py: 3,
    }}>
      <Container maxWidth="xl">
        {/* Enhanced Header with Glassmorphism */}
        <Slide direction="down" in timeout={800}>
          <GlassmorphismCard sx={{ mb: 4, overflow: 'visible' }}>
            <CardContent sx={{ p: 4, position: 'relative' }}>
              {/* Floating decorative elements */}
              <Box
                sx={{
                  position: 'absolute',
                  top: -20,
                  right: -20,
                  width: 100,
                  height: 100,
                  background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 100%)`,
                  borderRadius: '50%',
                  opacity: 0.1,
                  animation: `${float} 4s ease-in-out infinite`,
                }}
              />
              <Box
                sx={{
                  position: 'absolute',
                  bottom: -30,
                  left: -30,
                  width: 80,
                  height: 80,
                  background: `linear-gradient(135deg, ${theme.palette.secondary.main} 0%, ${theme.palette.primary.main} 100%)`,
                  borderRadius: '50%',
                  opacity: 0.08,
                  animation: `${float} 3s ease-in-out infinite reverse`,
                }}
              />
              
              <Box display="flex" justifyContent="space-between" alignItems="center" flexWrap="wrap" gap={2}>
                <Box>
                  <Typography 
                    variant="h2" 
                    sx={{ 
                      fontWeight: 800,
                      background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 100%)`,
                      backgroundClip: 'text',
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent',
                      mb: 1,
                      animation: `${slideInLeft} 1s ease-out`,
                    }}
                  >
                    Client Orders Hub
                  </Typography>
                  <Typography 
                    variant="h6" 
                    sx={{ 
                      color: theme.palette.text.secondary,
                      fontWeight: 400,
                      animation: `${slideInLeft} 1s ease-out 0.2s both`,
                    }}
                  >
                    Advanced order management with real-time tracking & analytics
                  </Typography>
                  
                  {/* Quick stats */}
                  <Stack direction="row" spacing={3} sx={{ mt: 2 }}>
                    <Box display="flex" alignItems="center" gap={1}>
                      <Avatar sx={{ bgcolor: theme.palette.primary.main, width: 32, height: 32 }}>
                        <Business fontSize="small" />
                      </Avatar>
                      <Box>
                        <Typography variant="h6" fontWeight="bold">
                          {clients.length}
                        </Typography>
                        <Typography variant="caption" color="textSecondary">
                          Total Clients
                        </Typography>
                      </Box>
                    </Box>
                    <Box display="flex" alignItems="center" gap={1}>
                      <Avatar sx={{ bgcolor: theme.palette.success.main, width: 32, height: 32 }}>
                        <Assignment fontSize="small" />
                      </Avatar>
                      <Box>
                        <Typography variant="h6" fontWeight="bold">
                          {filteredProducts.length}
                        </Typography>
                        <Typography variant="caption" color="textSecondary">
                          {selectedClient ? 'Client Products' : 'Total Products'}
                        </Typography>
                      </Box>
                    </Box>
                    <Box display="flex" alignItems="center" gap={1}>
                      <Avatar sx={{ bgcolor: theme.palette.warning.main, width: 32, height: 32 }}>
                        <AttachMoney fontSize="small" />
                      </Avatar>
                      <Box>
                        <Typography variant="h6" fontWeight="bold">
                          ₹{filteredProducts.reduce((sum, p) => sum + (parseFloat(p.basePrice) || 0), 0).toLocaleString()}
                        </Typography>
                        <Typography variant="caption" color="textSecondary">
                          {selectedClient ? 'Client Value' : 'Total Value'}
                        </Typography>
                      </Box>
                    </Box>
                    <Box display="flex" alignItems="center" gap={1}>
                      <Avatar sx={{ bgcolor: theme.palette.info.main, width: 32, height: 32 }}>
                        <Description fontSize="small" />
                      </Avatar>
                      <Box>
                        <Typography variant="h6" fontWeight="bold">
                          {filteredProducts.filter(p => p.drawing || p.fpa || p.bom).length}
                        </Typography>
                        <Typography variant="caption" color="textSecondary">
                          With Documents
                        </Typography>
                      </Box>
                    </Box>
                  </Stack>
                </Box>
                
                 <Box display="flex" gap={2} flexWrap="wrap" alignItems="center">
                   {/* Real-time status indicator */}
                   <Box display="flex" alignItems="center" gap={1}>
                     <Box
                       sx={{
                         width: 8,
                         height: 8,
                         borderRadius: '50%',
                         backgroundColor: isRealTimeEnabled ? theme.palette.success.main : theme.palette.grey[400],
                         animation: isRealTimeEnabled ? `${pulse} 2s infinite` : 'none',
                       }}
                     />
                     <Typography variant="caption" color="textSecondary">
                       {isRealTimeEnabled ? 'Live' : 'Offline'}
                     </Typography>
                     <Typography variant="caption" color="textSecondary">
                       • Last updated: {lastUpdated.toLocaleTimeString()}
                     </Typography>
                   </Box>
                   
                   <Tooltip title="Refresh Data">
                     <IconButton
                       size="small"
                       onClick={async () => {
                         try {
                           await Promise.all([loadClients(), loadProducts()]);
                           setLastUpdated(new Date());
                           showSnackbar('Data refreshed successfully!', 'success');
                         } catch (err) {
                           showSnackbar('Failed to refresh data', 'error');
                         }
                       }}
                       sx={{
                         color: theme.palette.primary.main,
                         '&:hover': {
                           backgroundColor: alpha(theme.palette.primary.main, 0.1),
                           transform: 'rotate(180deg)',
                         },
                         transition: 'all 0.3s ease',
                       }}
                     >
                       <Refresh />
                     </IconButton>
                   </Tooltip>
                   
                   <Tooltip title="Toggle Real-time Updates">
                     <IconButton
                       size="small"
                       onClick={() => setIsRealTimeEnabled(!isRealTimeEnabled)}
                       sx={{
                         color: isRealTimeEnabled ? theme.palette.success.main : theme.palette.grey[400],
                         '&:hover': {
                           backgroundColor: alpha(isRealTimeEnabled ? theme.palette.success.main : theme.palette.grey[400], 0.1),
                         },
                       }}
                     >
                       {isRealTimeEnabled ? <NotificationsActive /> : <NotificationsActive />}
                     </IconButton>
                   </Tooltip>
                   
                   <Tooltip title="View Mode">
                     <ToggleButtonGroup
                       value={viewMode}
                       exclusive
                       onChange={(e, newMode) => newMode && setViewMode(newMode)}
                       size="small"
                     >
                       <ToggleButton value="table">
                         <Timeline />
                       </ToggleButton>
                       <ToggleButton value="cards">
                         <Dashboard />
                       </ToggleButton>
                     </ToggleButtonGroup>
                   </Tooltip>
                 </Box>
              </Box>
            </CardContent>
          </GlassmorphismCard>
        </Slide>

        {/* Enhanced Search and Filters */}
        <Zoom in timeout={600}>
          <AnimatedCard sx={{ mb: 3 }}>
            <CardContent sx={{ p: 3 }}>
              <Grid container spacing={2} alignItems="center">
                <Grid item xs={12} md={4}>
                  <Autocomplete
                    fullWidth
                    options={clients}
                    getOptionLabel={(option) => `${option.clientCode} - ${option.clientName}`}
                    value={selectedClient}
                    onChange={(event, newValue) => {
                      setSelectedClient(newValue);
                      setPage(0); // Reset pagination when client changes
                    }}
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        placeholder="Select Client..."
                        InputProps={{
                          ...params.InputProps,
                          startAdornment: (
                            <Box sx={{ mr: 1, color: 'text.secondary' }}>
                              <Business />
                            </Box>
                          ),
                          sx: {
                            borderRadius: 3,
                            '& .MuiOutlinedInput-notchedOutline': {
                              borderColor: alpha(theme.palette.primary.main, 0.2),
                            },
                            '&:hover .MuiOutlinedInput-notchedOutline': {
                              borderColor: alpha(theme.palette.primary.main, 0.4),
                            },
                            '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                              borderColor: theme.palette.primary.main,
                              borderWidth: 2,
                            },
                          },
                        }}
                      />
                    )}
                    renderOption={(props, option) => (
                      <Box component="li" {...props}>
                        <Box>
                          <Typography variant="body1" fontWeight="600">
                            {option.clientCode}
                          </Typography>
                          <Typography variant="body2" color="textSecondary">
                            {option.clientName}
                          </Typography>
                        </Box>
                      </Box>
                    )}
                    noOptionsText="No clients found"
                    clearOnEscape
                    clearText="Clear selection"
                    renderTags={() => null}
                    isClearable
                  />
                </Grid>
                <Grid item xs={12} md={4}>
                  <TextField
                    fullWidth
                    placeholder="Search products by code, name, description..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    InputProps={{
                      startAdornment: (
                        <Box sx={{ mr: 1, color: 'text.secondary' }}>
                          <Search />
                        </Box>
                      ),
                      sx: {
                        borderRadius: 3,
                        '& .MuiOutlinedInput-notchedOutline': {
                          borderColor: alpha(theme.palette.primary.main, 0.2),
                        },
                        '&:hover .MuiOutlinedInput-notchedOutline': {
                          borderColor: alpha(theme.palette.primary.main, 0.4),
                        },
                        '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                          borderColor: theme.palette.primary.main,
                          borderWidth: 2,
                        },
                      },
                    }}
                  />
                </Grid>
                <Grid item xs={12} md={4}>
                  <Box 
                    display="flex" 
                    gap={1} 
                    justifyContent="flex-end" 
                    flexWrap="wrap"
                    sx={{ minWidth: 0 }} // Allow shrinking
                  >
                    <FilterButton
                      startIcon={<FilterList />}
                      variant="outlined"
                      onClick={(e) => setFilterMenuAnchor(e.currentTarget)}
                      sx={{ 
                        px: 2,
                        py: 1.5,
                        borderRadius: 2,
                        textTransform: 'none',
                        fontWeight: 600,
                        fontSize: '0.875rem',
                        borderColor: alpha(theme.palette.primary.main, 0.3),
                        color: theme.palette.primary.main,
                        '&:hover': {
                          borderColor: theme.palette.primary.main,
                          backgroundColor: alpha(theme.palette.primary.main, 0.04),
                        }
                      }}
                    >
                      Filter
                    </FilterButton>
                    {selectedClient && (
                      <AnimatedButton
                        startIcon={<Close />}
                        variant="outlined"
                        onClick={() => {
                          setSelectedClient(null);
                          setPage(0);
                        }}
                        sx={{ color: theme.palette.error.main, borderColor: theme.palette.error.main }}
                      >
                        Clear Client
                      </AnimatedButton>
                    )}
                    <AnimatedButton
                      startIcon={<Analytics />}
                      variant="outlined"
                      onClick={() => {
                        // Show analytics dialog
                        const analyticsData = {
                          totalClients: clients.length,
                          totalProducts: filteredProducts.length,
                          totalValue: filteredProducts.reduce((sum, p) => sum + (parseFloat(p.basePrice) || 0), 0),
                          productsWithDocs: filteredProducts.filter(p => p.drawing || p.fpa || p.bom).length,
                          avgProductValue: filteredProducts.length > 0 ? 
                            filteredProducts.reduce((sum, p) => sum + (parseFloat(p.basePrice) || 0), 0) / filteredProducts.length : 0,
                          topClient: selectedClient ? selectedClient.clientName : 
                            clients.reduce((prev, current) => 
                              (prev.totalValue || 0) > (current.totalValue || 0) ? prev : current
                            )?.clientName || 'N/A'
                        };
                        
                        showSnackbar(
                          `Analytics: ${analyticsData.totalClients} clients, ${analyticsData.totalProducts} products, ₹${analyticsData.totalValue.toLocaleString()} total value`, 
                          'info'
                        );
                      }}
                    >
                      Analytics
                    </AnimatedButton>
                    <AnimatedButton
                      startIcon={<Download />}
                      variant="outlined"
                      onClick={() => showSnackbar('Export feature coming soon!', 'info')}
                    >
                      Export
                    </AnimatedButton>
                    <AnimatedButton
                      startIcon={<Print />}
                      variant="outlined"
                      onClick={() => window.print()}
                    >
                      Print
                    </AnimatedButton>
                  </Box>
                </Grid>
              </Grid>
            </CardContent>
          </AnimatedCard>
        </Zoom>

        {/* Filter Dropdown Menu */}
        <Menu
          anchorEl={filterMenuAnchor}
          open={Boolean(filterMenuAnchor)}
          onClose={() => setFilterMenuAnchor(null)}
          PaperProps={{
            sx: {
              borderRadius: 2,
              minWidth: 280,
              boxShadow: `0 8px 32px ${alpha(theme.palette.common.black, 0.12)}`,
              border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
              mt: 1
            }
          }}
        >
          <Box sx={{ p: 2 }}>
            <Typography variant="subtitle1" sx={{ mb: 2, fontWeight: 600, color: theme.palette.text.primary }}>
              Filter Options
            </Typography>
            
            <Box sx={{ mb: 3 }}>
              <Typography variant="subtitle2" sx={{ mb: 1, color: theme.palette.text.secondary }}>
                Order Status
              </Typography>
              <FormControl fullWidth size="small">
                <Select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  displayEmpty
                  sx={{ borderRadius: 1 }}
                >
                  <MenuItem value="">
                    <em>All Statuses</em>
                  </MenuItem>
                  {orderStatuses.map(status => (
                    <MenuItem key={status} value={status}>
                      <Box display="flex" alignItems="center" gap={1}>
                        <StyledChip 
                          label={status} 
                          size="small" 
                          variant={getStatusColor(status)}
                        />
                      </Box>
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Box>

            <Box sx={{ mb: 2 }}>
              <Typography variant="subtitle2" sx={{ mb: 1, color: theme.palette.text.secondary }}>
                Date Range
              </Typography>
              <Box display="flex" gap={1}>
                <TextField
                  size="small"
                  type="date"
                  label="From"
                  InputLabelProps={{ shrink: true }}
                  sx={{ flex: 1 }}
                />
                <TextField
                  size="small"
                  type="date"
                  label="To"
                  InputLabelProps={{ shrink: true }}
                  sx={{ flex: 1 }}
                />
              </Box>
            </Box>

            <Box display="flex" gap={1} justifyContent="flex-end" sx={{ mt: 3 }}>
              <Button
                size="small"
                onClick={() => {
                  setFilterStatus('');
                  setFilterMenuAnchor(null);
                }}
                sx={{ textTransform: 'none' }}
              >
                Clear All
              </Button>
              <Button
                size="small"
                variant="contained"
                onClick={() => setFilterMenuAnchor(null)}
                sx={{ textTransform: 'none' }}
              >
                Apply Filters
              </Button>
            </Box>
          </Box>
        </Menu>

        {/* Enhanced Product Tabs with Animation */}
        <Grow in timeout={800}>
          <AnimatedCard sx={{ mb: 3 }}>
            <Tabs
              value={activeTab}
              onChange={(e, newValue) => setActiveTab(newValue)}
              sx={{
                '& .MuiTab-root': {
                  minWidth: 'auto',
                  px: 3,
                  py: 2,
                  fontWeight: 600,
                  borderRadius: '12px 12px 0 0',
                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                  '&:hover': {
                    backgroundColor: alpha(theme.palette.primary.main, 0.08),
                    transform: 'translateY(-2px)',
                  },
                  '&.Mui-selected': {
                    background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 100%)`,
                    color: 'white',
                    transform: 'translateY(-4px)',
                    boxShadow: `0 8px 24px ${alpha(theme.palette.primary.main, 0.3)}`,
                  },
                },
                '& .MuiTabs-indicator': {
                  display: 'none',
                },
              }}
            >
              <Tab
                label={
                  <Badge badgeContent={filteredProducts.length} color="primary" max={999}>
                    <Box display="flex" alignItems="center" gap={1}>
                      <Timeline />
                      ALL PRODUCTS
                    </Box>
                  </Badge>
                }
              />
              <Tab
                label={
                  <Badge 
                    badgeContent={filteredProducts.filter(p => !p.drawing && !p.fpa && !p.bom && !p.sop).length} 
                    color="default" 
                    max={999}
                  >
                    <Box display="flex" alignItems="center" gap={1}>
                      <Edit />
                      DRAFT PRODUCTS
                    </Box>
                  </Badge>
                }
              />
              <Tab
                label={
                  <Badge
                    badgeContent={filteredProducts.filter(p => p.drawing || p.fpa || p.bom || p.sop).length}
                    color="warning"
                    max={999}
                  >
                    <Box display="flex" alignItems="center" gap={1}>
                      <Assignment />
                      ACTIVE PRODUCTS
                    </Box>
                  </Badge>
                }
              />
              <Tab
                label={
                  <Badge
                    badgeContent={filteredProducts.filter(p => parseFloat(p.basePrice || 0) > 2000).length}
                    color="success"
                    max={999}
                  >
                    <Box display="flex" alignItems="center" gap={1}>
                      <CheckCircle />
                      PREMIUM PRODUCTS
                    </Box>
                  </Badge>
                }
              />
            </Tabs>
          </AnimatedCard>
        </Grow>

        {/* Bulk Actions Toolbar */}
        {selectedProducts.length > 0 && (
          <Fade in timeout={300}>
            <AnimatedCard sx={{ mb: 2, bgcolor: alpha(theme.palette.primary.main, 0.05) }}>
              <CardContent sx={{ py: 2 }}>
                <Box display="flex" alignItems="center" justifyContent="space-between">
                  <Box display="flex" alignItems="center" gap={2}>
                    <Typography variant="body1" fontWeight="600">
                      {selectedProducts.length} product{selectedProducts.length > 1 ? 's' : ''} selected
                    </Typography>
                    <Button
                      size="small"
                      onClick={() => setSelectedProducts([])}
                      sx={{ textTransform: 'none' }}
                    >
                      Clear Selection
                    </Button>
                  </Box>
                  <Box display="flex" gap={1}>
                    <Button
                      size="small"
                      variant="outlined"
                      startIcon={<Download />}
                      onClick={() => showSnackbar(`Exporting ${selectedProducts.length} products...`, 'info')}
                    >
                      Export
                    </Button>
                    <Button
                      size="small"
                      variant="outlined"
                      startIcon={<Print />}
                      onClick={() => showSnackbar(`Printing ${selectedProducts.length} products...`, 'info')}
                    >
                      Print
                    </Button>
                    <Button
                      size="small"
                      variant="outlined"
                      startIcon={<Analytics />}
                      onClick={() => {
                        const selectedData = paginatedData.filter(p => 
                          selectedProducts.includes(p.uniqueKey || `${p.clientCode}-${p.productCode}`)
                        );
                        const totalValue = selectedData.reduce((sum, p) => sum + (parseFloat(p.basePrice) || 0), 0);
                        showSnackbar(`Selected products value: ₹${totalValue.toLocaleString()}`, 'info');
                      }}
                    >
                      Analytics
                    </Button>
                  </Box>
                </Box>
              </CardContent>
            </AnimatedCard>
          </Fade>
        )}

        {/* Enhanced Products Display */}
        {viewMode === 'table' ? (
          <Fade in timeout={1000}>
            <AnimatedCard>
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow sx={{ 
                      background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.1)} 0%, ${alpha(theme.palette.secondary.main, 0.1)} 100%)`,
                    }}>
                      <TableCell padding="checkbox">
                        <Checkbox
                          indeterminate={selectedProducts.length > 0 && selectedProducts.length < paginatedData.length}
                          checked={paginatedData.length > 0 && selectedProducts.length === paginatedData.length}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedProducts(paginatedData.map(p => p.uniqueKey || `${p.clientCode}-${p.productCode}`));
                            } else {
                              setSelectedProducts([]);
                            }
                          }}
                          sx={{ color: theme.palette.primary.main }}
                        />
                      </TableCell>
                      <TableCell sx={{ fontWeight: 700, fontSize: '0.9rem' }}>Client</TableCell>
                      <TableCell sx={{ fontWeight: 700, fontSize: '0.9rem' }}>Product Code</TableCell>
                      <TableCell sx={{ fontWeight: 700, fontSize: '0.9rem' }}>Product Name</TableCell>
                      <TableCell sx={{ fontWeight: 700, fontSize: '0.9rem' }}>Description</TableCell>
                      <TableCell sx={{ fontWeight: 700, fontSize: '0.9rem' }}>Base Price</TableCell>
                      <TableCell sx={{ fontWeight: 700, fontSize: '0.9rem' }}>Attachments</TableCell>
                      <TableCell sx={{ fontWeight: 700, fontSize: '0.9rem' }}>Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {paginatedData.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={8} align="center" sx={{ py: 8 }}>
                          <Zoom in timeout={600}>
                            <Box display="flex" flexDirection="column" alignItems="center" gap={3}>
                              <Avatar 
                                sx={{ 
                                  width: 120, 
                                  height: 120, 
                                  background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 100%)`,
                                  animation: `${float} 3s ease-in-out infinite`,
                                }}
                              >
                                <ShoppingCart sx={{ fontSize: 60 }} />
                              </Avatar>
                               <Box textAlign="center">
                                 <Typography variant="h4" fontWeight="bold" gutterBottom>
                                   {selectedClient ? 'No Products Found' : 'No Products Available'}
                                 </Typography>
                                 <Typography variant="body1" color="textSecondary" paragraph>
                                   {selectedClient 
                                     ? `No products found for ${selectedClient.clientName} (${selectedClient.clientCode})`
                                     : 'No products available at this time'
                                   }
                                 </Typography>
                               </Box>
                             </Box>
                           </Zoom>
                         </TableCell>
                      </TableRow>
                    ) : (
                      paginatedData.map((product, index) => (
                        <Fade in timeout={300 + index * 100} key={product.productCode || index}>
                          <StyledTableRow>
                            <TableCell padding="checkbox">
                              <Checkbox
                                checked={selectedProducts.includes(product.uniqueKey || `${product.clientCode}-${product.productCode}`)}
                                onChange={(e) => {
                                  const productKey = product.uniqueKey || `${product.clientCode}-${product.productCode}`;
                                  if (e.target.checked) {
                                    setSelectedProducts([...selectedProducts, productKey]);
                                  } else {
                                    setSelectedProducts(selectedProducts.filter(key => key !== productKey));
                                  }
                                }}
                                sx={{ color: theme.palette.primary.main }}
                              />
                            </TableCell>
                            <TableCell>
                              <Box>
                                <Typography variant="body2" fontWeight="600" color="primary">
                                  {product.clientCode || 'N/A'}
                                </Typography>
                                <Typography variant="caption" color="textSecondary">
                                  {product.clientName || 'N/A'}
                                </Typography>
                              </Box>
                            </TableCell>
                            <TableCell>
                              <Typography variant="body2" fontWeight="600" color="primary">
                                {product.productCode || 'N/A'}
                              </Typography>
                            </TableCell>
                            <TableCell>
                              <Typography variant="body2" fontWeight="600">
                                {product.productName || 'N/A'}
                              </Typography>
                            </TableCell>
                            <TableCell>
                              <Typography 
                                variant="body2" 
                                sx={{ 
                                  maxWidth: 200,
                                  overflow: 'hidden',
                                  textOverflow: 'ellipsis',
                                  whiteSpace: 'nowrap'
                                }}
                              >
                                {product.description || 'N/A'}
                              </Typography>
                            </TableCell>
                            <TableCell>
                              <Typography variant="body1" fontWeight="bold" color="success.main">
                                ₹{parseFloat(product.basePrice || 0).toLocaleString()}
                              </Typography>
                            </TableCell>
                            <TableCell>
                              <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                                {product.drawing && (
                                  <Chip
                                    label="Drawing"
                                    size="small"
                                    sx={{
                                      backgroundColor: '#e3f2fd',
                                      color: '#1976d2',
                                      fontSize: '0.7rem',
                                      cursor: 'pointer',
                                      '&:hover': { backgroundColor: '#bbdefb' }
                                    }}
                                  />
                                )}
                                {product.fpa && (
                                  <Chip
                                    label="FPA"
                                    size="small"
                                    sx={{
                                      backgroundColor: '#e3f2fd',
                                      color: '#1976d2',
                                      fontSize: '0.7rem',
                                      cursor: 'pointer',
                                      '&:hover': { backgroundColor: '#bbdefb' }
                                    }}
                                  />
                                )}
                                {product.bom && (
                                  <Chip
                                    label="BOM"
                                    size="small"
                                    sx={{
                                      backgroundColor: '#e3f2fd',
                                      color: '#1976d2',
                                      fontSize: '0.7rem',
                                      cursor: 'pointer',
                                      '&:hover': { backgroundColor: '#bbdefb' }
                                    }}
                                  />
                                )}
                              </Box>
                            </TableCell>
                             <TableCell>
                               <Tooltip title="View Product">
                                 <IconButton 
                                   size="small" 
                                   onClick={() => handleViewProduct(product)}
                                   sx={{ 
                                     color: theme.palette.info.main,
                                     '&:hover': { 
                                       backgroundColor: alpha(theme.palette.info.main, 0.1),
                                       transform: 'scale(1.1)',
                                     },
                                   }}
                                 >
                                   <Visibility />
                                 </IconButton>
                               </Tooltip>
                             </TableCell>
                          </StyledTableRow>
                        </Fade>
                      ))
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
              
              {/* Enhanced Pagination */}
              {getTabData().length > 0 && (
                <Box sx={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'center',
                  p: 2,
                  borderTop: 1, 
                  borderColor: 'divider',
                  backgroundColor: 'rgba(248, 250, 255, 0.5)'
                }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Typography variant="body2" sx={{ color: '#6c757d', fontWeight: 500 }}>
                      Rows per page:
                    </Typography>
                    <FormControl size="small" sx={{ minWidth: 80 }}>
                      <Select
                        value={rowsPerPage}
                        onChange={(e) => {
                          setRowsPerPage(e.target.value);
                          setPage(0);
                        }}
                        sx={{
                          '& .MuiOutlinedInput-notchedOutline': {
                            borderColor: 'rgba(102, 126, 234, 0.3)',
                          },
                          '&:hover .MuiOutlinedInput-notchedOutline': {
                            borderColor: 'rgba(102, 126, 234, 0.5)',
                          },
                          '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                            borderColor: '#667eea',
                          }
                        }}
                      >
                        <MenuItem value={5}>5</MenuItem>
                        <MenuItem value={10}>10</MenuItem>
                        <MenuItem value={25}>25</MenuItem>
                        <MenuItem value={50}>50</MenuItem>
                      </Select>
                    </FormControl>
                  </Box>

                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                    <Typography variant="body2" sx={{ color: '#6c757d', fontWeight: 500 }}>
                      {page * rowsPerPage + 1}-{Math.min((page + 1) * rowsPerPage, getTabData().length)} of {getTabData().length} orders
                    </Typography>
                    
                    {Math.ceil(getTabData().length / rowsPerPage) > 1 && (
                      <Pagination
                        count={Math.ceil(getTabData().length / rowsPerPage)}
                        page={page + 1}
                        onChange={(event, value) => setPage(value - 1)}
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
                              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
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
            </AnimatedCard>
          </Fade>
        ) : (
          /* Card View Mode */
          <Fade in timeout={1000}>
            <Grid container spacing={3}>
              {paginatedData.length === 0 ? (
                <Grid item xs={12}>
                  <Zoom in timeout={600}>
                    <Box 
                      display="flex" 
                      flexDirection="column" 
                      alignItems="center" 
                      gap={3}
                      sx={{ py: 8 }}
                    >
                      <Avatar 
                        sx={{ 
                          width: 120, 
                          height: 120, 
                          background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 100%)`,
                          animation: `${float} 3s ease-in-out infinite`,
                        }}
                      >
                        <ShoppingCart sx={{ fontSize: 60 }} />
                      </Avatar>
                       <Box textAlign="center">
                         <Typography variant="h4" fontWeight="bold" gutterBottom>
                           {selectedClient ? 'No Products Found' : 'No Products Available'}
                         </Typography>
                         <Typography variant="body1" color="textSecondary" paragraph>
                           {selectedClient 
                             ? `No products found for ${selectedClient.clientName} (${selectedClient.clientCode})`
                             : 'No products available at this time'
                           }
                         </Typography>
                       </Box>
                    </Box>
                  </Zoom>
                </Grid>
              ) : (
                paginatedData.map((product, index) => (
                  <Grid item xs={12} md={6} lg={4} key={product.productCode || index}>
                    <Fade in timeout={300 + index * 100}>
                      <GradientCard sx={{ height: '100%' }}>
                        <CardHeader
                          avatar={
                            <Avatar sx={{ bgcolor: theme.palette.primary.main }}>
                              <Business />
                            </Avatar>
                          }
                          title={
                            <Typography variant="h6" fontWeight="bold">
                              {product.clientCode || 'N/A'}
                            </Typography>
                          }
                          subheader={
                            <Typography variant="body2" color="textSecondary">
                              {product.clientName || 'N/A'}
                            </Typography>
                          }
                          action={
                            <Box>
                              <Typography variant="caption" color="textSecondary">
                                Price: ₹{parseFloat(product.basePrice || 0).toLocaleString()}
                              </Typography>
                            </Box>
                          }
                        />
                        <CardContent sx={{ pt: 0 }}>
                          <Stack spacing={2}>
                            <Box display="flex" alignItems="center" gap={2}>
                              <Assignment color="action" />
                              <Box>
                                <Typography 
                                  variant="body2" 
                                  fontWeight="600"
                                  sx={{ 
                                    overflow: 'hidden',
                                    textOverflow: 'ellipsis',
                                    whiteSpace: 'nowrap'
                                  }}
                                >
                                  {product.productCode || 'N/A'}
                                </Typography>
                                <Typography variant="caption" color="textSecondary">
                                  Product Code
                                </Typography>
                              </Box>
                            </Box>
                            
                            <Box display="flex" alignItems="center" gap={2}>
                              <Description color="action" />
                              <Box>
                                <Typography 
                                  variant="body2" 
                                  fontWeight="600"
                                  sx={{ 
                                    overflow: 'hidden',
                                    textOverflow: 'ellipsis',
                                    whiteSpace: 'nowrap'
                                  }}
                                >
                                  {product.productName || 'No name'}
                                </Typography>
                                <Typography variant="caption" color="textSecondary">
                                  Product Name
                                </Typography>
                              </Box>
                            </Box>
                            
                            <Box display="flex" alignItems="center" gap={2}>
                              <Description color="action" />
                              <Box>
                                <Typography 
                                  variant="body2" 
                                  sx={{ 
                                    overflow: 'hidden',
                                    textOverflow: 'ellipsis',
                                    whiteSpace: 'nowrap'
                                  }}
                                >
                                  {product.description || 'No description'}
                                </Typography>
                                <Typography variant="caption" color="textSecondary">
                                  Description
                                </Typography>
                              </Box>
                            </Box>
                            
                            <Box display="flex" gap={0.5} flexWrap="wrap">
                              {product.drawing && (
                                <Chip label="Drawing" size="small" variant="outlined" />
                              )}
                              {product.fpa && (
                                <Chip label="FPA" size="small" variant="outlined" />
                              )}
                              {product.bom && (
                                <Chip label="BOM" size="small" variant="outlined" />
                              )}
                            </Box>
                          </Stack>
                        </CardContent>
                         <CardActions sx={{ justifyContent: 'center', p: 2 }}>
                           <AnimatedButton
                             size="small"
                             startIcon={<Visibility />}
                             onClick={() => handleViewProduct(product)}
                           >
                             View Product
                           </AnimatedButton>
                         </CardActions>
                      </GradientCard>
                    </Fade>
                  </Grid>
                ))
              )}
              
              {/* Pagination for Card View */}
              {paginatedData.length > 0 && (
                <Grid item xs={12}>
                  <Box display="flex" justifyContent="center" sx={{ mt: 3 }}>
                    <Pagination
                      count={Math.ceil(getTabData().length / rowsPerPage)}
                      page={page + 1}
                      onChange={(e, newPage) => setPage(newPage - 1)}
                      color="primary"
                      size="large"
                      sx={{
                        '& .MuiPaginationItem-root': {
                          borderRadius: 2,
                          fontWeight: 600,
                          transition: 'all 0.3s',
                          '&:hover': {
                            transform: 'scale(1.1)',
                          },
                          '&.Mui-selected': {
                            background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 100%)`,
                            color: 'white',
                            transform: 'scale(1.1)',
                          },
                        },
                      }}
                    />
                  </Box>
                </Grid>
              )}
            </Grid>
          </Fade>
        )}

        {/* Enhanced Snackbar */}
        <Snackbar
          open={snackbar.open}
          autoHideDuration={4000}
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
        >
          <Alert
            onClose={() => setSnackbar({ ...snackbar, open: false })}
            severity={snackbar.severity}
            sx={{
              borderRadius: 3,
              boxShadow: `0 8px 32px ${alpha(theme.palette.common.black, 0.12)}`,
              backdropFilter: 'blur(20px)',
              fontWeight: 600,
              '& .MuiAlert-icon': {
                fontSize: '1.5rem',
              },
            }}
          >
            {snackbar.message}
          </Alert>
        </Snackbar>
      </Container>

      {/* Enhanced View Order Dialog */}
      <Dialog
        open={viewDialogOpen}
        onClose={() => setViewDialogOpen(false)}
        maxWidth="lg"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 4,
            background: `linear-gradient(135deg, 
              ${alpha(theme.palette.background.paper, 0.95)} 0%, 
              ${alpha(theme.palette.background.paper, 0.9)} 100%)`,
            backdropFilter: 'blur(20px)',
            boxShadow: `0 24px 48px ${alpha(theme.palette.common.black, 0.15)}`,
          },
        }}
        TransitionComponent={Slide}
        TransitionProps={{ direction: 'left' }}
      >
        <DialogTitle
          sx={{
            background: `linear-gradient(135deg, ${theme.palette.info.main} 0%, ${theme.palette.info.dark} 100%)`,
            color: 'white',
            fontWeight: 700,
            p: 3,
          }}
        >
          <Box display="flex" alignItems="center" justifyContent="space-between">
            <Box display="flex" alignItems="center" gap={2}>
              <Avatar sx={{ bgcolor: 'rgba(255,255,255,0.2)' }}>
                <Visibility />
              </Avatar>
              Order Details - {selectedOrder?.orderNumber}
            </Box>
            <Box>
              <StyledChip
                label={selectedOrder?.status}
                variant={getStatusColor(selectedOrder?.status)}
              />
            </Box>
          </Box>
        </DialogTitle>
        
        <DialogContent sx={{ p: 0 }}>
          {selectedOrder && (
            <Box sx={{ p: 4 }}>
              {/* Status Stepper */}
              <StatusStepper currentStatus={selectedOrder.Status} />
              
              <Grid container spacing={4} sx={{ mt: 2 }}>
                <Grid item xs={12} md={6}>
                  <GradientCard>
                    <CardHeader
                      avatar={
                        <Avatar sx={{ bgcolor: theme.palette.primary.main }}>
                          <Business />
                        </Avatar>
                      }
                      title="Client Information"
                      titleTypographyProps={{ fontWeight: 'bold', color: 'primary' }}
                    />
                    <CardContent>
                      <Stack spacing={2}>
                        <Box display="flex" alignItems="center" gap={2}>
                          <Business color="action" />
                          <Box>
                            <Typography variant="body1" fontWeight="600">
                              Client Code: {selectedOrder.ClientCode || 'N/A'}
                            </Typography>
                            <Typography variant="caption" color="textSecondary">
                              Order ID: {selectedOrder.Id || 'N/A'}
                            </Typography>
                          </Box>
                        </Box>
                        <Box display="flex" alignItems="center" gap={2}>
                          <AccountCircle color="action" />
                          <Typography variant="body2">
                            Order Number: {selectedOrder.OrderNumber || 'N/A'}
                          </Typography>
                        </Box>
                        <Box display="flex" alignItems="center" gap={2}>
                          <Email color="action" />
                          <Typography variant="body2">
                            Status: {selectedOrder.Status || 'N/A'}
                          </Typography>
                        </Box>
                        <Box display="flex" alignItems="center" gap={2}>
                          <Phone color="action" />
                          <Typography variant="body2">
                            Items: {selectedOrder.Items || 0}
                          </Typography>
                        </Box>
                      </Stack>
                    </CardContent>
                  </GradientCard>
                </Grid>

                <Grid item xs={12} md={6}>
                  <GradientCard>
                    <CardHeader
                      avatar={
                        <Avatar sx={{ bgcolor: theme.palette.secondary.main }}>
                          <Assignment />
                        </Avatar>
                      }
                      title="Order Information"
                      titleTypographyProps={{ fontWeight: 'bold', color: 'secondary' }}
                    />
                    <CardContent>
                      <Stack spacing={2}>
                        <Box display="flex" alignItems="center" gap={2}>
                          <CalendarToday color="action" />
                          <Box>
                            <Typography variant="body2" fontWeight="600">
                              Order Date: {selectedOrder.OrderDate ? new Date(selectedOrder.OrderDate).toLocaleDateString() : 'Invalid Date'}
                            </Typography>
                          </Box>
                        </Box>
                        <Box display="flex" alignItems="center" gap={2}>
                          <Schedule color="action" />
                          <Box>
                            <Typography variant="body2" fontWeight="600">
                              Total Amount: ₹{parseFloat(selectedOrder.TotalAmount || 0).toLocaleString()}
                            </Typography>
                          </Box>
                        </Box>
                        <Box display="flex" alignItems="center" gap={2}>
                          <Flag color="action" />
                          <Typography variant="body2">
                            Items: {selectedOrder.Items || 0}
                          </Typography>
                        </Box>
                        <Box display="flex" alignItems="center" gap={2}>
                          <Category color="action" />
                          <Typography variant="body2">
                            Status: {selectedOrder.Status || 'N/A'}
                          </Typography>
                        </Box>
                        <Box display="flex" alignItems="center" gap={2}>
                          <Payment color="action" />
                          <Typography variant="body2">
                            Order ID: {selectedOrder.Id || 'N/A'}
                          </Typography>
                        </Box>
                      </Stack>
                    </CardContent>
                  </GradientCard>
                </Grid>

                {selectedOrder.specialInstructions && (
                  <Grid item xs={12}>
                    <GradientCard>
                      <CardHeader
                        avatar={
                          <Avatar sx={{ bgcolor: theme.palette.warning.main }}>
                            <NotificationsActive />
                          </Avatar>
                        }
                        title="Special Instructions"
                        titleTypographyProps={{ fontWeight: 'bold', color: 'warning.main' }}
                      />
                      <CardContent>
                        <Typography variant="body2">
                          {selectedOrder.specialInstructions}
                        </Typography>
                      </CardContent>
                    </GradientCard>
                  </Grid>
                )}

                <Grid item xs={12}>
                  <GradientCard>
                    <CardHeader
                      avatar={
                        <Avatar sx={{ bgcolor: theme.palette.success.main }}>
                          <Inventory />
                        </Avatar>
                      }
                      title="Order Items"
                      titleTypographyProps={{ fontWeight: 'bold', color: 'success.main' }}
                    />
                    <CardContent>
                      {selectedOrder.Items && selectedOrder.Items.length > 0 ? (
                        <TableContainer>
                          <Table>
                            <TableHead>
                              <TableRow sx={{ bgcolor: alpha(theme.palette.success.main, 0.05) }}>
                                <TableCell sx={{ fontWeight: 700 }}>Product</TableCell>
                                <TableCell sx={{ fontWeight: 700 }}>Description</TableCell>
                                <TableCell align="right" sx={{ fontWeight: 700 }}>Qty</TableCell>
                                <TableCell align="right" sx={{ fontWeight: 700 }}>Unit Price</TableCell>
                                <TableCell align="right" sx={{ fontWeight: 700 }}>Total</TableCell>
                              </TableRow>
                            </TableHead>
                            <TableBody>
                              {selectedOrder.Items.map((item, index) => (
                                <StyledTableRow key={index}>
                                  <TableCell>
                                    <Box>
                                      <Typography variant="body2" fontWeight="600">
                                        {item.productName}
                                      </Typography>
                                      <Typography variant="caption" color="textSecondary">
                                        {item.productCode}
                                      </Typography>
                                    </Box>
                                  </TableCell>
                                  <TableCell>
                                    <Typography variant="body2">
                                      {item.description}
                                    </Typography>
                                  </TableCell>
                                  <TableCell align="right">
                                    <Chip
                                      label={item.quantity}
                                      size="small"
                                      variant="outlined"
                                      sx={{ borderRadius: 2 }}
                                    />
                                  </TableCell>
                                  <TableCell align="right">
                                    <Typography variant="body2">
                                      ₹{item.unitPrice.toLocaleString()}
                                    </Typography>
                                  </TableCell>
                                  <TableCell align="right">
                                    <Typography variant="body2" fontWeight="bold" color="success.main">
                                      ₹{item.totalPrice.toLocaleString()}
                                    </Typography>
                                  </TableCell>
                                </StyledTableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </TableContainer>
                      ) : (
                        <Typography color="textSecondary">No items in this order</Typography>
                      )}
                    </CardContent>
                  </GradientCard>
                </Grid>

                <Grid item xs={12}>
                  <GradientCard sx={{ bgcolor: alpha(theme.palette.primary.main, 0.02) }}>
                    <CardContent>
                      <Box display="flex" justifyContent="space-between" alignItems="center">
                        <Box display="flex" alignItems="center" gap={2}>
                          <Avatar sx={{ bgcolor: theme.palette.primary.main }}>
                            <MonetizationOn />
                          </Avatar>
                          <Typography variant="h6" fontWeight="bold">
                            Order Summary
                          </Typography>
                        </Box>
                        <Box textAlign="right">
                          <Typography variant="body2">
                            Subtotal: ₹{parseFloat(selectedOrder.totalAmount || 0).toLocaleString()}
                          </Typography>
                          <Typography variant="body2">
                            Tax (18% GST): ₹{parseFloat(selectedOrder.taxAmount || 0).toLocaleString()}
                          </Typography>
                          <Typography variant="h5" fontWeight="bold" color="primary">
                            Final Amount: ₹{parseFloat(selectedOrder.TotalAmount || 0).toLocaleString()}
                          </Typography>
                        </Box>
                      </Box>
                    </CardContent>
                  </GradientCard>
                </Grid>
              </Grid>
            </Box>
          )}
        </DialogContent>
        
         <DialogActions sx={{ p: 3, justifyContent: 'center', gap: 1 }}>
           {/* WhatsApp Button */}
           {selectedOrder && (
             <WhatsAppButton
               task={{
                 POId: selectedOrder.POId || selectedOrder.OrderNumber,
                 DispatchUniqueId: selectedOrder.POId || selectedOrder.OrderNumber,
                 ClientCode: selectedOrder.ClientCode,
                 ClientName: selectedOrder.ClientName || selectedOrder.ClientCode,
                 Status: selectedOrder.Status || 'PENDING',
                 TotalAmount: selectedOrder.TotalAmount
               }}
               stageName="ORDER_BOOKING"
               status={selectedOrder.Status || 'NEW'}
               size="medium"
               variant="icon"
             />
           )}
           <AnimatedButton onClick={() => setViewDialogOpen(false)}>
             Close
           </AnimatedButton>
         </DialogActions>
      </Dialog>

    </Box>
  );
};

export default EnhancedClientOrderTakingSheet;
