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
  ViewList,
  ViewModule
} from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { useAuth } from '../../context/AuthContext';
import dispatchService from '../../services/dispatchService';
import sheetService from '../../services/sheetService';
import poService from '../../services/poService';
import { getAllClients } from '../../services/clientService';
import ManagementHeader from '../common/ManagementHeader';
import WhatsAppButton from '../common/WhatsAppButton';
import whatsappMessageService from '../../services/whatsappMessageService';
import config from '../../config/config';

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

// Status configuration
const dispatchStatuses = [
  { value: 'all', label: 'All Dispatches', icon: <ViewList />, color: 'default' },
  { value: 'dispatched', label: 'Dispatched', icon: <LocalShipping />, color: 'success' },
  { value: 'pending', label: 'Pending', icon: <Schedule />, color: 'warning' },
  { value: 'completed', label: 'Completed', icon: <CheckCircle />, color: 'info' }
];

// Priority configuration
const priorityConfig = {
  'Low': { color: '#4CAF50', icon: <Flag /> },
  'Medium': { color: '#FF9800', icon: <Flag /> },
  'High': { color: '#F44336', icon: <Flag /> },
  'Urgent': { color: '#9C27B0', icon: <Flag /> }
};

const DispatchManagement = () => {
  const theme = useTheme();
  const { user } = useAuth();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  
  // State management
  const [dispatchRecords, setDispatchRecords] = useState([]);
  const [pos, setPos] = useState([]);
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState(0);
  const [filterStatus, setFilterStatus] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState('table'); // 'table' or 'cards'
  
  // Filter states
  const [clientFilter, setClientFilter] = useState('');
  const [productFilter, setProductFilter] = useState('');
  const [dateRange, setDateRange] = useState({ start: null, end: null });
  const [priorityFilter, setPriorityFilter] = useState('');
  
  // Pagination
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  
  // Dialog states
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [selectedDispatch, setSelectedDispatch] = useState(null);
  const [filterDialogOpen, setFilterDialogOpen] = useState(false);
  
  // Snackbar
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  
  // Real-time tracking state
  const [lastUpdated, setLastUpdated] = useState(new Date());
  const [isRealTimeEnabled, setIsRealTimeEnabled] = useState(true);

  // Load data on component mount
  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    setLoading(true);
    setError(null);
    try {
      let dispatchData;
      try {
        dispatchData = await sheetService.getSheetData(config.sheets.dispatches);
      } catch (err) {
        dispatchData = await sheetService.getSheetData("Dispatches");
      }
      
      const [poData, clientData] = await Promise.all([
        poService.getAllPOs(),
        getAllClients()
      ]);
      setDispatchRecords(dispatchData);
      setPos(poData);
      setClients(clientData);
      setLastUpdated(new Date());
    } catch (err) {
      console.error('Error loading dispatch data:', err);
      console.error('Error details:', err.message);
      setError(err.message || 'Failed to load dispatch data');
    } finally {
      setLoading(false);
    }
  };

  // Filter dispatch records
  const filteredDispatches = useMemo(() => {
    let filtered = dispatchRecords;

    // Status filter
    if (filterStatus !== 'all') {
      filtered = filtered.filter(dispatch => {
        switch (filterStatus) {
          case 'dispatched':
            return dispatch.Dispatched === 'Yes';
          case 'pending':
            return dispatch.Dispatched === 'No' || !dispatch.Dispatched;
          case 'completed':
            return dispatch.Dispatched === 'Yes';
          default:
            return true;
        }
      });
    }

    // Client filter
    if (clientFilter) {
      filtered = filtered.filter(dispatch => 
        dispatch.ClientCode?.toLowerCase().includes(clientFilter.toLowerCase())
      );
    }

    // Product filter
    if (productFilter) {
      filtered = filtered.filter(dispatch => 
        dispatch.ProductCode?.toLowerCase().includes(productFilter.toLowerCase())
      );
    }

    // Search term
    if (searchTerm) {
      filtered = filtered.filter(dispatch => 
        dispatch.UniqueId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        dispatch.ClientCode?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        dispatch.ProductCode?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Add unique key to prevent React key conflicts
    return filtered.map((dispatch, index) => ({
      ...dispatch,
      _uniqueKey: `${dispatch.DispatchUniqueId}-${index}`
    }));
  }, [dispatchRecords, filterStatus, clientFilter, productFilter, searchTerm]);

  // Get unique clients and products for filters
  const uniqueClients = useMemo(() => {
    const clients = [...new Set(dispatchRecords.map(d => d.ClientCode))];
    return clients.filter(Boolean).sort();
  }, [dispatchRecords]);

  const uniqueProducts = useMemo(() => {
    const products = [...new Set(dispatchRecords.map(d => d.ProductCode))];
    return products.filter(Boolean).sort();
  }, [dispatchRecords]);

  // Calculate summary statistics
  const summaryStats = useMemo(() => {
    const total = dispatchRecords.length;
    const dispatched = dispatchRecords.filter(d => d.Dispatched === 'Yes').length;
    const pending = total - dispatched;
    const today = new Date().toISOString().split('T')[0];
    const todayDispatches = dispatchRecords.filter(d => d.DispatchDate === today).length;

    return {
      total,
      dispatched,
      pending,
      todayDispatches,
      completionRate: total > 0 ? Math.round((dispatched / total) * 100) : 0
    };
  }, [dispatchRecords]);

  const handleRefresh = () => {
    loadInitialData();
  };

  const handleViewDispatch = (dispatch) => {
    setSelectedDispatch(dispatch);
    setViewDialogOpen(true);
  };

  const handleCloseViewDialog = () => {
    setViewDialogOpen(false);
    setSelectedDispatch(null);
  };

  const handleFilterChange = (filterType, value) => {
    switch (filterType) {
      case 'status':
        setFilterStatus(value);
        break;
      case 'client':
        setClientFilter(value);
        break;
      case 'product':
        setProductFilter(value);
        break;
      case 'search':
        setSearchTerm(value);
        break;
      default:
        break;
    }
  };

  const clearFilters = () => {
    setFilterStatus('all');
    setClientFilter('');
    setProductFilter('');
    setSearchTerm('');
    setDateRange({ start: null, end: null });
    setPriorityFilter('');
  };

  const getStatusChip = (dispatch) => {
    if (dispatch.Dispatched === 'Yes') {
      return <StyledChip label="Dispatched" variant="success" size="small" />;
    }
    return <StyledChip label="Pending" variant="warning" size="small" />;
  };

  const getPriorityChip = (priority) => {
    const config = priorityConfig[priority] || priorityConfig['Medium'];
    return (
      <Chip
        label={priority}
        size="small"
        sx={{
          backgroundColor: config.color,
          color: 'white',
          fontWeight: 600
        }}
      />
    );
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
      label: 'Total Dispatches',
      icon: <LocalShipping />,
      color: theme.palette.primary.main
    },
    {
      value: summaryStats.dispatched,
      label: 'Dispatched',
      icon: <CheckCircle />,
      color: theme.palette.success.main
    },
    {
      value: summaryStats.pending,
      label: 'Pending',
      icon: <Schedule />,
      color: theme.palette.warning.main
    },
    {
      value: `${summaryStats.completionRate}%`,
      label: 'Completion Rate',
      icon: <TrendingUp />,
      color: theme.palette.info.main
    }
  ];

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      {/* Management Header */}
      <ManagementHeader
        title="Dispatch Management"
        subtitle="Advanced dispatch tracking with real-time analytics & comprehensive filtering"
        stats={headerStats}
        onRefresh={handleRefresh}
        onAddNew={() => {/* Navigate to dispatch form */}}
        addButtonText="New Dispatch"
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
            {/* Status Filter */}
            <Grid item xs={12} sm={6} md={3}>
              <FormControl fullWidth>
                <InputLabel>Status</InputLabel>
                <Select
                  value={filterStatus}
                  label="Status"
                  onChange={(e) => handleFilterChange('status', e.target.value)}
                >
                  {dispatchStatuses.map((status) => (
                    <MenuItem key={status.value} value={status.value}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        {status.icon}
                        {status.label}
                      </Box>
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            {/* Client Filter */}
            <Grid item xs={12} sm={6} md={3}>
              <Autocomplete
                options={uniqueClients}
                value={clientFilter}
                onChange={(event, newValue) => handleFilterChange('client', newValue || '')}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Client Code"
                    placeholder="Select client..."
                  />
                )}
              />
            </Grid>

            {/* Product Filter */}
            <Grid item xs={12} sm={6} md={3}>
              <Autocomplete
                options={uniqueProducts}
                value={productFilter}
                onChange={(event, newValue) => handleFilterChange('product', newValue || '')}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Product"
                    placeholder="Select product..."
                  />
                )}
              />
            </Grid>

            {/* Search */}
            <Grid item xs={12} sm={6} md={3}>
              <TextField
                fullWidth
                label="Search"
                placeholder="Search dispatches..."
                value={searchTerm}
                onChange={(e) => handleFilterChange('search', e.target.value)}
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

            <Box sx={{ display: 'flex', gap: 1 }}>
              <ToggleButtonGroup
                value={viewMode}
                exclusive
                onChange={(e, newMode) => newMode && setViewMode(newMode)}
                size="small"
              >
                <ToggleButton value="table">
                  <ViewList />
                </ToggleButton>
                <ToggleButton value="cards">
                  <ViewModule />
                </ToggleButton>
              </ToggleButtonGroup>
            </Box>
          </Box>
        </GlassmorphismCard>

        {/* Error Display */}
        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            <Typography variant="body1" sx={{ fontWeight: 600 }}>
              Error loading dispatch data:
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
              Dispatch Records ({filteredDispatches.length})
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Last updated: {lastUpdated.toLocaleTimeString()}
            </Typography>
          </Box>

          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', py: 4 }}>
              <CircularProgress size={60} />
              <Typography variant="body1" sx={{ ml: 2 }}>
                Loading dispatch data...
              </Typography>
            </Box>
          ) : filteredDispatches.length === 0 ? (
            <Alert severity="info" sx={{ textAlign: 'center', py: 4 }}>
              <Typography variant="h6" sx={{ mb: 1 }}>
                No dispatch records found
              </Typography>
              <Typography variant="body2">
                {error ? 'There was an error loading the data.' : 'No dispatch records match your current filters.'}
              </Typography>
              {!error && (
                <Button onClick={clearFilters} sx={{ mt: 2 }}>
                  Clear Filters
                </Button>
              )}
            </Alert>
          ) : viewMode === 'table' ? (
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Dispatch ID</TableCell>
                    <TableCell>SO Unique ID</TableCell>
                    <TableCell>Client Code</TableCell>
                    <TableCell>Product</TableCell>
                    <TableCell>Batch</TableCell>
                    <TableCell>Dispatch Date</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredDispatches
                    .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                    .map((dispatch) => (
                      <TableRow key={dispatch._uniqueKey || dispatch.DispatchUniqueId || dispatch.UniqueId} hover>
                        <TableCell>
                          <Chip
                            label={dispatch.DispatchUniqueId || 'N/A'}
                            size="small"
                            sx={{
                              backgroundColor: '#e8f5e9',
                              color: '#2e7d32',
                              fontWeight: 600,
                              fontFamily: 'monospace',
                              fontSize: '0.75rem'
                            }}
                          />
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" sx={{ fontWeight: 500 }}>
                            {dispatch.UniqueId}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={dispatch.ClientCode}
                            size="small"
                            color="primary"
                            variant="outlined"
                          />
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" sx={{ fontWeight: 500 }}>
                            {dispatch.ProductCode}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.25 }}>
                            <Typography 
                              variant="body2" 
                              sx={{ 
                                color: '#f57c00',
                                fontWeight: 600,
                                fontSize: '0.7rem'
                              }}
                            >
                              Batch #{dispatch.BatchNumber || '1'}
                            </Typography>
                            <Typography 
                              variant="caption" 
                              sx={{ 
                                color: '#546e7a',
                                fontSize: '0.65rem'
                              }}
                            >
                              {(() => {
                                const batchSize = parseFloat(dispatch.BatchSize || 0);
                                return batchSize > 0 ? batchSize.toLocaleString() : '0';
                              })()} pcs
                            </Typography>
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">
                            {dispatch.DispatchDate}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          {getStatusChip(dispatch)}
                        </TableCell>
                        <TableCell>
                          <Box sx={{ display: 'flex', gap: 0.5, alignItems: 'center' }}>
                            {/* WhatsApp Button */}
                            <WhatsAppButton
                              task={{
                                POId: dispatch.POId || dispatch.DispatchUniqueId,
                                DispatchUniqueId: dispatch.DispatchUniqueId,
                                ClientCode: dispatch.ClientCode,
                                ClientName: dispatch.ClientCode,
                                Status: dispatch.DispatchStatus || dispatch.Dispatched || 'PENDING',
                                DispatchDate: dispatch.DispatchDate
                              }}
                              stageName="DISPATCH"
                              status={dispatch.DispatchStatus === 'COMPLETED' || dispatch.Dispatched === 'Yes' ? 'COMPLETED' : 'NEW'}
                              size="small"
                              variant="icon"
                            />
                            <IconButton
                              size="small"
                              onClick={() => handleViewDispatch(dispatch)}
                            >
                              <Visibility />
                            </IconButton>
                          </Box>
                        </TableCell>
                      </TableRow>
                    ))}
                </TableBody>
              </Table>
            </TableContainer>
          ) : (
            <Grid container spacing={3}>
              {filteredDispatches
                .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                .map((dispatch) => (
                  <Grid item xs={12} sm={6} md={4} key={dispatch._uniqueKey || dispatch.DispatchUniqueId || dispatch.UniqueId}>
                    <AnimatedCard sx={{ p: 2 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                        <Box>
                          <Chip
                            label={dispatch.DispatchUniqueId || 'N/A'}
                            size="small"
                            sx={{
                              backgroundColor: '#e8f5e9',
                              color: '#2e7d32',
                              fontWeight: 600,
                              fontFamily: 'monospace',
                              fontSize: '0.7rem',
                              mb: 1
                            }}
                          />
                          <Typography variant="h6" sx={{ fontWeight: 600 }}>
                            {dispatch.UniqueId}
                          </Typography>
                        </Box>
                        {getStatusChip(dispatch)}
                      </Box>
                      
                      <Box sx={{ mb: 2 }}>
                        <Typography variant="body2" color="text.secondary" gutterBottom>
                          Client: <strong>{dispatch.ClientCode}</strong>
                        </Typography>
                        <Typography variant="body2" color="text.secondary" gutterBottom>
                          Product: <strong>{dispatch.ProductCode}</strong>
                        </Typography>
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.25 }}>
                          <Typography 
                            variant="body2" 
                            sx={{ 
                              color: '#f57c00',
                              fontWeight: 600,
                              fontSize: '0.7rem'
                            }}
                          >
                            Batch #{dispatch.BatchNumber || '1'}
                          </Typography>
                          <Typography 
                            variant="caption" 
                            sx={{ 
                              color: '#546e7a',
                              fontSize: '0.65rem'
                            }}
                          >
                            {(() => {
                              const batchSize = parseFloat(dispatch.BatchSize || 0);
                              return batchSize > 0 ? batchSize.toLocaleString() : '0';
                            })()} pcs
                          </Typography>
                        </Box>
                        <Typography variant="body2" color="text.secondary">
                          Date: <strong>{dispatch.DispatchDate}</strong>
                        </Typography>
                      </Box>

                      <Button
                        fullWidth
                        variant="outlined"
                        startIcon={<Visibility />}
                        onClick={() => handleViewDispatch(dispatch)}
                        sx={{ borderRadius: '12px' }}
                      >
                        View Details
                      </Button>
                    </AnimatedCard>
                  </Grid>
                ))}
            </Grid>
          )}

          {/* Pagination */}
          <TablePagination
            component="div"
            count={filteredDispatches.length}
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

        {/* View Dispatch Dialog */}
        <Dialog
          open={viewDialogOpen}
          onClose={handleCloseViewDialog}
          maxWidth="md"
          fullWidth
        >
          <DialogTitle>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography variant="h6">Dispatch Details</Typography>
              <IconButton onClick={handleCloseViewDialog}>
                <Close />
              </IconButton>
            </Box>
          </DialogTitle>
          <DialogContent>
            {selectedDispatch && (
              <Grid container spacing={3}>
                <Grid item xs={12}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Dispatch ID
                  </Typography>
                  <Chip
                    label={selectedDispatch.DispatchUniqueId || 'N/A'}
                    sx={{
                      backgroundColor: '#e8f5e9',
                      color: '#2e7d32',
                      fontWeight: 600,
                      fontFamily: 'monospace',
                      fontSize: '0.875rem',
                      mb: 2
                    }}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2" color="text.secondary">
                    SO Unique ID
                  </Typography>
                  <Typography variant="body1" sx={{ mb: 2 }}>
                    {selectedDispatch.UniqueId}
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Client Code
                  </Typography>
                  <Typography variant="body1" sx={{ mb: 2 }}>
                    {selectedDispatch.ClientCode}
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Product Code
                  </Typography>
                  <Typography variant="body1" sx={{ mb: 2 }}>
                    {selectedDispatch.ProductCode}
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Batch
                  </Typography>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.25, mb: 2 }}>
                    <Typography 
                      variant="body2" 
                      sx={{ 
                        color: '#f57c00',
                        fontWeight: 600,
                        fontSize: '0.7rem'
                      }}
                    >
                      Batch #{selectedDispatch.BatchNumber || '1'}
                    </Typography>
                    <Typography 
                      variant="caption" 
                      sx={{ 
                        color: '#546e7a',
                        fontSize: '0.65rem'
                      }}
                    >
                      {(() => {
                        const batchSize = parseFloat(selectedDispatch.BatchSize || 0);
                        return batchSize > 0 ? batchSize.toLocaleString() : '0';
                      })()} pcs
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Dispatch Date
                  </Typography>
                  <Typography variant="body1" sx={{ mb: 2 }}>
                    {selectedDispatch.DispatchDate}
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Status
                  </Typography>
                  <Box sx={{ mb: 2 }}>
                    {getStatusChip(selectedDispatch)}
                  </Box>
                </Grid>
                <Grid item xs={12}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Created At
                  </Typography>
                  <Typography variant="body1">
                    {selectedDispatch.CreatedAt}
                  </Typography>
                </Grid>
              </Grid>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseViewDialog}>Close</Button>
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

export default DispatchManagement;
