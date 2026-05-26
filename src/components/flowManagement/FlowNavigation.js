import React from 'react';
import {
  Box,
  Stepper,
  Step,
  StepLabel,
  StepContent,
  Button,
  Paper,
  Typography,
  Chip,
  LinearProgress,
  Tooltip
} from '@mui/material';
import {
  Assignment,
  Inventory,
  Build,
  Verified,
  LocalShipping,
  CheckCircle,
  Error,
  ArrowForward,
  ArrowBack
} from '@mui/icons-material';
import config from '../../config/config';

const FlowNavigation = ({ currentStatus, onNavigateToStep, canNavigate = true, stageCompletions = {} }) => {
  const steps = [
    {
      id: config.statusCodes.NEW,
      label: 'New Order',
      icon: <Assignment />,
      color: '#2196f3',
      description: 'New purchase order created'
    },
    {
      id: config.statusCodes.STORE1,
      label: 'Store 1',
      icon: <Inventory />,
      color: '#4caf50',
      description: 'Material preparation and kitting'
    },
    {
      id: config.statusCodes.CABLE_PRODUCTION,
      label: 'Cable Production',
      icon: <Build />,
      color: '#ff9800',
      description: 'Cable manufacturing process'
    },
    {
      id: config.statusCodes.STORE2,
      label: 'Store 2',
      icon: <Inventory />,
      color: '#4caf50',
      description: 'Secondary material handling'
    },
    {
      id: config.statusCodes.MOULDING,
      label: 'Moulding',
      icon: <Build />,
      color: '#ff9800',
      description: 'Moulding and assembly'
    },
    {
      id: config.statusCodes.FG_SECTION,
      label: 'FG Section',
      icon: <Verified />,
      color: '#9c27b0',
      description: 'Final quality check and packaging'
    },
    {
      id: config.statusCodes.DISPATCH,
      label: 'Dispatch',
      icon: <LocalShipping />,
      color: '#607d8b',
      description: 'Ready for dispatch'
    },
    {
      id: config.statusCodes.DELIVERED,
      label: 'Delivered',
      icon: <CheckCircle />,
      color: '#4caf50',
      description: 'Order completed and delivered'
    }
  ];

  const getCurrentStepIndex = () => {
    return steps.findIndex(step => step.id === currentStatus);
  };

  const getStepStatus = (stepIndex) => {
    const step = steps[stepIndex];
    const isCompleted = stageCompletions[step.id] === 'COMPLETED' || 
                       (stepIndex < getCurrentStepIndex() && !stageCompletions[step.id]);
    const isActive = step.id === currentStatus;
    
    if (isCompleted) return 'completed';
    if (isActive) return 'active';
    return 'pending';
  };

  const getProgressPercentage = () => {
    // Count completed stages based on stageCompletions data
    const completedStages = steps.filter(step => 
      stageCompletions[step.id] === 'COMPLETED'
    ).length;
    
    // If we have stage completion data, use it; otherwise fall back to current status
    if (Object.keys(stageCompletions).length > 0) {
      return (completedStages / steps.length) * 100;
    }
    
    // Fallback to old logic for backward compatibility
    const currentIndex = getCurrentStepIndex();
    return currentIndex >= 0 ? ((currentIndex + 1) / steps.length) * 100 : 0;
  };

  const currentIndex = getCurrentStepIndex();

  return (
    <Paper 
      elevation={2}
      sx={{ 
        p: 3, 
        borderRadius: 3,
        background: 'linear-gradient(135deg, #f8fbff 0%, #e3f2fd 100%)',
        border: '1px solid #e3f2fd'
      }}
    >
      <Box sx={{ mb: 3 }}>
        <Typography variant="h6" sx={{ color: '#1976d2', fontWeight: 600, mb: 1 }}>
          Production Flow Progress
        </Typography>
        <LinearProgress 
          variant="determinate" 
          value={getProgressPercentage()} 
          sx={{ 
            height: 8, 
            borderRadius: 4,
            backgroundColor: '#e3f2fd',
            '& .MuiLinearProgress-bar': {
              background: 'linear-gradient(90deg, #1976d2, #42a5f5)',
              borderRadius: 4
            }
          }} 
        />
        <Typography variant="caption" sx={{ color: '#546e7a', mt: 1, display: 'block' }}>
          {Math.round(getProgressPercentage())}% Complete
        </Typography>
      </Box>

      <Stepper orientation="vertical" activeStep={currentIndex}>
        {steps.map((step, index) => {
          const status = getStepStatus(index);
          const isCompleted = status === 'completed';
          const isActive = status === 'active';
          const isPending = status === 'pending';

          return (
            <Step key={step.id} completed={isCompleted}>
              <StepLabel
                StepIconComponent={({ active, completed }) => (
                  <Box
                    sx={{
                      width: 40,
                      height: 40,
                      borderRadius: '50%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      backgroundColor: completed 
                        ? '#4caf50' 
                        : active 
                        ? step.color 
                        : '#e0e0e0',
                      color: completed || active ? 'white' : '#9e9e9e',
                      border: `2px solid ${active ? step.color : 'transparent'}`,
                      transition: 'all 0.3s ease',
                      '&:hover': {
                        transform: 'scale(1.1)',
                        boxShadow: `0 4px 12px ${step.color}40`
                      }
                    }}
                  >
                    {step.icon}
                  </Box>
                )}
                sx={{
                  '& .MuiStepLabel-label': {
                    color: isActive ? step.color : isCompleted ? '#4caf50' : '#9e9e9e',
                    fontWeight: isActive ? 600 : 400
                  }
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Typography variant="subtitle1" sx={{ fontWeight: isActive ? 600 : 400 }}>
                    {step.label}
                  </Typography>
                  {isActive && (
                    <Chip
                      label="Current"
                      size="small"
                      sx={{
                        backgroundColor: step.color,
                        color: 'white',
                        fontSize: '0.7rem',
                        height: 20
                      }}
                    />
                  )}
                  {isCompleted && (
                    <Chip
                      label="Completed"
                      size="small"
                      color="success"
                      sx={{ fontSize: '0.7rem', height: 20 }}
                    />
                  )}
                </Box>
              </StepLabel>
              
              <StepContent>
                <Typography variant="body2" sx={{ color: '#546e7a', mb: 2 }}>
                  {step.description}
                </Typography>
                
                {canNavigate && (
                  <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
                    {index > 0 && (
                      <Tooltip title={`Go to ${steps[index - 1].label}`}>
                        <Button
                          size="small"
                          variant="outlined"
                          startIcon={<ArrowBack />}
                          onClick={() => onNavigateToStep && onNavigateToStep(steps[index - 1].id)}
                          sx={{
                            borderColor: '#1976d2',
                            color: '#1976d2',
                            '&:hover': {
                              backgroundColor: '#f8fbff',
                              borderColor: '#1565c0'
                            }
                          }}
                        >
                          Previous
                        </Button>
                      </Tooltip>
                    )}
                    
                    {index < steps.length - 1 && (
                      <Tooltip title={`Go to ${steps[index + 1].label}`}>
                        <Button
                          size="small"
                          variant="contained"
                          endIcon={<ArrowForward />}
                          onClick={() => onNavigateToStep && onNavigateToStep(steps[index + 1].id)}
                          sx={{
                            backgroundColor: step.color,
                            '&:hover': {
                              backgroundColor: step.color,
                              filter: 'brightness(0.9)'
                            }
                          }}
                        >
                          Next
                        </Button>
                      </Tooltip>
                    )}
                  </Box>
                )}
              </StepContent>
            </Step>
          );
        })}
      </Stepper>
    </Paper>
  );
};

export default FlowNavigation;
