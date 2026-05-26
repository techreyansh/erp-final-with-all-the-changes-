import React, { useState, useEffect } from "react";
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
  Divider,
  Button,
  CircularProgress,
  Alert
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
  Receipt as BillingIcon,
  Security as SecurityIcon,
  AdminPanelSettings as AdminIcon,
  TrendingUp as TrendingUpIcon,
  Analytics as AnalyticsIcon,
  Assessment as AssessmentIcon,
  Inventory as StockIcon,
  ArrowBack as ArrowBackIcon,
  AccessTime as TimeIcon,
  AllInclusive as AllIcon
} from "@mui/icons-material";
import { useAuth } from "../../context/AuthContext";
import { useNavigate } from "react-router-dom";
import sheetService from "../../services/sheetService";

const InventoryMainNavigation = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const { role: userRole } = useAuth();
  const navigate = useNavigate();
  
  // Statistics state
  const [statistics, setStatistics] = useState({
    totalItems: 0,
    totalStockQuantity: 0,
    totalInwardOverall: 0,
    totalInward24h: 0,
    totalOutwardOverall: 0,
    totalOutward24h: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch real-time statistics
  const fetchStatistics = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch all data in parallel with error handling
      let stockData = [], fgStockData = [], inwardData = [], outwardData = [];
      
      try {
        stockData = await sheetService.getSheetData("Stock");
      } catch (err) {

      }
      
      try {
        fgStockData = await sheetService.getSheetData("FG Stock");
      } catch (err) {

      }
      
      try {
        inwardData = await sheetService.getSheetData("Material Inward");
      } catch (err) {

      }
      
      try {
        outwardData = await sheetService.getSheetData("Material Issue");
      } catch (err) {

      }

      // Calculate total items (combine both Stock and FG Stock)
      const totalItems = stockData.length + fgStockData.length;

      // Calculate total stock quantity (sum of all current stock quantities)
      // From regular Stock sheet
      const regularStockQuantity = stockData.reduce((sum, item) => {
        // Current stock should be in column 2 (index 2)
        const stockQty = parseFloat(item[2]) || 0;
        return sum + stockQty;
      }, 0);

      // From FG Stock sheet (using proper column names)
      const fgStockQuantity = fgStockData.reduce((sum, item) => {
        // Use the "Current Stock" column from FG Stock
        const stockQty = parseFloat(item["Current Stock"]) || 0;
        return sum + stockQty;
      }, 0);

      const totalStockQuantity = regularStockQuantity + fgStockQuantity;

      // Calculate total inward quantities from Material Inward
      const materialInwardTotal = inwardData.reduce((sum, item) => {
        // Try different column names for quantity
        const qty = parseFloat(item["Quantity"] || item["Qty"] || item[2]) || 0;
        return sum + qty;
      }, 0);

      // Get FG Material Inward data
      let fgInwardTotal = 0;
      try {
        const fgInwardData = await sheetService.getSheetData("FG Material Inward");
        fgInwardTotal = fgInwardData.reduce((sum, item) => {
          const qty = parseFloat(item["Quantity"] || item["Qty"] || item[2]) || 0;
          return sum + qty;
        }, 0);
      } catch (err) {

      }

      const totalInwardOverall = materialInwardTotal + fgInwardTotal;

      // Calculate total outward quantities from Material Issue
      const materialOutwardTotal = outwardData.reduce((sum, item) => {
        // Try different column names for quantity
        const qty = parseFloat(item["Quantity"] || item["Qty"] || item[2]) || 0;
        return sum + qty;
      }, 0);

      // Get FG Material Outward data
      let fgOutwardTotal = 0;
      try {
        const fgOutwardData = await sheetService.getSheetData("FG Material Outward");
        fgOutwardTotal = fgOutwardData.reduce((sum, item) => {
          const qty = parseFloat(item["Quantity"] || item["Qty"] || item[2]) || 0;
          return sum + qty;
        }, 0);
      } catch (err) {

      }

      const totalOutwardOverall = materialOutwardTotal + fgOutwardTotal;

      // Calculate 24-hour quantities
      const now = new Date();
      const twentyFourHoursAgo = new Date(now.getTime() - (24 * 60 * 60 * 1000));

      // Material Inward 24h
      const materialInward24h = inwardData.filter(item => {
        const itemDate = new Date(item["Date"] || item[0]);
        return itemDate >= twentyFourHoursAgo && !isNaN(itemDate.getTime());
      }).reduce((sum, item) => {
        const qty = parseFloat(item["Quantity"] || item["Qty"] || item[2]) || 0;
        return sum + qty;
      }, 0);

      // FG Material Inward 24h
      let fgInward24h = 0;
      try {
        const fgInwardData = await sheetService.getSheetData("FG Material Inward");
        fgInward24h = fgInwardData.filter(item => {
          const itemDate = new Date(item["Date"] || item[0]);
          return itemDate >= twentyFourHoursAgo && !isNaN(itemDate.getTime());
        }).reduce((sum, item) => {
          const qty = parseFloat(item["Quantity"] || item["Qty"] || item[2]) || 0;
          return sum + qty;
        }, 0);
      } catch (err) {

      }

      const totalInward24h = materialInward24h + fgInward24h;

      // Material Outward 24h
      const materialOutward24h = outwardData.filter(item => {
        const itemDate = new Date(item["Date"] || item[0]);
        return itemDate >= twentyFourHoursAgo && !isNaN(itemDate.getTime());
      }).reduce((sum, item) => {
        const qty = parseFloat(item["Quantity"] || item["Qty"] || item[2]) || 0;
        return sum + qty;
      }, 0);

      // FG Material Outward 24h
      let fgOutward24h = 0;
      try {
        const fgOutwardData = await sheetService.getSheetData("FG Material Outward");
        fgOutward24h = fgOutwardData.filter(item => {
          const itemDate = new Date(item["Date"] || item[0]);
          return itemDate >= twentyFourHoursAgo && !isNaN(itemDate.getTime());
        }).reduce((sum, item) => {
          const qty = parseFloat(item["Quantity"] || item["Qty"] || item[2]) || 0;
          return sum + qty;
        }, 0);
      } catch (err) {

      }

      const totalOutward24h = materialOutward24h + fgOutward24h;

      setStatistics({
        totalItems,
        totalStockQuantity,
        totalInwardOverall,
        totalInward24h,
        totalOutwardOverall,
        totalOutward24h
      });

    } catch (err) {
      console.error('Error fetching statistics:', err);
      setError('Failed to load statistics');
    } finally {
      setLoading(false);
    }
  };

  // Fetch statistics on component mount and set up auto-refresh
  useEffect(() => {
    fetchStatistics();
    
    // Set up auto-refresh every 30 seconds
    const interval = setInterval(fetchStatistics, 30000);
    
    return () => clearInterval(interval);
  }, []);

  // Enhanced module configuration with navigation
  const inventoryModules = [
    {
      id: "stock-sheet",
      label: "Stock Sheet",
      icon: <StockIcon />,
      description: "Manage raw materials and stock levels",
      color: "#2196f3",
      gradient: "linear-gradient(135deg, #2196f3 0%, #1976d2 100%)",
      route: "/inventory/stock-sheet"
    },
    {
      id: "finished-goods",
      label: "Finished Goods",
      icon: <FactoryIcon />,
      description: "Comprehensive finished goods management",
      color: "#9c27b0",
      gradient: "linear-gradient(135deg, #9c27b0 0%, #7b1fa2 100%)",
      route: "/inventory/finished-goods"
    },
    {
      id: "bill-of-materials",
      label: "Bill of Materials",
      icon: <BOMIcon />,
      description: "Product recipes and material requirements",
      color: "#ff9800",
      gradient: "linear-gradient(135deg, #ff9800 0%, #f57c00 100%)",
      route: "/inventory/bill-of-materials"
    },
    {
      id: "kitting-sheet",
      label: "Kitting Sheet",
      icon: <KittingIcon />,
      description: "Component assembly and kitting operations",
      color: "#4caf50",
      gradient: "linear-gradient(135deg, #4caf50 0%, #388e3c 100%)",
      route: "/inventory/kitting-sheet"
    },
    {
      id: "fg-to-billing",
      label: "FG to Billing",
      icon: <BillingIcon />,
      description: "Client-wise billing for finished goods",
      color: "#00bcd4",
      gradient: "linear-gradient(135deg, #00bcd4 0%, #0097a7 100%)",
      route: "/inventory/fg-to-billing"
    }
  ];

  const handleModuleClick = (route) => {
    navigate(route);
  };

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
                <Tooltip title="Refresh Statistics">
                  <IconButton 
                    onClick={fetchStatistics}
                    disabled={loading}
                    sx={{ color: 'white' }}
                  >
                    {loading ? <CircularProgress size={24} color="inherit" /> : <AnalyticsIcon />}
                  </IconButton>
                </Tooltip>
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

      {/* Module Navigation */}
      <Zoom in timeout={800}>
        <Box sx={{ mb: 4 }}>
          <Stack direction="row" alignItems="center" spacing={2} sx={{ mb: 3 }}>
            <DashboardIcon color="primary" />
            <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
              Inventory Modules
            </Typography>
          </Stack>
          
          <Grid container spacing={3}>
            {inventoryModules.map((module, index) => (
              <Grid item xs={12} sm={6} md={3} key={module.id}>
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
                          <ArrowBackIcon />
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

    </Container>
  );
};

export default InventoryMainNavigation;
