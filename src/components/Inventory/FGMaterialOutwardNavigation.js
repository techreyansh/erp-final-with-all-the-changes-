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
  Stack,
  Avatar,
  useTheme,
  useMediaQuery,
  Fade,
  Zoom,
  IconButton,
  Tooltip,
  Breadcrumbs,
  Link
} from "@mui/material";
import {
  CallMade as OutwardIcon,
  Dashboard as DashboardIcon,
  TrendingUp as TrendingUpIcon,
  Assessment as ReportIcon,
  History as HistoryIcon,
  ArrowBack as ArrowBackIcon,
  ArrowForward as ArrowForwardIcon,
  Home as HomeIcon
} from "@mui/icons-material";
import FGMaterialOutward from "./FGMaterialOutward";
import { useAuth } from "../../context/AuthContext";
import { useNavigate } from "react-router-dom";

const FGMaterialOutwardNavigation = () => {
  const [selectedTab, setSelectedTab] = useState(0);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const { role: userRole } = useAuth();
  const navigate = useNavigate();

  const tabs = [
    {
      label: "FG Material Outward",
      icon: <OutwardIcon />,
      description: "Monitor finished goods consumption and outgoing",
      color: "#f44336"
    },
    {
      label: "Outward Reports",
      icon: <ReportIcon />,
      description: "FG material outward reports and analytics",
      color: "#2196f3"
    },
    {
      label: "Outward History",
      icon: <HistoryIcon />,
      description: "Historical FG material outward data",
      color: "#ff9800"
    }
  ];

  const handleTabChange = (event, newValue) => {
    setSelectedTab(newValue);
  };

  const renderTabContent = () => {
    switch (selectedTab) {
      case 0:
        return <FGMaterialOutward />;
      case 1:
        return (
          <Card sx={{ p: 4, textAlign: 'center' }}>
            <Typography variant="h6" color="text.secondary">
              FG Outward Reports - Coming Soon
            </Typography>
            <Typography variant="body2" sx={{ mt: 2 }}>
              Detailed reports and analytics for FG material outward will be available here.
            </Typography>
          </Card>
        );
      case 2:
        return (
          <Card sx={{ p: 4, textAlign: 'center' }}>
            <Typography variant="h6" color="text.secondary">
              FG Outward History - Coming Soon
            </Typography>
            <Typography variant="body2" sx={{ mt: 2 }}>
              Historical data and trends for FG material outward will be available here.
            </Typography>
          </Card>
        );
      default:
        return <FGMaterialOutward />;
    }
  };

  return (
    <Container maxWidth="xl" sx={{ py: 3 }}>
      {/* Breadcrumb Navigation */}
      <Box sx={{ mb: 2 }}>
        <Breadcrumbs aria-label="breadcrumb">
          <Link
            underline="hover"
            color="inherit"
            href="#"
            onClick={(e) => {
              e.preventDefault();
              navigate('/inventory');
            }}
            sx={{ 
              display: 'flex', 
              alignItems: 'center',
              cursor: 'pointer',
              '&:hover': { color: 'primary.main' }
            }}
          >
            <HomeIcon sx={{ mr: 0.5 }} fontSize="inherit" />
            Inventory
          </Link>
          <Link
            underline="hover"
            color="inherit"
            href="#"
            onClick={(e) => {
              e.preventDefault();
              navigate('/inventory/stock-sheet');
            }}
            sx={{ 
              display: 'flex', 
              alignItems: 'center',
              cursor: 'pointer',
              '&:hover': { color: 'primary.main' }
            }}
          >
            Stock Sheet
          </Link>
          <Typography color="text.primary" sx={{ display: 'flex', alignItems: 'center' }}>
            <OutwardIcon sx={{ mr: 0.5 }} fontSize="inherit" />
            FG Material Outward
          </Typography>
        </Breadcrumbs>
      </Box>

      {/* Header Section */}
      <Fade in timeout={600}>
        <Card 
          sx={{ 
            mb: 4, 
            background: 'linear-gradient(135deg, #f44336 0%, #d32f2f 100%)',
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
              <Tooltip title="Back to Stock Sheet">
                <IconButton
                  onClick={() => navigate('/inventory/stock-sheet')}
                  sx={{
                    color: 'white',
                    bgcolor: 'rgba(255,255,255,0.1)',
                    '&:hover': {
                      bgcolor: 'rgba(255,255,255,0.2)',
                      transform: 'scale(1.05)'
                    },
                    transition: 'all 0.2s ease',
                    order: { xs: 2, md: 1 }
                  }}
                >
                  <ArrowBackIcon />
                </IconButton>
              </Tooltip>
              
              <Stack direction="row" alignItems="center" spacing={3} sx={{ order: { xs: 1, md: 2 } }}>
                <Avatar 
                  sx={{ 
                    bgcolor: 'rgba(255,255,255,0.2)', 
                    width: 64, 
                    height: 64 
                  }}
                >
                  <OutwardIcon sx={{ fontSize: 32 }} />
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
                    FG Material Outward Management
                  </Typography>
                  <Typography 
                    variant="h6" 
                    sx={{ 
                      opacity: 0.9,
                      fontSize: { xs: '1rem', md: '1.25rem' }
                    }}
                  >
                    Monitor finished goods consumption and outgoing
                  </Typography>
                </Box>
              </Stack>

              <Tooltip title="Next to Dashboard">
                <IconButton
                  onClick={() => navigate('/dashboard')}
                  sx={{
                    color: 'white',
                    bgcolor: 'rgba(255,255,255,0.1)',
                    '&:hover': {
                      bgcolor: 'rgba(255,255,255,0.2)',
                      transform: 'scale(1.05)'
                    },
                    transition: 'all 0.2s ease',
                    order: { xs: 3, md: 3 }
                  }}
                >
                  <ArrowForwardIcon />
                </IconButton>
              </Tooltip>
            </Stack>
          </CardContent>
        </Card>
      </Fade>

      {/* Navigation */}
      <Zoom in timeout={800}>
        <Card sx={{ mb: 4, boxShadow: 4 }}>
          <CardContent sx={{ p: 0 }}>
            <Box sx={{ p: 3, pb: 0 }}>
              <Stack direction="row" alignItems="center" spacing={2}>
                <DashboardIcon color="primary" />
                <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                  FG Material Outward Modules
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
                  background: 'linear-gradient(45deg, #f44336, #d32f2f)'
                }
              }}
            >
              {tabs.map((tab, index) => (
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

      {/* Tab Content */}
      <Fade in timeout={1200} key={selectedTab}>
        <Box>
          {renderTabContent()}
        </Box>
      </Fade>
    </Container>
  );
};

export default FGMaterialOutwardNavigation;
