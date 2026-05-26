import React from "react";
import { 
  Box, 
  Paper, 
  Typography, 
  Container,
  Card,
  CardContent,
  Grid,
  Stack,
  Avatar,
  Chip,
  useTheme,
  useMediaQuery,
  Fade,
  Zoom,
  IconButton,
  Tooltip,
  Badge,
  Divider
} from "@mui/material";
import {
  Engineering as MoldIcon,
  Inventory as PowerCordIcon,
  Schedule as PlanningIcon,
  Build as ProductionIcon,
  Dashboard as DashboardIcon,
  Analytics as AnalyticsIcon,
  TrendingUp as TrendingUpIcon,
  Speed as SpeedIcon,
  ArrowForward as ArrowForwardIcon,
  AdminPanelSettings as AdminIcon,
  Security as SecurityIcon
} from "@mui/icons-material";
import { useAuth } from "../../context/AuthContext";
import { useNavigate } from "react-router-dom";

const MoldingMainNavigation = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const { role: userRole } = useAuth();
  const navigate = useNavigate();

  // Enhanced module configuration with navigation
  const moldingModules = [
    {
      id: "dashboard",
      label: "Dashboard",
      icon: <DashboardIcon />,
      description: "Real-time insights and analytics for molding operations",
      color: "#ff9800",
      gradient: "linear-gradient(135deg, #ff9800 0%, #f57c00 100%)",
      route: "/molding/dashboard"
    },
    {
      id: "power-cord-master",
      label: "Power Cord Master",
      icon: <PowerCordIcon />,
      description: "Manage power cord specifications and product variants",
      color: "#2196f3",
      gradient: "linear-gradient(135deg, #2196f3 0%, #1976d2 100%)",
      route: "/molding/power-cord-master"
    },
    {
      id: "production-planning",
      label: "Production Planning",
      icon: <PlanningIcon />,
      description: "Optimize cutting, assembly, and molding workflows",
      color: "#9c27b0",
      gradient: "linear-gradient(135deg, #9c27b0 0%, #7b1fa2 100%)",
      route: "/molding/production-planning"
    },
    {
      id: "production-management",
      label: "Production Management",
      icon: <ProductionIcon />,
      description: "Real-time monitoring of assembly lines and machines",
      color: "#4caf50",
      gradient: "linear-gradient(135deg, #4caf50 0%, #388e3c 100%)",
      route: "/molding/production-management"
    }
  ];

  const handleModuleClick = (route) => {
    navigate(route);
  };

  // Role-based access control
  const hasAccess = userRole === "Store Manager" || userRole === "CEO" || userRole === "Production Manager";

  if (!hasAccess) {
    return (
      <Container maxWidth="md" sx={{ py: 8 }}>
        <Fade in timeout={800}>
          <Card 
            sx={{ 
              p: 6, 
              textAlign: 'center',
              background: 'linear-gradient(135deg, #ff6b6b 0%, #ffa726 100%)',
              color: 'white',
              boxShadow: 6
            }}
          >
            <Avatar 
              sx={{ 
                bgcolor: 'rgba(255,255,255,0.2)', 
                width: 80, 
                height: 80, 
                mx: 'auto', 
                mb: 3 
              }}
            >
              <SecurityIcon sx={{ fontSize: 40 }} />
            </Avatar>
            <Typography variant="h4" gutterBottom sx={{ fontWeight: 'bold' }}>
              Access Restricted
            </Typography>
            <Typography variant="h6" sx={{ mb: 3, opacity: 0.9 }}>
              Molding Production Portal
            </Typography>
            <Divider sx={{ my: 3, bgcolor: 'rgba(255,255,255,0.3)' }} />
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 2 }}>
              <AdminIcon />
              <Typography variant="body1" sx={{ fontSize: '1.1rem' }}>
                Only authorized production staff can access this section
              </Typography>
            </Box>
          </Card>
        </Fade>
      </Container>
    );
  }

  return (
    <Container maxWidth="xl" sx={{ py: 3 }}>
      {/* Enhanced Header Section */}
      <Fade in timeout={600}>
        <Card 
          sx={{ 
            mb: 4, 
            background: 'linear-gradient(135deg, #ff9800 0%, #f57c00 100%)',
            color: 'white',
            boxShadow: 6
          }}
        >
          <CardContent sx={{ py: 4 }}>
            <Stack 
              direction={{ xs: "column", md: "row" }} 
              alignItems="center" 
              spacing={3}
              justifyContent="space-between"
            >
              <Stack direction="row" alignItems="center" spacing={3}>
                <Avatar 
                  sx={{ 
                    bgcolor: 'rgba(255,255,255,0.2)', 
                    width: 64, 
                    height: 64 
                  }}
                >
                  <MoldIcon sx={{ fontSize: 32 }} />
                </Avatar>
                <Box>
                  <Typography 
                    variant="h3" 
                    component="h1" 
                    sx={{ 
                      fontWeight: 'bold',
                      mb: 1,
                      fontSize: { xs: '2rem', md: '3rem' }
                    }}
                  >
                    Molding Production
                  </Typography>
                  <Typography 
                    variant="h6" 
                    sx={{ 
                      opacity: 0.9,
                      fontSize: { xs: '1rem', md: '1.25rem' }
                    }}
                  >
                    Advanced injection molding control & optimization platform
                  </Typography>
                </Box>
              </Stack>
              
              <Stack direction="row" spacing={2}>
                <Tooltip title="Active User">
                  <Chip 
                    icon={<AdminIcon />}
                    label={userRole}
                    variant="outlined"
                    sx={{ 
                      color: 'white', 
                      borderColor: 'rgba(255,255,255,0.5)',
                      '& .MuiChip-icon': { color: 'white' }
                    }}
                  />
                </Tooltip>
                <Tooltip title="System Status">
                  <IconButton sx={{ color: 'white' }}>
                    <Badge badgeContent={4} color="error">
                      <AnalyticsIcon />
                    </Badge>
                  </IconButton>
                </Tooltip>
              </Stack>
            </Stack>
          </CardContent>
        </Card>
      </Fade>

      {/* Module Navigation */}
      <Zoom in timeout={800}>
        <Box sx={{ mb: 4 }}>
          <Stack direction="row" alignItems="center" spacing={2} sx={{ mb: 3 }}>
            <DashboardIcon color="primary" />
            <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
              Molding Modules
            </Typography>
          </Stack>
          
          <Grid container spacing={3}>
            {moldingModules.map((module, index) => (
              <Grid item xs={12} sm={6} md={6} lg={3} key={module.id}>
                <Fade in timeout={600 + (index * 100)}>
                  <Card 
                    sx={{ 
                      height: '100%',
                      cursor: 'pointer',
                      transition: 'all 0.3s ease',
                      '&:hover': {
                        transform: 'translateY(-8px)',
                        boxShadow: 8
                      }
                    }}
                    onClick={() => handleModuleClick(module.route)}
                  >
                    <CardContent sx={{ p: 3, height: '100%', display: 'flex', flexDirection: 'column' }}>
                      <Stack direction="row" alignItems="center" spacing={2} sx={{ mb: 2 }}>
                        <Avatar 
                          sx={{ 
                            bgcolor: module.color,
                            width: 48,
                            height: 48
                          }}
                        >
                          {module.icon}
                        </Avatar>
                        <Box sx={{ flex: 1 }}>
                          <Typography variant="h6" sx={{ fontWeight: 'bold', color: module.color }}>
                            {module.label}
                          </Typography>
                        </Box>
                        <IconButton 
                          size="small" 
                          sx={{ 
                            color: module.color,
                            '&:hover': {
                              bgcolor: `${module.color}20`
                            }
                          }}
                        >
                          <ArrowForwardIcon />
                        </IconButton>
                      </Stack>
                      
                      <Typography 
                        variant="body2" 
                        color="text.secondary" 
                        sx={{ 
                          flex: 1,
                          lineHeight: 1.6
                        }}
                      >
                        {module.description}
                      </Typography>
                      
                      <Box 
                        sx={{ 
                          height: 4,
                          background: module.gradient,
                          borderRadius: 2,
                          mt: 2
                        }}
                      />
                    </CardContent>
                  </Card>
                </Fade>
              </Grid>
            ))}
          </Grid>
        </Box>
      </Zoom>

      {/* Quick Stats Overview */}
      <Fade in timeout={1000}>
        <Grid container spacing={3} sx={{ mb: 4 }}>
          {[
            { label: "Active Orders", value: "24", icon: <PowerCordIcon />, color: "#2196f3" },
            { label: "Production Plans", value: "8", icon: <PlanningIcon />, color: "#9c27b0" },
            { label: "Machines Running", value: "8/10", icon: <SpeedIcon />, color: "#4caf50" },
            { label: "Efficiency", value: "97%", icon: <TrendingUpIcon />, color: "#ff9800" }
          ].map((stat, index) => (
            <Grid item xs={12} sm={6} md={3} key={index}>
              <Card 
                sx={{ 
                  background: `linear-gradient(135deg, ${stat.color}20 0%, ${stat.color}10 100%)`,
                  border: `1px solid ${stat.color}30`,
                  transition: 'transform 0.2s, box-shadow 0.2s',
                  '&:hover': {
                    transform: 'translateY(-4px)',
                    boxShadow: 4
                  }
                }}
              >
                <CardContent>
                  <Stack direction="row" alignItems="center" spacing={2}>
                    <Avatar sx={{ bgcolor: stat.color, width: 48, height: 48 }}>
                      {stat.icon}
                    </Avatar>
                    <Box>
                      <Typography variant="h4" sx={{ fontWeight: 'bold', color: stat.color }}>
                        {stat.value}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {stat.label}
                      </Typography>
                    </Box>
                  </Stack>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Fade>
    </Container>
  );
};

export default MoldingMainNavigation;

