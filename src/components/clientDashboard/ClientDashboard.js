import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Box,
  Paper,
  Grid,
  Card,
  CardContent,
  Button,
  Divider,
  Alert,
  Tabs,
  Tab,
  Chip,
  IconButton,
  Tooltip,
  CircularProgress,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  TablePagination, Pagination,
  Fade, Grow,
  useTheme,
  useMediaQuery,
  alpha,
  Badge,
  Avatar,
  LinearProgress,
  CardHeader
} from '@mui/material';
import {
  Dashboard as DashboardIcon,
  ShoppingCart as OrderIcon,
  Payment as PaymentIcon,
  Message as MessageIcon,
  Notifications as NotificationIcon,
  Description as DocumentIcon,
  Refresh as RefreshIcon,
  TrendingUp as AnalyticsIcon,
  Settings as SettingsIcon,
  Timeline as TimelineIcon,
  AttachMoney as MoneyIcon,
  Assignment as AssignmentIcon,
  BarChart as ChartIcon,
  PieChart as PieChartIcon,
  ShowChart as LineChartIcon,
  Business as BusinessIcon,
  Person as PersonIcon,
  Email as EmailIcon,
  Phone as PhoneIcon,
  LocationOn as LocationIcon,
  CalendarToday as CalendarIcon,
  CheckCircle as CheckIcon,
  Pending as PendingIcon,
  Cancel as CancelIcon,
  CloudDownload as DownloadIcon,
  Visibility as ViewIcon,
  TrendingUp
} from '@mui/icons-material';
import LoadingSpinner from '../common/LoadingSpinner';
import ErrorMessage from '../common/ErrorMessage';
import { useAuth } from '../../context/AuthContext';
import ClientSelector from '../common/ClientSelector';
import clientDashboardService from '../../services/clientDashboardService';
import { getAllClients } from '../../services/clientService';

// CSS-in-JS animations for enhanced UX
const globalStyles = {
  '@global': {
    '@keyframes pulse': {
      '0%': {
        transform: 'scale(1)',
        opacity: 1,
      },
      '50%': {
        transform: 'scale(1.05)',
        opacity: 0.8,
      },
      '100%': {
        transform: 'scale(1)',
        opacity: 1,
      },
    },
    '@keyframes float': {
      '0%, 100%': {
        transform: 'translateY(0px)',
      },
      '50%': {
        transform: 'translateY(-10px)',
      },
    },
    '@keyframes fadeInUp': {
      'from': {
        opacity: 0,
        transform: 'translateY(30px)',
      },
      'to': {
        opacity: 1,
        transform: 'translateY(0)',
      },
    },
    '@keyframes shimmer': {
      '0%': {
        backgroundPosition: '-200px 0',
      },
      '100%': {
        backgroundPosition: 'calc(200px + 100%) 0',
      },
    },
  },
};

// Small hook to animate numbers for a polished feel
function useAnimatedNumber(targetValue, durationMs = 800) {
  const [value, setValue] = useState(0);
  useEffect(() => {
    let rafId = null;
    const start = performance.now();
    const startVal = 0;
    const endVal = Number(targetValue) || 0;
    const animate = (now) => {
      const elapsed = now - start;
      const t = Math.min(1, elapsed / durationMs);
      // Ease-out
      const eased = 1 - Math.pow(1 - t, 3);
      setValue(Math.round(startVal + (endVal - startVal) * eased));
      if (t < 1) rafId = requestAnimationFrame(animate);
    };
    rafId = requestAnimationFrame(animate);
    return () => rafId && cancelAnimationFrame(rafId);
  }, [targetValue, durationMs]);
  return value;
}

// Tab Panel Component
function TabPanel({ children, value, index, ...other }) {
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`client-dashboard-tabpanel-${index}`}
      aria-labelledby={`client-dashboard-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

const ClientDashboard = () => {
  const { user } = useAuth();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const isTablet = useMediaQuery(theme.breakpoints.between('md', 'lg'));
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState(0);
  const [loadingClients, setLoadingClients] = useState(false);
  const [clients, setClients] = useState([]);
  const [selectedClient, setSelectedClient] = useState(null);
  const [dashboardData, setDashboardData] = useState({
    orders: [],
    payments: [],
    quotations: [],
    notifications: []
  });
  // Animated summary numbers
  const animatedOrderCount = useAnimatedNumber(dashboardData.orders.length);
  const animatedPaymentTotal = useAnimatedNumber(
    dashboardData.payments.reduce((sum, p) => sum + Number(p.amount || 0), 0)
  );
  const animatedQuotationCount = useAnimatedNumber(dashboardData.quotations.length);
  const animatedUnread = useAnimatedNumber(
    dashboardData.notifications.filter(n => !n.read).length
  );
  // Pagination state per tab
  const [ordersPage, setOrdersPage] = useState(0);
  const [ordersRows, setOrdersRows] = useState(6);
  const [paymentsPage, setPaymentsPage] = useState(0);
  const [paymentsRows, setPaymentsRows] = useState(10);
  const [quotesPage, setQuotesPage] = useState(0);
  const [quotesRows, setQuotesRows] = useState(10);
  const [notesPage, setNotesPage] = useState(0);
  const [notesRows, setNotesRows] = useState(10);

  useEffect(() => {
    loadClients();
    fetchDashboardData();
  }, []);

  useEffect(() => {
    // Refetch data when client changes
    fetchDashboardData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedClient]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);
      const clientCode = selectedClient?.clientCode || null;
      const data = await clientDashboardService.getClientSummary(clientCode);
      setDashboardData(data);
    } catch (err) {
      setError('Failed to load dashboard data');
      console.error('Error loading dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadClients = async () => {
    try {
      setLoadingClients(true);
      const all = await getAllClients();
      setClients(all.map(c => c.clientCode));
    } catch (e) {
      console.error('Failed to load clients', e);
    } finally {
      setLoadingClients(false);
    }
  };

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };
  const handleOrdersPagination = (event, page) => setOrdersPage(page);
  const handleOrdersRows = (event) => { setOrdersRows(parseInt(event.target.value, 10)); setOrdersPage(0); };
  const handlePaymentsPage = (event, page) => setPaymentsPage(page);
  const handlePaymentsRows = (event) => { setPaymentsRows(parseInt(event.target.value, 10)); setPaymentsPage(0); };
  const handleQuotesPage = (event, page) => setQuotesPage(page);
  const handleQuotesRows = (event) => { setQuotesRows(parseInt(event.target.value, 10)); setQuotesPage(0); };
  const handleNotesPage = (event, page) => setNotesPage(page);
  const handleNotesRows = (event) => { setNotesRows(parseInt(event.target.value, 10)); setNotesPage(0); };

  const getStatusColor = (status) => {
    switch (status.toLowerCase()) {
      case 'delivered':
      case 'paid':
      case 'completed':
        return 'success';
      case 'in production':
      case 'active':
      case 'pending':
        return 'warning';
      case 'cancelled':
      case 'rejected':
        return 'error';
      default:
        return 'default';
    }
  };

  if (loading) {
    return <LoadingSpinner message="Loading Client Dashboard..." />;
  }

  if (error) {
    return <ErrorMessage error={error} retry={fetchDashboardData} />;
  }

  return (
    <Container maxWidth="xl" sx={{ mt: 2, mb: 8, px: { xs: 2, md: 3 } }}>
      {/* Modern Header Section */}
      <Paper 
        elevation={0}
        sx={{ 
          p: { xs: 3, md: 4 }, 
          mb: 4, 
          background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.08)} 0%, ${alpha(theme.palette.primary.light, 0.12)} 100%)`,
          color: theme.palette.primary.main,
          borderRadius: 4,
          position: 'relative',
          overflow: 'hidden',
          border: `1px solid ${alpha(theme.palette.primary.light, 0.3)}`
        }}
      >
        {/* Animated background elements */}
        <Box
          sx={{
            position: 'absolute',
            top: -100,
            right: -100,
            width: 300,
            height: 300,
            background: `radial-gradient(circle, ${alpha(theme.palette.primary.main, 0.05)} 0%, transparent 70%)`,
            borderRadius: '50%',
            zIndex: 0,
            animation: 'pulse 4s ease-in-out infinite'
          }}
        />
        <Box
          sx={{
            position: 'absolute',
            bottom: -50,
            left: -50,
            width: 200,
            height: 200,
            background: `radial-gradient(circle, ${alpha(theme.palette.primary.light, 0.03)} 0%, transparent 70%)`,
            borderRadius: '50%',
            zIndex: 0,
            animation: 'float 6s ease-in-out infinite'
          }}
        />
        
        <Box sx={{ position: 'relative', zIndex: 1 }}>
          <Box sx={{ 
            display: 'flex', 
            flexDirection: { xs: 'column', lg: 'row' }, 
            gap: { xs: 3, lg: 2 }, 
            justifyContent: 'space-between', 
            alignItems: { xs: 'flex-start', lg: 'center' }, 
            mb: 2 
          }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Avatar 
                sx={{ 
                  bgcolor: alpha(theme.palette.primary.main, 0.1), 
                  width: 56, 
                  height: 56,
                  border: `2px solid ${alpha(theme.palette.primary.light, 0.3)}`,
                  color: theme.palette.primary.main
                }}
              >
                <DashboardIcon sx={{ fontSize: 28 }} />
              </Avatar>
              <Box>
            <Typography 
                  variant={isMobile ? "h4" : "h3"}
              sx={{ 
                fontWeight: 700,
                    textShadow: '0 2px 8px rgba(0,0,0,0.15)',
                    mb: 0.5
              }}
            >
              Client Dashboard
            </Typography>
                <Typography 
                  variant="subtitle1" 
                  sx={{ 
                    opacity: 0.85,
                    fontWeight: 400
                  }}
                >
                  Comprehensive client management platform
                </Typography>
              </Box>
            </Box>
            
            <Box sx={{ 
              display: 'flex', 
              gap: 2, 
              alignItems: 'center', 
              width: { xs: '100%', lg: 'auto' },
              flexDirection: { xs: 'column', sm: 'row' }
            }}>
              <Box sx={{ width: { xs: '100%', sm: 320 } }}>
              <ClientSelector 
                options={clients}
                value={selectedClient?.clientCode || null}
                onChange={(val) => setSelectedClient(val ? { clientCode: val } : null)}
                loading={loadingClients}
              />
              </Box>
              <Button
                startIcon={loading ? <CircularProgress size={16} color="inherit" /> : <RefreshIcon />}
                onClick={fetchDashboardData}
                disabled={loading}
                variant="outlined"
                sx={{ 
                  bgcolor: 'white',
                  color: 'primary.main',
                  border: 1,
                  borderColor: 'divider',
                  borderRadius: 2,
                  whiteSpace: 'nowrap',
                  minWidth: 120,
                  height: 48,
                  boxShadow: theme.shadows[2],
                  '&:hover': { 
                    bgcolor: alpha('#fff', 0.9),
                    transform: 'translateY(-1px)',
                    boxShadow: theme.shadows[4]
                  },
                  '&:disabled': {
                    opacity: 0.5,
                    bgcolor: alpha(theme.palette.grey[400], 0.1)
                  },
                  transition: 'all 0.2s ease-in-out'
                }}
              >
                Refresh
              </Button>
            </Box>
          </Box>
          
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mt: 2 }}>
            <BusinessIcon sx={{ opacity: 0.8 }} />
          <Typography 
              variant="body1" 
            sx={{ 
              opacity: 0.9,
                fontWeight: 400,
                maxWidth: { xs: '100%', md: 600 }
            }}
          >
              Monitor orders, track payments, manage quotations, and stay connected with your clients
          </Typography>
          </Box>
        </Box>
      </Paper>

      {/* Enhanced Summary Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} xl={3}>
          <Grow in timeout={300}>
          <Card sx={{ 
              background: `linear-gradient(135deg, ${alpha(theme.palette.success.main, 0.08)} 0%, ${alpha(theme.palette.success.light, 0.12)} 100%)`,
            color: theme.palette.success.main,
              borderRadius: 4,
              overflow: 'hidden',
              position: 'relative',
              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
              '&:hover': {
                transform: 'translateY(-4px)',
                boxShadow: `0 12px 24px ${alpha(theme.palette.success.main, 0.25)}`
              }
            }}>
              <Box sx={{
                position: 'absolute',
                top: 0,
                right: 0,
                width: 100,
                height: 100,
                background: alpha('#fff', 0.1),
                borderRadius: '50%',
                transform: 'translate(30px, -30px)'
              }} />
              <CardContent sx={{ position: 'relative', zIndex: 1, p: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', mb: 2 }}>
                  <Box sx={{ flex: 1 }}>
                    <Typography variant="h3" sx={{ fontWeight: 800, mb: 0.5, lineHeight: 1 }}>
                    {animatedOrderCount}
                  </Typography>
                    <Typography variant="body2" sx={{ opacity: 0.9, fontWeight: 500 }}>
                    Active Orders
                  </Typography>
                </Box>
                  <Avatar sx={{ 
                    bgcolor: alpha('#fff', 0.2), 
                    width: 48, 
                    height: 48,
                    border: `2px solid ${alpha('#fff', 0.3)}`
                  }}>
                    <OrderIcon sx={{ fontSize: 24 }} />
                  </Avatar>
              </Box>
                <LinearProgress 
                  variant="determinate" 
                  value={Math.min((animatedOrderCount / 20) * 100, 100)} 
                  sx={{ 
                    height: 4, 
                    borderRadius: 2,
                    backgroundColor: alpha('#fff', 0.2),
                    '& .MuiLinearProgress-bar': {
                      backgroundColor: '#fff',
                      borderRadius: 2
                    }
                  }} 
                />
            </CardContent>
          </Card>
          </Grow>
        </Grid>

        <Grid item xs={12} sm={6} xl={3}>
          <Grow in timeout={400}>
          <Card sx={{ 
              background: `linear-gradient(135deg, ${alpha(theme.palette.info.main, 0.08)} 0%, ${alpha(theme.palette.primary.light, 0.12)} 100%)`,
            color: theme.palette.info.main,
              borderRadius: 4,
              overflow: 'hidden',
              position: 'relative',
              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
              '&:hover': {
                transform: 'translateY(-4px)',
                boxShadow: `0 12px 24px ${alpha(theme.palette.info.main, 0.25)}`
              }
            }}>
              <Box sx={{
                position: 'absolute',
                top: 0,
                right: 0,
                width: 100,
                height: 100,
                background: alpha('#fff', 0.1),
                borderRadius: '50%',
                transform: 'translate(30px, -30px)'
              }} />
              <CardContent sx={{ position: 'relative', zIndex: 1, p: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', mb: 2 }}>
                  <Box sx={{ flex: 1 }}>
                    <Typography variant="h3" sx={{ fontWeight: 800, mb: 0.5, lineHeight: 1 }}>
                      ₹{Number(animatedPaymentTotal).toLocaleString('en-IN')}
                  </Typography>
                    <Typography variant="body2" sx={{ opacity: 0.9, fontWeight: 500 }}>
                    Total Payments
                  </Typography>
                </Box>
                  <Avatar sx={{ 
                    bgcolor: alpha('#fff', 0.2), 
                    width: 48, 
                    height: 48,
                    border: `2px solid ${alpha('#fff', 0.3)}`
                  }}>
                    <MoneyIcon sx={{ fontSize: 24 }} />
                  </Avatar>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <TrendingUp sx={{ fontSize: 16, opacity: 0.8 }} />
                  <Typography variant="caption" sx={{ opacity: 0.8, fontWeight: 500 }}>
                    +12% from last month
                  </Typography>
              </Box>
            </CardContent>
          </Card>
          </Grow>
        </Grid>

        <Grid item xs={12} sm={6} xl={3}>
          <Grow in timeout={500}>
          <Card sx={{ 
              background: `linear-gradient(135deg, ${alpha(theme.palette.warning.main, 0.08)} 0%, ${alpha(theme.palette.warning.light, 0.12)} 100%)`,
            color: theme.palette.warning.main,
              borderRadius: 4,
              overflow: 'hidden',
              position: 'relative',
              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
              '&:hover': {
                transform: 'translateY(-4px)',
                boxShadow: `0 12px 24px ${alpha(theme.palette.warning.main, 0.25)}`
              }
            }}>
              <Box sx={{
                position: 'absolute',
                top: 0,
                right: 0,
                width: 100,
                height: 100,
                background: alpha('#fff', 0.1),
                borderRadius: '50%',
                transform: 'translate(30px, -30px)'
              }} />
              <CardContent sx={{ position: 'relative', zIndex: 1, p: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', mb: 2 }}>
                  <Box sx={{ flex: 1 }}>
                    <Typography variant="h3" sx={{ fontWeight: 800, mb: 0.5, lineHeight: 1 }}>
                    {animatedQuotationCount}
                  </Typography>
                    <Typography variant="body2" sx={{ opacity: 0.9, fontWeight: 500 }}>
                    Active Quotations
                  </Typography>
                </Box>
                  <Avatar sx={{ 
                    bgcolor: alpha('#fff', 0.2), 
                    width: 48, 
                    height: 48,
                    border: `2px solid ${alpha('#fff', 0.3)}`
                  }}>
                    <AssignmentIcon sx={{ fontSize: 24 }} />
                  </Avatar>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <CalendarIcon sx={{ fontSize: 16, opacity: 0.8 }} />
                  <Typography variant="caption" sx={{ opacity: 0.8, fontWeight: 500 }}>
                    3 pending approval
                  </Typography>
              </Box>
            </CardContent>
          </Card>
          </Grow>
        </Grid>

        <Grid item xs={12} sm={6} xl={3}>
          <Grow in timeout={600}>
          <Card sx={{ 
              background: `linear-gradient(135deg, ${alpha(theme.palette.secondary.main, 0.08)} 0%, ${alpha(theme.palette.secondary.light, 0.12)} 100%)`,
            color: theme.palette.secondary.main,
              borderRadius: 4,
              overflow: 'hidden',
              position: 'relative',
              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
              '&:hover': {
                transform: 'translateY(-4px)',
                boxShadow: `0 12px 24px ${alpha(theme.palette.secondary.main, 0.25)}`
              }
            }}>
              <Box sx={{
                position: 'absolute',
                top: 0,
                right: 0,
                width: 100,
                height: 100,
                background: alpha('#fff', 0.1),
                borderRadius: '50%',
                transform: 'translate(30px, -30px)'
              }} />
              <CardContent sx={{ position: 'relative', zIndex: 1, p: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', mb: 2 }}>
                  <Box sx={{ flex: 1 }}>
                    <Typography variant="h3" sx={{ fontWeight: 800, mb: 0.5, lineHeight: 1 }}>
                    {animatedUnread}
                  </Typography>
                    <Typography variant="body2" sx={{ opacity: 0.9, fontWeight: 500 }}>
                    Unread Notifications
                  </Typography>
                </Box>
                  <Badge badgeContent={animatedUnread} color="error">
                    <Avatar sx={{ 
                      bgcolor: alpha('#fff', 0.2), 
                      width: 48, 
                      height: 48,
                      border: `2px solid ${alpha('#fff', 0.3)}`
                    }}>
                      <NotificationIcon sx={{ fontSize: 24 }} />
                    </Avatar>
                  </Badge>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Box sx={{ 
                    width: 8, 
                    height: 8, 
                    borderRadius: '50%', 
                    bgcolor: animatedUnread > 0 ? '#ff4444' : '#4caf50',
                    animation: animatedUnread > 0 ? 'pulse 2s infinite' : 'none'
                  }} />
                  <Typography variant="caption" sx={{ opacity: 0.8, fontWeight: 500 }}>
                    {animatedUnread > 0 ? 'Requires attention' : 'All caught up'}
                  </Typography>
              </Box>
            </CardContent>
          </Card>
          </Grow>
        </Grid>
      </Grid>

      {/* Enhanced Main Content Tabs */}
      <Paper 
        elevation={0}
        sx={{ 
          borderRadius: 4, 
          overflow: 'hidden',
          border: `1px solid ${alpha(theme.palette.divider, 0.08)}`,
          background: theme.palette.background.paper
        }}
      >
        <Box sx={{ 
          borderBottom: 1, 
          borderColor: alpha(theme.palette.divider, 0.08), 
          background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.04)} 0%, ${alpha(theme.palette.primary.light, 0.06)} 100%)`,
          px: 1
        }}>
          <Tabs 
            value={activeTab} 
            onChange={handleTabChange}
            variant={isMobile ? "scrollable" : "standard"}
            scrollButtons="auto"
            sx={{
              '& .MuiTab-root': {
                fontWeight: 600,
                textTransform: 'none',
                fontSize: '0.95rem',
                minHeight: 64,
                transition: 'all 0.2s ease-in-out',
                borderRadius: 2,
                margin: '8px 4px',
                minWidth: isMobile ? 120 : 140,
                '&:hover': {
                  backgroundColor: alpha(theme.palette.primary.main, 0.08),
                  transform: 'translateY(-1px)'
                },
                '&.Mui-selected': {
                  backgroundColor: alpha(theme.palette.primary.main, 0.08),
                  color: theme.palette.primary.main,
                  fontWeight: 700
                }
              },
              '& .MuiTabs-indicator': {
                height: 4,
                borderRadius: 2,
                background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.6)} 0%, ${alpha(theme.palette.primary.light, 0.8)} 100%)`
              },
              '& .MuiTabs-scrollButtons': {
                color: theme.palette.primary.main
              }
            }}
          >
            <Tab 
              label={`Orders (${dashboardData.orders.length})`} 
              icon={<OrderIcon />} 
              iconPosition="start"
            />
            <Tab 
              label={`Payments (${dashboardData.payments.length})`} 
              icon={<MoneyIcon />} 
              iconPosition="start"
            />
            <Tab 
              label={`Quotations (${dashboardData.quotations.length})`} 
              icon={<AssignmentIcon />} 
              iconPosition="start"
            />
            <Tab 
              label="Messages" 
              icon={<MessageIcon />} 
              iconPosition="start"
            />
            <Tab 
              label={
                <Badge badgeContent={animatedUnread} color="error" max={99}>
                  {`Notifications (${dashboardData.notifications.length})`}
                </Badge>
              } 
              icon={<NotificationIcon />} 
              iconPosition="start"
            />
            <Tab 
              label="Analytics" 
              icon={<AnalyticsIcon />} 
              iconPosition="start"
            />
          </Tabs>
        </Box>

        {/* Enhanced Orders Tab */}
        <TabPanel value={activeTab} index={0}>
          <Box sx={{ mb: 3 }}>
            <Typography variant="h5" gutterBottom sx={{ fontWeight: 700, color: theme.palette.primary.main, display: 'flex', alignItems: 'center', gap: 1 }}>
              <OrderIcon />
            Order Management
          </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Track and manage all client orders with real-time status updates
            </Typography>
          </Box>
          
          {dashboardData.orders.length === 0 ? (
            <Alert 
              severity="info" 
              sx={{ 
                borderRadius: 3,
                border: `1px solid ${alpha(theme.palette.info.main, 0.2)}`,
                background: alpha(theme.palette.info.main, 0.05)
              }}
            >
              No orders found for the selected client.
            </Alert>
          ) : (
            <>
          <Grid container spacing={3}>
            {dashboardData.orders
              .slice(ordersPage * ordersRows, ordersPage * ordersRows + ordersRows)
              .map((order, idx) => (
              <Grid item xs={12} sm={6} lg={4} key={order.id}>
                <Grow in timeout={300 + idx * 50}>
                      <Card sx={{ 
                        borderRadius: 4, 
                        border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
                        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                        overflow: 'hidden',
                        position: 'relative',
                        background: theme.palette.background.paper,
                        '&:hover': { 
                          transform: 'translateY(-4px)', 
                          boxShadow: `0 12px 24px ${alpha(theme.palette.primary.main, 0.15)}`,
                          border: `1px solid ${alpha(theme.palette.primary.main, 0.2)}`
                        } 
                      }}>
                        <CardHeader
                          avatar={
                            <Avatar sx={{ 
                              bgcolor: alpha(theme.palette.primary.main, 0.08),
                              color: theme.palette.primary.main,
                              width: 40,
                              height: 40
                            }}>
                              <OrderIcon />
                            </Avatar>
                          }
                          title={
                            <Typography variant="h6" sx={{ fontWeight: 700, color: theme.palette.primary.main }}>
                        {order.orderNumber}
                      </Typography>
                          }
                          action={
                      <Chip 
                        label={order.status} 
                        color={getStatusColor(order.status)}
                        size="small"
                              sx={{ fontWeight: 600 }}
                            />
                          }
                          sx={{ pb: 1 }}
                        />
                        <CardContent sx={{ pt: 0 }}>
                          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <CalendarIcon sx={{ fontSize: 16, color: theme.palette.text.secondary }} />
                              <Typography variant="body2" color="text.secondary">
                                {new Date(order.orderDate).toLocaleDateString('en-IN', {
                                  year: 'numeric',
                                  month: 'short',
                                  day: 'numeric'
                                })}
                              </Typography>
                    </Box>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <BusinessIcon sx={{ fontSize: 16, color: theme.palette.text.secondary }} />
                              <Typography variant="body2" color="text.secondary">
                                {order.items} item{order.items !== 1 ? 's' : ''}
                    </Typography>
                            </Box>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 1 }}>
                              <MoneyIcon sx={{ fontSize: 18, color: theme.palette.success.main }} />
                              <Typography variant="h6" sx={{ fontWeight: 700, color: theme.palette.success.main }}>
                                ₹{order.totalAmount.toLocaleString('en-IN')}
                    </Typography>
                            </Box>
                          </Box>
                          
                          <Box sx={{ mt: 3, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                      <Button 
                              variant="contained" 
                        size="small" 
                              startIcon={<ViewIcon />}
                              onClick={() => alert('View Details coming soon!')}
                              sx={{ 
                                flex: 1,
                                minWidth: 120,
                                borderRadius: 2,
                                fontWeight: 600,
                                bgcolor: alpha(theme.palette.primary.main, 0.1),
                                color: theme.palette.primary.main,
                                '&:hover': { 
                                  bgcolor: alpha(theme.palette.primary.main, 0.16),
                                  color: theme.palette.primary.dark
                                }
                              }}
                      >
                        View Details
                      </Button>
                      <Button 
                        variant="outlined" 
                        size="small"
                              startIcon={<DownloadIcon />}
                              onClick={() => alert('Documents coming soon!')}
                              sx={{ 
                                flex: 1,
                                minWidth: 120,
                                borderRadius: 2,
                                fontWeight: 600,
                                borderColor: alpha(theme.palette.primary.main, 0.3),
                                color: theme.palette.primary.main,
                                '&:hover': {
                                  borderColor: theme.palette.primary.main,
                                  bgcolor: alpha(theme.palette.primary.main, 0.08)
                                }
                              }}
                            >
                              Documents
                      </Button>
                    </Box>
                    </CardContent>
                  </Card>
                </Grow>
              </Grid>
            ))}
          </Grid>
              
              <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
            <Pagination
              count={Math.max(1, Math.ceil(dashboardData.orders.length / ordersRows))}
              page={ordersPage + 1}
              onChange={(e, p) => handleOrdersPagination(e, p - 1)}
              color="primary"
              shape="rounded"
                  size={isMobile ? "medium" : "large"}
                  sx={{
                    '& .MuiPaginationItem-root': {
                      borderRadius: 2,
                      fontWeight: 600,
                      '&.Mui-selected': {
                        bgcolor: alpha(theme.palette.primary.main, 0.12),
                        color: theme.palette.primary.main,
                        '&:hover': {
                          bgcolor: alpha(theme.palette.primary.main, 0.16)
                        }
                      }
                    }
                  }}
            />
          </Box>
            </>
          )}
        </TabPanel>

        {/* Payments Tab */}
        <TabPanel value={activeTab} index={1}>
          <Typography variant="h5" gutterBottom sx={{ fontWeight: 600, color: '#1976d2' }}>
            Payments
          </Typography>
          {dashboardData.payments.length === 0 ? (
            <Alert severity="info">No payments found for the selected client.</Alert>
          ) : (
            <TableContainer component={Paper} sx={{ borderRadius: 2, border: '1px solid #e3f2fd' }}>
              <Table size="small">
                <TableHead>
                  <TableRow sx={{ backgroundColor: '#f8fbff' }}>
                    <TableCell sx={{ fontWeight: 700, color: '#1976d2' }}>Payment ID</TableCell>
                    <TableCell sx={{ fontWeight: 700, color: '#1976d2' }}>Order ID</TableCell>
                    <TableCell sx={{ fontWeight: 700, color: '#1976d2' }}>Amount</TableCell>
                    <TableCell sx={{ fontWeight: 700, color: '#1976d2' }}>Date</TableCell>
                    <TableCell sx={{ fontWeight: 700, color: '#1976d2' }}>Method</TableCell>
                    <TableCell sx={{ fontWeight: 700, color: '#1976d2' }}>Status</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {dashboardData.payments
                    .slice(paymentsPage * paymentsRows, paymentsPage * paymentsRows + paymentsRows)
                    .map(p => (
                    <TableRow key={p.id}>
                      <TableCell>{p.id}</TableCell>
                      <TableCell>{p.orderId}</TableCell>
                      <TableCell>₹{Number(p.amount || 0).toLocaleString()}</TableCell>
                      <TableCell>{p.paymentDate ? new Date(p.paymentDate).toLocaleDateString() : '-'}</TableCell>
                      <TableCell>{p.method || '-'}</TableCell>
                      <TableCell>
                        <Chip label={p.status || 'N/A'} color={getStatusColor(String(p.status || '').toLowerCase())} size="small" />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              <TablePagination
                component="div"
                count={dashboardData.payments.length}
                page={paymentsPage}
                onPageChange={handlePaymentsPage}
                rowsPerPage={paymentsRows}
                onRowsPerPageChange={handlePaymentsRows}
                rowsPerPageOptions={[5,10,25]}
              />
            </TableContainer>
          )}
        </TabPanel>

        {/* Quotations Tab */}
        <TabPanel value={activeTab} index={2}>
          <Typography variant="h5" gutterBottom sx={{ fontWeight: 600, color: '#1976d2' }}>
            Quotations
          </Typography>
          {dashboardData.quotations.length === 0 ? (
            <Alert severity="info">No quotations found for the selected client.</Alert>
          ) : (
            <TableContainer component={Paper} sx={{ borderRadius: 2, border: '1px solid #e3f2fd' }}>
              <Table size="small">
                <TableHead>
                  <TableRow sx={{ backgroundColor: '#f8fbff' }}>
                    <TableCell sx={{ fontWeight: 700, color: '#1976d2' }}>Quotation ID</TableCell>
                    <TableCell sx={{ fontWeight: 700, color: '#1976d2' }}>Quotation No.</TableCell>
                    <TableCell sx={{ fontWeight: 700, color: '#1976d2' }}>Issue Date</TableCell>
                    <TableCell sx={{ fontWeight: 700, color: '#1976d2' }}>Valid Until</TableCell>
                    <TableCell sx={{ fontWeight: 700, color: '#1976d2' }}>Amount</TableCell>
                    <TableCell sx={{ fontWeight: 700, color: '#1976d2' }}>Status</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {dashboardData.quotations
                    .slice(quotesPage * quotesRows, quotesPage * quotesRows + quotesRows)
                    .map(q => (
                    <TableRow key={q.id}>
                      <TableCell>{q.id}</TableCell>
                      <TableCell>{q.quotationNumber}</TableCell>
                      <TableCell>{q.issueDate ? new Date(q.issueDate).toLocaleDateString() : '-'}</TableCell>
                      <TableCell>{q.validUntil ? new Date(q.validUntil).toLocaleDateString() : '-'}</TableCell>
                      <TableCell>₹{Number(q.totalAmount || 0).toLocaleString()}</TableCell>
                      <TableCell>
                        <Chip label={q.status || 'N/A'} color={getStatusColor(String(q.status || '').toLowerCase())} size="small" />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              <TablePagination
                component="div"
                count={dashboardData.quotations.length}
                page={quotesPage}
                onPageChange={handleQuotesPage}
                rowsPerPage={quotesRows}
                onRowsPerPageChange={handleQuotesRows}
                rowsPerPageOptions={[5,10,25]}
              />
            </TableContainer>
          )}
        </TabPanel>

        {/* Messages Tab */}
        <TabPanel value={activeTab} index={3}>
          <Typography variant="h5" gutterBottom sx={{ fontWeight: 600, color: '#1976d2' }}>
            Message Center
          </Typography>
          <Alert severity="info" sx={{ mb: 3 }}>
            WhatsApp and in-app messaging will be integrated post sheet setup (`Client_Messages`).
          </Alert>
        </TabPanel>

        {/* Notifications Tab */}
        <TabPanel value={activeTab} index={4}>
          <Typography variant="h5" gutterBottom sx={{ fontWeight: 600, color: '#1976d2' }}>
            Notifications
          </Typography>
          {dashboardData.notifications.length === 0 ? (
            <Alert severity="info">No notifications found for the selected client.</Alert>
          ) : (
            <Grid container spacing={2}>
              {dashboardData.notifications
                .slice(notesPage * notesRows, notesPage * notesRows + notesRows)
                .map((notification) => (
                <Grid item xs={12} key={notification.id}>
                  <Card sx={{ 
                    borderRadius: 2, 
                    border: notification.read ? '1px solid #e3f2fd' : '2px solid #1976d2',
                    backgroundColor: notification.read ? 'inherit' : '#f8fbff'
                  }}>
                    <CardContent>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <Box sx={{ flex: 1 }}>
                          <Typography variant="subtitle2" sx={{ fontWeight: 600, color: '#1976d2' }}>
                            {notification.type}
                          </Typography>
                          <Typography variant="body2" sx={{ mt: 1 }}>
                            {notification.message}
                          </Typography>
                          <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                            {notification.timestamp ? new Date(notification.timestamp).toLocaleString() : '-'}
                          </Typography>
                        </Box>
                        {!notification.read && (
                          <Chip 
                            label="New" 
                            color="primary" 
                            size="small"
                          />
                        )}
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          )}
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}>
            <Pagination
              count={Math.max(1, Math.ceil(dashboardData.notifications.length / notesRows))}
              page={notesPage + 1}
              onChange={(e, p) => handleNotesPage(e, p - 1)}
              color="primary"
              shape="rounded"
            />
          </Box>
        </TabPanel>

        {/* Enhanced Analytics Tab */}
        <TabPanel value={activeTab} index={5}>
          <Box sx={{ mb: 3 }}>
            <Typography variant="h5" gutterBottom sx={{ fontWeight: 700, color: theme.palette.primary.main, display: 'flex', alignItems: 'center', gap: 1 }}>
              <AnalyticsIcon />
            Analytics Dashboard
          </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Comprehensive insights and data visualization for informed decision making
            </Typography>
          </Box>

          {/* Analytics Overview Cards */}
          <Grid container spacing={3} sx={{ mb: 4 }}>
            <Grid item xs={12} sm={6} md={3}>
              <Card sx={{ 
                borderRadius: 3,
                border: `1px solid ${alpha(theme.palette.primary.main, 0.1)}`,
                background: alpha(theme.palette.primary.main, 0.02),
                transition: 'all 0.2s ease-in-out',
                '&:hover': { transform: 'translateY(-2px)', boxShadow: 3 }
              }}>
                <CardContent sx={{ textAlign: 'center', py: 3 }}>
                  <ChartIcon sx={{ fontSize: 40, color: theme.palette.primary.main, mb: 1 }} />
                  <Typography variant="h4" sx={{ fontWeight: 700, color: theme.palette.primary.main, mb: 0.5 }}>
                    {dashboardData.orders.length}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500 }}>
                    Total Orders
                  </Typography>
                  <LinearProgress 
                    variant="determinate" 
                    value={75} 
                    sx={{ 
                      mt: 2, 
                      height: 6, 
                      borderRadius: 3,
                      backgroundColor: alpha(theme.palette.primary.main, 0.1),
                      '& .MuiLinearProgress-bar': {
                        backgroundColor: theme.palette.primary.main,
                        borderRadius: 3
                      }
                    }} 
                  />
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
              <Card sx={{ 
                borderRadius: 3,
                border: `1px solid ${alpha(theme.palette.success.main, 0.1)}`,
                background: alpha(theme.palette.success.main, 0.02),
                transition: 'all 0.2s ease-in-out',
                '&:hover': { transform: 'translateY(-2px)', boxShadow: 3 }
              }}>
                <CardContent sx={{ textAlign: 'center', py: 3 }}>
                  <PieChartIcon sx={{ fontSize: 40, color: theme.palette.success.main, mb: 1 }} />
                  <Typography variant="h4" sx={{ fontWeight: 700, color: theme.palette.success.main, mb: 0.5 }}>
                    85%
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500 }}>
                    Completion Rate
                  </Typography>
                  <LinearProgress 
                    variant="determinate" 
                    value={85} 
                    sx={{ 
                      mt: 2, 
                      height: 6, 
                      borderRadius: 3,
                      backgroundColor: alpha(theme.palette.success.main, 0.1),
                      '& .MuiLinearProgress-bar': {
                        backgroundColor: theme.palette.success.main,
                        borderRadius: 3
                      }
                    }} 
                  />
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
              <Card sx={{ 
                borderRadius: 3,
                border: `1px solid ${alpha(theme.palette.warning.main, 0.1)}`,
                background: alpha(theme.palette.warning.main, 0.02),
                transition: 'all 0.2s ease-in-out',
                '&:hover': { transform: 'translateY(-2px)', boxShadow: 3 }
              }}>
                <CardContent sx={{ textAlign: 'center', py: 3 }}>
                  <LineChartIcon sx={{ fontSize: 40, color: theme.palette.warning.main, mb: 1 }} />
                  <Typography variant="h4" sx={{ fontWeight: 700, color: theme.palette.warning.main, mb: 0.5 }}>
                    ₹{Math.round(dashboardData.payments.reduce((sum, p) => sum + Number(p.amount || 0), 0) / 100000)}L
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500 }}>
                    Revenue (Lakhs)
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0.5, mt: 1 }}>
                    <TrendingUp sx={{ fontSize: 16, color: theme.palette.success.main }} />
                    <Typography variant="caption" sx={{ color: theme.palette.success.main, fontWeight: 600 }}>
                      +15.3%
                    </Typography>
                  </Box>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
              <Card sx={{ 
                borderRadius: 3,
                border: `1px solid ${alpha(theme.palette.info.main, 0.1)}`,
                background: alpha(theme.palette.info.main, 0.02),
                transition: 'all 0.2s ease-in-out',
                '&:hover': { transform: 'translateY(-2px)', boxShadow: 3 }
              }}>
                <CardContent sx={{ textAlign: 'center', py: 3 }}>
                  <TimelineIcon sx={{ fontSize: 40, color: theme.palette.info.main, mb: 1 }} />
                  <Typography variant="h4" sx={{ fontWeight: 700, color: theme.palette.info.main, mb: 0.5 }}>
                    12
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500 }}>
                    Avg. Days to Complete
                  </Typography>
                  <LinearProgress 
                    variant="determinate" 
                    value={60} 
                    sx={{ 
                      mt: 2, 
                      height: 6, 
                      borderRadius: 3,
                      backgroundColor: alpha(theme.palette.info.main, 0.1),
                      '& .MuiLinearProgress-bar': {
                        backgroundColor: theme.palette.info.main,
                        borderRadius: 3
                      }
                    }} 
                  />
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          <Alert 
            severity="info" 
            sx={{ 
              mb: 3,
              borderRadius: 3,
              border: `1px solid ${alpha(theme.palette.info.main, 0.2)}`,
              background: alpha(theme.palette.info.main, 0.05)
            }}
          >
            Interactive charts and advanced analytics are being developed and will be available soon.
          </Alert>
          <Divider sx={{ my: 3 }} />
          <Typography variant="subtitle1" sx={{ mb: 2, fontWeight: 700 }}>Upcoming Modules</Typography>
          <Grid container spacing={2}>
            {[
              'Die Repair Flow',
              'HR: Induction',
              'HR: Resignation/Handover',
              'Checklists',
              'Delegation & Scoring',
              'MIS Scoring',
              'WhatsApp Integration',
              'Payment Management (Client)',
              'Petty Cash Management',
              'SCOT Sheet',
              'Enquiry Flow (B2B)',
              'Enquiry Export',
              'Enquiry IndiaMart/Leads',
              'Employee Dashboards',
              'Costing Sheet with Breakup',
              'Quotation Format',
            ].map((label) => (
              <Grid item key={label}>
                <Chip label={label} color="default" variant="outlined" />
              </Grid>
            ))}
          </Grid>
        </TabPanel>
      </Paper>
    </Container>
  );
};

export default ClientDashboard;
