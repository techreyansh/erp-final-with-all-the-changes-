import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
  Chip,
  useTheme,
  Alert,
  Snackbar,
  IconButton,
  Tooltip,
  CircularProgress,
  Card,
  CardContent,
  Grid,
  Avatar,
  Divider,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Fade,
  Pagination,
  TextField,
  InputAdornment,
  FormControl,
  Select,
  MenuItem
} from '@mui/material';
import { useAuth } from '../../context/AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';
import salesFlowService from '../../services/salesFlowService';
import { createClientFromSalesFlow } from '../../services/clientService';
import { 
  Visibility, 
  Edit, 
  CheckCircle, 
  Cancel,
  Refresh,
  TrendingUp,
  Schedule,
  Person,
  Assignment,
  Timeline,
  Speed,
  Star,
  Gavel,
  ExpandMore,
  ArrowForward,
  Receipt,
  Search
} from '@mui/icons-material';

const SalesFlowDetails = () => {
  const theme = useTheme();
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [salesFlowData, setSalesFlowData] = useState(null);
  const [salesFlowSteps, setSalesFlowSteps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  
  // Pagination state for sales flow steps
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(5);
  const [searchQuery, setSearchQuery] = useState('');

  // Get LogId from session storage or location state
  const getLogId = () => {
    const currentStep = sessionStorage.getItem('currentSalesFlowStep');
    if (currentStep) {
      const stepData = JSON.parse(currentStep);
      return stepData.LogId;
    }
    return null;
  };

  useEffect(() => {
    loadSalesFlowDetails();
  }, []);

  const loadSalesFlowDetails = async () => {
    try {
      setLoading(true);
      const logId = getLogId();
      
      if (!logId) {
        setError('No sales flow data found');
        return;
      }

      // Get sales flow data
      const flowData = await salesFlowService.getSalesFlowByLogId(logId);
      if (!flowData) {
        setError('Sales flow not found');
        return;
      }

      // Get lead details
      const leadData = await salesFlowService.getLeadByLogId(logId);
      
      // Get all steps for this log
      const allSteps = await salesFlowService.getAllSalesFlowSteps();
      const stepsForLog = allSteps.filter(step => step.LogId === logId);

      setSalesFlowData({
        ...flowData,
        leadDetails: leadData
      });
      setSalesFlowSteps(stepsForLog);
      setError(null);
    } catch (err) {
      console.error('Error loading sales flow details:', err);
      setError('Failed to load sales flow details. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleProceedToPO = async () => {
    if (salesFlowData) {
      try {
        setLoading(true);
        
        // Get lead details for client creation
        const leadData = await salesFlowService.getLeadByLogId(salesFlowData.LogId);
        
        // Create new client from sales flow data
        const clientResult = await createClientFromSalesFlow(salesFlowData, leadData);
        
        if (clientResult.success) {
          // Store the complete sales flow data and new client info in session storage for Sales Order Ingestion
          sessionStorage.setItem('salesFlowForSO', JSON.stringify({
            salesFlowData,
            salesFlowSteps,
            newClient: clientResult.client,
            source: 'sales-flow-step-11'
          }));
          
          // Show success message
          setSnackbar({
            open: true,
            message: `New client ${clientResult.client.clientCode} created successfully!`,
            severity: 'success'
          });
          
          // Navigate to Sales Order Ingestion after a short delay
          setTimeout(() => {
            navigate('/po-ingestion');
          }, 1500);
        }
      } catch (error) {
        console.error('Error creating client:', error);
        setSnackbar({
          open: true,
          message: 'Error creating client. Please try again.',
          severity: 'error'
        });
      } finally {
        setLoading(false);
      }
    }
  };

  // Pagination handlers
  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleSearchChange = (event) => {
    setSearchQuery(event.target.value);
    setPage(0);
  };

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'completed':
        return 'success';
      case 'in progress':
        return 'warning';
      case 'rejected':
        return 'error';
      case 'new':
        return 'info';
      default:
        return 'default';
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStepIcon = (stepNumber) => {
    const icons = {
      1: <Person />,
      2: <Assignment />,
      3: <Star />,
      4: <TrendingUp />,
      5: <CheckCircle />,
      6: <Edit />,
      7: <CheckCircle />,
      8: <Assignment />,
      9: <Gavel />,
      10: <Star />,
      11: <Assignment />,
      12: <TrendingUp />,
      13: <Assignment />,
      14: <Edit />,
      15: <Person />,
      16: <Assignment />,
      17: <Schedule />
    };
    return icons[stepNumber] || <Timeline />;
  };

  // Filter and paginate sales flow steps
  const filteredSteps = salesFlowSteps.filter(step => 
    step.StepId?.toString().includes(searchQuery.toLowerCase()) ||
    step.Action?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    step.Role?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    step.AssignedTo?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    step.Status?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const paginatedSteps = filteredSteps.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage
  );

  if (loading) {
    return (
      <Box 
        display="flex" 
        flexDirection="column"
        justifyContent="center" 
        alignItems="center" 
        minHeight="400px"
        sx={{
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          borderRadius: 3,
          p: 4
        }}
      >
        <CircularProgress size={60} sx={{ color: 'white', mb: 2 }} />
        <Typography variant="h6" color="white" sx={{ fontWeight: 300 }}>
          Loading Sales Flow Details...
        </Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4 }}>
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      </Container>
    );
  }

  return (
    <Box sx={{ 
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)',
      py: 3,
    }}>
      <Container maxWidth="lg" sx={{ mt: 8 }}>
        <Fade in timeout={800}>
          <Box>
            {/* Header */}
            <Card sx={{ 
              mb: 3,
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              color: 'white',
              borderRadius: 3,
              boxShadow: '0 8px 32px rgba(0,0,0,0.1)'
            }}>
              <CardContent sx={{ p: 4 }}>
                <Box display="flex" justifyContent="space-between" alignItems="center">
                  <Box>
                    <Typography variant="h3" component="h1" sx={{ 
                      fontWeight: 700,
                      mb: 1,
                      textShadow: '0 2px 4px rgba(0,0,0,0.1)'
                    }}>
                      Sales Flow Details
                    </Typography>
                    <Typography variant="h6" sx={{ 
                      opacity: 0.9,
                      fontWeight: 300
                    }}>
                      Complete journey for Log ID: {salesFlowData?.LogId}
                    </Typography>
                  </Box>
                  <Box display="flex" gap={2}>
                    <Button
                      variant="contained"
                      startIcon={<Receipt />}
                      onClick={handleProceedToPO}
                      sx={{
                        backgroundColor: 'rgba(255,255,255,0.2)',
                        color: 'white',
                        '&:hover': {
                          backgroundColor: 'rgba(255,255,255,0.3)'
                        }
                      }}
                    >
                      Proceed to Sales Order Ingestion
                    </Button>
                    <Tooltip title="Refresh Data">
                      <IconButton 
                        onClick={loadSalesFlowDetails} 
                        sx={{ 
                          color: 'white',
                          backgroundColor: 'rgba(255,255,255,0.1)',
                          '&:hover': {
                            backgroundColor: 'rgba(255,255,255,0.2)'
                          }
                        }}
                      >
                        <Refresh />
                      </IconButton>
                    </Tooltip>
                  </Box>
                </Box>
              </CardContent>
            </Card>

            {/* Customer Information */}
            <Card sx={{ mb: 3, borderRadius: 3, boxShadow: '0 4px 20px rgba(0,0,0,0.08)' }}>
              <CardContent sx={{ p: 4 }}>
                <Typography variant="h5" sx={{ mb: 3, color: '#1976d2', fontWeight: 600 }}>
                  Customer Information
                </Typography>
                <Grid container spacing={3}>
                  <Grid item xs={12} sm={6} md={3}>
                    <Typography variant="subtitle2" color="textSecondary">Customer Name</Typography>
                    <Typography variant="body1" sx={{ fontWeight: 500 }}>
                      {salesFlowData?.leadDetails?.CustomerName || salesFlowData?.FullName || '-'}
                    </Typography>
                  </Grid>
                  <Grid item xs={12} sm={6} md={3}>
                    <Typography variant="subtitle2" color="textSecondary">Company</Typography>
                    <Typography variant="body1" sx={{ fontWeight: 500 }}>
                      {salesFlowData?.leadDetails?.CompanyName || salesFlowData?.CompanyName || '-'}
                    </Typography>
                  </Grid>
                  <Grid item xs={12} sm={6} md={3}>
                    <Typography variant="subtitle2" color="textSecondary">Email</Typography>
                    <Typography variant="body1" sx={{ fontWeight: 500 }}>
                      {salesFlowData?.leadDetails?.EmailId || salesFlowData?.Email || '-'}
                    </Typography>
                  </Grid>
                  <Grid item xs={12} sm={6} md={3}>
                    <Typography variant="subtitle2" color="textSecondary">Phone</Typography>
                    <Typography variant="body1" sx={{ fontWeight: 500 }}>
                      {salesFlowData?.leadDetails?.MobileNumber || salesFlowData?.PhoneNumber || '-'}
                    </Typography>
                  </Grid>
                  <Grid item xs={12} sm={6} md={3}>
                    <Typography variant="subtitle2" color="textSecondary">Location</Typography>
                    <Typography variant="body1" sx={{ fontWeight: 500 }}>
                      {salesFlowData?.leadDetails?.CustomerLocation || '-'}
                    </Typography>
                  </Grid>
                  <Grid item xs={12} sm={6} md={3}>
                    <Typography variant="subtitle2" color="textSecondary">Customer Type</Typography>
                    <Typography variant="body1" sx={{ fontWeight: 500 }}>
                      {salesFlowData?.leadDetails?.CustomerType || '-'}
                    </Typography>
                  </Grid>
                  <Grid item xs={12} sm={6} md={3}>
                    <Typography variant="subtitle2" color="textSecondary">Lead Source</Typography>
                    <Typography variant="body1" sx={{ fontWeight: 500 }}>
                      {salesFlowData?.LeadSource || '-'}
                    </Typography>
                  </Grid>
                  <Grid item xs={12} sm={6} md={3}>
                    <Typography variant="subtitle2" color="textSecondary">Priority</Typography>
                    <Chip 
                      label={salesFlowData?.Priority || 'Medium'} 
                      size="small" 
                      color={getStatusColor(salesFlowData?.Priority)}
                      sx={{ fontWeight: 600 }}
                    />
                  </Grid>
                </Grid>
                
                {salesFlowData?.leadDetails?.Requirement && (
                  <Box sx={{ mt: 3 }}>
                    <Typography variant="subtitle2" color="textSecondary">Requirement</Typography>
                    <Typography variant="body1" sx={{ mt: 1 }}>
                      {salesFlowData.leadDetails.Requirement}
                    </Typography>
                  </Box>
                )}
              </CardContent>
            </Card>

            {/* Sales Flow Steps Timeline */}
            <Card sx={{ mb: 3, borderRadius: 3, boxShadow: '0 4px 20px rgba(0,0,0,0.08)' }}>
              <CardContent sx={{ p: 4 }}>
                <Typography variant="h5" sx={{ mb: 3, color: '#1976d2', fontWeight: 600 }}>
                  Sales Flow Timeline
                </Typography>
                
                {/* Search Bar for Steps */}
                <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <TextField
                    placeholder="Search steps..."
                    value={searchQuery}
                    onChange={handleSearchChange}
                    size="small"
                    sx={{ 
                      minWidth: 300,
                      '& .MuiOutlinedInput-root': {
                        borderRadius: 3,
                        backgroundColor: 'rgba(255, 255, 255, 0.9)',
                        boxShadow: '0 2px 8px rgba(102, 126, 234, 0.1)',
                      }
                    }}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <Search sx={{ color: '#667eea' }} />
                        </InputAdornment>
                      ),
                    }}
                  />
                  <Typography variant="body2" sx={{ color: '#666', fontWeight: 500 }}>
                    Showing {paginatedSteps.length} of {filteredSteps.length} steps
                  </Typography>
                </Box>
                
                <Box sx={{ position: 'relative' }}>
                  {paginatedSteps.map((step, index) => (
                    <Accordion key={`${step.LogId}-${step.StepId}`} sx={{ mb: 2 }}>
                      <AccordionSummary expandIcon={<ExpandMore />}>
                        <Box display="flex" alignItems="center" gap={2} sx={{ width: '100%' }}>
                          <Avatar sx={{ 
                            width: 40, 
                            height: 40, 
                            background: step.Status === 'completed' 
                              ? 'linear-gradient(135deg, #4CAF50 0%, #45a049 100%)'
                              : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                            color: 'white'
                          }}>
                            {getStepIcon(parseInt(step.StepId))}
                          </Avatar>
                          <Box sx={{ flexGrow: 1 }}>
                            <Typography variant="h6" sx={{ fontWeight: 600 }}>
                              Step {step.StepId}: {step.Action}
                            </Typography>
                            <Typography variant="body2" color="textSecondary">
                              Role: {step.Role} | Status: {step.Status}
                            </Typography>
                          </Box>
                          <Chip 
                            label={step.Status} 
                            size="small" 
                            color={getStatusColor(step.Status)}
                            sx={{ fontWeight: 600 }}
                          />
                        </Box>
                      </AccordionSummary>
                      <AccordionDetails>
                        <Grid container spacing={3}>
                          <Grid item xs={12} sm={6}>
                            <Typography variant="subtitle2" color="textSecondary">Assigned To</Typography>
                            <Typography variant="body1" sx={{ fontWeight: 500 }}>
                              {step.AssignedTo || '-'}
                            </Typography>
                          </Grid>
                          <Grid item xs={12} sm={6}>
                            <Typography variant="subtitle2" color="textSecondary">Start Time</Typography>
                            <Typography variant="body1" sx={{ fontWeight: 500 }}>
                              {formatDate(step.StartTime)}
                            </Typography>
                          </Grid>
                          <Grid item xs={12} sm={6}>
                            <Typography variant="subtitle2" color="textSecondary">End Time</Typography>
                            <Typography variant="body1" sx={{ fontWeight: 500 }}>
                              {formatDate(step.EndTime)}
                            </Typography>
                          </Grid>
                          <Grid item xs={12} sm={6}>
                            <Typography variant="subtitle2" color="textSecondary">TAT Status</Typography>
                            <Chip 
                              label={step.TATStatus || 'On Time'} 
                              size="small" 
                              color={step.TATStatus === 'Breached' ? 'error' : 'success'}
                              sx={{ fontWeight: 600 }}
                            />
                          </Grid>
                          {step.Note && (
                            <Grid item xs={12}>
                              <Typography variant="subtitle2" color="textSecondary">Notes</Typography>
                              <Typography variant="body1" sx={{ mt: 1 }}>
                                {step.Note}
                              </Typography>
                            </Grid>
                          )}
                          {step.Comments && step.Comments.length > 0 && (
                            <Grid item xs={12}>
                              <Typography variant="subtitle2" color="textSecondary">Comments</Typography>
                              <Box sx={{ mt: 1 }}>
                                {step.Comments.map((comment, idx) => (
                                  <Paper key={idx} sx={{ p: 2, mb: 1, backgroundColor: '#f8f9fa' }}>
                                    <Typography variant="body2" sx={{ fontWeight: 500 }}>
                                      {comment.user} - {formatDate(comment.timestamp)}
                                    </Typography>
                                    <Typography variant="body2" sx={{ mt: 1 }}>
                                      {comment.comment}
                                    </Typography>
                                  </Paper>
                                ))}
                              </Box>
                            </Grid>
                          )}
                        </Grid>
                      </AccordionDetails>
                    </Accordion>
                  ))}
                </Box>
                
                {/* Pagination for Steps */}
                {filteredSteps.length > 0 && (
                  <Box sx={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'center',
                    p: 2,
                    mt: 2,
                    borderTop: '1px solid rgba(102, 126, 234, 0.1)'
                  }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      <Typography variant="body2" sx={{ color: '#667eea', fontWeight: 600 }}>
                        Steps per page:
                      </Typography>
                      <FormControl size="small" sx={{ minWidth: 80 }}>
                        <Select
                          value={rowsPerPage}
                          onChange={(e) => {
                            setRowsPerPage(e.target.value);
                            setPage(0);
                          }}
                          sx={{
                            '& .MuiOutlinedInput-notchedOutline': {
                              borderColor: 'rgba(102, 126, 234, 0.3)',
                            },
                            '&:hover .MuiOutlinedInput-notchedOutline': {
                              borderColor: 'rgba(102, 126, 234, 0.5)',
                            },
                            '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                              borderColor: '#667eea',
                            }
                          }}
                        >
                          <MenuItem value={3}>3</MenuItem>
                          <MenuItem value={5}>5</MenuItem>
                          <MenuItem value={10}>10</MenuItem>
                        </Select>
                      </FormControl>
                    </Box>

                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                      <Typography variant="body2" sx={{ color: '#667eea', fontWeight: 600 }}>
                        {page * rowsPerPage + 1}–{Math.min((page + 1) * rowsPerPage, filteredSteps.length)} of {filteredSteps.length} steps
                      </Typography>
                      
                      {Math.ceil(filteredSteps.length / rowsPerPage) > 1 && (
                        <Pagination
                          count={Math.ceil(filteredSteps.length / rowsPerPage)}
                          page={page + 1}
                          onChange={(event, value) => setPage(value - 1)}
                          color="primary"
                          size="large"
                          showFirstButton
                          showLastButton
                          sx={{
                            '& .MuiPaginationItem-root': {
                              borderRadius: 3,
                              fontWeight: 700,
                              fontSize: '0.9rem',
                              minWidth: 36,
                              height: 36,
                              margin: '0 2px',
                              transition: 'all 0.3s ease',
                              '&:hover': {
                                transform: 'scale(1.1)',
                                boxShadow: '0 5px 15px rgba(0,0,0,0.2)'
                              },
                              '&.Mui-selected': {
                                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                                color: 'white',
                                fontWeight: 800,
                                boxShadow: '0 8px 20px rgba(0,0,0,0.3)',
                                '&:hover': {
                                  transform: 'scale(1.15)',
                                  boxShadow: '0 10px 25px rgba(0,0,0,0.4)'
                                }
                              }
                            }
                          }}
                        />
                      )}
                    </Box>
                  </Box>
                )}
              </CardContent>
            </Card>

            {/* Action Button */}
            <Card sx={{ borderRadius: 3, boxShadow: '0 4px 20px rgba(0,0,0,0.08)' }}>
              <CardContent sx={{ p: 4, textAlign: 'center' }}>
                <Typography variant="h6" sx={{ mb: 2, color: '#1976d2', fontWeight: 600 }}>
                  Ready to Create Sales Order?
                </Typography>
                <Typography variant="body1" sx={{ mb: 3, color: 'textSecondary' }}>
                  All sales flow steps have been completed. You can now proceed to create a sales order with all the gathered information.
                </Typography>
                <Button
                  variant="contained"
                  size="large"
                  startIcon={<ArrowForward />}
                  onClick={handleProceedToPO}
                  sx={{
                    background: 'linear-gradient(135deg, #4CAF50 0%, #45a049 100%)',
                    color: 'white',
                    px: 4,
                    py: 2,
                    fontSize: '1.1rem',
                    fontWeight: 600,
                    '&:hover': {
                      background: 'linear-gradient(135deg, #45a049 0%, #3d8b40 100%)',
                      transform: 'translateY(-2px)',
                      boxShadow: '0 6px 20px rgba(76, 175, 80, 0.4)'
                    }
                  }}
                >
                  Proceed to Sales Order Ingestion
                </Button>
              </CardContent>
            </Card>

            {/* Snackbar */}
            <Snackbar
              open={snackbar.open}
              autoHideDuration={6000}
              onClose={() => setSnackbar({ ...snackbar, open: false })}
              anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
            >
              <Alert 
                onClose={() => setSnackbar({ ...snackbar, open: false })} 
                severity={snackbar.severity}
                sx={{ 
                  borderRadius: 2,
                  boxShadow: '0 8px 32px rgba(0,0,0,0.1)'
                }}
              >
                {snackbar.message}
              </Alert>
            </Snackbar>
          </Box>
        </Fade>
      </Container>
    </Box>
  );
};

export default SalesFlowDetails;
