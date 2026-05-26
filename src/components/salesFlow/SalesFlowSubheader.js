import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  Box, 
  Tabs, 
  Tab, 
  useTheme,
  Paper,
  Typography,
  Chip,
  Button,
  alpha,
} from '@mui/material';
import { useAuth } from '../../context/AuthContext';
import { 
  Add, 
} from '@mui/icons-material';

const roleSteps = {
  "Customer Relations Manager": [
    { id: 1, label: 'Log & Qualify Leads', path: '/sales-flow/log-and-qualify-leads' },
    { id: 9, label: 'Get Approval of Sample', path: '/sales-flow/get-approval-for-sample' },
    { id: 11, label: 'Order Booking', path: '/sales-flow/order-booking' }
  ],
  "Sales Executive": [
    { id: 2, label: 'Initial Call & Requirement Gathering', path: '/sales-flow/initial-call' },
    { id: 3, label: 'Evaluate High-Value Prospects', path: '/sales-flow/evaluate-high-value-prospects' },
    { id: 6, label: 'Send Quotation', path: '/sales-flow/send-quotation' },
    { id: 8, label: 'Sample Submission', path: '/sales-flow/sample-submission' }
  ],
  "NPD": [
    { id: 4, label: 'Check feasibility', path: '/sales-flow/check-feasibility' }
  ],
  "Quality Engineer": [
    { id: 5, label: 'Confirm standards and compliance', path: '/sales-flow/confirm-standards' }
  ],
  "Director": [
    { id: 7, label: 'Approve Payment Terms', path: '/sales-flow/approve-payment-terms' },
    { id: 10, label: 'Approve Strategic Deals', path: '/sales-flow/approve-strategic-deals' }
  ]
};

const SalesFlowSubheader = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();

  const handleTabChange = (event, newPath) => {
    navigate(newPath);
  };

  const handleCreateLead = () => {
    navigate('/sales-flow/create-lead');
  };

  const currentPath = location.pathname;
  const steps = roleSteps[user?.role] || [];

  return (
    <Paper 
      elevation={1} 
      sx={{ 
        borderBottom: `2px solid ${theme.palette.info.main}`,
        backgroundColor: alpha(theme.palette.info.main, 0.05),
        mb: 3,
        borderRadius: 0,
      }}
    >
      <Box sx={{ px: 2, py: 1.5, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Tabs 
                value={currentPath} 
                onChange={handleTabChange}
                variant="scrollable"
                scrollButtons="auto"
                sx={{
            flex: 1,
                  '& .MuiTab-root': {
              minHeight: 56,
              textTransform: 'none',
                    fontWeight: 600,
              fontSize: '0.9rem',
              px: 3,
              color: theme.palette.text.secondary,
                    '&.Mui-selected': {
                fontWeight: 700,
                color: theme.palette.info.main,
                backgroundColor: alpha(theme.palette.info.main, 0.1),
                borderRadius: 2,
                    },
                    '&:hover': {
                backgroundColor: alpha(theme.palette.info.main, 0.05),
                borderRadius: 2,
                    }
                  },
                  '& .MuiTabs-indicator': {
              backgroundColor: theme.palette.info.main,
              height: 3,
              borderRadius: '3px 3px 0 0',
            },
          }}
        >
          {steps.map((step) => (
            <Tab
              key={step.id}
              label={step.label}
                      value={step.path}
                    />
                ))}
              </Tabs>
        
        {user?.role === 'Customer Relations Manager' && (
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={handleCreateLead}
            sx={{
              backgroundColor: theme.palette.info.main,
              color: 'white',
              fontWeight: 600,
              px: 3,
              py: 1,
              borderRadius: 2,
              textTransform: 'none',
              boxShadow: `0 4px 12px ${alpha(theme.palette.info.main, 0.3)}`,
              '&:hover': {
                backgroundColor: theme.palette.info.dark,
                transform: 'translateY(-2px)',
                boxShadow: `0 6px 16px ${alpha(theme.palette.info.main, 0.4)}`,
              },
              transition: 'all 0.3s ease',
            }}
          >
            Create New Lead
          </Button>
        )}
                  </Box>
    </Paper>
  );
};

export default SalesFlowSubheader; 