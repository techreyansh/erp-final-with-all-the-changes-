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
  TrendingUp as SalesIcon,
} from '@mui/icons-material';
import { useAuth } from '../../context/AuthContext';

// Mapping from tab index to route
const tabIndexToRoute = {
  0: '/sales-flow', // Dashboard
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

// Reverse mapping from route to tab index
const routeToTabIndex = Object.fromEntries(
  Object.entries(tabIndexToRoute).map(([index, route]) => [route, parseInt(index)])
);

const stepNames = [
  'All Tasks',
  'Log & Qualify Leads',
  'Initial Call & Requirement Gathering',
  'Evaluate High-Value Prospects',
  'Check Feasibility',
  'Confirm Standards and Compliance',
  'Send Quotation',
  'Approve Payment Terms',
  'Sample Submission',
  'Get Approval of Sample',
  'Approve Strategic Deals',
  'Order Booking',
];

// Helper function to get tab index from route
const getTabFromRoute = (pathname) => {
  // Check if we're on a specific step route
  const tabIndex = routeToTabIndex[pathname];
  if (tabIndex !== undefined) {
    return tabIndex;
  }
  // Default to dashboard (tab 0) if on /sales-flow
  if (pathname === '/sales-flow') {
    return 0;
  }
  // Default to tab 1 (Log & Qualify Leads) if route doesn't match
  return 1;
};

const SalesFlowLayout = () => {
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
          background: `linear-gradient(135deg, ${theme.palette.info.main} 0%, ${theme.palette.info.dark} 100%)`,
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
                  <SalesIcon sx={{ fontSize: { xs: 48, sm: 56, md: 64 }, color: "#ffffff" }} />
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
                    Sales Flow Management
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
                    Streamlined sales workflow from lead to order booking
                  </Typography>
                  
                  <Stack direction="row" spacing={1} flexWrap="wrap" justifyContent={{ xs: "center", md: "flex-start" }}>
                    {["CRM Integration", "Smart Pipeline", "Deal Tracking"].map((feature, index) => (
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

export default SalesFlowLayout;

