import React, { useState, useEffect, useMemo } from 'react';
import { 
  Box, 
  Typography, 
  Paper, 
  Stepper, 
  Step, 
  StepLabel,
  Grid,
  Card,
  CardContent,
  Button,
  useTheme,
  Chip,
  Tooltip,
  Alert,
  Tabs,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Collapse,
  Snackbar,
  IconButton,
  Pagination,
  CircularProgress,
  TextField,
  InputAdornment,
  Select,
  MenuItem,
  FormControl,
  Stack,
  Fade,
  Slide,
  alpha,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
} from '@mui/material';
import { useAuth } from '../../context/AuthContext';
import StepAction from './StepAction';
import sheetService from '../../services/sheetService';
import config from '../../config/config';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import RadioButtonUncheckedIcon from '@mui/icons-material/RadioButtonUnchecked';
import CircleIcon from '@mui/icons-material/Circle';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  ExpandMore, 
  ExpandLess, 
  Search,
  Refresh,
  ShoppingCart as PurchaseIcon,
  Assignment as AssignmentIcon,
  Dashboard as DashboardIcon,
  Insights as InsightsIcon,
  TrendingUp as TrendingIcon,
  Speed as SpeedIcon,
} from '@mui/icons-material';
import purchaseFlowService from '../../services/purchaseFlowService';
import KPICard from '../common/KPICard';
import WhatsAppButton from '../common/WhatsAppButton';
import whatsappMessageService from '../../services/whatsappMessageService';
import RaiseIndent from './RaiseIndent';

// Common color for all 21 Purchase Flow steps
const PURCHASE_FLOW_STEP_COLOR = "#4caf50";

// Debug logging
// Dashboard Component
const PurchaseDashboard = () => {
  const theme = useTheme();
  const [dashboardData, setDashboardData] = useState({
    activeIndents: 0,
    activePOs: 0,
    activeVendors: 0,
    avgProcessingTime: 0,
    loading: true,
  });
  const [previousData, setPreviousData] = useState(null);

  // Calculate real-time dashboard metrics
  const loadDashboardData = async () => {
    try {
      // Fetch all required data
      const [indents, pos, vendors, stepsData] = await Promise.all([
        purchaseFlowService.getAllIndents(),
        sheetService.getSheetData('SortVendor'),
        sheetService.getSheetData('Vendor'),
        sheetService.getSheetData('PurchaseFlowSteps'),
      ]);

      // Calculate Active Indents (pending indents with NextStep < 10)
      const activeIndents = indents.filter(indent => {
        if (!indent.Steps || indent.Steps.length === 0) return true;
        const currentStep = indent.Steps[indent.Steps.length - 1];
        const nextStep = Number(currentStep?.NextStep || currentStep?.nextStep || 0);
        return nextStep < 10 && nextStep > 0;
      }).length;

      // Calculate Active POs (POs in progress - not completed)
      const activePOs = pos.filter(po => {
        const status = (po.Status || po.status || '').toLowerCase();
        return status !== 'completed' && status !== 'closed' && po.POId;
      }).length;

      // Calculate Active Vendors (vendors with Vendor Code)
      const activeVendors = vendors.filter(v => v['Vendor Code'] || v.VendorCode).length;

      // Calculate Average Processing Time (TAT) from completed indents
      let totalDays = 0;
      let completedCount = 0;
      
      indents.forEach(indent => {
        if (indent.Steps && indent.Steps.length > 0) {
          const lastStep = indent.Steps[indent.Steps.length - 1];
          if (lastStep.Status === 'completed' && lastStep.StartTime && lastStep.EndTime) {
            const start = new Date(lastStep.StartTime);
            const end = new Date(lastStep.EndTime);
            if (!isNaN(start.getTime()) && !isNaN(end.getTime())) {
              const days = Math.ceil((end - start) / (1000 * 60 * 60 * 24));
              if (days > 0 && days < 365) { // Reasonable range
                totalDays += days;
                completedCount++;
              }
            }
          }
        }
      });

      const avgProcessingTime = completedCount > 0 ? Math.round(totalDays / completedCount) : 0;

      // Calculate trends (compare with previous data)
      const trends = {
        indents: previousData ? calculateTrend(activeIndents, previousData.activeIndents) : null,
        pos: previousData ? calculateTrend(activePOs, previousData.activePOs) : null,
        vendors: previousData ? calculateTrend(activeVendors, previousData.activeVendors) : null,
        processingTime: previousData ? calculateTrend(avgProcessingTime, previousData.avgProcessingTime, true) : null,
      };

      // Store current data as previous for next calculation
      setPreviousData({
        activeIndents,
        activePOs,
        activeVendors,
        avgProcessingTime,
      });

      setDashboardData({
        activeIndents,
        activePOs,
        activeVendors,
        avgProcessingTime,
        trends,
        loading: false,
      });
    } catch (error) {
      console.error('Error loading dashboard data:', error);
      setDashboardData(prev => ({ ...prev, loading: false }));
    }
  };

  // Helper function to calculate trend percentage
  const calculateTrend = (current, previous, isTime = false) => {
    if (!previous || previous === 0) return null;
    const diff = current - previous;
    const percentChange = Math.round((diff / previous) * 100);
    
    if (isTime) {
      // For time, negative is good (faster)
      const sign = diff > 0 ? '+' : '';
      const valueStr = diff !== 0 ? `${sign}${diff}d` : '0d';
      return {
        value: valueStr,
        isPositive: diff < 0, // Negative change is positive (faster)
      };
    } else {
      const sign = percentChange > 0 ? '+' : '';
      return {
        value: `${sign}${percentChange}%`,
        isPositive: percentChange > 0,
      };
    }
  };

  // Load data on mount and set up auto-refresh
  useEffect(() => {
    loadDashboardData();
    // Refresh every 30 seconds
    const interval = setInterval(loadDashboardData, 30000);
    return () => clearInterval(interval);
  }, []);

  // Calculate progress percentages (based on targets or historical averages)
  const calculateProgress = (value, maxValue = 100) => {
    return Math.min(Math.round((value / maxValue) * 100), 100);
  };

  const kpiCards = useMemo(() => [
    {
      title: "Active Indents",
      description: "Purchase requests awaiting processing and approval.",
      value: String(dashboardData.activeIndents),
      subtitle: "Pending Indents",
      icon: <AssignmentIcon />,
      progress: calculateProgress(dashboardData.activeIndents, 50),
      trend: dashboardData.trends?.indents?.value || "0%",
      trendUp: dashboardData.trends?.indents?.isPositive ?? true,
      variant: "default",
      color: "success",
    },
    {
      title: "Active POs",
      description: "Purchase orders in progress and awaiting delivery.",
      value: String(dashboardData.activePOs),
      subtitle: "In Progress",
      icon: <PurchaseIcon />,
      progress: calculateProgress(dashboardData.activePOs, 30),
      trend: dashboardData.trends?.pos?.value || "0%",
      trendUp: dashboardData.trends?.pos?.isPositive ?? true,
      variant: "gradient",
      color: "success",
    },
    {
      title: "Vendor Management",
      description: "Active vendors and quotation tracking.",
      value: String(dashboardData.activeVendors),
      subtitle: "Active Vendors",
      icon: <SpeedIcon />,
      progress: calculateProgress(dashboardData.activeVendors, 100),
      trend: dashboardData.trends?.vendors?.value || "0%",
      trendUp: dashboardData.trends?.vendors?.isPositive ?? true,
      variant: "default",
      color: "success",
    },
    {
      title: "Processing Time",
      description: "Average time from indent to delivery.",
      value: dashboardData.avgProcessingTime > 0 ? `${dashboardData.avgProcessingTime}d` : "N/A",
      subtitle: "Avg. TAT",
      icon: <TrendingIcon />,
      progress: dashboardData.avgProcessingTime > 0 ? calculateProgress(100 - Math.min(dashboardData.avgProcessingTime * 5, 100), 100) : 0,
      trend: dashboardData.trends?.processingTime?.value || "0d",
      trendUp: dashboardData.trends?.processingTime?.isPositive ?? true,
      variant: "gradient",
      color: "success",
    },
  ], [dashboardData]);

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
                background: `linear-gradient(135deg, ${theme.palette.success.main}, ${theme.palette.success.dark})`,
                backgroundClip: "text",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                mb: 1,
                fontSize: { xs: '1.75rem', sm: '2.125rem', md: '2.5rem' },
              }}
            >
              Procurement Dashboard
            </Typography>
            <Typography 
              variant="h6" 
              color="text.secondary"
              sx={{ 
                fontSize: { xs: '1rem', sm: '1.1rem' },
                fontWeight: 400,
              }}
            >
              Real-time insights and analytics for your purchase operations
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
              backgroundColor: theme.palette.success.main,
              '&:hover': {
                backgroundColor: theme.palette.success.dark,
              },
            }}
          >
            View Analytics
          </Button>
        </Stack>
      </Box>
      
      {/* KPI Cards Grid Layout */}
      {dashboardData.loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 300 }}>
          <CircularProgress size={60} sx={{ color: theme.palette.success.main }} />
        </Box>
      ) : (
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
      )}

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
              background: `linear-gradient(135deg, ${alpha(theme.palette.success.main, 0.1)} 0%, ${alpha(theme.palette.success.main, 0.05)} 100%)`,
              borderBottom: `1px solid ${theme.palette.divider}`,
            }}
          >
            <CardContent sx={{ py: 3 }}>
              <Stack direction="row" alignItems="center" spacing={3}>
                <Box 
                  sx={{ 
                    p: 2, 
                    borderRadius: 3,
                    backgroundColor: alpha(theme.palette.success.main, 0.1),
                    color: theme.palette.success.main,
                  }}
                >
                  <AssignmentIcon sx={{ fontSize: 32 }} />
                </Box>
                <Box>
                  <Typography 
                    variant="h4" 
                    sx={{ 
                      fontWeight: 700, 
                      color: theme.palette.success.main,
                      fontSize: { xs: '1.5rem', sm: '1.75rem', md: '2rem' },
                      mb: 0.5,
                    }}
                  >
                    Purchase Process Flow
                  </Typography>
                  <Typography variant="subtitle1" color="text.secondary">
                    Complete procurement workflow from indent to payment
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
                { step: 1, label: "Raise Indent", color: PURCHASE_FLOW_STEP_COLOR, description: "Store Manager raises purchase request", assignedTo: "Store Manager", tat: "Same day" },
                { step: 2, label: "Approve Indent", color: PURCHASE_FLOW_STEP_COLOR, description: "Process Coordinator reviews and approves", assignedTo: "Process Coordinator", tat: "Same day" },
                { step: 3, label: "Float RFQ", color: PURCHASE_FLOW_STEP_COLOR, description: "Purchase Executive sends quotation requests", assignedTo: "Purchase Executive", tat: "1 day" },
                { step: 4, label: "Follow-up Quotations", color: PURCHASE_FLOW_STEP_COLOR, description: "Follow-up with vendors for quotes", assignedTo: "Purchase Executive", tat: "2 days" },
                { step: 5, label: "Comparative Statement", color: PURCHASE_FLOW_STEP_COLOR, description: "Prepare vendor comparison analysis", assignedTo: "Purchase Executive", tat: "1 day" },
                { step: 6, label: "Approve Quotation", color: PURCHASE_FLOW_STEP_COLOR, description: "Management approves selected vendor", assignedTo: "Management / HOD", tat: "1 day" },
                { step: 7, label: "Request Sample", color: PURCHASE_FLOW_STEP_COLOR, description: "Request and follow-up for material samples", assignedTo: "Purchase Executive", tat: "3 days" },
                { step: 8, label: "Inspect Sample", color: PURCHASE_FLOW_STEP_COLOR, description: "QC Manager inspects sample quality", assignedTo: "QC Manager", tat: "1 day" },
                { step: 9, label: "Sort Vendors", color: PURCHASE_FLOW_STEP_COLOR, description: "Final vendor selection and ranking", assignedTo: "Purchase Executive", tat: "Same day" },
                { step: 10, label: "Place PO", color: PURCHASE_FLOW_STEP_COLOR, description: "Issue purchase order to selected vendor", assignedTo: "Purchase Executive", tat: "Same day" },
                { step: 11, label: "Follow-up Delivery", color: PURCHASE_FLOW_STEP_COLOR, description: "Track and follow-up material delivery", assignedTo: "Purchase Executive", tat: "As per PO" },
                { step: 12, label: "Receive Material", color: PURCHASE_FLOW_STEP_COLOR, description: "Store Manager receives and inspects material", assignedTo: "Store Manager", tat: "1 day" },
                { step: 13, label: "Material Approval", color: PURCHASE_FLOW_STEP_COLOR, description: "QC Manager approves received material", assignedTo: "QC Manager", tat: "Same day" },
                { step: 14, label: "Rejection Decision", color: PURCHASE_FLOW_STEP_COLOR, description: "Purchase Executive decides on rejected material", assignedTo: "Purchase Executive", tat: "1 day" },
                { step: 15, label: "Return Material", color: PURCHASE_FLOW_STEP_COLOR, description: "Store Manager returns rejected material", assignedTo: "Store Manager", tat: "1 day" },
                { step: 16, label: "Resend Material", color: PURCHASE_FLOW_STEP_COLOR, description: "Purchase Executive arranges replacement", assignedTo: "Purchase Executive", tat: "3-5 days" },
                { step: 17, label: "Generate GRN", color: PURCHASE_FLOW_STEP_COLOR, description: "Store Manager generates goods receipt note", assignedTo: "Store Manager", tat: "Same day" },
                { step: 18, label: "Final GRN", color: PURCHASE_FLOW_STEP_COLOR, description: "Complete goods receipt documentation", assignedTo: "Store Manager", tat: "Same day" },
                { step: 19, label: "Submit Invoice", color: PURCHASE_FLOW_STEP_COLOR, description: "Purchase Executive submits invoice to accounts", assignedTo: "Purchase Executive", tat: "1 day" },
                { step: 20, label: "Schedule Payment", color: PURCHASE_FLOW_STEP_COLOR, description: "Accounts Executive schedules payment", assignedTo: "Accounts Executive", tat: "As per credit" },
                { step: 21, label: "Release Payment", color: PURCHASE_FLOW_STEP_COLOR, description: "Accounts Executive approves and releases payment", assignedTo: "Accounts Executive", tat: "On/before due" },
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
            
            {/* Purchase Flow Example */}
            <Alert 
              severity="info" 
              sx={{ 
                borderRadius: 3,
                backgroundColor: alpha(theme.palette.info.main, 0.05),
                border: `1px solid ${alpha(theme.palette.info.main, 0.1)}`,
                '& .MuiAlert-icon': {
                  color: theme.palette.info.main,
                },
              }}
            >
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
                Complete 21-Step Purchase Process Flow
              </Typography>
              <Typography 
                variant="body2" 
                sx={{ 
                  lineHeight: 1.6,
                  mb: 2,
                  '& strong': { fontWeight: 600 },
                }}
              >
                This comprehensive flow covers the entire procurement lifecycle from initial indent to final payment, 
                ensuring quality control, proper approvals, and efficient vendor management at each stage.
              </Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 2 }}>
                <Chip label="Indent & Approval (Steps 1-2)" size="small" variant="outlined" />
                <Chip label="RFQ & Quotations (Steps 3-5)" size="small" variant="outlined" />
                <Chip label="Sample & Selection (Steps 6-9)" size="small" variant="outlined" />
                <Chip label="PO & Delivery (Steps 10-12)" size="small" variant="outlined" />
                <Chip label="Quality Control (Steps 13-16)" size="small" variant="outlined" />
                <Chip label="Documentation (Steps 17-18)" size="small" variant="outlined" />
                <Chip label="Payment Process (Steps 19-21)" size="small" variant="outlined" />
              </Box>
            </Alert>
          </CardContent>
        </Card>
      </Fade>
    </Box>
  );
};

const steps = [
  { id: 1, assignedTo: 'Store Manager', action: 'Raise Indent', tat: 'Same day' },
  { id: 2, assignedTo: 'Process Coordinator', action: 'Approve Indent', tat: 'Same day' },
  { id: 3, assignedTo: 'Purchase Executive', action: 'Float RFQ', tat: '1 day' },
  { id: 4, assignedTo: 'Purchase Executive', action: 'Follow-up for Quotations', tat: '2 days' },
  { id: 5, assignedTo: 'Purchase Executive', action: 'Prepare Comparative Statement', tat: '1 day' },
  { id: 6, assignedTo: 'Management / HOD', action: 'Approve Quotation', tat: '1 day' },
  { id: 7, assignedTo: 'Purchase Executive', action: 'Request & Follow-up for Sample', tat: '3 days' },
  { id: 8, assignedTo: 'QC Manager', action: 'Inspect Sample', tat: '1 day' },
  { id: 9, assignedTo: 'Purchase Executive', action: 'Sort Vendors', tat: 'Same day' },
  { id: 10, assignedTo: 'Purchase Executive', action: 'Place PO', tat: 'Same day' },
  { id: 11, assignedTo: 'Purchase Executive', action: 'Follow-up for Delivery', tat: 'As per PO' },
  { id: 12, assignedTo: 'Store Manager', action: 'Receive & Inspect Material', tat: '1 day' },
  { id: 13, assignedTo: 'QC Manager', action: 'Material Approval', tat: 'Same day' },
  { id: 14, assignedTo: 'Purchase Executive', action: 'Decision on Rejection', tat: '1 day' },
  { id: 15, assignedTo: 'Store Manager', action: 'Return Rejected Material', tat: '1 day' },
  { id: 16, assignedTo: 'Purchase Executive', action: 'Resend Material', tat: '3-5 days' },
  { id: 17, assignedTo: 'Store Manager', action: 'Generate GRN', tat: 'Same day' },
  { id: 18, assignedTo: 'Store Manager', action: 'Final GRN', tat: 'Same day' },
  { id: 19, assignedTo: 'Purchase Executive', action: 'Submit Invoice to Accounts', tat: '1 day' },
  { id: 20, assignedTo: 'Accounts Executive', action: 'Schedule Payment', tat: 'As per credit' },
  { id: 21, assignedTo: 'Accounts Executive', action: 'Approve & Release Payment', tat: 'On/before due' }
];

const stepNames = [
  'All Tasks',
  'Raise Indent',
  'Approve Indent',
  'Float RFQ',
  'Follow-up for Quotations',
  'Prepare Comparative Statement',
  'Approve Quotation',
  'Request & Follow-up for Sample',
  'Inspect Sample',
  'Sort Vendors',
  'Place PO',
  'Follow-up for Delivery',
  'Receive & Inspect Material',
  'Material Approval',
  'Decision on Rejection',
  'Return Rejected Material',
  'Resend Material',
  'Generate GRN',
  'Final GRN',
  'Submit Invoice to Accounts',
  'Schedule Payment',
  'Approve & Release Payment',
];

const stepMappings = [
  { assignedTo: 'Store Manager', action: 'Raise Indent' },
  { assignedTo: 'Process Coordinator', action: 'Approve Indent' },
  { assignedTo: 'Purchase Executive', action: 'Float RFQ' },
  { assignedTo: 'Purchase Executive', action: 'Follow-up for Quotations' },
  { assignedTo: 'Purchase Executive', action: 'Prepare Comparative Statement' },
  { assignedTo: 'Management / HOD', action: 'Approve Quotation' },
  { assignedTo: 'Purchase Executive', action: 'Request & Follow-up for Sample' },
  { assignedTo: 'QC Manager', action: 'Inspect Sample' },
  { assignedTo: 'Purchase Executive', action: 'Sort Vendors' },
  { assignedTo: 'Purchase Executive', action: 'Place PO' },
  { assignedTo: 'Purchase Executive', action: 'Follow-up for Delivery' },
  { assignedTo: 'Store Manager', action: 'Receive & Inspect Material' },
  { assignedTo: 'QC Manager', action: 'Material Approval' },
  { assignedTo: 'Purchase Executive', action: 'Decision on Rejection' },
  { assignedTo: 'Store Manager', action: 'Return Rejected Material' },
  { assignedTo: 'Purchase Executive', action: 'Resend Material' },
  { assignedTo: 'Store Manager', action: 'Generate GRN' },
  { assignedTo: 'Store Manager', action: 'Final GRN' },
  { assignedTo: 'Purchase Executive', action: 'Submit Invoice to Accounts' },
  { assignedTo: 'Accounts Executive', action: 'Schedule Payment' },
  { assignedTo: 'Accounts Executive', action: 'Approve & Release Payment' },
];

const actionRouteMap = {
  'Raise Indent': '/purchase-flow/raise-indent',
  'Approve Indent': '/purchase-flow/approve-indent',
  'Float RFQ': '/purchase-flow/float-rfq',
  'Follow-up for Quotations': '/purchase-flow/followup-quotations',
  'Prepare Comparative Statement': '/purchase-flow/comparative-statement',
  'Approve Quotation': '/purchase-flow/approve-quotation',
  'Request & Follow-up for Sample': '/purchase-flow/request-sample',
  'Inspect Sample': '/purchase-flow/inspect-sample',
  'Sort Vendors': '/purchase-flow/sort-vendors',
  'Place PO': '/purchase-flow/place-po',
  'Follow-up for Delivery': '/purchase-flow/followup-delivery',
  'Receive & Inspect Material': '/purchase-flow/recieve-inspect-material',
  'Material Approval': '/purchase-flow/material-approval',
  'Decision on Rejection': '/purchase-flow/decision-on-rejection',
  'Return Rejected Material': '/purchase-flow/return-rejected-material',
  'Resend Material': '/purchase-flow/resend-material',
  'Generate GRN': '/purchase-flow/generate-grn',
  'Submit Invoice to Accounts': '/purchase-flow/submit-invoice',
  'Schedule Payment': '/purchase-flow/schedule-payment',
  'Approve & Release Payment': '/purchase-flow/release-payment',
};

const stepNumberToAction = {
  1: 'Raise Indent',
  2: 'Approve Indent',
  3: 'Float RFQ',
  4: 'Follow-up for Quotations',
  5: 'Prepare Comparative Statement',
  6: 'Approve Quotation',
  7: 'Request & Follow-up for Sample',
  8: 'Inspect Sample',
  9: 'Sort Vendors',
  10: 'Place PO',
  11: 'Follow-up for Delivery',
  12: 'Receive & Inspect Material',
  13: 'Material Approval',
  14: 'Decision on Rejection',
  15: 'Return Rejected Material',
  16: 'Resend Material',
  17: 'Generate GRN',
  18: 'Generate GRN',
  19: 'Submit Invoice to Accounts',
  20: 'Schedule Payment',
  21: 'Approve & Release Payment',
};

const normalizeRole = (role) => (role || '').replace(/\s*\+\s*/g, ' + ').replace(/\s+/g, ' ').trim();

// Mapping from tab index to route
const tabIndexToRoute = {
  0: '/purchase-flow', // Dashboard
  1: '/purchase-flow/raise-indent',
  2: '/purchase-flow/approve-indent',
  3: '/purchase-flow/float-rfq',
  4: '/purchase-flow/followup-quotations',
  5: '/purchase-flow/comparative-statement',
  6: '/purchase-flow/approve-quotation',
  7: '/purchase-flow/request-sample',
  8: '/purchase-flow/inspect-sample',
  9: '/purchase-flow/sort-vendors',
  10: '/purchase-flow/place-po',
  11: '/purchase-flow/followup-delivery',
  12: '/purchase-flow/recieve-inspect-material',
  13: '/purchase-flow/material-approval',
  14: '/purchase-flow/decision-on-rejection',
  15: '/purchase-flow/return-rejected-material',
  16: '/purchase-flow/resend-material',
  17: '/purchase-flow/generate-grn',
  18: '/purchase-flow/final-grn',
  19: '/purchase-flow/submit-invoice',
  20: '/purchase-flow/schedule-payment',
  21: '/purchase-flow/release-payment',
};

// Reverse mapping from route to tab index
const routeToTabIndex = Object.fromEntries(
  Object.entries(tabIndexToRoute).map(([index, route]) => [route, parseInt(index)])
);

// Helper function to get tab index from route
const getTabFromRoute = (pathname) => {
  // Check if we're on a specific step route
  const tabIndex = routeToTabIndex[pathname];
  if (tabIndex !== undefined) {
    return tabIndex;
  }
  // Default to dashboard (tab 0) if on /purchase-flow
  if (pathname === '/purchase-flow') {
    return 0;
  }
  // Default to tab 1 (Raise Indent) if route doesn't match
  return 1;
};

const PurchaseFlow = () => {
  const theme = useTheme();
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [activeStep, setActiveStep] = useState(0);
  const [userTasks, setUserTasks] = useState([]);
  const [selectedStep, setSelectedStep] = useState(null);
  const [stepStatuses, setStepStatuses] = useState({});
  const [error, setError] = useState(null);
  const [currentFlowId, setCurrentFlowId] = useState(null);
  const [showRetryButton, setShowRetryButton] = useState(false);
  
  const [trackerTab, setTrackerTab] = useState(() => getTabFromRoute(location.pathname));
  const [flowSteps, setFlowSteps] = useState([]);
  const [pos, setPos] = useState([]);
  const [openPOGroups, setOpenPOGroups] = useState({});
  
  // Global search query for Purchase Flow
  const [globalSearchQuery, setGlobalSearchQuery] = useState('');
  
  // Pagination state for indents
  const [indentsPage, setIndentsPage] = useState(0);
  const [indentsRowsPerPage, setIndentsRowsPerPage] = useState(10);
  const [indentsSearchQuery, setIndentsSearchQuery] = useState('');
  
  // Pagination state for POs
  const [posPage, setPosPage] = useState(0);
  const [posRowsPerPage, setPosRowsPerPage] = useState(10);
  const [posSearchQuery, setPosSearchQuery] = useState('');
  
  // Pagination state for steps (per indent)
  const [stepsPagination, setStepsPagination] = useState({});
  
  // Sync tab with URL changes
  useEffect(() => {
    const tabFromRoute = getTabFromRoute(location.pathname);
    setTrackerTab(tabFromRoute);
  }, [location.pathname]);

  useEffect(() => {
    // Debug logging
    // Filter tasks based on user role
    const tasks = steps.filter(step => {
      if (!step.role) return false;
      const roles = step.role.split(' + ');
      return roles.some(role => role === user?.role);
    });
    setUserTasks(tasks);

    // Load current flow data
    // loadCurrentFlow();
  }, [user]);

  const loadCurrentFlow = async () => {
    try {
      // First check if config and sheets exist
      if (!config || !config.sheets) {
        console.error('Config is not properly initialized');
        setError('Configuration is missing. Please contact your administrator.');
        return;
      }

      // Get sheet names
      const purchaseFlowSheet = config.sheets.purchaseFlow;
      const purchaseFlowStepsSheet = config.sheets.purchaseFlowSteps;

      if (!purchaseFlowSheet || !purchaseFlowStepsSheet) {
        console.error('Sheet configuration:', config.sheets);
        setError('Sheet configuration is missing. Please contact your administrator.');
        return;
      }

      try {
        // // Check if sheets exist
        // const flowSheetExists = await sheetService.doesSheetExist(purchaseFlowSheet);
        // const stepsSheetExists = await sheetService.doesSheetExist(purchaseFlowStepsSheet);

        // if (!flowSheetExists || !stepsSheetExists) {
        //   setError('Required sheets are not initialized. Please use the Sheet Initializer in the Admin section to set up the required sheets.');
        //   return;
        // }

        const flowData = await sheetService.getSheetData(purchaseFlowSheet);
        if (!flowData || flowData.length === 0) {
          setError('No purchase flows found. Please create a new flow to begin.');
          return;
        }

        const activeFlow = flowData.find(flow => flow.Status === 'In Progress');
        if (activeFlow) {
          setCurrentFlowId(activeFlow.FlowId);
          // Load step statuses
          const stepData = await sheetService.getSheetData(purchaseFlowStepsSheet);
          const flowSteps = stepData.filter(step => step.FlowId === activeFlow.FlowId);
          const statuses = {};
          flowSteps.forEach(step => {
            statuses[step.StepId] = step.Status;
          });
          setStepStatuses(statuses);
        } else {
          setError('No active purchase flow found. Please create a new flow to begin.');
        }
      } catch (error) {
        console.error('Error loading flow data:', error);
        if (error.message.includes('Authentication failed') || error.response?.status === 401) {
          setError('Authentication failed. Please sign in again to access the purchase flow.');
          // Clear any stored tokens
          sessionStorage.removeItem('googleToken');
          // Instead of reloading, we'll let the user click a button to retry
          setShowRetryButton(true);
        } else if (error.message.includes('Sheet undefined does not exist')) {
          setError('Required sheets are not initialized. Please use the Sheet Initializer in the Admin section to set up the required sheets.');
        } else {
          setError('Failed to load flow data. Please try again later.');
        }
      }
    } catch (error) {
      console.error('Error in loadCurrentFlow:', error);
      setError('An unexpected error occurred. Please try again later.');
    }
  };

  const handleStepClick = (step) => {
    setActiveStep(step);
  };

  const canPerformTask = (taskId) => {
    // First task can always be performed
    if (taskId === 1) return true;

    // Check if all previous tasks are completed
    for (let i = 1; i < taskId; i++) {
      if (stepStatuses[i] !== 'completed') {
        return false;
      }
    }
    return true;
  };

  const handleActionClick = (step) => {
    if (!canPerformTask(step.id)) {
      setError(`Cannot perform this task. Previous tasks must be completed first.`);
      return;
    }
    setError(null);
    setSelectedStep({
      ...step,
      flowId: currentFlowId
    });
  };

  const handleActionComplete = async (data) => {
    try {
      // Update local state
      setStepStatuses(prev => ({
        ...prev,
        [data.stepId]: data.status
      }));

      // If step is completed, reload flow data to get updated statuses
      if (data.status === 'completed') {
        await loadCurrentFlow();
      }
    } catch (error) {
      console.error('Error handling action completion:', error);
      setError('Failed to update step status');
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed':
        return 'success';
      case 'in_progress':
        return 'warning';
      case 'rejected':
        return 'error';
      default:
        return 'default';
    }
  };

  const getStepStatus = (stepId) => {
    return stepStatuses[stepId] || 'pending';
  };

  const isStepEnabled = (stepId) => {
    return canPerformTask(stepId);
  };

  const handleRetry = () => {
    setShowRetryButton(false);
    setError(null);
    loadCurrentFlow();
  };

  const renderError = () => {
    if (!error) return null;
    return (
      <Box sx={{ mt: 2, mb: 2 }}>
        <Alert severity="error" action={
          showRetryButton && (
            <Button color="inherit" size="small" onClick={handleRetry}>
              Retry
            </Button>
          )
        }>
          {error}
        </Alert>
      </Box>
    );
  };

  const getStepIcon = (stepId) => {
    const status = stepStatuses[stepId];
    if (status === 'completed') {
      return <CheckCircleIcon color="primary" />;
    }
    if (status === 'in_progress') {
      return <CircleIcon color="primary" />;
    }
    return <RadioButtonUncheckedIcon />;
  };

  const isNextStep = (stepId) => {
    // Find the last completed step
    const lastCompletedStep = Math.max(
      ...Object.entries(stepStatuses)
        .filter(([_, status]) => status === 'completed')
        .map(([id]) => Number(id))
    );
    
    // The next step is the one after the last completed step
    return stepId === lastCompletedStep + 1;
  };

  useEffect(() => {
    async function fetchIndents() {
      const data = await purchaseFlowService.getAllIndents();
      setFlowSteps(data);
    }
    async function fetchPOs() {
      try {
        const data = await purchaseFlowService.getPOsForDisplay();
        setPos(data);
      } catch (err) {
        console.error('Error fetching POs:', err);
        // Don't set error for POs as it's secondary data
      }
    }
    fetchIndents();
    fetchPOs();
  }, []);

  // Helper to get the current step (last in Steps array)
  const getCurrentStep = (indent) => {
    if (!indent.Steps || indent.Steps.length === 0) return null;
    return indent.Steps[indent.Steps.length - 1];
  };

  // Determine which indents to show based on the selected tab
  let visibleIndents = flowSteps;
  if (trackerTab > 0) {
    // For tab index N, show indents whose current step's NextStep is N
    visibleIndents = flowSteps.filter(indent => {
      const currentStep = getCurrentStep(indent);
      if (!currentStep) return false;
      const nextStep = Number(currentStep.NextStep || currentStep.nextStep);
      return nextStep === trackerTab;
    });
  } else {
    // For "All Tasks" tab (trackerTab === 0), filter out indents where NextStep >= 10
    visibleIndents = flowSteps.filter(indent => {
      const currentStep = getCurrentStep(indent);
      if (!currentStep) return false;
      const nextStep = Number(currentStep.NextStep || currentStep.nextStep);
      return nextStep < 10; // Only show indents with NextStep < 10
    });
  }

  // Filter indents based on search query
  const filteredIndents = visibleIndents.filter(indent => 
    indent.IndentNumber?.toLowerCase().includes(indentsSearchQuery.toLowerCase()) ||
    indent.Status?.toLowerCase().includes(indentsSearchQuery.toLowerCase()) ||
    indent.Items?.some(item => 
      item.itemCode?.toLowerCase().includes(indentsSearchQuery.toLowerCase()) ||
      item.item?.toLowerCase().includes(indentsSearchQuery.toLowerCase())
    )
  );

  // Paginate indents
  const paginatedIndents = filteredIndents.slice(
    indentsPage * indentsRowsPerPage,
    indentsPage * indentsRowsPerPage + indentsRowsPerPage
  );

  // Group flowSteps by IndentNumber (now each indent is a single row)
  const [openGroups, setOpenGroups] = useState({});
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const toggleGroup = (indentNumber) => {
    setOpenGroups((prev) => ({ ...prev, [indentNumber]: !prev[indentNumber] }));
  };

  const togglePOGroup = (poId) => {
    setOpenPOGroups((prev) => ({ ...prev, [poId]: !prev[poId] }));
  };

  // Pagination handlers for indents
  const handleIndentsChangePage = (event, newPage) => {
    setIndentsPage(newPage);
  };

  const handleIndentsChangeRowsPerPage = (event) => {
    setIndentsRowsPerPage(parseInt(event.target.value, 10));
    setIndentsPage(0);
  };

  const handleIndentsSearchChange = (event) => {
    setIndentsSearchQuery(event.target.value);
    setIndentsPage(0);
  };

  // Pagination handlers for POs
  const handlePosChangePage = (event, newPage) => {
    setPosPage(newPage);
  };

  const handlePosChangeRowsPerPage = (event) => {
    setPosRowsPerPage(parseInt(event.target.value, 10));
    setPosPage(0);
  };

  const handlePosSearchChange = (event) => {
    setPosSearchQuery(event.target.value);
    setPosPage(0);
  };

  // Function to get the route based on next step
  const getRouteForNextStep = (indent) => {
    const currentStep = getCurrentStep(indent);
    if (!currentStep) {
      return null;
    }
    
    const nextStepNumber = Number(currentStep.NextStep || currentStep.nextStep);
    const action = stepNumberToAction[nextStepNumber];
    if (action && actionRouteMap[action]) {
      return actionRouteMap[action];
    }
    return null;
  };

  // Function to handle Take Action button click
  const handleTakeAction = (indent) => {
    const route = getRouteForNextStep(indent);
    if (route) {
      // Store the indent data in sessionStorage for the next component to use
      sessionStorage.setItem('currentIndent', JSON.stringify(indent));
      navigate(route);
    } else {
      console.error('No route found for next step');
    }
  };

  // Function to get action text for button
  const getActionText = (indent) => {
    const currentStep = getCurrentStep(indent);
    if (!currentStep) return 'Take Action';
    
    const nextStepNumber = Number(currentStep.NextStep || currentStep.nextStep);
    const action = stepNumberToAction[nextStepNumber];
    
    return action ? `Step ${nextStepNumber}: ${action}` : 'Take Action';
  };

  // Function to get action text for PO button
  const getPOActionText = (po) => {
    const nextStepNumber = Number(po.NextStep);
    const action = stepNumberToAction[nextStepNumber];
    
    return action ? `Step ${nextStepNumber}: ${action}` : 'Take Action';
  };

  // Function to handle PO action button click
  const handlePOAction = (po) => {
    const nextStepNumber = Number(po.NextStep);
    const action = stepNumberToAction[nextStepNumber];
    
    if (action && actionRouteMap[action]) {
      // Store the PO data in sessionStorage for the next component to use
      sessionStorage.setItem('currentPO', JSON.stringify(po));
      navigate(actionRouteMap[action]);
    } else {
      console.error('No route found for next step');
    }
  };

  // Filter POs based on search query
  const filteredPOs = pos.filter(po => 
    po.POId?.toLowerCase().includes(posSearchQuery.toLowerCase()) ||
    po.Status?.toLowerCase().includes(posSearchQuery.toLowerCase()) ||
    po.VendorDetails?.vendorName?.toLowerCase().includes(posSearchQuery.toLowerCase()) ||
    po.Items?.some(item => 
      item.itemName?.toLowerCase().includes(posSearchQuery.toLowerCase()) ||
      item.indentNumber?.toLowerCase().includes(posSearchQuery.toLowerCase())
    )
  );

  // Paginate POs
  const paginatedPOs = filteredPOs.slice(
    posPage * posRowsPerPage,
    posPage * posRowsPerPage + posRowsPerPage
  );

  // Debug logs for filtering

  return (
    <Box sx={{ width: '100%' }}>
      {/* Hero + step tabs live in PurchaseFlowLayout (parent <Outlet />); avoid duplicating them here */}
      <Box sx={{ py: { xs: 1, sm: 2 } }}>
          <Slide direction="left" in timeout={600}>
            <Box>
              {trackerTab === 0 && <PurchaseDashboard />}
              
              {trackerTab !== 0 && (
                <Box>
        
        {renderError()}

        {/* Purchase Flow Tracker */}
        <Box sx={{ mb: 4 }}>
          <Paper sx={{ p: 2, mb: 2, borderRadius: 3, boxShadow: 2 }}>
            {/* Step navigation is in PurchaseFlowLayout — no second tab row here */}
            {/* Show form for Tab 1 (Raise Indent) if user is authorized */}
            {trackerTab === 1 && (user?.role === 'Store Manager' || user?.role === 'Store/Dept Head') && (
              <Box sx={{ mb: 3 }}>
                <RaiseIndent />
              </Box>
            )}
            
            {/* Show data table for ALL tabs (including Tab 1) */}
            <>
              {/* Section Header */}
              <Box sx={{ mb: 3, display: 'flex', alignItems: 'center', gap: 2 }}>
                <Box sx={{ 
                  width: 48, 
                  height: 48, 
                  borderRadius: '50%', 
                  background: 'linear-gradient(135deg, #4caf50, #388e3c)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 4px 12px rgba(76, 175, 80, 0.3)'
                }}>
                  <AssignmentIcon sx={{ color: 'white', fontSize: 24 }} />
                </Box>
                <Box>
                  <Typography variant="h5" sx={{ 
                    fontWeight: 700, 
                    color: '#4caf50',
                    mb: 0.5
                  }}>
                    {stepNames[trackerTab] || 'All Tasks'}
                  </Typography>
                  <Typography variant="body2" sx={{ color: '#666' }}>
                    {filteredIndents.length} {filteredIndents.length === 1 ? 'indent' : 'indents'} found
                  </Typography>
                </Box>
                <Box sx={{ flexGrow: 1 }} />
                <Button
                  variant="outlined"
                  startIcon={<Refresh />}
                  onClick={async () => {
                    const data = await purchaseFlowService.getAllIndents();
                    setFlowSteps(data);
                  }}
                  sx={{
                    borderRadius: 2,
                    textTransform: 'none',
                    borderColor: '#4caf50',
                    color: '#4caf50',
                    '&:hover': {
                      borderColor: '#388e3c',
                      backgroundColor: 'rgba(76, 175, 80, 0.05)'
                    }
                  }}
                >
                  Refresh
                </Button>
              </Box>
              
              {/* Search Bar for Indents */}
                <Box sx={{ mb: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <TextField
                    placeholder="Search indents..."
                    value={indentsSearchQuery}
                    onChange={handleIndentsSearchChange}
                    size="small"
                    sx={{ 
                      minWidth: 300,
                      '& .MuiOutlinedInput-root': {
                        borderRadius: 3,
                        backgroundColor: 'rgba(255, 255, 255, 0.9)',
                        boxShadow: '0 2px 8px rgba(76, 175, 80, 0.1)',
                        '&:hover': {
                          boxShadow: '0 4px 12px rgba(76, 175, 80, 0.15)',
                        },
                        '&.Mui-focused': {
                          boxShadow: '0 4px 12px rgba(76, 175, 80, 0.2)',
                        }
                      }
                    }}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <Search sx={{ color: '#4caf50' }} />
                        </InputAdornment>
                      ),
                    }}
                  />
                  <Typography variant="body2" sx={{ color: '#666', fontWeight: 500 }}>
                    Showing {paginatedIndents.length} of {filteredIndents.length} indents
                  </Typography>
                </Box>
                
                <TableContainer sx={{ 
                  borderRadius: 3,
                  overflow: 'hidden',
                  boxShadow: '0 8px 32px rgba(76, 175, 80, 0.1)',
                  border: '1px solid rgba(76, 175, 80, 0.1)'
                }}>
                <Table size="medium">
                  <TableHead>
                    <TableRow sx={{ 
                      background: 'linear-gradient(135deg, #4caf50 0%, #388e3c 100%)',
                      '& th': {
                        borderBottom: '2px solid #388e3c'
                      }
                    }}>
                      <TableCell sx={{ 
                        fontWeight: 700, 
                        color: 'white',
                        fontSize: '0.95rem',
                        letterSpacing: '0.5px',
                        textTransform: 'uppercase'
                      }}>Indent No.</TableCell>
                      <TableCell sx={{ 
                        fontWeight: 700, 
                        color: 'white',
                        fontSize: '0.95rem',
                        letterSpacing: '0.5px',
                        textTransform: 'uppercase'
                      }}>Details</TableCell>
                      <TableCell sx={{ 
                        fontWeight: 700, 
                        color: 'white',
                        fontSize: '0.95rem',
                        letterSpacing: '0.5px',
                        textTransform: 'uppercase'
                      }}>Status</TableCell>
                      <TableCell sx={{ 
                        fontWeight: 700, 
                        color: 'white',
                        fontSize: '0.95rem',
                        letterSpacing: '0.5px',
                        textTransform: 'uppercase'
                      }}>Created At</TableCell>
                      <TableCell sx={{ 
                        fontWeight: 700, 
                        color: 'white',
                        fontSize: '0.95rem',
                        letterSpacing: '0.5px',
                        textTransform: 'uppercase'
                      }}>Take Action</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {paginatedIndents.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} align="center" sx={{ 
                          py: 8,
                          background: 'rgba(255, 255, 255, 0.8)'
                        }}>
                          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
                            <Box sx={{ 
                              width: 64, 
                              height: 64, 
                              borderRadius: '50%',
                              background: 'linear-gradient(135deg, rgba(76, 175, 80, 0.1), rgba(56, 142, 60, 0.1))',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center'
                            }}>
                              <Typography variant="h4" sx={{ color: '#4caf50', fontWeight: 300 }}>📋</Typography>
                            </Box>
                            <Typography variant="h6" sx={{ color: '#4caf50', fontWeight: 600 }}>
                              No indents found
                            </Typography>
                            <Typography variant="body2" sx={{ color: '#666', textAlign: 'center' }}>
                              Create your first indent to get started
                            </Typography>
                          </Box>
                        </TableCell>
                      </TableRow>
                    ) : (
                      paginatedIndents.map((indent, index) => (
                        <React.Fragment key={indent.IndentNumber}>
                          <TableRow sx={{ 
                            background: index % 2 === 0 ? 'rgba(255, 255, 255, 0.9)' : 'rgba(248, 250, 255, 0.9)',
                            transition: 'all 0.2s ease',
                            '&:hover': {
                              transform: 'scale(1.01)',
                            }
                          }}>
                            <TableCell sx={{ 
                              fontWeight: 600, 
                              color: '#4caf50',
                              fontSize: '1.1rem',
                              borderBottom: '1px solid rgba(76, 175, 80, 0.1)'
                            }}>
                              #{indent.IndentNumber}
                            </TableCell>
                            <TableCell sx={{ borderBottom: '1px solid rgba(76, 175, 80, 0.1)' }}>
                              <IconButton 
                                size="small" 
                                onClick={() => toggleGroup(indent.IndentNumber)}
                                sx={{ 
                                  color: '#4caf50',
                                  backgroundColor: 'rgba(76, 175, 80, 0.1)',
                                  '&:hover': {
                                    backgroundColor: 'rgba(76, 175, 80, 0.2)',
                                    transform: 'scale(1.1)'
                                  }
                                }}
                              >
                                {openGroups[indent.IndentNumber] ? <ExpandLess /> : <ExpandMore />}
                              </IconButton>
                            </TableCell>
                            <TableCell sx={{ borderBottom: '1px solid rgba(76, 175, 80, 0.1)' }}>
                              <Chip 
                                label={indent.Status} 
                                color={getStatusColor(indent.Status)} 
                                size="medium"
                                sx={{ 
                                  fontWeight: 600,
                                  borderRadius: 2,
                                  boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                                  background: `linear-gradient(135deg, ${
                                    getStatusColor(indent.Status) === 'success' ? '#4caf50' :
                                    getStatusColor(indent.Status) === 'warning' ? '#ff9800' :
                                    getStatusColor(indent.Status) === 'error' ? '#f44336' : '#4caf50'
                                  }, ${
                                    getStatusColor(indent.Status) === 'success' ? '#66bb6a' :
                                    getStatusColor(indent.Status) === 'warning' ? '#ffb74d' :
                                    getStatusColor(indent.Status) === 'error' ? '#ef5350' : '#66bb6a'
                                  })`,
                                  color: 'white'
                                }} 
                              />
                            </TableCell>
                            <TableCell sx={{ 
                              borderBottom: '1px solid rgba(76, 175, 80, 0.1)',
                              color: '#666'
                            }}>
                              <Typography variant="body2" sx={{ fontWeight: 500 }}>
                                {new Date(indent.CreatedAt).toLocaleDateString()}
                              </Typography>
                              <Typography variant="caption" sx={{ color: '#999' }}>
                                {new Date(indent.CreatedAt).toLocaleTimeString()}
                              </Typography>
                            </TableCell>
                            <TableCell sx={{ borderBottom: '1px solid rgba(76, 175, 80, 0.1)' }}>
                              {(() => {
                                const currentStep = getCurrentStep(indent);
                                const assignedTo = (currentStep?.AssignedTo || currentStep?.assignedTo || '').toLowerCase();
                                const userRole = (user?.role || '').toLowerCase();
                                const userEmail = (user?.email || '').toLowerCase();
                                const canTakeAction = assignedTo === userRole || assignedTo === userEmail;
                                const nextStepNum = Number(currentStep?.NextStep || currentStep?.nextStep || 1);
                                return (
                                  <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                                    {/* WhatsApp Button */}
                                    <WhatsAppButton
                                      task={{
                                        POId: indent.IndentNumber || indent.FlowId,
                                        DispatchUniqueId: indent.FlowId || indent.IndentNumber,
                                        ClientCode: indent.VendorName || 'Vendor',
                                        ClientName: indent.VendorName || 'Vendor',
                                        Status: currentStep?.Status || 'PENDING',
                                        CurrentStep: nextStepNum
                                      }}
                                      stageName={whatsappMessageService.getPurchaseFlowStageName(nextStepNum)}
                                      status={currentStep?.Status || 'NEW'}
                                      size="small"
                                      variant="icon"
                                    />
                                    <Tooltip 
                                      title={canTakeAction ? `Navigate to Step ${nextStepNum}: ${stepNumberToAction[nextStepNum] || 'Unknown Action'}` : 'You are not authorized to take this action'} 
                                      arrow
                                    >
                                      <Button
                                      variant="contained"
                                      size="medium"
                                      disabled={!canTakeAction}
                                      onClick={() => handleTakeAction(indent)}
                                      sx={{ 
                                        background: canTakeAction ? 'linear-gradient(135deg, #4caf50, #388e3c)' : 'rgba(0,0,0,0.12)',
                                        color: canTakeAction ? 'white' : 'rgba(0,0,0,0.38)',
                                        fontWeight: 600,
                                        textTransform: 'none',
                                        borderRadius: 2,
                                        px: 3,
                                        minWidth: 180,
                                        boxShadow: canTakeAction ? '0 4px 12px rgba(76, 175, 80, 0.3)' : 'none',
                                        '&:hover': {
                                          background: canTakeAction ? 'linear-gradient(135deg, #388e3c, #2e7d32)' : 'rgba(0,0,0,0.12)',
                                          boxShadow: canTakeAction ? '0 6px 20px rgba(107, 114, 128, 0.4)' : 'none',
                                          transform: canTakeAction ? 'translateY(-1px)' : 'none'
                                        }
                                      }}
                                    >
                                      {getActionText(indent)}
                                    </Button>
                                    </Tooltip>
                                  </Box>
                                );
                              })()}
                            </TableCell>
                          </TableRow>
                          <TableRow>
                            <TableCell colSpan={5} sx={{ p: 0, border: 0 }}>
                              <Collapse in={openGroups[indent.IndentNumber]} timeout="auto" unmountOnExit>
                                <Box sx={{ 
                                  p: 4, 
                                  borderTop: '1px solid rgba(76, 175, 80, 0.1)'
                                }}>
                                  <Typography variant="h6" sx={{ 
                                    mb: 3, 
                                    color: 'black', 
                                    fontWeight: 600,
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 2
                                  }}>
                                    <Box sx={{ 
                                      width: 12, 
                                      height: 12, 
                                      borderRadius: '50%', 
                                      background: '#4caf50',
                                      boxShadow: '0 2px 8px rgba(76, 175, 80, 0.3)'
                                    }} />
                                    Items in Indent #{indent.IndentNumber}
                                  </Typography>
                                  <Table size="small" sx={{ 
                                    backgroundColor: 'rgba(255, 255, 255, 0.9)',
                                    borderRadius: 3,
                                    overflow: 'hidden',
                                    boxShadow: '0 4px 20px rgba(76, 175, 80, 0.1)',
                                    border: '1px solid rgba(76, 175, 80, 0.1)',
                                    mb: 4
                                  }}>
                                    <TableHead>
                                      <TableRow sx={{ 
                                        background: 'linear-gradient(135deg, rgba(76, 175, 80, 0.1), rgba(21, 101, 192, 0.1))'
                                      }}>
                                        <TableCell sx={{ fontWeight: 700, color: '#4caf50' }}>Item Code</TableCell>
                                        <TableCell sx={{ fontWeight: 700, color: '#4caf50' }}>Item Name</TableCell>
                                        <TableCell sx={{ fontWeight: 700, color: '#4caf50' }}>Quantity</TableCell>
                                        <TableCell sx={{ fontWeight: 700, color: '#4caf50' }}>Specifications</TableCell>
                                      </TableRow>
                                    </TableHead>
                                    <TableBody>
                                      {indent.Items && indent.Items.length > 0 ? (
                                        indent.Items.map((item, idx) => (
                                          <TableRow key={item.itemCode + '-' + idx} sx={{ 
                                            '&:hover': {
                                              backgroundColor: 'rgba(76, 175, 80, 0.05)'
                                            }
                                          }}>
                                            <TableCell>
                                              <Chip 
                                                label={item.itemCode} 
                                                size="small" 
                                                variant="outlined"
                                                sx={{ 
                                                  borderRadius: 2,
                                                  borderColor: '#4caf50',
                                                  color: '#4caf50',
                                                  fontWeight: 600,
                                                  background: 'rgba(76, 175, 80, 0.05)'
                                                }}
                                              />
                                            </TableCell>
                                            <TableCell sx={{ fontWeight: 500, color: '#333' }}>
                                              {item.item}
                                            </TableCell>
                                            <TableCell>
                                              <Chip 
                                                label={item.quantity} 
                                                size="small" 
                                                sx={{ 
                                                  borderRadius: 2,
                                                  background: 'linear-gradient(135deg, #4caf50, #388e3c)',
                                                  color: 'white',
                                                  fontWeight: 600,
                                                  boxShadow: '0 2px 8px rgba(76, 175, 80, 0.3)'
                                                }}
                                              />
                                            </TableCell>
                                            <TableCell>
                                              <Typography variant="body2" sx={{ 
                                                maxWidth: 300, 
                                                wordWrap: 'break-word',
                                                color: '#666',
                                                lineHeight: 1.5
                                              }}>
                                                {item.specifications}
                                              </Typography>
                                            </TableCell>
                                          </TableRow>
                                        ))
                                      ) : (
                                        <TableRow>
                                          <TableCell colSpan={4} align="center" sx={{ py: 3 }}>
                                            <Typography variant="body2" sx={{ color: '#666', fontWeight: 500 }}>
                                              No items found in this indent
                                            </Typography>
                                          </TableCell>
                                        </TableRow>
                                      )}
                                    </TableBody>
                                  </Table>
                                  
                                  <Typography variant="h6" sx={{ 
                                    mb: 3, 
                                    color: 'black', 
                                    fontWeight: 600,
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 2
                                  }}>
                                    <Box sx={{ 
                                      width: 12, 
                                      height: 12, 
                                      borderRadius: '50%', 
                                      background: '#4caf50',
                                      boxShadow: '0 2px 8px rgba(76, 175, 80, 0.3)'
                                    }} />
                                    Step Progress
                                  </Typography>
                                  {(() => {
                                    const indentKey = indent.IndentNumber || indent.indentNumber || index;
                                    const stepsPage = stepsPagination[indentKey]?.page || 0;
                                    const stepsRowsPerPage = stepsPagination[indentKey]?.rowsPerPage || 5;
                                    const steps = indent.Steps || [];
                                    const paginatedSteps = steps.slice(
                                      stepsPage * stepsRowsPerPage,
                                      stepsPage * stepsRowsPerPage + stepsRowsPerPage
                                    );
                                    const totalPages = Math.ceil(steps.length / stepsRowsPerPage);

                                    return (
                                      <Box>
                                        <List sx={{ 
                                          backgroundColor: 'rgba(255, 255, 255, 0.9)',
                                          borderRadius: 3,
                                          overflow: 'hidden',
                                          boxShadow: '0 4px 20px rgba(76, 175, 80, 0.1)',
                                          border: '1px solid rgba(76, 175, 80, 0.1)',
                                          p: 0
                                        }}>
                                          {paginatedSteps.length > 0 ? (
                                            paginatedSteps.map((step, idx) => (
                                              <ListItem
                                                key={(step.StepId || step.stepId) + '-' + idx}
                                                sx={{
                                                  borderBottom: idx < paginatedSteps.length - 1 ? '1px solid rgba(76, 175, 80, 0.1)' : 'none',
                                                  '&:hover': {
                                                    backgroundColor: 'rgba(76, 175, 80, 0.05)'
                                                  },
                                                  py: 2,
                                                  px: 3
                                                }}
                                              >
                                                <ListItemText
                                                  primary={
                                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
                                                      <Typography variant="body1" sx={{ fontWeight: 600, color: '#4caf50', minWidth: 80 }}>
                                                        Step {step.StepNumber || step.stepNumber}
                                                      </Typography>
                                                      <Typography variant="body1" sx={{ fontWeight: 600, color: '#333', flex: 1 }}>
                                                        {step.Action || step.action}
                                                      </Typography>
                                                      <Chip 
                                                        label={step.Status || step.status} 
                                                        size="small"
                                                        sx={{ 
                                                          borderRadius: 2,
                                                          background: `linear-gradient(135deg, ${
                                                            (step.Status || step.status) === 'completed' ? '#4caf50' :
                                                            (step.Status || step.status) === 'in_progress' ? '#ff9800' :
                                                            (step.Status || step.status) === 'pending' ? '#4caf50' : '#9e9e9e'
                                                          }, ${
                                                            (step.Status || step.status) === 'completed' ? '#66bb6a' :
                                                            (step.Status || step.status) === 'in_progress' ? '#ffb74d' :
                                                            (step.Status || step.status) === 'pending' ? '#66bb6a' : '#bdbdbd'
                                                          })`,
                                                          color: 'white',
                                                          fontWeight: 600
                                                        }}
                                                      />
                                                    </Box>
                                                  }
                                                  secondary={
                                                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, mt: 1 }}>
                                                      <Typography variant="body2" sx={{ color: '#666' }}>
                                                        <strong>Role:</strong> {step.Role || step.role}
                                                      </Typography>
                                                      <Typography variant="body2" sx={{ color: '#666' }}>
                                                        <strong>Assigned To:</strong> {step.AssignedTo || step.assignedTo || '-'}
                                                      </Typography>
                                                      <Typography variant="body2" sx={{ color: '#666' }}>
                                                        <strong>Start Time:</strong> {step.StartTime ? new Date(step.StartTime).toLocaleString() : '-'}
                                                      </Typography>
                                                      <Typography variant="body2" sx={{ color: '#666' }}>
                                                        <strong>End Time:</strong> {step.EndTime ? new Date(step.EndTime).toLocaleString() : '-'}
                                                      </Typography>
                                                      <Typography variant="body2" sx={{ color: '#4caf50', fontWeight: 500 }}>
                                                        <strong>Step ID:</strong> {step.StepId || step.stepId}
                                                      </Typography>
                                                    </Box>
                                                  }
                                                />
                                              </ListItem>
                                            ))
                                          ) : (
                                            <ListItem>
                                              <ListItemText
                                                primary={
                                                  <Typography variant="body2" sx={{ color: '#666', fontWeight: 500, textAlign: 'center', py: 3 }}>
                                                    No steps found
                                                  </Typography>
                                                }
                                              />
                                            </ListItem>
                                          )}
                                        </List>
                                        
                                        {/* Pagination for Steps */}
                                        {steps.length > 0 && (
                                          <Box sx={{ 
                                            display: 'flex', 
                                            justifyContent: 'space-between', 
                                            alignItems: 'center',
                                            mt: 2,
                                            p: 2,
                                            borderTop: '1px solid rgba(76, 175, 80, 0.1)',
                                            backgroundColor: 'rgba(248, 250, 255, 0.5)',
                                            borderRadius: 2
                                          }}>
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                              <Typography variant="body2" sx={{ color: '#6c757d', fontWeight: 500 }}>
                                                Rows per page:
                                              </Typography>
                                              <FormControl size="small" sx={{ minWidth: 80 }}>
                                                <Select
                                                  value={stepsRowsPerPage}
                                                  onChange={(e) => {
                                                    setStepsPagination(prev => ({
                                                      ...prev,
                                                      [indentKey]: {
                                                        ...prev[indentKey],
                                                        rowsPerPage: e.target.value,
                                                        page: 0
                                                      }
                                                    }));
                                                  }}
                                                  sx={{
                                                    '& .MuiOutlinedInput-notchedOutline': {
                                                      borderColor: 'rgba(76, 175, 80, 0.3)'
                                                    },
                                                    '&:hover .MuiOutlinedInput-notchedOutline': {
                                                      borderColor: 'rgba(76, 175, 80, 0.5)'
                                                    },
                                                    '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                                                      borderColor: '#4caf50'
                                                    }
                                                  }}
                                                >
                                                  <MenuItem value={5}>5</MenuItem>
                                                  <MenuItem value={10}>10</MenuItem>
                                                  <MenuItem value={25}>25</MenuItem>
                                                  <MenuItem value={50}>50</MenuItem>
                                                </Select>
                                              </FormControl>
                                              <Typography variant="body2" sx={{ color: '#6c757d', fontWeight: 500 }}>
                                                Showing {stepsPage * stepsRowsPerPage + 1} - {Math.min((stepsPage + 1) * stepsRowsPerPage, steps.length)} of {steps.length} steps
                                              </Typography>
                                            </Box>
                                            <Pagination
                                              count={totalPages}
                                              page={stepsPage + 1}
                                              onChange={(event, value) => {
                                                setStepsPagination(prev => ({
                                                  ...prev,
                                                  [indentKey]: {
                                                    ...prev[indentKey],
                                                    page: value - 1
                                                  }
                                                }));
                                              }}
                                              color="primary"
                                              sx={{
                                                '& .MuiPaginationItem-root': {
                                                  color: '#4caf50',
                                                  '&.Mui-selected': {
                                                    backgroundColor: '#4caf50',
                                                    color: 'white',
                                                    '&:hover': {
                                                      backgroundColor: '#66bb6a'
                                                    }
                                                  },
                                                  '&:hover': {
                                                    backgroundColor: 'rgba(76, 175, 80, 0.1)'
                                                  }
                                                }
                                              }}
                                            />
                                          </Box>
                                        )}
                                      </Box>
                                    );
                                  })()}
                                </Box>
                              </Collapse>
                            </TableCell>
                          </TableRow>
                        </React.Fragment>
                      ))
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
              
              {/* Pagination for Indents */}
              {filteredIndents.length > 0 && (
                <Box sx={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'center',
                  p: 2,
                  borderTop: '1px solid rgba(76, 175, 80, 0.1)',
                  backgroundColor: 'rgba(248, 250, 255, 0.5)'
                }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Typography variant="body2" sx={{ color: '#6c757d', fontWeight: 500 }}>
                      Rows per page:
                    </Typography>
                    <FormControl size="small" sx={{ minWidth: 80 }}>
                      <Select
                        value={indentsRowsPerPage}
                        onChange={(e) => {
                          setIndentsRowsPerPage(e.target.value);
                          setIndentsPage(0);
                        }}
                        sx={{
                          '& .MuiOutlinedInput-notchedOutline': {
                            borderColor: 'rgba(76, 175, 80, 0.3)',
                          },
                          '&:hover .MuiOutlinedInput-notchedOutline': {
                            borderColor: 'rgba(107, 114, 128, 0.5)',
                          },
                          '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                            borderColor: '#4caf50',
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
                      {indentsPage * indentsRowsPerPage + 1}-{Math.min((indentsPage + 1) * indentsRowsPerPage, filteredIndents.length)} of {filteredIndents.length} indents
                    </Typography>
                    
                    {Math.ceil(filteredIndents.length / indentsRowsPerPage) > 1 && (
                      <Pagination
                        count={Math.ceil(filteredIndents.length / indentsRowsPerPage)}
                        page={indentsPage + 1}
                        onChange={(event, value) => setIndentsPage(value - 1)}
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
                              background: 'linear-gradient(135deg, #4caf50 0%, #388e3c 100%)',
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
        </Box>

        {/* Purchase Orders Table */}
        {pos.length > 0 && (
          <Box sx={{ mb: 4 }}>
            <Paper sx={{ p: 2, mb: 2, borderRadius: 3, boxShadow: 2 }}>
              <Typography variant="h5" component="h2" gutterBottom sx={{ 
                fontSize: 28, 
                fontWeight: 700, 
                color: 'primary.main', 
                mb: 3,
                display: 'flex',
                alignItems: 'center',
                gap: 2
              }}>
                <Box sx={{ 
                  width: 16, 
                  height: 16, 
                  borderRadius: '50%', 
                  background: '#4caf50',
                  boxShadow: '0 2px 8px rgba(76, 175, 80, 0.3)'
                }} />
                Purchase Orders
              </Typography>
              
              {/* Search Bar for POs */}
              <Box sx={{ mb: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <TextField
                  placeholder="Search purchase orders..."
                  value={posSearchQuery}
                  onChange={handlePosSearchChange}
                  size="small"
                  sx={{ 
                    minWidth: 300,
                    '& .MuiOutlinedInput-root': {
                      borderRadius: 3,
                      backgroundColor: 'rgba(255, 255, 255, 0.9)',
                      boxShadow: '0 2px 8px rgba(76, 175, 80, 0.1)',
                      '&:hover': {
                        boxShadow: '0 4px 12px rgba(107, 114, 128, 0.15)',
                      },
                      '&.Mui-focused': {
                        boxShadow: '0 4px 12px rgba(76, 175, 80, 0.2)',
                      }
                    }
                  }}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <Search sx={{ color: '#4caf50' }} />
                      </InputAdornment>
                    ),
                  }}
                />
                <Typography variant="body2" sx={{ color: '#666', fontWeight: 500 }}>
                  Showing {paginatedPOs.length} of {filteredPOs.length} purchase orders
                </Typography>
              </Box>
              
              <TableContainer sx={{ 
                borderRadius: 3,
                overflow: 'hidden',
                boxShadow: '0 8px 32px rgba(76, 175, 80, 0.1)',
                border: '1px solid rgba(76, 175, 80, 0.1)'
              }}>
                <Table size="medium">
                  <TableHead>
                    <TableRow sx={{ 
                      background: 'linear-gradient(135deg, #4caf50 0%, #388e3c 100%)',
                      '& th': {
                        borderBottom: '2px solid #388e3c'
                      }
                    }}>
                      <TableCell sx={{ 
                        fontWeight: 700, 
                        color: 'white',
                        fontSize: '0.95rem',
                        letterSpacing: '0.5px',
                        textTransform: 'uppercase'
                      }}>PO ID</TableCell>
                      <TableCell sx={{ 
                        fontWeight: 700, 
                        color: 'white',
                        fontSize: '0.95rem',
                        letterSpacing: '0.5px',
                        textTransform: 'uppercase'
                      }}>Details</TableCell>
                      <TableCell sx={{ 
                        fontWeight: 700, 
                        color: 'white',
                        fontSize: '0.95rem',
                        letterSpacing: '0.5px',
                        textTransform: 'uppercase'
                      }}>Status</TableCell>
                      <TableCell sx={{ 
                        fontWeight: 700, 
                        color: 'white',
                        fontSize: '0.95rem',
                        letterSpacing: '0.5px',
                        textTransform: 'uppercase'
                      }}>Created At</TableCell>
                      <TableCell sx={{ 
                        fontWeight: 700, 
                        color: 'white',
                        fontSize: '0.95rem',
                        letterSpacing: '0.5px',
                        textTransform: 'uppercase'
                      }}>Take Action</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {paginatedPOs.map((po, index) => (
                      <React.Fragment key={po.POId}>
                        <TableRow sx={{ 
                          background: index % 2 === 0 ? 'rgba(255, 255, 255, 0.9)' : 'rgba(248, 250, 255, 0.9)',
                          transition: 'all 0.2s ease',
                          '&:hover': {
                            transform: 'scale(1.01)',
                          }
                        }}>
                          <TableCell sx={{ 
                            fontWeight: 600, 
                            color: '#4caf50',
                            fontSize: '1.1rem',
                            borderBottom: '1px solid rgba(76, 175, 80, 0.1)'
                          }}>
                            {po.POId}
                          </TableCell>
                          <TableCell sx={{ borderBottom: '1px solid rgba(76, 175, 80, 0.1)' }}>
                            <IconButton 
                              size="small" 
                              onClick={() => togglePOGroup(po.POId)}
                              sx={{ 
                                color: '#4caf50',
                                backgroundColor: 'rgba(76, 175, 80, 0.1)',
                                '&:hover': {
                                  backgroundColor: 'rgba(76, 175, 80, 0.2)',
                                  transform: 'scale(1.1)'
                                }
                              }}
                            >
                              {openPOGroups[po.POId] ? <ExpandLess /> : <ExpandMore />}
                            </IconButton>
                          </TableCell>
                          <TableCell sx={{ borderBottom: '1px solid rgba(76, 175, 80, 0.1)' }}>
                            <Chip 
                              label={po.Status} 
                              color={getStatusColor(po.Status)} 
                              size="medium"
                              sx={{ 
                                fontWeight: 600,
                                borderRadius: 2,
                                boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                                background: `linear-gradient(135deg, ${
                                  getStatusColor(po.Status) === 'success' ? '#4caf50' :
                                  getStatusColor(po.Status) === 'warning' ? '#ff9800' :
                                  getStatusColor(po.Status) === 'error' ? '#f44336' : '#4caf50'
                                }, ${
                                  getStatusColor(po.Status) === 'success' ? '#66bb6a' :
                                  getStatusColor(po.Status) === 'warning' ? '#ffb74d' :
                                  getStatusColor(po.Status) === 'error' ? '#ef5350' : '#66bb6a'
                                })`,
                                color: 'white'
                              }} 
                            />
                          </TableCell>
                          <TableCell sx={{ 
                            borderBottom: '1px solid rgba(76, 175, 80, 0.1)',
                            color: '#666'
                          }}>
                            <Typography variant="body2" sx={{ fontWeight: 500 }}>
                              {new Date(po.CreatedAt).toLocaleDateString()}
                            </Typography>
                            <Typography variant="caption" sx={{ color: '#999' }}>
                              {new Date(po.CreatedAt).toLocaleTimeString()}
                            </Typography>
                          </TableCell>
                          <TableCell sx={{ borderBottom: '1px solid rgba(76, 175, 80, 0.1)' }}>
                            <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                              {/* WhatsApp Button */}
                              <WhatsAppButton
                                task={{
                                  POId: po.POId || po.IndentNumber,
                                  DispatchUniqueId: po.FlowId || po.POId,
                                  ClientCode: po.VendorDetails?.vendorName || 'Vendor',
                                  ClientName: po.VendorDetails?.vendorName || 'Vendor',
                                  Status: po.Status || 'PENDING',
                                  CurrentStep: po.NextStep
                                }}
                                stageName={whatsappMessageService.getPurchaseFlowStageName(Number(po.NextStep || 1))}
                                status={po.Status || 'NEW'}
                                size="small"
                                variant="icon"
                              />
                              {(() => {
                                const nextStepNumber = Number(po.NextStep);
                                const action = stepNumberToAction[nextStepNumber];
                                const assignedTo = action ? stepMappings.find(m => m.action === action)?.assignedTo : '';
                                const userRole = (user?.role || '').toLowerCase();
                                const userEmail = (user?.email || '').toLowerCase();
                                const canTakeAction = assignedTo && (assignedTo.toLowerCase() === userRole || assignedTo.toLowerCase() === userEmail);
                                
                                return (
                                  <Tooltip 
                                    title={canTakeAction ? `Navigate to Step ${nextStepNumber}: ${action}` : 'You are not authorized to take this action'} 
                                    arrow
                                  >
                                    <Button
                                      variant="contained"
                                      size="medium"
                                      disabled={!canTakeAction}
                                      onClick={() => handlePOAction(po)}
                                      sx={{ 
                                        background: canTakeAction ? 'linear-gradient(135deg, #4caf50, #388e3c)' : 'rgba(0,0,0,0.12)',
                                        color: canTakeAction ? 'white' : 'rgba(0,0,0,0.38)',
                                        fontWeight: 600,
                                        textTransform: 'none',
                                        borderRadius: 2,
                                        px: 3,
                                        minWidth: 180,
                                        boxShadow: canTakeAction ? '0 4px 12px rgba(76, 175, 80, 0.3)' : 'none',
                                        '&:hover': {
                                          background: canTakeAction ? 'linear-gradient(135deg, #388e3c, #2e7d32)' : 'rgba(0,0,0,0.12)',
                                          boxShadow: canTakeAction ? '0 6px 20px rgba(107, 114, 128, 0.4)' : 'none',
                                          transform: canTakeAction ? 'translateY(-1px)' : 'none'
                                        }
                                      }}
                                    >
                                      {getPOActionText(po)}
                                    </Button>
                                  </Tooltip>
                                );
                              })()}
                            </Box>
                          </TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell colSpan={5} sx={{ p: 0, border: 0 }}>
                            <Collapse in={openPOGroups[po.POId]} timeout="auto" unmountOnExit>
                              <Box sx={{ 
                                p: 4, 
                                borderTop: '1px solid rgba(76, 175, 80, 0.1)'
                              }}>
                                <Typography variant="h6" sx={{ 
                                  mb: 3, 
                                  color: 'black', 
                                  fontWeight: 600,
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: 2
                                }}>
                                  <Box sx={{ 
                                    width: 12, 
                                    height: 12, 
                                    borderRadius: '50%', 
                                    background: '#4caf50',
                                    boxShadow: '0 2px 8px rgba(76, 175, 80, 0.3)'
                                  }} />
                                  Vendor Details
                                </Typography>
                                <Box sx={{ 
                                  p: 3, 
                                  backgroundColor: 'rgba(255, 255, 255, 0.9)',
                                  borderRadius: 3,
                                  boxShadow: '0 4px 20px rgba(76, 175, 80, 0.1)',
                                  border: '1px solid rgba(76, 175, 80, 0.1)',
                                  mb: 4
                                }}>
                                  <Grid container spacing={2}>
                                    <Grid item xs={12} md={6}>
                                      <Typography variant="subtitle2" sx={{ fontWeight: 600, color: '#4caf50', mb: 1 }}>
                                        Vendor Name
                                      </Typography>
                                      <Typography variant="body1" sx={{ color: '#333', mb: 2 }}>
                                        {po.VendorDetails?.vendorName || 'N/A'}
                                      </Typography>
                                    </Grid>
                                    <Grid item xs={12} md={6}>
                                      <Typography variant="subtitle2" sx={{ fontWeight: 600, color: '#4caf50', mb: 1 }}>
                                        Vendor Code
                                      </Typography>
                                      <Typography variant="body1" sx={{ color: '#333', mb: 2 }}>
                                        {po.VendorDetails?.vendorCode || 'N/A'}
                                      </Typography>
                                    </Grid>
                                    <Grid item xs={12} md={6}>
                                      <Typography variant="subtitle2" sx={{ fontWeight: 600, color: '#4caf50', mb: 1 }}>
                                        Contact
                                      </Typography>
                                      <Typography variant="body1" sx={{ color: '#333', mb: 2 }}>
                                        {po.VendorDetails?.vendorContact || 'N/A'}
                                      </Typography>
                                    </Grid>
                                    <Grid item xs={12} md={6}>
                                      <Typography variant="subtitle2" sx={{ fontWeight: 600, color: '#4caf50', mb: 1 }}>
                                        Email
                                      </Typography>
                                      <Typography variant="body1" sx={{ color: '#333', mb: 2 }}>
                                        {po.VendorDetails?.vendorEmail || 'N/A'}
                                      </Typography>
                                    </Grid>
                                  </Grid>
                                </Box>
                                
                                <Typography variant="h6" sx={{ 
                                  mb: 3, 
                                  color: 'black', 
                                  fontWeight: 600,
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: 2
                                }}>
                                  <Box sx={{ 
                                    width: 12, 
                                    height: 12, 
                                    borderRadius: '50%', 
                                    background: '#4caf50',
                                    boxShadow: '0 2px 8px rgba(76, 175, 80, 0.3)'
                                  }} />
                                  Items in PO
                                </Typography>
                                <Table size="small" sx={{ 
                                  backgroundColor: 'rgba(255, 255, 255, 0.9)',
                                  borderRadius: 3,
                                  overflow: 'hidden',
                                  boxShadow: '0 4px 20px rgba(76, 175, 80, 0.1)',
                                  border: '1px solid rgba(76, 175, 80, 0.1)',
                                  mb: 4
                                }}>
                                  <TableHead>
                                    <TableRow sx={{ 
                                      background: 'linear-gradient(135deg, rgba(76, 175, 80, 0.1), rgba(21, 101, 192, 0.1))'
                                    }}>
                                      <TableCell sx={{ fontWeight: 700, color: '#4caf50' }}>Indent Number</TableCell>
                                      <TableCell sx={{ fontWeight: 700, color: '#4caf50' }}>Item Name</TableCell>
                                      <TableCell sx={{ fontWeight: 700, color: '#4caf50' }}>Quantity</TableCell>
                                      <TableCell sx={{ fontWeight: 700, color: '#4caf50' }}>Price</TableCell>
                                      <TableCell sx={{ fontWeight: 700, color: '#4caf50' }}>Delivery Time</TableCell>
                                      <TableCell sx={{ fontWeight: 700, color: '#4caf50' }}>Terms</TableCell>
                                    </TableRow>
                                  </TableHead>
                                  <TableBody>
                                    {po.Items && po.Items.length > 0 ? (
                                      po.Items.map((item, idx) => (
                                        <TableRow key={item.indentNumber + '-' + idx} sx={{ 
                                          '&:hover': {
                                            backgroundColor: 'rgba(76, 175, 80, 0.05)'
                                          }
                                        }}>
                                          <TableCell>
                                            <Chip 
                                              label={item.indentNumber} 
                                              size="small" 
                                              variant="outlined"
                                              sx={{ 
                                                borderRadius: 2,
                                                borderColor: '#4caf50',
                                                color: '#4caf50',
                                                fontWeight: 600,
                                                background: 'rgba(76, 175, 80, 0.05)'
                                              }}
                                            />
                                          </TableCell>
                                          <TableCell sx={{ fontWeight: 500, color: '#333' }}>
                                            {item.itemName}
                                          </TableCell>
                                          <TableCell>
                                            <Chip 
                                              label={item.quantity} 
                                              size="small" 
                                              sx={{ 
                                                borderRadius: 2,
                                                background: 'linear-gradient(135deg, #4caf50, #388e3c)',
                                                color: 'white',
                                                fontWeight: 600,
                                                boxShadow: '0 2px 8px rgba(76, 175, 80, 0.3)'
                                              }}
                                            />
                                          </TableCell>
                                          <TableCell sx={{ fontWeight: 500, color: '#333' }}>
                                            ₹{item.price}
                                          </TableCell>
                                          <TableCell sx={{ color: '#666' }}>
                                            {item.deliveryTime}
                                          </TableCell>
                                          <TableCell>
                                            <Typography variant="body2" sx={{ 
                                              maxWidth: 200, 
                                              wordWrap: 'break-word',
                                              color: '#666',
                                              lineHeight: 1.5
                                            }}>
                                              {item.terms}
                                            </Typography>
                                          </TableCell>
                                        </TableRow>
                                      ))
                                    ) : (
                                      <TableRow>
                                        <TableCell colSpan={6} align="center" sx={{ py: 3 }}>
                                          <Typography variant="body2" sx={{ color: '#666', fontWeight: 500 }}>
                                            No items found in this PO
                                          </Typography>
                                        </TableCell>
                                      </TableRow>
                                    )}
                                  </TableBody>
                                </Table>
                                
                                <Typography variant="h6" sx={{ 
                                  mb: 3, 
                                  color: 'black', 
                                  fontWeight: 600,
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: 2
                                }}>
                                  <Box sx={{ 
                                    width: 12, 
                                    height: 12, 
                                    borderRadius: '50%', 
                                    background: '#4caf50',
                                    boxShadow: '0 2px 8px rgba(76, 175, 80, 0.3)'
                                  }} />
                                  Step Information
                                </Typography>
                                <Box sx={{ 
                                  p: 3, 
                                  backgroundColor: 'rgba(255, 255, 255, 0.9)',
                                  borderRadius: 3,
                                  boxShadow: '0 4px 20px rgba(76, 175, 80, 0.1)',
                                  border: '1px solid rgba(76, 175, 80, 0.1)'
                                }}>
                                  <Grid container spacing={2}>
                                    <Grid item xs={12} md={6}>
                                      <Typography variant="subtitle2" sx={{ fontWeight: 600, color: '#4caf50', mb: 1 }}>
                                        Current Step
                                      </Typography>
                                      <Typography variant="body1" sx={{ color: '#333', mb: 2 }}>
                                        Step {po.StepId}: {stepNumberToAction[po.StepId] || 'Unknown'}
                                      </Typography>
                                    </Grid>
                                    <Grid item xs={12} md={6}>
                                      <Typography variant="subtitle2" sx={{ fontWeight: 600, color: '#4caf50', mb: 1 }}>
                                        Next Step
                                      </Typography>
                                      <Typography variant="body1" sx={{ color: '#333', mb: 2 }}>
                                        Step {po.NextStep}: {stepNumberToAction[po.NextStep] || 'Unknown'}
                                      </Typography>
                                    </Grid>
                                    <Grid item xs={12} md={6}>
                                      <Typography variant="subtitle2" sx={{ fontWeight: 600, color: '#4caf50', mb: 1 }}>
                                        Assigned To
                                      </Typography>
                                      <Typography variant="body1" sx={{ color: '#333', mb: 2 }}>
                                        {stepMappings.find(m => m.action === stepNumberToAction[po.NextStep])?.assignedTo || 'N/A'}
                                      </Typography>
                                    </Grid>
                                    <Grid item xs={12} md={6}>
                                      <Typography variant="subtitle2" sx={{ fontWeight: 600, color: '#4caf50', mb: 1 }}>
                                        Last Modified
                                      </Typography>
                                      <Typography variant="body1" sx={{ color: '#333', mb: 2 }}>
                                        {po.LastModifiedAt ? new Date(po.LastModifiedAt).toLocaleString() : 'N/A'}
                                      </Typography>
                                    </Grid>
                                  </Grid>
                                </Box>
                              </Box>
                            </Collapse>
                          </TableCell>
                        </TableRow>
                      </React.Fragment>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
              
              {/* Pagination for POs */}
              {filteredPOs.length > 0 && (
                <Box sx={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'center',
                  p: 2,
                  borderTop: '1px solid rgba(76, 175, 80, 0.1)',
                  backgroundColor: 'rgba(248, 250, 255, 0.5)'
                }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Typography variant="body2" sx={{ color: '#6c757d', fontWeight: 500 }}>
                      Rows per page:
                    </Typography>
                    <FormControl size="small" sx={{ minWidth: 80 }}>
                      <Select
                        value={posRowsPerPage}
                        onChange={(e) => {
                          setPosRowsPerPage(e.target.value);
                          setPosPage(0);
                        }}
                        sx={{
                          '& .MuiOutlinedInput-notchedOutline': {
                            borderColor: 'rgba(76, 175, 80, 0.3)',
                          },
                          '&:hover .MuiOutlinedInput-notchedOutline': {
                            borderColor: 'rgba(107, 114, 128, 0.5)',
                          },
                          '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                            borderColor: '#4caf50',
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
                      {posPage * posRowsPerPage + 1}-{Math.min((posPage + 1) * posRowsPerPage, filteredPOs.length)} of {filteredPOs.length} purchase orders
                    </Typography>
                    
                    {Math.ceil(filteredPOs.length / posRowsPerPage) > 1 && (
                      <Pagination
                        count={Math.ceil(filteredPOs.length / posRowsPerPage)}
                        page={posPage + 1}
                        onChange={(event, value) => setPosPage(value - 1)}
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
                              background: 'linear-gradient(135deg, #4caf50 0%, #388e3c 100%)',
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
            </Paper>
          </Box>
        )}

        {/* Main Flow Stepper */}
        {/* <Paper sx={{ p: 3, mb: 4, overflowX: 'auto' }}>
          <Stepper activeStep={activeStep} alternativeLabel>
            {steps.map((step) => (
              <Step 
                key={step.id}
                completed={stepStatuses[step.id] === 'completed'}
                sx={{
                  '& .MuiStepLabel-root': {
                    color: isNextStep(step.id) ? 'primary.main' : 'inherit',
                    '& .MuiStepLabel-label': {
                      fontWeight: isNextStep(step.id) ? 'bold' : 'normal'
                    }
                  }
                }}
              >
                <StepLabel
                  StepIconComponent={() => getStepIcon(step.id)}
                >
                  <Typography variant="subtitle2">{step.role}</Typography>
                  <Typography variant="body2">{step.action}</Typography>
                  <Typography variant="caption">TAT: {step.tat}</Typography>
                  {stepStatuses[step.id] && (
                    <Chip
                      label={stepStatuses[step.id]}
                      color={getStatusColor(stepStatuses[step.id])}
                      size="small"
                      sx={{ mt: 0.5 }}
                    />
                  )}
                </StepLabel>
              </Step>
            ))}
          </Stepper>
        </Paper> */}

                {/* Step Action Dialog */}
                {selectedStep && (
                  <StepAction
                    open={!!selectedStep}
                    onClose={() => setSelectedStep(null)}
                    step={selectedStep}
                    onActionComplete={handleActionComplete}
                    flowId={currentFlowId}
                  />
                )}
                </Box>
              )}
            </Box>
          </Slide>
        </Box>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={() => setSnackbar({ ...snackbar, open: false })} severity={snackbar.severity} sx={{ width: '100%' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default PurchaseFlow; 