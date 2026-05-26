import React, { useState } from "react";
import { 
  Box, 
  Paper, 
  Tabs, 
  Tab, 
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
  Inventory2 as InventoryIcon,
  Storage as StorageIcon,
  CallReceived as InwardIcon,
  CallMade as OutwardIcon,
  Factory as FactoryIcon,
  Assignment as BOMIcon,
  BuildCircle as KittingIcon,
  Dashboard as DashboardIcon,
  Security as SecurityIcon,
  AdminPanelSettings as AdminIcon,
  TrendingUp as TrendingUpIcon,
  Analytics as AnalyticsIcon,
  Assessment as AssessmentIcon,
  Inventory as StockIcon
} from "@mui/icons-material";
import StockManagement from "../StockManagement/StockManagement";
import FinishedGoodsMaster from "../FinishedGoods/FinishedGoodsMaster";
import CompanyBillOfMaterials from "../BillOfMaterials/CompanyBillOfMaterials";
import CompanyKittingSheet from "../KittingSheet/CompanyKittingSheet";
import FGInventory from "./FinishedGoodsMaster";
import { useAuth } from "../../context/AuthContext";
import { useLocation } from "react-router-dom";
import FGStockSheet from "./FGStockSheet";

const Inventory = () => {
  const [selectedTab, setSelectedTab] = useState(0);
  const [selectedFGTab, setSelectedFGTab] = useState(0);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const isTablet = useMediaQuery(theme.breakpoints.between('md', 'lg'));
  const { role: userRole } = useAuth();
  const location = useLocation();

  // Enhanced tab configuration with icons and descriptions
  const mainTabs = [
    {
      label: "Stock Sheet",
      icon: <StockIcon />,
      description: "Manage raw materials and stock levels",
      color: "#2196f3"
    },
    {
      label: "Finished Goods",
      icon: <FactoryIcon />,
      description: "Comprehensive finished goods management",
      color: "#9c27b0"
    },
    {
      label: "Bill of Materials",
      icon: <BOMIcon />,
      description: "Product recipes and material requirements",
      color: "#ff9800"
    },
    {
      label: "Kitting",
      icon: <KittingIcon />,
      description: "Component assembly and kitting operations",
      color: "#4caf50"
    }
  ];

  const fgTabs = [
    {
      label: "FG Stock Sheet",
      icon: <StorageIcon />,
      description: "Finished goods stock management",
      color: "#1976d2"
    }
  ];

  if (userRole !== "Store Manager" && userRole !== "CEO") {
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
              Inventory Management Portal
            </Typography>
            <Divider sx={{ my: 3, bgcolor: 'rgba(255,255,255,0.3)' }} />
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 2 }}>
              <AdminIcon />
              <Typography variant="body1" sx={{ fontSize: '1.1rem' }}>
                Only users with <strong>Store Manager</strong> or <strong>CEO</strong> role can access this section
              </Typography>
            </Box>
          </Card>
        </Fade>
      </Container>
    );
  }

  // If navigated from FinishedGoodsMaster with FG Inventory intent
  if (location.state?.tab === 3 || location.state?.tab === "fg-inventory") {
    return <FGInventory />;
  }

  const handleTabChange = (event, newValue) => {
    setSelectedTab(newValue);
  };

  const handleFGTabChange = (event, newValue) => {
    setSelectedFGTab(newValue);
  };

  const renderTabContent = () => {
    switch (selectedTab) {
      case 0:
        return <StockManagement />;
      case 1:
        return (
          <Box>
            {/* FG Sub-navigation */}
            <Card sx={{ mb: 3, boxShadow: 3 }}>
              <CardContent sx={{ pb: 1 }}>
                <Stack direction="row" alignItems="center" spacing={2} sx={{ mb: 2 }}>
                  <Avatar sx={{ bgcolor: 'primary.main' }}>
                    <FactoryIcon />
                  </Avatar>
                  <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                    Finished Goods Management
                  </Typography>
                </Stack>
                
                <Tabs
                  value={selectedFGTab}
                  onChange={handleFGTabChange}
                  variant={isMobile ? "scrollable" : "fullWidth"}
                  scrollButtons="auto"
                  sx={{
                    '& .MuiTab-root': {
                      minHeight: 64,
                      textTransform: 'none',
                      fontWeight: 600,
                      fontSize: '0.9rem'
                    },
                    '& .MuiTabs-indicator': {
                      height: 3,
                      background: 'linear-gradient(45deg, #9c27b0, #e1bee7)'
                    }
                  }}
                >
                  {fgTabs.map((tab, index) => (
                    <Tab
                      key={index}
                      icon={tab.icon}
                      label={tab.label}
                      iconPosition="start"
                      sx={{
                        color: selectedFGTab === index ? tab.color : 'text.secondary',
                        '&.Mui-selected': {
                          color: tab.color
                        }
                      }}
                    />
                  ))}
                </Tabs>
              </CardContent>
            </Card>
            
            {selectedFGTab === 0 && <FGStockSheet />}
          </Box>
        );
      case 2:
        return <CompanyBillOfMaterials />;
      case 3:
        return <CompanyKittingSheet />;
      default:
        return null;
    }
  };

  return (
    <Container maxWidth="xl" sx={{ py: 3 }}>
      {/* Enhanced Header Section */}
      <Fade in timeout={600}>
        <Card 
          sx={{ 
            mb: 4, 
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
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
                  <InventoryIcon sx={{ fontSize: 32 }} />
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
                    Inventory Management
                  </Typography>
                  <Typography 
                    variant="h6" 
                    sx={{ 
                      opacity: 0.9,
                      fontSize: { xs: '1rem', md: '1.25rem' }
                    }}
                  >
                    Comprehensive inventory control & tracking system
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
                    <Badge badgeContent={6} color="error">
                      <AnalyticsIcon />
                    </Badge>
                  </IconButton>
                </Tooltip>
              </Stack>
            </Stack>
          </CardContent>
        </Card>
      </Fade>

      {/* Enhanced Main Navigation */}
      <Zoom in timeout={800}>
        <Card sx={{ mb: 4, boxShadow: 4 }}>
          <CardContent sx={{ p: 0 }}>
            <Box sx={{ p: 3, pb: 0 }}>
              <Stack direction="row" alignItems="center" spacing={2}>
                <DashboardIcon color="primary" />
                <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                  Inventory Modules
                </Typography>
              </Stack>
            </Box>
            
            <Tabs
              value={selectedTab}
              onChange={handleTabChange}
              variant={isMobile ? "scrollable" : "fullWidth"}
              scrollButtons="auto"
              sx={{
                px: 3,
                '& .MuiTab-root': {
                  minHeight: 72,
                  textTransform: 'none',
                  fontWeight: 600,
                  fontSize: '0.95rem',
                  py: 2
                },
                '& .MuiTabs-indicator': {
                  height: 4,
                  background: 'linear-gradient(45deg, #667eea, #764ba2)'
                }
              }}
            >
              {mainTabs.map((tab, index) => (
                <Tab
                  key={index}
                  icon={tab.icon}
                  label={tab.label}
                  iconPosition="start"
                  sx={{
                    color: selectedTab === index ? tab.color : 'text.secondary',
                    flexDirection: { xs: 'column', sm: 'row' },
                    gap: 1,
                    '&.Mui-selected': {
                      color: tab.color,
                      fontWeight: 'bold'
                    }
                  }}
                />
              ))}
            </Tabs>
          </CardContent>
        </Card>
      </Zoom>

      {/* Quick Stats Overview */}
      {selectedTab === 0 && (
        <Fade in timeout={1000}>
          <Grid container spacing={3} sx={{ mb: 4 }}>
            {[
              { label: "Total Stock Items", value: "1,247", icon: <StorageIcon />, color: "#2196f3" },
              { label: "Critical Stock", value: "23", icon: <TrendingUpIcon />, color: "#f44336" },
              { label: "Inward Today", value: "45", icon: <InwardIcon />, color: "#4caf50" },
              { label: "Outward Today", value: "38", icon: <OutwardIcon />, color: "#ff9800" }
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
      )}

      {/* Tab Content */}
      <Fade in timeout={1200} key={selectedTab}>
        <Box>
          {renderTabContent()}
        </Box>
      </Fade>
    </Container>
  );
};

export default Inventory;
