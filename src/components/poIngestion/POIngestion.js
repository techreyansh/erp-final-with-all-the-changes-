import React, { useState, useEffect } from 'react';
import { 
  Container, 
  Typography, 
  Box, 
  Divider, 
  Paper, 
  Accordion, 
  AccordionSummary, 
  AccordionDetails, 
  Alert, 
  Chip,
  useTheme,
  alpha,
  Fade,
  Slide,
  Grow
} from '@mui/material';
import {
  ExpandMore as ExpandMoreIcon,
  ShoppingCart as SOIcon,
  TrendingUp as TrendingUpIcon,
  Assignment as AssignmentIcon,
  AutoAwesome as AutoAwesomeIcon,
  Storage as StorageIcon
} from '@mui/icons-material';
import SalesOrderForm from './POForm';
import SalesOrderList from './POList';
import SheetInitializer from '../common/SheetInitializer';

const SalesOrderIngestion = () => {
  const theme = useTheme();
  const [expanded, setExpanded] = useState(false);
  const [salesFlowData, setSalesFlowData] = useState(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  
  const handleAccordionChange = () => {
    setExpanded(!expanded);
  };
  
  const expandSheetInitializer = () => {
    setExpanded(true);
  };

  const handleSalesOrderCreated = () => {
    // Increment refresh trigger to cause the list to refresh
    setRefreshTrigger(prev => prev + 1);
  };

  // Check for dispatch completion and trigger refresh
  useEffect(() => {
    const checkDispatchCompletion = () => {
      // Check if we're returning from a dispatch operation
      const dispatchCompleted = sessionStorage.getItem('dispatchCompleted');
      if (dispatchCompleted) {
        setRefreshTrigger(prev => prev + 1);
        sessionStorage.removeItem('dispatchCompleted');
      }
    };

    // Check on mount
    checkDispatchCompletion();

    // Also check when the page becomes visible (in case of tab switching)
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        checkDispatchCompletion();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, []);

  // Check for sales flow data on component mount
  useEffect(() => {
    const salesFlowForSO = sessionStorage.getItem('salesFlowForSO');
    if (salesFlowForSO) {
      try {
        const data = JSON.parse(salesFlowForSO);
        setSalesFlowData(data);
      } catch (err) {
        console.error('Error parsing sales flow data:', err);
      }
    }
  }, []);

  return (
    <Container maxWidth="xl" sx={{ py: 3 }}>
      {/* Header Section */}
      <Box sx={{ mb: 4 }}>
        <Box sx={{ 
          background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.03)} 0%, ${alpha(theme.palette.primary.main, 0.06)} 100%)`,
          borderRadius: 2,
          p: 4,
          color: 'primary.main',
          position: 'relative',
          overflow: 'hidden',
          border: `1px solid ${alpha(theme.palette.primary.main, 0.08)}`
        }}>
          <Box sx={{ 
            position: 'absolute',
            top: -50,
            right: -50,
            width: 200,
            height: 200,
            background: alpha(theme.palette.primary.main, 0.02),
            borderRadius: '50%'
          }} />
          
          <Box sx={{ position: 'relative', zIndex: 1 }}>
            <Fade in timeout={800}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 3, mb: 3 }}>
                <Box sx={{ 
                  p: 2, 
                  borderRadius: 2,
                  backgroundColor: alpha(theme.palette.primary.main, 0.04),
                  color: 'primary.main',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <SOIcon sx={{ fontSize: 32 }} />
                </Box>
                <Box>
                  <Typography 
                    variant="h3" 
                    sx={{ 
                      fontWeight: 600,
                      mb: 1,
                      color: 'primary.main'
                    }}
                  >
                    Sales Order Ingestion
                  </Typography>
                  <Typography 
                    variant="h6" 
                    sx={{ 
                      opacity: 0.9,
                      fontWeight: 400,
                      maxWidth: 600,
                      color: 'text.secondary'
                    }}
                  >
                    Streamline sales order creation with automated BOM generation and workflow management
                  </Typography>
                </Box>
              </Box>
            </Fade>
            
            <Slide direction="up" in timeout={1000}>
              <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', mb: 2 }}>
                <Chip
                  icon={<TrendingUpIcon />}
                  label="Automated BOM Generation"
                  variant="outlined"
                  size="small"
                  sx={{ 
                    borderColor: alpha(theme.palette.success.main, 0.3),
                    color: 'success.main',
                    fontWeight: 500,
                    '& .MuiChip-icon': { color: 'success.main' }
                  }}
                />
                <Chip
                  icon={<AssignmentIcon />}
                  label="Workflow Integration"
                  variant="outlined"
                  size="small"
                  sx={{ 
                    borderColor: alpha(theme.palette.info.main, 0.3),
                    color: 'info.main',
                    fontWeight: 500,
                    '& .MuiChip-icon': { color: 'info.main' }
                  }}
                />
                <Chip
                  icon={<AutoAwesomeIcon />}
                  label="Smart Processing"
                  variant="outlined"
                  size="small"
                  sx={{ 
                    borderColor: alpha(theme.palette.warning.main, 0.3),
                    color: 'warning.main',
                    fontWeight: 500,
                    '& .MuiChip-icon': { color: 'warning.main' }
                  }}
                />
              </Box>
            </Slide>
            
            {salesFlowData && (
              <Fade in timeout={1200}>
                <Box sx={{ mt: 3, display: 'flex', flexDirection: 'column', gap: 2 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Chip 
                      label="Sales Flow Data" 
                      color="success" 
                      size="small"
                      sx={{ fontWeight: 600 }}
                    />
                    <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                      Pre-populated from Sales Flow Log ID: {salesFlowData.salesFlowData?.LogId}
                    </Typography>
                  </Box>
                  {salesFlowData.newClient && (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      <Chip 
                        label="New Client Created" 
                        color="primary" 
                        size="small"
                        sx={{ fontWeight: 600 }}
                      />
                      <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                        Client Code: {salesFlowData.newClient.clientCode} | Products: {salesFlowData.newClient.products?.length || 0} items
                      </Typography>
                    </Box>
                  )}
                </Box>
              </Fade>
            )}
          </Box>
        </Box>
      </Box>
      
      {/* Sheet Initializer Accordion */}
      <Grow in timeout={600}>
        <Paper 
          elevation={0}
          sx={{ 
            mb: 4, 
            border: `1px solid ${alpha(theme.palette.primary.main, 0.08)}`,
            borderRadius: 2,
            overflow: 'hidden',
            transition: 'all 0.3s ease',
            '&:hover': {
              borderColor: alpha(theme.palette.primary.main, 0.15),
              boxShadow: theme.shadows[2]
            }
          }}
        >
          <Accordion 
            expanded={expanded} 
            onChange={handleAccordionChange}
            sx={{ 
              '&:before': { display: 'none' },
              '& .MuiAccordionSummary-root': {
                backgroundColor: alpha(theme.palette.primary.main, 0.02),
                borderBottom: expanded ? `1px solid ${alpha(theme.palette.primary.main, 0.08)}` : 'none',
                transition: 'all 0.3s ease'
              },
              '& .MuiAccordionDetails-root': {
                backgroundColor: 'white'
              }
            }}
          >
            <AccordionSummary
              expandIcon={<ExpandMoreIcon sx={{ color: 'primary.main' }} />}
              aria-controls="sheet-initializer-panel-content"
              id="sheet-initializer-panel-header"
              sx={{ px: 3, py: 2 }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <StorageIcon sx={{ color: 'primary.main', fontSize: 20 }} />
                <Typography 
                  variant="h6" 
                  sx={{ 
                    color: 'primary.main',
                    fontWeight: 500
                  }}
                >
                  Google Sheets Structure Setup
                </Typography>
              </Box>
            </AccordionSummary>
            <AccordionDetails sx={{ px: 3, py: 3 }}>
              <SheetInitializer />
            </AccordionDetails>
          </Accordion>
        </Paper>
      </Grow>
      
      {/* Sales Order Form Section */}
      <Fade in timeout={800}>
        <Box sx={{ mb: 4 }}>
          <SalesOrderForm 
            onExpandSheetInitializer={expandSheetInitializer}
            onSalesOrderCreated={handleSalesOrderCreated}
          />
        </Box>
      </Fade>
      
      {/* Sales Order List Section */}
      <Fade in timeout={1000}>
        <Box sx={{ mb: 4 }}>
          <SalesOrderList refreshTrigger={refreshTrigger} />
        </Box>
      </Fade>
      
      <Divider sx={{ my: 4, borderColor: alpha(theme.palette.divider, 0.12) }} />
      
      {/* About Section */}
      <Slide direction="up" in timeout={1200}>
        <Paper 
          elevation={0}
          sx={{ 
            p: 4, 
            background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.02)} 0%, ${alpha(theme.palette.primary.main, 0.04)} 100%)`,
            border: `1px solid ${alpha(theme.palette.primary.main, 0.08)}`,
            borderRadius: 2,
            transition: 'all 0.3s ease',
            '&:hover': {
              borderColor: alpha(theme.palette.primary.main, 0.15),
              boxShadow: theme.shadows[2]
            }
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
            <Box sx={{ 
              p: 1.5, 
              borderRadius: 2,
              backgroundColor: alpha(theme.palette.primary.main, 0.04),
              color: 'primary.main'
            }}>
              <AutoAwesomeIcon sx={{ fontSize: 24 }} />
            </Box>
            <Typography 
              variant="h5" 
              sx={{ 
                color: 'primary.main',
                fontWeight: 600
              }}
            >
              About Sales Order Ingestion
            </Typography>
          </Box>
          
          <Typography 
            variant="body1" 
            paragraph 
            sx={{ 
              color: 'text.primary',
              lineHeight: 1.7,
              mb: 3,
              fontSize: '1.1rem'
            }}
          >
            The Sales Order Ingestion module streamlines the process of creating and managing Sales Orders. When you submit a new Sales Order, the system automatically:
          </Typography>
          
          <Box 
            component="ul" 
            sx={{ 
              pl: 0,
              display: 'flex',
              flexDirection: 'column',
              gap: 3
            }}
          >
            {[
              {
                title: 'Generates Bill of Materials (BOM)',
                description: 'Based on product specifications and requirements',
                icon: <AssignmentIcon sx={{ fontSize: 18 }} />,
                color: 'primary'
              },
              {
                title: 'Creates tasks in the workflow management system',
                description: 'Automatically assigns and tracks progress',
                icon: <TrendingUpIcon sx={{ fontSize: 18 }} />,
                color: 'success'
              },
              {
                title: 'Assigns the first task to the Store Manager',
                description: 'Ensures proper workflow initiation',
                icon: <SOIcon sx={{ fontSize: 18 }} />,
                color: 'info'
              },
              {
                title: 'Stores supporting documents for future reference',
                description: 'Maintains complete audit trail',
                icon: <StorageIcon sx={{ fontSize: 18 }} />,
                color: 'warning'
              }
            ].map((item, index) => (
              <Box 
                key={index}
                component="li"
                sx={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: 2,
                  p: 2,
                  borderRadius: 2,
                  backgroundColor: alpha(theme.palette[item.color].main, 0.02),
                  border: `1px solid ${alpha(theme.palette[item.color].main, 0.08)}`,
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    backgroundColor: alpha(theme.palette[item.color].main, 0.04),
                    borderColor: alpha(theme.palette[item.color].main, 0.15),
                    transform: 'translateY(-1px)'
                  }
                }}
              >
                <Box sx={{ 
                  p: 1, 
                  borderRadius: 1.5,
                  backgroundColor: alpha(theme.palette[item.color].main, 0.06),
                  color: `${item.color}.main`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0
                }}>
                  {item.icon}
                </Box>
                <Box>
                  <Typography 
                    variant="body1" 
                    sx={{ 
                      fontWeight: 600, 
                      color: `${item.color}.main`,
                      mb: 0.5
                    }}
                  >
                    {item.title}
                  </Typography>
                  <Typography 
                    variant="body2" 
                    sx={{ 
                      color: 'text.secondary',
                      lineHeight: 1.5
                    }}
                  >
                    {item.description}
                  </Typography>
                </Box>
              </Box>
            ))}
          </Box>
        </Paper>
      </Slide>
    </Container>
  );
};

export default SalesOrderIngestion;