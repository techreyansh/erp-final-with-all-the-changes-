import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  Box, 
  Tabs, 
  Tab, 
  useTheme,
  Paper,
  Typography,
  Chip,
  alpha,
} from '@mui/material';
import { useStepStatus } from '../../context/StepStatusContext';
import { useAuth } from '../../context/AuthContext';
import purchaseFlowService from '../../services/purchaseFlowService';
const roleSteps = {
  "Process Coordinator": [
    { id: 2, label: 'Approve Indent', path: '/purchase-flow/approve-indent' }
  ],
  "Purchase Executive": [
    { id: 3, label: 'Float RFQ', path: '/purchase-flow/float-rfq' },
    { id: 4, label: 'Follow-up for Quotations', path: '/purchase-flow/followup-quotations' },
    { id: 5, label: 'Prepare Comparative Statement', path: '/purchase-flow/comparative-statement' },
    { id: 7, label: 'Request & Follow-up for Sample', path: '/purchase-flow/request-sample' },
    { id: 8, label: 'Inspect Sample', path: '/purchase-flow/inspect-sample' },
    { id: 9, label: 'Sort Vendors', path: '/purchase-flow/sort-vendors' },
    { id: 10, label: 'Place PO', path: '/purchase-flow/place-po' },
    { id: 11, label: 'Follow-up for Delivery', path: '/purchase-flow/followup-delivery' },
    { id: 14, label: 'Decision on Rejection', path: '/purchase-flow/decision-on-rejection' },
    { id: 16, label: 'Resend Material', path: '/purchase-flow/resend-material' },
    { id: 19, label: 'Submit Invoice to Accounts', path: '/purchase-flow/submit-invoice' }
  ],
  "Management / HOD": [
    { id: 6, label: 'Approve Quotation', path: '/purchase-flow/approve-quotation' }
  ],
  "QC Manager": [
    { id: 8, label: 'Inspect Sample', path: '/purchase-flow/inspect-sample' },
    { id: 11, label: 'Receive & Inspect Material', path: '/purchase-flow/recieve-inspect-material' },
    { id: 12, label: 'Material Approval', path: '/purchase-flow/material-approval' },
    { id: 15, label: 'Resend Material', path: '/purchase-flow/resend-material' }
  ],
  "Store Manager": [
    { id: 1, label: 'Raise Indent', path: '/purchase-flow/raise-indent' },
    { id: 11, label: 'Receive & Inspect Material', path: '/purchase-flow/recieve-inspect-material' },
    { id: 15, label: 'Return Rejected Material', path: '/purchase-flow/return-rejected-material' },
    { id: 17, label: 'Generate GRN', path: '/purchase-flow/generate-grn' },
    { id: 18, label: 'Final GRN', path: '/purchase-flow/final-grn' }
  ],
  "Accounts Executive": [
    { id: 20, label: 'Schedule Payment', path: '/purchase-flow/schedule-payment' },
    { id: 21, label: 'Approve & Release Payment', path: '/purchase-flow/release-payment' }
  ],
};

const PurchaseFlowSubheader = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const { stepStatuses } = useStepStatus();
  const { user } = useAuth();
  const [currentActiveStep, setCurrentActiveStep] = useState(null);
  const [indents, setIndents] = useState([]);

  // Fetch indents to determine current active step
  useEffect(() => {
    const fetchIndents = async () => {
      try {
        const data = await purchaseFlowService.getAllIndents();
        setIndents(data || []);
        
        // Determine the most common NextStep (current active step)
        if (data && data.length > 0) {
          const nextSteps = data
            .map(indent => {
              if (!indent.Steps || indent.Steps.length === 0) return null;
              const currentStep = indent.Steps[indent.Steps.length - 1];
              return Number(currentStep?.NextStep || currentStep?.nextStep || 0);
            })
            .filter(step => step > 0 && step <= 21);
          
          if (nextSteps.length > 0) {
            // Find the most frequent NextStep (the current active step for most indents)
            const stepCounts = nextSteps.reduce((acc, step) => {
              acc[step] = (acc[step] || 0) + 1;
              return acc;
            }, {});
            
            const mostCommonStep = Object.keys(stepCounts).reduce((a, b) => 
              stepCounts[a] > stepCounts[b] ? a : b
            );
            
            setCurrentActiveStep(Number(mostCommonStep));
          }
        }
      } catch (error) {
        console.error('Error fetching indents for navigation:', error);
      }
    };
    
    fetchIndents();
    // Refresh every 10 seconds to update active step
    const interval = setInterval(fetchIndents, 10000);
    return () => clearInterval(interval);
  }, []);

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed':
        return 'success.main';
      case 'in_progress':
        return 'warning.main';
      case 'rejected':
        return 'error.main';
      default:
        return 'text.primary';
    }
  };

  const handleTabChange = (event, newPath) => {
    navigate(newPath);
  };

  const currentPath = location.pathname;
  const steps = roleSteps[user?.role] || [];
  
  // Determine if a step is currently active based on NextStep
  const isStepActive = (stepId) => {
    return currentActiveStep === stepId;
  };

  // Don't render if no steps available for user role
  if (!user?.role || steps.length === 0) {
    return null;
  } 

  return (
    <Paper 
      elevation={1} 
      sx={{ 
        borderBottom: `2px solid ${theme.palette.success.main}`,
        backgroundColor: alpha(theme.palette.success.main, 0.05),
        mb: 3,
        borderRadius: 0,
      }}
    >
      <Box sx={{ px: 2, py: 1.5 }}>
        <Tabs
          value={currentPath}
          onChange={handleTabChange}
          variant="scrollable"
          scrollButtons="auto"
          sx={{
            '& .MuiTab-root': {
              minHeight: 56,
              textTransform: 'none',
              fontWeight: 600,
              fontSize: '0.9rem',
              px: 3,
              color: theme.palette.text.primary,
              '&.Mui-selected': {
                fontWeight: 700,
                color: theme.palette.success.main,
                backgroundColor: alpha(theme.palette.success.main, 0.1),
                borderRadius: 2,
              },
              '&:hover': {
                backgroundColor: alpha(theme.palette.success.main, 0.05),
                borderRadius: 2,
                color: theme.palette.text.primary,
              }
            },
            '& .MuiTabs-indicator': {
              backgroundColor: theme.palette.success.main,
              height: 3,
              borderRadius: '3px 3px 0 0',
            },
          }}
        >
          {steps.map((step) => {
            const isActive = isStepActive(step.id);
            const isCurrentPath = currentPath === step.path;
            const stepStatus = stepStatuses[step.id];
            
            return (
              <Tab
                key={step.id}
                label={
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Typography
                      variant="body2"
                      sx={{
                        color: stepStatus 
                          ? getStatusColor(stepStatus) 
                          : isActive 
                            ? theme.palette.success.dark 
                            : isCurrentPath
                            ? theme.palette.success.main
                            : theme.palette.text.primary,
                        fontWeight: isActive || isCurrentPath ? 700 : 600,
                        textDecoration: isActive ? 'underline' : 'none',
                        textDecorationColor: theme.palette.success.dark,
                        textUnderlineOffset: '4px'
                      }}
                    >
                      Step {step.id}: {step.label}
                    </Typography>
                    {isActive && (
                      <Chip 
                        label="Active" 
                        size="small" 
                        sx={{ 
                          height: 20, 
                          fontSize: '0.65rem',
                          backgroundColor: theme.palette.success.main,
                          color: '#fff',
                          fontWeight: 600
                        }} 
                      />
                    )}
                  </Box>
                }
                value={step.path}
                sx={{
                  '&.Mui-selected': {
                    backgroundColor: isActive 
                      ? alpha(theme.palette.success.dark, 0.15)
                      : alpha(theme.palette.success.main, 0.1),
                  }
                }}
              />
            );
          })}
        </Tabs>
      </Box>
    </Paper>
  );
};

export default PurchaseFlowSubheader;