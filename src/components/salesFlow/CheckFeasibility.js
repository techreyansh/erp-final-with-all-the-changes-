import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Typography,
  Paper,
  TextField,
  Button,
  useTheme,
  Alert,
  Snackbar,
  CircularProgress,
  Grid,
  Card,
  CardContent,
  Divider,
  Avatar,
  Fade,
  IconButton,
  Tooltip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Switch,
  FormControlLabel
} from '@mui/material';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import salesFlowService from '../../services/salesFlowService';
import { 
  Save, 
  ArrowBack, 
  Person, 
  Business, 
  Email, 
  Phone, 
  Assignment,
  Visibility,
  Send,
  Engineering,
  Science,
  Assessment,
  ThumbUp,
  ThumbDown,
  Warning,
  Info,
  AutoAwesome,
  CheckCircleOutline,
  Schedule,
  LocationOn,
  WorkspacePremium,
  TrendingUp,
  Call,
  Notes
} from '@mui/icons-material';

const CheckFeasibility = () => {
  const theme = useTheme();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [leads, setLeads] = useState([]);
  const [selectedLead, setSelectedLead] = useState(null);
  const [feasibilityStatus, setFeasibilityStatus] = useState(false);
  const [feasibilityNotes, setFeasibilityNotes] = useState('');
  const [products, setProducts] = useState([]);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);

  useEffect(() => {
    loadLeadsForStep4();
  }, []);

  const loadLeadsForStep4 = async () => {
    try {
      setLoading(true);
      const [leadsData, productsData] = await Promise.all([
        salesFlowService.getCheckFeasibilityDetails(),
        salesFlowService.getProducts()
      ]);
      setLeads(leadsData);
      setProducts(productsData);
    } catch (error) {
      console.error('Error loading leads:', error);
      setSnackbar({
        open: true,
        message: 'Failed to load leads',
        severity: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSendMail = (email) => {
    const subject = encodeURIComponent('Feasibility Check - Technical Review');
    const body = encodeURIComponent(`Dear Customer,\n\nThank you for your inquiry.\n\nWe are currently conducting a technical feasibility review of your requirements.\n\nWe will get back to you with our findings shortly.\n\nBest regards,\nTechnical Team`);
    window.open(`mailto:${email}?subject=${subject}&body=${body}`);
  };

  const handleViewDetails = (lead) => {
    setSelectedLead(lead);
    setDetailsDialogOpen(true);
  };

  const handleSubmit = async () => {
    if (!selectedLead) {
      setSnackbar({
        open: true,
        message: 'Please select a lead first',
        severity: 'warning'
      });
      return;
    }

    if (!feasibilityNotes.trim()) {
      setSnackbar({
        open: true,
        message: 'Please add feasibility notes',
        severity: 'warning'
      });
      return;
    }

    try {
      setLoading(true);
      
      const feasibilityData = {
        LogId: selectedLead.LogId,
        FullName: selectedLead.CustomerName || selectedLead.FullName,
        CompanyName: selectedLead.CompanyName,
        Email: selectedLead.EmailId || selectedLead.Email,
        PhoneNumber: selectedLead.MobileNumber || selectedLead.PhoneNumber,
        Requirement: selectedLead.Requirement,
        LeadSource: selectedLead.LeadSource,
        Priority: selectedLead.Priority,
        QualificationStatus: selectedLead.QualificationStatus,
        Notes: selectedLead.Notes,
        FeasibilityStatus: feasibilityStatus ? 'Feasible' : 'Not Feasible',
        FeasibilityNotes: feasibilityNotes,
        CheckedBy: user?.email || user?.name || 'Quality Engineer',
        CheckedAt: new Date().toISOString(),
        Status: 'Completed'
      };

      await salesFlowService.saveFeasibilityCheck(feasibilityData);

      setSnackbar({
        open: true,
        message: 'Feasibility check completed successfully!',
        severity: 'success'
      });

      setSelectedLead(null);
      setFeasibilityStatus(false);
      setFeasibilityNotes('');
      await loadLeadsForStep4();

      // Navigate back to sales flow after a short delay
      setTimeout(() => {
        navigate('/sales-flow');
      }, 2000);

    } catch (error) {
      console.error('Error saving feasibility check:', error);
      const errorMessage = error.message || 'Failed to save feasibility check. Please try again.';
      setSnackbar({
        open: true,
        message: errorMessage,
        severity: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority?.toLowerCase()) {
      case 'high': return 'error';
      case 'medium': return 'warning';
      case 'low': return 'success';
      default: return 'default';
    }
  };

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'new': return 'primary';
      case 'in progress': return 'warning';
      case 'completed': return 'success';
      case 'rejected': return 'error';
      default: return 'default';
    }
  };

  const getFeasibilityColor = (status) => {
    return status ? 'success' : 'error';
  };

  return (
    <Box sx={{ 
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #f8fafc 0%, #e3f2fd 100%)',
      py: 3
    }}>
      <Container maxWidth="xl">
        <Fade in timeout={800}>
          <Box>
            {/* Enhanced Header */}
            <Card sx={{ 
              mb: 4,
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              color: 'white',
              borderRadius: 3,
              boxShadow: '0 20px 60px rgba(0,0,0,0.15)',
              position: 'relative',
              overflow: 'hidden',
              maxWidth: '1400px',
              mx: 'auto',
              '&::before': {
                content: '""',
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                background: 'url("data:image/svg+xml,%3Csvg width="60" height="60" viewBox="0 0 60 60" xmlns="http://www.w3.org/2000/svg"%3E%3Cg fill="none" fill-rule="evenodd"%3E%3Cg fill="%23ffffff" fill-opacity="0.05"%3E%3Ccircle cx="30" cy="30" r="2"/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")',
                opacity: 0.3
              }
            }}>
              <CardContent sx={{ p: 4, position: 'relative', zIndex: 1 }}>
                <Box display="flex" alignItems="center" justifyContent="space-between">
                  <Box display="flex" alignItems="center" gap={3}>
                    <Tooltip title="Back to Sales Flow">
                      <IconButton
                        onClick={() => navigate('/sales-flow')}
                        sx={{ 
                          color: 'white',
                          backgroundColor: 'rgba(255,255,255,0.1)',
                          '&:hover': {
                            backgroundColor: 'rgba(255,255,255,0.2)',
                            transform: 'translateX(-3px)'
                          },
                          transition: 'all 0.3s ease'
                        }}
                      >
                        <ArrowBack />
                      </IconButton>
                    </Tooltip>
                    
                    <Box display="flex" alignItems="center" gap={2}>
                      <Box sx={{
                        width: 60,
                        height: 60,
                        borderRadius: '50%',
                        background: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        boxShadow: '0 8px 32px rgba(250, 112, 154, 0.4)',
                        position: 'relative',
                        '&::after': {
                          content: '""',
                          position: 'absolute',
                          top: -2,
                          left: -2,
                          right: -2,
                          bottom: -2,
                          borderRadius: '50%',
                          background: 'linear-gradient(135deg, #667eea, #764ba2, #f093fb)',
                          zIndex: -1,
                          opacity: 0.7
                        }
                      }}>
                        <Engineering sx={{ fontSize: 28, color: 'white' }} />
                      </Box>
                      <Box>
                        <Typography variant="h3" sx={{ 
                          fontWeight: 800,
                          background: 'linear-gradient(135deg, #ffffff 0%, #f0f0f0 100%)',
                          backgroundClip: 'text',
                          WebkitBackgroundClip: 'text',
                          WebkitTextFillColor: 'transparent',
                          textShadow: '0 4px 8px rgba(0,0,0,0.1)',
                          mb: 1
                        }}>
                          Check Feasibility
                        </Typography>
                        <Typography variant="h6" sx={{ 
                          opacity: 0.9,
                          fontWeight: 300,
                          color: 'rgba(255,255,255,0.9)'
                        }}>
                          Technical feasibility assessment for high-value prospects
                        </Typography>
                      </Box>
                    </Box>
                  </Box>
                  
                  <Box sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1,
                    px: 3,
                    py: 1.5,
                    background: 'rgba(255,255,255,0.1)',
                    borderRadius: 3,
                    border: '1px solid rgba(255,255,255,0.2)',
                    backdropFilter: 'blur(10px)'
                  }}>
                    <WorkspacePremium sx={{ color: '#fee140', fontSize: 20 }} />
                    <Typography variant="body2" sx={{ fontWeight: 600, color: 'white' }}>
                      Step 4
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>

            {/* Leads Table */}
            <Card sx={{ 
              borderRadius: 3,
              boxShadow: '0 20px 60px rgba(0,0,0,0.1)',
              overflow: 'hidden',
              background: 'white',
              maxWidth: '1400px',
              mx: 'auto',
              mb: 4
            }}>
              <CardContent sx={{ p: 4 }}>
                <Box display="flex" alignItems="center" gap={2} mb={4}>
                  <Avatar sx={{ 
                    width: 48, 
                    height: 48, 
                    background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
                    boxShadow: '0 4px 16px rgba(79, 172, 254, 0.3)'
                  }}>
                    <Assessment sx={{ fontSize: 24 }} />
                  </Avatar>
                  <Box>
                    <Typography variant="h5" sx={{ fontWeight: 700, color: '#1976d2', mb: 0.5 }}>
                      Prospects Requiring Feasibility Check
                    </Typography>
                    <Typography variant="body1" sx={{ color: 'text.secondary', fontWeight: 400 }}>
                      Select a prospect to conduct technical feasibility assessment
                    </Typography>
                  </Box>
                </Box>

                {loading ? (
                  <Box display="flex" justifyContent="center" py={4}>
                    <CircularProgress />
                  </Box>
                ) : leads.length === 0 ? (
                  <Box textAlign="center" py={4}>
                    <Typography variant="h6" color="text.secondary">
                      No prospects requiring feasibility check
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      All prospects have been processed or are in other steps
                    </Typography>
                  </Box>
                ) : (
                  <TableContainer component={Paper} sx={{ borderRadius: 2, boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }}>
                    <Table>
                      <TableHead>
                        <TableRow sx={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
                          <TableCell sx={{ color: 'white', fontWeight: 600 }}>Enquiry Number</TableCell>
                          <TableCell sx={{ color: 'white', fontWeight: 600 }}>Customer Name</TableCell>
                          <TableCell sx={{ color: 'white', fontWeight: 600 }}>Company</TableCell>
                          <TableCell sx={{ color: 'white', fontWeight: 600 }}>Email</TableCell>
                          <TableCell sx={{ color: 'white', fontWeight: 600 }}>Mobile</TableCell>
                          <TableCell sx={{ color: 'white', fontWeight: 600 }}>Products Interested</TableCell>
                          <TableCell sx={{ color: 'white', fontWeight: 600 }}>Requirement</TableCell>
                          <TableCell sx={{ color: 'white', fontWeight: 600 }}>Priority</TableCell>
                          <TableCell sx={{ color: 'white', fontWeight: 600 }}>Status</TableCell>
                          <TableCell sx={{ color: 'white', fontWeight: 600 }}>Actions</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {leads.map((lead) => (
                          <TableRow 
                            key={lead.LogId}
                            sx={{ 
                              '&:hover': { 
                                backgroundColor: 'rgba(102, 126, 234, 0.04)',
                                cursor: 'pointer'
                              }
                            }}
                          >
                            <TableCell>
                              <Chip 
                                label={lead.LogId} 
                                size="small"
                                sx={{ 
                                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                                  color: 'white',
                                  fontWeight: 600
                                }}
                              />
                            </TableCell>
                            <TableCell>
                              <Box display="flex" alignItems="center" gap={1}>
                                <Person sx={{ fontSize: 16, color: 'text.secondary' }} />
                                {lead.CustomerName || lead.FullName}
                              </Box>
                            </TableCell>
                            <TableCell>
                              <Box display="flex" alignItems="center" gap={1}>
                                <Business sx={{ fontSize: 16, color: 'text.secondary' }} />
                                {lead.CompanyName}
                              </Box>
                            </TableCell>
                            <TableCell>
                              <Box display="flex" alignItems="center" gap={1}>
                                <Email sx={{ fontSize: 16, color: 'text.secondary' }} />
                                {lead.EmailId || lead.Email}
                              </Box>
                            </TableCell>
                            <TableCell>
                              <Box display="flex" alignItems="center" gap={1}>
                                <Phone sx={{ fontSize: 16, color: 'text.secondary' }} />
                                {lead.MobileNumber || lead.PhoneNumber || 'N/A'}
                              </Box>
                            </TableCell>
                            <TableCell>
                              <Box display="flex" flexWrap="wrap" gap={0.5}>
                                {lead.ProductsInterested && (() => {
                                  try {
                                    // First, try to parse as JSON
                                    let productCodes;
                                    if (typeof lead.ProductsInterested === 'string') {
                                      productCodes = JSON.parse(lead.ProductsInterested);
                                    } else {
                                      productCodes = lead.ProductsInterested;
                                    }
                                    
                                    if (Array.isArray(productCodes)) {
                                      return productCodes.slice(0, 2).map((productCode, index) => {
                                        const product = products.find(p => p.value === productCode);
                                        const displayLabel = product ? product.label : productCode;
                                        return (
                                          <Chip 
                                            key={index}
                                            label={displayLabel} 
                                            size="small"
                                            sx={{ 
                                              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                                              color: 'white',
                                              fontSize: '0.7rem'
                                            }}
                                          />
                                        );
                                      });
                                    } else {
                                      // If it's not an array, treat it as a single product code
                                      const product = products.find(p => p.value === lead.ProductsInterested);
                                      const displayLabel = product ? product.label : lead.ProductsInterested;
                                      return (
                                        <Chip 
                                          label={displayLabel} 
                                          size="small"
                                          sx={{ 
                                            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                                            color: 'white',
                                            fontSize: '0.7rem'
                                          }}
                                        />
                                      );
                                    }
                                  } catch (error) {
                                    console.error('Error parsing products in table:', error);
                                    // If JSON parsing fails, try to split by comma or display as is
                                    let productCodes = [];
                                    if (typeof lead.ProductsInterested === 'string') {
                                      // Try to split by comma if it's a string
                                      if (lead.ProductsInterested.includes(',')) {
                                        // Check if it's already an array
        if (Array.isArray(lead.ProductsInterested)) {
          productCodes = lead.ProductsInterested;
        } else if (typeof lead.ProductsInterested === 'string') {
          productCodes = lead.ProductsInterested.split(',').map(p => p.trim());
        } else {
          productCodes = [];
        }
                                      } else {
                                        productCodes = [lead.ProductsInterested];
                                      }
                                    } else {
                                      productCodes = [lead.ProductsInterested];
                                    }
                                    
                                    return productCodes.slice(0, 2).map((productCode, index) => {
                                      const product = products.find(p => p.value === productCode);
                                      const displayLabel = product ? product.label : productCode;
                                      return (
                                        <Chip 
                                          key={index}
                                          label={displayLabel} 
                                          size="small"
                                          sx={{ 
                                            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                                            color: 'white',
                                            fontSize: '0.7rem'
                                          }}
                                        />
                                      );
                                    });
                                  }
                                })()}
                                {lead.ProductsInterested && (() => {
                                  try {
                                    let productCodes;
                                    if (typeof lead.ProductsInterested === 'string') {
                                      productCodes = JSON.parse(lead.ProductsInterested);
                                    } else {
                                      productCodes = lead.ProductsInterested;
                                    }
                                    
                                    if (Array.isArray(productCodes) && productCodes.length > 2) {
                                      return (
                                        <Chip 
                                          label={`+${productCodes.length - 2} more`}
                                          size="small"
                                          sx={{ 
                                            background: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
                                            color: 'white',
                                            fontSize: '0.7rem'
                                          }}
                                        />
                                      );
                                    }
                                  } catch (error) {
                                    return null;
                                  }
                                })()}
                              </Box>
                            </TableCell>
                            <TableCell>
                              <Typography variant="body2" sx={{ maxWidth: 200 }}>
                                {lead.Requirement?.substring(0, 50)}...
                              </Typography>
                            </TableCell>
                            <TableCell>
                              <Chip 
                                label={lead.Priority || 'Medium'} 
                                size="small"
                                color={getPriorityColor(lead.Priority)}
                                sx={{ fontWeight: 600 }}
                              />
                            </TableCell>
                            <TableCell>
                              <Chip 
                                label={lead.Status || 'New'} 
                                size="small"
                                color={getStatusColor(lead.Status)}
                                sx={{ fontWeight: 600 }}
                              />
                            </TableCell>
                            <TableCell>
                              <Box display="flex" gap={1}>
                                <Tooltip title="View Details">
                                  <IconButton
                                    size="small"
                                    onClick={() => handleViewDetails(lead)}
                                    sx={{ 
                                      color: '#667eea',
                                      '&:hover': { backgroundColor: 'rgba(102, 126, 234, 0.1)' }
                                    }}
                                  >
                                    <Visibility />
                                  </IconButton>
                                </Tooltip>
                                <Tooltip title="Send Email">
                                  <IconButton
                                    size="small"
                                    onClick={() => handleSendMail(lead.EmailId || lead.Email)}
                                    sx={{ 
                                      color: '#4caf50',
                                      '&:hover': { backgroundColor: 'rgba(76, 175, 80, 0.1)' }
                                    }}
                                  >
                                    <Send />
                                  </IconButton>
                                </Tooltip>
                                <Tooltip title="Assess Feasibility & Move to Step 5">
                                  <Button
                                    size="small"
                                    variant="contained"
                                    startIcon={<Assessment />}
                                    onClick={() => {
                                      setSelectedLead(lead);
                                      setDetailsDialogOpen(false);
                                      // Scroll to form after a brief delay
                                      setTimeout(() => {
                                        const formSection = document.getElementById('feasibility-form-section');
                                        if (formSection) {
                                          formSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
                                        }
                                      }, 100);
                                    }}
                                    sx={{ 
                                      background: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
                                      color: 'white',
                                      fontSize: '0.75rem',
                                      px: 1.5,
                                      py: 0.5,
                                      '&:hover': {
                                        background: 'linear-gradient(135deg, #fee140 0%, #fa709a 100%)',
                                        transform: 'translateY(-1px)',
                                        boxShadow: '0 4px 12px rgba(250, 112, 154, 0.4)'
                                      }
                                    }}
                                  >
                                    Assess
                                  </Button>
                                </Tooltip>
                              </Box>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                )}
              </CardContent>
            </Card>

            {/* Feasibility Assessment Section */}
            {selectedLead && (
              <Card 
                id="feasibility-form-section"
                sx={{ 
                borderRadius: 3,
                boxShadow: '0 20px 60px rgba(0,0,0,0.1)',
                overflow: 'hidden',
                background: 'white',
                maxWidth: '1400px',
                mx: 'auto'
              }}>
                <CardContent sx={{ p: 4 }}>
                  <Box display="flex" alignItems="center" gap={2} mb={4}>
                    <Avatar sx={{ 
                      width: 48, 
                      height: 48, 
                      background: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
                      boxShadow: '0 4px 16px rgba(67, 233, 123, 0.3)'
                    }}>
                      <CheckCircleOutline sx={{ fontSize: 24 }} />
                    </Avatar>
                    <Box>
                      <Typography variant="h5" sx={{ fontWeight: 700, color: '#2e7d32', mb: 0.5 }}>
                        Feasibility Assessment for {selectedLead.CustomerName || selectedLead.FullName}
                      </Typography>
                      <Typography variant="body1" sx={{ color: 'text.secondary', fontWeight: 400 }}>
                        Conduct technical feasibility review and provide assessment
                      </Typography>
                    </Box>
                  </Box>

                  {/* Show existing requirement if available */}
                  {selectedLead.Requirement && (
                    <Box sx={{ 
                      mb: 3, 
                      p: 2, 
                      backgroundColor: 'rgba(67, 233, 123, 0.1)', 
                      borderRadius: 2,
                      border: '1px solid rgba(67, 233, 123, 0.3)'
                    }}>
                      <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
                        Original Requirement:
                      </Typography>
                      <Typography variant="body2" sx={{ fontStyle: 'italic' }}>
                        {selectedLead.Requirement}
                      </Typography>
                    </Box>
                  )}

                  <Grid container spacing={3}>
                    <Grid item xs={12} md={6}>
                      <Box sx={{ mb: 3 }}>
                        <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mb: 2 }}>
                          Technical Feasibility Status
                        </Typography>
                        <FormControlLabel
                          control={
                            <Switch
                              checked={feasibilityStatus}
                              onChange={(e) => setFeasibilityStatus(e.target.checked)}
                              color="success"
                              sx={{
                                '& .MuiSwitch-switchBase.Mui-checked': {
                                  color: '#4caf50',
                                  '&:hover': {
                                    backgroundColor: 'rgba(76, 175, 80, 0.08)',
                                  },
                                },
                                '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
                                  backgroundColor: '#4caf50',
                                },
                              }}
                            />
                          }
                          label={
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              {feasibilityStatus ? (
                                <>
                                  <ThumbUp sx={{ color: 'success.main' }} />
                                  <Typography sx={{ fontWeight: 600, color: 'success.main' }}>
                                    Feasible
                                  </Typography>
                                </>
                              ) : (
                                <>
                                  <ThumbDown sx={{ color: 'error.main' }} />
                                  <Typography sx={{ fontWeight: 600, color: 'error.main' }}>
                                    Not Feasible
                                  </Typography>
                                </>
                              )}
                            </Box>
                          }
                        />
                      </Box>
                    </Grid>

                    <Grid item xs={12} md={6}>
                      <Box sx={{ mb: 3 }}>
                        <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mb: 2 }}>
                          Assessment Summary
                        </Typography>
                        <Box sx={{ display: 'flex', gap: 1 }}>
                          <Chip 
                            icon={<Info />}
                            label="Technical Review"
                            color="info"
                            size="small"
                            sx={{ fontWeight: 600 }}
                          />
                          <Chip 
                            icon={feasibilityStatus ? <ThumbUp /> : <Warning />}
                            label={feasibilityStatus ? 'Feasible' : 'Not Feasible'}
                            color={getFeasibilityColor(feasibilityStatus)}
                            size="small"
                            sx={{ fontWeight: 600 }}
                          />
                        </Box>
                      </Box>
                    </Grid>

                    <Grid item xs={12}>
                      <TextField
                        fullWidth
                        label="Technical Assessment Notes *"
                        multiline
                        rows={6}
                        value={feasibilityNotes}
                        onChange={(e) => setFeasibilityNotes(e.target.value)}
                        placeholder="Provide detailed technical assessment, feasibility analysis, technical challenges, recommendations, timeline considerations, resource requirements, etc..."
                        InputProps={{
                          startAdornment: (
                            <Notes sx={{ mr: 1, color: 'text.secondary', mt: 1, alignSelf: 'flex-start' }} />
                          )
                        }}
                        sx={{
                          '& .MuiOutlinedInput-root': {
                            borderRadius: 2,
                            '&:hover .MuiOutlinedInput-notchedOutline': {
                              borderColor: '#667eea'
                            },
                            '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                              borderColor: '#667eea',
                              borderWidth: 2
                            }
                          }
                        }}
                      />
                    </Grid>

                    <Grid item xs={12}>
                      <Divider sx={{ my: 3 }} />
                      <Box display="flex" justifyContent="space-between" alignItems="center">
                        <Box display="flex" alignItems="center" gap={2}>
                          <Avatar sx={{ 
                            width: 40, 
                            height: 40, 
                            background: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
                            boxShadow: '0 4px 16px rgba(67, 233, 123, 0.3)'
                          }}>
                            <Schedule sx={{ fontSize: 20 }} />
                          </Avatar>
                          <Typography variant="body2" sx={{ color: 'text.secondary', fontWeight: 500 }}>
                            TAT: 3 days | Next Step: 5
                          </Typography>
                        </Box>
                        
                        <Box display="flex" gap={2}>
                          <Button
                            variant="outlined"
                            onClick={() => {
                              setSelectedLead(null);
                              setFeasibilityStatus(false);
                              setFeasibilityNotes('');
                            }}
                            disabled={loading}
                            sx={{
                              borderRadius: 2,
                              px: 4,
                              py: 1.5,
                              borderColor: '#667eea',
                              color: '#667eea',
                              '&:hover': {
                                borderColor: '#764ba2',
                                backgroundColor: 'rgba(102, 126, 234, 0.04)'
                              }
                            }}
                          >
                            Cancel
                          </Button>
                          <Button
                            onClick={handleSubmit}
                            variant="contained"
                            startIcon={loading ? <CircularProgress size={20} /> : <AutoAwesome />}
                            disabled={loading || !feasibilityNotes.trim()}
                            sx={{
                              background: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
                              color: 'white',
                              fontWeight: 700,
                              px: 5,
                              py: 1.5,
                              borderRadius: 2,
                              boxShadow: '0 8px 32px rgba(250, 112, 154, 0.4)',
                              transition: 'all 0.3s ease',
                              '&:hover': {
                                transform: 'translateY(-2px)',
                                boxShadow: '0 12px 40px rgba(250, 112, 154, 0.6)',
                                background: 'linear-gradient(135deg, #fee140 0%, #fa709a 100%)'
                              }
                            }}
                          >
                            {loading ? 'Processing...' : 'Complete Feasibility Check'}
                          </Button>
                        </Box>
                      </Box>
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>
            )}

            {/* Lead Details Dialog */}
            <Dialog 
              open={detailsDialogOpen} 
              onClose={() => setDetailsDialogOpen(false)}
              maxWidth="md"
              fullWidth
            >
              <DialogTitle sx={{ 
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                color: 'white',
                display: 'flex',
                alignItems: 'center',
                gap: 2
              }}>
                <Person />
                Prospect Details
              </DialogTitle>
              <DialogContent sx={{ pt: 3 }}>
                {selectedLead && (
                  <Grid container spacing={3}>
                    <Grid item xs={12} md={6}>
                      <Typography variant="subtitle2" color="text.secondary">Enquiry Number</Typography>
                      <Typography variant="body1" sx={{ fontWeight: 600, mb: 2 }}>
                        {selectedLead.LogId}
                      </Typography>
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <Typography variant="subtitle2" color="text.secondary">Customer Name</Typography>
                      <Typography variant="body1" sx={{ fontWeight: 600, mb: 2 }}>
                        {selectedLead.CustomerName || selectedLead.FullName}
                      </Typography>
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <Typography variant="subtitle2" color="text.secondary">Company Name</Typography>
                      <Typography variant="body1" sx={{ fontWeight: 600, mb: 2 }}>
                        {selectedLead.CompanyName}
                      </Typography>
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <Typography variant="subtitle2" color="text.secondary">Email</Typography>
                      <Typography variant="body1" sx={{ fontWeight: 600, mb: 2 }}>
                        {selectedLead.EmailId || selectedLead.Email}
                      </Typography>
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <Typography variant="subtitle2" color="text.secondary">Mobile Number</Typography>
                      <Typography variant="body1" sx={{ fontWeight: 600, mb: 2 }}>
                        {selectedLead.MobileNumber || selectedLead.PhoneNumber || 'N/A'}
                      </Typography>
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <Typography variant="subtitle2" color="text.secondary">Customer Location</Typography>
                      <Typography variant="body1" sx={{ fontWeight: 600, mb: 2 }}>
                        {selectedLead.CustomerLocation || 'N/A'}
                      </Typography>
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <Typography variant="subtitle2" color="text.secondary">Customer Type</Typography>
                      <Chip 
                        label={selectedLead.CustomerType || 'N/A'} 
                        sx={{ 
                          background: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
                          color: 'white',
                          fontWeight: 600
                        }}
                      />
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <Typography variant="subtitle2" color="text.secondary">Lead Assigned To</Typography>
                      <Typography variant="body1" sx={{ fontWeight: 600, mb: 2 }}>
                        {selectedLead.LeadAssignedTo || 'N/A'}
                      </Typography>
                    </Grid>
                    <Grid item xs={12}>
                      <Typography variant="subtitle2" color="text.secondary">Products Interested</Typography>
                      <Box display="flex" flexWrap="wrap" gap={1} mt={1}>
                        {selectedLead.ProductsInterested && (() => {
                          try {
                            // First, try to parse as JSON
                            let productCodes;
                            if (typeof selectedLead.ProductsInterested === 'string') {
                              productCodes = JSON.parse(selectedLead.ProductsInterested);
                            } else {
                              productCodes = selectedLead.ProductsInterested;
                            }
                            
                            if (Array.isArray(productCodes)) {
                              return productCodes.map((productCode, index) => {
                                const product = products.find(p => p.value === productCode);
                                const displayLabel = product ? product.label : productCode;
                                
                                return (
                                  <Chip 
                                    key={index}
                                    label={displayLabel} 
                                    size="small"
                                    sx={{ 
                                      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                                      color: 'white'
                                    }}
                                  />
                                );
                              });
                            } else {
                              // If it's not an array, treat it as a single product code
                              const product = products.find(p => p.value === selectedLead.ProductsInterested);
                              const displayLabel = product ? product.label : selectedLead.ProductsInterested;
                              
                              return (
                                <Chip 
                                  label={displayLabel} 
                                  size="small"
                                  sx={{ 
                                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                                    color: 'white'
                                  }}
                                />
                              );
                            }
                          } catch (error) {
                            console.error('Error parsing products in dialog:', error);
                            // If JSON parsing fails, try to split by comma or display as is
                            let productCodes = [];
                            if (typeof selectedLead.ProductsInterested === 'string') {
                              // Try to split by comma if it's a string
                              if (selectedLead.ProductsInterested.includes(',')) {
                                // Check if it's already an array
        if (Array.isArray(selectedLead.ProductsInterested)) {
          productCodes = selectedLead.ProductsInterested;
        } else if (typeof selectedLead.ProductsInterested === 'string') {
          productCodes = selectedLead.ProductsInterested.split(',').map(p => p.trim());
        } else {
          productCodes = [];
        }
                              } else {
                                productCodes = [selectedLead.ProductsInterested];
                              }
                            } else {
                              productCodes = [selectedLead.ProductsInterested];
                            }
                            
                            return productCodes.map((productCode, index) => {
                              const product = products.find(p => p.value === productCode);
                              const displayLabel = product ? product.label : productCode;
                              
                              return (
                                <Chip 
                                  key={index}
                                  label={displayLabel} 
                                  size="small"
                                  sx={{ 
                                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                                    color: 'white'
                                  }}
                                />
                              );
                            });
                          }
                        })()}
                      </Box>
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <Typography variant="subtitle2" color="text.secondary">Priority</Typography>
                      <Chip 
                        label={selectedLead.Priority || 'Medium'} 
                        color={getPriorityColor(selectedLead.Priority || 'Medium')}
                        sx={{ fontWeight: 600 }}
                      />
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <Typography variant="subtitle2" color="text.secondary">Status</Typography>
                      <Chip 
                        label={selectedLead.Status} 
                        color={getStatusColor(selectedLead.Status)}
                        sx={{ fontWeight: 600 }}
                      />
                    </Grid>
                    <Grid item xs={12}>
                      <Typography variant="subtitle2" color="text.secondary">Requirement</Typography>
                      <Typography variant="body1" sx={{ mb: 2, fontStyle: 'italic' }}>
                        {selectedLead.Requirement || 'No requirement specified'}
                      </Typography>
                    </Grid>
                    {selectedLead.Notes && (
                      <Grid item xs={12}>
                        <Typography variant="subtitle2" color="text.secondary">Notes</Typography>
                        <Typography variant="body1" sx={{ mb: 2 }}>
                          {selectedLead.Notes}
                        </Typography>
                      </Grid>
                    )}
                  </Grid>
                )}
              </DialogContent>
              <DialogActions sx={{ p: 3 }}>
                <Button 
                  onClick={() => setDetailsDialogOpen(false)}
                  variant="outlined"
                >
                  Close
                </Button>
                <Button 
                  onClick={() => {
                    setDetailsDialogOpen(false);
                    // Ensure the lead is selected so the form appears
                    if (selectedLead) {
                      // Scroll to the feasibility form section
                      setTimeout(() => {
                        const formSection = document.getElementById('feasibility-form-section');
                        if (formSection) {
                          formSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
                        }
                      }, 100);
                    }
                  }}
                  variant="contained"
                  sx={{
                    background: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
                    color: 'white'
                  }}
                >
                  Proceed with this Prospect
                </Button>
              </DialogActions>
            </Dialog>

            {/* Enhanced Snackbar */}
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

export default CheckFeasibility; 