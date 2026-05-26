import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  Box,
  Typography,
  Tabs,
  Tab,
  Paper,
  Card,
  CardContent,
  Grid,
  Button,
  Alert,
  LinearProgress,
  useTheme,
  alpha,
  Stack,
  Chip,
  Divider,
  Container,
  Fade,
  Slide,
  IconButton,
  CircularProgress,
  Tooltip,
} from "@mui/material";
import {
  Power as CableIcon,
  Engineering as PlanningIcon,
  Schedule as ScheduleIcon,
  Dashboard as DashboardIcon,
  TrendingUp as TrendingIcon,
  Speed as SpeedIcon,
  Assignment as AssignmentIcon,
  PlayArrow as PlayIcon,
  Insights as InsightsIcon,
  Refresh as RefreshIcon,
  ErrorOutline as ErrorIcon,
} from "@mui/icons-material";

// Import components
import KPICard from "../common/KPICard";
import CableProductionPlanning from "./CableProductionPlanning";
import MachineScheduling from "./MachineScheduling";
import WhatsAppButton from "../common/WhatsAppButton";
import sheetService from "../../services/sheetService";

// Dashboard Component - moved before main component to fix temporal dead zone issue
const CableDashboard = () => {
  const theme = useTheme();
  const [metrics, setMetrics] = useState({
    products: 0,
    plans: 0,
    schedules: 0,
    productsEff: 0,
    plansEff: 0,
    schedulesEff: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastRefresh, setLastRefresh] = useState(new Date());

  // Memoized helper function to count active products
  const countActiveProducts = useCallback((arr) => {
    if (!Array.isArray(arr) || arr.length === 0) return 0;
    const codes = new Set();
    arr.forEach(p => {
      if (!p) return;
      const code = (p.productCode || p.ProductCode || "").toString().trim();
      if (!code) return;
      const hasCopper = Boolean(p.copperSize || p.conductorSize || p.copperDiameter);
      const hasCores = Boolean(p.coreColors || p.CoreColors || p.coreCount || p.numberOfCore);
      if (hasCopper && hasCores) {
        codes.add(code);
      }
    });
    return codes.size;
  }, []);

  // Memoized function to load dashboard data
  const loadDashboardData = useCallback(async (forceRefresh = false) => {
    setLoading(true);
    setError(null);
    try {
      const [productsResult, plansResult, schedulesResult, clientsModResult] = await Promise.allSettled([
        sheetService.getSheetData("Cable Products", forceRefresh),
        sheetService.getSheetData("Cable Production Plans", forceRefresh),
        sheetService.getSheetData("Machine Schedules", forceRefresh),
        import("../../services/clientService"),
      ]);

      const products = productsResult.status === 'fulfilled' ? productsResult.value : [];
      const plans = plansResult.status === 'fulfilled' ? plansResult.value : [];
      const schedules = schedulesResult.status === 'fulfilled' ? schedulesResult.value : [];
      const clientsMod = clientsModResult.status === 'fulfilled' ? clientsModResult.value : null;

      const productsArr = Array.isArray(products) ? products : [];
      const plansArr = Array.isArray(plans) ? plans : [];
      const schedulesArr = Array.isArray(schedules) ? schedules : [];

      // Fallback: aggregate distinct product codes from client products if sheet is empty
      let clientProducts = [];
      if (clientsMod && clientsMod.getAllClients) {
        try {
          const clients = await clientsMod.getAllClients();
          if (Array.isArray(clients)) {
            clients.forEach(c => {
              if (c && Array.isArray(c.products)) {
                clientProducts.push(...c.products);
              }
            });
          }
        } catch (clientError) {
          console.warn("Error fetching client products:", clientError);
        }
      }

      const distinctClientProductCodes = Array.from(
        new Set(
          clientProducts
            .map(p => (p?.productCode || p?.ProductCode || "").toString().trim())
            .filter(Boolean)
        )
      );

      const activeSheetProducts = countActiveProducts(productsArr);
      const activeClientProducts = countActiveProducts(clientProducts);
      const productCount = activeSheetProducts || activeClientProducts || distinctClientProductCodes.length;

      // Product Master efficiency: average completeness of key fields
      let productsEff = 0;
      if (productsArr.length > 0) {
        const keysPerProduct = productsArr.map(p => {
          if (!p) return 0;
          const hasCode = Boolean(p.productCode || p.ProductCode);
          const hasColors = Boolean(p.coreColors || p.CoreColors || p.coreCount || p.numberOfCore);
          const hasCopper = Boolean(p.copperSize || p.conductorSize || p.copperDiameter);
          const hasOD = Boolean(p.coreOD || p.sheathOD || p.coreOuterDiameter || p.sheathOuterDiameter || p.overallOD || p.cableOD);
          const filled = [hasCode, hasColors, hasCopper, hasOD].filter(Boolean).length;
          return filled / 4;
        });
        const totalEfficiency = keysPerProduct.reduce((a, b) => a + b, 0);
        productsEff = keysPerProduct.length > 0 ? Math.round((totalEfficiency / keysPerProduct.length) * 100) : 0;
      }

      // Plans efficiency: plans with valid material requirements present
      let plansEff = 0;
      if (plansArr.length > 0) {
        let valid = 0;
        plansArr.forEach(pl => {
          if (!pl) return;
          try {
            const mr = typeof pl.materialRequirements === 'string' 
              ? JSON.parse(pl.materialRequirements) 
              : pl.materialRequirements;
            if (mr && typeof mr === 'object' && !mr.error && (mr.totalWireLength || 0) > 0) {
              valid += 1;
            }
          } catch (parseError) {
            // Invalid JSON, skip this plan
            console.warn("Error parsing material requirements for plan:", parseError);
          }
        });
        plansEff = plansArr.length > 0 ? Math.round((valid / plansArr.length) * 100) : 0;
      }

      // Schedules efficiency: in-progress over (scheduled + in-progress)
      const schedRelevant = schedulesArr.filter(s => s && (s.status === 'Scheduled' || s.status === 'In Progress'));
      const inProg = schedRelevant.filter(s => s && s.status === 'In Progress').length;
      const schedulesEff = schedRelevant.length > 0 ? Math.round((inProg / schedRelevant.length) * 100) : 0;

      setMetrics({
        products: productCount,
        plans: plansArr.length,
        schedules: schedulesArr.length,
        productsEff,
        plansEff,
        schedulesEff,
      });
      setLastRefresh(new Date());
    } catch (err) {
      console.error("Error loading dashboard data:", err);
      setError(err.message || "Failed to load dashboard data. Please try refreshing.");
    } finally {
      setLoading(false);
    }
  }, [countActiveProducts]);

  // Initial load
  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);

  // Auto-refresh every 5 minutes
  useEffect(() => {
    const interval = setInterval(() => {
      loadDashboardData(true);
    }, 5 * 60 * 1000); // 5 minutes

    return () => clearInterval(interval);
  }, [loadDashboardData]);

  // Memoized KPI cards to prevent unnecessary recalculations
  const kpiCards = useMemo(() => [
    {
      title: "Production Plans", 
      description: "Cable production plans ready for execution.",
      value: String(metrics.plans),
      subtitle: "Active Plans",
      icon: <PlanningIcon />,
      progress: metrics.plansEff,
      trend: undefined,
      trendUp: undefined,
      variant: "gradient",
      color: "secondary",
    },
    {
      title: "Machine Schedule",
      description: "Manage machine allocation and production scheduling.",
      value: String(metrics.schedules),
      subtitle: "Scheduled Tasks",
      icon: <ScheduleIcon />,
      progress: metrics.schedulesEff,
      trend: undefined,
      trendUp: undefined,
      variant: "default",
      color: "info",
    },
  ], [metrics]);

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
                background: `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
                backgroundClip: "text",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                mb: 1,
                fontSize: { xs: '1.75rem', sm: '2.125rem', md: '2.5rem' },
              }}
            >
              Production Dashboard
            </Typography>
            <Typography 
              variant="h6" 
              color="text.secondary"
              sx={{ 
                fontSize: { xs: '1rem', sm: '1.1rem' },
                fontWeight: 400,
              }}
            >
              Real-time insights and analytics for your cable manufacturing operations
            </Typography>
            {lastRefresh && (
              <Typography 
                variant="caption" 
                color="text.secondary"
                sx={{ 
                  fontSize: '0.75rem',
                  mt: 0.5,
                  display: 'block',
                }}
              >
                Last updated: {lastRefresh.toLocaleTimeString()}
              </Typography>
            )}
          </Box>
          
          <Stack direction="row" spacing={2} alignItems="center">
            {/* WhatsApp Quick Send Button */}
            <WhatsAppButton
              task={{
                POId: 'DASHBOARD',
                DispatchUniqueId: 'DASHBOARD',
                ClientCode: 'ALL',
                ClientName: 'All Customers',
                Status: 'ACTIVE'
              }}
              stageName="CABLE_PRODUCTION"
              status="ACTIVE"
              size="medium"
              variant="icon"
            />
            <Tooltip title="Refresh dashboard data">
              <IconButton
                onClick={() => loadDashboardData(true)}
                disabled={loading}
                sx={{
                  backgroundColor: alpha(theme.palette.primary.main, 0.1),
                  '&:hover': {
                    backgroundColor: alpha(theme.palette.primary.main, 0.2),
                  },
                }}
              >
                {loading ? (
                  <CircularProgress size={24} />
                ) : (
                  <RefreshIcon />
                )}
              </IconButton>
            </Tooltip>
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
              }}
            >
              View Analytics
            </Button>
          </Stack>
        </Stack>
      </Box>

      {/* Error Alert */}
      {error && (
        <Alert 
          severity="error" 
          icon={<ErrorIcon />}
          onClose={() => setError(null)}
          sx={{ mb: 3 }}
          action={
            <Button color="inherit" size="small" onClick={() => loadDashboardData(true)}>
              Retry
            </Button>
          }
        >
          {error}
        </Alert>
      )}

      {/* Loading Indicator */}
      {loading && !error && (
        <Box sx={{ mb: 3 }}>
          <LinearProgress />
          <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
            Loading dashboard data...
          </Typography>
        </Box>
      )}
      
      {/* KPI Cards Grid Layout */}
      <Box 
        sx={{ 
          display: 'grid',
          gridTemplateColumns: {
            xs: '1fr', // Mobile: 1 card per row
            sm: 'repeat(2, 1fr)', // Tablet: 2 cards per row
            lg: 'repeat(3, 1fr)', // Desktop: 3 cards per row (removed Product Master)
          },
          gap: { xs: 3, sm: 4, md: 5 }, // Consistent gap spacing
          mb: { xs: 4, sm: 5, md: 8 },
          alignItems: 'stretch', // All cards same height
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
                  <AssignmentIcon sx={{ fontSize: 32 }} />
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
                    Manufacturing Process Flow
                  </Typography>
                  <Typography variant="subtitle1" color="text.secondary">
                    Complete cable production workflow from raw materials to finished products
                  </Typography>
                </Box>
              </Stack>
            </CardContent>
          </Box>

          <CardContent sx={{ p: { xs: 4, sm: 5, md: 6 } }}>
            {/* Process Steps */}
            <Box sx={{ 
              display: "flex", 
              alignItems: "center", 
              gap: { xs: 3, sm: 4, md: 6 }, 
              flexWrap: "wrap", 
              justifyContent: "center",
            }}>
              {[
                { step: 1, label: "Raw Copper", color: "#f44336", description: "High-grade copper wire preparation" },
                { step: 2, label: "Bunching", color: "#e91e63", description: "Multi-strand bundling (>24 strands)" },
                { step: 3, label: "Extrusion", color: "#9c27b0", description: "Single core PVC coating" },
                { step: 4, label: "Laying", color: "#673ab7", description: "Multi-core cable assembly" },
                { step: 5, label: "Sheathing", color: "#3f51b5", description: "Outer protective coating" },
                { step: 6, label: "Finishing", color: "#2196f3", description: "Quality testing & packaging" },
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
                        width: { xs: 80, sm: 90, md: 100 }, 
                        height: { xs: 80, sm: 90, md: 100 }, 
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
                          fontSize: { xs: '1.75rem', sm: '2rem', md: '2.25rem' },
                        }}
                      >
                        {process.step}
                      </Typography>
                    </Box>
                    
                    {/* Connection Line */}
                    {index < 5 && (
                      <Box 
                        sx={{ 
                          position: "absolute",
                          top: "50%",
                          right: { xs: -20, sm: -24, md: -30 },
                          width: { xs: 40, sm: 48, md: 60 },
                          height: 3,
                          background: `linear-gradient(90deg, ${process.color}, ${alpha(process.color, 0.3)})`,
                          borderRadius: 2,
                          zIndex: 1,
                          display: { xs: 'none', sm: 'block' },
                        }}
                      />
                    )}
                  </Box>
                  
                  <Box sx={{ textAlign: "center", maxWidth: 120 }}>
                    <Typography 
                      variant="h6" 
                      sx={{ 
                        fontWeight: 700,
                        color: process.color,
                        fontSize: { xs: '0.9rem', sm: '1rem' },
                        mb: 0.5,
                      }}
                    >
                      {process.label}
                    </Typography>
                    <Typography 
                      variant="caption" 
                      color="text.secondary"
                      sx={{ 
                        fontSize: { xs: '0.7rem', sm: '0.75rem' },
                        lineHeight: 1.3,
                        display: "block",
                      }}
                    >
                      {process.description}
                    </Typography>
                  </Box>
                </Stack>
              ))}
            </Box>
            
            <Divider sx={{ my: 5 }} />
            
            {/* Production Example */}
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
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
                Production Example: 3-Core Cable Order
              </Typography>
              <Typography 
                variant="body1" 
                sx={{ 
                  lineHeight: 1.6,
                  '& strong': { fontWeight: 600 },
                }}
              >
                <strong>Order:</strong> 5,000 pieces × 6A × 1.8m × 3-core cable
                <br />
                <strong>Calculations:</strong> Total length: 9,000m | Single core needed: 27,000m
                <br />
                <strong>Material breakdown:</strong> Red: 9,000m | Black: 9,000m | Yellow-Green: 9,000m
              </Typography>
            </Alert>
          </CardContent>
        </Card>
      </Fade>
    </Box>
  );
};

const CableProductionModule = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const theme = useTheme();

  const tabComponents = [
    {
      label: "Dashboard",
      icon: <DashboardIcon />,
      component: <CableDashboard />,
      description: "Overview and analytics",
      route: "/cable-production/dashboard",
    },
    {
      label: "Production Planning", 
      icon: <PlanningIcon />,
      component: <CableProductionPlanning />,
      description: "Planning and schedules",
      route: "/cable-production/production-planning",
    },
    {
      label: "Machine Scheduling",
      icon: <ScheduleIcon />,
      component: <MachineScheduling />,
      description: "Resource allocation",
      route: "/cable-production/machine-scheduling",
    },
  ];

  // Determine active tab based on current route
  const getActiveTabFromRoute = useCallback(() => {
    const currentPath = location.pathname;
    const tabIndex = tabComponents.findIndex(tab => tab.route === currentPath);
    return tabIndex >= 0 ? tabIndex : 0; // Default to dashboard if route doesn't match
  }, [location.pathname]);

  const [activeTab, setActiveTab] = useState(getActiveTabFromRoute());

  // Update active tab when route changes
  useEffect(() => {
    setActiveTab(getActiveTabFromRoute());
  }, [location.pathname, getActiveTabFromRoute]);

  const handleTabChange = (event, newValue) => {
    const selectedTab = tabComponents[newValue];
    if (selectedTab && selectedTab.route) {
      navigate(selectedTab.route);
    }
  };

  return (
    <Box 
      sx={{ 
        width: "100%",
        minHeight: "100vh",
        backgroundColor: theme.palette.grey[50],
      }}
    >
      {/* Modern Header Section */}
      <Paper 
        elevation={0}
        sx={{ 
          background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 100%)`,
          color: "white",
          borderRadius: 0,
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* Background Pattern */}
        <Box
          sx={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.1'%3E%3Ccircle cx='30' cy='30' r='2'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
            opacity: 0.3,
          }}
        />
        
        <Container maxWidth={false} sx={{ position: "relative", zIndex: 1, px: { xs: 2, md: 3 } }}>
          <Box sx={{ py: { xs: 4, sm: 6, md: 8 } }}>
            <Fade in timeout={800}>
              <Stack direction={{ xs: "column", md: "row" }} alignItems="center" spacing={4}>
                <Box 
                  sx={{ 
                    p: 3, 
                    borderRadius: 3, 
                    backgroundColor: alpha("#ffffff", 0.15),
                    backdropFilter: "blur(20px)",
                    border: `1px solid ${alpha("#ffffff", 0.2)}`,
                  }}
                >
                  <CableIcon sx={{ fontSize: { xs: 48, sm: 56, md: 64 }, color: "#ffffff" }} />
                </Box>
                
                <Box sx={{ textAlign: { xs: "center", md: "left" } }}>
                  <Typography 
                    variant="h2" 
                    gutterBottom 
                    sx={{ 
                      fontWeight: 800,
                      textShadow: "0 4px 8px rgba(0,0,0,0.3)",
                      mb: 2,
                      fontSize: { xs: '2rem', sm: '2.5rem', md: '3rem' },
                      letterSpacing: "-0.02em",
                    }}
                  >
                    Cable Production Management
                  </Typography>
                  <Typography 
                    variant="h5" 
                    sx={{ 
                      opacity: 0.95,
                      fontWeight: 400,
                      mb: 3,
                      fontSize: { xs: '1.1rem', sm: '1.25rem' },
                      lineHeight: 1.4,
                    }}
                  >
                    Advanced manufacturing control and optimization platform
                  </Typography>
                  
                  <Stack direction="row" spacing={1} flexWrap="wrap" justifyContent={{ xs: "center", md: "flex-start" }}>
                    {["Industry 4.0 Ready", "Real-time Analytics", "Smart Automation"].map((feature, index) => (
                      <Chip 
                        key={index}
                        label={feature} 
                        sx={{ 
                          backgroundColor: alpha("#ffffff", 0.2), 
                          color: "#ffffff",
                          fontWeight: 600,
                          backdropFilter: "blur(10px)",
                          border: `1px solid ${alpha("#ffffff", 0.3)}`,
                        }} 
                      />
                    ))}
                  </Stack>
                </Box>
              </Stack>
            </Fade>
          </Box>
        </Container>
        
        {/* Enhanced Tabs - Sticky Navigation */}
        <Box 
          sx={{ 
            backgroundColor: alpha("#000000", 0.1), 
            backdropFilter: "blur(10px)",
            position: "sticky",
            top: 64, // Account for main header
            zIndex: 200,
            borderBottom: "1px solid",
            borderColor: alpha("#ffffff", 0.2),
          }}
        >
          <Container maxWidth={false} sx={{ px: { xs: 2, md: 3 } }}>
            <Tabs
              value={activeTab}
              onChange={handleTabChange}
              variant="scrollable"
              scrollButtons="auto"
              sx={{ 
                minHeight: 80,
                '& .MuiTab-root': {
                  minHeight: 80,
                  color: alpha("#ffffff", 0.8),
                  fontWeight: 600,
                  textTransform: "none",
                  fontSize: "0.95rem",
                  px: 3,
                  py: 2,
                  '&.Mui-selected': {
                    color: "#ffffff",
                    backgroundColor: alpha("#ffffff", 0.15),
                  },
                  '&:hover': {
                    backgroundColor: alpha("#ffffff", 0.08),
                  },
                },
                '& .MuiTabs-indicator': {
                  backgroundColor: "#ffffff",
                  height: 3,
                  borderRadius: "3px 3px 0 0",
                },
              }}
            >
              {tabComponents.map((tab, index) => (
                <Tab
                  key={index}
                  label={
                    <Stack spacing={0.5} alignItems="center">
                      <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                        {tab.icon}
                        <Typography variant="inherit" sx={{ fontWeight: "inherit" }}>
                          {tab.label}
                        </Typography>
                      </Box>
                      <Typography variant="caption" sx={{ opacity: 0.8, fontSize: "0.7rem" }}>
                        {tab.description}
                      </Typography>
                    </Stack>
                  }
                />
              ))}
            </Tabs>
          </Container>
        </Box>
      </Paper>

      {/* Main Content */}
      <Container maxWidth={false} sx={{ px: { xs: 2, md: 3 } }}>
        <Box sx={{ py: { xs: 3, sm: 4, md: 6 } }}>
          <Slide direction="left" in timeout={600}>
            <Box>
              {tabComponents[activeTab].component}
            </Box>
          </Slide>
        </Box>
      </Container>
    </Box>
  );
};

export default CableProductionModule; 