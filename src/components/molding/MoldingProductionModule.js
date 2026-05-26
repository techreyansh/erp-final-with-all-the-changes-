import React, { useState } from "react";
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
} from "@mui/material";
import {
  Engineering as MoldIcon,
  Settings as AssemblyIcon,
  Inventory as PowerCordIcon,
  Schedule as PlanningIcon,
  Analytics as ReportsIcon,
  Build as ProductionIcon,
  Dashboard as DashboardIcon,
  TrendingUp as TrendingIcon,
  Speed as SpeedIcon,
  Assignment as AssignmentIcon,
  PlayArrow as PlayIcon,
  Insights as InsightsIcon,
} from "@mui/icons-material";

// Import components
import KPICard from "../common/KPICard";
import PowerCordMaster from "./PowerCordMaster";
import MoldingProductionPlanning from "./MoldingProductionPlanning";
import ProductionManagement from "./ProductionManagement";
import ProductionDemo from "./ProductionDemo";

// Dashboard Component
const MoldingDashboard = () => {
  const theme = useTheme();

  const kpiCards = [
    {
      title: "Power Cord Master",
      description: "Manage power cord specifications (2-pin, 3-pin, 6A, 16A variants).",
      value: "24",
      subtitle: "Active Products",
      icon: <PowerCordIcon />,
      progress: 85,
      trend: "+12%",
      trendUp: true,
      variant: "default",
      color: "warning",
    },
    {
      title: "Production Planning",
      description: "Optimize cutting, assembly, and molding workflows with batch scheduling.",
      value: "3",
      subtitle: "Active Plans",
      icon: <PlanningIcon />,
      progress: 72,
      trend: "+8%",
      trendUp: true,
      variant: "gradient",
      color: "secondary",
    },
    {
      title: "Production Management",
      description: "Real-time monitoring of assembly lines and molding machines.",
      value: "97%",
      subtitle: "Overall Efficiency",
      icon: <ProductionIcon />,
      progress: 97,
      trend: "+3%",
      trendUp: true,
      variant: "default",
      color: "success",
    },
    {
      title: "Machine Monitoring",
      description: "Track 4 assembly lines and 6 molding machines with live status.",
      value: "8/10",
      subtitle: "Running",
      icon: <SpeedIcon />,
      progress: 80,
      trend: "+15%",
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
                background: `linear-gradient(135deg, ${theme.palette.warning.main}, ${theme.palette.secondary.main})`,
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
              Real-time insights and analytics for your injection molding operations
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
              backgroundColor: theme.palette.warning.main,
              '&:hover': {
                backgroundColor: theme.palette.warning.dark,
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
            xs: '1fr', // Mobile: 1 card per row
            sm: 'repeat(2, 1fr)', // Tablet: 2 cards per row
            lg: 'repeat(4, 1fr)', // Desktop: 4 cards per row
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
              background: `linear-gradient(135deg, ${alpha(theme.palette.warning.main, 0.1)} 0%, ${alpha(theme.palette.warning.main, 0.05)} 100%)`,
              borderBottom: `1px solid ${theme.palette.divider}`,
            }}
          >
            <CardContent sx={{ py: 3 }}>
              <Stack direction="row" alignItems="center" spacing={3}>
                <Box 
                  sx={{ 
                    p: 2, 
                    borderRadius: 3,
                    backgroundColor: alpha(theme.palette.warning.main, 0.1),
                    color: theme.palette.warning.main,
                  }}
                >
                  <AssignmentIcon sx={{ fontSize: 32 }} />
                </Box>
                <Box>
                  <Typography 
                    variant="h4" 
                    sx={{ 
                      fontWeight: 700, 
                      color: theme.palette.warning.main,
                      fontSize: { xs: '1.5rem', sm: '1.75rem', md: '2rem' },
                      mb: 0.5,
                    }}
                  >
                    Power Cord Manufacturing Process
                  </Typography>
                  <Typography variant="subtitle1" color="text.secondary">
                    Complete power cord manufacturing workflow from material inward to finished products
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
                { step: 1, label: "Material Inward", color: "#ff6f00", description: "Receive cables & raw materials" },
                { step: 2, label: "Wire Cut", color: "#ff8f00", description: "Cut cables to specific lengths" },
                { step: 3, label: "Assembly", color: "#ffa000", description: "Stripping, pin insertion, terminals" },
                { step: 4, label: "Molding", color: "#ffb300", description: "Inner, outer & grommet molding" },
                { step: 5, label: "Packaging", color: "#ffc107", description: "Final testing & packaging" },
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
              severity="warning" 
              sx={{ 
                borderRadius: 3,
                backgroundColor: alpha(theme.palette.warning.main, 0.05),
                border: `1px solid ${alpha(theme.palette.warning.main, 0.1)}`,
                '& .MuiAlert-icon': {
                  color: theme.palette.warning.main,
                },
              }}
            >
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
                Production Example: 3-Pin Power Cord Order
              </Typography>
              <Typography 
                variant="body1" 
                sx={{ 
                  lineHeight: 1.6,
                  '& strong': { fontWeight: 600 },
                }}
              >
                <strong>Order:</strong> 10,000 pieces × 16A × 3-pin molded power cords
                <br />
                <strong>Process:</strong> Injection molding cycle: 25s | Clamping force: 180T | Material: ABS+PC blend
                <br />
                <strong>Output:</strong> Expected production rate: 144 pieces/hour | Total time: ~70 hours
              </Typography>
            </Alert>
          </CardContent>
        </Card>
      </Fade>
    </Box>
  );
};

const MoldingProductionModule = () => {
  const [activeTab, setActiveTab] = useState(0);
  const [isInitialized, setIsInitialized] = useState(true); // Set to false for first-time setup
  const theme = useTheme();

  const tabComponents = [
    {
      label: "Dashboard",
      icon: <DashboardIcon />,
      component: <MoldingDashboard />,
      description: "Overview and analytics",
    },
    {
      label: "Power Cord Master",
      icon: <PowerCordIcon />,
      component: <PowerCordMaster />,
      description: "Product specifications",
    },
    {
      label: "Production Planning",
      icon: <PlanningIcon />,
      component: <MoldingProductionPlanning />,
      description: "Plan production schedules",
    },
    {
      label: "Production Management",
      icon: <ProductionIcon />,
      component: <ProductionManagement />,
      description: "Real-time monitoring",
    },
    {
      label: "Demo",
      icon: <PlayIcon />,
      component: <ProductionDemo />,
      description: "Live demonstration",
    },
  ];

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
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
          background: `linear-gradient(135deg, ${theme.palette.warning.main} 0%, ${theme.palette.secondary.main} 100%)`,
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
                  <MoldIcon sx={{ fontSize: { xs: 48, sm: 56, md: 64 }, color: "#ffffff" }} />
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
                    Molding Production Management
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
                    Advanced injection molding control and optimization platform
                  </Typography>
                  
                  <Stack direction="row" spacing={1} flexWrap="wrap" justifyContent={{ xs: "center", md: "flex-start" }}>
                    {["Industry 4.0 Ready", "AI Optimization", "Smart Automation"].map((feature, index) => (
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

export default MoldingProductionModule; 