import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
  Chip,
  useTheme,
  Alert,
  Snackbar,
  IconButton,
  Tooltip,
  CircularProgress,
  Tabs,
  Tab,
  Card,
  CardContent,
  Grid,
  Avatar,
  LinearProgress,
  Fade,
  Zoom,
  Divider,
  Pagination,
  TextField,
  InputAdornment,
  Select,
  MenuItem,
  FormControl,
  Stack,
  Slide,
  alpha,
} from '@mui/material';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import salesFlowService from '../../services/salesFlowService';
import sheetService from '../../services/sheetService';
import config from '../../config/config';
import { 
  Visibility, 
  Edit, 
  CheckCircle, 
  Cancel,
  Refresh,
  TrendingUp,
  Schedule,
  Person,
  Assignment,
  Timeline,
  Speed,
  Star,
  Gavel,
  Delete,
  TrendingUp as SalesIcon,
  Dashboard as DashboardIcon,
  Insights as InsightsIcon,
  BusinessCenter as BusinessIcon,
  Search,
} from '@mui/icons-material';
import KPICard from '../common/KPICard';
import WhatsAppButton from '../common/WhatsAppButton';

// Dashboard Component
const SalesDashboard = () => {
  const theme = useTheme();
  const [dashboardData, setDashboardData] = useState({
    activeLeads: 0,
    quotations: 0,
    conversionRate: 0,
    revenuePipeline: 0,
    loading: true
  });

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      // Fetch all sales flows
      const allFlows = await salesFlowService.getAllSalesFlows();
      const allLeads = await salesFlowService.getAllLeads();
      
      // Calculate Active Leads (leads in pipeline - not completed)
      const activeLeads = allFlows.filter(flow => 
        flow.NextStep && flow.NextStep !== '-' && flow.NextStep !== ''
      ).length;

      // Calculate Quotations (flows at step 6 or 7 - Send Quotation or Approve Payment Terms)
      const quotations = allFlows.filter(flow => {
        const nextStep = parseInt(flow.NextStep);
        const currentStep = parseInt(flow.CurrentStep);
        return (nextStep === 6 || nextStep === 7) || 
               (currentStep === 6 && flow.Status !== 'completed');
      }).length;

      // Calculate Conversion Rate
      // Total leads that have reached step 6 or beyond
      const totalLeads = allLeads.length;
      const convertedLeads = allFlows.filter(flow => 
        parseInt(flow.CurrentStep) >= 6 || parseInt(flow.NextStep) >= 6
      ).length;
      const conversionRate = totalLeads > 0 
        ? Math.round((convertedLeads / totalLeads) * 100) 
        : 0;

      // Calculate Revenue Pipeline
      // Try to get quotation data if available, otherwise estimate based on flow progress
      let revenuePipeline = 0;
      try {
        // Check if SendQuotation sheet exists and has data
        const quotationSheet = config.sheets.sendQuotation;
        if (quotationSheet) {
          try {
            const quotations = await sheetService.getSheetData(quotationSheet);
            // Sum up total prices from quotations
            revenuePipeline = quotations.reduce((sum, q) => {
              const price = parseFloat(q.TotalPrice || q.totalPrice || q.Amount || q.amount || 0);
              return sum + (isNaN(price) ? 0 : price);
            }, 0);
          } catch (e) {
            // If sheet doesn't exist or has no data, use estimation
            console.log('Quotation sheet not available, using estimation');
          }
        }
        
        // If no quotation data, estimate based on active flows at different stages
        if (revenuePipeline === 0) {
          // Estimate: flows at quotation stage (step 6+) have higher value
          const quotationStageFlows = allFlows.filter(flow => 
            parseInt(flow.NextStep) >= 6 || parseInt(flow.CurrentStep) >= 6
          ).length;
          const earlyStageFlows = allFlows.length - quotationStageFlows;
          revenuePipeline = (quotationStageFlows * 100000) + (earlyStageFlows * 30000);
        }
      } catch (error) {
        console.error('Error calculating revenue pipeline:', error);
        // Fallback estimation
        revenuePipeline = allFlows.length * 50000;
      }
      
      // Calculate progress percentages (efficiency metrics)
      const activeLeadsProgress = totalLeads > 0 
        ? Math.round((activeLeads / totalLeads) * 100) 
        : 0;
      const quotationsProgress = totalLeads > 0 
        ? Math.round((quotations / totalLeads) * 100) 
        : 0;

      setDashboardData({
        activeLeads,
        quotations,
        conversionRate,
        revenuePipeline,
        activeLeadsProgress: Math.min(activeLeadsProgress, 100),
        quotationsProgress: Math.min(quotationsProgress, 100),
        loading: false
      });
    } catch (error) {
      console.error('Error loading dashboard data:', error);
      setDashboardData(prev => ({ ...prev, loading: false }));
    }
  };

  const formatCurrency = (amount) => {
    if (amount >= 1000000) {
      return `₹${(amount / 1000000).toFixed(1)}M`;
    } else if (amount >= 1000) {
      return `₹${(amount / 1000).toFixed(1)}K`;
    }
    return `₹${amount}`;
  };

  const kpiCards = [
    {
      title: "Active Leads",
      description: "New leads and prospects in the pipeline.",
      value: dashboardData.loading ? "..." : dashboardData.activeLeads.toString(),
      subtitle: "HOT PROSPECTS",
      icon: <Person />,
      progress: dashboardData.activeLeadsProgress || 0,
      trend: "+18%", // This could be calculated from historical data
      trendUp: true,
      variant: "default",
      color: "info",
    },
    {
      title: "Quotations",
      description: "Pending quotations and proposal submissions.",
      value: dashboardData.loading ? "..." : dashboardData.quotations.toString(),
      subtitle: "AWAITING RESPONSE",
      icon: <Assignment />,
      progress: dashboardData.quotationsProgress || 0,
      trend: "+12%", // This could be calculated from historical data
      trendUp: true,
      variant: "gradient",
      color: "info",
    },
    {
      title: "Conversion Rate",
      description: "Lead to order conversion tracking.",
      value: dashboardData.loading ? "..." : `${dashboardData.conversionRate}%`,
      subtitle: "THIS QUARTER",
      icon: <TrendingUp />,
      progress: dashboardData.conversionRate || 0,
      trend: "+5%", // This could be calculated from historical data
      trendUp: true,
      variant: "default",
      color: "info",
    },
    {
      title: "Revenue Pipeline",
      description: "Total value of active sales opportunities.",
      value: dashboardData.loading ? "..." : formatCurrency(dashboardData.revenuePipeline),
      subtitle: "EXPECTED REVENUE",
      icon: <Star />,
      progress: Math.min(dashboardData.conversionRate + 20, 100) || 0,
      trend: "+22%", // This could be calculated from historical data
      trendUp: true,
      variant: "gradient",
      color: "info",
    },
  ];

  return (
    <Box>
      {/* Dashboard Header */}
      <Box sx={{ mb: { xs: 4, sm: 5, md: 6 } }}>
        <Stack direction={{ xs: "column", sm: "row" }} justifyContent="space-between" alignItems={{ xs: "flex-start", sm: "center" }} spacing={2}>
          <Box>
            <Typography 
              variant="h3" 
              gutterBottom 
              sx={{ 
                fontWeight: 700,
                background: `linear-gradient(135deg, ${theme.palette.info.main}, ${theme.palette.info.dark})`,
                backgroundClip: "text",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                mb: 1,
                fontSize: { xs: '1.75rem', sm: '2.125rem', md: '2.5rem' },
              }}
            >
              Sales Dashboard
            </Typography>
            <Typography 
              variant="h6" 
              color="text.secondary"
              sx={{ 
                fontSize: { xs: '1rem', sm: '1.1rem' },
                fontWeight: 400,
              }}
            >
              Real-time insights and analytics for your sales pipeline
            </Typography>
          </Box>
          
          <Button
            variant="contained"
            startIcon={<InsightsIcon />}
            sx={{
              borderRadius: 3,
              px: 3,
              py: 1.5,
              textTransform: "none",
              fontWeight: 600,
              boxShadow: theme.shadows[8],
              backgroundColor: theme.palette.info.main,
              '&:hover': {
                backgroundColor: theme.palette.info.dark,
              },
            }}
          >
            View Analytics
          </Button>
        </Stack>
      </Box>
      
      {/* KPI Cards Grid Layout */}
      <Box 
        sx={{ 
          display: 'grid',
          gridTemplateColumns: {
            xs: '1fr',
            sm: 'repeat(2, 1fr)',
            lg: 'repeat(4, 1fr)',
          },
          gap: { xs: 3, sm: 4, md: 5 },
          mb: { xs: 4, sm: 5, md: 8 },
          alignItems: 'stretch',
        }}
      >
        {kpiCards.map((card, index) => (
          <Fade in timeout={600 + (index * 200)} key={index}>
            <Box>
              <KPICard
                title={card.title}
                description={card.description}
                value={card.value}
                subtitle={card.subtitle}
                icon={card.icon}
                progress={card.progress}
                trend={card.trend}
                trendUp={card.trendUp}
                variant={card.variant}
                color={card.color}
              />
            </Box>
          </Fade>
        ))}
      </Box>

      {/* Process Flow Section */}
      <Fade in timeout={1000}>
        <Card
          elevation={0}
          sx={{
            borderRadius: 4,
            background: "linear-gradient(145deg, #ffffff 0%, #f8f9fa 100%)",
            border: `1px solid ${theme.palette.divider}`,
            overflow: 'hidden',
            position: "relative",
          }}
        >
          {/* Section Header */}
          <Box 
            sx={{ 
              background: `linear-gradient(135deg, ${alpha(theme.palette.info.main, 0.1)} 0%, ${alpha(theme.palette.info.main, 0.05)} 100%)`,
              borderBottom: `1px solid ${theme.palette.divider}`,
            }}
          >
            <CardContent sx={{ py: 3 }}>
              <Stack direction="row" alignItems="center" spacing={3}>
                <Box 
                  sx={{ 
                    p: 2, 
                    borderRadius: 3,
                    backgroundColor: alpha(theme.palette.info.main, 0.1),
                    color: theme.palette.info.main,
                  }}
                >
                  <BusinessIcon sx={{ fontSize: 32 }} />
                </Box>
                <Box>
                  <Typography 
                    variant="h4" 
                    sx={{ 
                      fontWeight: 700, 
                      color: theme.palette.info.main,
                      fontSize: { xs: '1.5rem', sm: '1.75rem', md: '2rem' },
                      mb: 0.5,
                    }}
                  >
                    Sales Process Flow
                  </Typography>
                  <Typography variant="subtitle1" color="text.secondary">
                    Complete sales workflow from lead to order booking
                  </Typography>
                </Box>
              </Stack>
            </CardContent>
          </Box>

          <CardContent sx={{ p: { xs: 4, sm: 5, md: 6 } }}>
            {/* Process Steps */}
            <Box sx={{ 
              display: "flex", 
              alignItems: "flex-start", 
              gap: { xs: 2, sm: 3, md: 4 }, 
              flexWrap: "wrap", 
              justifyContent: "flex-start",
              maxHeight: "600px",
              overflowY: "auto",
              p: 2,
              "&::-webkit-scrollbar": {
                width: "8px",
              },
              "&::-webkit-scrollbar-track": {
                backgroundColor: "#f1f1f1",
                borderRadius: "4px",
              },
              "&::-webkit-scrollbar-thumb": {
                backgroundColor: "#c1c1c1",
                borderRadius: "4px",
                "&:hover": {
                  backgroundColor: "#a8a8a8",
                },
              },
            }}>
              {[
                { step: 1, label: "Log Lead", color: "#0097a7", description: "Customer Relations Manager logs and qualifies leads", assignedTo: "Customer Relations Manager", tat: "Same day" },
                { step: 2, label: "Initial Call", color: "#0097a7", description: "Sales Executive makes initial call and gathers requirements", assignedTo: "Sales Executive", tat: "1 day" },
                { step: 3, label: "Evaluate Prospects", color: "#0097a7", description: "Sales Executive evaluates high-value prospects", assignedTo: "Sales Executive", tat: "1 day" },
                { step: 4, label: "Check Feasibility", color: "#0097a7", description: "NPD team checks product feasibility", assignedTo: "NPD", tat: "2 days" },
                { step: 5, label: "Confirm Standards", color: "#0097a7", description: "Quality Engineer confirms standards and compliance", assignedTo: "Quality Engineer", tat: "1 day" },
                { step: 6, label: "Send Quotation", color: "#0097a7", description: "Sales Executive sends detailed quotation", assignedTo: "Sales Executive", tat: "1 day" },
                { step: 7, label: "Approve Payment Terms", color: "#0097a7", description: "Director approves payment terms", assignedTo: "Director", tat: "1 day" },
                { step: 8, label: "Submit Sample", color: "#0097a7", description: "Sales Executive submits product sample", assignedTo: "Sales Executive", tat: "2 days" },
                { step: 9, label: "Get Sample Approval", color: "#0097a7", description: "Customer Relations Manager gets sample approval", assignedTo: "Customer Relations Manager", tat: "3 days" },
                { step: 10, label: "Strategic Approval", color: "#0097a7", description: "Director approves strategic deals", assignedTo: "Director", tat: "1 day" },
                { step: 11, label: "Order Booking", color: "#0097a7", description: "Sales Executive confirms order booking", assignedTo: "Sales Executive", tat: "Same day" },
              ].map((process, index) => (
                <Stack key={index} direction="column" alignItems="center" spacing={2}>
                  <Box 
                    sx={{ 
                      position: "relative",
                      zIndex: 2,
                    }}
                  >
                    <Box 
                      sx={{ 
                        width: { xs: 50, sm: 55, md: 60 }, 
                        height: { xs: 50, sm: 55, md: 60 }, 
                        borderRadius: "50%", 
                        background: `linear-gradient(135deg, ${process.color} 0%, ${alpha(process.color, 0.8)} 100%)`,
                        display: "flex", 
                        alignItems: "center", 
                        justifyContent: "center",
                        color: "white",
                        boxShadow: `0 8px 32px ${alpha(process.color, 0.3)}`,
                        border: `3px solid ${alpha(process.color, 0.2)}`,
                        transition: "all 0.4s cubic-bezier(0.4, 0, 0.2, 1)",
                        cursor: "pointer",
                        "&:hover": {
                          transform: "scale(1.1) translateY(-4px)",
                          boxShadow: `0 16px 40px ${alpha(process.color, 0.4)}`,
                        },
                      }}
                    >
                      <Typography 
                        variant="h3" 
                        sx={{ 
                          fontWeight: 800,
                          fontSize: { xs: '1.2rem', sm: '1.3rem', md: '1.4rem' },
                        }}
                      >
                        {process.step}
                      </Typography>
                    </Box>
                    
                  </Box>
                  
                  <Box sx={{ textAlign: "center", maxWidth: 140, minWidth: 120 }}>
                    <Typography 
                      variant="subtitle1" 
                      sx={{ 
                        fontWeight: 700,
                        color: process.color,
                        fontSize: { xs: '0.8rem', sm: '0.9rem' },
                        mb: 0.5,
                        lineHeight: 1.2,
                      }}
                    >
                      {process.label}
                    </Typography>
                    <Typography 
                      variant="caption" 
                      color="text.secondary"
                      sx={{ 
                        fontSize: { xs: '0.65rem', sm: '0.7rem' },
                        lineHeight: 1.2,
                        display: "block",
                        mb: 0.5,
                      }}
                    >
                      {process.description}
                    </Typography>
                    <Chip 
                      label={process.assignedTo} 
                      size="small" 
                      sx={{ 
                        fontSize: '0.6rem', 
                        height: '20px',
                        mb: 0.5,
                        backgroundColor: alpha(process.color, 0.1),
                        color: process.color,
                        fontWeight: 600,
                      }} 
                    />
                    <Typography 
                      variant="caption" 
                      sx={{ 
                        fontSize: '0.6rem',
                        fontWeight: 600,
                        color: process.color,
                        display: "block",
                      }}
                    >
                      TAT: {process.tat}
                    </Typography>
                  </Box>
                </Stack>
              ))}
            </Box>
            
            <Divider sx={{ my: 5 }} />
            
            {/* Sales Flow Example */}
            <Alert 
              severity="success" 
              sx={{ 
                borderRadius: 3,
                backgroundColor: alpha(theme.palette.success.main, 0.05),
                border: `1px solid ${alpha(theme.palette.success.main, 0.1)}`,
                '& .MuiAlert-icon': {
                  color: theme.palette.success.main,
                },
              }}
            >
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
                Complete 11-Step Sales Process Flow
              </Typography>
              <Typography 
                variant="body2" 
                sx={{ 
                  lineHeight: 1.6,
                  mb: 2,
                  '& strong': { fontWeight: 600 },
                }}
              >
                This comprehensive flow covers the entire sales lifecycle from lead qualification to order booking, 
                ensuring proper approvals, quality checks, and customer satisfaction at each stage.
              </Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 2 }}>
                <Chip label="Lead Management (Steps 1-3)" size="small" variant="outlined" />
                <Chip label="Feasibility & Standards (Steps 4-5)" size="small" variant="outlined" />
                <Chip label="Quotation Process (Steps 6-7)" size="small" variant="outlined" />
                <Chip label="Sample & Approval (Steps 8-9)" size="small" variant="outlined" />
                <Chip label="Final Approval & Booking (Steps 10-11)" size="small" variant="outlined" />
              </Box>
            </Alert>
          </CardContent>
        </Card>
      </Fade>
    </Box>
  );
};

const SalesFlow = () => {
  const theme = useTheme();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [salesFlowSteps, setSalesFlowSteps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [activeTab, setActiveTab] = useState(0);
  
  // Global search query for Sales Flow
  const [globalSearchQuery, setGlobalSearchQuery] = useState('');
  
  // Pagination state
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  // Step definitions based on the 11-step sales flow
  const stepDefinitions = {
    1: { role: 'Customer Relations Manager', action: 'Log & Qualify Leads', icon: <Person /> },
    2: { role: 'Sales Executive', action: 'Initial Call & Requirement Gathering', icon: <Assignment /> },
    3: { role: 'Sales Executive', action: 'Evaluate High-Value Prospects', icon: <Star /> },
    4: { role: 'NPD', action: 'Check feasibility', icon: <TrendingUp /> },
    5: { role: 'Quality Engineer', action: 'Confirm standards and compliance', icon: <CheckCircle /> },
    6: { role: 'Sales Executive', action: 'Send Quotation', icon: <Edit /> },
    7: { role: 'Director', action: 'Approve Payment Terms', icon: <CheckCircle /> },
    8: { role: 'Sales Executive', action: 'Sample Submission', icon: <Assignment /> },
    9: { role: 'Customer Relations Manager', action: 'Get Approval of Sample', icon: <Gavel /> },
    10: { role: 'Director', action: 'Approve Strategic Deals', icon: <Star /> },
    11: { role: 'Customer Relations Manager', action: 'Order Booking', icon: <Assignment /> }
  };

  // Route mapping for sales flow steps
  const stepNumberToRoute = {
    1: '/sales-flow/log-and-qualify-leads',
    2: '/sales-flow/initial-call',
    3: '/sales-flow/evaluate-high-value-prospects',
    4: '/sales-flow/check-feasibility',
    5: '/sales-flow/confirm-standards',
    6: '/sales-flow/send-quotation',
    7: '/sales-flow/approve-payment-terms',
    8: '/sales-flow/sample-submission',
    9: '/sales-flow/get-approval-for-sample',
    10: '/sales-flow/approve-strategic-deals',
    11: '/sales-flow/order-booking',
  };

  // Tab definitions with icons - only 11 steps
  const tabDefinitions = [
    { id: 0, label: 'All Tasks', action: null, icon: <Timeline /> },
    { id: 1, label: 'Log & Qualify Leads', action: 'Log & Qualify Leads', icon: <Person /> },
    { id: 2, label: 'Initial Call', action: 'Initial Call & Requirement Gathering', icon: <Assignment /> },
    { id: 3, label: 'Evaluate Prospects', action: 'Evaluate High-Value Prospects', icon: <Star /> },
    { id: 4, label: 'Check Feasibility', action: 'Check feasibility', icon: <TrendingUp /> },
    { id: 5, label: 'Confirm Standards', action: 'Confirm standards and compliance', icon: <CheckCircle /> },
    { id: 6, label: 'Send Quotation', action: 'Send Quotation', icon: <Edit /> },
    { id: 7, label: 'Approve Payment Terms', action: 'Approve Payment Terms', icon: <CheckCircle /> },
    { id: 8, label: 'Sample Submission', action: 'Sample Submission', icon: <Assignment /> },
    { id: 9, label: 'Get Approval of Sample', action: 'Get Approval of Sample', icon: <Gavel /> },
    { id: 10, label: 'Approve Strategic Deals', action: 'Approve Strategic Deals', icon: <Star /> },
    { id: 11, label: 'Order Booking', action: 'Order Booking', icon: <Assignment /> }
  ];

  useEffect(() => {
    loadSalesFlowSteps();
  }, []);

  const loadSalesFlowSteps = async () => {
    try {
      setLoading(true);
      
      // First, cleanup any completed flows
      try {
        const cleanupResult = await salesFlowService.deleteCompletedSalesFlows();
        if (cleanupResult.deletedSteps > 0 || cleanupResult.deletedFlows > 0) {
        }
      } catch (cleanupError) {
        console.error('Error during auto-cleanup:', cleanupError);
        // Don't fail the entire load if cleanup fails
      }
      
      // Then load the active sales flow steps
      const steps = await salesFlowService.getAllSalesFlowSteps();
      setSalesFlowSteps(steps);
      setError(null);
    } catch (err) {
      console.error('Error loading sales flow steps:', err);
      setError('Failed to load sales flow steps. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleCleanupCompletedFlows = async () => {
    // Show confirmation dialog
    const confirmed = window.confirm(
      'Are you sure you want to delete all completed sales flows? This action cannot be undone.'
    );
    
    if (!confirmed) {
      return;
    }
    
    try {
      setLoading(true);
      const result = await salesFlowService.deleteCompletedSalesFlows();
      
      setSnackbar({
        open: true,
        message: `Cleanup completed! Deleted ${result.deletedSteps} steps and ${result.deletedFlows} flows.`,
        severity: 'success'
      });
      
      // Reload the sales flow steps after cleanup
      await loadSalesFlowSteps();
    } catch (err) {
      console.error('Error cleaning up completed flows:', err);
      setSnackbar({
        open: true,
        message: 'Failed to cleanup completed flows. Please try again.',
        severity: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRowClick = (step) => {
    const nextStep = parseInt(step.NextStep);
    
    // Store step data in session storage for the next component
    sessionStorage.setItem('currentSalesFlowStep', JSON.stringify(step));
    
    // Get route from mapping
    const route = stepNumberToRoute[nextStep];
    if (route) {
      navigate(route);
    } else {
      setSnackbar({
        open: true,
        message: 'No route available for this step',
        severity: 'warning'
      });
    }
  };

  const handleTakeAction = (step, event) => {
    // Stop event propagation to prevent row click
    if (event) {
      event.stopPropagation();
    }
    
    const nextStep = parseInt(step.NextStep);
    const stepDef = stepDefinitions[nextStep];
    
    // Access control: user role must match step definition role AND AssignedTo field matches user role or email
    const assignedTo = (step.AssignedTo || '').toLowerCase();
    const userRole = (user?.role || '').toLowerCase();
    const userEmail = (user?.email || '').toLowerCase();
    const canAccessStep = (stepDef && stepDef.role === user?.role) && (assignedTo === userRole || assignedTo === userEmail);
    
    // Debug logging for handleTakeAction
    if (canAccessStep) {
      // Store step data in session storage for the next component
      sessionStorage.setItem('currentSalesFlowStep', JSON.stringify(step));
      
      // Get route from mapping
      const route = stepNumberToRoute[nextStep];
      if (route) {
        navigate(route);
      } else {
        setSnackbar({
          open: true,
          message: 'No action available for this step',
          severity: 'warning'
        });
      }
    } else {
      setSnackbar({
        open: true,
        message: 'You are not assigned to this step',
        severity: 'warning'
      });
    }
  };

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  // Filter data based on active tab
  const getFilteredData = () => {
    if (activeTab === 0) {
      // All Tasks - show all data
      return salesFlowSteps;
    } else {
      // Individual action tab - filter by NextStep
      const nextStepNumber = activeTab;
      return salesFlowSteps.filter(step => {
        const nextStep = parseInt(step.NextStep);
        return nextStep === nextStepNumber;
      });
    }
  };

  // Get filtered data
  const tabFilteredData = getFilteredData();

  // Paginate data
  const paginatedData = tabFilteredData.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage
  );

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'completed':
        return 'success';
      case 'in progress':
        return 'warning';
      case 'rejected':
        return 'error';
      case 'new':
        return 'info';
      default:
        return 'default';
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority?.toLowerCase()) {
      case 'high':
        return 'error';
      case 'medium':
        return 'warning';
      case 'low':
        return 'success';
      default:
        return 'default';
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString();
  };

  const handleRefresh = () => {
    loadSalesFlowSteps();
  };

  // Pagination handlers
  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleViewDetails = (step) => {
    // Store step data in session storage for the details component
    sessionStorage.setItem('currentSalesFlowStep', JSON.stringify(step));
    // Navigate to details page
    navigate('/sales-flow/details');
  };

  const handleDelete = async (step) => {
    // Show confirmation dialog
    const confirmed = window.confirm(
      `Are you sure you want to delete sales flow ${step.LogId}? This will delete all steps and related data. This action cannot be undone.`
    );
    
    if (!confirmed) {
      return;
    }
    
    try {
      setLoading(true);
      const result = await salesFlowService.deleteSalesFlow(step.LogId);
      
      setSnackbar({
        open: true,
        message: result.message || `Sales flow ${step.LogId} deleted successfully!`,
        severity: 'success'
      });
      
      // Reload the sales flow steps after deletion
      await loadSalesFlowSteps();
    } catch (err) {
      console.error('Error deleting sales flow:', err);
      setSnackbar({
        open: true,
        message: `Failed to delete sales flow ${step.LogId}. Please try again.`,
        severity: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Box 
        display="flex" 
        flexDirection="column"
        justifyContent="center" 
        alignItems="center" 
        minHeight="400px"
        sx={{
          background: 'linear-gradient(135deg, #00bcd4 0%, #0097a7 100%)',
          borderRadius: 3,
          p: 4
        }}
      >
        <CircularProgress size={60} sx={{ color: 'white', mb: 2 }} />
        <Typography variant="h6" color="white" sx={{ fontWeight: 300 }}>
          Loading Sales Flow Data...
        </Typography>
      </Box>
    );
  }

  return (
    <Box 
      sx={{ 
        width: "100%",
      }}
    >
      {/* Main Content */}
      <Box>
          {/* Global Search Box */}
          <Box sx={{ mb: 3, display: 'flex', justifyContent: 'center' }}>
            <TextField
              placeholder="Search sales flow (leads, quotations, clients, orders)..."
              value={globalSearchQuery}
              onChange={(e) => setGlobalSearchQuery(e.target.value)}
              size="medium"
              sx={{ 
                width: '100%',
                maxWidth: 600,
                '& .MuiOutlinedInput-root': {
                  borderRadius: 3,
                  backgroundColor: 'rgba(255, 255, 255, 0.95)',
                  boxShadow: '0 4px 12px rgba(0, 188, 212, 0.15)',
                  '&:hover': {
                    boxShadow: '0 6px 16px rgba(0, 188, 212, 0.2)',
                  },
                  '&.Mui-focused': {
                    boxShadow: '0 6px 16px rgba(0, 188, 212, 0.25)',
                  }
                }
              }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Search sx={{ color: '#00bcd4' }} />
                  </InputAdornment>
                ),
              }}
            />
          </Box>
          
          <Slide direction="left" in timeout={600}>
            <Box>
              {activeTab === 0 && <SalesDashboard />}
              
              {activeTab !== 0 && (
                <Box>
                  {/* Error Alert */}
                  {error && (
                    <Zoom in>
                      <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }}>
                        {error}
                      </Alert>
                    </Zoom>
                  )}

                  {/* Enhanced Table */}
                  <Card sx={{ 
                    borderRadius: 3,
                    boxShadow: '0 8px 32px rgba(0,0,0,0.1)',
                    overflow: 'hidden'
                  }}>
              
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow sx={{ 
                      background: 'linear-gradient(135deg, #00bcd4 0%, #0097a7 100%)'
                    }}>
                      <TableCell sx={{ color: 'white', fontWeight: 700, fontSize: '0.95rem' }}>Log ID</TableCell>
                      <TableCell sx={{ color: 'white', fontWeight: 700, fontSize: '0.95rem' }}>Next Step</TableCell>
                      <TableCell sx={{ color: 'white', fontWeight: 700, fontSize: '0.95rem' }}>Role</TableCell>
                      <TableCell sx={{ color: 'white', fontWeight: 700, fontSize: '0.95rem' }}>Action</TableCell>
                      <TableCell sx={{ color: 'white', fontWeight: 700, fontSize: '0.95rem' }}>Status</TableCell>
                      <TableCell sx={{ color: 'white', fontWeight: 700, fontSize: '0.95rem' }}>Assigned To</TableCell>
                      <TableCell sx={{ color: 'white', fontWeight: 700, fontSize: '0.95rem' }}>TAT</TableCell>
                      <TableCell sx={{ color: 'white', fontWeight: 700, fontSize: '0.95rem' }}>TAT Status</TableCell>
                      <TableCell sx={{ color: 'white', fontWeight: 700, fontSize: '0.95rem' }}>Start Time</TableCell>
                      <TableCell sx={{ color: 'white', fontWeight: 700, fontSize: '0.95rem' }}>End Time</TableCell>
                      <TableCell sx={{ color: 'white', fontWeight: 700, fontSize: '0.95rem' }}>Routing</TableCell>
                      <TableCell sx={{ color: 'white', fontWeight: 700, fontSize: '0.95rem' }}>Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {paginatedData.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={12} align="center" sx={{ py: 8 }}>
                          <Box display="flex" flexDirection="column" alignItems="center" gap={2}>
                            <Avatar sx={{ 
                              width: 80, 
                              height: 80, 
                              background: 'linear-gradient(135deg, #00bcd4 0%, #0097a7 100%)',
                              mb: 2
                            }}>
                              <Timeline sx={{ fontSize: 40 }} />
                            </Avatar>
                            <Typography variant="h6" color="textSecondary" sx={{ fontWeight: 500 }}>
                              No sales flow steps found
                            </Typography>
                            <Typography variant="body2" color="textSecondary">
                              Create a new lead to get started with the sales flow
                            </Typography>
                          </Box>
                        </TableCell>
                      </TableRow>
                    ) : (
                      paginatedData.map((step, index) => {
                        const nextStep = parseInt(step.NextStep);
                        const stepDef = stepDefinitions[nextStep];
                                                 // Access control: user role must match step definition role AND AssignedTo field matches user role or email
                         const assignedTo = (step.AssignedTo || '').toLowerCase();
                         const userRole = (user?.role || '').toLowerCase();
                         const userEmail = (user?.email || '').toLowerCase();
                         const canTakeAction = stepDef && stepDef.role === user?.role && (assignedTo === userRole || assignedTo === userEmail);
                         
                         // Debug logging to understand the access control issue
                        return (
                          <Fade in timeout={300 + index * 100} key={`${step.LogId}-${step.StepId}`}>
                            <TableRow 
                              hover 
                              onClick={() => handleRowClick(step)}
                              sx={{ 
                                cursor: 'pointer',
                                transition: 'all 0.3s ease',
                                '&:hover': {
                                  backgroundColor: 'rgba(0, 188, 212, 0.04)',
                                  transform: 'translateY(-2px)',
                                  boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                                }
                              }}
                            >
                              <TableCell>
                                <Typography variant="body2" fontWeight="bold" color="primary" sx={{ fontSize: '1rem' }}>
                                  {step.LogId}
                                </Typography>
                              </TableCell>
                              <TableCell>
                                <Box display="flex" alignItems="center" gap={1} flexWrap="wrap">
                                  <Chip 
                                    label={`Step ${nextStep}`} 
                                    size="small" 
                                    color="primary" 
                                    variant="outlined"
                                    sx={{ 
                                      fontWeight: 600,
                                      borderWidth: 2
                                    }}
                                  />
                                  {step.SkippedSteps && (() => {
                                    try {
                                      const skippedSteps = JSON.parse(step.SkippedSteps);
                                      if (Array.isArray(skippedSteps) && skippedSteps.length > 0) {
                                        return (
                                          <Tooltip title={`Skipped steps: ${skippedSteps.join(', ')}`} arrow>
                                            <Chip
                                              label="Skipped"
                                              size="small"
                                              color="info"
                                              sx={{
                                                fontWeight: 600,
                                                backgroundColor: theme.palette.info.main,
                                                color: theme.palette.info.contrastText
                                              }}
                                            />
                                          </Tooltip>
                                        );
                                      }
                                    } catch (e) {
                                      // Invalid JSON, ignore
                                    }
                                    return null;
                                  })()}
                                </Box>
                              </TableCell>
                              <TableCell>
                                <Box display="flex" alignItems="center" gap={1}>
                                  <Avatar sx={{ 
                                    width: 24, 
                                    height: 24, 
                                    background: 'linear-gradient(135deg, #00bcd4 0%, #0097a7 100%)',
                                    fontSize: '0.75rem'
                                  }}>
                                    {stepDef?.role?.charAt(0)}
                                  </Avatar>
                                  <Typography variant="body2" color="textSecondary" sx={{ fontWeight: 500 }}>
                                    {stepDef?.role || '-'}
                                  </Typography>
                                </Box>
                              </TableCell>
                              <TableCell>
                                <Box display="flex" alignItems="center" gap={1}>
                                  {stepDef?.icon}
                                  <Typography variant="body2" sx={{ fontWeight: 500 }}>
                                    {stepDef?.action || '-'}
                                  </Typography>
                                </Box>
                              </TableCell>
                              <TableCell>
                                <Chip 
                                  label={'Pending'} 
                                  size="small" 
                                  color={getStatusColor('Pending')}
                                  sx={{ fontWeight: 600 }}
                                />
                              </TableCell>
                              <TableCell>
                                <Typography variant="body2" color="textSecondary" sx={{ fontWeight: 500 }}>
                                  {stepDef?.role || '-'}
                                </Typography>
                              </TableCell>
                              <TableCell>
                                <Box display="flex" alignItems="center" gap={1}>
                                  <Speed sx={{ fontSize: 16, color: 'text.secondary' }} />
                                  <Typography variant="body2" sx={{ fontWeight: 500 }}>
                                    {step.TAT || '-'} days
                                  </Typography>
                                </Box>
                              </TableCell>
                              <TableCell>
                                <Chip 
                                  label={step.TATStatus || 'On Time'} 
                                  size="small" 
                                  color={step.TATStatus === 'Breached' ? 'error' : 'success'}
                                  sx={{ fontWeight: 600 }}
                                />
                              </TableCell>
                              <TableCell>
                                <Typography variant="body2" color="textSecondary" sx={{ fontWeight: 500 }}>
                                  {formatDate(step.StartTime)}
                                </Typography>
                              </TableCell>
                              <TableCell>
                                <Typography variant="body2" color="textSecondary" sx={{ fontWeight: 500 }}>
                                  {formatDate(step.EndTime)}
                                </Typography>
                              </TableCell>
                              <TableCell>
                                {step.RoutingReason ? (
                                  <Tooltip title={step.RoutingReason} arrow>
                                    <Chip
                                      label="Routing"
                                      size="small"
                                      color="secondary"
                                      sx={{
                                        fontWeight: 600,
                                        maxWidth: 150,
                                        '& .MuiChip-label': {
                                          overflow: 'hidden',
                                          textOverflow: 'ellipsis'
                                        }
                                      }}
                                    />
                                  </Tooltip>
                                ) : (
                                  <Typography variant="body2" color="textSecondary" sx={{ fontWeight: 500 }}>
                                    -
                                  </Typography>
                                )}
                              </TableCell>
                              <TableCell>
                                <Box display="flex" gap={1} alignItems="center">
                                  {/* WhatsApp Button */}
                                  <WhatsAppButton
                                    task={{
                                      POId: step.LogId,
                                      DispatchUniqueId: step.LogId,
                                      ClientCode: step.CustomerName || step.CompanyName,
                                      ClientName: step.CustomerName || step.CompanyName,
                                      Status: step.Status || 'PENDING',
                                      CurrentStep: step.NextStep,
                                      Email: step.Email,
                                      PhoneNumber: step.PhoneNumber
                                    }}
                                    stageName={(() => {
                                      const stepNameMap = {
                                        1: 'LOG_AND_QUALIFY_LEADS',
                                        2: 'INITIAL_CALL',
                                        3: 'EVALUATE_PROSPECTS',
                                        4: 'CHECK_FEASIBILITY',
                                        5: 'CONFIRM_STANDARDS',
                                        6: 'SEND_QUOTATION',
                                        7: 'APPROVE_PAYMENT_TERMS',
                                        8: 'SAMPLE_SUBMISSION',
                                        9: 'GET_SAMPLE_APPROVAL',
                                        10: 'APPROVE_STRATEGIC_DEALS',
                                        11: 'ORDER_BOOKING',
                                        12: 'PLAN_MANUFACTURING',
                                        13: 'PACK_DISPATCH',
                                        14: 'GENERATE_INVOICE',
                                        15: 'FOLLOW_UP_PAYMENT'
                                      };
                                      return stepNameMap[nextStep] || 'LOG_AND_QUALIFY_LEADS';
                                    })()}
                                    status={step.Status || 'NEW'}
                                    size="small"
                                    variant="icon"
                                  />
                                  <Tooltip title="View Details">
                                    <IconButton
                                      size="small"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleViewDetails(step);
                                      }}
                                      sx={{ 
                                        color: '#00bcd4',
                                        '&:hover': {
                                          backgroundColor: 'rgba(0, 188, 212, 0.1)'
                                        }
                                      }}
                                    >
                                      <Visibility />
                                    </IconButton>
                                  </Tooltip>
                                  <Tooltip title="Delete">
                                    <IconButton
                                      size="small"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleDelete(step);
                                      }}
                                      sx={{ 
                                        color: '#f44336',
                                        '&:hover': {
                                          backgroundColor: 'rgba(244, 67, 54, 0.1)'
                                        }
                                      }}
                                    >
                                      <Delete />
                                    </IconButton>
                                  </Tooltip>
                                  <Button
                                    variant="contained"
                                    size="small"
                                    startIcon={<CheckCircle />}
                                    onClick={(e) => handleTakeAction(step, e)}
                                    disabled={!canTakeAction}
                                    sx={{ 
                                      background: canTakeAction 
                                        ? 'linear-gradient(135deg, #4CAF50 0%, #45a049 100%)'
                                        : 'linear-gradient(135deg, #9e9e9e 0%, #757575 100%)',
                                      color: 'white',
                                      fontWeight: 600,
                                      px: 2,
                                      py: 0.5,
                                      borderRadius: 2,
                                      boxShadow: canTakeAction ? '0 4px 12px rgba(76, 175, 80, 0.3)' : 'none',
                                      transition: 'all 0.3s ease',
                                      '&:hover': {
                                        transform: canTakeAction ? 'translateY(-2px)' : 'none',
                                        boxShadow: canTakeAction ? '0 6px 20px rgba(76, 175, 80, 0.4)' : 'none'
                                      }
                                    }}
                                  >
                                    Take Action
                                  </Button>
                                </Box>
                              </TableCell>
                            </TableRow>
                          </Fade>
                        );
                      })
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
              
              {/* Pagination */}
              {tabFilteredData.length > 0 && (
                <Box sx={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'center',
                  p: 2,
                  borderTop: '1px solid rgba(0, 188, 212, 0.1)',
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
                            borderColor: 'rgba(0, 188, 212, 0.3)',
                          },
                          '&:hover .MuiOutlinedInput-notchedOutline': {
                            borderColor: 'rgba(0, 188, 212, 0.5)',
                          },
                          '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                            borderColor: '#00bcd4',
                          }
                        }}
                      >
                        <MenuItem value={5}>5</MenuItem>
                        <MenuItem value={10}>10</MenuItem>
                        <MenuItem value={15}>15</MenuItem>
                        <MenuItem value={25}>25</MenuItem>
                      </Select>
                    </FormControl>
                  </Box>

                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                    <Typography variant="body2" sx={{ color: '#6c757d', fontWeight: 500 }}>
                      {page * rowsPerPage + 1}-{Math.min((page + 1) * rowsPerPage, tabFilteredData.length)} of {tabFilteredData.length} steps
                    </Typography>
                    
                    {Math.ceil(tabFilteredData.length / rowsPerPage) > 1 && (
                      <Pagination
                        count={Math.ceil(tabFilteredData.length / rowsPerPage)}
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
                              background: 'linear-gradient(135deg, #00bcd4 0%, #0097a7 100%)',
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
                </Card>
                </Box>
              )}
            </Box>
          </Slide>
        </Box>

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
  );
};

export default SalesFlow; 