import React, { useState, useEffect } from 'react';
import {
  Paper,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Box,
  CircularProgress,
  Alert,
  Button,
  IconButton,
  Tooltip,
  Pagination,
  useTheme,
  alpha,
  Fade,
  Grow,
  Slide,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Select,
  MenuItem,
  FormControl
} from '@mui/material';
import {
  Refresh,
  Description,
  CheckCircle,
  Error as ErrorIcon,
  WarningAmber,
  Assignment,
  ShoppingCart,
  TrendingUp,
  AutoAwesome,
  Edit,
  Delete,
  Visibility
} from '@mui/icons-material';
import { format } from 'date-fns';
import { useNavigate } from 'react-router-dom';
import poService from '../../services/poService';
import SalesOrderEditForm from './SalesOrderEditForm';
import WhatsAppButton from '../common/WhatsAppButton';

const SalesOrderList = ({ refreshTrigger }) => {
  const theme = useTheme();
  const navigate = useNavigate();
  const [salesOrders, setSalesOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  // Time filter by CreatedAt: '24h' | '7d' | '30d' | 'all'
  const [timeRange, setTimeRange] = useState('24h');

  // Load Sales Orders from Google Sheets
  const fetchSalesOrders = async (forceRefresh = false) => {
    setLoading(true);
    setError(null);

    try {

      // Add a small delay for forced refresh to ensure Google Sheets has updated
      if (forceRefresh) {
        await new Promise(resolve => setTimeout(resolve, 500));
      }
      
      const data = await poService.getAllPOs();
      // Log the status of each order for debugging
      data.forEach(order => {
        
      });
      
      // Log all PO IDs for debugging

      setSalesOrders(data);
    } catch (err) {
      console.error('Error fetching SOs:', err);
      setError(err.message || 'Failed to load Sales Orders');
    } finally {
      setLoading(false);
    }
  };

  // Fetch Sales Orders on component mount
  useEffect(() => {
    fetchSalesOrders();
  }, []);

  // Refresh data when refreshTrigger changes
  useEffect(() => {
    if (refreshTrigger) {
      fetchSalesOrders(true); // Force refresh
    }
  }, [refreshTrigger]);

  // Refresh data when component becomes visible (e.g., returning from dispatch)
  useEffect(() => {
    const handleFocus = () => {
      fetchSalesOrders(true); // Force refresh
    };

    const handleVisibilityChange = () => {
      if (!document.hidden) {
        fetchSalesOrders(true); // Force refresh
      }
    };

    const handlePopstate = () => {
      // Add a small delay to ensure the page has fully loaded
      setTimeout(() => {
        fetchSalesOrders(true); // Force refresh
      }, 500);
    };

    // Listen for window focus, visibility changes, and navigation
    window.addEventListener('focus', handleFocus);
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('popstate', handlePopstate);

    // Cleanup listeners
    return () => {
      window.removeEventListener('focus', handleFocus);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('popstate', handlePopstate);
    };
  }, []);

  // Force refresh when component mounts (in case coming back from dispatch)
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchSalesOrders(true); // Force refresh
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  // Additional refresh on page load to catch any missed updates
  useEffect(() => {
    const handlePageLoad = () => {
      fetchSalesOrders(true); // Force refresh
    };

    window.addEventListener('load', handlePageLoad);
    return () => window.removeEventListener('load', handlePageLoad);
  }, []);

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  // Handle action buttons
  const handleView = (order) => {
    setSelectedOrder(order);
    setViewDialogOpen(true);
  };

  const handleEdit = (order) => {
    // Prevent editing if order is in DISPATCH or DELIVERED status
    if (order.Status === 'DISPATCH' || order.Status === 'DELIVERED') {
      setError(`Cannot edit order. Order is in ${order.Status} status and cannot be modified.`);
      return;
    }
    setSelectedOrder(order);
    setEditDialogOpen(true);
  };

  const handleDelete = (order) => {
    setSelectedOrder(order);
    setDeleteDialogOpen(true);
  };

  const handleDispatch = (order) => {
    // Check if order status is already DISPATCH
    if (order.Status === 'DISPATCH') {
      setError('This order is already in DISPATCH status and cannot be moved to dispatch again.');
      return;
    }
    
    // Store the item data in session storage for dispatch page
    sessionStorage.setItem('itemForDispatch', JSON.stringify(order));
    // Navigate to dispatch page
    navigate('/dispatch');
  };

  const handleEditDialogClose = () => {
    setEditDialogOpen(false);
    setSelectedOrder(null);
  };

  const handleEditSave = (updatedOrder) => {
    // Update the local state with the updated order
    setSalesOrders(prev => 
      prev.map(order => {
        const orderId = order.POId || order.SOId;
        const updatedOrderId = updatedOrder.POId || updatedOrder.SOId;
        return orderId === updatedOrderId ? updatedOrder : order;
      })
    );
    // Refresh the list to ensure we have the latest data
    fetchSalesOrders();
  };

  const handleDeleteDialogClose = () => {
    setDeleteDialogOpen(false);
    setSelectedOrder(null);
  };

  const handleViewDialogClose = () => {
    setViewDialogOpen(false);
    setSelectedOrder(null);
  };

  const confirmDelete = async () => {
    if (selectedOrder) {
      try {
        setLoading(true);
        setError(null); // Clear any previous errors
        const orderId = selectedOrder.POId || selectedOrder.SOId;
        const result = await poService.deletePO(orderId);
        // Remove from local state
        setSalesOrders(prev => {
          const selectedOrderId = selectedOrder.POId || selectedOrder.SOId;
          const filtered = prev.filter(order => {
            const orderId = order.POId || order.SOId;
            return orderId !== selectedOrderId;
          });
          return filtered;
        });
        
        setDeleteDialogOpen(false);
        setSelectedOrder(null);
        
        // Show success message
        const deletedCount = result.deletedRows || 1;

        // Refresh the list to ensure we have the latest data
        await fetchSalesOrders(true);
        
      } catch (err) {
        console.error('Error deleting order:', err);
        console.error('Error stack:', err.stack);
        setError(err.message || 'Failed to delete order');
      } finally {
        setLoading(false);
      }
    } else {
      console.error('No selected order found for deletion');
      setError('No order selected for deletion');
    }
  };

  // Get chip color based on status
  const getStatusChip = (status) => {
    let icon = null;
    let color = 'default';

    switch (status) {
      case 'NEW':
        color = 'primary';
        icon = <Assignment />;
        break;
      case 'STORE1':
      case 'CABLE_PRODUCTION':
      case 'STORE2':
      case 'MOULDING':
      case 'FG_SECTION':
        color = 'warning';
        icon = <WarningAmber />;
        break;
      case 'DISPATCH':
        color = 'info';
        icon = <TrendingUp />;
        break;
      case 'DELIVERED':
        color = 'success';
        icon = <CheckCircle />;
        break;
      case 'REJECTED':
        color = 'error';
        icon = <ErrorIcon />;
        break;
      default:
        color = 'default';
    }

    return (
      <Chip
        label={status}
        icon={icon}
        size="small"
        color={color}
        sx={{ 
          minWidth: 100,
          fontWeight: 600,
          fontSize: '0.75rem',
          borderRadius: 2,
          '& .MuiChip-icon': {
            fontSize: 16
          }
        }}
      />
    );
  };

  // Format date string
  const formatDate = (dateString) => {
    if (!dateString) return '-';
    try {
      return format(new Date(dateString), 'dd MMM yyyy, HH:mm');
    } catch (e) {
      return dateString;
    }
  };

  if (loading && salesOrders.length === 0) {
    return (
      <Fade in timeout={600}>
        <Paper 
          elevation={0}
          sx={{ 
            p: 6, 
            textAlign: 'center',
            border: `1px solid ${alpha(theme.palette.primary.main, 0.15)}`,
            borderRadius: 3,
            backgroundColor: alpha(theme.palette.primary.main, 0.02),
            transition: 'all 0.3s ease'
          }}
        >
          <CircularProgress sx={{ color: 'primary.main' }} />
          <Typography 
            variant="body1" 
            sx={{ 
              mt: 2,
              color: 'text.secondary',
              fontWeight: 500
            }}
          >
            Loading Sales Orders...
          </Typography>
        </Paper>
      </Fade>
    );
  }

  if (error && salesOrders.length === 0) {
    return (
      <Paper 
        elevation={0}
        sx={{ 
          p: 4,
          border: '1px solid #e3f2fd',
          borderRadius: 3
        }}
      >
        <Alert 
          severity="error" 
          action={
            <Button 
              color="inherit" 
              size="small" 
              onClick={fetchSalesOrders}
              sx={{
                color: '#d32f2f',
                '&:hover': { backgroundColor: '#ffebee' }
              }}
            >
              Retry
            </Button>
          }
          sx={{ 
            borderRadius: 2,
            '& .MuiAlert-icon': { color: '#d32f2f' }
          }}
        >
          {error}
        </Alert>
      </Paper>
    );
  }

  return (
    <Box>
      <Grow in timeout={800}>
        <Paper 
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
          {/* Header */}
          <Box 
            sx={{ 
              p: 3, 
              backgroundColor: alpha(theme.palette.primary.main, 0.02),
              borderBottom: `1px solid ${alpha(theme.palette.primary.main, 0.08)}`,
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center'
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 3 }}>
              <Box sx={{ 
                p: 1.5, 
                borderRadius: 2,
                backgroundColor: alpha(theme.palette.primary.main, 0.04),
                color: 'primary.main'
              }}>
                <ShoppingCart sx={{ fontSize: 24 }} />
              </Box>
              <Box>
                  <Typography 
                    variant="h5" 
                    sx={{ 
                      color: 'primary.main',
                      fontWeight: 600,
                      mb: 0.5
                    }}
                  >
                    Sales Orders
                  </Typography>
                <Typography 
                  variant="body2" 
                  sx={{ 
                    color: 'text.secondary'
                  }}
                >
                  {salesOrders.length} total sales orders
                </Typography>
              </Box>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              {/* Time Range Filter */}
              <Box sx={{
                bgcolor: alpha(theme.palette.background.paper, 0.8),
                borderRadius: 2,
                display: 'flex',
                overflow: 'hidden',
                border: `1px solid ${alpha(theme.palette.primary.main, 0.15)}`,
                mr: 1
              }}>
                {[
                  { key: '24h', label: '24h' },
                  { key: '7d', label: '7d' },
                  { key: '30d', label: '30d' },
                  { key: 'all', label: 'All' }
                ].map(opt => (
                  <Box
                    key={opt.key}
                    onClick={() => setTimeRange(opt.key)}
                    sx={{
                      px: 1.25,
                      py: 0.5,
                      cursor: 'pointer',
                      fontSize: 12,
                      fontWeight: 700,
                      color: timeRange === opt.key ? 'primary.contrastText' : 'primary.main',
                      bgcolor: timeRange === opt.key ? 'primary.main' : 'transparent',
                      '&:hover': { bgcolor: timeRange === opt.key ? 'primary.dark' : alpha(theme.palette.primary.main, 0.08) }
                    }}
                  >
                    {opt.label}
                  </Box>
                ))}
              </Box>
              <Box sx={{ px: 1, py: 0.5, color: 'text.secondary', fontSize: 12, fontWeight: 600 }}>
                {timeRange === 'all' ? 'All time' : (
                  (() => {
                    const now = new Date();
                    const formatted = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-${String(now.getDate()).padStart(2,'0')} ${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}`;
                    if (timeRange === '24h') return `Last 24h from ${formatted}`;
                    if (timeRange === '7d') return `Last 7d from ${formatted}`;
                    return `Last 30d from ${formatted}`;
                  })()
                )}
              </Box>
              <Button 
              startIcon={<Refresh />} 
              onClick={() => fetchSalesOrders(true)}
              disabled={loading}
              variant="outlined"
              sx={{
                borderColor: 'primary.main',
                color: 'primary.main',
                borderRadius: 2,
                '&:hover': {
                  borderColor: 'primary.dark',
                  backgroundColor: alpha(theme.palette.primary.main, 0.02)
                },
                '&:disabled': {
                  borderColor: alpha(theme.palette.action.disabled, 0.12),
                  color: 'action.disabled'
                }
              }}
            >
              {loading ? 'Refreshing...' : 'Refresh'}
              </Button>
            </Box>
          </Box>

          {loading && (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 3 }}>
              <CircularProgress size={24} sx={{ color: 'primary.main' }} />
            </Box>
          )}

          {salesOrders.length === 0 ? (
            <Box sx={{ p: 4, textAlign: 'center' }}>
              <Fade in timeout={800}>
                <Alert 
                  severity="info"
                  sx={{ 
                    borderRadius: 2,
                    border: `1px solid ${alpha(theme.palette.info.main, 0.15)}`,
                    backgroundColor: alpha(theme.palette.info.main, 0.02)
                  }}
                  variant="outlined"
                >
                  No Sales Orders found. Create your first Sales Order using the form above.
                </Alert>
              </Fade>
            </Box>
          ) : (
            <>
              <TableContainer>
                <Table size="medium">
                  <TableHead>
                    <TableRow sx={{ backgroundColor: alpha(theme.palette.primary.main, 0.02) }}>
                      <TableCell sx={{ fontWeight: 700, color: 'primary.main', fontSize: '0.875rem' }}>Unique ID</TableCell>
                      <TableCell sx={{ fontWeight: 700, color: 'primary.main', fontSize: '0.875rem' }}>SO ID</TableCell>
                      <TableCell sx={{ fontWeight: 700, color: 'primary.main', fontSize: '0.875rem' }}>Product Name</TableCell>
                      <TableCell sx={{ fontWeight: 700, color: 'primary.main', fontSize: '0.875rem' }}>Client Code</TableCell>
                      <TableCell sx={{ fontWeight: 700, color: 'primary.main', fontSize: '0.875rem' }}>Product Code</TableCell>
                      <TableCell sx={{ fontWeight: 700, color: 'primary.main', fontSize: '0.875rem' }} align="right">Quantity</TableCell>
                      <TableCell sx={{ fontWeight: 700, color: 'primary.main', fontSize: '0.875rem' }}>Status</TableCell>
                      <TableCell sx={{ fontWeight: 700, color: 'primary.main', fontSize: '0.875rem' }}>Created</TableCell>
                      <TableCell sx={{ fontWeight: 700, color: 'primary.main', fontSize: '0.875rem' }}>Document</TableCell>
                      <TableCell sx={{ fontWeight: 700, color: 'primary.main', fontSize: '0.875rem' }}>Actions</TableCell>
                    </TableRow>
                  </TableHead>
              <TableBody>
                {salesOrders
                  .filter(po => {
                    if (timeRange === 'all') return true;
                    const created = po.CreatedAt;
                    if (!created) return false;
                    const now = new Date();
                    const windowMs = timeRange === '24h' ? 24*60*60*1000 : timeRange === '7d' ? 7*24*60*60*1000 : 30*24*60*60*1000;
                    const cutoff = new Date(now.getTime() - windowMs);
                    const dt = new Date(created);
                    return !isNaN(dt) && dt >= cutoff;
                  })
                  .sort((a, b) => {
                    // Sort by CreatedAt descending (newest first)
                    const dateA = a.CreatedAt ? new Date(a.CreatedAt).getTime() : 0;
                    const dateB = b.CreatedAt ? new Date(b.CreatedAt).getTime() : 0;
                    return dateB - dateA; // Descending order (newest first)
                  })
                  .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                  .map((po) => (
                    <TableRow 
                      key={po.UniqueId || po.SOId}
                      sx={{ 
                        '&:hover': { 
                          backgroundColor: alpha(theme.palette.primary.main, 0.02),
                          transition: 'all 0.3s ease',
                          transform: 'translateY(-1px)',
                          boxShadow: theme.shadows[1]
                        },
                        '&:nth-of-type(even)': {
                          backgroundColor: alpha(theme.palette.action.hover, 0.02)
                        }
                      }}
                    >
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
                          {po.UniqueId || 'N/A'}
                        </Box>
                      </TableCell>
                      <TableCell sx={{ fontWeight: 600, color: 'text.primary' }}>
                        {po.POId || po.SOId}
                      </TableCell>
                      <TableCell sx={{ color: 'text.primary' }}>
                        {po.Name}
                      </TableCell>
                      <TableCell>
                        <Box
                          sx={{
                            px: 2,
                            py: 0.5,
                            backgroundColor: alpha(theme.palette.primary.main, 0.04),
                            color: 'primary.main',
                            borderRadius: 2,
                            fontSize: '0.75rem',
                            fontWeight: 600,
                            display: 'inline-block'
                          }}
                        >
                          {po.ClientCode}
                        </Box>
                      </TableCell>
                      <TableCell sx={{ color: 'text.primary' }}>
                        {po.ProductCode}
                      </TableCell>
                      <TableCell align="right" sx={{ fontWeight: 600, color: 'text.primary' }}>
                        {po.Quantity}
                      </TableCell>
                      <TableCell>
                        {getStatusChip(po.Status)}
                      </TableCell>
                      <TableCell sx={{ color: 'text.secondary', fontSize: '0.875rem' }}>
                        {formatDate(po.CreatedAt)}
                      </TableCell>
                      <TableCell>
                        {(po.PODocumentId || po.SODocumentId) ? (
                          <Tooltip title="View Document">
                            <IconButton 
                              size="small" 
                              onClick={() => window.open(`https://drive.google.com/file/d/${po.PODocumentId || po.SODocumentId}/view`, '_blank')}
                              sx={{
                                color: 'primary.main',
                                borderRadius: 2,
                                '&:hover': { 
                                  backgroundColor: alpha(theme.palette.primary.main, 0.04),
                                  transform: 'scale(1.1)',
                                  transition: 'all 0.2s ease'
                                }
                              }}
                            >
                              <Description fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        ) : (
                          <Typography 
                            variant="caption" 
                            sx={{ 
                              color: 'text.disabled',
                              fontStyle: 'italic'
                            }}
                          >
                            None
                          </Typography>
                        )}
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', gap: 0.5 }}>
                          {/* WhatsApp Button */}
                          <WhatsAppButton
                            task={{
                              POId: po.POId || po.SalesOrderNumber,
                              DispatchUniqueId: po.POId || po.SalesOrderNumber,
                              ClientCode: po.ClientCode,
                              ClientName: po.ClientCode,
                              Status: po.Status || 'PENDING',
                              OrderDate: po.CreatedAt
                            }}
                            stageName={po.Status === 'DISPATCH' ? 'DISPATCH' : po.Status === 'DELIVERED' ? 'DELIVERED' : 'ORDER_BOOKING'}
                            status={po.Status || 'NEW'}
                            size="small"
                            variant="icon"
                          />
                          <Tooltip title="View Details">
                            <IconButton 
                              size="small" 
                              onClick={() => handleView(po)}
                              sx={{
                                color: 'info.main',
                                borderRadius: 2,
                                '&:hover': { 
                                  backgroundColor: alpha(theme.palette.info.main, 0.04),
                                  transform: 'scale(1.1)',
                                  transition: 'all 0.2s ease'
                                }
                              }}
                            >
                              <Visibility fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title={
                            po.Status === 'DISPATCH' || po.Status === 'DELIVERED' 
                              ? `Cannot edit order in ${po.Status} status` 
                              : 'Edit Order'
                          }>
                            <span>
                              <IconButton 
                                size="small" 
                                onClick={() => handleEdit(po)}
                                disabled={po.Status === 'DISPATCH' || po.Status === 'DELIVERED'}
                                sx={{
                                  color: (po.Status === 'DISPATCH' || po.Status === 'DELIVERED') 
                                    ? 'text.disabled' 
                                    : 'primary.main',
                                  borderRadius: 2,
                                  '&:hover': { 
                                    backgroundColor: (po.Status === 'DISPATCH' || po.Status === 'DELIVERED')
                                      ? 'transparent'
                                      : alpha(theme.palette.primary.main, 0.04),
                                    transform: (po.Status === 'DISPATCH' || po.Status === 'DELIVERED')
                                      ? 'none'
                                      : 'scale(1.1)',
                                    transition: 'all 0.2s ease'
                                  },
                                  '&:disabled': {
                                    color: 'text.disabled',
                                    cursor: 'not-allowed'
                                  }
                                }}
                              >
                                <Edit fontSize="small" />
                              </IconButton>
                            </span>
                          </Tooltip>
                          <Tooltip title={po.Status === 'DISPATCH' ? 'Already in Dispatch Status' : 'Move to Dispatch'}>
                            <span>
                              <IconButton 
                                size="small" 
                                onClick={() => handleDispatch(po)}
                                disabled={po.Status === 'DISPATCH'}
                                sx={{
                                  color: po.Status === 'DISPATCH' ? 'text.disabled' : '#2e7d32',
                                  borderRadius: 2,
                                  '&:hover': { 
                                    backgroundColor: po.Status === 'DISPATCH' ? 'transparent' : alpha('#2e7d32', 0.04),
                                    transform: po.Status === 'DISPATCH' ? 'none' : 'scale(1.1)',
                                    transition: 'all 0.2s ease'
                                  },
                                  '&:disabled': {
                                    color: 'text.disabled',
                                    cursor: 'not-allowed'
                                  }
                                }}
                              >
                                <TrendingUp fontSize="small" />
                              </IconButton>
                            </span>
                          </Tooltip>
                          <Tooltip title="Delete Order">
                            <IconButton 
                              size="small" 
                              onClick={() => handleDelete(po)}
                              sx={{
                                color: 'error.main',
                                borderRadius: 2,
                                '&:hover': { 
                                  backgroundColor: alpha(theme.palette.error.main, 0.04),
                                  transform: 'scale(1.1)',
                                  transition: 'all 0.2s ease'
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
          
          {salesOrders.length > 0 && (
            <Box sx={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center',
              p: 2,
              borderTop: `1px solid ${alpha(theme.palette.primary.main, 0.08)}`,
              backgroundColor: alpha(theme.palette.primary.main, 0.02)
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
                        borderColor: alpha(theme.palette.primary.main, 0.3),
                      },
                      '&:hover .MuiOutlinedInput-notchedOutline': {
                        borderColor: alpha(theme.palette.primary.main, 0.5),
                      },
                      '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                        borderColor: theme.palette.primary.main,
                      }
                    }}
                  >
                    <MenuItem value={5}>5</MenuItem>
                    <MenuItem value={10}>10</MenuItem>
                    <MenuItem value={25}>25</MenuItem>
                  </Select>
                </FormControl>
              </Box>

              <Box sx={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                <Typography variant="body2" sx={{ color: '#6c757d', fontWeight: 500 }}>
                  {page * rowsPerPage + 1}-{Math.min((page + 1) * rowsPerPage, salesOrders.filter(po => {
                    if (timeRange === 'all') return true;
                    const created = po.CreatedAt; if (!created) return false; const now = new Date(); const windowMs = timeRange === '24h' ? 24*60*60*1000 : timeRange === '7d' ? 7*24*60*60*1000 : 30*24*60*60*1000; const cutoff = new Date(now.getTime() - windowMs); const dt = new Date(created); return !isNaN(dt) && dt >= cutoff;
                  }).length)} of {salesOrders.filter(po => {
                    if (timeRange === 'all') return true;
                    const created = po.CreatedAt; if (!created) return false; const now = new Date(); const windowMs = timeRange === '24h' ? 24*60*60*1000 : timeRange === '7d' ? 7*24*60*60*1000 : 30*24*60*60*1000; const cutoff = new Date(now.getTime() - windowMs); const dt = new Date(created); return !isNaN(dt) && dt >= cutoff;
                  }).length} orders
                </Typography>
                
                {Math.ceil(salesOrders.filter(po => {
                  if (timeRange === 'all') return true;
                  const created = po.CreatedAt; if (!created) return false; const now = new Date(); const windowMs = timeRange === '24h' ? 24*60*60*1000 : timeRange === '7d' ? 7*24*60*60*1000 : 30*24*60*60*1000; const cutoff = new Date(now.getTime() - windowMs); const dt = new Date(created); return !isNaN(dt) && dt >= cutoff;
                }).length / rowsPerPage) > 1 && (
                  <Pagination
                    count={Math.ceil(salesOrders.filter(po => {
                      if (timeRange === 'all') return true;
                      const created = po.CreatedAt; if (!created) return false; const now = new Date(); const windowMs = timeRange === '24h' ? 24*60*60*1000 : timeRange === '7d' ? 7*24*60*60*1000 : 30*24*60*60*1000; const cutoff = new Date(now.getTime() - windowMs); const dt = new Date(created); return !isNaN(dt) && dt >= cutoff;
                    }).length / rowsPerPage)}
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
        </>
      )}
        </Paper>
      </Grow>

      {/* Edit Dialog */}
      <SalesOrderEditForm
        open={editDialogOpen}
        onClose={handleEditDialogClose}
        salesOrder={selectedOrder}
        onSave={handleEditSave}
      />

      {/* View Details Dialog */}
      <Dialog 
        open={viewDialogOpen} 
        onClose={handleViewDialogClose}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle sx={{ 
          backgroundColor: alpha(theme.palette.primary.main, 0.04),
          borderBottom: `1px solid ${alpha(theme.palette.primary.main, 0.08)}`,
          display: 'flex',
          alignItems: 'center',
          gap: 1
        }}>
          <Visibility sx={{ color: 'primary.main' }} />
          <Typography variant="h6" sx={{ fontWeight: 600, color: 'primary.main' }}>
            Sales Order Details
          </Typography>
        </DialogTitle>
        <DialogContent sx={{ mt: 2 }}>
          {selectedOrder && (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {/* Order Information */}
              <Paper 
                elevation={0} 
                sx={{ 
                  p: 2, 
                  border: `1px solid ${alpha(theme.palette.primary.main, 0.08)}`,
                  borderRadius: 2
                }}
              >
                <Typography variant="subtitle2" sx={{ color: 'primary.main', fontWeight: 600, mb: 1 }}>
                  Order Information
                </Typography>
                <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1.5 }}>
                  <Box>
                    <Typography variant="caption" sx={{ color: 'text.secondary' }}>Unique ID</Typography>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>{selectedOrder.UniqueId || 'N/A'}</Typography>
                  </Box>
                  <Box>
                    <Typography variant="caption" sx={{ color: 'text.secondary' }}>SO ID</Typography>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>{selectedOrder.POId || selectedOrder.SOId}</Typography>
                  </Box>
                  <Box>
                    <Typography variant="caption" sx={{ color: 'text.secondary' }}>Name</Typography>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>{selectedOrder.Name}</Typography>
                  </Box>
                  <Box>
                    <Typography variant="caption" sx={{ color: 'text.secondary' }}>Status</Typography>
                    <Box sx={{ mt: 0.5 }}>
                      {getStatusChip(selectedOrder.Status)}
                    </Box>
                  </Box>
                </Box>
              </Paper>

              {/* Client & Product Information */}
              <Paper 
                elevation={0} 
                sx={{ 
                  p: 2, 
                  border: `1px solid ${alpha(theme.palette.primary.main, 0.08)}`,
                  borderRadius: 2
                }}
              >
                <Typography variant="subtitle2" sx={{ color: 'primary.main', fontWeight: 600, mb: 1 }}>
                  Client & Product Information
                </Typography>
                <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1.5 }}>
                  <Box>
                    <Typography variant="caption" sx={{ color: 'text.secondary' }}>Client Code</Typography>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>{selectedOrder.ClientCode}</Typography>
                  </Box>
                  <Box>
                    <Typography variant="caption" sx={{ color: 'text.secondary' }}>Product Code</Typography>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>{selectedOrder.ProductCode}</Typography>
                  </Box>
                  <Box>
                    <Typography variant="caption" sx={{ color: 'text.secondary' }}>Product Description</Typography>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>{selectedOrder.ProductDesc || 'N/A'}</Typography>
                  </Box>
                  <Box>
                    <Typography variant="caption" sx={{ color: 'text.secondary' }}>Quantity</Typography>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>{selectedOrder.Quantity}</Typography>
                  </Box>
                </Box>
              </Paper>

              {/* Additional Details */}
              <Paper 
                elevation={0} 
                sx={{ 
                  p: 2, 
                  border: `1px solid ${alpha(theme.palette.primary.main, 0.08)}`,
                  borderRadius: 2
                }}
              >
                <Typography variant="subtitle2" sx={{ color: 'primary.main', fontWeight: 600, mb: 1 }}>
                  Additional Details
                </Typography>
                <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1.5 }}>
                  <Box>
                    <Typography variant="caption" sx={{ color: 'text.secondary' }}>Created At</Typography>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>{formatDate(selectedOrder.CreatedAt)}</Typography>
                  </Box>
                  <Box>
                    <Typography variant="caption" sx={{ color: 'text.secondary' }}>Created By</Typography>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>{selectedOrder.CreatedBy || 'N/A'}</Typography>
                  </Box>
                  <Box>
                    <Typography variant="caption" sx={{ color: 'text.secondary' }}>Updated At</Typography>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>{formatDate(selectedOrder.UpdatedAt) || 'N/A'}</Typography>
                  </Box>
                  <Box>
                    <Typography variant="caption" sx={{ color: 'text.secondary' }}>Remarks</Typography>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>{selectedOrder.Remarks || 'None'}</Typography>
                  </Box>
                </Box>
              </Paper>

              {/* Document */}
              {(selectedOrder.PODocumentId || selectedOrder.SODocumentId) && (
                <Paper 
                  elevation={0} 
                  sx={{ 
                    p: 2, 
                    border: `1px solid ${alpha(theme.palette.primary.main, 0.08)}`,
                    borderRadius: 2
                  }}
                >
                  <Typography variant="subtitle2" sx={{ color: 'primary.main', fontWeight: 600, mb: 1 }}>
                    Document
                  </Typography>
                  <Button
                    variant="outlined"
                    startIcon={<Description />}
                    onClick={() => window.open(`https://drive.google.com/file/d/${selectedOrder.PODocumentId || selectedOrder.SODocumentId}/view`, '_blank')}
                    sx={{ borderRadius: 2 }}
                  >
                    View Document
                  </Button>
                </Paper>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 2, borderTop: `1px solid ${alpha(theme.palette.primary.main, 0.08)}` }}>
          <Button onClick={handleViewDialogClose} variant="outlined" sx={{ borderRadius: 2 }}>
            Close
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onClose={handleDeleteDialogClose}>
        <DialogTitle>Confirm Delete</DialogTitle>
        <DialogContent>
          {selectedOrder && (
            <Typography>
              Are you sure you want to delete Sales Order "{selectedOrder.POId || selectedOrder.SOId}"? 
              This action cannot be undone.
            </Typography>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleDeleteDialogClose} disabled={loading}>
            Cancel
          </Button>
          <Button 
            onClick={confirmDelete} 
            variant="contained" 
            color="error"
            disabled={loading}
            startIcon={loading ? <CircularProgress size={16} /> : <Delete />}
          >
            {loading ? 'Deleting...' : 'Delete'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default SalesOrderList;