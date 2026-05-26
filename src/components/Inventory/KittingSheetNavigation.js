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
  BuildCircle as KittingIcon,
  Dashboard as DashboardIcon,
  TrendingUp as TrendingUpIcon,
  Assessment as ReportIcon,
  History as HistoryIcon,
  ArrowBack as ArrowBackIcon,
  Home as HomeIcon,
  Assignment as BOMIcon
} from "@mui/icons-material";
import CompanyKittingSheet from "../KittingSheet/CompanyKittingSheet";
import { useAuth } from "../../context/AuthContext";
import { useNavigate } from "react-router-dom";

const KittingSheetNavigation = () => {
  const [selectedTab, setSelectedTab] = useState(0);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const { role: userRole } = useAuth();
  const navigate = useNavigate();

  const tabs = [
    {
      label: "Kitting Sheet",
      icon: <KittingIcon />,
      description: "Assembly and kitting operations",
      color: "#607d8b"
    },
    {
      label: "Kitting Reports",
      icon: <ReportIcon />,
      description: "Kitting operations reports and analytics",
      color: "#2196f3"
    },
    {
      label: "Kitting History",
      icon: <HistoryIcon />,
      description: "Historical kitting operations data",
      color: "#4caf50"
    }
  ];

  const handleTabChange = (event, newValue) => {
    setSelectedTab(newValue);
  };

  const renderTabContent = () => {
    switch (selectedTab) {
      case 0:
        return <CompanyKittingSheet />;
      case 1:
        return (
          <Card sx={{ p: 4, textAlign: 'center' }}>
            <Typography variant="h6" color="text.secondary">
              Kitting Reports - Coming Soon
            </Typography>
            <Typography variant="body2" sx={{ mt: 2 }}>
              Detailed reports and analytics for kitting operations will be available here.
            </Typography>
          </Card>
        );
      case 2:
        return (
          <Card sx={{ p: 4, textAlign: 'center' }}>
            <Typography variant="h6" color="text.secondary">
              Kitting History - Coming Soon
            </Typography>
            <Typography variant="body2" sx={{ mt: 2 }}>
              Historical data and trends for kitting operations will be available here.
            </Typography>
          </Card>
        );
      default:
        return <CompanyKittingSheet />;
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
              navigate('/inventory/bill-of-materials');
            }}
            sx={{ 
              display: 'flex', 
              alignItems: 'center',
              cursor: 'pointer',
              '&:hover': { color: 'primary.main' }
            }}
          >
            <BOMIcon sx={{ mr: 0.5 }} fontSize="inherit" />
            Bill of Materials
          </Link>
          <Typography color="text.primary" sx={{ display: 'flex', alignItems: 'center' }}>
            <KittingIcon sx={{ mr: 0.5 }} fontSize="inherit" />
            Kitting Sheet
          </Typography>
        </Breadcrumbs>
      </Box>

      {/* Header Section */}
      <Fade in timeout={600}>
        <Card 
          sx={{ 
            mb: 4, 
            background: 'linear-gradient(135deg, #607d8b 0%, #455a64 100%)',
            color: 'white',
            boxShadow: 6
          }}
        >
          <CardContent sx={{ py: 4 }}>
            <Stack 
              direction={{ xs: "column", md: "row" }} 
              alignItems="center" 
              spacing={3}
            >
              <Tooltip title="Back to Bill of Materials">
                <IconButton
                  onClick={() => navigate('/inventory/bill-of-materials')}
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
                  <KittingIcon sx={{ fontSize: 32 }} />
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
                    Kitting Sheet Management
                  </Typography>
                  <Typography 
                    variant="h6" 
                    sx={{ 
                      opacity: 0.9,
                      fontSize: { xs: '1rem', md: '1.25rem' }
                    }}
                  >
                    Assembly and kitting operations control
                  </Typography>
                </Box>
              </Stack>
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
                  Kitting Sheet Modules
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
                  background: 'linear-gradient(45deg, #607d8b, #455a64)'
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

export default KittingSheetNavigation;
