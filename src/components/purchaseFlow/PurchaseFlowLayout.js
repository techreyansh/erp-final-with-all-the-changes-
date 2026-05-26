import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, Outlet } from 'react-router-dom';
import { 
  Box, 
  Container, 
  Typography, 
  Paper, 
  Tabs,
  Tab,
  useTheme,
  Chip,
  Stack,
  Fade,
  alpha,
} from '@mui/material';
import { 
  ShoppingCart as PurchaseIcon,
} from '@mui/icons-material';
import { useAuth } from '../../context/AuthContext';

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

const PurchaseFlowLayout = () => {
  const theme = useTheme();
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  
  const [trackerTab, setTrackerTab] = useState(() => getTabFromRoute(location.pathname));

  // Sync tab with URL changes
  useEffect(() => {
    const tabFromRoute = getTabFromRoute(location.pathname);
    setTrackerTab(tabFromRoute);
  }, [location.pathname]);

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
          background: `linear-gradient(135deg, ${theme.palette.success.main} 0%, ${theme.palette.success.dark} 100%)`,
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
                  <PurchaseIcon sx={{ fontSize: { xs: 48, sm: 56, md: 64 }, color: "#ffffff" }} />
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
                    Purchase Flow Management
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
                    Streamlined procurement workflow from indent to payment
                  </Typography>
                  
                  <Stack direction="row" spacing={1} flexWrap="wrap" justifyContent={{ xs: "center", md: "flex-start" }}>
                    {["Vendor Management", "Smart Procurement", "Cost Optimization"].map((feature, index) => (
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
            top: 64,
            zIndex: 200,
            borderBottom: "1px solid",
            borderColor: alpha("#ffffff", 0.2),
          }}
        >
          <Container maxWidth={false} sx={{ px: { xs: 2, md: 3 } }}>
            <Tabs
              value={trackerTab}
              onChange={(_, v) => {
                const route = tabIndexToRoute[v];
                if (route) {
                  navigate(route);
                }
              }}
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
              {stepNames.map((name, idx) => (
                <Tab 
                  key={name} 
                  label={idx === 0 ? name : `Step ${idx}: ${name}`} 
                  value={idx} 
                />
              ))}
            </Tabs>
          </Container>
        </Box>
      </Paper>

      {/* Main Content */}
      <Container maxWidth={false} sx={{ px: { xs: 2, md: 3 } }}>
        <Box sx={{ py: { xs: 3, sm: 4, md: 6 } }}>
          <Outlet />
        </Box>
      </Container>
    </Box>
  );
};

export default PurchaseFlowLayout;

